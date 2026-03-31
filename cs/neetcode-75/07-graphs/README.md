# 📊 Graphs

> **Tuần 7** | **10 bài** | **🟡🟡🔴** | ⏱️ ~1.5 tuần

---

## 🎯 MỤC TIÊU TUẦN NÀY

- [ ] Nắm vững 2 cách duyệt Graph: **DFS** và **BFS**
- [ ] Hiểu **Topological Sort** và **Union Find**
- [ ] Biết khi nào dùng DFS vs BFS
- [ ] Thành thạo các graph problems kinh điển

---

## 📖 TỔNG QUAN

### Graph là gì?

**Graph** gồm các **vertices (nodes)** và **edges (cạnh)** nối giữa các nodes.

```
Graph ví dụ:

    A ----- B
   /|       |\
  C |       | D
   \|       |/
    E ----- F

Vertices: A, B, C, D, E, F
Edges: (A,B), (A,C), (A,E), (B,D), (B,F), (E,F), (C,E), (D,F)
```

### Các loại Graph:

```
┌──────────────────┬──────────────────────────────────┐
│ Loại             │ Mô tả                           │
├──────────────────┼──────────────────────────────────┤
│ Directed         │ Cạnh có hướng (→)              │
│ Undirected       │ Cạnh không hướng (—)            │
│ Weighted         │ Cạnh có trọng số                │
│ Unweighted       │ Cạnh không trọng số              │
│ Cyclic           │ Có chu trình                    │
│ Acyclic          │ Không có chu trình (DAG)        │
│ Connected        │ Mọi vertex đều có path đến nhau │
│ Disconnected     │ Có vertex không kết nối         │
└──────────────────┴──────────────────────────────────┘
```

### Biểu diễn Graph:

#### 1. Adjacency List (Phổ biến nhất)

```javascript
// Undirected Graph
const undirected = {
  A: ['B', 'C', 'E'],
  B: ['A', 'D', 'F'],
  C: ['A', 'E'],
  D: ['B', 'F'],
  E: ['A', 'C', 'F'],
  F: ['B', 'D', 'E']
};

// Directed Graph
const directed = {
  A: ['B', 'C'],
  B: ['D'],
  C: ['E'],
  D: ['F'],
  E: ['D', 'F'],
  F: []
};

// Weighted Graph
const weighted = {
  A: [['B', 4], ['C', 2]],
  B: [['A', 4], ['D', 5]],
  C: [['A', 2], ['E', 3]],
  D: [['B', 5], ['F', 1]],
  E: [['C', 3], ['F', 6]],
  F: [['D', 1], ['E', 6]]
};
```

#### 2. Adjacency Matrix

```javascript
// 4 nodes: A(0), B(1), C(2), D(3)
const matrix = [
  [0, 1, 1, 0],  // A: connected to B, C
  [1, 0, 0, 1],  // B: connected to A, D
  [1, 0, 0, 1],  // C: connected to A, D
  [0, 1, 1, 0]   // D: connected to B, C
];

// Weighted (Infinity = no edge)
const weightedMatrix = [
  [0,   4,   2, Infinity],
  [4,   0, Infinity, 5   ],
  [2, Infinity, 0,   3   ],
  [Infinity, 5, 3,   0   ]
];
```

#### So sánh:

```
┌────────────────┬─────────────────┬──────────────────┐
│    Criteria    │ Adjacency List  │ Adjacency Matrix │
├────────────────┼─────────────────┼──────────────────┤
│ Space (sparse)│  O(V + E) ✅    │  O(V²)           │
│ Space (dense)  │  O(V + E)      │  O(V²)           │
│ Add Edge       │  O(1) ✅        │  O(1) ✅         │
│ Remove Edge    │  O(E)           │  O(1)            │
│ Query Edge     │  O(E)           │  O(1)            │
│ Traverse       │  O(V + E) ✅    │  O(V²)           │
└────────────────┴─────────────────┴──────────────────┘

→ Dùng Adjacency List cho hầu hết bài toán
```

---

## 🔄 DFS vs BFS

### DFS (Depth-First Search)

**Đặc điểm:** Đi sâu vào một nhánh trước, sau đó quay lại (backtrack).

```
DFS Order (Preorder-like):
  Start at A → Go deep: A → B → D → F
  Backtrack to B → C? No → backtrack to A
  A → C → E → ...

Visual:
  A ─── B ─── D
  │         │
  C         F
  │
  E

DFS: A → B → D → F → C → E (có thể khác tùy implementation)
```

```javascript
// DFS Recursive
function dfs(graph, node, visited = new Set()) {
  if (visited.has(node)) return;

  visited.add(node);
  console.log(node);  // Process node

  for (const neighbor of graph[node]) {
    dfs(graph, neighbor, visited);
  }
}

// DFS Iterative (dùng Stack)
function dfsIterative(graph, start) {
  const visited = new Set();
  const stack = [start];
  const result = [];

  while (stack.length > 0) {
    const node = stack.pop();

    if (visited.has(node)) continue;
    visited.add(node);
    result.push(node);

    // Thêm neighbors vào stack (LIFO = DFS order)
    for (const neighbor of graph[node].reverse()) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
      }
    }
  }

  return result;
}
```

### BFS (Breadth-First Search)

**Đặc điểm:** Duyệt theo từng level, từ gần ra xa.

```
BFS Order:
  Start at A → Visit all at distance 1: B, C, E
  Then distance 2: D, F
  Then distance 3: (none)

Visual:
  A (level 0)
  ├── B, C, E (level 1)
  │    ├── D, F (level 2)

BFS: A → B → C → E → D → F (level by level)
```

```javascript
// BFS với Queue
function bfs(graph, start) {
  const visited = new Set();
  const queue = [start];
  const result = [];

  visited.add(start);

  while (queue.length > 0) {
    const node = queue.shift();
    result.push(node);

    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return result;
}

// BFS với Level Tracking
function bfsLevelOrder(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const levelSize = queue.length;
    const level = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      level.push(node.val);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(level);
  }

  return result;
}
```

### Visual: DFS vs BFS

