# #875 - Koko Eating Bananas

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Array, Binary Search |
| **Trạng thích** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/koko-eating-bananas/

---

## 📖 Đề bài

### Mô tả
Koko ăn chuối với tốc độ `k` bananas/giờ. Cho mảng `piles` và số giờ `h`, tìm `k` nhỏ nhất để Koko ăn hết tất cả chuối trong `h` giờ.

### Ví dụ

**Example 1:**
```
Input:  piles = [3, 6, 7, 11], h = 8
Output: 4
Giải thích: 4 bananas/giờ → ăn hết trong 8 giờ
```

**Example 2:**
```
Input:  piles = [30, 11, 23, 4, 20], h = 5
Output: 30
Giải thích: 30 bananas/giờ → ăn hết trong 5 giờ
```

### Constraints
```
1 <= piles.length <= 10^8
1 <= piles[i] <= 10^9
h >= piles.length (ít nhất 1 giờ mỗi pile)
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
┌─────────────────────────────────────────────────────┐
│ Hỏi:  Tốc độ ăn (k) NHỎ NHẤT để ăn hết?   │
│ Input: piles[] (chuối mỗi đống), h (giờ)          │
│ Trả về: k (bananas/giờ)                              │
│                                                     │
│ Ràng buộc: h >= piles.length (mỗi pile tối thiểu 1h)│
└─────────────────────────────────────────────────────┘
```

---

### 🤔 2. Tư duy từng bước (Step-by-step)

#### Bước 1: Hiểu cách tính giờ

> **Hỏi:** "Với tốc độ k, Koko cần bao nhiêu giờ?"

**Cách tính giờ cho 1 đống:**
```
piles[i] = số chuối trong đống
k = tốc độ ăn (bananas/giờ)

Giờ cần = ceil(piles[i] / k)

Ví dụ:
- piles[i] = 10, k = 3
- Giờ = ceil(10/3) = 4 giờ
```

**Tổng giờ = sum của tất cả đống**

#### Bước 2: Nghĩ đến cách "ngây thơ" nhất

> **Cách 1: Thử tất cả k từ 1 đến max(piles)**

```
piles = [3, 6, 7, 11], h = 8

Thử k = 1: giờ = 3+6+7+11 = 27 > 8 ✗
Thử k = 2: giờ = ceil(3/2)+ceil(6/2)+ceil(7/2)+ceil(11/2) = 2+3+4+6 = 15 > 8 ✗
Thử k = 3: giờ = 1+2+3+4 = 10 > 8 ✗
Thử k = 4: giờ = 1+2+2+3 = 8 = 8 ✓ → FOUND!

→ O(max(piles)) = O(10^9) - QUÁ CHẬM!
```

**⚠️ Nhược điểm:**
```javascript
function minEatingSpeed(piles, h) {
  for (let k = 1; k <= Math.max(...piles); k++) {
    let hours = 0;
    for (const pile of piles) {
      hours += Math.ceil(pile / k);
    }
    if (hours <= h) return k;
  }
}
// → O(n × max(piles)) - không khả thi!
```

---

#### Bước 3: Nhận ra vấn đề + "Aha moment!"

> **Aha moment:**
> "Đây là **Binary Search** problem!"
> "k càng lớn → giờ càng ÍT"
> "→ Tìm k NHỎ NHẤT thỏa mãn giờ <= h"

```
Binary Search trên k:
┌─────────────────────────────────────────────────────┐
│ k nhỏ → giờ nhiều                                  │
│ k lớn → giờ ít                                      │
│                                                       │
│ Tìm k NHỎ NHẤT sao cho giờ <= h              │
│                                                       │
│ k: 1 ────────────────────────────────→ max       │
│ giờ: huge ──────────────────────→ min            │
└─────────────────────────────────────────────────────┘
```

---

#### Bước 4: Validate intuition bằng ví dụ

**Ví dụ: piles = [3, 6, 7, 11], h = 8**

