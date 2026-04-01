# Thread vs Process — Nền Tảng Của Concurrency

## Câu hỏi mở đầu

```javascript
// JavaScript là single-threaded
// Nhưng Node.js có cluster mode, dùng được multi-core!
// Trình duyệt có Web Workers, Worker Threads

// Vậy Thread và Process khác nhau thế nào?
// Và khi nào JavaScript cần Thread/Process thật sự?

// Mở Task Manager: Chrome có HÀNG CHỤC processes
// Nhưng JS bên trong chỉ 1 thread
// → Tại sao Chrome cần nhiều process như vậy?
```

**Thread và Process là hai đơn vị concurrency cơ bản nhất của OS.** Hiểu rõ sự khác biệt giúp bạn thiết kế hệ thống đúng — dùng thread khi cần shared memory, dùng process khi cần isolation.

---

## 1. Process — Chương Trình Đang Chạy

### Định nghĩa chính xác

```
Process = một chương trình đang được thực thi trong bộ nhớ cô lập

Mỗi process có:
  ├── Heap riêng     → không chia sẻ với process khác
  ├── Stack riêng    → mỗi thread trong process có stack riêng
  ├── Code segment   → read-only
  ├── Data segment   → global variables
  ├── File handles   → opened files, network connections
  ├── OS resources   → process ID, parent ID, priority
  └── Bộ nhớ riêng  → địa chỉ ảo hoàn toàn tách biệt
```

### Minh họa bộ nhớ

```
┌─────────────────────────────────────────────────────────────┐
│  Process 1 (Chrome Tab 1)                                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Heap: ~500MB  (addresses 0x1000 - 0x7FFF0000)       │  │
│  │  Stack: 8MB    (thread stack)                        │  │
│  │  Code: Read-only                                     │  │
│  │  Data: Global variables                              │  │
│  │  Files: opened tabs, network sockets                  │  │
│  └───────────────────────────────────────────────────────┘  │
│  PID: 1234                                                  │
└─────────────────────────────────────────────────────────────┘
                          ↕ IPC (Inter-Process Communication)
┌─────────────────────────────────────────────────────────────┐
│  Process 2 (Chrome Tab 2)                                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Heap: ~300MB  (addresses hoàn toàn KHÁC)           │  │
│  │  Stack: 8MB                                         │  │
│  │  ...                                                 │  │
│  └───────────────────────────────────────────────────────┘  │
│  PID: 1235                                                  │
└─────────────────────────────────────────────────────────────┘
```

### Đặc điểm then chốt

```
• Isolated Memory
  Process A không thể đọc/ghi bộ nhớ của Process B
  → An toàn: crash process này không ảnh hưởng process khác

• Communication qua IPC
  Pipes, sockets, shared memory (có cấu hình đặc biệt)
  → Tốc độ chậm hơn trong-process communication

• Heavyweight Creation
  Tạo process = OS phải cấp phát bộ nhớ riêng, setup resources
  → Mất ~50-200ms tùy OS

• Fault Tolerance
  Process A crash → Process B hoàn toàn an toàn
  → Browser không crash toàn bộ khi một tab die

• Context Switch
  Chuyển từ process này sang process khác = tốn thời gian
  → OS phải save/restore toàn bộ process state
```

### Tạo Process Trong Node.js

```javascript
// Child process — process hoàn toàn riêng
const { fork } = require('child_process');

const child = fork('./heavy-task.js', [], {
  stdio: ['pipe', 'pipe', 'pipe', 'ipc']
});

child.on('message', (data) => {
  console.log('Result from child:', data);
});

child.send({ type: 'start', input: 1000000 });

// child.js
process.on('message', (msg) => {
  if (msg.type === 'start') {
    const result = compute(msg.input);
    process.send({ result });
  }
});

function compute(n) {
  let sum = 0;
  for (let i = 0; i < n; i++) sum += i;
  return sum;
}
```

---

## 2. Thread — Đơn Vị Thực Thi Trong Process

### Định nghĩa chính xác

```
Thread = đơn vị thực thi nhỏ nhất trong một process

Mỗi thread có:
  ├── Stack riêng      → local variables, function calls
  ├── Registers riêng  → CPU state (PC, accumulator, etc.)
  └── Thread ID        → unique identifier

Chia sẻ trong process:
  ├── Heap             → tất cả threads thấy cùng heap
  ├── Code segment     → cùng code
  ├── Data segment     → cùng global variables
  └── File handles    → cùng opened files
```

