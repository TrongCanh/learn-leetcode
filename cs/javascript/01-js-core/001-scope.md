# Scope — Ai Thấy Ai, Ai Trả Lời

## Trước khi bắt đầu

Nếu bạn hỏi một senior dev: *"Scope trong JS là gì?"*, câu trả lời phổ biến nhất sẽ là: *"À, nó quyết định cái gì thấy cái gì thôi."*

Đúng, nhưng **sai lầm nghiêm trọng** là dừng lại ở đó. Vì khi đi sâu hơn một chút — ai thấy ai, **bằng cách nào**, và **khi nào** — mới là chỗ phân biệt người hiểu thật với người học vẹt.

Bài này sẽ không liệt kê. Sẽ giải thích.

---

## Nguồn gốc vấn đề — Tại sao cần Scope?

Nghĩ về một hàm đơn giản:

```javascript
const name = 'Alice';

function greet() {
  console.log(name); // lấy từ đâu?
}

function main() {
  const name = 'Bob';
  greet(); // in ra 'Alice' hay 'Bob'?
}

main(); // ?
```

Câu hỏi: `greet()` được gọi từ `main()`, nơi `name = 'Bob'`. Vậy nó in gì?

Câu trả lời: **`'Alice'`**.

Vì sao? Vì JS quyết định giá trị biến dựa trên **nơi hàm được VIẾT**, không phải nơi hàm được GỌI. Cơ chế đó gọi là **lexical scope**.

---

## Lexical Scope — Quy tắc quan trọng nhất

### Bản chất

> Khi một function được **định nghĩa**, JavaScript **ghi nhớ** environment (phạm vi) nơi nó được viết. Và sau đó, **dù gọi ở đâu**, nó vẫn thấy biến từ chính nơi đó.

Quay lại ví dụ trên:

```javascript
const name = 'Alice';        // ← được ghi nhớ bởi greet()

function greet() {
  console.log(name);         // → tìm 'name' trong phạm vi đã ghi nhớ
}

function main() {
  const name = 'Bob';        // ← greet() không thấy biến này
  greet();
}

main(); // 'Alice'
```

`greet()` được viết ở global scope → nó thấy global `name = 'Alice'`. Dù sau đó `main()` tạo một biến `name` cục bộ, `greet()` không quan tâm.

### Tại sao lại thiết kế như vậy?

Đây là **design decision**, không phải bug. Lexical scope cho phép bạn:

```javascript
// 1. Tái sử dụng hàm ở nhiều nơi mà không lo biến bị thay đổi
function makeLogger(prefix) {
  return function(message) {
    console.log(`[${prefix}] ${message}`);
  };
}

const info = makeLogger('INFO');
const error = makeLogger('ERROR');

info('User logged in');     // [INFO] User logged in
error('Connection failed'); // [ERROR] Connection failed

// prefix được "bắt" (capture) bởi inner function
// dù info và error được gọi ở đâu, prefix vẫn đúng
```

Nếu JS dùng **dynamic scope** (quyết định theo call site), `prefix` sẽ bị thay đổi mỗi lần gọi → không thể predict được.

---

## Ba Cái Scope Bạn Cần Nhớ

### 1. Global Scope — Chỉ có MỘT, và KHÔNG nên lạm dụng

```javascript
// Browser environment
var globalMessage = 'hello';

// Biến này gắn vào window
console.log(window.globalMessage); // 'hello'

// ⚠️ Vấn đề: nếu thư viện A đặt biến 'config'
// và thư viện B cũng đặt 'config' → conflict
// Bạn không biết ai ghi đè ai
```

```javascript
// Node.js environment
var globalMessage = 'hello';

// var gắn vào global object trong Node
console.log(global.globalMessage); // 'hello'

// const/let trong module không gắn global
const localMessage = 'hello';
console.log(global.localMessage); // undefined ✅
```

**Nguyên tắc:** Global scope chỉ dùng cho hằng số thật sự (như `Math.PI`), hoặc khai báo app entry point. Không tạo object ngẫu nhiên ở global.

### 2. Function Scope — var sống ở đây

```javascript
function process() {
  if (true) {
    var temporary = 'I exist everywhere in function';
  }

  console.log(temporary); // ✅ vẫn thấy được
}

process();
console.log(temporary); // ❌ ReferenceError — vì temporary không thuộc global
```

`var` **không có block scope** — nó chỉ bị giới hạn bởi **function**. Dù `if`, `for`, hay `{}` bất kỳ, `var` đều "nhìn xuyên qua".

Đây là source của **vô số bug**:

