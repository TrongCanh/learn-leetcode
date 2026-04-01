# Closure — Cái Gì Được Nhớ, Và Nhớ Ở Đâu

## Mở đầu bằng một câu hỏi

Hãy đoán kết quả trước:

```javascript
function makeAdder(x) {
  return function(y) {
    return x + y;
  };
}

const add5 = makeAdder(5);
const add10 = makeAdder(10);

console.log(add5(2));   // ?
console.log(add10(2)); // ?
console.log(add5 === add10); // ?
```

Nếu bạn trả lời `7, 12, false` — bạn đã hiểu closure ở mức surface.

Nhưng câu hỏi thật sự là: **"JavaScript làm sao biết `x = 5` khi gọi `add5(2)`?"**

Và câu hỏi hay nhất: **"Tại sao closure có thể gây memory leak?"**

Bài này trả lời cả hai.

---

## 1. Bản Chất — Closure Là Gì, Thật Sự?

### Định nghĩa chuẩn

> **Closure = function + reference đến lexical environment của nó.**

Mỗi function trong JavaScript có một property ẩn tên là `[[Environment]]` (hay `[[Scope]]` trong spec cũ). Property này trỏ đến **lexical scope nơi function được tạo**.

Khi function được gọi, JS dùng `[[Environment]]` để resolve biến — không cần biết function được gọi từ đâu.

### Minh họa bằng tay

```javascript
function outer() {
  const message = 'hello';

  function inner() {
    console.log(message);
  }

  return inner;
}

const fn = outer(); // outer() kết thúc, message "nên" bị xóa
fn(); // 'hello' — message vẫn còn!
```

```
Khi outer() chạy:
  1. Tạo execution context của outer
  2. Khai báo message = 'hello'
  3. Tạo inner() → inner.[[Environment]] = outer scope (nơi inner được viết)
  4. return inner (inner được trả ra, outer context kết thúc)
  5. outer scope "nên" bị GC'd... nhưng KHÔNG vì inner vẫn giữ reference

Khi fn() chạy:
  1. fn = inner, fn() = inner()
  2. inner cần message → đi theo [[Environment]] chain
  3. Tìm message trong outer scope → 'hello'
```

### `[[Environment]]` là gì?

```javascript
// Bạn không truy cập được [[Environment]] trực tiếp
// Nhưng spec gọi nó là LexicalEnvironment
function makeGreeter(greeting) {
  return function(name) {
    return `${greeting}, ${name}!`;
  };
}

const sayHi = makeGreeter('Hi');
const sayBye = makeGreeter('Bye');

sayHi('Alice'); // 'Hi, Alice!'
sayBye('Bob');  // 'Bye, Bob!'
```

Mỗi `makeGreeter()` tạo một **lexical environment riêng**:

```
sayHi [[Environment]] ──→ { greeting: 'Hi' }  ← environment 1
sayBye [[Environment]] ──→ { greeting: 'Bye' } ← environment 2
```

Hai environment hoàn toàn độc lập. `greeting` của `sayHi` không bao giờ thay đổi dù gọi `sayBye` bao nhiêu lần.

---

## 2. Ứng Dụng Thực Tế — Không Phải Chỉ Để Phỏng Vấn

### 2a. Data Privacy (Đóng gói dữ liệu)

Đây là ứng dụng quan trọng nhất của closure. JS không có `private` keyword (trước ES2022), nên closure là cách duy nhất để ẩn dữ liệu.

```javascript
function createBankAccount(initialBalance) {
  let balance = initialBalance; // private — không truy cập được từ bên ngoài

  return {
    deposit(amount) {
      if (amount <= 0) throw new Error('Amount must be positive');
      balance += amount;
      return balance;
    },
    withdraw(amount) {
      if (amount > balance) throw new Error('Insufficient funds');
      balance -= amount;
      return balance;
    },
    getBalance() {
      return balance;
    }
  };
}

const account = createBankAccount(1000);
console.log(account.getBalance()); // 1000
account.deposit(500);
account.withdraw(200);
console.log(account.getBalance()); // 1300

// balance không thể truy cập trực tiếp
console.log(account.balance); // undefined
```