### Minh họa bộ nhớ

```
┌─────────────────────────────────────────────────────────────┐
│  Process (Chrome Tab)                                          │
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Thread 1  │  │  Thread 2  │  │  Thread 3  │            │
│  │  JS Engine │  │  UI Render │  │  Network   │            │
│  │  Stack: 8MB│  │  Stack: 8MB│  │  Stack: 8MB│            │
│  └────────────┘  └────────────┘  └────────────┘            │
│        ↓              ↓              ↓                      │
│  ════════════════ SHARED HEAP & CODE ════════════════      │
│                                                               │
│  Heap: JS objects, DOM, WebAssembly, ArrayBuffers            │
│  Code: V8 engine, Blink renderer, networking stack         │
└─────────────────────────────────────────────────────────────┘
```

### Đặc điểm then chốt

```
• Shared Memory
  Threads chia sẻ heap → truy cập cùng object
  → Nhanh: không cần IPC overhead
  → Nguy hiểm: race conditions

• Lightweight Creation
  Tạo thread = OS chỉ cần setup stack + registers
  → Mất ~1-10ms (nhanh hơn process 10-50x)

• Concurrency, Not Parallelism (thường)
  Nhiều threads đan xen trên 1 core (concurrency)
  Thực sự song song trên multi-core (parallelism)

• Fault Tolerance Thấp
  Thread A crash → Process crash → TẤT CẢ threads die
  → Khác với process!

• Context Switch Nhẹ
  Threads trong cùng process chia sẻ address space
  → Context switch nhanh hơn process
```

### So Sánh Thread vs Process Chi Tiết

| Tiêu chí | Process | Thread |
|---|---|---|
| Memory | **Isolated** — riêng hoàn toàn | **Shared** — chia sẻ heap với process |
| Tạo mới | ~50-200ms (heavyweight) | ~1-10ms (lightweight) |
| Communication | IPC (pipes, sockets, msg queues) | Shared memory + mutex/semaphore |
| Multi-core | Mỗi process trên 1 core | Nhiều threads trên nhiều cores |
| Fault tolerance | **Cao** — crash không ảnh hưởng process khác | **Thấp** — thread crash → process die |
| Context switch | **Nặng** — phải save/restore toàn bộ state | **Nhẹ** — chia sẻ address space |
| Synchronization | Không cần (đã isolated) | Cần thiết (race conditions) |
| Ví dụ thực tế | Chrome tab mới, Node.js fork | JS event loop, Web Workers |
| Memory overhead | Cao (mỗi process có heap riêng) | Thấp (chia sẻ heap) |

---

## 3. JavaScript — Single-Threaded Nhưng Có Lý Do

### Tại sao JavaScript single-threaded?

```javascript
// JavaScript được thiết kế năm 1995 cho Netscape
// Mục đích: thao tác DOM trong trình duyệt

// DOM là SHARED STATE:
document.body.innerHTML = '<div>A</div>';
document.body.innerHTML = '<div>B</div>'; // overwrite!
// → Nếu 2 threads cùng thao tác DOM → race condition!

// Event loop:
while (true) {
  const event = eventQueue.dequeue(); // serial
  handle(event);                     // đơn luồng
}
// → Đơn giản: không cần lock, không có race conditions

// Giống queue trong siêu thị:
// 1 cashier (single thread) → xử lý đơn hàng lần lượt
// vs
// Nhiều cashiers (multi-thread) → có thể conflict khi truy cập kho hàng chung
```

### JavaScript vẫn làm việc với Threading

```javascript
// 1. Web Workers (Browser) — separate process-like thread
const worker = new Worker('compute.js');
worker.postMessage({ type: 'heavy', data: bigData });
worker.onmessage = (e) => console.log('Result:', e.data.result);

// 2. Worker Threads (Node.js) — shared process thread
const { Worker } = require('worker_threads');
const worker = new Worker('./compute.js', { workerData: bigData });
worker.on('message', console.log);

// 3. Child Processes (Node.js) — separate process
const { fork } = require('child_process');
const child = fork('./script.js');

// 4. Async I/O (Node.js) — không dùng thread!
const fs = require('fs').promises;
const data = await fs.readFile('big.txt');
// Node.js dùng libuv thread pool cho I/O
// Event loop vẫn single-threaded
```

