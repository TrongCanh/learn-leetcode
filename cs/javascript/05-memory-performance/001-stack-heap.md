# Stack vs Heap — Nơi Dữ Liệu Sống

## Câu hỏi mở đầu

```javascript
let a = 5;              // Stack hay heap?
let obj = { x: 1 };     // Stack hay heap?
let arr = [1, 2, 3];    // Stack hay heap?
let fn = () => {};      // Stack hay heap?

function createUser(name, age) {
  const id = crypto.randomUUID(); // đây?
  const profile = { name, age, id }; // đây?
  return profile;
}

const user = createUser('Alice', 30);
```

**Mỗi giá trị trong JavaScript nằm ở Stack hoặc Heap. Hiểu vị trí chính xác giúp bạn debug memory leaks, hiểu performance, và viết code hiệu quả hơn.**

---

## 1. Stack — Bộ Nhớ Có Cấu Trúc

### Đặc điểm then chốt

```
┌─────────────────────────────────────────────────────────────┐
│  STACK — LIFO (Last In, First Out)                            │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  PUSH: Thêm vào TOP                               │  │
│  │  POP:  Lấy ra từ TOP                             │  │
│  │                                                   │  │
│  │  Tốc độ: O(1) — cực nhanh                       │  │
│  │  Tự động giải phóng khi function return         │  │
│  │  Kích thước: nhỏ (~8MB, configurable)           │  │
│  │  Chứa: primitives, references (không phải object)│  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Minh họa push/pop

```javascript
function a() {
  const x = 1;    // push x
  const y = 2;    // push y
  const z = x + y; // use x, y
  return z;       // pop z, pop y, pop x
}

// Stack frames:
a() frame: [x=1, y=2, z=3]  ← TOP (đang thực thi)
global frame: []
```

### Chi tiết stack frames

```javascript
function greet(name) {          // Frame: [name='Alice']
  const greeting = 'Hello';       // Frame: [name='Alice', greeting='Hello']
  return `${greeting}, ${name}`; // Return → pop greeting, name
}

greet('Alice');
```

```
Khi gọi greet('Alice'):
┌─────────────────────────────────────────────┐
│  greet() frame  ← TOP                       │
│  name: 'Alice'                              │
│  greeting: 'Hello'                          │
├─────────────────────────────────────────────┤
│  global frame                                │
└─────────────────────────────────────────────┘

Sau khi return:
┌─────────────────────────────────────────────┐
│  global frame                                │
└─────────────────────────────────────────────┘
(greet() frame đã được pop — tự động!)
```

### Stack Depth — Giới Hạn

```javascript
// Mỗi function call tạo frame trên stack
// Quá nhiều → Stack Overflow!

function recurse(n) {
  return recurse(n + 1);
}

recurse(1);
// recurse() frame tạo liên tục
// → Maximum call stack size exceeded!

// Kiểm tra stack size
console.log(Math.pow(2, 53) - 1); // Số lớn nhất JS có thể represent
```

### Tail Call Optimization

```javascript
// ES2015+: Tail Call Optimization (TCO)
// Nếu return statement gọi function cuối cùng → không cần frame mới

// ✅ Tail recursive — TCO được (trong strict mode)
'use strict';
function factorial(n, acc = 1) {
  if (n <= 1) return acc;
  return factorial(n - 1, n * acc); // Tail call — không tạo frame mới!
}

// ❌ Không tail call
function factorialBad(n) {
  if (n <= 1) return 1;
  return n * factorialBad(n - 1); // Không phải tail call — có multiplication sau
}
```

---

## 2. Heap — Bộ Nhớ Lớn, Không Cấu Trúc

### Đặc điểm then chốt

```
┌─────────────────────────────────────────────────────────────┐
│  HEAP — Bộ nhớ lớn, không có thứ tự                        │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Allocate: tìm vùng trống đủ lớn → cấp phát        │  │
│  │  Free: không tự động → Garbage Collector quản lý   │  │
│  │                                                   │  │
│  │  Tốc độ: O(n) — chậm hơn stack                   │  │
│  │  Kích thước: lớn (hàng GB)                       │  │
│  │  Chứa: objects, arrays, closures, functions      │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Minh họa heap

