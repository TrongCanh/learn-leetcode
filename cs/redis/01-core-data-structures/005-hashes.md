# 005 — Hashes

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | HSET, HGET, HINCRBY, HMSET, Hashes, Objects |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Redis Hash là gì?

**Redis Hash = Map/Dictionary của field-value pairs.** Giống như JSON object hoặc HashMap trong Java.

```
Redis Hash:

Key: "user:100"           → Hash
┌────────────────────────┐
│  field     │   value   │
├────────────┼───────────┤
│  name      │  "Alice"  │
│  email     │  "alice@x"│
│  age       │  30       │
│  city      │  "Hanoi"  │
└────────────┴───────────┘

→ HSET cập nhật TỪNG field riêng lẻ
→ Không cần GET → parse JSON → modify → SET lại
```

### 🔍 2. Basic Operations

```bash
# ─── HSET / HGET ───
HSET user:100 name "Alice"            # → 1 (set 1 field)
HSET user:100 email "alice@x.com"    # → 1
HSET user:100 age 30                 # → 1

HGET user:100 name                   # → "Alice"
HGET user:100 age                    # → "30"
HGET user:100 nonexistent            # → nil

# ─── HMSET / HMGET ─── (Multiple)
HMSET user:101 name "Bob" email "bob@x.com" age 25 city "HCM"
# ⚠️ HMSET deprecated (vẫn hoạt động, nên dùng HSET)

HMGET user:101 name email city        # → ["Bob","bob@x.com","HCM"]

# ─── HGETALL ───
HGETALL user:100
# → ["name","Alice","email","alice@x.com","age","30","city","Hanoi"]
# ⚠️ O(N) với N = số fields. Dùng HMGET nếu chỉ cần vài fields

# ─── HSETNX ─── (set if field not exists)
HSETNX user:100 name "Alice"          # → 0 (đã tồn tại)
HSETNX user:100 nickname "ali"       # → 1 (thêm mới)

# ─── HDEL ───
HDEL user:100 city                   # → 1 (xóa field)
HDEL user:100 city nonexistent       # → 0

# ─── HEXISTS ───
HEXISTS user:100 name                 # → 1
HEXISTS user:100 city                # → 0 (đã xóa)

# ─── HLEN ───
HLEN user:100                        # → 4 (số fields)
```

### 🔍 3. Counter Operations

```bash
# ─── HINCRBY / HINCRBYFLOAT ───
HSET stats:page:home views 0
HINCRBY stats:page:home views 1     # → 1
HINCRBY stats:page:home views 5     # → 6
HINCRBY stats:page:home views -2    # → 4

HINCRBYFLOAT stats:page:home revenue 9.99
# → 9.99
```

### 🔍 4. Field Operations

```bash
# ─── HKEYS / HVALS ───
HKEYS user:100                        # → ["name","email","age"]
HVALS user:100                        # → ["Alice","alice@x.com","30"]

# ─── HSCAN ─── (iterating large hashes)
HSCAN user:100 0 MATCH name COUNT 100
# → Iterator qua hash mà không block
```

### 🔍 5. Use Cases

```
┌──────────────────────────────────────────────────────────────┐
│                   HASH USE CASES                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. USER PROFILES                                            │
│     HSET user:100 name "Alice" email "alice@x.com"          │
│     HGET user:100 name                                       │
│     HINCRBY user:100 age 1  (birthday!)                     │
│                                                               │
│  2. CONFIGURATION / METADATA                                 │
│     HSET app:config port 8080 host "localhost" debug true   │
│     HGETALL app:config                                       │
│                                                               │
│  3. PAGE / API METRICS                                       │
│     HINCRBY page:/api/users views 1                          │
│     HINCRBY page:/api/users errors 0                         │
│     HGETALL page:/api/users                                  │
│                                                               │
│  4. SHOPPING CART                                            │
│     HSET cart:100:session item:1 "Laptop" qty 1 price 999  │
│     HINCRBY cart:100:session qty:1 1  (tăng số lượng)       │
│     HDEL cart:100:session item:1     (xóa item)              │
│                                                               │
│  5. CACHE với HASH (field-level TTL)                        │
│     HSET cache:page:1 html "<html>..." expires 1710000000 │
│     → TTL được implement ở application layer                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 Hash vs String (JSON) — So sánh chi tiết

```
String (JSON):
  SET user:100 '{"name":"Alice","email":"alice@x.com","age":30}'

  # Lấy toàn bộ
  GET user:100
  # → '{"name":"Alice","email":"alice@x.com","age":30}'

  # Update 1 field
  GET user:100 → parse → update age → SET user:100 → serialize
  # → RTT: 1 get + 1 set + JSON parse/serialize

