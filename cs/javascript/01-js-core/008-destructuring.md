# Destructuring — Đọc Object và Array Như Chuyên Gia

## Câu hỏi mở đầu

```javascript
const response = {
  data: {
    user: {
      name: 'Alice',
      age: 30,
      address: {
        city: 'Hanoi',
        country: 'Vietnam'
      }
    }
  },
  status: 200
};

// Lấy name và city — cách cũ:
const name1 = response.data.user.name;
const city1 = response.data.user.address.city;

// Destructuring:
const { data: { user: { name, address: { city } } } } = response;
console.log(name, city); // Alice Hanoi
```

Destructuring không chỉ là syntax sugar — nó cho phép **đặt tên biến**, **set default**, **bỏ qua phần không cần**, và **rest**.

---

## 1. Array Destructuring

### 1a. Cơ bản

```javascript
const [a, b, c] = [1, 2, 3];
console.log(a, b, c); // 1 2 3

// Bỏ qua phần tử
const [first, , third] = [10, 20, 30];
console.log(first, third); // 10 30

// Swap không cần biến tạm
let x = 1, y = 2;
[x, y] = [y, x];
console.log(x, y); // 2 1
```

### 1b. Rest operator

```javascript
const [head, ...tail] = [1, 2, 3, 4, 5];
console.log(head); // 1
console.log(tail); // [2, 3, 4, 5]

// Lấy phần tử cuối
const [first, ...rest] = [10, 20, 30];
```

### 1c. Default values

```javascript
const [a = 1, b = 2, c = 3] = [10, undefined, null];
console.log(a, b, c); // 10, 2, null
// undefined → dùng default
// null → KHÔNG dùng default (null != undefined)
```

### 1d. Nested array

```javascript
const [[a, b], c] = [[1, 2], 3];
console.log(a, b, c); // 1, 2, 3

const [first, [second, third]] = [1, [2, 3], 4];
console.log(first, second, third); // 1, 2, 3
```

---

## 2. Object Destructuring

### 2a. Cơ bản

```javascript
const { name, age } = { name: 'Alice', age: 30, city: 'Hanoi' };
console.log(name, age); // Alice 30
```

### 2b. Đặt tên khác (alias)

```javascript
const { name: userName, age: userAge } = { name: 'Alice', age: 30 };
console.log(userName, userAge); // Alice 30
console.log(name); // ReferenceError — không có biến `name`
```

### 2c. Default values

```javascript
const { name = 'Anonymous', score = 0, grade = 'N/A' } = {
  name: 'Bob',
  score: 85
};
console.log(name, score, grade); // Bob, 85, N/A
```

### 2d. Nested object

```javascript
const {
  user: {
    name,
    profile: { avatar, bio }
  }
} = {
  user: {
    name: 'Alice',
    profile: { avatar: 'url', bio: 'Developer' }
  }
};
console.log(name, avatar, bio); // Alice url Developer
```

### 2e. Rest trong object destructuring

```javascript
const { name, age, ...remaining } = {
  name: 'Alice',
  age: 30,
  city: 'Hanoi',
  hobby: 'reading',
  lang: 'Vietnamese'
};
console.log(name, age); // Alice 30
console.log(remaining); // { city: 'Hanoi', hobby: 'reading', lang: 'Vietnamese' }
```

---

## 3. Trong Function Parameters

### 3a. Object destructuring parameter

```javascript
// ❌ Verbose
function createUser(userData) {
  const name = userData.name;
  const age = userData.age;
  const email = userData.email;
}

// ✅ Destructuring
function createUser({ name, age, email }) {
  console.log(name, age, email);
}

createUser({ name: 'Alice', age: 30, email: 'alice@example.com' });
```

### 3b. Default + destructuring parameter

```javascript
function connect({
  host = 'localhost',
  port = 5432,
  database,
  user,
  password,
  ssl = false
}) {
  return `postgresql://${user}@${host}:${port}/${database}?ssl=${ssl}`;
}

