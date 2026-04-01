# SharedArrayBuffer & Atomics — Shared Memory Trong JavaScript

## Câu hỏi mở đầu

```javascript
// Web Workers giao tiếp bằng postMessage
// Data được COPIED giữa main thread và worker
// → Chậm với data lớn
// → Không có true shared state

// SharedArrayBuffer: TRUE shared memory
// Main thread và worker thấy CÙNG một memory region!
// → Zero-copy
// → Real-time data sharing

const buffer = new SharedArrayBuffer(1024 * 1024); // 1MB
const arr = new Int32Array(buffer);

worker.postMessage({ buffer }, [buffer]);
// ⚠️ Transfer — main thread mất quyền truy cập!

// ✅ Đúng: không transfer SharedArrayBuffer!
worker.postMessage({ buffer }); // Main thread vẫn truy cập được!
```

**SharedArrayBuffer cho phép nhiều threads đọc/ghi cùng một memory region mà không cần copying.** Đây là nền tảng cho high-performance applications: game engines, real-time collaboration, scientific computing. Quan trọng là phải dùng Atomics để tránh race conditions.

---

## 1. SharedArrayBuffer — True Shared Memory

### Điều Kiện: Cross-Origin Isolation

```javascript
// SharedArrayBuffer bị DISABLED nếu không có headers đúng
// Vì lý do security (Spectre/Meltdown vulnerabilities)

// ⚠️ Trước khi dùng: kiểm tra support
if (typeof SharedArrayBuffer !== 'undefined') {
  console.log('SharedArrayBuffer supported ✅');
} else {
  console.log('SharedArrayBuffer NOT supported ❌');
  console.log('Need COOP/COEP headers');
}

// Kiểm tra cross-origin isolation
function checkCrossOriginIsolation() {
  return (
    self.crossOriginIsolated === true
  );
}
```

```bash
# Server-side headers (Node.js example)

# Express:
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

# Nginx:
# add_header Cross-Origin-Opener-Policy "same-origin";
# add_header Cross-Origin-Embedder-Policy "require-corp";

# Vite dev server:
# vite.config.js
export default {
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
};
```

### Tạo và Sử Dụng

```javascript
// Tạo SharedArrayBuffer
const buffer = new SharedArrayBuffer(1024 * 1024); // 1MB
// Hoặc dùng với ArrayBufferView
const sharedInt32 = new Int32Array(buffer); // View vào buffer
const sharedFloat64 = new Float64Array(buffer); // Float view

// Tạo view
const arr = new Int32Array(buffer);
const byteView = new Uint8Array(buffer);

// Truy cập như ArrayBuffer thông thường
arr[0] = 42;
console.log(arr[0]); // 42

// Share với worker — KHÔNG transfer!
const worker = new Worker('shared-worker.js');
worker.postMessage({ buffer }); // Không có second argument!
```

### SharedArrayBuffer vs Regular ArrayBuffer

```
┌──────────────────────┬──────────────────────┬──────────────────────┐
│                      │ Regular ArrayBuffer    │ SharedArrayBuffer     │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Shared between       │ No (each thread có    │ Yes (same memory     │
│ threads              │ copy riêng)           │ region)              │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ postMessage          │ Copy hoặc Transfer    │ KHÔNG transfer!     │
│                     │ (source detached)      │ (source still valid) │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Speed                │ Copy: chậm            │ Zero-copy           │
│                      │ Transfer: nhanh nhưng │ (fastest option)    │
│                      │ source detached       │                     │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Race conditions      │ Không (mỗi thread có   │ Có (cùng memory)    │
│                     │ copy riêng)           │ → Cần Atomics       │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Use case            │ Worker communication   │ Real-time data      │
│                      │ (small-medium data)   │ High-frequency share │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

---

## 2. Atomics — An Toàn Truy Cập

### Tại Sao Cần Atomics

```javascript
// ❌ Race condition: đọc → modify → ghi không atomic!
sharedCounter[0]++; // NOT ATOMIC!

