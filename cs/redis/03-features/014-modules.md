# 014 — Modules

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Redis Modules, RediSearch, RedisJSON, RedisBloom, RedisGraph |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Redis Modules là gì?

**Redis Modules = extensions viết bằng C/Rust, load vào Redis để thêm capabilities mới.**

```
┌──────────────────────────────────────────────────────────────┐
│                    REDIS MODULES                               │
│                                                               │
│  Redis Core (built-in):                                      │
│  ├── Strings, Lists, Sets, Hashes, Sorted Sets             │
│  ├── Streams, Geospatial                                  │
│  ├── Pub/Sub, Transactions                                 │
│  └── Lua scripting                                         │
│                                                               │
│  Redis Stack (modules included):                             │
│  ├── RedisJSON  → JSON documents                          │
│  ├── RediSearch → Full-text search                        │
│  ├── RedisBloom → Probabilistic data structures           │
│  ├── RedisGraph → Graph database                         │
│  ├── RedisTimeSeries → Time-series data                   │
│  └── RedisGears → Serverless engine                       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 2. RediSearch — Full-Text Search

```bash
# ─── Create Index ───
FT.CREATE products ON HASH PREFIX 1 "product:" SCHEMA \
  name TEXT SORTABLE \
  price NUMERIC SORTABLE \
  brand TEXT \
  category TAG \
  description TEXT

# ─── Search ───
FT.SEARCH products "laptop"
# → Documents matching "laptop"

FT.SEARCH products "laptop" LIMIT 0 10
# → Paginated results

FT.SEARCH products "@price:[100 500]"
# → Numeric range filter

FT.SEARCH products "@name:laptop @brand:apple"
# → Multiple field filter

FT.SEARCH products "laptop" RETURN 2 name price
# → Return only specific fields

# ─── Aggregation ───
FT.AGGREGATE products "@price:[0 +inf]" GROUPBY 1 @category REDUCE AVG 1 @price AS avg_price
# → Average price by category
```

### 🔍 3. RedisBloom — Probabilistic Structures

```bash
# ─── Bloom Filter ───
BF.ADD urls "https://example.com/page1"
BF.ADD urls "https://example.com/page2"

BF.EXISTS urls "https://example.com/page1"
# → 1 (có thể đã có)

BF.EXISTS urls "https://example.com/page3"
# → 0 (chắc chắn không có)

# ─── Count-Min Sketch ───
CMS.INCRBY frequency item1 5 item2 3 item1 2
CMS.QUERY frequency item1 item2
# → [7, 3] (item1 xuất hiện ~7 lần)

# ─── Top-K ───
TOPK.ADD topkproducts item1 item2 item3 item1 item1
TOPK.LIST topkproducts
# → Top 5 most frequent items
```

### 🔍 4. RedisJSON Operations (đã có trong Chương 2)

```bash
JSON.SET product:1 $ '{"name":"Laptop","price":999}'
JSON.GET product:1 $.price
# → [999]
```

### 🔍 5. RedisTimeSeries

```bash
# ─── Create Time-Series ───
TS.CREATE temperature:madrid RETENTION 864000 LABELS type temperature location madrid

# ─── Add Data Points ───
TS.ADD temperature:madrid * 22.5
TS.ADD temperature:madrid * 23.1
TS.ADD temperature:madrid * 21.8

# ─── Query ───
TS.RANGE temperature:madrid 1709300000 1709399999
# → Data points trong khoảng thời gian

TS.GET temperature:madrid
# → Latest data point

TS.MGET FILTER type=temperature
# → Multiple time series
```

---

## 🧠 Phân tích & Hướng tư tư

### 🤔 Khi nào dùng Redis Modules?

```
┌─────────────────────────────────────────────────────────────┐
│  REDIS THUẦN → Dùng khi:                               │
│    • Key-value, caching, counters                         │
│    • Queues (Lists)                                      │
│    • Rate limiting (Sorted Sets)                          │
│    • Basic pub/sub                                        │
├─────────────────────────────────────────────────────────────┤
│  REDISEARCH → Dùng khi:                                │
│    • Full-text search                                     │
│    • Faceted search, aggregations                        │
│    • N-native search engine                              │
├─────────────────────────────────────────────────────────────┤
│  REDISBLOOM → Dùng khi:                                │
│    • Duplicate detection (Bloom filter)                  │
│    • Rate limiting ( sliding window)                    │
│    • Frequency estimation (Count-Min Sketch)             │
├─────────────────────────────────────────────────────────────┤
│  REDISGRAPH → Dùng khi:                                │
│    • Social graphs (who follows who)                      │
│    • Fraud detection (relationship analysis)             │
│    • Knowledge graphs                                     │
├─────────────────────────────────────────────────────────────┤
│  REDISTIMESERIES → Dùng khi:                          │
│    • IoT sensor data                                      │
│    • Metrics, monitoring                                  │
│    • Time-based analytics                                 │
└─────────────────────────────────────────────────────────────┘
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Modules cần Redis Stack** | Redis modules không có trong Redis vanilla. Phải dùng Redis Stack |
| **Bloom filter false positives** | `EXISTS` = 1 không đảm bảo 100% → chỉ dùng cho "probably exists" |
| **Search index phải update** | Thêm/sửa document → phải update index. Đồng bộ là vấn đề |

