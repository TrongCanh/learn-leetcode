# Functional Programming — Nghĩ Khác Về Code

## Câu hỏi mở đầu

```javascript
// Câu hỏi: đoạn code này có vấn đề gì?

function processUser(user) {
  user.lastLogin = new Date();
  user.loginCount += 1;
  console.log('User logged in:', user.name);
  return user;
}

const alice = { name: 'Alice', lastLogin: null, loginCount: 0 };
const result = processUser(alice);

console.log(alice === result);    // true — alice bị thay đổi!
console.log(alice.lastLogin);     // Date — dữ liệu bị mutate!
```

**Đây gọi là side effect và mutation.** Functional Programming yêu cầu: **pure functions**, **immutability**, và **no side effects**. Code trên vi phạm cả 3. Bài này không dạy bạn học Haskell — dạy bạn **áp dụng functional thinking** vào JavaScript, ngôn ngữ mà vốn đã hỗ trợ nhiều functional concepts.

---

## 1. Functional Programming Là Gì?

### Định nghĩa

```
┌──────────────────────────────────────────────────────────────┐
│  FUNCTIONAL PROGRAMMING                                        │
│                                                               │
│  Core idea: Functions = first-class citizens                  │
│  ├── Functions are values (pass, return, store)               │
│  ├── No mutation of data (immutability)                       │
│  ├── No side effects (pure functions)                        │
│  └── Composable: chain, pipe, compose                         │
│                                                               │
│  Benefits:                                                     │
│  ├── Predictable — same input = same output                  │
│  ├── Testable — no mocks needed for side effects             │
│  ├── Parallelizable — no shared state                        │
│  ├── Debuggable — pure functions = easy to trace              │
│  └── Reusable — functions are building blocks                 │
└──────────────────────────────────────────────────────────────┘
```

### Pure function — Trái tim của FP

```javascript
// ❌ NOT pure: side effect + mutation
function addToCart(item, cart) {
  cart.items.push(item); // mutate
  console.log('Added:', item); // side effect
  return cart;
}

// ✅ PURE: no mutation, no side effects
function addToCart(item, cart) {
  return {
    ...cart,
    items: [...cart.items, item]
  };
}

// Testable:
const before = { items: [], total: 0 };
const after = addToCart({ name: 'Book', price: 29 }, before);

console.log(before === after);    // false — original unchanged!
console.log(before.items.length);  // 0 — original intact!
console.log(after.items.length);   // 1 — new object created!
```

### Side effects — Biết rõ để kiểm soát

```javascript
// Side effects = anything outside the function's return value

// Common side effects:
console.log('hello');          // I/O
Math.random();                 // Non-deterministic
fetch('/api/users');           // Network request
document.getElementById(...);  // DOM
new Date();                    // Time-dependent
mutating global state          // State mutation

// Pure function KHÔNG CÓ side effects:
// ✅ Pure
const double = (n) => n * 2;
const getFullName = (first, last) => `${first} ${last}`;
const sum = (arr) => arr.reduce((a, b) => a + b, 0);

// ❌ Impure
Math.random();         // returns different value each time
new Date().getTime();  // returns different value each time
```

---

## 2. First-Class và Higher-Order Functions

### Functions as values

```javascript
// 1. Gán function vào biến
const double = (n) => n * 2;

// 2. Pass function như argument
[1, 2, 3].map(double); // [2, 4, 6]

// 3. Return function từ function
const multiplier = (factor) => (num) => num * factor;
const triple = multiplier(3);
triple(5); // 15

// 4. Store trong object/array
const operations = {
  double: (n) => n * 2,
  triple: (n) => n * 3,
};
operations.double(5); // 10
```

### Higher-order functions

