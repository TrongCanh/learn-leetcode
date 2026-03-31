# #844 - Backspace String Compare

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | String, Two Pointers, Stack |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/backspace-string-compare/

---

## 📖 Đề bài

### Mô tả
Cho 2 strings `s` và `t`, kiểm tra xem chúng có **bằng nhau** sau khi xử lý backspace hay không.

Ký tự `#` có nghĩa là **xóa ký tự trước đó**.

### Ví dụ

**Example 1:**
```
Input:  s = "ab#c", t = "ad#c"
Output: true
Giải thích:
- "ab#c" → "ac" (xóa 'b')
- "ad#c" → "ac" (xóa 'd')
- "ac" == "ac" → true
```

**Example 2:**
```
Input:  s = "ab##", t = "c#d#"
Output: true
Giải thích:
- "ab##" → "" (xóa 'b', rồi xóa 'a')
- "c#d#" → "" (xóa 'd', rồi xóa 'c')
- "" == "" → true
```

**Example 3:**
```
Input:  s = "a#c", t = "b"
Output: false
Giải thích:
- "a#c" → "c" (xóa 'a')
- "b" → "b"
- "c" != "b" → false
```

### Constraints
```
1 <= s.length, t.length <= 10^5
s và t chỉ chứa chữ cái thường và '#'
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
┌─────────────────────────────────────────────────────┐
│ Hỏi:  2 strings có bằng nhau sau khi xử lý #?   │
│ Trả về: Boolean (true/false)                       │
│                                                     │
│ Luật: '#' = xóa ký tự TRƯỚC đó                  │
│                                                     │
│ Ví dụ: "ab#c"                                     │
│   Đọc 'a' → lưu 'a'                              │
│   Đọc 'b' → lưu 'ab'                             │
│   Đọc '#' → xóa 'b' → lưu 'a'                   │
│   Đọc 'c' → lưu 'ac'                             │
│   Kết quả: "ac"                                   │
└─────────────────────────────────────────────────────┘
```

---

### 🤔 2. Tư duy từng bước (Step-by-step)

#### Bước 1: Nghĩ đến cách "ngây thơ" nhất

> **Hỏi:** "Làm sao so sánh 2 strings sau khi xử lý #?"

**Cách 1: Xử lý từng string trước, rồi so sánh**

```
Input: s = "ab#c", t = "ad#c"

Xử lý s:
  Đọc 'a' → stack: ['a']
  Đọc 'b' → stack: ['a', 'b']
  Đọc '#' → pop 'b' → stack: ['a']
  Đọc 'c' → stack: ['a', 'c']
  → Result: "ac"

Xử lý t:
  Đọc 'a' → stack: ['a']
  Đọc 'd' → stack: ['a', 'd']
  Đọc '#' → pop 'd' → stack: ['a']
  Đọc 'c' → stack: ['a', 'c']
  → Result: "ac"

So sánh: "ac" == "ac" → TRUE ✓
```

**⚠️ Nhược điểm:**
```javascript
function backspaceCompare(s, t) {
  const processString = (str) => {
    const stack = [];
    for (const char of str) {
      if (char === '#') {
        stack.pop();
      } else {
        stack.push(char);
      }
    }
    return stack.join('');
  };
  
  return processString(s) === processString(t);
}
// → O(n) cho mỗi string
// → Space: O(n) cho stack
// → Vẫn OK nhưng có cách tối ưu hơn!
```

---

#### Bước 2: Nhận ra vấn đề + "Aha moment!"

> **Aha moment #1:**
> "Thay vì xử lý cả string, em so sánh TỪ CUỐI!"
> "Vì '#' xóa ký tự TRƯỚC đó → em cần biết có bao nhiêu '#' phía trước"

> **Aha moment #2:**
> "Em đếm số '#' và skip đúng số ký tự!"
> "Sau đó so sánh từng ký tự hợp lệ"

```
Luồng tư duy:
┌─────────────────────────────────────────────────────┐
│ s = "ab#c", t = "ad#c"                              │
│                                                       │
│ Đọc từ CUỐI:                                        │
│                                                       │
│ s: 'c' (hợp lệ) → so sánh với t: 'c' ✓           │
│ s: '#' → skip 1 ký tự → 'b' → skip                 │
│ s: 'b' → skip (vì #)                               │
│ s: 'a' (hợp lệ) → so sánh với t: 'a' ✓           │
│                                                       │
│ t: 'c' (hợp lệ) ✓                                 │
│ t: '#' → skip 1 ký tự → 'd' → skip                │
│ t: 'd' → skip (vì #)                              │
│ t: 'a' (hợp lệ) ✓                                 │
│                                                       │
│ → Kết quả: TRUE ✓                                  │
└─────────────────────────────────────────────────────┘
```

