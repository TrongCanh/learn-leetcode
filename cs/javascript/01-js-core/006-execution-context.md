# Execution Context — Cái Gì Được Tạo Khi Code Chạy

## Câu hỏi mở đầu

```javascript
var name = 'Alice';

function greet() {
  console.log(name);
  var name = 'Bob';
  console.log(name);
}

greet();
```

Kết quả in ra là gì? Tại sao?

Nếu bạn đoán `"Alice"` rồi `"Bob"` — **sai.**

Kết quả thật ra là: `undefined` và `Bob`.

Vì sao? Vì mỗi khi `greet()` được gọi, JavaScript tạo một **Execution Context** hoàn toàn mới, với bộ nhớ riêng cho các biến trong function đó.

---

## 1. Execution Context Là Gì?

### Định nghĩa

> **Execution Context (EC)** là môi trường mà JavaScript code được evaluate và executed. Mỗi khi code được chạy, JS engine tạo một (hoặc nhiều) EC.

### Các loại Execution Context

```
Global Execution Context (GEC)
  ├── Created khi script bắt đầu
  ├── this = global object (window / globalThis)
  └── Chỉ có 1 GEC cho mỗi script

Function Execution Context (FEC)
  ├── Tạo mỗi khi function được gọi
  └── Mỗi call = 1 EC mới, với memory riêng

Eval Execution Context (EEC)
  └── Tạo khi eval() được gọi (tránh dùng)
```

### Mỗi EC có 3 thành phần

```
┌─────────────────────────────────────┐
│  1. Variable Environment              │
│     ├── var declarations             │
│     ├── function declarations        │
│     └── arguments                    │
│                                       │
│  2. Lexical Environment              │
│     └── let, const, class bindings   │
│                                       │
│  3. This Binding                     │
│     └── giá trị của this            │
└─────────────────────────────────────┘
```

---

## 2. Call Stack — Stack Của Execution Contexts

JavaScript là **single-threaded** — chỉ có 1 call stack.

```
Khi script bắt đầu:
┌─────────────────┐
│  Global Context │
└─────────────────┘

Khi gọi greet():
┌─────────────────┐
│  greet()        │
│  Execution       │ ← TOP của stack
│  Context         │
├─────────────────┤
│  Global Context │
└─────────────────┘

Khi greet() gọi inner():
┌─────────────────┐
│  inner()        │ ← TOP
├─────────────────┤
│  greet()        │
├─────────────────┤
│  Global Context │
└─────────────────┘

Khi inner() kết thúc → pop → quay lại greet()

Khi greet() kết thúc → pop → quay lại Global
```

### Minh họa bằng code

```javascript
function a() {
  console.log('a start');
  b();
  console.log('a end');
}

function b() {
  console.log('b start');
  c();
  console.log('b end');
}

function c() {
  console.log('c');
}

a();

// Output:
// a start
// b start
// c
// b end
// a end
```

### Stack overflow

```javascript
function recursive() {
  recursive();
}
recursive(); // RangeError: Maximum call stack size exceeded
```

Mỗi call tạo EC mới trên stack. Recursion không có base case → stack phình không giới hạn → overflow.

---

## 3. Creation Phase vs Execution Phase

Mỗi Execution Context trải qua 2 phase:

### Phase 1: Creation (Compilation)

```
┌──────────────────────────────────────────────────┐
│  Creation Phase                                    │
│                                                   │
│  1. Tạo LexicalEnvironment (cho let/const)        │
│     → Biến được đăng ký, giá trị = uninitialized │
│     → TDZ bắt đầu                                │
│                                                   │
│  2. Tạo VariableEnvironment (cho var)             │
│     → var declarations → giá trị = undefined      │
│     → function declarations → copy cả body        │
│                                                   │
│  3. Xác định this binding                        │
└──────────────────────────────────────────────────┘
```

### Phase 2: Execution

```
┌──────────────────────────────────────────────────┐
│  Execution Phase                                   │
│                                                   │
│  Code được execute từ trên xuống dưới             │
│  Biến được gán giá trị thực tế                  │
│  Function calls tạo EC mới và đẩy lên stack      │
└──────────────────────────────────────────────────┘
```

### Ví dụ: Giải thích step-by-step

