# Hoisting — JavaScript Đọc Code Trước Khi Chạy

## Câu hỏi mở đầu

Hãy đoán trước khi đọc tiếp:

```javascript
console.log(a); // ①
var a = 5;
console.log(a); // ②

b();             // ③
function b() { console.log('b called'); }

c();             // ④
var c = function() { console.log('c called'); };
```

Kết quả ở ①, ②, ③, ④ lần lượt là gì?

---

Nếu bạn trả lời đúng — `undefined`, `5`, `'b called'`, `TypeError` — bạn đã biết hoisting. Nhưng **tại sao** nó hoạt động như vậy? Đó mới là điều bài này cần.

---

## 1. Bản Chất — JavaScript Thực Sự Làm Gì?

### Compilation vs Execution

Nhiều người nghĩ JS là interpreted language (chạy từ trên xuống). **Sai.** JS là **compiled** (ít nhất ở mức function và module).

Trước khi execute, JS engine làm 2 phase:

```
Phase 1 — COMPILATION / Creation Phase:
  ├── Đọc toàn bộ code
  ├── Tìm var declarations → TẠO biến, gán undefined
  ├── Tìm function declarations → TẠO function, gán code
  └── Tìm let/const → TẠO biến, KHÔNG gán giá trị (TDZ)
      └── TDZ = biến tồn tại nhưng CHƯA thể truy cập

Phase 2 — EXECUTION:
  └── Chạy code từ trên xuống dưới
```

**Hoisting = tên gọi cho quá trình declarations được "kéo lên đầu" trong phase 1.** Thực ra JS không di chuyển code — nó tạo variable object trước khi execute.

### Minh họa bằng suy nghĩ engine

```javascript
// Bạn viết:
console.log(x);
var x = 10;

// JS Engine thấy (tưởng tượng):
var x;                    // ← được "hoist" lên đầu (phase 1)
console.log(x);          // ← code chạy (phase 2)
x = 10;                   // ← gán sau
```

```
Output: undefined

Vì x được tạo với giá trị undefined trong phase 1.
console.log chạy trước khi x được gán = 10.
```

---

## 2. Hoisting Với Từng Loại Declaration

### 2a. `var` — Hoisted với giá trị `undefined`

```javascript
console.log(typeof x); // 'undefined' — không lỗi, x là var
var x = 10;
console.log(x);       // 10

// JS Engine tưởng tượng:
var x;                // ← hoisted
console.log(typeof x); // undefined
x = 10;
console.log(x);       // 10
```

**Quy tắc:** `var` được tạo với giá trị `undefined`. Nên `typeof x` không throw `ReferenceError`, chỉ trả về `'undefined'`.

### 2b. `function` — Hoisted với CẢ BODY

```javascript
hello(); // 'hello' — hoisting!

function hello() {
  console.log('hello');
}

// JS Engine tưởng tượng:
// function hello() {...} ← hoisted CÙNG BODY

hello(); // 'hello'
```

**Đây là lý do `hello()` gọi được TRƯỚC khi function được khai báo.**

### 2c. `var` với function assignment — Hoisted NHƯNG giá trị `undefined`

```javascript
greet(); // TypeError: greet is not a function

var greet = function() {
  console.log('hi');
};
```

```
JS Engine tưởng tượng:
var greet;              // ← hoisted, giá trị = undefined
greet();                 // ← gọi undefined() → TypeError
greet = function() {...} // ← assignment sau
```

**Đây là bug cổ điển:** `function expression` KHÔNG hoist body. Chỉ phần `var` được hoist.

### 2d. `let` và `const` — Hoisted NHƯNG trong TDZ

```javascript
console.log(y); // ReferenceError: Cannot access 'y' before initialization
let y = 20;
```

```
JS Engine tưởng tượng:
let y;                   // ← được hoisted, nhưng...
console.log(y);           // ← TDZ! y CHƯA initialized
let y = 20;              // ← initialized ở đây
```

**TDZ = Temporal Dead Zone:** Biến `let`/`const` đã tồn tại trong scope từ đầu block, nhưng **không thể truy cập cho đến khi đến dòng khai báo**.

