# Tree Shaking — Bundlers Loại Bỏ Dead Code

## Câu hỏi mở đầu

```javascript
// Bạn dùng lodash
import _ from 'lodash';

// Bundle size: 70KB gốc
// Nhưng chỉ dùng 2 functions
import { pick, flatten } from 'lodash';

// Bundle size sau khi build: 70KB hay 2KB?
// → Tree shaking quyết định!

// Hoặc tệ hơn:
import moment from 'moment';
// Bundle: 67KB
// Bạn chỉ dùng format date!
```

**Tree shaking = bundler tự loại bỏ code không bao giờ được sử dụng.** Không phải magic — nó dựa trên ES Modules static structure. Hiểu cách hoạt động giúp bạn viết code bundle-size-friendly và debug khi tree shaking không hoạt động.

---

## 1. Tree Shaking Hoạt Động Như Thế Nào

### Điều kiện tiên quyết

```javascript
// Tree shaking chỉ hoạt động với ES Modules vì:
// 1. ESM có STATIC imports/exports — bundler biết trước
// 2. CJS require() là dynamic — bundler không biết trước

// ✅ ES Modules — tree-shakeable
import { pick } from 'lodash';     // Bundler biết chính xác
import { flatten } from 'lodash';  // Bundler biết chính xác

// ❌ CommonJS — KHÔNG tree-shakeable
const _ = require('lodash');       // Bundler không biết dùng gì
const { pick } = require('lodash'); // Có thể tree-shake nhưng không đáng tin
```

### Cơ chế bên trong

```
┌─────────────────────────────────────────────────────────────┐
│  BUNDLING PROCESS                                             │
│                                                               │
│  1. PARSE: Bundler đọc file, xây dựng module graph         │
│     import { pick } from 'lodash';                           │
│                                                               │
│  2. MARK: Bundler đánh dấu tất cả reachable exports        │
│     từ entry point                                          │
│     Entry → main.js → uses: pick → mark: ✅ picked          │
│                            → unused: flatten → mark: ❌     │
│                                                               │
│  3. ELIMINATE: Loại bỏ exports không được mark              │
│     flatten bị loại → không có trong bundle                 │
│                                                               │
│  4. MINIFY (production): Dead code elimination tiếp         │
│     Loại bỏ: unreachable code, unused variables            │
└─────────────────────────────────────────────────────────────┘
```

### Ví dụ minh họa

```javascript
// math.js — 5 exports, nhưng main chỉ dùng 1
export function add(a, b) { return a + b; }
export function subtract(a, b) { return a - b; }
export function multiply(a, b) { return a * b; }
export function divide(a, b) { return a / b; }
export function power(a, b) { return Math.pow(a, b); }

// main.js
import { add } from './math.js';
console.log(add(2, 3));

// Bundle output:
function add(a, b) { return a + b; }     // ✅ Giữ lại
// subtract, multiply, divide, power — BỊ LOẠI
console.log(add(2, 3));
```

### Tree Shaking ≠ Dead Code Elimination

```
┌──────────────────────────────────────────────────────────────┐
│  TREE SHAKING                                                  │
│  ├── Bundler level (Webpack, Rollup, Vite)                   │
│  ├── Dựa trên ES Modules static imports/exports              │
│  └── Loại bỏ unused EXPORTS                                 │
│                                                               │
│  DEAD CODE ELIMINATION                                        │
│  ├── Minifier level (Terser, esbuild)                        │
│  ├── Loại bỏ unreachable code, unused variables            │
│  └── Dựa trên static analysis hoặc runtime checks          │
│                                                               │
│  CẢ HAI CÙNG HOẠT ĐỘNG — nhưng ở levels khác nhau          │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Side Effects — Khi Nào Bundler Không Dám Loại

### Định nghĩa

```javascript
// Side effect = code chạy khi module được import
// Bundler PHẢI giữ side effect code vì nó ảnh hưởng global state

// Ví dụ side effect:
import './setup-global.js';     // Ghi vào window, chạy immediately
import './register-service-worker.js'; // Đăng ký SW
import './polyfills.js';        // Patch built-in objects