---

#### Bước 3: Validate intuition bằng ví dụ chi tiết

**Ví dụ 1: s="ab#c", t="ad#c" - TRUE**

```
┌─────────────────────────────────────────────────────────────────┐
│ SO SÁNH TỪ CUỐI:                                                │
│                                                                 │
│ s = "ab#c" (length = 4)                                        │
│ t = "ad#c" (length = 4)                                        │
│                                                                 │
│ i = 3 (s), j = 3 (t)                                           │
│   s[3] = 'c' → hợp lệ → so sánh                               │
│   t[3] = 'c' → hợp lệ                                         │
│   'c' == 'c' ✓ → i--, j--                                     │
│                                                                 │
│ i = 2 (s), j = 2 (t)                                           │
│   s[2] = '#' → skipCountS = 1, i--                             │
│   i = 1                                                         │
│   s[1] = 'b' → skipCountS = 1 > 0 → skip, skipCountS = 0, i--│
│   i = 0                                                         │
│   s[0] = 'a' → hợp lệ → so sánh                               │
│                                                                 │
│   t[2] = '#' → skipCountT = 1, j--                             │
│   j = 1                                                         │
│   t[1] = 'd' → skipCountT = 1 > 0 → skip, skipCountT = 0, j--│
│   j = 0                                                         │
│   t[0] = 'a' → hợp lệ                                         │
│                                                                 │
│   'a' == 'a' ✓                                               │
│                                                                 │
│ i = -1 (kết thúc s), j = -1 (kết thúc t)                     │
│ → Cả 2 cùng kết thúc → TRUE ✓                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Ví dụ 2: s="ab#c", t="b" - FALSE**

```
┌─────────────────────────────────────────────────────────────────┐
│ i = 2 (s), j = 0 (t)                                           │
│   s[2] = 'c' → hợp lệ                                         │
│   t[0] = 'b' → hợp lệ                                         │
│   'c' != 'b' → return FALSE ✓                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Ví dụ 3: s="a##c", t="#a#c" - TRUE**

```
┌─────────────────────────────────────────────────────────────────┐
│ s = "a##c"                                                     │
│ t = "#a#c"                                                     │
│                                                                 │
│ i = 3 (s), j = 3 (t)                                           │
│   s[3] = 'c' → hợp lệ                                         │
│   t[3] = 'c' → hợp lệ                                         │
│   'c' == 'c' ✓                                                │
│                                                                 │
│ i = 2 (s), j = 2 (t)                                           │
│   s[2] = '#' → skipCountS = 1, i--                             │
│   i = 1                                                         │
│   s[1] = '#' → skipCountS = 2, i--                             │
│   i = 0                                                         │
│   s[0] = 'a' → skipCountS = 2 > 0 → skip, i--                  │
│   i = -1 → s kết thúc                                         │
│                                                                 │
│   t[2] = '#' → skipCountT = 1, j--                             │
│   j = 1                                                         │
│   t[1] = 'a' → skipCountT = 1 > 0 → skip, j--                  │
│   j = 0                                                         │
│   t[0] = '#' → skipCountT = 1, j--                             │
│   j = -1 → t kết thúc                                         │
│                                                                 │
│ i = -1 (s kết thúc), j = -1 (t kết thúc)                     │
│ → Cả 2 cùng kết thúc → TRUE ✓                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

#### Bước 4: Xác định edge cases

```
Edge Case 1: s="", t=""
  → Cả 2 đều rỗng → TRUE ✓

Edge Case 2: s="a#", t=""
  → s sau xử lý = "" (xóa 'a')
  → TRUE ✓

Edge Case 3: s="a#b#", t=""
  → s sau xử lý = "" (xóa 'b' và 'a')
  → TRUE ✓

Edge Case 4: s="a#b", t="ac"
  → s sau xử lý = "b"
  → t sau xử lý = "ac"
  → "b" != "ac" → FALSE ✓

Edge Case 5: s="###", t=""
  → s sau xử lý = ""
  → TRUE ✓

Edge Case 6: s="abc###d", t="ab"
  → s sau xử lý = "ab"
  → TRUE ✓
