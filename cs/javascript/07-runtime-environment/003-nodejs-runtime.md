# Node.js Runtime — JavaScript Phía Server

## Câu hỏi mở đầu

```javascript
// Browser:
document.getElementById(); // có DOM
window.innerWidth;         // có
navigator.userAgent;       // có

// Node.js:
document;      // Error — không có DOM!
window;        // Error — không có window!
window = {};   // ⚠️ Tạo global nhưng không có properties của browser window

// Node.js có gì khác?
console.log(__dirname);        // có ✅
process.cwd();                 // có ✅
Buffer;                       // có ✅
fs.readFileSync();            // có ✅

// Tại sao Node.js khác browser?
```

**Node.js là JavaScript runtime cho phía server — có V8 engine (giống browser) nhưng có thêm: libuv cho I/O, C++ bindings cho native modules, và không có DOM.** Hiểu Node.js runtime giúp bạn viết server-side code hiệu quả.

---

## 1. Node.js Architecture — Từ JavaScript Đến System

### Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│  NODE.JS RUNTIME                                                 │
│                                                               │
│  JavaScript Layer (V8):                                      │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  V8 Engine                                            │  │
│  │  ├── Parser → Bytecode → Machine Code               │  │
│  │  ├── Memory Management (heap, GC)                    │  │
│  │  └── JavaScript Standard Library                      │  │
│  └─────────────────────────────────────────────────────┘  │
│                            │                                   │
│  C++ Bindings Layer:                                       │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Node.js C++ Addons                                  │  │
│  │  ├── node::Object, node::Function templates        │  │
│  │  ├── v8::Value, v8::Context                        │  │
│  │  └── Native module implementation                    │  │
│  └─────────────────────────────────────────────────────┘  │
│                            │                                   │
│  Native Modules Layer:                                      │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Built-in modules: fs, path, crypto, buffer, zlib   │  │
│  │  ├── Implemented in C++/JavaScript                 │  │
│  │  └── Exposed to JS via bindings                    │  │
│  └─────────────────────────────────────────────────────┘  │
│                            │                                   │
│  libuv Layer:                                              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  libuv (event loop + thread pool)                  │  │
│  │  ├── Event Loop: async I/O operations              │  │
│  │  └── Thread Pool: fs, dns, crypto, compression      │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### V8 Trong Node.js

```javascript
// V8 options trong Node.js
// Kiểm tra V8 version
console.log(process.versions.v8);

// V8 flags
// node --v8-options | grep optimize
node --max-old-space-size=4096 app.js  // 4GB heap
node --optimize-for-size app.js         // optimize for memory

// V8 metrics
const v8 = require('v8');
console.log(v8.getHeapStatistics());
// {
//   total_heap_size: 5000000,
//   used_heap_size: 3000000,
//   heap_size_limit: 2000000000,
//   ...
// }
```

---

## 2. libuv — Event Loop Và Thread Pool

### Event Loop Trong Node.js

```
┌─────────────────────────────────────────────────────────────┐
│  NODE.JS EVENT LOOP                                              │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  1. timers                 │ setTimeout, setInterval  │  │
│  │  │  Execute callbacks scheduled by timers             │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  2. pending callbacks    │ I/O callbacks deferred    │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  3. idle, prepare        │ Internal use               │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  4. poll                │ Retrieve new I/O events   │  │
│  │  │  • If empty → go to check                       │  │
│  │  • If callbacks exist → execute them               │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  5. check                │ setImmediate callbacks    │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  6. close callbacks       │ socket.on('close')      │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                               │
│  Microtasks:                                                  │
│  ├── Promise callbacks                                        │
│  └── process.nextTick callbacks (HIGHEST priority)        │
└─────────────────────────────────────────────────────────────┘
```

### Timers vs Immediate vs Next Tick

```javascript
// setTimeout(fn, 0) — timers phase
setTimeout(() => console.log('timeout'), 0);

// setImmediate — check phase
setImmediate(() => console.log('immediate'));

// process.nextTick — trước CẢ event loop
process.nextTick(() => console.log('nextTick'));

// Output order:
nextTick          // ✅ Luôn đầu tiên (trước event loop)
timeout / immediate // Depends! (see below)

// ⚠️ Khi setTimeout(fn, 0) và setImmediate trong I/O callback:
fs.readFile('./file', () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
  process.nextTick(() => console.log('nextTick'));
});
// Output: nextTick, immediate, timeout (always)
// nextTick → setImmediate → setTimeout
```

### Thread Pool