### 2e. `const` không thể khai báo trước rồi gán sau

```javascript
// ❌ SyntaxError: Missing initializer in const declaration
const PI;
PI = 3.14;

// ✅ Đúng: khai báo + gán cùng dòng
const PI = 3.14;
```

### 2f. Function declaration vs Expression vs Arrow

| Loại | Hoisted? | Giá trị hoisted | Gọi trước khai báo? |
|------|----------|----------------|-----------------------|
| `function fn(){}` | ✅ | Function object + body | ✅ |
| `var fn = function(){}` | ✅ | `undefined` | ❌ TypeError |
| `let fn = () => {}` | ✅ | TDZ | ❌ ReferenceError |
| `const fn = () => {}` | ✅ | TDZ | ❌ ReferenceError |

---

## 3. Hoisting Trong Thực Tế — Đọc Code Như JS Engine

### Ví dụ 1: Không có hoisting

```javascript
function A() {
  console.log(message); // ?
  var message = 'hello';
  console.log(message); // ?
}
A();
```

```
Phase 1: var message được hoisted lên đầu function A
  var message; // undefined

Phase 2:
  console.log(message); // undefined
  message = 'hello';
  console.log(message); // 'hello'
```

### Ví dụ 2: Function declarations lồng nhau

```javascript
function outer() {
  console.log(inner); // ?
  function inner() { console.log('inner'); }
  inner(); // ?
}
outer();
```

```
Phase 1:
  function inner() {...} ← hoisted lên đầu outer()
  // inner() được tạo với body

Phase 2:
  console.log(inner); // function inner() {...}
  inner(); // 'inner'
```

### Ví dụ 3: Khi nào hoisting gây ra bug

```javascript
var value = 'global';

function test() {
  console.log(value); // ① — in ra gì?
  var value = 'local';
  console.log(value); // ②
}
test();
```

```
Phase 1:
  var value; ← hoisted lên đầu function scope

Phase 2:
  console.log(value); // undefined — tìm thấy var trong function trước global
  value = 'local';
  console.log(value); // 'local'
```

**Điểm mấu chốt:** `var value` bên trong `test()` **shadow** (che) `var value = 'global'`. Và vì `var` được hoisted lên đầu function, nên `console.log(value)` chạy khi `value` đã tồn tại trong function scope nhưng **chưa được gán**.

### Ví dụ 4: Function hoisted lên trên `var`

```javascript
var fn = 'hello';

function fn() {
  return 'function';
}

console.log(typeof fn); // ?
```

```
Phase 1:
  var fn; ← var được hoisted trước
  function fn() {...} ← function hoisted SAU, ghi đè var

Phase 2:
  fn = 'hello'; ← assignment

→ Output: 'string'
```

**Quy tắc:** Function declarations được hoist **SAU** `var` declarations nhưng **TRƯỚC** assignments. Nếu function và var cùng tên, function ghi đè.

### Ví dụ 5: Function declarations vs Arrow trong object

```javascript
const obj = {
  regular: function() { console.log('regular'); },
  arrow: () => { console.log('arrow'); }
};

// Arrow function KHÔNG hoist như một property
// Nhưng cơ chế hoisting không phụ thuộc vào property, mà vào cách khai báo
```

---

## 4. TDZ — Temporal Dead Zone Chi Tiết

### TDZ hoạt động như thế nào?

```javascript
{
  // Đây là TDZ cho x
  console.log(x); // ReferenceError

  let x = 10; // ← TDZ kết thúc tại đây

  console.log(x); // 10 — bình thường
}
```

**TDZ bắt đầu khi:**
- Entry vào block chứa `let`/`const`
- TDZ kết thúc khi execution gặp dòng khai báo `let`/`const`

### TDZ trong switch/loop

```javascript
switch(1) {
  case 1:
    // TDZ cho x bắt đầu
    console.log(y); // ReferenceError
    let y = 5; // TDZ kết thúc
    console.log(y); // 5
}
```

### TDZ và typeof