### V8 Engine Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  V8 Engine (Single Threaded)                                    │
│                                                               │
│  Main Thread:                                                 │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Parser → AST → Ignition (Bytecode) → Turbofan    │     │
│  │  (Interpreter)           (Optimizing Compiler)      │     │
│  │                                                      │     │
│  │  Event Loop:                                         │     │
│  │  ┌────────────────────────────────────────────┐    │     │
│  │  │  Call Stack    │  Microtask │  Macrotask   │    │     │
│  │  └────────────────────────────────────────────┘    │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  Background (libuv thread pool):                              │
│  ├── File I/O threads (4 default)                            │
│  ├── DNS lookup threads                                      │
│  ├── Crypto threads                                          │
│  └── User-created Worker threads                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Concurrency vs Parallelism

### Định nghĩa chính xác

```
CONCURRENCY (Đan xen)
  Xử lý nhiều tasks TRONG cùng khoảng thời gian
  NHƯNG không nhất thiết cùng lúc
  → Đan xen trên 1 core (hoặc nhiều cores)
  → Mục đích: không block, utilize CPU wait time

PARALLELISM (Song song)
  Xử lý nhiều tasks CÙNG LÚC thực sự
  → Cần multi-core CPU
  → Mục đích: tăng throughput, giảm total time
```

### Minh họa trực quan

```
CONCURRENCY (đan xen trên 1 core)
─────────────────────────────────────► Time
│ Task A: [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░]
│           └─wait──┘└─run─┘└─wait──┘└─run─┘
│ Task B:       [░░░░░░░██████░░░░░░░░░░░░░░░]
│               └─run─┘└─wait─┘└─run─┘└─wait──┘
│ Task C:           [░░░░░░░░░░░░██████░░░░░░]
│ Total: ~150ms (có overlap)

PARALLELISM (song song trên 2 cores)
─────────────────────────────────────► Time
│ Core 1: [████████████░░░░░░░░░░░░░░░░░░░░░]
│         └─Task A────────┘
│ Core 2: [░░░░░░░░░░░████████████░░░░░░░░░░░]
│                   └─Task B────────┘
│ Total: ~80ms (true parallel)

COMBINED: Concurrency + Parallelism
─────────────────────────────────────► Time
│ Core 1: [Task A ████][wait][Task A ████]
│ Core 2: [wait]    [Task B ████][wait]
│ → Tasks đan xen (concurrency) + chạy song song (parallelism)
```

### JavaScript: Concurrency nhưng KHÔNG Parallelism (trên main thread)

```javascript
// Event loop = CONCURRENCY
setTimeout(() => console.log('A'), 0);
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');

// Output: D, C, A, B
// C (microtask) chạy trước A và B (macrotasks)
// D (sync) chạy trước tất cả

// ⚠️ Nhưng tasks đan xen, KHÔNG song song
// Heavy computation block TẤT CẢ
function heavyTask() {
  let result = 0;
  for (let i = 0; i < 10_000_000_000; i++) {
    result += Math.sqrt(i);
  }
  return result;
}

setTimeout(() => console.log('B'), 0);
heavyTask(); // ← Block 30 giây! "B" không bao giờ log trước khi xong
console.log('A');
// Output: A (sau 30s) → B
```

### Khi nào JavaScript cần Parallelism thật sự

```javascript
// KHI NÀO: CPU-bound tasks (không phải I/O-bound)

// Ví dụ 1: Image processing
// 1000 images, mỗi image resize 500ms
// → Serial: 500 giây!
// → Parallel (4 cores): 125 giây

// Ví dụ 2: Data analysis
// Tính toán trên dataset lớn
// → Serial: 60 giây
// → Parallel: 15 giây

// Ví dụ 3: Crypto/Hashing
// bcrypt password hash: 300ms mỗi hash
// 100 passwords: 30 giây serial, 8 giây parallel

// SOLUTION: Web Workers hoặc Worker Threads
const worker = new Worker('process-image.js');
// Main thread FREE → UI responsive
```

---

## 5. Blocking — Khi Thread Bị Chặn

### Blocking I/O vs Non-blocking

