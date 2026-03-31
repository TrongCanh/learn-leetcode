# #271 - Encode and Decode Strings

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | String, Array, Design |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/encode-and-decode-strings/

---

## 📖 Đề bài

Thiết kế encode/decode cho danh sách strings.

**Encode:** ["lint", "code"] → "something"
**Decode:** "something" → ["lint", "code"]

### Ví dụ

```
Input:  ["lint", "code", "love", "you"]
Output: ["lint", "code", "love", "you"]
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài

```
Encode: Nhiều strings → 1 string
Decode: 1 string → Nhiều strings
Constraint: Decode phải khôi phục chính xác
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Vấn đề cần giải quyết

```
Làm sao phân tách strings khi không biết trước độ dài?

Cách nào đáng tin cậy nhất?
→ Dùng **LENGTH PREFIX** (tiền tố độ dài)
```

---

#### Bước 2: "Aha moment!"

> **Aha moment:**
> "Ghi độ dài TRƯỚC string!"
>
> **Format: `[length]:[string]`**
>
> "Khi decode, đọc độ dài trước, rồi đọc đúng số ký tự sau!"

```
Encode:
  "lint" → "4:lint"
  "code" → "4:code"
  Result: "4:lint4:code"

Decode:
  "4:lint4:code"
  ↓
  Đọc "4" → length = 4
  Đọc "lint" → string 1
  Đọc "4" → length = 4
  Đọc "code" → string 2
  ↓
  ["lint", "code"] ✓
```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Tiền tố độ dài = reliable nhất"             │
│   → Encode: length + ":" + string                │
│   → Decode: đọc số trước, đọc đúng số chars   │
│                                                     │
│   KEY INSIGHT #2:                                  │
│   "Dùng ':' làm delimiter"                      │
│   → Vì số không thể là ':'                     │
│   → Integer luôn là digits (0-9)               │
│                                                     │
│   KEY INSIGHT #3:                                  │
│   "Tìm ':' để biết độ dài kết thúc"          │
│   → parseInt substring trước ':'                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Dùng delimiter trong string gốc
// Encode: "a#b" + "#" + "c" = "a#b#c"
// Decode: Tìm "#" → "a#b" và "c" ✓ Nhưng...
// → Nếu string chứa "#" → SAI!
if (str.includes('#')) {
  // → Phải escape hoặc dùng cách khác
}

// ❌ Pitfall 2: Không handle empty string
// "" → "0:" → decode vẫn hoạt động ✓

// ❌ Pitfall 3: parseInt với edge cases
// parseInt("123abc") = 123 → Có thể sai nếu không tìm đúng delimiter
// → Tìm ":" để xác định chính xác

// ❌ Pitfall 4: indexOf(':') trả về -1
while (i < str.length) {
  const colonIdx = str.indexOf(':', i);
  // colonIdx có thể = -1 nếu không tìm thấy!
  if (colonIdx === -1) break; // Cần handle
}
```

---

### 🔄 5. Các hướng tiếp cận

#### 🔹 Cách 1: Length Prefix (O(n)) ⭐ **TỐI ƯU**

**Encode:**
```javascript
function encode(strs) {
  let result = '';
  for (const str of strs) {
    result += str.length + ':' + str;
  }
  return result;
}
```

**Decode:**
```javascript
function decode(str) {
  const result = [];
  let i = 0;

  while (i < str.length) {
    // Tìm vị trí của ':'
    const colonIdx = str.indexOf(':', i);

    // Lấy độ dài
    const length = parseInt(str.substring(i, colonIdx));

    // Lấy string
    const word = str.substring(colonIdx + 1, colonIdx + 1 + length);
    result.push(word);

    // Di chuyển index đến string tiếp theo
    i = colonIdx + 1 + length;
  }

  return result;
}
```

**📊 Phân tích:**
```
Time:  O(n) — duyệt string 1 lần
Space: O(n) — lưu encoded string
```

---

#### 🔹 Cách 2: Base64 Encoding

```javascript
function encode(strs) {
  return strs.map(s => btoa(unescape(encodeURIComponent(s)))).join('|||');
}

