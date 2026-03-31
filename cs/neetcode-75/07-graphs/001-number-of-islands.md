# #200 - Number of Islands

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Graph, DFS, BFS |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/number-of-islands/

---

## 📖 Đề bài

### Mô tả
Cho một lưới 2D `grid` gồm các ký tự `'1'` (đất) và `'0'` (nước). Đếm số **đảo** (islands).

Một **đảo** là một nhóm gồm các ô `'1'` kết nối 4-hướng (lên, xuống, trái, phải).

### Ví dụ

**Example 1:**
```
Input:
[
  ['1','1','1','1','0'],
  ['1','1','0','1','0'],
  ['1','1','0','0','0'],
  ['0','0','0','0','0']
]
Output: 1
```

**Example 2:**
```
Input:
[
  ['1','1','0','0','0'],
  ['1','1','0','0','0'],
  ['0','0','1','0','0'],
  ['0','0','0','1','1']
]
Output: 3
```

### Constraints
```
1 <= grid.length, grid[i].length <= 300
grid[i][j] là '1' hoặc '0'
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Có bao nhiêu nhóm ô '1' liền kề 4-hướng?
Mô hình: Grid 2D → Graph, mỗi ô là 1 node
Kết nối: 4 neighbors (trên/dưới/trái/phải)
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Nghĩ brute force trước

> **Hỏi:** "Làm sao đếm được đảo?"

Duyệt từng ô. Khi gặp `'1'`, đếm +1 và "xóa" (đánh dấu visited) toàn bộ đảo đó.

```
→ Dùng DFS/BFS từ ô '1' để flood-fill đảo
→ Mỗi khi bắt đầu flood-fill = tìm thấy 1 đảo mới
```

---

#### Bước 2: "Aha moment!"

> **Aha moment:**
> "Grid 2D là một **implicit graph** — không cần xây adjacency list,
> chỉ cần duyệt 4 hướng từ mỗi ô!"
>
> **Pattern: DFS Flood Fill**
>
> ```
> Khi gặp '1' → đánh dấu thành '0' (visited)
>                → DFS 4 hướng → tiếp tục đệ quy
> → Đảo bị "xóa" hết sau khi đếm = không đếm trùng
> ```

---

#### Bước 3: Validate bằng ví dụ

```
Grid:
  1 1 1
  1 0 1
  0 0 1

Duyệt (row-major):
  (0,0)=1 → count=1 → DFS flood-fill → grid đánh dấu '0'
  (0,1)=1 → ĐÃ thành '0' (visited) → skip
  (0,2)=1 → ĐÃ thành '0' → skip
  (1,0)=1 → ĐÃ thành '0' → skip
  (1,1)=0 → skip
  (1,2)=1 → count=2 → DFS flood-fill → grid đánh dấu '0'
  (2,0)=0 → skip
  (2,1)=0 → skip
  (2,2)=1 → ĐÃ thành '0' → skip

→ return 2 ✓
```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Grid = Implicit Graph"                          │
│   → Mỗi ô là node, 4 neighbors là edges           │
│   → Không cần adjacency list                       │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Flood Fill = In-place visited"                  │
│   → Đánh dấu '1' → '0' ngay trong DFS             │
│   → Tránh visited Set, tiết kiệm O(n) space       │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Mỗi DFS start = 1 đảo mới"                     │
│   → Count++ khi bắt đầu DFS, không phải cuối      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Dùng visited Set thay vì in-place marking
function numIslandsWithSet(grid) {
  const visited = new Set();
  let count = 0;

  function dfs(r, c) {
    const key = `${r},${c}`;
    if (visited.has(key)) return;
    visited.add(key);
    // ...
  }
  // → Tốn thêm O(n) space cho Set

// ✅ Đúng: Đánh dấu '0' ngay trong DFS
function dfs(r, c) {
  if (r < 0 || c < 0 || r >= rows || c >= cols) return;
  if (grid[r][c] === '0') return; // ← Check trước khi đánh dấu
  grid[r][c] = '0'; // ← In-place marking
  dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1);
}

// ❌ Pitfall 2: Quên check bounds trước khi truy cập grid
function dfs(r, c) {
  // ❌ Lỗi: grid[r][c] có thể out of bounds!
  if (grid[r][c] === '0') return;
  grid[r][c] = '0';
  // ...
}
// ✅ Đúng: Check bounds TRƯỚC
function dfs(r, c) {
  if (r < 0 || c < 0 || r >= rows || c >= cols) return; // ← bounds trước
  if (grid[r][c] === '0') return;
  grid[r][c] = '0';
  // ...
}

// ❌ Pitfall 3: Đánh dấu '0' SAU khi check bounds (vẫn đúng nhưng thừa)
function dfs(r, c) {
  if (r < 0 || c < 0 || r >= rows || c >= cols) return;
  grid[r][c] = '0'; // ← Đánh dấu luôn (đúng vì đã check bounds)
  dfs(r+1, c);
  // ...
}
```

