# Code Splitting — Giảm Bundle Size Đến Từng Byte

## Câu hỏi mở đầu

```javascript
// React app của bạn:
// - 2MB bundle ban đầu
// - User phải tải TẤT CẢ code
// - Time to Interactive: 8 giây!
// - 90% user bỏ đi trước khi app load xong!

// Trong khi:
// - User chỉ dùng 20% features trong tuần đầu
// - Admin panel code (100KB) không bao giờ cần cho regular users
// - Chart library (300KB) chỉ cần cho dashboard page

// Question: Tại sao phải tải TẤT CẢ ngay lập tức?
```

**Code splitting** là chiến lược chia bundle thành nhiều chunks nhỏ, chỉ tải những gì cần thiết cho trang hiện tại. Đây là cách hiệu quả nhất để giảm initial bundle size và improve time-to-interactive.

---

## 1. Bundle Analysis — Biết Trước Khi Optimize

### Bundle Analyzer

```bash
# Webpack Bundle Analyzer
npm install --save-dev webpack-bundle-analyzer

# webpack.config.js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin()
  ]
};

# Run:
webpack --profile --json > stats.json
npx webpack-bundle-analyzer stats.json
```

```javascript
// Vite — built-in bundle analysis
# vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    visualizer({
      filename: 'dist/bundle-stats.html',
      open: true,
      gzipSize: true
    })
  ]
};

# Run: vite build
# → Mở dist/bundle-stats.html
```

### Đọc bundle analysis

```
Bundle Analysis Output:
├── app.js (450KB)                          ← main bundle
│   ├── vendor.js (320KB)                  ← 3rd party
│   │   ├── react-dom (120KB)
│   │   ├── lodash (80KB)
│   │   ├── moment.js (70KB) ❌            ← RARE: moment.js = 70KB!
│   │   └── date-fns (50KB) ✅             ← BETTER: tree-shakeable
│   └── app.js (130KB)                     ← your code
│       ├── Home.js (30KB)
│       ├── Dashboard.js (25KB)
│       └── ...
│
├── Admin.js (100KB) ❌ CHƯA SPLIT        ← Heavy, rarely accessed
│   ├── react-admin (60KB)
│   └── ...
│
├── chart-library.js (300KB) ❌ CHƯA SPLIT ← Only dashboard needs it
│
└── Total: 850KB → Split = 450KB initial + 400KB on-demand
```

### Common bundling problems

```
┌──────────────────────────────────────────────────────────────┐
│  BUNDLING PROBLEMS                                            │
│                                                               │
│  1. LARGE DEPENDENCIES                                        │
│  ├── moment.js (70KB) → dayjs (2KB) ✅                       │
│  ├── lodash (80KB) → lodash-es (2KB) ✅                      │
│  ├── chart.js (300KB) → ApexCharts (50KB) ✅               │
│  └── fullcalendar (200KB) → FullCalendar lightweight ✅       │
│                                                               │
│  2. DUPLICATE CHUNKS                                          │
│  ├── react shared between chunks → webpack runtimeChunk       │
│  └── 2 bundles import react separately → deduplication        │
│                                                               │
│  3. TREE-SHAKING FAILURE                                      │
│  ├── import { sortBy } from 'lodash'; → imports ALL lodash   │
│  └── import sortBy from 'lodash-es/sortBy'; → tree-shake OK   │
│                                                               │
│  4. STATIC ASSETS IN BUNDLE                                   │
│  ├── Inline small images as base64                            │
│  └── Code-split large images                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Manual Code Splitting

### Dynamic import

```javascript
// ❌ Static import: bundle everything
import HeavyLibrary from 'heavy-library';
import Chart from 'chart.js';

// ✅ Dynamic import: split into separate chunk
const HeavyLibrary = () => import('heavy-library');
const Chart = () => import('chart.js');

// Usage:
const handleClick = async () => {
  const { default: Chart } = await import('chart.js');
  new Chart(ctx, config);
};
```

### React code splitting

```javascript
import { lazy, Suspense } from 'react';

// ❌ App tải TẤT CẢ pages ngay lập tức
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import Reports from './pages/Reports';

// ✅ App chỉ tải pages CẦN THIẾT
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Admin = lazy(() => import('./pages/Admin'));
const Settings = lazy(() => import('./pages/Settings'));
const Reports = lazy(() => import('./pages/Reports'));