// Thread A: read counter[0] = 0
// Thread B: read counter[0] = 0
// Thread A: increment → 1
// Thread B: increment → 1 (overwrite!)
// Thread A: write 1
// Thread B: write 1
// Result: counter = 1 ❌ (should be 2!)

// ✅ Atomics: đọc → modify → ghi = 1 operation ATOMIC
Atomics.add(sharedCounter, 0, 1); // Atomic increment

// Thread A: Atomics.add → read + inc + write = 1 step
// Thread B: đợi Thread A xong → thực hiện
// Result: counter = 2 ✅
```

### Atomics Operations Chi Tiết

```javascript
const sab = new SharedArrayBuffer(1024);
const int32 = new Int32Array(sab);
const float64 = new Float64Array(sab);

// ── INTEGER OPERATIONS (Int32Array) ──

// Atomic add
Atomics.add(int32, 0, 1);    // int32[0] += 1 → return old value

// Atomic subtract
Atomics.sub(int32, 0, 1);    // int32[0] -= 1 → return old value

// Atomic bitwise AND
Atomics.and(int32, 0, 0b1111);  // int32[0] &= 0b1111

// Atomic bitwise OR
Atomics.or(int32, 0, 0b1111);    // int32[0] |= 0b1111

// Atomic bitwise XOR
Atomics.xor(int32, 0, 0b1111);  // int32[0] ^= 0b1111

// Atomic exchange — ghi giá trị, return giá trị cũ
const oldValue = Atomics.exchange(int32, 0, 99); // int32[0] = 99, return old

// Atomic compare-exchange (CAS) — phổ biến nhất!
const exchanged = Atomics.compareExchange(int32, 0, 42, 100);
// if int32[0] === 42 → int32[0] = 100, return 42
// else → không thay đổi, return int32[0]

// ── LOAD/STORE ──

Atomics.load(int32, 0);    // Atomic read — luôn dùng thay vì int32[0]
Atomics.store(int32, 0, 42); // Atomic write — luôn dùng thay vì int32[0] = 42
```

### Atomic Counter Pattern

```javascript
// Atomic counter với compare-exchange
class AtomicCounter {
  constructor(buffer, index = 0) {
    this.int32 = new Int32Array(buffer);
    this.index = index;
  }

  increment() {
    return Atomics.add(this.int32, this.index, 1);
  }

  decrement() {
    return Atomics.sub(this.int32, this.index, 1);
  }

  get() {
    return Atomics.load(this.int32, this.index);
  }

  set(value) {
    Atomics.store(this.int32, this.index, value);
  }

  // CAS: chỉ increment nếu current value === expected
  compareIncrement(expected) {
    return Atomics.compareExchange(this.int32, this.index, expected, expected + 1);
  }
}

// Usage
const counter = new AtomicCounter(sharedBuffer);
console.log(counter.increment()); // 0 (return old value, now 1)
console.log(counter.increment()); // 1 (return old value, now 2)
console.log(counter.get());       // 2
```

---

## 3. Atomics.wait và notify — Synchronization

### wait() — Blocking

```javascript
// Atomics.wait: BLOCK thread cho đến khi condition met
// ⚠️ Chỉ hoạt động TRONG Worker/thread, KHÔNG trong main thread!

const shared = new Int32Array(sharedBuffer);

// Blocking wait — không làm gì cho đến khi buffer[index] === expected
const result = Atomics.wait(shared, index, expected, timeout);

// Returns:
// 'ok' — được wake bởi notify
// 'not-equal' — buffer[index] !== expected ngay lập tức
// 'timed-out' — timeout exceeded

// Ví dụ: đợi flag = 1
while (Atomics.load(shared, 0) !== 1) {
  // Spin-wait (CPU-intensive!) hoặc:
  Atomics.wait(shared, 0, 1, 1000); // đợi 1 giây
}
```

### notify() — Waking

```javascript
// Atomics.notify: wake up threads đang wait

Atomics.notify(shared, index, count);
// index: buffer index đang wait
// count: số threads cần wake (Infinity = tất cả)