```javascript
console.log(typeof x); // 'undefined' — var được hoisted với undefined
console.log(typeof y); // ReferenceError — let trong TDZ
let y;
```

**Khác với `var`**, `typeof` trên biến `let` trong TDZ **throw ReferenceError**.

### TDZ trong function parameters

```javascript
function demo(x = y, y = 2) {
  console.log(x, y);
}
demo(); // ReferenceError: Cannot access 'y' before initialization

// Lý do: default parameters được evaluate từ left to right
// Khi x = y, y chưa được initialized (TDZ)
```

---

## 5. Scope + Hoisting — Kết Hợp Tạo Bug

### Bug phổ biến nhất: Shadowing + Hoisting

```javascript
var i = 'global';

for (var i = 0; i < 3; i++) {
  // something
}

console.log(i); // 3 — i global bị ghi đè!
```

```
Phase 1: var i (trong for) được hoisted lên function scope (hoặc global)
Phase 2: var i = 'global' gán sau
         Loop chạy, i tăng đến 3
Output: 3
```

**Fix:** Dùng `let` trong for-loop.

### Bug: Function được gọi nhiều lần, hoisting trong mỗi call

```javascript
function hoist() {
  console.log(x); // undefined
  var x = 10;
}
hoist();
hoist();
```

Mỗi lần gọi `hoist()` tạo **execution context mới** với **biến `x` được hoisted riêng**. Hai lần gọi độc lập nhau.

---

## 6. Câu Hỏi Phỏng Vấn

### Câu 1: Đoán kết quả — class cũng hoist

```javascript
console.log(Foo); // ①
Foo();             // ②
var Foo = 'string';

function Foo() {
  console.log('function');
}
```

**Trả lời:** ① in ra `function Foo() {...}`, ② TypeError: `Foo` is not a function

**Phân tích:**
- `function Foo() {...}` hoisted trước, tạo `Foo` là function
- `var Foo` hoisted sau → nhưng `Foo` đã là function rồi, không đổi
- `Foo = 'string'` assignment chạy sau → ghi đè `Foo` thành string
- Gọi `Foo()` → TypeError vì `Foo` giờ là string

---

### Câu 2: let trong for-loop tạo scope mới mỗi iteration

```javascript
for (let i = 0; i < 3; i++) {
  let i = 100; // có lỗi không?
  console.log(i);
}
```

**Trả lời:** SyntaxError: Identifier 'i' has already been declared

Mỗi `let i` trong for header tạo một binding mới. `let i = 100` trong body tạo **block scope riêng** — nhưng trùng tên binding? Không, đây là **block scope** khác. Thực ra:

```javascript
// Đúng hơn: for (let i) tạo block-scoped i
for (let i = 0; i < 3; i++) {
  // i trong header tồn tại ở đây
  // let i = 100 cố gán lại cùng binding
  let i = 100; // SyntaxError — không thể redeclare cùng binding trong cùng scope
}
```

**Nhưng:**

```javascript
for (let i = 0; i < 3; i++) {
  {
    let i = 100; // ✅ được — block {} mới tạo scope riêng
    console.log(i); // 100
  }
  console.log(i); // 0, 1, 2
}
```

---

### Câu 3: Hoisting trong IIFE

```javascript
var x = 1;
(function() {
  console.log(x); // ①
  var x = 2;
  console.log(x); // ②
})();
console.log(x);   // ③
```

**Trả lời:** ① `undefined`, ② `2`, ③ `1`

**Phân tích:**
- IIFE tạo function scope riêng
- `var x` bên trong hoist lên đầu IIFE scope → shadow global `x`
- ①: `x` đã tồn tại (undefined), chưa gán
- ②: `x = 2` assignment đã chạy
- ③: global `x` không bị ảnh hưởng

---

### Câu 4: let trong if/else

```javascript
function test(condition) {
  if (condition) {
    console.log(value);
    const value = 10;
  } else {
    console.log(value);
  }
}

test(true);  // ①
test(false); // ②
```

**Trả lời:** ① ReferenceError (TDZ), ② ReferenceError

