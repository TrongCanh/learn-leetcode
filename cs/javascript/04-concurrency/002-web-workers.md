# Web Workers — Parallelism Trong Trình Duyệt

## Câu hỏi mở đầu

```javascript
// Heavy computation trên main thread → UI freeze hoàn toàn
function computePrimes(count) {
  // 10 giây CPU-bound computation
  // → User không tương tác được trong 10 giây
  // → Browser hiển thị "Page Unresponsive" dialog
}

computePrimes(10000000); // ❌ UI freeze 10 giây!

// Giải pháp: Web Worker — computation trên separate thread
const worker = new Worker('primes.js');
worker.postMessage({ count: 10000000 });
worker.onmessage = (e) => console.log('Primes:', e.data.result);

// ✅ UI vẫn responsive trong 10 giây!
```

**Web Workers là giải pháp chuẩn để chạy JavaScript trên separate thread trong trình duyệt.** Chúng giải phóng main thread khỏi CPU-bound tasks, giữ UI smooth. Quan trọng là hiểu rõ communication model, limitations, và khi nào nên dùng.

---

## 1. Web Worker Cơ Bản

### Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│  BROWSER PROCESS                                                │
│                                                               │
│  Main Thread (JS Engine):                                     │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Event Loop, DOM, UI Rendering                      │  │
│  │  Canvas, CSS, Layout, Compositing                   │  │
│  │  ← Web Worker communication qua postMessage        │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                               │
│  Web Worker Thread:                                          │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Separate JS Engine + Event Loop                   │  │
│  │  Không có DOM, không có window/document            │  │
│  │  Isolated memory (structured clone)                 │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                               │
│  ⚠️ Communication: message passing, không share memory!   │
└─────────────────────────────────────────────────────────────┘
```

### Tạo Worker Đầu Tiên

```javascript
// main.js — main thread
const worker = new Worker('worker.js'); // Tạo worker từ file

// Gửi message đến worker
worker.postMessage({ type: 'start', data: [1, 2, 3, 4, 5] });

// Nhận message từ worker
worker.onmessage = (event) => {
  console.log('From worker:', event.data);
};

// Error handling
worker.onerror = (error) => {
  console.error('Worker error:', error.message, error.lineno);
};

// Terminate worker
worker.terminate(); // Force stop — không graceful
```

```javascript
// worker.js — worker thread
'use strict';

// Nhận message từ main thread
self.onmessage = (event) => {
  const { type, data } = event.data;

  if (type === 'start') {
    const result = heavyComputation(data);
    // Gửi kết quả về main thread
    self.postMessage({ result });
  }
};

// Tự terminate
self.close(); // Graceful stop

// Worker có global object riêng
console.log(self instanceof WorkerGlobalScope); // true
console.log(self.location.href);                // Worker script URL

function heavyComputation(data) {
  return data.map(x => x * x);
}
```

### Communication Channels

```javascript
// 1. postMessage + onmessage (đơn giản)
const worker = new Worker('worker.js');
worker.postMessage({ hello: 'world' });

// 2. Dedicated ports (chi tiết hơn)
const { port1, port2 } = new MessageChannel();
worker.postMessage({ port: port1 }, [port1]);
// Dùng port2 để communicate

// 3. MessageChannel riêng (cho communication giữa workers)
const channel = new MessageChannel();
const workerA = new Worker('worker-a.js', { port: channel.port1 });
const workerB = new Worker('worker-b.js', { port: channel.port2 });
```

---

## 2. Data Transfer — Copy vs Transfer

### Structured Clone — Copy (Mặc định)

```javascript
// Structured Clone: data được DEEP COPY giữa threads
// Changes in worker không ảnh hưởng main thread
// ⚠️ Chậm với data lớn (serialization + deserialization)

const bigArray = new Float64Array(1_000_000); // 8MB

worker.postMessage({ data: bigArray });
// → Copy toàn bộ 8MB → mất thời gian

