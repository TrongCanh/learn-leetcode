# Background Jobs — Công Việc Chạy Ngầm

## Câu hỏi mở đầu

```javascript
// User upload 50MB video:
// → Video processing (ffmpeg, 5 phút) đang chạy
// → HTTP request đang "pending"
// → User đợi 5 phút
// → Request timeout sau 30s!
// → User thấy "Upload failed!"

// Hoặc:
// → 10,000 users cùng gửi email
// → Server nhận 10,000 requests
// → 1 CPU core gửi email
// → 10,000 * 1s = 2.7 hours!
// → Server overloaded!

// Câu hỏi: Làm sao xử lý CÔNG VIỆC LỚN mà không block HTTP requests?
```

**Background jobs** = chạy công việc nặng **sau khi** HTTP response đã return. User không đợi. Server không bị block. Job được xử lý bởi workers, queues đợi jobs, retry khi fail. Đây là kiến thức cốt lõi mà mọi backend developer cần.

---

## 1. Job Queue Architecture

### Tổng quan

```
┌──────────────────────────────────────────────────────────────┐
│  BACKGROUND JOB SYSTEM                                          │
│                                                               │
│  WEB SERVER                    │  MESSAGE QUEUE              │
│  ┌─────────────────────┐      │  ┌───────────────────┐  │
│  │ User Request        │      │  │                     │  │
│  │ POST /upload        │ ───→ │  │ job_queue         │  │
│  │                     │      │  │ ┌───┐ ┌───┐ ┌───┐│  │
│  │ save_file()        │      │  │ │job│ │job│ │job││  │
│  │ save_to_queue()    │      │  │ └───┘ └───┘ └───┘│  │
│  │ return 200 OK!     │      │  │                     │  │
│  └─────────────────────┘      │  └───────────────────┘  │
│                                │           ↓                  │
│  BROWSER                      │  ┌───────────────────┐  │
│  ←─── 200 OK (instant!) ──────  │  │ WORKERS           │  │
│                                │  │ ┌───────────────┐ │  │
│  Meanwhile...                  │  │ │ Worker 1       │ │  │
│                                │  │ │ process_video │ │  │
│                                │  │ └───────────────┘ │  │
│                                │  │ ┌───────────────┐ │  │
│                                │  │ │ Worker 2       │ │  │
│                                │  │ │ send_email    │ │  │
│                                │  │ └───────────────┘ │  │
│                                │  └───────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### In-memory queue (simple)

```javascript
// Simple job queue for single-server apps
class JobQueue {
  constructor() {
    this.jobs = [];
    this.processing = new Set();
    this.isProcessing = false;
  }

  async add(job) {
    this.jobs.push({
      id: crypto.randomUUID(),
      name: job.name,
      payload: job.payload,
      attempts: 0,
      createdAt: Date.now(),
      status: 'queued'
    });

    if (!this.isProcessing) {
      this.process();
    }
  }

  async process() {
    this.isProcessing = true;

    while (this.jobs.length > 0) {
      const job = this.jobs.shift();

      try {
        const handler = this.handlers.get(job.name);
        if (!handler) throw new Error(`No handler for: ${job.name}`);

        job.status = 'processing';
        job.attempts++;
        job.startedAt = Date.now();

        await handler(job.payload);

        job.status = 'completed';
        job.completedAt = Date.now();
        console.log(`Job ${job.id} completed`);

      } catch (err) {
        job.status = 'failed';
        job.error = err.message;
        console.error(`Job ${job.id} failed:`, err.message);

        // Retry if under max attempts
        if (job.attempts < 3) {
          console.log(`Retrying job ${job.id}...`);
          this.jobs.push(job);
        }
      }
    }

    this.isProcessing = false;
  }

  register(name, handler) {
    this.handlers.set(name, handler);
  }
}

// Usage:
const queue = new JobQueue();

queue.register('send_welcome_email', async (payload) => {
  await sendEmail(payload.to, payload.subject, payload.body);
});

queue.register('generate_report', async (payload) => {
  const data = await fetchData(payload.reportId);
  await generatePDF(data);
});