```
Graph:
    A
   /|\
  B C D
  |/|\
  E F G

DFS (stack):  A → B → E → C → F → G → D
BFS (queue):  A → B → C → D → E → F → G

┌────────────────────────────────────────────────────┐
│  DFS:                                                     │
│    Stack: [A] → pop A, push B,C,D → [D,C,B]            │
│            → pop B, push E → [D,C,E]                     │
│            → pop E → [D,C]                               │
│            → pop D, push... → [C]                        │
│            → pop C, push F,G → [G,F]                     │
│            → pop G → [F] → pop F                        │
│                                                     │
│  BFS:                                                     │
│    Queue: [A] → dequeue A, enqueue B,C,D → [B,C,D]       │
│            → dequeue B, enqueue E → [C,D,E]              │
│            → dequeue C, enqueue F,G → [D,E,F,G]          │
│            → dequeue D (no neighbors) → [E,F,G]         │
│            → dequeue E (no neighbors) → [F,G]            │
│            → dequeue F, G...                             │
└────────────────────────────────────────────────────┘
```

---

## 🔄 PATTERNS CỐT LÕI

### Pattern 1: Number of Islands (DFS/BFS Flood Fill)

**🤔 Tư duy:** Grid là graph 2D. Mỗi ô `'1'` là một node. Khi tìm thấy `'1'`, ta "lan tràn" (flood fill) tất cả các ô `'1'` liền kề (4 directions) bằng cách đánh dấu chúng thành `'0'`. Đếm số lần bắt đầu flood fill = số islands.

**🔍 Dùng khi:**
- Đếm số islands (vùng đất liền kề) trong grid
- Flood fill ( Paint tool, image processing)
- Đếm số regions trong binary matrix
- "Number of provinces", "Number of closed islands"

**📝 Tại sao flood fill hoạt động:** Khi ta đánh dấu `'1'` → `'0'` tại một điểm, ta đảm bảo không đếm lại island đó lần thứ hai. Mỗi `'1'` được visited đúng 1 lần. Flood fill đệ quy/iterative đảm bảo tất cả ô liền kề của cùng một island đều được đánh dấu.

**💻 Code mẫu:**

```javascript
// LeetCode 200: Number of Islands

// ✅ DFS — O(m·n) time, O(m·n) space (call stack)
function numIslands(grid) {
  if (!grid || grid.length === 0) return 0;

  let count = 0;
  const m = grid.length, n = grid[0].length;

  function dfs(i, j) {
    if (i < 0 || i >= m || j < 0 || j >= n || grid[i][j] === '0') {
      return;
    }

    grid[i][j] = '0';  // Đánh dấu visited

    dfs(i + 1, j);     // Flood fill 4 directions
    dfs(i - 1, j);
    dfs(i, j + 1);
    dfs(i, j - 1);
  }

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === '1') {
        count++;
        dfs(i, j);  // Flood fill cả island
      }
    }
  }

  return count;
}

// ✅ BFS — O(m·n) time, O(m·n) space (queue)
function numIslandsBFS(grid) {
  if (!grid || grid.length === 0) return 0;

  let count = 0;
  const m = grid.length, n = grid[0].length;
  const queue = [];

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === '1') {
        count++;
        queue.push([i, j]);
        grid[i][j] = '0';

        while (queue.length > 0) {
          const [r, c] = queue.shift();
          const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
          for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] === '1') {
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

**🔍 Visual — Trace với grid:**

```
Grid:
  1 1 0 0 0
  1 1 0 0 0
  0 0 1 0 0
  0 0 0 1 1

Step 1: (0,0) = '1' → count=1 → dfs(0,0) → flood fill:
        (0,0)→(0,1)→(1,0)→(1,1) → marked '0'
        Island 1: (0,0)(0,1)(1,0)(1,1)

Step 2: (0,2) = '0' → skip
Step 3: (2,2) = '1' → count=2 → dfs(2,2) → flood fill
        Island 2: (2,2)

Step 4: (3,3) = '1' → count=3 → dfs(3,3) → flood fill
        (3,3)→(3,4) → marked '0'
        Island 3: (3,3)(3,4)

Result: 3 islands ✓
```

---

### Pattern 2: Clone Graph (BFS/DFS)

**🤔 Tư duy:** Deep copy graph = tạo node mới cho mỗi node cũ, giữ nguyên kết nối. Dùng **HashMap** để map `oldNode → newNode`. Khi gặp neighbor, nếu chưa có trong map → tạo node mới. Nếu đã có → reuse.

**🔍 Dùng khi:**
- Deep copy graph với preserved connections
- Clone linked structures
- Tạo copy của data structure có references

**📝 Tại sao dùng HashMap:** Mà không dùng visited Set thông thường? Vì visited Set chỉ cho biết node đã visited hay chưa. HashMap cho biết: (1) đã visited chưa, (2) node mới tương ứng với node cũ nào → để update neighbors. Không có map, không thể tạo đúng connections.

**💻 Code mẫu:**

```javascript
// LeetCode 133: Clone Graph

// ✅ BFS
function cloneGraph(node) {
  if (!node) return null;

  const visited = new Map();  // oldNode → newNode
  const queue = [node];
  const cloneNode = new Node(node.val);
  visited.set(node, cloneNode);

  while (queue.length > 0) {
    const curr = queue.shift();

    for (const neighbor of curr.neighbors) {
      if (!visited.has(neighbor)) {
        visited.set(neighbor, new Node(neighbor.val));
        queue.push(neighbor);
      }
      // Thêm neighbor vào clone
      visited.get(curr).neighbors.push(visited.get(neighbor));
    }
  }

  return cloneNode;
}

