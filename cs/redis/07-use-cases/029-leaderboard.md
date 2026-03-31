# 029 — Leaderboard

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Leaderboard, Sorted Set, Gaming, Rankings |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Leaderboard với Sorted Set

```
┌──────────────────────────────────────────────────────────────┐
│                 LEADERBOARD                                          │
│                                                               │
│  Sorted Set:                                                 │
│  ZADD leaderboard score member                               │
│  ZREVRANK → rank                                           │
│  ZREVRANGE → top N                                          │
│  ZINCRBY → update score                                     │
│                                                               │
│  Use cases:                                                 │
│  ├── Game leaderboards                                       │
│  ├── Social scores                                          │
│  └── Quiz rankings                                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 2. Implementation

```python
def add_score(player, score):
    r.zadd("leaderboard", {player: score})

def get_rank(player):
    rank = r.zrevrank("leaderboard", player)
    return rank + 1 if rank is not None else None

def get_top(n=10):
    return r.zrevrange("leaderboard", 0, n-1, withscores=True)

def update_score(player, delta):
    return r.zincrby("leaderboard", player, delta)
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Leaderboard
💡 KEY INSIGHT: Sorted Set = perfect for leaderboards. O(log N) operations.
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./030-message-queue.md)
