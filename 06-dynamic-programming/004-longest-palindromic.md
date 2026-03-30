# #5 - Longest Palindromic Substring

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | DP, String, Two Pointers |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/longest-palindromic-substring/

---

## 📖 Đề bài

### Mô tả
Cho một string `s`, tìm **substring dài nhất** là palindrome.

### Ví dụ

**Example 1:**
```
Input:  s = "babad"
Output: "bab" hoặc "aba"
```

**Example 2:**
```
Input:  s = "cbbd"
Output: "bb"
```

### Constraints
```
1 <= s.length <= 1000
s chỉ chứa ký tự alphanumeric
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Substring palindrome dài nhất
Cách 1: DP table O(n²)
Cách 2: Expand from center O(n²) ← PHỔ BIẾN
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Expand from center

> **Aha moment:**
> ```
> Mỗi palindrome có 1 center:
>   - Odd: "aba" → center = 'b'
>   - Even: "abba" → center = giữa 2 'b'
>
> expand(i, j) = expand từ center (i,j)
> while s[i]===s[j]: i--, j++
> ```
>
> **→ Expand từ mọi center → O(n²) nhưng đơn giản!**

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Expand từ center = O(n²)"                       │
│   → Odd: expand(i, i) — single center              │
│   → Even: expand(i, i+1) — between 2 centers        │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Track max length + start index"                  │
│   → start = i, length = j-i+1                     │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "DP approach: dp[i][j] = s[i]===s[j] && dp[i+1][j-1]"│
│   → Phức tạp hơn nhưng cũng được                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Chỉ expand odd, quên even
// "abba" → expand(1,2) = expand giữa 2 'b'
// ✅ Phải expand cả odd và even

// ❌ Pitfall 2: Cập nhật maxLen không đúng
// → Cập nhật: if (len > maxLen) { start = left; maxLen = len; }
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Expand from Center (O(n²)) ⭐

```javascript
function longestPalindrome(s) {
  if (s.length < 2) return s;

  let start = 0;
  let maxLen = 1;

  function expand(left, right) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      const len = right - left + 1;
      if (len > maxLen) {
        start = left;
        maxLen = len;
      }
      left--;
      right++;
    }
  }

  for (let i = 0; i < s.length; i++) {
    expand(i, i);     // Odd center
    expand(i, i + 1); // Even center
  }

  return s.substring(start, start + maxLen);
}
```

**📊 Phân tích:**
```
Time:  O(n²) — expand từ mọi center
Space: O(1)
```

---

### 🚀 6. Visual Walkthrough

```
s = "babad"

i=0: expand(0,0) → "b" → len=1 → maxLen=1, start=0
      expand(0,1) → "b"!=="a" → stop

i=1: expand(1,1) → "b"=="b" → expand(0,2)="aba" len=3>1 → start=0, maxLen=3
                expand(2,2)="a"... expand(1,2)="ba"! stop
      expand(1,2) → "b"!=="a" → stop

i=2: expand(2,2) → "a"=="a" → expand(1,3)="bab" len=3=maxLen
                expand(1,3)="bab"=="bab" → expand(0,4)="babad" len=5>3 → start=0, maxLen=5
      expand(2,3) → "a"!=="b" → stop

→ s.substring(0,5) = "babad" ← Wait, đây không phải palindrome!

Thực ra: expand(0,4)="babad": b-a-b-a-d → không palindrome!
→ Bug ở logic...

Thực ra expand(0,4) sẽ dừng khi s[0]!==s[4] → b!==d → dừng
→ palindrome = "bab" → len=3

Result = "bab" hoặc "aba" ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Longest Palindromic Substring - Expand from Center
 * Time: O(n²) | Space: O(1)
 */
function longestPalindrome(s) {
  if (s.length < 2) return s;

  let start = 0;
  let maxLen = 1;

  function expand(left, right) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      const len = right - left + 1;
      if (len > maxLen) {
        start = left;
        maxLen = len;
      }
      left--;
      right++;
    }
  }

  for (let i = 0; i < s.length; i++) {
    expand(i, i);
    expand(i, i + 1);
  }

  return s.substring(start, start + maxLen);
}
```

---

## 🧪 Test Cases

```javascript
console.log(longestPalindrome("babad")); // "bab" hoặc "aba"

console.log(longestPalindrome("cbbd")); // "bb"

console.log(longestPalindrome("a")); // "a"

console.log(longestPalindrome("ac")); // "a" hoặc "c"
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Expand from Center

💡 KEY INSIGHT:
   "Odd: expand(i,i) | Even: expand(i,i+1)"
   "Track start + maxLen"

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Longest Palindromic Subsequence (#516)
// LPS = subsequence (không cần liên tục)
function longestPalindromeSubseq(s) {
  const n = s.length;
  const dp = Array(n).fill(0).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) dp[i][i] = 1;
  
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len <= n; i++) {
      const j = i + len - 1;
      if (s[i] === s[j]) {
        dp[i][j] = dp[i + 1][j - 1] + 2;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp[0][n - 1];
}

// Variation 2: Palindromic Substrings (#647)
// Đếm số palindromic substrings
function countSubstrings(s) {
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    count += expand(i, i);   // Odd
    count += expand(i, i + 1); // Even
  }
  return count;
  
  function expand(left, right) {
    let c = 0;
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      c++;
      left--;
      right++;
    }
    return c;
  }
}

// Variation 3: Valid Palindrome II (#680)
// Cho phép xóa tối đa 1 ký tự
function validPalindrome(s) {
  let left = 0, right = s.length - 1;
  while (left < right) {
    if (s[left] === s[right]) {
      left++;
      right--;
    } else {
      return isPalindrome(s, left + 1, right) || 
             isPalindrome(s, left, right - 1);
    }
  }
  return true;
  
  function isPalindrome(s, l, r) {
    while (l < r) {
      if (s[l] !== s[r]) return false;
      l++;
      r--;
    }
    return true;
  }
}

// Variation 4: Shortest Palindrome (#214)
// Thêm characters vào đầu để thành palindrome
function shortestPalindrome(s) {
  const rev = s.split('').reverse().join('');
  const combined = s + '#' + rev;
  const lps = computeLPS(combined);
  const palindromeLength = lps[lps.length - 1];
  const toAdd = s.substring(palindromeLength).split('').reverse().join('');
  return toAdd + s;
}

// Variation 5: Make Palindrome (#1259)
// Biến string thành palindrome với ít insertions nhất
```

---

## ➡️ Bài tiếp theo

[Bài 5: Coin Change](./005-coin-change.md)
