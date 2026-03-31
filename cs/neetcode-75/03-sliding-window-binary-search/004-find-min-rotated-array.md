# #153 - Find Minimum in Rotated Sorted Array

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Array, Binary Search |
| **Trạng thích** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/

---

## 📖 Đề bài

### Mô tả
Cho một mảng đã sorted `nums` đã được rotate `1` đến `n` lần, tìm **phần tử nhỏ nhất**.

### Ví dụ

**Example 1:**
```
Input:  nums = [3, 4, 5, 1, 2]
Output: 1
```

**Example 2:**
```
Input:  nums = [4, 5, 6, 7, 0, 1, 2]
Output: 0
```

**Example 3:**
```
Input:  nums = [11, 13, 15, 17]
Output: 11
```

### Constraints
```
n = nums.length
1 <= n <= 5000
-5000 <= nums[i] <= 5000
All integers are unique
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
┌─────────────────────────────────────────────────────┐
│ Hỏi:  Tìm phần tử NHỎ NHẤT trong mảng đã rotate?│
│ Trả về: Phần tử nhỏ nhất (number)                  │
│ Input:  Mảng sorted đã rotate                        │
│                                                     │
│ Rotate: Xoay mảng đi k lần                        │
│ Ví dụ: [1,2,3,4,5] → rotate 2 → [3,4,5,1,2]    │
└─────────────────────────────────────────────────────┘
```

---

### 🤔 2. Tư duy từng bước (Step-by-step)

#### Bước 1: Hiểu Rotated Array

```
Mảng gốc: [1, 2, 3, 4, 5]

Rotate 1 lần: [2, 3, 4, 5, 1]
Rotate 2 lần: [3, 4, 5, 1, 2]
Rotate 3 lần: [4, 5, 1, 2, 3]
Rotate 4 lần: [5, 1, 2, 3, 4]
Rotate 5 lần: [1, 2, 3, 4, 5] (quay về gốc)
```

**Đặc điểm:**
- Có **1 điểm gãy** (pivot)
- Bên trái pivot: giảm dần (từ max → pivot)
- Bên phải pivot: tăng dần (từ pivot → min)

#### Bước 2: Nghĩ đến cách "ngây thơ" nhất

> **Cách 1: Linear Scan - Tìm min như bình thường**

```
Input: [3, 4, 5, 1, 2]

Duyệt từ đầu:
  min = 3
  min = min(3, 4) = 3
  min = min(3, 5) = 3
  min = min(3, 1) = 1 ✓
  min = min(1, 2) = 1

→ O(n) - CHẬM!
```

**⚠️ Nhược điểm:**
```javascript
function findMin(nums) {
  let min = nums[0];
  for (const num of nums) {
    min = Math.min(min, num);
  }
  return min;
}
// → O(n) - Không tận dụng sorted + rotated!
```

---

#### Bước 3: Nhận ra vấn đề + "Aha moment!"

> **Aha moment:**
> "Mảng đã rotate = 2 mảng sorted!"
> "→ Phần tử nhỏ nhất = phần tử ĐẦU TIÊN của mảng thứ 2"
> "→ Dùng Binary Search để tìm PIVOT!"

```
[3, 4, 5, 1, 2]
     ↑ pivot
     
Bên trái: [3, 4, 5] → giảm dần
Bên phải: [1, 2] → tăng dần

→ Minimum = phần tử ĐẦU TIÊN bên phải = 1
```

---

#### Bước 4: Tư duy Binary Search

> **Cách 2: Binary Search**

```
Luồng tư duy:
┌─────────────────────────────────────────────────────┐
│                                                       │
│  nums[mid] > nums[right]?                           │
│    → Minimum ở BÊN PHẢI                             │
│    → left = mid + 1                                │
│                                                       │
│  nums[mid] <= nums[right]?                         │
│    → Minimum ở ĐÂY hoặc BÊN TRÁI                 │
│    → right = mid                                   │
│                                                       │
│  Điều kiện dừng: left === right                   │
│  → Đã tìm được minimum!                           │
└─────────────────────────────────────────────────────┘
```

---

#### Bước 5: Validate intuition bằng ví dụ chi tiết

