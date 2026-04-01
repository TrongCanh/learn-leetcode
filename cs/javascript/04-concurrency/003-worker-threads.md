# Worker Threads — Parallelism Trong Node.js

## Câu hỏi mở đầu

```javascript
// Node.js chạy single-threaded
// Nhưng server có 16 cores — chỉ dùng 1 core!

// Heavy computation: crypto, parsing, image processing
// → Block event loop hoàn toàn
// → Tất cả requests bị delay!

// Giải pháp: Worker Threads
// → Chạy JavaScript trên multiple threads
// → Dùng được TẤT CẢ cores!

const { Worker } = require('worker_threads');
```

**Node.js Worker Threads = Web Workers cho Node.js.** Chúng cho phép JavaScript computation chạy trên separate threads — không block event loop. Quan trọng là khác với child processes ở chỗ: Worker Threads chia sẻ memory với main thread (nếu dùng SharedArrayBuffer), và nhẹ hơn nhiều.

---

## 1. Worker Threads Cơ Bản

### Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│  Node.js Process                                               │
│                                                               │
│  Main Thread (V8):                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Event Loop + libuv                                  │  │
│  │  HTTP Server, File I/O, Timers                      │  │
│  │  ← Communication qua parentPort                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                               │
│  Worker Threads:                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Thread 1   │  │  Thread 2   │  │  Thread N   │        │
│  │  V8 isolate │  │  V8 isolate │  │  V8 isolate │        │
│  │  Own heap   │  │  Own heap   │  │  Own heap   │        │
│  │  Own event  │  │  Own event  │  │  Own event  │        │
│  │  loop       │  │  loop       │  │  loop       │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                               │
│  Optional Shared Memory:                                      │
│  ├── SharedArrayBuffer (true shared heap)                   │
│  └── Message passing (copy, structured clone)                │
└─────────────────────────────────────────────────────────────┘
```

### Tạo Worker Đầu Tiên

```javascript
// main.js
const { Worker } = require('worker_threads');

const worker = new Worker(`
  const { parentPort, workerData } = require('worker_threads');

  function computeExpensive(data) {
    // Chạy trên separate thread
    let sum = 0;
    for (let i = 0; i < data; i++) {
      sum += Math.sqrt(i);
    }
    return sum;
  }

  const result = computeExpensive(workerData.input);

  // Gửi kết quả về main thread
  parentPort.postMessage({ result });
`, { eval: true });

worker.postMessage({ type: 'start', input: 10_000_000 });

worker.on('message', (message) => {
  console.log('Worker result:', message.result);
});

worker.on('error', (error) => {
  console.error('Worker error:', error);
});

worker.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Worker exited with code ${code}`);
  }
});
```

### File-Based Worker

```javascript
// worker.js — worker thread
const { parentPort, workerData } = require('worker_threads');

function computeExpensive(n) {
  let result = 0;
  for (let i = 0; i < n; i++) {
    result += Math.sqrt(i);
  }
  return result;
}

parentPort.postMessage({ result: computeExpensive(workerData.input) });
```

```javascript
// main.js
const { Worker } = require('worker_threads');

const worker = new Worker('./worker.js', {
  workerData: { input: 10_000_000 }
});

worker.on('message', (data) => {
  console.log('Result:', data.result);
});
```

---

## 2. Communication — parentPort

### parentPort — Kênh Chính

```javascript
// worker.js
const { parentPort, workerData } = require('worker_threads');

// Nhận message từ main thread
parentPort.on('message', (data) => {
  const { type, payload } = data;

  switch (type) {
    case 'process':
      const result = processData(payload);
      parentPort.postMessage({ type: 'result', data: result });
      break;

    case 'stop':
      parentPort.postMessage({ type: 'done' });
      process.exit(0);
      break;
  }
});

// Gửi message ban đầu
parentPort.postMessage({ type: 'ready', pid: process.pid });
```

### Message Protocol — Structured Messages

