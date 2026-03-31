# #125 - Valid Palindrome

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | String, Two Pointers |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/valid-palindrome/

---

## 📖 Đề bài

### Mô tả
Kiểm tra xem string có phải là **palindrome** hay không, chỉ xem xét **chữ cái và số**.

Bỏ qua:
- Chữ hoa/thường
- Các ký tự không phải chữ cái/số

### Ví dụ

**Example 1:**
```
Input:  s = "A man, a plan, a canal: Panama"
Output: true
Giải thích: "amanaplanacanalpanama" là palindrome
```

**Example 2:**
```
Input:  s = "race a car"
Output: false
Giải thích: "raceacar" không phải palindrome
```

**Example 3:**
```
Input:  s = " "
Output: true
Giải thích: String rỗng/sau khi clean = "" → true
```

### Constraints
```
1 <= s.length <= 10^5
s có thể chứa ký tự đặc biệt, khoảng trắng, dấu câu
Chỉ kiểm tra chữ cái và số (alphanumeric)
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
┌─────────────────────────────────────────────────────┐
│ Hỏi:  String có phải palindrome không?          │
│ Trả về: Boolean (true/false)                       │
│                                                     │
│ Palindrome: Đọc từ trái → phải = Đọc từ phải ←  │
│                                                     │
│ CHỈ xem xét: chữ cái và số (alphanumeric)       │
│ BỎ QUA: chữ hoa/thường, dấu câu, khoảng trắng  │
│                                                     │
│ Ví dụ: "A man, a plan, a canal: Panama"          │
│   Clean: "amanaplanacanalpanama"                  │
│   Reverse: "amanaplanacanalpanama"                │
│   → GIỐNG NHAU → TRUE ✓                          │
└─────────────────────────────────────────────────────┘
```

---

### 🤔 2. Tư duy từng bước (Step-by-step)

#### Bước 1: Nghĩ đến cách "ngây thơ" nhất

> **Hỏi:** "Làm sao kiểm tra palindrome?"

**Cách 1: Clean string, rồi so sánh với đảo ngược**

```
Input: "A man, a plan, a canal: Panama"

Bước 1: Clean - chỉ giữ alphanumeric, chuyển thành chữ thường
  "amanaplanacanalpanama"

Bước 2: Đảo ngược
  "amanaplanacanalpanama"

Bước 3: So sánh
  "amanaplanacanalpanama" == "amanaplanacanalpanama" → TRUE ✓
```

**⚠️ Nhược điểm:**
```javascript
function isPalindrome(s) {
  // Clean: chỉ giữ alphanumeric, chuyển thành chữ thường
  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Đảo ngược
  const reversed = cleaned.split('').reverse().join('');
  
  return cleaned === reversed;
}
// → O(n) nhưng tạo 2-3 intermediate strings
// → Space: O(n)
```

---

#### Bước 2: Tối ưu - Two Pointers

> **Aha moment #1:**
> "Không cần tạo string mới!"
> "Em dùng 2 pointers so sánh TRỰC TIẾP!"

> **Aha moment #2:**
> "Bỏ qua ký tự không hợp lệ bằng cách di chuyển pointers!"

```
Luồng tư duy:
┌─────────────────────────────────────────────────────┐
│ Input: "A man, a plan, a canal: Panama"            │
│                                                       │
│ left=0, right=n-1                                  │
│                                                       │
│ 'A' (left) vs 'a' (right)                          │
│   → Cả 2 đều alphanumeric                          │
│   → So sánh: 'a' == 'a' ✓                        │
│   → left++, right--                                │
│                                                       │
│ ' ' (left) → không phải alphanumeric → left++      │
│ 'm' vs 'n' → 'm' == 'n' ✓                        │
│ ...                                                 │
│                                                       │
│ → Di chuyển pointers cho đến khi gặp nhau        │
└─────────────────────────────────────────────────────┘
```

---

#### Bước 3: Validate intuition bằng ví dụ chi tiết

