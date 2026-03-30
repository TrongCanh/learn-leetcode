# #74 - Search a 2D Matrix

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Array, Binary Search, Matrix |
| **Trạng thích** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/search-a-2d-matrix/

---

## 📖 Đề bài

### Mô tả
Cho một ma trận 2D `matrix` đã sorted theo hàng và cột, tìm `target`.

Ma trận có tính chất:
- Mỗi hàng sorted từ trái sang phải
- Hàng đầu tiên nhỏ hơn hàng cuối cùng

### Ví dụ

**Example 1:**
```
Input:  matrix = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target = 3
Output: true
```

**Example 2:**
```
Input:  matrix = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target = 13
Output: false
```

### Constraints
```
m = matrix.length, n = matrix[0].length
1 <= m, n <= 100
-10^4 <= matrix[i][j] <= 10^4
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
┌─────────────────────────────────────────────────────┐
│ Hỏi:  Tìm target trong ma trận đã sorted?     │
│ Trả về: Boolean (true/false)                      │
│                                                     │
│ Tính chất đặc biệt:                             │
│ - Mỗi hàng sorted trái → phải                  │
│ - Hàng trên < Hàng dưới                         │
│ → Có thể coi như MẢNG 1D SORTED!            │
└─────────────────────────────────────────────────────┘
```

---

### 🤔 2. Tư duy từng bước (Step-by-step)

#### Bước 1: Nghĩ đến cách "ngây thơ" nhất

> **Hỏi:** "Làm sao tìm target trong ma trận?"

**Cách 1: Brute Force - Duyệt tất cả**

```
matrix = [[1,3,5,7], [10,11,16,20], [23,30,34,60]]

Duyệt từng phần tử:
  (0,0)=1, (0,1)=3, (0,2)=5, ...
  → O(m×n) - CHẬM!
```

**⚠️ Nhược điểm:**
```javascript
function searchMatrix(matrix, target) {
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[0].length; j++) {
      if (matrix[i][j] === target) return true;
    }
  }
  return false;
}
// → O(m×n) = O(100×100) = 10,000 operations
```

---

#### Bước 2: Tối ưu - Binary Search 2 lần

> **Aha moment #1:**
> "Tìm hàng trước, rồi binary search trong hàng!"
> "Vì hàng trên < hàng dưới"

**Cách 2: Tìm hàng + Binary Search**

```
matrix = [[1,3,5,7], [10,11,16,20], [23,30,34,60]]
target = 3

Bước 1: Tìm hàng
  So sánh matrix[i][0] với target
  matrix[0][0]=1 < 3 → hàng 0?
  matrix[1][0]=10 > 3 → hàng 0!

Bước 2: Binary search trong hàng 0
  [1, 3, 5, 7] → tìm 3
  → Found at index 1 → TRUE ✓
```

---

#### Bước 3: Tối ưu hơn - Binary Search trên toàn bộ

> **Aha moment #2:**
> "Co ma trận như MẢNG 1D!"
> "Vì sorted TỪ TRÁI → PHẢI, và TỪ TRÊN → DƯỚI!"

```
Matrix 3x4:
[1,  3,  5,  7]
[10, 11, 16, 20]
[23, 30, 34, 60]

Coi như mảng 1D:
Index: 0  1  2  3  4  5  6  7  8  9  10 11
Value: 1  3  5  7 10 11 16 20 23 30 34 60

→ BINARY SEARCH BÌNH THƯỜNG!
```

**Chuyển đổi index:**
```
total = m × n
index = i (0 đến total-1)

row = index / n (floor)
col = index % n

Ví dụ: index = 5, n = 4
  row = 5 / 4 = 1 (floor)
  col = 5 % 4 = 1
  → matrix[1][1] = 11 ✓
```

---

#### Bước 4: Validate intuition bằng ví dụ chi tiết

**Ví dụ: target = 3**