```javascript
// Typed message protocol — rõ ràng và maintainable

// messages.js — shared message types
const MessageTypes = {
  INIT: 'init',
  PROCESS: 'process',
  RESULT: 'result',
  PROGRESS: 'progress',
  ERROR: 'error',
  TERMINATE: 'terminate'
};

// main.js
function createWorker(filename) {
  const { Worker } = require('worker_threads');
  const worker = new Worker(filename);

  return {
    send(type, payload) {
      return new Promise((resolve, reject) => {
        const handler = (message) => {
          if (message.type === type) {
            worker.off('message', handler);
            resolve(message.data);
          } else if (message.type === MessageTypes.ERROR) {
            reject(new Error(message.data));
          }
        };
        worker.on('message', handler);
        worker.postMessage({ type, payload });
      });
    },

    onProgress(callback) {
      worker.on('message', (message) => {
        if (message.type === MessageTypes.PROGRESS) {
          callback(message.data);
        }
      });
    },

    terminate() {
      worker.terminate();
    }
  };
}

// Usage
const job = createWorker('./processor.js');

job.onProgress((progress) => {
  console.log(`Progress: ${progress.percent}%`);
});

const result = await job.send(MessageTypes.PROCESS, largeDataset);
console.log('Result:', result);
```

---

## 3. Data Transfer

### SharedArrayBuffer — True Shared Memory

```javascript
// main.js — Chia sẻ memory giữa threads
const {
  Worker,
  SharedArrayBuffer,
  Atomics
} = require('worker_threads');

// Tạo shared buffer
const sharedBuffer = new SharedArrayBuffer(1024 * 1024); // 1MB
const sharedArray = new Int32Array(sharedBuffer);

// Tạo worker, truyền shared buffer
const worker = new Worker('./shared-worker.js', {
  sharedBuffers: [sharedBuffer] // ← chia sẻ, không copy!
});

// Worker ghi vào shared memory
// Main thread đọc ngay khi cần

// Đọc atomic từ main thread
function getCounter() {
  return Atomics.load(sharedArray, 0);
}

function incrementCounter() {
  return Atomics.add(sharedArray, 0, 1);
}
```

```javascript
// shared-worker.js
const { parentPort, sharedBuffers } = require('worker_threads');

const sharedArray = new Int32Array(sharedBuffers[0]);

// Worker increment counter liên tục
let count = 0;
while (count < 1000) {
  Atomics.add(sharedArray, 0, 1);
  count++;

  // Báo cho main thread
  if (count % 100 === 0) {
    parentPort.postMessage({ type: 'progress', count });
  }
}

parentPort.postMessage({ type: 'done', total: Atomics.load(sharedArray, 0) });
```

### Transferable Objects — Zero-Copy Nhưng Destructive

```javascript
// main.js — Transfer buffer (ownership transfer)
// ⚠️ Sau khi transfer: buffer ở main thread = detached!

const buffer = Buffer.alloc(10 * 1024 * 1024); // 10MB

// Truyền buffer vào worker — transfer
worker.postMessage({ buffer }, [buffer]);

// Sau khi transfer:
console.log(buffer.length); // 0 ❌ Detached!

// Worker nhận buffer
// worker.js
parentPort.on('message', ({ buffer }) => {
  // buffer ở đây — main thread không còn quyền truy cập
  console.log(Buffer.isBuffer(buffer)); // true
  console.log(buffer.length); // 10MB ✅
});
```

### So Sánh Data Passing

```
┌────────────────────┬──────────────┬──────────────┬──────────────┐
│                    │   Copy        │  Transfer     │ SharedBuffer │
├────────────────────┼──────────────┼──────────────┼──────────────┤
│ Mechanism          │ Structured   │ Ownership     │ True shared  │
│                    │ clone        │ transfer      │ memory       │
│ Speed              │ Chậm         │ Nhanh         │ Nhanh nhất  │
│ Memory overhead    │ Gấp đôi     │ Không         │ Không       │
│ Source after       │ Nguyên       │ DETACHED!     │ Vẫn truy    │
│                    │              │               │ cập được     │
│ Use case           │ Small data   │ Large buffers │ Real-time   │
│                    │ (KB)         │ (MB+)         │ data share  │
│ Thread safety      │ ✅ Safe      │ ✅ Safe       │ ⚠️ Cần      │
│                    │              │               │ Atomics     │
└────────────────────┴──────────────┴──────────────┴──────────────┘
```

---

## 4. Worker Pool — Quản Lý Nhiều Workers

### Pool Implementation Hoàn Chỉnh