// Result:
// app.js: 130KB (core React)
// Dashboard.js: 30KB (tải khi /dashboard)
// Admin.js: 100KB (tải khi /admin)
// Settings.js: 25KB
```

### Named exports trong dynamic imports

```javascript
// ❌ import * as chart from 'chart.js' → entire library
const Chart = await import('chart.js');

// ✅ Named import → webpack tree-shakes
const { Chart, registerables } = await import('chart.js');
Chart.register(...registerables);

// ✅ import chỉ những gì cần
const { Line } = await import('react-chartjs-2').then(m => m);
// Khi dùng với lazy:
const LineChart = lazy(() =>
  import('react-chartjs-2').then(module => ({ default: module.Line }))
);
```

---

## 3. Route-Based Splitting

### React Router

```javascript
// app.jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Loading = () => <div className="loading">Loading...</div>;

// Route-based code splitting
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Admin = lazy(() => import('./pages/Admin'));

// Products và ProductDetail: cùng chunk (proximity)
const ProductsPage = lazy(() => import(
  /* webpackChunkName: "products" */
  './pages/ProductsPage'
));

// Result:
// main.js: ~100KB (React + router core)
// home.js: 50KB
// products.js: 80KB (Products + ProductDetail)
// cart.js: 30KB
// admin.js: 150KB (chỉ admin users tải)
```

### Route-level split comparison

```
┌──────────────────────────────────────────────────────────────┐
│  WITHOUT ROUTE SPLITTING                                       │
│  app.js: 850KB                                                │
│  ├── User clicks / → wait 8s → full bundle downloaded!       │
│                                                               │
│  WITH ROUTE SPLITTING                                          │
│  app.js: 100KB                                                │
│  ├── User clicks / → wait 1s → home.js (50KB)                 │
│  ├── User clicks /products → wait 1s → products.js (80KB)    │
│  └── User clicks /admin → wait 2s → admin.js (150KB)          │
│                                                               │
│  RESULT:                                                       │
│  ├── Initial load: 850KB → 100KB (88% reduction!)            │
│  ├── Time to Interactive: 8s → 1s (8x faster!)               │
│  └── Admin users: không tải admin.js nếu không vào admin       │
└──────────────────────────────────────────────────────────────┘
```

### Vite route splitting

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk
          vendor: ['react', 'react-dom', 'react-router-dom'],

          // Chart chunk
          charts: ['chart.js', 'react-chartjs-2'],

          // Utils chunk
          utils: ['lodash-es', 'date-fns']
        }
      }
    }
  }
});
```

---

## 4. Vendor Chunking

### webpack vendor chunk

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all', // split in both async and sync chunks
      cacheGroups: {
        // Vendor libraries (node_modules)
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },

        // React ecosystem
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react-vendor',
          chunks: 'all',
          priority: 20
        },

        // Large less-used libraries
        charts: {
          test: /[\\/]node_modules[\\/](chart\.js|recharts|apexcharts)[\\/]/,
          name: 'charts',
          chunks: 'async',
          priority: 30,
          minSize: 0 // Split even small libraries
        }
      }
    },

    // Separate runtime for better caching
    runtimeChunk: 'single',

    // Deduplicate identical modules
    mergeDuplicateChunks: true
  }
};
```

### Common vendor chunk strategies

```
┌──────────────────────────────────────────────────────────────┐
│  VENDOR CHUNKING STRATEGIES                                    │
│                                                               │
│  STRATEGY 1: Single vendor chunk                              │
│  ├── vendors.js: all node_modules                            │
│  └── Good: simple, cache-friendly                            │
│  └── Bad: entire vendor cache invalidated on any update       │
│                                                               │
│  STRATEGY 2: Multiple vendor chunks (recommended)            │
│  ├── react-vendor.js: react + react-dom                     │
│  ├── router-vendor.js: react-router                         │
│  ├── utils-vendor.js: lodash + date-fns                     │
│  ├── charts-vendor.js: chart libraries                       │
│  └── Good: granular caching, only changed chunks update      │
│                                                               │
│  STRATEGY 3: Per-importance chunks                           │
│  ├── core-vendor.js: essential (react, react-dom)           │
│  ├── async-vendor.js: async loaded libraries                │
│  └── Good: async vendor chunks not block initial render       │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Tree Shaking

### ESM vs CommonJS

