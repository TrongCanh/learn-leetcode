# 012 — Lua Scripting

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🔴 Hard |
| **Chủ đề** | EVAL, EVALSHA, Lua, Atomic scripts, Custom logic |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Lua Scripting là gì?

**Lua scripting = chạy custom logic trực tiếp trên Redis server, atomic, không race condition.**

```
┌──────────────────────────────────────────────────────────────┐
│                    LUA SCRIPTING                                │
│                                                               │
│  Without Lua:                                                │
│    App ──── GET key ────► Redis (RTT 1)                  │
│    App ◄─── value ──── Redis (RTT 2)                   │
│    App ──── INCR ──────► Redis (RTT 3)                   │
│    App ◄─── new ──────── Redis (RTT 4)                   │
│    → 4 Round Trips, Race condition possible               │
│                                                               │
│  With Lua:                                                  │
│    App ──── EVAL script ────► Redis                         │
│                                       [Lua runs atomically]  │
│                                       [No other commands]   │
│                                       [All in 1 RTT]       │
│    App ◄─── result ─────── Redis                           │
│    → 1 Round Trip, 100% Atomic                            │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 2. Basic EVAL

```bash
# ─── EVAL ───
# EVAL script numkeys key [key ...] arg [arg ...]

# Ví dụ đơn giản: GET + INCR + GET
EVAL "
  local current = redis.call('GET', KEYS[1])
  local value = tonumber(current) or 0
  redis.call('INCRBY', KEYS[1], 1)
  local new = redis.call('GET', KEYS[1])
  return new
" 1 "counter:1"
# → Lấy, tăng 1, trả về giá trị mới
# → Atomic!

# Keys và Args:
EVAL "
  return ARGV[1]
" 0 "hello"        # → "hello"

EVAL "
  return KEYS[1]
" 1 "mykey"         # → "mykey"

EVAL "
  return #KEYS .. ' keys and ' .. #ARGV .. ' args'
" 2 "k1" "k2" "a1" "a2"
# → "2 keys and 2 args"
```

### 🔍 3. Lua Data Types

```
┌──────────────────────────────────────────────────────────────┐
│                    LUA ↔ REDIS MAPPING                          │
│                                                               │
│  Lua nil           → Redis nil (no value)                     │
│  Lua number         → Redis integer                            │
│  Lua string         → Redis bulk string                       │
│  Lua table         → Redis array (1-indexed)               │
│  Lua boolean false → Redis nil (special case)                │
│                                                               │
│  Redis array (multi-bulk) → Lua table                        │
│                                                               │
│  redis.call(cmd, ...)  → Execute command, error = throw     │
│  redis.pcall(cmd, ...) → Execute command, error = return     │
│  redis.log(level, msg) → Log message to Redis log           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 4. Common Patterns

```lua
-- ─── Atomic INCR với Limit ───
EVAL "
  local current = tonumber(redis.call('GET', KEYS[1])) or 0
  local limit = tonumber(ARGV[1])
  if current < limit then
    redis.call('INCR', KEYS[1])
    return current + 1
  else
    return -1  -- rate limited
  end
" 1 "rate:user:1" 100

-- ─── Distributed Lock ───
EVAL "
  if redis.call('SETNX', KEYS[1], ARGV[1]) == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[2])
    return 1
  else
    return 0
  end
" 1 "lock:order:123" "machine:1" 30

-- ─── Moving Head to Tail (List) ───
EVAL "
  local len = tonumber(redis.call('LLEN', KEYS[1]))
  if len > 0 then
    local item = redis.call('LPOP', KEYS[1])
    redis.call('RPUSH', KEYS[1], item)
    return item
  else
    return nil
  end
" 1 "queue:jobs"

-- ─── Rate Limiter với Sliding Window ───
EVAL "
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])

  -- Remove old entries
  redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)

  -- Count current
  local count = redis.call('ZCARD', key)

  if count < limit then
    redis.call('ZADD', key, now, now)
    redis.call('EXPIRE', key, window)
    return 1  -- allowed
  else
    return 0  -- denied
  end
" 1 "rate:1.2.3.4" 10 60 1709301234
```

### 🔍 5. EVALSHA — Script Caching

```bash
# ─── SCRIPT LOAD ───
SCRIPT LOAD "
  local val = redis.call('INCR', KEYS[1])
  return val
"
# → "a42059a2c5eaa1cbe70d1d5a3e6e1c8e8e2b4a2"
# → Trả về SHA1 hash của script

# ─── EVALSHA ───
EVALSHA "a42059a2c5eaa1cbe70d1d5a3e6e1c8e8e2b4a2" 1 "counter:1"
# → Chạy script đã cached bằng SHA1
# → Nhanh hơn EVAL (không cần gửi lại script)

# ─── SCRIPT EXISTS ───
SCRIPT EXISTS "a42059a2c5eaa1cbe70d1d5a3e6e1c8e8e2b4a2"
# → [1] = script tồn tại
# → [0] = script không tồn tại
```

### 🔍 6. Error Handling

```lua
-- redis.call() → throw on error
EVAL "
  redis.call('GET', 'nonexistent_key')  -- OK
  redis.call('SMEMBER', 'not_a_set')     -- WRONG TYPE error → thrown
  return 'never reached'
" 0

-- redis.pcall() → catch error, return as table
EVAL "
  local ok, err = redis.pcall('SMEMBER', 'not_a_set')
  if not ok then
    return 'Error: ' .. err
  end
  return ok
" 0
```

