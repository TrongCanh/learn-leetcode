# #217 - Contains Duplicate

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | Array, Hash Table, Sorting |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/contains-duplicate/

---

## 📖 Đề bài

### Mô tả
Cho một mảng số nguyên `nums`, trả về `true` nếu có **ít nhất một giá trị xuất hiện từ 2 lần trở lên**, ngược lại trả về `false`.

### Ví dụ

**Example 1:**
```
Input:  nums = [1, 2, 3, 1]
Output: true
```

**Example 2:**
```
Input:  nums = [1, 2, 3, 4]
Output: false
```

**Example 3:**
```
Input:  nums = [1, 1, 1, 3, 3, 4, 3, 2, 4, 2]
Output: true
```

### Constraints
```
1 <= nums.length <= 10^5
-10^9 <= nums[i] <= 10^9
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Có giá trị nào xuất hiện ≥ 2 lần không?
Trả về: Boolean (true/false)
Không cần: Vị trí, số lần xuất hiện, giá trị nào
```

---

### 🤔 2. Tư duy từng bước (Step-by-step)

#### Bước 1: Nghĩ đến cách "ngây thơ" nhất

> **Hỏi:** "Cách nào dễ nhất để kiểm tra duplicate?"

**Trả lời:** So sánh mỗi phần tử với tất cả phần tử khác.

```
[1, 2, 3, 1]
So sánh:
  1 với [2, 3, 1] → có 1 ✓ → DUPLICATE
```

**→ Nested Loop: O(n²) — quá chậm cho n=10^5**

---

#### Bước 2: Nhận ra vấn đề + "Aha moment!"

> **Aha moment:**
> "Em chỉ cần biết: giá trị này ĐÃ THẤY chưa?"
> "Giống như kiểm tra trùng tên trong lớp — ai đã điểm danh rồi thì không cần điểm danh lại!"

**→ Dùng SET để nhớ những giá trị đã thấy!**

```
Nếu gặp giá trị đã có trong Set → DUPLICATE!
```

---

#### Bước 3: Validate intuition bằng ví dụ

```
nums = [1, 2, 3, 1]

i=0: num=1
     Set={} → 1 chưa có → Set={1}          ✓ không duplicate

i=1: num=2
     Set={1} → 2 chưa có → Set={1,2}      ✓ không duplicate

i=2: num=3
     Set={1,2} → 3 chưa có → Set={1,2,3}  ✓ không duplicate

i=3: num=1
     Set={1,2,3} → 1 ĐÃ CÓ! → RETURN TRUE  ✗ duplicate!

→ Kết quả: true ✓
```

---

#### Bước 4: Xác định edge cases

```
Edge Case 1: [1] → Set={1} → không duplicate → false
Edge Case 2: [1, 1] → 1 đã có → true
Edge Case 3: [1, 2] → 1, 2 khác nhau → false
Edge Case 4: [1, 1, 1, 1] → 1 đã có từ lần 2 → true
```

---

### 🔑 3. Key Insight (Điều mấu chốt)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Duplicate = Đã thấy trước đó"                   │
│   → Dùng Hash Set để nhớ "đã thấy"               │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Set chỉ chứa unique values"                    │
│   → new Set(nums).size < nums.length → duplicate  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls (Lỗi hay mắc)

```javascript
// ❌ Pitfall 1: Nhầm lẫn giữa Set và Array
const set = [];  // ❌ Đây là Array!
if (set.has(num))  // ❌ Array không có method has()!
if (set.includes(num))  // ✓ Đúng cho Array, nhưng O(n)
const set = new Set();  // ✓ Đúng cho Set, O(1)

// ❌ Pitfall 2: Thêm vào Set TRƯỚC khi kiểm tra
for (const num of nums) {
  set.add(num);         // ❌ Thêm trước
  if (set.has(num))     // → Lúc này luôn có!
    return true;
}

// ✅ Đúng: Kiểm tra TRƯỚC khi thêm
for (const num of nums) {
  if (set.has(num))     // ✓ Kiểm tra trước
    return true;
  set.add(num);         // Thêm sau khi confirm không trùng
}

// ❌ Pitfall 3: Dùng Set vs Map sai mục đích
// Contains Duplicate chỉ cần Set (không cần value)
// Nếu cần đếm frequency → dùng Map
```

---

### 🔄 5. Các hướng tiếp cận (So sánh)

#### 🔹 Cách 1: Brute Force - Nested Loop (O(n²))

```javascript
function containsDuplicate(nums) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] === nums[j]) return true;
    }
  }
  return false;
}
```

**📊 Phân tích:**
```
Time:  O(n²) — 10^5 elements = ~5 tỷ comparisons → CHẬM!
Space: O(1) — không dùng thêm bộ nhớ
```

**🔍 Tại sao chậm?**
```
n=4: [1,2,3,1]
i=0: so sánh với [2,3,1] → 3 comparisons
i=1: so sánh với [3,1]   → 2 comparisons
i=2: so sánh với [1]     → 1 comparison
Tổng: 3+2+1 = 6 = n(n-1)/2 = O(n²)

n=10: 45 comparisons
n=100: 4,950 comparisons
n=10^5: ~5 tỷ comparisons → > 1 phút!
```

