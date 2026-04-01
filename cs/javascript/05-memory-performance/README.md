# Chương 05 — Memory & Performance

> Biết cách JavaScript quản lý memory → tránh được memory leak, viết code hiệu quả hơn, và trả lời được câu hỏi phỏng vấn "内存管理" mà nhiều senior dev vẫn lúng túng.

**Level**: 🔴 Advanced | **Bài**: 5 | **Thời gian**: ~1 tuần

---

## 🧩 Tại sao chương này quan trọng?

> Memory leak là lỗi **thầm lặng** — app chạy fine 5 phút, chậm dần sau 1 giờ, crash sau 1 ngày.

Các nguồn rò rỉ phổ biến:

```javascript
// 1. Forgotten timer
setInterval(() => { doSomething(obj) }, 1000);

// 2. Closures holding references
function outer() {
  const bigData = new Array(1000000);
  return function inner() { /* never called */ };
}

// 3. Detached DOM nodes
const el = document.getElementById('chart');
chartData = el; // el cannot be GC'd
```

---

## 🔗 Liên quan đến các chương khác

```
Chương 05 (Memory)
  ├── Closure (01)      ← closure giữ reference → leak
  ├── Heap allocation   ← Promise, array trên heap
  ├── Prototype chain   ← objects trên heap, GC không đến được
  └── V8 Internals      ← hidden classes, inline caching
```

---

## 📋 Danh sách bài

| # | File | Chủ đề | Level |
|---|------|--------|-------|
| 1 | `001-stack-heap.md` | Stack vs Heap — phân biệt allocation | 🔴 |
| 2 | `002-garbage-collection.md` | Garbage Collection — mark-and-sweep, generational GC | 🔴 |
| 3 | `003-memory-leaks.md` | Memory Leaks — patterns và cách phát hiện | 🔴 |
| 4 | `004-memory-profiling.md` | Memory Profiling — Chrome DevTools, heap snapshots | 🔴 |
| 5 | `005-v8-internals.md` | V8 Internals — hidden classes, inline caching, optimization | 🔴 |

---

## 🎯 Mục tiêu sau khi học xong

- [ ] Giải thích được khi nào variable nằm trên stack vs heap
- [ ] Mô tả được thuật toán mark-and-sweep
- [ ] Nhận diện được 5+ memory leak patterns
- [ ] Sử dụng được Chrome DevTools để tìm leak
- [ ] Hiểu V8 tối ưu code như thế nào (và khi nào bị de-optimize)

---

## 💡 Cách học

```
1. Đọc 001-002 — nền tảng memory model
2. Đọc 003 — các leak patterns, tự nhận diện trong code cũ
3. Thực hành 004 với Chrome DevTools
4. Đọc 005 — bonus, hiểu sâu hơn V8
```

---

*Last updated: 2026-03-31*
