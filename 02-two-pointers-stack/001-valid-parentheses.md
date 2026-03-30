# #20 - Valid Parentheses

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | String, Stack |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/valid-parentheses/

---

## 📖 Đề bài

### Mô tả
Cho một string `s` chứa các ký tự `'('`, `')'`, `'{'`, `'}'`, `'['` và `']'`, kiểm tra xem string có **hợp lệ** hay không.

String hợp lệ khi:
1. Mỗi ngoặc mở phải có ngoặc đóng tương ứng
2. Ngoặc đóng phải đúng thứ tự
3. Mỗi ngoặc đóng phải có ngoặc mở tương ứng

### Ví dụ

**Example 1:**
```
Input:  s = "()"
Output: true
```

**Example 2:**
```
Input:  s = "()[]{}"
Output: true
```

**Example 3:**
```
Input:  s = "(]"
Output: false
```

**Example 4:**
```
Input:  s = "([)]"
Output: false
```

**Example 5:**
```
Input:  s = "{[]}"
Output: true
```

### Constraints
```
1 <= s.length <= 10^4
s chỉ chứa: ()[]{}
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
┌─────────────────────────────────────────────────────┐
│ Hỏi:  Các ngoặc có khớp nhau đúng thứ tự không?  │
│ Trả về: Boolean (true/false)                       │
│ Input:  String chứa ()[]{}                         │
│                                                     │
│ KHÔNG cần: Vị trí lỗi, số ngoặc, v.v.             │
└─────────────────────────────────────────────────────┘
```

---

### 🤔 2. Tư duy từng bước (Step-by-step)

#### Bước 1: Nghĩ đến cách "ngây thơ" nhất

> **Hỏi:** "Làm sao biết ngoặc có hợp lệ không?"

**Cách 1: Liên tục xóa các cặp hợp lệ**

```
Input: "{[]}"

Bước 1: Tìm "()" hoặc "[]" hoặc "{}" → xóa
  "{[]}" → sau khi xóa "{}" → "[]"
  
Bước 2: Tiếp tục xóa
  "[]" → xóa → ""
  
Bước 3: String rỗng → HỢP LỆ ✓
```

**⚠️ Nhược điểm:**
```javascript
function isValid(s) {
  while (s.includes('()') || s.includes('[]') || s.includes('{}')) {
    s = s.replace('()', '');
    s = s.replace('[]', '');
    s = s.replace('{}', '');
  }
  return s.length === 0;
}
// → O(n²) vì mỗi replace là O(n)
// → Tạo string mới mỗi lần → tốn bộ nhớ
```

---

#### Bước 2: Nhận ra vấn đề + "Aha moment!"

> **Aha moment #1:**
> "Xóa cặp ngoặc là hoạt động của **STACK**!"
> 
> "Stack = LIFO (Last In, First Out)"
> "Ngoặc mở gần nhất phải đóng trước"
> → Giống như cởi đồ trong balo: cái vào sau cùng phải lấy ra trước

> **Aha moment #2:**
> "Chỉ cần kiểm tra: ngoặc đóng có khớp với ngoặc mở TRÊN CÙNG của stack không?"

```
Luồng tư duy:
┌─────────────────────────────────────────────────────┐
│ "([])"                                              │
│                                                     │
│ Gặp '(' → Push vào stack                           │
│ Stack: [ '(' ]                                      │
│                                                     │
│ Gặp '[' → Push vào stack                           │
│ Stack: [ '(', '[' ]                                 │
│                                                     │
│ Gặp ']' → Đóng ngoặc!                             │
│   → Pop '[' từ stack                              │
│   → '[' khớp với ']'? ✓                          │
│ Stack: [ '(' ]                                      │
│                                                     │
│ Gặp ')' → Đóng ngoặc!                             │
│   → Pop '(' từ stack                              │
│   → '(' khớp với ')'? ✓                          │
│ Stack: [ ]                                          │
│                                                     │
│ Stack rỗng → HỢP LỆ ✓                            │
└─────────────────────────────────────────────────────┘
```

---

#### Bước 3: Validate intuition bằng ví dụ chi tiết

**Ví dụ 1: "{[]}" - Hợp lệ**
```
Step 1: char = '{' (ngoặc MỞ)
        → Push vào stack
        Stack: [ '{' ]
        Result: ✓ Push

Step 2: char = '[' (ngoặc MỞ)
        → Push vào stack
        Stack: [ '{', '[' ]
        Result: ✓ Push

Step 3: char = ']' (ngoặc ĐÓNG)
        → Pop '[' từ stack
        → Kiểm tra: '[' có khớp với ']'? ✓
        Stack: [ '{' ]
        Result: ✓ Pop & Match

Step 4: char = '}' (ngoặc ĐÓNG)
        → Pop '{' từ stack
        → Kiểm tra: '{' có khớp với '}'? ✓
        Stack: [ ]
        Result: ✓ Pop & Match

Kết thúc: Stack rỗng
→ TRUE ✓
```

