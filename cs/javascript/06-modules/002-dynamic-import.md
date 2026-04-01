# Dynamic Import — Tải Code Khi Cần, Không Phải Trước

## Câu hỏi mở đầu

```javascript
// App của bạn có 50 pages:
// - Home, About, Contact, FAQ, Pricing...
// - Dashboard, Analytics, Reports, Settings, Admin Panel
// - Heavy: Chart (300KB), PDF viewer (500KB), Code Editor (400KB)

// Nếu tải tất cả ngay lập tức:
// → Bundle = 2MB
// → User đợi 8 giây để thấy trang Home!
// → Trong khi họ chỉ cần trang Home!

// User click "Dashboard":
// → Dashboard + Chart + Report = 1MB thêm
// → User đợi thêm 4 giây!

// Câu hỏi: Tại sao phải tải 2MB khi user chỉ dùng 10%?
```

**Dynamic import** là kỹ thuật tải JavaScript module **khi cần**, không phải trong initial bundle. Kết hợp với code splitting, đây là cách hiệu quả nhất để giảm initial bundle size và improve time-to-interactive.

---

## 1. Static Import vs Dynamic Import

### Static import

```javascript
// Static import — phân tích và tải NGAY KHI file được parse
// Tất cả dependencies được resolve trước khi code chạy

// math-utils.js
export function add(a, b) { return a + b; }
export function multiply(a, b) { return a * b; }
export function divide(a, b) { return a / b; }
export function power(a, b) { return Math.pow(a, b); }

// app.js — TẤT CẢ được bundle cùng nhau
import { add, multiply, divide, power } from './math-utils.js';

add(2, 3); // Tất cả 4 functions có trong bundle
```

### Dynamic import

```javascript
// Dynamic import — tải module KHI CẦN (async)
// Trả về Promise<Module>

// Chỉ tải khi dòng này được execute
const module = await import('./math-utils.js');
const result = module.add(2, 3);

// Hoặc destructuring ngay
const { add, multiply } = await import('./math-utils.js');
const result = add(2, 3);
```

### So sánh chi tiết

```
┌──────────────────────────────────────────────────────────────┐
│  STATIC vs DYNAMIC IMPORT                                     │
│                                                               │
│  STATIC                                                       │
│  ├── Syntax: import { x } from './module'                   │
│  ├── Timing: parsed và resolved TRƯỚC execution             │
│  ├── Bundle: luôn có trong initial bundle                    │
│  ├── Conditions: không thể trong if/function dynamically    │
│  └── Use: dependencies cần ngay từ đầu                     │
│                                                               │
│  DYNAMIC                                                      │
│  ├── Syntax: const { x } = await import('./module')         │
│  ├── Timing: tải KHI được executed                          │
│  ├── Bundle: tách thành chunk riêng                        │
│  ├── Conditions: có thể trong if/function                  │
│  └── Use: heavy modules, conditional code, lazy loading     │
│                                                               │
│  ⚠️ Dynamic import = luôn trả về Promise                  │
└──────────────────────────────────────────────────────────────┘
```

### Syntax variants

```javascript
// 1. Promise.then() — đầy đủ tương thích
import('./module.js')
  .then(module => {
    module.doSomething();
  })
  .catch(err => console.error('Load failed:', err));

// 2. await import() — clean syntax (ES2022)
const module = await import('./module.js');

// 3. async wrapper function
async function loadModule(name) {
  if (name === 'chart') {
    return await import('./chart.js');
  }
  return await import('./utils.js');
}

// 4. Preloading
const promise = import('./heavy-module.js'); // Bắt đầu tải
// ... làm gì đó ...
const module = await promise; // Đã tải xong rồi!
```

---

## 2. Code Splitting — Cắt Bundle Thành Phần Nhỏ

### webpack automatic splitting

```javascript
// webpack tự động tạo chunks khi dùng dynamic import
// entry.js:
const btn = document.getElementById('load-chart');

btn.addEventListener('click', async () => {
  // Webpack: tách chart.js thành chunk riêng
  const { renderChart } = await import('./chart.js');
  renderChart();
});

// Build output:
// - main.js (core app)
// - src_chart_js.js (chunk — chỉ load khi click)

// Network tab:
// Click → request src_chart_js.js → load xong → execute
```