// ✅ DFS Recursive
function cloneGraphDFS(node) {
  if (!node) return null;
  if (visited.has(node)) return visited.get(node);

  const cloneNode = new Node(node.val);
  visited.set(node, cloneNode);

  for (const neighbor of node.neighbors) {
    cloneNode.neighbors.push(cloneGraphDFS(neighbor));
  }

  return cloneNode;
}
```

---

### Pattern 3: Topological Sort

**🤔 Tư duy:** Topological Sort sắp xếp các nodes theo thứ tự sao cho mọi edges đi từ trước → sau. Dùng **In-Degree**: đếm số prerequisites của mỗi node. Bắt đầu với nodes có in-degree = 0 (không có prerequisites) → remove khỏi graph → giảm in-degree của neighbors → lặp.

**🔍 Dùng khi:**
- Course Schedule (xem có thể hoàn thành tất cả courses không)
- Build Order (thứ tự build files/packages)
- Task Scheduling có dependencies
- Kiểm tra cycle trong directed graph

**📝 Tại sao dùng In-Degree:** In-degree = số edges đi vào một node = số prerequisites. Khi in-degree = 0, không có gì phụ thuộc vào node đó → có thể xử lý nó ngay. Sau khi xử lý, ta "loại bỏ" nó khỏi graph → giảm in-degree của nodes phụ thuộc nó.

**💻 Code mẫu:**

```javascript
// LeetCode 207: Course Schedule — BFS + In-Degree
function canFinish(numCourses, prerequisites) {
  const graph = Array.from({ length: numCourses }, () => []);
  const inDegree = Array(numCourses).fill(0);

  for (const [course, prereq] of prerequisites) {
    graph[prereq].push(course);
    inDegree[course]++;
  }

  const queue = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }

  let completed = 0;

  while (queue.length > 0) {
    const course = queue.shift();
    completed++;

    for (const next of graph[course]) {
      inDegree[next]--;
      if (inDegree[next] === 0) queue.push(next);
    }
  }

  return completed === numCourses;
}
```

**🔍 Visual — Trace với `numCourses = 5`, `prerequisites = [[1,0],[2,0],[3,1],[3,2],[4,3]]`:**

```
Graph:
  0 → 1 → 3 → 4
  0 → 2 ↗
         ↘ 3

In-degree: [0, 1, 1, 2, 1]

Step 1: queue = [0] (in-degree = 0)
        complete 0 → in-degree[1]-- → 0 → queue=[1]
                          in-degree[2]-- → 0 → queue=[1,2]
        ┌──────────────────────────────────────────┐
        │  Queue: [0] → [1,2]  Completed: 1        │
        └──────────────────────────────────────────┘

Step 2: process 1 → in-degree[3]-- → 1 → queue=[2]
Step 3: process 2 → in-degree[3]-- → 0 → queue=[3]
        ┌──────────────────────────────────────────┐
        │  Queue: [2] → [3]  Completed: 3          │
        └──────────────────────────────────────────┘

Step 4: process 3 → in-degree[4]-- → 0 → queue=[4]
Step 5: process 4 → completed=5

Topological Order: 0 → 1 → 2 → 3 → 4 ✓
All courses can be finished!
```

---

### Pattern 4: Connected Components (DFS vs Union Find)

**🤔 Tư duy:** Connected component = nhóm nodes có path giữa mọi cặp. DFS: duyệt tất cả nodes reachable từ một start → đánh dấu visited → đếm. Union Find: union các edges → count unique roots.

**🔍 Dùng khi:**
- Đếm số connected components
- Number of Provinces (LeetCode 547)
- Network connectivity
- Accounts Merge

**📝 Tại sao Union Find tốt cho connected components:**
- Union Find: O(α(n)) ≈ O(1) amortized cho mỗi union/find
- DFS: O(V+E) cho mỗi component → O(V+E) tổng
- Union Find đặc biệt tốt khi có nhiều union operations (edges được thêm vào liên tục)
- DFS trực quan và dễ implement hơn cho graph nhỏ

**💻 Code mẫu:**

```javascript
// ✅ DFS — O(V+E)
function countComponentsDFS(n, edges) {
  const graph = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    graph[a].push(b);
    graph[b].push(a);
  }

  let count = 0;
  const visited = new Set();

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

// ✅ Union Find — O(V+E) với α(n) amortized
function countComponentsUF(n, edges) {
  const parent = Array.from({ length: n }, (_, i) => i);

  function find(x) {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }

  function union(x, y) {
    const px = find(x), py = find(y);
    if (px === py) return;
    parent[px] = py;
  }

  for (const [a, b] of edges) union(a, b);

  return new Set(Array.from({ length: n }, (_, i) => find(i))).size;
}
```

**🔍 Visual — Union Find với edges `[[0,1],[1,2],[3,4]]`:**

```
Edges: [[0,1], [1,2], [3,4]]

Initial: parent[i] = i
         [0] [1] [2] [3] [4]
         ─── ─── ─── ─── ───
         0   1   2   3   4

Union(0,1): parent[1] = 0
         [0] [1] [2] [3] [4]
         ─── ─── ─── ─── ───
         0   0   2   3   4

Union(1,2): find(1) = 0, parent[0] = 0
         [0] [1] [2] [3] [4]
         ─── ─── ─── ─── ───
         0   0   0   3   4

Union(3,4): parent[4] = 3
         [0] [1] [2] [3] [4]
         ─── ─── ─── ─── ───
         0   0   0   3   3

