# 007 — Streams

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Stream, XADD, XREAD, Consumer Groups, Event Sourcing, Message Queue |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Redis Stream là gì?

**Redis Stream = Append-only log file + Consumer Groups.** Ra đời Redis 5.0, là phiên bản mạnh mẽ của List-based queues.

```
Redis Stream khác gì List?

List Queue:
  LPUSH item → RPOP item
  - Message bị xóa khi lấy
  - Không có consumer groups
  - Không có replay
  - Không có acknowledgment

Redis Stream:
  XADD stream → XREADGROUP consumer → ACK
  - Message tồn tại sau khi đọc (pending)
  - Consumer groups (nhiều workers)
  - Replay (đọc lại message đã xử lý)
  - Acknowledgment (xác nhận đã xử lý)
```

### 🔍 2. Basic Operations

```bash
# ─── XADD ─── (Thêm message)
# XADD key ID field value [field value ...]
XADD mystream * sensor_id "temp" value "22.5"
# → "1709301234567-0"
#   ID = timestamp-millisec-sequence

# Với custom ID
XADD mystream "1709301234567-1" sensor_id "humid" value "65"

# ─── XREAD ─── (Đọc messages)
XREAD STREAMS mystream "0"
# → 1) 1) "mystream"
#       2) 1) 1) "1709301234567-0"
#              2) 1) "sensor_id" "temp"
#                  2) "value" "22.5"

# Đọc từ ID cụ thể
XREAD STREAMS mystream "1709301234567-1"
# → chỉ trả về từ ID này trở đi

# ─── XRANGE / XREVRANGE ───
XRANGE mystream - +                     # Tất cả (- = bắt đầu, + = kết thúc)
XRANGE mystream "1709301234567-0" "1709301234567-1"
XREVRANGE mystream + - COUNT 10         # Ngược lại, giới hạn 10
```

### 🔍 3. Consumer Groups

**Consumer Groups = Cho phép nhiều workers xử lý messages đồng thời, không trùng lặp.**

```bash
# ─── Tạo Consumer Group ───
XGROUP CREATE mystream group1 "0" MKSTREAM
# → Tạo group "group1" từ ID "0"
# → MKSTREAM = tạo stream nếu chưa có

# ─── XREADGROUP ─── (Đọc như consumer)
# Consumer: worker-1
XREADGROUP GROUP group1 worker-1 STREAMS mystream ">"
# → ">" = chỉ NEW messages (chưa đọc)
# Trả về messages mới

# ─── XACK ─── (Acknowledgment)
# Sau khi xử lý xong
XACK mystream group1 "1709301234567-0"
# → Message được đánh dấu là đã xử lý
# → Pending entry list (PEL) giảm

# ─── XPENDING ─── (Xem pending messages)
XPENDING mystream group1
# → Danh sách messages chưa ACK
# → Ai nhận, bao lâu rồi
```

### 🔍 4. Stream ID — Cấu trúc

```
Stream ID = "<timestamp>-<sequence>"

"1709301234567-0"
     ↑              ↑
timestamp          sequence
(milliseconds)     (nếu nhiều message cùng ms)

Special IDs:
  $ = chỉ message mới (không đọc cũ)
  * = auto-generate ID mới
  0 = bắt đầu từ đầu

→ ID tăng dần, có thể xem như logical timestamp
→ XRANGE theo ID = query theo thời gian
```

### 🔍 5. Event Sourcing Pattern

```bash
# ─── Event Store ───
XADD events:orders * event_type "order_created" order_id "ORD-001" amount 99.99
XADD events:orders * event_type "order_paid" order_id "ORD-001" payment_id "PAY-001"
XADD events:orders * event_type "order_shipped" order_id "ORD-001" tracking "TRACK-123"

# ─── Replay Event ───
# Đọc lại tất cả events của order
XRANGE events:orders "0" "+" COUNT 100
# → Reproduce trạng thái cuối cùng của order

# ─── Consumer Group cho Event Processing ───
XGROUP CREATE events:orders processors $ MKSTREAM

# Worker 1
XREADGROUP GROUP processors worker-1 STREAMS events:orders ">"
# Nhận events mới

# Sau khi xử lý
XACK events:orders processors "event-id"
```

### 🔍 6. Reliable Message Queue

```bash
# ─── Setup ───
XGROUP CREATE orders:queue payment-workers $ MKSTREAM

# ─── Producer ───
XADD orders:queue * order_id "ORD-001" amount 99.99
XADD orders:queue * order_id "ORD-002" amount 149.99

# ─── Worker 1 ───
XREADGROUP GROUP payment-workers worker-1 STREAMS orders:queue ">"
# → ["ORD-001", "ORD-002"]

# ─── Worker xử lý ORD-001 thành công ───
# Lấy ID từ message
XACK orders:queue payment-workers "id-của-ORD-001"

# ─── Worker xử lý ORD-002 thất bại ───
# Không ACK → Message vẫn trong PEL

# ─── Dead Letter / Retry ───
# Sau khi đợi đủ lâu → read again
XPENDING orders:queue payment-workers
# → Liệt kê pending messages

# Claim lại message chưa xử lý (sau 30 giây)
XCLAIM orders:queue payment-workers worker-2 30000 "id-của-ORD-002"
# → worker-2 nhận message từ worker-1
```

---

## 🧠 Phân tích & Hướng tư tư

### 🤔 Stream vs List — Khi nào dùng?

