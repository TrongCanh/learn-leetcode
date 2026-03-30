# #238 - Product of Array Except Self

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Array, Prefix Sum |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/product-of-array-except-self/

---

## 📖 Đề bài

Cho mảng `nums`, trả về `answer` trong đó `answer[i] = tích của tất cả TRỪ `nums[i]`.

**Yêu cầu:** O(n) time, **không dùng phép chia**.

### Ví dụ

```
Input:  nums = [1, 2, 3, 4]
Output: [24, 12, 8, 6]
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài

```
Hỏi: answer[i] = product of ALL elements TRỪ nums[i]
Trả về: Array
Constraint: Không dùng phép chia!
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Nghĩ đến cách "ngây thơ"

```
nums = [1, 2, 3, 4]
answer[0] = 2 * 3 * 4 = 24
answer[1] = 1 * 3 * 4 = 12
...

→ Nested loop: O(n²) — CHẬM!
```

---

#### Bước 2: Nhận ra pattern

```
answer[i] = (1 * 2 * ... * nums[i-1]) * (nums[i+1] * ... * 4)
           = PREFIX[i-1] * SUFFIX[i+1]
```

---

#### Bước 3: "Aha moment!"

> **Aha moment:**
> "Tính tích TẤT CẢ trước, rồi CHIA cho nums[i]!"
>
> "NHƯNG... đề bài không cho dùng chia!"
>
> "→ Đổi cách: Tính PREFIX và SUFFIX riêng!"
>
> **Prefix[i] = tích của tất cả TRƯỚC i**
> **Suffix[i] = tích của tất cả SAU i**
> **answer[i] = Prefix[i] * Suffix[i]**

```
nums = [1, 2, 3, 4]

Prefix:
  prefix[0] = 1           (không có phần tử trước)
  prefix[1] = 1 * 2 = 2
  prefix[2] = 1 * 2 * 3 = 6
  prefix[3] = 1 * 2 * 3 * 4 = 24

Suffix:
  suffix[3] = 1           (không có phần tử sau)
  suffix[2] = 4
  suffix[1] = 4 * 3 = 12
  suffix[0] = 4 * 3 * 2 = 24

Answer[i] = prefix[i-1] * suffix[i+1]:
  answer[0] = 1 * (2*3*4) = 24 ✓
  answer[1] = 1 * (3*4) = 12 ✓
  answer[2] = (1*2) * 4 = 8 ✓
  answer[3] = (1*2*3) * 1 = 6 ✓
```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "answer[i] = LEFT products * RIGHT products"   │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Prefix[i] = product of all BEFORE i"          │
│   "Suffix[i] = product of all AFTER i"           │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Tính prefix & suffix trong O(n)"             │
│   "Không cần division!"                           │
│                                                     │
│   KEY INSIGHT #4:                                   │
│   "Tối ưu: dùng chính result array làm prefix"│
│   "Suffix chỉ cần 1 biến!"                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Dùng division (không được phép!)
function productExceptSelfDiv(nums) {
  const total = nums.reduce((a, b) => a * b, 1);
  return nums.map(x => total / x);
  // → Sai vì không được dùng division!
  // → Gặp 0 → Infinity
}

// ❌ Pitfall 2: Quên base case cho prefix/suffix
// prefix[0] phải = 1 (không có phần tử trước)
// suffix[n-1] phải = 1 (không có phần tử sau)

// ❌ Pitfall 3: Nhầm index
// prefix[i] = tích nums[0..i-1], không phải nums[0..i]
```

---

### 🔄 5. Các hướng tiếp cận

#### 🔹 Cách 1: Prefix + Suffix Arrays (O(n) time, O(n) space)

