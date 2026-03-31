# #1 - Two Sum

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | Array, Hash Table |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/two-sum/

---

## 📖 Đề bài

### Mô tả
Cho một mảng số nguyên `nums` và một số nguyên `target`, trả về **chỉ số (indices)** của 2 số sao cho tổng bằng `target`.

**Giả định:** Mỗi input có đúng 1 solution, và không dùng cùng 1 phần tử 2 lần.

### Ví dụ

**Example 1:**
```
Input:  nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
```

**Example 2:**
```
Input:  nums = [3, 2, 4], target = 6
Output: [1, 2]
```

**Example 3:**
```
Input:  nums = [3, 3], target = 6
Output: [0, 1]
```

### Constraints
```
2 <= nums.length <= 10^4
-10^9 <= nums[i] <= 10^9
-10^9 <= target <= 10^9
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Tìm 2 số có tổng = target
Trả về: Indices (vị trí), không phải giá trị
Constraint: Mỗi phần tử chỉ dùng 1 lần
```

---

### 🤔 2. Tư duy từng bước (Step-by-step)

#### Bước 1: Nghĩ đến cách "ngây thơ" nhất

> **Hỏi:** "Làm sao tìm được 2 số có tổng = target?"

**Nested Loop:** Với mỗi i, duyệt tất cả j phía sau, kiểm tra nums[i] + nums[j] === target

```
nums = [2, 7, 11, 15], target = 9

i=0 (2): kiểm tra với [7, 11, 15]
  2+7=9 ✓ → return [0, 1]

→ O(n²) nhưng đúng!
```

---

#### Bước 2: "Aha moment!"

> **Aha moment:**
> "Thay vì tìm j cho mỗi i, em hỏi ngược:
> 'Với nums[i] hiện tại, em CẦN số nào để có tổng = target?'
>
> Cần = target - nums[i] = 9 - 2 = 7
>
> → Em chỉ cần kiểm tra: '7 đã có trong mảng chưa?'"

**→ Complement = target - nums[i]**

```
nums = [2, 7, 11, 15], target = 9

i=0: num=2, complement=9-2=7
     → "Cần 7 để có tổng = 9"
     → 7 có trong mảng (index 1) ✓ → return [0, 1]
```

---

#### Bước 3: Validate intuition bằng ví dụ chi tiết

```
nums = [3, 2, 4], target = 6

Cách 1 (Brute Force):
  i=0: 3+2=5 ✗, 3+4=7 ✗
  i=1: 2+4=6 ✓ → return [1, 2]
  → 2 passes qua mảng

Cách 2 (Hash Map):
  i=0: num=3, complement=3
       → Cần 3 → chưa thấy → lưu {3:0}
  i=1: num=2, complement=4
       → Cần 4 → chưa thấy → lưu {3:0, 2:1}
  i=2: num=4, complement=2
       → Cần 2 → ĐÃ THẤY tại index 1! → return [1, 2] ✓

→ Chỉ 1 pass!
```

---

#### Bước 4: Xác định edge cases

```
Edge 1: [3, 3], target=6
  i=0: num=3, complement=3 → chưa thấy → {3:0}
  i=1: num=3, complement=3 → ĐÃ THẤY tại index 0! → return [0, 1] ✓

Edge 2: Có số âm [-1, 2, 3], target=2
  i=0: num=-1, complement=3 → chưa thấy
  i=1: num=2, complement=0 → chưa thấy
  i=2: num=3, complement=-1 → ĐÃ THẤY! → return [0, 2] ✓

Edge 3: Nhiều cặp thỏa mãn [1, 2, 3, 4], target=5
  → 1+4=5, 2+3=5
  → Trả về pair đầu tiên tìm được → [0, 3] hoặc [1, 2]
```

---

### 🔑 3. Key Insight (Điều mấu chốt)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Tìm complement = target - num[i]"              │
│   → Thay vì tìm j cho i, hỏi ngược              │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Hash Map cho O(1) lookup"                       │
│   → Map lưu: value → index                        │
│   → Kiểm tra complement có trong map không       │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "CHECK TRƯỚC, ADD SAU"                         │
│   → Kiểm tra trước khi thêm vào map              │
│   → Tránh tìm thấy chính nó                      │
│                                                     │
│   KEY INSIGHT #4:                                   │
│   "One pass thay vì two passes"                   │
│   → Vừa kiểm tra vừa thêm trong 1 loop          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls (Lỗi hay mắc)

```javascript
// ❌ Pitfall 1: THÊM vào map TRƯỚC khi kiểm tra
function twoSumWrong(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    map.set(nums[i], i);          // ← Thêm trước
    const complement = target - nums[i];
    if (map.has(complement)) {    // → Lúc này map có chính nó!
      return [map.get(complement), i];
    }
  }
  return [];
}

// Ví dụ: [3, 3], target=6
// i=0: map.set(3,0), complement=3, map.has(3)=true → return [0, 0] ❌
// → Sai! Cùng 1 phần tử, không phải 2 phần tử khác nhau

// ✅ Đúng: KIỂM TRA TRƯỚC, THÊM SAU
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {    // ← Kiểm tra trước
      return [map.get(complement), i];
    }
    map.set(nums[i], i);          // ← Thêm sau
  }
  return [];
}

// ❌ Pitfall 2: Dùng Array thay vì Map
function twoSumArray(nums, target) {
  const arr = [];
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    const index = arr.indexOf(complement); // ❌ O(n) lookup!
    if (index !== -1) return [index, i];
    arr.push(nums[i]);
  }
  return [];
}
// → O(n²) thay vì O(n)!

// ✅ Đúng: Dùng Map
const map = new Map(); // O(1) lookup

// ❌ Pitfall 3: Quên handle không tìm thấy
function twoSumNoReturn(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  // ❌ Không return gì khi không tìm thấy
  // → Function return undefined!
}
// ✅ Thêm return []
```

