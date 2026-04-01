# Chương 04 — Performance Optimization

> memo, useMemo, useCallback, Code Splitting, Profiling — tối ưu có hệ thống, không đoán mò.

**Level**: 🔴 Advanced | **Bài**: 4 | **Thời gian**: ~1.5 tuần

---

## 🧩 Tại sao chương này quan trọng?

Performance optimization **mà không có data** = premature optimization = có hại. Nhưng:

- Bạn CẦN biết khi nào cần optimize
- Bạn CẦN biết cách measure trước khi fix
- Bạn CẦN biết memo/useMemo/useCallback khác nhau thế nào
- Bạn CẦN biết code splitting là gì và khi nào cần

---

## 🔗 Relationship Map

```
Performance Optimization Pyramid

         ┌──────────────────────┐
         │   Architecture       │  ← folder structure, split contexts
         │   (biggest impact)  │
         ├──────────────────────┤
         │   Bundle Size        │  ← code splitting, tree shaking
         ├──────────────────────┤
         │   Component          │  ← memo, avoid unnecessary renders
         │   Rendering         │
         ├──────────────────────┤
         │   Computation       │  ← useMemo, useCallback
         ├──────────────────────┤
         │   Macro layout      │  ← CSS, DOM depth, reflow
         └──────────────────────┘

Key insight: Optimize từ trên xuống,
NOT từ dưới lên.
```

---

## 📋 Danh sách bài

| # | File | Chủ đề | Level | Interview |
|---|------|--------|-------|-----------|
| 1 | `001-memo-usememo-usecallback.md` | memo + useMemo + useCallback toàn diện | 🔴 | ⭐⭐⭐⭐ |
| 2 | `002-code-splitting.md` | Code Splitting & Lazy Loading | 🔴 | ⭐⭐⭐ |
| 3 | `003-profiling-optimization.md` | React DevTools Profiling & Strategy | 🔴 | ⭐⭐⭐ |
| 4 | `004-optimization-patterns.md` | Optimization Patterns thực chiến | 🔴 | ⭐⭐⭐ |

---

## 🎯 Mục tiêu sau khi học xong

- [ ] Biết cách profile React app trước khi optimize
- [ ] Phân biệt được memo vs useMemo vs useCallback
- [ ] Biết khi nào memo/useMemo/useCallback là anti-pattern
- [ ] Implement được code splitting với React.lazy + Suspense
- [ ] Áp dụng optimization checklist có hệ thống

---

## 💡 Cách học

```
1. CHẮC chắn đọc Profiling trước — measure trước khi fix
2. Đọc memo/useMemo/useCallback — hiểu toàn diện
3. Thực hành: tạo app có re-render issue → profile → fix
4. KHÔNG dùng memo/useMemo/useCallback trừ khi có data
```

---

*Last updated: 2026-04-01*
