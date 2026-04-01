# Cross-Platform JavaScript — Viết Code Chạy Ở Mọi Nơi

## Câu hỏi mở đầu

```javascript
// Đoạn code này chạy ở đâu?

console.log('Hello');                // Browser ✅  Node.js ✅  Bun ✅

document.getElementById('app');      // Browser ✅  Node.js ❌

window.innerWidth;                  // Browser ✅  Node.js ❌

process.cwd();                       // Node.js ✅  Browser ❌

globalThis.Buffer;                  // Node.js ✅  Browser ❌

// Làm sao viết code chạy được ở cả 3 mà không crash?
```

Một trong những thế mạnh lớn nhất của JavaScript là khả năng chạy ở **khắp nơi**: trình duyệt, server, mobile (React Native), desktop (Electron), edge functions, thậm chí embedded devices. Nhưng mỗi môi trường cung cấp API khác nhau. Bài này dạy bạn viết **portable code** — code chạy ở mọi nơi mà không cần if-else lộn xộn.

---

## 1. Phân Loại JavaScript Environments

### Map các môi trường

```
┌──────────────────────────────────────────────────────────────┐
│  JavaScript Runtime Environments                               │
│                                                               │
│  BROWSER                                                      │
│  ├── Chrome / Edge (V8 + Blink)                            │
│  ├── Firefox (SpiderMonkey + Gecko)                        │
│  ├── Safari (JavaScriptCore + WebKit)                      │
│  └── Web Workers (V8 isolates)                             │
│                                                               │
│  SERVER                                                       │
│  ├── Node.js (V8 + libuv)                                  │
│  ├── Deno (V8 + Rust async)                               │
│  ├── Bun (JavaScriptCore + uvw)                            │
│  └── Cloudflare Workers (V8 isolates)                     │
│                                                               │
│  MOBILE                                                       │
│  ├── React Native (JavaScriptCore)                         │
│  └── Capacitor (JavaScriptCore + native bridges)           │
│                                                               │
│  DESKTOP                                                       │
│  ├── Electron (Chromium + Node.js)                         │
│  └── Tauri (WebView + Rust)                               │
│                                                               │
│  EMBEDDED                                                      │
│  └── Espruino, JerryScript (IoT devices)                   │
└──────────────────────────────────────────────────────────────┘
```

### Feature detection là chìa khóa

```javascript
// ❌ Runtime detection — fragile, bad practice
if (typeof window !== 'undefined') {
  // Browser code
} else if (typeof process !== 'undefined') {
  // Node.js code
}

// ✅ Feature detection — robust
if (typeof window !== 'undefined' && window.document) {
  // DOM available
  document.getElementById('app');
}

if (typeof window !== 'undefined' && 'crypto' in window) {
  // Web Crypto API available
  crypto.randomUUID();
}

if (typeof globalThis !== 'undefined' && globalThis.process?.versions) {
  // Node.js
  process.cwd();
}
```

---

## 2. Platform Detection Utilities

### Viết utility tự phát hiện môi trường

```javascript
// platform.js
const Platform = {
  isBrowser: typeof window !== 'undefined' && typeof window.document !== 'undefined',

  isNode: typeof process !== 'undefined' &&
          process.versions &&
          process.versions.node,

  isDeno: typeof Deno !== 'undefined',

  isBun: typeof Bun !== 'undefined',

  isWorker: typeof self !== 'undefined' &&
             self.importScripts === 'function',

  isReactNative: typeof navigator === 'object' &&
                  navigator.product === 'ReactNative',

  isElectron: typeof process !== 'undefined' &&
               process.versions?.electron !== undefined,

  isServiceWorker: typeof ServiceWorkerGlobalScope !== 'undefined',
};

// Cách dùng:
Platform.isBrowser && console.log('DOM available');
Platform.isNode && console.log('Node.js version:', process.versions.node);
Platform.isDeno && console.log('Deno version:', Deno.version);
```

### globalThis — Standard Global Object

```javascript
// globalThis: chuẩn ES2020 cho global object
// Trước ES2020: window (browser), global (Node.js), self (Worker)
// Bây giờ: globalThis works MỌI NƠI

globalThis.console.log('Hello from anywhere!');
globalThis.JSON.parse('{"a":1}');
globalThis.Array.isArray([]);

// ⚠️ globalThis không phải lúc nào cũng có sẵn
// Polyfill:
(function() {
  if (typeof globalThis === 'undefined') {
    Object.defineProperty(Object.prototype, '__magic__', {
      get: function() { return this; },
      configurable: true
    });
    __magic__.globalThis = __magic__;
    delete Object.prototype.__magic__;
  }
})();
```

