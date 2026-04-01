# Code Splitting & Lazy Loading

## Câu hỏi mở đầu

Bạn có app React 5MB bundle. User chỉ dùng 1 page, nhưng phải download 5MB. Tại sao?

---

## 1. Bundle Size Problem

```
WITHOUT Code Splitting:
  bundle.js (5MB)
    ├── HomePage
    ├── DashboardPage
    ├── SettingsPage
    ├── AdminPage
    ├── HeavyChartLib
    └── ...

WITH Code Splitting:
  main.js (200KB) + dashboard.js (1MB) + settings.js (500KB)
  → User download 200KB để xem HomePage
  → Dashboard.js load when user navigates
```

---

## 2. React.lazy + Suspense

```jsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={
        <Suspense fallback={<Spinner />}>
          <Dashboard />
        </Suspense>
      } />
    </Routes>
  );
}
```

---

## 3. Route-Based Splitting

```jsx
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
}
```

---

## 4. Preloading

```jsx
// Load on hover/visible
const Dashboard = lazy(() => import('./Dashboard'));

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      onMouseEnter={() => {
        if (to === '/dashboard') Dashboard.preload?.();
      }}
    >
      {children}
    </Link>
  );
}
```

---

## Checklist

- [ ] Code splitting = chia bundle, load on demand
- [ ] React.lazy(() => import()) = lazy load component
- [ ] Suspense = loading boundary cho lazy components
- [ ] Lazy component PHẢI có Suspense wrap
- [ ] Route = natural splitting boundary

---

*Last updated: 2026-04-01*
