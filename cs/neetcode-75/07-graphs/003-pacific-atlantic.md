# #417 - Pacific Atlantic Water Flow

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Graph, DFS, BFS |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/pacific-atlantic-water-flow/

---

## 📖 Đề bài

### Mô tả
Cho một lưới `m × n` với độ cao tại mỗi ô. Tìm các ô mà nước có thể chảy được **đồng thời** đến cả **Pacific Ocean** (biên trên + biên trái) và **Atlantic Ocean** (biên dưới + biên phải).

Nước chỉ có thể chảy từ ô cao → ô thấp hơn hoặc bằng (4 hướng).

### Ví dụ

**Example 1:**
```
Input:
  Pacific ~ ~ ~ ~ ~
  ~   1  2  2  3 (5)
  ~   3  2  5 (5)  4
  ~   2  4 (5)  5  3
  ~  (6) 7  1  4  5
  ~ (5) 1  1  2  4
                  ~ Atlantic

Output: [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]
```

### Constraints
```
m == heights.length
n == heights[i].length
1 <= m, n <= 200
0 <= heights[i][j] <= 10^5
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Ô nào chảy được đến CẢ 2 đại dương?
Ràng buộc: Chảy từ cao → thấp hơn hoặc bằng
Biên: Pacific (top + left), Atlantic (bottom + right)
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Nghĩ brute force

> **Hỏi:** "Làm sao kiểm tra 1 ô?"

Từ ô đó, DFS/BFS theo 4 hướng để tìm xem có đến được Pacific và Atlantic không.

```
→ O(m × n) ô × O(m × n) traversal = O((mn)²) → QUÁ CHẬM!
```

---

#### Bước 2: "Aha moment!" — ĐẢO NGƯỢC suy nghĩ

> **Aha moment:**
> "Thay vì đi TỪ ô đến đại dương → ĐI NGƯỢC TỪ đại dương!"
>
> **Từ biên Pacific**, BFS/DFS đi ngược vào trong theo rule "cao → thấp/ngang"
>
> **→ Mọi ô reachable từ Pacific = có thể chảy ra Pacific**
>
> **Tương tự Atlantic**
>
> **→ Ô nào reachable từ CẢ 2 = câu trả lời!**

```
→ Complexity: O(m × n) × 2 = O(m × n) ✓
```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "ĐẢO NGƯỢC bài toán"                            │
│   → Thay vì: Từ ô → Pacific/Atlantic              │
│   → Đi: Từ Pacific/Atlantic → ô                  │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Pacific = top row + left col"                 │
│   "Atlantic = bottom row + right col"             │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Reachability từ 2 nguồn = intersection"       │
│   → pacificSet ∩ atlanticSet = kết quả           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: DFS đi từ ô ra biên (brute force → chậm)
// Thay vì đó, dùng approach đảo ngược

// ❌ Pitfall 2: Check điều kiện sai khi DFS
// Nước chảy: từ CAO → THẤP hoặc BẰNG
function dfs(r, c, visited, heights) {
  // ❌ Sai: chỉ cho phép cao → thấp
  if (heights[nr][nc] < heights[r][c]) return;
  // ✅ Đúng: cho phép cao → thấp HOẶC ngang
  if (heights[nr][nc] > heights[r][c]) return;
  // → Nước không chảy ngược lên!
}

// ❌ Pitfall 3: Không reset visited cho mỗi ocean
let visited = new Set(); // ❌ Dùng chung!
// ✅ Tạo 2 visited riêng: visitedPacific, visitedAtlantic
```

---

### 🔄 5. Các hướng tiếp cận

#### 🔹 Cách 1: DFS đảo ngược (O(m × n)) ⭐

