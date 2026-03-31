# #204 - Count Primes

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Math, Hash Table, Design |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/count-primes/

---

## 📖 Đề bài

### Mô tả
Cho một số nguyên `n`. Đếm số **số nguyên tố** nhỏ hơn `n`.

### Ví dụ

**Example 1:**
```
Input:  n = 10
Output: 4
Giải thích: 2, 3, 5, 7 là số nguyên tố < 10
```

**Example 2:**
```
Input:  n = 0
Output: 0
```

**Example 3:**
```
Input:  n = 1
Output: 0
```

### Constraints
```
0 <= n <= 5 * 10^6
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Đếm số nguyên tố < n
n có thể lên đến 5,000,000 → cần thuật toán hiệu quả
→ Sieve of Eratosthenes: O(n log log n)
```

---

### 🤔 2. "Aha moment!" — Sieve of Eratosthenes

> **Aha moment:**
> **Sieve of Eratosthenes:**
>
> ```
> 1. Tạo boolean array isPrime[0...n-1] = true
> 2. isPrime[0] = isPrime[1] = false
> 3. Với i = 2; i * i < n; i++:
>      Nếu isPrime[i] == true:
>        Đánh dấu tất cả multiples của i: isPrime[i*i], isPrime[i*i+1], ... = false
> 4. Đếm số isPrime[i] == true
> ```
>
> **Tại sao bắt đầu từ i*i?**
> ```
> Các multiples nhỏ hơn i*i đã được đánh dấu bởi các số nhỏ hơn i
> Ví dụ: i = 5
>   → 5*2 = 10 → đánh dấu bởi 2
>   → 5*3 = 15 → đánh dấu bởi 3
>   → 5*4 = 20 → đánh dấu bởi 4
>   → 5*5 = 25 → BẮT ĐẦU từ đây (vì 5 chưa được dùng)
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Sieve of Eratosthenes"                          │
│   → Đánh dấu multiples → tìm primes nhanh         │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Bắt đầu từ i*i (không phải i*2)"              │
│   → Các multiples nhỏ hơn đã bị đánh dấu rồi      │
│   → Tối ưu: i*i < n thay vì i < n                 │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "isPrime array = boolean[]"                      │
│   → O(n) space cho Sieve                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Đánh dấu từ i*2 thay vì i*i
// Đúng: for (let j = i * i; j < n; j += i)
// ❌ Chậm: for (let j = 2 * i; j < n; j += i)

// ❌ Pitfall 2: Dùng i*i overflow khi i lớn
// Nếu dùng number lớn, i*i có thể overflow
// Với constraints n <= 5*10^6, i*i <= 25*10^12, an toàn trong JS

// ❌ Pitfall 3: Không đánh dấu 0 và 1 là false
// isPrime[0] = isPrime[1] = false

// ❌ Pitfall 4: Dùng Array(n) không fill
// Array(n) tạo sparse array → không works
// ✅ Array(n).fill(true)
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Sieve of Eratosthenes (O(n log log n)) ⭐

```javascript
function countPrimes(n) {
  if (n <= 2) return 0;

  const isPrime = new Array(n).fill(true);
  isPrime[0] = isPrime[1] = false;

  for (let i = 2; i * i < n; i++) {
    if (isPrime[i]) {
      // Đánh dấu multiples từ i*i
      for (let j = i * i; j < n; j += i) {
        isPrime[j] = false;
      }
    }
  }

  return isPrime.filter(Boolean).length;
}
```

**📊 Phân tích:**
```
Time:  O(n log log n)
Space: O(n)
```

---

### 🚀 6. Visual Walkthrough

```
n = 20

Initial: [F, F, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T]
  index:  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19

i=2: isPrime[2]=T → đánh dấu từ 4
  [F,F,T,T,F,T,F,T,T,F,T,T,F,T,T,F,T,T,F,T]

i=3: isPrime[3]=T → đánh dấu từ 9
  [F,F,T,T,F,T,F,T,T,F,T,T,F,T,T,F,T,T,F,T]

i=4: isPrime[4]=F → skip

i=5: 5*5=25 > 20 → stop

Count T: 2,3,5,7,11,13,17,19 = 8 primes ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Count Primes - Sieve of Eratosthenes
 * Time: O(n log log n) | Space: O(n)
 */
function countPrimes(n) {
  if (n <= 2) return 0;

  const isPrime = new Array(n).fill(true);
  isPrime[0] = isPrime[1] = false;

  for (let i = 2; i * i < n; i++) {
    if (isPrime[i]) {
      for (let j = i * i; j < n; j += i) {
        isPrime[j] = false;
      }
    }
  }

  return isPrime.filter(Boolean).length;
}
```

---

## 🧪 Test Cases

```javascript
console.log(countPrimes(10)); // 4 (2,3,5,7)

console.log(countPrimes(0)); // 0

console.log(countPrimes(1)); // 0

console.log(countPrimes(2)); // 0

console.log(countPrimes(100)); // 25
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Sieve of Eratosthenes

💡 KEY INSIGHT:
   "Đánh dấu multiples từ i*i"
   "i*i < n (không phải i < n)"
   "isPrime[0] = isPrime[1] = false"

⚠️ PITFALLS:
   - Bắt đầu từ i*i (không phải i*2)
   - Array(n).fill(true) (không phải Array(n))
   - isPrime[0] = isPrime[1] = false

🔄 VARIATIONS:
   - Ugly Number (#263) → primes nhân nhau
   - Ugly Number II (#264) → tìm nth ugly number

✅ Đã hiểu
✅ Tự code lại được
```