// Không side effect:
import { add } from './math.js'; // Chỉ import, không chạy gì
add(1, 2);                       // Mới chạy khi gọi
```

### sideEffects Trong package.json

```javascript
// package.json

// ✅ sideEffects: false
// Nói với bundler: "Module này không có side effects"
// Bundler tự do loại bỏ bất kỳ export nào không được dùng
{
  "name": "my-lib",
  "sideEffects": false
}

// ⚠️ sideEffects: ["*.css", "*.scss"]
// Chỉ CSS files có side effects
// Tất cả JS modules: bundler tự do tree-shake
{
  "sideEffects": ["*.css", "*.scss", "./src/analytics.js"]
}

// ❌ sideEffects: true (default)
// Bundler giả định TẤT CẢ modules có side effects
// Không dám loại bỏ gì
{
  "sideEffects": true
}
```

### Ví dụ: Library viết đúng

```javascript
// lodash-es — ES Modules + sideEffects: false
// import { pick } from 'lodash-es';
// → Chỉ bundle phần pick, không bundle phần còn lại

// lodash — CommonJS + sideEffects: false trong bundle config
// import { pick } from 'lodash';
// → Nếu bundler không xử lý CJS tốt → bundle toàn bộ lodash!

// ✅ Dùng lodash-es thay vì lodash
import { pick, flatten } from 'lodash-es';
// Bundle size: ~3KB thay vì ~70KB
```

---

## 3. Viết Code Tree-Shakeable

### ĐÚNG — Code thân thiện với Tree Shaking

```javascript
// ✅ Side-effect free exports
export function add(a, b) { return a + b; }
export function multiply(a, b) { return a * b; }
export const PI = 3.14159;

// ✅ Pure functions — same input → same output
export function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ✅ Static exports
export const UTILITIES = {
  formatDate: (d) => d.toISOString(),
  formatNumber: (n) => n.toLocaleString()
};
```

### SAI — Code không Tree-Shakeable

```javascript
// ❌ Side effects trong export
export function initAnalytics() {
  window.gtag = function() {}; // Ghi vào global!
  return 'initialized';
}

// ❌ Conditional exports — bundler không biết
if (process.env.NODE_ENV === 'production') {
  module.exports = { prodFn: () => {} };
} else {
  module.exports = { devFn: () => {} };
}

// ❌ Reassign exports
exports.publicFn = () => {};
exports = { otherFn: () => {} }; // exports bị overwrite!

// ❌ Dynamic property assignment
const lib = {};
lib['add'] = (a, b) => a + b;
export default lib;
```

### Class và Tree Shaking

```javascript
// ✅ Class exports — tree-shakeable nếu class được dùng
export class User {
  constructor(name) { this.name = name; }
  greet() { return `Hello ${this.name}`; }
}

// Usage:
import { User } from './user.js';
new User('Alice');
// User class được bundle

// ❌ Nếu User không được dùng → class bị loại
import { User } from './user.js'; // không dùng
// → User bị tree-shaken

// ✅ Export methods riêng thay vì cả class
export function createUser(name) { return { name }; }
export function greetUser(user) { return `Hello ${user.name}`; }
```

---

## 4. Cấu Hình Trong Thực Tế

### Webpack

```javascript
// webpack.config.js

module.exports = {
  mode: 'production', // ← Tree shaking TỰ ĐỘNG bật ở production

  // Hoặc tường minh:
  optimization: {
    usedExports: true,     // Đánh dấu exports nào được dùng
    minimize: true,        // Minifier loại bỏ thêm
    sideEffects: true      // Đọc sideEffects từ package.json
  }
};
```

```json
// package.json — nếu muốn webpack đọc
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "./src/polyfills.js"
  ]
}
```

### Vite

```javascript
// vite.config.js
// Vite dùng Rollup → tree shaking mặc định

