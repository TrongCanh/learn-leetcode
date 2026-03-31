# #643 - Maximum Average Subarray I

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | Array, Sliding Window |
| **Trạng thích** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/maximum-average-subarray-i/

---

## 📖 Đề bài

### Mô tả
Cho một mảng `nums` và số `k`, tìm **trung bình lớn nhất** của subarray có độ dài `k`.

### Ví dụ

**Example 1:**
```
Input:  nums = [1, 12, -5, -6, 50, 3], k = 4
Output: 12.75
Giải thích: 
Subarray [12, -5, -6, 50] = 51/4 = 12.75
```

### Constraints
```
1 <= nums.length <= 10^5
1 <= k <= nums.length
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
┌─────────────────────────────────────────────────────┐
│ Hỏi:  Trung bình lớn nhất của k elements liên tiếp?│
│ Trả về: Trung bình (number)                          │
│ Input:  nums[], k                                      │
│                                                     │
│ Công thức: avg = sum/k                              │
└─────────────────────────────────────────────────────┘
```

---

### 🤔 2. Tư duy từng bước (Step-by-step)

#### Bước 1: Nghĩ đến cách "ngây thơ" nhất

> **Cách 1: Tính tất cả subarrays độ dài k**

```
nums = [1, 12, -5, -6, 50, 3], k = 4

Subarrays:
  [1, 12, -5, -6] → sum=2, avg=0.5
  [12, -5, -6, 50] → sum=51, avg=12.75
  [-5, -6, 50, 3] → sum=42, avg=10.5

→ max avg = 12.75 ✓

→ O(n×k) - CHẬM!
```

**⚠️ Nhược điểm:**
```javascript
function findMaxAverage(nums, k) {
  let maxAvg = -Infinity;
  
  for (let i = 0; i <= nums.length - k; i++) {
    let sum = 0;
    for (let j = i; j < i + k; j++) {
      sum += nums[j];
    }
    maxAvg = Math.max(maxAvg, sum / k);
  }
  return maxAvg;
}
// → O(n×k) = O(n×10^5) - Không khả thi!
```

---

#### Bước 2: Nhận ra vấn đề + "Aha moment!"

> **Aha moment:**
> "Tính sum ĐẦU TIÊN, rồi TRƯỢT WINDOW!"
> "→ Sliding Window = O(n)!"

```
Luồng tư duy:
┌─────────────────────────────────────────────────────┐
│ Bước 1: Tính sum của k elements ĐẦU TIÊN        │
│   sum = nums[0] + ... + nums[k-1]                │
│                                                       │
│ Bước 2: Trượt window                              │
│   new sum = old sum - nums[left_out] + nums[right_in] │
│   left_out = vị trí bị loại                       │
│   right_in = vị trí mới thêm vào                 │
│                                                       │
│ Bước 3: Cập nhật max                               │
│   maxAvg = max(maxAvg, sum/k)                    │
└─────────────────────────────────────────────────────┘
```

---

#### Bước 3: Validate intuition bằng ví dụ chi tiết

**Ví dụ: nums = [1, 12, -5, -6, 50, 3], k = 4**

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Tính sum đầu tiên                                     │
│   sum = 1 + 12 + (-5) + (-6) = 2                             │
│   avg = 2/4 = 0.5                                             │
│   maxAvg = 0.5                                               │
│                                                                 │
│ Step 2: Trượt window đến vị trí 1                             │
│   new sum = old sum - nums[0] + nums[4]                      │
│             = 2 - 1 + 50 = 51                                 │
│   avg = 51/4 = 12.75                                          │
│   maxAvg = max(0.5, 12.75) = 12.75 ✓                        │
│                                                                 │
│ Step 3: Trượt window đến vị trí 2                             │
│   new sum = old sum - nums[1] + nums[5]                      │
│             = 51 - 12 + 3 = 42                                │
│   avg = 42/4 = 10.5                                           │
│   maxAvg = max(12.75, 10.5) = 12.75 ✓                        │
│                                                                 │
│ return 12.75 ✓                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

#### Bước 4: Xác định edge cases

```
Edge Case 1: k = 1
  → Trả về phần tử lớn nhất
  → nums = [1, 2, 3] → max = 3 ✓

Edge Case 2: k = nums.length
  → Trả về trung bình toàn mảng
  → nums = [1, 2, 3], k=3 → avg = 2 ✓

Edge Case 3: Toàn số âm
  nums = [-5, -2, -3], k=2
  → avg = (-5 + -2)/2 = -3.5 ✓
```

---

### 🔑 3. Key Insight (Điều mấu chốt)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Tính sum ĐẦU TIÊN, rồi TRƯỢT"              │
│   → Sliding Window = O(n)                      │
│                                                     │
│   KEY INSIGHT #2:                                  │
│   "new sum = old sum - left + right"          │
│   → Không cần tính lại từ đầu                 │
│                                                     │
│   KEY INSIGHT #3:                                  │
│   "avg = sum / k"                               │
│   → Cần max sum, không cần max avg            │
│                                                     │
│   KEY INSIGHT #4:                                  │
│   "maxAvg = max(maxAvg, sum/k)"               │
│   → Hoặc: maxSum = max(maxSum, sum)          │
│                                                     │
│   KEY INSIGHT #5:                                  │
│   "Kết quả = maxAvg hoặc maxSum/k"          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls (Lỗi hay mắc)