```
┌─────────────────────────────────────────────────────────────────┐
│ Setup                                                           │
│   m = 3, n = 4, total = 12                                   │
│   left = 0, right = 11                                         │
│                                                                 │
│ Step 1: mid = (0 + 11) / 2 = 5                               │
│   row = 5 / 4 = 1                                             │
│   col = 5 % 4 = 1                                             │
│   matrix[1][1] = 11                                            │
│   11 > 3 → right = mid - 1 = 4                                │
│                                                                 │
│ Step 2: mid = (0 + 4) / 2 = 2                               │
│   row = 2 / 4 = 0                                             │
│   col = 2 % 4 = 2                                             │
│   matrix[0][2] = 5                                             │
│   5 > 3 → right = 1                                           │
│                                                                 │
│ Step 3: mid = (0 + 1) / 2 = 0                                │
│   row = 0 / 4 = 0                                             │
│   col = 0 % 4 = 0                                             │
│   matrix[0][0] = 1                                             │
│   1 < 3 → left = 1                                            │
│                                                                 │
│ Step 4: mid = (1 + 1) / 2 = 1                                │
│   row = 1 / 4 = 0                                             │
│   col = 1 % 4 = 1                                             │
│   matrix[0][1] = 3                                             │
│   3 = 3 → FOUND! → return TRUE ✓                              │
└─────────────────────────────────────────────────────────────────┘
```

---

#### Bước 5: Xác định edge cases

```
Edge Case 1: target < matrix[0][0]
  → Kết quả = false ✓

Edge Case 2: target > matrix[m-1][n-1]
  → Kết quả = false ✓

Edge Case 3: Ma trận 1 hàng
  → Hoạt động bình thường ✓

Edge Case 4: Ma trận 1 cột
  → Hoạt động bình thường ✓

Edge Case 5: target ở góc
  → matrix[0][0] hoặc matrix[m-1][n-1] ✓
```

---

### 🔑 3. Key Insight (Điều mấu chốt)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Matrix có thể coi như MẢNG 1D SORTED!"     │
│   → Sorted: trái→phải, trên→dưới              │
│                                                     │
│   KEY INSIGHT #2:                                  │
│   "Chuyển index ↔ (row, col)"                 │
│   → row = index / n (floor)                   │
│   → col = index % n                             │
│                                                     │
│   KEY INSIGHT #3:                                  │
│   "Áp dụng Binary Search bình thường"        │
│   → O(log(m×n)) = O(log m + log n)          │
│                                                     │
│   KEY INSIGHT #4:                                  │
│   "So sánh với matrix[row][col]"             │
│   → Tìm target như tìm trong mảng 1D         │
│                                                     │
│   KEY INSIGHT #5:                                  │
│   "Điều kiện dừng: left > right"            │
│   → Not found = false                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls (Lỗi hay mắc)

```javascript
// ❌ Pitfall 1: Tính row/col sai
function wrongSearch(matrix, target) {
  const m = matrix.length;
  const n = matrix[0].length;
  let left = 0;
  let right = m * n - 1;
  
  while (left <= right) {
    const mid = (left + right) / 2;  // ❌ Decimal!
    const row = mid / n;  // ❌ Không floor
    const col = mid % n;
    // → SAI với mid = 2.5!
  }
}

// ✅ Đúng: Dùng Math.floor
const mid = Math.floor((left + right) / 2);
const row = Math.floor(mid / n);
const col = mid % n;

// ❌ Pitfall 2: Dùng n từ row thay vì matrix[0].length
function wrongSearch(matrix, target) {
  let left = 0, right = matrix.length * matrix[0].length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    // ❌ row = mid / matrix.length (NHẦM!)
    // ✅ col = mid / matrix[0].length
  }
}

// ❌ Pitfall 3: Không check empty matrix
function searchMatrix(matrix, target) {
  const m = matrix.length;  // ❌ Lỗi nếu matrix = []
  const n = matrix[0].length;
}

// ✅ Đúng: Check empty
if (matrix.length === 0 || matrix[0].length === 0) return false;

// ❌ Pitfall 4: Nhầm với cách tìm hàng trước
// Cách này cũng được nhưng không tối ưu bằng
```

---

### 🔄 5. Các hướng tiếp cận (So sánh)

#### 🔹 Cách 1: Brute Force (O(m×n))

```javascript
function searchMatrix(matrix, target) {
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[0].length; j++) {
      if (matrix[i][j] === target) return true;
    }
  }
  return false;
}
```

**📊 Phân tích:**
```
Time:  O(m×n)
Space: O(1)
```

---

#### 🔹 Cách 2: Binary Search 2 lần (O(log m + log n))

```javascript
function searchMatrix(matrix, target) {
  const m = matrix.length;
  const n = matrix[0].length;
  
  // Tìm hàng
  let top = 0, bottom = m - 1;
  while (top < bottom) {
    const mid = Math.floor((top + bottom + 1) / 2);
    if (matrix[mid][0] <= target) {
      top = mid;
    } else {
      bottom = mid - 1;
    }
  }
  
  const row = top;
  
  // Binary search trong hàng
  let left = 0, right = n - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (matrix[row][mid] === target) return true;
    else if (matrix[row][mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  
  return false;
}
```