```
┌─────────────────────────────────────────────────────────────────┐
│ Binary Search on k                                               │
│                                                                 │
│ Step 1: left=1, right=11                                        │
│   mid = (1+11)/2 = 6                                          │
│   giờ = ceil(3/6)+ceil(6/6)+ceil(7/6)+ceil(11/6)               │
│       = 1 + 1 + 2 + 2 = 6                                      │
│   giờ = 6 <= 8 ✓ → k có thể nhỏ hơn!                        │
│   right = mid = 6                                              │
│                                                                 │
│ Step 2: left=1, right=6, mid=3                                 │
│   giờ = ceil(3/3)+ceil(6/3)+ceil(7/3)+ceil(11/3)              │
│       = 1 + 2 + 3 + 4 = 10                                     │
│   giờ = 10 > 8 ✗ → cần k lớn hơn                            │
│   left = mid + 1 = 4                                           │
│                                                                 │
│ Step 3: left=4, right=6, mid=5                                 │
│   giờ = ceil(3/5)+ceil(6/5)+ceil(7/5)+ceil(11/5)               │
│       = 1 + 2 + 2 + 3 = 8                                     │
│   giờ = 8 <= 8 ✓ → k có thể nhỏ hơn!                        │
│   right = mid = 5                                               │
│                                                                 │
│ Step 4: left=4, right=5, mid=4                                 │
│   giờ = ceil(3/4)+ceil(6/4)+ceil(7/4)+ceil(11/4)              │
│       = 1 + 2 + 2 + 3 = 8                                     │
│   giờ = 8 <= 8 ✓ → k = 4! ✓                                  │
│   right = mid = 4                                               │
│                                                                 │
│ Step 5: left=4, right=4 → STOP                                 │
│ → return 4 ✓                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

#### Bước 5: Xác định edge cases

```
Edge Case 1: piles = [1], h = 1
  → k = 1 ✓

Edge Case 2: piles = [1000], h = 1000
  → k = 1 (ăn từ từ) ✓

Edge Case 3: piles = [1, 1, 1, 1], h = 4
  → k = 1 ✓

Edge Case 4: piles = [1, 1, 1, 1], h = 2
  → k = 2 ✓

Edge Case 5: h = piles.length (mỗi pile 1 giờ)
  → k = max(piles) ✓
```

---

### 🔑 3. Key Insight (Điều mấu chốt)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "k càng lớn → giờ càng ÍT"                  │
│   → MONOTONE function! → Binary Search!      │
│                                                     │
│   KEY INSIGHT #2:                                  │
│   "Tìm k NHỎ NHẤT thỏa mãn giờ <= h"      │
│   → Binary Search với left = 1, right = max    │
│                                                     │
│   KEY INSIGHT #3:                                  │
│   "Giờ cho 1 pile = ceil(pile / k)"          │
│   → Math.ceil(pile / k)                       │
│                                                     │
│   KEY INSIGHT #4:                                  │
│   "h >= piles.length"                          │
│   → k tối thiểu = 1, tối đa = max(piles)    │
│                                                     │
│   KEY INSIGHT #5:                                  │
│   "Nếu giờ <= h → k có thể nhỏ hơn"        │
│   → right = mid                                │
│   "Nếu giờ > h → k cần lớn hơn"            │
│   → left = mid + 1                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls (Lỗi hay mắc)

```javascript
// ❌ Pitfall 1: Nhầm hướng Binary Search
function wrongMinEatingSpeed(piles, h) {
  let left = 1, right = Math.max(...piles);
  
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const hours = calculateHours(piles, mid);
    
    if (hours <= h) {
      left = mid;  // ❌ Nên là mid, không phải mid + 1?
      // Thực ra đúng nếu muốn tìm min
    } else {
      right = mid + 1;  // ❌ Thường là mid + 1
    }
  }
  return left;
}

// ✅ Đúng: Tìm min nên khi hours <= h → right = mid
while (left < right) {
  const mid = Math.floor((left + right) / 2);
  if (hours <= h) {
    right = mid;   // ✅ Có thể nhỏ hơn
  } else {
    left = mid + 1; // ✅ Cần lớn hơn
  }
}
return left;

// ❌ Pitfall 2: Quên Math.ceil
const hours = pile / k;  // ❌ Sai! Cần ceil
const hours = Math.ceil(pile / k);  // ✅

// ❌ Pitfall 3: Overflow khi cộng hours
// piles có thể lên đến 10^9, cần dùng BigInt hoặc divide trước
function calculateHours(piles, k) {
  let hours = 0;
  for (const pile of piles) {
    hours += Math.ceil(pile / k);  // ✅ OK với Number
  }
  return hours;
}

