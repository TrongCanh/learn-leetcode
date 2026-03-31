# #36 - Valid Sudoku

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Array, Hash Table, Matrix |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/valid-sudoku/

---

## 📖 Đề bài

Kiểm tra board 9x9 có phải Sudoku hợp lệ không.

**Hợp lệ khi:**
1. Mỗi hàng không có số trùng lặp (1-9)
2. Mỗi cột không có số trùng lặp (1-9)
3. Mỗi ô 3x3 không có số trùng lặp (1-9)

### Ví dụ

```
Input:
[
  ["5","3",".",".","7",".",".",".","."],
  ["6",".",".","1","9","5",".",".","."],
  [".","9","8",".",".",".",".","6","."],
  ["8",".",".",".","6",".",".",".","3"],
  ["4",".",".","8",".","3",".",".","1"],
  ["7",".",".",".","2",".",".",".","6"],
  [".","6",".",".",".",".","2","8","."],
  [".",".",".","4","1","9",".",".","5"],
  [".",".",".",".","8",".",".","7","9"]
]
Output: true
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài

```
Hỏi: Kiểm tra 3 điều kiện:
  1. Hàng không trùng lặp
  2. Cột không trùng lặp
  3. Ô 3x3 không trùng lặp
Trả về: Boolean
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Nghĩ đến cách đơn giản nhất

```
Cách 1: 3 nested loops cho mỗi điều kiện
→ Quá phức tạp và chậm!
```

---

#### Bước 2: "Aha moment!"

> **Aha moment:**
> "Chỉ cần duyệt 1 LẦN qua board!"
> "Với mỗi ô, kiểm tra 3 điều kiện đồng thời!"
>
> **→ 3 Arrays of Sets: rows[9], cols[9], boxes[9]**

```
rows[0] = Set({}) → thêm 5 vào → {5}
cols[0] = Set({}) → thêm 5 vào → {5}
boxes[0] = Set({}) → thêm 5 vào → {5}

Nếu thêm số đã có → INVALID!
```

---

#### Bước 3: Tính Box Index

```
Box 3x3 grid:

  Col 0    Col 1    Col 2
┌────────┬────────┬────────┐
│ Box 0  │ Box 1  │ Box 2  │  Row 0
├────────┼────────┼────────┤
│ Box 3  │ Box 4  │ Box 5  │  Row 1
├────────┼────────┼────────┤
│ Box 6  │ Box 7  │ Box 8  │  Row 2
└────────┴────────┴────────┘

Công thức:
boxIndex = (row / 3) * 3 + (col / 3)

Ví dụ:
(0, 0) → 0 * 3 + 0 = 0 → Box 0
(1, 4) → 0 * 3 + 1 = 1 → Box 1
(4, 4) → 1 * 3 + 1 = 4 → Box 4
(8, 8) → 2 * 3 + 2 = 8 → Box 8
```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "1 pass: duyệt board 1 lần"                   │
│   "Với mỗi ô, kiểm tra rows, cols, boxes"       │
│                                                     │
│   KEY INSIGHT #2:                                  │
│   "boxIndex = (row/3)*3 + (col/3)"              │
│   → Tính nhanh bằng integer division            │
│                                                     │
│   KEY INSIGHT #3:                                  │
│   "9x9 luôn có kích thước cố định"             │
│   → O(1) thay vì O(n)!"                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Tính box index sai
// Sai: boxIndex = row * 3 + col
// Đúng: boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3)

// ❌ Pitfall 2: Không bỏ qua '.'
// Phải skip: if (val === '.') continue;

