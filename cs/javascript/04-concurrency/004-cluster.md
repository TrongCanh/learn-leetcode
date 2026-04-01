# Cluster — Scale Node.js App Qua Nhiều Cores

## Câu hỏi mở đầu

```javascript
// Node.js chạy single-threaded
// Server có 8 cores nhưng chỉ dùng 1 core!
// → 7 cores KHÔNG LÀM GÌ!

// CPU-bound request: 1 request = 1 core 100%
// → 8 requests đồng thời = 8 requests xếp hàng!

// Giải pháp: Cluster
// → 8 workers = 8 processes = dùng 8 cores!
// → Tất cả cores đều làm việc

const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork(); // tạo worker process
  }
}
```

**Cluster = chạy nhiều Node.js processes để tận dụng multi-core CPU.** Mỗi worker là một process riêng với memory riêng. Khác với Worker Threads (chạy trên cùng process), Cluster dùng child processes — an toàn hơn khi một worker crash.

---

## 1. Cluster Cơ Bản

### Kiến trúc Master-Worker

```
┌─────────────────────────────────────────────────────────────┐
│  MASTER PROCESS                                                 │
│  PID: 1234                                                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Manage workers: fork(), kill(), IPC                  │  │
│  │  Load balancing: distribute connections              │  │
│  │  Health monitoring: restart crashed workers          │  │
│  │  Workers map: { id: Worker, id: Worker, ... }       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
        │ fork()          │ fork()           │ fork()
        ▼                 ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  WORKER 1     │  │  WORKER 2     │  │  WORKER N     │
│  PID: 1235     │  │  PID: 1236     │  │  PID: 1237     │
│  HTTP Server   │  │  HTTP Server   │  │  HTTP Server   │
│  Port 3000     │  │  Port 3000    │  │  Port 3000    │
│  1 Core        │  │  1 Core        │  │  1 Core        │
│  Memory: 100MB │  │  Memory: 100MB│  │  Memory: 100MB │
└───────────────┘  └───────────────┘  └───────────────┘
```

### Basic Cluster Implementation

```javascript
// cluster-basic.js
const cluster = require('cluster');
const http = require('http');
const os = require('os');

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  console.log(`CPU cores: ${os.cpus().length}`);

  // Fork workers — mỗi worker = 1 CPU core
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Listen for worker exit → restart
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    cluster.fork();
  });

  // Listen for worker online
  cluster.on('online', (worker) => {
    console.log(`Worker ${worker.process.pid} is online`);
  });

} else {
  // Worker processes — mỗi process chạy HTTP server
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`Handled by worker ${process.pid}\n`);
  }).listen(3000);

  console.log(`Worker ${process.pid} started`);
}
```

### Worker Object API

```javascript
// Worker management từ master
cluster.on('exit', (worker, code, signal) => {
  // worker: Worker object
  console.log(worker.id);          // Worker ID (1, 2, 3...)
  console.log(worker.process.pid); // Process ID
  console.log(worker.exitedAfterDisconnect); // true nếu killed bằng disconnect()
  console.log(worker.isDead());     // true nếu process đã exit
  console.log(worker.isConnected()); // true nếu IPC connected
});
```

```javascript
// Gửi message đến worker
const worker = cluster.workers[1];
worker.send({ type: 'config', data: { debug: true } });

// Worker nhận:
process.on('message', (msg) => {
  if (msg.type === 'config') {
    configureApp(msg.data);
  }
});

// Disconnect worker (graceful)
worker.disconnect(); // Worker tiếp tục xử lý current requests, không nhận new requests

// Force kill worker
worker.kill('SIGTERM'); // Không graceful
```

---

## 2. Load Balancing

### Round-Robin (Mặc định)

```javascript
// Linux/macOS: round-robin (mặc định)
// Mỗi incoming connection được distribute đến worker khác nhau lần lượt

// Connection 1 → Worker 1
// Connection 2 → Worker 2
// Connection 3 → Worker 3
// Connection 4 → Worker 1
// Connection 5 → Worker 2
// ...

// Trong worker:
http.createServer((req, res) => {
  res.end(`Worker ${process.pid}`);
}).listen(3000, '0.0.0.0');
// ⚠️ Tất cả workers gọi listen() cùng port!
// OS kernel load balances connections
```