```
┌─────────────────────────────────────────────────────────────┐
│  HEAP                                                            │
│                                                                  │
│  Address     Content                                           │
│  ────────────────────────────────────────────────────────────  │
│  0x001      { name: 'Alice', age: 30 }                         │
│  0x002      [1, 2, 3, 4, 5]                                    │
│  0x003      function greet() { ... }                            │
│  0x004      { score: 100, items: [...] }                        │
│  0x005      (detached, GC sẽ thu hồi)                         │
│                                                                  │
└─────────────────────────────────────────────────────────────┘

STACK:
┌─────────────────────────────────────────────────────────────┐
│  obj ──────► 0x001  (pointer/reference trên stack)         │
│  arr ──────► 0x002  (pointer/reference trên stack)         │
│  name ─────► 'Alice'  (primitive — trên stack luôn)        │
│  age ──────► 30  (primitive — trên stack luôn)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Primitive vs Reference — Vị Trí Thực Sự

### Primitives — Trên Stack

```javascript
let a = 5;      // a = 5 trên stack
let b = a;      // b = 5 (copy giá trị) trên stack — b riêng
b = 10;         // b = 10, a vẫn = 5

// Stack:
a ───► [5]
b ───► [10]

console.log(a, b); // 5, 10 ✅ — thay đổi b không ảnh hưởng a
```

### References — Pointer Trên Stack, Object Trên Heap

```javascript
let obj1 = { x: 1 }; // obj1 = pointer đến 0x001 trên stack
let obj2 = obj1;     // obj2 = same pointer! cùng 0x001

// Stack:              Heap:
obj1 ──┐             0x001: { x: 1 }
obj2 ──┘              (1 object, 2 references)

obj2.x = 99;         // thay đổi object tại 0x001
console.log(obj1.x); // 99 ✅ — obj1 thấy cùng object!

// Nhưng:
obj2 = { x: 2 };     // obj2 trỏ đến object mới 0x002
// Stack:              Heap:
obj1 ───► 0x001: { x: 99 }  (obj1 không đổi)
obj2 ───► 0x002: { x: 2 }   (obj2 trỏ mới)
```

### Mọi thứ trong JavaScript

```javascript
// PRIMITIVES: string, number, boolean, bigint, symbol, null, undefined
// → Nằm TRÊN STACK (hoặc inline trong object)

// REFERENCES: object, array, function, class instance, RegExp, Date
// → Pointer trên STACK, value trên HEAP

let num = 42;              // Stack: num = 42
let str = 'hello';         // Stack: str = 'hello' (string interning)
let bool = true;           // Stack: bool = true
let empty = null;          // Stack: empty = null (special)
let undef = undefined;     // Stack: undef = undefined

let obj = { a: 1 };       // Stack: obj = pointer(0x001)
                           // Heap: 0x001 = { a: 1 }
let arr = [1, 2, 3];       // Stack: arr = pointer(0x002)
                           // Heap: 0x002 = [1, 2, 3]
let fn = () => {};         // Stack: fn = pointer(0x003)
                           // Heap: 0x003 = function code
```

### Array và Object Thực Sự

```javascript
// Array: object đặc biệt
let arr = [1, 2, 3];
// arr = pointer(0x001)
// Heap: 0x001 = { '0': 1, '1': 2, '2': 3, length: 3, ... }

// Object: hash map
let user = { name: 'Alice', age: 30 };
// user = pointer(0x002)
// Heap: 0x002 = { name: 'Alice', age: 30 }

// Nested: nested objects cũng trên heap
let company = {
  name: 'TechCorp',
  employees: [
    { name: 'Alice' },  // object trên heap
    { name: 'Bob' }      // object trên heap
  ]
};
// company = pointer(0x003)
// Heap: 0x003 = { name: 'TechCorp', employees: pointer(0x004) }
// Heap: 0x004 = [pointer(0x005), pointer(0x006)]
// Heap: 0x005 = { name: 'Alice' }
// Heap: 0x006 = { name: 'Bob' }
```

---

## 4. Closures — Giữ Heap Sống

### Closure Giữ Object Trên Heap

```javascript
function outer() {
  const bigData = new Array(10_000_000).fill('x'); // ~10MB trên heap

  return function inner() {
    return bigData.length; // closure giữ bigData
  };
}

