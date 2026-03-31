# 013 — Pipelines

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | Pipeline, Batch operations, RTT optimization |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Pipeline là gì?

**Pipeline = gửi nhiều commands cùng lúc, nhận tất cả responses cùng lúc. Giảm Round Trip Time (RTT).**

```
┌──────────────────────────────────────────────────────────────┐
│               WITHOUT PIPELINE                                    │
│                                                               │
│  App ──── GET user:1 ────────────► Redis                     │
│  App ◄─── "Alice" ────────────── Redis                      │
│               │ 1 RTT = 1ms                                   │
│                                                               │
│  App ──── GET user:2 ────────────► Redis                     │
│  App ◄─── "Bob" ─────────────── Redis                      │
│               │ 1 RTT = 1ms                                   │
│                                                               │
│  App ──── GET user:3 ────────────► Redis                     │
│  App ◄─── "Charlie" ─────────── Redis                      │
│               │ 1 RTT = 1ms                                   │
│                                                               │
│  ──── Total: 3 RTT = 3ms                                    │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│               WITH PIPELINE                                       │
│                                                               │
│  App ──── MGET user:1 user:2 user:3 ──► Redis              │
│  App ◄─── ["Alice","Bob","Charlie"] ── Redis              │
│                                                               │
│  ──── Total: 1 RTT = 1ms (3x faster!)                     │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 2. Pipeline vs MULTI/EXEC

```
Pipeline ≠ Transaction

Pipeline:
  ├── Gửi nhiều commands cùng lúc
  ├── Nhận responses cùng lúc
  ├── Commands KHÔNG atomic (can thiệp được)
  ├── Tốt cho: batch reads/writes

Transaction (MULTI/EXEC):
  ├── Batch commands → chạy atomic
  ├── WATCH → optimistic locking
  ├── Có rollback (không — Redis không có)
  ├── Tốt cho: related commands cần atomicity
```

### 🔍 3. Pipeline Operations

```bash
# ─── Without Pipeline ───
GET user:1
GET user:2
GET user:3
GET user:4
GET user:5
# → 5 RTTs!

# ─── MGET ─── (Multiple GET)
MGET user:1 user:2 user:3 user:4 user:5
# → 1 RTT!

# ─── MSET ─── (Multiple SET)
MSET user:1 "Alice" user:2 "Bob" user:3 "Charlie"
# → 1 RTT!

# ─── Pipeline ───
# Pipeline = batch NHIỀU commands KHÔNG có specific MCMD
# Dùng khi:
#   - Nhiều commands khác nhau
#   - Không cần atomicity
```

### 🔍 4. Python Pipeline

```python
import redis

r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# ─── Pipeline Basic ───
pipe = r.pipeline()

pipe.set("key1", "value1")
pipe.get("key1")
pipe.incr("counter")
pipe.incr("counter")
pipe.get("counter")

# Execute all at once
results = pipe.execute()
# results = [True, "value1", 1, 2, 2]
# [None, None, ..., None] nếu không có return values

print(f"Results: {results}")

# Pipeline is reset after execute
pipe.execute()  # New batch
```

### 🔍 5. Use Cases

```
┌──────────────────────────────────────────────────────────────┐
│                  PIPELINE USE CASES                             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. BATCH READS                                            │
│     pipe.hgetall("user:1")                                 │
│     pipe.hgetall("user:2")                                 │
│     pipe.hgetall("user:3")                                 │
│     → 1 RTT thay vì 3                                     │
│                                                               │
│  2. BATCH WRITES                                          │
│     for item in large_list:                                 │
│       pipe.sadd("items", item)                             │
│     pipe.execute()                                          │
│     → 1 RTT thay vì N                                     │
│                                                               │
│  3. AGGREGATION QUERIES                                    │
│     pipe.zcard("leaderboard")                               │
│     pipe.zrevrange("leaderboard", 0, 9, withscores=True) │
│     pipe.zrank("leaderboard", "user:123")                 │
│     results = pipe.execute()                                │
│                                                               │
│  4. DATA MIGRATION                                          │
│     pipe.set("new_key", r.get("old_key"))                │
│     pipe.delete("old_key")                                  │
│     pipe.execute()                                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 6. Pipeline với WATCH

```python
# Pipeline KHÔNG đảm bảo atomic với WATCH
pipe = r.pipeline()
pipe.watch("balance")
pipe.multi()  # Bắt đầu transaction
pipe.get("balance")
pipe.decrby("balance", 10)
try:
    pipe.execute()  # Atomic nếu balance không đổi
except redis.WatchError:
    print("Balance changed, retry needed")
```

---

## 🧠 Phân tích & Hướng tư tư