// In HTTP handler:
app.post('/register', async (req, res) => {
  const user = await db.users.create(req.body);

  // Add job to queue (instant)
  await queue.add({
    name: 'send_welcome_email',
    payload: { to: user.email, subject: 'Welcome!' }
  });

  res.json({ success: true, user }); // Instant response!
});
```

---

## 2. Redis-based Queue

### Persistent, distributed queue

```javascript
// Redis List = simple distributed queue
// LPUSH → job in, BRPOP → job out (blocking)

class RedisQueue {
  constructor(redis, queueName = 'jobs') {
    this.redis = redis;
    this.queueName = queueName;
  }

  // Add job to queue
  async enqueue(job) {
    const jobData = JSON.stringify({
      id: crypto.randomUUID(),
      name: job.name,
      payload: job.payload,
      attempts: 0,
      createdAt: Date.now()
    });

    await this.redis.lPush(this.queueName, jobData);
    return jobData;
  }

  // Get next job (blocking)
  async dequeue(timeout = 0) {
    const result = await this.redis.brPop(this.queueName, timeout);

    if (!result) return null;

    return JSON.parse(result.element);
  }

  // Retry: push back to queue
  async retry(job, delayMs = 0) {
    if (delayMs > 0) {
      // Delayed retry: use sorted set
      const score = Date.now() + delayMs;
      await this.redis.zAdd(`${this.queueName}:delayed`, {
        score,
        value: JSON.stringify({ ...job, attempts: job.attempts + 1 })
      });
    } else {
      // Immediate retry
      await this.redis.lPush(this.queueName, JSON.stringify(job));
    }
  }
}

// Worker loop
async function startWorker(queue, handlers) {
  console.log('Worker started...');

  while (true) {
    const job = await queue.dequeue(5); // Block up to 5 seconds

    if (!job) continue; // Timeout, no jobs

    try {
      const handler = handlers.get(job.name);
      if (!handler) throw new Error(`No handler: ${job.name}`);

      console.log(`Processing job: ${job.id} (${job.name})`);
      await handler(job.payload);

      console.log(`Job ${job.id} completed`);

    } catch (err) {
      console.error(`Job ${job.id} failed:`, err.message);

      if (job.attempts < 3) {
        console.log(`Retrying job ${job.id} (attempt ${job.attempts + 1})...`);
        await queue.retry(job, 5000); // Retry after 5s
      } else {
        console.error(`Job ${job.id} permanently failed after ${job.attempts} attempts`);
        await this.moveToDeadLetter(job, err);
      }
    }
  }
}

// Usage:
const redis = new Redis();
const queue = new RedisQueue(redis, 'video-processing');

const handlers = new Map();
handlers.set('process_video', async (payload) => {
  const { filePath, userId } = payload;
  await ffmpeg.transcode(filePath, `${filePath}.mp4`);
  await db.videos.update({ status: 'processed' });
  await queue.enqueue({ name: 'notify_user', payload: { userId } });
});

handlers.set('notify_user', async (payload) => {
  await sendPushNotification(payload.userId, 'Video processed!');
});

// Start worker:
startWorker(queue, handlers);
```

---

## 3. Priority Queues và Job Types

### Job priority

```javascript
// Priority queues using Redis sorted sets
class PriorityQueue extends RedisQueue {
  async enqueue(job, priority = 0) {
    // Higher score = higher priority = processed first
    const score = Date.now() + (100 - priority) * 1000000;

    await this.redis.zAdd(`${this.queueName}:priority`, {
      score,
      value: JSON.stringify({
        id: crypto.randomUUID(),
        name: job.name,
        payload: job.payload,
        priority,
        attempts: 0,
        createdAt: Date.now()
      })
    });
  }

  async dequeue(timeout = 0) {
    // BRPOPLPUSH: pop from priority queue, push to processing
    const result = await this.redis.bRPopLPush(
      `${this.queueName}:priority`,
      `${this.queueName}:processing`,
      timeout
    );

    if (!result) return null;

    return JSON.parse(result);
  }
}