```javascript
// HOF = function nhận function làm argument HOẶC return function

// HOF nhận function làm argument:
const numbers = [1, 2, 3, 4, 5];

const even = numbers.filter(n => n % 2 === 0);  // [2, 4]
const squared = numbers.map(n => n ** 2);       // [1, 4, 9, 16, 25]
const sum = numbers.reduce((a, b) => a + b, 0); // 15

// HOF return function:
const makeAdder = (x) => (y) => x + y;
const add5 = makeAdder(5);
add5(10); // 15

// HOF kết hợp:
const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

const processNumber = pipe(
  n => n + 1,      // bước 1: cộng 1
  n => n * 2,      // bước 2: nhân 2
  n => n - 3       // bước 3: trừ 3
);

processNumber(5); // ((5+1)*2)-3 = 9 ✅
```

---

## 3. Immutability — Không Thay Đổi Data

### Tại sao immutability quan trọng?

```javascript
// ❌ Mutation = source of bugs
const users = [{ name: 'Alice' }, { name: 'Bob' }];

function addAdmin(users) {
  const admin = { name: 'Admin' };
  users.push(admin); // mutate original array!
  return users;
}

const allUsers = addAdmin(users);
console.log(users === allUsers);   // true!
console.log(users); // [{ Alice }, { Bob }, { Admin }] — original modified!

// ✅ Immutability = predictable
function addAdminSafe(users) {
  const admin = { name: 'Admin' };
  return [...users, admin]; // tạo array MỚI
}

const users2 = [{ name: 'Alice' }, { name: 'Bob' }];
const allUsers2 = addAdminSafe(users2);
console.log(users2 === allUsers2); // false — originals intact!
```

### Immutability với nested objects

```javascript
// ⚠️ Spread chỉ shallow copy!
const user = {
  name: 'Alice',
  address: {
    city: 'Hanoi',
    zip: '10000'
  }
};

// ❌ Shallow spread: nested object vẫn mutate!
const updatedUser = { ...user };
updatedUser.address.city = 'HCMC';
console.log(user.address.city); // 'HCMC' — ORIGINAL MUTATED!

// ✅ Deep immutability: từng layer
const updatedUser2 = {
  ...user,
  address: {
    ...user.address,
    city: 'HCMC'
  }
};
console.log(user.address.city);  // 'Hanoi' — original intact!
console.log(updatedUser2.address.city); // 'HCMC'

// ✅ Hoặc dùng Immer (popular library)
import { produce } from 'immer';

const updatedUser3 = produce(user, (draft) => {
  draft.address.city = 'HCMC';
});
// user unchanged, updatedUser3 is new object
```

### Immutable array operations

```javascript
const numbers = [1, 2, 3, 4, 5];

// ❌ Mutable methods:
numbers.push(6);     // mutates
numbers.pop();       // mutates
numbers.splice(2, 1); // mutates
numbers.sort((a, b) => b - a); // mutates original!

// ✅ Immutable equivalents:
const added = [...numbers, 6];          // push
const removed = numbers.filter(n => n !== 3); // pop/remove
const sorted = [...numbers].sort((a, b) => b - a); // sort

// Map, filter, reduce = immutable by nature
const transformed = numbers
  .filter(n => n > 2)  // [3, 4, 5]
  .map(n => n * 2)     // [6, 8, 10]
  .reduce((a, b) => a + b, 0); // 24

console.log(numbers); // [1, 2, 3, 4, 5] — original intact!
```

---

## 4. Currying và Partial Application

### Currying — Transform multi-arg function thành chain

```javascript
// ❌ Non-curried: tất cả arguments cùng lúc
const multiply = (a, b, c) => a * b * c;
multiply(2, 3, 4); // 24

// ✅ Curried: mỗi function nhận 1 argument
const multiplyCurried = (a) => (b) => (c) => a * b * c;
multiplyCurried(2)(3)(4); // 24

// Tại sao hữu ích?
const multiplyBy2 = multiplyCurried(2); // function nhận b, c
const multiplyBy2And3 = multiplyBy2(3); // function nhận c
multiplyBy2And3(4); // 24

// Thực tế hơn:
const apiRequest = (method) => (endpoint) => (data) => {
  return fetch(endpoint, { method, body: JSON.stringify(data) });
};

const get = apiRequest('GET');   // reusable GET requests
const post = apiRequest('POST'); // reusable POST requests

get('/api/users');
post('/api/users', { name: 'Alice' });
```

