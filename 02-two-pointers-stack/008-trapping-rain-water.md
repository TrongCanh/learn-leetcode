# #42 - Trapping Rain Water

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🔴 Hard |
| **Chủ đề** | Array, Two Pointers, Dynamic Programming, Stack |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/trapping-rain-water/

---

## 📖 Đề bài

### Mô tả
Cho một mảng `height` đại diện cho elevation map, tính **lượng nước** có thể giữ được giữa các thanh.

### Ví dụ

**Example 1:**
```
Input:  height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]
Output: 6
Giải thích: 
┌─────────────────────┐
│ █  █  █  █  █  █  █  █  █  █  █  █ │
│ █  █  ████  ████  ████  █ │
│ ████  ████  ████████  ███ │
└─────────────────────┘
Nước bị giữ: 6 units
```

**Example 2:**
```
Input:  height = [4, 2, 0, 3, 2, 5]
Output: 9
```

### Constraints
```
n = height.length
2 <= n <= 10^5
0 <= height[i] <= 10^4
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
┌─────────────────────────────────────────────────────┐
│ Hỏi:  Tính lượng nước giữa các thanh?     │
│ Trả về: Số đơn vị nước (number)                   │
│                                                     │
│ Công thức: water[i] = min(maxLeft, maxRight) - height[i]│
│                                                     │
│ Ví dụ:                                              │
│   height[i] = 1                                   │
│   maxLeft[i] = 3, maxRight[i] = 4                 │
│   → water[i] = min(3, 4) - 1 = 2 units         │
│                                                     │
│ ⚠️ Nếu min < height → water = 0                │
└─────────────────────────────────────────────────────┘
```

---

### 🤔 2. Tư duy từng bước (Step-by-step)

#### Bước 1: Nghĩ đến cách "ngây thơ" nhất

> **Hỏi:** "Làm sao tính được nước giữa các thanh?"

**Cách 1: Với mỗi thanh, tìm maxLeft và maxRight**

```
Input: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]

Với mỗi i, tìm:
  maxLeft[i]  = max của tất cả phần tử bên trái i
  maxRight[i] = max của tất cả phần tử bên phải i
  water[i]    = min(maxLeft, maxRight) - height[i]
```

**⚠️ Nhược điểm:**
```javascript
function trap(height) {
  let water = 0;
  
  for (let i = 0; i < height.length; i++) {
    // Tìm maxLeft - O(n)
    let maxLeft = 0;
    for (let j = 0; j < i; j++) {
      maxLeft = Math.max(maxLeft, height[j]);
    }
    
    // Tìm maxRight - O(n)
    let maxRight = 0;
    for (let j = i; j < height.length; j++) {
      maxRight = Math.max(maxRight, height[j]);
    }
    
    water += Math.max(0, Math.min(maxLeft, maxRight) - height[i]);
  }
  
  return water;
}
// → O(n²) - QUÁ CHẬM!
```

---

#### Bước 2: Tối ưu - Dynamic Programming

> **Aha moment #1:**
> "Tính maxLeft và maxRight TRƯỚC cho TẤT CẢ positions!"
> "→ Chỉ cần O(n) cho cả 3 passes!"

**Cách 2: DP - Precompute maxLeft và maxRight**

```
Input: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]

Pass 1: Tính maxLeft
  maxLeft[0] = 0
  maxLeft[1] = max(0, 1) = 1
  maxLeft[2] = max(1, 0) = 1
  maxLeft[3] = max(1, 2) = 2
  ...

Pass 2: Tính maxRight
  maxRight[n-1] = height[n-1]
  ...

Pass 3: Tính water
  water[i] = min(maxLeft[i], maxRight[i]) - height[i]
```

---

#### Bước 3: Tối ưu hơn - Two Pointers

> **Aha moment #2:**
> "Không cần tính maxLeft và maxRight cho TẤT CẢ!"
> "→ Dùng 2 pointers: left và right!"

> **Aha moment #3:**
> "water[i] bị giới hạn bởi MIN(maxLeft, maxRight)"
> "→ Di chuyển pointer có max NHỎ HƠN!"

```
Luồng tư duy:
┌─────────────────────────────────────────────────────┐
│ left=0, right=n-1                                │
│ maxLeft, maxRight theo dõi max                  │
│                                                       │
│ Nếu maxLeft < maxRight:                          │
│   → water[left] = maxLeft - height[left]       │
│   → left++                                         │
│                                                       │
│ Ngược lại:                                         │
│   → water[right] = maxRight - height[right]     │
│   → right--                                        │
└─────────────────────────────────────────────────────┘
```

---

#### Bước 4: Validate intuition bằng ví dụ chi tiết

**Ví dụ: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]**

