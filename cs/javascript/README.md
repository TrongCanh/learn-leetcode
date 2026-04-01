# 📜 Computer Science — JavaScript Deep Dive

> Lộ trình hệ thống kiến thức JavaScript từ nền tảng đến nâng cao — phục vụ phỏng vấn Middle → Senior.

**Thời gian**: 8–12 tuần | **Tổng**: 10 chương, 60+ topics | **Level**: Intermediate → Senior

---

## 🎯 Mục tiêu

- [ ] Hiểu sâu bản chất JavaScript Engine (V8, SpiderMonkey)
- [ ] Nắm vững execution model: call stack, event loop, micro/macro tasks
- [ ] Thành thạo asynchronous patterns: Promise, async/await, callbacks
- [ ] Hiểu rõ memory model: stack/heap, GC, leak patterns
- [ ] Xây dựng được architecture cho ứng dụng thực tế scale
- [ ] Sẵn sàng phỏng vấn Frontend/Backend level Middle–Senior

---

## 📋 Tổng quan

| Chương | Chủ đề | Level | Bài tập |
|--------|--------|-------|---------|
| 01 | JavaScript Core | 🟢 Intermediate | 10 |
| 02 | Object Model & Prototype | 🟡 Intermediate–Advanced | 6 |
| 03 | Asynchronous & Event Loop | 🔴 Advanced | 8 |
| 04 | Concurrency & Parallelism | 🔴 Advanced | 6 |
| 05 | Memory & Performance | 🔴 Advanced | 6 |
| 06 | Modules & Code Organization | 🟡 Intermediate | 6 |
| 07 | Runtime Environment | 🟡 Intermediate–Advanced | 8 |
| 08 | Architecture & Design Patterns | 🔴 Advanced | 8 |
| 09 | Performance Optimization | 🔴 Advanced | 6 |
| 10 | System Design | 🔴 Advanced | 6 |

---

## 🔗 Mối liên hệ giữa các concept

```
┌─────────────────────────────────────────────────────────┐
│  Execution Context                                      │
│    → sinh ra Scope (01)                                 │
│    → sinh ra Hoisting (01)                              │
│    → liên quan đến `this` (01)                          │
│    → liên quan đến Closure (01)                          │
├─────────────────────────────────────────────────────────┤
│  Closure (01)                                           │
│    → ảnh hưởng đến Memory / Heap (05)                   │
│    → tạo nền tảng cho Module Pattern (06)              │
│    → tạo nền tảng cho Event Loop callback (03)          │
├─────────────────────────────────────────────────────────┤
│  Event Loop (03)                                       │
│    → quyết định execution order của async (03)         │
│    → ảnh hưởng đến UI responsiveness (09)              │
│    → liên quan đến Concurrency (04)                    │
│    → cơ sở của Web Workers (04)                        │
├─────────────────────────────────────────────────────────┤
│  Prototype Chain (02)                                  │
│    → ảnh hưởng đến OOP inheritance (02)                │
│    → ảnh hưởng đến property lookup & memory (05)       │
├─────────────────────────────────────────────────────────┤
│  Memory / Heap (05)                                     │
│    → closure giữ reference → memory leak (05)           │
│    → GC hoạt động trên heap (05)                       │
├─────────────────────────────────────────────────────────┤
│  Modules (06)                                          │
│    → ảnh hưởng đến bundle size & code splitting (09)   │
│    → ảnh hưởng đến lazy loading (09)                   │
├─────────────────────────────────────────────────────────┤
│  Architecture (08)                                      │
│    → kết hợp tất cả concepts trên                      │
│    → áp dụng cho System Design (10)                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🗺️ Lộ trình theo Level

### 🟢 Intermediate (Tuần 1–2)

```
Chương 01: JavaScript Core
  ├── 001-scope.md         ← LET, CONST, VAR — phân biệt được
  ├── 002-closure.md       ← closure là gì, ứng dụng
  ├── 003-hoisting.md      ← hoisting trong JS engine
  ├── 004-this.md          ← 4 cách bind `this`
  ├── 005-data-types.md    ← primitive vs reference, deep copy

Chương 06: Modules
  ├── 001-esm-cjs.md       ← ESM vs CommonJS
  ├── 002-dynamic-import.md
  └── 003-module-pattern.md
```

### 🟡 Intermediate–Advanced (Tuần 3–4)

```
Chương 02: Object Model & Prototype
  ├── 001-prototype-chain.md
  ├── 002-class-inheritance.md
  ├── 003-mixins-abstractions.md

Chương 07: Runtime Environment
  ├── 001-browser-apis.md
  ├── 002-dom-manipulation.md
  ├── 003-nodejs-runtime.md
  ├── 004-browser-engine.md