---

## 3. Detecting Browser vs Server

### Universal fetch

```javascript
// fetch() là Web API trong browser
// Nhưng Node.js v18+, Deno, Bun cũng có fetch()
// Để chắc chắn, dùng cross-platform approach

// Cách 1: kiểm tra native fetch
const universalFetch = globalThis.fetch || async (url, options) => {
  // Fallback: dùng cross-fetch hoặc node-fetch
  const { default: nodeFetch } = await import('node-fetch');
  return nodeFetch(url, options);
};

// Cách 2: dùng cross-fetch library
// npm install cross-fetch
import fetch from 'cross-fetch';
// fetch works ở browser, Node.js, React Native

// Cách 3: cho server-side rendering (SSR)
async function getData(url) {
  if (Platform.isNode) {
    const { default: nodeFetch } = await import('node-fetch');
    return nodeFetch(url);
  }
  return fetch(url);
}
```

### Universal JSON

```javascript
// JSON API luôn có sẵn mọi nơi — an toàn nhất
JSON.stringify({ a: 1 });  // ✅ Browser ✅ Node ✅ Worker ✅ Deno ✅ Bun
JSON.parse('{"a":1}');     // ✅ Tất cả

// ⚠️ Nhưng structuredClone không có ở mọi nơi (Node < 17)
// Polyfill:
const deepClone = (obj) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj)); // ⚠️ không clone functions, undefined, symbols
};
```

### Universal timers

```javascript
// ✅ Browser: setTimeout/setInterval luôn có
// ✅ Node.js: setTimeout/setInterval luôn có
// ✅ Worker: setTimeout/setInterval luôn có
// ✅ Bun: đầy đủ
// ⚠️ Deno: có setTimeout/setInterval

// Nhưng setImmediate CHỈ có trong Node.js:
const nextTick = typeof process !== 'undefined' && process.nextTick
  ? process.nextTick
  : (fn) => setTimeout(fn, 0);

// ⚠️ Deno không có setImmediate
// ⚠️ Bun có setImmediate

// requestAnimationFrame chỉ có Browser + Worker:
const waitForFrame = (cb) => {
  if (typeof requestAnimationFrame === 'function') {
    return requestAnimationFrame(cb);
  }
  return setTimeout(cb, 16); // ~60fps fallback
};
```

---

## 4. Môi Trường Browser

### Browser APIs bạn có

```javascript
// Browser global objects:
window;                    // Global window object
document;                  // DOM
navigator;                 // Browser info
location;                  // URL info
history;                   // Navigation history
localStorage;              // Persistent storage
sessionStorage;            // Session storage
fetch;                     // HTTP requests
WebSocket;                 // WebSocket
crypto;                    // Cryptography
requestAnimationFrame;     // Animation
IntersectionObserver;      // Lazy loading
MutationObserver;         // DOM changes
ServiceWorkerContainer;   // Service workers
IndexedDB;                 // Client-side database
```

### Browser-specific gotchas

```javascript
// 1. File API chỉ có trong browser
const input = document.querySelector('input[type="file"]');
input.addEventListener('change', (e) => {
  const file = e.target.files[0];
  // file.name, file.size, file.type
});

// 2. Clipboard API
navigator.clipboard.readText().then(text => console.log(text));
navigator.clipboard.writeText('Hello');

// 3. Notification API
if ('Notification' in window) {
  Notification.requestPermission().then(perm => {
    if (perm === 'granted') {
      new Notification('Hello!');
    }
  });
}

// 4. ResizeObserver
new ResizeObserver(entries => {
  entries.forEach(entry => {
    console.log('Size:', entry.contentRect);
  });
}).observe(document.body);
```

---

## 5. Môi Trường Node.js

### Node.js-specific globals

```javascript
// __dirname và __filename
// ⚠️ Không có trong ESM module
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// process object
process.cwd();              // current working directory
process.exit(0);            // exit
process.env.NODE_ENV;       // environment
process.argv;               // command line arguments
process.memoryUsage();      // memory stats
process.cpuUsage();         // CPU stats
process.uptime();           // uptime
process.version;            // Node.js version

// module object
module.exports = {};        // CommonJS
exports.foo = 'bar';        // CommonJS shortcut

// Buffer
const buf = Buffer.from('hello');
Buffer.alloc(10);
Buffer.isBuffer(buf);

// V8 specific
v8.getHeapStatistics();
v8.getHeapSpaceStatistics();
```