```javascript
// ❌ CommonJS: NOT tree-shakeable
const _ = require('lodash');
const result = _.sortBy([{a:1}, {a:3}, {a:2}], 'a');
// webpack không thể analyze require()
// → Toàn bộ lodash được include!

// ✅ ESM: TREE-SHAKEABLE
import sortBy from 'lodash-es/sortBy';
// webpack analyze imports
// → CHỈ include sortBy function!

// ⚠️ Dùng lodash-es thay vì lodash
// import { sortBy } from 'lodash'; ❌ (trước webpack 4)
// import sortBy from 'lodash-es/sortBy'; ✅ (ESM version)

// Hoặc per-method imports:
import sortBy from 'lodash/sortBy'; // ✅ webpack 4+ tree-shakes
```

### Side effects

```javascript
// webpack.config.js — đánh dấu modules có/không side effects
module.exports = {
  optimization: {
    usedExports: true, // Tell webpack to analyze exports
    sideEffects: true  // Enable tree shaking
  }
};

// package.json — declare side effects
{
  "sideEffects": [
    "*.css",
    "./polyfills.js",
    "./src/setup.js"
  ]
}

// ❌ Side effect = webpack không thể drop module
// ✅ Pure module = webpack có thể drop nếu unused

// Mark module as side-effect-free:
/*#__PURE__*/ somePureFunction();

// CSS: ALWAYS has side effects (webpack must include)
```

### Banned modules (replace với lighter alternatives)

```
┌──────────────────────────────────────────────────────────────┐
│  REPLACEMENT GUIDE                                             │
│                                                               │
│  ❌ moment.js (70KB) → ✅ dayjs (2KB)                        │
│  ❌ lodash (80KB) → ✅ lodash-es + named imports (2KB)      │
│  ❌ axios (15KB) → ✅ native fetch + light wrapper (1KB)   │
│  ❌ classnames → ✅ template literal hoặc clsx (200B)       │
│  ❌ prop-types → ✅ TypeScript hoặc omit types (0KB)       │
│  ❌ underscore → ✅ native methods (0KB)                    │
│  ❌ is-array → ✅ Array.isArray (0KB)                       │
│  ❌ uuid → ✅ nanoid (1KB)                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Gzip và Brotli Compression

### Compression setup

```javascript
// webpack.config.js — compression plugins
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  plugins: [
    new CompressionPlugin({
      filename: '[path][base].gz',
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240, // Chỉ compress files > 10KB
      minRatio: 0.8 // Compress nếu ratio < 80%
    })
  ]
};

// Nginx config — serve pre-compressed
# nginx.conf
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript
            text/xml application/xml application/xml+rss text/javascript;
gzip_static on; // Serve .gz files nếu có
```

### Compression comparison

```
┌──────────────────────────────────────────────────────────────┐
│  BUNDLE SIZE COMPARISON                                       │
│                                                               │
│  Bundle          Raw      Gzip      Brotli   Reduction     │
│  ─────────────────────────────────────────────────────────   │
│  app.js           450KB    130KB     110KB    75%          │
│  vendor.js        320KB    90KB      75KB     77%          │
│  admin.js         150KB    45KB      38KB     75%          │
│  charts.js        300KB    85KB      72KB     76%          │
│  ─────────────────────────────────────────────────────────   │
│  TOTAL            1.22MB   350KB     295KB    76%           │
│                                                               │
│  ⚠️ Brotli: 10-20% better than gzip                       │
│  ⚠️ Precompress (zopfli/brotli) at build time              │
│  ⚠️ Dynamic imports được compressed separately              │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. Modern Build Tool Features

### Vite automatic splitting

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split node_modules
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('chart')) return 'vendor-charts';
            return 'vendor-misc';
          }
        }
      }
    }
  }
};

// Vite tự động:
// 1. Chunk vendor code
// 2. Preload critical chunks
// 3. Async import deduplication
```

### Module Federation (Micro-frontends)

```javascript
// host/webpack.config.js — Webpack 5 Module Federation
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        // Remote app exposed
        dashboard: 'dashboard@http://localhost:3001/remoteEntry.js',
        admin: 'admin@http://localhost:3002/remoteEntry.js'
      },
      shared: ['react', 'react-dom'] // Shared singletons
    })
  ]
};

// remote (dashboard app):
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'dashboard',
      filename: 'remoteEntry.js',
      exposes: {
        './Dashboard': './src/Dashboard'
      },
      shared: ['react', 'react-dom']
    })
  ]
};

