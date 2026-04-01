# Data Types — Primitive vs Reference, Đằng Sau Câu Chuyện Copy

## Câu hỏi mở đầu

```javascript
let a = 5;
let b = a;
b = 10;
console.log(a); // ①

const obj1 = { value: 5 };
const obj2 = obj1;
obj2.value = 10;
console.log(obj1.value); // ②

const arr1 = [1, 2, 3];
const arr2 = arr1;
arr2.push(4);
console.log(arr1.length); // ③
```

Ba kết quả: `5`, `10`, `4`. Tại sao?

Vì **`a` là primitive, `obj1` và `arr1` là reference.** Copy chúng hoạt động hoàn toàn khác nhau.

---

## 1. Hai Loại Data Types

### 1a. Primitive Types (7 loại)

```
string, number, bigint, boolean, undefined, null, symbol
```

```javascript
typeof 'hello'    // 'string'
typeof 42         // 'number'
typeof 9007199254740991n // 'bigint'
typeof true       // 'boolean'
typeof undefined   // 'undefined'
typeof null       // 'object' ← BUG LỊCH SỬ, ai cũng biết
typeof Symbol('x') // 'symbol'
```

**Đặc điểm của primitive:**
- Lưu trên **stack** (trừ bigint và symbol có thể trên heap)
- Khi gán hoặc truyền, **giá trị được copy nguyên vẹn**
- **Immutable** — không thể thay đổi giá trị, chỉ tạo giá trị mới

```javascript
let name = 'Alice';
name.toUpperCase(); // 'ALICE' — tạo string mới, KHÔNG thay đổi name
console.log(name);  // 'Alice' — name không đổi

// String methods trả về string MỚI, không mutate string gốc
const greeting = 'hello';
const upper = greeting.toUpperCase();
console.log(greeting); // 'hello' (gốc không đổi)
console.log(upper);    // 'HELLO'
```

### 1b. Reference Types (3 loại chính)

```
Object: { key: value }
Array:  [1, 2, 3]
Function: function() {}
```

**Đặc điểm của reference:**
- Lưu trên **heap**, biến chỉ giữ **pointer/reference** đến object
- Khi gán hoặc truyền, **pointer được copy**, không phải object
- **Mutable** — có thể thay đổi object gốc qua bất kỳ reference nào

---

## 2. Copy — Shallow vs Deep

### 2a. Primitive Copy: Giá trị thật sự được copy

```javascript
let x = 10;
let y = x;     // y = 10, y hoàn toàn độc lập
y = 20;
console.log(x); // 10 — x không bị ảnh hưởng
```

```
x ────► [10]         (stack)
y ────► [20]         (stack, sau khi gán lại)
```

### 2b. Reference Copy: Pointer được copy, không phải object

```javascript
const obj1 = { name: 'Alice' };
const obj2 = obj1; // copy pointer, không copy object

obj2.name = 'Bob';
console.log(obj1.name); // 'Bob' — obj1 và obj2 cùng trỏ 1 object!
```

```
obj1 ──┐
       ├──► [ { name: 'Bob' } ]  (heap)
obj2 ──┘
```

### 2c. Shallow Copy — Chỉ copy 1 level

```javascript
const original = { a: 1, b: { c: 2 } };
const shallow = { ...original }; // spread operator — shallow copy

shallow.a = 10;          // chỉ ảnh hưởng shallow, không ảnh hưởng original
shallow.b.c = 20;        // ảnh hưởng CẢ original vì b là reference
console.log(original.a); // 1 ✅
console.log(original.b.c); // 20 ❌
```

```
original ──► { a: 1, b: ──► { c: 2 } }
shallow   ──► { a: 10, b: ──► { c: 20 } } // cùng b object!
```

### 2d. Deep Copy — Copy toàn bộ object