// worker.js
self.onmessage = (event) => {
  const { data } = event.data;
  // data là COPY, không phải reference
  // Modify data không ảnh hưởng bigArray ở main thread
};
```

### Transferable Objects — Nhanh Hơn 10-100x

```javascript
// Transferable: chuyển QUYỀN SỞ HỮU (ownership transfer)
// Sender mất quyền truy cập sau khi transfer!
// ⚠️ Nhanh nhưng destructive!

const buffer = new ArrayBuffer(1024 * 1024); // 1MB

// Gửi với transfer list
worker.postMessage({ buffer }, [buffer]);

// Sau khi transfer:
// buffer ở main thread ĐÃ BỊ TRANSFERRED (length = 0, detached)
console.log(buffer.byteLength); // 0 ❌ Không còn quyền truy cập!

// worker.js
self.onmessage = (event) => {
  const { buffer } = event.data;
  // buffer ở worker — main thread không còn quyền!
  console.log(buffer.byteLength); // 1048576 ✅
};
```

### So Sánh Chi Tiết

```
┌──────────────────┬──────────────────────┬──────────────────────┐
│                  │ Structured Clone       │ Transferable          │
├──────────────────┼──────────────────────┼──────────────────────┤
│ Mechanism        │ Deep copy serialized   │ Ownership transfer    │
│ Speed            │ Chậm (serialize)       │ Nhanh (no copy)       │
│ Source after     │ Vẫn giữ nguyên        │ TRỞ NÊN DETACHED!    │
│ Memory           │ Gấp đôi temporarily    │ Không tăng            │
│ Types supported  │ Hầu hết types         │ ArrayBuffer,          │
│                  │                      │ MessagePort,          │
│                  │                      │ ReadableStream, etc.  │
│ Use case         │ Small-medium data      │ Large buffers, streams│
└──────────────────┴──────────────────────┴──────────────────────┘
```

### Practical Transfer Example

```javascript
// Ví dụ: xử lý image pixels
// 1. Lấy ImageData từ canvas
const imageData = ctx.getImageData(0, 0, width, height);

// 2. Tạo buffer từ pixels
const pixels = imageData.data.buffer; // ArrayBuffer

// 3. Transfer buffer (KHÔNG copy pixels)
worker.postMessage({ pixels }, [pixels]);

// 4. Main thread không còn truy cập pixels
// imageData.data vẫn OK nhưng không sync với worker

// worker.js
self.onmessage = (event) => {
  const { pixels } = event.data;
  const view = new Uint8ClampedArray(pixels);

  // Process pixels...
  for (let i = 0; i < view.length; i += 4) {
    // Grayscale
    const avg = (view[i] + view[i+1] + view[i+2]) / 3;
    view[i] = view[i+1] = view[i+2] = avg;
  }

  // Gửi pixels đã xử lý về
  self.postMessage({ pixels }, [pixels]); // Transfer lại
};
```

---

## 3. SharedArrayBuffer — Thực Sự Shared Memory

### Điều kiện bật

```javascript
// SharedArrayBuffer CẦN Cross-Origin Isolation
// Nếu không có headers đúng → SharedArrayBuffer bị disabled

// Server response headers:
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp

// Kiểm tra:
if (typeof SharedArrayBuffer !== 'undefined') {
  console.log('SharedArrayBuffer supported');
} else {
  console.log('Need COOP/COEP headers');
}
```

### Sử Dụng SharedArrayBuffer

```javascript
// main.js — Cần headers!
const sharedBuffer = new SharedArrayBuffer(1024); // 1KB
const sharedArray = new Int32Array(sharedBuffer);

// Gửi shared buffer đến worker
const worker = new Worker('shared-worker.js');
worker.postMessage({ sharedBuffer }, [sharedBuffer]);
// ⚠️ Transfer SharedArrayBuffer — main thread MẤT quyền truy cập!

// Sau khi transfer:
// sharedArray.byteLength === 0 ❌

