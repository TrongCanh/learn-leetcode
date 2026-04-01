# Equality — `==` vs `===` vs `Object.is`

## Câu hỏi mở đầu

```javascript
console.log(null == undefined);    // ①
console.log(0 == '');             // ②
console.log(false == '');         // ③
console.log('0' == false);        // ④
console.log([] == ![]);           // ⑤
```

Đoán kết quả? Nếu bạn đoán `true, true, true, true, true` — tất cả đều đúng.

**Đó là lý do tại sao `==` nguy hiểm.** Và tại sao bạn nên **luôn dùng `===`** — trừ khi bạn thực sự cần coercion.

---

## 1. `===` — Strict Equality (So Sánh Nghiêm Ngặt)

### Quy tắc

> `===` **không** ép kiểu. Nếu 2 giá trị **khác type**, trả về `false` **ngay lập tức**.

```javascript
42 === 42;        // true — cùng type, cùng giá trị
42 === '42';      // false — number vs string
'foo' === 'foo';  // true — cùng type, cùng giá trị
true === 1;       // false — boolean vs number
null === undefined; // false — khác type
```

### So sánh primitives

```javascript
// String
'hello' === 'hello';    // true
'hello' === 'world';    // false

// Number
42 === 42;              // true
NaN === NaN;            // false — ⚠️ NaN không bằng chính nó!
Infinity === Infinity;  // true
-0 === 0;              // true

// Boolean
true === true;          // true
false === false;        // true

// Null/Undefined
null === null;          // true
undefined === undefined; // true
```

---

## 2. `==` — Loose Equality (So Sánh Lỏng)

### Quy tắc

> `==` **ép kiểu** trước khi so sánh. JavaScript cố gắng đưa 2 giá trị về **cùng type** trước khi so sánh.

### Bảng so sánh `==` với primitive types

```
                    null  undefined  ''    '0'    0    false  true
null                true
undefined          true   true
''                  false  false   true   false  true   true   false
'0'                false  false   false  true   true   true   false
0                  false  false   true   true         false  false
false               false  false   true   true   false  true   false
true                false  false   false  false  false  false  true
```

### Minh họa

```javascript
// null/undefined
null == undefined;      // true — chúng "equal" với nhau
null == 0;              // false — null KHÔNG bằng 0
undefined == 0;         // false

// Empty string và number
'' == 0;                // true — '' → 0
'  ' == 0;            // true
'5' == 5;              // true — '5' → 5
false == 0;            // true — false → 0
true == 1;              // true — true → 1

// Weird cases
'0' == false;          // true — '0' → 0, false → 0
'' == false;           // true — '' → 0, false → 0
```

---

## 3. Algorithm Chi Tiết — Abstract Equality Comparison

Khi `a == b` được đánh giá:

```
1. Nếu cùng type → so sánh strict
2. null == undefined → true (LUÔN)
3. undefined == null → true (LUÔN)
4. Number == String → String → Number
5. Boolean → Number
6. Object → Primitive (ToPrimitive)
7. So sánh hai primitives
```

### Step-by-step: `'5' == 5`

```
1. '5' là string, 5 là number → khác type → áp dụng rule
4. String '5' → Number 5
5. So sánh: 5 == 5 → true
```

### Step-by-step: `0 == false`

```
1. 0 là number, false là boolean → khác type
5. Boolean false → Number 0
7. So sánh: 0 == 0 → true
```

### Step-by-step: `[] == false`

```
1. [] là array, false là boolean → khác type
5. Boolean false → Number 0
6. Array [] → ToPrimitive → '' → Number ''
  [] là array → valueOf() → [].toString() → ''
  '' → Number 0
7. So sánh: 0 == 0 → true
```

---

## 4. `Object.is()` — So Sánh Chính Xác

### Quy tắc

```javascript
// Giống === nhưng xử lý 2 case đặc biệt
Object.is(NaN, NaN);   // true — khác với ===
Object.is(0, -0);      // false — khác với ===

// Tất cả các case khác giống ===
Object.is(42, 42);         // true
Object.is('42', '42');     // true
Object.is(null, null);     // true
Object.is(undefined, undefined); // true
Object.is(true, true);     // true

Object.is(42, '42');       // false — khác type
Object.is(0, 0);          // true
Object.is(0, -0);         // false
```

### So sánh 3 phương pháp

| Case | `===` | `==` | `Object.is()` |
|------|-------|------|--------------|
| `NaN === NaN` | `false` | `false` | `true` ✅ |
| `0 === -0` | `true` | `true` | `false` ✅ |
| `null === undefined` | `false` | `true` | `false` |
| `5 === '5'` | `false` | `true` | `false` |
| `true === 1` | `false` | `true` | `false` |
| `null === null` | `true` | `true` | `true` |
| `{} === {}` | `false` | `false` | `false` |