// Job types and handling
const JOB_TYPES = {
  CRITICAL: { priority: 100, retry: 10, timeout: 30000 },
  HIGH: { priority: 80, retry: 5, timeout: 60000 },
  NORMAL: { priority: 50, retry: 3, timeout: 300000 },
  LOW: { priority: 20, retry: 1, timeout: 600000 },
  BATCH: { priority: 0, retry: 0, timeout: 3600000 }
};

async function enqueueJob(name, payload, type = 'NORMAL') {
  const config = JOB_TYPES[type];
  await queue.enqueue({ name, payload }, config.priority);
}

// Usage:
await enqueueJob('payment_process', orderData, 'CRITICAL');
await enqueueJob('send_newsletter', emailData, 'LOW');
await enqueueJob('generate_analytics', reportConfig, 'BATCH');
```

### Scheduled jobs (cron-like)

```javascript
// Schedule recurring jobs
class JobScheduler {
  constructor(queue) {
    this.queue = queue;
    this.schedules = new Map();
  }

  // Schedule: run every X milliseconds
  schedule(name, handler, intervalMs) {
    const schedule = {
      name,
      handler,
      intervalMs,
      lastRun: null,
      nextRun: Date.now()
    };

    this.schedules.set(name, schedule);
    console.log(`Scheduled ${name} every ${intervalMs}ms`);
  }

  // Run scheduler loop
  async start() {
    setInterval(async () => {
      const now = Date.now();

      for (const [name, schedule] of this.schedules) {
        if (now >= schedule.nextRun) {
          await this.queue.enqueue({
            name: `scheduled:${name}`,
            payload: { lastRun: schedule.lastRun }
          });

          schedule.lastRun = now;
          schedule.nextRun = now + schedule.intervalMs;
        }
      }
    }, 1000);
  }
}

// Usage:
scheduler.schedule('cleanup_expired_tokens', async () => {
  const count = await db.tokens.delete({ expiresAt: { $lt: Date.now() } });
  console.log(`Cleaned up ${count} expired tokens`);
}, 60 * 60 * 1000); // Every hour

scheduler.schedule('send_digest_emails', async () => {
  const users = await db.users.find({ digestSubscribed: true });
  for (const user of users) {
    await queue.enqueue('send_digest', { userId: user.id }, 20); // Low priority
  }
}, 24 * 60 * 60 * 1000); // Every day
```

---

## 4. Job Processing Patterns

### Batch processing

```javascript
// Batch: collect items → process as group
class BatchProcessor {
  constructor(queue, batchSize = 100, windowMs = 5000) {
    this.queue = queue;
    this.batchSize = batchSize;
    this.windowMs = windowMs;
    this.buffer = [];
    this.timers = new Map();
  }

  async add(name, payload) {
    const key = `${name}:${JSON.stringify(payload).length}`;
    if (!this.buffer[key]) this.buffer[key] = [];
    this.buffer[key].push(payload);

    // Process if batch full
    if (this.buffer[key].length >= this.batchSize) {
      await this.processBatch(name, key);
    } else if (!this.timers.has(key)) {
      // Set timeout to process partial batch
      this.timers.set(key, setTimeout(() => {
        this.processBatch(name, key);
      }, this.windowMs));
    }
  }

  async processBatch(name, key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }

    const items = this.buffer[key];
    delete this.buffer[key];

    if (items.length === 0) return;

    await this.queue.enqueue({
      name: `batch:${name}`,
      payload: { items }
    });
  }
}

// Example: batch email sending
batchProcessor.add('send_email', {
  to: user.email,
  subject: 'Notification',
  body: 'You have a new message!'
});

// Instead of 100 separate jobs = 100 network calls
// → 1 batched job = 1 bulk API call
```

### Idempotent jobs

```javascript
// Idempotent = chạy nhiều lần = same result
// Critical để retry safely!

// ❌ NOT idempotent:
async function sendEmail(payload) {
  await emailService.send(payload.to, payload.subject);
  // Retry → DUPLICATE email sent!

  // → Must track sent status
}

