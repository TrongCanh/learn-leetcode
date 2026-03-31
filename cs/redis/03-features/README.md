# Chương 3 — Features

> Pub/Sub, Transactions, Lua Scripting, Pipeline, Modules.

---

## 5 bài trong chương này

| # | Bài | Độ khó | Giải quyết |
|---|-----|--------|------------|
| 010 | [Pub/Sub](./010-pubsub.md) | 🟢 Easy | Real-time messaging, notifications |
| 011 | [Transactions](./011-transactions.md) | 🟡 Medium | Atomic operations, WATCH, pipeline transactions |
| 012 | [Lua Scripting](./012-lua-scripting.md) | 🔴 Hard | Custom atomic operations |
| 013 | [Pipeline](./013-pipelines.md) | 🟢 Easy | Batch operations, RTT optimization |
| 014 | [Modules](./014-modules.md) | 🟡 Medium | RediSearch, RedisJSON, RedisBloom |

## 🔑 Khái niệm chung

### 🔍 1. Pub/Sub vs Streams

```
Pub/Sub = Fire-and-forget messaging
  → Message không persist
  → Subscriber offline = miss message
  → Real-time, ephemeral

Streams = Persistent event log
  → Message được lưu
  → Subscriber có thể replay
  → Consumer groups
```

### 🔍 2. Lua Scripting

```
Lua scripting = "Stored procedures" của Redis
→ Chạy atomic trên server
→ Không race condition
→ Giảm network round trips

Use cases:
  - Atomic increment with condition
  - Custom data manipulation
  - Distributed locking
  - Rate limiting phức tạp
```

---

## → Bắt đầu với [010 — Pub/Sub](./010-pubsub.md)
