# Spread & Rest — Hai Mặt Của Cùng Một Toán Tử

## Câu hỏi mở đầu

```javascript
// Đây là spread hay rest?
const arr = [1, 2, 3];
console.log(...arr);      // ①

function sum(...numbers) { // ②
  return numbers.reduce((a, b) => a + b, 0);
}
console.log(sum(1, 2, 3)); // ③

const [first, ...rest] = arr; // ④
```

① là **spread** (rải mảng thành các phần tử riêng)
② là **rest** (gom các tham số thành mảng)
③ là **spread** (rải mảng `[1,2,3]` thành `1, 2, 3`)
④ là **rest** (gom phần còn lại thành `rest`)

**Cùng toán tử `...`, nhưng context quyết định vai trò.**

---

## 1. Spread Operator — Rải Ra

### Nguyên tắc

> **Spread `...arr`** có nghĩa: "lấy tất cả phần tử của `arr` và đặt vào đây, như thể viết từng phần tử."

### 1a. Spread trong Array

```javascript
const a = [1, 2, 3];
const b = [4, 5, 6];

// Nối mảng
const combined = [...a, ...b]; // [1, 2, 3, 4, 5, 6]

// Chèn phần tử vào giữa
const withZero = [0, ...a, 4]; // [0, 1, 2, 3, 4]

// Clone mảng (shallow copy)
const clone = [...a]; // [1, 2, 3]

// Nối với giá trị đơn lẻ
const extended = [...a, 99]; // [1, 2, 3, 99]
```

### 1b. Spread trong Object

```javascript
const defaults = { theme: 'light', lang: 'vi', debug: false };
const userPrefs = { theme: 'dark', fontSize: 14 };

// Merge — properties sau ghi đè trước
const settings = { ...defaults, ...userPrefs };
// { theme: 'dark', lang: 'vi', debug: false, fontSize: 14 }
```

**Thứ tự merge quan trọng:**

```javascript
const a = { x: 1 };
const b = { x: 2 };
console.log({ ...a, ...b }); // { x: 2 } — b ghi đè a
console.log({ ...b, ...a }); // { x: 1 } — a ghi đè b
```

### 1c. Spread trong Function Call

```javascript
const nums = [1, 2, 3];

// Thay vì:
Math.max(1, 2, 3);

// Dùng spread:
Math.max(...nums); // 3
Math.min(...nums); // 1

// Truyền nhiều mảng
const a = [3, 1, 4];
const b = [1, 5, 9];
Math.max(...a, ...b); // 9
```

### 1d. Spread với String

```javascript
// String → characters
const chars = [...'hello']; // ['h', 'e', 'l', 'l', 'o']

// Nối string
const greeting = ['Hello', ...'World']; // ['Hello', 'W', 'o', 'r', 'l', 'd']
```

---

## 2. Rest Operator — Gom Lại

### Nguyên tắc

> **Rest `...args`** có nghĩa: "gom tất cả arguments còn lại vào một mảng."

### 2a. Rest trong Function Parameters

```javascript
// Gom các tham số còn lại
function sum(a, b, ...rest) {
  console.log(a, b, rest); // 1, 2, [3, 4, 5]
  return a + b + rest.reduce((s, n) => s + n, 0);
}

sum(1, 2, 3, 4, 5); // 15
```

**Lưu ý:** Rest parameter phải là **tham số cuối cùng**.

```javascript
// ❌ SyntaxError: Rest parameter must be last
function fn(a, ...rest, b) {}

// ✅ Đúng
function fn(a, b, ...rest) {}
```

### 2b. Rest với Destructuring

```javascript
const [first, second, ...remaining] = [1, 2, 3, 4, 5];
console.log(first, second, remaining); // 1, 2, [3, 4, 5]

const { name, age, ...otherProps } = {
  name: 'Alice',
  age: 30,
  city: 'Hanoi',
  hobby: 'reading'
};
console.log(name, age, otherProps); // Alice, 30, { city: 'Hanoi', hobby: 'reading' }
```

### 2c. Rest trong Array Destructuring

```javascript
const colors = ['red', 'green', 'blue', 'yellow', 'purple'];

// Lấy first, rest
const [primary, ...secondary] = colors;
console.log(primary);   // 'red'
console.log(secondary); // ['green', 'blue', 'yellow', 'purple']

// Bỏ qua vài phần tử đầu
const [, , third, ...rest2] = colors;
console.log(third);  // 'blue'
console.log(rest2);   // ['yellow', 'purple']
```

