# 001 — Strings

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | GET, SET, INCR, EX, NX, Strings, Cache |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Redis String là gì?

**Redis String = binary-safe value có thể chứa BẤT KỲ data nào** — không chỉ text!

```
Redis String ≠ String trong ngôn ngữ lập trình
Redis String = Byte array có thể:
  → Lưu text: "Hello World"
  → Lưu JSON: '{"name":"Alice","age":30}'
  → Lưu số: "42" hoặc binary counter
  → Lưu image nhỏ (base64)
  → Lưu HTML content
  → Lưu serialized session

→ Maximum size: 512 MB
→ Phổ biến nhất: dùng làm CACHE
```

### 🔍 2. Các lệnh cơ bản

```bash
# ─── SET / GET ───
SET user:100:name "Alice"              # Gán giá trị
GET user:100:name                      # → "Alice"

SET user:100:age 30                    # Gán số
GET user:100:age                       # → "30"

# ─── MSET / MGET ─── (Multiple)
MSET user:100:name "Alice" \
        user:100:email "alice@example.com" \
        user:100:city "Hanoi"
MGET user:100:name user:100:email user:100:city
# → ["Alice", "alice@example.com", "Hanoi"]

# ─── SETNX ─── (SET if Not eXists)
SETNX lock:order:123 "locked"         # Chỉ set nếu CHƯA tồn tại
# → 1 (đặt thành công)
SETNX lock:order:123 "locked"         # Đã tồn tại
# → 0 (không làm gì)
```

### 🔍 3. TTL — Time To Live

**TTL là điểm mạnh nhất của Redis làm cache.**

```bash
# ─── Expire ───
SET session:abc123 "user_data" EX 3600
# Tự động xóa sau 3600 giây (1 giờ)

# ─── EXPIRE ─── (set TTL sau khi đã SET)
SET page:home "html_content..."
EXPIRE page:home 300          # Xóa sau 5 phút

# ─── TTL ─── (xem còn bao lâu)
TTL page:home                  # → 294 (giây còn lại)
TTL nonexistent                # → -2 (key không tồn tại)
TTL session:abc123             # → 3500 (còn 3500s)

# Key tồn tại nhưng không có TTL → TTL = -1

# ─── PERSIST ─── (xóa TTL, key sống mãi mãi)
PERSIST session:abc123         # Xóa expire → sống mãi

# ─── SETEX / SETNXEX ───
SETEX cache:page 300 "html"   # = SET + EXPIRE trong 1 lệnh
SETNXEX rate:ip:1.2.3.4 60 "1" # = SETNX + EXPIRE trong 1 lệnh
```

### 🔍 4. Counters — INCR / DECR

```bash
# ─── INCR / DECR ───
SET counter:page_views 0
INCR counter:page_views        # → 1
INCR counter:page_views        # → 2
INCR counter:page_views        # → 3
DECR counter:page_views        # → 2

# ─── INCRBY / DECRBY ───
INCRBY counter:page_views 10   # → 12
DECRBY counter:page_views 5    # → 7

# ─── INCRBYFLOAT ───
INCRBYFLOAT product:1:price 0.99  # → 999.99

# ─── COUNTRIES ───
# INCR là ATOMIC! Thread-safe, không race condition
INCR rate:limit:api:12345    # Nhiều clients cùng increment
```

### 🔍 5. String operations nâng cao

```bash
# ─── APPEND ───
SET name "Alice"
APPEND name " Smith"           # → 10 (độ dài mới)
GET name                       # → "Alice Smith"

# ─── STRLEN ───
STRLEN name                     # → 10

# ─── GETRANGE / SETRANGE ───
SET msg "Hello World"
GETRANGE msg 0 4               # → "Hello" (substring)
GETRANGE msg -5 -1             # → "World" (5 ký tự cuối)
SETRANGE msg 6 "Redis"        # → "Hello Redis"

# ─── GETSET ─── (get old value + set new value atomically)
SET count 5
GETSET count 0                 # → "5" (giá trị cũ)
GET count                      # → "0" (giá trị mới)

# ─── SETEX (set + expire) ───
SETEX token:abc 86400 "user_session_data"
# = SET + EXPIRE trong 1 lệnh → atomic
```

### 🔍 6. Use cases thực tế

