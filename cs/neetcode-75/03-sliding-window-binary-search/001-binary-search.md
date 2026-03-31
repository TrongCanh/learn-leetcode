# #704 - Binary Search

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | Array, Binary Search |
| **Trạng thích** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/binary-search/

---

## 📖 Đề bài

### Mô tả
Cho một mảng đã sorted `nums` và một giá trị `target`, tìm `target` trong mảng.

Trả về **index** của target, hoặc **-1** nếu không tìm thấy.

### Ví dụ

**Example 1:**
```
Input:  nums = [-1, 0, 3, 5, 9, 12], target = 9
Output: 4
Giải thích: 9 có index 4 trong mảng
```

**Example 2:**
```
Input:  nums = [-1, 0, 3, 5, 9, 12], target = 2
Output: -1
Giải thích: 2 không có trong mảng
```

### Constraints
```
1 <= nums.length <= 10^4
-10^4 < nums[i], target < 10^4
nums sorted in ascending order
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
┌─────────────────────────────────────────────────────┐
│ Hỏi:  Tìm target trong mảng đã SORTED?      │
│ Trả về: Index của target, hoặc -1              │
│ Input:  Mảng sorted + target                      │
│                                                     │
│ LƯU Ý QUAN TRỌNG:                               │
│ - Mảng đã SORTED! (tận dụng để tối ưu)     │
│ - Không phải duyệt từ đầu đến cuối!         │
└─────────────────────────────────────────────────────┘
```

---

### 🤔 2. Tư duy từng bước (Step-by-step)

#### Bước 1: Nghĩ đến cách "ngây thơ" nhất

> **Hỏi:** "Làm sao tìm target trong mảng?"

**Cách 1: Linear Search - Duyệt từ đầu đến cuối**

```
Input: nums = [-1, 0, 3, 5, 9, 12], target = 9

So sánh lần lượt:
  nums[0] = -1 ≠ 9
  nums[1] = 0 ≠ 9
  nums[2] = 3 ≠ 9
  nums[3] = 5 ≠ 9
  nums[4] = 9 = 9 ✓ → return 4

→ O(n) = 6 comparisons
```

**⚠️ Nhược điểm:**
```javascript
function search(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === target) return i;
  }
  return -1;
}
// → O(n) - CHẬM cho mảng lớn!
// → Không tận dụng mảng đã SORTED
```

---

#### Bước 2: Nhận ra vấn đề + "Aha moment!"

> **Aha moment #1:**
> "Mảng đã SORTED!"
> "→ Không cần duyệt từ đầu, có thể NHẢY đến giữa!"

> **Aha moment #2:**
> "Nếu nums[mid] < target → target ở BÊN PHẢI"
> "Nếu nums[mid] > target → target ở BÊN TRÁI"
> "→ Giống như tìm từ trong từ điển!"

```
Luồng tư duy - Dictionary search:
┌─────────────────────────────────────────────────────┐
│ Bước 1: Mở giữa từ điển                          │
│   nums[mid] = 5                                    │
│   5 < 9 → target lớn hơn → tìm bên phải        │
│                                                       │
│ Bước 2: Mở giữa phần bên phải                   │
│   nums[mid] = 9                                    │
│   9 = 9 → FOUND! ✓                                │
└─────────────────────────────────────────────────────┘
```

---

#### Bước 3: Validate intuition bằng ví dụ chi tiết

**Ví dụ: nums = [-1, 0, 3, 5, 9, 12], target = 9**

```
┌─────────────────────────────────────────────────────────────────┐
│ Bước 1: Setup                                               │
│   left = 0, right = 5                                        │
│   mid = (0 + 5) / 2 = 2 (floor)                             │
│   nums[2] = 3                                                 │
│                                                                 │
│   3 < 9 → target ở bên phải                                 │
│   → left = mid + 1 = 3                                       │
│                                                                 │
│ Bước 2: Tính lại mid                                        │
│   left = 3, right = 5                                        │
│   mid = (3 + 5) / 2 = 4                                      │
│   nums[4] = 9                                                 │
│                                                                 │
│   9 = 9 → FOUND! → return 4 ✓                               │
└─────────────────────────────────────────────────────────────────┘
```

**Ví dụ: nums = [-1, 0, 3, 5, 9, 12], target = 2**

