# Chương 1 — Core Data Structures

> 6 loại data structure cốt lõi của Redis — từ đơn giản đến phức tạp.

---

## 6 bài trong chương này

| # | Bài | Độ khó | Giải quyết |
|---|-----|--------|------------|
| 001 | [Strings](./001-strings.md) | 🟢 Easy | Cache, counters, session |
| 002 | [Lists](./002-lists.md) | 🟢 Easy | Queues, stacks, feeds |
| 003 | [Sets](./003-sets.md) | 🟢 Easy | Tags, deduplication, unique visitors |
| 004 | [Sorted Sets](./004-sorted-sets.md) | 🟡 Medium | Leaderboards, rate limiting, priority |
| 005 | [Hashes](./005-hashes.md) | 🟢 Easy | Objects, user profiles, metadata |
| 006 | [Bitmaps & HyperLogLog](./006-bitmaps-hyperloglog.md) | 🟡 Medium | User activity, UV counting |

## 🔑 Khái niệm chung

### 🔍 1. Redis Data Model

```
Redis = Key-Value Store với structured values

Key (string) ──────► Value (structured)
───────────────────────────────
"user:100"         ──► Hash { name: "Alice", age: 30 }
"products:sku123"  ──► Hash { name: "Laptop", price: 999 }
"session:abc123"  ──► String (JSON token)
"leaderboard:game" ──► Sorted Set { player_id: score }
"tags:post:1"     ──► Set { "python", "redis", "cache" }
"queue:jobs"      ──► List [ job1, job2, job3 ]
```

### 🔍 2. Key Naming Convention

```
Best practice: colon-separated namespacing

user:100:name           → "Alice"
user:100:email          → "alice@example.com"
user:100:profile        → Hash
product:sku123:stock    → Integer
session:abc123:data     → String (JSON)
rate:limit:ip:1.2.3.4  → String (counter)
lock:order:12345        → String (distributed lock)

Pattern: entity:id:field
→ Dễ search với SCAN, dễ organize
```

### 🔍 3. TTL (Time To Live)

```
Mọi key đều có thể đặt TTL:
  SET user:session:abc123 "data" EX 3600
  → Key tự động xóa sau 3600 giây (1 giờ)

→ Dùng cho: cache, session, temporary data
→ Không cần cron job để cleanup
```

---

## → Bắt đầu với [001 — Strings](./001-strings.md)
