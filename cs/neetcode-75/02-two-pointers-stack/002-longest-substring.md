# #3 - Longest Substring Without Repeating Characters

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | String, Sliding Window, Hash Table |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/longest-substring-without-repeating-characters/

---

## 📖 Đề bài

### Mô tả
Cho một string `s`, tìm **độ dài của substring dài nhất** không chứa ký tự lặp lại.

### Ví dụ

**Example 1:**
```
Input:  s = "abcabcbb"
Output: 3
Giải thích: Substring dài nhất không lặp là "abc" (độ dài 3)
```

**Example 2:**
```
Input:  s = "bbbbb"
Output: 1
Giải thích: Substring dài nhất không lặp là "b" (độ dài 1)
```

**Example 3:**
```
Input:  s = "pwwkew"
Output: 3
Giải thích: Substring dài nhất không lặp là "wke" (độ dài 3)
```

### Constraints
```
0 <= s.length <= 5 * 10^4
s có thể chứa ký tự ASCII
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
┌─────────────────────────────────────────────────────┐
│ Hỏi:  Substring dài nhất không có ký tự lặp?      │
│ Trả về: Độ dài (number), không phải substring!    │
│ Input:  String                                      │
│                                                     │
│ KHÔNG cần: Vị trí bắt đầu, kết thúc              │
│ CHÚ Ý:  "Substring" = liên tục, không phải subsequence│
└─────────────────────────────────────────────────────┘
```

---

### 🤔 2. Tư duy từng bước (Step-by-step)

#### Bước 1: Nghĩ đến cách "ngây thơ" nhất

> **Hỏi:** "Làm sao tìm substring dài nhất không lặp?"

**Cách 1: Kiểm tra tất cả substrings**

```
Input: "abcabcbb"

Bước 1: i=0, lấy "a" → "ab" → "abc" → "abca" (lặp!)
Bước 2: i=1, lấy "b" → "bc" → "bca" → "bcab" (lặp!)
...

→ Nested loop kiểm tra mỗi substring
→ O(n³) - QUÁ CHẬM!
```

**⚠️ Nhược điểm:**
```javascript
function lengthOfLongestSubstring(s) {
  let max = 0;
  
  for (let i = 0; i < s.length; i++) {
    for (let j = i; j < s.length; j++) {
      const substring = s.substring(i, j + 1);
      if (!hasRepeatingChar(substring)) {
        max = Math.max(max, substring.length);
      }
    }
  }
  
  return max;
}
// → O(n³) vì substring + kiểm tra mỗi substring
```

---

#### Bước 2: Tối ưu - Sliding Window cơ bản

> **Aha moment #1:**
> "Thay vì kiểm tra lại từ đầu, em dùng **WINDOW**!"
> "Window = 2 pointers bao quanh substring hiện tại"
> "Khi gặp ký tự lặp → thu hẹp từ bên trái"

```
Window concept:
┌─────────────────────────────────────┐
│ a b c a b c b b                    │
│ ↑           ↑                      │
│ left       right                   │
│ Window: "abca" có lặp!            │
│ → Thu hẹp left → "bca"            │
└─────────────────────────────────────┘
```

---

#### Bước 3: Validate intuition bằng ví dụ chi tiết

**Ví dụ: "abcabcbb"**

```
Step-by-step với Sliding Window + Set:

┌─────────────────────────────────────────────────────────────────┐
│ i=0: char='a'                                                   │
│   set={} chưa có 'a' → add('a')                                │
│   set={'a'}                                                     │
│   max = 1                                                       │
│                                                                 │
│ i=1: char='b'                                                   │
│   set={'a'} chưa có 'b' → add('b')                             │
│   set={'a','b'}                                                 │
│   max = 2                                                       │
│                                                                 │
│ i=2: char='c'                                                   │
│   set={'a','b'} chưa có 'c' → add('c')                         │
│   set={'a','b','c'}                                             │
│   max = 3                                                       │
│                                                                 │
│ i=3: char='a'                                                   │
│   set={'a','b','c'} đã có 'a'! → CÓ LẶP                       │
│   → Xóa từ trái: delete('a')                                   │
│   set={'b','c'}                                                 │
│   → Vẫn có 'a'? Không → add('a')                               │
│   set={'b','c','a'}                                             │
│   max = 3                                                       │
│                                                                 │
│ i=4: char='b'                                                   │
│   set={'b','c','a'} đã có 'b'! → CÓ LẶP                       │
│   → Xóa từ trái: delete('b')                                   │
│   set={'c','a'}                                                 │
│   → Vẫn có 'b'? Không → add('b')                               │
│   set={'c','a','b'}                                             │
│   max = 3                                                       │
└─────────────────────────────────────────────────────────────────┘

→ max = 3 ✓
```

