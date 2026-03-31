# 015 — RDB Snapshots

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | RDB, BGSAVE, SAVE, Snapshot, Persistence, Point-in-time |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Redis Persistence — Tại sao cần?

```
Redis lưu data trong RAM:
  ✅ Cực nhanh (100k-1M ops/s)
  ✅ Microsecond latency
  ❌ Data mất khi restart/power loss

→ RDB/AOF = lưu data xuống disk
→ Khi restart → load data vào RAM
→ Setup:
  - No persistence: Redis = pure cache (không lưu)
  - RDB only: snapshot theo intervals
  - AOF only: log tất cả commands
  - RDB + AOF: hybrid (recommended)
```

### 🔍 2. RDB là gì?

**RDB = Redis Database = Point-in-time snapshot của toàn bộ dataset.**

```
┌──────────────────────────────────────────────────────────────┐
│                    RDB SNAPSHOT                                 │
│                                                               │
│  Tại thời điểm T:                                         │
│                                                               │
│  Memory:                                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  user:1: Alice  │  counter: 100  │  cache: ABC │    │
│  └─────────────────────────────────────────────────────┘    │
│                         │                                       │
│                         ▼ COPY ON WRITE                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │          dump.rdb (disk file)                     │    │
│  │  Binary format, compressed                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                         │                                       │
│                    → File on disk                            │
│                                                               │
│  Khi restart:                                                │
│  Redis đọc dump.rdb → khôi phục data vào RAM             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 3. RDB Operations

```bash
# ─── SAVE ───
SAVE
# Đồng bộ (blocking), tạo dump.rdb ngay lập tức
# ⚠️ BLOCKING: Redis không respond được trong khi save

# ─── BGSAVE ───
BGSAVE
# Bất đồng bộ, chạy trong background process
# Redis vẫn respond được trong khi save
# → Được recommend trong production

# ─── LASTSAVE ───
LASTSAVE
# → 1709301234 (Unix timestamp của lần save cuối)

# ─── BGSAVE Schedule ───
# Trong redis.conf:
save 900 1     # Nếu có 1 key thay đổi trong 15 phút
save 300 10    # Nếu có 10 keys thay đổi trong 5 phút
save 60 10000  # Nếu có 10000 keys thay đổi trong 1 phút

# ─── Redis-cli ───
redis-cli SAVE
redis-cli BGSAVE
redis-cli LASTSAVE
redis-cli SHUTDOWN NOSAVE  # Shutdown không save
redis-cli SHUTDOWN        # Shutdown + save trước
```

### 🔍 4. RDB File Format

```
dump.rdb structure:

┌──────────────────────────────────────────────────────────────┐
│  +------------------+                                       │
│  | REDIS |         │  Magic string "REDIS"               │
│  +------------------+                                       │
│  | version |        │  RDB format version (e.g. 0007)      │
│  +------------------+                                       │
│  | AUX FIELDS       │  Metadata (Redis version, etc.)      │
│  +------------------+                                       │
│  | SELECT DB        │  Database number                     │
│  +------------------+                                       │
│  | KEY-VALUE PAIRS  │  Dumped keys & values               │
│  |  ...             │  (compressed with rdb compression)  │
│  +------------------+                                       │
│  | EOF              │  EOF marker                          │
│  +------------------+                                       │
│  | CHECKSUM         │  CRC64 checksum                       │
│  +------------------+                                       │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 5. Copy-on-Write (COW)