// Host app usage:
import { lazy } from 'react';
const Dashboard = lazy(() => import('dashboard/Dashboard'));
```

---

## 8. Câu Hỏi Phỏng Vấn

### Câu 1: webpack splitChunks hoạt động thế nào?

**Trả lời:** `splitChunks` chia bundle thành chunks riêng biệt. Options: `chunks: 'all'` (split both sync và async), `chunks: 'async'` (chỉ dynamic imports), `chunks: 'initial'` (chỉ entry points). Cache groups: cho phép định nghĩa groups với `test`, `priority`, `minSize`. Vendor chunk = `test: /node_modules/`. Multiple cache groups cho granular splitting.

---

### Câu 2: Tree shaking không hoạt động khi nào?

**Trả lời:** (1) **CommonJS modules** — `require()` không analyzable. (2) **Side effects** — modules có side effects không thể drop. (3) **Dynamic imports không đúng** — dùng barrel `index.js` exports không tree-shakeable. (4) **Transpilation** — Babel convert ES modules sang CommonJS → break tree shaking. Fix: dùng `modules: false` trong Babel config, dùng ESM dependencies.

---

### Câu 3: Vendor chunk vs app chunk?

**Trả lời:** Vendor chunk chứa `node_modules`, app chunk chứa code của bạn. Benefit: vendors thay đổi ít → cache lâu dài, app thay đổi thường → cache invalidation riêng. Nếu tất cả trong 1 chunk → mỗi lần deploy → user phải tải lại toàn bộ. Split → user chỉ tải lại app chunk.

---

### Câu 4: preload vs prefetch chunks?

```javascript
// Dynamic import:
const Dashboard = () => import('./pages/Dashboard');

// webpack magic comments:
// /* webpackChunkName: "dashboard" */
// /* webpackPrefetch: true */ — tải khi browser idle
// /* webpackPreload: true */ — tải cùng lúc parent

const Dashboard = () => import(
  /* webpackChunkName: "dashboard" */
  /* webpackPrefetch: true */
  './pages/Dashboard'
);
```

**Trả lời:** Prefetch: tải khi browser idle, không block initial load. Preload: tải cùng lúc parent chunk, high priority. Dùng prefetch cho navigation likely, preload cho immediate children.

---

### Câu 5: Caching strategy với code splitting?

```javascript
// Webpack: contenthash trong filename
output: {
  filename: '[name].[contenthash].js'
}

// Browser caches:
// vendors.abc123.js ← cached
// app.def456.js ← cached

// Deploy:
// vendors.abc123.js ← cached (không đổi)
// app.ghi789.js ← new hash (cache busted!)

// User chỉ download app.ghi789.js!

// But: vendors hash thay đổi khi vendors update!
```

**Trả lời:** Dùng `contenthash` để bust cache khi content đổi. Vendor chunk nên stable — dùng lockfile, ít update. RuntimeChunk tách runtime riêng → app hash changes không affect vendor.

---

## 9. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  CODE SPLITTING                                               │
│                                                               │
│  BUNDLE ANALYSIS — Biết trước khi optimize                  │
│  ├── Webpack Bundle Analyzer                                 │
│  ├── Vite visualizer                                        │
│  └── Nhận diện: large deps, duplicate chunks, tree-shake fail │
│                                                               │
│  SPLITTING STRATEGIES                                         │
│  ├── Route-based: per route chunks                          │
│  ├── Component: lazy heavy components                       │
│  ├── Vendor: split node_modules                             │
│  └── Dynamic: import() khi cần                             │
│                                                               │
│  TREE SHAKING                                                 │
│  ├── ESM modules only (không CommonJS)                      │
│  ├── Side effects declared in package.json                  │
│  └── Named imports thay vì barrel exports                  │
│                                                               │
│  REPLACEMENTS                                                │
│  ├── moment → dayjs                                          │
│  ├── lodash → lodash-es + named imports                    │
│  └── axios → fetch                                          │
│                                                               │
│  COMPRESSION                                                  │
│  ├── Gzip: ~70% reduction                                   │
│  ├── Brotli: ~75% reduction                                  │
│  └── Pre-compress at build time                              │
│                                                               │
│  ⚠️ Analyze bundle TRƯỚC khi optimize                     │
│  ⚠️ Route splitting = best ROI                              │
│  ⚠️ Tree-shaking = ESM + sideEffects: false                │
│  ⚠️ Contenthash for cache busting                           │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Analyze được bundle với bundle analyzer
- [ ] Implement được route-based code splitting
- [ ] Setup được vendor chunking với splitChunks
- [ ] Hiểu tree shaking và khi nào không hoạt động
- [ ] Replace được heavy dependencies bằng alternatives nhẹ hơn
- [ ] Trả lời được 4/5 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