### Chunk naming với magic comments

```javascript
// webpackChunkName: đặt tên chunk file
// webpackPreload: tải khi browser idle (sau initial load)
// webpackPrefetch: tải khi network rảnh

// Đặt tên chunk:
const { Chart } = await import(
  /* webpackChunkName: "vendor-chart" */
  './chart.js'
);

// Build output:
// vendor-chart.js (thay vì random hash)

// Preload: tải với priority cao, ngay sau initial chunk
const { Chart } = await import(
  /* webpackChunkName: "chart" */
  /* webpackPreload: true */
  './chart.js'
);

// Prefetch: tải khi browser idle
const { Editor } = await import(
  /* webpackChunkName: "editor" */
  /* webpackPrefetch: true */
  './editor.js'
);

// Load component với React.lazy:
const HeavyDashboard = lazy(() =>
  import(
    /* webpackChunkName: "dashboard" */
    /* webpackPrefetch: true */
    './pages/Dashboard.js'
  )
);
```

---

## 3. Lazy Loading Trong React

### React.lazy + Suspense

```javascript
import { lazy, Suspense } from 'react';

// ❌ Static import — tải ngay lập tức
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';
import Charts from './pages/Charts';

// ✅ Lazy load — chỉ tải khi render
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Settings = lazy(() => import('./pages/Settings'));
const Charts = lazy(() => import('./pages/Charts'));

// Suspense: hiển thị fallback khi đang load
function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/charts" element={<Charts />} />
      </Routes>
    </Suspense>
  );
}
```

### Error boundary cho lazy components

```javascript
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Lazy với error handling
const Dashboard = lazy(() =>
  import('./pages/Dashboard.js').catch(err => {
    console.error('Failed to load Dashboard:', err);
    return { default: () => <DashboardError /> };
  })
);

// Error boundary để catch errors từ lazy loading
function App() {
  return (
    <ErrorBoundary FallbackComponent={SomethingWentWrong}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
```

### Route-based splitting pattern

```javascript
// React Router v6: mỗi route = lazy chunk riêng
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Admin = lazy(() => import('./pages/Admin'));
const Checkout = lazy(() => import('./pages/Checkout'));

function App() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        {/* Core pages: loaded immediately */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />

        {/* Heavy pages: loaded on demand */}
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/admin/*" element={<Admin />} />
      </Routes>
    </Suspense>
  );
}

// Build output:
// main.js: Home + Products + ProductDetail + Cart (core pages)
// checkout.js: checkout chunk
// admin.js: admin chunk (only admin users download!)
```

---

## 4. Preload và Prefetch

### Preload

```javascript
// Preload: tải resource với HIGH PRIORITY
// Dùng khi: resource sẽ cần trong tương lai gần

// Cách 1: <link rel="preload">
<head>
  <link rel="preload" as="script" href="/chunk-dashboard.js">
</head>

// Cách 2: JavaScript
const preloadLink = document.createElement('link');
preloadLink.rel = 'preload';
preloadLink.as = 'script';
preloadLink.href = '/chunk-heavy.js';
document.head.appendChild(preloadLink);

// Cách 3: webpack magic comment
import(
  /* webpackPreload: true */
  './Dashboard.js'
);
```

### Prefetch

```javascript
// Prefetch: tải resource với LOW PRIORITY, khi browser IDLE
// Dùng khi: resource cần cho page/flow tiếp theo

// Cách 1: <link rel="prefetch">
<head>
  <link rel="prefetch" as="script" href="/chunk-admin.js">
</head>

// Cách 2: webpack magic comment
const AdminPanel = lazy(() =>
  import(
    /* webpackChunkName: "admin" */
    /* webpackPrefetch: true */
    './AdminPanel.js'
  )
);

// Cách 3: Dynamic import on hover
const preloadOnHover = (url) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'script';
  link.href = url;
  document.head.appendChild(link);
};

document.querySelectorAll('[data-prefetch]').forEach(link => {
  link.addEventListener('mouseenter', () => {
    preloadOnHover(link.dataset.prefetch);
  }, { once: true });
});
```

