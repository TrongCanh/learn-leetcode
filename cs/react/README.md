# React — Từ Core Đến Senior Architecture

> Lộ trình học ReactJS toàn diện: từ JSX cơ bản đến thiết kế frontend architecture cho hệ thống lớn. Phục vụ phỏng vấn Middle → Senior.

**Level**: 🟡 Intermediate → 🔴 Advanced → ⚫ Senior | **Bài**: 24 | **Thời gian**: 8–12 tuần

---

## 🧩 Tại sao track này khác?

Hầu hết tutorial dạy bạn **cách dùng** React. Track này dạy bạn:

```
• KHÔNG học vẹt — hiểu BẢN CHẤT từng concept
• KHÔNG chỉ "works" — hiểu TẠI SAO nó hoạt động như vậy
• KHÔNG chỉ "docs" — hiểu internals bên dưới
• KHÔNG tách biệt — luôn liên hệ với JavaScript core
```

---

## 🔗 Prerequisite

```
Trước khi bắt đầu, bạn CẦN vững:

  ✓ Execution Context, Call Stack
  ✓ Closure — bản chất, không phải định nghĩa
  ✓ `this` binding — 4 cách bind
  ✓ Event Loop — macro/microtask queue
  ✓ Reference vs Primitive types
  ✓ Object/Array destructuring, spread

→ Nếu chưa vững → quay lại JavaScript Deep Dive trước
```

---

## 🔗 Relationship Map

```
REACT RENDER CYCLE
│
├── setState() / useState()    → trigger re-render
│       ↓
├── Virtual DOM diff           → Reconciliation
│       ↓
├── DOM updates                → painting
│
├── Thay đổi gì?               → props, state, context, forceUpdate
│   Khi nào?                   → bạn KHÔNG control trực tiếp
│   Tối ưu bằng cách nào?      → memo, useMemo, useCallback
│
└── Closures liên quan gì?    → stale state, useEffect dependencies

STATE MANAGEMENT
│
├── Local State (useState)     → component-specific
├── Lifting State Up           → shared, few levels
├── Context API               → shared, many levels (but: re-render storm)
├── Redux/Zustand             → global, predictable, middleware
└── Reference Equality        → why re-renders happen

PERFORMANCE
│
├── Reference Equality         → {} !== {}, [] !== [], fn !== fn
├── memo()                    → prevent child re-render
├── useMemo                    → expensive calculation cache
├── useCallback               → stable function reference
└── Virtual DOM                → why diffing is fast

ARCHITECTURE
│
├── Separation of concerns     → UI / Business Logic / Data
├── Hooks pattern             → compose business logic
├── Folder structure          → feature-based vs layer-based
└── API layer                 → data fetching, caching, error handling
```

---

## 📋 Lộ trình chi tiết (8 tuần)

### PHASE 1 — Core React (Tuần 1–2)

| # | Bài | Chủ đề | Trọng số phỏng vấn |
|---|-----|--------|---------------------|
| 1 | `001-jsx.md` | JSX — thực chất là gì? | ⭐⭐ |
| 2 | `002-components.md` | Components — function vs class | ⭐⭐ |
| 3 | `003-props.md` | Props — data flow một chiều | ⭐⭐ |
| 4 | `004-state.md` | State — nguyên tắc setState | ⭐⭐⭐ |
| 5 | `005-rendering.md` | Rendering & Re-render — Tại sao re-render? | ⭐⭐⭐ |
| 6 | `006-vdom-reconciler.md` | Virtual DOM & Reconciliation | ⭐⭐⭐⭐ |

### PHASE 2 — Hooks System (Tuần 2–4)

| # | Bài | Chủ đề | Trọng số phỏng vấn |
|---|-----|--------|---------------------|
| 7 | `001-usestate-useeffect.md` | useState & useEffect — bản chất | ⭐⭐⭐⭐ |
| 8 | `002-stale-closure.md` | Stale Closure — tại sao xảy ra | ⭐⭐⭐⭐ |
| 9 | `003-useref-usememo-usecallback.md` | useRef vs useMemo vs useCallback | ⭐⭐⭐⭐ |
| 10 | `004-usereducer-custom-hooks.md` | useReducer + Custom Hooks | ⭐⭐⭐ |
| 11 | `005-advanced-hooks.md` | Advanced Hooks Patterns | ⭐⭐⭐ |

### PHASE 3 — State Management (Tuần 4–5)

| # | Bài | Chủ đề | Trọng số phỏng vấn |
|---|-----|--------|---------------------|
| 12 | `001-context-api.md` | Context API — internals & pitfalls | ⭐⭐⭐⭐ |
| 13 | `002-redux-zustand.md` | Redux vs Zustand — so sánh | ⭐⭐⭐ |
| 14 | `003-lifting-state-migration.md` | Lifting State vs Context vs Redux | ⭐⭐⭐ |