```javascript
const original = { a: 1, b: { c: 2 } };

// Cách 1: JSON.parse(JSON.stringify())
const deep1 = JSON.parse(JSON.stringify(original));
deep1.b.c = 999;
console.log(original.b.c); // 2 ✅

// ⚠️ Hạn chế: không copy function, undefined, Symbol, Date, RegExp...
const withFn = { fn: () => 'hi', d: new Date() };
const lost = JSON.parse(JSON.stringify(withFn));
console.log(lost.fn);   // undefined
console.log(lost.d);    // string, không phải Date object

// Cách 2: structuredClone() (ES2021)
const deep2 = structuredClone(original);
deep2.b.c = 999;
console.log(original.b.c); // 2 ✅
console.log(deep2.fn);     // () => 'hi' ✅ giữ được function

// Cách 3: Custom deep clone
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);

  const clone = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = deepClone(obj[key]);
    }
  }
  return clone;
}
```

---

## 3. So Sánh Reference

### So sánh bằng `===`

```javascript
const a = { x: 1 };
const b = { x: 1 };
console.log(a === b); // false — 2 object khác nhau trên heap

const c = a;
console.log(a === c); // true — cùng pointer đến 1 object
```

```
a ──► [{ x: 1 }] address: 0x001
b ──► [{ x: 1 }] address: 0x002  ← KHÁC object
c ──► [{ x: 1 }] address: 0x001  ← CÙNG object với a
```

### So sánh ngầm định (implicit coercion)

```javascript
const obj = { valueOf() { return 42; }, toString() { return 'obj'; } };

console.log(obj == 42);    // true — == trigger valueOf()
console.log(obj === 42);   // false — === không coerce
```

**Tránh `==` khi so sánh object.**

---

## 4. Các Traps Phổ Biến

### Trap 1: Thay đổi object gốc qua reference

```javascript
// ❌ Bug: thay đổi object dùng chung
function addRole(user, role) {
  user.roles = user.roles || [];
  user.roles.push(role); // thay đổi object gốc!
}

const alice = { name: 'Alice', roles: [] };
const bob = { name: 'Bob' };
addRole(alice, 'admin');
addRole(bob, 'user');
console.log(alice); // { name: 'Alice', roles: ['admin'] }
console.log(bob);   // { name: 'Bob', roles: ['user'] }
// OK trong trường hợp này — nhưng nếu alice được share ở nhiều nơi?
```

```javascript
// ✅ Fix: deep clone trước khi thay đổi
function addRoleFixed(user, role) {
  const userCopy = structuredClone(user); // hoặc {...user}
  userCopy.roles = userCopy.roles || [];
  userCopy.roles.push(role);
  return userCopy;
}

const alice = { name: 'Alice', roles: [] };
const aliceModified = addRoleFixed(alice, 'admin');
console.log(alice.roles);        // []
console.log(aliceModified.roles); // ['admin']
```

### Trap 2: Array là reference

```javascript
const nums1 = [1, 2, 3];
const nums2 = nums1;

nums2.push(4);
console.log(nums1); // [1, 2, 3, 4] — nums1 cũng thay đổi!
```

### Trap 3: Dùng object làm Map key

```javascript
const map = new Map();
const objKey = { id: 1 };
map.set(objKey, 'value');

// objKey không còn tham chiếu đến cùng object?
const objKey2 = { id: 1 };
console.log(map.get(objKey));   // 'value' ✅
console.log(map.get(objKey2)); // undefined ❌ — object khác nhau, hash khác nhau
```

### Trap 4: Object.freeze — freeze "nông"

```javascript
const frozen = { a: 1, b: { c: 2 } };
Object.freeze(frozen);

frozen.a = 999; // bị ignore (strict mode: TypeError)
frozen.b.c = 999; // ⚠️ vẫn thay đổi được! nested object không freeze
console.log(frozen.a); // 1
console.log(frozen.b.c); // 999
```