### Preload vs Prefetch

```
┌──────────────────────────────────────────────────────────────┐
│  PRELOAD vs PREFETCH                                          │
│                                                               │
│  Preload                                                     │
│  ├── Priority: HIGH (ngay sau initial load)               │
│  ├── Timing: download ngay lập tức                          │
│  ├── Use: sẽ cần trong page hiện tại                    │
│  └── Example: critical CSS, hero image                      │
│                                                               │
│  Prefetch                                                    │
│  ├── Priority: LOW (browser idle)                           │
│  ├── Timing: tải khi network rảnh                         │
│  ├── Use: cho page/flow tiếp theo                        │
│  └── Example: admin panel, checkout page                     │
│                                                               │
│  webpackMagic:                                               │
│  /* webpackPreload: true */  → high priority              │
│  /* webpackPrefetch: true */ → low priority               │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Conditional Import

### Environment-based import

```javascript
// Import khác nhau tùy environment
async function getAdapter() {
  if (typeof window !== 'undefined') {
    // Browser
    const { LocalStorageAdapter } = await import('./browser/StorageAdapter.js');
    return new LocalStorageAdapter();
  } else {
    // Node.js
    const { FileSystemAdapter } = await import('./nodejs/StorageAdapter.js');
    return new FileSystemAdapter();
  }
}

// Feature detection
async function getFeature() {
  // Dùng API mới nếu supported, fallback nếu không
  if ('structuredClone' in globalThis) {
    return await import('./structured-clone-polyfill.js');
  }
  const { legacyClone } = await import('./legacy-clone.js');
  return legacyClone;
}
```

### Locale-based import (i18n)

```javascript
// Tải translation theo ngôn ngữ user
const translations = {
  en: () => import('./locales/en.json'),
  vi: () => import('./locales/vi.json'),
  fr: () => import('./locales/fr.json'),
};

async function setLocale(locale) {
  const messages = await translations[locale]();

  // Update app
  Object.keys(messages).forEach(key => {
    document.querySelector(`[data-i18n="${key}"]`)
      .textContent = messages[key];
  });
}

// Lazy load translation khi user đổi ngôn ngữ
document.querySelectorAll('[data-locale]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    setLocale(e.target.dataset.locale);
  });
});
```

### Feature-flagged import

```javascript
// Import code dựa trên feature flags
const features = {
  newDashboard: true,
  betaEditor: false,
};

async function loadFeature(name) {
  if (!features[name]) return null;

  const modules = {
    newDashboard: () => import('./features/NewDashboard.js'),
    betaEditor: () => import('./features/BetaEditor.js'),
  };

  const loader = modules[name];
  if (!loader) return null;

  return await loader();
}

// Load new dashboard if enabled
if (features.newDashboard) {
  const NewDashboard = await loadFeature('newDashboard');
  render(NewDashboard);
}
```

---

## 6. Module Caching — Import Chỉ Load Một Lần

### Module cache

```javascript
// JavaScript engine cache modules — không load lại dù gọi nhiều lần
const a = await import('./module.js'); // Lần 1: fetch + parse + execute
const b = await import('./module.js'); // Lần 2: từ cache (instant!)
console.log(a === b); // true — cùng module instance!

// Điều này quan trọng:
let moduleRef = null;

async function getModule() {
  if (!moduleRef) {
    moduleRef = await import('./expensive.js');
  }
  return moduleRef; // Cache — không fetch lại
}
```

### Cache invalidation

```javascript
// Module cache tồn tại SUỐT QUÁ TRÌNH runtime
// Không có cách chính thức để "unload" module
// Trong trình duyệt: refresh page = clear cache

// ⚠️ Module singleton pattern:
const store = await import('./store.js');
store.dispatch({ type: 'INIT' });

// Module không bao giờ re-execute
// Kể cả import lại 100 lần

// Muốn reset: phải refresh page
```

---

## 7. Các Traps Phổ Biến

### Trap 1: Dynamic import trong vòng lặp

```javascript
// ❌ Load nhiều lần — không cần thiết
async function loadAll(items) {
  for (const item of items) {
    const handler = await import(`./handlers/${item}.js`);
    handler.process(item);
  }
}