**Ví dụ: "bbbbb"**

```
┌─────────────────────────────────────────────────────────────────┐
│ i=0: char='b'                                                   │
│   set={} → add('b') → set={'b'}, max=1                         │
│                                                                 │
│ i=1: char='b'                                                   │
│   set={'b'} đã có 'b'! → CÓ LẶP                               │
│   → delete('b') → set={}                                       │
│   → add('b') → set={'b'}                                       │
│   max = 1                                                       │
│                                                                 │
│ (Lặp lại cho tất cả 'b')                                       │
│ → max = 1 ✓                                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

#### Bước 4: Tối ưu hơn - Dùng Map

> **Aha moment #2:**
> "Thay vì xóa từng ký tự, em dùng **MAP** để nhớ vị trí!"
> "Khi gặp ký tự lặp, nhảy **LEFT** đến sau vị trí lặp gần nhất"

```
Input: "abcabcbb"

Dùng Map lưu: char → index gần nhất

i=0: 'a' → map={'a':0}
i=1: 'b' → map={'a':0,'b':1}
i=2: 'c' → map={'a':0,'b':1,'c':2} → max=3
i=3: 'a' → map đã có 'a' tại index 0
    → left = 0 + 1 = 1 (nhảy đến sau 'a' cũ)
    → map={'a':3,'b':1,'c':2}
    
i=4: 'b' → map đã có 'b' tại index 1
    → left = 1 + 1 = 2 (nhảy đến sau 'b' cũ)
    → map={'a':3,'b':4,'c':2}
```

---

#### Bước 5: Xác định edge cases

```
Edge Case 1: s = ""
  → Vòng for không chạy
  → max = 0 → return 0 ✓

Edge Case 2: s = "a"
  → set={'a'}, max=1 → return 1 ✓

Edge Case 3: s = "aa"
  → i=0: add 'a', max=1
  → i=1: 'a' đã có → delete left → add 'a', max=1
  → return 1 ✓

Edge Case 4: s = "ab"
  → i=0: add 'a', max=1
  → i=1: add 'b', max=2
  → return 2 ✓

Edge Case 5: s = "dvdf"
  → i=0: add 'd' → max=1
  → i=1: add 'v' → max=2
  → i=2: add 'd' đã có → left=1, max=2
  → i=3: add 'f' → max=3
  → return 3 ✓
```

---

### 🔑 3. Key Insight (Điều mấu chốt)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Sliding Window = 2 pointers bao quanh substring"│
│   → left và right di chuyển để tìm window tốt nhất│
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Khi gặp lặp: left = index + 1"                │
│   → Nhảy cóc, không cần xóa từng ký tự           │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Map lưu: char → index gần nhất"               │
│   → O(1) lookup để kiểm tra có lặp không         │
│                                                     │
│   KEY INSIGHT #4:                                   │
│   "max = Math.max(max, right - left + 1)"        │
│   → Độ dài window hiện tại                      │
│                                                     │
│   KEY INSIGHT #5:                                   │
│   "Set vs Map: Map nhanh hơn vì nhảy cóc"       │
│   → Set xóa từng ký tự → O(n) per lần lặp      │
│   → Map nhảy đến index → O(1)                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls (Lỗi hay mắc)

```javascript
// ❌ Pitfall 1: Quên update left khi gặp lặp
function wrongLengthOfLongestSubstring(s) {
  const set = new Set();
  let max = 0;
  
  for (const char of s) {
    if (set.has(char)) {
      // ❌ Quên xóa từ trái!
      set.add(char);
    } else {
      set.add(char);
    }
    max = Math.max(max, set.size);
  }
  return max;
}

// Ví dụ sai: "abcabcbb"
// set sẽ grow vô hạn nếu không xóa!

// ✅ Đúng: Xóa từ trái khi gặp lặp
function lengthOfLongestSubstring(s) {
  const set = new Set();
  let left = 0;
  let max = 0;
  
  for (let right = 0; right < s.length; right++) {
    while (set.has(s[right])) {
      set.delete(s[left]);
      left++;
    }
    set.add(s[right]);
    max = Math.max(max, right - left + 1);
  }
  return max;
}

// ❌ Pitfall 2: Dùng Set thay vì Map (chậm hơn)
function withSet(s) {
  const set = new Set();
  let left = 0;
  let max = 0;
  
  for (let right = 0; right < s.length; right++) {
    while (set.has(s[right])) {
      set.delete(s[left]);  // ← O(n) mỗi lần!
      left++;
    }
    set.add(s[right]);
    max = Math.max(max, right - left + 1);
  }
  return max;
}

