# #242 - Valid Anagram

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | String, Hash Table, Sorting |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/valid-anagram/

---

## 📖 Đề bài

### Mô tả
Cho 2 strings `s` và `t`, trả về `true` nếu `t` là **anagram** của `s`.

**Anagram:** Hai strings có cùng ký tự với cùng số lần xuất hiện, chỉ khác thứ tự.

### Ví dụ

**Example 1:**
```
Input:  s = "anagram", t = "nagaram"
Output: true
```

**Example 2:**
```
Input:  s = "rat", t = "car"
Output: false
```

**Example 3:**
```
Input:  s = "a", t = "a"
Output: true
```

### Constraints
```
1 <= s.length, t.length <= 5 * 10^4
s và t chỉ chứa chữ cái tiếng Anh thường
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: 2 strings có cùng ký tự, cùng số lần xuất hiện không?
Trả về: Boolean (true/false)
Cần: Đếm số lần mỗi ký tự xuất hiện
```

---

### 🤔 2. Tư duy từng bước (Step-by-step)

#### Bước 1: Hiểu Anagram bằng ví dụ

```
"anagram" và "nagaram"

Đếm ký tự:
s = "anagram" → a:3, n:1, g:1, r:1, m:1
t = "nagaram" → n:1, a:3, g:1, r:1, m:1

→ Cùng ký tự, cùng số lần → TRUE!

"rat" và "car"

s = "rat" → r:1, a:1, t:1
t = "car" → c:1, a:1, r:1

→ Khác: s có 't' nhưng không có 'c' → FALSE!
```

---

#### Bước 2: Nghĩ đến cách "ngây thơ" nhất

> **Hỏi:** "Làm sao biết 2 strings có cùng ký tự không?"

**Cách 1: Sort cả 2 strings**
```
s = "anagram" → sort → "aagmnr"
t = "nagaram" → sort → "aagmnr"

→ Giống nhau! → TRUE
```

**Cách 2: Đếm từng ký tự**
```
s = "anagram"
Count: {a:3, n:1, g:1, r:1, m:1}

t = "nagaram"
Count: {n:1, a:3, g:1, r:1, m:1}

→ Counts giống nhau! → TRUE
```

---

#### Bước 3: "Aha moment!"

> **Aha moment:**
> "Thay vì đếm 2 lần rồi so sánh, em có thể ĐẾM MỘT LẦN!"
> - Đếm `s`: tăng count
> - Đếm `t`: giảm count
> - Nếu là anagram → tất cả counts = 0

```
s = "anagram", t = "nagaram"

Count:
  a: +1 (từ s) -1 (từ t) = 0
  n: +1 -1 = 0
  g: +1 -1 = 0
  r: +1 -1 = 0
  m: +1 -1 = 0

→ Tất cả = 0 → TRUE!
```

---

#### Bước 4: Xác định edge cases

```
Edge 1: s = "a", t = "a"
  Count: a: 1-1 = 0 → TRUE

Edge 2: s = "a", t = "b"
  Count: a: 1, b: -1 → NOT 0 → FALSE

Edge 3: s = "ab", t = "a"
  Length khác nhau → FALSE ngay!

Edge 4: s = "aa", t = "aa"
  Count: a: 2-2 = 0 → TRUE

→ CHECK ĐỘ DÀI TRƯỚC!
```

---

### 🔑 3. Key Insight (Điều mấu chốt)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Anagram = cùng character frequency"            │
│   → Đếm số lần xuất hiện của mỗi ký tự          │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Single pass: đếm s (tăng), đếm t (giảm)"     │
│   → Nếu anagram → tất cả counts = 0               │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Độ dài khác nhau → chắc chắn không phải"     │
│   → Early exit bằng kiểm tra độ dài              │
│                                                     │
│   KEY INSIGHT #4:                                   │
│   "Fixed alphabet (26 letters) → array[26] = O(1)"│
│   → Không cần Map, dùng array cho performance     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls (Lỗi hay mắc)