---

#### 🔹 Cách 2: Sorting (O(n log n))

```javascript
function containsDuplicate(nums) {
  nums.sort((a, b) => a - b);
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === nums[i - 1]) return true;
  }
  return false;
}
```

**📊 Phân tích:**
```
Time:  O(n log n) — nhanh hơn O(n²) nhưng vẫn có sort
Space: O(1) hoặc O(n) tùy implementation
```

**🔍 Tại sao hoạt động?**
```
Trước sort: [3, 1, 2, 1]
Sau sort:   [1, 1, 2, 3]
            [1, 1] ↑↑ → Duplicate!

→ Duplicates luôn nằm cạnh nhau sau khi sort
→ Chỉ cần so sánh 2 phần tử liền kề
```

**⚠️ Nhược điểm:**
- Sort tốn thời gian (O(n log n))
- Mutate mảng gốc (nếu không copy trước)

---

#### 🔹 Cách 3: Hash Set (O(n)) ⭐ **TỐI ƯU**

```javascript
function containsDuplicate(nums) {
  const seen = new Set();

  for (const num of nums) {
    if (seen.has(num)) return true;  // Đã thấy → duplicate!
    seen.add(num);                    // Chưa thấy → thêm vào
  }

  return false;
}
```

**📊 Phân tích:**
```
Time:  O(n) — chỉ 1 pass duyệt mảng
Space: O(n) — Set lưu tối đa n phần tử
```

**🔍 Tại sao O(1) lookup?**
```
Hash Set dùng hash function:
  num = 1 → hash(1) = 3 → kiểm tra bucket[3] → O(1)
  num = 999 → hash(999) = 7 → kiểm tra bucket[7] → O(1)

→ Average O(1), worst case O(n) (hash collision nhiều)
```

**✅ Ưu điểm:**
- Nhanh nhất O(n)
- Code đơn giản
- Phổ biến trong interview

---

### 🚀 6. Visual Walkthrough (One-liner trick)

```javascript
// One-liner với Set
return new Set(nums).size !== nums.length;

// Giải thích:
// Set tự động loại bỏ duplicates
// [1,2,3,1] → Set {1,2,3} → size = 3
// nums.length = 4
// 3 !== 4 → true → duplicate!

// [1,2,3,4] → Set {1,2,3,4} → size = 4
// nums.length = 4
// 4 !== 4 → false → không duplicate!
```

---

### 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Đếm số duplicates
function countDuplicates(nums) {
  return nums.length - new Set(nums).size;
}

// Variation 2: Tìm giá trị duplicate đầu tiên
function findFirstDuplicate(nums) {
  const seen = new Set();
  for (const num of nums) {
    if (seen.has(num)) return num;  // Trả về giá trị, không phải boolean
    seen.add(num);
  }
  return -1;
}

// Variation 3: Contains Duplicate III (LeetCode 220)
// Kiểm tra có 2 số cách nhau ≤ k và ≤ t
// → Dùng Bucket Sort hoặc TreeSet
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Contains Duplicate - Hash Set Approach
 * Time: O(n) | Space: O(n)
 */
var containsDuplicate = function(nums) {
  const seen = new Set();

  for (const num of nums) {
    if (seen.has(num)) return true;
    seen.add(num);
  }

  return false;
};

// Hoặc one-liner:
var containsDuplicate = function(nums) {
  return new Set(nums).size !== nums.length;
};
```

---

## 🧪 Test Cases

```javascript
// Test 1
console.log(containsDuplicate([1, 2, 3, 1])); // true

// Test 2
console.log(containsDuplicate([1, 2, 3, 4])); // false

// Test 3
console.log(containsDuplicate([1, 1, 1, 3, 3, 4, 3, 2, 4, 2])); // true

// Test 4 - Edge: 1 element
console.log(containsDuplicate([1])); // false

// Test 5 - Edge: 2 same
console.log(containsDuplicate([1, 1])); // true

// Test 6 - Edge: 2 different
console.log(containsDuplicate([1, 2])); // false

// Test 7 - Edge: All same
console.log(containsDuplicate([1, 1, 1, 1])); // true

// Test 8 - Negative numbers
console.log(containsDuplicate([-1, -2, -3, -1])); // true

// Test 9 - Large range
console.log(containsDuplicate([10^9, 10^9-1, 10^9-2])); // false
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm: ...
Thời gian làm: ... phút
Điểm khó: ...

PATTERN: Hash Set cho duplicate detection

💡 KEY INSIGHT:
   "Duplicate = Đã thấy trước đó"
   → Dùng Set.has() để kiểm tra O(1)

⚠️ PITFALLS:
   - Kiểm tra TRƯỚC khi thêm vào Set
   - Dùng Set, không phải Array

🔄 VARIATIONS:
   - Count duplicates: nums.length - set.size
   - Find first duplicate: return value instead of boolean

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Bài tiếp theo

[Bài 2: Valid Anagram](./002-valid-anagram.md)