// ✅ Đúng: Dùng Map cho O(1) lookup
function withMap(s) {
  const map = new Map();
  let left = 0;
  let max = 0;
  
  for (let right = 0; right < s.length; right++) {
    if (map.has(s[right]) && map.get(s[right]) >= left) {
      left = map.get(s[right]) + 1;  // ← O(1) nhảy cóc!
    }
    map.set(s[right], right);
    max = Math.max(max, right - left + 1);
  }
  return max;
}

// ❌ Pitfall 3: Nhầm lẫn left/right
// left = pointer bên trái (start của window)
// right = pointer bên phải (end của window)
// Window = s[left...right]

// ❌ Pitfall 4: Không check map.get(s[right]) >= left
// Khi char lặp nhưng ở NGOÀI window hiện tại
// → Map lưu index cũ, không phải index trong window
```

---

### 🔄 5. Các hướng tiếp cận (So sánh)

#### 🔹 Cách 1: Brute Force - All Substrings (O(n³))

```javascript
function lengthOfLongestSubstring(s) {
  let max = 0;
  
  for (let i = 0; i < s.length; i++) {
    const seen = new Set();
    for (let j = i; j < s.length; j++) {
      if (seen.has(s[j])) break;
      seen.add(s[j]);
      max = Math.max(max, j - i + 1);
    }
  }
  
  return max;
}
```

**📊 Phân tích:**
```
Time:  O(n³) — i, j, Set lookup
Space: O(min(m, n)) — m = kích thước alphabet
```

---

#### 🔹 Cách 2: Sliding Window với Set (O(2n))

```javascript
function lengthOfLongestSubstring(s) {
  const set = new Set();
  let left = 0;
  let max = 0;
  
  for (let right = 0; right < s.length; right++) {
    while (set.has(s[right])) {
      set.delete(s[left]);
      left++;
    }
    set.add(s[right]);
    max = Math.max(max, right - left + 1);
  }
  
  return max;
}
```

**📊 Phân tích:**
```
Time:  O(2n) = O(n) — mỗi ký tự được add/remove tối đa 1 lần
Space: O(min(m, n))
```

**⚠️ Nhược điểm:**
- Xóa từng ký tự khi gặp lặp → có thể nhiều lần xóa

---

#### 🔹 Cách 3: Sliding Window với Map (O(n)) ⭐ **TỐI ƯU**

```javascript
function lengthOfLongestSubstring(s) {
  const map = new Map();
  let left = 0;
  let max = 0;
  
  for (let right = 0; right < s.length; right++) {
    // Nếu char đã có và trong window hiện tại
    if (map.has(s[right]) && map.get(s[right]) >= left) {
      left = map.get(s[right]) + 1;  // Nhảy đến sau vị trí lặp
    }
    map.set(s[right], right);  // Cập nhật index mới
    max = Math.max(max, right - left + 1);
  }
  
  return max;
}
```

**📊 Phân tích:**
```
Time:  O(n) — mỗi ký tự được xử lý 1 lần
Space: O(min(m, n))
```

**✅ Ưu điểm:**
- Single pass thực sự
- Không cần while loop để xóa
- Nhanh nhất

---

### 🚀 6. Visual Walkthrough (Cách 3)

```
Input: "abcabcbb"

┌─────────────────────────────────────────────────────────────────┐
│ right=0: char='a'                                                │
│   map.has('a')? NO                                              │
│   map.set('a', 0)                                               │
│   max = max(0, 0-0+1) = 1                                      │
│   map: {a:0}                                                    │
│                                                                 │
│ right=1: char='b'                                                │
│   map.has('b')? NO                                              │
│   map.set('b', 1)                                               │
│   max = max(1, 1-0+1) = 2                                      │
│   map: {a:0, b:1}                                              │
│                                                                 │
│ right=2: char='c'                                                │
│   map.has('c')? NO                                              │
│   map.set('c', 2)                                               │
│   max = max(2, 2-0+1) = 3                                      │
│   map: {a:0, b:1, c:2}                                          │
│                                                                 │
│ right=3: char='a'                                                │
│   map.has('a')? YES, map.get('a')=0 >= left=0 ✓                 │
│   → left = 0 + 1 = 1                                           │
│   map.set('a', 3)                                               │
│   max = max(3, 3-1+1) = 3                                      │
│   map: {a:3, b:1, c:2}                                         │
│                                                                 │
│ right=4: char='b'                                                │
│   map.has('b')? YES, map.get('b')=1 >= left=1 ✓                 │
│   → left = 1 + 1 = 2                                           │
│   map.set('b', 4)                                               │
│   max = max(3, 4-2+1) = 3                                      │
│   map: {a:3, b:4, c:2}                                         │
│                                                                 │
│ right=5: char='c'                                                │
│   map.has('c')? YES, map.get('c')=2 >= left=2 ✓                 │
│   → left = 2 + 1 = 3                                           │
│   map.set('c', 5)                                               │
│   max = max(3, 5-3+1) = 3                                      │
│   map: {a:3, b:4, c:5}                                         │
│                                                                 │
│ right=6: char='b'                                                │
│   map.has('b')? YES, map.get('b')=4 >= left=3 ✓                 │
│   → left = 4 + 1 = 5                                           │
│   map.set('b', 6)                                               │
│   max = max(3, 6-5+1) = 3                                      │
│   map: {a:3, b:6, c:5}                                         │
│                                                                 │
│ right=7: char='b'                                                │
│   map.has('b')? YES, map.get('b')=6 >= left=5 ✓                 │
│   → left = 6 + 1 = 7                                           │
│   map.set('b', 7)                                               │
│   max = max(3, 7-7+1) = 3                                      │
└─────────────────────────────────────────────────────────────────┘

