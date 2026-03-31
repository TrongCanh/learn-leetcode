# 006 — Bitmaps & HyperLogLog

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Bitmap, HyperLogLog, SETBIT, GETBIT, PFADD, PFCOUNT, PFUNION |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Bitmap — Bitset

**Bitmap = String được coi như array của bits. Mỗi bit = 0 hoặc 1.**

```
Redis Bitmap = BIT op trên String

"Bit" key: "user:100:logins"
Byte offset: 0  1  2  3  4  5  6  7  8  9  10 ...
Bit value:   1  0  1  0  1  0  0  1  0  1  0 ...
                    ↑
                    Day 2 (0 = không login, 1 = đã login)

→ 1 bit cho mỗi user mỗi ngày = CỰC KỲ tiết kiệm memory
→ 1 triệu users × 365 days = 365 triệu bits = 45 MB
```

### 🔍 2. Bitmap Operations

```bash
# ─── SETBIT / GETBIT ───
# SETBIT key offset value
# offset = vị trí bit (0-indexed)

# Ngày 0 (01/01): user 100 login
SETBIT user:100:logins 0 1          # → 0 (giá trị cũ)

# Ngày 2 (03/01): user 100 login
SETBIT user:100:logins 2 1          # → 0

# Ngày 0: user 100 không login (đã set 1, giờ set 0)
SETBIT user:100:logins 0 0          # → 1

GETBIT user:100:logins 0            # → 0
GETBIT user:100:logins 2            # → 1

# ─── BITCOUNT ───
# Đếm số bits = 1 trong string
BITCOUNT user:100:logins             # → 1 (chỉ có ngày 2)

# Range counting
BITCOUNT user:100:logins 0 10     # Đếm từ ngày 0-10

# ─── BITOP ───
# BITOP AND/OR/XOR/NOT key destkey key1 key2 ...

# User 100 login pattern
SETBIT user:100:logins 0 1
SETBIT user:100:logins 1 1
SETBIT user:100:logins 2 1

# User 101 login pattern
SETBIT user:101:logins 1 1
SETBIT user:101:logins 2 1
SETBIT user:101:logins 3 1

# AND: users login cùng ngày
BITOP AND common_logins user:100:logins user:101:logins
BITCOUNT common_logins                 # → 2 (ngày 1, 2)

# OR: users nào login ngày nào
BITOP OR any_logins user:100:logins user:101:logins
BITCOUNT any_logins                    # → 4

# ─── BITPOS ───
# Tìm vị trí bit đầu tiên = 0 hoặc 1
BITPOS user:100:logins 0              # → 1 (ngày 1 là ngày đầu tiên không login)

# ─── BITFIELD ───
# Đọc/ghi nhiều bits cùng lúc
BITFIELD user:100:logins SET u1 0 1 GET u1 2  # Set bit 0=1, get bit 2
```

### 🔍 3. Bitmap Use Cases

```
┌──────────────────────────────────────────────────────────────┐
│                 BITMAP USE CASES                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. USER ACTIVITY TRACKING                                   │
│     1 triệu users × 365 days = 45 MB (Bitmap)               │
│     vs 365 MB (daily SET keys)                             │
│                                                               │
│  2. DAILY ACTIVE USERS (DAU)                                │
│     SETBIT dau:2024-03-31 <user_id> 1                       │
│     BITCOUNT dau:2024-03-31 → Unique logins hôm đó        │
│                                                               │
│  3. SESSION TRACKING                                         │
│     Bit = user có session active hay không                   │
│     SETBIT sessions:active <user_id> 1 (login) / 0 (logout)│
│                                                               │
│  4. PERMISSION BITMASK                                       │
│     8 bits = 8 permissions (read, write, admin...)         │
│     user:1:perms = 0b00101101 = có read,write,admin       │
│     BITOP AND result user:1:perms admin_permission_mask     │
│                                                               │
│  5. PRIME NUMBER SIEVE                                      │
│     BITOP để tính toán số nguyên tố                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 4. HyperLogLog — Probabilistic Counting

**HyperLogLog = đếm unique items với độ chính xác ~0.81%, dùng cực ít memory.**

```
Traditional counting (SET):
  Thêm 1 triệu unique users
  → SET với 1 triệu items → ~100 MB memory

HyperLogLog:
  Thêm 1 triệu unique users
  → HyperLogLog → CHỈ ~12 KB!
  → Độ chính xác: ±0.81%
  → Kết quả: "1,008,234 unique users"

→ Dùng khi: cần ước lượng unique counts
→ Không cần 100% chính xác
→ Memory cực kỳ tiết kiệm
```

### 🔍 5. HyperLogLog Operations

```bash
# ─── PFADD ─── (Thêm items)
PFADD hll:users:2024-03-31 "user:1"
PFADD hll:users:2024-03-31 "user:2"
PFADD hll:users:2024-03-31 "user:1"  # Duplicate → không làm gì
PFADD hll:users:2024-03-31 "user:3"

