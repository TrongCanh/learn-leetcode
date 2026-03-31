# 025 — Optimization

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🔴 Hard |
| **Chủ đề** | Slow log, Benchmarking, Optimization strategies |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Slow Log

```bash
SLOWLOG GET 10          # Lấy 10 slow commands
SLOWLOG LEN             # Số entries trong log
SLOWLOG RESET           # Reset log

# redis.conf
slowlog-log-slower-than 10000   # 10ms
slowlog-max-len 128            # Giữ 128 entries
```

### 🔍 2. Benchmarking

```bash
redis-benchmark -h localhost -p 6379 -c 50 -n 100000 -q

# Specific commands
redis-benchmark -h localhost GET -n 100000
redis-benchmark -h localhost INCR -n 100000 -c 100
```

### 🔍 3. Optimization Checklist

```
┌─────────────────────────────────────────────────────────────┐
│  OPTIMIZATION CHECKLIST                                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. NETWORK                                                 │
│     ✅ Dùng pipelining                                      │
│     ✅ Dùng connection pooling                             │
│     ✅ Dùng Redis Cluster cho scale                        │
│     ✅ Dùng appropriate client library                  │
│                                                               │
│  2. COMMANDS                                                 │
│     ✅ Tránh KEYS (dùng SCAN)                              │
│     ✅ Tránh SORT trên large sets                         │
│     ✅ Dùng Lua scripts cho complex operations          │
│     ✅ Dùng MULTI/EXEC cho batch                       │
│                                                               │
│  3. DATA STRUCTURES                                           │
│     ✅ Chọn right data structure                       │
│     ✅ Dùng Hash thay vì String cho objects          │
│     ✅ Dùng bitfield cho counters                       │
│                                                               │
│  4. MEMORY                                                   │
│     ✅ Set maxmemory + eviction policy                │
│     ✅ Compress large strings                          │
│     ✅ Monitor memory fragmentation                    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 🔍 4. Monitoring

```bash
INFO stats
INFO commandstats
CLIENT LIST
CLIENT KILL ip:port
```

---

## 🧠 Phân tích & Hướng tư tư

### ⚠️ Common Pitfalls

| Pitfall | Explanation |
|---------|-----------|
| **Dùng KEYS trong production** | KEYS scans ALL keys = O(N) = BLOCKING |
| **SORT trên large sorted sets** | SORT = O(N log N) |
| **Dùng Redis thay vì local cache** | Redis cũng có latency |

### 🔑 Key Insight

> **Monitor before optimize. Use SLOWLOG to find bottlenecks. Pipelining = best ROI optimization.**

---

## ✅ Ví dụ

```python
def check_slowlog():
    """Check slow commands"""
    slow = r.slowlog_get(10)
    for entry in slow:
        print(f"Command: {entry['args']}, Duration: {entry['duration_us']}µs")

def benchmark_operations():
    """Benchmark key operations"""
    import time

    n = 10000

    # Without pipeline
    start = time.time()
    for _ in range(n):
        r.incr("bench")
    pipe_time = time.time() - start

    # With pipeline
    start = time.time()
    pipe = r.pipeline()
    for _ in range(n):
        pipe.incr("bench")
    pipe.execute()
    non_pipe_time = time.time() - start

    print(f"Without pipeline: {non_pipe_time:.3f}s")
    print(f"With pipeline: {pipe_time:.3f}s")
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Redis Optimization
💡 KEY INSIGHT: Monitor before optimize. Slowlog. Pipelining.
✅ Đã hiểu: [ ]
```

---

**🎉 HOÀN THÀNH CHƯƠNG 6 — PERFORMANCE!**
