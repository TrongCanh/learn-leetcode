# Chương 03 — Asynchronous & Event Loop

> **Chương quan trọng nhất** — nơi hầu hết dev JavaScript bị stuck. Event loop quyết định code của bạn chạy **khi nào**, **thế nào**, và **tại sao** lại như vậy.

**Level**: 🔴 Advanced | **Bài**: 8 | **Thời gian**: ~2 tuần

---

## 🧩 Tại sao chương này quan trọng?

Mọi thứ bạn từng thắc mắc về JavaScript đều có đáp án ở đây:

```
Tại sao setTimeout(fn, 0) không chạy ngay lập tức?
  → Event loop phải empty call stack trước

Tại sao Promise.then() chạy trước setTimeout?
  → microtask queue ưu tiên hơn macrotask queue

Tại sao async/await "block" nhưng không block thread?
  → async/await là syntax sugar cho Promise chain

Tại sao for-loop với setTimeout in ra 5,5,5,5,5?
  → Đây là closure + event loop + var (chương 01)
```

---

## 🔗 Liên quan đến các chương khác

```
Chương 03 (Async/Event Loop)
  ├── Closure (01)      ← callback là closure
  ├── Memory (05)       ← Promise allocate trên heap
  ├── Concurrency (04)  ← Web Workers tách event loop
  ├── Error handling     ← Promise rejection, async try/catch
  └── Performance (09)  ← ảnh hưởng UI responsiveness
```

---

## 📋 Danh sách bài

| # | File | Chủ đề | Level |
|---|------|--------|-------|
| 1 | `001-call-stack.md` | Call Stack — JS single-threaded engine | 🔴 |
| 2 | `002-event-loop.md` | Event Loop — vòng lặp 3 bước bất tận | 🔴 |
| 3 | `003-microtask-macrotask.md` | Microtask vs Macrotask — execution order | 🔴 |
| 4 | `004-promise.md` | Promise — states, chaining, static methods | 🟡 |
| 5 | `005-async-await.md` | async/await — syntax sugar, traps, patterns | 🟡 |
| 6 | `006-error-handling.md` | Error Handling — sync, async, aggregated | 🟡 |
| 7 | `007-parallel-patterns.md` | Parallel Patterns — Promise.all, race, allSettled | 🟡 |
| 8 | `008-promise-patterns.md` | Advanced Promise — cancellation, retry, batching | 🔴 |

---

## 🎯 Mục tiêu sau khi học xong

- [ ] Vẽ được event loop bằng ASCII art từ đầu đến cuối
- [ ] Dự đoán chính xác output của mọi async code snippet
- [ ] Phân biệt được microtask vs macrotask
- [ ] Biết khi nào dùng `Promise.all` vs `Promise.race`
- [ ] Tránh được 5+ common async traps

---

## 💡 Cách học

```
1. Đọc 001-002 (call stack + event loop) — đây là nền tảng
2. Vẽ lại event loop từ memory
3. Làm bài 003 — thực hành prediction
4. Học Promise (004) → async/await (005) → patterns (007)
```

---

*Last updated: 2026-03-31*