### Partial application — Fix một vài arguments

```javascript
// Partial: fix trước một vài arguments
const multiply = (a, b, c) => a * b * c;

// Bind partial:
const multiplyBy2 = multiply.bind(null, 2);
multiplyBy2(3, 4); // 24

// Custom partial:
const partial = (fn, ...presetArgs) => (...laterArgs) =>
  fn(...presetArgs, ...laterArgs);

const multiplyBy2 = partial(multiply, 2);
multiplyBy2(3, 4); // 24

// Currying vs Partial application:
// - Currying: luôn chain 1-argument functions
// - Partial: fix bất kỳ số arguments nào
```

### Auto-curry utility

```javascript
// Manual curry cho tất cả functions
const curry = (fn) => {
  const arity = fn.length; // số arguments

  return function curried(...args) {
    if (args.length >= arity) {
      return fn(...args);
    }
    return (...next) => curried(...args, ...next);
  };
};

const add = curry((a, b, c) => a + b + c);
add(1)(2)(3);    // 6
add(1, 2)(3);   // 6
add(1)(2, 3);   // 6
```

---

## 5. Composition và Point-Free Style

### Compose — Kết hợp functions

```javascript
// compose: right-to-left
const compose = (...fns) => (x) =>
  fns.reduceRight((v, f) => f(v), x);

// pipe: left-to-right
const pipe = (...fns) => (x) =>
  fns.reduce((v, f) => f(v), x);

const toUpperCase = (s) => s.toUpperCase();
const exclaim = (s) => s + '!';
const repeat = (s) => s.repeat(2);

// compose: right-to-left (like Unix pipes)
const excited = compose(
  repeat,    // 3. repeat
  exclaim,   // 2. add !
  toUpperCase // 1. uppercase
);

excited('hello'); // 'HELLO!HELLO!'

// pipe: left-to-right (intuitive)
const excited2 = pipe(
  toUpperCase, // 1. uppercase
  exclaim,     // 2. add !
  repeat       // 3. repeat
);

excited2('hello'); // 'HELLO!HELLO!'
```

### Point-free style

```javascript
// ❌ With points: tham số trung gian không cần thiết
const getActiveUserNames = (users) =>
  users
    .filter(user => user.isActive)       // user không cần đặt tên
    .map(user => user.name);

// ✅ Point-free: không thấy data parameter
const isActive = (user) => user.isActive;
const getName = (user) => user.name;

const getActiveUserNames = (users) =>
  users.filter(isActive).map(getName);

// ✅ Hoặc dùng ramda:
import { compose, filter, map, prop } from 'ramda';

const getActiveUserNames = compose(
  map(prop('name')),
  filter(prop('isActive'))
);
```

### Real-world composition

```javascript
// Xây dựng validation pipeline từ reusable pieces
const isNonEmpty = (str) => str.trim().length > 0;
const isEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
const isMinLength = (min) => (str) => str.length >= min;
const isMaxLength = (max) => (str) => str.length <= max;

const validators = {
  name: [isNonEmpty, isMinLength(2), isMaxLength(50)],
  email: [isNonEmpty, isEmail],
  password: [isMinLength(8), isMaxLength(128)]
};

const validate = (field, value) =>
  validators[field]
    .map(rule => rule(value))
    .filter(passed => !passed)
    .map(() => `Invalid ${field}`);

validate('name', 'Al');    // []
validate('name', 'A');     // ['Invalid name']
validate('email', 'bad');   // ['Invalid email']
```

---

## 6. Functors và Monads

### Functor — Mappable container