### Scheduling Policies

```javascript
// Scheduling policy — Linux only
const cluster = require('cluster');

// Default: round-robin
cluster.schedulingPolicy = cluster.SCHED_RR;

// Aggressive: OS quyết định (ưu tiên busy workers)
// Có thể tốt hơn cho long-lived connections
cluster.schedulingPolicy = cluster.SCHED_NONE;

// ⚠️ Chỉ hoạt động trên Linux
// macOS/Windows: chỉ có SCHED_RR
```

### Connection Handling — keepAlive

```javascript
// keepAlive: worker disconnect nhưng không exit
// Giữ connection alive khi graceful restart

if (cluster.isWorker) {
  // Khi master gửi disconnect:
  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      server.close(() => {
        console.log(`Worker ${process.pid}: server closed`);
        process.disconnect();
      });
    }
  });
}
```

---

## 3. IPC — Giao Tiếp Giữa Master và Workers

### Gửi Message

```javascript
// Master → Worker
if (cluster.isMaster) {
  Object.values(cluster.workers).forEach(worker => {
    worker.send({ type: 'stats', uptime: process.uptime() });
  });

  // Hoặc gửi đến worker cụ thể
  const worker1 = cluster.workers[1];
  worker1.send({ type: 'debug', enabled: true });
}

// Worker → Master
if (cluster.isWorker) {
  process.send({ type: 'ready', pid: process.pid, memory: process.memoryUsage() });
}
```

### Master Message Handler

```javascript
// Master — nhận messages từ tất cả workers
cluster.on('message', (worker, message, handle) => {
  console.log(`Message from worker ${worker.id}:`, message);

  switch (message.type) {
    case 'stats':
      console.log(`Worker ${worker.id} stats:`, message.data);
      break;

    case 'error':
      console.error(`Worker ${worker.id} error:`, message.error);
      break;

    case 'ready':
      console.log(`Worker ${worker.id} (PID: ${worker.process.pid}) ready`);
      break;

    case 'metrics':
      updateDashboard(message.metrics);
      break;
  }
});
```

### Worker Message Handler

```javascript
// Worker — nhận messages từ master
process.on('message', (msg) => {
  switch (msg.type) {
    case 'config':
      applyConfig(msg.data);
      process.send({ type: 'config_applied', id: msg.id });
      break;

    case 'shutdown':
      gracefulShutdown();
      break;

    case 'debug':
      if (msg.enabled) {
        enableDebugMode();
      } else {
        disableDebugMode();
      }
      break;
  }
});
```

### Broadcasting — Gửi Đến Tất Cả Workers

```javascript
function broadcast(message) {
  Object.values(cluster.workers).forEach(worker => {
    worker.send(message);
  });
}

// Broadcast config reload
function reloadConfig() {
  const newConfig = loadConfig();
  broadcast({ type: 'config_reload', config: newConfig });
  console.log('Config reloaded and broadcasted to all workers');
}
```

---

## 4. Zero-Downtime Deployments

### Graceful Shutdown & Restart

```javascript
// graceful-restart.js
const cluster = require('cluster');
const http = require('http');

let server;

if (cluster.isMaster) {
  const numCPUs = require('os').cpus().length;

  // Start initial workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Helper: restart all workers
  function restartWorkers() {
    const workers = Object.values(cluster.workers);

    let restarted = 0;
    workers.forEach((worker, index) => {
      console.log(`Restarting worker ${worker.id}`);

      // Disconnect worker (graceful)
      worker.on('disconnect', () => {
        if (!worker.exitedAfterDisconnect) return;

        // Fork new worker
        const newWorker = cluster.fork();
        newWorker.on('online', () => {
          console.log(`New worker ${newWorker.id} online`);
          restarted++;
          if (restarted === workers.length) {
            console.log('All workers restarted');
          }
        });
      });

      worker.disconnect();
    });
  }

  // Handle SIGUSR2 (graceful restart signal)
  process.on('SIGUSR2', () => {
    console.log('Received SIGUSR2, restarting workers...');
    restartWorkers();
  });

  cluster.on('exit', (worker, code, signal) => {
    // Chỉ restart nếu không phải intentional disconnect
    if (!worker.exitedAfterDisconnect) {
      console.log(`Worker died unexpectedly, forking new...`);
      cluster.fork();
    }
  });

} else {
  // Worker code
  server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`Handled by ${process.pid}`);
  });

  server.listen(3000, () => {
    console.log(`Worker ${process.pid} listening on port 3000`);
  });

  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      console.log(`Worker ${process.pid} shutting down...`);
      server.close(() => {
        console.log(`Worker ${process.pid} closed`);
        process.exit(0);
      });
    }
  });
}
```