```javascript
// worker-pool.js
const { Worker } = require('worker_threads');
const path = require('path');

class WorkerPool {
  #workers = [];
  #queue = [];
  #size;
  #filename;
  #workerData;

  constructor(options = {}) {
    this.#size = options.size || require('os').cpus().length;
    this.#filename = options.filename || options.script;
    this.#workerData = options.workerData || null;
  }

  async runTask(data) {
    const worker = this.#getAvailableWorker();

    if (worker) {
      return this.#execute(worker, data);
    } else {
      // Queue task
      return new Promise((resolve, reject) => {
        this.#queue.push({ data, resolve, reject });
      });
    }
  }

  async runTaskWithTransfer(data, transferList) {
    const worker = this.#getAvailableWorker();

    if (worker) {
      return this.#executeWithTransfer(worker, data, transferList);
    } else {
      return new Promise((resolve, reject) => {
        this.#queue.push({ data, transferList, resolve, reject });
      });
    }
  }

  #getAvailableWorker() {
    return this.#workers.find(w => !w.busy) || null;
  }

  #createWorker() {
    const worker = new Worker(this.#filename, {
      workerData: this.#workerData
    });

    return {
      worker,
      busy: false,
      resolve: null,
      reject: null
    };
  }

  async #execute(workerItem, data) {
    workerItem.busy = true;
    workerItem.resolve = null;
    workerItem.reject = null;

    return new Promise((resolve, reject) => {
      workerItem.resolve = resolve;
      workerItem.reject = reject;

      const onMessage = (message) => {
        cleanup();
        resolve(message);
      };

      const onError = (error) => {
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        workerItem.busy = false;
        workerItem.worker.off('message', onMessage);
        workerItem.worker.off('error', onError);
      };

      workerItem.worker.on('message', onMessage);
      workerItem.worker.on('error', onError);
      workerItem.worker.postMessage(data);
    });
  }

  async #executeWithTransfer(workerItem, data, transferList) {
    return this.#execute(workerItem, data);
  }

  async #processQueue() {
    if (this.#queue.length === 0) return;

    const worker = this.#getAvailableWorker();
    if (!worker) return;

    const { data, transferList, resolve, reject } = this.#queue.shift();

    if (transferList) {
      const result = await this.#executeWithTransfer(worker, data, transferList);
      resolve(result);
    } else {
      const result = await this.#execute(worker, data);
      resolve(result);
    }
  }

  initialize() {
    for (let i = 0; i < this.#size; i++) {
      this.#workers.push(this.#createWorker());
    }
    return this;
  }

  terminate() {
    this.#workers.forEach(w => w.worker.terminate());
    this.#workers = [];
    this.#queue = [];
  }

  get stats() {
    const busy = this.#workers.filter(w => w.busy).length;
    return {
      total: this.#size,
      busy,
      idle: this.#size - busy,
      queued: this.#queue.length
    };
  }
}

module.exports = { WorkerPool };
```

### Pool Với Progress Reporting

```javascript
// advanced-pool.js
const { Worker } = require('worker_threads');

class AdvancedWorkerPool {
  #workers = [];
  #queue = [];
  #results = new Map();
  #resultsIdCounter = 0;

  constructor(filename, options = {}) {
    this.filename = filename;
    this.poolSize = options.size || require('os').cpus().length;
    this.onWorkerMessage = options.onWorkerMessage || (() => {});
    this.onWorkerError = options.onWorkerError || (() => {});
  }

  async initialize() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.filename);
      worker.on('message', (message) => this.#handleMessage(worker, message));
      worker.on('error', (error) => this.#handleError(worker, error));
      worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Worker ${i} died with code ${code}`);
        }
      });
      this.#workers.push({ worker, busy: false, id: i });
    }
    return this;
  }

  #handleMessage(worker, message) {
    if (message.resultId) {
      const pending = this.#results.get(message.resultId);
      if (pending) {
        clearTimeout(pending.timeout);
        pending.resolve(message.data);
        this.#results.delete(message.resultId);
      }
    }

    // Bubble up worker messages (progress, etc.)
    this.onWorkerMessage(message, worker.threadId);
    this.#releaseWorker(worker);
  }

  #handleError(worker, error) {
    const pending = this.#workers.find(w => w.worker === worker);
    this.onWorkerError(error, worker.threadId);
    this.#releaseWorker(worker);
  }

  #releaseWorker(worker) {
    const workerItem = this.#workers.find(w => w.worker === worker);
    if (!workerItem) return;

    workerItem.busy = false;

    // Process queue
    if (this.#queue.length > 0) {
      const { data, transferList, resolve, reject, timeout } = this.#queue.shift();
      this.#runTask(worker, data, transferList, resolve, reject, timeout);
    }
  }

  #runTask(worker, data, transferList, resolve, reject, timeout) {
    const workerItem = this.#workers.find(w => w.worker === worker);
    if (!workerItem) return;

    workerItem.busy = true;

    if (timeout) {
      const resultId = ++this.#resultsIdCounter;
      this.#results.set(resultId, { resolve, reject, timeout });

      setTimeout(() => {
        if (this.#results.has(resultId)) {
          this.#results.delete(resultId);
          reject(new Error('Worker task timeout'));
        }
      }, timeout);

      worker.postMessage({ ...data, resultId }, transferList);
    } else {
      worker.postMessage(data, transferList || []);
    }
  }

  async runTask(data, transferList, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const worker = this.#workers.find(w => !w.busy);

      if (worker) {
        this.#runTask(worker.worker, data, transferList, resolve, reject, timeout);
      } else {
        this.#queue.push({ data, transferList, resolve, reject, timeout });
      }
    });
  }

  async runTasks(tasks, concurrency = null) {
    concurrency = concurrency || this.poolSize;
    const chunks = [];

    for (let i = 0; i < tasks.length; i += concurrency) {
      chunks.push(tasks.slice(i, i + concurrency));
    }

    const results = [];
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(task => this.runTask(task.data, task.transfer))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  terminate() {
    this.#workers.forEach(w => w.worker.terminate());
    this.#workers = [];
    this.#queue = [];
    this.#results.clear();
  }
}