# ─── PFCOUNT ─── (Đếm unique)
PFCOUNT hll:users:2024-03-31         # → 3

# ─── PFUNION ─── (Hợp nhiều HyperLogLogs)
PFADD hll:day1 "user:1" "user:2"
PFADD hll:day2 "user:2" "user:3"
PFADD hll:day3 "user:3" "user:4"

PFUNION hll:3days hll:day1 hll:day2 hll:day3
PFCOUNT hll:3days                       # → 4 (user:1,2,3,4)

# ─── PFMERGE ─── (Gộp vào 1 key)
PFMERGE hll:merged hll:day1 hll:day2
PFCOUNT hll:merged                     # → 3
```

### 🔍 6. HyperLogLog Use Cases

```
┌──────────────────────────────────────────────────────────────┐
│           HYPERLOGLOG USE CASES                                │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. UNIQUE VISITORS (DAU/WAU/MAU)                           │
│     PFADD dau:2024-03-31 "visitor_ip"                      │
│     PFCOUNT dau:2024-03-31 → unique visitors               │
│     PFUNION dau:week:1 dau:2024-03-25 dau:2024-03-26 ... │
│                                                               │
│  2. UNIQUE API CALLS                                         │
│     PFADD api:calls:today "user_id:endpoint:timestamp"     │
│     PFCOUNT api:calls:today                                │
│                                                               │
│  3. SEARCH AUTOCOMPLETE UNIQUENESS                         │
│     PFADD search:suggestions "apple"                       │
│     PFCOUNT search:suggestions                             │
│                                                               │
│  4. CARDINALITY ESTIMATION                                  │
│     Đếm unique items với memory cực ít                      │
│     Dùng cho analytics, monitoring                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 Bitmap vs Set — Khi nào dùng?

```
Bitmap (cho activity tracking):
  ✅ 1 bit per item = CỰC KỲ tiết kiệm (1M users × 365 days = 45MB)
  ✅ BITCOUNT = đếm active users
  ✅ BITOP AND/OR = tìm common patterns
  ❌ Chỉ dùng khi offset nhỏ (user_id)
  ❌ Không dùng được khi cần lưu nhiều data mỗi user

Set (cho general unique):
  ✅ Lưu arbitrary strings
  ✅ O(1) membership check
  ✅ SCARD = đếm unique
  ✅ Memory tăng tuyến tính với số items

→ Dùng Bitmap khi: offset = integer (user_id, day_id, position)
→ Dùng Set khi: member = arbitrary string

Ví dụ:
  ✅ Bit: "Người dùng X có online không?" → BIT user:X:online 0 → 1
  ❌ Bit: "User X có tag gì?" → dùng Set (tags là strings)
```

### 🤔 HyperLogLog — Độ chính xác

```
HyperLogLog accuracy: ~0.81%

PFADD hll "item1" → count = 1
PFADD hll "item2" → count = 2
...
PFADD hll "item1,000,000" → count = ~1,008,234

→ Sai số ≈ 0.81% = ±8,000 users trong 1 triệu
→ Có thể chấp nhận cho analytics
→ KHÔNG dùng cho: billing, precise counts

Algorithm details (sau nếu muốn đào sâu):
  - Hash function: MurmurHash → random bits
  - Count leading zeros → estimate cardinality
  - Spare registers: 16384 registers × 6 bits = 12KB
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Dùng Bitmap cho offset lớn** | `SETBIT key 1000000000 1` → Redis tạo string 125MB! |
| **BITCOUNT không có range** | BITCOUNT mặc định đếm TOÀN BỘ string → O(N). Dùng range nếu chỉ cần 1 phần |
| **Dùng HyperLogLog khi cần exact count** | HyperLogLog chỉ accurate ±0.81%. Dùng Set/Hash cho exact |
| **PFCOUNT sau PFUNION trả về 0** | PFUNION tạo temporary key → phải lưu kết quả vào persistent key |
| **Quên rằng Bitmap là String operations** | Bitmap operations (BITOP, BITCOUNT) có thể chậm trên large bitmaps |

### 🔑 Key Insight

> **Bitmap = BIT operations trên String. Cực tiết kiệm khi offset = integer. HyperLogLog = probabilistic unique counting. ~0.81% error nhưng chỉ tốn 12KB. Dùng cho analytics, không cho billing.**

---

## ✅ Ví dụ Python

```python
import redis
import hashlib
import time

r = redis.Redis(host='localhost', port=6379, db=0)

# ─── Daily Active Users với Bitmap ───
def record_user_activity(user_id, date=None):
    """Ghi nhận user active vào ngày"""
    date = date or time.strftime('%Y-%m-%d')
    key = f"bitmap:dau:{date}"
    r.setbit(key, user_id, 1)
    print(f"✅ User {user_id} active on {date}")

