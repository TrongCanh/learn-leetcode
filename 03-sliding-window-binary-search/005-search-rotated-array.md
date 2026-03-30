# #33 - Search in Rotated Sorted Array

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Array, Binary Search |
| **Trạng thích** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/search-in-rotated-sorted-array/

---

## 📖 Đề bài

### Mô tả
Cho một mảng đã sorted và được rotate, tìm `target`.

### Ví dụ

**Example 1:**
```
Input:  nums = [4, 5, 6, 7, 0, 1, 2], target = 0
Output: 4
```

**Example 2:**
```
Input:  nums = [4, 5, 6, 7, 0, 1, 2], target = 3
Output: -1
```

### Constraints
```
n = nums.length
1 <= n <= 5000
-10^4 <= nums[i] <= 10^4
All integers are unique
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
┌─────────────────────────────────────────────────────┐
│ Hỏi:  Tìm target trong mảng đã rotate?        │
│ Trả về: Index của target, hoặc -1              │
│ Input:  Mảng sorted đã rotate + target           │
│                                                     │
│ Ví dụ: [4,5,6,7,0,1,2], target=0                │
│   → Tìm 0 ở index 4                              │
│   → return 4                                       │
└─────────────────────────────────────────────────────┘
```

---

### 🤔 2. Tư duy từng bước (Step-by-step)

#### Bước 1: Hiểu Rotated Array

```
Mảng gốc: [1, 2, 3, 4, 5, 6, 7]
Rotate 3 lần: [4, 5, 6, 7, 1, 2, 3]

Hai phần sorted:
  Phần 1: [4, 5, 6, 7] (tăng dần)
  Phần 2: [1, 2, 3] (tăng dần)
```

#### Bước 2: Nghĩ đến cách "ngây thơ" nhất

> **Cách 1: Linear Search**

```
nums = [4, 5, 6, 7, 0, 1, 2], target = 0

Duyệt từ đầu:
  nums[0]=4 ≠ 0
  nums[1]=5 ≠ 0
  ...
  nums[4]=0 = 0 → FOUND! → return 4 ✓

→ O(n) - CHẬM!
```

#### Bước 3: Nhận ra vấn đề + "Aha moment!"

> **Aha moment:**
> "Mỗi nửa của rotated array đều SORTED!"
> "→ Xác định nửa nào chứa target"

```
Luồng tư duy:
┌─────────────────────────────────────────────────────┐
│                                                       │
│  nums[mid] = 7                                       │
│                                                       │
│  Nếu nums[left] <= nums[mid]:                       │
│    → Trái sorted                                    │
│    → Nếu target trong [left..mid]: tìm trái      │
│    → Ngược lại: tìm phải                          │
│                                                       │
│  Ngược lại (phải sorted):                         │
│    → Nếu target trong [mid..right]: tìm phải    │
│    → Ngược lại: tìm trái                          │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

#### Bước 4: Validate intuition bằng ví dụ chi tiết

**Ví dụ: nums = [4, 5, 6, 7, 0, 1, 2], target = 0**

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: left=0, right=6, mid=3                               │
│   nums[0]=4 <= nums[3]=7 → TRÁI SORTED!                      │
│   target = 0 trong [0..3]? (4..7) → NO                         │
│   → Tìm bên PHẢI → left = mid + 1 = 4                        │
│                                                                 │
│ Step 2: left=4, right=6, mid=5                                │
│   nums[4]=0 <= nums[5]=1 → TRÁI SORTED!                      │
│   target = 0 trong [4..5]? (0..1) → YES                        │
│   → Tìm bên TRÁI → right = mid - 1 = 4                        │
│                                                                 │
│ Step 3: left=4, right=4 → mid=4                               │
│   nums[4]=0 = target → FOUND! → return 4 ✓                  │
└─────────────────────────────────────────────────────────────────┘
```

**Ví dụ: target = 3 (không có)**

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: left=0, right=6, mid=3                               │
│   4 <= 7 → TRÁI SORTED                                        │
│   4 <= 3? NO (target < left) → tìm PHẢI                       │
│   → left = 4                                                  │
│                                                                 │
│ Step 2: left=4, right=6, mid=5                                │
│   0 <= 1 → TRÁI SORTED                                        │
│   0 <= 3? NO → tìm PHẢI                                       │
│   → left = 6                                                  │
│                                                                 │
│ Step 3: left=6, right=6, mid=6                                │
│   nums[6]=2 = 3? NO                                           │
│   → left = 7                                                  │
│                                                                 │
│ Step 4: left=7 > right=6 → STOP                               │
│   → return -1 ✓                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

#### Bước 5: Xác định edge cases

```
Edge Case 1: nums = [1], target = 1
  → return 0 ✓

Edge Case 2: nums = [1], target = 2
  → return -1 ✓

Edge Case 3: nums không rotate [1,2,3,4]
  → Hoạt động bình thường ✓

Edge Case 4: target ở đầu
  nums = [4,5,6,7,0,1,2], target = 4
  → Tìm được ở index 0 ✓

Edge Case 5: target ở cuối
  nums = [4,5,6,7,0,1,2], target = 2
  → Tìm được ở index 6 ✓
```