function decode(str) {
  return str.split('|||').map(s =>
    decodeURIComponent(escape(atob(s)))
  );
}
```

**⚠️ Nhược điểm:**
- Phức tạp
- Dùng delimiter có thể gặp vấn đề

---

### 🚀 6. Visual Walkthrough

```
Input: ["lint", "code", "love"]

┌──────────────────────────────────────────────────────────────┐
│ ENCODE:                                                       │
│                                                               │
│ "lint"  → len=4  → "4:lint"                                  │
│ "code"  → len=4  → "4:code"                                  │
│ "love"  → len=4  → "4:love"                                  │
│                                                               │
│ Result: "4:lint4:code4:love"                                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ DECODE:                                                       │
│                                                               │
│ String: "4:lint4:code4:love"                                │
│                                                               │
│ Step 1: i=0                                                   │
│   colonIdx = str.indexOf(':', 0) = 1                        │
│   length = parseInt("4") = 4                                  │
│   word = str.substring(2, 2+4) = "lint"                     │
│   push "lint"                                                 │
│   i = 2 + 4 = 6                                             │
│                                                               │
│ Step 2: i=6                                                   │
│   colonIdx = str.indexOf(':', 6) = 7                        │
│   length = parseInt("4") = 4                                  │
│   word = str.substring(8, 8+4) = "code"                     │
│   push "code"                                                 │
│   i = 8 + 4 = 12                                            │
│                                                               │
│ Step 3: i=12                                                  │
│   colonIdx = str.indexOf(':', 12) = 13                      │
│   length = parseInt("4") = 4                                  │
│   word = str.substring(14, 14+4) = "love"                   │
│   push "love"                                                 │
│   i = 14 + 4 = 18                                            │
│                                                               │
│ i >= str.length → STOP                                        │
│                                                               │
│ Result: ["lint", "code", "love"] ✓                          │
└──────────────────────────────────────────────────────────────┘
```

---

### 🎯 7. Biến thể

```javascript
// Variation 1: UTF-8 encoding
// → Dùng encodeURIComponent / decodeURIComponent

// Variation 2: Integer array encoding
// → Encode numbers thay vì strings

// Variation 3: Chunked transfer (HTTP)
// → Dùng cùng concept trong networking
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Encode and Decode Strings - Length Prefix
 * Time: O(n) | Space: O(n)
 */
var Codec = function() {};

Codec.prototype.encode = function(strs) {
  let result = '';
  for (const str of strs) {
    result += str.length + ':' + str;
  }
  return result;
};

Codec.prototype.decode = function(str) {
  const result = [];
  let i = 0;

  while (i < str.length) {
    const colonIdx = str.indexOf(':', i);
    const length = parseInt(str.substring(i, colonIdx));
    const word = str.substring(colonIdx + 1, colonIdx + 1 + length);
    result.push(word);
    i = colonIdx + 1 + length;
  }

  return result;
};
```

---

## 🧪 Test Cases

```javascript
const codec = new Codec();

// Test 1
const strs1 = ["lint", "code", "love", "you"];
const encoded1 = codec.encode(strs1);
console.log(codec.decode(encoded1)); // ["lint", "code", "love", "you"]

// Test 2 - Special characters
const strs2 = ["we", "say", ":", "yes"];
console.log(codec.decode(codec.encode(strs2))); // ["we", "say", ":", "yes"]

// Test 3 - Empty strings
const strs3 = ["", ""];
console.log(codec.decode(codec.encode(strs3))); // ["", ""]

// Test 4 - Long strings
const strs4 = ["a".repeat(1000)];
console.log(codec.decode(codec.encode(strs4))); // ["a".repeat(1000)]

// Test 5 - Numbers as strings
const strs5 = ["123", "456"];
console.log(codec.decode(codec.encode(strs5))); // ["123", "456"]
```

---

## 📝 Ghi chú

```
PATTERN: Length Prefix Encoding

💡 KEY INSIGHT:
   "Encode: length + ':' + string"
   "Decode: đọc số trước, đọc đúng số chars sau"

⚠️ PITFALLS:
   - Dùng ':' làm delimiter (không bao giờ xuất hiện trong số)
   - indexOf(':') có thể trả về -1

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Bài tiếp theo

[Quay lại README Week 1](./README.md)