// ✅ Idempotent:
async function sendEmail(payload) {
  // Check if already sent
  const existing = await db.sentEmails.findOne({
    messageId: payload.messageId
  });
  if (existing) {
    console.log('Email already sent, skipping');
    return;
  }

  await emailService.send(payload.to, payload.subject);

  // Record as sent
  await db.sentEmails.create({
    messageId: payload.messageId,
    sentAt: Date.now()
  });
}

// Retry = safe, no duplicates!

// ✅ Another approach: distributed lock
async function processWithLock(job) {
  const lockKey = `lock:${job.name}:${job.payload.id}`;

  // Acquire lock (5 min expiry)
  const acquired = await redis.set(lockKey, workerId, {
    NX: true, // Only if not exists
    EX: 300
  });

  if (!acquired) {
    console.log('Another worker processing, skipping');
    return;
  }

  try {
    await this.process(job);
  } finally {
    // Release lock
    await redis.del(lockKey);
  }
}
```

---

## 5. Dead Letter Queue

### Handling failed jobs

```javascript
class DeadLetterQueue {
  constructor(redis) {
    this.dlqKey = 'jobs:dead_letter';
    this.maxRetries = 3;
    this.redis = redis;
  }

  async move(job, error) {
    const record = {
      job,
      error: {
        message: error.message,
        stack: error.stack
      },
      failedAt: Date.now(),
      originalQueue: job.queue || 'default'
    };

    await this.redis.lPush(this.dlqKey, JSON.stringify(record));

    console.log(`Job ${job.id} moved to DLQ:`, error.message);
  }

  async getAll(limit = 100) {
    const items = await this.redis.lRange(this.dlqKey, 0, limit - 1);
    return items.map(i => JSON.parse(i));
  }

  async retry(job) {
    await this.redis.lRem(this.dlqKey, 1, JSON.stringify(job));
    await this.redis.lPush('jobs', JSON.stringify(job.job));
    console.log(`Job ${job.job.id} requeued from DLQ`);
  }

  async getStats() {
    const count = await this.redis.lLen(this.dlqKey);
    const oldest = await this.redis.lRange(this.dlqKey, -1, -1);

    return {
      count,
      oldest: oldest.length ? JSON.parse(oldest[0]).failedAt : null
    };
  }
}

// Admin endpoint for DLQ management
app.get('/admin/dlq', async (req, res) => {
  const stats = await dlq.getStats();
  const jobs = await dlq.getAll(20);
  res.json({ stats, jobs });
});

app.post('/admin/dlq/:id/retry', async (req, res) => {
  const { id } = req.params;
  const jobs = await dlq.getAll(1000);
  const job = jobs.find(j => j.job.id === id);

  if (!job) return res.status(404).json({ error: 'Job not found' });

  await dlq.retry(job);
  res.json({ success: true });
});
```

---

## 6. Worker Scaling

### Multiple workers

```
┌──────────────────────────────────────────────────────────────┐
│  WORKER SCALING                                                │
│                                                               │
│  Single worker:                                               │
│  jobs ────→ [Worker] ────→ process                           │
│                                                               │
│  Multiple workers (same queue):                                │
│  jobs ────→ [Worker 1]                                       │
│          ├──→ [Worker 2]  ← Jobs distributed                 │
│          └──→ [Worker 3]  ← Parallel processing              │
│                                                               │
│  ⚠️ Redis BRPOP: automatic load balancing                  │
│  → First worker to call BRPOP gets the job                  │
│                                                               │
│  Worker scaling:                                             │
│  ├── Manual: run multiple worker processes                  │
│  ├── Kubernetes: HPA based on queue depth                   │
│  └── Cloud: auto-scaling based on job backlog             │
└──────────────────────────────────────────────────────────────┘
```

```javascript
// Worker pool manager
class WorkerPool {
  constructor(queue, handlers, numWorkers = 4) {
    this.queue = queue;
    this.handlers = handlers;
    this.numWorkers = numWorkers;
    this.workers = [];
    this.isRunning = false;
  }