def get_dau(date):
    """Đếm unique users hôm đó"""
    key = f"bitmap:dau:{date}"
    count = r.bitcount(key)
    return count

def get_weekly_active(date):
    """Union 7 ngày gần nhất"""
    date_obj = time.strptime(date, '%Y-%m-%d')
    keys = []
    for i in range(7):
        from datetime import datetime, timedelta
        d = (datetime(*date_obj[:3]) - timedelta(days=i)).strftime('%Y-%m-%d')
        keys.append(f"bitmap:dau:{d}")

    result_key = f"bitmap:week:{date}"
    r.bitop('OR', result_key, *keys)
    count = r.bitcount(result_key)
    return count

# ─── User Online Status ───
def set_user_online(user_id):
    key = f"bitmap:online"
    r.setbit(key, user_id, 1)

def set_user_offline(user_id):
    r.setbit(f"bitmap:online", user_id, 0)

def is_user_online(user_id):
    return r.getbit(f"bitmap:online", user_id) == 1

def get_online_count():
    return r.bitcount("bitmap:online")

# ─── Unique Search Terms với HyperLogLog ───
def record_search(search_term, date=None):
    """Thêm search term vào HyperLogLog"""
    date = date or time.strftime('%Y-%m-%d')
    key = f"hll:searches:{date}"
    r.pfadd(key, search_term)
    return r.pfcount(key)

def get_unique_searches(date):
    """Đếm unique search terms"""
    key = f"hll:searches:{date}"
    return r.pfcount(key)

def get_unique_searches_week(end_date):
    """Union 7 ngày"""
    date_obj = time.strptime(end_date, '%Y-%m-%d')
    from datetime import datetime, timedelta
    keys = [
        f"hll:searches:{(datetime(*date_obj[:3]) - timedelta(days=i)).strftime('%Y-%m-%d')}"
        for i in range(7)
    ]
    result_key = f"hll:searches:week:{end_date}"
    r.pfmerge(result_key, *keys)
    return r.pfcount(result_key)

# ─── Permission Bitmask ───
PERMISSION_READ = 1 << 0  # 0b00000001
PERMISSION_WRITE = 1 << 1  # 0b00000010
PERMISSION_DELETE = 1 << 2  # 0b00000100
PERMISSION_ADMIN = 1 << 7  # 0b10000000

def set_user_permissions(user_id, permissions):
    """Set permissions bằng bitmask"""
    r.set(f"permissions:{user_id}", permissions)
    print(f"✅ User {user_id} permissions: {permissions} (binary: {bin(permissions)})")

def has_permission(user_id, permission):
    """Check permission"""
    perms = r.get(f"permissions:{user_id}")
    if perms is None:
        return False
    return (int(perms) & permission) != 0

# ─── Demo ───
print("=== DAU Bitmap ===")
for uid in [1, 2, 3, 5, 8, 13, 21]:
    record_user_activity(uid, "2024-03-31")
print(f"DAU 2024-03-31: {get_dau('2024-03-31')} users")

print("\n=== Online Status ===")
for uid in [1, 2, 3]:
    set_user_online(uid)
set_user_offline(2)
for uid in range(1, 6):
    print(f"User {uid} online: {is_user_online(uid)}")
print(f"Total online: {get_online_count()}")

print("\n=== HyperLogLog ===")
for term in ["apple", "banana", "apple", "cherry", "apple", "date"]:
    count = record_search(term, "2024-03-31")
print(f"Unique searches: {get_unique_searches('2024-03-31')}")

print("\n=== Permission Bitmask ===")
# User có: READ + WRITE + ADMIN
set_user_permissions(100, PERMISSION_READ | PERMISSION_WRITE | PERMISSION_ADMIN)
print(f"Has READ: {has_permission(100, PERMISSION_READ)}")
print(f"Has WRITE: {has_permission(100, PERMISSION_WRITE)}")
print(f"Has DELETE: {has_permission(100, PERMISSION_DELETE)}")
print(f"Has ADMIN: {has_permission(100, PERMISSION_ADMIN)}")
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Bitmaps & HyperLogLog
💡 KEY INSIGHT: Bitmap = BIT ops trên String = cực tiết kiệm cho boolean arrays. HyperLogLog = probabilistic unique count = 12KB cho 1M unique, ±0.81%.
⚠️ PITFALLS:
  - Bitmap offset lớn → tạo string khổng lồ
  - HyperLogLog không dùng cho exact counts
  - BITCOUNT không có range → scan toàn string
✅ Đã hiểu: [ ]
```

---

**🎉 HOÀN THÀNH CHƯƠNG 1 — CORE DATA STRUCTURES!**