### Node.js-specific modules

```javascript
// File system
import { readFile, writeFile } from 'fs/promises';
import { createReadStream } from 'fs';

// HTTP/HTTPS
import http from 'http';
import https from 'https';
import { request as httpRequest } from 'http';

// Path
import path from 'path';
path.join(__dirname, 'files', 'data.json');
path.resolve('./config');

// Crypto
import crypto from 'crypto';
crypto.createHash('sha256').update('data').digest('hex');

// Events
import { EventEmitter } from 'events';
class MyEmitter extends EventEmitter {}

// Streams
import { pipeline } from 'stream/promises';
import { createGzip } from 'zlib';
```

---

## 6. Deno và Bun

### Deno — Node.js compatibility + security

```javascript
// Deno có API tương tự Node.js nhưng với security permissions
// Deno.run({ name: 'deno', permissions: true })

// Deno standard library:
import { readFile } from 'https://deno.land/std/fs/read_file.ts';
// hoặc:
import { readFile } from 'std/fs/read_file.ts';

// Deno permissions:
// deno run --allow-read --allow-write server.ts
const data = await Deno.readFile('data.json');
await Deno.writeFile('out.txt', new TextEncoder().encode('data'));

// Deno fetch (built-in):
const response = await fetch('https://api.example.com');
const json = await response.json();

// Deno deploy (edge):
// Chạy trên V8 isolates, có Deno KV built-in
```

### Bun — Fast JS runtime

```javascript
// Bun nhanh hơn Node.js đáng kể cho:
// - Starting time (10x faster)
// - npm install (bundler tích hợp)
// - TypeScript (native support, không cần ts-node)

// Bun built-in APIs:
Bun.serve({ // HTTP server
  port: 3000,
  fetch(req) {
    return new Response('Hello Bun!');
  }
});

// Bun.file() — streaming file reads
const file = Bun.file('./data.json');
const contents = await file.text();

// Bun.spawn() — process spawning
const proc = Bun.spawn(['echo', 'hello']);
console.log(await new Response(proc.stdout).text());

// Bun.write() — fast file writes
await Bun.write('./out.txt', 'Hello');
```

### So sánh nhanh

```
┌────────────┬──────────────┬──────────────┬──────────────────────┐
│ Feature    │ Node.js       │ Deno         │ Bun                  │
├────────────┼──────────────┼──────────────┼──────────────────────┤
│ Engine     │ V8            │ V8           │ JavaScriptCore       │
│ Modules    │ CJS + ESM     │ ESM          │ CJS + ESM            │
│ TS support │ via ts-node   │ Native       │ Native               │
│ npm        │ ✅            │ npm packages  │ npm packages         │
│ Permissions│ No            │ ✅            │ No                   │
│ Bundler    │ webpack/rollup │ built-in     │ built-in             │
│ Startup    │ ~300ms        │ ~15ms        │ ~10ms               │
│ HTTP perf  │ baseline      │ fast         │ fastest              │
│ Stability  │ stable (14yr) │ improving    │ young (1yr)          │
└────────────┴──────────────┴──────────────┴──────────────────────┘
```

---

## 7. Web Workers — True Concurrency Trong Browser

### Worker environments

```javascript
// Main thread: window, document, DOM
// Worker thread: self, postMessage, importScripts
// Worker KHÔNG có DOM!

// Web Worker (dedicated):
const worker = new Worker('/worker.js');
worker.postMessage({ type: 'COMPUTE', data: hugeData });
worker.onmessage = (event) => {
  console.log('Result:', event.data);
};

// worker.js:
self.onmessage = (event) => {
  const result = heavyComputation(event.data);
  self.postMessage(result);
};

// SharedWorker (shared across tabs):
const shared = new SharedWorker('/shared-worker.js');
shared.port.postMessage('hello');

// Service Worker (proxy):
// sw.js: intercepts network requests, caching
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request) || fetch(event.request)
  );
});
```

### Communicating with Workers

