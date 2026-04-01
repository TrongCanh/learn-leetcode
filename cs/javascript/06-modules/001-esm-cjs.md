# ESM vs CommonJS — Sự Khác Biệt Thật Sự

## Câu hỏi mở đầu

```javascript
// CommonJS
const fs = require('fs');
module.exports = { read: fs.readFileSync };

// ES Modules
import fs from 'fs';
export const read = fs.readFileSync;
```

**Khác nhau chỉ là syntax?**

Sai. ESM và CommonJS hoạt động **khác nhau cơ bản**: timing, binding, circular dependency, tree shaking, hoisting. Hiểu sâu sự khác biệt giúp bạn tránh bugs và viết code module đúng cách.

---

## 1. CommonJS — Đặc Điểm Chi Tiết

### Require và Export

```javascript
// Export cách 1: gán cho module.exports
module.exports = { PI: 3.14, name: 'math' };

// Export cách 2: gán cho exports
exports.PI = 3.14;
exports.name = 'math';

// ⚠️ exports là reference đến module.exports
// exports = { ... } → exports không còn trỏ module.exports!
exports = { foo: 1 }; // ❌ SAI! exports không còn gì
module.exports.foo = 1; // ✅ ĐÚNG

// Import
const math = require('./math');
console.log(math.PI); // 3.14
```

### Synchronous Loading

```javascript
// require() là SYNCHRONOUS
// → Module được load TRƯỚC KHI continue

const config = require('./config'); // Blocking!
const data = require('./data');     // Blocking tiếp!
const utils = require('./utils');  // Blocking tiếp!

// ⚠️ Không thể dùng trong async contexts một cách đơn giản
// (Trừ khi dùng require trong async function sau khi module đã loaded)

// Trong ESM: require() không tồn tại
// import là ASYNCHRONOUS (ở top-level vẫn synchronous về phía engine)
```

### Module Cache

```javascript
// Module được CACHE sau lần require() đầu tiên
// require('./module') → kiểm tra cache trước

// module-a.js
console.log('Module A loaded!');
module.exports = { value: Math.random() };

// main.js
require('./module-a'); // 'Module A loaded!' → cached
require('./module-a'); // KHÔNG in 'Module A loaded!' → from cache

// ⚠️ Module cache = same object reference
const a = require('./module-a');
const b = require('./module-a');
console.log(a === b); // true — same object!

// ⚠️ Thay đổi module.exports sau khi require → affects all consumers
```

### Dynamic require

```javascript
// require() có thể là DYNAMIC — bên trong if, functions, etc.

if (ENV === 'production') {
  const db = require('./db-prod');
} else {
  const db = require('./db-dev');
}

// Hoặc dynamic path
const moduleName = getModuleName(); // runtime
const mod = require(`./modules/${moduleName}`);

// ⚠️ Bundler không biết trước modules nào được load
// → Không tree-shake được!
```

---

## 2. ES Modules — Đặc Điểm Chi Tiết

### Import và Export

```javascript
// Named exports
export const PI = 3.14;
export const name = 'math';
export function add(a, b) { return a + b; }

// Multiple exports
const VERSION = '1.0';
const VERSION_DATE = '2024-01-01';
export { VERSION, VERSION_DATE };

// Re-export
export { add, PI } from './math.js';
export * from './utils.js'; // Re-export all

// Default export
export default function multiply(a, b) { return a * b; }

// Import named
import { PI, add } from './math.js';

// Import default
import multiply from './math.js';
import { default as multiply } from './math.js'; // Equivalent

// Import all
import * as math from './math.js';
console.log(math.PI);         // 3.14
console.log(math.add(1, 2)); // 3
console.log(math.default());  // multiply function

// Namespace import
import * as ns from './math.js';
```

### Asynchronous Loading

```javascript
// Top-level import: synchronous về phía developer
// Nhưng ESM spec yêu cầu asynchronous module loading
// Browser/Node.js load modules asynchronously, nhưng đảm bảo
// modules được load theo correct order trước khi code chạy

import { add } from './math.js'; // Engine đảm bảo load xong trước khi chạy

// Dynamic import: TRULY asynchronous
const math = await import('./math.js');
console.log(math.add(1, 2));

// Conditional import
if (condition) {
  const { featureA } = await import('./feature-a.js');
} else {
  const { featureB } = await import('./feature-b.js');
}
```

