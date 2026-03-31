# 002 — Lists

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | LPUSH, RPUSH, LPOP, RPOP, LRANGE, QUEUE, STACK |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Redis List là gì?

**Redis List = Doubly-linked list của strings.** Có thể thêm/xóa ở cả hai đầu với O(1).

```
Redis List = [A] ↔ [B] ↔ [C] ↔ [D] ↔ [E]

• LPUSH → thêm vào ĐẦU (left)
• RPUSH → thêm vào CUỐI (right)
• LPOP  → lấy và xóa ĐẦU (left)
• RPOP  → lấy và xóa CUỐI (right)

→ LPUSH + LPOP = STACK (LIFO)
→ LPUSH + RPOP = QUEUE (FIFO)
→ RPUSH + LPOP = QUEUE (FIFO)
→ RPUSH + RPOP = STACK (LIFO)
```

### 🔍 2. Basic Operations

```bash
# ─── LPUSH / RPUSH ───
LPUSH tasks "task1"              # → 1 (độ dài list)
LPUSH tasks "task2"              # → 2
LPUSH tasks "task3"              # → 3

RPUSH queue "job1"               # → 1
RPUSH queue "job2"               # → 2
RPUSH queue "job3"               # → 3

# ─── LRANGE ───
LRANGE tasks 0 -1               # → ["task3","task2","task1"]
#                              ↑  Index từ 0, -1 = cuối cùng
LRANGE tasks 0 1                # → ["task3","task2"] (lấy 2 phần tử)
LRANGE tasks 1 2                # → ["task2","task1"]

# ─── LPOP / RPOP ───
LPOP tasks                       # → "task3" (lấy và XÓA đầu)
LPOP tasks                       # → "task2"
LPOP tasks                       # → "task1"
LPOP tasks                       # → nil (list rỗng)

RPOP queue                       # → "job3" (lấy và XÓA cuối)
```

### 🔍 3. Blocking Operations — BLPOP / BRPOP

**Blocking = chờ đến khi có data, thay vì trả về nil ngay.**

```bash
# ─── BLPOP / BRPOP ───
# BLPOP: Blocking LPOP (chờ ở ĐẦU)
# BRPOP: Blocking RPOP (chờ ở CUỐI)

BLPOP tasks 30                  # Chờ tối đa 30s
# → "task1" (nếu có)
# → nil (sau 30s không có data)

BRPOP queue 0                   # Chờ VĨNH VIỄN (0 = no timeout)
# → "job3" (khi có data)
```

### 🔍 4. Queue Pattern — FIFO (First In, First Out)

```bash
# Producer: thêm vào CUỐI
RPUSH jobs "process:image:001"
RPUSH jobs "process:image:002"
RPUSH jobs "send:email:001"

# Consumer: lấy từ ĐẦU
BLPOP jobs 0                    # → "process:image:001"
BLPOP jobs 0                    # → "process:image:002"
BLPOP jobs 0                    # → "send:email:001"
BLPOP jobs 5                    # → nil sau 5s

# → Đúng thứ tự: image:001 → image:002 → email:001
```

### 🔍 5. Stack Pattern — LIFO (Last In, First Out)

```bash
# Thêm vào ĐẦU
LPUSH undo "delete:user:100"
LPUSH undo "update:user:100"
LPUSH undo "create:user:100"

# Lấy từ ĐẦU (action gần nhất trước)
LPOP undo                       # → "create:user:100"
LPOP undo                       # → "update:user:100"
LPOP undo                       # → "delete:user:100"
```

### 🔍 6. Other List Commands

```bash
# ─── LLEN ───
LLEN tasks                      # → 3 (số phần tử)

# ─── LINDEX ─── (lấy theo index)
LPUSH nums "one" "two" "three"
LINDEX nums 0                  # → "three" (index 0 = đầu)
LINDEX nums -1                 # → "one" (index cuối)

# ─── LINSERT ───
LPUSH letters "b"
LINSERT letters BEFORE "b" "a"  # → 2 (thêm "a" trước "b")
# List: ["a","b"]

# ─── LSET ───
LSET letters 0 "A"             # Set index 0 = "A"
# List: ["A","b"]

# ─── LTRIM ─── (cắt list, giữ range)
LPUSH buffer "1" "2" "3" "4" "5"
LTRIM buffer 0 2               # Giữ index 0-2, xóa phần còn lại
LRANGE buffer 0 -1              # → ["5","4","3"]

# ─── RPOPLPUSH / BRPOPLPUSH ───
# Lấy từ cuối list A, thêm vào đầu list B
RPOPLPUSH queue backup          # Atomic: RPOP từ queue → LPUSH vào backup
# Dùng cho: reliable queue (lưu lại để có thể rollback)
```

### 🔍 7. Reliable Queue Pattern

```bash
# Problem: RPOP lấy xong → consumer crash → data mất

# Solution: BRPOPLPUSH vào processing queue trước

# Producer:
RPUSH orders "order:1001" "order:1002"

# Consumer worker 1:
BRPOPLPUSH orders processing 0   # ← Lấy từ orders → thêm vào processing
# → "order:1001" (đang xử lý)

# Sau khi xử lý thành công:
LPOP processing                 # Xóa khỏi processing = hoàn tất

# Nếu worker crash giữa chừng:
# "order:1001" vẫn nằm trong processing
# Monitor job chạy định kỳ:
BRPOPLPUSH processing orders 0 # ← Hoàn về orders nếu quá lâu
```

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 Redis List vs Python List vs Queue

