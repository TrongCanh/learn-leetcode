# 009 — JSON

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | RedisJSON, JSON.SET, JSON.GET, JSONPath, Document storage |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. RedisJSON là gì?

**RedisJSON (Redis Stack) = Module cho phép lưu, query, update JSON documents trực tiếp trong Redis.**

```
Redis String:
  SET user:100 '{"name":"Alice","address":{"city":"Hanoi"}}'
  GET user:100 → toàn bộ JSON

RedisJSON:
  JSON.SET user:100 $ '{"name":"Alice","address":{"city":"Hanoi"}}'
  JSON.GET user:100 $.name → "Alice"
  JSON.GET user:100 $.address.city → "Hanoi"
  JSON.NUMINCRBY user:100 $.age 1 → age tăng 1
```

### 🔍 2. Basic Operations (RedisJSON Module)

```bash
# ─── JSON.SET ───
# JSON.SET key path value
JSON.SET user:100 $ '{"name":"Alice","age":30}'
JSON.SET user:100 $.name '"Alice"'    # String phải có quotes
JSON.SET user:100 $.age '30'

# ─── JSON.GET ───
JSON.GET user:100 $                     # → [{"name":"Alice","age":30}]
JSON.GET user:100 $.name                # → ["Alice"]
JSON.GET user:100 $.age                  # → [30]
JSON.GET user:100 $.address.city         # → ["Hanoi"] (null nếu không có)

# ─── JSON.DEL ───
JSON.DEL user:100 $.address             # Xóa field
JSON.DEL user:100                       # Xóa cả document

# ─── JSON.MGET ───
JSON.SET doc:1 $ '{"id":1}'
JSON.SET doc:2 $ '{"id":2}'
JSON.MGET doc:1 doc:2 $.id              # → ["1", "2"]
```

### 🔍 3. JSONPath

```
RedisJSON dùng JSONPath (RFC 6901):

Path syntax:
  $              → root
  .field         → child field
  [index]        → array element
  ..field        → recursive descent
  [first,last]   → array slice
  .field[0]      → nested

Examples:
  $.name                    → name field
  $.address.city            → nested field
  $.tags[0]                 → first array element
  $..price                  → price ở bất kỳ depth nào
  $.items[0:3]             → first 3 items
  $.items[?(@.price>10)]   → filter (JSONPath filter)
```

### 🔍 4. Update Operations

```bash
# ─── JSON.NUMINCRBY ───
JSON.SET product:1 $ '{"price":99.99,"stock":10}'
JSON.NUMINCRBY product:1 $.price 0.01     # → 100.00
JSON.NUMINCRBY product:1 $.stock -2        # → 8

# ─── JSON.STRAPPEND ───
JSON.SET doc:1 $ '{"name":"Alice"}'
JSON.STRAPPEND doc:1 $.name '" Smith"'     # → "Alice Smith" (name mới)

# ─── JSON.ARRAPPEND ───
JSON.SET doc:1 $ '{"tags":["redis","cache"]}'
JSON.ARRAPPEND doc:1 $.tags '"nosql"'      # → ["redis","cache","nosql"]

# ─── JSON.ARRINSERT ───
JSON.ARRINSERT doc:1 $.tags 0 '"database"'  # Insert ở index 0

# ─── JSON.ARRLEN ───
JSON.ARRLEN doc:1 $.tags                    # → 3

# ─── JSON.OBJLEN ───
JSON.OBJLEN doc:1 $                         # → 1 (số keys)

# ─── JSON.TYPE ───
JSON.TYPE doc:1 $.name                      # → string
JSON.TYPE doc:1 $.age                      # → number
JSON.TYPE doc:1 $.tags                     # → array
JSON.TYPE doc:1 $.address                  # → object
JSON.TYPE doc:1 $.active                   # → null (không tồn tại)
```

### 🔍 5. Arrays & Filtering

```bash
# ─── Array Operations ───
JSON.SET doc:1 $ '{"items":[{"id":1,"price":10},{"id":2,"price":20},{"id":3,"price":15}]}'

JSON.ARRAPPEND doc:1 $.items '{"id":4,"price":25}'

JSON.ARRINDEX doc:1 $.items.price 20       # Tìm index có price=20 → 1

JSON.ARRTRIM doc:1 $.items 0 1           # Giữ index 0-1

# ─── Array Indexing ───
JSON.GET doc:1 $.items[0]                # → [{"id":1,"price":10}]
JSON.GET doc:1 $.items[0].price           # → [10]

# ─── JSONPath với Filter ───
# Dùng JSONPath filter: [?(@.field op value)]
# Cần client hỗ trợ hoặc dùng JSON.GET → filter ở app

# Hoặc dùng Redis query với RediSearch:
# FT.SEARCH idx:products '@price:[10 20]'
```

### 🔍 6. Search với RediSearch