```javascript
// ❌ Blocking — thread bị CHẶN, đợi xong mới tiếp tục
function readFileSync(path) {
  const data = fs.readFileSync(path); // thread CHỜ
  return data;                        // → đợi xong → return
}

// Main thread blocked hoàn toàn
readFileSync('big-file.txt'); // 5 giây → 5 giây KHÔNG làm gì được

// ✅ Non-blocking — thread không chờ
function readFileAsync(path) {
  return new Promise((resolve) => {
    fs.readFile(path, (err, data) => {
      resolve(data); // callback khi xong
    });
  });
}

// Event loop vẫn xử lý events khác
readFileAsync('big-file.txt');
console.log('This runs immediately!'); // ✅ Không bị block
```

### Blocking Event Loop — Tai Họa

```javascript
// ❌ Heavy computation BLOCKS event loop
function heavyTask() {
  let result = 0;
  for (let i = 0; i < 10_000_000_000; i++) {
    result += Math.sqrt(i);
  }
  return result;
}

// UI FREEZE:
// Khi user click button, event được queue
// Event loop đang xử lý heavyTask() → KHÔNG xử lý click event!
// → UI không respond trong 30 giây!

// ✅ Web Worker — không block event loop
const worker = new Worker('heavy-task.js');
worker.postMessage({ compute: true });
worker.onmessage = (e) => console.log('Done:', e.data.result);
// Event loop FREE → UI responsive ✅

// ✅ Chunking — giải phóng event loop giữa chừng
async function chunkedHeavyTask() {
  let result = 0;
  const chunkSize = 10_000_000;

  for (let i = 0; i < 10_000_000_000; i += chunkSize) {
    // Xử lý một chunk
    for (let j = i; j < i + chunkSize; j++) {
      result += Math.sqrt(j);
    }

    // NHẢ YIELD — giải phóng event loop
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return result;
}
```

### Long Task — Performance Killer

```
┌─────────────────────────────────────────────────────────────┐
│  Performance Tab → Long Task                                    │
│                                                               │
│  Main Thread Timeline:                                        │
│  [ Event A ] [ Long Task (50ms) ] [ Event B ]               │
│                       ↑                                       │
│                       └─── Long Task!                        │
│                           Task > 50ms                        │
│                           → Frame drop → Jank                 │
│                           → Input lag                         │
│                                                               │
│  ⚠️ User cảm nhận lag khi task > 16ms (60fps)             │
│  ⚠️ Task > 50ms → Core Web Vitals: INP impacted          │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Race Condition — Bug Nghiêm Trọng Của Multi-threading

### Nguyên nhân gốc

```javascript
// Race condition = kết quả phụ thuộc vào thứ tự execution
// Xảy ra khi nhiều threads truy cập SHARED STATE cùng lúc

// Thread A và Thread B cùng tăng counter:
let counter = 0; // Shared variable

// Thread A:                  Thread B:
read counter → 0             read counter → 0
increment → 1                 increment → 1
write counter → 1             write counter → 1

// Kết quả: counter = 1 thay vì 2!
console.log(counter); // 1 ❌ (should be 2)
```

### Race Condition Trong JavaScript (Main Thread)

```javascript
// ⚠️ Async code có thể gây race condition!
let cache = null;

async function getData() {
  if (cache) return cache; // check

  // Gap giữa check và assignment
  cache = await fetch('/api/data'); // assignment
  return cache;
}

// Gọi 2 lần gần nhau:
getData(); // → cache = null → fetch
getData(); // → cache = null → fetch AGAIN! (race!)

// Fix: Double-checked locking
let cache = null;
let fetching = null; // Promise của request đang pending

async function getData() {
  if (cache) return cache;

  // Nếu đang fetch → return Promise đó
  if (fetching) return fetching;

  fetching = fetch('/api/data').then(r => r.json());
  cache = await fetching;
  fetching = null;
  return cache;
}

getData(); // → fetch
getData(); // → return pending fetch Promise ✅
```

### Race Condition Trong Workers

```javascript
// Web Worker — memory ISOLATED (structured clone)
const worker = new Worker('worker.js');
worker.postMessage({ data: bigArray });
// Data được COPY → không race condition!
// ⚠️ Nhưng SLOW nếu data lớn

// SharedArrayBuffer — TRUE shared memory
const sharedBuffer = new SharedArrayBuffer(1024 * 1024);
const counter = new Int32Array(sharedBuffer);

// Worker 1:                    Worker 2:
Atomics.load(counter, 0)         Atomics.load(counter, 0)
          ↓                               ↓
Atomics.add(counter, 0, 1)    Atomics.add(counter, 0, 1)
          ↓                               ↓
