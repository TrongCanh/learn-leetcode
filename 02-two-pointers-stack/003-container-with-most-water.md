# #11 - Container With Most Water

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Array, Two Pointers |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/container-with-most-water/

---

## 📖 Đề bài

### Mô tả
Cho một mảng `height` đại diện cho các đường thẳng đứng. Tìm **diện tích lớn nhất** của nước có thể chứa giữa 2 đường thẳng.

### Ví dụ

**Example 1:**
```
Input:  height = [1, 8, 6, 2, 5, 4, 8, 3, 7]
Output: 49
Giải thích: 
- Chọn line 1 (height=8) và line 8 (height=7)
- Width = 7 (indices cách nhau 7)
- Height = min(8, 7) = 7
- Area = 7 × 7 = 49
```

**Example 2:**
```
Input:  height = [1, 1]
Output: 1
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
│ Hỏi:  Diện tích nước lớn nhất giữa 2 đường?     │
│ Trả về: Diện tích (number)                         │
│                                                     │
│ Công thức: Area = width × height                   │
│   - width = khoảng cách indices (|j - i|)         │
│   - height = đường thấp hơn (min(height[i], height[j]))│
│                                                     │
│ ⚠️ Height bị giới hạn bởi đường THẤP HƠN!        │
└─────────────────────────────────────────────────────┘
```

---

### 🤔 2. Tư duy từng bước (Step-by-step)

#### Bước 1: Nghĩ đến cách "ngây thơ" nhất

> **Hỏi:** "Làm sao tìm được 2 đường tạo diện tích lớn nhất?"

**Cách 1: Kiểm tra tất cả các cặp**

```
Input: [1, 8, 6, 2, 5, 4, 8, 3, 7]

Bước 1: i=0, j=1 → area = 1 × 1 = 1
Bước 2: i=0, j=2 → area = 2 × 1 = 2
Bước 3: i=0, j=3 → area = 3 × 1 = 3
...
i=1, j=8 → area = 7 × min(8, 7) = 7 × 7 = 49 ✓ (max!)

→ Nested loop kiểm tra tất cả pairs
→ O(n²) - QUÁ CHẬM!
```

**⚠️ Nhược điểm:**
```javascript
function maxArea(height) {
  let max = 0;
  
  for (let i = 0; i < height.length; i++) {
    for (let j = i + 1; j < height.length; j++) {
      const width = j - i;
      const h = Math.min(height[i], height[j]);
      max = Math.max(max, width * h);
    }
  }
  
  return max;
}
// → O(n²) với n = 10^5 → ~5 tỷ operations → CHẬM!
```

---

#### Bước 2: Nhận ra pattern + "Aha moment!"

> **Aha moment #1:**
> "Công thức: Area = (j - i) × min(height[i], height[j])"
> "→ Để tăng Area, cần tăng width HOẶC tăng height"

> **Aha moment #2:**
> "Width lớn nhất = khi i=0, j=n-1"
> "→ BẮT ĐẦU từ 2 đầu!"

> **Aha moment #3:**
> "Khi di chuyển đường cao hơn → width giảm VÀ height không tăng"
> "→ DI CHUYỂN ĐƯỜNG THẤP HƠN để thử cải thiện height!"

```
Luồng tư duy:
┌─────────────────────────────────────────────────────┐
│                                                       │
│  height[i] = 1    height[j] = 7                      │
│     │                   │                            │
│     ↓                   ↓                            │
│     │                   │                            │
│     ▼                   ▼                            │
│   ┌─┐                 ┌─┐                          │
│   │ │                 │ │                          │
│   │ │                 │ │                          │
│   │ │                 │ │                          │
│   │ │                 │ │                          │
│   └─┘                 └─┘                          │
│     0                   8                            │
│                                                       │
│ width = 8, height = min(1, 7) = 1                   │
│ Area = 8 × 1 = 8                                    │
│                                                       │
│ → Di chuyển đường nào?                             │
│   - Di chuyển height[i]=1 → width giảm, height ≤ 1 │
│   - Di chuyển height[j]=7 → width giảm, height ≤ 7  │
│   → Di chuyển đường THẤP HƠN (height[i]=1)!      │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

#### Bước 3: Validate intuition bằng ví dụ chi tiết

**Ví dụ: [1, 8, 6, 2, 5, 4, 8, 3, 7]**

```
┌─────────────────────────────────────────────────────────────────┐
│ Bước 1: left=0, right=8                                         │
│   width = 8, height = min(1, 7) = 1                            │
│   area = 8                                                      │
│   → height[left] < height[right] → di chuyển left++             │
│                                                                 │
│ Bước 2: left=1, right=8                                        │
│   width = 7, height = min(8, 7) = 7                            │
│   area = 49 → MAX! ✓                                           │
│   → height[left] > height[right] → di chuyển right--           │
│                                                                 │
│ Bước 3: left=1, right=7                                        │
│   width = 6, height = min(8, 3) = 3                            │
│   area = 18                                                     │
│   → height[left] > height[right] → di chuyển right--           │
│                                                                 │
│ ... tiếp tục cho đến khi left >= right                        │
│                                                                 │
│ → return max = 49 ✓                                            │
└─────────────────────────────────────────────────────────────────┘
```

**Tại sao không bỏ sót trường hợp tốt hơn?**

```
Giả sử có cặp tốt hơn (i, j) với left < i < j < right:

Nếu height[left] <= height[right]:
  - Cặp (left, j) có height <= height[left]
  - Width của (left, j) < Width của (left, right)
  → Area(left, j) <= Area(left, right)

Nếu height[left] > height[right]:
  - Cặp (i, right) có height <= height[right]
  - Width của (i, right) < Width của (left, right)
  → Area(i, right) <= Area(left, right)

→ Luôn di chuyển đường thấp hơn không mất trường hợp tối ưu!
```

---

#### Bước 4: Xác định edge cases

```
Edge Case 1: height = [1, 1]
  left=0, right=1 → width=1, height=1 → area=1
  → return 1 ✓

Edge Case 2: height = [10, 1, 1, 1, 1, 10]
  left=0, right=5 → width=5, height=10 → area=50
  → max = 50 ✓

Edge Case 3: height = [0, 0]
  → width=0, height=0 → area=0 ✓

Edge Case 4: height tăng dần [1, 2, 3, 4, 5]
  left=0, right=4 → width=4, height=1 → area=4
  → Thử di chuyển left → vẫn height=1 hoặc cao hơn
  → max vẫn là 4 ✓

Edge Case 5: height giảm dần [5, 4, 3, 2, 1]
  left=0, right=4 → width=4, height=1 → area=4
  → max = 4 ✓
```

---

### 🔑 3. Key Insight (Điều mấu chốt)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "BẮT ĐẦU từ 2 ĐẦU → width lớn nhất"           │
│   → left = 0, right = n-1                         │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Di chuyển ĐƯỜNG THẤP HƠN"                     │
│   → Vì đường cao hơn không cải thiện height       │
│   → Width giảm + height không tăng = không tốt    │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Diện tích bị giới hạn bởi đường THẤP HƠN"    │
│   → Area = (right - left) × min(height[left], height[right]) │
│                                                     │
│   KEY INSIGHT #4:                                   │
│   "Không cần kiểm tra mọi cặp!"                  │
│   → Two Pointers loại bỏ trường hợp không tối ưu│
│                                                     │
│   KEY INSIGHT #5:                                   │
│   "Proof: Di chuyển đường cao không tốt hơn"    │
│   → (left, right) với height[left] <= height[right]│
│   → Mọi cặp (left, j) với j < right đều có      │
│     area <= (left, right)                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls (Lỗi hay mắc)

```javascript
// ❌ Pitfall 1: Nhầm hướng di chuyển
function wrongMaxArea(height) {
  let left = 0;
  let right = height.length - 1;
  let max = 0;
  
  while (left < right) {
    const width = right - left;
    const h = Math.min(height[left], height[right]);
    max = Math.max(max, width * h);
    
    // ❌ SAI: Di chuyển đường CAO HƠN
    if (height[left] < height[right]) {
      right--;  // ❌ Không tối ưu!
    } else {
      left++;
    }
  }
  return max;
}

// ✅ ĐÚNG: Di chuyển đường THẤP HƠN
function maxArea(height) {
  let left = 0;
  let right = height.length - 1;
  let max = 0;
  
  while (left < right) {
    const width = right - left;
    const h = Math.min(height[left], height[right]);
    max = Math.max(max, width * h);
    
    if (height[left] < height[right]) {
      left++;  // ✅ Di chuyển đường thấp hơn
    } else {
      right--;
    }
  }
  return max;
}

// ❌ Pitfall 2: Dùng max thay vì min cho height
const h = Math.max(height[left], height[right]);  // ❌ Sai!
// Phải là:
const h = Math.min(height[left], height[right]);  // ✅ Đúng!
// Vì nước tràn qua đường thấp hơn!

// ❌ Pitfall 3: Quên cập nhật max
while (left < right) {
  // ❌ Quên max = Math.max(...)
  width = right - left;
  h = Math.min(height[left], height[right]);
  // → Không lưu max!
}