```
┌──────────────────────────────────────────────────────────────┐
│      RedisJSON + RediSearch = Document Database              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  JSON.SET product:1 $ '{"name":"Laptop","price":999}'       │
│  JSON.SET product:2 $ '{"name":"Mouse","price":29}'         │
│                                                               │
│  FT.CREATE idx:products PREFIX 1 "product:" SCHEMA           │
│    name TEXT SORTABLE                                       │
│    price NUMERIC SORTABLE                                  │
│                                                               │
│  FT.SEARCH idx:products "laptop"                             │
│  FT.SEARCH idx:products "@price:[100 500]"                  │
│  FT.SEARCH idx:products "@price:[0 +inf] SORTBY price ASC" │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧠 Phân tích & Hướng tư tư

### 🤔 RedisJSON vs String (JSON) vs Hash

```
String (JSON):
  SET user:100 '{"name":"Alice","age":30}'
  GET user:100 → parse → update age → SET lại
  → Cần full read/write

Hash:
  HSET user:100 name "Alice" age 30
  HINCRBY user:100 age 1
  → Flat, không nested

RedisJSON:
  JSON.SET user:100 $.age 31
  JSON.GET user:100 $.address.city
  → Partial update, nested, path-based
  → Như MongoDB nhưng nhanh hơn nhiều

→ Nested data, partial updates → RedisJSON
→ Flat data, simple → Hash
→ Non-RedisJSON env → String (JSON)
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Dùng JSON.SET mà không có RedisJSON** | RedisJSON là module riêng, không có trong Redis vanilla |
| **JSON string trong JSON.SET** | String phải được escape: `'""Alice""'` → `"Alice"` |
| **Array index out of bounds** | RedisJSON return null, không error |
| **Query large array không filter** | JSON.GET doc $..items → return cả array. Dùng JSONPath filter |

### 🔑 Key Insight

> **RedisJSON = JSON documents trong Redis với partial updates. JSONPath cho queries. RedisJSON + RediSearch = full document database (như MongoDB nhưng nhanh hơn). Cần Redis Stack module.**

---

## ✅ Ví dụ Python

```python
import redis
import json

# Cần Redis Stack với RedisJSON module
r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def setup_redis_json():
    """Kiểm tra RedisJSON có available không"""
    try:
        r.execute_command("JSON.SET", "test", "$", '"test"')
        r.execute_command("JSON.DEL", "test")
        print("✅ RedisJSON is available")
        return True
    except redis.ResponseError:
        print("❌ RedisJSON not available. Install Redis Stack.")
        return False

def json_set(key, path, value):
    """JSON.SET với JSON encoding tự động"""
    if isinstance(value, (dict, list)):
        value = json.dumps(value)
    r.execute_command("JSON.SET", key, path, value)

def json_get(key, path="$"):
    """JSON.GET với JSON decoding tự động"""
    result = r.execute_command("JSON.GET", key, path)
    if result:
        return json.loads(result[0]) if result[0] else None
    return None

def json_get_all(key):
    """Lấy toàn bộ document"""
    return json_get(key, "$")

def update_nested_field(key, field_path, value):
    """Partial update một field"""
    if isinstance(value, str):
        value = f'"{value}"'  # JSON string format
    elif isinstance(value, (dict, list)):
        value = json.dumps(value)
    r.execute_command("JSON.SET", key, f"$.{field_path}", value)

# ─── Demo: Product Catalog ───
if setup_redis_json():
    product_key = "product:laptop:001"

    # Create product
    product = {
        "name": "MacBook Pro 14",
        "brand": "Apple",
        "price": 1999.00,
        "specs": {
            "cpu": "M3 Pro",
            "ram": "18GB",
            "storage": "512GB"
        },
        "tags": ["laptop", "apple", "pro"],
        "in_stock": True,
        "stock": 50
    }

    r.execute_command("JSON.SET", product_key, "$", json.dumps(product))
    print(f"✅ Created product: {product['name']}")

    # Partial updates
    r.execute_command("JSON.NUMINCRBY", product_key, "$.price", -100)
    r.execute_command("JSON.NUMINCRBY", product_key, "$.stock", -1)

    # Get nested field
    ram = json_get(product_key, "$.specs.ram")
    print(f"RAM: {ram}")

    # Get all
    full = json_get_all(product_key)
    print(f"Product: {full}")
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: RedisJSON
💡 KEY INSIGHT: RedisJSON = JSON documents với partial updates. Cần Redis Stack module. JSONPath cho queries. RedisJSON + RediSearch = document DB.
⚠️ PITFALLS:
  - RedisJSON cần Redis Stack, không có trong Redis vanilla
  - String phải được JSON-encoded
  - Array index out of bounds → null
✅ Đã hiểu: [ ]
```

---

**🎉 HOÀN THÀNH CHƯƠNG 2 — ADVANCED STRUCTURES!**