### Rolling Restart — Không Downtime

```javascript
// rolling-restart.js
async function rollingRestart() {
  const workers = Object.values(cluster.workers);
  const numCPUs = require('os').cpus().length;

  for (const worker of workers) {
    console.log(`Restarting worker ${worker.id}...`);

    // Fork replacement trước khi kill
    const newWorker = cluster.fork();

    // Đợi new worker online
    await new Promise((resolve) => {
      newWorker.on('online', resolve);
    });

    // Kill old worker
    worker.on('disconnect', () => {
      if (!worker.exitedAfterDisconnect) return;
      console.log(`Old worker ${worker.id} disconnected`);
    });

    worker.disconnect();

    // Đợi disconnect hoàn tất
    await new Promise((resolve) => {
      worker.on('disconnect', resolve);
    });
  }

  console.log('Rolling restart complete');
}
```

### Health Checks — Tự Động Restart Crashed Workers

```javascript
// health-check.js
const cluster = require('cluster');
const http = require('http');

const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const MAX_RESTARTS = 5;
const RESTART_WINDOW = 60000; // 1 minute

if (cluster.isMaster) {
  const restartCounts = new Map();
  const numCPUs = require('os').cpus().length;

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Monitor worker health
  setInterval(() => {
    Object.values(cluster.workers).forEach(worker => {
      // Gửi health check
      const sent = worker.send({ type: 'health_check' });

      if (!sent) {
        console.log(`Worker ${worker.id}: health check not sent`);
      }
    });
  }, HEALTH_CHECK_INTERVAL);

  cluster.on('message', (worker, message) => {
    if (message.type === 'health_check_ok') {
      // Worker healthy, reset restart count
      restartCounts.set(worker.id, 0);
    }
  });

  cluster.on('exit', (worker, code, signal) => {
    // Track restart frequency
    const count = (restartCounts.get(worker.id) || 0) + 1;
    restartCounts.set(worker.id, count);

    console.log(`Worker ${worker.id} died (code: ${code}, signal: ${signal})`);
    console.log(`Restart count: ${count} in last ${RESTART_WINDOW / 1000}s`);

    // Prevent restart loop
    if (count > MAX_RESTARTS) {
      console.error(`Worker ${worker.id} restarting too frequently! Exiting...`);
      process.exit(1);
    }

    cluster.fork();
  });
}
```

---

## 5. PM2 — Production Cluster Manager

### PM2 Cơ Bản

```bash
# Cài đặt
npm install -g pm2

# Chạy app với 4 workers
pm2 start app.js -i 4

# Chạy với max cores
pm2 start app.js -i max

# Auto-restart khi crash
pm2 monit           # Monitor real-time
pm2 logs            # Xem logs
pm2 status          # Trạng thái processes
pm2 restart all     # Restart tất cả
pm2 reload all      # Graceful reload
pm2 stop all        # Stop tất cả
```

### Ecosystem Config

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'api-server',
    script: 'server.js',
    instances: 'max',          // Số instances: number hoặc 'max'
    exec_mode: 'cluster',      // 'cluster' hoặc 'fork'
    cwd: './',
    max_memory_restart: '1G',  // Restart khi memory > 1GB
    env_production: {
      NODE_ENV: 'production'
    },
    env_development: {
      NODE_ENV: 'development'
    },

    // Error handling
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',

    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,
    shutdown_with_message: true
  }]
};
```

```bash
# Chạy với ecosystem config
pm2 start ecosystem.config.js

# Với environment cụ thể
NODE_ENV=production pm2 start ecosystem.config.js --env production
```

### PM2 Cluster — Nâng Cao

```javascript
// cluster-advanced.js — code tương thích PM2
const cluster = require('cluster');
const http = require('http');