// ✅ FIX: KHÔNG transfer SharedArrayBuffer
worker.postMessage({ sharedBuffer }); // Không có second argument!
```

```javascript
// shared-worker.js
self.onmessage = (event) => {
  const { sharedBuffer } = event.data;
  const sharedArray = new Int32Array(sharedBuffer);

  // Đọc/ghi trực tiếp trên shared memory
  sharedArray[0] = 42;

  // Gửi signal về main thread
  self.postMessage({ ready: true });
};
```

### Khi Nào Cần SharedArrayBuffer

```
DÙNG SharedArrayBuffer khi:
  ├── Real-time collaboration (Google Docs, Figma)
  ├── High-frequency data sharing (game loops, sensor data)
  ├── WASM memory sharing với JS
  └── Lock-free data structures

KHÔNG CẦN SharedArrayBuffer khi:
  ├── Data ít thay đổi (configuration, lookup tables)
  ├── Giao tiếp không cần real-time
  └── Structured clone đủ nhanh
```

---

## 4. Atomics — An Toàn Truy Cập Shared Memory

### Vấn đề Race Condition

```javascript
// Race condition trên shared memory:
sharedCounter[0]++; // NOT ATOMIC!

// Thread A: read (0) → increment (1) → write (1)
// Thread B: read (0) → increment (1) → write (1) ← overwrite!
// Result: counter = 1 thay vì 2 ❌
```

### Atomics Operations

```javascript
// Atomics đảm bảo read-modify-write là ATOMIC
const shared = new Int32Array(sharedBuffer);

// Atomic add
Atomics.add(shared, 0, 1); // shared[0] += 1

// Atomic sub
Atomics.sub(shared, 0, 1); // shared[0] -= 1

// Atomic exchange
Atomics.store(shared, 0, 99); // shared[0] = 99
Atomics.load(shared, 0);     // read shared[0] = 99

// Atomic compare-and-swap (CAS)
Atomics.compareExchange(shared, 0, 99, 100);
// if shared[0] === 99 → shared[0] = 100
// else → không thay đổi

// Atomic bitwise
Atomics.and(shared, 0, 0b1111); // shared[0] &= 0b1111
Atomics.or(shared, 0, 0b1111);   // shared[0] |= 0b1111
Atomics.xor(shared, 0, 0b1111); // shared[0] ^= 0b1111
```

### Atomics.wait và notify — Synchronization

```javascript
// Atomics.wait: BLOCK current thread cho đến khi condition met
// ⚠️ Chỉ dùng TRONG Workers! Không dùng trong main thread!

// Worker: chờ main thread signal
const shared = new Int32Array(sharedBuffer);

function waitForSignal() {
  // Chờ cho đến khi shared[0] != 0
  // Timeout: 5000ms
  const result = Atomics.wait(shared, 0, 0, 5000);

  if (result === 'ok') {
    console.log('Received signal!');
  } else if (result === 'timed-out') {
    console.log('Timed out waiting');
  } else if (result === 'not-equal') {
    console.log('Value changed before waiting');
  }
}

// Main thread: notify worker
const shared = new Int32Array(sharedBuffer);

// Write value
Atomics.store(shared, 0, 1);

// Wake up 1 worker đang wait trên shared[0]
Atomics.notify(shared, 0, 1); // notify 1 waiter
Atomics.notify(shared, 0, Infinity); // notify ALL waiters
```

### Producer-Consumer Pattern

```javascript
// Shared buffer cho producer-consumer
const buffer = new SharedArrayBuffer(256);
const data = new Uint8Array(buffer);
const flag = new Int32Array(new SharedArrayBuffer(4)); // 0 = empty, 1 = filled

// Producer (main thread)
function produce(value) {
  // Chờ consumer empty
  Atomics.wait(flag, 0, 0); // chờ flag = 0

  // Write data
  data[0] = value;

  // Signal consumer
  Atomics.store(flag, 0, 1);
  Atomics.notify(flag, 0, 1);
}

// Consumer (worker)
function consume() {
  // Chờ producer fill
  Atomics.wait(flag, 0, 1); // chờ flag = 1

  const value = data[0];

  // Signal producer
  Atomics.store(flag, 0, 0);
  Atomics.notify(flag, 0, 1);

  return value;
}
```

---

## 5. Worker Types Trong Trình Duyệt

### Dedicated Worker

```javascript
// Dedicated Worker: chỉ một script dùng
const worker = new Worker('worker.js');

