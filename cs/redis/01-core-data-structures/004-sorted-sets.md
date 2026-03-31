# 004 — Sorted Sets

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | ZADD, ZRANGE, ZRANK, Leaderboard, Rate Limiting, Sorted Sets |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Redis Sorted Set là gì?

**Sorted Set (ZSET) = Set + Score (số) để sort.** Mỗi member có một score, Redis tự động sort theo score.

```
Redis Sorted Set:

┌──────────────────────────────────────────────────────┐
│  Sorted Set "leaderboard:game1"                      │
│                                                       │
│  Score    │    Member                                │
│  ────────┼─────────────────────────────────────     │
│  9500    │    player:alice                          │
│  8700    │    player:bob                            │
│  7200    │    player:charlie                        │
│  6500    │    player:david                          │
│  5800    │    player:eve                            │
│                                                       │
│  • O(1) thêm/update member                         │
│  • O(log N) thêm member (vì phải re-sort)          │
│  • O(log N) lấy rank (vị trí)                     │
│  • O(1) lấy score của member                       │
└──────────────────────────────────────────────────────┘
```

### 🔍 2. Basic Operations

```bash
# ─── ZADD / ZREM ───
ZADD leaderboard:game1 9500 "alice"     # → 1 (thêm mới)
ZADD leaderboard:game1 8700 "bob"       # → 1
ZADD leaderboard:game1 7200 "charlie"   # → 1
ZADD leaderboard:game1 9500 "alice"     # → 0 (update score)

# Score có thể là số âm hoặc float
ZADD prices 999.99 "laptop"
ZADD prices -100 "discount"

# ZREM
ZREM leaderboard:game1 "charlie"        # → 1 (xóa)
ZREM leaderboard:game1 "charlie"        # → 0 (không tồn tại)

# ─── ZSCORE ─── (lấy score)
ZSCORE leaderboard:game1 "alice"        # → "9500"
ZSCORE leaderboard:game1 "unknown"      # → nil

# ─── ZRANK / ZREVRANK ───
ZRANK leaderboard:game1 "alice"          # → 0 (index từ 0, thấp nhất)
ZRANK leaderboard:game1 "charlie"       # → nil (đã xóa)

ZREVRANK leaderboard:game1 "alice"     # → 0 (từ cao xuống)
ZREVRANK leaderboard:game1 "bob"        # → 1 (hạng 2)

# ─── ZCARD ───
ZCARD leaderboard:game1                   # → 3 (số members)
```

### 🔍 3. Range Queries

```bash
# ─── ZRANGE / ZREVRANGE ───
ZRANGE leaderboard:game1 0 -1           # Lấy TẤT CẢ (thấp → cao)
# → ["charlie","bob","alice"]

ZREVRANGE leaderboard:game1 0 -1         # Từ CAO → THẤP
# → ["alice","bob","charlie"]

# Với WITHSCORES
ZREVRANGE leaderboard:game1 0 4 WITHSCORES
# → ["alice","9500","bob","8700","charlie","7200"]

# Top 3
ZREVRANGE leaderboard:game1 0 2 WITHSCORES
# → ["alice","9500","bob","8700","charlie","7200"]

# ─── ZRANGEBYSCORE ─── (lọc theo score range)
ZRANGEBYSCORE leaderboard:game1 8000 +inf
# → ["alice","bob"] (score >= 8000)

ZRANGEBYSCORE leaderboard:game1 -inf 7000
# → ["charlie"] (score <= 7000)

ZRANGEBYSCORE leaderboard:game1 7000 9000
# → ["charlie","bob"] (7000 <= score <= 9000)

# Với LIMIT
ZRANGEBYSCORE leaderboard:game1 -inf +inf WITHSCORES LIMIT 0 3
# → Top 3 (từ thấp lên cao)
```

### 🔍 4. Leaderboard — Use case kinh điển

```bash
# ─── Game Leaderboard ───
ZADD leaderboard:game1 100 "player:1"
ZADD leaderboard:game1 250 "player:2"
ZADD leaderboard:game1 180 "player:3"
ZADD leaderboard:game1 300 "player:4"
ZADD leaderboard:game1 150 "player:5"

# Top 3:
ZREVRANGE leaderboard:game1 0 2 WITHSCORES
# → ["player:4","300","player:2","250","player:3","180"]

# Rank của player:3:
ZREVRANK leaderboard:game1 "player:3"    # → 2 (hạng 3 từ cao xuống)

# Update score (khi player kiếm thêm điểm):
ZINCRBY leaderboard:game1 50 "player:3"   # → 230 (tăng 50)
ZREVRANK leaderboard:game1 "player:3"    # → 1 (hạng 2)

# Score của player:3:
ZSCORE leaderboard:game1 "player:3"       # → "230"
```

