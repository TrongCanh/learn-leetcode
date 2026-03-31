# 028 — Session Store

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | Session, JWT, Stateless, TTL |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Session Store Pattern

```
┌──────────────────────────────────────────────────────────────┐
│                    SESSION STORE                                        │
│                                                               │
│  Session = User state on server                                  │
│  Session ID = Unique token → Store in Redis                     │
│                                                               │
│  Request → Session ID → Redis lookup → Get user state          │
│                                                               │
│  Benefits:                                                     │
│  ├── Fast lookup (Redis = O(1))                            │
│  ├── TTL = automatic expiration                            │
│  ├── Scalable (many servers → same Redis)                 │
│  └── Simple invalidation                                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 2. Implementation

```python
import redis
import json
import secrets

r = redis.Redis(decode_responses=True)

def create_session(user_id, ttl=3600):
    """Tạo session mới"""
    session_id = secrets.token_urlsafe(32)
    key = f"session:{session_id}"
    data = {
        "user_id": user_id,
        "created_at": time.time(),
        "ip": get_client_ip()
    }
    r.setex(key, ttl, json.dumps(data))
    return session_id

def get_session(session_id):
    """Lấy session"""
    key = f"session:{session_id}"
    data = r.get(key)
    if data:
        r.expire(key, 3600)  # Refresh TTL
        return json.loads(data)
    return None

def delete_session(session_id):
    """Xóa session (logout)"""
    r.delete(f"session:{session_id}")
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Session Store
💡 KEY INSIGHT: Session ID → Redis → Fast + Scalable + TTL.
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./029-leaderboard.md)
