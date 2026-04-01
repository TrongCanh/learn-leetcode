# Chương 06 — Deep Dive & Interview Prep

> React Internals, Fiber, Concurrent Features, câu hỏi phỏng vấn thực tế.

**Level**: ⚫ Senior | **Bài**: 2 | **Thời gian**: ~1 tuần

---

## 🧩 Tại sao chương này quan trọng?

Senior level không chỉ biết **cách dùng** — bạn phải hiểu **tại sao** React thiết kế như vậy, **bên trong** hoạt động ra sao.

Đây là phần phân biệt Senior vs Mid-level trong phỏng vấn.

---

## 🔗 Relationship Map

```
React Internals
│
├── JavaScript Engine    → event loop, call stack
├── React DOM            → DOM manipulation
├── React Fiber          → incremental rendering, work units
├── React Scheduler      → priority lanes, time-slicing
├── Concurrent Features   → Suspense, useTransition, useDeferredValue
└── Key liên hệ         → JS engine + React internals

Interview Prep
├── JS Core ties        → closure, event loop, reference equality
├── React Core ties      → reconciliation, hooks, state
├── System Design ties  → architecture, data fetching, scale
└── Behavioral          → project experience, trade-offs
```

---

## 📋 Danh sách bài

| # | File | Chủ đề | Level | Interview |
|---|------|--------|-------|-----------|
| 1 | `001-react-internals.md` | React Internals — Fiber, Scheduler, Lanes | ⚫ | ⭐⭐⭐⭐ |
| 2 | `002-interview-prep.md` | 30 câu hỏi phỏng vấn thực tế + đáp án | ⚫ | ⭐⭐⭐⭐⭐ |

---

## 🎯 Mục tiêu sau khi học xong

- [ ] Giải thích được React Fiber và incremental rendering
- [ ] Hiểu được priority lanes và cách React scheduling
- [ ] Trả lời được câu hỏi phỏng vấn level Senior
- [ ] Thuyết trình được architecture decisions

---

*Last updated: 2026-04-01*