---

## 3. Ứng Dụng Thực Tế

### 3a. Immutable array operations

```javascript
const arr = [1, 2, 3];

// Thêm phần tử (không mutate)
const arrAdd = [...arr, 4]; // [1, 2, 3, 4]

// Xóa phần tử (immutable)
const removeAt = (arr, idx) => [...arr.slice(0, idx), ...arr.slice(idx + 1)];
console.log(removeAt(arr, 1)); // [1, 3]

// Cập nhật phần tử (immutable)
const updateAt = (arr, idx, val) =>
  arr.map((v, i) => i === idx ? val : v);
console.log(updateAt(arr, 1, 99)); // [1, 99, 3]

// Chèn vào giữa
const insertAt = (arr, idx, val) =>
  [...arr.slice(0, idx), val, ...arr.slice(idx)];
console.log(insertAt(arr, 1, 1.5)); // [1, 1.5, 2, 3]
```

### 3b. Immutable object operations

```javascript
const obj = { name: 'Alice', age: 30, city: 'Hanoi' };

// Thêm property
const objAdd = { ...obj, email: 'alice@example.com' };

// Xóa property (dùng destructuring + rest)
const { city, ...objWithoutCity } = obj;
console.log(objWithoutCity); // { name: 'Alice', age: 30 }

// Cập nhật property
const objUpdate = { ...obj, age: 31 };

// Merge nhiều objects
const base = { theme: 'light' };
const user = { name: 'Bob' };
const prefs = { theme: 'dark' };
const merged = { ...base, ...user, ...prefs };
// { theme: 'dark', name: 'Bob' }
```

### 3c. Function composition với spread

```javascript
function compose(...fns) {
  return function(x) {
    return fns.reduceRight((v, fn) => fn(v), x);
  };
}

const double = x => x * 2;
const addOne = x => x + 1;
const square = x => x * x;

const transform = compose(double, addOne, square);

console.log(transform(3));
// square(3) = 9 → addOne(9) = 10 → double(10) = 20
```

### 3d. Arguments object vs Rest parameters

```javascript
// ❌ Arguments object — không phải array thật
function oldStyle() {
  console.log(arguments); // Arguments(3) [1, 2, 3]
  console.log(Array.isArray(arguments)); // false
  const sum = arguments.reduce((a, b) => a + b, 0); // TypeError!
}

// ✅ Rest parameters — là array thật
function newStyle(...nums) {
  console.log(nums); // [1, 2, 3]
  console.log(Array.isArray(nums)); // true
  return nums.reduce((a, b) => a + b, 0); // 6
}
```

---

## 4. Các Traps

### Trap 1: Shallow copy — nested object không copy sâu

```javascript
const original = { user: { name: 'Alice' } };
const copy = { ...original };

copy.user.name = 'Bob';
console.log(original.user.name); // 'Bob' ❌ — nested object bị thay đổi!
```

```javascript
// ✅ Deep copy cần xử lý tay
const deepCopy = {
  ...original,
  user: { ...original.user }
};

deepCopy.user.name = 'Charlie';
console.log(original.user.name); // 'Bob' ✅
```

### Trap 2: Spread không deep merge

```javascript
const defaults = { config: { theme: 'light', lang: 'vi' } };
const user = { config: { theme: 'dark' } };

const merged = { ...defaults, ...user };
console.log(merged);
// { config: { theme: 'dark' } } ❌
// user.config ghi đè HOÀN TOÀN defaults.config
// theme: 'light', lang: 'vi' bị mất!
```

```javascript
// ✅ Deep merge
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

console.log(deepMerge(defaults, user));
// { config: { theme: 'dark', lang: 'vi' } } ✅
```

### Trap 3: Spread không copy non-enumerable properties

```javascript
const obj = { a: 1 };
Object.defineProperty(obj, 'hidden', {
  value: 'secret',
  enumerable: false // không liệt kê được
});

const spread = { ...obj };
console.log(spread.hidden); // undefined ❌

// Nếu cần copy tất cả:
const all = Object.assign({}, obj); // vẫn không copy non-enumerable
const clone = JSON.parse(JSON.stringify(obj)); // mất type của non-primitives

// Dùng for...in
function fullClone(obj) {
  const clone = {};
  for (const key in obj) {
    clone[key] = obj[key];
  }
  return clone;
}
```