```javascript
var name = 'Alice';        // ① global execution

function greet() {         // ② function declaration — hoisted
  console.log(name);       // ⑤ — nhưng name = undefined
  var name = 'Bob';        // ③ trong greet scope, var name hoisted
  console.log(name);       // ⑥ — name = 'Bob'
}

greet();                    // ④ tạo greet EC
```

```
Global EC — Creation:
  VariableEnvironment: name = undefined (hoisted)
  → Gán: name = 'Alice'

Global EC — Execution:
  → Gặp function greet: skip (đã hoisted)
  → Gặp greet(): tạo Greet EC

Greet EC — Creation:
  VariableEnvironment: name = undefined (hoisted trong function)
  → Console.log(name) chạy → undefined
  → name = 'Bob'
  → Console.log(name) → 'Bob'

Output: undefined, Bob
```

---

## 4. Lexical Environment vs Variable Environment

### Biến được tạo ở đâu?

| Loại | Được tạo bởi | Nằm trong |
|------|-------------|-----------|
| `var` | VariableEnvironment | Function/Global |
| `let` | LexicalEnvironment | Block `{}` |
| `const` | LexicalEnvironment | Block `{}` |

```javascript
function demo() {
  // var: nằm trong VariableEnvironment của demo
  var a = 1;

  // let/const: nằm trong LexicalEnvironment (block scope)
  if (true) {
    let b = 2;
    const c = 3;
  }

  console.log(a); // 1 ✅
  console.log(b); // ReferenceError ❌
  console.log(c); // ReferenceError ❌
}
```

---

## 5. Scope Chain — Liên Quan Chặt Chẽ Với Lexical Environment

Mỗi Lexical Environment có property ẩn `[[OuterEnvironment]]`:

```
global Environment
  [[OuterEnvironment]]: null (không có outer)

function outer Environment
  [[OuterEnvironment]]: global Environment

function inner Environment
  [[OuterEnvironment]]: outer Environment
```

### Scope Chain Resolution

```javascript
const global = 'G';

function outer() {
  const outerVar = 'O';

  function middle() {
    const middleVar = 'M';

    function inner() {
      const innerVar = 'I';
      console.log(global, outerVar, middleVar, innerVar);
    }

    inner();
  }

  middle();
}

outer();
// Output: G O M I
```

Scope chain: `inner → middle → outer → global → null`

---

## 6. Closures và Execution Context

Khi function kết thúc, EC của nó **thường** bị pop khỏi stack. Nhưng:

> **Nếu có closure tham chiếu đến biến trong function đó, EC không thể bị garbage collected.**

```javascript
function outer() {
  const data = new Array(100000).fill('x'); // 10MB

  return function inner() {
    return data.length; // closure giữ reference đến data
  };
}

const fn = outer();
// outer EC không bị GC'd vì inner giữ closure trên data
// data vẫn còn trong memory!
```

---

## 7. Câu Hỏi Phỏng Vấn

### Câu 1: Đoán thứ tự execution

```javascript
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

console.log('4');
```

**Trả lời:** `1, 4, 3, 2`

**Phân tích:**
- `console.log('1')` và `'4'`: synchronous → chạy trước
- `Promise.resolve().then()` → microtask queue
- `setTimeout()` → macrotask queue

Execution order:
```
Synchronous: 1 → 4
Microtask queue: 3
Macrotask queue: 2

→ Output: 1, 4, 3, 2
```

(Bài chi tiết về event loop ở Chương 03)

---

### Câu 2: Giải thích kết quả

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}

console.log('final i:', i);
```

**Trả lời:** `final i: 3`, `3, 3, 3`

**Giải thích:**
- Loop chạy synchronous: i tăng đến 3
- `console.log('final i:', i)` → 3
- `setTimeout` callbacks đẩy vào macrotask queue
- Event loop empty → callbacks chạy → đọc i = 3

---

### Câu 3: EC với IIFE

```javascript
var name = 'global';

(function() {
  console.log(name); // ①
  var name = 'local';
  console.log(name); // ②
})();

console.log(name); // ③
```

**Trả lời:** `undefined, local, global`

**Giải thích:**
- IIFE tạo EC riêng
- `var name` hoisted trong IIFE scope → shadow global
- ①: chạy trước khi `name = 'local'` → undefined
- ②: sau khi gán → 'local'
- ③: global scope, name = 'global'

---

### Câu 4: Recursion và call stack

```javascript
function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}

