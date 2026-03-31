# 021 — Redlock

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🔴 Hard |
| **Chủ đề** | Redlock, Distributed Lock, Mutual Exclusion |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Distributed Lock là gì?

**Distributed Lock = Mutex trên nhiều máy chủ. Đảm bảo chỉ 1 process truy cập tài nguyên tại 1 thời điểm.**

```
┌──────────────────────────────────────────────────────────────┐
│                    DISTRIBUTED LOCK                                    │
│                                                               │
│  Problem: 2 processes muốn access cùng tài nguyên          │
│                                                               │
│  Server 1:   "I'm accessing file.pdf"                      │
│  Server 2:   "I'm accessing file.pdf" ──► CONFLICT!     │
│                                                               │
│  Solution: Lock manager (Redis)                              │
│                                                               │
│  Server 1: SET lock:file:pdf unique_value NX EX 30          │
│              → OK, got lock                                 │
│  Server 2: SET lock:file:pdf unique_value NX EX 30          │
│              → FAIL, lock taken                             │
│                                                               │
│  Server 1: DEL lock:file:pdf                                │
│              → Lock released                                │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 2. Redlock Algorithm

**Redlock = Distributed lock trên nhiều Redis instances để đảm bảo correctness.**

```
┌──────────────────────────────────────────────────────────────┐
│                    REDLOCK ALGORITHM                                   │
│                                                               │
│  1. Get current time in milliseconds                         │
│  2. Try to acquire lock on N Redis instances                  │
│     SET lock_key unique_value NX PX milliseconds             │
│     sequentially                                            │
│  3. Calculate elapsed time                                   │
│  4. If lock acquired on >= N/2+1 instances                  │
│     AND elapsed < lock_timeout                               │
│     → Lock acquired!                                       │
│  5. Otherwise, release lock on all instances                 │
│                                                               │
│  N = 5 (odd number of instances)                           │
│  Majority = 3 (N/2 + 1)                                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 3. Lua Lock Script

```lua
-- Safe Distributed Lock
-- KEYS[1] = lock key
-- ARGV[1] = lock value (unique)
-- ARGV[2] = TTL in milliseconds

if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
    return 1
else
    return 0
end
```

---

## 🧠 Phân tích & Hướng tư tư

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **DEL không atomic** | Client A check → DEL → B check → B SET = race. Dùng Lua script |
| **Lock không auto-expire** | Process crash → lock never released → deadlock |
| **Quên release lock** | Luôn release trong finally block |

### 🔑 Key Insight

> **Redlock = distributed lock trên nhiều Redis instances. Safety > Liveness. Luôn có TTL.**

---

## ✅ Ví dụ

```python
import redis
import time
import uuid

class DistributedLock:
    def __init__(self, redis_clients):
        self.clients = redis_clients
        self.lock_value = str(uuid.uuid4())

    def acquire(self, lock_name, ttl_ms=10000):
        acquired = 0
        for client in self.clients:
            try:
                if client.set(
                    f"lock:{lock_name}",
                    self.lock_value,
                    nx=True,
                    px=ttl_ms
                ):
                    acquired += 1
            except Exception:
                pass
        return acquired >= len(self.clients) // 2 + 1

    def release(self, lock_name):
        for client in self.clients:
            try:
                if client.get(f"lock:{lock_name}") == self.lock_value:
                    client.delete(f"lock:{lock_name}")
            except Exception:
                pass
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Redlock
💡 KEY INSIGHT: Redlock = distributed lock trên nhiều Redis. Safety > Liveness.
⚠️ PITFALLS:
  - DEL không atomic → dùng Lua
  - Lock phải có TTL
✅ Đã hiểu: [ ]
```

---

**🎉 HOÀN THÀNH CHƯƠNG 5 — CLUSTERING & HA!**