// Chỉ worker này và main thread communicate
worker.postMessage({ type: 'init' });

// Worker chết khi:
// - main thread gọi worker.terminate()
// - worker tự gọi self.close()
// - page navigated away
```

### Shared Worker

```javascript
// Shared Worker: nhiều tabs/scripts cùng dùng
const sharedWorker = new SharedWorker('shared-worker.js');

sharedWorker.port.onmessage = (event) => {
  console.log('From shared worker:', event.data);
};

sharedWorker.port.postMessage({ type: 'ping' });

// Kết nối từ tab khác:
const sharedWorker2 = new SharedWorker('shared-worker.js');
// → Cùng worker instance!
// → Có thể share state giữa tabs
```

```javascript
// shared-worker.js
const connections = new Map();

self.onconnect = (event) => {
  const port = event.ports[0];

  connections.set(port, { port });

  port.onmessage = (e) => {
    const { type, id } = e.data;

    if (type === 'register') {
      port.postMessage({ type: 'registered', id });
    }
  };

  port.start();
};
```

### Service Worker

```javascript
// Service Worker: proxy giữa app và network
// Dùng cho: caching, offline, push notifications, background sync

// Đăng ký service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('SW registered', reg.scope))
    .catch(err => console.error('SW failed', err));
}
```

```javascript
// sw.js — service worker
const CACHE_NAME = 'v1';

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll([
        '/',
        '/index.html',
        '/styles.css',
        '/app.js'
      ])
    )
  );
  self.skipWaiting(); // Activate immediately
});

// Fetch: serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon.png'
  });
});
```

### Worklet — GPU-Accelerated Rendering

```javascript
// Worklet: chạy code trên GPU thread
// Dùng cho: custom CSS rendering, audio processing

// 1. CSS Paint Worklet (Chrome)
// register-paint.js
registerPaint('my-pattern', class {
  paint(ctx, size, properties) {
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, size.width, size.height);
  }
});

// CSS
/*
@property --pattern {
  syntax: '<color>';
  initial-value: red;
}
.my-element {
  background: paint(my-pattern);
}
*/

// 2. Audio Worklet
const audioContext = new AudioContext();
await audioContext.audioWorklet.addModule('processor.js');

const workletNode = new AudioWorkletNode(audioContext, 'my-processor');
```

---

## 6. Worker Pool — Quản Lý Nhiều Workers

### Pool Pattern Cơ Bản

```javascript
// Tạo worker mới = overhead ~5-20ms
// Dùng pool để reuse workers

class WorkerPool {
  constructor(filename, size = navigator.hardwareConcurrency || 4) {
    this.size = size;
    this.workers = [];
    this.queue = [];
    this.filename = filename;

    // Pre-create workers
    for (let i = 0; i < size; i++) {
      this.workers.push(this._createWorker());
    }
  }

  _createWorker() {
    const worker = new Worker(this.filename);
    return {
      worker,
      busy: false,
      resolve: null
    };
  }

  runTask(data) {
    return new Promise((resolve) => {
      const availableWorker = this.workers.find(w => !w.busy);

      if (availableWorker) {
        this._execute(availableWorker, data, resolve);
      } else {
        this.queue.push({ data, resolve });
      }
    });
  }

  _execute(workerItem, data, resolve) {
    workerItem.busy = true;
    workerItem.resolve = resolve;

    const cleanup = (result) => {
      workerItem.busy = false;
      resolve(result);

      // Process queued task
      if (this.queue.length > 0) {
        const { data, resolve } = this.queue.shift();
        this._execute(workerItem, data, resolve);
      }
    };

    workerItem.worker.onmessage = (e) => cleanup(e.data.result);
    workerItem.worker.onerror = (e) => {
      cleanup({ error: e.message });
    };

    workerItem.worker.postMessage(data);
  }

  terminateAll() {
    this.workers.forEach(w => w.worker.terminate());
    this.workers = [];
  }
}

// Usage
const pool = new WorkerPool('compute.js', 4);

