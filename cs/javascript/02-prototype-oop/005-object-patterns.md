# Object Patterns — Freeze, Seal, Descriptors, Factory

## Câu hỏi mở đầu

```javascript
const config = { theme: 'dark', lang: 'vi' };

// Tôi muốn config không bị thay đổi
config.theme = 'light'; // ai đó vô tình sửa

// Có cách nào bảo vệ không?
```

Có: `Object.freeze()`. Nhưng `freeze` có nhiều cấp độ. Và có cả `Object.seal()`, `Object.preventExtensions()`. Cộng với **Property Descriptors** — cách kiểm soát property ở mức độ chi tiết nhất.

---

## 1. Property Descriptors

### Mỗi property có 4 attributes

```javascript
const obj = { name: 'Alice' };

// Đọc descriptor
console.log(Object.getOwnPropertyDescriptor(obj, 'name'));
// {
//   value: 'Alice',
//   writable: true,      // có thể gán lại?
//   enumerable: true,    // có trong Object.keys, for...in?
//   configurable: true  // có thể xóa hoặc thay đổi descriptor?
// }
```

### Định nghĩa descriptor tùy chỉnh

```javascript
const obj = {};

Object.defineProperty(obj, 'name', {
  value: 'Alice',
  writable: false,      // không thể gán lại
  enumerable: true,     // hiện trong Object.keys
  configurable: false  // không thể xóa hoặc thay đổi
});

console.log(obj.name); // 'Alice'
obj.name = 'Bob';      // strict mode: TypeError, non-strict: ignored
console.log(obj.name); // 'Alice' — không đổi
```

### Các loại descriptor

```javascript
// Data descriptor (value + writable)
Object.defineProperty(obj, 'name', {
  value: 'Alice',
  writable: true
});

// Accessor descriptor (get/set)
Object.defineProperty(obj, 'fullName', {
  get() { return `${this.name} Smith`; },
  set(value) { this.name = value.split(' ')[0]; },
  enumerable: true,
  configurable: true
});
```

### Define nhiều properties

```javascript
Object.defineProperties(obj, {
  name: {
    value: 'Alice',
    writable: true,
    enumerable: true,
    configurable: true
  },
  age: {
    value: 30,
    writable: false,
    enumerable: true,
    configurable: false
  }
});
```

---

## 2. Object.preventExtensions()

### Ngăn thêm property mới

```javascript
const obj = { a: 1 };
Object.preventExtensions(obj);

obj.b = 2;   // strict: TypeError, non-strict: silent fail
console.log(obj.b); // undefined

// Vẫn sửa được property hiện tại
obj.a = 10;  // OK
console.log(obj.a); // 10

// Vẫn xóa được property hiện tại
delete obj.a; // OK
```

### Kiểm tra

```javascript
Object.isExtensible(obj); // false
```

---

## 3. Object.seal()

### seal = preventExtensions + prevent modification

```javascript
const obj = { name: 'Alice' };
Object.seal(obj);

obj.name = 'Bob'; // OK — sửa value được
// obj.newProp = 1; // TypeError — không thêm được
// delete obj.name; // TypeError — không xóa được

Object.isSealed(obj); // true
```

| Thao tác | preventExtensions | seal | freeze |
|----------|-----------------|-------|--------|
| Thêm property mới | ❌ | ❌ | ❌ |
| Xóa property | ✅ | ❌ | ❌ |
| Sửa value | ✅ | ✅ | ❌ |

---

## 4. Object.freeze()

### freeze = seal + prevent modification

```javascript
const config = {
  theme: 'dark',
  db: { host: 'localhost' }
};

Object.freeze(config);

config.theme = 'light';   // ignored
config.db.host = 'remote'; // ⚠️ CHỈ freeze 1 level!

console.log(config.theme); // 'dark' — không đổi
console.log(config.db.host); // 'remote' — VẪN ĐỔI! nested object không freeze
```

### Deep freeze

```javascript
function deepFreeze(obj) {
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      deepFreeze(obj[key]);
    }
  }
  return obj;
}

const config = {
  theme: 'dark',
  db: { host: 'localhost', credentials: { user: 'root' } }
};

deepFreeze(config);
config.db.host = 'remote'; // ignored
config.db.credentials.user = 'admin'; // ignored
```

### Kiểm tra

```javascript
Object.isFrozen(obj); // true/false
```

---

## 5. Enumerable — Ẩn Property

### Property ẩn khỏi Object.keys