```javascript
// ❌ Pitfall 1: Quên kiểm tra độ dài
function isAnagram(s, t) {
  // s.length !== t.length → early exit!
  // Nếu không check → vẫn đúng nhưng chậm hơn
  const count = {};
  // ... đếm tất cả ...
}

// ✅ Đúng: check độ dài trước
if (s.length !== t.length) return false;

// ❌ Pitfall 2: Không handle negative count
function isAnagram(s, t) {
  const count = {};
  for (const char of s) count[char] = (count[char]||0) + 1;
  for (const char of t) count[char]--;
  // Nếu t có ký tự không có trong s → count < 0
  // Nhưng code không check → có thể sai!
  return true; // ❌ Không đúng!
}

// ✅ Đúng: kiểm tra negative
function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const count = {};
  for (const char of s) count[char] = (count[char]||0) + 1;
  for (const char of t) {
    if (!count[char]) return false; // Ký tự không có hoặc count = 0
    count[char]--;
  }
  return true;
}

// ❌ Pitfall 3: Nhầm lẫn sort approach
function isAnagram(s, t) {
  return s.split('').sort().join('') === t.split('').sort().join('');
  // → O(n log n) thay vì O(n)
  // → Tạo nhiều intermediate strings
}

// ✅ Dùng approach đếm: O(n)
```

---

### 🔄 5. Các hướng tiếp cận (So sánh)

#### 🔹 Cách 1: Sort & Compare (O(n log n))

```javascript
function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  return s.split('').sort().join('') === t.split('').sort().join('');
}
```

**📊 Phân tích:**
```
Time:  O(n log n) — sort 2 strings
Space: O(n) — intermediate arrays
```

**🔍 Tại sao hoạt động?**
```
"eat" → sort → "aet"
"tea" → sort → "aet"

→ Giống nhau! → TRUE
```

**⚠️ Nhược điểm:**
- Sort tốn thời gian
- Tạo nhiều intermediate strings

---

#### 🔹 Cách 2: Frequency Counter với Object (O(n))

```javascript
function isAnagram(s, t) {
  if (s.length !== t.length) return false;

  const count = {};

  // Đếm s (tăng)
  for (const char of s) {
    count[char] = (count[char] || 0) + 1;
  }

  // Đếm t (giảm)
  for (const char of t) {
    if (!count[char]) return false; // Không có hoặc đã = 0
    count[char]--;
  }

  return true;
}
```

**📊 Phân tích:**
```
Time:  O(n) — 2 passes
Space: O(1) hoặc O(k) — k = số ký tự unique (≤ 26)
```

**🔍 Step-by-step:**
```
s = "anagram", t = "nagaram"

Pass 1 (đếm s):
  a:1, n:1, g:1, r:1, m:1

Pass 2 (đếm t):
  n:0, a:2, g:0, r:0, m:0, a:1, r:0, a:0, m:0

→ Tất cả = 0 → TRUE!
```

---

#### 🔹 Cách 3: Fixed Array 26 (O(n), O(1) space) ⭐ **TỐI ƯU**

```javascript
function isAnagram(s, t) {
  if (s.length !== t.length) return false;

  const count = new Array(26).fill(0);
  const base = 'a'.charCodeAt(0);

  for (const char of s) {
    count[char.charCodeAt(0) - base]++;
  }

  for (const char of t) {
    const idx = char.charCodeAt(0) - base;
    if (count[idx] === 0) return false;
    count[idx]--;
  }

  return true;
}
```

**📊 Phân tích:**
```
Time:  O(n) — 2 passes
Space: O(1) — fixed array 26 phần tử
```

**🔍 Tại sao array[26] là O(1) space?**
```
Vì alphabet có cố định 26 chữ cái!
→ Array size không phụ thuộc vào n (input size)
→ Space complexity = O(26) = O(1)
```