---

### 🔄 5. Các hướng tiếp cận

#### 🔹 Cách 1: DFS Recursive (O(m × n)) ⭐ **PHỔ BIẾN NHẤT**

```javascript
function numIslands(grid) {
  if (!grid || grid.length === 0) return 0;

  let count = 0;
  const rows = grid.length;
  const cols = grid[0].length;

  function dfs(r, c) {
    // 1. Out of bounds → return
    if (r < 0 || c < 0 || r >= rows || c >= cols) return;
    // 2. Nước hoặc đã visited → return
    if (grid[r][c] === '0') return;
    // 3. Đánh dấu visited (flood fill)
    grid[r][c] = '0';
    // 4. DFS 4 hướng
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        count++;          // Tìm thấy 1 đảo mới!
        dfs(r, c);        // Xóa toàn bộ đảo
      }
    }
  }

  return count;
}
```

**📊 Phân tích:**
```
Time:  O(m × n) — mỗi ô được visit tối đa 1 lần
Space: O(m × n) — recursion stack, worst case toàn '1' → chain dài m+n
```

---

#### 🔹 Cách 2: BFS Queue

```javascript
function numIslands(grid) {
  if (!grid || grid.length === 0) return 0;

  let count = 0;
  const rows = grid.length;
  const cols = grid[0].length;
  const dirs = [[0,1],[0,-1],[1,0],[-1,0]];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        count++;
        grid[r][c] = '0'; // Mark visited
        const queue = [[r, c]];

        while (queue.length) {
          const [cr, cc] = queue.shift();
          for (const [dr, dc] of dirs) {
            const nr = cr + dr;
            const nc = cc + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === '1') {
              grid[nr][nc] = '0';
              queue.push([nr, nc]);
            }
          }
        }
      }
    }
  }

  return count;
}
```

**📊 Phân tích:**
```
Time:  O(m × n)
Space: O(min(m×n, đảo lớn)) — queue size
✅ Ưu điểm: Tránh stack overflow cho grid lớn
```

---

### 🚀 6. Visual Walkthrough

```
Grid:
  1  1  0  0  0
  1  1  0  0  0
  0  0  1  0  0
  0  0  0  1  1

┌────────────────────────────────────────────────────────┐
│ Loop r=0, c=0: grid[0][0]='1'                         │
│   count=1                                              │
│   DFS(0,0) → mark (0,0),(0,1),(1,0),(1,1) = '0'      │
│                                                          │
│ Loop tiếp: Tất cả visited → skip                       │
│                                                          │
│ Loop r=2, c=2: grid[2][2]='1'                         │
│   count=2                                              │
│   DFS(2,2) → mark (2,2) = '0'                          │
│                                                          │
│ Loop r=3, c=3: grid[3][3]='1'                         │
│   count=3                                              │
│   DFS(3,3) → mark (3,3),(3,4) = '0'                   │
│                                                          │
│ Loop r=3, c=4: grid[3][4]='0' → skip                  │
│                                                          │
│ → return 3                                             │
└────────────────────────────────────────────────────────┘

Grid sau khi DFS:
  0  0  0  0  0
  0  0  0  0  0
  0  0  0  0  0
  0  0  0  0  0
```

---

### 🎯 7. Biến thể

```javascript
// Variation 1: Number of Closed Islands (#1259)
// → Đếm đảo KHÔNG chạm biên

// Variation 2: Max Area of Island (#695)
// → Trả về diện tích lớn nhất thay vì số lượng
// → BFS/DFS trả về size, track max

// Variation 3: Flood Fill (#733)
// → Đổi màu 1 vùng thành màu mới
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Number of Islands - DFS Flood Fill
 * Time: O(m × n) | Space: O(m × n) recursion stack
 */
function numIslands(grid) {
  if (!grid || grid.length === 0) return 0;

  let count = 0;
  const rows = grid.length;
  const cols = grid[0].length;

  function dfs(r, c) {
    if (r < 0 || c < 0 || r >= rows || c >= cols) return;
    if (grid[r][c] === '0') return;
    grid[r][c] = '0'; // In-place visited
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        count++;
        dfs(r, c);
      }
    }
  }

  return count;
}
```