```javascript
// libuv Thread Pool: 4 threads by default
// Các operations dùng thread pool:
// - fs (file system operations)
// - dns.lookup()
// - crypto (some operations)
// - zlib compression
// - Some native addon operations

// Kiểm tra và cấu hình thread pool size
console.log(process.env.UV_THREADPOOL_SIZE); // default: 4

// Tăng thread pool cho I/O-heavy apps
process.env.UV_THREADPOOL_SIZE = '8';

// Hoặc:
process.env.UV_THREADPOOL_SIZE = '16';

// ⚠️ Maximum: 1024 (libuv limit)
```

### Event Loop Flow Chi Tiết

```javascript
console.log('1');

// I/O callback
fs.readFile('./file.txt', () => {
  console.log('2');

  setTimeout(() => console.log('3'), 0);
  setImmediate(() => console.log('4'));
  process.nextTick(() => console.log('5'));
});

console.log('6');

// Output:
// 1
// 6
// 2
// 5          ← nextTick (trước khi exit poll/check phases)
// 4          ← setImmediate (check phase)
// 3          ← setTimeout (timers phase)
```

---

## 3. Global Objects

### Các Globals Trong Node.js

```javascript
// globalThis — cross-environment global
console.log(globalThis === global); // true (Node.js)
console.log(globalThis === self);   // false (Node.js)

// Global objects trong Node.js:
global.console     // ✅ Console
global.global      // ✅ global itself
global.process    // ✅ Process object
global.Buffer      // ✅ Buffer class
global.setTimeout  // ✅ Timers
global.setInterval
global.setImmediate
global.clearTimeout
global.clearInterval
global.clearImmediate

// ⚠️ Không có (khác browser):
global.window      // ❌ undefined!
global.document    // ❌ undefined!
global.navigator   // ❌ undefined!
```

### Module-Scoped Variables

```javascript
// __filename — đường dẫn file hiện tại
console.log(__filename);
// /path/to/project/src/utils/helper.js

// __dirname — thư mục chứa file hiện tại
console.log(__dirname);
// /path/to/project/src/utils

// ⚠️ Không có trong ES Modules — dùng import.meta
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

### Process Object

```javascript
// Process — thông tin về process hiện tại
process.pid;              // Process ID
process.cwd();            // Current working directory
process.argv;             // Command line arguments
process.env;              // Environment variables
process.platform;         // 'linux', 'darwin', 'win32'
process.arch;             // 'x64', 'arm64'
process.version;          // Node.js version
process.versions;        // All dependency versions
process.exitCode;         // Exit code khi process exit

// Memory
process.memoryUsage();
// {
//   rss: 50MB,          Resident Set Size
//   heapTotal: 10MB,    V8 heap total
//   heapUsed: 8MB,      V8 heap used
//   external: 1MB,       C++ objects bound to JS
//   arrayBuffers: 0     ArrayBuffers
// }

// CPU
process.cpuUsage();
// { user: 50000, system: 10000 }

// Uptime
process.uptime(); // Seconds since start

// Exit
process.exit(0); // Exit code 0 = success
process.exit(1); // Exit code 1 = error

// Next tick
process.nextTick(() => console.log('runs before anything else'));

// Signal handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  process.exit(0);
});
```

---

## 4. Module System — CommonJS Chi Tiết

### Module Resolution

```javascript
// Node.js module resolution order (file: ./utils.js)
// 1. ./utils.js (exact file)
// 2. ./utils/index.js (if utils is directory)
// 3. ./utils/package.json "main" field
// 4. ./utils/package.json "exports" field

// node_modules resolution:
// 1. ./node_modules/utils.js
// 2. ../node_modules/utils.js
// 3. ../../node_modules/utils.js
// ... (traverse up)
// 4. /usr/local/lib/node_modules/utils.js (global)

// Package resolution
require('lodash'); // → node_modules/lodash

// Conditional exports (Node.js 12.20+)
require('./module'); // → exports['.'] conditional
```

### CJS Module Cache

```javascript
// Module cache — require() trả về cached module
// key = resolved file path

// a.js
console.log('a.js loaded');
module.exports = { value: Math.random() };

// main.js
const a1 = require('./a.js'); // loads, logs 'a.js loaded'
const a2 = require('./a.js'); // from cache, no log

console.log(a1 === a2); // true — same object!

// Cache invalidation: không có! Module reload = restart process
```

---

## 5. ES Modules Trong Node.js

### Cấu Hình

```javascript
// Cách 1: .mjs extension
// math.mjs
export const PI = 3.14;
export function add(a, b) { return a + b; }

