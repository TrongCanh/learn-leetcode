# Chương 6 — Performance

> Memory management, eviction policies, I/O threading, optimization.

---

## 4 bài trong chương này

| # | Bài | Độ khó | Giải quyết |
|---|-----|--------|------------|
| 022 | [Memory Management](./022-memory-management.md) | 🟡 Medium | maxmemory, memory fragmentation, memory optimization |
| 023 | [Eviction Policies](./023-eviction-policies.md) | 🟡 Medium | LRU, LFU, TTL, noeviction, volatile |
| 024 | [I/O Threads](./024-io-threads.md) | 🟡 Medium | Multi-threaded I/O (Redis 6+), threading model |
| 025 | [Optimization](./025-optimization.md) | 🔴 Hard | Benchmarking, slow log, memory optimization |

## 🔑 Khái niệm chung

### 🔍 1. Redis Performance Model

```
Redis single-threaded (trước v6):
  ✅ Atomic operations (no locks)
  ✅ Simple, predictable
  ✅ ~100k-200k ops/s (CPU-bound)

Redis multi-threaded I/O (v6+):
  ✅ Background threads xử lý I/O
  ✅ Main thread xử lý commands
  ✅ ~1M+ ops/s

→ Command execution = single-threaded
→ I/O = multi-threaded
→ Không thay đổi execution model
```

### 🔍 2. Performance Bottlenecks

```
Thường gặp:
1. Memory exhausted → OOM → eviction hoặc crash
2. Slow commands → BLOCKING (KEYS, SMEMBERS, SORT)
3. Network saturation → CPU %system cao
4. Persistence overload → bgrewriteaof, bgsave
5. Large objects → serialization overhead
```

---

## → Bắt đầu với [022 — Memory Management](./022-memory-management.md)
