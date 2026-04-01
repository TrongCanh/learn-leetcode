# Symbols & Well-known Symbols — Khóa Bí Mật Của JavaScript

## Câu hỏi mở đầu

```javascript
const key = Symbol('description');
const obj = { name: 'Alice' };
obj[key] = 'secret value';

console.log(obj.name);     // 'Alice' — truy cập bình thường
console.log(obj[key]);    // 'secret value' — cần key
console.log(Object.keys(obj)); // ['name'] — Symbol ẩn!
```

**Symbol tạo property ẩn — không thấy trong `Object.keys()`, không thấy trong `for...in`.**

Và **Well-known Symbols** còn quan trọng hơn — chúng là những "khóa" để customize behavior của JavaScript.

---

## 1. Symbol — Tạo Unique Keys

### Tạo Symbol

```javascript
const sym1 = Symbol();
const sym2 = Symbol('description'); // mô tả (không ảnh hưởng giá trị)
const sym3 = Symbol('description');

console.log(sym1 === sym2); // false — mỗi Symbol là DUY NHẤT
console.log(sym2 === sym3); // false
```

### Dùng làm property key

```javascript
const id = Symbol('id');

const user = {
  name: 'Alice',
  [id]: 12345 // computed property name
};

console.log(user.name);    // 'Alice'
console.log(user[id]);     // 12345
console.log(user['id']);  // undefined
console.log(Object.keys(user)); // ['name'] — Symbol không enumerable
```

### Symbol Registry

```javascript
// Global Symbol — tạo cùng key = cùng Symbol
const sym1 = Symbol.for('app.key');
const sym2 = Symbol.for('app.key');
console.log(sym1 === sym2); // true

// Đọc key từ Symbol
console.log(Symbol.keyFor(sym1)); // 'app.key'
```

---

## 2. Well-known Symbols — "Khóa" Của JavaScript

### Symbol.toStringTag — Custom object description

```javascript
class Person {
  get [Symbol.toStringTag]() {
    return 'Person';
  }
}

const p = new Person();
console.log(p.toString()); // '[object Person]'
console.log(Object.prototype.toString.call(p)); // '[object Person]'
```

### Symbol.iterator — Custom iteration

```javascript
class Range {
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }

  [Symbol.iterator]() {
    let current = this.from;
    const end = this.to;
    return {
      next() {
        if (current <= end) {
          return { value: current++, done: false };
        }
        return { done: true };
      }
    };
  }
}

for (const num of new Range(1, 5)) {
  console.log(num); // 1, 2, 3, 4, 5
}
```

### Symbol.hasInstance — Custom instanceof

```javascript
class EvenNumber {
  static [Symbol.hasInstance](instance) {
    return typeof instance === 'number' && instance % 2 === 0;
  }
}

console.log(4 instanceof EvenNumber); // true
console.log(3 instanceof EvenNumber); // false
```

### Symbol.toPrimitive — Custom type conversion

```javascript
class Temperature {
  constructor(celsius) {
    this.celsius = celsius;
  }

  [Symbol.toPrimitive](hint) {
    if (hint === 'number') {
      return this.celsius;
    }
    if (hint === 'string') {
      return `${this.celsius}°C`;
    }
    return this.celsius; // default
  }
}

const t = new Temperature(25);
console.log(+t);           // 25 (to number)
console.log(`${t}`);       // '25°C' (to string)
console.log(t + 10);       // 35 (to number)
console.log(String(t));   // '25°C'
```

### Symbol.split — Custom string splitting

```javascript
class MarkdownLink {
  constructor(url) {
    this.url = url;
  }

  [Symbol.split](string) {
    const index = string.indexOf(this.url);
    return [string.slice(0, index), string.slice(index + this.url.length)];
  }
}

const link = new MarkdownLink('https://example.com');
const result = 'Visit https://example.com for more'.split(link);
console.log(result); // ['Visit ', ' for more']
```

---

## 3. Một Số Well-known Symbols Quan Trọng

| Symbol | Mục đích | Ví dụ |
|--------|----------|--------|
| `Symbol.iterator` | Custom iteration | `for...of` |
| `Symbol.toStringTag` | Custom `[object Type]` | `.toString()` |
| `Symbol.toPrimitive` | Custom type coercion | `Number()`, `String()` |
| `Symbol.hasInstance` | Custom `instanceof` | `x instanceof Class` |
| `Symbol.isConcatSpreadable` | Array spread trong concat | `[].concat(obj)` |
| `Symbol.unscopables` | Ẩn khỏi `with` statement | — |
| `Symbol.match` | Custom regex matching | `String.match()` |
| `Symbol.replace` | Custom string replacement | `String.replace()` |
| `Symbol.search` | Custom regex search | `String.search()` |

---

## 4. Symbol trong Built-in Types

### Array — Symbol.isConcatSpreadable

```javascript
const arrayLike = {
  0: 'a',
  1: 'b',
  length: 2,
  [Symbol.isConcatSpreadable]: true
};

console.log(['x'].concat(arrayLike)); // ['x', 'a', 'b']
```