// ❌ Pitfall 4: Dùng left < right thay vì left <= right
// Khi left == right → đã tìm được đáp án
```

---

### 🔄 5. Các hướng tiếp cận (So sánh)

#### 🔹 Cách 1: Brute Force (O(n × max))

```javascript
function minEatingSpeed(piles, h) {
  for (let k = 1; k <= Math.max(...piles); k++) {
    let hours = 0;
    for (const pile of piles) {
      hours += Math.ceil(pile / k);
    }
    if (hours <= h) return k;
  }
}
```

**📊 Phân tích:**
```
Time:  O(n × max(piles))
Space: O(1)
```

**⚠️ Không khả thi với max(piles) = 10^9**

---

#### 🔹 Cách 2: Binary Search (O(n log max)) ⭐ **TỐI ƯU**

```javascript
function minEatingSpeed(piles, h) {
  let left = 1;
  let right = Math.max(...piles);
  
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    let hours = 0;
    
    for (const pile of piles) {
      hours += Math.ceil(pile / mid);
    }
    
    if (hours <= h) {
      right = mid;  // Có thể nhỏ hơn
    } else {
      left = mid + 1;  // Cần lớn hơn
    }
  }
  
  return left;
}
```

**📊 Phân tích:**
```
Time:  O(n × log(max(piles)))
Space: O(1)
```

**✅ Ưu điểm:**
- Khả thi cho constraints lớn
- Optimal

---

### 🚀 6. Visual Walkthrough

```
piles = [3, 6, 7, 11], h = 8

┌─────────────────────────────────────────────────────────────────┐
│ Binary Search Tree on k                                           │
│                                                                 │
│        k=6                                                        │
│        / \                                                        │
│      k=3 k=8                                                      │
│      /\   \                                                       │
│    k=2 k=4 k=5                                                   │
│     \   /\                                                        │
│      ...                                                         │
│                                                                 │
│ Step 1: k=6 → giờ=6 <= 8 ✓ → right=6                         │
│ Step 2: k=3 → giờ=10 > 8 ✗ → left=4                         │
│ Step 3: k=5 → giờ=8 <= 8 ✓ → right=5                         │
│ Step 4: k=4 → giờ=8 <= 8 ✓ → right=4                         │
│ → left=4, right=4 → return 4 ✓                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Minimum Time to Finish Painting
// N công nhân, M công việc, mỗi công việc chia cho công nhân
// → Tương tự

// Variation 2: Capacity to Ship Packages Within D Days (LeetCode 1011)
// Tìm capacity tối thiểu để ship trong D days
// → Binary Search với sum/capacity

// Variation 3: Maximum Number of Tasks Assign
// Tìm số task tối đa có thể làm trong thời gian cho phép
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Koko Eating Bananas
 * 
 * Ý tưởng: Binary Search on k
 * - k càng lớn → giờ càng ít
 * - Tìm k NHỎ NHẤT thỏa mãn giờ <= h
 * 
 * Time: O(n log max(piles)) | Space: O(1)
 * 
 * @param {number[]} piles
 * @param {number} h
 * @return {number}
 */
var minEatingSpeed = function(piles, h) {
  let left = 1;
  let right = Math.max(...piles);
  
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    let hours = 0;
    
    for (const pile of piles) {
      hours += Math.ceil(pile / mid);
    }
    
    if (hours <= h) {
      right = mid;  // Có thể nhỏ hơn
    } else {
      left = mid + 1;  // Cần lớn hơn
    }
  }
  
  return left;
};
```

---

## 🧪 Test Cases

```javascript
// Test 1
console.log(minEatingSpeed([3, 6, 7, 11], 8)); // 4 ✓

// Test 2
console.log(minEatingSpeed([30, 11, 23, 4, 20], 5)); // 30 ✓

// Test 3: h = piles.length
console.log(minEatingSpeed([1, 1, 1, 1], 4)); // 1 ✓

// Test 4: h = 1
console.log(minEatingSpeed([1, 2, 3], 1)); // 6 ✓

// Test 5: Single pile
console.log(minEatingSpeed([10], 5)); // 2 ✓
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Binary Search on Answer

💡 KEY INSIGHT:
   "k lớn → giờ ít (monotone)"
   "Tìm k min thỏa mãn giờ <= h"

⚠️ PITFALLS:
   - Dùng Math.ceil cho giờ
   - right = mid khi giờ <= h
   - left = mid + 1 khi giờ > h

🔄 VARIATIONS:
   - Ship packages within D days
   - Minimum time to finish tasks

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Bài tiếp theo

[Bài 4: Find Minimum in Rotated Sorted Array](./004-find-min-rotated-array.md)
