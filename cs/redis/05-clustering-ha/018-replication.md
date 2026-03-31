# 018 — Replication

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | Master-Slave, Replica, Read replicas, Async replication |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Replication là gì?

**Redis Replication = Master-Slave setup. Master xử lý writes, Slaves nhận data và replicate.**

```
┌──────────────────────────────────────────────────────────────┐
│               MASTER-SLAVE REPLICATION                            │
│                                                               │
│  Master (Primary)                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  INCR counter                                       │    │
│  │  SET user:100 "Alice"                               │    │
│  │  DEL cache:home                                    │    │
│  └─────────────────────────────────────────────────────┘    │
│       │                                                        │
│       │ async replication (psync)                            │
│       │                                                        │
│       ▼                                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Slave 1 (Read Replica)                              │    │
│  │  ← Nhận same operations                             │    │
│  │  ← Gán same data như Master                       │    │
│  └─────────────────────────────────────────────────────┘    │
│       │                                                        │
│       │ async replication                                     │
│       │                                                        │
│       ▼                                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Slave 2 (Read Replica)                              │    │
│  │  ← Nhận same operations                             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  Writes: Chỉ Master xử lý                                     │
│  Reads: Có thể phân tán cho Slaves                           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 2. Setup Replication

```bash
# ─── On Master ───
redis-server --port 6379
# No special config needed for master

# ─── On Slave ───
redis-server --port 6380 --replicaof 127.0.0.1 6379

# Hoặc trong redis.conf của slave:
replicaof 127.0.0.1 6379
replica-read-only yes  # Slave chỉ đọc

# ─── Commands ───
REPLICAOF 127.0.0.1 6379      # Bắt đầu replicate
REPLICAOF NO ONE                # Ngừng replicate, trở thành master

# ─── Check replication status ───
INFO REPLICATION
```

### 🔍 3. Replication Details

```bash
# ─── Async Replication ───
# Master gửi operations cho slaves:
#   - Full sync: replica connects → master sends RDB snapshot
#   - PSYNC (Partial Sync): replica reconnects → master sends only new ops

# PSYNC: tiếp tục từ chỗ dở
# → replicationid:offset (unique per master)
# → Nếu replica's offset vẫn trong master's backlog → partial sync
# → Nếu không → full sync

# ─── Replication Lag ───
# Thường < 1ms trong LAN
# Có thể vài seconds trong WAN
INFO REPLICATION
# → master_repl_offset: offset hiện tại
# → slave0: ip=...,offset=...,state=connected
```

### 🔍 4. Read Replicas Pattern

```python
import redis
import random

class ReadReplicaRouter:
    """Route reads to replicas, writes to master"""

    def __init__(self, master_conf, replica_confs):
        self.master = redis.Redis(**master_conf)
        self.replicas = [redis.Redis(**conf) for conf in replica_confs]

    def get_master(self):
        return self.master

    def get_replica(self):
        """Random replica for load balancing"""
        return random.choice(self.replicas) if self.replicas else self.master

    def read(self, key):
        """Read from replica"""
        return self.get_replica().get(key)

    def write(self, key, value):
        """Write to master"""
        return self.master.set(key, value)

    def incr(self, key):
        """INCR chỉ trên master"""
        return self.master.incr(key)
```

---

## 🧠 Phân tích & Hướng tư tư

### ⚠️ Replication Limitations

```
⚠️ Replication = ASYNC
→ Writes đến slave có thể lag
→ Đọc từ slave có thể nhận outdated data

⚠️ Không có automatic failover
→ Master dies → app phải tự switch sang slave
→ Dùng Sentinel cho HA
```

### 🔑 Key Insight

> **Replication = Master-Slave async. Writes → Master, Reads → Replicas. PSYNC cho partial sync. Read replicas = scale reads. Dùng Sentinel cho HA.**

---

## ✅ Ví dụ

```python
import redis

def check_replication_status():
    """Check replication status"""
    info = r.info('replication')
    return {
        'role': info.get('role'),
        'connected_slaves': info.get('connected_slaves'),
        'master_repl_offset': info.get('master_repl_offset'),
        'repl_backlog_active': info.get('repl_backlog_active'),
        'repl_backlog_size': info.get('repl_backlog_size'),
    }
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Redis Replication
💡 KEY INSIGHT: Master-Slave async. Writes → Master, Reads → Replicas. PSYNC = partial sync.
⚠️ PITFALLS:
  - Replication async → slave lag
  - No auto failover → dùng Sentinel
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./019-sentinel.md)