**Ví dụ 2: "([)]" - Không hợp lệ**
```
Step 1: char = '(' (ngoặc MỞ)
        → Push vào stack
        Stack: [ '(' ]
        Result: ✓ Push

Step 2: char = '[' (ngoặc MỞ)
        → Push vào stack
        Stack: [ '(', '[' ]
        Result: ✓ Push

Step 3: char = ')' (ngoặc ĐÓNG)
        → Pop '[' từ stack (vì '[' trên cùng)
        → Kiểm tra: '[' có khớp với ')'? ✗ KHÔNG KHỚP!
        → FALSE ngay!

→ FALSE ✓
```

**Ví dụ 3: "((" - Không hợp lệ**
```
Step 1: char = '(' → Push → Stack: [ '(' ]
Step 2: char = '(' → Push → Stack: [ '(', '(' ]

Kết thúc: Stack không rỗng [ '(', '(' ]
→ Còn ngoặc mở chưa đóng
→ FALSE ✓
```

---

#### Bước 4: Xác định edge cases

```
Edge Case 1: s = ""
  Stack: [ ]
  → Stack rỗng → TRUE ✓
  (String rỗng được coi là hợp lệ)

Edge Case 2: s = ")"
  Stack: [ ]
  char = ')' → Ngoặc đóng
  → Stack.pop() = undefined
  → return FALSE ngay! ✓

Edge Case 3: s = "([)]"
  → ( [ ) ]
  → '[' không khớp với ')' → FALSE ✓

Edge Case 4: s = "((()))"
  → Tất cả đều khớp → TRUE ✓

Edge Case 5: s = ")((("
  → Gặp ')' khi stack rỗng → FALSE ✓
```

---

### 🔑 3. Key Insight (Điều mấu chốt)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Stack = LIFO = Ngoặc vào sau cùng, đóng trước"│
│   → Push ngoặc MỞ                                   │
│   → Pop khi gặp ngoặc ĐÓNG                        │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Ngoặc đóng phải khớp với ngoặc MỞ gần nhất"  │
│   → Stack top phải khớp với ngoặc đóng hiện tại  │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Stack rỗng ở cuối = Hợp lệ"                    │
│   "Stack không rỗng ở cuối = Có ngoặc chưa đóng" │
│                                                     │
│   KEY INSIGHT #4:                                   │
│   "Gặp ngoặc đóng mà stack rỗng = Không hợp lệ"  │
│   → Đóng ngoặc không có mở → FALSE ngay!          │
│                                                     │
│   KEY INSIGHT #5:                                   │
│   "Map đóng→mở = {( → (, { → {, [ → [}"         │
│   → Giúp kiểm tra khớp nhanh                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls (Lỗi hay mắc)

```javascript
// ❌ Pitfall 1: Quên check stack rỗng khi pop
function isValidWrong(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  
  for (const char of s) {
    if (map[char]) {
      const top = stack.pop();  // ❌ pop() có thể trả về undefined!
      if (top !== map[char]) {
        return false;
      }
    } else {
      stack.push(char);
    }
  }
  return true;  // ❌ Không check stack rỗng
}

// Ví dụ sai: s = ")"
// stack = [], map[')'] = '('
// stack.pop() = undefined
// undefined !== '(' → return false ✓ (may pass)

// Ví dụ sai: s = "((("
// stack = ['(', '(', '(']
// return true → ❌ SAI! Còn ngoặc mở chưa đóng!

// ✅ Đúng: Check stack rỗng ở cuối
function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  
  for (const char of s) {
    if (map[char]) {
      if (stack.length === 0) return false;  // Stack rỗng!
      const top = stack.pop();
      if (top !== map[char]) return false;
    } else {
      stack.push(char);
    }
  }
  
  return stack.length === 0;  // ✅ Phải rỗng!
}

// ❌ Pitfall 2: Map sai thứ tự
const map = { '(': ')', '{': '}', '[': ']' };  // ❌ Sai!
const map = { ')': '(', '}': '{', ']': '[' };  // ✅ Đúng!
// Map: ngoặc đóng → ngoặc mở tương ứng

// ❌ Pitfall 3: Không handle ngoặc đóng khi stack rỗng
if (map[char]) {
  // ❌ Không check stack.length trước
  const top = stack.pop(); // undefined!
}

// ✅ Đúng:
if (map[char]) {
  if (stack.length === 0) return false;
  // ...
}
```

---

### 🔄 5. Các hướng tiếp cận (So sánh)

#### 🔹 Cách 1: Brute Force - Remove Pairs (O(n²))

```javascript
function isValid(s) {
  while (s.includes('()') || s.includes('[]') || s.includes('{}')) {
    s = s.replace('()', '').replace('[]', '').replace('{}', '');
  }
  return s.length === 0;
}
```

**📊 Phân tích:**
```
Time:  O(n²) — mỗi replace tạo string mới O(n)
Space: O(n) — tạo string trung gian
```

**🔍 Tại sao chậm?**
```
n=100: ~10,000 operations
n=10^4: ~100,000,000 operations → CHẬM!
```

---

#### 🔹 Cách 2: Stack (O(n)) ⭐ **TỐI ƯU**

