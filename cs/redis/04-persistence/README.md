# Chương 4 — Persistence

> RDB, AOF, Hybrid storage — dữ liệu tồn tại sau khi restart.

---

## 3 bài trong chương này

| # | Bài | Độ khó | Giải quyết |
|---|-----|--------|------------|
| 015 | [RDB Snapshots](./015-rdb-snapshots.md) | 🟢 Easy | Point-in-time snapshots, bgsave |
| 016 | [AOF](./016-aof.md) | 🟡 Medium | Append-only file, fsync policies |
| 017 | [Hybrid Storage](./017-hybrid-storage.md) | 🟡 Medium | RDB + AOF combined, best of both |

## 🔑 Khái niệm chung

### 🔍 1. Redis = In-Memory nhưng Persistent

```
Redis lưu data trong RAM:
  ✅ Cực nhanh (hàng triệu ops/s)
  ✅ Low latency (microseconds)
  ❌ Data mất khi restart

→ Persistence = lưu data xuống disk
→ Khi restart → load data từ disk vào RAM
→ Tốc độ recover phụ thuộc data size
```

### 🔍 2. Khi nào cần persistence?

```
Redis như Cache (không cần persistence):
  → Dùng Redis để cache, data có thể tái tạo
  → Có thể chọn "không persistence"
  → Setup đơn giản, tốc độ cao nhất

Redis như Database (cần persistence):
  → Dữ liệu quan trọng, không thể mất
  → Session store, leaderboards, analytics
  → Cần AOF hoặc Hybrid
```

---

## → Bắt đầu với [015 — RDB Snapshots](./015-rdb-snapshots.md)