// Cách 2: package.json type field
// package.json
{
  "type": "module"
}
// Tất cả .js files là ESM trong thư mục này

// ⚠️ Không thể dùng both .cjs và .mjs trong cùng directory
// nếu package.json có "type": "module"
```

### ESM-Specific Features

```javascript
// import.meta
import.meta.url;        // file:///path/to/file.js
import.meta.filename;   // /path/to/file.js (Node 20+)
import.meta.dirname;     // /path/to (Node 20+)

// import assertions
import jsonData from './data.json' assert { type: 'json' };
// Hoặc (Node 20+):
import jsonData from './data.json' with { type: 'json' };

// Dynamic import
const { default: fs } = await import('fs');
const { readFile } = await import('fs/promises');

// ⚠️ __dirname/__filename không có
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

### Interoperability

```javascript
// ESM import CJS
import fs from 'fs';            // ✅ Default import
import { readFile } from 'fs/promises'; // ✅ Named import từ CJS

// CJS require ESM (Node.js 22+)
const esm = await import('./esm.mjs');
```

---

## 6. File System — fs Module

### Sync vs Async vs Promises

```javascript
const fs = require('fs');

// ❌ Synchronous — BLOCKS event loop!
const data = fs.readFileSync('file.txt', 'utf8');
console.log('File content:', data); // Blocked cho đến khi đọc xong

// ✅ Callback async — non-blocking
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log('File content:', data);
});

// ✅ Promises — async/await
import { readFile } from 'fs/promises';

const data = await readFile('file.txt', 'utf8');
console.log('File content:', data);

// ✅ Streaming — memory efficient cho large files
const readable = fs.createReadStream('large-file.txt', 'utf8');
readable.on('data', (chunk) => { /* xử lý chunk */ });
readable.on('end', () => { /* done */ });
```

### Common fs Operations

```javascript
const fs = require('fs').promises;

// Read
await fs.readFile('file.txt', 'utf8');
await fs.readdir('./src');

// Write
await fs.writeFile('output.txt', 'content');
await fs.appendFile('log.txt', 'new line\n');

// File info
const stats = await fs.stat('file.txt');
stats.isFile();       // true
stats.isDirectory();  // false
stats.size;           // bytes
stats.mtime;          // modified time

// Create directories
await fs.mkdir('./new-dir', { recursive: true });

// Remove
await fs.unlink('file.txt');        // delete file
await fs.rmdir('dir', { recursive: true }); // delete directory

// Copy/Move
await fs.copyFile('src.txt', 'dest.txt');
await fs.rename('old.txt', 'new.txt');
```

### Path Module

```javascript
const path = require('path');

// Path manipulation
path.join('src', 'utils', 'helper.js');
// 'src/utils/helper.js'

path.resolve('src', 'utils', 'helper.js');
// '/current/working/dir/src/utils/helper.js'

path.basename('/src/utils/helper.js');     // 'helper.js'
path.dirname('/src/utils/helper.js');      // '/src/utils'
path.extname('/src/utils/helper.js');     // '.js'

path.parse('/src/utils/helper.js');
// { root: '', dir: '/src/utils', base: 'helper.js', ext: '.js', name: 'helper' }

// ⚠️ path.join vs path.resolve
path.join('src', 'utils'); // 'src/utils' (always adds separator)
path.resolve('src', 'utils'); // '/current/dir/src/utils' (absolute)
```

---

## 7. Buffers — Binary Data

### Creating Buffers

```javascript
// Buffer — raw binary data, fixed size
const buf1 = Buffer.alloc(10);           // zeros, 10 bytes
const buf2 = Buffer.allocUnsafe(10);      // uninitialized, faster
const buf3 = Buffer.from('hello');       // from string
const buf4 = Buffer.from([1, 2, 3]);     // from array
const buf5 = Buffer.from('aGVsbG8=', 'base64'); // from base64

console.log(buf3.toString()); // 'hello'
console.log(buf4);            // <Buffer 01 02 03>
```

### Buffer Operations

```javascript
// Read/Write
const buf = Buffer.from('hello world');

buf.toString('utf8');              // 'hello world'
buf.toString('hex');               // '68656c6c6f20776f726c64'
buf.toString('base64');           // 'aGVsbG8gd29ybGQ='

buf.length;                        // 11 bytes
buf[0];                            // 104 ('h')
buf[0] = 72;                        // 'H'

// Slice — shares memory!
const slice = buf.slice(0, 5);
console.log(slice.toString()); // 'Hello'

// Copy
const dest = Buffer.alloc(5);
buf.copy(dest, 0, 0, 5);
console.log(dest.toString()); // 'Hello'

// Compare
Buffer.compare(Buffer.from('a'), Buffer.from('b')); // -1

// Fill
Buffer.alloc(10).fill(0); // all zeros
```

