# 011 — Transactions

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | MULTI, EXEC, WATCH, DISCARD, Transactions, Optimistic Locking |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Redis Transactions là gì?

**Redis Transactions = batch commands chạy atomic (tuần tự, không can thiệp).**

```
Redis Transactions ≠ ACID transactions như database

Redis Transaction = Atomic Batch:
  1. MULTI: Bắt đầu transaction
  2. Commands: Các lệnh được QUEUE (chưa chạy)
  3. EXEC: Tất cả commands CHẠY CÙNG LÚC

→ Commands không can thiệp lẫn nhau
→ Không có rollback (Redis không hỗ trợ)
```

### 🔍 2. Basic Operations

```bash
# ─── MULTI / EXEC ───
MULTI
INCR counter
INCR counter
INCR counter
EXEC
# → 1) (integer) 1
# → 2) (integer) 2
# → 3) (integer) 3

# ─── DISCARD ───
MULTI
SET key "value"
GET key
DISCARD
# → Transaction bị hủy, commands bị quên

# ─── Inline Transaction ───
# Ngay sau EXEC, tất cả results trả về cùng lúc
MULTI
HSET user:100 name "Alice" age 30
HSET user:100 email "alice@x.com"
EXEC
```

### 🔍 3. WATCH — Optimistic Locking

**WATCH = "Nếu key thay đổi giữa WATCH và EXEC → EXEC sẽ FAIL."**

```bash
# ─── Problem: Race Condition ───
# Thread A: GET balance → 100
# Thread B: GET balance → 100
# Thread A: SET balance = 100 + 50 = 150
# Thread B: SET balance = 100 + 30 = 130  ← WRONG! Should be 180

# ─── Solution: WATCH ───
WATCH account:balance
current = GET account:balance        # → "100"

# Kiểm tra business logic
new_balance = current + 50

MULTI
SET account:balance new_balance
EXEC
# → Nếu account:balance thay đổi → EXEC returns null
# → Retry: WATCH lại → GET → MULTI → EXEC
```

### 🔍 4. Retry Pattern với WATCH

```python
import redis

r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def transfer_funds(from_account, to_account, amount, max_retries=5):
    """
    Transfer funds với optimistic locking (WATCH)
    """
    key = f"account:{from_account}:balance"
    retry = 0

    while retry < max_retries:
        # WATCH the balance
        r.watch(key)

        # Đọc balance hiện tại
        current = r.get(key)
        if current is None:
            r.unwatch()
            raise ValueError(f"Account {from_account} not found")

        balance = float(current)
        if balance < amount:
            r.unwatch()
            raise ValueError(f"Insufficient funds: {balance} < {amount}")

        new_balance = balance - amount

        # Thử execute transaction
        pipe = r.pipeline()
        pipe.multi()
        pipe.set(f"account:{from_account}:balance", new_balance)
        pipe.set(f"account:{to_account}:balance",
                 float(r.get(f"account:{to_account}:balance") or 0) + amount)
        try:
            pipe.execute()
            print(f"✅ Transferred ${amount} from {from_account} to {to_account}")
            return True
        except redis.WatchError:
            # Key changed → retry
            print(f"⚠️  Retry {retry + 1}: key changed")
            retry += 1
            continue

    raise Exception(f"Transaction failed after {max_retries} retries")
```

### 🔍 5. Lua Scripting (Atomic Alternative)

```bash
# ─── EVAL ───
# Lua script chạy ATOMIC trên Redis server
EVAL "
  local balance = redis.call('GET', KEYS[1])
  if tonumber(balance) >= tonumber(ARGV[1]) then
    redis.call('DECRBY', KEYS[1], ARGV[1])
    redis.call('INCRBY', KEYS[2], ARGV[1])
    return 1
  else
    return 0
  end
" 2 "account:1:balance" "account:2:balance" 50

# → 1 = thành công
# → 0 = insufficient funds
```

---

## 🧠 Phân tích & Hướng tư tư

### 🤔 WATCH vs Lua Script — Khi nào dùng?

```
WATCH (Optimistic Locking):
  ✅ Dùng khi conflict HIẾM KHI XẢY RA
  ✅ Read → Check → Write pattern
  ✅ Retry nếu fail
  ❌ Nhiều retries → performance drop
  ❌ Cần application-level retry loop

Lua Script (Atomic):
  ✅ Chạy atomic trên server
  ✅ Không có race condition
  ✅ Không cần retry
  ❌ Script phức tạp hơn
  ❌ Script dài → Redis blocked

→ Simple check → Lua
→ Complex business logic → WATCH + application code
→ High contention → Lua
→ Rare conflicts → WATCH
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Tưởng Redis có rollback** | Redis transactions KHÔNG rollback. Nếu EXEC fail → không làm gì |
| **Dùng WATCH mà không retry** | WATCH có thể fail → phải retry |
| **Dùng WATCH trong MULTI** | WATCH phải OUTSIDE MULTI. WATCH → MULTI → EXEC |
| **Transaction với commands không liên quan** | Nên GROUP commands liên quan vào 1 transaction |

### 🔑 Key Insight

> **Redis Transactions (MULTI/EXEC) = batch commands atomic. WATCH = optimistic locking. Lua = stored procedure atomic. Redis KHÔNG có rollback. WATCH fail → retry in application.**

---

## ✅ Ví dụ Python

```python
import redis