Unique roots: {0, 3} → 2 components ✓
```

---

### Pattern 5: BFS Shortest Path

**🤔 Tư duy:** BFS duyệt graph theo từng **level** — tất cả nodes ở distance `d` được visited trước khi bất kỳ node nào ở distance `d+1`. Khi queue chứa nodes của level `d`, tất cả nodes trong queue được expand → tạo ra level `d+1`. Vậy: **level trong BFS = distance từ start**.

**🔍 Dùng khi:**
- Tìm đường đi ngắn nhất trong **unweighted graph**
- Minimum number of steps
- Spread of information (rotting oranges)
- Multi-source BFS

**📝 Tại sao BFS cho shortest path:** BFS đảm bảo khi lần đầu visited một node, đó là khoảng cách **ngắn nhất** từ start. Vì BFS expand theo level tăng dần, không có đường nào ngắn hơn mà chưa được khám phá.

**💻 Code mẫu:**

```javascript
// BFS Shortest Path — O(V+E)
function shortestPath(graph, start, end) {
  const visited = new Set([start]);
  const queue = [[start, 0]];  // [node, distance]

  while (queue.length > 0) {
    const [node, dist] = queue.shift();
    if (node === end) return dist;

    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, dist + 1]);
      }
    }
  }

  return -1;  // Không có path
}
```

---

### Pattern 6: Pacific Atlantic Water Flow

**🤔 Tư duy:** Nước chảy từ cao → thấp. Một cell có thể flow đến Pacific (trên/trái) nếu có path đi lên theo chiều cao không tăng. Tương tự Atlantic (dưới/phải). Cells có thể flow đến **cả hai** = giao của 2 reachable sets.

**🔍 Dùng khi:**
- Pacific Atlantic Water Flow (LeetCode 417)
- Mô hình flow có 2 destinations
- Tìm cells thỏa 2 điều kiện simultaneously

**💻 Code mẫu:**

```javascript
// LeetCode 417: Pacific Atlantic Water Flow
function pacificAtlantic(heights) {
  if (!heights || heights.length === 0) return [];

  const m = heights.length, n = heights[0].length;
  const pacific = Array.from({ length: m }, () => Array(n).fill(false));
  const atlantic = Array.from({ length: m }, () => Array(n).fill(false));

  function dfs(i, j, visited, prevHeight) {
    if (i < 0 || i >= m || j < 0 || j >= n) return;
    if (visited[i][j]) return;
    if (heights[i][j] < prevHeight) return;

    visited[i][j] = true;

    dfs(i + 1, j, visited, heights[i][j]);
    dfs(i - 1, j, visited, heights[i][j]);
    dfs(i, j + 1, visited, heights[i][j]);
    dfs(i, j - 1, visited, heights[i][j]);
  }

  for (let j = 0; j < n; j++) dfs(0, j, pacific, -Infinity);
  for (let i = 0; i < m; i++) dfs(i, 0, pacific, -Infinity);
  for (let j = 0; j < n; j++) dfs(m - 1, j, atlantic, -Infinity);
  for (let i = 0; i < m; i++) dfs(i, n - 1, atlantic, -Infinity);

  const result = [];
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (pacific[i][j] && atlantic[i][j]) {
        result.push([i, j]);
      }
    }
  }

  return result;
}
```

---

### Pattern 7: Minimum Knight Moves (BFS)

**🤔 Tư duy:** BFS với các moves cố định (chess knight: 8 directions). Mỗi step = 1 BFS level. BFS từ origin → target → khoảng cách = số steps. Dùng symmetry và pruning để giảm space.

**🔍 Dùng khi:**
- Minimum Knight Moves (LeetCode 1197)
- Chess moves problems
- Grid movement với specific moves

**💻 Code mẫu:**

```javascript
// LeetCode 1197: Minimum Knight Moves
function minKnightMoves(x, y) {
  x = Math.abs(x);
  y = Math.abs(y);

  if (x === 0 && y === 0) return 0;

  const dirs = [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
  const visited = new Set(['0,0']);
  const queue = [[0, 0, 0]];

  while (queue.length > 0) {
    const [cx, cy, steps] = queue.shift();

    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (nx === x && ny === y) return steps + 1;
      if (nx < -2 || ny < -2) continue;

      const key = `${nx},${ny}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push([nx, ny, steps + 1]);
      }
    }
  }

  return -1;
}
```

---

### Pattern 8: Mô hình hóa bài toán thực tế thành Graph

**🤔 Tư duy:** Nhiều bài toán có vẻ không phải graph nhưng thực ra là. Key insight: nếu có **entities** và có **relationships/edges** giữa chúng → có thể model bằng graph.

**📝 3-4 ví dụ cụ thể:**

```
1. FRIEND CIRCLES (LeetCode 547)
   → Input: Ma trận M[i][j] = 1 nếu i và j là friends
   → Model: Undirected graph, mỗi người = node, friendship = edge
   → Problem: Đếm số connected components (nhóm bạn không liên quan nhau)

2. COURSE SCHEDULE
   → Input: course A cần hoàn thành trước course B
   → Model: Directed graph, course = node, prerequisite = directed edge
   → Problem: Topological sort, kiểm tra cycle

3. NEAREST EXIT FROM MAZE ENTRANCE (LeetCode 1926)
   → Input: Maze grid với walls và passages
   → Model: Grid graph — mỗi cell = node, 4-directional = edges
   → Problem: BFS từ entrance → nearest exit

4. WORD LADDER
   → Input: beginWord, endWord, danh sách các words
   → Model: Mỗi word = node, edges giữa words khác nhau 1 ký tự
   → Problem: BFS shortest path (số transformations ít nhất)
```

---

### Pattern 9: DFS vs BFS — Decision Tree

**🤔 Tư duy:** Chọn DFS hay BFS phụ thuộc vào: (1) cần shortest path? → BFS, (2) cần memory hiệu quả? → tùy shape, (3) recursion natural? → DFS.

**📝 Decision Tree:**

```
Bài toán Graph
    │
    ├── Cần SHORTEST PATH (unweighted)?
    │     └── YES → BFS (Queue)
    │         (Level = distance)
    │
    ├── Tìm CYCLE?
    │     ├── DFS với 3 states ✓
    │     └── Topological Sort? → BFS In-Degree ✓
    │
    ├── Flood Fill / Connected Components?
    │     ├── DFS hoặc BFS đều được ✓
    │     └── Union Find nếu cần nhiều unions ✓
    │
    ├── Tree RẤT SÂU (>1000 nodes)?
    │     └── BFS (Iterative Queue) — tránh stack overflow
    │
    ├── Tree RẤT RỘNG?
    │     └── DFS — O(h) vs O(w) cho BFS
    │
    └── DEFAULT?
          └── DFS (Recursive) — code ngắn, trực quan
```

**📝 So sánh chi tiết:**

| Tiêu chí | DFS | BFS |
|-----------|-----|-----|
| Data structure | Stack / Recursion | Queue |
| Shortest path | ❌ Không đảm bảo | ✅ Đảm bảo |
| Memory | O(h) height | O(w) width |
| Stack overflow | ✅ Có thể (với deep recursion) | ❌ Không |
|找到 solution đầu tiên | Có thể không optimal | Luôn shortest |
| Level-order output | ❌ | ✅ |

---

### Pattern 10: Tại sao Union Find hoạt động?

**🤔 Tư duy:** Union Find dựa trên 2 operations: **Union** (nối 2 nodes vào cùng component) và **Find** (tìm root/parent của một node). Một set là connected khi và chỉ khi tất cả nodes trong set có **cùng root**.

**📝 Hai kỹ thuật tối ưu:**

```
Path Compression: Khi find(x), ta compress path bằng cách cho tất cả
nodes trên đường đi trỏ trực tiếp vào root.

Before find(2):    After find(2):
    0                    0
   /                    /|\
  1                    1 2 3
 /
2
→ Tất cả nodes 1,2,3 đều có root = 0

Union by Rank: Khi union(0,1), gắn root nhỏ hơn vào lớn hơn.
Cân bằng cây → giảm chiều cao → find nhanh hơn.
```

**📝 Tại sao Union Find tốt:** Với cả Path Compression và Union by Rank, `find()` và `union()` có độ phức tạp **α(n)** (inverse Ackermann function) — gần như **O(1)** trong thực tế. Với n = 1 tỷ, α(n) ≈ 4.

**💻 Code mẫu:**

```javascript
class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = Array(n).fill(0);
  }

  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);  // Path compression
    }
    return this.parent[x];
  }

  union(x, y) {
    const px = this.find(x), py = this.find(y);
    if (px === py) return;

    if (this.rank[px] < this.rank[py]) {
      this.parent[px] = py;
    } else if (this.rank[px] > this.rank[py]) {
      this.parent[py] = px;
    } else {
      this.parent[py] = px;
      this.rank[px]++;
    }
  }

  connected(x, y) {
    return this.find(x) === this.find(y);
  }
}
```

```javascript
// LeetCode 200: Number of Islands

// ✅ DFS - O(m·n)
function numIslands(grid) {
  if (!grid || grid.length === 0) return 0;

  let count = 0;
  const m = grid.length, n = grid[0].length;

  function dfs(i, j) {
    // Out of bounds or water
    if (i < 0 || i >= m || j < 0 || j >= n || grid[i][j] === '0') {
      return;
    }

    // Mark as visited
    grid[i][j] = '0';

    // Flood fill 4 directions
    dfs(i + 1, j);
    dfs(i - 1, j);
    dfs(i, j + 1);
    dfs(i, j - 1);
  }

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === '1') {
        count++;
        dfs(i, j);  // Mark entire island as visited
      }
    }
  }

  return count;
}

// ✅ BFS - O(m·n)
function numIslandsBFS(grid) {
  if (!grid || grid.length === 0) return 0;

  let count = 0;
  const m = grid.length, n = grid[0].length;
  const queue = [];

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === '1') {
        count++;
        queue.push([i, j]);
        grid[i][j] = '0';  // Mark visited

        while (queue.length > 0) {
          const [r, c] = queue.shift();
          // Check 4 directions
          const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
          for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] === '1') {
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

**Visual — Number of Islands:**
```
Grid:
  1 1 0 0 0
  1 1 0 0 0
  0 0 1 0 0
  0 0 0 1 1

i=0,j=0 → '1' → count=1 → dfs(0,0) → flood fill island 1
          '1' → count=2 → dfs(2,2) → flood fill island 2
          '1' → count=3 → dfs(3,3) → flood fill island 3

Result: 3 islands
```

---

### Pattern 2: Clone Graph (BFS/DFS)

**Dùng khi:** Clone một graph (deep copy với preserved connections).

```javascript
// LeetCode 133: Clone Graph

// ✅ BFS
function cloneGraph(node) {
  if (!node) return null;

  const visited = new Map();  // oldNode → newNode
  const queue = [node];
  const cloneNode = new Node(node.val);
  visited.set(node, cloneNode);

  while (queue.length > 0) {
    const curr = queue.shift();

    for (const neighbor of curr.neighbors) {
      if (!visited.has(neighbor)) {
        visited.set(neighbor, new Node(neighbor.val));
        queue.push(neighbor);
      }
      // Thêm neighbor vào clone
      visited.get(curr).neighbors.push(visited.get(neighbor));
    }
  }

  return cloneNode;
}

// ✅ DFS Recursive
function cloneGraphDFS(node) {
  if (!node) return null;
  if (visited.has(node)) return visited.get(node);

  const cloneNode = new Node(node.val);
  visited.set(node, cloneNode);

  for (const neighbor of node.neighbors) {
    cloneNode.neighbors.push(cloneGraphDFS(neighbor));
  }

  return cloneNode;
}
```

---

### Pattern 3: Topological Sort

**Dùng khi:** Sắp xếp thứ tự dựa trên dependencies (course schedule, build order).

```javascript
// LeetCode 207: Course Schedule

// ✅ BFS + In-Degree
function canFinish(numCourses, prerequisites) {
  // Build graph và in-degree
  const graph = Array.from({ length: numCourses }, () => []);
  const inDegree = Array(numCourses).fill(0);

  for (const [course, prereq] of prerequisites) {
    graph[prereq].push(course);
    inDegree[course]++;
  }

  // Bắt đầu với courses không có prerequisites
  const queue = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }

  let completed = 0;

  while (queue.length > 0) {
    const course = queue.shift();
    completed++;

    for (const next of graph[course]) {
      inDegree[next]--;
      if (inDegree[next] === 0) {
        queue.push(next);
      }
    }
  }

  return completed === numCourses;
}

// ✅ DFS + Cycle Detection
function canFinishDFS(numCourses, prerequisites) {
  const graph = Array.from({ length: numCourses }, () => []);
  for (const [course, prereq] of prerequisites) {
    graph[prereq].push(course);
  }

  // 0 = unvisited, 1 = visiting (in current path), 2 = visited
  const state = Array(numCourses).fill(0);

  function hasCycle(node) {
    if (state[node] === 1) return true;  // Cycle detected!
    if (state[node] === 2) return false; // Already processed

    state[node] = 1;  // Mark as visiting

    for (const next of graph[node]) {
      if (hasCycle(next)) return true;
    }

    state[node] = 2;  // Mark as visited
    return false;
  }

  for (let i = 0; i < numCourses; i++) {
    if (hasCycle(i)) return false;
  }

  return true;
}
```

**Visual — Topological Sort:**
```
Courses: 0, 1, 2, 3, 4
Prerequisites: [(1,0), (2,0), (3,1), (3,2), (4,3)]

Graph:
  0 → 1 → 3 → 4
  0 → 2 ↗

In-degree: [0, 1, 1, 2, 1]

Step 1: queue = [0] (in-degree = 0)
        complete 0 → in-degree[1]-- → queue=[1], in-degree[2]-- → queue=[1,2]
Step 2: complete 1 → in-degree[3]-- → queue=[2,3]
Step 3: complete 2 → in-degree[3]-- (now 0) → queue=[3]
Step 4: complete 3 → in-degree[4]-- → queue=[4]
Step 5: complete 4

Order: 0 → 1 → 2 → 3 → 4 ✓
```

---

### Pattern 4: Number of Connected Components

**Dùng khi:** Đếm số thành phần liên thông trong undirected graph.

```javascript
// LeetCode 323: Number of Connected Components

// ✅ DFS
function countComponents(n, edges) {
  const graph = Array.from({ length: n }, () => []);

  for (const [a, b] of edges) {
    graph[a].push(b);
    graph[b].push(a);
  }

  let count = 0;
  const visited = new Set();

  function dfs(node) {
    visited.add(node);
    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      }
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

// ✅ Union Find
function countComponentsUnionFind(n, edges) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = Array(n).fill(0);

  function find(x) {
    if (parent[x] !== x) {
      parent[x] = find(parent[x]);  // Path compression
    }
    return parent[x];
  }

  function union(x, y) {
    const px = find(x), py = find(y);
    if (px === py) return;  // Already connected

    if (rank[px] < rank[py]) {
      parent[px] = py;
    } else if (rank[px] > rank[py]) {
      parent[py] = px;
    } else {
      parent[py] = px;
      rank[px]++;
    }
  }

  for (const [a, b] of edges) {
    union(a, b);
  }

  // Count unique parents
  const uniqueParents = new Set();
  for (let i = 0; i < n; i++) {
    uniqueParents.add(find(i));
  }

  return uniqueParents.size;
}
```

**Visual — Union Find:**
```
Edges: [[0,1], [1,2], [3,4]]
Initially: parent[i] = i

Union(0,1): parent[1]=0
Union(1,2): parent[2]=parent[1]=0
Union(3,4): parent[4]=3

Parent array: [0, 0, 0, 3, 3]
Unique roots: {0, 3} → 2 components

Path Compression:
find(2): parent[2]=0 → return 0
find(1): parent[1]=0 → return 0
```

---

### Pattern 5: BFS Shortest Path

**Dùng khi:** Tìm đường đi ngắn nhất trong unweighted graph.

```javascript
// LeetCode 1293: Shortest Path in Binary Grid (similar concept)
function shortestPath(graph, start, end) {
  const visited = new Set([start]);
  const queue = [[start, [start]]];  // [node, path]

  while (queue.length > 0) {
    const [node, path] = queue.shift();

    if (node === end) return path;

    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, [...path, neighbor]]);
      }
    }
  }

  return -1;  // No path found
}