```
┌─────────────────────────────────────────────────────────────────┐
│ Bước 1: Setup                                               │
│   left = 0, right = 5                                        │
│   mid = 2                                                    │
│   nums[2] = 3                                                 │
│                                                                 │
│   3 > 2 → target ở bên trái                                  │
│   → right = mid - 1 = 1                                       │
│                                                                 │
│ Bước 2: Tính lại mid                                        │
│   left = 0, right = 1                                        │
│   mid = 0                                                    │
│   nums[0] = -1                                                │
│                                                                 │
│   -1 < 2 → target ở bên phải                                │
│   → left = mid + 1 = 1                                       │
│                                                                 │
│ Bước 3: Kiểm tra điều kiện dừng                          │
│   left = 1, right = 1                                        │
│   mid = 1                                                    │
│   nums[1] = 0                                                │
│                                                                 │
│   0 < 2 → left = mid + 1 = 2                               │
│                                                                 │
│ Bước 4: left > right                                        │
│   left = 2, right = 1                                        │
│   → left > right → NOT FOUND → return -1 ✓                  │
└─────────────────────────────────────────────────────────────────┘
```

---

#### Bước 4: Xác định edge cases

```
Edge Case 1: nums = [5], target = 5
  left=0, right=0, mid=0
  nums[0] = 5 = 5 → FOUND → return 0 ✓

Edge Case 2: nums = [5], target = 3
  left=0, right=0, mid=0
  nums[0] = 5 > 3 → right = -1
  left > right → return -1 ✓

Edge Case 3: nums = [1, 2, 3, 4, 5], target = 1
  → Found ở left → return 0 ✓

Edge Case 4: nums = [1, 2, 3, 4, 5], target = 5
  → Found ở right → return 4 ✓

Edge Case 5: nums = [], target = 1
  → return -1 ✓ (không có phần tử)
```

---

### 🔑 3. Key Insight (Điều mấu chốt)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Mảng SORTED → Dùng Binary Search!"           │
│   → O(log n) thay vì O(n)                       │
│                                                     │
│   KEY INSIGHT #2:                                  │
│   "Tìm giữa → So sánh → Loại bỏ 1 nửa"     │
│   → nums[mid] < target → bỏ trái, tìm phải   │
│   → nums[mid] > target → bỏ phải, tìm trái    │
│                                                     │
│   KEY INSIGHT #3:                                  │
│   "mid = Math.floor((left + right) / 2)"       │
│   → Dùng floor để tránh decimal                 │
│                                                     │
│   KEY INSIGHT #4:                                  │
│   "Điều kiện dừng: left > right"             │
│   → Không tìm thấy → return -1                 │
│                                                     │
│   KEY INSIGHT #5:                                  │
│   "left = mid + 1, right = mid - 1"            │
│   → Loại bỏ mid để tránh infinite loop         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls (Lỗi hay mắc)

```javascript
// ❌ Pitfall 1: Sử dụng left < right thay vì left <= right
function wrongSearch(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  
  while (left < right) {  // ❌ left < right, không phải <=
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    else if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

// Ví dụ sai: nums = [5], target = 5
// left=0, right=0 → left < right? NO (0 < 0 = false)
// → Không vào loop → return -1 ❌

// ✅ Đúng: left <= right
function search(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  
  while (left <= right) {  // ✅ left <= right
    // ...
  }
  return -1;
}

// ❌ Pitfall 2: Nhầm hướng loại bỏ
function wrongSearch(nums, target) {
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    else if (nums[mid] < target) {
      right = mid;  // ❌ Sai! Không loại bỏ mid
    } else {
      left = mid;   // ❌ Sai!
    }
  }
  return -1;
}

// ✅ Đúng: left = mid + 1, right = mid - 1
else if (nums[mid] < target) {
  left = mid + 1;   // ✅ Loại bỏ mid + trái
} else {
  right = mid - 1;  // ✅ Loại bỏ mid + phải
}

// ❌ Pitfall 3: overflow khi tính mid
const mid = (left + right) / 2;  // ❌ Có thể overflow!
// left, right là số lớn → left + right > 2^31

// ✅ Đúng: Dùng bit shift hoặc floor division
const mid = Math.floor((left + right) / 2);
// Hoặc:
const mid = (left + right) >>> 1;  // ✅ Bit shift không overflow
```

---

### 🔄 5. Các hướng tiếp cận (So sánh)

#### 🔹 Cách 1: Linear Search (O(n))

```javascript
function search(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === target) return i;
  }
  return -1;
}
```

**📊 Phân tích:**
```
Time:  O(n) — duyệt từ đầu đến cuối
Space: O(1)
```