### Trap 4: Spread với undefined/null

```javascript
const arr = [1, undefined, 3];
const result = [...arr]; // [1, undefined, 3] ✅ OK

const obj = { a: 1, b: null };
const objCopy = { ...obj }; // { a: 1, b: null } ✅ OK

// Nhưng spread không bỏ qua falsy values
const withFalsy = [...[1, 0, false, null, undefined, '']];
// [1, 0, false, null, undefined, ''] — giữ nguyên
```

---

## 5. Câu Hỏi Phỏng Vấn

### Câu 1: Đoán kết quả

```javascript
const arr1 = [1, 2, 3];
const arr2 = arr1;
arr2.push(4);

console.log(arr1); // ①
console.log([...arr1]); // ②
console.log(arr1 === [...arr1]); // ③
```

**Trả lời:** ① `[1, 2, 3, 4]` (cùng reference), ② `[1, 2, 3, 4]` (clone), ③ `false` (2 arrays khác nhau trên heap)

---

### Câu 2: Merge với thứ tự

```javascript
const a = { x: 1, y: 2 };
const b = { y: 99, z: 3 };
const c = { x: 0, z: 0 };

console.log({ ...a, ...b, ...c }); // ?
```

**Trả lời:** `{ x: 0, y: 99, z: 0 }`

`x` → `a: 1` → `c: 0` (c ghi đè)
`y` → `a: 2` → `b: 99` (b ghi đè)
`z` → `b: 3` → `c: 0` (c ghi đè)

---

### Câu 3: Rest trong destructuring

```javascript
const [a, b, ...{ length }] = [1, 2, 3, 4, 5];
console.log(length); // ?
```

**Trả lời:** `3` (rest = `[3, 4, 5]`, length = 3)

---

### Câu 4: Spread trong object với method

```javascript
const obj = {
  name: 'Alice',
  greet() { return `Hi, ${this.name}`; }
};

const copy = { ...obj };
copy.name = 'Bob';

console.log(obj.greet()); // ?
console.log(copy.greet()); // ?
```

**Trả lời:** `'Hi, Alice'`, `'Hi, Bob'`

Method được copy (function là reference). `this` phụ thuộc vào object gọi nó → `obj.greet()` → `this = obj`, `copy.greet()` → `this = copy`.

---

### Câu 5: Spread vs concat

```javascript
const a = [1, 2];
const b = [3, 4];

const concat = a.concat(b); // [1, 2, 3, 4]
const spread = [...a, ...b]; // [1, 2, 3, 4]

console.log(concat === spread); // false — 2 arrays khác nhau
console.log(a.concat === a.concat.bind(a)); // true — concat là method của array
```

---

### Câu 6: Rest parameter không phải array thật?

```javascript
function demo(...args) {
  args.push(4); // thêm được vì args là Array thật
  console.log(args.pop()); // 4

  args[Symbol.iterator] = null; // làm gì đó
  console.log([...args]); // TypeError! vì không iterate được
}
```

**Trả lời:** Phụ thuộc. `...args` tạo array thật, nhưng có thể bị modify.

---

## 6. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  SPREAD vs REST                                            │
│                                                         │
│  SPREAD (...) = rải array/object thành các phần tử      │
│    Dùng: [...arr], { ...obj }, fn(...arr)              │
│    Trong function call, array literal, object literal    │
│                                                         │
│  REST (...args) = gom các phần tử thành array           │
│    Dùng: function(...args), const [a, ...rest]          │
│    Trong parameter definition, destructuring             │
│                                                         │
│  CÙNG syntax `...`, khác context → khác ý nghĩa        │
└─────────────────────────────────────────────────────────┘

SHALLOW: [...arr] chỉ copy 1 level
DEEP: cần custom logic hoặc structuredClone()
```

---

## 7. Mối Liên Hệ

```
Spread/Rest
  ├── Destructuring (008) ← destructuring dùng rest
  ├── Data Types (005)    ← spread = shallow copy
  ├── Function (001)      ← arguments object vs rest params
  └── Immutable patterns   ← spread tạo object/array mới
```

---

## Checklist

- [ ] Phân biệt được spread và rest dựa trên context
- [ ] Dùng spread để clone và merge object/array
- [ ] Hiểu hạn chế: shallow copy, không deep merge tự động
- [ ] Trả lời được các câu hỏi phỏng vấn trên

---

*Last updated: 2026-03-31*