Hash:
  HSET user:100 name "Alice" email "alice@x.com" age 30

  # Lấy 1 field
  HGET user:100 age
  # → "30" (O(1))

  # Update 1 field
  HSET user:100 age 31
  # → RTT: 1 command + 1 write

┌──────────────────┬──────────────────┬──────────────────────┐
│                  │ String (JSON)     │ Hash                   │
├──────────────────┼──────────────────┼──────────────────────┤
│ Read 1 field     │ GET + parse      │ HGET → O(1)           │
│ Update 1 field   │ GET+SET+parse    │ HSET → O(1)           │
│ Read all         │ GET → O(1)       │ HGETALL → O(N)       │
│ Memory           │ Compact          │ Overhead (hash table) │
│ Nested data      │ ✅ Native        │ ❌ Flat only          │
│ Index/filter     │ ❌ Need Lua     │ ❌ Need scan          │
│ Small objects    │ ✅ Smaller      │ ❌ More overhead       │
│ Large objects    │ ❌ Full read   │ ✅ Partial read       │
└──────────────────┴──────────────────┴──────────────────────┘
```

### 🤔 Hash Internal — Zipmap vs Hashtable

```
Redis tự động chọn encoding tốt nhất:

Small Hash (< 512 bytes, < 50 fields):
  → ZIPMAP: compact, O(1) với small N
  → Memory-efficient cho small objects

Large Hash:
  → HASHTABLE: O(1) average cho mọi operations
  → Memory grows linearly với N

→ Benchmark để quyết định:
  Small user profiles → Hash
  Large aggregated data → consider other structures
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Dùng HGETALL cho hash lớn** | HGETALL trả về TẤT CẢ fields → O(N). Dùng HMGET để chỉ lấy cần thiết |
| **Hash không support nested data** | `HSET user:100 "address.city" "Hanoi"` → field name chứa dấu chấm, không phải nested. Dùng JSON string hoặc RedisJSON module |
| **Dùng Hash khi String hiệu quả hơn** | Object nhỏ (< few KB), đọc/ghi toàn bộ → String (JSON) compact hơn |
| **HINCRBY trên non-existent field** | Tự động tạo field với giá trị 0 trước khi increment |
| **Quên rằng tất cả Hash values là strings** | HINCRBY trả về integer nhưng HGET trả về string |

### 🔑 Key Insight

> **Hash = Field-value map. O(1) per field operation. Tốt khi cần đọc/update từng field riêng lẻ. Dùng String (JSON) khi đọc/ghi toàn bộ object. Không support nested structures.**

---

## ✅ Ví dụ Python