**Phân tích:**
- `const value = 10` hoist trong block `if`, nhưng TDZ
- `console.log(value)` chạy trước khi `const value` initialized → TDZ error
- Block `else` không khai báo `value` → ReferenceError luôn

---

### Câu 5: Function hoisted, class expression không

```javascript
console.log(f); // ①
console.log(c); // ②

function f() { return 'f'; }
const c = function() { return 'c'; };
```

**Trả lời:** ① `function f() {...}`, ② ReferenceError

- `function f()` hoisted với body → có thể truy cập
- `const c` hoisted nhưng TDZ → chưa initialized → ReferenceError

---

### Câu 6: Multiple var declarations

```javascript
var a = 1;
var a;
console.log(a); // ?
```

**Trả lời:** `1`

**Phân tích:** `var a;` không ghi đè giá trị. Nó chỉ khai báo lại. `a` đã là `1` từ assignment trước đó → giữ nguyên.

```javascript
var a = 1;
var a = 2;
console.log(a); // 2 — assignment ghi đè
```

---

### Câu 7: hoist trong strict mode

```javascript
'use strict';

function hoist() {
  x = 10; // có lỗi không?
  console.log(x);
}
hoist();
```

**Trả lời:** ReferenceError (strict mode không cho implicit global)

---

### Câu 8: Constructor và hoisting

```javascript
function Person(name) {
  this.name = name;
}

const p = new Person('Alice');
console.log(p.name); // 'Alice'

// Class declaration cũng hoist
console.log(typeof Animal); // 'function' — class được hoisted
class Animal {}
```

---

### Câu 9: Hoisting + module scope

```javascript
// module-a.js
console.log(x); // ?
let x = 1;

// module-b.js
console.log(x); // ?
var x = 2;
```

**Trả lời:** module-a: `ReferenceError` (TDZ), module-b: `undefined` (var hoisted)

**Điểm khác nhau:** Module scope hoisting hoạt động khác:
- `var` trong module → hoisted như bình thường
- `let`/`const` trong module → hoisted nhưng TDZ (module scope cũng là block scope)

---

### Câu 10: Closures + hoisting

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(function() {
    console.log(i);
  }, 0);
}

console.log(i); // ?
```

**Trả lời:** `console.log(i)` in `3, 3, 3`, sau đó `console.log(i)` in `3`

**Giải thích:**
- `var i` hoisted lên function/global scope
- `setTimeout` callbacks chạy SAU loop kết thúc
- Sau loop: `i = 3`
- Cả 3 closures bắt cùng biến `i`

---

## 7. Tổng Hợp

```
┌─────────────────────────────────────────────────────┐
│  Phase 1 (Compilation): Declarations được xử lý    │
│  Phase 2 (Execution): Code chạy từ trên xuống      │
│                                                     │
│  var       → hoisted, giá trị = undefined         │
│  function  → hoisted, giá trị = function object   │
│  let/const → hoisted, giá trị = TDZ (chưa dùng được)│
│                                                     │
│  ⚠️ var chỉ bị hoisted trong function scope       │
│  ⚠️ let/const hoisted trong BLOCK scope           │
│  ⚠️ function hoisted SAU var nhưng TRƯỚC assign   │
│  ⚠️ Function expression không hoist body          │
└─────────────────────────────────────────────────────┘
```

---

## 8. Mối Liên Hệ

```
Hoisting
  ├── Scope (001)    ← hoisting xảy ra trong từng scope
  ├── Closure (002)  ← hoisted variable + closure = nhiều bug
  ├── Execution Context (006) ← phase 1 = creation phase
  └── TDZ (003)      ← hoisting + let/const = TDZ
```

---

## Checklist

- [ ] Giải thích được 2 phase: compilation → execution
- [ ] Phân biệt được hoisting của var, function, let, const
- [ ] Hiểu TDZ là gì, tại sao tồn tại
- [ ] Dự đoán được kết quả của code hoisting
- [ ] Biết function expression vs declaration khác nhau chỗ nào
- [ ] Trả lời được 8/10 câu hỏi phỏng vấn

---

*Last updated: 2026-03-31*