```
┌─────────────────────────────────────────────────────────────────┐
│ Bước 1: Tính maxLeft                                        │
│   maxLeft[0] = 0                                             │
│   maxLeft[1] = max(0, 1) = 1                                 │
│   maxLeft[2] = max(1, 0) = 1                                 │
│   maxLeft[3] = max(1, 2) = 2                                 │
│   ...                                                         │
│                                                                 │
│ maxLeft = [0, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3]              │
│                                                                 │
│ Bước 2: Tính maxRight                                       │
│   maxRight[11] = 1                                           │
│   maxRight[10] = max(2, 1) = 2                                │
│   ...                                                         │
│                                                                 │
│ maxRight = [3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 1]             │
│                                                                 │
│ Bước 3: Tính water                                           │
│   water[i] = min(maxLeft[i], maxRight[i]) - height[i]        │
│                                                                 │
│ water = [0, 0, 1, 0, 1, 2, 1, 0, 0, 1, 0, 0]                │
│ sum = 6 ✓                                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

#### Bước 5: Xác định edge cases

```
Edge Case 1: height = [0, 0]
  → maxLeft = [0, 0], maxRight = [0, 0]
  → water = [0, 0] → sum = 0 ✓

Edge Case 2: height = [3, 0, 0]
  → maxLeft = [3, 3, 3], maxRight = [3, 0, 0]
  → water = [0, 3, 3] → sum = 6 ✓

Edge Case 3: height = [0, 1, 2, 0]
  → water = [0, 0, 0, 0] → sum = 0 ✓ (tăng liên tục)

Edge Case 4: height = [4, 2, 0, 3, 2, 5]
  → Xem ví dụ 2 → sum = 9 ✓
```

---

### 🔑 3. Key Insight (Điều mấu chốt)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "water[i] = min(maxLeft, maxRight) - height[i]" │
│   → Nước bị giới hạn bởi tường THẤP HƠN      │
│                                                     │
│   KEY INSIGHT #2:                                  │
│   "maxLeft[i] = max(maxLeft[i-1], height[i-1])"  │
│   "maxRight[i] = max(maxRight[i+1], height[i+1])"│
│   → Tính prefix/suffix max!                      │
│                                                     │
│   KEY INSIGHT #3:                                  │
│   "DP: Precompute maxLeft, maxRight trước"     │
│   → O(n) thay vì O(n²)                        │
│                                                     │
│   KEY INSIGHT #4:                                  │
│   "Two Pointers: di chuyển pointer có max <"  │
│   → Vì water bị giới hạn bởi max NHỎ HƠN    │
│                                                     │
│   KEY INSIGHT #5:                                  │
│   "Nếu maxLeft < maxRight → tính water[left]"  │
│   → maxLeft là bottleneck!                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls (Lỗi hay mắc)

```javascript
// ❌ Pitfall 1: Dùng max thay vì min cho water
const water = Math.max(maxLeft, maxRight) - height[i];  // ❌ Sai!
// → Phải là:
const water = Math.min(maxLeft, maxRight) - height[i];  // ✅

// ❌ Pitfall 2: Không check negative water
// Nếu min(maxLeft, maxRight) < height[i] → water < 0
// → Phải set = 0
const water = Math.min(maxLeft, maxRight) - height[i];
if (water > 0) result += water;
// Hoặc:
result += Math.max(0, Math.min(maxLeft, maxRight) - height[i]);

// ❌ Pitfall 3: Nhầm giữa DP và Two Pointers
// DP: Cần 2 arrays
// Two Pointers: Chỉ cần 2 variables + pointers

// ❌ Pitfall 4: Không hiểu tại sao Two Pointers hoạt động
// Nếu maxLeft < maxRight:
//   → maxLeft là bottleneck cho cả left và các thanh bên trái
//   → Tính water[left] là an toàn
//   → left++ để xử lý tiếp
```

---

### 🔄 5. Các hướng tiếp cận (So sánh)

#### 🔹 Cách 1: Brute Force (O(n²))

```javascript
function trap(height) {
  let water = 0;
  
  for (let i = 0; i < height.length; i++) {
    let maxLeft = 0, maxRight = 0;
    
    for (let j = i; j >= 0; j--) {
      maxLeft = Math.max(maxLeft, height[j]);
    }
    for (let j = i; j < height.length; j++) {
      maxRight = Math.max(maxRight, height[j]);
    }
    
    water += Math.max(0, Math.min(maxLeft, maxRight) - height[i]);
  }
  
  return water;
}
```

**📊 Phân tích:**
```
Time:  O(n²) — với mỗi i, tìm maxLeft và maxRight
Space: O(1)
```

---

#### 🔹 Cách 2: Dynamic Programming (O(n), O(n) space)

```javascript
function trap(height) {
  if (height.length === 0) return 0;
  
  const n = height.length;
  const maxLeft = new Array(n);
  const maxRight = new Array(n);
  
  // maxLeft
  maxLeft[0] = height[0];
  for (let i = 1; i < n; i++) {
    maxLeft[i] = Math.max(maxLeft[i - 1], height[i - 1]);
  }
  
  // maxRight
  maxRight[n - 1] = height[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    maxRight[i] = Math.max(maxRight[i + 1], height[i + 1]);
  }
  
  // Calculate water
  let water = 0;
  for (let i = 0; i < n; i++) {
    water += Math.max(0, Math.min(maxLeft[i], maxRight[i]) - height[i]);
  }
  
  return water;
}
```

**📊 Phân tích:**
```
Time:  O(n) — 3 passes
Space: O(n) — 2 arrays
```

---

#### 🔹 Cách 3: Two Pointers (O(n), O(1) space) ⭐ **TỐI ƯU**

```javascript
function trap(height) {
  if (height.length === 0) return 0;
  
  let left = 0;
  let right = height.length - 1;
  let maxLeft = 0;
  let maxRight = 0;
  let water = 0;
  
  while (left < right) {
    if (height[left] < height[right]) {
      // maxLeft là bottleneck
      if (height[left] >= maxLeft) {
        maxLeft = height[left];
      } else {
        water += maxLeft - height[left];
      }
      left++;
    } else {
      // maxRight là bottleneck
      if (height[right] >= maxRight) {
        maxRight = height[right];
      } else {
        water += maxRight - height[right];
      }
      right--;
    }
  }
  
  return water;
}
```

**📊 Phân tích:**
```
Time:  O(n) — 1 pass
Space: O(1) — chỉ 4 variables
```

**✅ Ưu điểm:**
- Không dùng extra memory
- Single pass
- Optimal

---

### 🚀 6. Visual Walkthrough (Two Pointers)

```
Input: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]