```javascript
// ✅ Deep freeze
function deepFreeze(obj) {
  Object.freeze(obj);
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && typeof obj[key] === 'object') {
      deepFreeze(obj[key]);
    }
  }
}
```

### Trap 5: Return object từ function

```javascript
function getDefault() {
  return { name: 'Default' }; // luôn tạo object mới
}

const a = getDefault();
const b = getDefault();
console.log(a === b); // false — mỗi lần gọi tạo object mới
```

---

## 5. Immutable Patterns Thực Tế

### 5a. Object.assign — nhưng không deep

```javascript
const original = { a: 1, b: { c: 2 } };
const merged = Object.assign({}, original, { a: 10 });

console.log(original.a); // 1 ✅
console.log(merged.a);  // 10 ✅
console.log(original.b === merged.b); // true ❌ — cùng reference
```

### 5b. Spread với nested

```javascript
const original = { a: 1, b: { c: 2 } };

// Shallow merge
const merged = { ...original, a: 10 };

// Deep merge (custom)
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      source[key] !== null
    ) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

const mergedDeep = deepMerge(original, { b: { c: 99, d: 3 } });
console.log(mergedDeep); // { a: 1, b: { c: 99, d: 3 } }
```

### 5c. Array — không mutate, tạo array mới

```javascript
const arr = [1, 2, 3];

// ❌ Mutate
arr.push(4);
console.log(arr); // [1, 2, 3, 4]

// ✅ Không mutate — tạo array mới
const arr2 = [...arr, 4];      // spread
const arr3 = arr.concat([4]);  // concat
const arr4 = arr.filter(x => x < 3); // filter
const arr5 = arr.map(x => x * 2);    // map

console.log(arr);  // [1, 2, 3] — gốc không đổi
```

---

## 6. Câu Hỏi Phỏng Vấn

### Câu 1: Shallow vs Deep copy

```javascript
const user = {
  name: 'Alice',
  address: { city: 'Hanoi' }
};

const shallow = { ...user };
const deep = structuredClone(user);

shallow.name = 'Bob';
shallow.address.city = 'HCMC';
deep.name = 'Charlie';
deep.address.city = 'Danang';

console.log(user.name); // ?
console.log(user.address.city); // ?
console.log(shallow.name); // ?
console.log(shallow.address.city); // ?
```

**Trả lời:** `user.name = 'Alice'`, `user.address.city = 'HCMC'`, `shallow.name = 'Bob'`, `shallow.address.city = 'HCMC'`

---

### Câu 2: typeof null

```javascript
console.log(typeof null); // ?
```

**Trả lời:** `'object'` — đây là bug lịch sử từ JS đầu tiên, tồn tại đến giờ vì backward compatibility.

```javascript
// Kiểm tra null đúng cách
const x = null;
console.log(x === null); // true
console.log(x === null); // true
console.log(typeof x);   // 'object' — ĐỪNG dùng typeof để check null
```

---

### Câu 3: instanceof

```javascript
console.log([] instanceof Array); // ?
console.log([] instanceof Object); // ?
console.log({} instanceof Object); // ?
console.log(function(){} instanceof Function); // ?
```

**Trả lời:** `true, true, true, true`

Mọi array, object, function đều là instanceof Object (vì prototype chain).

---

### Câu 4: Object.is vs ===

```javascript
console.log(Object.is(NaN, NaN)); // ?
console.log(Object.is(0, -0));    // ?
console.log(0 === -0);            // ?
console.log(Object.is({}, {}));   // ?
```

**Trả lời:** `true, false, true, false`

`Object.is` khác `===` ở 2 điểm:
- `Object.is(NaN, NaN) = true` (=== cũng true, nhưng check đúng hơn)
- `Object.is(0, -0) = false` (=== trả `true`, không phân biệt)

---

### Câu 5: Immutable array operations

```javascript
const a = [1, 2, 3];
const b = a;

b.push(4);       // mutate
b = [...a, 5];  // ?

console.log(a.length); // ?
console.log(b.length); // ?
```

