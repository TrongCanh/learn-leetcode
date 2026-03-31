# Chương 7 — Use Cases

> Các use case thực tế: Cache, Rate Limiting, Session Store, Leaderboard, Message Queue, Vector Search, Redis Stack.

---

## 7 bài trong chương này

| # | Bài | Độ khó | Giải quyết |
|---|-----|--------|------------|
| 026 | [Caching](./026-caching.md) | 🟡 Medium | Cache-aside, read-through, write-through |
| 027 | [Rate Limiting](./027-rate-limiting.md) | 🟡 Medium | Sliding window, fixed window, token bucket |
| 028 | [Session Store](./028-session-store.md) | 🟢 Easy | Web sessions, JWT storage |
| 029 | [Leaderboard](./029-leaderboard.md) | 🟡 Medium | Sorted set gaming leaderboard |
| 030 | [Message Queue](./030-message-queue.md) | 🟡 Medium | Job queues, task distribution |
| 031 | [Vector Search](./031-vector-search.md) | 🔴 Hard | AI embeddings, similarity search |
| 032 | [Redis Stack](./032-redis-stack.md) | 🟡 Medium | RediSearch, RedisJSON, RedisBloom |

## 🔑 Khái niệm chung

### 🔍 1. Redis = Nhiều thứ trong một

```
┌─────────────────────────────────────────────────────────────┐
│                    Redis Use Cases Matrix                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DATABASE        │  CACHE          │  MESSAGE BROKER      │
│  ───────────     │  ─────          │  ─────────────      │
│  Persistent      │  TTL-based      │  Pub/Sub            │
│  Durable         │  Eviction       │  Streams            │
│  ACID-ish        │  Hot data       │  Queues             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SESSION STORE  │  RATE LIMITER    │  LEADERBOARD       │
│  ─────────────   │  ─────────────   │  ────────────      │
│  Fast access     │  Sliding window  │  Sorted Sets       │
│  TTL expiry      │  Token bucket     │  ZADD, ZRANK       │
│  Stateless apps  │  Distributed      │  Real-time ranks  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  COUNTERS       │  DISTRIBUTED LOCK │  AI/ML FEATURE STORE│
│  ─────────      │  ─────────────────│  ──────────────────│
│  INCR/DECR     │  Redlock          │  Vector Search     │
│  Atomic ops     │  Mutex            │  Redis Stack       │
│  Real-time      │  Semaphore        │  Embeddings        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## → Bắt đầu với [026 — Caching](./026-caching.md)