Result: counter = 2 ✅    // Atomics đảm bảo atomic!

// ⚠️ Không dùng Atomics = RACE!
sharedCounter[0]++; // RACE CONDITION!
```

### Giải Pháp: Mutex / Lock

```javascript
// Mutex — đảm bảo chỉ một thread truy cập tại một thời điểm
class Mutex {
  #locked = false;
  #queue = [];

  async acquire() {
    if (!this.#locked) {
      this.#locked = true;
      return () => this.release();
    }

    // Queue cho đến khi được unlock
    return new Promise(resolve => {
      this.#queue.push(resolve);
    });
  }

  release() {
    if (this.#queue.length > 0) {
      const next = this.#queue.shift();
      next();
    } else {
      this.#locked = false;
    }
  }
}

// Usage:
const mutex = new Mutex();

async function criticalSection() {
  const release = await mutex.acquire();
  try {
    // Chỉ một thread vào đây tại một thời điểm
    counter++;
  } finally {
    release(); // luôn release!
  }
}
```

---

## 7. Context Switch — Chi Phí Thực Sự

### Context Switch Là Gì

```
Context Switch = OS chuyển CPU từ process/thread này sang process/thread khác

Chi phí:
  ├── Save: registers, program counter, stack pointer
  ├── Update: page tables, TLB (Translation Lookaside Buffer)
  ├── Restore: registers, program counter, stack pointer
  └── Cache: CPU cache có thể bị invalidate

Đo lường:
  ├── Process context switch: ~50-200 microseconds
  └── Thread context switch: ~10-30 microseconds (vì chia sẻ address space)
```

### Process vs Thread Context Switch

```
PROCESS CONTEXT SWITCH
─────────────────────────────────────────────────────────
Save State (Process A):
  • Program Counter
  • Registers
  • Stack Pointer
  • CPU State (floating point, MMX, etc.)
  • Memory Management info (page tables)
  • TLB entries → INVALIDATED!
  • I/O state
  • Accounting info

→ COST: ~50-200 μs
→ Cache MISS: CPU cache hoàn toàn cold cho process mới

THREAD CONTEXT SWITCH
─────────────────────────────────────────────────────────
Save State (Thread A):
  • Program Counter
  • Registers
  • Stack Pointer
  • CPU State

→ COST: ~10-30 μs
→ Cache MISS: ít hơn (process memory vẫn cached)
→ Page tables: KHÔNG cần switch
```

### Context Switch trong JavaScript

```javascript
// JavaScript event loop: có context switch giữa tasks
console.log('A');

setTimeout(() => console.log('B'), 0);
// ↑ OS context switch: main → timer thread
// ↑ OS context switch: timer thread → main

Promise.resolve().then(() => console.log('C'));
// ↑ Main thread: execute microtask
// ↑ Microtask → macrotask queue

// ⚠️ Các context switch này RẤT NHANH vì:
  // 1. Cùng process (JS process)
  // 2. Không cần switch page tables
  // 3. Cache vẫn warm

// ⚠️ Heavy computation gây "pseudo context switch drought"
async function badPattern() {
  for (let i = 0; i < 1_000_000; i++) {
    // Không yield → event loop KHÔNG switch
    // → UI freeze
    compute(i);
  }
}

// Good pattern: yield thường xuyên
async function goodPattern() {
  for (let i = 0; i < 1_000_000; i++) {
    compute(i);
    if (i % 10000 === 0) {
      await new Promise(r => setTimeout(r, 0)); // yield
    }
  }
}
```

---

## 8. Các Traps Phổ Biến

### Trap 1: Tưởng Async = Parallel

```javascript
// ❌ Async KHÔNG phải parallel
async function processAll(items) {
  return items.map(item => heavyTask(item)); // KHÔNG await!
  // → Trả về array of Promises PENDING
  // → Tasks chưa chạy!
}

// ✅ Parallel: Promise.all
async function processAll(items) {
  return Promise.all(items.map(item => heavyTask(item)));
}

// ✅ Limited parallel: Promise.all với chunking
async function processAllLimited(items, concurrency = 4) {
  const chunks = [];
  for (let i = 0; i < items.length; i += concurrency) {
    chunks.push(items.slice(i, i + concurrency));
  }

  const results = [];
  for (const chunk of chunks) {
    results.push(...await Promise.all(chunk.map(item => heavyTask(item))));
  }
  return results;
}
```

### Trap 2: Shared State Giữa Workers

```javascript
// ❌ Web Worker: data được COPY — không shared
const worker = new Worker('worker.js');
let sharedData = { value: 0 };