module.exports = { AdvancedWorkerPool };
```

---

## 5. Ứng Dụng Thực Tế

### Crypto Operations — CPU-Intensive

```javascript
// crypto-worker.js
const { parentPort, workerData } = require('worker_threads');
const crypto = require('crypto');

parentPort.on('message', ({ type, payload }) => {
  switch (type) {
    case 'pbkdf2': {
      const { password, salt, iterations, keylen } = payload;
      const hash = crypto.pbkdf2Sync(password, salt, iterations, keylen, 'sha512');
      parentPort.postMessage({
        type: 'result',
        data: { hash: hash.toString('hex'), salt }
      });
      break;
    }

    case 'hash': {
      const { data, algorithm } = payload;
      const hash = crypto.createHash(algorithm).update(data).digest('hex');
      parentPort.postMessage({ type: 'result', data: hash });
      break;
    }

    case 'generateKey': {
      const { algorithm, keySize } = payload;
      const key = crypto.generateKeySync(algorithm, { length: keySize });
      const { public: publicKey, private: privateKey } = key.export();
      parentPort.postMessage({ type: 'result', data: { publicKey, privateKey } });
      break;
    }
  }
});
```

```javascript
// main.js
const { Worker } = require('worker_threads');

const pool = new WorkerPool('./crypto-worker.js').initialize();

// Hash password với PBKDF2 — không block event loop!
async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  return pool.runTask({
    type: 'pbkdf2',
    payload: {
      password,
      salt: salt.toString('hex'),
      iterations: 100000,
      keylen: 64
    }
  });
}

// Batch hashing
const hashes = await Promise.all([
  hashPassword('password1'),
  hashPassword('password2'),
  hashPassword('password3')
]);
```

### Data Processing — Batch Operations

```javascript
// data-worker.js
const { parentPort, workerData } = require('worker_threads');
const { Transform } = require('stream');

parentPort.on('message', ({ type, payload }) => {
  if (type === 'processBatch') {
    const { records, batchSize, transform } = payload;
    const results = [];
    let processed = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      // Process batch
      const transformed = batch.map(record => {
        try {
          return transform(record);
        } catch (err) {
          return { error: err.message, record };
        }
      });

      results.push(...transformed);
      processed += batch.length;

      // Progress reporting
      parentPort.postMessage({
        type: 'progress',
        data: { processed, total: records.length, percent: Math.round(processed / records.length * 100) }
      });
    }

    parentPort.postMessage({
      type: 'result',
      data: { results, total: results.length, errors: results.filter(r => r.error).length }
    });
  }
});