---

### 🔄 5. Các hướng tiếp cận (So sánh)

#### 🔹 Cách 1: Brute Force (O(n²))

```javascript
function twoSum(nums, target) {
  for (let i = 0; i < nums.length - 1; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}
```

**📊 Phân tích:**
```
Time:  O(n²) — n(n-1)/2 comparisons
Space: O(1) — không dùng thêm bộ nhớ
```

**🔍 Tại sao chậm?**
```
n=4: i=0 → j=[1,2,3], i=1 → j=[2,3], i=2 → j=[3]
     = 3+2+1 = 6 comparisons = n(n-1)/2

n=10^4: ~50 triệu comparisons → > 1 giây
```

---

#### 🔹 Cách 2: Two Pass Hash Map (O(n))

```javascript
function twoSum(nums, target) {
  // Pass 1: Lưu tất cả vào map
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    map.set(nums[i], i);
  }

  // Pass 2: Tìm complement
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement) && map.get(complement) !== i) {
      return [map.get(complement), i];
    }
  }
  return [];
}
```

**📊 Phân tích:**
```
Time:  O(n) — 2 passes
Space: O(n) — Map lưu n elements
```

**⚠️ Nhược điểm:**
- 2 passes (vẫn O(n) nhưng có thể tốt hơn)

---

#### 🔹 Cách 3: One Pass Hash Map (O(n)) ⭐ **TỐI ƯU**

```javascript
function twoSum(nums, target) {
  const map = new Map();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];

    if (map.has(complement)) {
      return [map.get(complement), i];
    }

    map.set(nums[i], i);
  }

  return [];
}
```

**📊 Phân tích:**
```
Time:  O(n) — 1 pass
Space: O(n) — Map lưu tối đa n-1 elements
```

**🔍 Step-by-step với example:**
```
nums = [2, 7, 11, 15], target = 9

i=0: num=2, complement=7
     map={} → has(7)? NO
     → set(2, 0)
     map = {2: 0}

i=1: num=7, complement=2
     map={2:0} → has(2)? YES! → return [0, 1] ✓

→ Chỉ 2 iterations!
```

---

### 🚀 6. Visual Walkthrough (One Pass)

```
nums = [2, 7, 11, 15], target = 9

┌──────────────────────────────────────────────────────────┐
│ Loop i=0: num=2                                          │
│   complement = 9 - 2 = 7                                  │
│   Map: {}                                                 │
│   has(7)? NO                                              │
│   → Map ← {2: 0}                                         │
│                                                          │
│ Loop i=1: num=7                                          │
│   complement = 9 - 7 = 2                                  │
│   Map: {2: 0}                                            │
│   has(2)? YES! (tại index 0)                             │
│   → FOUND! return [0, 1]                                  │
└──────────────────────────────────────────────────────────┘

Map state:
  {}        → {2:0}     → {2:0, 7:1} → {2:0, 7:1, 11:2} → {2:0, 7:1, 11:2, 15:3}
  (empty)      (add 2)     (add 7)       (add 11)            (add 15)

Found at iteration 2 → O(n/2) = O(n) ✓
```

---

### 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Two Sum II - Input array is sorted (LeetCode 167)
// → Dùng Two Pointers thay vì Hash Map

// Variation 2: Two Sum III - Data structure design (LeetCode 170)
// → Cần hỗ trợ add và find

// Variation 3: 3Sum (LeetCode 15)
// → Tìm 3 số có tổng = 0
// → Fix 1 số, dùng Two Sum cho 2 số còn lại

// Variation 4: 4Sum (LeetCode 18)
// → Tìm 4 số có tổng = target

// Variation 5: Two Sum Less than K (LeetCode 1099)
// → Tìm max sum < K
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Two Sum - One Pass Hash Map
 * Time: O(n) | Space: O(n)
 */
var twoSum = function(nums, target) {
  const map = new Map();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];

    if (map.has(complement)) {
      return [map.get(complement), i];
    }

    map.set(nums[i], i);
  }

  return [];
};
```

---

## 🧪 Test Cases

```javascript
// Test 1
console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]

// Test 2
console.log(twoSum([3, 2, 4], 6)); // [1, 2]

// Test 3
console.log(twoSum([3, 3], 6)); // [0, 1]

// Test 4 - Số âm
console.log(twoSum([-1, -2, -3, -4, -5], -8)); // [2, 4]

// Test 5 - Target âm
console.log(twoSum([1, 2, 3], -1)); // []

// Test 6 - Nhiều kết quả
console.log(twoSum([1, 2, 3, 4, 5], 6));
// Có thể là [0, 5] (1+5) hoặc [1, 4] (2+4) hoặc [2, 3] (3+3)

// Test 7 - Số 0
console.log(twoSum([0, 4, 3, 0], 0)); // [0, 3]
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm: ...
Thời gian làm: ... phút
Điểm khó: ...

PATTERN: Hash Map với Complement

💡 KEY INSIGHT:
   "Tìm complement = target - num[i]"
   → "Cần số nào để có tổng = target?"

⚠️ PITFALLS:
   - KIỂM TRA TRƯỚC, THÊM SAU
   - Dùng Map cho O(1) lookup, không dùng Array.indexOf()

🔄 VARIATIONS:
   - Sorted array → Two Pointers
   - 3Sum → Fix 1, Two Sum 2
   - Data structure design → add() + find()

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Bài tiếp theo

[Bài 4: Group Anagrams](./004-group-anagrams.md)