**⚠️ Nhược điểm:**
- Chậm cho mảng lớn
- Không tận dụng mảng sorted

---

#### 🔹 Cách 2: Binary Search (O(log n)) ⭐ **TỐI ƯU**

```javascript
function search(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return -1;
}
```

**📊 Phân tích:**
```
Time:  O(log n) — mỗi bước loại bỏ 1 nửa
Space: O(1)
```

**✅ Ưu điểm:**
- Cực nhanh cho mảng lớn
- Fundamental algorithm
- Interview favorite

---

### 🚀 6. Visual Walkthrough

```
Input: nums = [-1, 0, 3, 5, 9, 12], target = 9

┌─────────────────────────────────────────────────────────────────┐
│                    Binary Search Tree                              │
│                                                                 │
│                        [-1,0,3,5,9,12]                            │
│                              │                                   │
│                             / \                                  │
│                        [-1,0,3]   [9,12]                          │
│                           │          │                            │
│                          / \        / \                           │
│                      [-1,0]  [3]  [9]  [12]                      │
│                         │       │    │     │                     │
│                        / \      │   / \    │                     │
│                      [-1] [0]  [3] [9] [12]                     │
│                                                                 │
│ Target = 9:                                                      │
│ Step 1: [-1,0,3,5,9,12] → 5 < 9 → đi phải                    │
│ Step 2: [9,12] → 9 = 9 → FOUND!                               │
│                                                                 │
│ → 2 steps thay vì 5 steps (linear) ✓                          │
└─────────────────────────────────────────────────────────────────┘
```

---

### 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Find First Position (LeetCode 34)
// Tìm vị trí ĐẦU TIÊN của target (có duplicates)
function findFirstPosition(nums, target) {
  let left = 0, right = nums.length - 1;
  let result = -1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) {
      result = mid;
      right = mid - 1;  // ← Tiếp tục tìm bên trái
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return result;
}

// Variation 2: Find Last Position
// Tìm vị trí CUỐI CÙNG của target
function findLastPosition(nums, target) {
  let left = 0, right = nums.length - 1;
  let result = -1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) {
      result = mid;
      left = mid + 1;  // ← Tiếp tục tìm bên phải
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return result;
}

// Variation 3: Search in Rotated Array
// Tìm trong mảng đã rotate
function searchRotated(nums, target) {
  // Xem bài Search in Rotated Sorted Array
}

// Variation 4: Find Peak Element
// Tìm phần tử lớn hơn cả 2 neighbors
function findPeakElement(nums) {
  let left = 0, right = nums.length - 1;
  
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] < nums[mid + 1]) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  return left;
}
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Binary Search
 * 
 * Ý tưởng:
 * 1. left = 0, right = n-1
 * 2. mid = (left + right) / 2
 * 3. So sánh nums[mid] với target
 * 4. Loại bỏ 1 nửa mảng
 * 
 * Time: O(log n) | Space: O(1)
 * 
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var search = function(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return -1;
};
```

---

## 🧪 Test Cases

```javascript
// Test 1: Found in middle
console.log(search([-1, 0, 3, 5, 9, 12], 9)); // 4 ✓

// Test 2: Not found
console.log(search([-1, 0, 3, 5, 9, 12], 2)); // -1 ✓

// Test 3: Found at beginning
console.log(search([-1, 0, 3, 5, 9, 12], -1)); // 0 ✓

// Test 4: Found at end
console.log(search([-1, 0, 3, 5, 9, 12], 12)); // 5 ✓

// Test 5: Single element - found
console.log(search([5], 5)); // 0 ✓

// Test 6: Single element - not found
console.log(search([5], 3)); // -1 ✓

// Test 7: Two elements
console.log(search([2, 5], 5)); // 1 ✓

// Test 8: Negative numbers
console.log(search([-10, -5, 0, 5, 10], -5)); // 1 ✓
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Binary Search

💡 KEY INSIGHT:
   "Mảng SORTED → Loại bỏ 1 nửa mỗi bước"
   "left <= right, mid = floor((l+r)/2)"
   "nums[mid] < target → left = mid + 1"

⚠️ PITFALLS:
   - Dùng left < right thay vì left <= right
   - left = mid thay vì left = mid + 1
   - Overflow khi tính mid

🔄 VARIATIONS:
   - Find First/Last Position
   - Search Rotated Array
   - Find Peak Element

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Bài tiếp theo

[Bài 2: Search a 2D Matrix](./002-search-2d-matrix.md)