worker.postMessage({ data: sharedData }); // COPY
sharedData.value = 100;                   // Worker không thấy!
worker.postMessage({ increment: true });

worker.onmessage = (e) => {
  console.log(e.data.value); // Vẫn là 0, không phải 1!
};

// ✅ Muốn shared: dùng SharedArrayBuffer
// Hoặc: postMessage sau khi thay đổi
worker.postMessage({ data: sharedData }); // Gửi lại sau khi update
```

### Trap 3: setTimeout(fn, 0) Không Đảm Bảo Immediate

```javascript
// ❌ setTimeout(fn, 0) không chạy ngay sau current task
setTimeout(() => console.log('A'), 0);
Promise.resolve().then(() => console.log('B'));
console.log('C');

// Output: C, B, A (không phải C, A, B!)
// → setTimeout vào macrotask queue
// → Promise.then vào microtask queue
// → Microtasks chạy TRƯỚC macrotasks

// ✅ Dùng queueMicrotask cho guaranteed next tick
queueMicrotask(() => console.log('A'));
Promise.resolve().then(() => console.log('B'));
console.log('C');
// Output: C, A, B (queueMicrotask chạy sau sync nhưng trước macrotask)

// ✅ Dùng MessageChannel cho guaranteed next frame
const channel = new MessageChannel();
channel.port1.onmessage = () => console.log('A');
channel.port2.postMessage(null);
console.log('C');
// Output: C, A
```

### Trap 4: CPU-bound vs I/O-bound Confusion

```javascript
// ❌ Nhầm lẫn
// I/O-bound: fetch(), fs.readFile() → event loop xử lý tốt
// CPU-bound: computation → event loop BLOCKS

// I/O-bound: async/await ĐỦ
async function fetchAll() {
  const results = await Promise.all(urls.map(url => fetch(url)));
  return Promise.all(results.map(r => r.json()));
}

// CPU-bound: CẦN Worker
const worker = new Worker('compute.js');
// Main thread FREE

// ❌ Đừng dùng Worker cho mọi thứ
// Worker overhead (serialization/deserialization) có thể chậm hơn benefit
// Chunked async: thường đủ cho tasks < 1 giây
```

### Trap 5: Memory Leak Trong Event Loop

```javascript
// ❌ Closure giữ references trong callbacks
function createHandler() {
  const bigData = new Array(100_000); // 10MB

  return function handler() {
    // Closure giữ bigData vĩnh viễn
    return bigData.length;
  };
}

const handler = createHandler();
setInterval(handler, 1000); // bigData không thể GC!

// ✅ Fix: cleanup
const handler = createHandler();
const intervalId = setInterval(handler, 1000);

function cleanup() {
  clearInterval(intervalId); // bigData được GC
}

