# #994 - Rotting Oranges

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Graph, BFS, Matrix |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/rotting-oranges/

---

## 📖 Đề bài

### Mô tả
Cho một lưới `grid` với 3 loại ô:
- `0` = Empty
- `1` = Fresh orange
- `2` = Rotting orange

Mỗi phút, một orange đang rotting sẽ làm **rotting tất cả** 4 neighbors (trên/dưới/trái/phải) nếu chúng là fresh oranges.

Trả về **số phút tối thiểu** để tất cả oranges trở thành rotting, hoặc trả về `-1` nếu không thể (tức là có fresh oranges không thể bị rotting).

### Ví dụ

**Example 1:**
```
Input:
[
  [2,1,1],
  [1,1,0],
  [0,1,1]
]
Output: 4
```

**Example 2:**
```
Input:
[
  [2,1,1],
  [0,1,1],
  [1,0,1]
]
Output: -1
Giải thích: Orange ở (1,0) không thể bị rotting (isolated fresh)
```

### Constraints
```
1 <= grid.length <= 10
1 <= grid[i].length <= 10
grid[i][j] ∈ {0, 1, 2}
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Bao lâu để tất cả oranges rotting?
Mô hình: Multi-source BFS
  - Nhiều rotting oranges = NHIỀU sources
  - Mỗi phút = 1 level trong BFS
  - Fresh orange không thể reach = -1
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Nghĩ đơn giản

> **Hỏi:** "Làm sao mô phỏng quá trình rotting?"

```
Minute 0: Các ô 2 (rotting) bắt đầu
Minute 1: 2 làm rotting neighbors (1) → chúng thành 2
Minute 2: Các 2 mới làm rotting neighbors tiếp
...
→ Đây chính là **BFS level-by-level**!
```

---

#### Bước 2: "Aha moment!"

> **Aha moment:**
> **"Multi-Source BFS"**
>
> 1. **Queue khởi tạo** với TẤT CẢ rotting oranges cùng lúc
> 2. **BFS level-by-level** → mỗi level = 1 phút
> 3. **Đếm số fresh oranges** ban đầu
> 4. **Mỗi lần BFS pop** → giảm fresh count
> 5. **Hết BFS** → fresh === 0 ? minutes : -1

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Multi-source BFS = nhiều starting points"       │
│   → Khởi tạo queue với TẤT CẢ rotting oranges     │
│   → Mỗi BFS level = 1 phút                        │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Track fresh count = có fresh nào còn lại?"     │
│   → Queue rỗng + fresh > 0 → -1 (không reach được)│
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "BFS level count = minutes elapsed"              │
│   → Dùng outer loop đếm levels, hoặc track minutes│
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Không track fresh count → không biết có fresh còn lại không
function orangesRotting(grid) {
  const queue = [];
  // Khởi tạo queue...
  let minutes = 0;

  while (queue.length) {
    // BFS...
    minutes++;
  }

  // ❌ Sai: không check fresh còn lại
  return minutes;
}

// ✅ Đúng: Track fresh count
function orangesRotting(grid) {
  let fresh = 0;
  const queue = [];
  for (r...) for (c...) {
    if (grid[r][c] === 2) queue.push([r, c]);
    else if (grid[r][c] === 1) fresh++;
  }

  if (fresh === 0) return 0;

  let minutes = 0;
  while (queue.length) {
    const size = queue.length; // ← Important: level size
    for (...) {
      // BFS...
      if (grid[nr][nc] === 1) {
        grid[nr][nc] = 2;
        fresh--;
        queue.push([nr, nc]);
      }
    }
    if (size > 0) minutes++; // ← Chỉ tăng khi có rotting xảy ra
  }

  return fresh === 0 ? minutes : -1;
}

// ❌ Pitfall 2: Tăng minutes mỗi iteration thay vì mỗi level
// ✅ Phải dùng `const size = queue.length` để đếm level
```

---

### 🔄 5. Các hướng tiếp cận

#### 🔹 Cách 1: BFS Level-by-Level (O(m × n)) ⭐