### 🔍 5. Rate Limiting với Sorted Set

```bash
# ─── Sliding Window Rate Limiter ───
# Cho phép 5 requests mỗi 60 giây

# User 1.2.3.4 gửi request lúc timestamp 1000000
ZADD rate:1.2.3.4 1000000 "req1"
ZADD rate:1.2.3.4 1000010 "req2"
ZADD rate:1.2.3.4 1000020 "req3"
ZADD rate:1.2.3.4 1000030 "req4"
ZADD rate:1.2.3.4 1000040 "req5"

# Kiểm tra: timestamp hiện tại = 1000050
# Giữ requests trong window 60s: từ 999990 đến 1000050
ZREMRANGEBYSCORE rate:1.2.3.4 -inf 999990
# → Xóa requests cũ hơn 60s

# Đếm requests trong window
ZCARD rate:1.2.3.4
# → 5 (đã đạt limit)

# Nếu >= 5 → BLOCK
# Sau khi xử lý xong → thêm request mới
ZADD rate:1.2.3.4 1000050 "req6"

# Set TTL để cleanup tự động
EXPIRE rate:1.2.3.4 60
```

### 🔍 6. Priority Queue

```bash
# ─── Priority Task Queue ───
ZADD tasks:high 1 "task:urgent:1"       # Score = priority (1 = cao nhất)
ZADD tasks:high 2 "task:urgent:2"
ZADD tasks:low 10 "task:normal:1"      # Score = 10 (thấp priority)
ZADD tasks:low 10 "task:normal:2"

# Lấy task cao priority nhất
ZRANGE tasks:high 0 0                  # → ["task:urgent:1"]

# Khi queue high empty → lấy từ low
ZUNIONSTORE tasks:all 2 tasks:high tasks:low AGGREGATE MIN
# → Gộp cả 2, dùng MIN score (priority thấp nhất)
ZRANGE tasks:all 0 0                   # → ["task:urgent:1"]
```

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 Sorted Set vs List — Khi nào dùng?

```
Sorted Set:
  ✅ O(log N) thêm, O(1) lấy score
  ✅ O(log N) lấy rank
  ✅ O(log N) range queries (ZRANGEBYSCORE)
  ✅ Score-based operations (ZINCRBY)
  ✅ Không duplicate members (member = unique)
  ❌ O(N) với N = số phần tử thêm/lấy

List:
  ✅ O(1) thêm ở đầu/cuối
  ✅ O(N) lấy range
  ❌ Không có score/rank
  ✅ Duplicate members được
```

### 🤔 ZSET Implementation — Skip List + Hash Table

```
Redis dùng 2 data structures bên trong ZSET:

1. Hash Table (dict):
   member → score
   "alice" → 9500

2. Skip List (zset):
   Score → [member1, member2, ...]
   9500 → ["alice"]
   8700 → ["bob"]

→ ZADD: cập nhật cả 2 structures → O(log N)
→ ZSCORE: hash lookup → O(1)
→ ZRANK: skip list traversal → O(log N)
→ ZRANGE: skip list range query → O(log N + M)
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **ZADD với cùng score** | Members cùng score được sort theo member name (lexicographical). Đủ predictably nhưng không đảm bảo order |
| **Dùng ZRANGE cho large results** | ZRANGE 0 -1 → O(N) với N = số phần tử. Dùng ZSCAN hoặc pagination |
| **ZINCRBY cho non-existent key** | Tự động tạo sorted set nếu chưa có |
| **Dùng timestamp làm score mà không cleanup** | Sorted set grow vô hạn → memory leak. Dùng ZREMRANGEBYSCORE + EXPIRE |
| **Dùng ZSET cho 1 triệu items mà chỉ cần top 100** | ZADD O(log N) → 1 triệu items → 20 steps. Vẫn OK nhưng có thể cần chunking |

### 🔑 Key Insight

> **Sorted Set = Set + Score = O(log N) insert/rank + O(1) score lookup. Perfect cho leaderboards, rate limiting, priority queues. Dùng ZRANGEBYSCORE cho range queries.**

---

## ✅ Ví dụ Python

```python
import redis
import time

