# 017 — Hybrid Storage

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | RDB + AOF, Best practices, Redis config |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Hybrid = Best of Both Worlds

```
┌──────────────────────────────────────────────────────────────┐
│                  HYBRID (RDB + AOF)                              │
│                                                               │
│  AOF (latest):                                               │
│  └── Logs tất cả operations kể từ lần RDB save cuối       │
│                                                               │
│  RDB (base):                                                 │
│  └── Full snapshot → load nhanh                            │
│                                                               │
│  Startup:                                                     │
│  1. Load RDB (base snapshot) → fast                      │
│  2. Replay AOF → apply latest changes                   │
│  → Fast startup + Full durability                           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 2. Recommended Config

```conf
# ─── redis.conf — Production Settings ───

# ─── General ───
daemonize yes
bind 127.0.0.1
port 6379

# ─── Memory ───
maxmemory 2gb
maxmemory-policy allkeys-lru

# ─── RDB ───
save 900 1
save 300 10
save 60 10000

# ─── AOF ───
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-use-rdb-preamble yes  # Redis 7+

# ─── Replication ───
replicaof master.redis.com 6379
replica-read-only yes

# ─── Security ───
requirepass yourStrongPassword
```

### 🔍 3. Disaster Recovery Strategy

```
┌──────────────────────────────────────────────────────────────┐
│               DISASTER RECOVERY PLAN                             │
│                                                               │
│  Daily:                                                       │
│  ├── BGSAVE (RDB snapshot)                                 │
│  ├── Copy dump.rdb to S3/GCS/Azure Blob                   │
│  └── Copy appendonly.aof to backup storage                  │
│                                                               │
│  Weekly:                                                      │
│  ├── Full backup to cold storage                            │
│  └── Test restore on staging server                        │
│                                                               │
│  Monitoring:                                                   │
│  ├── AOF size growth                                      │
│  ├── RDB last save time                                   │
│  ├── Replication lag                                        │
│  └── Memory usage                                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧠 Phân tích & Hướng tư tư

### 🤔 Khi nào dùng Hybrid?

```
Hybrid (RDB + AOF) = Recommended cho production

Khi nào dùng RDB only?
  - Dataset rất lớn (100GB+)
  - Write-heavy workload
  - Can tolerate losing hours of data
  - Backup frequency = daily

Khi nào dùng AOF only?
  - Dataset nhỏ (< 10GB)
  - Can't lose any data
  - Write volume manageable

Khi nào dùng Hybrid?
  - Almost always for production!
  - Fast startup (RDB) + Durability (AOF)
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Chỉ dùng RDB cho critical data** | Có thể mất nhiều data |
| **AOF rewrite tốn disk I/O** | Rewrite nên chạy off-peak |
| **Quên backup testing** | Backup không restore được = thảm họa |

### 🔑 Key Insight

> **Hybrid = Best of both worlds. RDB = fast startup, periodic backups. AOF = durability. Recommended cho production.**

---

## ✅ Ví dụ

```python
import redis
import subprocess
import os

r = redis.Redis(host='localhost', port=6379, db=0)

def get_full_stats():
    """Lấy tất cả persistence stats"""
    info = r.info('persistence')
    memory = r.info('memory')
    stats = r.info('stats')

    return {
        'persistence': {
            'rdb_save_in_progress': info.get('rdb_save_in_progress'),
            'rdb_last_save_time': info.get('rdb_last_save_time'),
            'aof_enabled': info.get('aof_enabled'),
            'aof_rewrite_in_progress': info.get('aof_rewrite_in_progress'),
            'aof_last_rewrite_status': info.get('aof_last_rewrite_status'),
        },
        'memory': {
            'used_memory': memory.get('used_memory'),
            'maxmemory': memory.get('maxmemory'),
            'used_memory_peak': memory.get('used_memory_peak'),
        },
        'stats': {
            'total_connections_received': stats.get('total_connections_received'),
            'total_commands_processed': stats.get('total_commands_processed'),
        }
    }

def print_health_report():
    """In health report"""
    stats = get_full_stats()

    print("=" * 50)
    print("REDIS HEALTH REPORT")
    print("=" * 50)

    p = stats['persistence']
    print(f"\n📦 Persistence:")
    print(f"  RDB saving: {p['rdb_save_in_progress']}")
    print(f"  RDB last save: {p['rdb_last_save_time']}")
    print(f"  AOF enabled: {p['aof_enabled']}")
    print(f"  AOF rewrite: {p['aof_rewrite_in_progress']}")

    m = stats['memory']
    used_mb = m['used_memory'] / (1024*1024)
    max_mb = m['maxmemory'] / (1024*1024)
    print(f"\n💾 Memory:")
    print(f"  Used: {used_mb:.2f} MB / {max_mb:.2f} MB")
    print(f"  Usage: {used_mb/max_mb*100:.1f}%")

    print("\n" + "=" * 50)

# ─── Demo ───
if __name__ == "__main__":
    print_health_report()
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Hybrid Storage (RDB + AOF)
💡 KEY INSIGHT: Hybrid = fast startup (RDB) + durability (AOF). Recommended cho production.
⚠️ PITFALLS:
  - Chỉ dùng RDB cho critical data
  - Backup phải test restore
  - Monitor AOF size growth
✅ Đã hiểu: [ ]
```

---

**🎉 HOÀN THÀNH CHƯƠNG 4 — PERSISTENCE!**