const fn = outer();
// outer() return nhưng bigData vẫn trên heap
// vì inner() closure tham chiếu đến nó
// → bigData KHÔNG thể GC!

console.log(fn()); // 10000000
```

### Closure Giữ Scope Đầy Đủ

```javascript
// ❌ Closure giữ TOÀN BỘ scope — không chỉ những gì dùng
function processData() {
  const config = loadHeavyConfig();   // 5MB
  const cache = buildLargeCache();    // 10MB
  const buffer = allocateBuffer();    // 20MB

  return function handler() {
    return config.version; // Chỉ cần config.version
  }; // NHƯNG cache và buffer CŨNG bị giữ!
}

// ✅ Chỉ capture những gì cần
function processData() {
  const config = loadHeavyConfig();   // 5MB
  const cache = buildLargeCache();    // 10MB
  const buffer = allocateBuffer();    // 20MB

  const version = config.version; // Chỉ capture primitive

  return function handler() {
    return version; // Chỉ giữ version — cache/buffer được GC
  };
}
```

### Leak qua Closures Thực Sự

```javascript
// Event listener closure leak
function createClickHandler(data) {
  // data giữ reference đến large object
  const element = document.getElementById('btn');

  element.addEventListener('click', function() {
    console.log(data.expensiveResult); // Closure giữ data
  });
}

// Khi element bị remove khỏi DOM:
// element.remove() → element không còn DOM
// NHƯNG event listener vẫn giữ data → LEAK!

// Fix: remove listener
function createClickHandler(data) {
  const element = document.getElementById('btn');

  const handler = function() {
    console.log(data.expensiveResult);
  };

  element.addEventListener('click', handler);

  // Cleanup function
  return function cleanup() {
    element.removeEventListener('click', handler);
    // data bây giờ mới được GC
  };
}
```

---

## 5. Stack vs Heap — Khi Nào Dùng

### Stack Allocation (Primitives)

```javascript
// Primitives được inline — không cần heap allocation
let a = 5;              // Stack allocation O(1)
let b = 'hello';        // String interning — có thể shared
let c = true;           // Stack allocation O(1)

// Khi function return:
// → Tất cả primitives trên stack được tự động freed
// → KHÔNG cần GC!

function compute(a, b) {
  const sum = a + b;    // sum trên stack
  const product = a * b; // product trên stack
  return sum + product;   // sum, product freed khi return
}
```

### Heap Allocation (Objects)

```javascript
// Object cần heap allocation — chậm hơn
const user = { name: 'Alice', age: 30 }; // heap allocation + GC overhead

// Mỗi object mới:
const arr = new Array(1000);  // heap allocation ~microseconds
const obj = new Object();    // heap allocation

// V8 tối ưu: khi object nhỏ và short-lived → allocation nhanh
// Small objects: ~nanoseconds
// Large objects: ~microseconds

// Array literal: V8 có "array allocation sinking"
// [1, 2, 3] được tái sử dụng nếu patterns tương tự
```

### Performance Implications

```javascript
// ❌ Tạo object không cần thiết
function getFirstName(fullName) {
  const parts = fullName.split(' '); // heap allocation!
  return parts[0]; // parts[0] tốt, NHƯNG parts array tốn heap
}

// ✅ Tối ưu
function getFirstName(fullName) {
  const spaceIndex = fullName.indexOf(' ');
  if (spaceIndex === -1) return fullName;
  return fullName.substring(0, spaceIndex); // Không tạo array
}

// ❌ Tạo object trong loop
for (let i = 0; i < 100000; i++) {
  const point = { x: i, y: i * 2 }; // 100000 heap allocations!
}

// ✅ Object pooling
const pointPool = [];
function getPoint(x, y) {
  const p = pointPool.pop() || {};
  p.x = x;
  p.y = y;
  return p;
}
function releasePoint(p) {
  pointPool.push(p);
}
```

---

## 6. Stack Overflow — Khi Stack Đầy

### Nguyên nhân

```javascript
// Stack overflow = quá nhiều function calls chưa return
// Mỗi call tạo frame, stack có giới hạn (~8MB)