**🔍 Chuyển char → index:**
```
'a' → index 0  (97 - 97 = 0)
'b' → index 1  (98 - 97 = 1)
'z' → index 25 (122 - 97 = 25)

char.charCodeAt(0) - 'a'.charCodeAt(0)
```

---

### 🚀 6. Visual Walkthrough (Cách 2)

```
s = "anagram", t = "nagaram"

Step 1: Check độ dài
  s.length = 7, t.length = 7 → EQUAL ✓

Step 2: Count s
  char  | count
  ──────┼───────
   'a'  |   3
   'n'  |   1
   'g'  |   1
   'r'  |   1
   'm'  |   1

Step 3: Decrement for t
  'n': 1 → 0  ✓
  'a': 3 → 2  ✓
  'g': 1 → 0  ✓
  'a': 2 → 1  ✓
  'r': 1 → 0  ✓
  'a': 1 → 0  ✓
  'm': 1 → 0  ✓

Step 4: Tất cả counts = 0

→ TRUE ✓
```

```
s = "rat", t = "car"

Step 1: Check độ dài
  s.length = 3, t.length = 3 → EQUAL ✓

Step 2: Count s
  r:1, a:1, t:1

Step 3: Decrement for t
  'c': count['c'] = undefined → return FALSE!

→ FALSE ✓
```

---

### 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Group Anagrams (LeetCode 49)
// Nhóm các strings là anagrams của nhau
// → Dùng sorted string làm key trong Map

// Variation 2: Find all anagrams (LeetCode 438)
// Tìm tất cả start indices của anagram trong string
// → Sliding Window + Frequency Count

// Variation 3: Check if permutation
// Kiểm tra xem string có phải là permutation của string khác
// → Giống hệt Anagram problem!
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Valid Anagram - Frequency Counter
 * Time: O(n) | Space: O(1)
 */
var isAnagram = function(s, t) {
  if (s.length !== t.length) return false;

  const count = {};

  for (const char of s) {
    count[char] = (count[char] || 0) + 1;
  }

  for (const char of t) {
    if (!count[char]) return false;
    count[char]--;
  }

  return true;
};

// Hoặc dùng Array[26] cho performance tốt hơn:
var isAnagram = function(s, t) {
  if (s.length !== t.length) return false;

  const count = new Array(26).fill(0);
  const base = 'a'.charCodeAt(0);

  for (const char of s) count[char.charCodeAt(0) - base]++;
  for (const char of t) {
    const idx = char.charCodeAt(0) - base;
    if (count[idx] === 0) return false;
    count[idx]--;
  }

  return true;
};
```

---

## 🧪 Test Cases

```javascript
// Test 1
console.log(isAnagram("anagram", "nagaram")); // true

// Test 2
console.log(isAnagram("rat", "car")); // false

// Test 3
console.log(isAnagram("a", "a")); // true

// Test 4 - Độ dài khác nhau
console.log(isAnagram("abc", "ab")); // false

// Test 5 - Cùng ký tự nhưng khác số lượng
console.log(isAnagram("aab", "abb")); // false

// Test 6 - Empty strings
console.log(isAnagram("", "")); // true

// Test 7 - Tất cả giống nhau
console.log(isAnagram("aaaaa", "aaaaa")); // true

// Test 8 - Sắp xếp khác nhau
console.log(isAnagram("abc", "cba")); // true

// Test 9 - Unicode (nếu có)
console.log(isAnagram("💡", "💡💡")); // false
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm: ...
Thời gian làm: ... phút
Điểm khó: ...

PATTERN: Frequency Counter / Hash Map

💡 KEY INSIGHT:
   "Đếm s (tăng), đếm t (giảm) → anagram nếu tất cả = 0"

⚠️ PITFALLS:
   - Check độ dài TRƯỚC (early exit)
   - Check negative count (ký tự không có trong s)

🔄 VARIATIONS:
   - Group Anagrams → sorted string key
   - Find All Anagrams → sliding window

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Bài tiếp theo

[Bài 3: Two Sum](./003-two-sum.md)