### TypedArrays Với Buffers

```javascript
// Buffer-backed typed arrays
const buf = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]);

// Int32Array backed by buffer
const int32 = new Int32Array(buf.buffer, buf.byteOffset, 2);
// int32[0] = 0x04030201 = 67305985
// int32[1] = 0x08070605 = 134810373

// Float64Array
const float64 = new Float64Array(buf.buffer);
// float64[0] = ... (IEEE 754 representation)

// ⚠️ Endianness: platform-dependent!
```

---

## 8. Streams — Xử Lý Data Theo Chunk

### Stream Types

```javascript
const fs = require('fs');
const { Transform, Writable } = require('stream');

// Readable Stream — đọc data
const readable = fs.createReadStream('large-file.txt', {
  encoding: 'utf8',
  highWaterMark: 64 * 1024  // 64KB chunks
});

readable.on('data', (chunk) => {
  console.log(`Received ${chunk.length} bytes`);
});

readable.on('end', () => {
  console.log('Finished reading');
});

// Writable Stream — ghi data
const writable = fs.createWriteStream('output.txt');

writable.write('Hello ');
writable.write('World\n');
writable.end(); // Signal end

// Transform Stream — biến đổi data
const transform = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
});

readable.pipe(transform).pipe(writable);
```

### Stream Patterns

```javascript
// Pipeline — stream processing chain
const { pipeline } = require('stream/promises');
const fs = require('fs');
const zlib = require('zlib');

async function compressFile(input, output) {
  await pipeline(
    fs.createReadStream(input),
    zlib.createGzip(),
    fs.createWriteStream(output)
  );
  console.log('Compression complete');
}

// Backpressure — xử lý khi writable quá chậm
readable.on('data', (chunk) => {
  const canContinue = writable.write(chunk);
  if (!canContinue) {
    readable.pause();
    writable.once('drain', () => readable.resume());
  }
});
```

---

## 9. Các Traps Phổ Biến

### Trap 1: Blocking Event Loop Với Sync I/O

```javascript
// ❌ Sync file operations BLOCK event loop!
function processFiles(files) {
  for (const file of files) {
    const data = fs.readFileSync(file); // BLOCKS!
    process(data);
  }
}

// ✅ Async/await
async function processFiles(files) {
  for (const file of files) {
    const data = await fs.readFile(file);
    process(data);
  }
}

// ✅ Parallel với Promise.all
async function processFiles(files) {
  await Promise.all(files.map(file => fs.readFile(file)));
}
```

### Trap 2: __dirname Không Có Trong ESM

```javascript
// ❌ __dirname không tồn tại trong ESM
// __dirname; // ReferenceError!

// ✅ Dùng import.meta
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ Hoặc dùng import.meta.dirname (Node 20+)
console.log(import.meta.dirname);
```

### Trap 3: Environment Variables Không Typed

```javascript
// ❌ Environment variables là strings!
const port = process.env.PORT; // '3000' — string!
app.listen(port); // Error! (port must be number)

// ✅ Parse đúng type
const port = parseInt(process.env.PORT || '3000', 10);
const debug = process.env.DEBUG === 'true';
const timeout = parseInt(process.env.TIMEOUT || '5000', 10);
```

### Trap 4: Buffer Và Unicode

```javascript
// ❌ Buffer.length vs String.length
const buf = Buffer.from('🎉');
console.log(buf.length);    // 4 bytes
console.log(buf.toString().length); // 1 character

// ⚠️ Character length ≠ byte length
const emoji = '👨‍👩‍👧‍👦'; // 25 bytes, 5 code points!
console.log(Buffer.from(emoji).length); // 25
console.log([...emoji].length);           // 5
```

### Trap 5: Module Cache Trong Tests

```javascript
// ❌ Module cache có thể gây issues trong tests
// require('./module') trả về cached version

// Test A
const module = require('./module');
module.reset(); // Reset state

// Test B — nhận được cached version với state đã reset!
const module2 = require('./module');
// module2.state === module.state (same object!)

// ✅ Clear cache trong tests
delete require.cache[require.resolve('./module')];

// ✅ Hoặc dùng jest.resetModules()
```

---

## 10. Câu Hỏi Phỏng Vấn

### Câu 1: Node.js event loop khác browser event loop?