### 🔑 Key Insight

> **Redis Modules mở rộng Redis thành multi-model database. RediSearch = search engine. RedisBloom = probabilistic structures. RedisTimeSeries = time-series. RedisStack = tất cả modules trong 1 image.**

---

## ✅ Ví dụ Python

```python
import redis

r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# ─── RediSearch ───
def setup_search_index():
    """Tạo search index cho products"""
    try:
        # Xóa index cũ nếu có
        r.execute_command("FT.DROPINDEX", "products", "DD")
    except redis.ResponseError:
        pass

    # Tạo index
    r.execute_command(
        "FT.CREATE", "products",
        "ON", "HASH",
        "PREFIX", "1", "product:",
        "SCHEMA",
        "name", "TEXT", "SORTABLE",
        "price", "NUMERIC", "SORTABLE",
        "brand", "TEXT",
        "category", "TAG"
    )
    print("✅ Created search index: products")

def add_product(product_id, name, price, brand, category):
    """Thêm product (tự động indexed)"""
    r.hset(f"product:{product_id}", mapping={
        "name": name,
        "price": price,
        "brand": brand,
        "category": category
    })
    print(f"✅ Added product:{product_id}")

def search_products(query, filters=None):
    """Tìm products"""
    cmd = ["FT.SEARCH", "products", query]
    if filters:
        cmd.extend(["FILTER"] + filters)
    cmd.extend(["LIMIT", "0", "20"])
    results = r.execute_command(*cmd)

    products = []
    if results:
        # results[0] = total count
        for i in range(1, len(results), 2):
            doc = results[i]
            fields = results[i + 1]
            product = dict(zip(fields[::2], fields[1::2]))
            products.append(product)
    return products

def search_by_price_range(min_price, max_price):
    """Tìm products theo price range"""
    results = r.execute_command(
        "FT.SEARCH", "products",
        "*",
        "FILTER", "price", min_price, max_price,
        "SORTBY", "price", "ASC",
        "LIMIT", "0", "10"
    )
    return results

# ─── Bloom Filter ───
def check_url_seen(url, bloom_key="seen:urls"):
    """Kiểm tra URL đã thấy chưa (probabilistic)"""
    exists = r.execute_command("BF.EXISTS", bloom_key, url)
    return exists == 1

def mark_url_seen(url, bloom_key="seen:urls"):
    """Mark URL là đã thấy"""
    r.execute_command("BF.ADD", bloom_key, url)

def setup_bloom():
    """Tạo bloom filter (tự động tạo nếu chưa có)"""
    try:
        r.execute_command("BF.RESERVE", "seen:urls", "0.01", "100000")
    except redis.ResponseError:
        pass  # Already exists

# ─── Demo ───
if __name__ == "__main__":
    print("=== RediSearch ===")
    setup_search_index()

    # Add products
    add_product(1, "MacBook Pro 14", 1999, "Apple", "laptop")
    add_product(2, "ThinkPad X1", 1599, "Lenovo", "laptop")
    add_product(3, "iPhone 15", 999, "Apple", "phone")
    add_product(4, "Dell XPS 15", 1299, "Dell", "laptop")
    add_product(5, "MacBook Air", 1199, "Apple", "laptop")

    # Search
    print("\n📦 Search 'laptop':")
    for p in search_products("@category:laptop"):
        print(f"  {p}")

    print("\n📦 Search 'apple':")
    for p in search_products("apple"):
        print(f"  {p}")

    print("\n📦 Price range $1000-2000:")
    # Parse filter results
    results = r.execute_command(
        "FT.SEARCH", "products", "*",
        "FILTER", "price", 1000, 2000,
        "SORTBY", "price", "ASC"
    )
    print(f"  Found {results[0]} products")
    for i in range(1, len(results), 2):
        fields = dict(zip(results[i+1][::2], results[i+1][1::2]))
        print(f"  {fields}")

    print("\n=== Bloom Filter ===")
    setup_bloom()

    urls = ["https://example.com/1", "https://example.com/2", "https://example.com/1"]
    for url in urls:
        if check_url_seen(url):
            print(f"🔄 Already seen: {url}")
        else:
            mark_url_seen(url)
            print(f"✅ New URL: {url}")
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Redis Modules
💡 KEY INSIGHT: Modules = extensions. RediSearch = full-text search. RedisBloom = probabilistic. RedisStack = all-in-one.
⚠️ PITFALLS:
  - Cần Redis Stack, không có trong Redis vanilla
  - Bloom filter có false positives
  - Search index phải update khi data thay đổi
✅ Đã hiểu: [ ]
```

---

**🎉 HOÀN THÀNH CHƯƠNG 3 — FEATURES!**
