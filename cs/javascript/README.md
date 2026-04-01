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

---

---

## 🏗️ Playbook: Cách Xây Dựng Một Chủ Đề Kỹ Thuật Sâu Sắc

> Bộ quy tắc này được rút ra từ quá trình viết 59 bài viết cho JavaScript Deep Dive. Áp dụng cho bất kỳ chủ đề kỹ thuật nào muốn cover đủ sâu, đủ rộng, phục vụ học để đi phỏng vấn.

---

### 1. Nguyên Tắc Nền Tảng

```
MỖI BÀI VIẾT PHẢI ĐẠT 4 MỤC TIÊU:

① HIỂU — giải thích BẢN CHẤT, không phải định nghĩa
② ÁP DỤNG — code ví dụ thực tế, chạy được
③ SAI LẦM — biết trap ở đâu, tại sao
④ PHỎNG VẤN — trả lời được câu hỏi thực tế
```

---

### 2. Cấu Trúc Mỗi Bài Viết

```
TEMPLATE 12 PHẦN (bắt buộc theo thứ tự):

─────────────────────────────────────────────────────
PHẦN 1: Câu hỏi mở đầu
─────────────────────────────────────────────────────
Một câu hỏi thực tế HOẶC một đoạn code có vấn đề
→ Đặt ngay vấn đề, không lý thuyết suông
→ Tạo curiosity, cho thấy TẠI SAO cần biết topic này

Ví dụ:
  // Tại sao code này nhanh rồi đột nhiên chậm?
  function add(a, b) { return a + b; }
  add(1, 2);
  add('hello', 2); // type changed!

─────────────────────────────────────────────────────
PHẦN 2: Định nghĩa & Bản chất
─────────────────────────────────────────────────────
→ Định nghĩa chính xác, ngắn gọn
→ MINH HOẠ = ASCII diagram HOẶC memory layout
→ Giải thích TẠI SAO nó hoạt động như vậy
→ KHÔNG chỉ WHAT mà phải WHY

─────────────────────────────────────────────────────
PHẦN 3–7: Nội dung chính (3–6 sections)
─────────────────────────────────────────────────────
Mỗi section:
  ├── Giải thích concept
  ├── Code ví dụ (comment từng dòng)
  ├── Minh hoạ trực quan
  └── Edge cases / biến thể

Mật độ code: 40% code, 60% giải thích

─────────────────────────────────────────────────────
PHẦN 8: Các Traps Phổ Biến
─────────────────────────────────────────────────────
5 traps cụ thể:
  ├── Mã lỗi (❌) + giải thích TẠI SAO sai
  └── Code đúng (✅) + giải thích

─────────────────────────────────────────────────────
PHẦN 9: Câu Hỏi Phỏng Vấn
─────────────────────────────────────────────────────
6 câu hỏi + câu trả lời đầy đủ:
  ├── Câu hỏi thường gặp
  ├── Giải thích ngắn (2–3 sentences)
  └── Code minh hoạ nếu cần

─────────────────────────────────────────────────────
PHẦN 10: Tổng Hợp
─────────────────────────────────────────────────────
ASCII diagram tổng hợp TOÀN BỘ bài viết
→ Visual summary để ôn tập nhanh

─────────────────────────────────────────────────────
PHẦN 11: Checklist
─────────────────────────────────────────────────────
5–8 checkbox thực tế:
  ├── Code được: implement được...
  ├── Hiểu được: giải thích được...
  └── Trả lời được: câu hỏi phỏng vấn...

─────────────────────────────────────────────────────
PHẦN 12: Last updated
─────────────────────────────────────────────────────
*Last updated: YYYY-MM-DD*
```

---

### 3. Quy Tắc Viết

#### ✅ NÊN LÀM

```
① TỰ HỎI: "Học viên đọc xong sẽ THỰC SỰ hiểu hay chỉ biết định nghĩa?"
   → Viết để học viên có thể implement từ đầu

② MỌI concept đều có:
   ├── Định nghĩa bằng lời
   ├── Code ví dụ chạy được
   ├── Minh hoạ trực quan (ASCII diagram)
   └── Use case thực tế

③ PHẢI có section TRAPS — trap là phần giá trị nhất
   → Sai lầm phổ biến + giải thích tại sao

④ PHẢI có câu hỏi phỏng vấn — thực tế từ interview thật

⑤ Số dòng mục tiêu: 400–1000+ dòng
   (không phải kêu dài, mà vì đủ sâu)
```

#### ❌ KHÔNG NÊN

```
① Viết lý thuyết suông, không có code
② Liệt kê tính năng không giải thích bản chất
③ Chỉ copy documentation, không có insight cá nhân
④ Viết quá ngắn (< 200 dòng) → chủ đề chưa đủ sâu
⑤ Dùng generic examples ("foo", "bar", "a", "b")
   → Thay bằng ví dụ có ý nghĩa thực tế
```

---

### 4. Bảng Độ Dài Tối Thiểu