const results = await Promise.all([
  pool.runTask({ input: 100 }),
  pool.runTask({ input: 200 }),
  pool.runTask({ input: 300 }),
  pool.runTask({ input: 400 })
]);

pool.terminateAll();
```

---

## 7. Ứng Dụng Thực Tế

### Image Processing — Parallel Computation

```javascript
// Image editor: process pixels trên worker
// worker.js
self.onmessage = (event) => {
  const { imageData, width, height, filter } = event.data;
  const pixels = new Uint8ClampedArray(imageData);

  switch (filter) {
    case 'grayscale':
      for (let i = 0; i < pixels.length; i += 4) {
        const avg = (pixels[i] + pixels[i+1] + pixels[i+2]) / 3;
        pixels[i] = pixels[i+1] = pixels[i+2] = avg;
      }
      break;

    case 'invert':
      for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = 255 - pixels[i];
        pixels[i+1] = 255 - pixels[i+1];
        pixels[i+2] = 255 - pixels[i+2];
      }
      break;

    case 'blur':
      // Box blur implementation
      boxBlur(pixels, width, height, 5);
      break;
  }

  self.postMessage({ pixels: pixels.buffer }, [pixels.buffer]);
};

function boxBlur(pixels, w, h, radius) {
  // Box blur logic...
}
```

```javascript
// main.js
const worker = new Worker('image-worker.js');

async function applyFilter(filterName) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Transfer pixels (main thread không cần pixels sau khi gửi)
  worker.postMessage({
    imageData: imageData.data.buffer,
    width: canvas.width,
    height: canvas.height,
    filter: filterName
  }, [imageData.data.buffer]);

  // Wait for result
  const result = await new Promise((resolve) => {
    worker.onmessage = (e) => resolve(e.data);
  });

  // Apply result
  const newImageData = new ImageData(
    new Uint8ClampedArray(result.pixels),
    canvas.width,
    canvas.height
  );
  ctx.putImageData(newImageData, 0, 0);
}
```

### Parallel Computation — MapReduce

```javascript
// worker.js — xử lý một chunk
self.onmessage = (event) => {
  const { chunk, reducer } = event.data;

  const result = chunk.reduce((acc, item) => {
    return reducer(acc, item);
  }, null);

  self.postMessage({ result, count: chunk.length });
};

// main.js — phân phối work
function parallelReduce(items, reducer, numWorkers) {
  const chunkSize = Math.ceil(items.length / numWorkers);
  const chunks = [];

  for (let i = 0; i < numWorkers; i++) {
    const start = i * chunkSize;
    const chunk = items.slice(start, start + chunkSize);
    chunks.push({ chunk, reducer });
  }

  return Promise.all(chunks.map(chunk => {
    return new Promise((resolve) => {
      const worker = new Worker('reduce-worker.js');
      worker.onmessage = (e) => resolve(e.data.result);
      worker.postMessage(chunk);
    });
  })).then(partialResults => partialResults.reduce(reducer));
}

// Ví dụ: sum cùng lúc
const numbers = Array.from({ length: 10_000_000 }, (_, i) => i);
const sum = parallelReduce(numbers, (a, b) => a + b, 8);
console.log(sum); // ~49,999,995,000,000
```

### Real-time Collaboration — SharedArrayBuffer

```javascript
// collaborative-editor.js
// Dùng SharedArrayBuffer cho real-time cursor positions

const cursorBuffer = new SharedArrayBuffer(32); // 4 cursors × 8 bytes
const cursors = new Float32Array(cursorBuffer);
// cursors[0,1] = cursor 1 (x, y)
// cursors[2,3] = cursor 2 (x, y)
// ...

const worker = new Worker('cursor-worker.js');
worker.postMessage({ cursorBuffer }, [cursorBuffer]);

// Update cursor position (60fps)
function updateCursor(cursorId, x, y) {
  Atomics.store(cursors, cursorId * 2, x);
  Atomics.store(cursors, cursorId * 2 + 1, y);
  Atomics.notify(cursors, cursorId * 2, 1);
}