### Object — Symbol.toStringTag

```javascript
class Car {
  get [Symbol.toStringTag]() {
    return 'Car';
  }
}

const car = new Car();
console.log(car.toString()); // '[object Car]'
```

---

## 5. Ứng Dụng Thực Tế

### Private properties trước ES2022

```javascript
const _password = Symbol('password');

class User {
  constructor(name, password) {
    this.name = name;
    this[_password] = password;
  }

  authenticate(pwd) {
    return this[_password] === pwd;
  }
}

const user = new User('Alice', 'secret123');
console.log(Object.keys(user)); // ['name'] — password ẩn!
console.log(user[Symbol.for('password')]); // undefined — phải có đúng Symbol
console.log(user.authenticate('secret123')); // true
```

### Interface definition

```javascript
const IS_STORAGE = Symbol.for('IStorage');

const storage = {
  [IS_STORAGE]: true,
  save(key, value) { /* ... */ },
  load(key) { /* ... */ }
};

// Check interface
if (storage[IS_STORAGE]) {
  storage.save('key', 'value');
}
```

---

## 6. Các Traps

### Trap 1: Symbol không enumerable

```javascript
const id = Symbol('id');
const user = { name: 'Alice', [id]: 123 };

console.log(Object.keys(user));          // ['name']
console.log(JSON.stringify(user));       // {"name":"Alice"}
console.log(Object.getOwnPropertySymbols(user)); // [Symbol(id)] — phải dùng hàm này
```

### Trap 2: Symbol không auto-convert

```javascript
const sym = Symbol('x');

// console.log('' + sym); // TypeError
console.log(String(sym));              // 'Symbol(x)'
console.log(sym.toString());          // 'Symbol(x)'
console.log(Boolean(sym));            // true — symbol luôn truthy
```

### Trap 3: Global registry không tự động

```javascript
const sym1 = Symbol('key');
const sym2 = Symbol.for('key');

console.log(sym1 === sym2); // false — khác nhau!
```

---

## 7. Câu Hỏi Phỏng Vấn

### Câu 1: Symbol uniqueness

```javascript
const s1 = Symbol('x');
const s2 = Symbol('x');

console.log(s1 === s2); // ?
console.log(Symbol.for('x') === Symbol.for('x')); // ?
```

**Trả lời:** `false, true`

---

### Câu 2: Symbol trong Object.keys

```javascript
const sym = Symbol('secret');
const obj = { name: 'Alice', [sym]: 'hidden' };

console.log(Object.keys(obj)); // ?
console.log(Object.getOwnPropertySymbols(obj)); // ?
```

**Trả lời:** `['name']`, `[Symbol(secret)]`

---

### Câu 3: Symbol.iterator

```javascript
const obj = {
  a: 1,
  b: 2,
  [Symbol.iterator]() {
    return Object.values(this)[Symbol.iterator]();
  }
};

console.log([...obj]); // ?
```

**Trả lời:** `[1, 2]`

---

### Câu 4: Symbol.toPrimitive

```javascript
class Counter {
  constructor() { this.count = 0; }

  [Symbol.toPrimitive](hint) {
    return this.count++;
  }
}

const c = new Counter();
console.log(+c); // ①
console.log(+c); // ②
console.log(+c); // ③
```

**Trả lời:** `0, 1, 2` — mỗi lần gọi tăng count

---

## 8. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  SYMBOL                                                   │
│                                                         │
│  Symbol('description') → unique key, không enumerable   │
│  Symbol.for('key') → global registry                   │
│                                                         │
│  Well-known Symbols = khóa customize JS behavior      │
│    Symbol.iterator → for...of                          │
│    Symbol.toStringTag → [object Type]                  │
│    Symbol.toPrimitive → Number/String coercion         │
│    Symbol.hasInstance → instanceof                     │
│    Symbol.isConcatSpreadable → concat spread         │
│                                                         │
│  ⚠️ Symbol không enumerable — ẩn khỏi Object.keys     │
│  ⚠️ Symbol không tự convert sang string               │
│  ⚠️ Symbol.for() vs Symbol() — khác nhau             │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Mối Liên Hệ

```
Symbols
  ├── Prototype Chain (001) ← Symbol không ảnh hưởng chain
  ├── Iteration ← Symbol.iterator = custom iteration
  ├── Type Coercion ← Symbol.toPrimitive
  └── Private Properties ← ES2022 # vs Symbol
```

---

## Checklist

- [ ] Tạo được Symbol và dùng làm property key
- [ ] Hiểu 5+ well-known symbols phổ biến
- [ ] Implement được custom iterator với Symbol.iterator
- [ ] Trả lời được các câu hỏi phỏng vấn

---

## 🎉 Chương 02 Hoàn Thành!

Bạn đã học xong Prototype & OOP:
- Prototype Chain
- Class Syntax
- Inheritance Patterns
- Mixins
- Object Patterns
- Symbols & Well-known Symbols

Tiếp theo: **Chương 03 — Async & Event Loop**

---

*Last updated: 2026-03-31*
