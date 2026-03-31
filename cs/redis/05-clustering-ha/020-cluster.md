# 020 — Cluster

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🔴 Hard |
| **Chủ đề** | Redis Cluster, Sharding, Hash slots, Horizontal scaling |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Cluster là gì?

**Redis Cluster = Horizontal sharding + Replication. Data được chia thành 16384 hash slots, mỗi node chịu trách nhiệm một phần.**

```
┌──────────────────────────────────────────────────────────────┐
│                   REDIS CLUSTER                                        │
│                                                               │
│  16384 Hash Slots = 0 → 16383                                   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Slot 0-5460     │ Slot 5461-10922  │ Slot 10923-16383 │   │
│  │   Master A      │    Master B       │   Master C        │   │
│  │  ┌────────┐     │   ┌────────┐     │  ┌────────┐       │   │
│  │  │ Slot A │     │   │ Slot B │     │  │ Slot C │       │   │
│  │  └────────┘     │   └────────┘     │  └────────┘       │   │
│  │       ↑         │        ↑         │       ↑            │   │
│  │    ┌────┐       │    ┌────┐       │    ┌────┐         │   │
│  │    │Repl│       │    │Repl│       │    │Repl│         │   │
│  │    │ A1 │       │    │ B1 │       │    │ C1 │         │   │
│  │    └────┘       │    └────┘       │    └────┘         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  Key "user:100" → hash("user:100") % 16384 = slot           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 2. Hash Slots

```
┌──────────────────────────────────────────────────────────────┐
│                 HASH SLOTS                                        │
│                                                               │
│  Key: "user:100"                                             │
│                                                               │
│  CRC16(key) % 16384 = slot                                   │
│  CRC16("user:100") = 15230                                   │
│  15230 % 16384 = 15230                                        │
│  → Key này thuộc slot 15230 → Master C                        │
│                                                               │
│  3 Masters (M1, M2, M3):                                    │
│  M1: slots 0-5460                                           │
│  M2: slots 5461-10922                                       │
│  M3: slots 10923-16383                                      │
│                                                               │
│  Key → hash → slot → node                                    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 3. Cluster vs Sentinel

```
┌─────────────────────────────────────────────────────────────┐
│              CLUSTER vs SENTINEL                                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Sentinel:                                                    │
│  ├── HA cho single master                                  │
│  ├── Auto-failover khi master die                         │
│  ├── Read replicas                                       │
│  ├── ❌ Không scale horizontally                          │
│  └── ❌ Single point of data (no sharding)               │
│                                                               │
│  Cluster:                                                     │
│  ├── Horizontal scaling (nhiều masters)                    │
│  ├── Data sharded (16384 slots)                           │
│  ├── Replication (mỗi master có replicas)                │
│  ├── Auto-failover                                       │
│  └── ✅ Scale reads AND writes                             │
│                                                               │
│  → < 100GB data → Sentinel                                 │
│  → > 100GB data → Cluster                                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 🔍 4. Client Routing

```
┌──────────────────────────────────────────────────────────────┐
│                 CLIENT ROUTING                                         │
│                                                               │
│  Client muốn GET "user:100"                                 │
│                                                               │
│  Option 1: Smart Client                                      │
│  ├── Client biết slot → node mapping                       │
│  ├── Hash slot table cached locally                         │
│  ├── Direct connect to correct node                        │
│  └── ✅ Fast, efficient                                    │
│                                                               │
│  Option 2: Proxy (Redis Cluster Proxy / Twemproxy)         │
│  ├── Client connect to proxy                              │
│  ├── Proxy routing to correct node                        │
│  └── ❌ Extra hop, extra latency                          │
│                                                               │
│  Option 3: Redis Cluster 3.0+                              │
│  ├── MOVED redirect: "Ask slot X to node Y"              │
│  ├── Client caches mapping, reconnects                     │
│  └── ✅ Most Redis clients support                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧠 Phân tích & Hướng tư tư

### ⚠️ Cluster Limitations

```
⚠️ Cluster limitations:
  - Mỗi operation phải thực hiện trên 1 node
  - MULTI/EXEC không cross slots (transactions)
  - Keys không support across multiple slots
  - Không support PUB/SUB across slots
  - Scan operations có thể scan toàn cluster
```

### 🔑 Key Insight

> **Cluster = sharding + replication. 16384 slots chia cho N masters. Smart client tự route đến đúng node.**

---

## ✅ Ví dụ

```python
import redis

def connect_to_cluster():
    """Kết nối Redis Cluster"""
    # Redis Cluster client
    cluster = redis.RedisCluster(
        host='localhost',
        port=7000,
        skip_full_coverage_check=True,
        read_from_replicas=True
    )

    # Operations tự động routed đúng node
    cluster.set('user:100', 'Alice')
    result = cluster.get('user:100')
    return result

def scan_cluster():
    """Scan toàn cluster"""
    cluster = redis.RedisCluster(host='localhost', port=7000)

    # Scan tất cả keys
    for key in cluster.scan_iter(match='user:*'):
        print(f"Key: {key}")
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Redis Cluster
💡 KEY INSIGHT: Cluster = sharding + replication. 16384 slots. Smart client tự route.
⚠️ PITFALLS:
  - Operations không cross slots
  - MULTI/EXEC bị hạn chế
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./021-redlock.md)
