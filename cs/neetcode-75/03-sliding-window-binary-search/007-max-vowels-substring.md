# #1456 - Maximum Number of Vowels in Substring

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | String, Sliding Window |
| **Trạng thích** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/maximum-number-of-vowels-in-a-substring-of-given-length/

---

## 📖 Đề bài

### Mô tả
Cho string `s` và số `k`, tìm **số nguyên âm lớn nhất** trong substring có độ dài `k`.

### Ví dụ

**Example 1:**
```
Input:  s = "abciiidef", k = 3
Output: 3
Giải thích: "bci" có 3 nguyên âm (a, e, i, o, u)
```

**Example 2:**
```
Input:  s = "aeiou", k = 2
Output: 2
```

### Constraints
```
1 <= s.length <= 10^5
1 <= k <= s.length
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
┌─────────────────────────────────────────────────────┐
│ Hỏi:  Số nguyên âm lớn nhất trong k-char substring?│
│ Trả về: Số lượng nguyên âm (number)                │
│ Input:  String s, k                                         │
│                                                     │
│ Nguyên âm: a, e, i, o, u (5 chữ cái)       │
└─────────────────────────────────────────────────────┘
```

---

### 🤔 2. Tư duy từng bước (Step-by-step)

#### Bước 1: Nghĩ đến cách "ngây thơ" nhất

> **Cách 1: Duyệt tất cả substrings độ dài k**

```
s = "abciiidef", k = 3

Substrings:
  "abc" → vowels = 1 (a)
  "bcc" → vowels = 1 (c)
  "cii" → vowels = 2 (i,i)
  "iid" → vowels = 2 (i,i)
  "ide" → vowels = 2 (i,e)
  "def" → vowels = 1 (e)

→ max = 2 ✓

→ O(n×k) - CHẬM!
```

**⚠️ Nhược điểm:**
```javascript
function maxVowels(s, k) {
  let max = 0;
  const vowels = new Set(['a','e','i','o','u']);
  
  for (let i = 0; i <= s.length - k; i++) {
    let count = 0;
    for (let j = i; j < i + k; j++) {
      if (vowels.has(s[j])) count++;
    }
    max = Math.max(max, count);
  }
  return max;
}
// → O(n×k)
```

---

#### Bước 2: Nhận ra vấn đề + "Aha moment!"

> **Aha moment:**
> "Cũng là Sliding Window!"
> "→ Tính số vowels trong window ĐẦU TIÊN"
> "→ Trượt window, cập nhật count!"

```
Luồng tư duy:
┌─────────────────────────────────────────────────────┐
│ Bước 1: Đếm vowels trong window đầu tiên      │
│   count = số nguyên âm trong s[0..k-1]       │
│                                                       │
│ Bước 2: Trượt window                             │
│   Window mới: s[i+1..i+k]                        │
│   count mới = count cũ - (s[i] là vowel?)     │
│                      + (s[i+k] là vowel?)       │
│                                                       │
│ Bước 3: Cập nhật max                           │
└─────────────────────────────────────────────────────┘
```

---

#### Bước 3: Validate intuition bằng ví dụ chi tiết

**Ví dụ: s = "abciiidef", k = 3**

```
┌─────────────────────────────────────────────────────────────────┐
│ Bước 1: Window đầu tiên s[0..2] = "abc"                     │
│   vowels: a(✓), b(✗), c(✗) → count = 1                     │
│   max = 1                                                            │
│                                                                 │
│ Bước 2: Trượt đến s[1..3] = "bcc"                          │
│   Window cũ: "abc"                                               │
│   Số 1 bị loại: 'a' (vowel) → count = 1 - 1 = 0           │
│   Số mới vào: 'c' (không vowel) → count = 0 + 0 = 0       │
│   max = max(1, 0) = 1                                         │
│                                                                 │
│ Bước 3: Trượt đến s[2..4] = "cii"                          │
│   Loại 'b' (không) → count = 0 + 0 = 0                     │
│   Thêm 'i' (vowel) → count = 0 + 1 = 1                     │
│   max = max(1, 1) = 1                                         │
│                                                                 │
│ Bước 4: Trượt đến s[3..5] = "iid"                          │
│   Loại 'c' (không) → count = 1 + 0 = 1                     │
│   Thêm 'i' (vowel) → count = 1 + 1 = 2                     │
│   max = max(1, 2) = 2 ✓                                      │
│                                                                 │
│ Bước 5: Trượt đến s[4..6] = "ide"                          │
│   Loại 'i' (vowel) → count = 2 - 1 = 1                     │
│   Thêm 'd' (không) → count = 1 + 0 = 1                     │
│   max = max(2, 1) = 2                                         │
│                                                                 │
│ return 2 ✓                                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

#### Bước 4: Xác định edge cases

```
Edge Case 1: s = "aeiou", k = 5
  → Tất cả đều là vowel → count = 5 ✓

Edge Case 2: s = "bcdfg", k = 2
  → Không có vowel → count = 0 ✓

Edge Case 3: k = 1
  → Trả về số ký tự là nguyên âm

Edge Case 4: s = "a", k = 1
  → count = 1 ✓