console.log(connect({
  database: 'mydb',
  user: 'admin',
  password: 'secret'
}));
// postgresql://admin@localhost:5432/mydb?ssl=false
```

### 3c. Nested + rest parameter

```javascript
function parseHeaders({ status, data: { results = [], meta: { page = 1, ...extraMeta } = {} } }) {
  console.log(status, results.length, page, extraMeta);
}

parseHeaders({
  status: 200,
  data: {
    results: [1, 2, 3],
    meta: { page: 3, total: 100 }
  }
});
// 200, 3, 3, { total: 100 }
```

### 3d. Parameter không phải object

```javascript
function greet({ name = 'Stranger' } = {}) {
  console.log(`Hello, ${name}`);
}

greet({ name: 'Alice' }); // 'Hello, Alice'
greet({});                // 'Hello, Stranger'
greet();                  // 'Hello, Stranger' — cần = {} default
```

---

## 4. Ứng Dụng Thực Tế

### 4a. Swap biến không cần temp

```javascript
let a = 1, b = 2;
[a, b] = [b, a];
console.log(a, b); // 2, 1
```

### 4b. Parse function return

```javascript
function getUserStats(user) {
  return {
    name: user.name,
    score: user.score || 0,
    rank: user.rank || 'unranked',
    badges: user.badges || []
  };
}

const { name, score, rank, badges } = getUserStats({ name: 'Alice', score: 1500 });
```

### 4c. Import modules

```javascript
// Named imports là destructuring
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Export named
export { foo, bar, baz };

// Import all
import * as utils from './utils';
```

### 4d. For...of với destructuring

```javascript
const users = [
  { name: 'Alice', scores: [80, 90, 70] },
  { name: 'Bob', scores: [60, 85, 95] }
];

for (const { name, scores: [first, second, third] } of users) {
  console.log(`${name}: ${first}, ${second}, ${third}`);
}
```

### 4e. Parse JSON với alias

```javascript
const apiResponse = {
  u: { n: 'Alice', a: 30 },   // short keys từ API
  s: 200
};

// Parse với alias để đặt tên rõ ràng hơn
const { u: { n: name, a: age }, s: status } = apiResponse;
console.log(name, age, status); // Alice 30 200
```

---

## 5. Các Traps

### Trap 1: Không có default cho object destructuring

```javascript
function greet({ name }) {
  console.log(`Hello, ${name}`);
}

greet(); // TypeError: Cannot destructure property 'name'
```

```javascript
// ✅ Fix: default parameter
function greet({ name } = {}) {
  console.log(`Hello, ${name}`);
}

greet(); // 'Hello, undefined'
```

### Trap 2: Destructuring null/undefined

```javascript
const { name } = null; // TypeError
const { name } = undefined; // TypeError
```

```javascript
// ✅ Dùng || {} default
function getConfig(config = {}) {
  const { theme, lang } = config;
}

// ✅ Optional chaining + destructuring
const obj = null;
const { name } = obj ?? {}; // undefined, không lỗi
```

### Trap 3: Destructuring không làm shallow copy

```javascript
const original = { user: { name: 'Alice' } };
const { user } = original; // user trỏ đến original.user

user.name = 'Bob'; // thay đổi original luôn!
console.log(original.user.name); // 'Bob'
```

```javascript
// ✅ Nếu cần copy riêng:
const { user: userCopy } = { ...original };
// hoặc
const { user: { ...userCopy } } = original;
```

### Trap 4: Đặt tên trùng với biến đã có

```javascript
const existing = 100;

// ❌ SyntaxError: Identifier 'existing' has already been declared
const { existing } = { existing: 200 };

