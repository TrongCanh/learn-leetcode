# #191 - Number of 1 Bits

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | Math, Bit Manipulation |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/number-of-1-bits/

---

## 📖 Đề bài

### Mô tả
Cho một số nguyên không dấu `n`. Trả về **số bit `1`** trong biểu diễn nhị phân (còn gọi là **Hamming Weight**).

### Ví dụ

**Example 1:**
```
Input:  n = 11 (binary: 00000000000000000000000000001011)
Output: 3
Giải thích: 11 = 1011 → có 3 bits 1
```

**Example 2:**
```
Input:  n = 128 (binary: 00000000000000000000000010000000)
Output: 1
```

### Constraints
```
0 <= n <= 2^32 - 1
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Đếm số bit 1 trong binary của n
Cách 1: Loop từng bit
Cách 2: n & (n-1) trick — XÓA bit 1 thấp nhất
```

---

### 🤔 2. "Aha moment!" — n & (n-1) trick

> **Aha moment:**
> **`n & (n-1) xóa bit 1 thấp nhất!**
>
> ```
> n = 12: 1100
> n-1 = 11: 1011
> n & (n-1) = 1000 → bit thấp nhất bị xóa!
>
> n = 12: 1100 → 1 bit đã xóa
> n = 8:  1000 → 1 bit đã xóa
> n = 0:  0000 → 0 bit → dừng
>
> → Số lần xóa = số bits 1!
> ```
>
> **→ Count = số lần `n & (n-1)` trước khi n === 0**

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "n & (n-1) xóa bit 1 thấp nhất"                 │
│   → 1100 & 1011 = 1000                             │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Count = số lần n !== 0 sau khi n &= n-1"      │
│   → Loop: while (n) { count++; n &= n-1; }        │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "O(số bits 1) = O(32) worst case"               │
│   → Nhanh hơn O(32) loop thông thường nếu ít bits  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Dùng >>> vs >> vs &
// Dùng >>> (unsigned right shift) cho số không dấu 32-bit
function hammingWeight(n) {
  let count = 0;
  while (n !== 0) {
    count += n & 1;
    n = n >>> 1; // ✅ unsigned right shift
    // n = n >> 1; // ❌ Có thể sign-extend cho số âm
  }
  return count;
}

// ❌ Pitfall 2: n & (n-1) không check n > 0
// n = 0 → 0 & (-1) = 0 → loop vô hạn!
// ✅ while (n !== 0) hoặc while (n > 0)
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: n & (n-1) (O(số bits 1)) ⭐

```javascript
function hammingWeight(n) {
  let count = 0;
  while (n !== 0) {
    n = n & (n - 1); // Xóa bit 1 thấp nhất
    count++;
  }
  return count;
}
```

#### 🔹 Cách 2: Bit by bit (O(32))

```javascript
function hammingWeight(n) {
  let count = 0;
  while (n !== 0) {
    count += n & 1;
    n = n >>> 1;
  }
  return count;
}
```

---

### 🚀 6. Visual Walkthrough

```
n = 11 = 00000000000000000000000000001011

Loop 1: n=11, n&(n-1)=10(00001010), count=1
Loop 2: n=10, n&(n-1)=8 (00001000), count=2
Loop 3: n=8,  n&(n-1)=0 (00000000), count=3
Loop 4: n=0 → stop

→ return 3 ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Number of 1 Bits - n & (n-1) trick
 * Time: O(số bits 1) | Space: O(1)
 */
function hammingWeight(n) {
  let count = 0;
  while (n !== 0) {
    n = n & (n - 1);
    count++;
  }
  return count;
}
```

---

## 🧪 Test Cases

```javascript
console.log(hammingWeight(11)); // 3

console.log(hammingWeight(128)); // 1

console.log(hammingWeight(0)); // 0

console.log(hammingWeight(4294967295)); // 32 (all 1s)
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Bit Counting - n & (n-1) trick

💡 KEY INSIGHT:
   "n & (n-1) xóa bit 1 thấp nhất"
   "Count = số lần thực hiện trước khi n = 0"

⚠️ PITFALLS:
   - while (n !== 0) tránh infinite loop

🔄 VARIATIONS:
   - Reverse Bits (#190) → đảo ngược bit
   - Bitwise AND of Numbers Range (#201) → range bitwise AND

✅ Đã hiểu
✅ Tự code lại được
```