```javascript
// Bug kinh điển
function checkPermission(roles) {
  if (roles.includes('admin')) {
    var message = 'Welcome, admin!';
  } else {
    var message = 'Access denied.'; // var được hoisted lên đầu function
  }

  return message; // luôn trả được message, không lỗi
}
```

Code trên hoạt động đúng? Có. Nhưng logic mơ hồ. Nếu ai đó refactor thành:

```javascript
function checkPermission(roles) {
  if (roles.includes('admin')) {
    var message = 'Welcome, admin!';
  }

  return message; // ❌ undefined nếu không phải admin — bug!
}
```

Bạn sẽ mất cả buổi debugging vì `var` không có block scope.

### 3. Block Scope — let và const

```javascript
function checkPermission(roles) {
  if (roles.includes('admin')) {
    let message = 'Welcome, admin!'; // chỉ tồn tại trong block if này
  }

  return message; // ❌ ReferenceError ngay lập tức — dễ debug hơn
}
```

`let` và `const` tôn trọng `{}`. Nếu khai báo trong block, chỉ block đó và nested blocks thấy được.

**Khi nào dùng:**

| Keyword | Khi nào dùng | Reassign được? |
|---------|-------------|----------------|
| `const` | Khi giá trị không thay đổi | ❌ (nhưng object/array thì mutate được) |
| `let` | Khi cần gán lại | ✅ |
| `var` | **Không bao giờ** trong code mới | ✅ |

---

## Scope Resolution — Ai Tìm Ai, Theo Thứ Tự Nào?

Khi JavaScript gặp một biến:

```
1. Tìm trong scope HIỆN TẠI (local)
   └── Không thấy

2. Tìm trong scope CHA gần nhất
   └── Không thấy

3. Lặp lại cho đến MODULE SCOPE
   └── Không thấy

4. Tìm trong GLOBAL SCOPE
   └── Không thấy

5. → ReferenceError: x is not defined
```

### Minh họa bằng code

```javascript
const global = 'global';

function level1() {
  const outer = 'level1';

  function level2() {
    const inner = 'level2';
    console.log(global);  // ① global scope
    console.log(outer);   // ② parent scope
    console.log(inner);   // ③ local scope
  }

  level2();
  console.log(inner);     // ❌ ReferenceError
}

level1();
```

### Scope Resolution: Dự đoán kết quả

```javascript
const languages = ['JS', 'Python', 'Go'];

function show() {
  console.log(languages); // languages ở đâu?
}

function run() {
  const languages = ['Vietnamese', 'English'];
  show(); // in ra gì?
}

run(); // ?
```

Đáp án: `['JS', 'Python', 'Go']`. Vì `show()` được viết ở module scope, nó thấy biến `languages` ở module scope. `run()` tạo biến `languages` cục bộ không ảnh hưởng gì.

---

## Câu Hỏi Phỏng Vấn — Từ Dễ Đến Khó

### Câu 1: for-loop — bug cổ điển

Đây là câu hỏi **bắt buộc** trong mọi buổi phỏng vấn JS.

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
```

**Câu hỏi:** Kết quả là gì? Tại sao?

**Trả lời:** `3, 3, 3`.

Lý do: `var` không có block scope. Cả 3 callback tham chiếu đến **cùng một biến** `i`. Khi `setTimeout` chạy, vòng for đã kết thúc, `i = 3`.

**Câu hỏi tiếp theo:** Làm sao sửa?

```javascript
// Cách 1: dùng let
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}

// Cách 2: IIFE tạo scope riêng cho mỗi iteration
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(() => console.log(j), 0);
  })(i);
}

// Cách 3: thêm block scope rõ ràng
for (var i = 0; i < 3; i++) {
  {
    let j = i; // block riêng
    setTimeout(() => console.log(j), 0);
  }
}
```

---

### Câu 2: Shadowing

```javascript
const name = 'global';

function outer() {
  const name = 'outer';

  function inner() {
    const name = 'inner';
    console.log(name);
  }

  console.log(name);
  inner();
}

outer();
console.log(name);
```

**Câu hỏi:** In ra gì, theo thứ tự nào?

**Trả lời:** `outer`, `inner`, `global`.

**Phân tích:**
- `outer()` được gọi → `console.log(name)` → tìm `name` trong `outer` scope → `'outer'`
- `inner()` được gọi → `console.log(name)` → tìm trong `inner` scope → `'inner'`
- Sau `outer()` kết thúc → `console.log(name)` → global scope → `'global'`

**Lưu ý quan trọng:** `const name = 'inner'` **shadow** (che) `const name = 'outer'`, nhưng không sửa đổi nó. Đây là 3 biến khác nhau trong 3 scope khác nhau.

---

### Câu 3: Global pollution

```javascript
function process(data) {
  result = transform(data); // thiếu const/let/var
  return result;
}