function processRecord(record) {
  // Custom processing logic
  return {
    ...record,
    processed: true,
    timestamp: new Date().toISOString()
  };
}
```

```javascript
// main.js — xử lý CSV lớn
async function processLargeCSV(filepath) {
  const pool = new WorkerPool('./data-worker.js').initialize();

  const records = await parseCSV(filepath); // Ví dụ: 1 triệu records

  pool.onWorkerMessage = (message, threadId) => {
    if (message.type === 'progress') {
      console.log(`Thread ${threadId}: ${message.data.percent}%`);
    }
  };

  const { results, errors } = await pool.runTask({
    type: 'processBatch',
    payload: {
      records,
      batchSize: 10000,
      transform: (record) => ({
        id: record.id,
        name: record.name.toUpperCase(),
        value: parseFloat(record.value) * 1.1 // transform logic
      })
    }
  });

  pool.terminate();
  return { results, errors };
}
```

### Parallel Computation — Fibonacci

```javascript
// fib-worker.js
const { parentPort, workerData } = require('worker_threads');

// Memoization để tăng tốc
const memo = new Map();

function fib(n) {
  if (n <= 1) return BigInt(n);
  if (memo.has(n)) return memo.get(n);

  const result = fib(n - 1) + fib(n - 2);
  memo.set(n, result);
  return result;
}

parentPort.on('message', ({ type, payload }) => {
  if (type === 'fib') {
    const { n } = payload;
    const start = Date.now();
    const result = fib(n);
    const time = Date.now() - start;

    parentPort.postMessage({
      type: 'result',
      data: { n, result: result.toString(), time }
    });
  }
});
```

---

## 6. Các Traps Phổ Biến

### Trap 1: Tạo Worker Cho Mỗi Task

```javascript
// ❌ Tạo worker mới cho mỗi task — overhead quá lớn!
async function processAll(items) {
  const results = [];
  for (const item of items) {
    const worker = new Worker('./task.js'); // Overhead mỗi lần!
    const result = await runTask(worker, item);
    worker.terminate();
    results.push(result);
  }
  return results;
}

// → 100 tasks = 100 worker creations = 500-2000ms overhead!

// ✅ Dùng Worker Pool
const pool = new WorkerPool('./task.js').initialize();

async function processAll(items) {
  return Promise.all(items.map(item => pool.runTask({ item })));
}

// → Workers được reuse!
```

### Trap 2: Shared Mutable State Mà Không Dùng Atomics

```javascript
// ❌ Shared state không atomic — race condition!
const { Worker, SharedArrayBuffer } = require('worker_threads');
const shared = new SharedArrayBuffer(4);
const counter = new Int32Array(shared);

// Worker code:
counter[0]++; // RACE CONDITION!

// ✅ Dùng Atomics
Atomics.add(counter, 0, 1); // Atomic increment
```

### Trap 3: Worker Memory Leaks

```javascript
// ❌ Worker giữ references lớn không cần thiết
function processTask(data) {
  const bigData = new Array(10_000_000);

  return new Worker(`
    const { parentPort } = require('worker_threads');
    parentPort.on('message', (msg) => {
      // bigData được serialized vào worker
      // Worker giữ bigData reference
      parentPort.postMessage({ result: msg.data.length });
    });
  `);
}

// ✅ Cleanup sau khi worker xong
pool.runTask(data).finally(() => {
  // Cleanup any references
});
```

### Trap 4: Blocking parentPort.onmessage

```javascript
// ❌ Blocking synchronous operation trong message handler
parentPort.on('message', (data) => {
  const result = syncHeavyComputation(data); // BLOCKS worker event loop!
  parentPort.postMessage({ result });
});

// ✅ Dùng message protocol async
parentPort.on('message', async (data) => {
  const result = await asyncHeavyComputation(data); // Non-blocking
  parentPort.postMessage({ result });
});
```

### Trap 5: Node.js Worker vs Child Process Confusion

```javascript
// ❌ Dùng Worker Thread cho CPU-bound khi cần memory isolation
// Worker Threads chia sẻ memory → không isolation
// Một worker crash → có thể ảnh hưởng main thread

// ✅ Khi nào dùng Worker Thread:
// - CPU-bound computation cần parallelism
// - Cần shared memory (SharedArrayBuffer)
// - Nhẹ hơn child process

// ✅ Khi nào dùng Child Process:
// - Cần full memory isolation
// - Chạy script hoàn toàn tách biệt
// - Cần fail-safe (process crash không ảnh hưởng main)