```javascript
// Main thread gửi structured data:
const worker = new Worker('processor.js');

worker.postMessage({
  type: 'PROCESS_IMAGE',
  imageData: imageBuffer,
  options: { width: 1024, format: 'jpeg' }
});

// Worker nhận:
self.onmessage = ({ data }) => {
  if (data.type === 'PROCESS_IMAGE') {
    const result = processInWorker(data.imageData, data.options);
    self.postMessage({ type: 'RESULT', result });
  }
};

// Transferable objects (zero-copy):
// Chuyển ArrayBuffer ownership — CỰC NHANH
const buffer = new ArrayBuffer(10_000_000);
worker.postMessage({ buffer }, [buffer]);
// Sau khi transferred: buffer in main thread = empty!
```

---

## 8. Universal Module Patterns

### ESM — standard cross-platform modules

```javascript
// file: utils.js
// Dùng ESM: works ở Browser (bundled), Node.js (với "type": "module"),
// Deno, Bun

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// import:
import { clamp, debounce } from './utils.js';
// Works everywhere (với bundler hoặc ESM support)
```

### Conditional imports

```javascript
// Chỉ import Node.js modules khi chạy trên server
// Dùng lazy loading để tránh crash ở browser

async function getServerConfig() {
  if (Platform.isNode) {
    const { readFile } = await import('fs/promises');
    const config = await readFile('./config.json', 'utf8');
    return JSON.parse(config);
  }
  return fetch('/config.json').then(r => r.json());
}

// Hoặc dùng environment variables
const isServer = typeof window === 'undefined';

if (isServer) {
  const { readFileSync } = require('fs'); // Node.js only
  const config = JSON.parse(readFileSync('./config.json'));
}
```

### React Native detection

```javascript
// React Native:
import { Platform } from 'react-native';

// Platform-specific code:
const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: { color: '#007AFF' },
      android: { color: '#3DDC84' },
      default: { color: '#000' }
    })
  }
});

// Conditional rendering:
{Platform.OS === 'ios' && <IOSPicker />}
{Platform.OS === 'android' && <AndroidPicker />}

// Platform.Version:
Platform.Version >= 13 ? <NewUI /> : <OldUI />
```

---

## 9. Các Traps Phổ Biến

### Trap 1: `window` không tồn tại trong Node.js

```javascript
// ❌ Crash ở Node.js
if (window.innerWidth < 768) {
  // do something
}

// ✅ Kiểm tra trước
if (typeof window !== 'undefined' && window.innerWidth < 768) {
  // browser
}

// ✅ Best: feature detection
if (typeof window !== 'undefined' && 'innerWidth' in window) {
  // browser with window.innerWidth
}
```

### Trap 2: `__dirname`/`__filename` không có trong ESM

```javascript
// ❌ ESM trong Node.js:
console.log(__dirname); // ReferenceError: __dirname is not defined

// ✅ ESM fix:
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Hoặc dùng import.meta:
import.meta.url;        // file URL
import.meta.dirname;    // (Node.js 20.11+)
```

### Trap 3: CommonJS và ESM không import được lẫn nhau

```javascript
// ❌ ESM import CommonJS default:
import lodash from 'lodash'; // lodash là CJS → undefined!

// ✅ Đúng:
import * as lodash from 'lodash'; // named imports
import lodash from 'lodash';     // works với interop enabled

// ❌ CommonJS require ESM:
const esmModule = require('./esm-module.mjs'); // Error!

// ✅ Nếu bắt buộc:
const { createRequire } = require('module');
const require2 = createRequire(import.meta.url);
const esm = require2('./esm-module.mjs');
```

### Trap 4: Browser và Node.js crypto khác nhau

```javascript
// ❌ Browser: window.crypto
// ❌ Node.js: require('crypto')

// ✅ Universal approach:
const getCrypto = () => {
  if (typeof globalThis.crypto !== 'undefined') {
    return globalThis.crypto;
  }
  if (typeof require !== 'undefined') {
    return require('crypto');
  }
  throw new Error('No crypto available');
};

const crypto2 = getCrypto();
crypto2.randomUUID(); // ✅ works ở mọi nơi
```

### Trap 5: JSON.stringify circular reference

```javascript
// ❌ Cả browser và Node.js đều throw
const obj = { a: 1 };
obj.self = obj;
JSON.stringify(obj); // TypeError: circular reference

// ✅ Dùng replacer:
const seen = new WeakSet();
const safeStringify = (obj) => JSON.stringify(obj, (key, value) => {
  if (typeof value === 'object' && value !== null) {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
  }
  return value;
});
```

### Trap 6: process.env không có trong browser

