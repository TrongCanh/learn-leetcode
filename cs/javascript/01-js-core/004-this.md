# `this` — Bốn Quy Tắc, Một Nguyên Tắc Vàng

## Câu hỏi mở đầu

```javascript
const person = {
  name: 'Alice',
  greet() {
    console.log(`Hi, I'm ${this.name}`);
  }
};

const greet = person.greet;
person.greet(); // in ra gì?
greet();         // in ra gì?
```

Hai kết quả khác nhau. Cùng một function, cùng `this.name`. Tại sao?

Vì **`this` không phải scope.** `this` được resolve **dựa trên cách gọi hàm**, không phải nơi hàm được viết.

---

## 1. Nguyên Tắc Vàng

> **`this` được xác định bởi call site (nơi gọi hàm), không phải definition site (nơi hàm được viết).**

Đây là source của **hầu hết confusion** về `this` trong JavaScript. Khi bạn viết `this.name`, bạn không đọc biến `name` từ scope — bạn đọc property `name` từ object mà `this` đang trỏ đến.

---

## 2. Bốn Quy Tắc Xác Định `this`

### Quy Tắc 1: Default Binding — Gọi đơn giản

```javascript
function sayHi() {
  console.log(this.name);
}

const name = 'Global';

sayHi(); // 'Global' — default binding = global object (non-strict)
```

**Khi nào dùng:** Gọi hàm "bình thường", không qua object, không qua `.call()`, `.bind()`, `new`.

```
┌──────────────────────────────────────────────┐
│  Default Binding                              │
│                                              │
│  Non-strict: this = global object            │
│  Strict mode:   this = undefined              │
└──────────────────────────────────────────────┘
```

```javascript
'use strict';

function test() {
  console.log(this); // undefined
}
test();
```

### Quy Tắc 2: Implicit Binding — Gọi qua Object

```javascript
const person = {
  name: 'Alice',
  sayHi() {
    console.log(this.name);
  }
};

person.sayHi(); // 'Alice' — this = person
```

**Khi nào dùng:** Khi gọi hàm bằng `object.method()` → `this` = `object`.

```
┌──────────────────────────────────────────────┐
│  Implicit Binding                             │
│                                              │
│  object.method() → this = object            │
│  person.sayHi()  → this = person           │
└──────────────────────────────────────────────┘
```

### Quy Tắc 3: Explicit Binding — `.call()`, `.apply()`, `.bind()`

```javascript
function greet(greeting) {
  console.log(`${greeting}, I'm ${this.name}`);
}

const person = { name: 'Bob' };

greet.call(person, 'Hello');    // 'Hello, I'm Bob'
greet.apply(person, ['Hi']);   // 'Hi, I'm Bob'

const boundGreet = greet.bind(person, 'Hey');
boundGreet();                    // 'Hey, I'm Bob'
```

| Method | Cú pháp | Khác nhau ở đâu |
|--------|---------|----------------|
| `.call()` | `fn.call(thisArg, ...args)` | Gọi ngay với args riêng lẻ |
| `.apply()` | `fn.apply(thisArg, [args])` | Gọi ngay với args là array |
| `.bind()` | `fn.bind(thisArg, ...args)` | Trả **function mới**, gọi sau |

```javascript
// bind() tạo function MỚI, không thay đổi function gốc
function original() { console.log(this); }

const bound = original.bind({ name: 'Alice' });
original();                    // undefined / global
bound();                       // { name: 'Alice' }
original.call({ name: 'Bob' }); // { name: 'Bob' }
```

### Quy Tắc 4: `new` Binding — Constructor

```javascript
function Person(name) {
  this.name = name; // this = instance mới
}

const p = new Person('Charlie');
console.log(p.name); // 'Charlie'
```

**Khi dùng `new`:**
1. Tạo object mới rỗng `{}`
2. Gán `[[Prototype]]` của object đó đến `Person.prototype`
3. Bind `this` = object mới
4. Execute constructor function
5. Return object (trừ khi constructor return object khác)

```
┌──────────────────────────────────────────────┐
│  new Binding                                  │
│                                              │
│  new Person('X') → this = new instance       │
└──────────────────────────────────────────────┘
```

---

## 3. Thứ Tự Ưu Tiên — Ai Được Ưu Tiên?

Khi có nhiều quy tắc cùng áp dụng, **chỉ một quy tắc thắng**:

```
1. `new` binding          — cao nhất
2. Explicit binding        — .call/.apply/.bind
3. Implicit binding        — object.method()
4. Default binding         — fallback cuối cùng
```

```javascript
function greet() {
  console.log(this.name);
}