function infiniteRecursion() {
  return infiniteRecursion();
}

infiniteRecursion();
// → RangeError: Maximum call stack size exceeded
```

### Accidental Deep Recursion

```javascript
// ❌ Không có base case đúng
function sumArray(arr) {
  return sumArray(arr.slice(1)); // Mỗi call tạo slice (heap allocation)
  // Base case KHÔNG có!
}

// ✅ Base case đúng
function sumArray(arr) {
  if (arr.length === 0) return 0;
  return arr[0] + sumArray(arr.slice(1));
}

// ✅ Tail recursive (V8 TCO)
function sumArray(arr, acc = 0) {
  if (arr.length === 0) return acc;
  return sumArray(arr.slice(1), acc + arr[0]);
}

// ✅ Iterative (tốt nhất — không stack overflow)
function sumArray(arr) {
  return arr.reduce((sum, n) => sum + n, 0);
}
```

### Deep Object Traversal

```javascript
// JSON.parse với nested object sâu có thể gây stack overflow
const deep = JSON.parse('{"a":{"b":{"c":{"d":1}}}}');

// Recursive object clone
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  const copy = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    copy[key] = deepClone(obj[key]); // Recursion — có thể stack overflow!
  }
  return copy;
}

// ✅ Iterative clone — tránh stack overflow
function deepCloneIterative(obj) {
  const stack = [{ parent: null, key: null, value: obj }];
  const clones = new WeakMap();

  while (stack.length > 0) {
    const { parent, key, value } = stack.pop();

    if (value === null || typeof value !== 'object') {
      if (parent) parent[key] = value;
      continue;
    }

    if (clones.has(value)) {
      if (parent) parent[key] = clones.get(value);
      continue;
    }

    const clone = Array.isArray(value) ? [] : {};
    clones.set(value, clone);
    if (parent) parent[key] = clone;

    for (const k of Object.keys(value)) {
      stack.push({ parent: clone, key: k, value: value[k] });
    }
  }

  return clones.get(obj) || (Array.isArray(obj) ? [] : {});
}
```

---

## 7. Memory Layout Thực Tế Trong V8

### V8 Heap Structure

```
┌─────────────────────────────────────────────────────────────┐
│  V8 HEAP                                                            │
│                                                                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  NEW SPACE (Young generation)                              │  │
│  │    ├── Eden: objects mới được tạo                    │  │
│  │    │   (Minor GC: thường xuyên, nhanh)                │  │
│  │    └── Survivor: objects sống sót qua Minor GC     │  │
│  │         (S0 → S1: sau mỗi Minor GC)                  │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  OLD SPACE (Old generation)                              │  │
│  │    ├── Large object space: objects > size limit       │  │
│  │    └── Code space: compiled code                       │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  LARGE OBJECT SPACE                                       │  │
│  │    └── Objects quá lớn cho generations                 │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  CODE SPACE                                              │  │
│  │    └── JIT compiled code                              │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  CELL / PROPERTIES / MAP SPACE                         │  │
│  │    └── Internal V8 structures                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                                       │
│  STACK (separate from heap)                                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Main Thread Stack: ~8MB default                      │  │
│  │    └── Function frames, primitives, pointers        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Stack Frame Chi Tiết

```javascript
function add(a, b) {
  const sum = a + b;
  return sum;
}

add(5, 10);
```

```
┌─────────────────────────────────────────────────────────────┐
│  STACK                                                            │
│  ──────────────────────────────────────────────────────────────  │
│  ...                                                            │
│  add() frame:                                                      │
│    return address: 0x1A2B3C (return to caller)                  │
│    saved FP: 0x100000 (previous frame pointer)                  │
│    parameters: a=5, b=10                                         │
│    locals: sum=15                                                 │
│  ──────────────────────────────────────────────────────────────  │
│  ...                                                            │
└─────────────────────────────────────────────────────────────┘

HEAP: không có gì được allocate cho add() function
(vì chỉ dùng primitives và local variables trên stack)
```

---

## 8. Câu Hỏi Phỏng Vấn

### Câu 1: Giải thích vị trí dữ liệu