```
┌─────────────────┬──────────────┬─────────────────────────────────┐
│                 │ Redis List   │ Python List                      │
├─────────────────┼──────────────┼─────────────────────────────────┤
│ Storage          │ In-memory    │ In-memory                        │
│ Persistence      │ Có (RDB/AOF) │ Không                            │
│ Blocking ops    │ ✅ BLPOP      │ ❌ Cần threading               │
│ Atomic ops      │ ✅ LPUSH/..  │ ❌ Cần lock                    │
│ Max size        │ 2^32-1 items  │ RAM-limited                     │
│ Distributed     │ ✅            │ ❌ (cần shared memory)        │
│ Multiple consumers│ ✅ (BRPOPLPUSH)│ ❌                           │
└─────────────────┴──────────────┴─────────────────────────────────┘
```

### 🤔 List vs Stream — Khi nào dùng?

```
List (LPUSH + BLPOP):
  ✅ Simple queue
  ✅ Single consumer per queue
  ✅ Atomic push/pop
  ❌ Không có consumer groups
  ❌ Không có replay
  ❌ Không persistent

Stream (XADD + XREADGROUP):
  ✅ Consumer groups (nhiều consumers)
  ✅ Message persistence
  ✅ Replay (đọc lại từ offset)
  ✅ Fan-out
  ✅ Có stream info
  ❌ Phức tạp hơn
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Dùng LRANGE cho list lớn** | LRANGE O(N) với N = số phần tử lấy ra. List 1 triệu items → LRANGE 0 100 = rất chậm |
| **Dùng LPUSH + LRANGE cho timeline** | Append-only → LRANGE(0, 100) → O(N). Nên dùng Sorted Set thay thế |
| **BLPOP mà không có timeout** | `BLPOP queue 0` = chờ vĩnh viễn. Worker crash → queue bị block |
| **Queue bị overflow** | Không có built-in size limit. Dùng LTRIM để giới hạn |
| **Dùng List cho message với nhiều consumers** | Mỗi message chỉ được 1 consumer nhận. Dùng Stream với consumer groups |

### 🔑 Key Insight

> **List = Doubly-linked list. O(1) ở cả hai đầu. LPUSH+BLPOP = reliable queue. LPUSH+LPOP = stack. BRPOPLPUSH = processing queue để tránh mất message khi crash.**

---

## ✅ Ví dụ Python

```python
import redis
import json
import time

r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# ─── Simple Job Queue ───
def enqueue_job(queue_name, job_data):
    """Producer: thêm job vào queue"""
    job_id = r.incr(f"job:id:{queue_name}")
    job = {
        "id": job_id,
        "data": job_data,
        "created_at": time.time()
    }
    r.rpush(f"queue:{queue_name}", json.dumps(job))
    print(f"✅ Enqueued job #{job_id}: {job_data}")
    return job_id

def dequeue_job(queue_name, timeout=0):
    """
    Consumer: lấy job từ queue (blocking)
    timeout=0 = chờ vĩnh viễn
    """
    result = r.blpop(f"queue:{queue_name}", timeout=timeout)
    if result:
        _, job_json = result
        return json.loads(job_json)
    return None

# ─── Reliable Queue ───
def reliable_dequeue(queue_name, processing_queue, timeout=0):
    """
    Lấy job → thêm vào processing queue
    Nếu xử lý thành công → xóa khỏi processing
    Nếu crash → monitor hoàn về main queue
    """
    job_json = r.brpoplpush(
        f"queue:{queue_name}",
        f"queue:{processing_queue}",
        timeout=timeout
    )
    if job_json:
        return json.loads(job_json)
    return None

def complete_job(processing_queue):
    """Xử lý xong → xóa khỏi processing queue"""
    r.lpop(f"queue:{processing_queue}")

def reclaim_stale_jobs(queue_name, processing_queue, max_age_seconds=300):
    """Monitor: hoàn về main queue những job xử lý quá lâu"""
    while True:
        jobs = r.lrange(f"queue:{processing_queue}", 0, -1)
        for job_json in jobs:
            job = json.loads(job_json)
            age = time.time() - job.get("started_at", 0)
            if age > max_age_seconds:
                # Remove khỏi processing, thêm lại vào main queue
                r.lrem(f"queue:{processing_queue}", 1, job_json)
                r.rpush(f"queue:{queue_name}", job_json)
                print(f"🔄 Reclaimed stale job #{job['id']}")
        time.sleep(30)

# ─── Recent Activity Feed ───
def add_activity(user_id, activity, max_items=100):
    """Thêm activity vào feed, giới hạn max_items"""
    key = f"feed:user:{user_id}"
    r.lpush(key, json.dumps(activity))
    r.ltrim(key, 0, max_items - 1)  # Giữ chỉ max_items gần nhất
    print(f"✅ Added activity for user {user_id}")

def get_feed(user_id, count=10):
    """Lấy recent activities"""
    key = f"feed:user:{user_id}"
    activities = r.lrange(key, 0, count - 1)
    return [json.loads(a) for a in activities]

# ─── Demo ───
enqueue_job("image-processing", {"task": "resize", "image": "photo.jpg"})
enqueue_job("image-processing", {"task": "compress", "image": "photo2.jpg"})

job = dequeue_job("image-processing", timeout=5)
print(f"📥 Got job: {job}")

add_activity(100, {"type": "post", "content": "Hello!"})
add_activity(100, {"type": "like", "post_id": 123})
print(f"Feed: {get_feed(100, 5)}")
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Redis Lists
💡 KEY INSIGHT: LPUSH/RPOP = queue (FIFO). LPUSH/LPOP = stack (LIFO). BLPOP = blocking consumer. BRPOPLPUSH = reliable queue.
⚠️ PITFALLS:
  - LRANGE O(N) → không dùng cho list lớn
  - BLPOP với timeout=0 → worker crash → block vĩnh viễn
  - Không có consumer groups → dùng Stream cho multiple consumers
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./003-sets.md)