import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',        // ES modules hiện đại
    minify: 'esbuild',      // esbuild tree-shakes rất tốt
    rollupOptions: {
      output: {
        manualChunks: {
          // Tách vendor thành chunk riêng
          vendor: ['lodash-es', 'react', 'react-dom']
        }
      }
    }
  }
});
```

### Rollup

```javascript
// rollup.config.js
// Rollup là king của tree shaking

export default {
  input: 'src/main.js',
  output: {
    format: 'esm',
    dir: 'dist'
  },
  treeshake: {
    // Module level vs block level
    moduleSideEffects: false, // Bỏ qua side effects
    propertyReadSideEffects: false, // Property reads thường không có side effects
    tryCatchDeoptimization: false
  }
};
```

### esbuild

```javascript
// esbuild tự động tree-shakes trong production
// Không cần config phức tạp!

// CLI:
esbuild src/main.js --bundle --outfile=dist/bundle.js --minify --target=es2020

// Hoặc config:
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/main.js'],
  bundle: true,
  minify: true,           // Tree shake + dead code elimination
  target: ['es2020'],
  format: 'esm',
  outdir: 'dist'
});
```

### Khi Nào Tree Shaking KHÔNG Hoạt Động

```javascript
// ❌ CommonJS modules
const _ = require('lodash');           // Bundler không tree-shake được
const { pick } = require('lodash');    // Không đáng tin

// ✅ Fix: Dùng ESM version
import { pick } from 'lodash-es';       // Tree-shake được!

// ❌ Dynamic imports phức tạp
import(condition ? './a.js' : './b.js');

// ❌ eval() hoặc Function() constructor
const fn = new Function('return ' + codeString);

// ❌ Reflections
const lib = await import(reflectedPath);

// ❌ Side effects trong exports
export function init() {
  globalThis.ready = true; // Bundler phải giữ
}
```

---

## 5. Benchmark — Tree Shaking Thực Sự Tiết Kiệm Bao Nhiêu?

### Lodash vs lodash-es

```javascript
// Import full library
import _ from 'lodash';
// Bundle (minified): ~70KB

// Import từng function (CJS)
import { pick } from 'lodash';
// Bundle: ~70KB (CJS không tree-shake tốt!)

// Import từ ESM version
import { pick } from 'lodash-es';
// Bundle: ~2.5KB

// Import từng function cụ thể (recommended)
import pick from 'lodash/pick';
// Bundle: ~3.7KB

// Native JS thay thế
const obj = { a: 1, b: 2 };
const picked = Object.fromEntries(
  Object.entries(obj).filter(([key]) => ['a'].includes(key))
);
// Bundle: ~0KB!
```

### React — Import Toàn Bộ vs Chỉ Dùng

```javascript
// ❌ Import toàn bộ React
import React from 'react';
// Bundle: ~44KB (React core)

// ✅ Import chỉ dùng
import { useState, useEffect } from 'react';
// Bundle: Chỉ phần useState + useEffect (~3KB)

// ✅ Hoặc dùng named imports cụ thể
// React 17+ JSX transform không cần import React cho JSX
// Chỉ cần import hooks
```

### Date Library Comparison

```javascript
// moment.js — 67KB minified, không tree-shake
import moment from 'moment';
moment().format('YYYY-MM-DD');

// date-fns — tree-shakeable, ~3KB cho date formatting
import { format } from 'date-fns';
format(new Date(), 'yyyy-MM-dd');

// dayjs — ~2KB, nhưng không tree-shake được nếu dùng plugins
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
dayjs.extend(advancedFormat);
```

### Thực Hành: Kiểm Tra Bundle Size

```javascript
// 1. Build với bundle analyzer
// webpack-bundle-analyzer
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: true,
      reportFilename: 'bundle-report.html'
    })
  ]
};

// 2. CLI: so sánh bundle size
npx webpack --mode production
# Xem file sizes trong output

// 3. Import thông minh
// ❌ import { Button } from 'antd';
// Button + toàn bộ antd CSS → ~1MB!

// ✅ Chỉ import Button
import Button from 'antd/es/button';
// Chỉ ~10KB