// ❌ Pitfall 3: Dùng Array thay vì Set
// Array: arr.includes(val) → O(9) = O(1) nhưng không clean
// Set: set.has(val) → O(1) ✓
```

---

### 🔄 5. Các hướng tiếp cận

#### 🔹 Cách 1: 3 Arrays of Sets (O(1)) ⭐

```javascript
function isValidSudoku(board) {
  const rows = Array.from({ length: 9 }, () => new Set());
  const cols = Array.from({ length: 9 }, () => new Set());
  const boxes = Array.from({ length: 9 }, () => new Set());

  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const val = board[i][j];
      if (val === '.') continue;

      // Check rows
      if (rows[i].has(val)) return false;
      rows[i].add(val);

      // Check cols
      if (cols[j].has(val)) return false;
      cols[j].add(val);

      // Check boxes
      const boxIndex = Math.floor(i / 3) * 3 + Math.floor(j / 3);
      if (boxes[boxIndex].has(val)) return false;
      boxes[boxIndex].add(val);
    }
  }

  return true;
}
```

**📊 Phân tích:**
```
Time:  O(81) = O(1) — luôn 9x9
Space: O(9*3) = O(1)
```

---

#### 🔹 Cách 2: Single Set với String Keys (O(1))

```javascript
function isValidSudoku(board) {
  const seen = new Set();

  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const val = board[i][j];
      if (val === '.') continue;

      const rowKey = `row ${i} ${val}`;
      const colKey = `col ${j} ${val}`;
      const boxKey = `box ${Math.floor(i/3)}-${Math.floor(j/3)} ${val}`;

      if (seen.has(rowKey) || seen.has(colKey) || seen.has(boxKey)) {
        return false;
      }

      seen.add(rowKey);
      seen.add(colKey);
      seen.add(boxKey);
    }
  }

  return true;
}
```

**📊 Phân tích:**
```
Time:  O(1)
Space: O(1) — max 81 entries
```

---

### 🚀 6. Visual Walkthrough

```
Board:
["5","3",".",".","7",".",".",".","."]
["6",".",".","1","9","5",".",".","."]
[".","9","8",".",".",".",".","6","."]

Check each cell:
(i=0, j=0, val='5'):
  rows[0] = {} → add 5 → {5} ✓
  cols[0] = {} → add 5 → {5} ✓
  boxIndex = 0 → boxes[0] = {} → add 5 → {5} ✓

(i=1, j=0, val='6'):
  rows[1] = {} → add 6 → {6} ✓
  cols[0] = {5} → add 6 → {5,6} ✓
  boxIndex = 0 → boxes[0] = {5} → add 6 → {5,6} ✓

(i=2, j=1, val='9'):
  rows[2] = {} → add 9 → {9} ✓
  cols[1] = {} → add 9 → {9} ✓
  boxIndex = 0 → boxes[0] = {5,6} → add 9 → {5,6,9} ✓

... (tiếp tục)

→ Nếu gặp số trùng → return false
→ Không có trùng → return true
```

---

### 🎯 7. Biến thể

```javascript
// Variation: Đếm số solutions cho Sudoku
// → Dùng Backtracking

// Variation: Solve Sudoku
// → Dùng Backtracking + Constraint propagation
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Valid Sudoku
 * Time: O(1) | Space: O(1)
 */
var isValidSudoku = function(board) {
  const rows = Array.from({ length: 9 }, () => new Set());
  const cols = Array.from({ length: 9 }, () => new Set());
  const boxes = Array.from({ length: 9 }, () => new Set());

  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const val = board[i][j];
      if (val === '.') continue;

      const boxIndex = Math.floor(i / 3) * 3 + Math.floor(j / 3);

      if (rows[i].has(val) || cols[j].has(val) || boxes[boxIndex].has(val)) {
        return false;
      }

      rows[i].add(val);
      cols[j].add(val);
      boxes[boxIndex].add(val);
    }
  }

  return true;
};
```

---

## 🧪 Test Cases

```javascript
// Valid Sudoku
const board1 = [
  ["5","3",".",".","7",".",".",".","."],
  ["6",".",".","1","9","5",".",".","."],
  [".","9","8",".",".",".",".","6","."],
  ["8",".",".",".","6",".",".",".","3"],
  ["4",".",".","8",".","3",".",".","1"],
  ["7",".",".",".","2",".",".",".","6"],
  [".","6",".",".",".",".","2","8","."],
  [".",".",".","4","1","9",".",".","5"],
  [".",".",".",".","8",".",".","7","9"]
];
console.log(isValidSudoku(board1)); // true

// Invalid - duplicate in row
const board2 = [
  ["5","3",".",".","7",".",".",".","."],
  ["6","3",".","1","9","5",".",".","."], // ← 3 trùng trong hàng!
  [".","9","8",".",".",".",".","6","."],
  // ...
];
console.log(isValidSudoku(board2)); // false
```

---

## 📝 Ghi chú

```
PATTERN: Hash Sets cho rows, cols, boxes

💡 KEY INSIGHT:
   "1 pass: kiểm tra 3 điều kiện cùng lúc"
   "boxIndex = (row/3)*3 + (col/3)"

⚠️ PITFALLS:
   - Skip '.' cells
   - Tính box index đúng

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Bài tiếp theo

[Bài 8: Encode and Decode Strings](./008-encode-decode-strings.md)