```

---

### 🔑 3. Key Insight (Điều mấu chốt)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "# xóa ký tự TRƯỚC đó"                         │
│   → Đọc từ CUỐI string để xử lý đúng thứ tự    │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Đếm # để SKIP đúng số ký tự"                 │
│   → skipCount = số # chưa xử lý                   │
│   → Khi gặp ký tự hợp lệ và skipCount > 0 → skip │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "So sánh TỪNG CẶP ký tự hợp lệ"              │
│   → Nếu khác nhau → FALSE                         │
│   → Nếu cùng kết thúc → TRUE                     │
│                                                     │
│   KEY INSIGHT #4:                                   │
│   "Two Pointers từ cuối"                         │
│   → i = s.length - 1, j = t.length - 1           │
│   → Di chuyển ngược về đầu                       │
│                                                     │
│   KEY INSIGHT #5:                                   │
│   "Nếu một string kết thúc trước → FALSE"        │
│   → Cả 2 phải cùng kết thúc!                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls (Lỗi hay mắc)

```javascript
// ❌ Pitfall 1: Xử lý string trước rồi so sánh (được nhưng không tối ưu)
function backspaceCompareProcessFirst(s, t) {
  const process = (str) => {
    const stack = [];
    for (const char of str) {
      if (char === '#') stack.pop();
      else stack.push(char);
    }
    return stack.join('');
  };
  return process(s) === process(t);
}
// → OK nhưng có thể làm trong 1 pass không cần stack

// ✅ Tối ưu: Two Pointers từ cuối
function backspaceCompare(s, t) {
  let i = s.length - 1;
  let j = t.length - 1;
  
  while (i >= 0 || j >= 0) {
    // Tìm ký tự hợp lệ tiếp theo trong s
    let skipS = 0;
    while (i >= 0) {
      if (s[i] === '#') {
        skipS++;
        i--;
      } else if (skipS > 0) {
        skipS--;
        i--;
      } else {
        break;
      }
    }
    
    // Tìm ký tự hợp lệ tiếp theo trong t
    let skipT = 0;
    while (j >= 0) {
      if (t[j] === '#') {
        skipT++;
        j--;
      } else if (skipT > 0) {
        skipT--;
        j--;
      } else {
        break;
      }
    }
    
    // So sánh
    if (i >= 0 && j >= 0) {
      if (s[i] !== t[j]) return false;
    } else if (i >= 0 || j >= 0) {
      return false;
    }
    
    i--;
    j--;
  }
  return true;
}

// ❌ Pitfall 2: Không kiểm tra cùng kết thúc
if (i >= 0 && j >= 0) {
  if (s[i] !== t[j]) return false;
} else if (i >= 0 || j >= 0) {
  return false;  // ❌ THIẾU check này!
}
// Nếu một string kết thúc, string kia còn ký tự → FALSE

// ❌ Pitfall 3: Nhầm thứ tự if-else
// Phải check i >= 0 && j >= 0 TRƯỚC
// Rồi mới check i >= 0 || j >= 0

// ❌ Pitfall 4: Quên decrement i, j sau khi so sánh
// Phải có: i--, j-- sau khi so sánh!
```

---

### 🔄 5. Các hướng tiếp cận (So sánh)

#### 🔹 Cách 1: Stack (O(n))

```javascript
function backspaceCompare(s, t) {
  const processString = (str) => {
    const stack = [];
    for (const char of str) {
      if (char === '#') {
        stack.pop();
      } else {
        stack.push(char);
      }
    }
    return stack.join('');
  };
  
  return processString(s) === processString(t);
}
```

**📊 Phân tích:**
```
Time:  O(n) — duyệt mỗi string 1 lần
Space: O(n) — stack lưu tối đa n ký tự
```

---

#### 🔹 Cách 2: Two Pointers (O(n), O(1)) ⭐ **TỐI ƯU**

```javascript
function backspaceCompare(s, t) {
  let i = s.length - 1;
  let j = t.length - 1;
  
  while (i >= 0 || j >= 0) {
    // Tìm ký tự hợp lệ trong s
    let skipS = 0;
    while (i >= 0) {
      if (s[i] === '#') {
        skipS++;
        i--;
      } else if (skipS > 0) {
        skipS--;
        i--;
      } else {
        break;
      }
    }
    
    // Tìm ký tự hợp lệ trong t
    let skipT = 0;
    while (j >= 0) {
      if (t[j] === '#') {
        skipT++;
        j--;
      } else if (skipT > 0) {
        skipT--;
        j--;
      } else {
        break;
      }
    }
    
    // So sánh
    if (i >= 0 && j >= 0) {
      if (s[i] !== t[j]) return false;
    } else if (i >= 0 || j >= 0) {
      return false;
    }
    
    i--;
    j--;
  }
  
  return true;
}
```

**📊 Phân tích:**
```
Time:  O(n) — mỗi ký tự được duyệt tối đa 1 lần
Space: O(1) — không dùng stack!
```

**✅ Ưu điểm:**
- Không dùng extra space
- Elegant solution

---

### 🚀 6. Visual Walkthrough

```
Input: s = "ab#c", t = "ad#c"

