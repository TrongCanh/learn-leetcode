# #133 - Clone Graph

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Graph, DFS, BFS, Hash Map |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/clone-graph/

---

## 📖 Đề bài

### Mô tả
Cho một node gốc của đồ thị vô hướng (undirected graph). Mỗi node có `val` (int) và danh sách `neighbors` (list của nodes). Clone (sao chép) đồ thị và trả về node gốc mới.

### Định nghĩa Node
```javascript
function Node(val, neighbors) {
  this.val = val === undefined ? 0 : val;
  this.neighbors = neighbors === undefined ? [] : neighbors;
}
```

### Ví dụ

**Example 1:**
```
Input: adjList = [[2,4],[1,3],[2,4],[1,3]]
Output: [[2,4],[1,3],[2,4],[1,3]]
```

**Example 2:**
```
Input: adjList = [[]]
Output: [[]]
```

### Constraints
```
1 <= node.val <= 100
node không có self-loop
Mỗi giá trị của node chỉ xuất hiện 1 lần trong adjacency list
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Clone 1 đồ thị (tạo bản sao chép)
Return: Node gốc của đồ thị mới
Đặc biệt: Đồ thị có thể có CYCLE → cần tránh infinite loop
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Nghĩ brute force trước

> **Hỏi:** "Làm sao clone 1 node?"

Tạo node mới. Với mỗi neighbor, tạo node mới, rồi tiếp tục...

```
→ Vấn đề: Nếu có cycle → infinite recursion!
→ Cần Hash Map để track: "Node này đã clone chưa?"
```

---

#### Bước 2: "Aha moment!"

> **Aha moment:**
> "Hash Map lưu trữ: `originalNode → clonedNode`"
>
> **→ Trước khi clone bất kỳ node nào, CHECK map đã có chưa**
>
> ```
> if (node đã clone) → return cloned version (tránh cycle!)
> if (node chưa clone) → tạo mới, lưu vào map, clone neighbors
> ```

---

#### Bước 3: Validate

```
Graph: 1 → 2 → 3 ↔ (cycle back)

Clone 1:
  map[1] = new Node(1)
  Clone neighbors của 1: [2]
    Clone 2:
      map[2] = new Node(2)
      Clone neighbors của 2: [1, 3]
        1: map[1] đã có → return map[1] ✓
        Clone 3:
          map[3] = new Node(3)
          neighbors [2]: map[2] có → return map[2] ✓
          → neighbors complete
      → neighbors complete
  → neighbors complete

→ Graph clone hoàn chỉnh, không infinite loop ✓
```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Hash Map là 'seen' tracking"                   │
│   → original → clone mapping                        │
│   → Tránh clone lại node đã clone                 │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Clone node TRƯỚC, clone neighbors SAU"         │
│   → Đảm bảo cycle không gây infinite loop        │
│   → Luôn return clone từ map khi đã có          │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Graph traversal: DFS hoặc BFS đều được"       │
│   → DFS: Đệ quy đơn giản                          │
│   → BFS: Tránh stack overflow cho graph lớn       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Quên kiểm tra node === null
function cloneGraph(node) {
  // ❌ Lỗi khi node === null → gọi node.val crash
  const clone = new Node(node.val);
  // ...
}
// ✅ Đúng: Check null đầu tiên
function cloneGraph(node) {
  if (!node) return null;
  // ...
}

// ❌ Pitfall 2: Clone neighbors TRƯỚC khi lưu vào map
function cloneNeighbors(node, visited) {
  for (const neighbor of node.neighbors) {
    if (!visited.has(neighbor)) {
      const clone = new Node(neighbor.val); // ❌ Tạo clone mới mỗi lần!
      visited.set(neighbor, clone);
      cloneNeighbors(neighbor, visited);
    }
  }
}
// ✅ Đúng: Tạo clone → lưu map → rồi mới clone neighbors
function cloneNode(node, visited) {
  if (visited.has(node)) return visited.get(node);
  const clone = new Node(node.val);
  visited.set(node, clone);
  for (const neighbor of node.neighbors) {
    clone.neighbors.push(cloneNode(neighbor, visited));
  }
  return clone;
}

// ❌ Pitfall 3: Không thêm neighbors vào map khi tạo node
function cloneGraph(node) {
  if (!node) return null;
  const map = new Map();
  function dfs(n) {
    if (!map.has(n)) {
      const newNode = { val: n.val, neighbors: [] };
      map.set(n, newNode);
    }
    for (const nb of n.neighbors) {
      if (!map.has(nb)) dfs(nb);
      map.get(n).neighbors.push(map.get(nb)); // ← Thêm sau khi dfs
    }
  }
  dfs(node);
  return map.get(node);
}
// ✅ Đúng: Luôn push từ map (dfs hoặc chưa dfs đều OK)
```

---

### 🔄 5. Các hướng tiếp cận

#### 🔹 Cách 1: DFS Recursive (O(n)) ⭐

