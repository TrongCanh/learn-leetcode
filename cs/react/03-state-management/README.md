# Chương 03 — State Management

> Local state, Lifting State, Context API, Redux, Zustand — chọn đúng công cụ cho đúng việc.

**Level**: 🟡 Intermediate → 🔴 Advanced | **Bài**: 3 | **Thời gian**: ~1.5 tuần

---

## 🧩 Tại sao chương này quan trọng?

State management là **nguồn gốc** của hầu hết bugs và complexity trong React:

- Quá nhiều state toàn cục → Context re-render storm
- Quá ít state chia sẻ → prop drilling
- Chọn Redux khi không cần → over-engineering
- Không hiểu reference equality → unnecessary re-renders

---

## 🔗 Relationship Map

```
State Management Spectrum
│
├── useState                 → component-local, ephemeral
├── Lifting State Up         → shared sibling, 1-2 levels
├── Context API             → app-wide, BUT: re-render ALL consumers
│     └── Solution          → split contexts, useMemo consumers
├── Redux / Zustand         → global, predictable, middleware
│     └── Selector pattern  → prevent unnecessary re-renders
└── Server State            → React Query / SWR (NOT this chapter)

Decision Tree:
  Ephemeral?                → useState
  Shared 1-2 levels?        → lift to parent
  Shared many levels?        → Context (if few consumers)
  Shared app-wide + complex? → Redux / Zustand
  Server cache?             → React Query
```

---

## 📋 Danh sách bài

| # | File | Chủ đề | Level | Interview |
|---|------|--------|-------|-----------|
| 1 | `001-context-api.md` | Context API — internals & pitfalls | 🟡 | ⭐⭐⭐⭐ |
| 2 | `002-redux-zustand.md` | Redux vs Zustand — so sánh | 🟡 | ⭐⭐⭐ |
| 3 | `003-lifting-state-migration.md` | Khi nào dùng gì — decision framework | 🟡 | ⭐⭐⭐ |

---

## 🎯 Mục tiêu sau khi học xong

- [ ] Giải thích được Context re-render tất cả consumers
- [ ] Biết cách split context để tránh re-render storm
- [ ] So sánh được Redux vs Zustand vs Context
- [ ] Áp dụng decision tree để chọn state management phù hợp

---

## 💡 Cách học

```
1. Đọc Context API kỹ — đây là nền tảng
2. Thực hành re-render storm → tự thấy vấn đề
3. Đọc Redux/Zustand → hiểu khi nào cần
4. Áp dụng decision tree vào project thực
```

---

*Last updated: 2026-04-01*
