# #26 - Remove Duplicates from Sorted Array

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | Array, Two Pointers |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/remove-duplicates-from-sorted-array/

---

## 📖 Đề bài

### Mô tả
Cho một mảng đã sorted `nums`, **xóa các duplicates** sao cho mỗi phần tử chỉ xuất hiện **một lần**.

**Không dùng extra array**, modify trực tiếp trên mảng.

Trả về số phần tử **không trùng lặp**.

### Ví dụ

**Example 1:**
```
Input:  nums = [1, 1, 2]
Output: 2
Giải thích: Mảng mới = [1, 2, _]
→ 2 phần tử không trùng lặp
```

**Example 2:**
```
Input:  nums = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]
Output: 5
Giải thích: Mảng mới = [0, 1, 2, 3, 4, _, _, _, _, _]
→ 5 phần tử không trùng lặp
```

### Constraints
```
1 <= nums.length <= 3 * 10^4
-100 <= nums[i] <= 100
nums sorted in non-decreasing order
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
┌─────────────────────────────────────────────────────┐
│ Hỏi:  Xóa duplicates, giữ mỗi phần tử 1 lần?  │
│ Trả về: Số phần tử không trùng lặp (k)           │
│ Input:  Mảng đã SORTED (quan trọng!)               │
│                                                     │
│ LƯU Ý:                                            │
│ - Modify trực tiếp trên mảng (không tạo mảng mới)│
│ - Các phần tử SAU vị trí k có thể bị bỏ qua     │
│ - Quan trọng: Mảng đã sorted!                      │
└─────────────────────────────────────────────────────┘
```

---

### 🤔 2. Tư duy từng bước (Step-by-step)

#### Bước 1: Nghĩ đến cách "ngây thơ" nhất

> **Hỏi:** "Làm sao xóa duplicates trong mảng sorted?"

**Cách 1: Tạo mảng mới (vi phạm yêu cầu)**

```
Input: [1, 1, 2]

Bước 1: Tạo mảng mới []
Bước 2: Duyệt nums, thêm vào nếu chưa có
  [1] → thêm 1 → [1]
  [1] → đã có 1 → skip
  [2] → thêm 2 → [1, 2]
  
→ Result: [1, 2], k=2 ✓
```

**⚠️ Nhược điểm:**
```javascript
function removeDuplicates(nums) {
  const unique = [];
  for (const num of nums) {
    if (!unique.includes(num)) {  // ❌ O(n) mỗi lần!
      unique.push(num);
    }
  }
  nums = unique;  // ❌ Tạo mảng mới!
  return unique.length;
}
// → Vi phạm yêu cầu: dùng extra array
```

---

#### Bước 2: Tối ưu - Dùng Set

> **Aha moment #1:**
> "Set tự động loại bỏ duplicates!"
> "Nhưng... vẫn tạo mảng mới"

**Cách 2: Set**
```javascript
function removeDuplicates(nums) {
  nums = [...new Set(nums)];  // ❌ Tạo Set rồi spread
  return nums.length;
}
// → Vi phạm: dùng extra memory cho Set
```

---

#### Bước 3: Nhận ra pattern - Two Pointers!

> **Aha moment #2:**
> "Mảng đã SORTED!"
> "→ Duplicates luôn NẰM LIỀN NHAU!"
> "→ Em chỉ cần kiểm tra nums[i] với nums[i-1]!"

> **Aha moment #3:**
> "Dùng 2 pointers:"
> "- Pointer `i`: duyệt tất cả phần tử"
> "- Pointer `j`: ghi phần tử không trùng"

```
Luồng tư duy:
┌─────────────────────────────────────────────────────┐
│ Input: [1, 1, 1, 2, 2, 3]                          │
│                                                       │
│ i duyệt: 1, 1, 1, 2, 2, 3                        │
│ j ghi:   1, 2, 3                                   │
│                                                       │
│ nums[i] != nums[i-1] → là unique!                  │
│ → Ghi vào vị trí j                                 │
│ → j++                                               │
└─────────────────────────────────────────────────────┘
```

