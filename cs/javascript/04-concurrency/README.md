# Chương 04 — Concurrency & Parallelism

> JavaScript là single-threaded — nhưng thế giới thì không. Chương này dạy bạn **phá vỡ giới hạn đó** để xử lý CPU-intensive tasks mà không block UI.

**Level**: 🔴 Advanced | **Bài**: 5 | **Thời gian**: ~1 tuần

---

## 🧩 Tại sao chương này quan trọng?

> Single-threaded không có nghĩa là không có parallelism. Nó có nghĩa là **bạn phải chủ động tạo** parallelism.

Scenarios cần concurrency:
```
- Image processing / video encoding → Web Workers
- Heavy computation in Node.js   → Worker Threads
- Scaling Node.js across CPU cores → Cluster
- Real-time collaborative editing → SharedArrayBuffer + Atomics
```

---

## 🔗 Liên quan đến các chương khác

```
Chương 04 (Concurrency)
  ├── Event Loop (03)      ← mỗi Worker có event loop riêng
  ├── Memory (05)          ← SharedArrayBuffer, transfer vs copy
  ├── System Design (10)   ← horizontal scaling với Cluster
  └── Performance (09)      ← Workers ảnh hưởng page load time
```

---

## 📋 Danh sách bài

| # | File | Chủ đề | Level |
|---|------|--------|-------|
| 1 | `001-thread-vs-process.md` | Thread vs Process — sự khác biệt nền tảng | 🔴 |
| 2 | `002-web-workers.md` | Web Workers — browser parallelism | 🔴 |
| 3 | `003-worker-threads.md` | Worker Threads — Node.js parallelism | 🔴 |
| 4 | `004-cluster.md` | Cluster — scale Node.js across cores | 🔴 |
| 5 | `005-sharedarraybuffer.md` | SharedArrayBuffer & Atomics | 🔴 |

---

## 🎯 Mục tiêu sau khi học xong

- [ ] Phân biệt được thread vs process, biết khi nào dùng cái nào
- [ ] Implement được Web Worker cho CPU-intensive task
- [ ] Sử dụng được Worker Threads trong Node.js
- [ ] Scale được Node.js app bằng Cluster module
- [ ] Hiểu memory model phía dưới SharedArrayBuffer

---

## 💡 Cách học

```
1. Đọc 001 — hiểu nền tảng trước
2. Thực hành Web Workers (002) trên browser
3. Thực hành Worker Threads (003) trên Node.js
4. So sánh Cluster (004) vs Worker Threads — khi nào dùng cái nào
```

---

*Last updated: 2026-03-31*