canvas.addEventListener('mousemove', (e) => {
  updateCursor(myCursorId, e.clientX, e.clientY);
});
```

---

## 8. Các Traps Phổ Biến

### Trap 1: Workers Không Có DOM Access

```javascript
// ❌ Worker không truy cập được DOM — throw Error!
self.onmessage = (event) => {
  const el = document.getElementById('app'); // Error!
  window.alert('hello');                     // Error!
  localStorage.getItem('key');               // Error!
  document.cookie;                           // Error!
};

// ✅ Worker chỉ có:
self.console.log('Worker log');  // WorkerConsole OK
self.location.href;              // WorkerLocation OK
self.fetch('/api/data');         // Fetch API OK
self indexedDB;                   // IndexedDB OK
self.caches;                     // Cache API OK
self.navigator.userAgent;        // Limited Navigator
```

### Trap 2: Transfer vs Clone — Confusing

```javascript
// ❌ Structured clone: SLOW với ArrayBuffer lớn
const bigBuffer = new ArrayBuffer(50_000_000); // 50MB
worker.postMessage({ buffer: bigBuffer });
// → 50MB được serialized + copied
// → Mất ~500ms hoặc hơn!

// ✅ Transfer: NHANH nhưng destructive
worker.postMessage({ buffer: bigBuffer }, [bigBuffer.buffer]);
// → Ownership chuyển ngay lập tức
// → bigBuffer ở main thread = detached!

// ⚠️ Nếu cần buffer ở cả 2 nơi: KHÔNG dùng transfer
// → Dùng SharedArrayBuffer hoặc chunked updates
```

### Trap 3: Worker Lifetime Management

```javascript
// ❌ Quên terminate — memory leak!
const worker = new Worker('heavy.js');
// ... use worker ...
// Khi component unmount, worker vẫn chạy!

// ✅ Luôn cleanup
function createWorker() {
  const worker = new Worker('compute.js');

  return {
    run(data) {
      return new Promise((resolve, reject) => {
        worker.onmessage = (e) => resolve(e.data);
        worker.onerror = (e) => reject(new Error(e.message));
        worker.postMessage(data);
      });
    },

    destroy() {
      worker.terminate(); // Force stop
    }
  };
}

// useEffect cleanup
const { run, destroy } = createWorker();

useEffect(() => {
  return () => destroy(); // Cleanup khi unmount
}, []);
```

### Trap 4: Gửi Object Qua Reference

```javascript
// ❌ Gửi reference — data KHÔNG được gửi!
const data = { huge: new ArrayBuffer(10_000_000) };
worker.postMessage({ data });
// → { data: <circular or non-serializable> } ❌

// ✅ Dùng structured clone hoặc transfer
const buffer = new ArrayBuffer(10_000_000);
worker.postMessage({ buffer }, [buffer]);
```

### Trap 5: Blocking Wait Trong Main Thread

```javascript
// ❌ Atomics.wait KHÔNG hoạt động trong main thread
// Main thread gọi Atomics.wait → Error!

// ✅ Trong main thread: dùng setTimeout/requestAnimationFrame
function waitForCondition(condition, callback) {
  if (condition()) {
    callback();
  } else {
    setTimeout(() => waitForCondition(condition, callback), 10);
  }
}