```javascript
function cloneGraph(node) {
  if (!node) return null;

  const visited = new Map(); // original → clone

  function dfs(n) {
    // 1. Đã clone → return ngay
    if (visited.has(n)) return visited.get(n);

    // 2. Chưa clone → tạo mới
    const clone = new Node(n.val);
    visited.set(n, clone);

    // 3. Clone all neighbors
    for (const neighbor of n.neighbors) {
      clone.neighbors.push(dfs(neighbor));
    }

    return clone;
  }

  return dfs(node);
}
```

**📊 Phân tích:**
```
Time:  O(n) — mỗi node và edge được visit đúng 1 lần
Space: O(n) — Map + recursion stack
```

---

#### 🔹 Cách 2: BFS Queue (O(n))

```javascript
function cloneGraph(node) {
  if (!node) return null;

  const visited = new Map();
  const queue = [node];
  visited.set(node, new Node(node.val));

  while (queue.length > 0) {
    const curr = queue.shift();

    for (const neighbor of curr.neighbors) {
      // Chưa visited → clone và add vào queue
      if (!visited.has(neighbor)) {
        visited.set(neighbor, new Node(neighbor.val));
        queue.push(neighbor);
      }
      // Thêm neighbor vào neighbors list của clone
      visited.get(curr).neighbors.push(visited.get(neighbor));
    }
  }

  return visited.get(node);
}
```

---

### 🚀 6. Visual Walkthrough

```
Original Graph:        Clone:
  1 ──── 2               1' ──── 2'
  │╲     │                │╲     │
  │  ╲   │                │  ╲   │
  4 ─── 3                 4' ─── 3'

Step-by-step (DFS):
  dfs(1):
    map[1]=1' → neighbors
      dfs(2):
        map[2]=2' → neighbors
          dfs(1): map[1] có! → return 1' ✓
          dfs(3):
            map[3]=3' → neighbors
              dfs(2): map[2] có! → return 2' ✓
              dfs(4):
                map[4]=4' → neighbors
                  dfs(3): map[3] có! → return 3' ✓
                → 4' neighbors=[3']
              → 3' neighbors=[2',4']
            → 2' neighbors=[1',3']
          → 1' neighbors=[2',3',4']

Return 1' → Clone graph hoàn chỉnh ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Clone Graph - DFS with Hash Map
 * Time: O(n) | Space: O(n)
 */
function cloneGraph(node) {
  if (!node) return null;

  const visited = new Map();

  function dfs(n) {
    if (visited.has(n)) return visited.get(n);
    const clone = new Node(n.val);
    visited.set(n, clone);
    for (const neighbor of n.neighbors) {
      clone.neighbors.push(dfs(neighbor));
    }
    return clone;
  }

  return dfs(node);
}
```

---

## 🧪 Test Cases

```javascript
// Test 1: Graph có cycle [[2,4],[1,3],[2,4],[1,3]]
// Test 2: Graph 1 node [[]]
// Test 3: Graph rỗng (null)

// Manual test structure:
function test() {
  const node1 = new Node(1);
  const node2 = new Node(2);
  const node3 = new Node(3);
  node1.neighbors = [node2, node3];
  node2.neighbors = [node1, node3];
  node3.neighbors = [node2, node1];

  const cloned = cloneGraph(node1);
  console.log(cloned.val); // 1
  console.log(cloned.neighbors[0].val); // 2
  console.log(cloned.neighbors[0] === cloned.neighbors[1]); // false (khác objects)
}
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Graph Clone = DFS/BFS + Hash Map (seen tracking)

💡 KEY INSIGHT:
   "Clone node TRƯỚC, lưu map, rồi clone neighbors"
   → "Khi gặp lại node (cycle), map.has() = true → return clone"

⚠️ PITFALLS:
   - Check node === null đầu tiên
   - Luôn push clone từ map, không tạo mới mỗi lần

🔄 VARIATIONS:
   - Deep Copy Linked List with Random Pointer (#138)
   - Clone N-ary Tree (#1490)

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Clone Graph with Random Pointer (#138)
// Deep copy linked list với random pointer
function copyRandomList(head) {
  const map = new Map();
  
  function dfs(node) {
    if (!node) return null;
    if (map.has(node)) return map.get(node);
    const clone = new Node(node.val);
    map.set(node, clone);
    clone.next = dfs(node.next);
    clone.random = dfs(node.random);
    return clone;
  }
  
  return dfs(head);
}

// Variation 2: Clone N-ary Tree (#1490)
// Clone cây N-ary
function cloneTree(root) {
  if (!root) return null;
  const clone = new Node(root.val);
  for (const child of root.children) {
    clone.children.push(cloneTree(child));
  }
  return clone;
}

// Variation 3: Deep Copy Graph with Node IDs
// Graph với ID thay vì references

// Variation 4: Copy List with Label (#133)
// Clone list với labels

// Variation 5: Clone Components in Graph
// Clone các connected components
```

---

## ➡️ Bài tiếp theo

[Bài 3: Pacific Atlantic Water Flow](./003-pacific-atlantic.md)
