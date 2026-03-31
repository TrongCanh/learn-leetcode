# 🧠 Computer Science — Redis

> Redis (REmote DIctionary Server) là in-memory data structure store phổ biến nhất thế giới, dùng làm database, cache, message broker, và session store.

**Thời gian**: 8–10 tuần | **Tổng**: 32 bài | **0/32 ✅ Đã hoàn thành**

---

## 📋 Tổng quan

Redis nổi tiếng với tốc độ cực nhanh (hàng triệu operations/giây) nhờ lưu trữ **in-memory**. Nhưng Redis không chỉ là "key-value store đơn giản" — nó là một **data structure server** mạnh mẽ với nhiều loại dữ liệu phức tạp:

- 📝 **Strings** — Cache, counters, session
- 📋 **Lists** — Queues, stacks, activity feeds
- 🎯 **Sets** — Tags, unique visitors, deduplication
- 🏆 **Sorted Sets** — Leaderboards, rate limiting, priority queues
- 🗺️ **Hashes** — Objects, metadata
- 🌊 **Streams** — Event sourcing, message queues
- 📍 **Geospatial** — Location-based services
- 📄 **JSON** — Document storage (RedisJSON module)

---

## 📁 Cấu trúc

```
redis/
├── 01-core-data-structures/     ← String, List, Set, Sorted Set, Hash, Bitmap
├── 02-advanced-structures/       ← Stream, Geospatial, JSON
├── 03-features/                  ← Pub/Sub, Transactions, Lua, Pipeline, Modules
├── 04-persistence/               ← RDB, AOF, Hybrid
├── 05-clustering-ha/             ← Replication, Sentinel, Cluster, Redlock
├── 06-performance/               ← Memory management, Eviction, I/O, Optimization
└── 07-use-cases/                ← Cache, Rate limit, Session, Leaderboard, MQ, Vector search
```

---

## 🎯 Mục tiêu

- [ ] Hiểu 6 core data structures và use cases của từng loại
- [ ] Thành thạo Redis CLI và các client library (Python, Node.js)
- [ ] Hiểu và implement caching strategies hiệu quả
- [ ] Nắm persistence models (RDB, AOF, Hybrid)
- [ ] Biết cách scale Redis với Replication, Sentinel, Cluster
- [ ] Implement distributed locking với Redlock
- [ ] Hiểu Redis use cases nâng cao: Rate limiting, Leaderboards, Message queues

---

## 🔑 Kiến thức nền tảng cần có trước

| Chủ đề | Nguồn |
|--------|-------|
| TCP/IP networking basics | [Socket Programming](./socket-programming/README.md) ✅ |
| Command-line basics | Linux/Shell fundamentals |
| Python basics | Real Python |

---

## 📚 Tài liệu tham khảo

- [redis.io/docs](https://redis.io/docs) — Documentation chính thức
- [redis.io/commands](https://redis.io/commands) — Full command reference
- [Redis University](https://university.redis.com) — Khóa học miễn phí
- [Try Redis](https://try.redis.io) — Interactive tutorial
- [Redis Insight](https://redis.com/redis-enterprise/redis-insight) — GUI client

---

## 🔗 Kết nối với Design Patterns

| Pattern | Redis |
|---------|-------|
| Proxy | Cache layer (Cache-Aside, Read-Through) |
| Observer | Pub/Sub pattern |
| Strategy | Eviction policies (LRU, LFU, TTL) |
| Flyweight | String interning, shared data |
| Command | Lua scripting |
| Memento | RDB snapshots (point-in-time state) |

---

## → Bắt đầu với Chương 1 — [Core Data Structures](./01-core-data-structures/README.md)

---

*Last updated: 2026-03-31*
