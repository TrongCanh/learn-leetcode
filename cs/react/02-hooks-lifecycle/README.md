# Chương 02 — Hooks System & Lifecycle

> useState, useEffect, useRef, useMemo, useCallback, useReducer, Custom Hooks — toàn bộ hooks system.

**Level**: 🟡 Intermediate | **Bài**: 5 | **Thời gian**: ~2 tuần

---

## 🧩 Tại sao chương này quan trọng?

Hooks là cách duy nhất để dùng state và lifecycle trong React hiện đại. Nhưng:

- useEffect **KHÔNG phải** lifecycle hook đơn giản
- Stale closure xảy ra **liên tục** nếu không hiểu closure
- useMemo/useCallback **có thể làm chậm** nếu dùng sai
- Custom Hooks là cách tốt nhất để **compose logic**

---

## 🔗 Relationship Map

```
useState (01)           → trigger re-render, functional updater
   ↓
useEffect (01)         → post-render, cleanup, dependency array
   ↓
Stale Closure (02)      → WHY useEffect phức tạp, closure capture value
   ↓
useRef (03)            → mutable ref, DOM access, stable reference
   ↓
useMemo / useCallback (03) → memoize computation / function
   ↓
useReducer (04)        → complex state logic, dispatch pattern
   ↓
Custom Hooks (04)      → compose logic, DRY, testable
   ↓
Advanced Patterns (05) → useReducer + Context, useSyncExternalStore
```

---

## 📋 Danh sách bài

| # | File | Chủ đề | Level | Interview |
|---|------|--------|-------|-----------|
| 1 | `001-usestate-useeffect.md` | useState & useEffect — internals chi tiết | 🟡 | ⭐⭐⭐⭐ |
| 2 | `002-stale-closure.md` | Stale Closure — tại sao, cách fix | 🟡 | ⭐⭐⭐⭐ |
| 3 | `003-useref-usememo-usecallback.md` | useRef, useMemo, useCallback | 🟡 | ⭐⭐⭐ |
| 4 | `004-usereducer-custom-hooks.md` | useReducer + Custom Hooks | 🟡 | ⭐⭐⭐ |
| 5 | `005-advanced-hooks.md` | Advanced Hooks Patterns | 🔴 | ⭐⭐⭐ |

---

## 🎯 Mục tiêu sau khi học xong

- [ ] Giải thích useEffect bên trong hoạt động như thế nào
- [ ] Hiểu closure capture value → stale state
- [ ] Biết khi nào dùng useMemo, khi nào KHÔNG cần
- [ ] Viết được custom hook có thể reuse
- [ ] Tránh được common stale closure bugs
- [ ] Hiểu useSyncExternalStore cho external state

---

## 💡 Cách học

```
1. Đọc bài stale closure TRƯỚC bài useEffect (nếu có thể)
2. Luôn nghĩ: "closure này capture giá trị gì?"
3. Gõ từng ví dụ, thay đổi dependencies, observe
4. Đọc phần "Traps" → ghi nhớ
```

---

*Last updated: 2026-04-01*