```javascript
// ❌ Crash ở browser
const API_URL = process.env.API_URL;

// ✅ Browser: dùng window.ENV hoặc import.meta.env
// Vite/Webpack inject env vào window:
const API_URL = import.meta.env.VITE_API_URL;

// ✅ Universal:
const getEnv = (key, fallback) => {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  if (typeof window !== 'undefined' && (window as any).ENV?.[key]) {
    return (window as any).ENV[key];
  }
  return fallback;
};

const API_URL = getEnv('API_URL', 'https://default.com');
```

---

## 10. Câu Hỏi Phỏng Vấn

### Câu 1: globalThis là gì? Tại sao cần nó?

**Trả lời:** globalThis là chuẩn ES2020 cho global object. Trước đó: `window` (browser), `global` (Node.js), `self` (Worker), `frames` (legacy). Mỗi môi trường có global riêng → cùng một code không thể truy cập global object portable. `globalThis` cung cấp một cách chuẩn duy nhất: hoạt động ở mọi nơi, không cần detect.

---

### Câu 2: Phân biệt CommonJS và ES Modules

| | CommonJS (CJS) | ES Modules (ESM) |
|--|--------------|----------------|
| Syntax | `require()`, `module.exports` | `import`, `export` |
| Loading | Synchronous | Asynchronous |
| When | Load time | Parse time |
| `this` | `module.exports` | `undefined` |
| `__dirname` | Có | Phải tính từ `import.meta.url` |
| Browser | Không (cần bundler) | Có (native support) |
| Node.js | Default | Cần `"type": "module"` |
| Circular deps | Supported, tricky | Supported, tricky |

---

### Câu 3: Web Worker vs Service Worker vs Shared Worker

| | Web Worker | Shared Worker | Service Worker |
|--|-----------|---------------|----------------|
| Scope | 1 page/tab | All tabs/pages | All tabs/pages |
| DOM access | ❌ | ❌ | ❌ |
| Lifetime | Tab close | All tabs close | Independent |
| Use case | Computation | Shared state | Caching/Proxy |
| Communication | postMessage | port.postMessage | fetch interception |
| HTTPS | Không cần | Không cần | Bắt buộc |

---

### Câu 4: Khi nào dùng Web Workers?

**Trả lời:** Dùng khi cần CPU-intensive work mà không block main thread: image/video processing, large data parsing, encryption/decryption, complex calculations. Workers chạy trong separate thread, không block UI. Dùng transferable objects để zero-copy transfer data giữa threads.

---

### Câu 5: Feature detection vs Platform detection

**Trả lời:** Feature detection kiểm tra API có tồn tại không — `typeof fetch !== 'undefined'`. Platform detection kiểm tra môi trường cụ thể — `process.versions.node`. **Feature detection preferred** vì: (1) nhiều environments converge (Node v18+ có fetch, Deno có nhiều browser APIs), (2) graceful degradation khi APIs thay đổi, (3) không phụ thuộc specific platform.

---

### Câu 6: Làm sao viết code chạy ở cả browser và Node.js?

```javascript
// ✅ Universal approach:
// 1. Dùng ESM (chuẩn)
// 2. Dùng globalThis thay vì window/global
// 3. Dùng feature detection trước khi dùng API
// 4. Lazy import Node.js modules

// Ví dụ:
const log = (msg) => {
  if (typeof console !== 'undefined') {
    console.log(msg);
  }
};

const readFile = async (path) => {
  if (typeof require !== 'undefined') {
    const { readFileSync } = await import('fs');
    return readFileSync(path, 'utf8');
  }
  // Browser: dùng fetch hoặc File API
  const response = await fetch(path);
  return response.text();
};
```

---

### Câu 7: Deno vs Bun vs Node.js — chọn cái nào?

**Trả lời:** **Node.js** cho production enterprise — stable, huge ecosystem, great tooling, battle-tested. **Deno** cho edge/serverless với security permissions hoặc khi cần TypeScript native + modern APIs. **Bun** cho development speed và performance-critical services. Thực tế: hầu hết dự án vẫn dùng Node.js. Bun và Deno đang tăng trưởng nhưng chưa ready cho tất cả production workloads.

---

### Câu 8: SSR vs CSR vs SSG vs ISG