**Trả lời:** Có nhiều khác biệt: (1) Browser có microtasks + macrotasks, Node.js có thêm `process.nextTick` (cao hơn microtasks). (2) Node.js có `setImmediate`, browser không. (3) Node.js có `poll` phase để xử lý I/O, browser có `task queue` + `microtask queue`. (4) Node.js thread pool cho `fs`, `dns`, `crypto`, browser không có. (5) `process.exit()` là Node.js-specific. Common: đều xử lý async operations qua event loop.

---

### Câu 2: libuv thread pool dùng khi nào?

**Trả lời:** Thread pool (default 4 threads) dùng cho các operations không thể async-native: (1) `fs` — file system operations. (2) `dns.lookup()` — DNS lookups. (3) `crypto` — some crypto operations (pbkdf2, scrypt). (4) `zlib` — compression. (5) Native addon operations. Operations như `fs.readFile` dùng thread pool. Operations như `net.Socket` dùng OS async I/O (không thread pool).

---

### Câu 3: Buffer vs TypedArray vs ArrayBuffer?

**Trả lời:** `ArrayBuffer`: raw binary data, không thể read/write trực tiếp. `Buffer`: Node.js implementation của Uint8Array, mutable, read/write được. `TypedArray`: view vào ArrayBuffer (Uint8Array, Int32Array, Float64Array, etc.). `Buffer` extends `Uint8Array` nên có tất cả methods của TypedArray + methods Node.js-specific. Dùng `Buffer` cho Node.js binary data, `ArrayBuffer`/`TypedArray` cho browser.

---

### Câu 4: Stream vs Buffer cho xử lý large files?

**Trả lời:** Buffer: đọc toàn bộ file vào memory → đơn giản nhưng tốn memory. Dùng cho: files < 1GB, cần random access. Stream: đọc/ghi theo chunks → memory efficient, xử lý được files lớn. Dùng cho: files > 100MB, pipe processing, large network transfers. `pipeline()` / `stream.promises.pipeline()` cho stream chains để tự động cleanup.

---

### Câu 5: nextTick vs setImmediate vs setTimeout(fn, 0)?

**Trả lời:** `process.nextTick()`: chạy TRƯỚC CẢ event loop, sau microtasks. Dùng cho: defer execution đến next tick, prevent recursion. `setImmediate()`: chạy trong `check` phase, sau poll phase. Dùng cho: I/O callbacks, async code patterns. `setTimeout(fn, 0)`: chạy trong `timers` phase, sau pending callbacks. `nextTick` > microtasks > `setImmediate` ≈ `setTimeout(0)` (thứ tự giữa setImmediate và setTimeout phụ thuộc context).

---

## 11. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  NODE.JS RUNTIME                                                 │
│                                                               │
│  ARCHITECTURE                                                 │
│  ├── V8: JS execution, memory, GC                           │
│  ├── libuv: event loop + thread pool                       │
│  ├── C++ bindings: native modules                          │
│  └── Built-in modules: fs, path, crypto, buffer, etc.   │
│                                                               │
│  EVENT LOOP PHASES                                          │
│  ├── timers: setTimeout/setInterval                      │
│  ├── pending callbacks: deferred I/O                     │
│  ├── idle/prepare: internal                             │
│  ├── poll: I/O operations, execute callbacks            │
│  ├── check: setImmediate                               │
│  └── close callbacks: socket close                     │
│                                                               │
│  MICROtasks                                                │
│  ├── process.nextTick: CAO NHẤT                         │
│  ├── Promise callbacks: sau nextTick                    │
│                                                               │
│  THREAD POOL                                               │
│  ├── fs, dns.lookup, crypto, zlib                      │
│  ├── UV_THREADPOOL_SIZE (default: 4)                 │
│  └── OS-native async: network, pipes                   │
│                                                               │
│  GLOBALS                                                   │
│  ├── globalThis, global, process, Buffer              │
│  ├── __dirname, __filename (CJS only)                │
│  └── import.meta (ESM)                                │
│                                                               │
│  ⚠️ Sync I/O blocks event loop                        │
│  ⚠️ __dirname not available in ESM                    │
│  ⚠️ Environment variables are strings                 │
│  ⚠️ Module cache can affect tests                   │
│  ⚠️ Buffer vs String: byte length ≠ character length │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Hiểu Node.js architecture (V8 + libuv)
- [ ] Mô tả được event loop phases
- [ ] Phân biệt được setTimeout, setImmediate, nextTick
- [ ] Hiểu thread pool và operations cần nó
- [ ] Sử dụng được fs module với async/await
- [ ] Xử lý được buffers và binary data
- [ ] Tránh được 5 traps phổ biến
- [ ] Trả lời được 4/5 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