const person = { name: 'Alice' };
const another = { name: 'Bob' };

// Explicit binding thắng implicit binding
greet.call(person);        // 'Alice' — explicit
greet.call(another);       // 'Bob'  — explicit
```

```javascript
// new binding thắng explicit binding
function Person(name) {
  this.name = name;
}

const Person2 = Person.bind({ name: 'Bound' });
const p = new Person2('Created'); // this = instance mới, KHÔNG phải { name: 'Bound' }
console.log(p.name); // 'Created'
```

---

## 4. Arrow Function — Ngoại Lệ Quan Trọng

### Arrow function KHÔNG có `this` riêng

```javascript
const person = {
  name: 'Alice',
  // ❌ SAI: arrow function không có this riêng
  greet: () => {
    console.log(`Hi, I'm ${this.name}`); // this = outer this (global/undefined)
  },
  // ✅ ĐÚNG: dùng regular function
  greetProper() {
    console.log(`Hi, I'm ${this.name}`); // this = person
  }
};

person.greet();         // 'Hi, I'm undefined'
person.greetProper();  // 'Hi, I'm Alice'
```

**Arrow function không có `[[ThisMode]]` internal property.** Thay vào đó, `this` được resolve **lexically** — nghĩa là nó dùng `this` của surrounding scope, giống hệt như biến.

```javascript
const obj = {
  name: 'Alice',
  greetArrow: () => {
    console.log(this.name); // this của global scope
  },
  greetNormal() {
    const innerArrow = () => {
      console.log(this.name); // ✅ this của greetNormal = obj
    };
    innerArrow();
  }
};
```

### Arrow function dùng `this` của enclosing scope

```javascript
function Timer() {
  this.seconds = 0;

  // regular function — this = Timer instance
  setInterval(function() {
    this.seconds++; // ❌ this KHÔNG phải Timer instance
    console.log(this.seconds);
  }, 1000);
}

const t = new Timer(); // NaN, NaN, NaN — this bị mất
```

```javascript
function TimerFixed() {
  this.seconds = 0;

  // arrow function — this = TimerFixed instance (lexical)
  setInterval(() => {
    this.seconds++; // ✅ this = TimerFixed instance
    console.log(this.seconds);
  }, 1000);
}

const t = new TimerFixed(); // 1, 2, 3, 4...
```

### Arrow function không thể dùng làm constructor

```javascript
const Person = (name) => {
  this.name = name; // TypeError: Cannot set property 'name' on arrow function
};

const p = new Person('Alice'); // TypeError
```

**Lý do:** Arrow function không có `[[Construct]]` internal method. `new` yêu cầu function có `[[Construct]]` → arrow function throw TypeError.

### Arrow function không có `arguments`

```javascript
function normal() {
  console.log(arguments); // Arguments object
}

const arrow = () => {
  console.log(arguments); // ReferenceError: arguments is not defined
};
```

---

## 5. Các Traps Phổ Biến Nhất

### Trap 1: Tách method ra khỏi object

```javascript
const person = {
  name: 'Alice',
  greet() {
    console.log(this.name);
  }
};

const greet = person.greet; // tách method ra
greet(); // ❌ undefined — default binding, không phải person

// ✅ Fix bằng bind
const greetBound = person.greet.bind(person);
greetBound(); // 'Alice'

// ✅ Fix bằng arrow wrapper
const greetArrow = () => person.greet();
greetArrow(); // 'Alice'

// ✅ Fix bằng arrow trong object
const person2 = {
  name: 'Alice',
  greet: () => console.log(person2.name) // dùng lexical ref
};
```

### Trap 2: Callback mất `this`

```javascript
class Button {
  constructor(label) {
    this.label = label;
  }

  click() {
    console.log(`Button ${this.label} clicked`);
  }

  render() {
    // ❌ SAI: this trong callback không phải Button instance
    document.getElementById('btn')
      .addEventListener('click', this.click);
  }
}

const btn = new Button('Submit');
btn.render(); // Khi click: "Button undefined clicked"
```

```javascript
// ✅ Fix 1: bind
addEventListener('click', this.click.bind(this));

// ✅ Fix 2: arrow trong class field (ES2022)
class Button {
  constructor(label) { this.label = label; }
  click = () => {
    console.log(`Button ${this.label} clicked`);
  }
}

