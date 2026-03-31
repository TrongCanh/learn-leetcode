# 023 — Eviction Policies

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | LRU, LFU, TTL, Eviction, maxmemory-policy |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Eviction Policies

**Khi maxmemory đầy, Redis xóa keys theo policy.**

```
┌──────────────────────────────────────────────────────────────┐
│                 EVICTION POLICIES                                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  noeviction:                                                 │
│  └── ❌ Return error khi full → Redis doesn't evict    │
│                                                               │
│  allkeys-lru:                                               │
│  └── ✅ Xóa LRU keys từ ALL keys                        │
│                                                               │
│  volatile-lru:                                              │
│  └── ✅ Xóa LRU keys CHỈ từ keys CÓ TTL              │
│                                                               │
│  allkeys-random:                                             │
│  └── ✅ Random từ ALL keys                                │
│                                                               │
│  volatile-random:                                            │
│  └── ✅ Random từ keys CÓ TTL                             │
│                                                               │
│  volatile-ttl:                                              │
│  └── ✅ Xóa keys có TTL ngắn nhất                       │
│                                                               │
│  allkeys-lfu:                                               │
│  └── ✅ Xóa LFU keys từ ALL keys (Redis 4+)              │
│                                                               │
│  volatile-lfu:                                              │
│  └── ✅ Xóa LFU keys CÓ TTL (Redis 4+)                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 2. LRU vs LFU

```
┌─────────────────────────────────────────────────────────────┐
│              LRU vs LFU                                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  LRU (Least Recently Used):                                   │
│  ├── Xóa keys KHÔNG sử dụng lâu nhất                     │
│  ├── Good cho: temporal access patterns                    │
│  └── ~5 bytes per key overhead                             │
│                                                               │
│  LFU (Least Frequently Used):                               │
│  ├── Xóa keys ít sử dụng NHẤT                         │
│  ├── Good cho: power-law distributions                     │
│  └── ~5 bytes per key + counter overhead                  │
│                                                               │
│  → LRU = "recently used?"                                │
│  → LFU = "frequently used?"                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 🔍 3. Configuration

```conf
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru

# LRU/LFU tuning
maxmemory-samples 5
lfu-log-factor 10
lfu-decay-time 1
```

---

## 🧠 Phân tích & Hướng tư tư

### ⚠️ Common Pitfalls

| Pitfall | Explanation |
|---------|-----------|
| **noeviction + full** | Redis returns OOM error |
| **allkeys-lru khi muốn giữ persistent data** | Giữ data quan trọng bị xóa |
| **volatiles không có TTL** | Không xóa gì cả |

### 🔑 Key Insight

> **Eviction = xóa keys khi maxmemory full. `allkeys-lru` = phổ biến nhất. `volatile-ttl` = cache với TTL.**

---

## ✅ Ví dụ

```python
def get_eviction_stats():
    info = r.info('stats')
    return {
        'evicted_keys': info.get('evicted_keys'),
        'evicted_keys_maxmemory': info.get('evicted_keys'),
    }
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Eviction Policies
💡 KEY INSIGHT: allkeys-lru = phổ biến. volatile-ttl = cache with TTL.
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./024-io-threads.md)
