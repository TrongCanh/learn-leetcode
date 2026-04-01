# Lazy Loading — Chỉ Tải Khi Cần

## Câu hỏi mở đầu

```javascript
// Trang web của bạn có:
// - 50 images (nhưng user chỉ thấy 5 cái trên màn hình)
// - Heavy chart library (nhưng user chỉ click button mới dùng)
// - Admin panel code (nhưng user bình thường không bao giờ thấy)
// - 500KB bundle đầu tiên (user đợi 3s để thấy nội dung!)

// Tải TẤT CẢ ngay lập tức = slow initial load
// Lazy loading = tải cái CẦN TRƯỚC, cái KHÔNG CẦN sau
```

**Lazy loading** là chiến lược: không tải resource cho đến khi nó thực sự cần thiết. Đây là kỹ thuật tối ưu quan trọng nhất cho initial load time. Bài này cover từ image lazy loading cơ bản đến route-based code splitting nâng cao.

---

## 1. Image Lazy Loading

### Native lazy loading

```html
<!-- ❌ Tải tất cả ảnh ngay — slow initial load -->
<img src="image1.jpg">
<img src="image2.jpg">
<img src="image3.jpg">
<!-- ... 100 ảnh ... -->

<!-- ✅ Native lazy loading — trình duyệt tự xử lý -->
<img src="image1.jpg" loading="lazy" alt="...">
<img src="image2.jpg" loading="lazy" alt="...">
<img src="image3.jpg" loading="lazy" alt="...">

<!-- Trình duyệt chỉ tải khi: -->
<!-- 1. Ảnh scroll vào viewport -->
<!-- 2. Ảnh scroll GẦN viewport (preload buffer ~500px) -->
```

### Khi nào KHÔNG dùng loading="lazy"

```html
<!-- ❌ First image KHÔNG nên lazy -->
<header>
  <img src="hero.jpg" loading="eager" alt="Hero"> <!-- First visible -->
</header>

<!-- ✅ LCP image: eager (first contentful paint phụ thuộc vào nó) -->
<img src="hero.jpg" loading="eager" fetchpriority="high" alt="Hero">

<!-- ❌ Below the fold images: -->
<!-- loading="lazy" ✅ -->

<!-- ⚠️ IntersectionObserver polyfill cho trình duyệt cũ -->
```

### Lazy loading với IntersectionObserver

```javascript
// IntersectionObserver — mạnh hơn native lazy
// Dùng khi: cần custom behavior, fade-in effect, responsive images

// Polyfill check:
const supportsLazy = 'IntersectionObserver' in window;

// Basic lazy image loader
const lazyImages = document.querySelectorAll('img[data-src]');

const imageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      const src = img.dataset.src;

      // Thay src
      img.src = src;

      // Remove placeholder class
      img.classList.remove('lazy');

      // Stop observing
      observer.unobserve(img);
    }
  });
}, {
  root: null, // viewport
  rootMargin: '0px 0px 200px 0px', // preload 200px trước khi visible
  threshold: 0.01 // 1% visible = load
});

lazyImages.forEach(img => imageObserver.observe(img));
```

### Responsive images với lazy loading

```html
<!-- Lazy loading + responsive images -->
<img
  data-srcset="small.jpg 480w, medium.jpg 800w, large.jpg 1200w"
  data-sizes="(max-width: 600px) 480px, (max-width: 900px) 800px, 1200px"
  data-src="medium.jpg"
  src="placeholder.jpg"
  loading="lazy"
  alt="..."
  class="lazy"
>

<!-- JavaScript xử lý srcset khi scroll vào view -->
```

### CSS placeholder techniques

```css
/* Skeleton loading — trước khi ảnh load xong */
.lazy-image {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Fade in khi loaded */
.lazy-image {
  opacity: 0;
  transition: opacity 0.3s ease-in;
}

.lazy-image.loaded {
  opacity: 1;
}
```

```javascript
// Kết hợp IntersectionObserver + fade-in:
const images = document.querySelectorAll('.lazy');

const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.onload = () => img.classList.add('loaded');
      img.src = img.dataset.src;
      observer.unobserve(img);
    }
  });
}, { rootMargin: '200px' });
```

---