**Điểm mấu chốt:** `balance` nằm trong scope của `createBankAccount`. Các method được return (deposit, withdraw, getBalance) giữ closure trên `balance`. Code bên ngoài không có cách nào truy cập `balance` trực tiếp.

### 2b. Function Factory (Tạo hàm theo config)

```javascript
function multiply(factor) {
  return function(number) {
    return number * factor;
  };
}

const double = multiply(2);
const triple = multiply(3);
const powerOf4 = multiply(4);

[1, 2, 3, 4, 5].map(double);   // [2, 4, 6, 8, 10]
[1, 2, 3, 4, 5].map(triple);  // [3, 6, 9, 12, 15]
[1, 2, 3, 4, 5].map(powerOf4); // [4, 8, 12, 16, 20]
```

Thay vì viết 3 hàm riêng, một factory function + closure giải quyết gọn.

### 2c. Memoization (Cache kết quả tính toán)

```javascript
function memoize(fn) {
  const cache = new Map(); // cache nằm trong closure, riêng cho mỗi fn

  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key); // trả cached result
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// Ví dụ: tính Fibonacci với memoization
function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}

const fastFib = memoize(fib);

// Không memoize: O(2^n) — rất chậm với n lớn
// Có memoize: O(n) — nhanh đáng kể

console.time('memoized');
console.log(fastFib(40)); // 102334155
console.timeEnd('memoized'); // ~0.1ms

console.time('normal');
console.log(fib(40));
console.timeEnd('normal'); // ~1000ms
```

`cache` Map không bao giờ bị truy cập từ bên ngoài. Chỉ inner function được return mới thấy nó.

### 2d. Currying (Chuyển hàm nhiều tham số thành chuỗi)

```javascript
// Currying: f(a, b, c) → f(a)(b)(c)
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...args2) {
      return curried.apply(this, args.concat(args2));
    };
  };
}

const add = curry((a, b, c) => a + b + c);

add(1)(2)(3);    // 6
add(1, 2)(3);    // 6
add(1)(2, 3);    // 6
add(1, 2, 3);    // 6
```

Mỗi lần gọi `add(1)` tạo một closure giữ `a = 1`. Gọi tiếp `add(1)(2)` tạo closure giữ `a = 1, b = 2`. Cứ thế cho đến khi đủ tham số.

### 2e. Partial Application

```javascript
function sendRequest(method, url, data, headers) {
  return fetch(url, { method, headers, body: JSON.stringify(data) });
}

// Tạo hàm chuyên biệt từ hàm tổng quát
const postJSON = curry(sendRequest)('POST');
const apiPost = postJSON('https://api.example.com/users');
const authenticatedPost = apiPost.withHeaders({ Authorization: 'Bearer token' });

// Sử dụng:
authenticatedPost({ name: 'Alice' });
```

---

## 3. Những Traps — Ai Cũng Gặp

### Trap 1: Closure bắt biến, không phải giá trị

```javascript
// ❌ Bug kinh điển
const funcs = [];
for (var i = 0; i < 3; i++) {
  funcs.push(function() {
    console.log(i);
  });
}

funcs[0](); // 3
funcs[1](); // 3
funcs[2](); // 3

// Giải thích: var i là MỘT biến duy nhất trong function scope
// Cả 3 closures bắt CÙNG biến i
// Khi loop kết thúc, i = 3
```

```javascript
// ✅ Fix bằng let
const funcs = [];
for (let i = 0; i < 3; i++) { // let tạo biến MỚI cho mỗi iteration
  funcs.push(function() {
    console.log(i);
  });
}

funcs[0](); // 0
funcs[1](); // 1
funcs[2](); // 2
```