// ✅ Load tất cả cùng lúc
async function loadAll(items) {
  const modules = await Promise.all(
    items.map(item => import(`./handlers/${item}.js`))
  );
  modules.forEach((handler, i) => handler.process(items[i]));
}
```

### Trap 2: Quên try-catch

```javascript
// ❌ Không handle error
const { func } = await import('./missing-module.js');
// → Unhandled promise rejection!

// ✅ Always handle
try {
  const { func } = await import('./module.js');
  func();
} catch (err) {
  console.error('Failed to load module:', err);
  // Show error UI
}
```

### Trap 3: Import CSS trong dynamic import

```javascript
// ❌ CSS có thể không load đúng lúc
await import('./heavy-component.js');
// → Component render trước khi CSS ready!

// ✅ Load CSS trước:
await import('./styles.css'); // CSS side-effect import
await import('./heavy-component.js');
render(); // CSS đã load

// Hoặc:
import('./heavy-component.js');
import('./heavy-component.css');
```

### Trap 4: Preload/prefetch overkill

```javascript
// ❌ Prefetch tất cả pages = chặn bandwidth
const allPages = ['admin', 'reports', 'settings', 'analytics'];
allPages.forEach(page => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = `/pages/${page}.js`;
  document.head.appendChild(link);
});
// → Prefetch tất cả = slow initial load!

// ✅ Chỉ prefetch navigation target
document.querySelectorAll('a[href^="/admin"]').forEach(link => {
  link.addEventListener('mouseenter', () => {
    // Prefetch khi hover — không block initial
    const url = new URL(link.href).pathname;
    const chunk = getChunkName(url);
    const preload = document.createElement('link');
    preload.rel = 'prefetch';
    preload.href = `/chunks/${chunk}.js`;
    document.head.appendChild(preload);
  }, { once: true });
});
```

### Trap 5: Dynamic import không làm bundle nhỏ hơn

```javascript
// ❌ Import thư viện lớn dù không cần
const _ = await import('lodash'); // Vẫn tải full lodash!

// ✅ Import chỉ phần cần
const { pick } = await import('lodash/pick.js');
// Hoặc:
import pick from 'lodash/pick';
pick({ a: 1, b: 2 }, ['a']); // Full lodash vẫn được import

// ✅ Dùng ESM version
import { pick } from 'lodash-es'; // Tree-shakeable
// Chỉ bundle phần cần
```

---

## 8. Real-World Patterns

### Button click → load heavy component

```javascript
// Heavy modal: Chart Editor
class ChartEditorModal {
  constructor() {
    this.element = null;
    this.module = null;
  }

  async open() {
    // Loading state ngay
    this.showSkeleton();

    try {
      // Load module
      this.module = await import('./ChartEditor.js');

      // Load CSS
      await import('./ChartEditor.css');

      // Render
      this.render();
    } catch (err) {
      this.showError('Failed to load editor');
    }
  }

  close() {
    this.element?.remove();
    this.element = null;
    // Module STAYS in cache
  }
}

// Usage
const modal = new ChartEditorModal();
openButton.addEventListener('click', () => modal.open());
```

### Infinite scroll → load more components

```javascript
// Lazy load comments as user scrolls
const loadedModules = new Map();

async function loadComments(postId) {
  if (!loadedModules.has(postId)) {
    loadedModules.set(postId, import(`./Comments${postId}.js`));
  }

  const { default: CommentsComponent } = await loadedModules.get(postId);
  return CommentsComponent;
}

// IntersectionObserver: load when visible
const observer = new IntersectionObserver(async (entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      const postId = entry.target.dataset.postId;
      const Comments = await loadComments(postId);
      entry.target.appendChild(Comments);
      observer.unobserve(entry.target);
    }
  }
}, { rootMargin: '200px' });