---

#### Bước 4: Validate intuition bằng ví dụ chi tiết

**Ví dụ: [1, 1, 2, 3, 3, 4]**

```
┌─────────────────────────────────────────────────────────────────┐
│ Bước 1: Khởi tạo                                              │
│   j = 0 (pointer ghi)                                         │
│                                                                 │
│ i=0: nums[0] = 1                                              │
│   → i=0 → không có nums[i-1], ghi trực tiếp                 │
│   → nums[0] = 1, j = 1                                        │
│   → nums = [1, 1, 2, 3, 3, 4]                                │
│                                                                 │
│ i=1: nums[1] = 1                                              │
│   → nums[1] == nums[0] → TRÙNG! → skip                        │
│                                                                 │
│ i=2: nums[2] = 2                                              │
│   → nums[2] != nums[1] → 2 != 1 → UNIQUE!                  │
│   → nums[j] = nums[2] → nums[1] = 2                          │
│   → j = 2                                                     │
│   → nums = [1, 2, 2, 3, 3, 4]                                │
│                                                                 │
│ i=3: nums[3] = 3                                              │
│   → nums[3] != nums[2] → 3 != 2 → UNIQUE!                  │
│   → nums[j] = nums[3] → nums[2] = 3                          │
│   → j = 3                                                     │
│   → nums = [1, 2, 3, 3, 3, 4]                                │
│                                                                 │
│ i=4: nums[4] = 3                                              │
│   → nums[4] == nums[3] → TRÙNG! → skip                        │
│                                                                 │
│ i=5: nums[5] = 4                                              │
│   → nums[5] != nums[4] → 4 != 3 → UNIQUE!                  │
│   → nums[j] = nums[5] → nums[3] = 4                          │
│   → j = 4                                                     │
│   → nums = [1, 2, 3, 4, 3, 4]                                │
│                                                                 │
│ Kết thúc: j = 4 → Có 4 phần tử unique!                      │
│ → return 4 ✓                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Ví dụ 2: [1, 1, 1]**

```
┌─────────────────────────────────────────────────────────────────┐
│ i=0: nums[0] = 1 → ghi → j = 1                               │
│ i=1: nums[1] == nums[0] → TRÙNG! → skip                        │
│ i=2: nums[2] == nums[1] → TRÙNG! → skip                        │
│ → j = 1                                                        │
│ → return 1 ✓                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

#### Bước 5: Xác định edge cases

```
Edge Case 1: nums = [1]
  → i=0 → ghi → j=1
  → return 1 ✓

Edge Case 2: nums = [1, 1]
  → i=0 → ghi → j=1
  → i=1 → trùng → skip
  → return 1 ✓

Edge Case 3: nums = [1, 2]
  → i=0 → ghi → j=1
  → i=1 → 2 != 1 → ghi → j=2
  → return 2 ✓

Edge Case 4: nums = []
  → return 0 ✓

Edge Case 5: nums = [1, 1, 2, 2, 3]
  → j = 3 unique elements
  → return 3 ✓
```

---

### 🔑 3. Key Insight (Điều mấu chốt)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Mảng đã SORTED = Duplicates NẰM LIỀN NHAU"  │
│   → Chỉ cần so sánh với phần tử TRƯỚC!         │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "2 Pointers: i GHI, j ĐỌC"                    │
│   → i duyệt tất cả                               │
│   → j ghi phần tử không trùng                   │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "nums[i] != nums[i-1] → UNIQUE!"              │
│   → Không trùng với phần tử trước = unique     │
│                                                     │
│   KEY INSIGHT #4:                                   │
│   "Modify trực tiếp trên mảng"                  │
│   → nums[j] = nums[i]                           │
│   → Không tạo mảng mới!                         │
│                                                     │
│   KEY INSIGHT #5:                                  │
│   "Return j = số phần tử unique"               │
│   → j là vị trí ghi tiếp theo                  │
│   → = số phần tử đã ghi                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls (Lỗi hay mắc)