// ✅ Hoặc dùng babel-plugin-import
// auto-convert: import { Button } from 'antd' → import Button from 'antd/es/button'
```

---

## 6. Real-World Examples

### Utility Library — Viết Tree-Shakeable

```javascript
// utils/string.js — mỗi function riêng export
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function truncate(str, length = 50) {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatPhone(phone) {
  const cleaned = ('' + phone).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone;
}

// barrel export
// utils/index.js
export { capitalize, truncate, slugify, formatPhone } from './string.js';
export { debounce, throttle } from './timing.js';
export { cloneDeep, shallowClone } from './object.js';

// User chỉ import cái cần:
// import { slugify } from './utils';
// → Chỉ slugify được bundle!
```

### Component Library — CSS Tree Shaking

```javascript
// ❌ Global CSS — không tree-shake
import './styles.css';
// Tất cả styles được bundle, kể cả không dùng

// ✅ CSS Modules — chỉ bundle styles đang dùng
import styles from './Button.module.css';
// Chỉ Button styles được bundle

// ✅ Tailwind CSS — utility-first, tree-shakes CSS
// Cấu hình:
module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx,vue}'],
  // Chỉ classes được dùng trong source files → được bundle
  // Unused classes → bị loại
};

// ✅ CSS-in-JS (styled-components)
import styled from 'styled-components';

const Button = styled.button`
  padding: 8px 16px;
  background: blue;
`;
// Chỉ Button styles được bundle
```

---

## 7. Các Traps Phổ Biến

### Trap 1: Tưởng đã tree-shake nhưng không

```javascript
// ❌ Mặc dù dùng ES Modules, bundler không dám loại
import _ from 'lodash-es';
const picked = _.pick(obj, ['a', 'b']);

// Bundler không biết _.pick có side effects không
// → Giữ toàn bộ lodash-es!

// ✅ Đúng cách
import { pick } from 'lodash-es';
const picked = pick(obj, ['a', 'b']);

// Bundler biết chắc chỉ dùng pick
// → Chỉ bundle phần pick!
```

### Trap 2: Re-export all không tree-shake được

```javascript
// ❌ index.js re-export all
export * from './a.js';
export * from './b.js';
export * from './c.js';

// Nếu a.js có side effect:
export function fn() { sideEffect(); }
export * from './a.js'; // ⚠️ Bundler giữ toàn bộ a.js

// ✅ Chỉ định exports rõ ràng
export { fn, otherFn } from './a.js';
// Chỉ fn và otherFn được re-export
```

### Trap 3: Default Export vs Named Export

```javascript
// ❌ Default export — bundler không biết có dùng không
export default function utility() {}
// import utility from './utils';
// → Bundler không chắc có dùng utility không

// ✅ Named export — rõ ràng
export function utility() {}
export function anotherUtility() {}
// import { utility } from './utils';
// → Bundler chắc chắn: utility được dùng → ok!
// → anotherUtility không dùng → loại!
```

### Trap 4: Side Effect Thực Sự Nhưng Không Được Đánh Dấu

```javascript
// setup.js — có side effect nhưng không đánh dấu
import './setup.js'; // Ghi vào window!

// package.json
{
  "sideEffects": false  // ⚠️ Sai! setup.js có side effect!
}

// → Bundler loại bỏ setup.js → app crash!

// ✅ Đúng
{
  "sideEffects": ["./src/setup.js", "*.css"]
}
```

### Trap 5: Production vs Development

```javascript
// ❌ Development build không tree-shake
// webpack --mode development → bundle đầy đủ, readable
// webpack --mode production → tree-shake + minify

// Kiểm tra: luôn build ở production mode
npm run build -- --mode production