r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# ─── Simple Transaction ───
def batch_inventory_update(product_id, quantity_change):
    """
    Update inventory với transaction
    - Tăng quantity
    - Update last_modified timestamp
    """
    pipe = r.pipeline()
    pipe.incrby(f"product:{product_id}:qty", quantity_change)
    pipe.set(f"product:{product_id}:last_modified", int(time.time()))
    results = pipe.execute()

    print(f"✅ Updated product {product_id}: qty change = {quantity_change}")
    return results

# ─── Inventory Transfer với WATCH ───
def transfer_inventory(from_product, to_product, quantity):
    """Chuyển inventory giữa 2 products"""
    from_key = f"product:{from_product}:qty"
    to_key = f"product:{to_product}:qty"

    max_retries = 3
    for attempt in range(max_retries):
        try:
            # WATCH both keys
            r.watch(from_key, to_key)

            from_qty = int(r.get(from_key) or 0)
            to_qty = int(r.get(to_key) or 0)

            if from_qty < quantity:
                r.unwatch()
                raise ValueError(f"Insufficient inventory: {from_qty} < {quantity}")

            pipe = r.pipeline()
            pipe.multi()
            pipe.set(from_key, from_qty - quantity)
            pipe.set(to_key, to_qty + quantity)
            pipe.execute()

            print(f"✅ Transferred {quantity} from {from_product} to {to_product}")
            return True

        except redis.WatchError:
            print(f"⚠️  Attempt {attempt + 1} failed (concurrent modification)")
            continue

    raise Exception("Transfer failed after max retries")

# ─── Shopping Cart Checkout ───
def checkout(cart_key, inventory_prefix):
    """Checkout với nhiều items"""
    cart_items = r.smembers(cart_key)  # items:product_id:qty

    if not cart_items:
        print("🛒 Cart is empty")
        return False

    max_retries = 3
    for attempt in range(max_retries):
        try:
            # WATCH all inventory keys
            keys_to_watch = []
            for item in cart_items:
                _, product_id, qty = item.split(":")
                keys_to_watch.append(f"{inventory_prefix}{product_id}:qty")

            if keys_to_watch:
                r.watch(*keys_to_watch)

            # Check inventory
            insufficient = []
            for item in cart_items:
                _, product_id, qty = item.split(":")
                available = int(r.get(f"{inventory_prefix}{product_id}:qty") or 0)
                if available < int(qty):
                    insufficient.append(product_id)

            if insufficient:
                r.unwatch()
                print(f"❌ Insufficient inventory for: {insufficient}")
                return False

            # Deduct inventory
            pipe = r.pipeline()
            pipe.multi()
            for item in cart_items:
                _, product_id, qty = item.split(":")
                pipe.decrby(f"{inventory_prefix}{product_id}:qty", qty)

            # Clear cart
            pipe.delete(cart_key)

            pipe.execute()
            print(f"✅ Checkout completed for cart {cart_key}")
            return True

        except redis.WatchError:
            print(f"⚠️  Retry {attempt + 1}")
            continue

    return False

# ─── Demo ───
if __name__ == "__main__":
    import time

    # Setup
    r.set("product:1:qty", 100)
    r.set("product:2:qty", 50)
    r.set("account:1:balance", 1000)
    r.set("account:2:balance", 500)

    print("=== Simple Transaction ===")
    batch_inventory_update(1, -5)

    print("\n=== Inventory Transfer ===")
    transfer_inventory(1, 2, 10)
    print(f"Product 1 qty: {r.get('product:1:qty')}")
    print(f"Product 2 qty: {r.get('product:2:qty')}")

    print("\n=== Watch Retry ===")
    transfer_funds(1, 2, 100)
    print(f"Account 1 balance: {r.get('account:1:balance')}")
    print(f"Account 2 balance: {r.get('account:2:balance')}")
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Redis Transactions
💡 KEY INSIGHT: MULTI/EXEC = atomic batch. WATCH = optimistic locking (retry if fail). Redis KHÔNG có rollback.
⚠️ PITFALLS:
  - Redis không rollback
  - WATCH fail → phải retry
  - WATCH phải OUTSIDE MULTI
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./012-lua-scripting.md)