// ✅ Rotting Oranges (LeetCode 994)
function orangesRotting(grid) {
  const queue = [];
  const m = grid.length, n = grid[0].length;
  let fresh = 0;

  // Init: thêm tất cả rotten oranges vào queue
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === 2) queue.push([i, j, 0]);
      if (grid[i][j] === 1) fresh++;
    }
  }

  if (fresh === 0) return 0;

  let minutes = 0;
  const dirs = [[1,0], [-1,0], [0,1], [0,-1]];

  while (queue.length > 0) {
    const [r, c, time] = queue.shift();
    minutes = time;

    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] === 1) {
        grid[nr][nc] = 2;
        fresh--;
        queue.push([nr, nc, time + 1]);
      }
    }
  }

  return fresh === 0 ? minutes : -1;
}
```

---

### Pattern 6: Pacific Atlantic Water Flow

**Dùng khi:** Tìm cells có thể flow đến cả hai đích (Pacific và Atlantic).

```javascript
// LeetCode 417: Pacific Atlantic Water Flow
function pacificAtlantic(heights) {
  if (!heights || heights.length === 0) return [];

  const m = heights.length, n = heights[0].length;
  const pacific = Array.from({ length: m }, () => Array(n).fill(false));
  const atlantic = Array.from({ length: m }, () => Array(n).fill(false));

  // DFS từ Pacific edge (top và left)
  function dfs(i, j, visited, prevHeight) {
    if (i < 0 || i >= m || j < 0 || j >= n) return;
    if (visited[i][j]) return;
    if (heights[i][j] < prevHeight) return;

    visited[i][j] = true;

    dfs(i + 1, j, visited, heights[i][j]);
    dfs(i - 1, j, visited, heights[i][j]);
    dfs(i, j + 1, visited, heights[i][j]);
    dfs(i, j - 1, visited, heights[i][j]);
  }

  // Top row và left column → Pacific
  for (let j = 0; j < n; j++) dfs(0, j, pacific, -Infinity);
  for (let i = 0; i < m; i++) dfs(i, 0, pacific, -Infinity);

  // Bottom row và right column → Atlantic
  for (let j = 0; j < n; j++) dfs(m - 1, j, atlantic, -Infinity);
  for (let i = 0; i < m; i++) dfs(i, n - 1, atlantic, -Infinity);

  // Tìm cells có thể flow đến cả hai
  const result = [];
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (pacific[i][j] && atlantic[i][j]) {
        result.push([i, j]);
      }
    }
  }

  return result;
}
```

---

### Pattern 7: Minimum Knight Moves (BFS with Coordinates)

**Dùng khi:** Tìm số bước ít nhất với moves cố định (chess moves).

```javascript
// LeetCode 1197: Minimum Knight Moves
function minKnightMoves(x, y) {
  // Symmetry: chỉ cần x, y dương
  x = Math.abs(x);
  y = Math.abs(y);

  // Edge case: target is origin
  if (x === 0 && y === 0) return 0;

  const dirs = [
    [2, 1], [2, -1], [-2, 1], [-2, -1],
    [1, 2], [1, -2], [-1, 2], [-1, -2]
  ];

  const visited = new Set(['0,0']);
  const queue = [[0, 0, 0]];  // [x, y, steps]

  while (queue.length > 0) {
    const [cx, cy, steps] = queue.shift();

    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;

      if (nx === x && ny === y) return steps + 1;
      if (nx < -2 || ny < -2) continue;  // Pruning

      const key = `${nx},${ny}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push([nx, ny, steps + 1]);
      }
    }
  }

  return -1;
}
```

---

## ⚠️ COMMON PITFALLS (Lỗi hay mắc)

### ❌ Pitfall 1: Quên mark visited trong DFS/BFS
```javascript
// ❌ Sai: không mark visited → infinite loop / stack overflow
function dfs(node) {
  for (const neighbor of graph[node]) {
    dfs(neighbor);  // → Có thể loop vô hạn!
  }
}

// ✅ Đúng: mark trước khi recurse
function dfs(node, visited = new Set()) {
  if (visited.has(node)) return;
  visited.add(node);  // ← MARK TRƯỚC
  for (const neighbor of graph[node]) {
    dfs(neighbor, visited);
  }
}
```

### �fall 2: Cycle detection - không handle trạng thái "visiting"
```javascript
// ❌ Sai: không phân biệt "visiting" và "visited"
function hasCycle(node, visited) {
  if (visited.has(node)) return true;  // ← Sai! visited = đã xong, không phải đang xử lý
  visited.add(node);
  for (const next of graph[node]) {
    if (hasCycle(next, visited)) return true;
  }
  return false;
}

// ✅ Đúng: 3 states
const UNVISITED = 0, VISITING = 1, VISITED = 2;
function hasCycle(node, state) {
  state[node] = VISITING;
  for (const next of graph[node]) {
    if (state[next] === VISITING) return true;  // ← Cycle!
    if (state[next] === UNVISITED && hasCycle(next, state)) return true;
  }
  state[node] = VISITED;
  return false;
}
```

### ❌ Pitfall 3: Union Find - không có path compression
```javascript
// ❌ Sai: không path compression → find() chậm O(n)
function find(x) {
  while (parent[x] !== x) {
    x = parent[x];  // ← Không compress
  }
  return x;
}

// ✅ Đúng: path compression
function find(x) {
  if (parent[x] !== x) {
    parent[x] = find(parent[x]);  // ← Compress
  }
  return parent[x];
}
```

### ❌ Pitfall 4: BFS - dùng queue mà không track level
```javascript
// ❌ Sai: khi cần track số steps, quên level tracking
function bfsSteps(graph, start, target) {
  const queue = [start];
  let steps = 0;
  while (queue.length > 0) {
    // ⚠️ Không track level size!
    const node = queue.shift();
    if (node === target) return steps;
    for (const neighbor of graph[node]) {
      queue.push(neighbor);
    }
    steps++;  // ← Sai! Tăng mỗi node, không phải mỗi level
  }
}

// ✅ Đúng: track level size
function bfsSteps(graph, start, target) {
  const queue = [[start, 0]];  // [node, distance]
  while (queue.length > 0) {
    const [node, dist] = queue.shift();
    if (node === target) return dist;
    for (const neighbor of graph[node]) {
      queue.push([neighbor, dist + 1]);
    }
  }
  return -1;
}
```

### ❌ Pitfall 5: Grid graph - quên kiểm tra boundaries
```javascript
// ❌ Sai: không check bounds
function dfs(i, j, grid) {
  if (grid[i][j] === '0') return;  // ⚠️ Có thể crash nếu i,j ngoài bounds!
  grid[i][j] = '0';
  dfs(i+1, j); dfs(i-1, j); dfs(i, j+1); dfs(i, j-1);
}

// ✅ Đúng: check bounds trước
function dfs(i, j, grid) {
  if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length) return;
  if (grid[i][j] === '0') return;
  grid[i][j] = '0';
  dfs(i+1, j); dfs(i-1, j); dfs(i, j+1); dfs(i, j-1);
}
```

---

## 💡 TIPS & TRICKS

### 1. Khi nào dùng DFS vs BFS

```
DFS (Stack/Recursion) khi:
  ✅ Kiểm tra path tồn tại
  ✅ Cycle detection
  ✅ Topological sort
  ✅ Flood fill (grid)
  ✅ Depth matters (không cần shortest)

BFS (Queue) khi:
  ✅ Shortest path (unweighted)
  ✅ Level-by-level processing
  ✅ Minimum steps
  ✅ Spread of information (rotting oranges)
  ✅ Connected components
```

### 2. Mẹo biểu diễn Grid như Graph

```javascript
// Grid → Adjacency List
const m = grid.length, n = grid[0].length;

// Cell (i, j) có 4 neighbors: (i±1, j±1)
// Nếu dùng 1D index: node = i * n + j
// Neighbors: node±n, node±1 (±n cần check row)

function getNeighbors(i, j) {
  const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
  const neighbors = [];
  for (const [di, dj] of dirs) {
    const ni = i + di, nj = j + dj;
    if (ni >= 0 && ni < m && nj >= 0 && nj < n) {
      neighbors.push([ni, nj]);
    }
  }
  return neighbors;
}
```

### 3. Mẹo Topological Sort (DFS)

```javascript
// Topological Sort bằng DFS
function topologicalSortDFS(numCourses, prerequisites) {
  const graph = Array.from({ length: numCourses }, () => []);
  for (const [c, p] of prerequisites) {
    graph[p].push(c);
  }

  const state = Array(numCourses).fill(0);  // 0=unvis, 1=vis, 2=done
  const order = [];

  function dfs(node) {
    if (state[node] === 1) return false;  // Cycle!
    if (state[node] === 2) return true;

    state[node] = 1;
    for (const next of graph[node]) {
      if (!dfs(next)) return false;
    }
    state[node] = 2;
    order.push(node);  // ← Add sau khi process all
    return true;
  }

  for (let i = 0; i < numCourses; i++) {
    if (state[i] === 0 && !dfs(i)) return [];  // Cycle!
  }

  return order.reverse();
}
```

---

## 🔍 BRUTE FORCE → OPTIMAL

| Bài | Approach | Time | Space | Notes |
|-----|----------|------|-------|-------|
| Number of Islands | DFS/BFS flood | O(m·n) | O(m·n) | Mark visited in-place |
| Clone Graph | BFS + Map | O(V+E) | O(V) | Map old→new node |
| Course Schedule | Topo Sort (BFS) | O(V+E) | O(V) | Check cycle |
| Connected Components | DFS/Union Find | O(V+E) | O(V) | Union Find elegant |
| Rotting Oranges | BFS multi-source | O(m·n) | O(m·n) | Multi-source BFS |
| Accounts Merge | Union Find | O(n·α(n)) | O(n) | α = inverse Ackermann |
| Min Knight Moves | BFS + pruning | O(|x|·|y|) | O(|x|·|y|) | Symmetry optimization |
| Reorder Routes | BFS | O(n) | O(n) | Track direction |

---

## ⏱️ TIME & SPACE COMPLEXITY TỔNG HỢP

| Algorithm | Time | Space | Use case |
|-----------|------|-------|----------|
| DFS | O(V + E) | O(V) | Path finding, cycle detection |
| BFS | O(V + E) | O(V) | Shortest path (unweighted) |
| Topological Sort | O(V + E) | O(V) | Dependency ordering |
| Union Find | O(α(n)) amortized | O(n) | Connectivity |

*α(n) ≈ 1 cho thực tế*

---

## 🏭 REAL-WORLD APPLICATIONS

| Pattern | Ứng dụng thực tế |
|---------|-------------------|
| BFS Shortest Path | GPS navigation, social network degrees |
| Topological Sort | Build systems, course scheduling, task ordering |
| Union Find | Network connectivity, Kruskal's MST |
| Number of Islands | Image segmentation, flood fill |
| Clone Graph | Dependency graphs, DOM cloning |
| Flood Fill | Paint tools, image processing |

---

## ✅ KHI NÀO DÙNG / KHÔNG DÙNG

### NÊN dùng DFS khi:
- ✅ Kiểm tra tồn tại path (không cần shortest)
- ✅ Cycle detection
- ✅ Topological ordering
- ✅ Flood fill trên grid
- ✅递归 tự nhiên cho problem

### NÊN dùng BFS khi:
- ✅ Shortest path (unweighted)
- ✅ Minimum number of steps
- ✅ Level-order traversal
- ✅ Spread of influence (infectious disease, rumors)
- ✅ Multi-source problems

### KHÔNG NÊN dùng DFS khi:
- ❌ Cần shortest path → **BFS**
- ❌ Tree rất sâu → có thể **stack overflow**

### KHÔNG NÊN dùng BFS khi:
- ❌ Weighted graph → **Dijkstra**
- ❌ Memory nghiêm ngặt với large graph → **DFS** (O(h) vs O(w))

---

## 📋 CHEAT SHEET — Tuần 7

### DFS Template

```javascript
function dfs(graph, node, visited) {
  if (visited.has(node)) return;
  visited.add(node);
  for (const neighbor of graph[node]) {
    dfs(graph, neighbor, visited);
  }
}

// With state (cycle detection)
const state = Array(n).fill(0); // 0=unvis, 1=vis, 2=done
function dfs(node) {
  if (state[node] === 1) return false; // cycle
  if (state[node] === 2) return true;
  state[node] = 1;
  for (const next of graph[node]) {
    if (!dfs(next)) return false;
  }
  state[node] = 2;
  return true;
}
```

### BFS Template

```javascript
function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const node = queue.shift();
    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
}

// With distance
function bfsDist(graph, start) {
  const dist = {};
  const queue = [start];
  dist[start] = 0;
  while (queue.length) {
    const node = queue.shift();
    for (const neighbor of graph[node]) {
      if (dist[neighbor] === undefined) {
        dist[neighbor] = dist[node] + 1;
        queue.push(neighbor);
      }
    }
  }
  return dist;
}
```

### Union Find Template

```javascript
class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = Array(n).fill(0);
  }
  find(x) {
    if (this.parent[x] !== x)
      this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }
  union(x, y) {
    const px = this.find(x), py = this.find(y);
    if (px === py) return;
    if (this.rank[px] < this.rank[py]) this.parent[px] = py;
    else if (this.rank[px] > this.rank[py]) this.parent[py] = px;
    else { this.parent[py] = px; this.rank[px]++; }
  }
}
```

---

## 📝 BÀI TẬP TUẦN NÀY

| # | Bài | LeetCode | Độ khó | Pattern | Status |
|---|-----|----------|--------|---------|--------|
| 1 | Number of Islands | #200 | 🟡 Medium | DFS/BFS Flood Fill | ⬜ |
| 2 | Clone Graph | #133 | 🟡 Medium | BFS + HashMap | ⬜ |
| 3 | Pacific Atlantic Water Flow | #417 | 🟡 Medium | DFS Multi-source | ⬜ |
| 4 | Course Schedule | #207 | 🟡 Medium | Topological Sort | ⬜ |
| 5 | Number of Connected Components | #323 | 🟡 Medium | DFS/Union Find | ⬜ |
| 6 | Rotting Oranges | #994 | 🟡 Medium | BFS Multi-source | ⬜ |
| 7 | Keys and Rooms | #841 | 🟢 Easy | BFS/DFS | ⬜ |
| 8 | Accounts Merge | #721 | 🟡 Medium | Union Find | ⬜ |
| 9 | Minimum Knight Moves | #1197 | 🟡 Medium | BFS | ⬜ |
| 10 | Reorder Routes to City Zero | #1466 | 🟡 Medium | BFS | ⬜ |

**Hoàn thành:** 0/10 (0%)

---

## 📚 TÀI NGUYÊN

- Video: [NeetCode Graphs](https://www.youtube.com/)
- Video: [Graph Theory](https://www.youtube.com/)
- Article: [GeeksforGeeks - Graph](https://geeksforgeeks.org/graph-data-structure-and-algorithms/)
- Article: [Union Find](https://www.geeksforgeeks.org/union-find/)
- Visual: [Graph Traversal](https://visualgo.net/en/graphds)
- Visual: [Graph Greedy](https://visualgo.net/en/mst)