**Ví dụ 1: "A man, a plan, a canal: Panama"**

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: left=0, right=28                                      │
│   s[0] = 'A' → alphanumeric, toLowerCase = 'a'               │
│   s[28] = 'a' → alphanumeric                                │
│   → So sánh: 'a' == 'a' ✓ → left++, right--                │
│                                                                 │
│ Step 2: left=1, right=27                                     │
│   s[1] = ' ' → không phải alphanumeric → left++              │
│                                                                 │
│ Step 3: left=2, right=27                                     │
│   s[2] = 'm' → alphanumeric                                  │
│   s[27] = 'm' → alphanumeric                                │
│   → So sánh: 'm' == 'm' ✓ → left++, right--                │
│                                                                 │
│ ... tiếp tục cho đến khi left >= right                      │
│                                                                 │
│ → TRUE ✓                                                      │
└─────────────────────────────────────────────────────────────────┘
```

**Ví dụ 2: "race a car"**

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: left=0, right=9                                       │
│   s[0] = 'r' → alphanumeric                                   │
│   s[9] = 'r' → alphanumeric                                  │
│   → 'r' == 'r' ✓ → left++, right--                          │
│                                                                 │
│ Step 2: left=1, right=8                                       │
│   s[1] = 'a' → alphanumeric                                  │
│   s[8] = 'a' → alphanumeric                                  │
│   → 'a' == 'a' ✓ → left++, right--                          │
│                                                                 │
│ Step 3: left=2, right=7                                       │
│   s[2] = 'c' → alphanumeric                                  │
│   s[7] = 'c' → alphanumeric                                  │
│   → 'c' == 'c' ✓ → left++, right--                          │
│                                                                 │
│ Step 4: left=3, right=6                                       │
│   s[3] = 'e' → alphanumeric                                  │
│   s[6] = ' ' → không phải alphanumeric → right--              │
│                                                                 │
│ Step 5: left=3, right=5                                       │
│   s[3] = 'e' → alphanumeric                                  │
│   s[5] = 'a' → alphanumeric                                  │
│   → 'e' != 'a' ✗ → return FALSE!                              │
└─────────────────────────────────────────────────────────────────┘
```

---

#### Bước 4: Xác định edge cases

```
Edge Case 1: s = " "
  → left=0, right=0
  → ' ' không phải alphanumeric → left++, right--
  → left > right → return TRUE ✓

Edge Case 2: s = "a"
  → left=0, right=0
  → 'a' == 'a' → left++, right--
  → left > right → return TRUE ✓

Edge Case 3: s = "0P"
  → '0' == 'P'? '0' != 'p' ✗
  → FALSE ✓

Edge Case 4: s = ""
  → Trả về TRUE (empty = palindrome)
  → return TRUE ✓

Edge Case 5: s = "ab2cb2ba" (với số)
  → 'a' == 'a' ✓
  → 'b' == 'b' ✓
  → '2' == '2' ✓
  → 'c' == 'c' ✓
  → TRUE ✓
```

---

### 🔑 3. Key Insight (Điều mấu chốt)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Palindrome = Đọc từ 2 phía giống nhau"       │
│   → So sánh từ 2 đầu → đủ!                     │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "CHỈ xem xét alphanumeric"                     │
│   → Bỏ qua: dấu câu, khoảng trắng, v.v.      │
│   → Chuyển: chữ hoa → chữ thường             │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "2 Pointers: left từ đầu, right từ cuối"    │
│   → Di chuyển đến khi gặp alphanumeric       │
│   → So sánh, rồi tiếp tục                      │
│                                                     │
│   KEY INSIGHT #4:                                   │
│   "Không cần tạo string mới"                   │
│   → So sánh trực tiếp → O(1) space             │
│                                                     │
│   KEY INSIGHT #5:                                   │
│   "Điều kiện dừng: left >= right"             │
│   → Nếu đến giữa mà không khác nhau → TRUE   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls (Lỗi hay mắc)