// Worker có thể dùng Atomics.wait
```

---

## 9. Câu Hỏi Phỏng Vấn

### Câu 1: Web Worker limitations là gì?

**Trả lời:** Workers KHÔNG có: (1) DOM access — không getElementById, không document. (2) window/document objects — không alert, confirm. (3) localStorage trực tiếp. (4) parent object — không truy cập opener. Workers CÓ: console, location, fetch, IndexedDB, Cache API, Worker-specific globals (self). Communication: chỉ qua postMessage (structured clone hoặc transferable).

---

### Câu 2: Structured Clone vs Transfer — khác nhau gì?

**Trả lời:** Structured Clone: data được deep copy — source không đổi, nhưng chậm với data lớn (serialize/deserialize). Transfer: chuyển quyền sở hữu — source trở thành detached (byteLength = 0), nhanh hơn 10-100x. Chỉ transferable types (ArrayBuffer, MessagePort, AudioBuffer) mới transfer được. Dùng transfer cho large buffers (images, audio, large datasets). Dùng clone cho small data hoặc khi cần giữ source.

---

### Câu 3: SharedArrayBuffer use cases thực tế?

**Trả lời:** SharedArrayBuffer dùng cho: (1) **Real-time collaboration**: Google Docs, Figma — nhiều users cùng thấy cursor/data real-time. (2) **High-frequency trading**: latency cực thấp giữa threads. (3) **Game engines**: physics thread + render thread share game state. (4) **WASM memory sharing**: WASM module và JS share linear memory. Cần COOP/COEP headers để enable vì lý do security (Spectre/Meltdown). Performance: lock-free data structures với Atomics.

---

### Câu 4: Worker Pool vs N Worker riêng?

**Trả lời:** Worker Pool: reuse workers → tránh overhead tạo worker mới (~5-20ms mỗi lần). Dùng khi: nhiều tasks ngắn, tasks phát sinh liên tục. N riêng: mỗi task tạo worker mới → đơn giản, worker chết sau khi xong. Dùng khi: tasks rất ít, mỗi task chạy lâu, không cần reuse. Pool tốt hơn cho production vì tránh overhead và memory churn.

---

### Câu 5: Service Worker vs Web Worker khác nhau gì?

**Trả lời:** Service Worker: proxy network, lifecycle đặc biệt (install → activate → fetch), chạy background, có thể handle push notifications, sync. Web Worker: chạy computation, terminate được, giao tiếp postMessage. Service Worker sống lâu (persistent), kiểm soát network requests. Web Worker sống ngắn, computation-focused.

---

### Câu 6: Làm sao debug Web Workers?

**Trả lời:** (1) DevTools → Sources → workers → breakpoint được. (2) `console.log` trong worker hiện trong Console tab. (3) DevTools → Memory → snapshot worker memory. (4) Chrome: `?debugger` worker để pause. (5) Worker console errors hiện rõ trong main console. (6) Performance tab: workers hiện trong Timeline.

---

## 10. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  WEB WORKERS                                                   │
│                                                               │
│  SEPARATE THREAD                                               │
│  ├── Computation nặng không block UI                        │
│  ├── DOM: KHÔNG có                                         │
│  ├── Giao tiếp: postMessage only                          │
│  └── Memory: ISOLATED (structured clone hoặc transfer)    │
│                                                               │
│  DATA TRANSFER                                                │
│  ├── Structured Clone: copy, source giữ nguyên, chậm     │
│  ├── Transferable: ownership transfer, source detached    │
│  └── SharedArrayBuffer: thực sự shared, cần COOP/COEP  │
│                                                               │
│  ATOMICS                                                       │
│  ├── add, sub, store, load, compareExchange               │
│  ├── wait(), notify() — synchronization                      │
│  └── Chỉ trong Workers, không trong main thread!          │
│                                                               │
│  TYPES                                                        │
│  ├── Dedicated: 1 main ↔ 1 worker                        │
│  ├── Shared: nhiều tabs cùng 1 worker                   │
│  ├── Service Worker: network proxy, background tasks     │
│  └── Worklet: GPU-accelerated rendering/audio           │
│                                                               │
│  ⚠️ Workers không có DOM/window                           │
│  ⚠️ Atomics.wait chỉ trong Workers                        │
│  ⚠️ Transfer = nhanh nhưng source mất quyền             │
│  ⚠️ Luôn cleanup worker khi unmount                     │
│  ⚠️ SharedArrayBuffer cần COOP/COEP headers             │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Tạo được Web Worker cơ bản
- [ ] Implement structured clone và transferable objects
- [ ] Dùng được SharedArrayBuffer với Atomics
- [ ] Implement Producer-Consumer pattern
- [ ] Phân biệt được Worker types (Dedicated/Shared/Service)
- [ ] Implement Worker Pool cho nhiều tasks
- [ ] Tránh được 5 traps phổ biến
- [ ] Trả lời được 5/6 câu hỏi phỏng vấn
- [ ] Debug được Workers trong DevTools

---

*Last updated: 2026-04-01*