**Trả lời:** `4` (vì `b.push(4)` thay đổi `a`), sau đó `b = [...a, 5]` tạo assignment error vì `const b` không thể reassign.

---

### Câu 6: Reference trong loop

```javascript
const funcs = [];
const obj = { value: 0 };

for (let i = 0; i < 3; i++) {
  funcs.push(function() {
    console.log(obj.value);
  });
}

obj.value = 10;
funcs.forEach(f => f());
```

**Trả lời:** `10, 10, 10`

Vì mỗi closure bắt `obj` (reference), không phải `obj.value`. Khi `obj.value` thay đổi, tất cả closures thấy giá trị mới.

```javascript
// Nếu muốn "snapshot":
for (let i = 0; i < 3; i++) {
  const snapshot = obj.value; // capture giá trị tại thời điểm này
  funcs.push(function() {
    console.log(snapshot);
  });
}
```

---

### Câu 7: Parameter là reference hay primitive?

```javascript
function modify(val) {
  val = 999;
}

let num = 5;
modify(num);
console.log(num); // ?

function modifyObj(obj) {
  obj.value = 999;
}

const user = { value: 5 };
modifyObj(user);
console.log(user.value); // ?
```

**Trả lời:** `5, 999`

- Primitive: **pass by value** → copy nguyên giá trị → không thay đổi được biến gốc
- Object: **pass by reference** (thực ra là pass pointer by value) → reference được copy → thay đổi object gốc

```javascript
// Nhưng nếu reassign parameter:
function reassign(obj) {
  obj = { value: 999 }; // gán parameter = object mới
}

const user2 = { value: 5 };
reassign(user2);
console.log(user2.value); // 5 — KHÔNG đổi vì obj = user2 reference, rồi gán lại obj
```

---

### Câu 8: Optional chaining với reference

```javascript
const obj = { a: { b: { c: 1 } } };
console.log(obj?.a?.b?.c); // ?
console.log(obj?.x?.y?.z);  // ?
console.log(obj.a.b.c.d);  // ?
```

**Trả lời:** `1, undefined, TypeError`

`?.` trả về `undefined` nếu bất kỳ phần nào là `null`/`undefined`. Không có `?.`, truy cập property không tồn tại → TypeError.

---

## 7. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  PRIMITIVE vs REFERENCE                                  │
│                                                         │
│  Primitive: string, number, boolean, null, undefined,   │
│             symbol, bigint                              │
│    → Lưu trên stack                                    │
│    → Copy giá trị nguyên vẹn                          │
│    → Immutable                                          │
│                                                         │
│  Reference: object, array, function                    │
│    → Lưu trên heap, variable giữ pointer              │
│    → Copy pointer, không copy object                    │
│    → Mutable                                            │
│                                                         │
│  SHALLOW COPY: [...obj]                                 │
│    → Chỉ copy 1 level                                  │
│    → Nested reference vẫn shared                       │
│                                                         │
│  DEEP COPY: structuredClone(), JSON.parse(...), custom  │
│    → Copy toàn bộ object                               │
│    → Nested reference không shared                      │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Mối Liên Hệ

```
Data Types
  ├── Memory/Stack/Heap (05) ← primitive trên stack, reference trên heap
  ├── Closure (002)           ← closure giữ reference đến object
  ├── Prototype (02)          ← prototype chain là reference chain
  ├── Spread/Rest (007)       ← spread = shallow copy
  └── Destructuring (008)     ← destructuring = copy ngầm định
```

---

## Checklist

- [ ] Phân biệt được primitive vs reference
- [ ] Hiểu shallow copy vs deep copy
- [ ] Biết 3 cách deep clone và hạn chế của từng cách
- [ ] Tránh được trap mutate object gốc
- [ ] Trả lời được 8/8 câu hỏi phỏng vấn

---

*Last updated: 2026-03-31*