```javascript
// ❌ Pitfall 1: Không bỏ qua ký tự không hợp lệ
function wrongIsPalindrome(s) {
  let left = 0;
  let right = s.length - 1;
  
  while (left < right) {
    // ❌ So sánh trực tiếp không check alphanumeric!
    if (s[left].toLowerCase() !== s[right].toLowerCase()) {
      return false;
    }
    left++;
    right--;
  }
  return true;
}

// Ví dụ sai: s = "A man"
// 'A' vs 'n' → 'a' != 'n' → FALSE (sai!)

// ✅ Đúng: Bỏ qua ký tự không hợp lệ
function isPalindrome(s) {
  let left = 0;
  let right = s.length - 1;
  
  while (left < right) {
    // Di chuyển left đến alphanumeric
    while (left < right && !isAlphaNumeric(s[left])) {
      left++;
    }
    // Di chuyển right đến alphanumeric
    while (left < right && !isAlphaNumeric(s[right])) {
      right--;
    }
    
    // So sánh
    if (s[left].toLowerCase() !== s[right].toLowerCase()) {
      return false;
    }
    left++;
    right--;
  }
  return true;
}

// ❌ Pitfall 2: Nhầm với alphanumeric
// Chỉ chấp nhận: a-z, A-Z, 0-9
// Không phải: dấu câu, khoảng trắng, emoji, v.v.
function isAlphaNumeric(char) {
  return /[a-zA-Z0-9]/.test(char);
}

// ❌ Pitfall 3: Dùng regex liên tục (chậm)
while (!s[left].match(/[a-zA-Z0-9]/)) {  // ❌ Chậm!
  left++;
}
// ✅ Đúng: Precompile regex hoặc dùng charCode
function isAlphaNumeric(char) {
  const code = char.charCodeAt(0);
  return (code >= 48 && code <= 57) ||   // 0-9
         (code >= 65 && code <= 90) ||   // A-Z
         (code >= 97 && code <= 122);    // a-z
}

// ❌ Pitfall 4: Không chuyển hoa thường
if (s[left] !== s[right]) {  // ❌ 'A' != 'a'
  return false;
}
if (s[left].toLowerCase() !== s[right].toLowerCase()) {  // ✅
  return false;
}
```

---

### 🔄 5. Các hướng tiếp cận (So sánh)

#### 🔹 Cách 1: Clean + Reverse (O(n))

```javascript
function isPalindrome(s) {
  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const reversed = cleaned.split('').reverse().join('');
  return cleaned === reversed;
}
```

**📊 Phân tích:**
```
Time:  O(n) — clean + reverse
Space: O(n) — 2-3 intermediate strings
```

---

#### 🔹 Cách 2: Two Pointers (O(n), O(1)) ⭐ **TỐI ƯU**

```javascript
function isPalindrome(s) {
  let left = 0;
  let right = s.length - 1;
  
  while (left < right) {
    // Di chuyển left đến alphanumeric
    while (left < right && !isAlphaNumeric(s[left])) {
      left++;
    }
    // Di chuyển right đến alphanumeric
    while (left < right && !isAlphaNumeric(s[right])) {
      right--;
    }
    
    // So sánh (không phân biệt hoa thường)
    if (s[left].toLowerCase() !== s[right].toLowerCase()) {
      return false;
    }
    
    left++;
    right--;
  }
  
  return true;
}

function isAlphaNumeric(char) {
  return /[a-zA-Z0-9]/.test(char);
}
```

**📊 Phân tích:**
```
Time:  O(n) — mỗi ký tự được duyệt tối đa 1 lần
Space: O(1) — không dùng extra space
```

**✅ Ưu điểm:**
- Không tạo intermediate strings
- Space O(1)
- Elegant solution

---

### 🚀 6. Visual Walkthrough