┌─────────────────────────────────────────────────────────────────┐
│ Start: left=0, right=11, maxLeft=0, maxRight=0, water=0      │
│                                                                 │
│ height[left]=0 < height[right]=1                                │
│   → maxLeft=0, height[left]=0 >= maxLeft=0 → maxLeft=0       │
│   left++ → left=1                                               │
│                                                                 │
│ left=1, right=11                                                │
│   height[1]=1 < height[11]=1                                    │
│   → maxLeft=0, height[1]=1 >= maxLeft=0 → maxLeft=1          │
│   left++ → left=2                                               │
│                                                                 │
│ left=2, right=11                                                │
│   height[2]=0 < height[11]=1                                    │
│   → maxLeft=1, height[2]=0 < maxLeft=1                         │
│   → water += 1 - 0 = 1, water=1                                │
│   left++ → left=3                                               │
│                                                                 │
│ left=3, right=11                                                │
│   height[3]=2 < height[11]=1? NO                                │
│   → maxRight=0, height[11]=1 >= maxRight=0 → maxRight=1        │
│   right-- → right=10                                            │
│                                                                 │
│ ... tiếp tục cho đến left >= right                              │
│                                                                 │
│ Final: water = 6 ✓                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

### 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Container With Most Water (LeetCode 11)
// Tìm diện tích lớn nhất giữa 2 đường
// → KHÁC với bài này!

// Variation 2: Rain Water II (LeetCode 407)
// Tính nước trong 2D matrix
// → Dùng Priority Queue

// Variation 3: Maximum Water Container
// Tương tự Container With Most Water

// Variation 4: Các thanh có thể âm
// → Xử lý thêm negative heights
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Trapping Rain Water - Two Pointers
 * 
 * Ý tưởng:
 * 1. Dùng 2 pointers từ 2 đầu
 * 2. Di chuyển pointer có max NHỎ HƠN
 * 3. water = max - height khi height < max
 * 
 * Time: O(n) | Space: O(1)
 * 
 * @param {number[]} height
 * @return {number}
 */
var trap = function(height) {
  if (height.length === 0) return 0;
  
  let left = 0;
  let right = height.length - 1;
  let maxLeft = 0;
  let maxRight = 0;
  let water = 0;
  
  while (left < right) {
    if (height[left] < height[right]) {
      // maxLeft là bottleneck
      if (height[left] >= maxLeft) {
        maxLeft = height[left];
      } else {
        water += maxLeft - height[left];
      }
      left++;
    } else {
      // maxRight là bottleneck
      if (height[right] >= maxRight) {
        maxRight = height[right];
      } else {
        water += maxRight - height[right];
      }
      right--;
    }
  }
  
  return water;
};
```

---

## 🧪 Test Cases

```javascript
// Test 1
console.log(trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1])); // 6 ✓

// Test 2
console.log(trap([4, 2, 0, 3, 2, 5]));                    // 9 ✓

// Test 3: Empty
console.log(trap([]));                                      // 0 ✓

// Test 4: Flat
console.log(trap([1, 1, 1, 1]));                          // 0 ✓

// Test 5: Simple
console.log(trap([3, 0, 0, 3]));                          // 6 ✓

// Test 6: Large
console.log(trap([0, 1, 0, 2, 1, 0, 3, 1, 0, 1, 2]));    // 8 ✓
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Two Pointers hoặc DP

💡 KEY INSIGHT:
   "water[i] = min(maxLeft, maxRight) - height[i]"
   "Di chuyển pointer có max NHỎ HƠN"

⚠️ PITFALLS:
   - Dùng min() không phải max()
   - Check water > 0 trước khi cộng
   - Hiểu tại sao Two Pointers hoạt động

🔄 VARIATIONS:
   - Rain Water II (2D)
   - Container With Most Water

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Quay lại README Week 2

[README Week 2](./README.md)
