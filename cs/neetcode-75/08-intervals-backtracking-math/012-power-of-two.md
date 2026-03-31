# #231 - Power of Two

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | Math, Bit Manipulation |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/power-of-two/

---

## 📖 Đề bài

### Mô tả
Cho một số nguyên `n`. Kiểm tra xem `n` có phải là lũy thừa của 2 không.

### Ví dụ

**Example 1:**
```
Input:  n = 16
Output: true (2⁴ = 16)
```

**Example 2:**
```
Input:  n = 3
Output: false
```

### Constraints
```
-2^31 <= n <= 2^31 - 1
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: n có phải 2^k không?
Cách 1: Loop chia 2
Cách 2: Bit Manipulation — DÙNG MỘT THỦ THUẬT HAY!
```

---

### 🤔 2. "Aha moment!" — Bit Magic

#### Cách 1: Loop

```
n = 16:
16 % 2 = 0 → n = 8
8 % 2 = 0 → n = 4
4 % 2 = 0 → n = 2
2 % 2 = 0 → n = 1
→ return n === 1 ✓
```

#### Cách 2: Bit Magic (QUAN TRỌNG!)

> **Aha moment:**
> **Số là lũy thừa của 2 khi:**
> ```
> Binary của 2^k:  1000...0 (1 bit = 1, các bit khác = 0)
> Binary của 2^k-1: 0111...1 (tất cả bits = 1 phía sau)
>
> → n & (n-1) = 0 khi n là lũy thừa của 2!
>
> n = 8:  1000
> n-1 = 7: 0111
> n & (n-1) = 0000 = 0 ✓
>
> n = 4:  0100
> n-1 = 3: 0011
> n & (n-1) = 0000 = 0 ✓
>
> n = 3:  0011
> n-1 = 2: 0010
> n & (n-1) = 0010 ≠ 0 → Not power of 2 ✓
> ```
>
> **→ `n & (n - 1) === 0`**

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "n & (n-1) = 0 khi n là power of 2"            │
│   → Binary: 1000 & 0111 = 0000                    │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Điều kiện: n > 0"                             │
│   → n = 0 không phải power of 2                   │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "n & (n-1) = 0 xóa bit 1 thấp nhất"           │
│   → Nếu n có bit 1 duy nhất → xóa = 0            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Quên check n > 0
// n = 0 → 0 & (-1) = 0 → sai! 0 không phải power of 2
function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0; // ✅
}

// ❌ Pitfall 2: Dùng Math.log
// Math.log(2^30) / Math.log(2) có thể bị floating point error
// Math.round(Math.pow(2, Math.round(Math.log2(n)))) !== n
// → Không reliable

// ❌ Pitfall 3: Dùng n % 2 loop không check n > 0
function isPowerOfTwo(n) {
  while (n % 2 === 0) n /= 2;
  return n === 1; // ❌ n = 0 → while không chạy → return true!
}
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Bit Magic (O(1)) ⭐

```javascript
function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}
```

#### 🔹 Cách 2: Count bits

```javascript
function isPowerOfTwo(n) {
  if (n <= 0) return false;
  let count = 0;
  while (n > 0) {
    count += n & 1;
    n >>= 1;
  }
  return count === 1;
}
```

#### 🔹 Cách 3: Loop (O(log n))

```javascript
function isPowerOfTwo(n) {
  if (n <= 0) return false;
  while (n % 2 === 0) {
    n /= 2;
  }
  return n === 1;
}
```

---

### 🚀 6. Visual Walkthrough

```
n = 16:
  16 = 10000 (binary)
  15 = 01111
  AND = 00000 = 0 ✓

n = 8:
  8  = 01000
  7  = 00111
  AND = 00000 = 0 ✓

n = 3:
  3  = 00011
  2  = 00010
  AND = 00010 ≠ 0 → false ✓

n = 0:
  n > 0 = false → return false ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Power of Two - Bit Magic
 * Time: O(1) | Space: O(1)
 */
function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}
```

---

## 🧪 Test Cases

```javascript
console.log(isPowerOfTwo(16)); // true

console.log(isPowerOfTwo(3)); // false

console.log(isPowerOfTwo(1)); // true (2^0)

console.log(isPowerOfTwo(0)); // false

console.log(isPowerOfTwo(-2)); // false
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Bit Magic

💡 KEY INSIGHT:
   "n & (n-1) === 0" khi n là power of 2
   "PHẢI check n > 0"

⚠️ PITFALLS:
   - Quên n > 0

🔄 VARIATIONS:
   - Power of Three (#326) → dùng log hoặc base conversion
   - Power of Four (#342) → bit manipulation khác

✅ Đã hiểu
✅ Tự code lại được
```
