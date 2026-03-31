# #139 - Word Break

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | DP, Hash Table |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/word-break/

---

## 📖 Đề bài

### Mô tả
Cho một string `s` và một dictionary `wordDict`. Kiểm tra xem `s` có thể được tách thành **các words trong dictionary** hay không.

### Ví dụ

**Example 1:**
```
Input:  s = "leetcode", wordDict = ["leet","code"]
Output: true
Giải thích: "leet" + "code" = "leetcode"
```

**Example 2:**
```
Input:  s = "applepenapple", wordDict = ["apple","pen"]
Output: true
Giải thích: "apple" + "pen" + "apple"
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: s có thể tách thành words trong dictionary?
→ DP: dp[i] = s[0..i-1] có thể tách được?
```

---

### 🤔 2. Tư duy từng bước

> **Aha moment:**
> ```
> dp[i] = có thể tách s[0..i-1]
>
> dp[i] = true nếu:
>   ∃ j < i: dp[j] = true VÀ s[j..i-1] ∈ wordDict
>
> Base: dp[0] = true (empty string)
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "dp[i] = true nếu ∃ j: dp[j]=true && s[j..i) in dict"│
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "dp[0] = true (base case)"                      │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Dùng Set cho O(1) word lookup"                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: dp[i] = true nếu dp[i] = wordDict.includes(...)
// → Phải check dp[j] TRƯỚC!

// ❌ Pitfall 2: Dùng Array thay vì Set cho wordDict
// → O(n) lookup thay vì O(1)
// ✅ wordSet = new Set(wordDict)
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: DP Bottom-up (O(n²)) ⭐

```javascript
function wordBreak(s, wordDict) {
  const wordSet = new Set(wordDict);
  const dp = Array(s.length + 1).fill(false);
  dp[0] = true;

  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && wordSet.has(s.substring(j, i))) {
        dp[i] = true;
        break;
      }
    }
  }

  return dp[s.length];
}
```

**📊 Phân tích:**
```
Time:  O(n²) — mỗi i, duyệt j từ 0 đến i
Space: O(n)
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Word Break - DP Bottom-up
 * Time: O(n²) | Space: O(n)
 */
function wordBreak(s, wordDict) {
  const wordSet = new Set(wordDict);
  const dp = Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && wordSet.has(s.substring(j, i))) {
        dp[i] = true;
        break;
      }
    }
  }
  return dp[s.length];
}
```

---

## 🧪 Test Cases

```javascript
console.log(wordBreak("leetcode", ["leet", "code"])); // true

console.log(wordBreak("applepenapple", ["apple", "pen"])); // true

console.log(wordBreak("catsandog", ["cats", "dog", "sand", "and", "cat"])); // false
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: DP String Segmentation

💡 KEY INSIGHT:
   "dp[i] = true nếu dp[j]=true && s[j..i) in dict"
   "Set cho O(1) lookup"

✅ Đã hiểu
✅ Tự code lại được
```