**Ví dụ: nums = [3, 4, 5, 1, 2]**

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: left=0, right=4, mid=2                             │
│   nums[2]=5 > nums[4]=2                                       │
│   → Minimum ở bên phải!                                       │
│   → left = mid + 1 = 3                                         │
│                                                                 │
│ Step 2: left=3, right=4, mid=3                                │
│   nums[3]=1 <= nums[4]=2                                      │
│   → Minimum ở đây hoặc bên trái!                            │
│   → right = mid = 3                                            │
│                                                                 │
│ Step 3: left=3, right=3 → left === right                     │
│   → return nums[3] = 1 ✓                                      │
└─────────────────────────────────────────────────────────────────┘
```

**Ví dụ: nums = [4, 5, 6, 7, 0, 1, 2]**

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: left=0, right=6, mid=3                                │
│   nums[3]=7 > nums[6]=2                                       │
│   → left = mid + 1 = 4                                         │
│                                                                 │
│ Step 2: left=4, right=6, mid=5                                │
│   nums[5]=1 <= nums[6]=2                                      │
│   → right = mid = 5                                           │
│                                                                 │
│ Step 3: left=4, right=5, mid=4                                │
│   nums[4]=0 <= nums[5]=1                                      │
│   → right = mid = 4                                           │
│                                                                 │
│ Step 4: left=4, right=4 → STOP                                │
│   → return nums[4] = 0 ✓                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

#### Bước 6: Xác định edge cases

```
Edge Case 1: nums = [1, 2, 3, 4, 5] (không rotate)
  → left=0, right=4, mid=2
  → 3 > 5? NO → 3 <= 5 → right=2
  → ... → return 1 ✓

Edge Case 2: nums = [2] (1 phần tử)
  → left=0, right=0 → return nums[0]=2 ✓

Edge Case 3: nums = [5, 1, 2, 3, 4]
  → pivot ở index 1
  → return 1 ✓
```

---

### 🔑 3. Key Insight (Điều mấu chốt)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Rotated Array = 2 mảng sorted liên tiếp"  │
│   → Minimum = phần tử ĐẦU TIÊN mảng thứ 2│
│                                                     │
│   KEY INSIGHT #2:                                  │
│   "nums[mid] > nums[right] = có PIVOT bên phải"│
│   → Minimum ở bên phải → left = mid + 1    │
│                                                     │
│   KEY INSIGHT #3:                                  │
│   "nums[mid] <= nums[right] = pivot bên trái hoặc đây"│
│   → Minimum ở đây hoặc bên trái → right = mid │
│                                                     │
│   KEY INSIGHT #4:                                  │
│   "Dùng nums[right] làm reference"           │
│   → Vì nums[right] luôn ở mảng thứ 2 (nếu có)│
│                                                     │
│   KEY INSIGHT #5:                                  │
│   "Điều kiện dừng: left === right"         │
│   → Đã tìm được minimum position           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls (Lỗi hay mắc)

```javascript
// ❌ Pitfall 1: Nhầm hướng so sánh
function wrongFindMin(nums) {
  let left = 0, right = nums.length - 1;
  
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    
    if (nums[mid] > nums[left]) {  // ❌ Nhầm! So sánh với left
      // → Sai logic!
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  return nums[left];
}

// ✅ Đúng: So sánh với nums[right]
while (left < right) {
  const mid = Math.floor((left + right) / 2);
  
  if (nums[mid] > nums[right]) {  // ✅ So với right
    left = mid + 1;
  } else {
    right = mid;
  }
}

// ❌ Pitfall 2: Dùng nums[left] làm reference
// nums[left] có thể ở mảng thứ 1 hoặc thứ 2
// → Không deterministic!

// ✅ Dùng nums[right]: Luôn predictable
// nums[right] luôn ở "vùng" có minimum (nếu có rotation)

// ❌ Pitfall 3: Nhầm left = mid vs left = mid + 1
if (nums[mid] > nums[right]) {
  left = mid + 1;  // ✅ Bỏ mid vì mid > right, không phải min
} else {
  right = mid;     // ✅ Giữ mid vì có thể là min
}

// ❌ Pitfall 4: Dùng left <= right
// Khi left === right → đã tìm được → return
while (left < right) {  // ✅ Không phải <=
  // ...
}
```

---

### 🔄 5. Các hướng tiếp cận (So sánh)

#### 🔹 Cách 1: Linear Scan (O(n))

```javascript
function findMin(nums) {
  let min = nums[0];
  for (const num of nums) {
    min = Math.min(min, num);
  }
  return min;
}
```

**📊 Phân tích:**
```
Time:  O(n)
Space: O(1)
```

**⚠️ Không tận dụng sorted property**

---

#### 🔹 Cách 2: Binary Search (O(log n)) ⭐ **TỐI ƯU**

```javascript
function findMin(nums) {
  let left = 0;
  let right = nums.length - 1;
  
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    
    if (nums[mid] > nums[right]) {
      // Minimum ở bên phải
      left = mid + 1;
    } else {
      // Minimum ở đây hoặc bên trái
      right = mid;
    }
  }
  
  return nums[left];
}
```

**📊 Phân tích:**
```
Time:  O(log n)
Space: O(1)
```

**✅ Ưu điểm:**
- Optimal
- Elegant solution

---

### 🚀 6. Visual Walkthrough

```
[3, 4, 5, 1, 2]

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   left=0, right=4, mid=2                                       │
│   nums[2]=5 > nums[4]=2 → đi phải                            │
│   [3, 4, 5 | 1, 2]                                           │
│                ↑                                              │
│   left = 3                                                    │
│                                                                 │
│   left=3, right=4, mid=3                                      │
│   nums[3]=1 <= nums[4]=2 → đây hoặc trái                     │
│   [3, 4, 5 | 1, 2]                                           │
│                ↑                                             │
│   right = 3                                                   │
│                                                                 │
│   left=3, right=3 → STOP                                      │
│   → return nums[3] = 1 ✓                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Find Minimum II (Duplicates allowed)
// Có thể dùng Linear Scan hoặc Binary Search đặc biệt