## 2. Component Lazy Loading

### Dynamic import trong JavaScript

```javascript
// ❌ Static import — tải ngay khi file parsed
import HeavyChart from './HeavyChart.js'; // 200KB!

// ✅ Dynamic import — tải KHI cần
const HeavyChart = () => import('./HeavyChart.js');
// Trả về Promise
// Chỉ tải khi được gọi
```

### React lazy component

```javascript
import { lazy, Suspense } from 'react';

// ❌ Tải ngay lập tức
import Dashboard from './Dashboard';
import AdminPanel from './AdminPanel';
import Settings from './Settings';

// ✅ Lazy load — chỉ tải khi render
const Dashboard = lazy(() => import('./Dashboard'));
const AdminPanel = lazy(() => import('./AdminPanel'));
const Settings = lazy(() => import('./Settings'));

// Suspense = loading state
function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Dashboard />
    </Suspense>
  );
}

// ✅ Lazy với error boundary
const Dashboard = lazy(() =>
  import('./Dashboard').catch(() => ({
    default: () => <ErrorFallback>Dashboard failed to load</ErrorFallback>
  }))
);
```

### Preload vs Lazy

```javascript
// Preload — tải TRƯỚC nhưng không execute
const preloadChart = () => {
  // Tải module vào cache, execute khi cần
  import(/* webpackPreload: true */ './HeavyChart.js');
};

// Lazy — tải và execute khi cần
const loadChart = () => {
  return import(/* webpackPrefetch: true */ './HeavyChart.js');
};

// Preload vs Lazy:
// - Preload: có thể dùng trước khi user cần → instant when needed
// - Lazy: tải khi user click → user đợi
// - webpackPrefetch: tải sau khi initial load xong, nhàn rỗi

// Usage:
button.addEventListener('click', loadChart); // Load on idle after click
```

### Vue lazy component

```javascript
import { defineAsyncComponent } from 'vue';

// Static import
import HeavyComponent from './HeavyComponent.vue';

// Async (lazy) import
const AsyncComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
);

// With loading/error
const AsyncComponent = defineAsyncComponent({
  loader: () => import('./HeavyComponent.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorComponent,
  delay: 200,
  timeout: 3000
});

// Usage
<template>
  <Suspense>
    <AsyncComponent />
    <template #fallback>
      <LoadingSpinner />
    </template>
  </Suspense>
</template>
```

---

## 3. Route-Based Code Splitting

### React Router

```javascript
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin')); // Admin rarely accessed

// Admin: chỉ tải khi user đến /admin
// Dashboard: tải khi user đến /dashboard

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin/*" element={<Admin />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### Network tab — xem lazy loading

```javascript
// Khi user điều hướng đến /dashboard:
// 1. Home.js đã loaded (sẵn trong cache)
// 2. Browser request: Dashboard.js chunk
// 3. ~50KB loaded
// 4. Dashboard rendered

// Total bundle: 500KB → split:
// - Home.js: 50KB
// - About.js: 30KB
// - Dashboard.js: 50KB
// - Settings.js: 40KB
// - Admin.js: 100KB (chỉ admin users tải!)

// Initial load: 50 + 30 = 80KB (thay vì 500KB!)
// Time to interactive: ~1s → ~300ms
```

### Vite / Webpack dynamic import

```javascript
// Vite — automatic code splitting với import()
const modules = import.meta.glob('./pages/*.js');
// → Tạo lazy imports cho tất cả files trong pages/

// Usage:
const Dashboard = modules['./pages/Dashboard.js'];

// Or eager:
const modules = import.meta.glob('./pages/*.js', { eager: true });

