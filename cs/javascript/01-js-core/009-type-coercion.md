# Type Coercion — Khi JavaScript Tự Động Đổi Type

## Câu hỏi mở đầu

```javascript
console.log('5' + 3);     // ①
console.log('5' - 3);     // ②
console.log(true + 1);    // ③
console.log([] + {});     // ④
console.log({} + []);     // ⑤
```

Hãy đoán trước. Đáp án: `'53'`, `2`, `2`, `'[object Object]'`, `'[object Object]'`.

Tất cả đều là **type coercion** — JavaScript tự động (hoặc ngầm) đổi giá trị từ type này sang type khác. Và nếu không hiểu rules, bạn sẽ không bao giờ debug được những bug kỳ lạ.

---

## 1. Hai Loại Coercion

### Explicit coercion (ép kiểu tường minh)

```javascript
// Bạn CHỦ ĐỘNG đổi type
const num = Number('42');     // 42
const str = String(42);       // '42'
const bool = Boolean(0);      // false
const bool2 = Boolean('');    // false
const arrToStr = String([1, 2, 3]); // '1,2,3'
```

### Implicit coercion (ép kiểu ngầm)

```javascript
// JavaScript TỰ ĐỘNG đổi type trong một số operation
const result = '5' + 3;       // '53' — number 3 → string
const diff = '5' - 3;        // 2 — string '5' → number
const sum = true + 1;        // 2 — boolean true → 1
```

---

## 2. ToNumber — Đổi Sang Number

### Rules

| Input | Output | Ghi chú |
|-------|--------|---------|
| `undefined` | `NaN` | |
| `null` | `0` | |
| `true` | `1` | |
| `false` | `0` | |
| `''` | `0` | Empty string = 0 |
| `'  '` | `0` | Whitespace cũng = 0 |
| `'42'` | `42` | Numeric string → number |
| `'hello'` | `NaN` | |
| `[]` | `0` | |
| `[5]` | `5` | Single number element |
| `[1,2]` | `NaN` | |
| `{}` | `NaN` | |

### Minh họa

```javascript
Number('');              // 0
Number('  ');           // 0
Number('42px');         // NaN — không phải pure number
Number('3.14');         // 3.14
Number('1e3');          // 1000 — scientific notation
Number(null);           // 0 — ⚠️ khác với String(null) = 'null'
Number(undefined);       // NaN
Number([]);             // 0 — [] → '' → 0
Number(['5']);          // 5 — ['5'] → '5' → 5
Number(['1', '2']);     // NaN
Number({});             // NaN
```

---

## 3. ToString — Đổi Sang String

### Rules

| Input | Output |
|-------|--------|
| `undefined` | `'undefined'` |
| `null` | `'null'` |
| `true` | `'true'` |
| `false` | `'false'` |
| `42` | `'42'` |
| `NaN` | `'NaN'` |
| `Infinity` | `'Infinity'` |
| `[]` | `''` — empty string! |
| `[1,2]` | `'1,2'` |
| `{}` | `'[object Object]'` |
| `{a:1}` | `'[object Object]'` |

### Minh họa

```javascript
String(42);             // '42'
String(true);           // 'true'
String(null);           // 'null' — ⚠️ khác với Number(null) = 0
String(undefined);       // 'undefined'
String([]);             // '' — empty string!
String([1, 2, 3]);      // '1,2,3'
String({});             // '[object Object]'
String({a: 1});         // '[object Object]'

// Quan trọng: dùng template literal thay vì String()
const val = 42;
`${val}`;               // '42' — tường minh hơn
```

---

## 4. ToBoolean — Đổi Sang Boolean

### Falsy values (7 giá trị)

```javascript
// Tất cả đều === false sau khi convert
Boolean(false);       // false
Boolean(0);           // false
Boolean(-0);          // false
Boolean(0n);          // false (BigInt zero)
Boolean('');          // false
Boolean(null);        // false
Boolean(undefined);   // false
Boolean(NaN);         // false

// Tất cả còn lại = truthy!
Boolean('0');          // true
Boolean('false');     // true (non-empty string)
Boolean([]);          // true — empty array vẫn truthy!
Boolean({});          // true — empty object vẫn truthy!
Boolean(' ');         // true (whitespace)
```

### Trap: Array empty vẫn truthy

```javascript
const arr = [];
if (arr) { console.log('truthy'); } // 'truthy' — array empty vẫn truthy!
if (arr.length === 0) { console.log('empty'); } // 'empty' — phải check length

// {} trong if khác với empty object
if ({}) { console.log('truthy'); } // 'truthy' — object luôn truthy!
```

---

## 5. ToPrimitive — Quy Tắc Đằng Sau Operations