// Variation 2: Search in Rotated Sorted Array
// Tìm target trong rotated array
function search(nums, target) {
  let left = 0, right = nums.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (nums[mid] === target) return mid;
    
    // Xác định nửa nào sorted
    if (nums[left] <= nums[mid]) {
      // Trái sorted
      if (nums[left] <= target && target < nums[mid]) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    } else {
      // Phải sorted
      if (nums[mid] < target && target <= nums[right]) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
  }
  return -1;
}

// Variation 3: Find Peak Element
// Tìm phần tử lớn hơn cả 2 neighbors
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Find Minimum in Rotated Sorted Array
 * 
 * Ý tưởng: Binary Search
 * - So sánh nums[mid] với nums[right]
 * - nums[mid] > nums[right] → minimum bên phải
 * - nums[mid] <= nums[right] → minimum ở đây hoặc trái
 * 
 * Time: O(log n) | Space: O(1)
 * 
 * @param {number[]} nums
 * @return {number}
 */
var findMin = function(nums) {
  let left = 0;
  let right = nums.length - 1;
  
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    
    if (nums[mid] > nums[right]) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  
  return nums[left];
};
```

---

## 🧪 Test Cases

```javascript
// Test 1
console.log(findMin([3, 4, 5, 1, 2])); // 1 ✓

// Test 2
console.log(findMin([4, 5, 6, 7, 0, 1, 2])); // 0 ✓

// Test 3
console.log(findMin([11, 13, 15, 17])); // 11 ✓

// Test 4: No rotation
console.log(findMin([1, 2, 3, 4, 5])); // 1 ✓

// Test 5: Single element
console.log(findMin([5])); // 5 ✓

// Test 6: Two elements
console.log(findMin([2, 1])); // 1 ✓
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Binary Search on Rotated Array

💡 KEY INSIGHT:
   "So sánh với nums[right]"
   "nums[mid] > nums[right] → bên phải"
   "nums[mid] <= nums[right] → đây hoặc trái"

⚠️ PITFALLS:
   - SO SÁNH VỚI NUMS[RIGHT], không phải left
   - left = mid + 1 khi nhỏ hơn
   - right = mid khi lớn hơn hoặc bằng

🔄 VARIATIONS:
   - Search in Rotated Array
   - Find Minimum II (duplicates)

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Bài tiếp theo

[Bài 5: Search in Rotated Sorted Array](./005-search-rotated-array.md)