```javascript
// ✅ Fix bằng IIFE (trước khi let ra đời)
const funcs = [];
for (var i = 0; i < 3; i++) {
  funcs.push(
    (function(j) {
      return function() { console.log(j); };
    })(i)
  );
}

funcs[0](); // 0
funcs[1](); // 1
funcs[2](); // 2
```

### Trap 2: Closure + setTimeout trong loop

```javascript
// ❌ Không như mong đợi
for (var i = 1; i <= 3; i++) {
  setTimeout(function() {
    console.log(i);
  }, i * 1000);
}
// Sau 1s: in 4, 4, 4 (vì var, cùng biến i)
```

```javascript
// ✅ Tường minh với block scope
for (var i = 1; i <= 3; i++) {
  {
    let j = i; // scope riêng
    setTimeout(function() {
      console.log(j);
    }, j * 1000);
  }
}
// In ra: 1, 2, 3
```

### Trap 3: Closures giữ reference, không phải snapshot

```javascript
let count = 0;
const increment = () => {
  count++;
  return count;
};

console.log(increment()); // 1
console.log(increment()); // 2

count = 100; // thay đổi từ bên ngoài
console.log(increment()); // 101 — count đã bị thay đổi!
```

Closure **không copy** giá trị. Nó giữ **reference** đến scope. Nếu biến trong scope thay đổi, closure thấy giá trị mới nhất.

### Trap 4: Closures giữ toàn bộ scope

```javascript
function processData() {
  // BIG dataset — 10MB
  const bigData = new Array(10 * 1024 * 1024).fill('x');

  const result = bigData.filter(x => x.length > 0).map(x => x);

  // ❌ Closure giữ reference đến bigData
  // bigData không thể GC cho đến khi processData kết thúc
  return function() {
    return result.length; // chỉ cần result, nhưng bigData vẫn sống
  };
}

// ✅ Fix: giải phóng bigData sau khi dùng
function processDataFixed() {
  const bigData = new Array(10 * 1024 * 1024).fill('x');
  const result = bigData.filter(x => x.length > 0).map(x => x);

  // Clear reference để GC có thể dọn bigData
  bigData.length = 0;

  return function() {
    return result.length;
  };
}
```

Đây là **memory leak pattern** phổ biến nhất liên quan đến closure.

### Trap 5: Event handler trong loop

```javascript
// ❌
const buttons = document.querySelectorAll('button');
for (var i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener('click', function() {
    console.log('Clicked button', i); // luôn in index CUỐI
  });
}

// ✅
const buttons = document.querySelectorAll('button');
for (let i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener('click', function() {
    console.log('Clicked button', i); // đúng index
  });
}

// ✅ Cách khác: dùng forEach
buttons.forEach(function(button, i) {
  button.addEventListener('click', function() {
    console.log('Clicked button', i);
  });
});
```

---

## 4. Câu Hỏi Phỏng Vấn — Từ Dễ Đến Khó

### Câu 1: Đoán kết quả

```javascript
function buildList(list) {
  const result = [];
  for (var i = 0; i < list.length; i++) {
    result.push(function() {
      console.log('item ' + i + ': ' + list[i]);
    });
  }
  return result;
}

const fnlist = buildList([10, 20, 30]);
fnlist[0](); // ?
fnlist[1](); // ?
fnlist[2](); // ?
```

**Trả lời:** `item 3: undefined` x3

**Phân tích:**
- `var i` function-scoped → cùng một biến `i`
- Sau loop: `i = 3`, `list[3] = undefined`
- Cả 3 closures cùng tham chiếu `i` và `list[i]`

**Fix:**

```javascript
// Cách 1: dùng let
for (let i = 0; i < list.length; i++)

// Cách 2: IIFE
for (var i = 0; i < list.length; i++) {
  result.push(
    (function(j) {
      return function() {
        console.log('item ' + j + ': ' + list[j]);
      };
    })(i)
  );
}

// Cách 3: forEach
list.forEach((item, i) => {
  result.push(function() {
    console.log('item ' + i + ': ' + item);
  });
});
```