```javascript
function orangesRotting(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const queue = [];
  let fresh = 0;

  // 1. Khởi tạo: find all rotting oranges + count fresh
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) {
        queue.push([r, c]);
      } else if (grid[r][c] === 1) {
        fresh++;
      }
    }
  }

  if (fresh === 0) return 0;

  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  let minutes = 0;

  // 2. BFS level-by-level
  while (queue.length > 0 && fresh > 0) {
    const size = queue.length; // Số rotting oranges ở phút hiện tại
    for (let i = 0; i < size; i++) {
      const [r, c] = queue.shift();

      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        if (grid[nr][nc] !== 1) continue;

        grid[nr][nc] = 2; // Thành rotting
        fresh--;
        queue.push([nr, nc]);
      }
    }
    minutes++; // 1 phút trôi qua cho mỗi level hoàn thành
  }

  return fresh === 0 ? minutes : -1;
}
```

**📊 Phân tích:**
```
Time:  O(m × n) — mỗi ô được visit tối đa 1 lần
Space: O(m × n) — queue
```

---

### 🚀 6. Visual Walkthrough

```
Grid:
  2  1  1
  1  1  0
  0  1  1

fresh = 4, queue = [(0,0)]

Minute 1 (level 1, size=1):
  Process (0,0) → rotting neighbors:
    (0,1)=1 → becomes 2 ✓ fresh=3
    (1,0)=1 → becomes 2 ✓ fresh=2
  queue = [(0,1),(1,0)]
  minutes = 1

Minute 2 (level 2, size=2):
  Process (0,1):
    neighbors (0,2)=1 → 2 ✓ fresh=1
    (1,1)=1 → 2 ✓ fresh=0
  Process (1,0):
    neighbors (2,0)=0 skip, (1,1)=2 already
  queue = [(0,2),(1,1)]
  minutes = 2

Minute 3 (level 3, size=2):
  Process (0,2): neighbors all non-fresh
  Process (1,1): neighbors (1,2)=0 skip
  queue = []
  minutes = 3

Minute 4 (level 4, size=0):
  queue rỗng, fresh = 0
  → return 4 ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Rotting Oranges - Multi-Source BFS
 * Time: O(m × n) | Space: O(m × n)
 */
function orangesRotting(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const queue = [];
  let fresh = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) queue.push([r, c]);
      else if (grid[r][c] === 1) fresh++;
    }
  }

  if (fresh === 0) return 0;

  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  let minutes = 0;

  while (queue.length > 0 && fresh > 0) {
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const [r, c] = queue.shift();
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        if (grid[nr][nc] !== 1) continue;
        grid[nr][nc] = 2;
        fresh--;
        queue.push([nr, nc]);
      }
    }
    minutes++;
  }

  return fresh === 0 ? minutes : -1;
}
```

---

## 🧪 Test Cases

```javascript
console.log(orangesRotting([
  [2,1,1],
  [1,1,0],
  [0,1,1]
])); // 4

console.log(orangesRotting([
  [2,1,1],
  [0,1,1],
  [1,0,1]
])); // -1

console.log(orangesRotting([[0]])); // 0

console.log(orangesRotting([[2]])); // 0

console.log(orangesRotting([[1]])); // -1

console.log(orangesRotting([
  [2,2],
  [1,1]
])); // 1
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Multi-Source BFS

💡 KEY INSIGHT:
   "Queue khởi tạo = TẤT CẢ rotting oranges"
   "Mỗi BFS level = 1 phút"
   "Track fresh count → nếu > 0 khi queue rỗng → -1"

⚠️ PITFALLS:
   - Dùng `const size = queue.length` để đếm level
   - Chỉ tăng minutes khi `size > 0`
   - Track fresh count

🔄 VARIATIONS:
   - Shortest Path in Binary Matrix (#542) → tương tự nhưng không có fresh count

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Flood Fill Algorithm (#733)
// Tô màu vùng liên tục

// Variation 2: Minesweeper (#529)
// Game minesweeper click

// Variation 3: Shortest Distance from All Buildings
// Tìm empty land gần tất cả buildings

// Variation 4: Zombie in Matrix (#1162)
// Zombie lây nhiễm tất cả people

// Variation 5: Oranges Rotting with Fresh Count
// Lây nhiễm xác định
```

---

## ➡️ Bài tiếp theo

[Bài 7: Keys and Rooms](./007-keys-and-rooms.md)