```javascript
const a = 5;           // a: primitive → STACK
const b = 'hello';     // b: primitive (interned) → STACK
const obj = { x: 1 };  // obj: pointer → STACK, { x: 1 } → HEAP
const arr = [1, 2, 3]; // arr: pointer → STACK, [1,2,3] → HEAP
const fn = () => {};   // fn: pointer → STACK, function code → HEAP
```

**Trả lời:** Primitives (number, string, boolean, etc.) nằm trên STACK — được copy khi gán, tự động freed khi function return. References (objects, arrays, functions) có pointer trên STACK, value trên HEAP — GC quản lý HEAP.

---

### Câu 2: Swap không dùng temp variable

```javascript
let a = 1, b = 2;

// Cách 1: Destructuring
[a, b] = [b, a]; // Tạo temporary array trên HEAP!

// Cách 2: Toán tử
a = a + b; // a = 3
b = a - b; // b = 1
a = a - b; // a = 2
// Không tạo temp object trên heap

// Cách 3: XOR (chỉ cho numbers)
a = a ^ b;
b = a ^ b;
a = a ^ b;
```

**Trả lời:** Destructuring swap tạo temporary array trên heap → overhead. XOR swap không tạo object nhưng khó đọc. Trong thực tế, destructuring swap là best practice vì readability.

---

### Câu 3: Stack overflow vs Out of memory

```javascript
// Stack overflow: stack có giới hạn cứng (~8MB)
// Thường do: infinite recursion

// Out of memory: heap cạn kiệt
// Thường do: memory leaks, tạo quá nhiều objects

// Ví dụ out of memory:
function leak() {
  const big = new Array(1_000_000_000); // 8GB! → out of memory
  return () => big; // closure giữ big
}
```

**Trả lời:** Stack overflow = maximum call stack exceeded (thường do recursion). Out of memory = heap cạn kiệt (thường do memory leaks hoặc tạo objects quá lớn).

---

### Câu 4: Closures và memory

```javascript
// Closure giữ references trên HEAP — không thể GC!
function outer() {
  const data = new Array(10_000_000); // 10MB HEAP

  return function inner() {
    return data.length; // Closure giữ data
  };
}

// data không được GC sau khi outer() return
// vì inner() vẫn tham chiếu data
```

**Trả lời:** Closure giữ toàn bộ scope của function cha trên HEAP, không chỉ những biến được sử dụng. Để tránh leaks: chỉ capture primitives cần thiết, cleanup event listeners, nullify references khi không cần.

---

## 9. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  STACK vs HEAP                                                 │
│                                                               │
│  STACK                                                         │
│  ├── LIFO — push/pop O(1)                                  │
│  ├── Tự động freed khi function return                    │
│  ├── Kích thước nhỏ (~8MB)                               │
│  ├── Chứa: primitives, references (không phải value)    │
│  └── Overflow: Maximum call stack exceeded               │
│                                                               │
│  HEAP                                                          │
│  ├── Không có thứ tự — allocate tìm vùng trống       │
│  ├── GC quản lý — freed khi không còn references      │
│  ├── Kích thước lớn (hàng GB)                        │
│  ├── Chứa: objects, arrays, closures, functions        │
│  └── Out of memory: heap exhaustion                     │
│                                                               │
│  PRIMITIVE vs REFERENCE                                       │
│  ├── Primitive: nằm trên STACK, copy khi gán        │
│  └── Reference: pointer trên STACK, value trên HEAP  │
│                                                               │
│  CLOSURE                                                       │
│  ├── Giữ entire scope trên HEAP                       │
│  ├── Có thể gây memory leak                          │
│  └── Fix: chỉ capture primitives cần thiết         │
│                                                               │
│  ⚠️ Primitives tự động freed — không cần GC         │
│  ⚠️ Closures giữ HEAP — không thể GC              │
│  ⚠️ Tail call optimization: return fn() không tạo frame│
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Phân biệt được stack và heap
- [ ] Biết primitive vs reference nằm ở đâu
- [ ] Hiểu closure giữ heap không thể GC
- [ ] Tránh được memory leak từ closures
- [ ] Hiểu stack overflow vs out of memory
- [ ] Tối ưu được allocations trong loops
- [ ] Trả lời được 4/4 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