---

### Câu 2: Private counter với closure

```javascript
function counter() {
  let count = 0;

  return {
    increment: () => ++count,
    decrement: () => --count,
    getValue: () => count
  };
}

const c1 = counter();
const c2 = counter();

c1.increment();
c1.increment();
c1.increment();
c2.decrement();

console.log(c1.getValue()); // ?
console.log(c2.getValue()); // ?
```

**Trả lời:** `3, -1`

Mỗi `counter()` tạo scope mới với `count` riêng. `c1` và `c2` hoàn toàn độc lập.

---

### Câu 3: Closures với setTimeout — thứ tự in

```javascript
function test() {
  for (var i = 0; i < 3; i++) {
    setTimeout(function() {
      console.log(i);
    }, 0);
  }

  console.log('after loop:', i);
}

test();
```

**Trả lời:**
```
after loop: 3
3
3
3
```

**Phân tích:**
1. `for` loop chạy đồng bộ — `setTimeout` đẩy callback vào task queue
2. `console.log('after loop:', i)` chạy TRƯỚC setTimeout callbacks
3. Sau loop: `i = 3`
4. Event loop empty → chạy 3 callbacks, mỗi in `3`

---

### Câu 4: "Closures có thể thay đổi biến outer scope không?"

```javascript
let x = 10;

function outer() {
  // x được tham chiếu → outer giữ closure trên outer scope (global)
  return function inner() {
    x++;
    return x;
  };
}

const fn = outer();
console.log(fn()); // 11
console.log(x);    // 11 — x đã bị thay đổi!
```

**Trả lời:** Có, closures có thể **đọc và ghi** biến outer scope. Không giống const (không gán lại được), nhưng closure không ngăn việc gán.

```javascript
// Nếu dùng const trong outer scope:
function outer() {
  const x = 10;
  return function inner() {
    x++; // TypeError: Assignment to constant variable
  };
}
```

---

### Câu 5: "Tạo 100 closures, chúng chia sẻ scope không?"

```javascript
function createFunctions() {
  const funcs = [];
  for (var i = 0; i < 100; i++) {
    funcs.push(function() { return i; });
  }
  return funcs;
}

const funcs = createFunctions();
console.log(funcs[50]()); // ?
console.log(funcs[99]()); // ?
```

**Trả lời:** `100, 100`

**Lý do:** `var i` function-scoped → MỘT `i` cho cả function. Loop chạy đến khi `i = 100`, cả 100 closures đều tham chiếu cùng `i = 100`.

---

### Câu 6: Closure trong callback — `this` bị mất

```javascript
function Counter() {
  this.count = 0;

  // Closure bắt this.count
  this.increment = function() {
    return this.count++; // this ở đây là gì?
  };
}

const counter = new Counter();
console.log(counter.increment()); // NaN — this.count là undefined
```

**Trả lời:** `NaN`

**Phân tích:** `this` trong `increment` phụ thuộc call site. `counter.increment()` → `this = counter`, nhưng... thực ra vấn đề ở đây là `this.count++` → `undefined++` → `NaN`.

```javascript
// ✅ Fix bằng arrow function
this.increment = () => {
  return this.count++; // arrow không có this riêng, dùng this của Counter
};

// ✅ Hoặc bind
this.increment = function() {
  return this.count++;
}.bind(this);

// ✅ Hoặc lưu this vào biến
const self = this;
this.increment = function() {
  return self.count++;
};
```

---

### Câu 7: Module Pattern

```javascript
const UserModule = (function() {
  const users = new Map();
  let nextId = 1;

  return {
    create(name) {
      const id = nextId++;
      users.set(id, { id, name });
      return id;
    },
    get(id) {
      return users.get(id);
    },
    remove(id) {
      return users.delete(id);
    }
  };
})();

UserModule.create('Alice'); // id = 1
UserModule.create('Bob');  // id = 2
console.log(UserModule.get(1)); // { id: 1, name: 'Alice' }
console.log(UserModule.get(2)); // { id: 2, name: 'Bob' }
console.log(users); // ReferenceError — users private
```