```javascript
function productExceptSelf(nums) {
  const n = nums.length;
  const prefix = new Array(n);
  const suffix = new Array(n);
  const result = new Array(n);

  // Prefix
  prefix[0] = 1;
  for (let i = 1; i < n; i++) {
    prefix[i] = prefix[i - 1] * nums[i - 1];
  }

  // Suffix
  suffix[n - 1] = 1;
  for (let i = n - 2; i >= 0; i--) {
    suffix[i] = suffix[i + 1] * nums[i + 1];
  }

  // Result
  for (let i = 0; i < n; i++) {
    result[i] = prefix[i] * suffix[i];
  }

  return result;
}
```

**📊 Phân tích:**
```
Time:  O(n) — 3 passes
Space: O(n) — 3 arrays
```

---

#### 🔹 Cách 2: Space Optimization (O(n) time, O(1) space) ⭐ **TỐI ƯU**

```javascript
function productExceptSelf(nums) {
  const n = nums.length;
  const result = new Array(n);

  // 1. Prefix → lưu vào result
  result[0] = 1;
  for (let i = 1; i < n; i++) {
    result[i] = result[i - 1] * nums[i - 1];
  }

  // 2. Suffix → nhân vào result
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    result[i] *= suffix;  // prefix * suffix
    suffix *= nums[i];    // update suffix
  }

  return result;
}
```

**📊 Phân tích:**
```
Time:  O(n) — 2 passes
Space: O(1) — chỉ 1 biến suffix (không tính output array)
```

---

### 🚀 6. Visual Walkthrough

```
nums = [1, 2, 3, 4], n = 4

Pass 1: Prefix → result
  result[0] = 1
  result[1] = result[0] * nums[0] = 1 * 1 = 1
  result[2] = result[1] * nums[1] = 1 * 2 = 2
  result[3] = result[2] * nums[2] = 2 * 3 = 6
  → result = [1, 1, 2, 6]

Pass 2: Suffix (nhân vào result)
  suffix = 1
  i=3: result[3] *= 1 → 6 * 1 = 6
        suffix *= nums[3] → 1 * 4 = 4
  i=2: result[2] *= 4 → 2 * 4 = 8
        suffix *= nums[2] → 4 * 3 = 12
  i=1: result[1] *= 12 → 1 * 12 = 12
        suffix *= nums[1] → 12 * 2 = 24
  i=0: result[0] *= 24 → 1 * 24 = 24
        suffix *= nums[0] → 24 * 1 = 24

  → result = [24, 12, 8, 6] ✓
```

---

### 🎯 7. Biến thể

```javascript
// Variation 1: Có thể dùng division (không có constraint)
// total = product of all
// answer[i] = total / nums[i]
// ⚠️ Xử lý 0: nếu có 2 số 0 → answer có 0; 1 số 0 → chỉ 1 answer ≠ 0

// Variation 2: Left & Right Products (LeetCode 238)
// → Đây chính là bài này!
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Product Except Self - Space Optimization
 * Time: O(n) | Space: O(1)
 */
var productExceptSelf = function(nums) {
  const n = nums.length;
  const result = new Array(n);

  // 1. Prefix products
  result[0] = 1;
  for (let i = 1; i < n; i++) {
    result[i] = result[i - 1] * nums[i - 1];
  }

  // 2. Suffix products (multiply in-place)
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    result[i] *= suffix;
    suffix *= nums[i];
  }

  return result;
};
```

---

## 🧪 Test Cases

```javascript
console.log(productExceptSelf([1, 2, 3, 4])); // [24, 12, 8, 6]
console.log(productExceptSelf([-1, 1, 0, -3, 3])); // [0, 0, 9, 0, 0]
console.log(productExceptSelf([1, 2])); // [2, 1]
```

---

## 📝 Ghi chú

```
PATTERN: Prefix & Suffix Products

💡 KEY INSIGHT:
   "answer[i] = prefix[i] * suffix[i]"
   "Tính prefix trước, rồi nhân suffix"

⚠️ PITFALLS:
   - KHÔNG dùng division
   - prefix[0] = 1, suffix[n-1] = 1

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Bài tiếp theo

[Bài 7: Valid Sudoku](./007-valid-sudoku.md)