  async start() {
    this.isRunning = true;

    for (let i = 0; i < this.numWorkers; i++) {
      const workerId = `worker-${i}`;

      this.workers.push(this.startWorker(workerId));
      console.log(`Started ${workerId}`);
    }
  }

  async startWorker(workerId) {
    return (async () => {
      while (this.isRunning) {
        try {
          const job = await this.queue.dequeue(5);

          if (!job) continue;

          console.log(`${workerId} processing ${job.id}`);

          const handler = this.handlers.get(job.name);
          if (!handler) {
            throw new Error(`No handler for: ${job.name}`);
          }

          await handler(job.payload, { workerId, jobId: job.id });

          console.log(`${workerId} completed ${job.id}`);

        } catch (err) {
          console.error(`${workerId} error:`, err.message);
        }
      }
    })();
  }

  async stop() {
    this.isRunning = false;
    await Promise.all(this.workers);
    this.workers = [];
  }

  getStats() {
    return {
      numWorkers: this.numWorkers,
      isRunning: this.isRunning,
      workers: this.workers.map(w => w.id)
    };
  }
}
```

---

## 7. Monitoring và Observability

### Job metrics

```javascript
// Job metrics collection
class JobMetrics {
  constructor(redis) {
    this.redis = redis;
    this.prefix = 'metrics:jobs';
  }

  async record(jobName, status, durationMs) {
    const now = Date.now();
    const day = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const pipeline = this.redis.pipeline();

    // Increment count
    pipeline.hIncrBy(`${this.prefix}:${day}:${jobName}`, status, 1);

    // Update timing
    pipeline.hIncrByFloat(`${this.prefix}:${day}:${jobName}`, `${status}:total_ms`, durationMs);

    // Update timestamp
    pipeline.hSet(`${this.prefix}:${day}:${jobName}`, `${status}:last`, now);

    await pipeline.exec();
  }

  async getStats(jobName, date = new Date().toISOString().split('T')[0]) {
    const key = `${this.prefix}:${date}:${jobName}`;
    const stats = await this.redis.hGetAll(key);

    return {
      completed: parseInt(stats.completed || 0),
      failed: parseInt(stats.failed || 0),
      totalDuration: parseFloat(stats['completed:total_ms'] || 0),
      avgDuration: parseInt(stats['completed:total_ms'] || 0) / parseInt(stats.completed || 1),
      lastCompleted: parseInt(stats['completed:last'] || 0),
      lastFailed: parseInt(stats['failed:last'] || 0)
    };
  }

  async getDashboard(date = new Date().toISOString().split('T')[0]) {
    const keys = await this.redis.keys(`${this.prefix}:${date}:*`);

    const dashboard = {};
    for (const key of keys) {
      const jobName = key.split(':').pop();
      dashboard[jobName] = await this.getStats(jobName, date);
    }

    return dashboard;
  }
}

// Metrics middleware in worker
async function processWithMetrics(job, handler) {
  const start = Date.now();
  let status = 'completed';

  try {
    await handler(job.payload);
  } catch (err) {
    status = 'failed';
    throw err;
  } finally {
    const duration = Date.now() - start;
    await metrics.record(job.name, status, duration);
  }
}
```

---

## 8. Các Traps Phổ Biến

### Trap 1: Jobs block HTTP requests

```javascript
// ❌ Heavy work in HTTP handler = timeout
app.post('/upload', async (req, res) => {
  const file = await saveFile(req.body);
  await processVideo(file.path); // 5 minutes!
  await generateThumbnail(file.path); // 30 seconds!
  res.json({ success: true }); // User waited 5.5 minutes!
});