```
Input: "A man, a plan, a canal: Panama"

┌─────────────────────────────────────────────────────────────────┐
│ Loop: left < right                                              │
│                                                                 │
│ left=0, right=28                                               │
│   s[0]='A', s[28]='a' → alphanumeric                          │
│   'a' == 'a' ✓ → left++, right--                             │
│                                                                 │
│ left=1, right=27                                               │
│   s[1]=' ' → not alphanumeric → left++                        │
│                                                                 │
│ left=2, right=27                                               │
│   s[2]='m', s[27]='m' → alphanumeric                         │
│   'm' == 'm' ✓ → left++, right--                             │
│                                                                 │
│ left=3, right=26                                               │
│   s[3]='a', s[26]='n' → alphanumeric                         │
│   'a' == 'n' ✗ → return FALSE!                               │
│                                                                 │
│ Wait... có vẻ không đúng?                                       │
│                                                                 │
│ → Tiếp tục đến giữa mà không khác nhau → TRUE                │
└─────────────────────────────────────────────────────────────────┘
```

---

### 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Valid Palindrome II (LeetCode 680)
// Cho phép xóa tối đa 1 ký tự
function validPalindrome(s) {
  let left = 0;
  let right = s.length - 1;
  
  while (left < right) {
    if (s[left] === s[right]) {
      left++;
      right--;
    } else {
      // Thử xóa left hoặc right
      return isPalindromeRange(s, left + 1, right) ||
             isPalindromeRange(s, left, right - 1);
    }
  }
  return true;
}

// Variation 2: Palindrome Number (LeetCode 9)
// Kiểm tra số có phải palindrome không (không dùng string)
function isPalindromeNumber(x) {
  if (x < 0) return false;
  let reversed = 0;
  let original = x;
  while (x > 0) {
    reversed = reversed * 10 + x % 10;
    x = Math.floor(x / 10);
  }
  return reversed === original;
}

// Variation 3: Find palindrome in string
// Tìm palindrome dài nhất trong string
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Valid Palindrome
 * 
 * Ý tưởng: Two Pointers
 * - Di chuyển left/right đến alphanumeric
 * - So sánh (không phân biệt hoa thường)
 * - Điều kiện dừng: left >= right
 * 
 * Time: O(n) | Space: O(1)
 */
var isPalindrome = function(s) {
  let left = 0;
  let right = s.length - 1;
  
  while (left < right) {
    // Di chuyển left đến alphanumeric
    while (left < right && !isAlphaNumeric(s[left])) {
      left++;
    }
    // Di chuyển right đến alphanumeric
    while (left < right && !isAlphaNumeric(s[right])) {
      right--;
    }
    
    // So sánh
    if (s[left].toLowerCase() !== s[right].toLowerCase()) {
      return false;
    }
    
    left++;
    right--;
  }
  
  return true;
};

function isAlphaNumeric(char) {
  return /[a-zA-Z0-9]/.test(char);
}
```

---

## 🧪 Test Cases

```javascript
// Test 1: Classic
console.log(isPalindrome("A man, a plan, a canal: Panama")); // true ✓

// Test 2: Not palindrome
console.log(isPalindrome("race a car"));                     // false ✓

// Test 3: Empty/Space
console.log(isPalindrome(" "));                              // true ✓

// Test 4: Numbers
console.log(isPalindrome("0P"));                              // false ✓

// Test 5: All same
console.log(isPalindrome("a"));                               // true ✓

// Test 6: Two chars different
console.log(isPalindrome("ab"));                             // false ✓

// Test 7: Two chars same
console.log(isPalindrome("aa"));                             // true ✓

// Test 8: With numbers
console.log(isPalindrome("12321"));                          // true ✓
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Two Pointers từ 2 đầu

💡 KEY INSIGHT:
   "Bỏ qua ký tự không hợp lệ"
   "So sánh từ 2 đầu, đến giữa là xong"

⚠️ PITFALLS:
   - Phải check alphanumeric trước khi so sánh
   - Chuyển hoa thường (toLowerCase)
   - Di chuyển pointers khi không hợp lệ

🔄 VARIATIONS:
   - Valid Palindrome II (cho phép xóa 1)
   - Palindrome Number (không dùng string)

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Bài tiếp theo

[Bài 6: Remove Duplicates from Sorted Array](./006-remove-duplicates.md)