// Ví dụ: wake up 1 worker
Atomics.notify(shared, 0, 1);

// Wake up tất cả workers
Atomics.notify(shared, 0, Infinity);
```

### Complete Producer-Consumer Pattern

```javascript
// shared-buffer.js — thiết lập shared buffer
const BUFFER_SIZE = 1024;
const buffer = new SharedArrayBuffer(BUFFER_SIZE);
const data = new Uint8Array(buffer);
const meta = new Int32Array(new SharedArrayBuffer(16));

// meta[0] = flags (0=empty, 1=filled)
// meta[1] = data length
// meta[2] = producer count (đang produce)
// meta[3] = consumer count (đang consume)

module.exports = { buffer, data, meta, BUFFER_SIZE };
```

```javascript
// producer.js — Producer worker
const { parentPort } = require('worker_threads');
const { data, meta, BUFFER_SIZE } = require('./shared-buffer');

let itemCount = 0;

while (itemCount < 100) {
  // Chờ buffer empty
  while (Atomics.load(meta, 0) === 1) {
    // Buffer full, đợi consumers
    Atomics.wait(meta, 0, 1, 1000);
    if (Atomics.load(meta, 0) === 1) {
      // Still full after timeout
    }
  }

  // Produce item
  const length = Math.min(BUFFER_SIZE - 1, Math.floor(Math.random() * 100) + 1);
  for (let i = 0; i < length; i++) {
    data[i] = Math.floor(Math.random() * 256);
  }
  Atomics.store(meta, 1, length);

  // Signal: buffer filled
  Atomics.store(meta, 0, 1);
  Atomics.notify(meta, 0, Infinity); // Wake all consumers

  itemCount++;
  parentPort.postMessage({ produced: itemCount });
}

parentPort.postMessage({ done: true });
```

```javascript
// consumer.js — Consumer worker
const { parentPort } = require('worker_threads');
const { data, meta } = require('./shared-buffer');

let consumedCount = 0;

while (consumedCount < 100) {
  // Chờ buffer filled
  while (Atomics.load(meta, 0) === 0) {
    // Buffer empty, đợi producers
    Atomics.wait(meta, 0, 0, 1000);
  }

  // Consume item
  const length = Atomics.load(meta, 1);
  const item = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    item[i] = data[i];
  }

  // Signal: buffer empty
  Atomics.store(meta, 0, 0);
  Atomics.notify(meta, 0, Infinity); // Wake all producers

  consumedCount++;
  parentPort.postMessage({ consumed: consumedCount, length });
}

parentPort.postMessage({ done: true });
```

---

## 4. Lock-Free Data Structures

### Lock-Free Stack

```javascript
// Lock-free MPSC (Multi-Producer Single-Consumer) stack
// Nhiều threads push, một thread pop

class LFStack {
  constructor(capacity) {
    this.buffer = new SharedArrayBuffer(capacity * 8);
    this.int64 = new BigInt64Array(this.buffer);
    this.capacity = capacity;

    // Stack pointer: -1 = empty
    Atomics.store(this.int64, 0, BigInt(-1));
  }

  push(value) {
    let head;
    let newHead;

    do {
      head = Number(Atomics.load(this.int64, 0));
      const nodeIndex = this._allocate(value);
      if (nodeIndex === -1) return false; // Stack full

      newHead = nodeIndex;
    } while (
      Atomics.compareExchange(
        this.int64, 0,
        BigInt(head), BigInt(newHead)
      ) !== BigInt(head)
    );

    return true;
  }

  pop() {
    let head;
    let next;

    do {
      head = Number(Atomics.load(this.int64, 0));
      if (head === -1) return null; // Empty

      next = this._getNext(head);
    } while (
      Atomics.compareExchange(
        this.int64, 0,
        BigInt(head), BigInt(next)
      ) !== BigInt(head)
    );

    return this._free(head);
  }