```
┌─────────────────────────────────────────────────────────────┐
│               STRING USE CASES                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. CACHE                                                   │
│     SET page:home "{html...}" EX 300                       │
│     GET page:home                                         │
│                                                             │
│  2. COUNTERS                                                │
│     INCR analytics:pageviews:2024-03-31                   │
│     INCR rate:limit:api:user123                           │
│                                                             │
│  3. SESSION STORE                                           │
│     SET session:abc123 "{userId:1, role:'admin'}" EX 3600│
│                                                             │
│  4. DISTRIBUTED LOCK                                        │
│     SETNX lock:order:12345 "machine_1"                   │
│                                                             │
│  5. RATE LIMITING                                           │
│     INCR rate:ip:1.2.3.4                                   │
│     EXPIRE rate:ip:1.2.3.4 60                              │
│                                                             │
│  6. SIMPLE CONFIG/VARIABLES                                 │
│     SET config:feature:darkmode "true"                     │
│     GET config:feature:darkmode                           │
│                                                             │
│  7. SHORT URL / TOKEN                                       │
│     SET shortcode:abc123 "https://..."                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 String vs Hash — Khi nào dùng?

```
String (JSON):
  SET user:1 "{name:'Alice',email:'alice@x.com',city:'Hanoi'}"
  GET user:1 → toàn bộ JSON
  → 1 attribute thay đổi → GET → parse → modify → SET lại

  ✅ Khi: đọc/ghi toàn bộ object
  ✅ Khi: object nhỏ (< 1KB)
  ✅ Khi: không cần truy vấn field riêng lẻ

Hash:
  HSET user:1 name "Alice" email "alice@x.com" city "Hanoi"
  HGET user:1 name → "Alice" (chỉ 1 field)
  HSET user:1 city "HCM" → chỉ update 1 field

  ✅ Khi: thường xuyên update từng field
  ✅ Khi: cần HGET/HSET riêng lẻ
  ✅ Khi: object lớn (> few KB)
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Dùng String cho object lớn** | GET trả về cả object → bandwidth waste nếu chỉ cần 1 field |
| **Quên EX cho cache** | Cache không bao giờ expire → memory leak |
| **SET rồi EX riêng** | Không atomic → có khoảng trống giữa SET và EX |
| **Dùng GETSET cho counters** | GETSET trả về giá trị CŨ. Nếu race → counters không chính xác. Dùng INCRBY + GET thay thế |
| **Integer lưu dưới dạng string không phải number** | INCR chỉ hoạt động trên string-encoded numbers |

### 🔑 Key Insight

> **String = Redis's "everything bucket". Dùng cho cache, counters, sessions, locks, tokens. Luôn SET + EX cùng lúc (SETEX) để atomic. Dùng Hash thay String khi cần update từng field.**

---

## ✅ Ví dụ Python

```python
import redis
import json

r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def cache_page(page_id, html_content, ttl=300):
    """Cache HTML page với TTL"""
    key = f"page:{page_id}"
    r.setex(key, ttl, html_content)
    print(f"✅ Cached {page_id} for {ttl}s")

def get_cached_page(page_id):
    """Get page từ cache, return None nếu miss"""
    key = f"page:{page_id}"
    html = r.get(key)
    if html:
        print(f"🎯 Cache HIT for {page_id}")
    else:
        print(f"❌ Cache MISS for {page_id}")
    return html

def page_view_counter(page_id):
    """Đếm lượt xem page (atomic counter)"""
    key = f"stats:pageviews:{page_id}"
    views = r.incr(key)
    # Set TTL 24h nếu key mới tạo
    r.expire(key, 86400)
    return views

def rate_limiter(ip, limit=100, window=60):
    """
    Simple rate limiter:
    - limit = 100 requests
    - window = 60 giây
    - Trả về True nếu allowed, False nếu blocked
    """
    key = f"rate:{ip}"
    current = r.incr(key)
    if current == 1:
        # Key mới → set TTL
        r.expire(key, window)

    remaining = max(0, limit - current)
    allowed = current <= limit

    print(f"{'✅' if allowed else '🚫'} {ip}: {current}/{limit} ({remaining} remaining)")
    return allowed

# Demo
cache_page("home", "<html>...</html>", ttl=60)
print(get_cached_page("home"))
print(f"Views: {page_view_counter('home')}")
print(f"Rate limit: {rate_limiter('192.168.1.1')}")
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Redis Strings
💡 KEY INSIGHT: String = binary-safe blob. SETEX = atomic SET + EXPIRE. INCR = atomic counter.
⚠️ PITFALLS:
  - Dùng String cho object lớn → dùng Hash
  - SET + EX riêng → race condition → dùng SETEX
  - Integer dưới dạng string không phải number
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./002-lists.md)