```javascript
// Functor = object có map() method
// map() áp dụng function vào value BÊN TRONG container
// mà không rời khỏi container

// Array là functor phổ biến nhất:
[1, 2, 3].map(n => n * 2); // [2, 4, 6]

// Maybe functor — handle null/undefined gracefully
class Maybe {
  constructor(value) {
    this.value = value;
  }

  static of(value) { return new Maybe(value); }
  static empty() { return new Maybe(null); }

  map(fn) {
    return this.value == null
      ? Maybe.empty()
      : Maybe.of(fn(this.value));
  }

  getOrElse(defaultValue) {
    return this.value == null ? defaultValue : this.value;
  }
}

// Dùng:
Maybe.of('hello')
  .map(s => s.toUpperCase())
  .map(s => s + '!')
  .getOrElse(''); // 'HELLO!'

Maybe.of(null)
  .map(s => s.toUpperCase())
  .getOrElse('default'); // 'default' — no error!
```

### Maybe Monad — Tránh Null Checks

```javascript
// ❌ Callback hell với null checks
function getStreetName(user) {
  if (user !== null && user !== undefined) {
    if (user.address !== null && user.address !== undefined) {
      if (user.address.street !== null && user.address !== undefined) {
        return user.address.street.name;
      }
    }
  }
  return 'Unknown';
}

// ✅ Maybe chain
const getStreetName2 = (user) =>
  Maybe.of(user)
    .map(u => u.address)
    .map(a => a.street)
    .map(s => s.name)
    .getOrElse('Unknown');

// ✅ Optional chaining (ES2020) — tương tự concept
const getStreetName3 = (user) =>
  user?.address?.street?.name ?? 'Unknown';

// ✅ Optional chaining + array:
const getCityFromCompany = (user) =>
  user?.company?.address?.[0]?.city ?? 'Unknown';
```

### Either Monad — Handle Errors Functional

```javascript
// Either: Left = Error, Right = Success
class Either {
  static left(value) { return new Left(value); }
  static right(value) { return new Right(value); }
}

class Left extends Either {
  constructor(value) { super(); this.value = value; }
  map() { return this; } // Left: bỏ qua transforms
  flatMap() { return this; }
  getOrElse() { return this.value; }
}

class Right extends Either {
  constructor(value) { super(); this.value = value; }
  map(fn) { return Either.right(fn(this.value)); }
  flatMap(fn) { return fn(this.value); }
  getOrElse() { return this.value; }
}

// Parse với Either
const safeParseInt = (str) => {
  const num = parseInt(str, 10);
  return isNaN(num)
    ? Either.left(`Cannot parse "${str}" as integer`)
    : Either.right(num);
};

safeParseInt('42').map(n => n * 2).getOrElse(0); // 84
safeParseInt('abc').map(n => n * 2).getOrElse(0); // 0, no error thrown!
safeParseInt('abc').map(n => n * 2); // Left('Cannot parse "abc"...')
```

---

## 7. Declarative vs Imperative

### Imperative — Nói "LÀM GÌ"

```javascript
// ❌ Imperative: step-by-step, HOW
const numbers = [3, 1, 4, 1, 5, 9, 2, 6];
const result = [];

for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] > 4) {
    result.push(numbers[i] * 2);
  }
}

result.sort((a, b) => b - a);
console.log(result); // [18, 10]
```

### Declarative — Nói "MUỐN GÌ"

```javascript
// ✅ Declarative: what, not how
const numbers = [3, 1, 4, 1, 5, 9, 2, 6];
const result = numbers
  .filter(n => n > 4)      // what: lọc numbers > 4
  .map(n => n * 2)         // what: nhân đôi
  .sort((a, b) => b - a); // what: sắp xếp giảm

console.log(result); // [18, 10]

// ✅ Declarative: không thấy loop, không thấy mutation
// → Code ngắn hơn, dễ đọc hơn, ít bug hơn
```

### Table of comparison

