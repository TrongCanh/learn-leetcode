# 003 — Sets

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | SADD, SREM, SISMEMBER, SUNION, SINTER, Sets, Tags, Deduplication |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Redis Set là gì?

**Redis Set = Unordered collection của unique strings.** Mỗi phần tử chỉ xuất hiện **một lần duy nhất**.

```
Redis Set = { "apple", "banana", "cherry" }

• SADD → thêm phần tử
• SISMEMBER → kiểm tra tồn tại
• SREM → xóa phần tử
• SUNION → hợp (union)
• SINTER → giao (intersection)
• SDIFF → hiệu (difference)

→ O(1) cho SADD, SREM, SISMEMBER
→ Perfect cho: tags, unique items, membership checks
```

### 🔍 2. Basic Operations

```bash
# ─── SADD / SREM ───
SADD tags:post:1 "python" "redis" "cache"   # → 3 (số phần tử thêm mới)
SADD tags:post:1 "redis" "cache"             # → 0 (đã tồn tại, không thêm)

SREM tags:post:1 "cache"                     # → 1 (xóa thành công)
SREM tags:post:1 "nonexistent"              # → 0 (không tồn tại)

# ─── SISMEMBER ───
SISMEMBER tags:post:1 "python"              # → 1 (TRUE - tồn tại)
SISMEMBER tags:post:1 "golang"              # → 0 (FALSE - không tồn tại)

# ─── SMEMBERS ───
SMEMBERS tags:post:1                        # → ["python", "redis"]
# ⚠️ O(N) với N = số phần tử. Dùng SSCAN cho large sets.

# ─── SCARD ───
SCARD tags:post:1                           # → 2 (số phần tử)

# ─── SADD + SISMEMBER = Tag check ───
SADD liked:user:100 "post:1" "post:2" "post:3"
SISMEMBER liked:user:100 "post:2"            # → 1
```

### 🔍 3. Set Operations — Union, Intersection, Difference

```bash
# ─── Setup ───
SADD products:laptops "macbook" "dell" "thinkpad" "hp"
SADD products:gaming "alienware" "asus-rog" "msi" "alienware"
SADD products:business "thinkpad" "dell" "latitude" "latitude"

# ─── SUNION ─── (Hợp)
SUNION products:laptops products:gaming
# → {"macbook","dell","thinkpad","hp","alienware","asus-rog","msi"}

# ─── SINTER ─── (Giao)
SINTER products:laptops products:business
# → {"thinkpad","dell"} (laptop VÀ business)

SINTER products:gaming products:laptops
# → {"alienware"} (laptop VÀ gaming)

# ─── SDIFF ─── (Hiệu)
SDIFF products:laptops products:business
# → {"macbook","hp"} (laptops NHƯNG KHÔNG trong business)

SDIFF products:laptops products:gaming products:business
# → {"macbook","hp"} (laptops - gaming - business)
```

### 🔍 4. Use Cases thực tế

#### 4.1 Tags / Categorization

```bash
# Mỗi bài viết có tags
SADD post:100:tags "python" "redis" "performance"
SADD post:101:tags "redis" "docker" "devops"
SADD post:102:tags "python" "ml" "ai"

# Tìm bài viết có CẢ python VÀ redis
SINTER post:100:tags post:101:tags post:102:tags
# → {"redis","python"} (tags chung)

# Tìm bài viết có tag "redis"
# → Cần SCAN tất cả posts (vì không có inverted index tự nhiên)
# → Solution: dùng SET cho mỗi tag
SADD tag:redis post:100 post:101 post:200
SINTER tag:redis tag:python
# → {"post:100"} (có cả redis VÀ python)
```

#### 4.2 Unique Visitors