### 🤔 Pipeline vs Lua Script

```
Pipeline:
  ✅ Batch commands
  ✅ Giảm RTT
  ✅ Commands vẫn riêng lẻ
  ❌ Không atomic

Lua Script:
  ✅ Atomic
  ✅ 1 RTT
  ❌ Script phức tạp
  ❌ Lock Redis trong khi chạy

→ Batch reads/writes không cần atomic → Pipeline
→ Cần atomic logic phức tạp → Lua
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Pipeline quá lớn** | Response quá lớn → memory spike. Chunk thành batches nhỏ |
| **Tưởng pipeline atomic** | Pipeline KHÔNG atomic. Dùng MULTI/EXEC nếu cần |
| **Quên execute()** | Commands chỉ được QUEUE, không chạy nếu không execute |
| **Dùng pipeline thay WATCH** | WATCH + MULTI/EXEC = atomic batch |

### 🔑 Key Insight

> **Pipeline = batch commands để giảm RTT. 1 RTT cho N commands. KHÔNG atomic. Dùng khi batch reads/writes không cần atomicity.**

---

## ✅ Ví dụ Python

```python
import redis
import time

r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def benchmark_pipeline(n_operations=100):
    """So sánh: non-pipeline vs pipeline"""

    # ─── Non-pipeline ───
    start = time.time()
    for i in range(n_operations):
        r.set(f"bench:np:{i}", f"value{i}")
        r.get(f"bench:np:{i}")
        r.delete(f"bench:np:{i}")
    non_pipeline_time = time.time() - start

    # ─── Pipeline ───
    start = time.time()
    pipe = r.pipeline()
    for i in range(n_operations):
        pipe.set(f"bench:p:{i}", f"value{i}")
        pipe.get(f"bench:p:{i}")
        pipe.delete(f"bench:p:{i}")
    pipe.execute()
    pipeline_time = time.time() - start

    print(f"Non-pipeline: {non_pipeline_time:.3f}s")
    print(f"Pipeline:      {pipeline_time:.3f}s")
    print(f"Speedup:      {non_pipeline_time / pipeline_time:.1f}x faster")

def batch_user_fetch(user_ids):
    """Fetch nhiều users trong 1 RTT"""
    pipe = r.pipeline()
    for uid in user_ids:
        pipe.hgetall(f"user:{uid}")
    results = pipe.execute()
    return results

def batch_product_update(product_updates):
    """Update nhiều products trong 1 RTT"""
    pipe = r.pipeline()
    for product_id, data in product_updates.items():
        pipe.hset(f"product:{product_id}", mapping=data)
    results = pipe.execute()
    return sum(1 for r in results if r)  # Count successful

def leaderboard_snapshot():
    """Lấy leaderboard snapshot"""
    pipe = r.pipeline()
    pipe.zcard("leaderboard")
    pipe.zrevrange("leaderboard", 0, 9, withscores=True)
    pipe.zrevrange("leaderboard", 0, 9, withscores=True)

    total, top_10, with_ranks = pipe.execute()

    # Thêm rank vào
    ranked_top_10 = []
    for rank, (player, score) in enumerate(with_ranks, 1):
        ranked_top_10.append({
            "rank": rank,
            "player": player,
            "score": int(score)
        })

    return {
        "total_players": total,
        "top_10": ranked_top_10
    }

# ─── Demo ───
if __name__ == "__main__":
    print("=== Benchmark ===")
    benchmark_pipeline(100)

    print("\n=== Batch User Fetch ===")
    # Setup
    for uid in [1, 2, 3]:
        r.hset(f"user:{uid}", mapping={
            "name": f"User{uid}",
            "email": f"user{uid}@x.com",
            "age": 20 + uid
        })

    users = batch_user_fetch([1, 2, 3])
    for u in users:
        print(f"  User: {u}")

    print("\n=== Leaderboard Snapshot ===")
    r.delete("leaderboard")
    r.zadd("leaderboard", {
        "alice": 9500, "bob": 8700, "charlie": 7200,
        "david": 6500, "eve": 5800
    })
    snapshot = leaderboard_snapshot()
    print(f"Total: {snapshot['total_players']}")
    for p in snapshot['top_10']:
        print(f"  #{p['rank']} {p['player']}: {p['score']}")
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Redis Pipelines
💡 KEY INSIGHT: Pipeline = batch commands giảm RTT. 1 RTT cho N commands. KHÔNG atomic. Dùng MULTI/EXEC nếu cần atomic.
⚠️ PITFALLS:
  - Pipeline không atomic
  - Response quá lớn → memory spike
  - Phải execute()
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./014-modules.md)