### ToPrimitive với `+`

```javascript
// Toán tử + có 2 role: cộng số và nối string
// JavaScript quyết định dựa trên ToPrimitive

// Case 1: Ít nhất 1 operand là string → nối string
'5' + 3;       // '5' + '3' = '53'
5 + '3';       // '5' + '3' = '53'
'5' + true;    // '5' + 'true' = '5true'
'5' + null;    // '5' + 'null' = '5null'
'5' + {};      // '5' + '[object Object]' = '5[object Object]'

// Case 2: Cả 2 đều là number-like → cộng số
5 + true;      // 5 + 1 = 6
5 + null;      // 5 + 0 = 5
5 + undefined; // 5 + NaN = NaN
5 + [];        // 5 + '' → 5 + 0 = 5 (!)

// Case 3: Object + something
[] + [];       // '' + '' = ''
[] + {};       // '' + '[object Object]' = '[object Object]'
{} + [];       // {} + '' → +'' = 0 (xem dưới)
{} + {};       // '[object Object][object Object]'
```

### ToPrimitive với `-`, `*`, `/`, `%`

```javascript
// Toán tử số học luôn ép về Number
'5' - 3;      // 2
'5' * '3';    // 15
'6' / '2';    // 3
'6' % 4;      // 2

// Với giá trị đặc biệt
'5' - 'a';    // NaN
[] - 1;       // 0 - 1 = -1 — [] → '' → 0
[5] - 1;      // 5 - 1 = 4
[1, 2] - 1;   // NaN
```

---

## 6. ToInteger — Khi Ép Sang Integer

### `Number()` vs `parseInt()` vs `Math.floor()`

```javascript
// Number() — convert to number, NaN nếu không phải
Number('42px');   // NaN
Number('42');    // 42

// parseInt() — parse từ trái sang, dừng ở ký tự không phải số
parseInt('42px'); // 42
parseInt('3.14'); // 3 — dừng ở '.'
parseInt('  42');  // 42 — bỏ whitespace

// parseFloat() — giữ phần thập phân
parseFloat('3.14px'); // 3.14

// Math.floor() — luôn làm tròn xuống
Math.floor(3.9);  // 3
Math.floor(-3.9); // -4
Math.ceil(3.1);   // 4
Math.round(3.5);  // 4
Math.trunc(3.9);  // 3 — bỏ phần thập phân
Math.trunc(-3.9); // -3 — bỏ phần thập phân
```

---

## 7. Các Traps Phổ Biến Nhất

### Trap 1: `+` là nối string, không phải cộng số

```javascript
// Bug kinh điển
const subtotal = 10;
const tax = 0.08;
const total = subtotal + tax;     // 10.08 ✅
const label = 'Total: ' + subtotal + tax; // 'Total: 100.08' ❌

// Fix: dùng template literal
const labelFixed = `Total: ${subtotal + tax}`; // 'Total: 10.08' ✅

// Hoặc ép Number
const labelFixed2 = 'Total: ' + (subtotal + tax); // 'Total: 10.08' ✅
```

### Trap 2: Empty array = 0 trong numeric context

```javascript
[] == 0;    // true — [] → '' → 0
![] == 0;   // true — [] truthy → ![] = false → false == 0 = true
[] === 0;   // false — different types

// Không dùng == với 0
if (arr.length == 0) { } // OK nhưng nên dùng ===
if (arr.length === 0) { } // ✅ Đúng hơn
```

### Trap 3: `{}` ở đầu dòng

```javascript
// Thật ra {} + [] được interpret như:
{} + []; // {} ở đây được JS xem là block, không phải object
+[];     // unary + ép [] → 0

// Khác với:
const result = {} + []; // {} ở đây là object
result; // '[object Object]'
```

```javascript
// Câu lệnh rõ ràng:
{} + {}; // {} block + {} → NaN hoặc '[object Object][object Object]'
// Phụ thuộc vào JS engine và strict mode
```

### Trap 4: null ≠ 0 trong numeric context

```javascript
null == 0;    // true — null đổi thành 0
null === 0;   // false
null + 1;    // 1 — null → 0
undefined + 1; // NaN — undefined → NaN

// Check null đúng cách
if (value === null) { } // ✅
if (value == null) { }  // ✅ (null || undefined) — cũng OK
if (!value && value !== null && value !== undefined) { } // ✅ rõ ràng nhất
```

### Trap 5: Floating point precision

```javascript
0.1 + 0.2;    // 0.30000000000000004 ❌
0.1 + 0.2 === 0.3; // false

// Fix bằng toFixed hoặc epsilon
Number((0.1 + 0.2).toFixed(2)); // 0.3
Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON; // true
```

---

## 8. Câu Hỏi Phỏng Vấn