→ return 3 ✓
```

---

### 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Longest Substring with K Distinct Characters (LeetCode 340)
// Tìm substring dài nhất có tối đa K ký tự khác nhau
function longestSubstringKDistinct(s, k) {
  const map = new Map();
  let left = 0;
  let max = 0;
  
  for (let right = 0; right < s.length; right++) {
    map.set(s[right], (map.get(s[right]) || 0) + 1);
    
    while (map.size > k) {
      const leftChar = s[left];
      map.set(leftChar, map.get(leftChar) - 1);
      if (map.get(leftChar) === 0) map.delete(leftChar);
      left++;
    }
    
    max = Math.max(max, right - left + 1);
  }
  return max;
}

// Variation 2: Longest Substring with At Least K Repeating Characters (LeetCode 395)
// Tìm substring dài nhất có mỗi ký tự xuất hiện ít nhất K lần

// Variation 3: Minimum Window Substring (LeetCode 76)
// Tìm window nhỏ nhất chứa tất cả ký tự của T

// Variation 4: Find all substrings without repeating characters
// Trả về tất cả substrings, không phải chỉ độ dài
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Longest Substring Without Repeating Characters
 * 
 * Ý tưởng: Sliding Window với Map
 * - Map lưu index của ký tự gần nhất
 * - Khi gặp lặp trong window → left nhảy đến sau vị trí lặp
 * - max = độ dài window hiện tại
 * 
 * Time: O(n) | Space: O(min(m, n))
 * 
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {
  const map = new Map();
  let left = 0;
  let max = 0;
  
  for (let right = 0; right < s.length; right++) {
    if (map.has(s[right]) && map.get(s[right]) >= left) {
      left = map.get(s[right]) + 1;
    }
    map.set(s[right], right);
    max = Math.max(max, right - left + 1);
  }
  
  return max;
};
```

---

## 🧪 Test Cases

```javascript
// Test 1: Basic
console.log(lengthOfLongestSubstring("abcabcbb")); // 3 ✓

// Test 2: All same
console.log(lengthOfLongestSubstring("bbbbb"));    // 1 ✓

// Test 3: No repeat
console.log(lengthOfLongestSubstring("pwwkew"));    // 3 ✓

// Test 4: Empty
console.log(lengthOfLongestSubstring(""));          // 0 ✓

// Test 5: Single char
console.log(lengthOfLongestSubstring("a"));         // 1 ✓

// Test 6: No repeat at all
console.log(lengthOfLongestSubstring("abcde"));      // 5 ✓

// Test 7: Spaces
console.log(lengthOfLongestSubstring("au"));         // 2 ✓

// Test 8: Mixed
console.log(lengthOfLongestSubstring("dvdf"));       // 3 ✓

// Test 9: All different then repeat
console.log(lengthOfLongestSubstring("abba"));       // 2 ✓
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Sliding Window với Map

💡 KEY INSIGHT:
   "Map lưu index gần nhất"
   "Khi gặp lặp: left = index + 1"
   "max = Math.max(max, right - left + 1)"

⚠️ PITFALLS:
   - Check map.get(char) >= left trước khi update left
   - Map vs Set: Map nhảy cóc O(1), Set xóa từng ký tự O(n)

🔄 VARIATIONS:
   - K distinct characters
   - K repeating characters
   - Minimum window substring

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Bài tiếp theo

[Bài 3: Container With Most Water](./003-container-with-most-water.md)