// ✅ Fix 3: arrow trong callback
addEventListener('click', () => this.click());

// ✅ Fix 4: define property với get
class Button {
  constructor(label) {
    Object.defineProperty(this, 'handleClick', {
      value: () => this.click.bind(this) // hoặc .bind ở đây
    });
  }
}
```

### Trap 3: Dùng `this` trong array callback

```javascript
const calculator = {
  value: 10,
  add(numbers) {
    return numbers.map(function(n) {
      return n + this.value; // ❌ this = undefined/global
    });
  }
};

calculator.add([1, 2, 3]); // NaN, NaN, NaN
```

```javascript
// ✅ Fix: dùng arrow
return numbers.map(n => n + this.value);

// ✅ Fix: bind
return numbers.map(function(n) {
  return n + this.value;
}.bind(this));

// ✅ Fix: lưu this vào biến
const self = this;
return numbers.map(function(n) {
  return n + self.value;
});
```

### Trap 4: `this` trong nested object

```javascript
const obj = {
  name: 'outer',
  inner: {
    name: 'inner',
    greet() {
      console.log(this.name); // 'inner' — this = inner
    }
  }
};

obj.inner.greet(); // 'inner'

// Nhưng:
const method = obj.inner.greet;
method(); // undefined — default binding
```

---

## 6. Class Syntax — `this` Hoạt Động Như Thế Nào?

### Class constructor

```javascript
class Person {
  constructor(name) {
    this.name = name; // this = instance mới
  }

  greet() {
    console.log(`Hi, I'm ${this.name}`);
  }

  // Class field — mỗi instance có property riêng
  id = Math.random();
}
```

### `this` trong class methods

```javascript
class Counter {
  count = 0;

  increment() {
    this.count++; // this = Counter instance
  }

  // Arrow class field — this luôn bind đến instance
  decrement = () => {
    this.count--;
  };
}

const c = new Counter();
c.increment();
c.increment();
c.decrement();
console.log(c.count); // 1
```

### Method bị tách = mất `this`

```javascript
class Timer {
  constructor() { this.seconds = 0; }

  tick() {
    this.seconds++;
  }

  start() {
    setInterval(this.tick, 1000); // ❌ this = undefined khi tick() được gọi bên trong setInterval
  }
}

const t = new Timer();
t.start(); // this.seconds không tăng
```

```javascript
// ✅ Fix: arrow class field
class TimerFixed {
  constructor() { this.seconds = 0; }

  tick = () => {
    this.seconds++;
  };

  start() {
    setInterval(this.tick, 1000); // ✅ this = TimerFixed instance
  }
}
```

---

## 7. Câu Hỏi Phỏng Vấn

### Câu 1: Kết quả của đoạn code này?

```javascript
const a = {
  x: 1,
  getX() { return this.x; }
};

const b = { x: 2 };
const getX = a.getX;

console.log(a.getX());   // ①
console.log(getX());      // ②
console.log(a.getX.call(b)); // ③
```

**Trả lời:** ① `1`, ② `undefined`, ③ `2`

**Phân tích:**
- ①: `a.getX()` → implicit binding → `this = a` → `a.x = 1`
- ②: `getX()` → default binding (strict: undefined) → `this.x` → `undefined.x` → undefined
- ③: `.call(b)` → explicit binding → `this = b` → `b.x = 2`

---

### Câu 2: Arrow function và `this`

```javascript
const obj = {
  name: 'Alice',
  greet() {
    const arrow = () => {
      console.log(this.name);
    };
    arrow();
  }
};

obj.greet(); // ?
```

**Trả lời:** `'Alice'`

**Phân tích:** Arrow function không có `this` riêng. Nó lấy `this` từ enclosing scope — chính là `obj` (vì `greet()` được gọi dưới implicit binding).

---

### Câu 3: Constructor trả về primitive

```javascript
function Person(name) {
  this.name = name;
  return 'ignored'; // return primitive → bị ignore
}

const p = new Person('Bob');
console.log(p.name); // 'Bob'
```

**Trả lời:** `'Bob'`

**Quy tắc:** Nếu constructor return primitive, `new` expression trả về object mới (với `this`). Chỉ khi return object, `new` trả về object đó.

```javascript
function Person(name) {
  this.name = name;
  return { name: 'OVERRIDE' }; // return object → override
}

