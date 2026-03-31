# #1493 - Longest Subarray of 1's After Deleting One Element

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Array, Sliding Window |
| **Trạng thích** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/longest-subarray-of-1s-after-deleting-one-element/

---

## 📖 Đề bài

### Mô tả
Cho một mảng nhị phân `nums`, xóa **1 phần tử**, tìm **độ dài lớn nhất** của subarray chỉ chứa 1.

### Ví dụ

**Example 1:**
```
Input:  nums = [1, 1, 0, 1, 1, 1]
Output: 5
Giải thích: Xóa nums[2] (0), được [1,1,1,1,1] → độ dài 5
```

### Constraints
```
1 <= nums.length <= 10^5
nums[i] là 0 hoặc 1
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
┌─────────────────────────────────────────────────────┐
│ Hỏi:  Xóa 1 phần tử, subarray toàn 1 dài nhất?│
│ Trả về: Độ dài (number)                             │
│ Input:  Mảng nhị phân (0 và 1)                       │
│                                                     │
│ LƯU Ý: Xóa ĐÚNG 1 phần tử!                 │
│         Có thể xóa 0 hoặc 1                        │
└─────────────────────────────────────────────────────┘
```

---

### 🤔 2. Tư duy từng bước (Step-by-step)

#### Bước 1: Hiểu bài toán

```
nums = [1, 1, 0, 1, 1, 1]

Phương án 1: Xóa 0 ở index 2
  → [1, 1, 1, 1, 1] → độ dài 5 ✓

Phương án 2: Xóa 1
  → Có thể xóa 1 → độ dài giảm → không tốt
```

**Key insight:** Xóa 0 để mở rộng subarray!

#### Bước 2: Nghĩ đến cách "ngây thơ" nhất

> **Cách 1: Thử xóa từng phần tử**

```
nums = [1, 1, 0, 1, 1, 1]

Thử xóa từng index:
  Xóa 0: [1,1,1,1,1] → length=5 ✓
  Xóa 1: [1,0,1,1,1] → length=4
  ...

→ O(n²) - CHẬM!
```

**⚠️ Nhược điểm:**
```javascript
function longestSubarray(nums) {
  let max = 0;
  
  for (let i = 0; i < nums.length; i++) {
    // Xóa nums[i], đếm số 1s liên tiếp
    // ...
  }
  return max;
}
```

---

#### Bước 3: Nhận ra vấn đề + "Aha moment!"

> **Aha moment:**
> "Đếm số 0 trong window!"
> "→ Window chỉ chứa tối đa 1 số 0!"
> "→ Sliding Window!"

```
Luồng tư duy:
┌─────────────────────────────────────────────────────┐
│ Window chỉ được chứa TỐI ĐA 1 số 0          │
│                                                       │
│ Khi gặp số 0 thứ 2 → thu hẹp window      │
│                                                       │
│ Độ dài window = số 1s + có thể có 1 số 0│
│ → window chứa "tối đa 1 số 0"              │
└─────────────────────────────────────────────────────┘
```

---

#### Bước 4: Validate intuition bằng ví dụ chi tiết

**Ví dụ: nums = [1, 1, 0, 1, 1, 1]**

```
┌─────────────────────────────────────────────────────────────────┐
│ Window: [1, 1, 0, 1, 1, 1]                                     │
│                                                                 │
│ Step 1: i=0, nums[0]=1                                        │
│   zeroCount=0, max=1                                           │
│   window=[1]                                                   │
│                                                                 │
│ Step 2: i=1, nums[1]=1                                        │
│   zeroCount=0, max=2                                          │
│   window=[1,1]                                                 │
│                                                                 │
│ Step 3: i=2, nums[2]=0                                        │
│   zeroCount=1, max=3                                          │
│   window=[1,1,0]                                              │
│                                                                 │
│ Step 4: i=3, nums[3]=1                                        │
│   zeroCount=1, max=4                                          │
│   window=[1,1,0,1]                                           │
│                                                                 │
│ Step 5: i=4, nums[4]=1                                        │
│   zeroCount=1, max=5                                          │
│   window=[1,1,0,1,1]                                         │
│                                                                 │
│ Step 6: i=5, nums[5]=1                                        │
│   zeroCount=1, max=6                                          │
│   window=[1,1,0,1,1,1]                                        │
│                                                                 │
│ return 6 - 1 = 5 ✓ (trừ đi 1 vì phải xóa 1 phần tử)  │
└─────────────────────────────────────────────────────────────────┘
```

**Tại sao trừ 1?**
```
Vì bài toán yêu cầu XÓA 1 phần tử!
Nếu toàn mảng toàn 1s [1,1,1]:
  → Phải xóa 1 → còn lại 2
  → return n - 1, không phải n!
```

---

#### Bước 5: Xác định edge cases

```
Edge Case 1: nums = [1, 1, 1]
  → Xóa 1 (bắt buộc) → còn 2
  → return 2 ✓

Edge Case 2: nums = [0, 0, 0]
  → Xóa 1 số 0 → còn 2 số 0
  → return 2 ✓

Edge Case 3: nums = [1, 0, 1]
  → Window = [1,0,1], xóa 0 → còn 2 ✓

Edge Case 4: nums = [1]
  → Xóa 1 (bắt buộc) → còn 0
  → return 0 ✓
```

---