---

## 5. Các Traps Phổ Biến

### Trap 1: So sánh `NaN`

```javascript
const result = parseInt('hello'); // NaN

console.log(result === NaN);  // false ❌ — NaN không bằng chính nó
console.log(isNaN(result));  // true ✅ — dùng isNaN()
console.log(Number.isNaN(result)); // true ✅ — dùng Number.isNaN()

// Object.is xử lý NaN đúng
console.log(Object.is(result, NaN)); // true ✅
```

### Trap 2: So sánh `-0` và `0`

```javascript
const a = 0;
const b = -0;

console.log(a === b);      // true — === không phân biệt
console.log(Object.is(a, b)); // false — Object.is phân biệt

// Khi nào cần phân biệt?
// Trong vector math, directional zero có ý nghĩa
```

### Trap 3: `== null` check cả null và undefined

```javascript
let value;

value = null;
if (value == null) { console.log('null or undefined'); } // ✅

value = undefined;
if (value == null) { console.log('null or undefined'); } // ✅

value = 0;
if (value == null) { console.log('null or undefined'); } // ❌ không match

value = false;
if (value == null) { console.log('null or undefined'); } // ❌ không match
```

**`value == null`** là shorthand cho **`value === null || value === undefined`**, rất hữu ích.

### Trap 4: Array comparison

```javascript
const a = [1, 2, 3];
const b = [1, 2, 3];
const c = a;

console.log(a === b); // false — 2 arrays khác nhau trên heap
console.log(a === c); // true — cùng reference

// So sánh nội dung:
console.log(JSON.stringify(a) === JSON.stringify(b)); // true — nhưng không hoàn hảo
console.log(a.every((val, idx) => val === b[idx])); // true — an toàn hơn
```

### Trap 5: Object comparison với custom equality

```javascript
const user1 = { name: 'Alice', age: 30 };
const user2 = { name: 'Alice', age: 30 };

// === so sánh reference, không phải content
console.log(user1 === user2); // false

// Deep equality check — phải tự implement
function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== 'object' || typeof b !== 'object') return a === b;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

console.log(deepEqual(user1, user2)); // true ✅
```

---

## 6. Khi Nào Dùng `==` Thay Vì `===`?

### Trường hợp duy nhất nên dùng `==`

```javascript
// 1. Check null OR undefined (duy nhất case tôi khuyên dùng ==)
if (value == null) { } // === null || === undefined
if (value != null) { } // !== null && !== undefined

// 2. Check undefined (null thường là giá trị có ý nghĩa)
if (value == undefined) { } // === undefined

// Tất cả các case khác: dùng ===
```

### Không bao giờ dùng `==` cho:

```javascript
// ❌ So sánh với số
if (input == 0) { }     // input = '' → true (sai!)
if (input === 0) { }    // ✅

// ❌ So sánh với boolean
if (isValid == true) { }  // isValid = 1 → true (sai!)
if (isValid === true) { } // ✅

// ❌ So sánh string
if (name == '') { }    // name = '0' → true (sai!)
if (name === '') { }   // ✅
```

---

## 7. Câu Hỏi Phỏng Vấn

### Câu 1: Đoán kết quả

```javascript
console.log(0 == '');     // ①
console.log(false == '');  // ②
console.log(false == 0);  // ③
console.log('' == 0);     // ④
```

**Trả lời:** Tất cả đều `true`

**Giải thích:**
- `0 == ''` → `0 == 0` → `true`
- `false == ''` → `0 == 0` → `true`
- `false == 0` → `0 == 0` → `true`
- `'' == 0` → `0 == 0` → `true`

---

### Câu 2: null vs undefined

```javascript
console.log(null == null);         // ①
console.log(undefined == undefined); // ②
console.log(null == undefined);     // ③
console.log(null === undefined);   // ④
```

**Trả lời:** ① `true`, ② `true`, ③ `true`, ④ `false`

---

### Câu 3: NaN

```javascript
console.log(NaN == NaN);   // ①
console.log(NaN === NaN);  // ②
console.log(Object.is(NaN, NaN)); // ③
```

**Trả lời:** ① `false`, ② `false`, ③ `true`

**Vì sao NaN không bằng chính nó?** Mathematically, NaN đại diện cho kết quả không xác định — không có cách nào biết 2 NaN có "bằng nhau" không.

---