// Webpack — magic comments
import(
  /* webpackChunkName: "dashboard" */
  /* webpackPreload: true */
  './Dashboard.js'
);
```

---

## 4. Intersection Observer Advanced

### Lazy load nhiều types

```javascript
// Lazy load: images, videos, scripts, components
class LazyLoader {
  constructor() {
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      { rootMargin: '200px', threshold: 0.01 }
    );
  }

  observe(element) {
    this.observer.observe(element);
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el = entry.target;

      switch (el.dataset.type) {
        case 'image':
          this.loadImage(el);
          break;
        case 'video':
          this.loadVideo(el);
          break;
        case 'component':
          this.loadComponent(el);
          break;
        case 'iframe':
          this.loadIframe(el);
          break;
      }

      this.observer.unobserve(el);
    });
  }

  loadImage(el) {
    const src = el.dataset.src;
    if (el.dataset.srcset) el.srcset = el.dataset.srcset;
    el.src = src;
    el.classList.add('loaded');
  }

  loadVideo(el) {
    const src = el.dataset.src;
    el.src = src;
    el.load(); // Gọi load() để bắt đầu buffering
    el.play().catch(() => {}); // Autoplay có thể bị blocked
  }

  loadIframe(el) {
    el.src = el.dataset.src;
    el.classList.add('loaded');
  }

  loadComponent(el) {
    const component = el.dataset.component;
    // dynamic import component module
    import(`./components/${component}.js`)
      .then(module => module.default(el))
      .then(html => { el.innerHTML = html; el.classList.add('loaded'); });
  }
}

const lazyLoader = new LazyLoader();

// Initialize
document.querySelectorAll('[data-lazy]').forEach(el => lazyLoader.observe(el));
```

### Infinite scroll

```javascript
// Infinite scroll với IntersectionObserver
class InfiniteScroll {
  constructor({ container, loadMore, hasMore }) {
    this.container = container;
    this.loadMore = loadMore;
    this.hasMore = hasMore; // function check còn data không

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      { root: null, rootMargin: '200px', threshold: 0 }
    );

    this.setup();
  }

  setup() {
    const sentinel = document.createElement('div');
    sentinel.id = 'scroll-sentinel';
    sentinel.style.height = '1px';
    this.container.appendChild(sentinel);
    this.observer.observe(sentinel);
  }

  async handleIntersection(entries) {
    const entry = entries[0];
    if (!entry.isIntersecting) return;
    if (!this.hasMore()) return;

    await this.loadMore();
  }

  destroy() {
    this.observer.disconnect();
  }
}

// Usage:
const infinite = new InfiniteScroll({
  container: document.getElementById('feed'),
  loadMore: async () => {
    const items = await fetchNextPage();
    renderItems(items);
  },
  hasMore: () => pageCount < totalPages
});
```

### Staggered loading

```javascript
// Load items với stagger effect
const lazyItems = document.querySelectorAll('.lazy-item');

const staggerObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (!entry.isIntersecting) return;

    const el = entry.target;
    const delay = parseInt(el.dataset.delay || 0);

    setTimeout(() => {
      const src = el.dataset.src;
      if (el.tagName === 'IMG') {
        el.src = src;
        el.classList.add('loaded');
      } else {
        el.style.backgroundImage = `url(${src})`;
        el.classList.add('loaded');
      }
    }, delay);

    staggerObserver.unobserve(el);
  });
}, { rootMargin: '100px' });

lazyItems.forEach((el, i) => {
  el.dataset.delay = i * 50; // 50ms stagger
  staggerObserver.observe(el);
});
```

---

## 5. Script Lazy Loading

### Defer vs Async vs Lazy

```html
<!-- 1. Regular <script>: blocks HTML parsing, executes ASAP -->
<script src="analytics.js"></script>

<!-- 2. defer: không block, execute SAU khi HTML parsed, theo thứ tự -->
<script defer src="app.js"></script>
<script defer src="vendor.js"></script>
<!-- → app.js và vendor.js execute theo thứ tự, sau khi DOM ready -->

<!-- 3. async: không block, execute khi DOWNLOAD xong, bất kỳ thứ tự -->
<script async src="analytics.js"></script>
<!-- → Analytics loaded xong → execute ngay → không theo thứ tự -->

<!-- 4. type="module": always deferred -->
<script type="module" src="app.js"></script>
```

### Dynamic script loading

```javascript
// Load script khi cần
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Failed to load: ${src}`));

    document.head.appendChild(script);
  });
}

// Usage:
button.addEventListener('click', async () => {
  await loadScript('https://cdn.example.com/chart-library.js');
  renderChart(); // Library đã load
});

// Preload critical scripts
const preloadScript = (src) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'script';
  link.href = src;
  document.head.appendChild(link);
};
```

---

## 6. CSS và Font Lazy Loading