```javascript
// ❌ Pitfall 1: Tạo mảng mới (vi phạm yêu cầu)
function removeDuplicatesWrong(nums) {
  return [...new Set(nums)].length;  // ❌ Tạo Set!
}

// ✅ Đúng: Modify trực tiếp
function removeDuplicates(nums) {
  let j = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i === 0 || nums[i] !== nums[i - 1]) {
      nums[j] = nums[i];
      j++;
    }
  }
  return j;
}

// ❌ Pitfall 2: Quên check i === 0
function removeDuplicatesWrong2(nums) {
  let j = 0;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== nums[i - 1]) {  // ❌ i=0 → nums[-1] = undefined!
      nums[j] = nums[i];
      j++;
    }
  }
  return j;
}

// ✅ Đúng: Check i === 0
if (i === 0 || nums[i] !== nums[i - 1])

// ❌ Pitfall 3: Nhầm i và j
// i = pointer đọc/duyệt (FOR LOOP)
// j = pointer ghi
// → LUÔN dùng nums[i] khi so sánh
// → LUÔN ghi vào nums[j]

// ❌ Pitfall 4: Dùng while thay vì for
// for loop đảm bảo duyệt đúng tất cả
// while cần careful với index management
```

---

### 🔄 5. Các hướng tiếp cận (So sánh)

#### 🔹 Cách 1: Set (Vi phạm yêu cầu)

```javascript
function removeDuplicates(nums) {
  const unique = [...new Set(nums)];
  nums.length = 0;
  unique.forEach(num => nums.push(num));
  return unique.length;
}
```

**📊 Phân tích:**
```
Time:  O(n)
Space: O(n) — dùng Set!
```

**⚠️ Nhược điểm:**
- Vi phạm yêu cầu: dùng extra memory

---

#### 🔹 Cách 2: Two Pointers (O(n), O(1)) ⭐ **TỐI ƯU**

```javascript
function removeDuplicates(nums) {
  if (nums.length === 0) return 0;
  
  let j = 0;
  
  for (let i = 0; i < nums.length; i++) {
    if (i === 0 || nums[i] !== nums[i - 1]) {
      nums[j] = nums[i];
      j++;
    }
  }
  
  return j;
}
```

**📊 Phân tích:**
```
Time:  O(n) — duyệt 1 lần
Space: O(1) — không dùng extra memory
```

**✅ Ưu điểm:**
- Không dùng extra memory
- Modify trực tiếp trên mảng
- Fast và memory efficient

---

### 🚀 6. Visual Walkthrough

```
Input: [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]

┌─────────────────────────────────────────────────────────────────┐
│ i=0, j=0: nums[0]=0                                            │
│   i===0 → ghi                                                  │
│   nums[0]=0, j=1                                                │
│   Array: [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]                     │
│                                                                 │
│ i=1, j=1: nums[1]=0                                            │
│   0 === 0 (nums[0]) → TRÙNG → skip                            │
│                                                                 │
│ i=2, j=1: nums[2]=1                                            │
│   1 !== 0 → UNIQUE                                             │
│   nums[1]=1, j=2                                               │
│   Array: [0, 1, 1, 1, 1, 2, 2, 3, 3, 4]                      │
│                                                                 │
│ i=3, j=2: nums[3]=1                                            │
│   1 === 1 → TRÙNG → skip                                       │
│                                                                 │
│ i=4, j=2: nums[4]=1                                            │
│   1 === 1 → TRÙNG → skip                                       │
│                                                                 │
│ i=5, j=2: nums[5]=2                                            │
│   2 !== 1 → UNIQUE                                             │
│   nums[2]=2, j=3                                               │
│   Array: [0, 1, 2, 1, 1, 2, 2, 3, 3, 4]                      │
│                                                                 │
│ i=6, j=3: nums[6]=2                                            │
│   2 === 2 → TRÙNG → skip                                       │
│                                                                 │
│ i=7, j=3: nums[7]=3                                            │
│   3 !== 2 → UNIQUE                                             │
│   nums[3]=3, j=4                                               │
│   Array: [0, 1, 2, 3, 1, 2, 2, 3, 3, 4]                      │
│                                                                 │
│ i=8, j=4: nums[8]=3                                            │
│   3 === 3 → TRÙNG → skip                                       │
│                                                                 │
│ i=9, j=4: nums[9]=4                                            │
│   4 !== 3 → UNIQUE                                             │
│   nums[4]=4, j=5                                               │
│   Array: [0, 1, 2, 3, 4, 2, 2, 3, 3, 4]                      │
│                                                                 │
│ Loop kết thúc → j = 5                                          │
│ → return 5 ✓                                                   │
│                                                                 │
│ First 5 elements: [0, 1, 2, 3, 4] ✓                         │
└─────────────────────────────────────────────────────────────────┘
```

