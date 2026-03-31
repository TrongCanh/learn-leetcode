# #323 - Number of Connected Components in Undirected Graph

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Graph, DFS, BFS, Union-Find |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/

---

## 📖 Đề bài

### Mô tả
Cho `n` nodes đánh số `0` đến `n-1` và một mảng `edges` biểu diễn các cạnh không có hướng. Đếm số **connected components** (nhóm nodes liền kề) trong đồ thị.

### Ví dụ

**Example 1:**
```
Input: n = 5, edges = [[0,1],[1,2],[3,4]]
Output: 2
Giải thích: {0,1,2} và {3,4} là 2 connected components
```

**Example 2:**
```
Input: n = 5, edges = [[0,1],[1,2],[2,3],[3,4]]
Output: 1
Giải thích: Tất cả 5 nodes đều liền kề nhau
```

### Constraints
```
1 <= n <= 2000
0 <= edges.length <= n * (n - 1) / 2
edges[i].length == 2
0 <= ui, vi < n
ui != vi
Không có cạnh trùng lặp
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Có bao nhiêu nhóm nodes liền kề nhau?
Mô hình: Đồ thị vô hướng (undirected)
Connected component = nhóm nodes có path giữa mọi cặp
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Nghĩ brute force

> **Hỏi:** "Làm sao đếm connected components?"

Với mỗi node chưa visited, bắt đầu DFS/BFS → đánh dấu tất cả nodes trong cùng component → count++

```
→ Classic: DFS/BFS traversal → O(V + E)
```

---

#### Bước 2: "Aha moment!"

> **Aha moment:**
> **Vấn đề đặc biệt:** Có nodes có thể **không có cạnh nào** (isolated nodes)!
>
> **→ Phải duyệt TẤT CẢ n nodes, không chỉ duyệt edges**
>
> ```
> {0,1,2} connected + {3} isolated + {4} isolated → 3 components
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Duyệt TẤT CẢ n nodes, không chỉ duyệt edges"  │
│   → Isolated nodes cũng là 1 component!            │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Undirected graph: A↔B và B↔A là cùng 1 edge"  │
│   → Thêm cạnh 2 chiều khi xây adjacency list       │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Union-Find là solution tự nhiên nhất"          │
│   → Mỗi edge union 2 components                   │
│   → Đếm số unique roots = số components           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Chỉ duyệt nodes có trong edges
function countComponents(n, edges) {
  // ❌ Sai: bỏ qua isolated nodes (nodes không có edge nào)
  // Duyệt edges có thể miss isolated nodes
  const visited = new Set();
  for (const [a, b] of edges) {
    if (!visited.has(a)) {
      // ...
    }
  }
}
// ✅ Đúng: Duyệt tất cả n nodes từ 0 đến n-1

// ❌ Pitfall 2: Thêm 1 chiều trong undirected graph
graph[a].push(b); // ✅
graph[b].push(a); // ✅ Cần thêm cả 2 chiều!

// ❌ Pitfall 3: Union-Find - không khởi tạo parent đúng
class UnionFind {
  constructor(n) {
    // ❌ parent = n (sai! mỗi node phải là chính nó)
    this.parent = n;
    // ✅
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(1);
  }
}
```

---

### 🔄 5. Các hướng tiếp cận

#### 🔹 Cách 1: DFS (O(V + E)) ⭐

```javascript
function countComponents(n, edges) {
  const graph = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    graph[a].push(b);
    graph[b].push(a);
  }

  const visited = new Set();
  let count = 0;

  function dfs(node) {
    visited.add(node);
    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) dfs(neighbor);
    }
  }

  for (let i = 0; i < n; i++) {
    if (!visited.has(i)) {
      count++;
      dfs(i);
    }
  }

  return count;
}
```

---

#### 🔹 Cách 2: Union-Find (O(V + α(E))) ⭐

```javascript
class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(1);
  }

  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(x, y) {
    const px = this.find(x);
    const py = this.find(y);
    if (px === py) return; // Same set

    if (this.rank[px] < this.rank[py]) {
      this.parent[px] = py;
    } else if (this.rank[px] > this.rank[py]) {
      this.parent[py] = px;
    } else {
      this.parent[py] = px;
      this.rank[px]++;
    }
  }
}