---

#### 🔹 Cách 3: Binary Search trên toàn bộ (O(log(m×n))) ⭐ **TỐI ƯU**

```javascript
function searchMatrix(matrix, target) {
  if (matrix.length === 0) return false;
  
  const m = matrix.length;
  const n = matrix[0].length;
  let left = 0;
  let right = m * n - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const row = Math.floor(mid / n);
    const col = mid % n;
    const num = matrix[row][col];
    
    if (num === target) return true;
    else if (num < target) left = mid + 1;
    else right = mid - 1;
  }
  
  return false;
}
```

**📊 Phân tích:**
```
Time:  O(log(m×n)) = O(log m + log n)
Space: O(1)
```

**✅ Ưu điểm:**
- Elegant solution
- Single binary search
- Optimal

---

### 🚀 6. Visual Walkthrough

```
Matrix 3x4:
[1,  3,  5,  7 ]
[10, 11, 16, 20]
[23, 30, 34, 60]

┌─────────────────────────────────────────────────────────────────┐
│                    Như mảng 1D:                                  │
│                                                                 │
│   0  1  2  3  4  5  6  7  8  9  10 11                       │
│   1  3  5  7 10 11 16 20 23 30 34 60                       │
│   ↑           ↑                       ↑                       │
│  row=0       row=1                   row=2                    │
│  col=0       col=1                   col=3                     │
│                                                                 │
│ Tìm target = 11:                                               │
│                                                                 │
│ left=0, right=11, mid=5                                        │
│   row=5/4=1, col=5%4=1                                        │
│   matrix[1][1]=11 → FOUND! ✓                                  │
│                                                                 │
│ Tìm target = 3:                                                │
│                                                                 │
│ mid=5 → 11 > 3 → right=4                                      │
│ mid=2 → 5 > 3 → right=1                                      │
│ mid=0 → 1 < 3 → left=1                                       │
│ mid=1 → 3 = 3 → FOUND! ✓                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

### 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Tìm vị trí row, col
// Trả về [row, col] thay vì boolean
function searchMatrixIndex(matrix, target) {
  const m = matrix.length;
  const n = matrix[0].length;
  let left = 0;
  let right = m * n - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const row = Math.floor(mid / n);
    const col = mid % n;
    
    if (matrix[row][col] === target) {
      return [row, col];
    } else if (matrix[row][col] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return [-1, -1];
}

// Variation 2: Search in Sorted Matrix II
// Matrix không sorted giữa các hàng
// → Cần approach khác

// Variation 3: Search Row with Binary Search, then element
// → Cách 2 đã trình bày
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Search a 2D Matrix
 * 
 * Ý tưởng: Binary Search trên toàn bộ
 * - Coi ma trận như mảng 1D sorted
 * - Chuyển index ↔ (row, col)
 * 
 * Time: O(log(m×n)) | Space: O(1)
 */
var searchMatrix = function(matrix, target) {
  if (matrix.length === 0) return false;
  
  const m = matrix.length;
  const n = matrix[0].length;
  let left = 0;
  let right = m * n - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const row = Math.floor(mid / n);
    const col = mid % n;
    const num = matrix[row][col];
    
    if (num === target) return true;
    else if (num < target) left = mid + 1;
    else right = mid - 1;
  }
  
  return false;
};
```

---

## 🧪 Test Cases

```javascript
// Test 1: Found
const m1 = [[1,3,5,7],[10,11,16,20],[23,30,34,60]];
console.log(searchMatrix(m1, 3));  // true ✓

// Test 2: Not found
console.log(searchMatrix(m1, 13)); // false ✓

// Test 3: First element
console.log(searchMatrix(m1, 1));   // true ✓

// Test 4: Last element
console.log(searchMatrix(m1, 60));  // true ✓

// Test 5: Empty matrix
console.log(searchMatrix([], 1));   // false ✓

// Test 6: Single element
console.log(searchMatrix([[5]], 5)); // true ✓
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Binary Search trên 2D

💡 KEY INSIGHT:
   "Co ma trận như mảng 1D sorted"
   "row = mid / n, col = mid % n"

⚠️ PITFALLS:
   - Dùng Math.floor cho row
   - Check empty matrix trước
   - n = matrix[0].length không phải matrix.length

🔄 VARIATIONS:
   - Trả về [row, col]
   - Search Sorted Matrix II

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Bài tiếp theo

[Bài 3: Koko Eating Bananas](./003-koko-eating-bananas.md)