┌─────────────────────────────────────────────────────────────────┐
│ Bước 1: Tìm ký tự hợp lệ trong s                              │
│   i = 3: s[3] = 'c' (hợp lệ) → dừng                          │
│   → i = 3                                                       │
│                                                                 │
│ Bước 2: Tìm ký tự hợp lệ trong t                              │
│   j = 3: t[3] = 'c' (hợp lệ) → dừng                          │
│   → j = 3                                                       │
│                                                                 │
│ Bước 3: So sánh                                                 │
│   s[3] = 'c' == t[3] = 'c' ✓                                  │
│   i--, j-- → i=2, j=2                                          │
│                                                                 │
│ Bước 4: Tìm ký tự hợp lệ trong s                              │
│   i = 2: s[2] = '#' → skipS=1, i=1                              │
│   i = 1: s[1] = 'b', skipS=1 > 0 → skip, skipS=0, i=0         │
│   i = 0: s[0] = 'a' (hợp lệ) → dừng                          │
│   → i = 0                                                       │
│                                                                 │
│ Bước 5: Tìm ký tự hợp lệ trong t                              │
│   j = 2: t[2] = '#' → skipT=1, j=1                             │
│   j = 1: t[1] = 'd', skipT=1 > 0 → skip, skipT=0, j=0         │
│   j = 0: t[0] = 'a' (hợp lệ) → dừng                          │
│   → j = 0                                                       │
│                                                                 │
│ Bước 6: So sánh                                                 │
│   s[0] = 'a' == t[0] = 'a' ✓                                  │
│   i--, j-- → i=-1, j=-1                                        │
│                                                                 │
│ Bước 7: Kết thúc                                                │
│   i=-1, j=-1 → Cả 2 cùng kết thúc                            │
│   → return TRUE ✓                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

### 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Generalized GBD (Generalized Backspace)
// '#' xóa ký tự trước, 'ctrl+z' undo
// → Mở rộng cho nhiều loại undo

// Variation 2: Compare after typing
// Giả lập typing với backspace
// → Dùng 2 stacks

// Variation 3: Check if one is prefix of other after backspace
// → Modified version

// Variation 4: Multiple delete characters
// '#' xóa 1, '##' xóa 2, v.v.
// → Tăng skipCount tùy số #
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Backspace String Compare
 * 
 * Ý tưởng: Two Pointers từ cuối
 * - Đếm # để skip ký tự
 * - So sánh từng cặp ký tự hợp lệ
 * - Cả 2 cùng kết thúc = TRUE
 * 
 * Time: O(n) | Space: O(1)
 */
var backspaceCompare = function(s, t) {
  let i = s.length - 1;
  let j = t.length - 1;
  
  while (i >= 0 || j >= 0) {
    // Tìm ký tự hợp lệ trong s
    let skipS = 0;
    while (i >= 0) {
      if (s[i] === '#') {
        skipS++;
        i--;
      } else if (skipS > 0) {
        skipS--;
        i--;
      } else {
        break;
      }
    }
    
    // Tìm ký tự hợp lệ trong t
    let skipT = 0;
    while (j >= 0) {
      if (t[j] === '#') {
        skipT++;
        j--;
      } else if (skipT > 0) {
        skipT--;
        j--;
      } else {
        break;
      }
    }
    
    // So sánh
    if (i >= 0 && j >= 0) {
      if (s[i] !== t[j]) return false;
    } else if (i >= 0 || j >= 0) {
      return false;
    }
    
    i--;
    j--;
  }
  
  return true;
};
```

---

## 🧪 Test Cases

```javascript
// Test 1: Basic
console.log(backspaceCompare("ab#c", "ad#c")); // true ✓

// Test 2: Multiple #
console.log(backspaceCompare("ab##", "c#d#"));    // true ✓

// Test 3: Different result
console.log(backspaceCompare("a#c", "b"));       // false ✓

// Test 4: Empty
console.log(backspaceCompare("###", "####"));   // true ✓

// Test 5: All backspace
console.log(backspaceCompare("a#b#c#", "###")); // true ✓

// Test 6: No backspace
console.log(backspaceCompare("abc", "abc"));     // true ✓

// Test 7: One has backspace, other doesn't
console.log(backspaceCompare("a#c", "ac"));       // true ✓

// Test 8: Complex
console.log(backspaceCompare("bxj##tw", "bxo#j##tw")); // true ✓
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Two Pointers từ cuối

💡 KEY INSIGHT:
   "# xóa ký tự TRƯỚC đó"
   "Đếm # để skip đúng số ký tự"
   "So sánh từng cặp ký tự hợp lệ"

⚠️ PITFALLS:
   - Check cùng kết thúc (i>=0 || j>=0 → FALSE)
   - Nhớ i--, j-- sau khi so sánh
   - Two Pointers O(1) vs Stack O(n)

🔄 VARIATIONS:
   - Multiple delete characters
   - Generalized backspace

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Bài tiếp theo

[Bài 5: Valid Palindrome](./005-valid-palindrome.md)