---

## 🧪 Test Cases

```javascript
// Test 1 - 1 đảo lớn
console.log(numIslands([
  ['1','1','1'],
  ['1','1','1'],
  ['1','1','1']
])); // 1

// Test 2 - 3 đảo riêng biệt
console.log(numIslands([
  ['1','0','1'],
  ['0','0','0'],
  ['1','0','1']
])); // 3

// Test 3 - Không có đảo
console.log(numIslands([
  ['0','0'],
  ['0','0']
])); // 0

// Test 4 - Một ô
console.log(numIslands([['1']])); // 1

// Test 5 - Đảo chạm biên
console.log(numIslands([
  ['1','1','1'],
  ['0','1','0'],
  ['1','1','1']
])); // 1
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: DFS Flood Fill trên Grid 2D

💡 KEY INSIGHT:
   "Đánh dấu '0' ngay trong DFS = visited không cần Set"
   "Grid = Implicit Graph — không cần adjacency list"

⚠️ PITFALLS:
   - Check bounds TRƯỚC khi truy cập grid[r][c]
   - Đánh dấu '0' ngay sau khi check != '0'

🔄 VARIATIONS:
   - Max Area of Island (#695) → track size
   - Number of Closed Islands → không đếm đảo chạm biên

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Max Area of Island (#695)
// Trả về diện tích lớn nhất thay vì số lượng
function maxAreaOfIsland(grid) {
  let max = 0;
  
  function dfs(r, c) {
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) return 0;
    if (grid[r][c] === 0) return 0;
    grid[r][c] = 0;
    return 1 + dfs(r+1,c) + dfs(r-1,c) + dfs(r,c+1) + dfs(r,c-1);
  }
  
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === 1) {
        max = Math.max(max, dfs(r, c));
      }
    }
  }
  return max;
}

// Variation 2: Number of Closed Islands (#1259)
// Đếm đảo KHÔNG chạm biên
function closedIsland(grid) {
  const rows = grid.length, cols = grid[0].length;
  
  function dfs(r, c) {
    if (r < 0 || c < 0 || r >= rows || c >= cols) return false;
    if (grid[r][c] === 1) return true;
    grid[r][c] = 1;
    const top = dfs(r-1, c);
    const bottom = dfs(r+1, c);
    const left = dfs(r, c-1);
    const right = dfs(r, c+1);
    return top && bottom && left && right;
  }
  
  let count = 0;
  for (let r = 1; r < rows-1; r++) {
    for (let c = 1; c < cols-1; c++) {
      if (grid[r][c] === 0 && dfs(r, c)) count++;
    }
  }
  return count;
}

// Variation 3: Flood Fill (#733)
// Đổi màu 1 vùng
function floodFill(image, sr, sc, newColor) {
  const oldColor = image[sr][sc];
  if (oldColor === newColor) return image;
  
  function dfs(r, c) {
    if (r < 0 || c < 0 || r >= image.length || c >= image[0].length) return;
    if (image[r][c] !== oldColor) return;
    image[r][c] = newColor;
    dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1);
  }
  
  dfs(sr, sc);
  return image;
}

// Variation 4: Surrounded Regions (#130)
// Đổi 'O' bị bao bọc thành 'X'
function solve(board) {
  const rows = board.length, cols = board[0].length;
  
  function dfs(r, c) {
    if (r < 0 || c < 0 || r >= rows || c >= cols) return;
    if (board[r][c] !== 'O') return;
    board[r][c] = '#';
    dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1);
  }
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === 0 || c === 0 || r === rows-1 || c === cols-1) {
        dfs(r, c);
      }
    }
  }
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] === 'O') board[r][c] = 'X';
      if (board[r][c] === '#') board[r][c] = 'O';
    }
  }
}

// Variation 5: Island Perimeter (#463)
// Chu vi đảo
function islandPerimeter(grid) {
  let perimeter = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === 1) {
        perimeter += 4;
        if (r > 0 && grid[r-1][c] === 1) perimeter -= 2;
        if (c > 0 && grid[r][c-1] === 1) perimeter -= 2;
      }
    }
  }
  return perimeter;
}
```

---

## ➡️ Bài tiếp theo

[Bài 2: Clone Graph](./002-clone-graph.md)