---

### 🔑 3. Key Insight (Điều mấu chốt)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Rotated array = 2 mảng sorted"              │
│   → Mỗi nửa có thể dùng Binary Search       │
│                                                     │
│   KEY INSIGHT #2:                                  │
│   "Xác định nửa nào SORTED bằng nums[left] <= nums[mid]" │
│   → TRÁI sorted nếu left <= mid               │
│   → PHẢI sorted nếu left > mid                 │
│                                                     │
│   KEY INSIGHT #3:                                  │
│   "Target nằm trong phần sorted?"            │
│   → Tùy thuộc vào target so với boundary    │
│                                                     │
│   KEY INSIGHT #4:                                  │
│   "TRÁI sorted: target ∈ [left..mid] → tìm trái"│
│   "PHẢI sorted: target ∈ [mid..right] → tìm phải"│
│                                                     │
│   KEY INSIGHT #5:                                   │
│   "Điều kiện dừng: left > right → not found"│
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls (Lỗi hay mắc)

```javascript
// ❌ Pitfall 1: Nhầm hướng xác định sorted
function wrongSearch(nums, target) {
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (nums[mid] === target) return mid;
    
    // ❌ Nhầm logic!
    if (nums[mid] < nums[left]) {
      // Có vẻ đúng nhưng không cover hết
    }
  }
}

// ✅ Đúng: Kiểm tra nums[left] <= nums[mid]
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

// ❌ Pitfall 2: Không check nums[mid] === target trước
// Phải check target trước khi xác định sorted

// ❌ Pitfall 3: Condition boundary sai
// nums[left] <= target < nums[mid] → nên là <= cho mid
// Vì nếu target == nums[mid] → đã return ở bước trên

// ❌ Pitfall 4: Không handle điều kiện dừng
while (left <= right) {  // ✅ Cần <=
  // ...
}
return -1;  // ✅ Not found
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
Time:  O(n)
Space: O(1)
```

---

#### 🔹 Cách 2: Binary Search (O(log n)) ⭐ **TỐI ƯU**

```javascript
function search(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  
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
```

**📊 Phân tích:**
```
Time:  O(log n)
Space: O(1)
```

---

### 🚀 6. Visual Walkthrough

```
nums = [4, 5, 6, 7, 0, 1, 2], target = 0

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│         [4, 5, 6, 7] | [0, 1, 2]                                │
│          ↑         ↑                                           │
│        left       mid                                          │
│                                                                 │
│ Step 1: mid=3, nums[0]<=nums[3] (TRÁI sorted)                  │
│   target=0 ∈ [0..3]? NO                                        │
│   → left = 4                                                   │
│                                                                 │
│ Step 2: mid=5, nums[4]<=nums[5] (TRÁI sorted)                  │
│   target=0 ∈ [4..5]? YES                                        │
│   → right = 4                                                   │
│                                                                 │
│ Step 3: mid=4, nums[4]=0 = target → FOUND! ✓                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Search with Duplicates
// Có duplicates → phức tạp hơn

// Variation 2: Find Minimum in Rotated Sorted Array
// Tìm min thay vì target
function findMin(nums) {
  let left = 0, right = nums.length - 1;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] > nums[right]) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  return nums[left];
}

// Variation 3: Find Pivot
// Tìm index của phần tử nhỏ nhất
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Search in Rotated Sorted Array
 * 
 * Ý tưởng: Binary Search với xác định sorted half
 * - Xác định nửa nào sorted (trái hoặc phải)
 * - Kiểm tra target có trong sorted half không
 * - Thu hẹp search space
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
};
```

---

## 🧪 Test Cases

```javascript
// Test 1
console.log(search([4, 5, 6, 7, 0, 1, 2], 0)); // 4 ✓

// Test 2
console.log(search([4, 5, 6, 7, 0, 1, 2], 3)); // -1 ✓

// Test 3
console.log(search([1], 1)); // 0 ✓

// Test 4
console.log(search([1, 3], 3)); // 1 ✓

// Test 5: No rotation
console.log(search([1, 2, 3, 4, 5], 3)); // 2 ✓

// Test 6: Target at start
console.log(search([4, 5, 6, 7, 0, 1, 2], 4)); // 0 ✓
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Binary Search on Rotated Array

💡 KEY INSIGHT:
   "Xác định nửa sorted: nums[left] <= nums[mid]"
   "Kiểm tra target trong sorted half"
   "Thu hẹp search space"

⚠️ PITFALLS:
   - Check nums[mid] === target TRƯỚC
   - Dùng nums[left] <= nums[mid] để xác định
   - Điều kiện: target < nums[mid] (không <=)

🔄 VARIATIONS:
   - Search with Duplicates
   - Find Minimum

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Bài tiếp theo

[Bài 6: Maximum Average Subarray I](./006-max-average-subarray.md)