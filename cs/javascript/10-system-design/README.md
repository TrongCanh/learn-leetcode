# Chương 10 — System Design

> Cuối cùng nhưng không kém phần quan trọng. Đây là chương **tổng hợp** — áp dụng tất cả kiến thức từ chương 1–9 để thiết kế hệ thống thực tế.

**Level**: 🔴 Advanced → Senior | **Bài**: 5 | **Thời gian**: ~1.5 tuần

---

## 🧩 Tại sao chương này quan trọng?

> System Design là điểm phân biệt **Middle** và **Senior**. Không phải bạn biết bao nhiêu API, mà là bạn **tổ chức** chúng như thế nào.

Các câu hỏi System Design phổ biến:

```
Frontend-focused:
  ├── Thiết kế global state management?
  ├── Làm sao build 1 drag-and-drop editor?
  ├── Xử lý real-time collaboration (Google Docs)?
  └── Caching strategy cho 1 e-commerce?

Backend-focused:
  ├── Thiết kế notification service?
  ├── Event-driven architecture?
  ├── Rate limiting & throttling?
  └── Background job processing?

Combined:
  ├── Design 1 URL shortener (like bit.ly)
  ├── Design 1 chat application
  └── Design 1 rate limiter
```

---

## 🔗 Liên quan đến các chương khác

```
Chương 10 (System Design) = Tổng hợp tất cả:
  ├── Event Loop + Async (03)      → non-blocking I/O
  ├── Concurrency (04)             → horizontal scaling
  ├── Memory (05)                  → cache design
  ├── Modules (06)                 → micro-frontends
  ├── Architecture (08)            → service boundaries
  ├── Performance (09)              → CDN, caching, optimization
  └── + Database, Networking (các track khác)
```

---

## 📋 Danh sách bài

| # | File | Chủ đề | Level |
|---|------|--------|-------|
| 1 | `001-event-driven.md` | Event-Driven Architecture — pub/sub, message queues | 🔴 |
| 2 | `002-scaling.md` | Scaling Techniques — vertical, horizontal, sharding | 🔴 |
| 3 | `003-background-jobs.md` | Background Jobs — queues, workers, scheduling | 🔴 |
| 4 | `004-cdn-caching.md` | CDN & Multi-layer Caching — edge computing | 🔴 |
| 5 | `005-state-management-arch.md` | State Management Architecture — client, server, sync | 🔴 |

---

## 🎯 Mục tiêu sau khi học xong

- [ ] Thiết kế được event-driven system với message queue
- [ ] Phân biệt được vertical vs horizontal scaling
- [ ] Chọn được caching strategy phù hợp (LRU, LFU, TTL...)
- [ ] Thiết kế được background job processing
- [ ] Trả lời được câu hỏi System Design trong phỏng vấn

---

## 💡 Cách học

```
1. Đọc 001-002 — event-driven + scaling (nền tảng)
2. Đọc 003 — background jobs (thực tế, hay dùng)
3. Đọc 004-005 — caching + state management
4. Practice: tự design 1 hệ thống nhỏ từ đầu
```

---

## 📚 Tham khảo thêm

- Designing Data-Intensive Applications (Martin Kleppmann)
- System Design Interview — Alex Xu
- High Performance Browser Networking (Ilya Grigorik)

---

*Last updated: 2026-03-31*