### Câu 1: Đoán kết quả

```javascript
console.log('1' + 2 + 3);  // ①
console.log(1 + 2 + '3');  // ②
console.log('1' + (2 + 3)); // ③
```

**Trả lời:** ① `'123'`, ② `'33'`, ③ `'15'`

**Phân tích:**
- ①: `'1' + 2` → `'12'`, `'12' + 3` → `'123'`
- ②: `1 + 2` → `3`, `3 + '3'` → `'33'`
- ③: `2 + 3` → `5`, `'1' + 5` → `'15'`

---

### Câu 2: Đoán kết quả

```javascript
console.log([] == ![]);   // ①
console.log([] == []);    // ②
console.log({} == !{});  // ③
```

**Trả lời:** ① `true`, ② `false`, ③ `true`

**Phân tích:**
- ①: `![]` → `false` (empty array truthy → !truthy = false)
  `[] == false` → `0 == 0` → `true`
- ②: 2 object references khác nhau → `false`
- ③: Tương tự: `{}` truthy → `!{}` = false → `{} == false` → NaN → không so sánh được → `true`? Thực ra: `'[object Object]' == 0` → `NaN == 0` → `false`?

**Kiểm tra thực tế:**
```javascript
console.log([] == ![]);   // true
console.log({} == !{});  // false
```

---

### Câu 3: Implicit coercion trong condition

```javascript
if ('0') { console.log('truthy'); }
if ([]) { console.log('array'); }
if ('false') { console.log('string false'); }
if (new Boolean(false)) { console.log('Boolean object'); }
```

**Trả lời:** Tất cả đều in ra — vì tất cả đều truthy!

`new Boolean(false)` tạo **object**, không phải primitive boolean. Object luôn truthy!

---

### Câu 4: +'' vs Number()

```javascript
+'42';           // 42
+'42px';         // NaN
parseInt('42px'); // 42
+'  ';           // 0
+'';             // 0
Number('');       // 0
```

---

### Câu 5: Dùng !! để ép boolean

```javascript
// !! là cách ngắn gọn để ép boolean
!!'hello';     // true
!!'';          // false
!!0;           // false
!![];          // true — empty array vẫn truthy
!!null;        // false
!!undefined;   // false
!!{};          // true

// Kiểm tra truthy ngắn gọn
const isValid = !!userInput; // boolean
```

---

### Câu 6: So sánh null và undefined

```javascript
null == undefined; // true — chúng "equal" theo ==
null === undefined; // false — khác type

// Không bao giờ dùng ==
if (value === null || value === undefined) { }

// Dùng == khi muốn check cả hai
if (value == null) { } // null hoặc undefined
```

---

### Câu 7: Symbol coercion

```javascript
String(Symbol('x'));     // 'Symbol(x)' ✅
Symbol('x').toString();  // 'Symbol(x)' ✅
Number(Symbol('x'));    // TypeError ❌
Boolean(Symbol('x'));   // true ✅
```

---

## 9. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  TYPE COERCION                                            │
│                                                         │
│  Explicit: String(), Number(), Boolean()                │
│  Implicit: +, -, ==, if(), !!                          │
│                                                         │
│  ToNumber:                                              │
│    null → 0, undefined → NaN, '' → 0, [] → 0, {} → NaN │
│                                                         │
│  ToString:                                              │
│    null → 'null', undefined → 'undefined',              │
│    [] → '', {} → '[object Object]'                     │
│                                                         │
│  ToBoolean — 7 FALSY: false, 0, '', null, undefined,   │
│    NaN, 0n                                             │
│    Tất cả còn lại = TRUTHY                            │
│                                                         │
│  ⚠️ Luôn dùng === thay vì ==                          │
│  ⚠️ [] = 0, {} = '[object Object]'                    │
│  ⚠️ new Boolean(false) = truthy object                 │
└─────────────────────────────────────────────────────────┘
```

---

## 10. Mối Liên Hệ

```
Type Coercion
  ├── Equality (010)      ← == dùng coercion, === không
  ├── Data Types (005)    ← coercion phụ thuộc type
  ├── Function params      ← default parameters dùng coercion
  └── Logical operators    ← ||, &&, ?? dùng ToBoolean/ToPrimitive
```

---

## Checklist

- [ ] Giải thích được ToNumber, ToString, ToBoolean
- [ ] Nhớ 7 falsy values
- [ ] Hiểu implicit coercion trong +, -, ==, if
- [ ] Tránh được trap: empty array = 0, new Boolean(false) = truthy
- [ ] Luôn dùng === thay vì ==
- [ ] Trả lời được các câu hỏi phỏng vấn trên

---

*Last updated: 2026-03-31*