```bash
# Đếm unique visitors trong 1 ngày
SADD visitors:2024-03-31 "ip:1.2.3.4" "ip:1.2.3.5" "ip:1.2.3.4"
# → 2 (ip:1.2.3.4 không được thêm lại)

SCARD visitors:2024-03-31                   # → 2 unique visitors

# Xóa key sau khi hết ngày
EXPIRE visitors:2024-03-31 86400           # 24 tiếng
```

#### 4.3 Deduplication

```bash
# Đảm bảo user không vote 2 lần
SADD voted:post:123 "user:100"
SISMEMBER voted:post:123 "user:100"       # → 1 (đã vote)
SISMEMBER voted:post:123 "user:101"        # → 0 (chưa vote)

# Dùng SADD trả về:
SADD voted:post:123 "user:102"
# → 1 (vote thành công, thêm mới)
SADD voted:post:123 "user:102"
# → 0 (đã tồn tại, vote bị từ chối)
```

### 🔍 5. Member-based operations

```bash
# ─── SRANDMEMBER ─── (lấy random member KHÔNG xóa)
SRANDMEMBER products:laptops               # → "macbook" (random)
SRANDMEMBER products:laptops 2             # → ["macbook","hp"] (2 items)

# SPOP = lấy random VÀ XÓA
SPOP products:laptops                     # → "dell" (xóa luôn)
SPOP products:laptops 2                   # → ["macbook","thinkpad"] (xóa 2)

# ─── SSCAN ─── (iterating large sets)
SSCAN tags:post:1 0 MATCH python COUNT 100
# → Iterator qua set mà không block
# Dùng khi set có hàng triệu members
```

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 Set vs List — Khi nào dùng?

```
Set (SADD, SISMEMBER):
  ✅ O(1) kiểm tra membership
  ✅ Unique values tự động
  ✅ Set operations (UNION, INTER, DIFF)
  ❌ Không có order
  ❌ Không có duplicates
  ❌ O(N) duyệt toàn bộ

List (LPUSH, LRANGE):
  ✅ Ordered
  ✅ Duplicate values được
  ✅ Có blocking operations (BLPOP)
  ❌ O(N) kiểm tra membership
  ❌ Không có set operations

→ Tags, unique visitors, membership → SET
→ Queues, feeds, activity logs → LIST
→ Leaderboards, priority → SORTED SET
```

### 🤔 Set vs Hash (cho tags)?

```
Set cho tags:
  SADD post:1:tags "python" "redis"
  SISMEMBER post:1:tags "python"  → 1 (O(1))

Hash cho tags:
  HSET post:1 tags "python,redis"
  HGET post:1 tags  → "python,redis"
  → Phải parse string → O(N) nếu nhiều tags

→ SET tốt hơn cho tags
→ Nhưng: nếu muốn search posts với tag → cần inverted index
  SADD tag:python post:1 post:2
  SINTER tag:python tag:redis  → {"post:1"}
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Dùng SMEMBERS cho set lớn** | SMEMBERS trả về TẤT CẢ → O(N) memory + time. Dùng SSCAN thay thế |
| **Dùng Set cho ordered data** | Set là unordered → không có thứ tự. Dùng Sorted Set |
| **Tưởng Set tự loại bỏ duplicate sau khi thêm** | Nếu dùng SPOP → duplicate vẫn tồn tại trong set (chỉ 1) |
| **Tạo inverted index mà không quản lý** | SADD tag:python post:1 → nhưng post:1 bị xóa → orphan tag entry |
| **Dùng SINTER cho nhiều sets** | SINTER là O(N) với N = size của smallest set. Đặt smallest set trước |

### 🔑 Key Insight

> **Set = Unordered + Unique. O(1) membership check. Tốt cho tags, unique visitors, deduplication. Dùng inverted index (SADD tag:name item) để query by tag.**

---

## ✅ Ví dụ Python

```python
import redis
import time