### Font lazy loading

```html
<!-- ❌ System fonts: không cần tải -->
<!-- ✅ -->

<!-- Google Fonts: -->
<!-- 1. Preconnect -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- 2. Load fonts — chỉ khi cần -->
<!-- Dùng JavaScript để load khi user scroll -->
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>
```

```javascript
// Lazy load Google Fonts
const loadFonts = () => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap';
  document.head.appendChild(link);
};

// Load khi user tương tác (click anywhere)
document.addEventListener('click', () => {
  loadFonts();
}, { once: true });
```

### CSS lazy loading

```javascript
// Load CSS khi cần
function loadCSS(href) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error(`CSS load failed: ${href}`));
    document.head.appendChild(link);
  });
}

// Usage: load admin CSS khi vào admin page
if (isAdminRoute) {
  loadCSS('/admin-styles.css');
}
```

---

## 7. Các Traps Phổ Biến

### Trap 1: Lazy loading LCP image

```html
<!-- ❌ LCP (Largest Contentful Paint) image không nên lazy -->
<!-- LCP = hero image, above-the-fold content -->
<!-- Lazy load hero → FCP chậm → Core Web Vitals suy giảm! -->

<!-- ❌ SAI -->
<img src="hero.jpg" loading="lazy" alt="Hero">

<!-- ✅ ĐÚNG: eager + fetchpriority="high" -->
<img src="hero.jpg" loading="eager" fetchpriority="high" alt="Hero">
```

### Trap 2: Placeholder có wrong dimensions

```html
<!-- ❌ Layout shift khi image load xong (CLS - Cumulative Layout Shift) -->
<!-- Container phải có aspect-ratio trước khi load -->
<div class="image-container">
  <img src="..." class="lazy" alt="...">
</div>

<!-- ✅ CSS: reserve space -->
.image-container {
  aspect-ratio: 16 / 9; /* Reserve exact space */
  overflow: hidden;
}

.lazy {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

<!-- ✅ Hoặc padding-top trick (older browsers) -->
.image-container {
  position: relative;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 ratio */
}

.lazy {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

### Trap 3: Infinite scroll không có end indicator

```javascript
// ❌ Infinite scroll không có scroll-to-top hoặc pagination fallback
// → User không thể navigate ra ngoài feed!

// ✅ Always có:
<div class="feed">
  {items.map(item => <Item key={item.id} {...item} />)}
</div>

{/* Load more button fallback */}
{!hasMore && (
  <button onClick={loadMore} className="load-more">
    Load More
  </button>
)}

{/* Scroll to top */}
<button className="scroll-top" onClick={scrollToTop}>
  ↑ Back to Top
</button>
```

### Trap 4: Preload quá nhiều

```javascript
// ❌ Preload tất cả mọi thứ = ngược lợi ích lazy loading
// Preload nặng = chặn bandwidth của resources thực sự cần

// ✅ Chỉ preload critical resources
// Critical = trên fold, LCP, navigation

// ✅ Preload fonts
<link rel="preload" href="/fonts/main.woff2" as="font" crossorigin>

// ✅ Preload hero image
<img src="hero.jpg" fetchpriority="high">