function countComponents(n, edges) {
  const uf = new UnionFind(n);
  for (const [a, b] of edges) {
    uf.union(a, b);
  }
  // Đếm số unique roots
  const roots = new Set();
  for (let i = 0; i < n; i++) {
    roots.add(uf.find(i));
  }
  return roots.size;
}
```

**📊 Phân tích:**
```
Time:  O(V + α(E)) — α = inverse Ackermann ≈ constant
Space: O(V)
```

---

### 🚀 6. Visual Walkthrough

```
n=5, edges=[[0,1],[1,2],[3,4]]

Adjacency List:
  0 → [1]
  1 → [0, 2]
  2 → [1]
  3 → [4]
  4 → [3]

DFS Traversal:
  i=0: not visited → count=1 → dfs(0) → {0,1,2}
  i=1: visited → skip
  i=2: visited → skip
  i=3: not visited → count=2 → dfs(3) → {3,4}
  i=4: visited → skip

→ return 2 ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Number of Connected Components - DFS
 * Time: O(V + E) | Space: O(V + E)
 */
function countComponents(n, edges) {
  const graph = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    graph[a].push(b);
    graph[b].push(a);
  }

  const visited = new Set();
  let count = 0;

  function dfs(node) {
    visited.add(node);
    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) dfs(neighbor);
    }
  }

  for (let i = 0; i < n; i++) {
    if (!visited.has(i)) {
      count++;
      dfs(i);
    }
  }

  return count;
}
```

---

## 🧪 Test Cases

```javascript
console.log(countComponents(5, [[0,1],[1,2],[3,4]])); // 2

console.log(countComponents(5, [[0,1],[1,2],[2,3],[3,4]])); // 1

console.log(countComponents(4, [])); // 4 (all isolated)

console.log(countComponents(3, [[0,1]])); // 2

console.log(countComponents(6, [[0,1],[2,3],[4,5]])); // 3
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Connected Components trong Undirected Graph

💡 KEY INSIGHT:
   "Duyệt TẤT CẢ n nodes (không chỉ edges)"
   "Undirected = thêm 2 chiều"
   "Union-Find: count unique roots"

⚠️ PITFALLS:
   - Bỏ qua isolated nodes
   - Union-Find: parent[i] = i (không phải n)

🔄 VARIATIONS:
   - Graph Valid Tree (#261) → n-1 edges + connected = cây
   - Number of Islands (#200) → grid nhưng tương tự

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Number of Provinces (#547)
// Tương tự nhưng với adjacency matrix
function findCircleNum(isConnected) {
  const n = isConnected.length;
  const visited = new Set();
  
  function dfs(i) {
    for (let j = 0; j < n; j++) {
      if (isConnected[i][j] === 1 && !visited.has(j)) {
        visited.add(j);
        dfs(j);
      }
    }
  }
  
  let count = 0;
  for (let i = 0; i < n; i++) {
    if (!visited.has(i)) {
      count++;
      visited.add(i);
      dfs(i);
    }
  }
  return count;
}

// Variation 2: Friend Circles (#547)
// Tương tự Number of Provinces

// Variation 3: Connected Components in Undirected Graph
// Với danh sách edges

// Variation 4: Count Connected Components of Size K
// Đếm components có đúng K nodes

// Variation 5: Largest Component Size (#952)
// Component lớn nhất
function largestComponentSize(nums) {
  const parent = {};
  for (let i = 0; i < nums.length; i++) parent[i] = i;
  
  function find(x) {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }
  
  for (const [a, b] of edges) {
    parent[find(a)] = find(b);
  }
  
  const count = {};
  for (const i of Object.keys(parent)) {
    const root = find(i);
    count[root] = (count[root] || 0) + 1;
  }
  
  return Math.max(...Object.values(count));
}
```

---

## ➡️ Bài tiếp theo

[Bài 6: Rotting Oranges](./006-rotting-oranges.md)
