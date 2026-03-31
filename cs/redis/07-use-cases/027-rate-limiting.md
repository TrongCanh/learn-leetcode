# 027 — Rate Limiting

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Rate Limiting, Sliding Window, Token Bucket, Fixed Window |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Rate Limiting Strategies

```
┌──────────────────────────────────────────────────────────────┐
│                 RATE LIMITING STRATEGIES                                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Fixed Window:                                                │
│  └── 100 requests / 1 minute                                  │
│  └── Đơn giản nhưng có boundary spikes                     │
│                                                               │
│  Sliding Window:                                              │
│  └── Rolling 60-second window                                 │
│  └── Mượt hơn, phức tạp hơn                              │
│                                                               │
│  Token Bucket:                                                │
│  └── Bucket chứa tokens, refill rate                        │
│  └── Smooth rate limiting                                    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 2. Fixed Window

```python
def fixed_window_rate_limit(user_id, limit=100, window=60):
    """100 requests per minute"""
    key = f"ratelimit:fw:{user_id}"
    now = int(time.time())
    window_start = (now // window) * window

    window_key = f"{key}:{window_start}"

    count = r.incr(window_key)
    if count == 1:
        r.expire(window_key, window)

    allowed = count <= limit
    remaining = max(0, limit - count)
    return allowed, remaining
```

### 🔍 3. Sliding Window

```python
def sliding_window_rate_limit(user_id, limit=100, window=60):
    """Rolling window - đã có ở Chương 1"""
    key = f"ratelimit:sw:{user_id}"
    now = time.time()
    window_start = now - window

    pipe = r.pipeline()
    pipe.zremrangebyscore(key, '-inf', window_start)
    pipe.zcard(key)
    pipe.zadd(key, {str(now): now})
    pipe.expire(key, window)
    results = pipe.execute()

    count = results[1]
    allowed = count < limit
    remaining = max(0, limit - count - 1)
    return allowed, remaining
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Rate Limiting
💡 KEY INSIGHT: Sliding window = smooth. Token bucket = burst + rate.
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./028-session-store.md)
