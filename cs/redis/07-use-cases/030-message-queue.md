# 030 — Message Queue

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Message Queue, Job Queue, Reliable Queue |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Message Queue với Redis

```
┌──────────────────────────────────────────────────────────────┐
│                 MESSAGE QUEUE                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Simple Queue (Lists):                                        │
│  RPUSH → LPOP (FIFO)                                        │
│  ⚠️ Message có thể mất khi worker crash                     │
│                                                               │
│  Reliable Queue (Lists + BRPOPLPUSH):                       │
│  BRPOPLPUSH → LPOP (processing queue)                    │
│  ✅ Message được backup khi đang xử lý                      │
│  ✅ Worker restart → message vẫn còn                         │
│                                                               │
│  Job Queue (Streams):                                        │
│  XADD → XREADGROUP consumer groups                        │
│  ✅ Built-in acknowledgment                               │
│  ✅ Consumer groups                                        │
│  ✅ Message persistence                                      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 2. Reliable Queue

```python
def enqueue(queue, job):
    """Producer: thêm job vào queue"""
    r.rpush(f"queue:{queue}", json.dumps(job))

def process_queue(queue, timeout=0):
    """Worker: process với reliable queue"""
    result = r.brpoplpush(
        f"queue:{queue}",           # Source
        f"queue:{queue}:processing", # Dest (backup)
        timeout=timeout
    )
    if result:
        job = json.loads(result)
        # Process job
        process(job)
        # Done → remove from processing
        r.lrem(f"queue:{queue}:processing", 1, result)
    return job
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Message Queue
💡 KEY INSIGHT: BRPOPLPUSH = reliable queue. Streams = full-featured queue.
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./031-vector-search.md)