// ✅ Prefetch resources cho navigation tiếp theo
<link rel="prefetch" href="/dashboard.js" as="script">
```

---

## 8. Câu Hỏi Phỏng Vấn

### Câu 1: Lazy loading vs Code splitting khác nhau?

| | Lazy Loading | Code Splitting |
|--|-------------|----------------|
| Level | Per resource (image, component) | Per bundle (code chunks) |
| When | When element enters viewport | When route/component needed |
| Tool | IntersectionObserver, native | Webpack/Vite, dynamic import |
| Goal | Reduce initial page size | Reduce initial bundle |
| Scope | Images, videos, iframes, components | Route-level, vendor libs |

---

### Câu 2: IntersectionObserver hoạt động thế nào?

**Trả lời:** IntersectionObserver nhận callback khi element **intersect (giao nhau)** với viewport (hoặc root element). Không dùng scroll event listeners (đỡ performance). Options: `root` (viewport hoặc element khác), `rootMargin` (mở rộng/kéo thu hẹp check area), `threshold` (tỷ lệ visible để trigger). Callback nhận `entries` array, mỗi entry có `isIntersecting`, `intersectionRatio`, `target`.

---

### Câu 3: Cumulative Layout Shift (CLS) và lazy loading?

**Trả lời:** CLS = thước đo visual stability. Lazy loading gây CLS khi placeholder không có kích thước chính xác. Khi image load → page jumps → bad UX. Fix: dùng `aspect-ratio` CSS, `width`/`height` attributes trên `<img>`, skeleton loaders với exact dimensions, `font-display: optional` cho fonts.

---

### Câu 4: Preload vs Prefetch vs Preconnect?

| | Preload | Prefetch | Preconnect |
|--|---------|----------|------------|
| When | Immediate | Browser idle | Before request |
| Scope | Critical resources | Future navigation | DNS/TCP/TLS handshake |
| Use case | Hero image, main bundle | Next page resources | Third-party domains |
| Syntax | `<link rel="preload">` | `<link rel="prefetch">` | `<link rel="preconnect">` |

---

### Câu 5: React Suspense for Data Fetching?

```javascript
// Suspense không chỉ cho lazy components, còn cho data fetching
const userData = fetchUserData();
// → Throw promise cho đến khi resolved

// Data fetching với Suspense:
const UserProfile = lazy(() => import('./UserProfile'));

// Resource-based Suspense:
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <UserProfile resource={userData} />
    </Suspense>
  );
}

// React 18: use() hook for Suspense + data fetching
function Comments({ promise }) {
  const comments = use(promise);
  return comments.map(c => <Comment key={c.id} {...c} />);
}
```

---

### Câu 6: Virtual scrolling vs Lazy loading?

```javascript
// Virtual scrolling = chỉ render visible items
// Lazy loading = tải items nhưng vẫn render tất cả trong DOM

// ❌ Lazy loading: 10000 items = 10000 DOM nodes
const items = await fetchAllItems(); // 10000 items
items.forEach(item => document.createElement('div')); // 10000 divs!

// ✅ Virtual scrolling: chỉ render visible items
// 10000 items, viewport = 20 items visible → chỉ 20 DOM nodes!
import { FixedSizeList } from 'react-window';

function VirtualList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>{items[index].name}</div>
      )}
    </FixedSizeList>
  );
}
```

---

## 9. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  LAZY LOADING                                                  │
│                                                               │
│  IMAGE LAZY LOADING                                            │
│  ├── Native: <img loading="lazy">                            │
│  ├── IntersectionObserver: custom control, effects          │
│  ├── Placeholder: skeleton, shimmer, aspect-ratio           │
│  └── LCP image: ALWAYS eager + fetchpriority="high"         │
│                                                               │
│  COMPONENT LAZY LOADING                                        │
│  ├── React: lazy(() => import()) + Suspense                  │
│  ├── Vue: defineAsyncComponent()                           │
│  ├── Preload: tải trước, execute khi cần                    │
│  └── Prefetch: tải khi browser idle                        │
│                                                               │
│  ROUTE-BASED SPLITTING                                        │
│  ├── Split per route → initial load giảm đáng kể            │
│  ├── Admin routes: chỉ admin users tải                      │
│  └── Vite: automatic chunking với dynamic import            │
│                                                               │
│  OTHER LAZY LOADING                                           │
│  ├── Script: defer (ordered), async (unordered)             │
│  ├── Fonts: preconnect + preload                            │
│  ├── CSS: loadCSS() function                                │
│  └── Infinite scroll: IntersectionObserver sentinel         │
│                                                               │
│  ⚠️ CLS prevention: luôn reserve space với aspect-ratio    │
│  ⚠️ LCP: hero image = eager, fetchpriority="high"         │
│  ⚠️ Preload vs prefetch vs preconnect                      │
│  ⚠️ Virtual scrolling cho very long lists                │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Implement được image lazy loading với IntersectionObserver
- [ ] Setup được React lazy + Suspense
- [ ] Implement được route-based code splitting
- [ ] Phân biệt được preload vs prefetch vs preconnect
- [ ] Tránh được CLS bằng aspect-ratio
- [ ] Implement được infinite scroll
- [ ] Trả lời được 4/6 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