```javascript
// ❌ Pitfall 1: Tính lại sum mỗi lần
function wrongMaxAverage(nums, k) {
  for (let i = 0; i <= nums.length - k; i++) {
    let sum = 0;
    for (let j = i; j < i + k; j++) {
      sum += nums[j];  // ❌ O(k) mỗi lần!
    }
    // → O(n×k)
  }
}

// ✅ Đúng: Sliding window
function findMaxAverage(nums, k) {
  let sum = 0;
  for (let i = 0; i < k; i++) {
    sum += nums[i];  // ✅ Tính 1 lần
  }
  
  let maxSum = sum;
  
  for (let i = k; i < nums.length; i++) {
    sum = sum - nums[i - k] + nums[i];  // ✅ O(1)
    maxSum = Math.max(maxSum, sum);
  }
  
  return maxSum / k;
}

// ❌ Pitfall 2: Nhầm công thức trượt
sum = sum - nums[i] + nums[i + k];  // ❌ Sai!
// → Phải là:
sum = sum - nums[i - k] + nums[i];  // ✅ Đúng

// ❌ Pitfall 3: Không handle k = 1
// Vẫn hoạt động bình thường
```

---

### 🔄 5. Các hướng tiếp cận (So sánh)

#### 🔹 Cách 1: Brute Force (O(n×k))

```javascript
function findMaxAverage(nums, k) {
  let maxAvg = -Infinity;
  
  for (let i = 0; i <= nums.length - k; i++) {
    let sum = 0;
    for (let j = i; j < i + k; j++) {
      sum += nums[j];
    }
    maxAvg = Math.max(maxAvg, sum / k);
  }
  
  return maxAvg;
}
```

**📊 Phân tích:**
```
Time:  O(n×k)
Space: O(1)
```

---

#### 🔹 Cách 2: Sliding Window (O(n)) ⭐ **TỐI ƯU**

```javascript
function findMaxAverage(nums, k) {
  // Tính sum của k elements đầu tiên
  let sum = 0;
  for (let i = 0; i < k; i++) {
    sum += nums[i];
  }
  
  let maxSum = sum;
  
  // Trượt window
  for (let i = k; i < nums.length; i++) {
    sum = sum - nums[i - k] + nums[i];
    maxSum = Math.max(maxSum, sum);
  }
  
  return maxSum / k;
}
```

**📊 Phân tích:**
```
Time:  O(n)
Space: O(1)
```

---

### 🚀 6. Visual Walkthrough

```
nums = [1, 12, -5, -6, 50, 3], k = 4

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ Window 1: [1, 12, -5, -6]                                        │
│ sum = 2, avg = 0.5, maxAvg = 0.5                               │
│                                                                 │
│ Window 2: [12, -5, -6, 50]                                     │
│ sum = 2 - 1 + 50 = 51                                          │
│ avg = 12.75, maxAvg = 12.75 ✓                                 │
│                                                                 │
│ Window 3: [-5, -6, 50, 3]                                      │
│ sum = 51 - 12 + 3 = 42                                         │
│ avg = 10.5, maxAvg = 12.75 ✓                                  │
│                                                                 │
│ → return 12.75                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Maximum Average Subarray II
// K không cố định → cần O(n log range)

// Variation 2: Longest Subarray with Average >= K
// Tìm subarray dài nhất với avg >= K

// Variation 3: Minimum Average Subarray
// Tìm avg nhỏ nhất thay vì lớn nhất
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Maximum Average Subarray I
 * 
 * Ý tưởng: Sliding Window
 * - Tính sum đầu tiên O(k)
 * - Trượt window: sum = sum - left + right O(1)
 * - Cập nhật max
 * 
 * Time: O(n) | Space: O(1)
 * 
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
var findMaxAverage = function(nums, k) {
  // Tính sum của k elements đầu tiên
  let sum = 0;
  for (let i = 0; i < k; i++) {
    sum += nums[i];
  }
  
  let maxSum = sum;
  
  // Trượt window
  for (let i = k; i < nums.length; i++) {
    sum = sum - nums[i - k] + nums[i];
    maxSum = Math.max(maxSum, sum);
  }
  
  return maxSum / k;
};
```

---

## 🧪 Test Cases

```javascript
// Test 1
console.log(findMaxAverage([1, 12, -5, -6, 50, 3], 4)); // 12.75 ✓

// Test 2
console.log(findMaxAverage([5], 1)); // 5 ✓

// Test 3: k = length
console.log(findMaxAverage([1, 2, 3], 3)); // 2 ✓

// Test 4: All same
console.log(findMaxAverage([1, 1, 1, 1], 2)); // 1 ✓

// Test 5: Negative
console.log(findMaxAverage([-1, -2, -3], 2)); // -1.5 ✓
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Sliding Window (Fixed Size)

💡 KEY INSIGHT:
   "Tính sum đầu, rồi trượt"
   "sum = sum - left + right"

⚠️ PITFALLS:
   - Nhầm công thức trượt
   - Tính lại sum mỗi lần

🔄 VARIATIONS:
   - Varying k
   - Longest subarray with condition

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Bài tiếp theo

[Bài 7: Maximum Number of Vowels in Substring](./007-max-vowels-substring.md)