```
┌────────────────┬─────────────────────┬──────────────────────┐
│ Aspect         │ Imperative           │ Declarative           │
├────────────────┼─────────────────────┼──────────────────────┤
│ Style          │ Step-by-step HOW    │ What you want         │
│ Control flow   │ for, while, if      │ map, filter, reduce  │
│ Mutation       │ Yes (direct)        │ No (creates new)     │
│ Readability    │ Harder (verbose)   │ Easier (concise)     │
│ Performance    │ Optimizable by you  │ Optimizable by JIT   │
│ Testability    │ Harder (stateful)  │ Easier (pure)        │
│ Debuggability  │ Harder (side fx)  │ Easier (traceable)   │
└────────────────┴─────────────────────┴──────────────────────┘
```

---

## 8. Các Traps Phổ Biến

### Trap 1: `this` trong callbacks

```javascript
// ❌ Arrow function giải quyết được vấn đề this
class Counter {
  #count = 0;

  increment() { this.#count++; }

  // ❌ Regular function: this = undefined (strict) hoặc global
  batchIncrementWrong() {
    [1, 2, 3].map(function() {
      this.increment(); // this = undefined → Error!
    });
  }

  // ✅ Arrow function: inherits this từ enclosing scope
  batchIncrementRight() {
    [1, 2, 3].map(() => {
      this.increment(); // this = Counter instance ✅
    });
  }
}
```

### Trap 2: Side effects trong map/filter

```javascript
// ❌ map với side effect = anti-pattern
const users = ['Alice', 'Bob'];
const greeted = users.map(name => {
  console.log('Greeting:', name); // side effect!
  return `Hello, ${name}`;
});

// ✅ Tách side effect ra riêng
const users2 = ['Alice', 'Bob'];
users2.forEach(name => console.log('Greeting:', name)); // side effect ở đây
const greeted2 = users2.map(name => `Hello, ${name}`); // pure

// ✅ Hoặc dùng tap (tee)
const tap = (fn) => (value) => {
  fn(value);
  return value;
};

users.map(tap(name => console.log('Greeting:', name)))
     .map(name => `Hello, ${name}`);
```

### Trap 3: Shared mutable state trong closures

```javascript
// ❌ Closure capture mutable variable
const addFunctions = [];
for (var i = 0; i < 3; i++) {
  addFunctions.push(() => i); // captures SAME i
}
console.log(addFunctions[0]()); // 3
console.log(addFunctions[1]()); // 3
console.log(addFunctions[2]()); // 3

// ✅ Closure capture immutable value (let hoặc IIFE)
const addFunctions2 = [];
for (let i = 0; i < 3; i++) {
  addFunctions2.push(() => i); // let creates new binding per iteration
}
console.log(addFunctions2[0]()); // 0
console.log(addFunctions2[1]()); // 1
console.log(addFunctions2[2]()); // 2

// ✅ IIFE capture
const addFunctions3 = [];
for (var i = 0; i < 3; i++) {
  addFunctions3.push(((j) => () => j)(i));
}
```

### Trap 4: Reduce không phải lúc nào cũng tốt nhất

```javascript
// ❌ Dùng reduce khi map + filter rõ ràng hơn
const result = numbers
  .reduce((acc, n) => {
    if (n > 4) { acc.push(n * 2); }
    return acc;
  }, []);

// ✅ Tách filter + map: dễ đọc hơn, chainable
const result2 = numbers
  .filter(n => n > 4)
  .map(n => n * 2);

// ✅ Chỉ dùng reduce khi THỰC SỰ transform thành shape khác
const sum = numbers.reduce((a, b) => a + b, 0);         // ✅
const max = numbers.reduce((a, b) => Math.max(a, b), -Infinity); // ✅
const group = numbers.reduce((acc, n) => {
  acc[n % 2 === 0 ? 'even' : 'odd'].push(n);
  return acc;
}, { even: [], odd: [] }); // ✅ reduce rõ ràng hơn cho object
```