```javascript
function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  
  for (const char of s) {
    if (map[char]) {
      // Ngoặc đóng → pop và kiểm tra
      if (stack.length === 0) return false;
      if (stack.pop() !== map[char]) return false;
    } else {
      // Ngoặc mở → push
      stack.push(char);
    }
  }
  
  return stack.length === 0;
}
```

**📊 Phân tích:**
```
Time:  O(n) — duyệt string 1 lần
Space: O(n) — stack lưu tối đa n/2 ngoặc
```

**✅ Ưu điểm:**
- Linear time
- Clear logic
- Interview favorite

---

### 🚀 6. Visual Walkthrough

```
Input: "{[]}"

┌────────────────────────────────────────────────────────────────┐
│ Loop i=0: char='{'                                             │
│   map['{'] = undefined → else branch                           │
│   → stack.push('{')                                            │
│   Stack: ['{']                                                 │
│                                                                │
│ Loop i=1: char='['                                             │
│   map['['] = undefined → else branch                           │
│   → stack.push('[')                                            │
│   Stack: ['{', '[']                                            │
│                                                                │
│ Loop i=2: char=']'                                             │
│   map[']'] = '[' → if branch                                   │
│   → stack.length !== 0 ✓                                      │
│   → top = stack.pop() = '['                                    │
│   → '[' === '[' ✓                                             │
│   Stack: ['{']                                                 │
│                                                                │
│ Loop i=3: char='}'                                             │
│   map['}'] = '{' → if branch                                   │
│   → stack.length !== 0 ✓                                      │
│   → top = stack.pop() = '{'                                    │
│   → '{' === '{' ✓                                             │
│   Stack: []                                                    │
└────────────────────────────────────────────────────────────────┘

Loop kết thúc
→ stack.length === 0 → return TRUE ✓
```

---

### 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Minimum Add to Make Parentheses Valid (LeetCode 921)
// Tìm số lần thêm ngoặc tối thiểu để string hợp lệ
function minAddToMakeValid(s) {
  let balance = 0;  // +1 cho '(', -1 cho ')'
  let add = 0;
  
  for (const char of s) {
    if (char === '(') balance++;
    else balance--;
    
    if (balance === -1) {
      add++;
      balance = 0;
    }
  }
  
  return add + balance;
}

// Variation 2: Longest Valid Parentheses (LeetCode 32)
// Tìm độ dài dấu ngoặc hợp lệ dài nhất
// → Dùng Stack hoặc DP

// Variation 3: Balanced Parentheses với nhiều loại
// Input: "<({[]})>" với <> thêm
// → Mở rộng Map

// Variation 4: Kiểm tra có hợp lệ trong Real-time
// → Editor/IDE: báo lỗi syntax khi gõ
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Valid Parentheses - Stack Approach
 * 
 * Ý tưởng:
 * 1. Push ngoặc MỞ vào stack
 * 2. Khi gặp ngoặc ĐÓNG → pop và kiểm tra khớp
 * 3. Cuối cùng: stack phải rỗng
 * 
 * Time: O(n) | Space: O(n)
 * 
 * @param {string} s
 * @return {boolean}
 */
var isValid = function(s) {
  const stack = [];
  const map = {
    ')': '(',
    '}': '{',
    ']': '['
  };
  
  for (const char of s) {
    if (map[char]) {
      // Ngoặc đóng → kiểm tra
      if (stack.length === 0) return false;
      if (stack.pop() !== map[char]) return false;
    } else {
      // Ngoặc mở → push
      stack.push(char);
    }
  }
  
  return stack.length === 0;
};
```

---

## 🧪 Test Cases

```javascript
// Test 1: Basic valid
console.log(isValid("()"));       // true ✓

// Test 2: Multiple types
console.log(isValid("()[]{}"));   // true ✓

// Test 3: Wrong type
console.log(isValid("(]"));        // false ✓

// Test 4: Wrong order
console.log(isValid("([)]"));      // false ✓

// Test 5: Nested
console.log(isValid("{[]}"));      // true ✓

// Test 6: Empty string
console.log(isValid(""));          // true ✓

// Test 7: Only opening
console.log(isValid("(((("));     // false ✓

// Test 8: Only closing
console.log(isValid("))))"));     // false ✓

// Test 9: Complex valid
console.log(isValid("([]{[()]})")); // true ✓

// Test 10: Complex invalid
console.log(isValid("([{}]))"));    // false ✓
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Stack - LIFO

💡 KEY INSIGHT:
   "Push ngoặc MỞ, Pop khi gặp ngoặc ĐÓNG"
   "Stack rỗng cuối cùng = hợp lệ"

⚠️ PITFALLS:
   - Check stack rỗng TRƯỚC khi pop
   - Stack phải rỗng ở cuối (không phải return true)
   - Map đóng→mở, không phải mở→đóng

🔄 VARIATIONS:
   - Min Add to Make Valid
   - Longest Valid Parentheses
   - Multiple bracket types

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Bài tiếp theo

[Bài 2: Longest Substring Without Repeating Characters](./002-longest-substring.md)