const p = new Person('Bob');
console.log(p.name); // 'OVERRIDE'
```

---

### Câu 4: Binding order

```javascript
function greet() {
  console.log(this.value);
}

const obj1 = { value: 1 };
const obj2 = { value: 2 };

const bound = greet.bind(obj1);
bound.call(obj2); // ?
```

**Trả lời:** `1`

**Phân tích:** `bind()` tạo function mới vĩnh viễn. `.call()` không thể override `bind()`. `bound.call(obj2)` → `this = obj1` (từ bind), `obj2` bị bỏ qua.

---

### Câu 5: Method vs function trong class

```javascript
class Person {
  name = 'Alice';

  regularMethod() { console.log(this.name); }
  arrowMethod = () => { console.log(this.name); }
}

const p = new Person();
const fn1 = p.regularMethod;
const fn2 = p.arrowMethod;

fn1(); // ①
fn2(); // ②
```

**Trả lời:** ① `undefined`, ② `'Alice'`

**Phân tích:**
- `regularMethod`: regular function, có `this` riêng → `fn1()` default binding → undefined
- `arrowMethod`: arrow function, `this` = instance của `p` (lexical, được capture khi class field được initialize)

---

### Câu 6: Multiple callbacks

```javascript
const logger = {
  level: 'INFO',
  log(fn) {
    console.log(`[${this.level}]`);
    fn();
  }
};

const app = { level: 'DEBUG' };

logger.log(function() {
  console.log(this.level);
});
```

**Trả lời:** `INFO`, `undefined`

**Phân tích:** `logger.log()` → implicit binding → `this = logger`. Anonymous function được truyền vào → default binding khi gọi bên trong `log()` → undefined.

```javascript
// Fix bằng arrow:
logger.log(() => {
  console.log(this.level); // 'INFO' — arrow capture this của log()
});

// Hoặc bind:
logger.log(function() {
  console.log(this.level);
}.bind(app)); // 'DEBUG'
```

---

### Câu 7: `this` trong event handler

```javascript
const button = {
  init() {
    const btn = document.createElement('button');
    btn.innerText = 'Click me';
    btn.onclick = function() {
      console.log(this.innerText); // this ở đây là gì?
    };
    document.body.appendChild(btn);
  }
};

button.init(); // Click button → in ra gì?
```

**Trả lời:** `'Click me'` — vì `onclick` là property của DOM element, gọi bởi browser → `this = button element`.

```javascript
// Nếu dùng arrow:
btn.onclick = () => {
  console.log(this.innerText); // undefined — this = outer this (không phải button element)
};
```

---

### Câu 8: IIFE và `this`

```javascript
const obj = {
  name: 'Alice',
  init() {
    const self = this;
    (function() {
      console.log(this.name);    // ①
      console.log(self.name);    // ②
    })();
  }
};

obj.init();
```

**Trả lời:** ① `undefined`, ② `'Alice'`

**Phân tích:** IIFE tạo function scope riêng. `this` bên trong IIFE → default binding → undefined. `self` được capture từ `init()` scope (lexical closure) → giữ tham chiếu đến `obj`.

---

## 8. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  this được resolve DỰA TRÊN CALL SITE, không phải       │
│  definition site                                        │
│                                                         │
│  1. new fn()     → this = instance mới                 │
│  2. fn.call(obj) → this = obj                          │
│  3. obj.method() → this = obj (implicit)               │
│  4. fn()         → this = global/undefined (default)   │
│                                                         │
│  Arrow function: KHÔNG có this riêng                   │
│  → Lấy this từ enclosing scope (lexical)              │
│  → Không dùng được làm constructor                     │
│  → Không bind được, không override được                 │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Mối Liên Hệ

```
this
  ├── Scope (001)    ← this KHÔNG liên quan đến scope chain
  ├── Closure (002)  ← closure KHÔNG giữ this, phải bind
  ├── Hoisting (003) ← this được resolve ở execution phase
  └── Execution Context (006) ← this binding được tạo trong EC
```

---

## Checklist

- [ ] Giải thích được 4 quy tắc xác định `this`
- [ ] Biết thứ tự ưu tiên khi có nhiều quy tắc
- [ ] Hiểu arrow function không có `this` riêng
- [ ] Biết cách fix khi `this` bị mất trong callback
- [ ] Trả lời được 8/8 câu hỏi phỏng vấn trên

---

*Last updated: 2026-03-31*