### Trap 5: Mutating array in place

```javascript
// ❌ sort() mặc định mutate
const nums = [3, 1, 4, 1, 5];
const sorted = nums.sort();
console.log(nums === sorted); // true — nums was mutated!

// ✅ Spread + sort
const nums2 = [3, 1, 4, 1, 5];
const sorted2 = [...nums2].sort();

// ⚠️ flat() cũng không mutate
const nested = [[1, 2], [3, 4]];
const flat1 = nested.flat(); // [1, 2, 3, 4]
console.log(nested); // [[1, 2], [3, 4]] — original intact ✅

// ✅ Nhưng reverse() MUTATE!
const arr = [1, 2, 3];
arr.reverse(); // mutates!
console.log(arr); // [3, 2, 1]
// ✅ Fix:
const arr2 = [1, 2, 3];
const reversed = [...arr2].reverse();
```

---

## 9. Câu Hỏi Phỏng Vấn

### Câu 1: Pure function là gì?

**Trả lời:** Pure function = function luôn trả về cùng output với cùng input, và không có side effects. Side effects =: I/O (console, network, file), mutation của external state, throw exceptions không deterministic, calls to non-pure functions. Pure functions predictable, testable, memoizable, parallelizable. Ví dụ pure: `add(2, 3)` → `5` luôn. Ví dụ impure: `Math.random()`, `fetch()`, `new Date()`.

---

### Câu 2: Immutability trong JavaScript như thế nào?

**Trả lời:** JavaScript primitives (string, number, boolean) immutable by nature. Objects và arrays mutable. Immutability technique: spread operator cho shallow copy (`{...obj}`, `[...arr]`), nested spread cho deep copy, `Object.freeze()` để shallow freeze (nhưng không deep freeze), thư viện Immer/Immutable.js cho deep immutable operations. Lưu ý: `Object.freeze()` chỉ freeze 1 level, nested objects vẫn mutable.

---

### Câu 3: Currying vs Partial Application

| | Currying | Partial Application |
|--|---------|---------------------|
| Definition | Transform thành chain of single-arg functions | Fix trước một vài arguments |
| Arguments | Luôn 1 argument mỗi step | Bất kỳ số nào |
| Flexibility | Tạo reusable specialized functions | Create specialized versions |
| Example | `add(a)(b)(c)` | `add(1, 2)(3)` |
| Use case | Composition pipelines | Config/preset scenarios |

---

### Câu 4: Functor và Monad khác nhau thế nào?

**Trả lời:** Functor = có `map()` method, áp dụng function vào value bên trong container. Monad = Functor có thêm `flatMap()` (hoặc `chain()`), flatten nested containers. Array: `[1, 2].map(x => [x, x])` → `[[1, 1], [2, 2]]` (Array is Functor). `[1, 2].flatMap(x => [x, x])` → `[1, 1, 2, 2]` (Array is Monad). Maybe: map handle null gracefully, flatMap allow conditional chaining.

---

### Câu 5: Optional chaining giải quyết vấn đề gì?

```javascript
// ❌ Null checks lồng nhau
const street = user && user.address && user.address.street && user.address.street.name;

// ✅ Optional chaining
const street2 = user?.address?.street?.name;
```

**Trả lời:** Optional chaining (`?.`) cho phép truy cập deeply nested properties mà không cần null checks tường minh. Nếu bất kỳ link nào là null/undefined → trả về undefined thay vì throw TypeError. Kết hợp với nullish coalescing (`??`) để set default value.

---

### Câu 6: Tại sao dùng immutability trong state management?

**Trả lời:** (1) **Predictability**: immutable state → luôn biết state trước/sau action, debug dễ dàng. (2) **Undo/redo**: chỉ cần lưu reference, không cần deep clone. (3) **Change detection**: shallow equality check (`old === new`) thay vì deep compare. (4) **React/Redux**: React phụ thuộc vào immutable updates để detect changes hiệu quả. (5) **Time-travel debugging**: có thể replay actions vì state không bị overwrite.