// ✅ Dùng alias
const { existing: newValue } = { existing: 200 };
console.log(newValue); // 200
console.log(existing); // 100 — không bị ảnh hưởng
```

---

## 6. Câu Hỏi Phỏng Vấn

### Câu 1: Đặt tên khác

```javascript
const { name: userName, age: userAge = 18 } = { name: 'Alice' };
console.log(userName, userAge); // ?
```

**Trả lời:** `Alice, 18` — default được dùng vì `age` không có trong object.

---

### Câu 2: Destructuring + rest

```javascript
const { a, b, ...rest } = { a: 1, b: 2, c: 3, d: 4, e: 5 };
console.log(rest); // ?
```

**Trả lời:** `{ c: 3, d: 4, e: 5 }`

---

### Câu 3: Nested với alias

```javascript
const { data: { user: { name: n } } } = { data: { user: { name: 'Alice' } } };
console.log(n); // ?
```

**Trả lời:** `'Alice'`

---

### Câu 4: Default vs undefined

```javascript
const { a = 1 } = { a: undefined };
const { b = 2 } = { b: null };
const { c = 3 } = {};

console.log(a, b, c); // ?
```

**Trả lời:** `1, null, 3`

- `undefined` → dùng default
- `null` → **không dùng** default (null không phải undefined)
- Không có key → dùng default

---

### Câu 5: Destructuring function return

```javascript
function getPosition() {
  return [10, 20, 30];
}

const [x, , z] = getPosition();
console.log(x, z); // ?
```

**Trả lời:** `10, 30`

---

### Câu 6: Object destructuring + method

```javascript
const calculator = {
  value: 10,
  add(x) { return this.value + x; }
};

const { value, add } = calculator;
console.log(add(5)); // ?
```

**Trả lời:** `NaN`

**Giải thích:** `add` được tách ra → `this` không còn bind đến `calculator`. `this.value` → undefined → NaN.

```javascript
// ✅ Fix
const { value, add } = calculator;
console.log(add.call(calculator, 5)); // 15

// ✅ Hoặc bind
const boundAdd = add.bind(calculator);
console.log(boundAdd(5)); // 15
```

---

### Câu 7: For...of với destructuring

```javascript
const pairs = [['a', 1], ['b', 2], ['c', 3]];
for (const [letter, number] of pairs) {
  console.log(letter, number);
}
```

**Trả lời:** `a 1`, `b 2`, `c 3`

---

### Câu 8: Swap với destructuring

```javascript
let [first, second] = [1, 2];
[second, first] = [first, second];
console.log(first, second); // ?
```

**Trả lời:** `2, 1`

---

## 7. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  DESTRUCTURING                                             │
│                                                         │
│  Array: [a, b, ...rest] = [1, 2, 3]                  │
│    → a = 1, b = 2, rest = [3]                         │
│    → Bỏ qua: [a, , b]                                 │
│    → Swap: [a, b] = [b, a]                            │
│    → Default: [a = 1] = []                            │
│                                                         │
│  Object: { x, y, ...rest } = { x: 1, y: 2, z: 3 }    │
│    → x = 1, y = 2, rest = { z: 3 }                   │
│    → Alias: { x: alias } = { x: 1 }                   │
│    → Default: { x = 1 } = {}                          │
│    → Nested: { a: { b } }                             │
│                                                         │
│  ⚠️ Destructuring KHÔNG copy — chỉ tạo binding        │
│  ⚠️ Cần default {} khi parameter có thể undefined     │
│  ⚠️ Method tách ra → this bị mất                       │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Mối Liên Hệ

```
Destructuring
  ├── Spread/Rest (007) ← rest dùng trong destructuring
  ├── Data Types (005)  ← destructuring = cách đọc reference
  ├── Default parameters ← destructuring + default value
  └── Object patterns      ← spread + destructuring = immutable update
```

---

## Checklist

- [ ] Dùng được array và object destructuring thành thạo
- [ ] Biết cách đặt alias để tránh trùng tên
- [ ] Hiểu default value: dùng cho undefined, không cho null
- [ ] Tránh được trap: this bị mất khi tách method, cần default {}
- [ ] Trả lời được 8/8 câu hỏi phỏng vấn

---

*Last updated: 2026-03-31*