document.querySelectorAll('.comments-placeholder').forEach(el =>
  observer.observe(el)
);
```

---

## 9. Câu Hỏi Phỏng Vấn

### Câu 1: Dynamic import khác static import ở điểm nào?

**Trả lời:** Static import parsed và resolved TRƯỚC khi code execute, luôn có trong initial bundle. Dynamic import tải module KHI được execute, trả về Promise, được tách thành chunk riêng. Dynamic import có thể nằm trong if/for/function, static import phải ở top-level. Dynamic import dùng cho lazy loading, code splitting, conditional dependencies.

---

### Câu 2: Code splitting hoạt động thế nào?

**Trả lời:** Bundler (webpack/Vite/Rollup) tự động tách code dùng dynamic import thành chunks riêng. Mỗi chunk được load riêng qua network request. Browser cache chunks riêng biệt — chunk không đổi thì không cần download lại. `webpackChunkName` và `webpackPrefetch` cho phép control chunk naming và prefetching.

---

### Câu 3: Preload vs Prefetch khác nhau?

**Trả lời:** Preload = high priority, tải ngay sau initial resources. Dùng cho resources sắp cần. Prefetch = low priority, tải khi browser idle. Dùng cho resources của page/flow tiếp theo. Preload = immediate, Prefetch = eventual.

---

### Câu 4: Module được import lại nhiều lần thì sao?

**Trả lời:** JavaScript engine cache modules — chỉ load MỘT LẦN, dù import bao nhiêu lần. `await import('./x')` gọi lần 2 sẽ resolve từ cache (instant). Đây là singletons của module system.

---

### Câu 5: Top-level await (ES2022) là gì?

```javascript
// Top-level await: dùng await ở top-level file (không cần async wrapper)

// module.js — top-level await
const config = await import('./config.js');
export const settings = config.settings;

// main.js
import './module.js'; // Đợi config load xong trước khi tiếp

// ⚠️ Có thể block module loading!
```

**Trả lời:** Top-level await cho phép dùng `await` ở top-level ESM file mà không cần bọc async function. Cẩn thận: có thể block module loading nếu dependency chưa resolved. Dùng cho: loading configs, initializing module-level resources.

---

### Câu 6: import() vs require() khác nhau?

```javascript
// ❌ require() là CommonJS, synchronous
const _ = require('lodash'); // blocking

// ✅ import() là ESM dynamic import, asynchronous
const _ = await import('lodash'); // non-blocking
```

**Trả lời:** `require()` là synchronous, blocking, không thể trong conditional statements, không support promises. `import()` là asynchronous, trả về Promise, có thể trong conditionals, support preload/prefetch. `import()` có thể dùng thay thế require cho dynamic loading.

---

## 10. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  DYNAMIC IMPORT                                               │
│                                                               │
│  SYNTAX                                                       │
│  ├── const { x } = await import('./module')              │
│  ├── import().then(module => ...)                          │
│  └── Trả về Promise<Module>                                │
│                                                               │
│  CODE SPLITTING                                             │
│  ├── webpack/Vite tự tách thành chunks riêng              │
│  ├── Chunk = separate network request                    │
│  ├── webpackChunkName / webpackPrefetch                │
│  └── Browser cache chunks riêng biệt                    │
│                                                               │
│  LAZY LOADING                                               │
│  ├── React.lazy(() => import('./Page'))              │
│  ├── Suspense fallback                                   │
│  └── Error boundary cho graceful errors                │
│                                                               │
│  PRELOAD vs PREFETCH                                       │
│  ├── Preload: high priority, cho page hiện tại       │
│  └── Prefetch: low priority, cho page tiếp theo      │
│                                                               │
│  CACHING                                                     │
│  ├── Module chỉ load MỘT LẦN                              │
│  ├── Engine cache modules toàn runtime                  │
│  └── Refresh = clear cache                              │
│                                                               │
│  ⚠️ Dynamic import = Promise, luôn handle errors        │
│  ⚠️ Preload/prefetch không tạo bundles mới            │
│  ⚠️ Dùng ESM dependencies để tree-shakeable          │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Dùng được dynamic import: `await import('./module')`
- [ ] Implement được React.lazy + Suspense
- [ ] Phân biệt được preload và prefetch
- [ ] Biết dùng webpackChunkName và webpackPrefetch
- [ ] Handle errors khi dynamic import fail
- [ ] Hiểu module caching — không load lại
- [ ] Trả lời được 4/6 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