```
┌────────────────────┬────────────────────┬────────────────────────┐
│                    │ List (Queue)       │ Stream                    │
├────────────────────┼────────────────────┼────────────────────────┤
│ Consumer Groups     │ ❌                 │ ✅                      │
│ Acknowledgment      │ ❌                 │ ✅ (XACK)              │
│ Pending Tracking   │ ❌                 │ ✅ (PEL)               │
│ Message Replay      │ ❌                 │ ✅ (by ID)             │
│ Auto-generated ID   │ ❌ (member value) │ ✅ (timestamp-based)   │
│ Stream Info         │ ❌                 │ ✅ (XINFO)             │
│ Memory Efficiency   │ ✅                │ ⚠️ (more overhead)     │
│ Simplicity         │ ✅                │ ⚠️ (more complex)      │
│ Multiple consumers  │ ⚠️ (brpoplpush)  │ ✅ (native groups)     │
└────────────────────┴────────────────────┴────────────────────────┘

→ Dùng List: simple queue, single consumer, fire-and-forget
→ Dùng Stream: reliable queue, multiple consumers, event sourcing
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **XREADGROUP với ID khác ">"** | ID ">" = chỉ new messages. Dùng specific ID = đọc cả pending |
| **Không ACK messages** | Message nằm trong PEL mãi mãi → memory grow. Luôn ACK sau xử lý |
| **Quên XGROUP CREATE** | XREADGROUP thất bại nếu group không tồn tại |
| **Claim message quá sớm** | XCLAIM với timeout ngắn → worker đang xử lý nhưng chưa xong |
| **Stream grow vô hạn** | XADD liên tục → stream lớn. Dùng XTRIM hoặc MAXLEN |

### 🔑 Key Insight

> **Stream = Append-only log + Consumer Groups. Message tồn tại sau khi đọc, được ACK để xác nhận. Consumer Groups cho phép nhiều workers, XCLAIM cho retry/dead-letter handling.**

---

## ✅ Ví dụ Python

```python
import redis
import time
import json
import threading

r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def create_stream():
    stream_key = "orders:queue"
    group = "payment-workers"
    r.delete(stream_key)
    try:
        r.xgroup_create(stream_key, group, id="0", mkstream=True)
        print(f"✅ Created stream '{stream_key}' with group '{group}'")
    except redis.ResponseError as e:
        if "BUSYGROUP" in str(e):
            print(f"ℹ️  Group '{group}' already exists")
        else:
            raise

def produce_orders(count=5):
    """Producer: thêm orders vào stream"""
    stream_key = "orders:queue"
    for i in range(count):
        order = {
            "order_id": f"ORD-{1000+i}",
            "customer": f"customer_{i}",
            "amount": 50 + i * 10
        }
        msg_id = r.xadd(stream_key, order)
        print(f"📦 Added order: {order['order_id']} (ID: {msg_id})")
    return count

def worker_loop(worker_id, stream_key, group):
    """Worker: đọc và xử lý messages"""
    print(f"🏭 Worker {worker_id} started")

    while True:
        try:
            # Đọc new messages (ID = ">")
            results = r.xreadgroup(
                groupname=group,
                consumername=worker_id,
                streams={stream_key: ">"},
                count=5,
                block=5000  # Block 5s
            )

            if not results:
                print(f"⏰ Worker {worker_id}: no messages")
                continue

            for stream_name, messages in results:
                for msg_id, data in messages:
                    print(f"📥 Worker {worker_id}: {data}")

                    # Xử lý order (simulate)
                    order_id = data.get("order_id")
                    amount = float(data.get("amount", 0))

                    # Simulate processing
                    time.sleep(0.5)

                    if amount > 100:
                        # Success → ACK
                        r.xack(stream_key, group, msg_id)
                        print(f"✅ Worker {worker_id}: processed {order_id} - ACKed")
                    else:
                        # Fail → không ACK → pending
                        print(f"❌ Worker {worker_id}: {order_id} amount too low - NOT ACKed")

        except Exception as e:
            print(f"⚠️  Worker {worker_id} error: {e}")
            time.sleep(1)

def get_pending_info():
    """Xem pending messages"""
    pending = r.xpending("orders:queue", "payment-workers")
    print(f"\n📋 Pending info:")
    print(f"  Pending count: {pending['pending']}")
    if pending['pending'] > 0:
        for entry in pending['entries']:
            print(f"  - ID: {entry['message_id']}, Consumer: {entry['consumer']}, Idle: {entry['time_since_delivered']}ms")

def claim_stale_messages(worker_id, min_idle_ms=10000):
    """Claim messages đang pending quá lâu"""
    stream_key = "orders:queue"
    group = "payment-workers"

    # XCLAIM: lấy message pending > min_idle_ms gán cho worker mới
    claimed = r.xclaim(
        stream_key, group, worker_id, min_idle_ms,
        r.xpending(stream_key, group)['entries']
    )

    for msg_id, data in claimed:
        print(f"🔄 Worker {worker_id} claimed: {data}")
        # Retry processing
        r.xack(stream_key, group, msg_id)

def trim_stream(max_len=1000):
    """Giữ stream không quá lớn"""
    r.xtrim("orders:queue", maxlen=max_len, approximate=True)
    print(f"✂️  Trimmed stream to {max_len} entries")

# ─── Demo ───
if __name__ == "__main__":
    create_stream()
    produce_orders(3)

    # Run 2 workers in background threads
    import threading

    t1 = threading.Thread(target=worker_loop, args=("worker-1", "orders:queue", "payment-workers"))
    t2 = threading.Thread(target=worker_loop, args=("worker-2", "orders:queue", "payment-workers"))

    t1.start()
    t2.start()

    time.sleep(10)
    get_pending_info()
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Redis Streams
💡 KEY INSIGHT: Stream = append-only log + consumer groups. Message tồn tại sau khi đọc. XACK = acknowledgment. XCLAIM = retry dead-letter.
⚠️ PITFALLS:
  - XREADGROUP với ID != ">" → đọc cả pending
  - Không ACK → memory leak
  - Stream grow vô hạn → XTRIM
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./008-geospatial.md)