```python
import redis

r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# ─── User Profile ───
def create_user_profile(user_id, name, email, **kwargs):
    """Tạo user profile"""
    key = f"user:{user_id}"
    data = {
        "name": name,
        "email": email,
        **kwargs
    }
    r.hset(key, mapping=data)
    print(f"✅ Created user {user_id}: {data}")

def get_user_field(user_id, field):
    """Lấy 1 field"""
    return r.hget(f"user:{user_id}", field)

def get_user_profile(user_id):
    """Lấy toàn bộ profile"""
    profile = r.hgetall(f"user:{user_id}")
    return profile

def update_user_field(user_id, field, value):
    """Update 1 field"""
    r.hset(f"user:{user_id}", field, value)
    print(f"✅ Updated user:{user_id}.{field} = {value}")

def increment_user_stat(user_id, stat_name, delta=1):
    """Increment a counter field"""
    new_value = r.hincrby(f"user:{user_id}", stat_name, delta)
    print(f"✅ user:{user_id}.{stat_name} = {new_value}")
    return new_value

# ─── Page Metrics ───
def track_page_view(page_path):
    """Track page views và errors"""
    key = f"metrics:page:{page_path}"
    r.hincrby(key, "views", 1)
    # Set timestamp của page
    r.hsetnx(key, "first_viewed", r.hget(key, "first_viewed") or "unknown")
    return r.hgetall(key)

def track_api_call(endpoint, success=True):
    """Track API calls với success/error"""
    key = f"metrics:api:{endpoint}"
    r.hincrby(key, "total", 1)
    if success:
        r.hincrby(key, "success", 1)
    else:
        r.hincrby(key, "errors", 1)

def get_api_stats(endpoint):
    """Lấy stats của API endpoint"""
    key = f"metrics:api:{endpoint}"
    stats = r.hgetall(key)
    if stats:
        total = int(stats.get("total", 0))
        success = int(stats.get("success", 0))
        errors = int(stats.get("errors", 0))
        error_rate = (errors / total * 100) if total > 0 else 0
        print(f"\n📊 {endpoint}:")
        print(f"  Total:   {total}")
        print(f"  Success: {success}")
        print(f"  Errors:  {errors}")
        print(f"  Error Rate: {error_rate:.1f}%")
    return stats

# ─── Shopping Cart ───
def add_to_cart(session_id, item_id, name, quantity, price):
    """Thêm item vào cart"""
    cart_key = f"cart:{session_id}"
    r.hsetnx(cart_key, f"name:{item_id}", name)
    r.hsetnx(cart_key, f"price:{item_id}", price)
    r.hincrby(cart_key, f"qty:{item_id}", quantity)
    print(f"✅ Added {name} x{quantity} to cart {session_id}")

def update_cart_quantity(session_id, item_id, quantity):
    """Cập nhật số lượng"""
    cart_key = f"cart:{session_id}"
    r.hset(cart_key, f"qty:{item_id}", quantity)
    print(f"✅ Updated item {item_id} qty = {quantity}")

def remove_from_cart(session_id, item_id):
    """Xóa item khỏi cart"""
    cart_key = f"cart:{session_id}"
    r.hdel(cart_key, f"name:{item_id}", f"price:{item_id}", f"qty:{item_id}")
    print(f"✅ Removed item {item_id} from cart")

def get_cart(session_id):
    """Lấy cart"""
    cart_key = f"cart:{session_id}"
    cart = r.hgetall(cart_key)

    items = {}
    for field, value in cart.items():
        if field.startswith("name:"):
            item_id = field.split(":")[1]
            qty = int(cart.get(f"qty:{item_id}", 0))
            price = float(cart.get(f"price:{item_id}", 0))
            items[item_id] = {"name": value, "qty": qty, "price": price}

    return items

# ─── Demo ───
print("=== User Profile ===")
create_user_profile(100, "Alice", "alice@x.com", age=30, city="Hanoi")
print(f"Name: {get_user_field(100, 'name')}")
print(f"Profile: {get_user_profile(100)}")
increment_user_stat(100, "login_count")
increment_user_stat(100, "posts_published")
print(f"Profile: {get_user_profile(100)}")

print("\n=== API Metrics ===")
for _ in range(100):
    track_api_call("/api/users", success=True)
for _ in range(10):
    track_api_call("/api/users", success=False)
for _ in range(50):
    track_api_call("/api/posts", success=True)
get_api_stats("/api/users")

print("\n=== Shopping Cart ===")
add_to_cart("session:abc", "item:1", "Laptop", 1, 999.99)
add_to_cart("session:abc", "item:2", "Mouse", 2, 29.99)
cart = get_cart("session:abc")
total = sum(item["qty"] * item["price"] for item in cart.values())
print(f"\n🛒 Cart total: ${total:.2f}")
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Redis Hashes
💡 KEY INSIGHT: Hash = field-value map. O(1) per field. Tốt cho objects với fields được update riêng lẻ. Không nested.
⚠️ PITFALLS:
  - HGETALL O(N) → dùng HMGET cho vài fields
  - Hash không nested → dùng JSON string
  - Hash tốt hơn String khi object lớn và cần partial access
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./006-bitmaps-hyperloglog.md)