```javascript
function pacificAtlantic(heights) {
  if (!heights || heights.length === 0) return [];

  const rows = heights.length;
  const cols = heights[0].length;
  const pac = Array.from({ length: rows }, () => Array(cols).fill(false));
  const atl = Array.from({ length: rows }, () => Array(cols).fill(false));
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  function dfs(r, c, visited, ocean) {
    visited[r][c] = true;
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      // Check bounds
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
      // Đã visited
      if (visited[nr][nc]) continue;
      // Nước chảy từ ô mới về ô hiện tại → ô mới phải >= ô hiện
      if (heights[nr][nc] < heights[r][c]) continue;

      dfs(nr, nc, visited, ocean);
    }
  }

  // DFS từ Pacific (top row + left col)
  for (let c = 0; c < cols; c++) dfs(0, c, pac, 'pac');
  for (let r = 0; r < rows; r++) dfs(r, 0, pac, 'pac');

  // DFS từ Atlantic (bottom row + right col)
  for (let c = 0; c < cols; c++) dfs(rows - 1, c, atl, 'atl');
  for (let r = 0; r < rows; r++) dfs(r, cols - 1, atl, 'atl');

  // Intersection
  const result = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pac[r][c] && atl[r][c]) {
        result.push([r, c]);
      }
    }
  }

  return result;
}
```

**📊 Phân tích:**
```
Time:  O(m × n) — mỗi ô visited tối đa 2 lần
Space: O(m × n) — visited arrays + recursion stack
```

---

### 🚀 6. Visual Walkthrough

```
Heights:
  1  2  2  3  5
  3  2  5  4  4
  2  4  5  4  3
  6  7  1  4  5
  5  1  1  2  4

Pacific reachable (DFS từ top + left):
  1  1  1  1  1
  1  1  1  1  0
  1  1  1  0  0
  1  1  0  0  0
  1  0  0  0  0

Atlantic reachable (DFS từ bottom + right):
  0  0  0  0  1
  0  0  0  1  1
  0  0  1  1  1
  1  1  1  1  1
  1  1  1  1  1

Intersection (Pacific AND Atlantic):
  [0,4] ✓
  [1,3] ✓
  [1,4] ✓
  [2,2] ✓
  [3,0] ✓
  [3,1] ✓
  [4,0] ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Pacific Atlantic Water Flow - Reverse DFS
 * Time: O(m × n) | Space: O(m × n)
 */
var pacificAtlantic = function(heights) {
  if (!heights || heights.length === 0) return [];

  const rows = heights.length;
  const cols = heights[0].length;
  const pac = Array.from({ length: rows }, () => Array(cols).fill(false));
  const atl = Array.from({ length: rows }, () => Array(cols).fill(false));
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  function dfs(r, c, visited) {
    visited[r][c] = true;
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
      if (visited[nr][nc]) continue;
      if (heights[nr][nc] < heights[r][c]) continue;
      dfs(nr, nc, visited);
    }
  }

  for (let c = 0; c < cols; c++) { dfs(0, c, pac); dfs(rows - 1, c, atl); }
  for (let r = 0; r < rows; r++) { dfs(r, 0, pac); dfs(r, cols - 1, atl); }

  const result = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pac[r][c] && atl[r][c]) result.push([r, c]);
    }
  }
  return result;
};
```

---

## 🧪 Test Cases

```javascript
console.log(pacificAtlantic([
  [1,2,2,3,5],
  [3,2,5,4,4],
  [2,4,5,4,3],
  [6,7,1,4,5],
  [5,1,1,2,4]
]));
// [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]

console.log(pacificAtlantic([[1]])); // [[0,0]]

console.log(pacificAtlantic([
  [1,2],
  [3,4]
]));
// [[0,1],[1,0],[1,1]]
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Reverse BFS/DFS từ biên

💡 KEY INSIGHT:
   "ĐI NGƯỢC từ biên vào trong"
   "Pacific = top row + left col"
   "Atlantic = bottom row + right col"
   "Nước chảy: cao → thấp/ngang (= không giảm)"

⚠️ PITFALLS:
   - Nước chảy cao → thấp HOẶC BẰNG
   - Tạo visited riêng cho mỗi ocean

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Pacific Atlantic Water Flow II
// Tương tự nhưng lấy tất cả cells

// Variation 2: Matrix Land
// Tìm điểm cao nhất có thể reach

// Variation 3: Reachable Nodes in Directed Graph
// Tìm tất cả nodes reachable từ source

// Variation 4: Flood Fill from Multiple Sources
// Flood fill từ nhiều sources cùng lúc

// Variation 5: Walls and Gates (#286)
// Fill rooms gần gates nhất
```

---

## ➡️ Bài tiếp theo

[Bài 4: Course Schedule](./004-course-schedule.md)