r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# ─── Tag System với Inverted Index ───
def add_tags_to_post(post_id, tags):
    """Thêm tags vào post (post → tags)"""
    post_key = f"post:{post_id}:tags"
    r.delete(post_key)
    if tags:
        r.sadd(post_key, *tags)
    # Đồng thời update inverted index (tag → posts)
    for tag in tags:
        r.sadd(f"tag:{tag}", post_id)
    print(f"✅ Post {post_id}: tags = {tags}")

def get_post_tags(post_id):
    """Lấy tags của post"""
    return list(r.smembers(f"post:{post_id}:tags"))

def find_posts_with_all_tags(tags):
    """Tìm posts có TẤT CẢ tags (AND)"""
    if not tags:
        return []
    tag_keys = [f"tag:{tag}" for tag in tags]
    result = r.sinter(*tag_keys)
    return list(result)

def find_posts_with_any_tag(tags):
    """Tìm posts có ÍT NHẤT 1 tag (OR)"""
    if not tags:
        return []
    tag_keys = [f"tag:{tag}" for tag in tags]
    result = r.sunion(*tag_keys)
    return list(result)

def find_posts_excluding_tags(exclude_tags):
    """Tìm posts KHÔNG có tags trong exclude_tags"""
    # Tìm tất cả posts
    # Trừ đi posts có tag exclude
    pass  # Complex, dùng Lua script hoặc application-level filter

# ─── Unique Visitor Counter ───
def track_visitor(site_id, visitor_id):
    """Track unique visitor (1 visitor chỉ đếm 1 lần)"""
    key = f"visitors:{site_id}:{time.strftime('%Y-%m-%d')}"
    added = r.sadd(key, visitor_id)
    if added:
        print(f"✅ New visitor: {visitor_id}")
    else:
        print(f"👀 Returning visitor: {visitor_id}")
    return added

def get_unique_visitors(site_id, date=None):
    """Đếm unique visitors"""
    date = date or time.strftime('%Y-%m-%d')
    key = f"visitors:{site_id}:{date}"
    return r.scard(key)

# ─── Vote System (Deduplication) ───
def vote(post_id, user_id):
    """Vote (đảm bảo 1 user chỉ vote 1 lần)"""
    key = f"votes:{post_id}"
    added = r.sadd(key, user_id)
    if added:
        r.incr(f"vote_count:{post_id}")
        print(f"✅ User {user_id} voted for post {post_id}")
        return True
    else:
        print(f"⚠️ User {user_id} already voted for post {post_id}")
        return False

def has_voted(post_id, user_id):
    """Kiểm tra user đã vote chưa"""
    return r.sismember(f"votes:{post_id}", user_id)

# ─── Demo ───
add_tags_to_post(100, ["python", "redis", "performance"])
add_tags_to_post(101, ["python", "docker", "devops"])
add_tags_to_post(102, ["redis", "ai", "performance"])

print(f"\n📊 Posts with 'python': {find_posts_with_all_tags(['python'])}")
print(f"📊 Posts with 'python' AND 'redis': {find_posts_with_all_tags(['python', 'redis'])}")
print(f"📊 Posts with 'redis' OR 'ai': {find_posts_with_any_tag(['redis', 'ai'])}")

print(f"\n👥 Unique visitors: {track_visitor('site1', 'ip:1.2.3.4')}")
track_visitor('site1', 'ip:1.2.3.4')  # returning
track_visitor('site1', 'ip:5.6.7.8')
print(f"👥 Total: {get_unique_visitors('site1')}")

print(f"\n🗳️ Vote result: {vote(100, 'user:1')}")
vote(100, 'user:1')  # already voted
print(f"Has voted: {has_voted(100, 'user:1')}")
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Redis Sets
💡 KEY INSIGHT: Set = unordered + unique + O(1) membership. Tốt cho tags, unique visitors, deduplication. Inverted index: SADD tag:name item.
⚠️ PITFALLS:
  - SMEMBERS O(N) → dùng SSCAN
  - Set unordered → dùng Sorted Set cho order
  - Inverted index orphan entries khi item bị xóa
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./004-sorted-sets.md)
