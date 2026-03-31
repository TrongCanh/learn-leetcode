# #48 - Rotate Image

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Array, Math, Matrix |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/rotate-image/

---

## 📖 Đề bài

### Mô tả
Cho một ma trận `n × n` 2D, xoay ma trận **90 độ theo chiều kim đồng hồ** (in-place).

### Ví dụ

**Example 1:**
```
Input:
  [1,2,3]
  [4,5,6]
  [7,8,9]

Output (xoay 90° CW):
  [7,4,1]
  [8,5,2]
  [9,6,3]
```

**Example 2:**
```
Input:
  [5,1,9,11]
  [2,4,8,10]
  [13,3,6,7]
  [15,14,12,2]

Output:
  [15,13,2,5]
  [14,3,4,1]
  [12,8,6,9]
  [2,10,7,11]
```

### Constraints
```
matrix.length == n
matrix[i].length == n
1 <= n <= 20
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Xoay ma trận 90° CW in-place
In-place = không tạo ma trận mới
→ Dùng 2 steps: Transpose + Reverse Rows
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Phân tích pattern

```
Original:
  [1,2,3]
  [4,5,6]
  [7,8,9]

Rotation 90° CW:
  element (r, c) → (c, n-1-r)

  (0,0)=1 → (0,2) = 7? Hmm không đúng...

Thực ra:
  (0,0) → (0,2) → 1 → 3
  (0,1) → (1,2) → 2 → 6
  (0,2) → (2,2) → 3 → 9
```

---

#### Bước 2: "Aha moment!" — Transpose + Reverse

> **Aha moment:**
> **2-step approach:**
>
> **Step 1: Transpose** (đường chéo chính)
> ```
> matrix[r][c] ↔ matrix[c][r]
>
> Before:      After transpose:
> 1 2 3        1 4 7
> 4 5 6   →    2 5 8
> 7 8 9        3 6 9
> ```
>
> **Step 2: Reverse each Row**
> ```
> Before:      After reverse:
> 1 4 7        7 4 1
> 2 5 8   →    8 5 2
> 3 6 9        9 6 3 ✓
> ```
>
> **→ Rotate thành công với 2 operations đơn giản!**

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Rotate 90° CW = Transpose + Reverse Rows"        │
│   → Transpose: matrix[r][c] ↔ matrix[c][r]         │
│   → Reverse Rows: reverse mỗi row                  │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Transpose chỉ cần loop r = 0→n, c = r→n"       │
│   → Vì chỉ swap 1 lần mỗi cặp                     │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Reverse mỗi row = đảo ngược mảng 1 chiều"      │
│   → for (let r=0; r<n; r++) matrix[r].reverse()   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Dùng 4-way swap thay vì 2-step
// 4-way swap phức tạp và dễ sai:
// temp = matrix[r][c]
// matrix[r][c] = matrix[n-1-c][r]
// matrix[n-1-c][r] = matrix[n-1-r][n-1-c]
// matrix[n-1-r][n-1-c] = matrix[c][n-1-r]
// matrix[c][n-1-r] = temp
// ✅ Dùng Transpose + Reverse

// ❌ Pitfall 2: Transpose không chỉ nửa trên
// ❌ for (r=0; r<n; r++) for (c=0; c<n; c++)
// → Swap 2 lần → quay lại như cũ!
// ✅ for (r=0; r<n; r++) for (c=r; c<n; c++)
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Transpose + Reverse Rows (O(n²)) ⭐

```javascript
function rotate(matrix) {
  const n = matrix.length;

  // Step 1: Transpose (đổi chéo)
  for (let r = 0; r < n; r++) {
    for (let c = r; c < n; c++) { // c = r, không phải 0
      [matrix[r][c], matrix[c][r]] = [matrix[c][r], matrix[r][c]];
    }
  }

  // Step 2: Reverse each row
  for (let r = 0; r < n; r++) {
    matrix[r].reverse();
  }
}
```

**📊 Phân tích:**
```
Time:  O(n²) — mỗi element được swap 1 lần
Space: O(1) — in-place
```

---

### 🚀 6. Visual Walkthrough

```
Input:
  [1, 2, 3]
  [4, 5, 6]
  [7, 8, 9]

Step 1 - Transpose (swap across diagonal):
  Swap (0,1)↔(1,0): [1,4,3]
                   [4,2,6]
                   [7,8,9]
  Swap (0,2)↔(2,0): [1,4,7]
                   [4,5,8]
                   [7,6,9]
  Swap (1,2)↔(2,1): [1,4,7]
                   [4,5,8]
                   [7,6,9]
  Swap (0,0), (1,1), (2,2): tự swap → không đổi

Step 2 - Reverse each row:
  Row 0: [1,4,7] → reverse → [7,4,1]
  Row 1: [4,5,8] → reverse → [8,5,2]
  Row 2: [7,6,9] → reverse → [9,6,3]

Result:
  [7, 4, 1]
  [8, 5, 2]
  [9, 6, 3] ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Rotate Image - Transpose + Reverse Rows
 * Time: O(n²) | Space: O(1) in-place
 */
function rotate(matrix) {
  const n = matrix.length;

  // Transpose
  for (let r = 0; r < n; r++) {
    for (let c = r; c < n; c++) {
      [matrix[r][c], matrix[c][r]] = [matrix[c][r], matrix[r][c]];
    }
  }

  // Reverse each row
  for (let r = 0; r < n; r++) {
    matrix[r].reverse();
  }
}
```

---

## 🧪 Test Cases

```javascript
const m1 = [[1,2,3],[4,5,6],[7,8,9]];
rotate(m1);
console.log(m1);
// [[7,4,1],[8,5,2],[9,6,3]]

const m2 = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,2]];
rotate(m2);
console.log(m2);
// [[15,13,2,5],[14,3,4,1],[12,8,6,9],[2,10,7,11]]
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Matrix Rotate = Transpose + Reverse

💡 KEY INSIGHT:
   "90° CW = Transpose(r,c↔c,r) + Reverse Rows"
   "Transpose: c = r để chỉ swap 1 lần mỗi cặp"
   "In-place: không cần ma trận mới"

⚠️ PITFALLS:
   - Transpose: c = r (không phải c = 0)
   - Dùng 2-step thay vì 4-way swap

🔄 VARIATIONS:
   - Rotate Image 180° → reverse rows + reverse cols
   - Spiral Matrix (#54) → tương tự traversal

✅ Đã hiểu
✅ Tự code lại được
```