console.log(fib(4)); // ?
```

**Trả lời:** `3`

**Giải thích:**
- `fib(4)` → `fib(3)` + `fib(2)`
- `fib(3)` → `fib(2)` + `fib(1)`
- `fib(2)` → `fib(1)` + `fib(0)`
- Stack grows: fib(4) → fib(3) → fib(2) → fib(1)
- Unwind: return 1 → return fib(2) → ... → 3

---

### Câu 5: Tại sao let/const không thuộc global object?

```javascript
var x = 1;
let y = 2;
const z = 3;

console.log(window.x); // 1
console.log(window.y); // undefined
console.log(window.z); // undefined
```

**Trả lời:** `var` thuộc `VariableEnvironment` của Global EC → gắn vào `globalThis`. `let`/`const` thuộc `LexicalEnvironment` → không gắn vào global object.

---

### Câu 6: Block scope và EC

```javascript
{
  let a = 1;
  const b = 2;
}
console.log(a); // ?
console.log(b); // ?
```

**Trả lời:** `ReferenceError, ReferenceError`

Block `{}` tạo Lexical Environment riêng cho `let`/`const`. Sau block kết thúc, EC của block bị pop, `a` và `b` không còn truy cập được.

---

### Câu 7: Function hoisting với EC

```javascript
console.log(typeof foo); // ①
console.log(typeof bar); // ②

foo(); bar();

var foo = function() { console.log('foo'); };
function bar() { console.log('bar'); }
```

**Trả lời:** ① `function`, ② `undefined`, sau đó `TypeError: foo is not a function`

**Giải thích:**
- `function bar()` hoisted với body → typeof = 'function'
- `var foo` hoisted với undefined → typeof = 'undefined'
- `foo()` chạy → TypeError (foo là undefined)
- `bar()` chạy → 'bar'

---

### Câu 8: Execution context của arrow function

```javascript
const obj = {
  name: 'Alice',
  greet: () => {
    console.log(this.name);
  }
};

obj.greet(); // ?
```

**Trả lời:** `undefined` (hoặc global name)

Arrow function không tạo Execution Context riêng cho `this`. `this` của arrow = `this` của enclosing context — chính là global/none object, không phải `obj`.

---

### Câu 9: Return function và EC

```javascript
function outer() {
  const result = 42;
  return function inner() {
    return result;
  };
}

const fn = outer();
console.log(fn()); // ?

// Sau khi outer() kết thúc, EC của outer có bị GC'd không?
```

**Trả lời:** `42`, và **không** — vì `inner` closure giữ reference đến `result` trong outer EC.

---

### Câu 10: Global EC và this

```javascript
// Browser
console.log(this === window); // ?

function test() {
  console.log(this === window); // non-strict
}
test();

// Strict mode
'use strict';
function testStrict() {
  console.log(this); // undefined
}
testStrict();
```

**Trả lời:** `true, true, undefined`

---

## 8. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  Execution Context = Môi trường để JS code chạy          │
│                                                         │
│  3 loại: Global, Function, Eval                         │
│                                                         │
│  Mỗi EC có 2 phase:                                    │
│    1. Creation Phase → hoisting, TDZ, this binding     │
│    2. Execution Phase → code chạy                      │
│                                                         │
│  Call Stack = LIFO stack chứa các EC                   │
│    → Single thread, 1 call stack                        │
│    → EC trên top = đang chạy                           │
│                                                         │
│  Lexical Environment: let, const, class                 │
│  Variable Environment: var, function                    │
│                                                         │
│  Closure giữ EC không bị GC → potential memory leak     │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Mối Liên Hệ

```
Execution Context
  ├── Scope (001)     ← EC tạo ra scope
  ├── Hoisting (003)  ← hoisting xảy ra trong creation phase
  ├── Closure (002)  ← closure = function + lexical env
  ├── Event Loop (03) ← call stack = queue của EC
  └── this (004)     ← this binding được tạo trong EC
```

---

## Checklist

- [ ] Giải thích được EC là gì và có bao nhiêu loại
- [ ] Mô tả được 2 phase: creation và execution
- [ ] Vẽ được call stack của một đoạn code
- [ ] Hiểu tại sao closure giữ EC không bị GC
- [ ] Trả lời được 8/10 câu hỏi phỏng vấn

---

*Last updated: 2026-03-31*
