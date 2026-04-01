# Chương 09 — Performance Optimization

> Không phải premature optimization. Đây là **systematic approach** để tìm và fix bottleneck — từ render 60fps đến bundle size còn vài KB.

**Level**: 🔴 Advanced | **Bài**: 5 | **Thời gian**: ~1 tuần

---

## 🧩 Tại sao chương này quan trọng?

Performance có 2 loại:

```
Perceived Performance (cảm nhận):
  └── App có *feel* nhanh không? Loading state, skeleton, debounce...

Actual Performance (đo lường được):
  ├── FCP, LCP, TTI (Core Web Vitals)
  ├── Bundle size, parse time
  ├── Memory usage, leak detection
  └── FPS, frame budget
```

```
❌ Sai lầm phổ biến:
   "Dùng thư viện nhanh hơn tự viết"

✅ Thực tế:
   - debounce/throttle: thư viện như lodash là overkill, tự viết được
   - bundle size: tree shaking + dynamic import quan trọng hơn
   - RFT (rendering): DOM reflow/repaint là bottleneck phổ biến
```

---

## 🔗 Liên quan đến các chương khác

```
Chương 09 (Performance)
  ├── Event Loop (03)      ← UI blocking, long task
  ├── Memory (05)           ← GC pause, memory pressure
  ├── Modules (06)          ← tree shaking, code splitting
  ├── Browser APIs (07)     ← requestAnimationFrame, IntersectionObserver
  └── System Design (10)    ← caching, CDN layers
```

---

## 📋 Danh sách bài

| # | File | Chủ đề | Level |
|---|------|--------|-------|
| 1 | `001-debounce-throttle.md` | Debounce & Throttle — timing, implementations | 🟡 |
| 2 | `002-lazy-loading.md` | Lazy Loading — images, components, routes | 🟡 |
| 3 | `003-code-splitting.md` | Code Splitting — bundle analysis, chunk strategies | 🔴 |
| 4 | `004-rendering-perf.md` | Rendering Performance — reflow, repaint, composite | 🔴 |
| 5 | `005-caching.md` | Caching Strategies — HTTP cache, SW cache, memoization | 🔴 |

---

## 🎯 Mục tiêu sau khi học xong

- [ ] Implement được debounce/throttle từ đầu
- [ ] Biết khi nào dùng debounce vs throttle
- [ ] Sử dụng được Chrome DevTools Performance panel
- [ ] Phân biệt được reflow vs repaint
- [ ] Design được caching strategy cho ứng dụng

---

## 💡 Cách học

```
1. Đọc 001 — debounce/throttle, dễ nhất, nên làm trước
2. Đọc 002-003 — lazy loading + code splitting
3. Thực hành 004 với DevTools Performance
4. Đọc 005 — caching, kết nối với System Design
```

---

*Last updated: 2026-03-31*
