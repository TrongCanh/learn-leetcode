# 026 — Caching

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Cache-Aside, Read-Through, Write-Through, Cache patterns |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Cache Patterns

```
┌──────────────────────────────────────────────────────────────┐
│                    CACHE PATTERNS                                     │
│                                                               │
│  1. Cache-Aside (Lazy Loading):                               │
│     App → Check Cache → Miss → Load from DB → Store Cache   │
│     → Most popular                                           │
│                                                               │
│  2. Read-Through:                                            │
│     App → Check Cache → Miss → Cache auto-loads from DB      │
│     → Cache manages loading                                   │
│                                                               │
│  3. Write-Through:                                           │
│     App → Write to Cache → Cache writes to DB synchronously │
│     → Always consistent                                        │
│                                                               │
│  4. Write-Behind (Write-Back):                               │
│     App → Write to Cache → Async write to DB                 │
│     → Fast, may lose data                                     │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 2. Cache-Aside Pattern

```python
def get_user(user_id):
    """Cache-Aside: Check cache → miss → load from DB → store cache"""
    cache_key = f"user:{user_id}"

    # 1. Check cache
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)

    # 2. Cache miss → load from DB
    user = db.get_user(user_id)

    # 3. Store in cache with TTL
    if user:
        r.setex(cache_key, 3600, json.dumps(user))  # 1 hour

    return user
```

### 🔍 3. Write Patterns

```python
def update_user(user_id, data):
    """Write-Through: Update DB → Update cache"""
    # 1. Update database
    db.update_user(user_id, data)

    # 2. Update cache (invalidate)
    r.delete(f"user:{user_id}")

def update_user_write_behind(user_id, data):
    """Write-Behind: Update cache → Async update DB"""
    # 1. Update cache immediately
    r.setex(f"user:{user_id}", 3600, json.dumps(data))

    # 2. Async write to DB (queue job)
    job_queue.push({
        "type": "UPDATE_USER",
        "user_id": user_id,
        "data": data
    })
```

### 🔍 4. Cache Invalidation

```python
# Invalidate on update
def invalidate_cache(key_pattern):
    """Xóa cache keys matching pattern"""
    for key in r.scan_iter(match=key_pattern):
        r.delete(key)

# Invalidate via Pub/Sub
def invalidate_via_pubsub(channel, cache_key):
    """Khi data thay đổi → notify all servers"""
    r.publish("cache:invalidate", cache_key)

def cache_invalidation_listener():
    """Subscribe → xóa cache khi data thay đổi"""
    pubsub = r.pubsub()
    pubsub.subscribe("cache:invalidate")
    for msg in pubsub.listen():
        if msg["type"] == "message":
            r.delete(msg["data"])
```

---

## 🧠 Phân tích & Hướng tư tư

### ⚠️ Common Pitfalls

| Pitfall | Explanation |
|---------|-----------|
| **Cache không bao giờ invalidate** | Stale data → wrong results |
| **Cache quá lớn** | Memory pressure → eviction chaos |
| **Dùng cache cho everything** | Complexity tăng, not always worth it |

### 🔑 Key Insight

> **Cache-Aside = phổ biến nhất. Write → invalidate cache. TTL = expiration. Dùng appropriate TTL.**

---

## ✅ Ví dụ

```python
import redis
import json

r = redis.Redis(decode_responses=True)

# ─── Cache-Aside ───
def get_product(product_id):
    cache_key = f"product:{product_id}"

    # Check cache
    cached = r.get(cache_key)
    if cached:
        print(f"🎯 Cache HIT: {product_id}")
        return json.loads(cached)

    # Load from "database"
    product = {"id": product_id, "name": f"Product {product_id}", "price": 99.99}

    # Store in cache
    r.setex(cache_key, ttl=300, value=json.dumps(product))
    print(f"💾 Cache MISS: {product_id} → stored in cache")

    return product

def update_product(product_id, data):
    """Update → Invalidate cache"""
    # Update "database"
    print(f"📝 Updating product {product_id}")

    # Invalidate cache
    r.delete(f"product:{product_id}")
    print(f"🗑️  Cache invalidated for product:{product_id}")

def batch_get_products(ids):
    """Batch với pipeline"""
    pipe = r.pipeline()
    for pid in ids:
        pipe.get(f"product:{pid}")
    results = pipe.execute()

    products = []
    for pid, cached in zip(ids, results):
        if cached:
            products.append(json.loads(cached))
        else:
            products.append(get_product(pid))  # Load if miss
    return products

# ─── Demo ───
if __name__ == "__main__":
    print("=== Cache-Aside Pattern ===")
    p = get_product(100)  # MISS
    print(f"Result: {p}")
    p = get_product(100)  # HIT
    print(f"Result: {p}")

    print("\n=== Update & Invalidate ===")
    update_product(100, {"name": "Updated"})
    p = get_product(100)  # MISS again
    print(f"Result: {p}")
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Caching Patterns
💡 KEY INSIGHT: Cache-Aside = phổ biến. Write → Invalidate cache.
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./027-rate-limiting.md)