```javascript
const obj = {};
Object.defineProperty(obj, 'secret', {
  value: 'hidden',
  enumerable: false // ẩn khỏi Object.keys, for...in, JSON.stringify
});

console.log(Object.keys(obj)); // [] — secret không thấy
console.log(obj.secret);      // 'hidden' — vẫn truy cập được

for (const key in obj) {
  console.log(key); // không in gì — secret ẩn
}
```

### JSON.stringify với enumerable

```javascript
const user = {};
Object.defineProperties(user, {
  name: { value: 'Alice', enumerable: true },
  password: { value: 'secret123', enumerable: false }
});

console.log(JSON.stringify(user)); // {"name":"Alice"} — password ẩn
```

---

## 6. Factory Pattern

### Factory function

```javascript
function createUser(name, role) {
  const user = Object.create(User.prototype);
  user.name = name;
  user.role = role;
  return user;
}

// Private state bằng closure
function createBankAccount(initialBalance) {
  const account = {
    deposit(amount) {
      if (amount <= 0) throw new Error('Invalid');
      balance += amount;
    },
    withdraw(amount) {
      if (amount > balance) throw new Error('Insufficient');
      balance -= amount;
    },
    getBalance() { return balance; }
  };

  let balance = initialBalance;
  return account; // closure giữ balance
}
```

### Constructor pattern vs Factory

```javascript
// Constructor
function User(name) {
  this.name = name;
}
const u1 = new User('Alice');

// Factory
function createUser(name) {
  return { name }; // không cần new
}
const u2 = createUser('Bob');

// Factory linh hoạt hơn
function createUser(name, type) {
  const base = { name };
  if (type === 'admin') {
    return { ...base, permissions: ['read', 'write', 'delete'] };
  }
  return { ...base, permissions: ['read'] };
}
```

---

## 7. Các Traps

### Trap 1: freeze không deep

```javascript
const nested = { inner: {} };
const frozen = Object.freeze({ outer: nested });

nested.inner.value = 123; // hoàn toàn hợp lệ
console.log(frozen.outer.inner.value); // 123 — không freeze!
```

### Trap 2: Configurable = false không thể thay đổi

```javascript
const obj = {};
Object.defineProperty(obj, 'fixed', {
  value: 42,
  configurable: false // ❌ không thể xóa hoặc thay đổi descriptor
});

// Object.defineProperty(obj, 'fixed', { writable: true }); // TypeError
```

### Trap 3: for...in đi qua enumerable: false

```javascript
const obj = {};
Object.defineProperty(obj, 'hidden', { value: 'x', enumerable: false });

for (const k in obj) { console.log(k); } // không in gì
Object.keys(obj); // []
Object.getOwnPropertyNames(obj); // ['hidden'] — getOwnPropertyNames thấy tất cả
```

---

## 8. Câu Hỏi Phỏng Vấn

### Câu 1: freeze vs seal

```javascript
const obj = { a: 1 };
Object.freeze(obj);
Object.seal(obj);

console.log(Object.isFrozen(obj)); // ?
console.log(Object.isSealed(obj)); // ?
```

**Trả lời:** `true, true` — freeze cũng seal

---

### Câu 2: Enumerable

```javascript
const obj = {};
Object.defineProperty(obj, 'x', { value: 1, enumerable: false });

console.log(Object.keys(obj)); // ?
console.log(Object.getOwnPropertyNames(obj)); // ?
```

**Trả lời:** `[]`, `['x']`

---

### Câu 3: Writable

```javascript
const obj = {};
Object.defineProperty(obj, 'x', { value: 1, writable: false });

obj.x = 999;
console.log(obj.x); // ?
```

**Trả lời:** `1` — non-strict mode: ignored; strict mode: TypeError

---

### Câu 4: Deep freeze

```javascript
const user = { profile: { age: 30 } };
Object.freeze(user);
user.profile.age = 99;

console.log(user.profile.age); // ?
```

**Trả lời:** `99` — nested object không freeze

---

## 9. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  OBJECT PROTECTION                                         │
│                                                         │
│  preventExtensions: ngăn thêm property MỚI              │
│  seal: preventExtensions + ngăn xóa                    │
│  freeze: seal + ngăn sửa value                      │
│                                                         │
│  ⚠️ freeze/seal chỉ 1 level — nested objects tự do    │
│  ⚠️ Descriptor: configurable: false → không thay đổi │
│  ⚠️ enumerable: false → ẩn khỏi Object.keys       │
│  ⚠️ writable: false → không gán lại value          │
└─────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Phân biệt được freeze, seal, preventExtensions
- [ ] Dùng được Object.defineProperty với descriptors
- [ ] Hiểu deep freeze và hạn chế của freeze
- [ ] Trả lời được các câu hỏi phỏng vấn

---

*Last updated: 2026-03-31*
