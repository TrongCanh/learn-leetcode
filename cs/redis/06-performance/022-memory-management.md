# 022 — Memory Management

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Memory, maxmemory, Memory optimization, Memory fragmentation |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Redis Memory là gì?

**Redis lưu toàn bộ dataset trong RAM. Memory là resource quan trọng nhất.**

```
┌──────────────────────────────────────────────────────────────┐
│                    REDIS MEMORY                                        │
│                                                               │
│  Memory breakdown:                                             │
│  ├── Data (keys, values)                                     │
│  ├── Overhead (dict entries, encoding headers)                │
│  ├── Lua scripts                                             │
│  ├── Client buffers (inputs, outputs)                        │
│  ├── AOF/RDB buffers                                        │
│  └── Fragmentation                                          │
│                                                               │
│  Monitoring:                                                 │
│  INFO memory                                                 │
│  MEMORY STATS                                                │
│  MEMORY USAGE key                                            │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 2. maxmemory

```conf
# redis.conf
maxmemory 2gb

# maxmemory policies
maxmemory-policy allkeys-lru
```

### 🔍 3. Memory Optimization

```
Tips:
- Dùng appropriate data structures (small → int, large → string)
- Compression cho large strings
- Dùng Hash thay vì individual keys cho small objects
- Dùng Redis 7 bitfield tối ưu hơn String
```

### 🔍 4. Memory Commands

```bash
MEMORY DOCTOR           # Diagnose memory issues
MEMORY STATS            # Memory usage stats
MEMORY USAGE key        # Memory của 1 key
MEMORY MALLOC-STATS    # Allocator stats
```

---

## 🧠 Phân tích & Hướng tư tư

### ⚠️ Common Pitfalls

| Pitfall | Explanation |
|---------|-----------|
| **maxmemory = 0** | Unlimited → OOM crash |
| **Memory fragmentation** | `> 1.5 ratio` → ACTIVE DEFRAGMENTATION |

### 🔑 Key Insight

> **Redis = in-memory database. maxmemory + eviction policy = prevent OOM. Memory fragmentation = waste. Monitor luôn.**

---

## ✅ Ví dụ

```python
def get_memory_stats():
    info = r.info('memory')
    return {
        'used_memory': info.get('used_memory'),
        'used_memory_peak': info.get('used_memory_peak'),
        'maxmemory': info.get('maxmemory'),
        'mem_fragmentation_ratio': info.get('mem_fragmentation_ratio'),
    }

def memory_report():
    stats = get_memory_stats()
    print(f"Used: {stats['used_memory'] / (1024**3):.2f} GB")
    print(f"Peak: {stats['used_memory_peak'] / (1024**3):.2f} GB")
    print(f"Fragmentation: {stats['mem_fragmentation_ratio']}")
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Memory Management
💡 KEY INSIGHT: maxmemory + eviction = prevent OOM. Fragmentation = waste.
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./023-eviction-policies.md)