```

### 🔴 Advanced (Tuần 5–8)

```
Chương 03: Asynchronous & Event Loop
  ├── 001-call-stack.md
  ├── 002-event-loop.md
  ├── 003-microtask-macrotask.md
  ├── 004-promise.md
  ├── 005-async-await.md
  ├── 006-error-handling.md
  ├── 007-parallel-patterns.md

Chương 04: Concurrency & Parallelism
  ├── 001-thread-process.md
  ├── 002-web-workers.md
  ├── 003-worker-threads.md
  ├── 004-cluster.md
  ├── 005-sharedarraybuffer-atomics.md

Chương 05: Memory & Performance
  ├── 001-stack-heap.md
  ├── 002-garbage-collection.md
  ├── 003-memory-leaks.md
  ├── 004-profiling.md
  ├── 005-v8-optimizations.md

Chương 08: Architecture & Design Patterns
  ├── 001-oop-fundamentals.md
  ├── 002-functional-programming.md
  ├── 003-singleton-factory.md
  ├── 004-observer-pub-sub.md
  ├── 005-dependency-injection.md
  ├── 006-clean-architecture.md

Chương 09: Performance Optimization
  ├── 001-debounce-throttle.md
  ├── 002-lazy-loading.md
  ├── 003-code-splitting.md
  ├── 004-rendering-optimization.md
  ├── 005-caching-strategies.md

Chương 10: System Design
  ├── 001-event-driven-architecture.md
  ├── 002-scaling-techniques.md
  ├── 003-background-jobs.md
  ├── 004-cdn-caching-layers.md
  ├── 005-state-management.md
```

---

## 📁 Cấu trúc

```
cs/javascript/
├── README.md                    ← Tổng quan (file này)
│
├── 01-js-core/
│   ├── README.md                ← Chương 1
│   ├── 001-scope.md
│   ├── 002-closure.md
│   ├── 003-hoisting.md
│   ├── 004-this.md
│   ├── 005-data-types.md
│   ├── 006-execution-context.md
│   ├── 007-spread-rest.md
│   ├── 008-destructuring.md
│   ├── 009-type-coercion.md
│   └── 010-equality.md
│
├── 02-prototype-oop/
│   ├── README.md
│   ├── 001-prototype-chain.md
│   ├── 002-class-syntax.md
│   ├── 003-inheritance-patterns.md
│   ├── 004-mixins.md
│   ├── 005-object-patterns.md
│   └── 006-symbols-wells.md
│
├── 03-async-event-loop/
│   ├── README.md
│   ├── 001-call-stack.md
│   ├── 002-event-loop.md
│   ├── 003-microtask-macrotask.md
│   ├── 004-promise.md
│   ├── 005-async-await.md
│   ├── 006-error-handling.md
│   ├── 007-parallel-patterns.md
│   └── 008-promise-patterns.md
│
├── 04-concurrency/
│   ├── README.md
│   ├── 001-thread-vs-process.md
│   ├── 002-web-workers.md
│   ├── 003-worker-threads.md
│   ├── 004-cluster.md
│   └── 005-sharedarraybuffer.md
│
├── 05-memory-performance/
│   ├── README.md
│   ├── 001-stack-heap.md
│   ├── 002-garbage-collection.md
│   ├── 003-memory-leaks.md
│   ├── 004-memory-profiling.md
│   └── 005-v8-internals.md
│
├── 06-modules/
│   ├── README.md
│   ├── 001-esm-cjs.md
│   ├── 002-dynamic-import.md
│   ├── 003-module-patterns.md
│   └── 004-tree-shaking.md
│
├── 07-runtime-environment/
│   ├── README.md
│   ├── 001-browser-apis.md
│   ├── 002-dom-api.md
│   ├── 003-nodejs-runtime.md
│   ├── 004-browser-engine.md
│   ├── 005-security-model.md
│   ├── 006-web-assembly.md
│   └── 007-cross-platform.md
│
├── 08-architecture-patterns/
│   ├── README.md
│   ├── 001-oop-fundamentals.md
│   ├── 002-functional-programming.md
│   ├── 003-design-patterns-js.md
│   ├── 004-observable-pattern.md
│   ├── 005-dependency-injection.md
│   └── 006-clean-architecture.md
│
├── 09-performance-optimization/
│   ├── README.md
│   ├── 001-debounce-throttle.md
│   ├── 002-lazy-loading.md
│   ├── 003-code-splitting.md
│   ├── 004-rendering-perf.md
│   └── 005-caching.md
│
└── 10-system-design/
    ├── README.md
    ├── 001-event-driven.md
    ├── 002-scaling.md
    ├── 003-background-jobs.md
    ├── 004-cdn-caching.md
    └── 005-state-management-arch.md
```

---

## 🔗 Mở dashboard

```bash
# Mở dashboard trên trình duyệt
open dashboard/index.html
```

*Last updated: 2026-04-01*