  _allocate(value) { /* allocate from node buffer */ }
  _getNext(index) { /* get next pointer */ }
  _free(index) { /* free node and return value */ }
}
```

### Ring Buffer — Lock-Free

```javascript
// Lock-free ring buffer cho producer-consumer
class LFRingBuffer {
  constructor(capacity) {
    this.capacity = capacity;
    this.buffer = new SharedArrayBuffer(capacity * 8);
    this.slots = new Float64Array(this.buffer);

    // Metadata
    const metaBuffer = new SharedArrayBuffer(24);
    this.head = new Int32Array(metaBuffer, 0, 4);   // read position
    this.tail = new Int32Array(metaBuffer, 8, 4);   // write position
    this.count = new Int32Array(metaBuffer, 16, 4); // item count

    Atomics.store(this.head, 0, 0);
    Atomics.store(this.tail, 0, 0);
    Atomics.store(this.count, 0, 0);
  }

  push(value) {
    const currentCount = Atomics.load(this.count, 0);
    if (currentCount >= this.capacity) return false; // Full

    const tail = Atomics.load(this.tail, 0);
    this.slots[tail] = value;

    // Update tail atomically
    const newTail = (tail + 1) % this.capacity;
    Atomics.store(this.tail, 0, newTail);
    Atomics.add(this.count, 0, 1);

    // Notify one waiting reader
    Atomics.notify(this.count, 0, 1);

    return true;
  }

  pop(timeout = 0) {
    const currentCount = Atomics.load(this.count, 0);
    if (currentCount === 0) {
      if (timeout > 0) {
        Atomics.wait(this.count, 0, 0, timeout);
        if (Atomics.load(this.count, 0) === 0) return null;
      } else {
        return null;
      }
    }

    const head = Atomics.load(this.head, 0);
    const value = this.slots[head];

    const newHead = (head + 1) % this.capacity;
    Atomics.store(this.head, 0, newHead);
    Atomics.sub(this.count, 0, 1);

    return value;
  }
}
```

---

## 5. Security — COOP và COEP

### Tại Sao Cần Headers

```
┌──────────────────────────────────────────────────────────────┐
│  SPECTRE/MELTDOWN ATTACKS                                       │
│                                                               │
│  CPU Speculative Execution:                                    │
│  │  attacker reads array[secret];                           │
│  │  if (secret < len) array[secret * 512] // cache hit   │
│  │  // → cache timing reveals secret!                     │
│                                                               │
│  SharedArrayBuffer:                                            │
│  │  Attacker Worker → SharedArrayBuffer timing →             │
│  │  → Precise cache timing attacks →                        │
│  │  → Read arbitrary process memory ← SECURITY RISK!       │
│                                                               │
│  COOP/COEP Headers:                                           │
│  │  Isolate browsing contexts → prevent cross-origin      │
│  │  → Mitigate Spectre → SharedArrayBuffer safe         │
└──────────────────────────────────────────────────────────────┘
```

### Headers Chi Tiết

```javascript
// Node.js / Express
const express = require('express');
const app = express();

