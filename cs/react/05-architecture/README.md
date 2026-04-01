# Chương 05 — Architecture & Patterns

> Component patterns, folder structure, API layer, testing — thiết kế hệ thống lớn.

**Level**: 🔴 Advanced → ⚫ Senior | **Bài**: 4 | **Thời gian**: ~2 tuần

---

## 🧩 Tại sao chương này quan trọng?

Khi project lớn lên, **architecture quyết định**:
- Code có dễ maintain không?
- Onboarding dev mới có nhanh không?
- Thêm feature mới có mất 1 tuần hay 1 giờ?

Component patterns + folder structure + API layer = **80% architecture decisions**.

---

## 🔗 Relationship Map

```
Architecture Layers

├── UI Layer             → components, layout, presentation
├── Business Logic      → hooks, custom hooks, reducers
├── Data Layer          → API calls, caching, normalization
│     ├── Server state  → React Query (NOT in this chapter)
│     └── Client state  → Context, Redux, Zustand
└── Cross-cutting       → Error boundaries, auth, i18n

Folder Structure Debate:
  ├── By type           → components/, hooks/, utils/  ← simple
  └── By feature       → features/auth/, features/todo/  ← scalable
```

---

## 📋 Danh sách bài

| # | File | Chủ đề | Level | Interview |
|---|------|--------|-------|-----------|
| 1 | `001-component-patterns.md` | HOC, Render Props, Compound Components | 🔴 | ⭐⭐⭐ |
| 2 | `002-folder-structure.md` | Scalable Folder Structure | 🔴 | ⭐⭐⭐ |
| 3 | `003-api-layer.md` | API Layer & Data Fetching Patterns | 🔴 | ⭐⭐⭐⭐ |
| 4 | `004-testing-debugging.md` | Testing Strategy & Debugging | 🔴 | ⭐⭐⭐ |

---

## 🎯 Mục tiêu sau khi học xong

- [ ] Áp dụng được Compound Components pattern
- [ ] Chọn được folder structure phù hợp với project size
- [ ] Thiết kế được API layer có error handling + retry
- [ ] Viết được unit test cho components và hooks

---

## 💡 Cách học

```
1. Đọc Component Patterns → thực hành refactor code cũ
2. Đọc Folder Structure → apply vào project hiện tại
3. Đọc API Layer → extract API calls thành service layer
4. Đọc Testing → viết test cho custom hooks trước
```

---

*Last updated: 2026-04-01*