### Hoisting

```javascript
// import hoisted — có thể dùng trước dòng import!
console.log(foo); // ✅ OK! import hoisted
import { foo } from './module.js';

// CJS: require không hoisted — phải gọi trước khi dùng
// const math = require('./math'); // Phải có dòng này trước
// console.log(math.add); // ✅ OK

// ⚠️ import hoisted nhưng vẫn phải là top-level
// Không thể import bên trong if/function
```

---

## 3. 5 Sự Khác Biệt Quan Trọng

### 3a. Binding vs Copy

```javascript
// CJS: export là COPY VALUE tại thời điểm require()
// ESM: export là LIVE BINDING — thay đổi ở module gốc → ảnh hưởng importers

// ESM — live binding
// counter.js
export let count = 0;
export function increment() { count++; }

// main.js
import { count, increment } from './counter.js';
console.log(count); // 0
increment();
console.log(count); // 1 ✅ — count thật sự thay đổi!

// CJS — copy (snapshot)
// counter.cjs
let count = 0;
function increment() { count++; }
module.exports = { getCount: () => count };

// main.cjs
const counter = require('./counter.cjs');
console.log(counter.getCount()); // 0
counter.increment();
console.log(counter.getCount()); // 1 ✅ — function đọc live value
// ⚠️ Nhưng không thể import count như ESM
```

### 3b. Synchronous vs Asynchronous

```javascript
// CJS — synchronous (blocking)
const fs = require('fs');
const config = require('./config'); // Blocking!

// ESM — top-level import là SYNCHRONOUS về mặt execution
// (Async về phía engine loading)
import fs from 'fs';
import config from './config';

// Dynamic import là TRULY async
const fs = await import('fs'); // Async!

// ⚠️ Mixed usage: ESM không thể import CJS trong async context
// (Nhưng có thể import CJS ở top-level trong ESM)
```

### 3c. Circular Dependency

```javascript
// CJS — circular dependency = THÀNH VẤN ĐỀ
// a.cjs
const b = require('./b');
console.log('b:', b); // {} — b exports CHƯA HOÀN THÀNH!
exports.a = 'a';

// b.cjs
const a = require('./a');
console.log('a:', a); // { a: 'a' } — OK (a đã export xong)
exports.b = 'b';

// main.cjs
require('./a');

// Output:
// b: {} ← BUG! b chưa có exports khi a require
// a: { a: 'a' }

// ESM — xử lý TỐT HƠN nhưng vẫn có vấn đề
// a.mjs
import { bValue } from './b.mjs';
export const aValue = 'a';
console.log('b:', bValue); // undefined — b chưa export xong!

// b.mjs
export const bValue = 'b';
import { aValue } from './a.mjs';
console.log('a:', aValue); // undefined — a chưa export xong!

// Fix: lazy import
// a.mjs
export const aValue = 'a';
export function getB() {
  return import('./b.mjs').then(m => m.bValue);
}
```

### 3d. this Keyword

```javascript
// CJS: this = module.exports
console.log(this === module.exports); // true (non-strict)
console.log(this); // {} (strict mode)

// ESM: this = undefined (ở top-level)
console.log(this); // undefined ✅
```

### 3e. Tree Shaking

```javascript
// ESM: bundler biết imports/exports TĨNH
// → Loại bỏ unused code
import { add } from './math.js';
// → Bundler biết: add được dùng, multiply không → loại multiply

// CJS: require() là DYNAMIC
// Bundler không biết module nào được require
// → Không tree-shake được!

// ❌ CJS không tree-shakeable
const _ = require('lodash');
const picked = _.pick(obj, ['a', 'b']);
// → Bundler giữ TOÀN BỘ lodash!

// ✅ ESM tree-shakeable
import { pick } from 'lodash-es';
const picked = pick(obj, ['a', 'b']);
// → Bundler chỉ bundle phần pick!
```

### Comparison Table