---

### Câu 7: pipe vs compose

```javascript
// pipe: left-to-right (execution order = reading order)
const result = pipe(
  double,   // 1st
  add5,     // 2nd
  subtract3 // 3rd
)(10);

// compose: right-to-left
const result2 = compose(
  subtract3, // 3rd (rightmost)
  add5,     // 2nd
  double    // 1st (leftmost)
)(10);
```

**Trả lời:** Cả hai kết hợp functions: `pipe` execute left-to-right (intuitive), `compose` execute right-to-left. Execution order giống nhau nhưng argument order ngược. `pipe` dễ đọc hơn vì execution order = code order. `compose` phổ biến trong functional libraries (Ramda, lodash/fp).

---

### Câu 8: Declarative vs Imperative — ví dụ thực tế

```javascript
// IMPERATIVE (How):
let total = 0;
for (let i = 0; i < orders.length; i++) {
  if (orders[i].status === 'completed') {
    total += orders[i].amount;
  }
}

// DECLARATIVE (What):
const total2 = orders
  .filter(order => order.status === 'completed')
  .reduce((sum, order) => sum + order.amount, 0);

// REAL-WORLD IMPLICATIONS:
// - Declarative: dễ đọc, dễ test, dễ parallelize
// - Imperative: cần thiết cho performance-critical code, complex control flow
// - Hybrid: dùng declarative cho business logic, imperative cho performance
```

---

## 10. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  FUNCTIONAL PROGRAMMING                                        │
│                                                               │
│  PURE FUNCTIONS                                               │
│  ├── Same input → Same output (deterministic)                │
│  ├── No side effects (no mutation, no I/O, no random)        │
│  └── Referential transparency: replace call with result      │
│                                                               │
│  IMMUTABILITY                                                 │
│  ├── Spread operator: {...obj}, [...arr]                     │
│  ├── Nested: {...obj, nested: {...obj.nested}}               │
│  ├── Tools: Immer, Immutable.js                              │
│  └── Object.freeze() — shallow only                          │
│                                                               │
│  CURRYING & COMPOSITION                                       │
│  ├── Currying: f(a)(b)(c) = f(a).bind(b).bind(c)           │
│  ├── Partial: fix arguments → specialized function          │
│  ├── compose: right-to-left                                  │
│  ├── pipe: left-to-right                                     │
│  └── Point-free: avoid unnecessary parameters                │
│                                                               │
│  FUNCTIONAL PATTERNS                                          │
│  ├── Functor: mappable container (map)                        │
│  ├── Monad: flatMappable (flatMap/chain)                      │
│  ├── Maybe: handle null safely                                │
│  └── Either: handle errors functionally                       │
│                                                               │
│  ⚠️ Arrow functions = no own `this`                          │
│  ⚠️ Array methods (sort, reverse) MUTATE in place           │
│  ⚠️ Optional chaining = ?. và ?? coalescing                   │
│  ⚠️ Declarative ≠ pure FP — both focus on what, not how     │
└──────────────────────────────────────────────────────────────┘
```

---

## 11. Mối Liên Hệ

```
Functional Programming
  ├── Closures (01) ← closures enable currying và private state
  ├── Async/Promise (03) ← Promise is a Monad
  ├── Array Methods (01) ← map/filter/reduce = FP fundamentals
  ├── Immutable Patterns ← spread, Immer
  ├── Design Patterns (03) ← Observer, Strategy là functional-friendly
  └── Performance (09) ← FP có thể chậm nếu tạo objects không cần thiết
```

---

## Checklist

- [ ] Viết được pure functions (no side effects, no mutation)
- [ ] Hiểu và áp dụng được currying
- [ ] Biết compose và pipe functions
- [ ] Dùng được map/filter/reduce thay cho loops
- [ ] Implement được immutability đúng cách
- [ ] Trả lời được 6/8 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