r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# ─── Game Leaderboard ───
def update_score(leaderboard_key, player_id, points):
    """Cập nhật điểm player (ZINCRBY)"""
    new_score = r.zincrby(leaderboard_key, points, player_id)
    rank = r.zrevrank(leaderboard_key, player_id)
    print(f"✅ {player_id}: +{points} pts → {new_score} (Rank #{rank + 1})")
    return new_score

def get_top_n(leaderboard_key, n=10):
    """Lấy top N players"""
    results = r.zrevrange(leaderboard_key, 0, n - 1, withscores=True)
    print(f"\n🏆 TOP {n} LEADERBOARD:")
    for rank, (player, score) in enumerate(results, 1):
        print(f"  #{rank} {player}: {int(score)} pts")
    return results

def get_player_rank(leaderboard_key, player_id):
    """Lấy rank của player"""
    rank = r.zrevrank(leaderboard_key, player_id)
    score = r.zscore(leaderboard_key, player_id)
    if rank is not None:
        print(f"{player_id}: Rank #{rank + 1}, Score: {int(score)}")
    else:
        print(f"{player_id}: Not on leaderboard")
    return rank, score

# ─── Sliding Window Rate Limiter ───
def sliding_window_rate_limit(identifier, max_requests=5, window_seconds=60):
    """
    Rate limiter dùng sorted set
    Cho phép max_requests trong window_seconds
    """
    key = f"rate:{identifier}"
    now = time.time()
    window_start = now - window_seconds

    # 1. Remove requests cũ hơn window
    r.zremrangebyscore(key, '-inf', window_start)

    # 2. Đếm requests trong window
    current_count = r.zcard(key)

    if current_count >= max_requests:
        # Rate limited!
        oldest = r.zrange(key, 0, 0, withscores=True)
        reset_in = int(oldest[0][1] + window_seconds - now) if oldest else window_seconds
        print(f"🚫 Rate limited! {current_count}/{max_requests}. Reset in {reset_in}s")
        return False, current_count, reset_in

    # 3. Thêm request mới
    request_id = f"{now}:{current_count}"
    r.zadd(key, {request_id: now})

    # 4. Set TTL = window + 1 để cleanup
    r.expire(key, window_seconds + 1)

    remaining = max_requests - current_count - 1
    print(f"✅ Allowed. {remaining} remaining in window")
    return True, current_count + 1, window_seconds

# ─── Recent Activity Feed (Sorted by Time) ───
def add_activity(user_id, activity_id, ttl=86400):
    """Thêm activity với timestamp làm score"""
    key = f"feed:{user_id}"
    r.zadd(key, {activity_id: time.time()})
    # Giữ chỉ 100 activities gần nhất
    r.zremrangebyrank(key, 0, -101)  # Xóa từ index 0 đến -101
    r.expire(key, ttl)

def get_recent_activities(user_id, count=10):
    """Lấy activities gần nhất"""
    key = f"feed:{user_id}"
    activities = r.zrevrange(key, 0, count - 1)
    return activities

# ─── Demo ───
leaderboard = "leaderboard:game1"

# Setup players
r.delete(leaderboard)
r.zadd(leaderboard, {"alice": 9500, "bob": 8700, "charlie": 7200, "david": 6500, "eve": 5800})

get_top_n(leaderboard, 5)
get_player_rank(leaderboard, "charlie")

# Update scores
update_score(leaderboard, "charlie", 300)  # Charlie chơi thêm
update_score(leaderboard, "bob", 1000)     # Bob chơi thêm

get_top_n(leaderboard, 3)
get_player_rank(leaderboard, "bob")

# Rate limiter demo
for i in range(7):
    allowed, count, reset = sliding_window_rate_limit("192.168.1.1", max_requests=5, window_seconds=60)
    if not allowed:
        break

# Activity feed demo
r.delete("feed:user100")
for i in range(5):
    add_activity("user100", f"post:{i+1}")
print(f"\n📋 Recent activities: {get_recent_activities('user100', 3)}")
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Redis Sorted Sets
💡 KEY INSIGHT: ZSET = Set + Score. O(log N) insert/rank. O(1) score lookup. Perfect cho leaderboards, rate limiting.
⚠️ PITFALLS:
  - ZRANGE 0 -1 = O(N) → dùng pagination
  - Cùng score = sort theo name (lexicographical)
  - Cleanup sorted set khi dùng timestamp làm score
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./005-hashes.md)