```
┌──────────────────────┬──────────────────────┬──────────────────────┐
│                      │ CommonJS               │ ES Modules            │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Loading             │ Synchronous            │ Asynchronous (spec)  │
│ Export mechanism     │ module.exports        │ export / export default │
│ Import mechanism     │ require()             │ import               │
│ Value semantics      │ Copy at require time   │ Live binding         │
│ Tree shaking         │ ❌ Not supported     │ ✅ Supported         │
│ Circular deps        │ ⚠️ Broken           │ ⚠️ Partially works  │
│ Top-level this      │ module.exports         │ undefined            │
│ Dynamic imports     │ N/A                    │ import() async       │
│ Hoisting            │ require() not hoisted │ import hoisted       │
│ Node.js support     │ ✅ Default             │ ✅ (with .mjs/.type) │
│ Browser support     │ ❌                     │ ✅ Native             │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

---

## 4. Khi Nào Dùng Gì

### Browser

```html
<!-- ES Modules là standard trong browser -->
<script type="module">
  import { add } from './math.js';
  console.log(add(1, 2));
</script>

<!-- Hoặc inline -->
<script type="module">
  import { createApp } from 'vue';
  createApp().mount('#app');
</script>
```

### Node.js

```javascript
// Cách 1: .mjs extension
// math.mjs
export const add = (a, b) => a + b;

// Cách 2: package.json type field
{
  "type": "module"
  // Tất cả .js files được xử lý là ESM
}

// Cách 3: CommonJS mặc định (không có type hoặc type: "commonjs")
{
  "type": "commonjs"
}
```

### Interoperability

```javascript
// ESM → import CJS (OK)
import fs from 'fs'; // CJS module → default export in ESM
import { readFile } from 'fs/promises'; // Named import cũng OK với ESM CJS interop

// CJS → import ESM (PHỨC TẠP)
// CJS không thể import ESM trực tiếp!
const esmModule = await import('./esm-module.mjs'); // ✅ Phải dùng dynamic import

// ❌ KHÔNG THỂ
const esm = require('./esm-module.mjs'); // ❌ Error!
```

---

## 5. Thực Hành Chuyển Đổi

### CJS → ESM

```javascript
// CJS
const fs = require('fs');
const path = require('path');
const { PI, add } = require('./math');

module.exports = {
  readFile: fs.readFileSync,
  PI,
  add
};

// ESM
import fs from 'fs';
import path from 'path';
import { PI, add } from './math.js';

export { readFile: fs.readFileSync, PI, add };
export default { readFile: fs.readFileSync, PI, add }; // default export
```

### Hybrid Exports

```javascript
// package.json
{
  "main": "./dist/index.cjs",  // CJS entry
  "exports": {
    "import": "./dist/index.mjs", // ESM entry
    "require": "./dist/index.cjs"  // CJS entry
  }
}
```

### Conditional Exports

```javascript
// package.json — conditional exports
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "default": "./dist/index.mjs"
    },
    "./feature": {
      "import": "./dist/feature.mjs",
      "require": "./dist/feature.cjs"
    }
  }
}
```

---

## 6. Các Traps Phổ Biến

### Trap 1: Mix ESM và CJS Trong Một Module

```javascript
// ❌ Không thể mix!
import fs from 'fs'; // import ở ESM context
module.exports = { data: 1 }; // export ở CJS context
// → SyntaxError!

// ✅ Chỉ chọn 1 style
// ESM:
export const data = 1;

// CJS:
module.exports = { data: 1 };
```

### Trap 2: Named Import Từ CJS Default Export

```javascript
// ❌ CJS default export không phải object!
const fs = require('fs');
// fs là MODULE OBJECT, không phải default export function

// import fs from 'fs' → works vì ESM interop
// import { readFile } from 'fs' → KHÔNG works!

// ✅ Dùng namespace import
import * as fs from 'fs';
fs.readFileSync('./file.txt');

// ✅ Hoặc default import
import fs from 'fs';
fs.readFileSync('./file.txt');
```

### Trap 3: Dynamic require Trong ESM

```javascript
// ❌ require() không tồn tại trong ESM
const moduleName = 'lodash';
const lodash = require(moduleName); // ❌ ReferenceError!

// ✅ Dùng dynamic import
const moduleName = 'lodash';
const lodash = await import(moduleName);
```

### Trap 4: __dirname Không Có Trong ESM

```javascript
// ❌ __dirname không tồn tại trong ESM
console.log(__dirname); // ❌ ReferenceError!