// ✅ Hoặc: chỉ capture những gì cần
function createHandler() {
  const bigData = new Array(100_000);
  const neededLength = bigData.length; // chỉ capture primitive

  return function handler() {
    return neededLength; // bigData không bị giữ
  };
}
```

---

## 9. Câu Hỏi Phỏng Vấn

### Câu 1: Process vs Thread — giải thích sự khác nhau?

**Trả lời:** Process có bộ nhớ riêng (heap, stack, address space hoàn toàn tách biệt), tạo mới chậm (~50-200ms), giao tiếp qua IPC. Thread chia sẻ heap và code với process cha, tạo nhanh (~1-10ms), giao tiếp qua shared memory. Thread crash → process crash → tất cả threads die. Process crash → process khác không bị ảnh hưởng. Multi-core: mỗi process trên 1 core, mỗi thread trong process có thể trên cores khác nhau.

---

### Câu 2: JavaScript là single-threaded — vậy làm sao handle concurrency?

**Trả lời:** JavaScript dùng event loop để xử lý concurrency (đan xen tasks trên 1 thread): async callbacks, Promises, timers đều đan xen trên event loop. Nhưng JS KHÔNG có parallelism thật sự trên main thread. CPU-bound tasks block event loop. Để parallelism: dùng Web Workers (browser), Worker Threads (Node.js), hoặc Child Processes. I/O-bound tasks: event loop đủ vì I/O callbacks chạy trên libuv thread pool.

---

### Câu 3: Concurrency vs Parallelism — giải thích với ví dụ?

**Trả lời:** Concurrency = đan xen nhiều tasks trong cùng khoảng thời gian, có thể trên 1 core. Ví dụ: 1 cashier xử lý nhiều khách, chuyển qua lại giữa order-taking và payment. Parallelism = xử lý nhiều tasks cùng lúc thật sự, cần multi-core. Ví dụ: 4 cashiers cùng xử lý 4 khách một lúc. JavaScript event loop = concurrency nhưng KHÔNG parallelism trên main thread.

---

### Câu 4: Race condition là gì và làm sao tránh?

**Trả lời:** Race condition xảy ra khi nhiều threads truy cập shared state và kết quả phụ thuộc vào thứ tự execution. Ví dụ: 2 threads cùng increment counter → kết quả sai. Cách tránh: (1) **Mutex/Lock**: chỉ một thread truy cập tại một thời điểm. (2) **Atomic operations**: dùng Atomics cho SharedArrayBuffer. (3) **Immutable data**: không mutate shared state, dùng immutable updates. (4) **Single-threaded**: JS main thread không có race condition trên shared state.

---

### Câu 5: Context switch là gì, chi phí bao nhiêu?

**Trả lời:** Context switch = OS lưu trạng thái (registers, PC, stack pointer) của process/thread hiện tại, load trạng thái của process/thread khác, chuyển quyền điều khiển. Chi phí: process context switch ~50-200 microseconds, thread context switch ~10-30 microseconds (vì chia sẻ address space, không cần switch page tables). Quá nhiều context switches → overhead cao, performance giảm. Trong JavaScript: microtask/macrotask switches rất nhanh vì cùng process, nhưng heavy computation block → không switch được.

---

### Câu 6: Khi nào nên dùng Worker/Process thay vì async?

**Trả lời:** Dùng async/event loop khi: I/O-bound (fetch, file I/O, DB queries) — event loop tận dụng wait time. Dùng Worker/Process khi: (1) **CPU-bound**: computation nặng (crypto, image processing, data analysis) — không block event loop. (2) **Long-running tasks**: >1 giây — tránh UX freeze. (3) **Parallelism thật sự**: cần multi-core. Lưu ý: Worker có overhead (serialization), dùng cho tasks đủ lớn mới đáng.

---

## 10. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  PROCESS vs THREAD                                             │
│                                                               │
│  PROCESS                                                       │
│  ├── Bộ nhớ riêng hoàn toàn (isolated)                    │
│  ├── Tạo nặng (~50-200ms), context switch nặng            │
│  ├── Giao tiếp: IPC (pipes, sockets)                       │
│  ├── Fault tolerance cao                                    │
│  └── Dùng khi: cần isolation, multi-core HTTP servers     │
│                                                               │
│  THREAD                                                        │
│  ├── Chia sẻ heap, code, data với process cha             │
│  ├── Tạo nhẹ (~1-10ms), context switch nhẹ               │
│  ├── Giao tiếp: shared memory + mutex                     │
│  ├── Fault tolerance thấp (thread die → process die)      │
│  └── Dùng khi: cần shared state, parallelism              │
│                                                               │
│  JAVASCRIPT                                                    │
│  ├── Single-threaded event loop = CONCURRENCY              │
│  ├── KHÔNG parallelism trên main thread                    │
│  ├── Dùng: Web Workers / Worker Threads / Child Processes │
│  └── Dùng: async/await cho I/O-bound                      │
│                                                               │
│  ⚠️ Async ≠ Parallel                                     │
│  ⚠️ Race conditions khi nhiều threads truy cập shared     │
│     state → dùng mutex/atomics                              │
│  ⚠️ Heavy computation → block event loop → dùng Worker  │
│  ⚠️ setTimeout(fn, 0) ≠ immediate; Promise.then < macrotask│
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Phân biệt được process vs thread về memory và overhead
- [ ] Hiểu JavaScript single-threaded + event loop
- [ ] Phân biệt được concurrency vs parallelism
- [ ] Hiểu race condition và cách tránh (mutex, atomics)
- [ ] Biết khi nào dùng Worker vs async
- [ ] Hiểu context switch cost
- [ ] Trả lời được 5/6 câu hỏi phỏng vấn
- [ ] Tránh được 5 traps phổ biến

---

*Last updated: 2026-04-01*