```
Server-Side Rendering (SSR):  Server renders HTML → browser receives ready HTML
  → Next.js getServerSideProps, PHP, Rails
  → SEO tốt, initial load nhanh, data fresh

Client-Side Rendering (CSR):  Browser downloads JS → renders everything
  → React SPA, create-react-app
  → SEO khó, initial load chậm, interaction nhanh sau khi load

Static Site Generation (SSG): Build time render HTML → serve as static files
  → Next.js getStaticProps, Gatsby, Hugo
  → Nhanh nhất, deploy anywhere, data stale

Incremental Static Regeneration (ISR): SSG + background revalidation
  → Next.js revalidate option
  → Static speed + dynamic data
```

---

### Câu 9: Structured cloning có limitations gì?

```javascript
// structuredClone() (browser + Node.js 17+) deep clone objects
// Nhưng không clone được:

const obj = {};
obj.self = obj;
structuredClone(obj); // ❌ TypeError: circular reference

const fn = () => 'hello';
structuredClone(fn); // ❌ TypeError: function not supported

const sym = Symbol('test');
structuredClone({ sym }); // ❌ Symbols not cloned

const date = new Date();
structuredClone({ date }); // ✅ Dates ARE cloned

// ✅ Browser vs Node: structuredClone behavior giống nhau
// ✅ Fallback: JSON.parse(JSON.stringify(obj)) nhưng drop functions
```

---

### Câu 10: CORS có ảnh hưởng khi code chạy ở server không?

**Trả lời:** Không. CORS chỉ áp dụng cho **browser's same-origin policy enforcement**. Khi JavaScript chạy ở server (Node.js, Deno, Bun), `fetch()` không bị CORS block vì browser security model không có ở server. Server-side requests có thể gửi headers tùy ý. Đây là lý do SSR (server-side rendering) thường preferred cho API calls — tránh được CORS issues.

---

## 11. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  CROSS-PLATFORM JAVASCRIPT                                      │
│                                                               │
│  ENVIRONMENTS                                                  │
│  ├── Browser: V8/Blink, SpiderMonkey/Gecko, JSCore/WebKit    │
│  ├── Server: Node.js (V8+libuv), Deno (V8+Rust), Bun (JSC)  │
│  ├── Mobile: React Native (JSCore + native bridge)           │
│  ├── Desktop: Electron (Chromium+Node), Tauri (WebView+Rust) │
│  └── Edge: Cloudflare Workers (V8 isolates)                 │
│                                                               │
│  PORTABILITY TECHNIQUES                                        │
│  ├── globalThis: standard global object (ES2020)              │
│  ├── Feature detection: typeof fetch !== 'undefined'           │
│  ├── Conditional imports: async import() when needed          │
│  ├── ESM everywhere: works with bundlers + modern runtimes   │
│  └── Polyfills: core-js, cross-fetch                         │
│                                                               │
│  API PORTABILITY                                               │
│  ├── DOM APIs: Browser only (check window/document first)      │
│  ├── Node.js modules: fs, path, crypto, buffer — server only │
│  ├── Browser APIs: fetch, crypto, storage — mostly universal  │
│  ├── Worker globals: self, postMessage — inside workers only  │
│  └── Process: process.* — Node.js/Deno/Bun only              │
│                                                               │
│  ⚠️ window không tồn tại ở Node.js                         │
│  ⚠️ __dirname/__filename không có trong ESM                 │
│  ⚠️ CORS chỉ áp dụng ở browser                              │
│  ⚠️ Always feature-detect, not platform-detect              │
│  ⚠️ Use ESM as default: modern, universal, tree-shakeable    │
└──────────────────────────────────────────────────────────────┘
```

---

## 12. Mối Liên Hệ

```
Cross-Platform JS
  ├── Browser Engine (004) ← JS engine = V8, SpiderMonkey, JSC
  ├── Node.js Runtime (003) ← Node.js-specific modules
  ├── Module System (06)   ← ESM vs CJS portability
  ├── Event Loop (03)      ← async khắp nơi, khác biệt nhỏ
  ├── Performance (09)    ← Worker vs main thread performance
  └── System Design (10)   ← architecture cross-platform apps
```

---

## Checklist

- [ ] Hiểu các JavaScript runtime environments khác nhau
- [ ] Biết feature detection thay vì platform detection
- [ ] Dùng được globalThis cho portable global access
- [ ] Phân biệt được ESM vs CJS và khi nào dùng
- [ ] Viết được code chạy ở browser + Node.js + Deno/Bun
- [ ] Hiểu Web Workers, Shared Workers, Service Workers
- [ ] Trả lời được 8/10 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