### 🔑 3. Key Insight (Điều mấu chốt)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Sliding Window với TỐI ĐA 1 số 0"      │
│   → Đếm số 0 trong window                    │
│   → Nếu > 1 → thu hẹp                      │
│                                                     │
│   KEY INSIGHT #2:                                  │
│   "Luôn phải XÓA 1 phần tử!"              │
│   → return windowLength - 1                 │
│   → Không phải windowLength!                 │
│                                                     │
│   KEY INSIGHT #3:                                  │
│   "Nếu toàn 1s → xóa 1 → còn n-1"        │
│                                                     │
│   KEY INSIGHT #4:                                  │
│   "Khi zeroCount > 1 → thu hẹp từ trái"  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls (Lỗi hay mắc)

```javascript
// ❌ Pitfall 1: Không trừ 1 khi return
function wrongLongestSubarray(nums) {
  let left = 0;
  let zeroCount = 0;
  let max = 0;
  
  for (let right = 0; right < nums.length; right++) {
    if (nums[right] === 0) zeroCount++;
    
    while (zeroCount > 1) {
      if (nums[left] === 0) zeroCount--;
      left++;
    }
    
    max = Math.max(max, right - left + 1);
  }
  
  return max;  // ❌ Sai! Phải trừ 1
}

// ✅ Đúng: Trừ 1
return max - 1;

// ❌ Pitfall 2: Xử lý khi toàn 1s
// nums = [1,1,1] → max=3 → return 2 (đúng!)

// ❌ Pitfall 3: Nhầm left/right
// right di chuyển, left thu hẹp khi cần
```

---

### 🔄 5. Các hướng tiếp cận (So sánh)

#### 🔹 Cách 1: Brute Force (O(n²))

```javascript
function longestSubarray(nums) {
  let max = 0;
  
  for (let i = 0; i < nums.length; i++) {
    // Count 1s sau khi xóa nums[i]
    // ...
  }
  return max;
}
```

**📊 Phân tích:**
```
Time:  O(n²)
Space: O(1)
```

---

#### 🔹 Cách 2: Sliding Window (O(n)) ⭐ **TỐI ƯU**

```javascript
function longestSubarray(nums) {
  let left = 0;
  let zeroCount = 0;
  let max = 0;
  
  for (let right = 0; right < nums.length; right++) {
    if (nums[right] === 0) zeroCount++;
    
    while (zeroCount > 1) {
      if (nums[left] === 0) zeroCount--;
      left++;
    }
    
    max = Math.max(max, right - left + 1);
  }
  
  return max - 1;  // Trừ 1 vì phải xóa 1 phần tử
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
nums = [1, 1, 0, 1, 1, 1]

┌─────────────────────────────────────────────────────────────────┐
│ right=0, left=0: nums[0]=1                                      │
│   zeroCount=0, window=[1], len=1, max=1                         │
│                                                                 │
│ right=1, left=0: nums[1]=1                                     │
│   zeroCount=0, window=[1,1], len=2, max=2                    │
│                                                                 │
│ right=2, left=0: nums[2]=0                                     │
│   zeroCount=1, window=[1,1,0], len=3, max=3                   │
│                                                                 │
│ right=3, left=0: nums[3]=1                                    │
│   zeroCount=1, window=[1,1,0,1], len=4, max=4                │
│                                                                 │
│ right=4, left=0: nums[4]=1                                    │
│   zeroCount=1, window=[1,1,0,1,1], len=5, max=5              │
│                                                                 │
│ right=5, left=0: nums[5]=1                                    │
│   zeroCount=1, window=[1,1,0,1,1,1], len=6, max=6           │
│                                                                 │
│ return max - 1 = 6 - 1 = 5 ✓                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Longest Subarray with At Most K Zeros
// Tổng quát hóa cho K zeros
function longestSubarrayK(nums, k) {
  let left = 0;
  let zeroCount = 0;
  let max = 0;
  
  for (let right = 0; right < nums.length; right++) {
    if (nums[right] === 0) zeroCount++;
    
    while (zeroCount > k) {
      if (nums[left] === 0) zeroCount--;
      left++;
    }
    
    max = Math.max(max, right - left + 1);
  }
  
  return max;
}

// Variation 2: Maximum consecutive 1s after one flip
// Tương tự bài này
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Longest Subarray of 1's After Deleting One Element
 * 
 * Ý tưởng: Sliding Window
 * - Window chỉ chứa tối đa 1 số 0
 * - return windowLength - 1 (vì phải xóa 1 phần tử)
 * 
 * Time: O(n) | Space: O(1)
 * 
 * @param {number[]} nums
 * @return {number}
 */
var longestSubarray = function(nums) {
  let left = 0;
  let zeroCount = 0;
  let max = 0;
  
  for (let right = 0; right < nums.length; right++) {
    if (nums[right] === 0) zeroCount++;
    
    while (zeroCount > 1) {
      if (nums[left] === 0) zeroCount--;
      left++;
    }
    
    max = Math.max(max, right - left + 1);
  }
  
  return max - 1;  // Trừ 1 vì phải xóa 1 phần tử
};
```

---

## 🧪 Test Cases

```javascript
// Test 1
console.log(longestSubarray([1, 1, 0, 1, 1, 1])); // 5 ✓

// Test 2
console.log(longestSubarray([1, 1, 1])); // 2 ✓

// Test 3
console.log(longestSubarray([0, 0, 0])); // 2 ✓

// Test 4
console.log(longestSubarray([1])); // 0 ✓

// Test 5
console.log(longestSubarray([0, 1, 1])); // 2 ✓
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Sliding Window với constraint

💡 KEY INSIGHT:
   "Tối đa 1 số 0"
   "return length - 1"

⚠️ PITFALLS:
   - Phải trừ 1 khi return
   - ZeroCount > 1 thu hẹp

🔄 VARIATIONS:
   - K zeros
   - K ones

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Quay lại README Week 3