function startServer() {
  const server = http.createServer((req, res) => {
    // Request handling
    res.writeHead(200);
    res.end(`Worker ${process.pid} at ${new Date().toISOString()}`);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Worker ${process.pid} listening on port ${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM' || 'SIGINT', () => {
    console.log(`Worker ${process.pid} received shutdown signal`);
    server.close(() => {
      console.log(`Worker ${process.pid} closed`);
      process.exit(0);
    });
  });
}

// PM2 cluster mode: cluster.isMaster không hoạt động đúng
// Thay bằng:
if (cluster.isMaster) {
  // Chỉ chạy ở master process
  console.log(`Master ${process.pid} initializing cluster...`);
  // PM2 tự quản lý workers
} else {
  // Worker processes
  startServer();
}
```

### PM2 Plus — Monitoring Cloud

```bash
# Connect PM2 to PM2 Plus (cloud monitoring)
pm2 link <secret-key> <public-key>

# Hoặc dùng PM2 Dashboard
pm2 plus

# Features:
# - Real-time metrics (CPU, memory, HTTP)
# - Exception tracking
# - Memory leak detection
# - Custom metrics dashboard
# - Alert notifications
```

---

## 6. Sticky Sessions — Session Affinity

### Vấn đề

```javascript
// Round-robin: mỗi request có thể đến worker khác
// → Session data ở Worker A không có ở Worker B!

// Giải pháp 1: Sticky sessions — requests cùng session đến cùng worker
// Giải pháp 2: External session store (Redis)
```

### Sticky Sessions Với Redis

```javascript
// sticky-session.js
const cluster = require('cluster');
const http = require('http');
const redis = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

// Redis client cho session (shared giữa workers)
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

// Trong worker:
if (cluster.isWorker) {
  // Kết nối Redis riêng cho mỗi worker
  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();

  await Promise.all([
    pubClient.connect(),
    subClient.connect()
  ]);

  const server = http.createServer((req, res) => {
    // Session từ Redis — worker nào cũng đọc được
    const sessionId = req.headers['cookie']?.split(';')
      .find(c => c.trim().startsWith('session='));

    redisClient.get(`session:${sessionId}`, (err, session) => {
      res.writeHead(200);
      res.end(`Worker ${process.pid}, Session: ${session}`);
    });
  });

  server.listen(3000);
}
```

### Sticky Sessions Với Cookie

```javascript
// sticky-cookie.js — dùng cookie để route đến đúng worker

const http = require('http');
const cluster = require('cluster');

if (cluster.isMaster) {
  const numCPUs = require('os').cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // Mỗi worker có worker ID
  const workerId = cluster.worker.id;

  const server = http.createServer((req, res) => {
    // Đọc hoặc tạo worker cookie
    let workerCookie = req.headers.cookie
      ?.split(';')
      .find(c => c.trim().startsWith('worker='));

    if (workerCookie) {
      const assignedWorkerId = parseInt(workerCookie.split('=')[1]);

      // Route đến đúng worker
      if (assignedWorkerId !== workerId) {
        // Redirect đến worker đúng
        res.writeHead(302, {
          'Location': `/?worker=${assignedWorkerId}`
        });
        res.end();
        return;
      }
    } else {
      // Tạo worker cookie mới
      res.writeHead(302, {
        'Location': `/?worker=${workerId}`,
        'Set-Cookie': `worker=${workerId}; Path=/; HttpOnly`
      });
      res.end();
      return;
    }

    res.writeHead(200);
    res.end(`Handled by worker ${workerId}`);
  });

  server.listen(3000);
}
```

---

## 7. Các Traps Phổ Biến

### Trap 1: Shared State Giữa Workers

```javascript
// ❌ Global variables KHÔNG shared giữa workers!
let counter = 0;
let cache = {};

if (cluster.isMaster) {
  // Master process: counter = 0
  counter++;
} else {
  // Worker process: counter = 0 (KHÁC!)
  counter++; // Mỗi worker có counter riêng!
}

// ✅ Dùng Redis hoặc external store
const redis = require('redis').createClient();
redis.incr('counter');

// ✅ Hoặc dùng cluster message
if (cluster.isMaster) {
  cluster.on('message', (worker, msg) => {
    if (msg.type === 'increment') {
      counter++;
      worker.send({ type: 'counter_value', value: counter });
    }
  });
}
```

### Trap 2: Server.listen() Gây Port Already In Use

```javascript
// ❌ Worker gọi listen() trước khi master fork xong
if (cluster.isWorker) {
  http.createServer(...).listen(3000); // Có thể lỗi!
}

// ✅ Dùng --debug port để tránh conflict
const server = http.createServer(...);
server.listen(process.env.PORT || 3000);

// ✅ Hoặc dùng address để check
server.listen(0, '0.0.0.0', () => {
  const { port } = server.address();
  console.log(`Worker listening on port ${port}`);
});
```

### Trap 3: Memory Leaks Trong Workers

```javascript
// ❌ Memory leak trong worker = chỉ worker đó bị restart
// Nhưng nếu leak nghiêm trọng → tất cả workers dần dần leak

// ✅ Monitor memory trong master
cluster.on('message', (worker, message) => {
  if (message.type === 'memory_report') {
    const { heapUsed, heapTotal } = message.memory;
    const heapMB = Math.round(heapUsed / 1024 / 1024);

    if (heapMB > 500) { // > 500MB
      console.warn(`Worker ${worker.id} memory high: ${heapMB}MB`);
      worker.send({ type: 'force_gc' });
    }
  }
});

// Worker report định kỳ
if (cluster.isWorker) {
  setInterval(() => {
    process.send({
      type: 'memory_report',
      memory: process.memoryUsage()
    });
  }, 30000);
}
```

### Trap 4: NVMRC / Node Version Mismatch

```bash
# ❌ Workers có thể dùng node version khác
# nvm: mỗi shell có thể có version khác nhau

# ✅ Dùng .nvmrc
echo '18.17.0' > .nvmrc

# ✅ Hoặc PM2 Ecosystem chỉ định rõ
module.exports = {
  apps: [{
    script: 'server.js',
    node_args: '--max-old-space-size=4096' // RAM limit
  }]
};
```

### Trap 5: Graceful Shutdown Không Hoàn Tất

```javascript
// ❌ Worker không đợi requests hoàn tất
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, exiting...');
  process.exit(0); // ⚠️ Requests đang xử lý bị interrupted!
});