const { fork } = require('child_process');
const child = fork('./isolated-script.js');
// child có BỘ NHỚ RIÊNG hoàn toàn
```

---

## 7. Câu Hỏi Phỏng Vấn

### Câu 1: Worker Threads vs Child Processes — khác nhau?

**Trả lời:** Worker Threads: chia sẻ memory với main thread (có thể dùng SharedArrayBuffer), nhẹ hơn, tạo nhanh hơn, context switch nhẹ hơn. Nhưng crash trong worker có thể ảnh hưởng process chính. Child Processes: memory hoàn toàn riêng (isolated), crash không ảnh hưởng main process, an toàn hơn nhưng nặng hơn. Dùng Worker Threads cho CPU-bound tasks cần parallelism nhẹ. Dùng Child Process khi cần isolation hoặc chạy code không tin cậy.

---

### Câu 2: Event loop trong Worker Thread hoạt động thế nào?

**Trả lời:** Mỗi Worker Thread có V8 isolate riêng với event loop riêng. Worker có thể dùng async I/O (fs, crypto) mà không block main thread. Worker và main thread giao tiếp qua message passing (parentPort.postMessage). Worker có thể xử lý multiple messages đồng thời qua event loop. libuv trong worker quản lý async operations của worker đó.

---

### Câu 3: SharedArrayBuffer trong Worker Threads?

**Trả lời:** SharedArrayBuffer cho phép Worker Thread và main thread thấy cùng memory — zero-copy communication. Không cần transfer. Đọc/ghi trực tiếp từ cả 2 threads. Cần dùng Atomics để tránh race conditions. Khác với transferable objects (chuyển quyền sở hữu, source detached). Dùng cho: real-time data, high-frequency updates, WASM memory.

---

### Câu 4: Worker Pool design patterns?

**Trả lời:** Pool nên: (1) Pre-create workers = số cores hoặc configurable. (2) Reuse workers = tránh overhead tạo worker mới (~5-20ms). (3) Queue tasks = khi tất cả workers busy. (4) Progress reporting = worker postMessage progress, main thread hiển thị. (5) Error handling = worker error không kill pool. (6) Graceful shutdown = terminate all workers khi app exits. (7) Stats = track busy/idle/queued workers.

---

### Câu 5: Performance considerations khi dùng Worker Threads?

**Trả lời:** (1) **Worker creation**: ~5-20ms overhead — dùng pool. (2) **Data serialization**: structured clone cho copy, transfer cho large buffers. (3) **Message passing overhead**: mỗi postMessage có serialization cost. (4) **Shared memory**: Atomics.wait là blocking — không dùng trong main thread. (5) **Thread count**: số workers = số CPU cores là sweet spot. Quá nhiều threads = context switch overhead. (6) **Task size**: workers tốt cho tasks >10ms. Tasks ngắn hơn = overhead không đáng.

---

## 8. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  WORKER THREADS (Node.js)                                       │
│                                                               │
│  ARCHITECTURE                                                  │
│  ├── Separate V8 isolate per worker                         │
│  ├── Own heap, own event loop                              │
│  ├── Communication: parentPort.postMessage                 │
│  └── Optional shared memory (SharedArrayBuffer)            │
│                                                               │
│  DATA TRANSFER                                                 │
│  ├── Copy: structured clone, source unchanged, chậm      │
│  ├── Transfer: ownership transfer, source detached       │
│  └── SharedArrayBuffer: true shared memory              │
│                                                               │
│  WORKER POOL                                                   │
│  ├── Pre-create workers (size = CPU cores)               │
│  ├── Reuse workers → tránh creation overhead            │
│  ├── Queue tasks when busy                              │
│  └── Progress reporting, error handling, graceful shutdown │
│                                                               │
│  USE CASES                                                     │
│  ├── CPU-bound: crypto, parsing, data processing         │
│  ├── Parallel computation: fibonacci, sorting, etc.      │
│  ├── Image processing: resize, compress, transform        │
│  └── Long-running tasks: không block event loop         │
│                                                               │
│  ⚠️ Worker tạo mới tốn ~5-20ms — dùng pool           │
│  ⚠️ Shared mutable state cần Atomics                  │
│  ⚠️ Worker crash có thể ảnh hưởng main process      │
│  ⚠️ Tasks > 10ms mới đáng dùng worker              │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Tạo được Worker Thread cơ bản (file-based và eval)
- [ ] Implement được message protocol
- [ ] Dùng được SharedArrayBuffer với Atomics
- [ ] Implement được Worker Pool (basic và advanced)
- [ ] Xử lý được progress reporting
- [ ] Tránh được 5 traps phổ biến
- [ ] Biết khi nào dùng Worker Thread vs Child Process
- [ ] Trả lời được 5/6 câu hỏi phỏng vấn
- [ ] Optimize được pool size và task distribution

---

*Last updated: 2026-04-01*
