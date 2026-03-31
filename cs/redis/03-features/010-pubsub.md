# 010 — Pub/Sub

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | Pub/Sub, PUBLISH, SUBSCRIBE, PSUBSCRIBE, Real-time, Notifications |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Redis Pub/Sub là gì?

**Pub/Sub = Publish/Subscribe = pattern cho real-time messaging.** Publisher gửi message vào channel, subscribers nhận message từ channel đó.

```
┌──────────────────────────────────────────────────────────────┐
│                    REDIS PUB/SUB                                │
│                                                               │
│  Publisher                                                   │
│     │                                                         │
│     │ PUBLISH "news:tech" "Redis 7.2 released!"            │
│     ▼                                                         │
│  ┌──────────────────────────────────────────────────────┐ │
│  │             CHANNEL: "news:tech"                       │ │
│  └──────────────────────────────────────────────────────┘ │
│     │                                                         │
│     ├──► Subscriber A ── receives ──► handle_message()    │
│     ├──► Subscriber B ── receives ──► handle_message()    │
│     └──► Subscriber C ── receives ──► handle_message()    │
│                                                               │
│  → Fire-and-forget: publisher không biết ai nhận          │
│  → Message không persist (nếu subscriber offline → miss) │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 2. Basic Operations

```bash
# ─── SUBSCRIBE ─── (Terminal 1: Subscriber)
SUBSCRIBE news:tech news:sports
# Reading messages... (blocks)
# 1) "subscribe"
# 2) "news:tech"
# 3) 1
# 1) "message"
# 2) "news:tech"
# 3) "Redis 7.2 released!"

# ─── PUBLISH ─── (Terminal 2: Publisher)
PUBLISH news:tech "Redis 7.2 released!"
# → 1 (1 subscriber nhận được)

PUBLISH news:sports "Lakers win!"
# → 0 (không có subscriber nào đang subscribe news:sports)

# ─── UNSUBSCRIBE ───
UNSUBSCRIBE news:tech
# → Hủy subscribe khỏi news:tech

# ─── PUBSUB CHANNELS ───
PUBSUB CHANNELS
# → Danh sách channels đang active
PUBSUB CHANNELS news:*
# → Channels matching pattern
```

### 🔍 3. Pattern Subscribe

```bash
# ─── PSUBSCRIBE ─── (Pattern Subscribe)
PSUBSCRIBE "news:*"
# → Subscribe tất cả channels bắt đầu bằng "news:"
# news:tech, news:sports, news:politics...

# Patterns:
# *    = bất kỳ chuỗi nào
# ?    = 1 ký tự bất kỳ
# [abc] = a hoặc b hoặc c

# ─── PUNSUBSCRIBE ───
PUNSUBSCRIBE "news:*"
# → Hủy pattern subscribe
```

### 🔍 4. Pub/Sub vs Streams

```
┌─────────────────────────────────────────────────────────────┐
│           PUB/SUB vs STREAMS vs LISTS                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Pub/Sub:                                                   │
│  ├── Fire-and-forget                                        │
│  ├── Message KHÔNG persist                                 │
│  ├── Subscriber offline = MISS message                     │
│  ├── No consumer groups                                     │
│  ├── O(1) publish                                          │
│  └── Dùng cho: real-time notifications, chat             │
│                                                               │
│  Streams:                                                   │
│  ├── Message PERSIST trong stream                         │
│  ├── Consumer groups                                        │
│  ├── ACK (xác nhận đã xử lý)                             │
│  ├── Replay (đọc lại message cũ)                         │
│  ├── Dùng cho: job queues, event sourcing                 │
│                                                               │
│  Lists (LPUSH/BLPOP):                                      │
│  ├── Message persist trong list                           │
│  ├── Single consumer (queue semantics)                    │
│  ├── No consumer groups                                     │
│  └── Dùng cho: simple queues                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 🔍 5. Use Cases

```
┌──────────────────────────────────────────────────────────────┐
│                PUB/SUB USE CASES                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. REAL-TIME NOTIFICATIONS                                 │
│     PUBLISH notifications:user:100 "New order arrived"    │
│     → User 100's app nhận được notification               │
│                                                               │
│  2. CHAT / LIVE MESSAGES                                  │
│     PUBLISH chat:room:1 "user:alice:Hello everyone!"    │
│     → Tất cả users trong room nhận được                   │
│                                                               │
│  3. LIVE DASHBOARD UPDATES                                 │
│     PUBLISH metrics:server:1 '{"cpu":80,"mem":60}'       │
│     → Dashboard update real-time                            │
│                                                               │
│  4. CACHE INVALIDATION                                    │
│     PUBLISH cache:invalidate "user:100"                   │
│     → Tất cả app servers xóa cache của user:100          │
│                                                               │
│  5. MICROSERVICES / EVENT BUS                             │
│     PUBLISH events:order "order:123 created"             │
│     → Inventory service, Shipping service nhận event        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧠 Phân tích & Hướng tư tư

### 🤔 Pub/Sub Reliability

```
⚠️ Pub/Sub KHÔNG reliable:

Problem:
  1. Publisher gửi message
  2. Subscriber nhận được
  3. Subscriber CRASH trước khi xử lý
  → Message mất!

Solution: Dùng Redis Streams với ACK
  1. XADD stream → message persisted
  2. XREADGROUP consumer → nhận message
  3. XACK → xác nhận đã xử lý
  → Message vẫn còn trong stream nếu chưa ACK

→ Real-time, không cần guarantee → Pub/Sub
→ Cần guarantee → Streams
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Dùng Pub/Sub cho critical messages** | Message không persist → subscriber offline → miss. Dùng Streams |
| **Subscriber xử lý chậm** | Redis Pub/Sub là single-threaded → tất cả subscribers bị delay |
| **Quên UNSUBSCRIBE** | Subscriber không dùng nữa nhưng vẫn nhận messages |
| **Pattern matching nhiều** | PSUBSCRIBE "news:*" → nhiều matches → duplicate messages |
| **Pub/Sub không cross-databases** | SUBSCRIBE chỉ trên db0 mặc định |

### 🔑 Key Insight

> **Pub/Sub = Fire-and-forget real-time messaging. Message không persist. Subscriber offline = miss. Dùng cho: notifications, live updates, chat. Cần reliability → dùng Streams.**

---

## ✅ Ví dụ Python

```python
import redis
import threading
import time

r = redis.Redis(host='localhost', port=6379, db=0)
pubsub = r.pubsub()

def publisher_loop():
    """Publisher: gửi messages định kỳ"""
    print("📤 Publisher started")

    channels = ["notifications", "news:tech", "news:sports"]

    for i in range(10):
        channel = channels[i % len(channels)]
        message = f"Message #{i} to {channel}"
        subscribers = r.publish(channel, message)
        print(f"📤 Published to {channel}: '{message}' → {subscribers} subscriber(s)")
        time.sleep(1)

    print("📤 Publisher finished")

def subscriber_notifications():
    """Subscriber cho notifications"""
    pubsub.subscribe("notifications")
    print("🔔 Subscribed to 'notifications'")

    for message in pubsub.listen():
        if message["type"] == "message":
            print(f"🔔 NOTIFICATION: {message['data']}")

def subscriber_pattern():
    """Subscriber dùng pattern"""
    pubsub.psubscribe("news:*")
    print("📰 Subscribed to 'news:*' pattern")

    for message in pubsub.listen():
        if message["type"] == "pmessage":
            print(f"📰 NEWS [{message['channel']}]: {message['data']}")

# ─── Reliable Pub/Sub: Cache Invalidation ───
def invalidate_cache(channel, pattern="cache:invalidate:*"):
    """Khi data thay đổi → invalidate cache"""
    message = channel  # Channel = key cần invalidate
    r.publish("cache:invalidate", message)
    print(f"🗑️  Cache invalidation: {message}")

def cache_invalidation_subscriber():
    """App server: nhận invalidate signal"""
    pub = r.pubsub()
    pub.subscribe("cache:invalidate")

    for message in pub.listen():
        if message["type"] == "message":
            cache_key = message["data"]
            # Xóa cache tương ứng
            r.delete(cache_key)
            print(f"🗑️  Invalidated cache: {cache_key}")

# ─── Chat Room ───
def send_chat_message(room, username, message):
    """Gửi message vào chat room"""
    chat_message = f"[{username}]: {message}"
    r.publish(f"chat:room:{room}", chat_message)

def chat_room_subscriber(room, username):
    """Subscribe vào chat room"""
    pub = r.pubsub()
    pub.subscribe(f"chat:room:{room}")

    print(f"💬 Joined chat room: {room} as {username}")
    for message in pub.listen():
        if message["type"] == "message":
            if message["data"].startswith(f"[{username}]"):
                continue  # Skip own messages
            print(f"💬 {message['data']}")

# ─── Demo ───
if __name__ == "__main__":
    import threading

    # Start subscribers in background threads
    t1 = threading.Thread(target=subscriber_notifications)
    t2 = threading.Thread(target=subscriber_pattern)

    t1.start()
    t2.start()

    # Give subscribers time to subscribe
    time.sleep(0.5)

    # Start publisher
    publisher_loop()
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Redis Pub/Sub
💡 KEY INSIGHT: Pub/Sub = fire-and-forget. Message không persist. Subscriber offline = miss. Dùng cho real-time notifications, không dùng cho reliable messaging.
⚠️ PITFALLS:
  - Pub/Sub không reliable → dùng Streams
  - Subscriber xử lý chậm → block các subscribers khác
  - Message không persist
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./011-transactions.md)