process({ value: 10 });
console.log(result); // ?
```

**Câu hỏi:** `console.log(result)` in ra gì? Có lỗi không?

**Trả lời:** In ra kết quả của `transform({ value: 10 })`. **Không có lỗi.** Vì `result` không được khai báo → JS tự tạo biến global. Đây là **anti-pattern cực kỳ nguy hiểm**, và **strict mode** sẽ throw `ReferenceError`.

```javascript
'use strict';

function process(data) {
  result = transform(data); // ReferenceError: result is not defined
  return result;
}
```

---

### Câu 4: Module scope isolation

```javascript
// file: config.js
const API_KEY = 'secret123';

// file: app.js
const API_KEY = 'override'; // có ảnh hưởng config.js không?
console.log(API_KEY); // in gì?
```

**Trả lời:** Không ảnh hưởng. Mỗi ESM file có **module scope riêng biệt**. Biến `API_KEY` ở `config.js` không thể truy cập từ `app.js` (trừ khi export), và `app.js` tạo biến `API_KEY` hoàn toàn độc lập.

---

### Câu 5: Temporal Dead Zone (TDZ)

```javascript
{
  console.log(x); // ①
  const x = 5;    // ②
  console.log(x); // ③
}
```

**Câu hỏi:** Dòng nào lỗi? Lỗi gì?

**Trả lời:**
- Dòng ①: `ReferenceError` — vì `x` đang trong **Temporal Dead Zone**. `const x` được hoisted nhưng chưa initialized. Truy cập trước khai báo → TDZ error.
- Dòng ③: In ra `5` — bình thường.

**Câu hỏi tiếp:** `var` thì sao?

```javascript
{
  console.log(y); // undefined — var được hoisted với giá trị undefined
  var y = 5;
  console.log(y); // 5
}
```

**Sự khác biệt chính:** `var` hoisted với giá trị `undefined`. `let`/`const` hoisted nhưng **không thể truy cập** (TDZ). TDZ là lý do `let`/`const` "an toàn" hơn.

---

### Câu 6: Closures "bắt" biến, không bắt giá trị

```javascript
function buildFunctions() {
  const funcs = [];

  for (var i = 0; i < 3; i++) {
    funcs.push(function() {
      console.log(i);
    });
  }

  return funcs;
}

const fns = buildFunctions();
fns[0](); // ?
fns[1](); // ?
fns[2](); // ?
```

**Trả lời:** `3, 3, 3`

**Câu hỏi tiếp theo:** Sửa lại để in `0, 1, 2`.

```javascript
// Cách 1: dùng let thay var
for (let i = 0; i < 3; i++) {
  funcs.push(function() { console.log(i); });
}

// Cách 2: IIFE closure
for (var i = 0; i < 3; i++) {
  funcs.push(
    (function(j) {
      return function() { console.log(j); };
    })(i)
  );
}

// Cách 3: dùng Array.from với callback
funcs = Array.from({ length: 3 }, (_, i) => () => console.log(i));
```

---

### Câu 7: Scope trong strict mode

```javascript
'use strict';

function test() {
  // ①
  undeclaredVar = 10; // có lỗi không?
  // ②
  console.log(undeclaredVar);
}

test();
```

**Trả lời:** `ReferenceError` tại dòng `undeclaredVar = 10` — **strict mode** ngăn tạo biến global ngầm.

---

### Câu 8: this ≠ scope

Đây là câu hay nhầm lẫn nhất.

```javascript
const obj = {
  name: 'Alice',
  greet() {
    console.log(this.name); // this ở đây là obj
  }
};

const greetFn = obj.greet;
greetFn(); // in gì?
```

**Trả lời:** `undefined` (hoặc lỗi strict mode). `this` **không liên quan** đến scope chain. `this` được resolve dựa trên **call site** (cách gọi hàm), không phải lexical environment.

```javascript
// Vấn đề: this bị mất khi tách ra
greetFn(); // call site: undefined/global context → this = undefined/window
obj.greet(); // call site: obj → this = obj
```

---

### Câu 9: for...in và for...of với var

```javascript
const obj = { a: 1, b: 2, c: 3 };