---

### 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Remove Duplicates II (LeetCode 80)
// Giữ mỗi phần tử tối đa 2 lần
function removeDuplicatesII(nums) {
  if (nums.length <= 2) return nums.length;
  
  let j = 2;  // Bắt đầu từ vị trí 2
  
  for (let i = 2; i < nums.length; i++) {
    if (nums[i] !== nums[j - 2]) {
      nums[j] = nums[i];
      j++;
    }
  }
  return j;
}

// Variation 2: Remove Element (LeetCode 27)
// Xóa tất cả occurrences của một giá trị
function removeElement(nums, val) {
  let j = 0;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== val) {
      nums[j] = nums[i];
      j++;
    }
  }
  return j;
}

// Variation 3: Move Zeros (LeetCode 283)
// Di chuyển tất cả zeros về cuối
function moveZeros(nums) {
  let j = 0;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== 0) {
      nums[j] = nums[i];
      j++;
    }
  }
  for (let i = j; i < nums.length; i++) {
    nums[i] = 0;
  }
}

// Variation 4: Merge Sorted Array in-place
// Gộp 2 mảng sorted
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Remove Duplicates from Sorted Array
 * 
 * Ý tưởng: Two Pointers
 * - i: duyệt tất cả phần tử
 * - j: ghi phần tử không trùng
 * - nums[i] != nums[i-1] → unique
 * 
 * Time: O(n) | Space: O(1)
 * 
 * @param {number[]} nums
 * @return {number}
 */
var removeDuplicates = function(nums) {
  if (nums.length === 0) return 0;
  
  let j = 0;
  
  for (let i = 0; i < nums.length; i++) {
    if (i === 0 || nums[i] !== nums[i - 1]) {
      nums[j] = nums[i];
      j++;
    }
  }
  
  return j;
};
```

---

## 🧪 Test Cases

```javascript
// Test 1
const nums1 = [1, 1, 2];
console.log(removeDuplicates(nums1)); // 2
console.log(nums1.slice(0, 2)); // [1, 2] ✓

// Test 2
const nums2 = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4];
console.log(removeDuplicates(nums2)); // 5
console.log(nums2.slice(0, 5)); // [0, 1, 2, 3, 4] ✓

// Test 3: All same
const nums3 = [1, 1, 1];
console.log(removeDuplicates(nums3)); // 1
console.log(nums3.slice(0, 1)); // [1] ✓

// Test 4: No duplicates
const nums4 = [1, 2, 3, 4];
console.log(removeDuplicates(nums4)); // 4 ✓

// Test 5: Empty
const nums5 = [];
console.log(removeDuplicates(nums5)); // 0 ✓

// Test 6: Single element
const nums6 = [1];
console.log(removeDuplicates(nums6)); // 1 ✓
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Two Pointers trên sorted array

💡 KEY INSIGHT:
   "Mảng sorted → duplicates nằm liền nhau"
   "i GHI, j ĐỌC"
   "nums[i] != nums[i-1] → unique"

⚠️ PITFALLS:
   - Check i === 0 trước khi so sánh
   - Không tạo mảng mới
   - i = pointer duyệt, j = pointer ghi

🔄 VARIATIONS:
   - Keep at most K duplicates
   - Remove specific value
   - Move zeros

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Bài tiếp theo

[Bài 7: 3Sum](./007-3sum.md)