// ❌ Pitfall 4: Nhầm lẫn với Largest Rectangle in Histogram
// Bài này: 2 đường bất kỳ
// Largest Rectangle: cột liên tục, chiều cao = cột thấp nhất
// → 2 bài KHÁC NHAU!
```

---

### 🔄 5. Các hướng tiếp cận (So sánh)

#### 🔹 Cách 1: Brute Force (O(n²))

```javascript
function maxArea(height) {
  let max = 0;
  
  for (let i = 0; i < height.length; i++) {
    for (let j = i + 1; j < height.length; j++) {
      const width = j - i;
      const h = Math.min(height[i], height[j]);
      max = Math.max(max, width * h);
    }
  }
  
  return max;
}
```

**📊 Phân tích:**
```
Time:  O(n²) — n(n-1)/2 comparisons
Space: O(1)
```

**⚠️ Nhược điểm:**
- Quá chậm cho n = 10^5
- ~5 tỷ operations!

---

#### 🔹 Cách 2: Two Pointers (O(n)) ⭐ **TỐI ƯU**

```javascript
function maxArea(height) {
  let left = 0;
  let right = height.length - 1;
  let max = 0;
  
  while (left < right) {
    const width = right - left;
    const h = Math.min(height[left], height[right]);
    max = Math.max(max, width * h);
    
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }
  
  return max;
}
```

**📊 Phân tích:**
```
Time:  O(n) — mỗi pointer di chuyển tối đa n lần
Space: O(1)
```

**✅ Ưu điểm:**
- Linear time
- Optimal proof
- Elegant solution

---

### 🚀 6. Visual Walkthrough

```
Input: [1, 8, 6, 2, 5, 4, 8, 3, 7]

┌─────────────────────────────────────────────────────────────────┐
│ Start: left=0, right=8                                          │
│   width=8, height=min(1,7)=1, area=8                            │
│   1 < 7 → left++                                                │
│                                                                 │
│ left=1, right=8                                                 │
│   width=7, height=min(8,7)=7, area=49 → MAX!                   │
│   8 > 7 → right--                                               │
│                                                                 │
│ left=1, right=7                                                 │
│   width=6, height=min(8,3)=3, area=18                           │
│   8 > 3 → right--                                               │
│                                                                 │
│ left=1, right=6                                                 │
│   width=5, height=min(8,8)=8, area=40                           │
│   8 == 8 → right-- (hoặc left++)                                │
│                                                                 │
│ left=1, right=5                                                 │
│   width=4, height=min(8,4)=4, area=16                            │
│   8 > 4 → right--                                               │
│                                                                 │
│ ...tiếp tục...                                                  │
│                                                                 │
│ return max = 49 ✓                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

### 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Largest Rectangle in Histogram (LeetCode 84)
// Tìm hình chữ nhật lớn nhất trong histogram
// → KHÁC với Container With Most Water!
// → Dùng Stack thay vì Two Pointers

// Variation 2: Trapping Rain Water (LeetCode 42)
// Tính lượng nước giữa các thanh
// → Dùng Two Pointers hoặc Stack

// Variation 3: Minimum Height Trees
// Tìm cây có chiều cao nhỏ nhất

// Variation 4: Container With Most Water II (LeetCode 11)
// Bài này chính là bài này!
// → Two Pointers luôn tìm được optimal
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Container With Most Water
 * 
 * Ý tưởng: Two Pointers
 * - Bắt đầu từ 2 đầu (width lớn nhất)
 * - Di chuyển pointer của đường thấp hơn
 * - Tính area và cập nhật max
 * 
 * Time: O(n) | Space: O(1)
 * 
 * @param {number[]} height
 * @return {number}
 */
var maxArea = function(height) {
  let left = 0;
  let right = height.length - 1;
  let max = 0;
  
  while (left < right) {
    const width = right - left;
    const h = Math.min(height[left], height[right]);
    max = Math.max(max, width * h);
    
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }
  
  return max;
};
```

---

## 🧪 Test Cases

```javascript
// Test 1: Example
console.log(maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7])); // 49 ✓

// Test 2: Simple
console.log(maxArea([1, 1]));                       // 1 ✓

// Test 3: Two heights
console.log(maxArea([4, 3, 2, 1, 4]));             // 16 ✓

// Test 4: Increasing
console.log(maxArea([1, 2, 3, 4, 5]));             // 6 ✓

// Test 5: Decreasing
console.log(maxArea([5, 4, 3, 2, 1]));             // 6 ✓

// Test 6: All same
console.log(maxArea([3, 3, 3, 3, 3]));             // 12 ✓

// Test 7: Zeros
console.log(maxArea([0, 0]));                       // 0 ✓

// Test 8: Large heights at edges
console.log(maxArea([10, 1, 1, 1, 1, 10]));       // 50 ✓
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Two Pointers từ 2 đầu

💡 KEY INSIGHT:
   "Di chuyển đường THẤP HƠN"
   "→ Di chuyển đường cao không cải thiện area"

⚠️ PITFALLS:
   - Dùng Math.min cho height (nước tràn qua đường thấp)
   - Di chuyển đường THẤP HƠN, không phải cao hơn
   - Nhầm với Largest Rectangle in Histogram

🔄 VARIATIONS:
   - Largest Rectangle in Histogram (Stack)
   - Trapping Rain Water

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Bài tiếp theo

[Bài 4: Backspace String Compare](./004-backspace-string-compare.md)