```
┌──────────────────────────┬────────────────────┬──────────────┐
│ Loại chủ đề             │ Ví dụ              │ Dòng tối thiểu │
├──────────────────────────┼────────────────────┼──────────────┤
│ Nền tảng (fundamentals) │ scope, closure      │ 500+ lines  │
│ Async/Concurrency        │ event loop, workers │ 600+ lines  │
│ Memory/Performance        │ GC, V8, profiling  │ 500+ lines  │
│ System/Runtime           │ Node.js, browser    │ 400+ lines  │
│ Patterns/Architecture    │ design patterns     │ 500+ lines  │
│ Algorithms/Data          │ tree, graph        │ 400+ lines  │
└──────────────────────────┴────────────────────┴──────────────┘

Nếu viết xong mà chưa đủ 300 dòng → CÂN NHẮC lại:
  → Còn thiếu phần nào?
  → Traps có đủ 5 cái chưa?
  → Câu hỏi phỏng vấn đủ 6 cái chưa?
  → Code examples có đủ thực tế chưa?
```

---

### 5. Checklist Trước Khi Hoàn Thành Một Bài

```
TRƯỚC KHI COMMIT, KIỂM TRA:

  □ Câu hỏi mở đầu: thú vị, thực tế, tạo curiosity?
  □ Định nghĩa: rõ ràng, bản chất, không wikipedia?
  □ Code examples: chạy được, có comment, có minh hoạ?
  □ ASCII diagrams: đủ trực quan, dễ hiểu?
  □ Sections: đủ 3-6 sections, mỗi section có code + giải thích?
  □ Traps: ít nhất 5 traps, có ❌ + ✅ code?
  □ Câu hỏi phỏng vấn: ít nhất 5-6 câu, có câu trả lời đầy đủ?
  □ Tổng hợp: diagram tổng hợp toàn bài?
  □ Checklist: 5-8 checkbox thực tế?
  □ Độ dài: đạt mốc tối thiểu theo loại chủ đề?
  □ Đọc lại: có đoạn nào viết theo kiểu "lý thuyết suông"?
  □ File name: đúng convention (001-xxx.md)?
  □ Router: đã update dashboard/app.js chưa?
```

---

### 6. Quy Tắc Đặt Tên File

```
NAMING CONVENTION:

├── 001-xxx.md   ← số 3 chữ số + tên mô tả
├── 002-yyy.md
└── 003-zzz.md

Tên file: dùng tiếng Anh, kebab-case
  ① Đặt theo keyword chính của topic
  ② Không đặt generic (topic.md, concept.md)
  ③ Gợi nhớ nội dung: 003-event-loop.md

VÍ DỤ TỐT:
  001-thread-vs-process.md   ← rõ ràng
  003-memory-profiling.md  ← rõ ràng
  005-v8-internals.md       ← rõ ràng

VÍ DỤ XẤU:
  001-concurrency.md         ← quá chung
  notes.md                  ← không mô tả
  draft.md                  ← không chuyên nghiệp
```

---

### 7. Quy Tắc Router (dashboard/app.js)

```
KHI THÊM FILE MỚI, CẬP NHẬT:

① Đường dẫn: path phải match EXACT folder structure
   path: 'cs/javascript/04-concurrency'  ✅
   path: 'cs/javascript/04-concurrency/' ❌ (trailing slash)

② File name: phải match EXACT tên file trên disk
   file: '001-thread-vs-process.md'  ✅
   file: 'thread-vs-process.md'       ❌ (thiếu số)

③ Chapter path trong problems phải trỏ vào folder chứa file đó
   path: 'cs/javascript/04-concurrency'  ← folder chứa file
   file: '001-thread-vs-process.md'    ← file trong folder đó

④ difficulty: chỉ 'Easy' | 'Medium' | 'Hard'
```

---

### 8. Khi Nào Cần Viết Lại (Rewrite)

```
DẤU HIỆU CẦN REWRITE:

  ○ File < 200 dòng → đủ ngắn, có thể expand
  ○ File 200–350 dòng nhưng thiếu:
      - Traps section
      - Interview Q&A
      - Code examples đầy đủ
  ○ File 350+ dòng nhưng chủ đề tự nhiên hẹp
    (không phải thiếu content, mà topic nhỏ)

KHÔNG CẦN REWRITE:

  ○ File 350+ dòng, đã đầy đủ 12 phần
  ○ Chủ đề tự nhiên nhỏ (ví dụ: TCP vs UDP)
    → không nên cố viết dài thêm
```

---

### 9. Checklist Tổng Thể Track Mới

```
KHI XÂY DỰNG MỘT TRACK MỚI (ví dụ: Database, System Design):

  □ Outline: 8–12 chapters, chia theo level (Easy→Hard)
  □ Mỗi chapter: README.md với overview + learning path
  □ Priority: viết fundamentals trước, advanced sau
  □ Router: update dashboard/app.js sau khi viết xong chapter
  □ README: update track overview + relationship diagram
  □ Preview: test router trong dashboard trước khi commit

  THỨ TỰ ƯU TIÊN:
  1. Track README (overview)
  2. Chapter README (per chapter)
  3. Fundamentals chapters (01, 02)
  4. Core chapters (03–06)
  5. Advanced chapters (07–10)
  6. Test dashboard router
  7. Commit
```

---

### 10. Mẫu Commit Message

```
feat(<track>): <mô tả ngắn> — <số bài> articles across <số chapters> chapters

Body:
- List chapters đã thêm
- Mỗi chapter ghi số bài và tên bài chính
- Ghi rõ những bài viết lại (rewrite) vs bài mới hoàn toàn

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

---

*Last updated: 2026-04-01*