// ✅ Đợi requests hoàn tất
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, closing server...');
  server.close(() => {
    console.log('Server closed, exiting...');
    process.exit(0);
  });

  // Force exit sau timeout
  setTimeout(() => {
    console.error('Graceful shutdown timeout, forcing exit');
    process.exit(1);
  }, 10000);
});
```

---

## 8. Câu Hỏi Phỏng Vấn

### Câu 1: Cluster vs Worker Threads — khác nhau?

**Trả lời:** Cluster tạo NHIỀU PROCESSES, mỗi process có memory riêng hoàn toàn (isolated). Worker Threads tạo NHIỀU THREADS trong cùng process, chia sẻ memory (nếu dùng SharedArrayBuffer). Cluster: worker crash → worker khác không bị ảnh hưởng (an toàn hơn), nhưng nặng hơn. Worker Threads: nhẹ hơn, memory chia sẻ, nhưng crash trong worker có thể ảnh hưởng main thread. Dùng Cluster cho HTTP servers production, Worker Threads cho CPU-bound computation.

---

### Câu 2: Load balancing trong Cluster hoạt động thế nào?

**Trả lời:** Linux/macOS: OS kernel load balances connections bằng round-robin — mỗi worker gọi listen() trên cùng port, kernel phân phối connections đến workers. Scheduling policy có thể đổi: SCHED_RR (round-robin) hoặc SCHED_NONE (OS tự quyết định). Sticky sessions: dùng cookie để route requests cùng session đến cùng worker. External load balancer (nginx): nginx đứng trước, phân phối đến cluster.

---

### Câu 3: Zero-downtime deployment làm thế nào?

**Trả lời:** (1) Master fork replacement workers trước khi kill old workers. (2) Old workers nhận SIGTERM, close server (đợi requests hoàn tất), gọi disconnect(). (3) New workers nhận connections mới. (4) Old workers exit khi không còn connections. (5) PM2 làm tự động với `pm2 reload`. Quan trọng: requests in-flight không bị interrupted, new requests được route đến new workers.

---

### Câu 4: Shared state trong Cluster xử lý thế nào?

**Trả lời:** Cluster workers KHÔNG share memory — mỗi worker là process riêng. Global variables không shared. Giải pháp: (1) **Redis**: external store, tất cả workers kết nối cùng Redis. (2) **PostgreSQL/MySQL**: database là shared store. (3) **Memcached**: in-memory cache cluster. (4) **IPC**: workers gửi message đến master, master quản lý state. (5) **Sticky sessions**: session affinity đến worker cụ thể.

---

### Câu 5: PM2 advantages so với native cluster?

**Trả lời:** PM2: (1) Quản lý cluster đơn giản — `pm2 start -i max`. (2) Auto-restart khi crash. (3) Log management tập trung. (4) Memory limit auto-restart. (5) Load balancing tự động. (6) Zero-downtime reload (`pm2 reload`). (7) Ecosystem config quản lý nhiều apps. (8) Monitoring dashboard (PM2 Plus). (9) Remote logging. Dùng PM2 production thay vì native cluster module.

---

### Câu 6: Performance considerations cho Cluster?

**Trả lời:** (1) **Worker count**: số workers = số CPU cores là sweet spot. Quá nhiều = context switch overhead. (2) **Memory**: mỗi worker có V8 instance riêng — ~30-50MB overhead mỗi worker. (3) **IPC overhead**: message passing giữa master và workers có cost. (4) **CPU-bound tasks**: cluster tốt cho HTTP servers (I/O-bound). (5) **Long-lived connections**: WebSockets có thể làm load balancing kém hiệu quả — dùng sticky sessions.

---

## 9. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  CLUSTER                                                        │
│                                                               │
│  ARCHITECTURE                                                  │
│  ├── Master: quản lý workers, load balancing               │
│  ├── Workers: mỗi worker = Node.js process riêng         │
│  ├── IPC: message passing giữa master và workers         │
│  └── OS Kernel: distribute connections (round-robin)     │
│                                                               │
│  LOAD BALANCING                                               │
│  ├── Round-robin (mặc định): đều connections           │
│  ├── SCHED_NONE: OS tự quyết định                     │
│  └── Sticky sessions: session affinity với cookie      │
│                                                               │
│  ZERO-DOWNTIME DEPLOYMENT                                     │
│  ├── SIGTERM: graceful shutdown, đợi requests xong    │
│  ├── Fork replacement workers trước khi kill old      │
│  ├── PM2 reload: tự động hóa toàn bộ process       │
│  └── Health checks: restart crashed workers          │
│                                                               │
│  SESSION/STATE MANAGEMENT                                     │
│  ├── Global variables: KHÔNG shared!                     │
│  ├── Redis: external shared store                         │
│  ├── Sticky sessions: route đến đúng worker           │
│  └── Database: PostgreSQL, MySQL                        │
│                                                               │
│  PM2                                                           │
│  ├── Ecosystem config: instances, env, limits            │
│  ├── Auto-restart, log management                        │
│  ├── Memory limit auto-restart                           │
│  └── PM2 Plus: cloud monitoring                          │
│                                                               │
│  ⚠️ Mỗi worker là process riêng — memory không shared  │
│  ⚠️ Global variables không shared giữa workers         │
│  ⚠️ Dùng Redis/DB cho shared state                    │
│  ⚠️ Worker count = CPU cores là sweet spot           │
│  ⚠️ Graceful shutdown cần server.close() + timeout  │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Implement được cluster cơ bản với fork()
- [ ] Hiểu master-worker communication qua IPC
- [ ] Implement được zero-downtime deployment
- [ ] Cấu hình được PM2 ecosystem
- [ ] Biết khi nào dùng Cluster vs Worker Threads
- [ ] Implement được sticky sessions với Redis
- [ ] Tránh được 5 traps phổ biến
- [ ] Trả lời được 5/6 câu hỏi phỏng vấn
- [ ] Monitor được worker health và memory

---

*Last updated: 2026-04-01*