// ✅ Immediate response, queue job
app.post('/upload', async (req, res) => {
  const file = await saveFile(req.body);
  await queue.enqueue({
    name: 'process_video',
    payload: { fileId: file.id }
  });
  res.json({ success: true, fileId: file.id }); // Instant!
});
```

### Trap 2: No retry = lost jobs

```javascript
// ❌ No retry: one failure = permanent failure
async function processJob(job) {
  await externalAPI.call(); // Maybe network timeout
  // Job permanently lost!

// ✅ With retry
async function processJob(job, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await externalAPI.call();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.log(`Retry ${attempt}/${maxRetries}...`);
      await sleep(1000 * attempt); // Exponential backoff
    }
  }
}
```

### Trap 3: Poison messages (always failing jobs)

```javascript
// ❌ Infinite retry loop
while (true) {
  try {
    await process(job);
    break;
  } catch (err) {
    await sleep(1000);
    // → Jobs never leaves queue!
  }
}

// ✅ Dead letter queue after max retries
if (job.attempts >= 3) {
  await dlq.move(job, err);
}
```

---

## 9. Câu Hỏi Phỏng Vấn

### Câu 1: Message queue vs Task queue?

| | Message Queue | Task Queue |
|--|--------------|-----------|
| Delivery | At-least-once, fire-and-forget | At-least-once, with ack |
| Ordering | Usually FIFO | Usually priority + FIFO |
| Use case | Event streams, async events | Background jobs, scheduled tasks |
| Examples | Kafka, RabbitMQ, Redis Streams | Bull, Celery, Sidekiq |
| Persistence | Usually persistent | Usually persistent |

---

### Câu 2: Job retry strategies?

**Trả lời:** (1) **Immediate retry** — retry ngay, OK cho transient errors. (2) **Fixed delay** — retry sau N seconds. (3) **Exponential backoff** — 1s → 2s → 4s → 8s, tránh overwhelming system. (4) **Jitter** — thêm random delay để tránh thundering herd. (5) **Dead letter queue** — sau N retries → move to DLQ.

---

### Câu 3: How to ensure job is processed exactly once?

**Trả lời:** Exactly-once = 2PC (two-phase commit) = complex. Instead, achieve **at-least-once** + **idempotency**: (1) Use database transaction with job state. (2) Check if job already processed before executing. (3) Use distributed lock. (4) Use Redis BRPOPLPUSH → job in "processing" list → delete only after successful completion.

---

### Câu 4: Scaling workers?

**Trả lời:** Scale workers based on: (1) **Queue depth** — more jobs = more workers. (2) **CPU/memory** — saturate worker capacity. (3) **Job age** — old jobs = scale up. Auto-scaling: cloud provider (AWS Lambda, K8s HPA) monitors queue depth → scales workers up/down. Multiple workers can process same queue simultaneously — Redis BRPOP is atomic.

---

## 10. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  BACKGROUND JOBS                                               │
│                                                               │
│  QUEUE SYSTEM                                                │
│  ├── In-memory: simple, single process                      │
│  ├── Redis List: distributed, persistent                   │
│  └── Priority queues: sorted sets                          │
│                                                               │
│  JOB PROCESSING                                              │
│  ├── Worker loop: dequeue → process → ack               │
│  ├── Retry: fixed delay, exponential backoff, jitter     │
│  ├── Dead Letter Queue: failed jobs for inspection        │
│  └── Idempotency: safe retry, no duplicates             │
│                                                               │
│  JOB TYPES                                                  │
│  ├── Critical: instant processing, high priority         │
│  ├── Batch: collect → process together                   │
│  ├── Scheduled: cron-like, periodic tasks              │
│  └── Priority: high-priority jobs processed first       │
│                                                               │
│  MONITORING                                                 │
│  ├── Queue depth, job duration, failure rate           │
│  ├── Worker utilization                                 │
│  └── Alerting on DLQ growth                            │
│                                                               │
│  ⚠️ Never do heavy work in HTTP handler              │
│  ⚠️ Always implement retry + DLQ                     │
│  ⚠️ Make jobs idempotent for safe retry             │
│  ⚠️ Monitor: queue depth = scaling signal          │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Implement được simple job queue
- [ ] Biết dùng Redis cho distributed queue
- [ ] Implement được retry với exponential backoff
- [ ] Setup được Dead Letter Queue
- [ ] Biết cách scale workers
- [ ] Trả lời được 3/4 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