// Hoặc:
NODE_ENV=production npm run build
```

---

## 8. Câu Hỏi Phỏng Vấn

### Câu 1: Tree shaking hoạt động như thế nào?

**Trả lời:** Bundler (Webpack/Rollup/Vite) đọc ES Modules tĩnh, xây dựng module graph từ entry point, đánh dấu exports nào được reachable. Exports không được đánh dấu → loại bỏ. Quá trình gồm: (1) Parse imports/exports tĩnh. (2) Mark reachable exports. (3) Eliminate unused exports. (4) Minifier loại bỏ thêm dead code.

---

### Câu 2: Tại sao CommonJS không tree-shake tốt?

**Trả lời:** `require()` là dynamic — có thể gọi trong if, function, loop. Bundler không thể biết trước module nào được load. `import` là static — phải ở top-level, không trong conditional blocks. Bundler biết chính xác module graph tại compile time.

---

### Câu 3: Làm sao đảm bảo thư viện tree-shake được?

**Trả lời:** (1) Chọn thư viện có ESM version (lodash-es thay vì lodash). (2) Import chỉ function cần: `import { pick } from 'lodash-es'`. (3) Kiểm tra package.json của thư viện có `"sideEffects": false`. (4) Đọc documentation xem cách import đúng. (5) Build và kiểm tra bundle size bằng bundle analyzer.

---

### Câu 4: sideEffects trong package.json là gì?

**Trả lời:** `sideEffects: false` nói với bundler rằng module này không có side effects. Bundler tự do loại bỏ exports không được dùng. `sideEffects: true` (default) nói rằng tất cả modules có thể có side effects — bundler giữ tất cả. Có thể chỉ định files cụ thể: `sideEffects: ["*.css", "./src/setup.js"]`.

---

### Câu 5: Dead Code Elimination vs Tree Shaking?

**Trả lời:** Tree shaking là bundler-level, dựa trên ES Modules static imports/exports, loại unused exports. Dead Code Elimination là minifier-level (Terser/esbuild), dựa trên static analysis hoặc runtime checks, loại unreachable code và unused variables sau khi bundle. Cả hai cùng giảm bundle size nhưng ở levels khác nhau.

---

### Câu 6: Performance impact của tree shaking?

**Trả lời:** (1) **Bundle size nhỏ hơn** → download nhanh hơn, parse nhanh hơn. (2) **Initial load nhanh hơn** → đặc biệt quan trọng trên mobile. (3) **Memory footprint nhỏ hơn** → runtime ít code hơn. (4) Không impact performance runtime — code vẫn chạy như bình thường. (5) Tree shaking thêm build time nhưng không đáng kể.

---

## 9. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  TREE SHAKING                                                  │
│                                                               │
│  CƠ CHẾ                                                      │
│  ├── Bundler phân tích ES Modules static imports            │
│  ├── Mark exports nào reachable từ entry point             │
│  ├── Loại bỏ exports không được dùng                      │
│  └── Minifier loại dead code tiếp                          │
│                                                               │
│  ĐIỀU KIỆN                                                     │
│  ├── ES Modules (import/export tĩnh)                       │
│  ├── sideEffects: false trong package.json                │
│  ├── Bundler ở production mode                              │
│  └── Thư viện support ES Modules                           │
│                                                               │
│  CẤU HÌNH                                                     │
│  ├── Webpack: optimization.usedExports: true              │
│  ├── Vite: tự động, dùng Rollup                        │
│  ├── Rollup: treeshake option                             │
│  └── esbuild: tự động khi minify                         │
│                                                               │
│  ⚠️ CJS không tree-shake tốt — dùng ESM version       │
│  ⚠️ Default exports không rõ ràng bằng named exports  │
│  ⚠️ sideEffects phải đúng — loại nhầm → crash       │
│  ⚠️ Kiểm tra bằng bundle analyzer                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Hiểu cơ chế tree shaking (mark → eliminate)
- [ ] Biết tại sao ES Modules tree-shake được, CJS không
- [ ] Cấu hình được sideEffects trong package.json
- [ ] Viết được code tree-shakeable
- [ ] So sánh được bundle sizes (lodash vs lodash-es)
- [ ] Trả lời được 5/6 câu hỏi phỏng vấn
- [ ] Dùng bundle analyzer để verify

---

*Last updated: 2026-04-01*