// ✅ Dùng import.meta
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ Hoặc import.meta.url
console.log(import.meta.url); // file:///path/to/file.js
```

### Trap 5: Side Effects Trong ESM

```javascript
// ❌ Side effect import không tree-shake được
import './analytics.js'; // Chạy analytics — bundler giữ nguyên

// ✅ Hoặc đánh dấu là side-effect-free
// package.json
{
  "sideEffects": false
}

// ⚠️ Chỉ dùng khi module không có side effects thật sự
```

---

## 7. Câu Hỏi Phỏng Vấn

### Câu 1: ESM hay CJS export là live binding?

**Trả lời:** ESM export là **live binding** — thay đổi exported variable ở module gốc → importers thấy thay đổi ngay. CJS export là **snapshot** — `module.exports` được copy tại thời điểm require. Với CJS, nếu module thay đổi `module.exports` sau khi require → importers không thấy (vì đã copy). Tuy nhiên, object mutations (`.push()`, `.x =`) vẫn là live trong cả hai vì object reference.

---

### Câu 2: Tại sao CommonJS không tree-shake được?

**Trả lời:** `require()` là **dynamic** — có thể gọi bên trong `if`, functions, loops, tùy thuộc runtime values. Bundler không thể phân tích static để biết trước module nào được load. ES `import` là **static** — phải ở top-level, không trong conditional blocks. Bundler phân tích được import graph tại compile time → dead code elimination → tree shaking.

---

### Câu 3: Circular dependencies trong ESM vs CJS?

**Trả lời:** CJS circular: A requires B trước khi A export xong → B nhận empty `module.exports`. ESM circular: xử lý tốt hơn nhờ live bindings, nhưng vẫn có vấn đề khi dùng exported values trong module initialization. Fix cho cả hai: tách shared state ra module riêng, hoặc dùng lazy imports (function trả về promise).

---

### Câu 4: Performance: ESM vs CommonJS?

**Trả lời:** (1) **Initial load**: ESM có overhead cho async loading/parsing. CJS đơn giản hơn. (2) **Bundle size**: ESM + tree shaking → bundle nhỏ hơn. (3) **Runtime**: tương đương sau khi loaded. (4) **Caching**: cả hai đều cache modules. ESM: module records cached. CJS: module.exports cached. Recommendation: dùng ESM cho mới projects, dùng ESM trong Node.js với `"type": "module"`.

---

### Câu 5: import vs import() — khác nhau?

**Trả lời:** `import` (static): phải ở top-level, hoisted, parsed at compile time. `import()` (dynamic): async, trả về Promise, có thể dùng trong conditionals/loops. Use cases: `import()` cho lazy loading, code splitting, conditional imports. `import` cho static dependencies.

---

## 8. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  ESM vs CJS                                                     │
│                                                               │
│  COMMONJS                                                       │
│  ├── require() = synchronous                               │
│  ├── module.exports = snapshot at require time           │
│  ├── Not tree-shakeable (dynamic require)              │
│  ├── __dirname available                                │
│  ├── this = module.exports                             │
│  └── Circular deps: broken (empty exports)             │
│                                                               │
│  ES MODULES                                                    │
│  ├── import = asynchronous spec, sync developer experience  │
│  ├── export = live binding (reflected by importers)      │
│  ├── Tree-shakeable (static imports)                   │
│  ├── import.meta.url (no __dirname)                   │
│  ├── this = undefined                                  │
│  ├── Circular deps: better but still problematic        │
│  └── import() dynamic = async                         │
│                                                               │
│  WHEN TO USE                                                   │
│  ├── Browser: ESM only                                   │
│  ├── Node.js: ESM (type: module) recommended          │
│  ├── Library: export both ESM + CJS                  │
│  └── Legacy: CJS OK                                    │
│                                                               │
│  ⚠️ Cannot mix ESM and CJS in same module             │
│  ⚠️ CJS cannot import ESM synchronously             │
│  ⚠️ ESM requires .js extension in imports             │
│  ⚠️ __dirname unavailable in ESM → import.meta       │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Phân biệt được ESM và CJS về timing và binding
- [ ] Hiểu live binding vs copy
- [ ] Hiểu tại sao CJS không tree-shake được
- [ ] Xử lý được circular dependencies
- [ ] Chuyển đổi được CJS ↔ ESM
- [ ] Tránh được 5 traps phổ biến
- [ ] Trả lời được 4/5 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