```
┌──────────────────────────────────────────────────────────────┐
│               BGSAVE COPY-ON-WRITE                             │
│                                                               │
│  Redis Process                                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Parent Process (Redis main)                         │    │
│  │  - Handles all client requests                     │    │
│  │  - Writes to data memory                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                         │                                       │
│                         │ fork()                               │
│                         ▼                                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Child Process (BGSAVE)                            │    │
│  │  - Reads data memory                               │    │
│  │  - Writes to dump.rdb                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  💡 COW: Parent process only copies page when modified     │
│  💡 If data doesn't change → no extra memory              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧠 Phân tích & Hướng tư tư

### 🤔 RDB Pros & Cons

```
┌─────────────────────────────────────────────────────────────┐
│                    RDB PROS ✅                               │
├─────────────────────────────────────────────────────────────┤
│ ✅ Compact (compressed binary) → fast backup/restore     │
│ ✅ Good for backups (daily/weekly)                     │
│ ✅ Fast restore (whole dataset in memory quickly)      │
│ ✅ No corruption risk mid-save (atomic file write)     │
│ ✅ Fork có thể dùng COPY-ON-WRITE (efficient)        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    RDB CONS ❌                               │
├─────────────────────────────────────────────────────────────┤
│ ❌ Data loss: có thể mất data giữa 2 snapshots       │
│ ❌ Large datasets: fork() takes time & memory          │
│ ❌ Can't have frequent saves (fork overhead)          │
│ ❌ Point-in-time only: không capture mid-period changes│
└─────────────────────────────────────────────────────────────┘
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Dùng SAVE thay vì BGSAVE** | SAVE blocking → Redis không respond được. Dùng BGSAVE |
| **BGSAVE quá thường xuyên** | fork() tốn CPU & memory. Mỗi lần BGSAVE = full snapshot |
| **Tưởng RDB = continuous backup** | RDB = periodic snapshots. Data có thể mất giữa snapshots |
| **Không monitor disk I/O** | RDB write có thể chậm trên HDD, làm Redis lag |

### 🔑 Key Insight

> **RDB = Point-in-time snapshots. Compact, fast backup/restore. Dùng cho periodic backups. BGSAVE chạy bất đồng bộ, dùng COW để không ảnh hưởng Redis. Data có thể mất giữa 2 snapshots.**

---

## ✅ Ví dụ

```python
import redis
import subprocess
import os
import time

r = redis.Redis(host='localhost', port=6379, db=0)

def get_rdb_path():
    """Lấy đường dẫn dump.rdb"""
    info = r.info('persistence')
    return info.get('rdb_filename')

def trigger_save():
    """Trigger BGSAVE"""
    result = r.bgsave()
    print(f"BGSAVE triggered: {result}")
    return result

def check_save_status():
    """Kiểm tra trạng thái save"""
    info = r.info('persistence')
    return {
        "rdb_bgsave_in_progress": info.get('rdb_bgsave_in_progress'),
        "rdb_last_save_time": info.get('rdb_last_save_time'),
        "rdb_changes_since_last_save": info.get('rdb_changes_since_last_save'),
        "rdb_current_epoch": info.get('rdb_current_epoch'),
    }

def wait_for_save_complete(timeout=60):
    """Đợi BGSAVE hoàn tất"""
    start = time.time()
    while time.time() - start < timeout:
        status = check_save_status()
        if not status['rdb_bgsave_in_progress']:
            elapsed = time.time() - start
            print(f"✅ BGSAVE completed in {elapsed:.1f}s")
            return True
        time.sleep(0.5)
    print("⏰ BGSAVE timeout")
    return False

def get_backup_path(backup_dir="/tmp/redis-backups"):
    """Tạo backup path với timestamp"""
    os.makedirs(backup_dir, exist_ok=True)
    timestamp = time.strftime('%Y%m%d_%H%M%S')
    return os.path.join(backup_dir, f"dump_{timestamp}.rdb")

def create_backup():
    """Tạo backup RDB"""
    rdb_path = get_rdb_path()
    backup_path = get_backup_path()

    # Trigger BGSAVE
    trigger_save()

    # Đợi hoàn tất
    if wait_for_save_complete():
        # Copy file
        import shutil
        shutil.copy2(rdb_path, backup_path)
        size = os.path.getsize(backup_path) / (1024 * 1024)
        print(f"✅ Backup created: {backup_path} ({size:.2f} MB)")
        return backup_path
    return None

def restore_from_backup(backup_path):
    """Restore từ backup"""
    print(f"⚠️  Stop Redis, replace dump.rdb, restart Redis")
    print(f"    Backup: {backup_path}")

# ─── Demo ───
if __name__ == "__main__":
    print("=== RDB Snapshot ===")

    # Check status
    status = check_save_status()
    print(f"Save status: {status}")

    # Trigger save
    trigger_save()

    # Wait
    wait_for_save_complete()

    # Create backup
    backup_path = create_backup()

    if backup_path:
        print(f"\n📦 Backup available at: {backup_path}")
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: RDB Snapshots
💡 KEY INSIGHT: RDB = point-in-time snapshots, compact, periodic. BGSAVE = async. Data có thể mất giữa 2 saves.
⚠️ PITFALLS:
  - SAVE blocking → dùng BGSAVE
  - RDB không phải continuous backup
  - fork() tốn resource khi dataset lớn
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./016-aof.md)