---

## 🧠 Phân tích & Hướng tư tư

### 🤔 Lua vs WATCH — So sánh

```
WATCH + MULTI/EXEC:
  ✅ Dùng khi logic simple
  ✅ Có retry tự động
  ❌ Nhiều round trips (mỗi retry = WATCH → GET → EXEC)
  ❌ Nếu conflict nhiều → performance drop

Lua Script:
  ✅ Chạy atomic trong 1 round trip
  ✅ Không có retry (vì không bao giờ fail vì race)
  ❌ Script phức tạp hơn
  ❌ Script dài → Redis blocked trong thời gian chạy

→ Simple logic → WATCH
→ Complex / High contention → Lua
→ Nhiều commands → Lua (ít RTT hơn)
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Script quá lâu** | Redis blocked trong khi script chạy. Script nên < 1ms |
| **Scripting không idempotent** | EVAL chạy mỗi lần → nếu script thay đổi state không idempotent → lỗi |
| **Dùng Lua thay vì Lua cần thiết** | Nhiều use cases dùng MULTI/EXEC đủ |
| **Không dùng EVALSHA** | EVAL gửi script mỗi lần → bandwidth waste. Dùng SCRIPT LOAD → EVALSHA |

### 🔑 Key Insight

> **Lua scripts = custom atomic logic chạy trên Redis server. 1 RTT duy nhất. 100% atomic. EVALSHA = cache script bằng SHA1 để reuse. Script nên ngắn và nhanh.**

---

## ✅ Ví dụ Python

```python
import redis

r = redis.Redis(host='localhost', port=6379, db=0)

# ─── Script Registry ───
scripts = {
    "rate_limiter": """
        local key = KEYS[1]
        local limit = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])

        -- Remove old entries (outside window)
        redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)

        -- Count current entries
        local count = redis.call('ZCARD', key)

        if count < limit then
            -- Add new entry
            redis.call('ZADD', key, now, now)
            -- Set expiry
            redis.call('EXPIRE', key, window)
            return {1, limit - count - 1}  -- allowed, remaining
        else
            return {0, 0}  -- denied, remaining
        end
    """,

    "distributed_lock": """
        local lock_key = KEYS[1]
        local lock_value = ARGV[1]
        local ttl = tonumber(ARGV[2])

        if redis.call('SETNX', lock_key, lock_value) == 1 then
            redis.call('EXPIRE', lock_key, ttl)
            return 1  -- acquired
        else
            return 0  -- not acquired
        end
    """,

    "safe_decrement": """
        local key = KEYS[1]
        local current = tonumber(redis.call('GET', key)) or 0
        local decrement = tonumber(ARGV[1])

        if current >= decrement then
            return redis.call('DECRBY', key, decrement)
        else
            return nil  -- insufficient balance
        end
    """
}

def load_scripts():
    """Load tất cả scripts vào Redis"""
    sha_hashes = {}
    for name, script in scripts.items():
        sha = r.script_load(script)
        sha_hashes[name] = sha
        print(f"✅ Loaded script '{name}': {sha[:16]}...")
    return sha_hashes

def rate_limit(key, limit=100, window=60):
    """Rate limit với Lua script"""
    import time
    now = int(time.time())
    result = r.evalsha(
        sha_hashes["rate_limiter"], 1, key, limit, window, now
    )
    allowed = result[0] == 1
    remaining = result[1]
    return allowed, remaining

def acquire_lock(lock_name, owner_id, ttl=30):
    """Acquire distributed lock"""
    result = r.evalsha(
        sha_hashes["distributed_lock"], 1,
        f"lock:{lock_name}", owner_id, ttl
    )
    return result == 1

def safe_decrement(key, amount):
    """Decrement chỉ nếu đủ balance"""
    result = r.evalsha(
        sha_hashes["safe_decrement"], 1, key, amount
    )
    return result  # None = insufficient, integer = new balance

# ─── Demo ───
if __name__ == "__main__":
    sha_hashes = load_scripts()

    print("\n=== Rate Limiter ===")
    key = "rate:test:user1"
    for i in range(5):
        allowed, remaining = rate_limit(key, limit=3, window=60)
        print(f"Request {i+1}: {'✅' if allowed else '🚫'} (remaining: {remaining})")

    print("\n=== Distributed Lock ===")
    lock_name = "order:12345"
    owner1 = "worker:1"
    owner2 = "worker:2"

    acquired1 = acquire_lock(lock_name, owner1, ttl=10)
    acquired2 = acquire_lock(lock_name, owner2, ttl=10)
    print(f"Worker 1 acquired: {acquired1}")
    print(f"Worker 2 acquired: {acquired2}")

    # Release
    r.delete(f"lock:{lock_name}")

    print("\n=== Safe Decrement ===")
    r.set("balance:account:1", 100)
    result1 = safe_decrement("balance:account:1", 30)
    print(f"Decrement 30: {result1}")  # 70
    result2 = safe_decrement("balance:account:1", 100)
    print(f"Decrement 100: {result2}")  # None (insufficient)
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Redis Lua Scripting
💡 KEY INSIGHT: Lua = atomic stored procedure trên Redis. 1 RTT duy nhất. EVALSHA = cache bằng SHA. Script nên ngắn (< 1ms).
⚠️ PITFALLS:
  - Script quá lâu → Redis blocked
  - Dùng EVAL thay vì EVALSHA → waste bandwidth
  - Lua không có rollback → phải handle errors trong script
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./013-pipelines.md)