```

---

### 🔑 3. Key Insight (Điều mấu chốt)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Sliding Window cho count vowels"              │
│   → Tính count đầu, rồi trượt!                │
│                                                     │
│   KEY INSIGHT #2:                                  │
│   "Cập nhật count: count - out + in"         │
│   → out = s[left], in = s[left+k]           │
│                                                     │
│   KEY INSIGHT #3:                                  │
│   "Set cho vowels: O(1) lookup"             │
│   → new Set(['a','e','i','o','u'])       │
│                                                     │
│   KEY INSIGHT #4:                                  │
│   "So sánh với Set: vowels.has(char)"      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls (Lỗi hay mắc)

```javascript
// ❌ Pitfall 1: Không dùng Sliding Window
function wrongMaxVowels(s, k) {
  let max = 0;
  for (let i = 0; i <= s.length - k; i++) {
    let count = 0;
    for (let j = i; j < i + k; j++) {
      // ❌ O(k) mỗi window!
    }
  }
}

// ✅ Đúng: Sliding Window
function maxVowels(s, k) {
  const vowels = new Set(['a','e','i','o','u']);
  
  // Count window đầu tiên
  let count = 0;
  for (let i = 0; i < k; i++) {
    if (vowels.has(s[i])) count++;
  }
  
  let max = count;
  
  // Trượt window
  for (let i = k; i < s.length; i++) {
    if (vowels.has(s[i - k])) count--;  // Loại
    if (vowels.has(s[i])) count++;        // Thêm
    max = Math.max(max, count);
  }
  
  return max;
}

// ❌ Pitfall 2: Nhầm hướng trượt
// s[i - k] = ký tự bị loại (ở bên trái)
// s[i] = ký tự mới vào (ở bên phải)

// ❌ Pitfall 3: Không check vowels.has trước khi cập nhật
if (vowels.has(s[i - k])) count--;  // ✅ Check trước
```

---

### 🔄 5. Các hướng tiếp cận (So sánh)

#### 🔹 Cách 1: Brute Force (O(n×k))

```javascript
function maxVowels(s, k) {
  const vowels = new Set(['a','e','i','o','u']);
  let max = 0;
  
  for (let i = 0; i <= s.length - k; i++) {
    let count = 0;
    for (let j = i; j < i + k; j++) {
      if (vowels.has(s[j])) count++;
    }
    max = Math.max(max, count);
  }
  
  return max;
}
```

**📊 Phân tích:**
```
Time:  O(n×k)
Space: O(1)
```

---

#### 🔹 Cách 2: Sliding Window (O(n)) ⭐ **TỐI ƯU**

```javascript
function maxVowels(s, k) {
  const vowels = new Set(['a','e','i','o','u']);
  
  // Count window đầu tiên
  let count = 0;
  for (let i = 0; i < k; i++) {
    if (vowels.has(s[i])) count++;
  }
  
  let max = count;
  
  // Trượt window
  for (let i = k; i < s.length; i++) {
    if (vowels.has(s[i - k])) count--;
    if (vowels.has(s[i])) count++;
    max = Math.max(max, count);
  }
  
  return max;
}
```

**📊 Phân tích:**
```
Time:  O(n)
Space: O(1)
```

---

### 🚀 6. Visual Walkthrough

```
s = "abciiidef", k = 3

┌─────────────────────────────────────────────────────────────────┐
│ Window 1: "abc" → count=1, max=1                             │
│                                                                 │
│ Window 2: "bcc" → loại 'a'(-1), thêm 'c'(+0) → count=0    │
│                                                                 │
│ Window 3: "cii" → loại 'b'(+0), thêm 'i'(+1) → count=1    │
│                                                                 │
│ Window 4: "iid" → loại 'c'(+0), thêm 'i'(+1) → count=2 ✓ │
│                                                                 │
│ Window 5: "ide" → loại 'i'(-1), thêm 'd'(+0) → count=1    │
│                                                                 │
│ → return 2                                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

### 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Count consonants thay vì vowels
// → Đếm số phụ âm

// Variation 2: Longest substring with K distinct characters
// → Dùng Map đếm distinct

// Variation 3: Maximum number of repeating characters
// → Đếm số ký tự lặp lại
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Maximum Number of Vowels in Substring
 * 
 * Ý tưởng: Sliding Window
 * - Đếm vowels trong window đầu
 * - Trượt: count = count - out + in
 * 
 * Time: O(n) | Space: O(1)
 * 
 * @param {string} s
 * @param {number} k
 * @return {number}
 */
var maxVowels = function(s, k) {
  const vowels = new Set(['a','e','i','o','u']);
  
  // Count window đầu tiên
  let count = 0;
  for (let i = 0; i < k; i++) {
    if (vowels.has(s[i])) count++;
  }
  
  let max = count;
  
  // Trượt window
  for (let i = k; i < s.length; i++) {
    if (vowels.has(s[i - k])) count--;
    if (vowels.has(s[i])) count++;
    max = Math.max(max, count);
  }
  
  return max;
};
```

---

## 🧪 Test Cases

```javascript
// Test 1
console.log(maxVowels("abciiidef", 3)); // 3 ✓

// Test 2
console.log(maxVowels("aeiou", 2)); // 2 ✓

// Test 3
console.log(maxVowels("bcdfg", 2)); // 0 ✓

// Test 4
console.log(maxVowels("a", 1)); // 1 ✓

// Test 5
console.log(maxVowels("leetcode", 3)); // 2 ✓
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Sliding Window

💡 KEY INSIGHT:
   "Count đầu, rồi trượt"
   "count = count - out + in"

⚠️ PITFALLS:
   - Không trượt đúng cách
   - O(k) mỗi window thay vì O(1)

🔄 VARIATIONS:
   - Count consonants
   - K distinct characters

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Bài tiếp theo

[Bài 8: Longest Subarray of 1's After Deleting One Element](./008-longest-subarray-ones.md)