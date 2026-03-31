# 019 — Sentinel

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Sentinel, Automatic Failover, HA, Monitoring |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Sentinel là gì?

**Redis Sentinel = Hệ thống monitoring + automatic failover cho Redis master-slave.**

```
┌──────────────────────────────────────────────────────────────┐
│                    REDIS SENTINEL                                    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Sentinel Cluster (3 nodes)                      │    │
│  │  [Sentinel 1]  [Sentinel 2]  [Sentinel 3]           │    │
│  │      │              │              │                    │    │
│  │      └──────────────┼──────────────┘                    │    │
│  │                     │                                   │    │
│  └─────────────────────┼───────────────────────────────────┘    │
│                        │                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Master  │──│ Slave 1  │──│ Slave 2  │──│ Clients  │    │
│  │  Redis   │  │  Redis   │  │  Redis   │  │          │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                               │
│  Sentinel tasks:                                             │
│  ├── Monitor: Master alive? Slaves connected?               │
│  ├── Notify: Alert khi something wrong                    │
│  ├── Failover: Auto-promote slave → master                 │
│  └── Provider: Client discover current master              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 2. Automatic Failover

```
Tình huống: Master Redis crash

Before:
  Sentinel 1 ─────► Master (Redis) ───► Slave 1, Slave 2

After Master dies:
  Sentinel 1 ──┐
  Sentinel 2 ──┼──► [Sentinel vote] ──► Slave 1 promoted to Master
  Sentinel 3 ──┘

After Failover:
  Sentinel 1 ──────────► New Master (was Slave 1)
  Sentinel 2 ──────────► New Master
  Sentinel 3 ──────────► New Master

  Slave 2 auto-reconfigures to follow new master
  Clients auto-discover new master via Sentinel
```

### 🔍 3. Sentinel Configuration

```conf
# sentinel.conf
port 26379

# Monitor master named "mymaster"
sentinel monitor mymaster 127.0.0.1 6379 2

# Master password (nếu có)
sentinel auth-pass mymaster yourpassword

# Failover timeout
sentinel down-after-milliseconds mymaster 30000

# Parallel syncs during failover
sentinel parallel-syncs mymaster 1

# Failover timeout
sentinel failover-timeout mymaster 180000
```

### 🔍 4. Client Connection

```python
import redis
from redis.sentinel import Sentinel

# ─── Sentinel Client ───
sentinel = Sentinel([
    ('localhost', 26379),
    ('localhost', 26380),
    ('localhost', 26381),
], socket_timeout=0.1)

# Lấy master
master = sentinel.master_for('mymaster')

# Lấy slave (random)
slave = sentinel.slave_for('mymaster')

# ─── Operations ───
master.set('key', 'value')     # Write → master
slave.get('key')              # Read → slave
```

---

## 🧠 Phân tích & Hướng tư tư

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Ít hơn 3 Sentinels** | Cần quorum (n/2+1). 1 Sentinel = 1, có thể false positive |
| **Sentinel cùng máy với Redis** | Máy crash = cả 2 die |
| **Quên firewall** | Sentinel cổng 26379, Redis cổng 6379 |

### 🔑 Key Insight

> **Sentinel = monitoring + auto-failover + service discovery. 3 Sentinels minimum. Quorum = số Sentinels vote cho failover.**

---

## ✅ Ví dụ

```python
from redis.sentinel import Sentinel

def connect_via_sentinel():
    sentinel = Sentinel([
        ('localhost', 26379),
        ('localhost', 26380),
    ])

    # Master for writes
    master = sentinel.master_for('mymaster')
    master.set('app:state', 'running')

    # Slave for reads
    slave = sentinel.slave_for('mymaster')
    state = slave.get('app:state')

    return state
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Redis Sentinel
💡 KEY INSIGHT: Sentinel = HA monitoring + auto-failover. Quorum = vote count.
⚠️ PITFALLS:
  - < 3 Sentinels → unreliable
  - Sentinel cùng máy với Redis
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./020-cluster.md)