app.use((req, res, next) => {
  // Required for SharedArrayBuffer
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// ⚠️ COEP: require-corp có thể break:
  // - Cross-origin iframes không có CORP headers
  // - Third-party resources không có proper CORS/CORP
  // - Some browser extensions

// Testing: kiểm tra crossOriginIsolated
// chrome://inspect → console:
console.log(self.crossOriginIsolated); // true = headers OK
```

```javascript
// Vite config cho dev
export default {
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
};
```

### When COOP/COEP Are NOT Needed

```javascript
// SharedArrayBuffer TRONG cùng origin — workers cùng page
// Không cần COOP/COEP!

// worker.js cùng origin:
const worker = new Worker('./worker.js');
// → SharedArrayBuffer hoạt động mà không cần headers

// COOP/COEP CẦN khi:
  // Dùng SharedArrayBuffer với cross-origin workers
  // Dùng SharedArrayBuffer trong iframes
  // Cần cross-origin isolation
```

---

## 6. Use Cases Thực Tế

### Real-Time Collaboration (Google Docs-style)

```javascript
// collaborative-cursor.js — real-time cursor positions

const cursorBuffer = new SharedArrayBuffer(64); // 8 cursors × 8 bytes
const cursors = {
  // cursorIndex * 2 = x, cursorIndex * 2 + 1 = y
  buffer: new Float64Array(cursorBuffer),
  myIndex: null
};

// Worker xử lý cursor updates 60fps
const worker = new Worker('cursor-processor.js');
worker.postMessage({ cursorBuffer }); // No transfer!

// Update cursor position
function updateMyCursor(x, y) {
  if (cursors.myIndex === null) return;

  const i = cursors.myIndex * 2;
  Atomics.store(cursors.buffer, i, x);
  Atomics.store(cursors.buffer, i + 1, y);
  Atomics.notify(cursors.buffer, i, 1);
}

// Worker processor
// cursor-processor.js
self.onmessage = (e) => {
  const { cursorBuffer } = e.data;
  const buffer = new Float64Array(cursorBuffer);

  function processCursors() {
    const positions = [];
    for (let i = 0; i < 8; i++) {
      const x = Atomics.load(buffer, i * 2);
      const y = Atomics.load(buffer, i * 2 + 1);
      positions.push({ x, y });
    }
    renderCursors(positions);
    requestAnimationFrame(processCursors);
  }

  processCursors();
};
```

### Game Engine — Physics Thread

```javascript
// game-engine.js — physics + render thread

const stateBuffer = new SharedArrayBuffer(4096);
const state = {
  position: new Float32Array(stateBuffer, 0, 3),     // x, y, z
  velocity: new Float32Array(stateBuffer, 12, 3),   // vx, vy, vz
  rotation: new Float32Array(stateBuffer, 24, 4),  // quat
  flags: new Int32Array(stateBuffer, 40, 1)        // dirty flag
};

// Physics worker — 60fps
const physicsWorker = new Worker('physics.js');
physicsWorker.postMessage({ stateBuffer }); // No transfer!

// Main thread — render 60fps
function render() {
  // Đọc state (thread-safe vì physics worker đang write)
  const pos = state.position;
  const rot = state.rotation;

  // Render scene với pos và rot
  renderer.updateMesh(pos, rot);

  // Đợi next physics update
  // Physics worker tự notify khi done
  requestAnimationFrame(render);
}

// physics.js
self.onmessage = (e) => {
  const { stateBuffer } = e.data;
  const position = new Float32Array(stateBuffer, 0, 3);
  const velocity = new Float32Array(stateBuffer, 12, 3);
  const flags = new Int32Array(stateBuffer, 40, 1);

  function physicsLoop() {
    // Apply physics
    for (let i = 0; i < 3; i++) {
      position[i] += velocity[i] * 0.016; // 60fps timestep
    }

    // Signal update done
    Atomics.store(flags, 0, 1);
    Atomics.notify(flags, 0, 1);

    setTimeout(physicsLoop, 16); // 60fps
  }

  physicsLoop();
};
```

### High-Frequency Trading Data

```javascript
// trading-data.js — real-time market data

const TICK_BUFFER_SIZE = 1000;
const tickBuffer = new SharedArrayBuffer(TICK_BUFFER_SIZE * 16); // 16 bytes/tick
const meta = new SharedArrayBuffer(24);

// Tick format: [price: float64][volume: int32][timestamp: int32]
const ticks = {
  prices: new Float64Array(tickBuffer, 0, TICK_BUFFER_SIZE),
  volumes: new Int32Array(tickBuffer, TICK_BUFFER_SIZE * 8, TICK_BUFFER_SIZE),
  timestamps: new Int32Array(tickBuffer, TICK_BUFFER_SIZE * 12, TICK_BUFFER_SIZE),
  head: new Int32Array(meta, 0, 4),
  tail: new Int32Array(meta, 8, 4),
  count: new Int32Array(meta, 16, 4)
};

// Market data worker — nhận data từ exchange
const marketWorker = new Worker('market-data.js');
marketWorker.postMessage({ tickBuffer, meta }); // No transfer!

// Main thread đọc ticks
function processTicks() {
  const count = Atomics.load(ticks.count, 0);
  const tail = Atomics.load(ticks.tail, 0);

  for (let i = 0; i < count; i++) {
    const idx = (tail + i) % TICK_BUFFER_SIZE;
    const price = Atomics.load(ticks.prices, idx);
    const volume = Atomics.load(ticks.volumes, idx);
    const timestamp = Atomics.load(ticks.timestamps, idx);

    // Process tick
    updateChart(price, volume);
    checkAlerts(price);
  }

  requestAnimationFrame(processTicks);
}
```

---

## 7. Các Traps Phổ Biến

### Trap 1: Transfer SharedArrayBuffer Thay Vì Share

```javascript
// ❌ Transfer SharedArrayBuffer — main thread mất quyền truy cập!
worker.postMessage({ buffer }, [buffer]);
// buffer.byteLength === 0 ở main thread! ❌

// ✅ Share: không có second argument
worker.postMessage({ buffer }); // OK! Main thread vẫn truy cập được
```

### Trap 2: Atomics.wait Trong Main Thread

```javascript
// ❌ Atomics.wait KHÔNG hoạt động trong main thread!
Atomics.wait(shared, 0, 0, 1000);
// Error: TypeError: Atomics.wait not allowed here
// (Main thread cannot be blocked by GC/security reasons)

// ✅ Main thread: dùng setTimeout/requestAnimationFrame
function waitForCondition(condition, callback) {
  if (condition()) {
    callback();
  } else {
    setTimeout(() => waitForCondition(condition, callback), 10);
  }
}
```

### Trap 3: Deadlock

```javascript
// ❌ Deadlock — 2 threads chờ nhau vô hạn
// Thread A: wait(flag, 0, 0) → đợi Thread B signal flag[0] = 1
// Thread B: wait(flag, 1, 0) → đợi Thread A signal flag[1] = 1
// → DEADLOCK!

// ✅ Fix: tránh circular waits
// ✅ Fix: luôn signal trước khi wait
// ✅ Fix: dùng timeout cho wait()
Atomics.wait(shared, 0, 0, 5000); // Timeout 5s
```

### Trap 4: Busy-Waiting (Spin-Wait)

```javascript
// ❌ Spin-wait: CPU 100% trong khi chờ!
while (Atomics.load(shared, 0) === 0) {
  // Chờ! CPU 100%! ❌
}

// ✅ Dùng Atomics.wait để sleep hiệu quả
Atomics.wait(shared, 0, 0); // CPU yield khi sleep

// ✅ Hoặc dùng setTimeout cho main thread
```

### Trap 5: SharedArrayBuffer Without Cross-Origin Isolation

```javascript
// ❌ Không check crossOriginIsolated trước khi dùng
const buffer = new SharedArrayBuffer(1024); // Có thể throw!

// ✅ Luôn check trước
if (self.crossOriginIsolated) {
  const buffer = new SharedArrayBuffer(1024);
  // Dùng...
} else {
  // Fallback: dùng regular ArrayBuffer với message passing
  console.warn('SharedArrayBuffer not available, using fallback');
}
```

---

## 8. Câu Hỏi Phỏng Vấn

### Câu 1: Tại sao cần COOP/COEP headers?

**Trả lời:** SharedArrayBuffer ban đầu bị disable vì Spectre/Meltdown attacks — attackers có thể dùng timing attacks trên shared memory để đọc arbitrary process memory. COOP (Cross-Origin-Opener-Policy: same-origin) ngăn window.open() từ cross-origin pages. COEP (Cross-Origin-Embedder-Policy: require-corp) đảm bảo tất cả resources có proper CORS/CORP headers. Cả hai headers tạo "cross-origin isolated" context, giảm attack surface của Spectre.

---

### Câu 2: Atomics vs Locks — ưu điểm gì?

**Trả lời:** Atomics là **lock-free** — threads không bị blocked, không có OS-level scheduling overhead, thường nhanh hơn locks. Atomics đảm bảo read-modify-write atomic. Nhưng Atomics chỉ hoạt động trên SharedArrayBuffer và chỉ cho simple operations (add, compare-exchange, etc.). Complex operations (như bounded queue) cần locks hoặc lock-free algorithms phức tạp hơn.

---

### Câu 3: Deadlock prevention strategies?

**Trả lời:** (1) **Lock ordering**: luôn acquire locks theo thứ tự cố định. (2) **Timeout**: luôn có timeout cho wait(), không bao giờ infinite wait. (3) **One lock**: tránh multiple locks khi có thể. (4) **Lock-free**: dùng atomic operations thay vì locks. (5) **Try-lock**: kiểm tra trước khi lock. (6) **Deadlock detection**: monitor wait chains, alert khi phát hiện.

---

### Câu 4: SharedArrayBuffer vs Message Passing?

**Trả lời:** Message Passing (postMessage): (1) Data được copied — source không đổi. (2) Transfer: nhanh nhưng source detached. (3) Dùng cho: messages, configs, moderate data. SharedArrayBuffer: (1) True shared memory — zero copy. (2) Threads thấy cùng memory region. (3) Dùng cho: real-time data, high-frequency updates, large buffers. SharedArrayBuffer nhanh hơn cho frequent updates, nhưng phức tạp hơn (cần Atomics, có thể deadlock).

---

### Câu 5: Performance considerations?

**Trả lời:** (1) **False sharing**: nhiều threads đọc/ghi cùng cache line → performance chậm. Pad structures để tránh. (2) **Cache coherence**: mỗi write → invalidate cache lines trên cores khác → overhead. (3) **Atomics.wait**: OS yields thread khi sleep, nhưng wakeup latency có thể ~microseconds. (4) **Alignment**: align data structures để tránh spanning multiple cache lines. (5) **Batching**: đọc/ghi nhiều values atomically bằng compare-exchange loop.

---

## 9. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  SHAREDARRAYBUFFER & ATOMICS                                   │
│                                                               │
│  SHAREDARRAYBUFFER                                             │
│  ├── True shared memory giữa threads                       │
│  ├── KHÔNG transfer khi share (worker.postMessage(buf))      │
│  ├── Zero-copy — fastest inter-thread communication          │
│  └── Cần COOP/COEP headers (Cross-Origin Isolation)        │
│                                                               │
│  ATOMICS                                                       │
│  ├── add, sub, and, or, xor, not                           │
│  ├── load, store, exchange, compareExchange              │
│  ├── wait(), notify() — synchronization                   │
│  ├── Chỉ work trên SharedArrayBuffer                    │
│  └── Không hoạt động wait() trong main thread!           │
│                                                               │
│  SYNCHRONIZATION PATTERNS                                     │
│  ├── Producer-Consumer: flags + wait/notify               │
│  ├── Lock-Free Stack/Queue: CAS loops                    │
│  ├── Ring Buffer: atomic head/tail updates              │
│  └── Critical Section: mutex/Atomics                    │
│                                                               │
│  ⚠️ Atomics.wait chỉ trong Workers, không main thread  │
│  ⚠️ Luôn có timeout cho wait() — tránh deadlock        │
│  ⚠️ SharedArrayBuffer cần crossOriginIsolated = true  │
│  ⚠️ Spin-waiting tốn CPU — dùng wait() để sleep       │
│  ⚠️ Check SharedArrayBuffer support trước khi dùng     │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Hiểu SharedArrayBuffer vs regular ArrayBuffer
- [ ] Cấu hình được COOP/COEP headers
- [ ] Dùng được Atomics cho atomic operations
- [ ] Implement được Producer-Consumer với wait/notify
- [ ] Implement được Lock-Free data structures
- [ ] Tránh được 5 traps phổ biến
- [ ] Trả lời được 5/6 câu hỏi phỏng vấn
- [ ] Phân biệt được khi nào dùng SharedArrayBuffer vs message passing

---

*Last updated: 2026-04-01*

---

*Tiếp theo: **Chương 05 — Memory & Performance***