for (var key in obj) {
  setTimeout(() => console.log(key), 0);
}
```

**Trả lời:** `c, c, c` — tương tự for-loop. `var` function-scoped → cùng một biến `key`.

```javascript
// Sửa bằng let
for (let key in obj) {
  setTimeout(() => console.log(key), 0);
}
// In ra: a, b, c — mỗi iteration tạo scope riêng
```

---

### Câu 10: Switch block và scope

```javascript
const color = 'red';

switch (color) {
  case 'red':
    var message = 'danger'; // var không bị giới hạn trong case
    break;
  case 'blue':
    var message = 'calm';
    break;
}

console.log(message); // ?
```

**Trả lời:** `'danger'`

**Lưu ý:** Khối `switch` không tạo block scope riêng. `var` thấy xuyên qua case. Nếu dùng `const`/`let`, phải bọc trong `{}`:

```javascript
switch (color) {
  case 'red': {
    const message = 'danger'; // block scope riêng
    console.log(message);
    break;
  }
}
```

---

### Tổng hợp: Điều gì sẽ xảy ra?

| Đoạn code | Kết quả | Lý do |
|-----------|---------|-------|
| `for(var) + setTimeout` | `3,3,3` | var function-scoped, closure bắt cùng 1 biến |
| `for(let) + setTimeout` | `0,1,2` | let block-scoped, mỗi iteration khác biến |
| `const x` trước `console.log(x)` | `ReferenceError` | TDZ |
| `var x` trước `console.log(x)` | `undefined` | hoisted với giá trị `undefined` |
| `undeclared = value` (strict) | `ReferenceError` | strict mode không cho tạo global ngầm |
| `for...in var` + setTimeout | `c,c,c` | var function-scoped, cùng biến `key` |
| `fn = obj.method; fn()` | `undefined` | `this` bị mất khi tách khỏi object |
| `const fn = () => { this }` | `this` = enclosing object | arrow function không có `this` riêng |

---

### Checklist Trước Khi Qua Bài Tiếp

- [ ] Giải thích được lexical scope bằng lời, không cần code
- [ ] Dự đoán được output của nested function scopes
- [ ] Hiểu tại sao var trong for-loop in ra 3,3,3
- [ ] Biết cách tránh global pollution
- [ ] Giải thích được scope resolution order
- [ ] Trả lời được 8/10 câu hỏi phỏng vấn trên

---

## Closures + Scope — Sự Kết Hợp Quan Trọng

Bạn sẽ học closure chi tiết ở bài riêng. Nhưng ở đây cần hiểu:

> **Closure = function + lexical scope.** Closure là cách function "nhớ" scope của nó, ngay cả khi scope đó đã kết thúc.

```javascript
function createCounter() {
  let count = 0; // biến này thuộc scope của createCounter

  return function increment() {
    count++; // inner function thấy count vì lexical scope
    return count;
  };
}

const counter1 = createCounter(); // scope mới được tạo, count = 0
const counter2 = createCounter(); // scope MỚI KHÁC, count = 0 riêng

console.log(counter1()); // 1
console.log(counter1()); // 2
console.log(counter2()); // 1 ← hoàn toàn độc lập
```

---

## Tổng Hợp — Bảng So Sánh Cuối Bài

| Tiêu chí | Global | Function | Block |
|----------|--------|----------|-------|
| Giới hạn bởi | Toàn bộ runtime | Function gần nhất | `{}` gần nhất |
| var | ✅ | ✅ | ❌ (đi qua) |
| let/const | ❌ | ✅ | ✅ |
| Hoisting | ⚠️ có thể gây bug | ⚠️ | ⚠️ TDZ |
| Nên dùng cho | Hằng số, entry point | Logic tách biệt | Biến tạm thời |

---

## Mối Liên Hệ Đến Các Chủ Đề Khác

```
Scope
  ├── Hoisting (003) — hoisting hoạt động trong từng scope
  ├── Closure (002)  — closure = function bắt lexical scope
  ├── Execution Context (006) — scope được tạo khi enter EC
  ├── this (004)     — this được resolve khác với scope
  └── Module (06)    — module scope = phạm vi của 1 ESM file
```

---

## Checklist Trước Khi Qua Bài Tiếp

- [ ] Giải thích được lexical scope bằng lời, không cần code
- [ ] Dự đoán được output của nested function scopes
- [ ] Hiểu tại sao var trong for-loop in ra 3,3,3
- [ ] Biết cách tránh global pollution
- [ ] Giải thích được scope resolution order
- [ ] Trả lời được 8/10 câu hỏi phỏng vấn trên
- [ ] Phân biệt được TDZ của let/const vs undefined của var

---

*Last updated: 2026-03-31*