### PHASE 4 — Performance (Tuần 5–6)

| # | Bài | Chủ đề | Trọng số phỏng vấn |
|---|-----|--------|---------------------|
| 15 | `001-memo-usememo-usecallback.md` | memo + useMemo + useCallback — toàn diện | ⭐⭐⭐⭐ |
| 16 | `002-code-splitting.md` | Code Splitting & Lazy Loading | ⭐⭐ |
| 17 | `003-profiling-optimization.md` | Profiling & Optimization Strategy | ⭐⭐⭐ |
| 18 | `004-optimization-patterns.md` | Optimization Patterns thực chiến | ⭐⭐⭐ |

### PHASE 5 — Architecture (Tuần 6–8)

| # | Bài | Chủ đề | Trọng số phỏng vấn |
|---|-----|--------|---------------------|
| 19 | `001-component-patterns.md` | Component Patterns (HOC, Render Props, Compound) | ⭐⭐⭐ |
| 20 | `002-folder-structure.md` | Folder Structure & Scalable Architecture | ⭐⭐⭐ |
| 21 | `003-api-layer.md` | API Layer & Data Fetching Patterns | ⭐⭐⭐⭐ |
| 22 | `004-testing-debugging.md` | Testing & Debugging React | ⭐⭐⭐ |

### PHASE 6 — Deep Dive & Interview (Tuần 8+)

| # | Bài | Chủ đề | Trọng số phỏng vấn |
|---|-----|--------|---------------------|
| 23 | `001-react-internals.md` | React Internals — khi nào bạn cần? | ⭐⭐⭐⭐ |
| 24 | `002-interview-prep.md` | Câu hỏi phỏng vấn thực tế + đáp án | ⭐⭐⭐⭐⭐ |

---

## 🎯 Mục tiêu theo level

### 🟢 Beginner (Tuần 1–2)
```
□ JSX là gì, tại sao cần nó
□ Component là gì — function component
□ Props truyền như thế nào
□ State là gì, setState hoạt động ra sao
□ Khi nào component re-render
```

### 🟡 Intermediate (Tuần 3–5)
```
□ useEffect bên trong hoạt động như thế nào
□ Stale closure — tại sao xảy ra, cách fix
□ useMemo, useCallback — khi nào thật sự cần
□ Context API — internals, khi nào dùng, khi nào tránh
□ Redux / Zustand — khi nào cần, khác gì Context
□ Lifting state — khi nào cần
```

### 🔴 Advanced (Tuần 5–7)
```
□ Reconciliation algorithm chi tiết
□ React.memo vs useMemo vs useCallback — khác nhau thế nào
□ Performance profiling — React DevTools
□ Code splitting — React.lazy, Suspense
□ Component patterns — HOC, render props, compound
□ API layer — data fetching, caching, optimistic updates
```

### ⚫ Senior (Tuần 7–8+)
```
□ Frontend architecture — folder structure
□ State management strategy cho app lớn
□ Separation of concerns — UI / Logic / Data
□ Testing strategy
□ React Internals — Fiber, Lane, Concurrent features
□ Thuyết trình architecture decision trong phỏng vấn
```

---

## 💡 Cách học mỗi bài

```
1. Đọc toàn bộ bài (20–30 phút)
2. Gõ lại ví dụ trong CodeSandbox / StackBlitz (15 phút)
3. Đọc phần "Traps phổ biến" → tự kiểm tra
4. Trả lời câu hỏi phỏng vấn bằng lời (không nhìn đáp án)
5. Check phần "Thực hành" → làm bài tập
```

---

## 🏆 Mini Projects

| Giai đoạn | Project | Kiến thức áp dụng |
|-----------|---------|-------------------|
| Phase 1 | Todo App (function component) | Component, Props, State |
| Phase 2 | Hacker News Reader | useEffect, data fetching, custom hooks |
| Phase 3 | Theme + Auth Context App | Context API, Redux/Zustand |
| Phase 4 | Dashboard với lazy loading | memo, useMemo, code splitting |
| Phase 5 | E-commerce SPA | Full architecture, API layer |
| Final | Portfolio + Blog | Toàn bộ kiến thức |

---

## 🔑 5 Câu hỏi tổng hợp bạn phải trả lời được

```
1. Tại sao React re-render? Liệt kê TẤT CẢ trigger
2. useEffect hoạt động như thế nào bên trong?
3. Khi nào dùng useMemo, useCallback? Khi nào KHÔNG cần?
4. Context vs Redux — bạn chọn cái nào, tại sao?
5. Thiết kế folder structure cho một app React 50+ pages
```

---

*Last updated: 2026-04-01*