### Câu 4: So sánh object với primitive

```javascript
const obj = { valueOf() { return 42; } };

console.log(obj == 42);    // ①
console.log(obj === 42);   // ②
console.log(obj == '42');  // ③
```

**Trả lời:** ① `true`, ② `false`, ③ `true`

`==` gọi `valueOf()` → `42` → so sánh với `42`/`'42'` → `true`.
`===` không coerce → object ≠ primitive.

---

### Câu 5: 0 và -0

```javascript
console.log(0 === -0);     // ①
console.log(0 == -0);     // ②
console.log(Object.is(0, -0)); // ③
console.log(1 / 0);       // ④
console.log(1 / -0);      // ⑤
```

**Trả lời:** ① `true`, ② `true`, ③ `false`, ④ `Infinity`, ⑤ `-Infinity`

`===` và `==` không phân biệt `0` và `-0`. Nhưng phép chia có thể phân biệt: `1/0 = Infinity`, `1/-0 = -Infinity`.

---

### Câu 6: Truthy check

```javascript
if (value) {
  console.log('truthy');
} else {
  console.log('falsy');
}

// Giá trị nào là falsy?
// false, 0, -0, 0n, '', null, undefined, NaN
```

---

### Câu 7: == vs === trong `Array.includes()`

```javascript
const arr = [1, 2, null, undefined, 0, ''];

console.log(arr.includes(0));     // true ✅
console.log(arr.includes(''));    // true ✅
console.log(arr.includes(null));  // true ✅

// includes dùng SameValueZero algorithm — giống === nhưng xử lý NaN
console.log(arr.indexOf(NaN));    // -1 — indexOf dùng ===, không tìm được NaN
console.log(arr.findIndex(n => Object.is(n, NaN)))); // 5 ✅
```

---

### Câu 8: Switch statement

```javascript
const val = '1';

switch (val) {
  case 1:  console.log('number 1'); break;
  case '1': console.log('string 1'); break;
}

// switch dùng ===, không phải ==
// val là string '1', case 1 là number 1 → !== → skip
// → In ra 'string 1'
```

---

### Câu 9: Object.is vs ===

```javascript
const compare = (a, b) => Object.is(a, b);

console.log(compare(0, -0));    // false
console.log(compare(NaN, NaN)); // true
console.log(compare({}, {}));    // false — khác reference
```

---

### Câu 10: Array equality

```javascript
const eq = (a, b) => a.length === b.length && a.every((v, i) => Object.is(v, b[i]));

console.log(eq([1, 2, 3], [1, 2, 3])); // true
console.log(eq([1, 2], [1, 2, 3]));    // false
console.log(eq([NaN], [NaN]));          // true ✅
```

---

## 8. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  EQUALITY                                                  │
│                                                         │
│  === (strict)                                            │
│    → Không coerce                                        │
│    → Khác type → false ngay                             │
│    → NaN !== NaN                                        │
│    → 0 === -0                                           │
│                                                         │
│  == (loose)                                             │
│    → Coerce trước khi so sánh                         │
│    → null == undefined → true (DUY NHẤT 2 giá trị)   │
│    → 0 == '' == false == '0' → tất cả bằng nhau      │
│    → 0, '', false luôn == nhau                         │
│                                                         │
│  Object.is()                                            │
│    → Giống === nhưng:                                │
│    → NaN === NaN → true                               │
│    → 0 !== -0                                         │
│                                                         │
│  ⚠️ LUÔN dùng === (hoặc == với null/undefined)      │
│  ⚠️ Array/Object: không dùng ===, dùng deepEqual     │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Mối Liên Hệ

```
Equality
  ├── Type Coercion (009)      ← == dùng coercion
  ├── Data Types (005)          ← type quyết định so sánh
  ├── NaN handling              ← special case
  └── Array/Object comparison    ← cần custom logic
```

---

## Checklist

- [ ] Hiểu sự khác biệt giữa === và ==
- [ ] Nhớ được bảng so sánh với 0, '', false
- [ ] Biết dùng Object.is() cho NaN và -0
- [ ] Dùng == với null/undefined (duy nhất)
- [ ] Hiểu array/object cần deep comparison
- [ ] Trả lời được 10/10 câu hỏi phỏng vấn

---

## 🎉 Chương 01 Hoàn Thành!

Bạn đã học xong JavaScript Core:
- Scope, Closure, Hoisting, `this`
- Data Types, Execution Context
- Spread/Rest, Destructuring
- Type Coercion, Equality

Tiếp theo: **Chương 02 — Prototype & OOP**

---

*Last updated: 2026-03-31*