**Giải thích:** IIFE tạo function scope chứa `users` và `nextId`. Object được return có closure trên cả hai. Bên ngoài không truy cập được.

---

### Câu 8: Memory leak với closure

```javascript
// ❌ Leak: closure giữ reference đến DOM element
function attachHandler() {
  const bigData = new Array(10000).fill('data');

  const el = document.getElementById('button');
  el.addEventListener('click', function() {
    console.log(bigData.length); // bigData không thể GC
  });

  // Sau khi remove element khỏi DOM
  el.remove(); // nhưng callback vẫn giữ bigData!
}

// ✅ Fix: remove listener khi không cần
function attachHandlerFixed() {
  const bigData = new Array(10000).fill('data');
  const el = document.getElementById('button');

  function handler() {
    console.log(bigData.length);
  }

  el.addEventListener('click', handler);

  return function cleanup() {
    el.removeEventListener('click', handler);
    // giờ bigData có thể được GC nếu không có reference khác
  };
}
```

---

### Câu 9: Once — chỉ chạy 1 lần

```javascript
function once(fn) {
  let called = false;
  let result;

  return function(...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}

const init = once(function(config) {
  console.log('Initialized with:', config);
  return 'success';
});

init({ debug: true }); // 'Initialized with: { debug: true }' — chỉ 1 lần
init({ debug: false }); // không in gì — trả 'success' đã lưu
init({ debug: true });  // không in gì
```

---

### Câu 10: Compose — kết hợp closures

```javascript
function compose(...fns) {
  return function(x) {
    return fns.reduceRight((acc, fn) => fn(acc), x);
  };
}

const double = x => x * 2;
const square = x => x * x;
const addOne = x => x + 1;

const transform = compose(double, square, addOne);

console.log(transform(3));
// Step: addOne(3) = 4 → square(4) = 16 → double(16) = 32
```

---

## 5. Tổng Hợp

```
┌──────────────────────────────────────────────────┐
│  Closure = Function + [[Environment]] reference   │
│                                                  │
│  [[Environment]] trỏ đến lexical scope nơi       │
│  function được ĐỊNH NGHĨA (không phải gọi)       │
│                                                  │
│  Ứng dụng:                                      │
│    • Data privacy (đóng gói)                    │
│    • Function factory                            │
│    • Memoization                                 │
│    • Currying / Partial application             │
│    • Module pattern                              │
│                                                  │
│  Traps:                                          │
│    • var trong loop → bắt cùng biến             │
│    • Closure giữ reference, không snapshot        │
│    • Giữ reference quá lâu → memory leak          │
│    • this bị mất trong inner function            │
└──────────────────────────────────────────────────┘
```

---

## 6. Mối Liên Hệ

```
Closure
  ├── Scope (001)    ← closure BẮT BUỘC cần lexical scope
  ├── Hoisting (003) ← hoisting ảnh hưởng closure resolution
  ├── this (004)     ← closure KHÔNG giữ this, phải bind/capture
  ├── Memory (05)    ← closure giữ reference → ảnh hưởng GC
  ├── Module (06)    ← IIFE = closure để tạo module scope
  └── Event Loop (03) ← callbacks = closures, thường gặp trap
```

---

## Checklist

- [ ] Giải thích được closure = function + [[Environment]]
- [ ] Biết 5+ ứng dụng thực tế của closure
- [ ] Tránh được trap var-trong-loop
- [ ] Hiểu được memory leak qua closure
- [ ] Phân biệt được bắt reference vs snapshot
- [ ] Trả lời được 8/10 câu hỏi phỏng vấn trên

---

*Last updated: 2026-03-31*
