# #1466 - Reorder Routes to Make All Paths Lead to City Zero

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Graph, DFS, BFS |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/reorder-routes-to-make-all-paths-lead-to-the-city-zero/

---

## 📖 Đề bài

### Mô tả
Có `n` thành phố đánh số từ `0` đến `n-1`. Các con đường là **có hướng** (directional). Bạn cần tìm **số con đường tối thiểu cần đảo chiều** để mọi thành phố đều có thể đến được thành phố `0`.

Có nghĩa là: từ mọi thành phố, có thể đi theo hướng hiện tại để đến thành phố `0`.

### Ví dụ

**Example 1:**
```
Input: n = 6, connections = [[0,1],[1,3],[2,3],[4,0],[4,5],[4,6],[5,4],[6,4],[6,7]]
Output: 2
Giải thích:
  Cần đảo chiều 2 đường để tất cả có thể đến 0
```

**Example 2:**
```
Input: n = 3, connections = [[1,2],[2,0]]
Output: 1
```

### Constraints
```
2 <= n <= 5 * 10^4
1 <= connections.length <= 10^5
connections[i].length == 2
0 <= ui, vi <= n-1
ui != vi
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Cần đảo bao nhiêu đường để mọi thành phố đến được 0?
Mô hình: Đồ thị có hướng từ city 0
  - Đường đi ĐÚNG: city → 0 (hướng về 0) → KHÔNG cần đảo
  - Đường đi NGƯỢC: city ← 0 (hướng ra xa 0) → CẦN đảo
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: DFS từ city 0

> **Hỏi:** "Làm sao đếm số đường cần đảo?"

```
Từ city 0, DFS/BFS đi ra ngoài.
Khi đi qua 1 edge:
  - Nếu edge đi RA (u→v, u=0 hoặc u=đã đến):
    → Đường này đi VÌ PHƯƠNG HƯỚNG → cần đảo → count++
  - Nếu edge đi VÀO (u←v):
    → Đường này đã hướng về 0 → không cần đảo
```

---

#### Bước 2: "Aha moment!" — Represent edges với direction flag

> **Aha moment:**
> **Đánh dấu mỗi edge với 1 flag: đây có phải là original direction không?**
>
> ```
> original direction (trong mảng): [u, v] = u → v
>   → Lưu: { to: v, isOriginal: 1 }
>
> reverse direction (thêm vào): [v, u] = v → u
>   → Lưu: { to: u, isOriginal: 0 }
> ```
>
> **→ Khi DFS, nếu isOriginal = 1 → cần đảo!**

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Edge u→v: lưu 2 chiều trong adjacency list"    │
│   → {to: v, isOriginal: 1}  (original direction)  │
│   → {to: u, isOriginal: 0}  (reverse direction)   │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "DFS từ city 0: đi ra = có thể cần đảo chiều"  │
│   → isOriginal=1 → count++                         │
│   → isOriginal=0 → OK, không cần đảo               │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Chỉ cần BFS/DFS 1 lần từ city 0"               │
│   → visited set tránh loop                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Không biểu diễn edge direction
// Khi xây graph, chỉ lưu 1 chiều → không biết original vs reversed
// ✅ Lưu 2 chiều với flag

// ❌ Pitfall 2: Count tất cả edges thay vì chỉ edges khi DFS đi ra
function minReorderWrong(n, connections) {
  let count = 0;
  for (const [u, v] of connections) {
    // ❌ Count TẤT CẢ edges → sai!
    if (/* ??? */) count++;
  }
}
// ✅ Chỉ count khi DFS gặp edge có isOriginal = 1

// ❌ Pitfall 3: Không visited → infinite loop (có thể có cycle)
// ✅ Always check visited trước khi DFS
```

---

### 🔄 5. Các hướng tiếp cận

#### 🔹 Cách 1: BFS từ City 0 (O(n + E)) ⭐

```javascript
function minReorder(n, connections) {
  const graph = {};

  // Xây graph: edge có hướng đúng (1) + ngược (0)
  for (const [u, v] of connections) {
    if (!graph[u]) graph[u] = [];
    if (!graph[v]) graph[v] = [];
    graph[u].push([v, 1]);   // original direction: u → v
    graph[v].push([u, 0]);   // reversed direction: v → u
  }

  let result = 0;
  const visited = new Set([0]);
  const queue = [0];

  while (queue.length > 0) {
    const city = queue.shift();
    for (const [neighbor, isOriginal] of graph[city]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        // Nếu đây là original direction → cần đảo
        if (isOriginal === 1) result++;
        queue.push(neighbor);
      }
    }
  }

  return result;
}
```

**📊 Phân tích:**
```
Time:  O(n + E) — BFS traversals
Space: O(n + E) — adjacency list + visited
```

---

### 🚀 6. Visual Walkthrough

```
n=3, connections=[[1,2],[2,0]]

Adjacency List:
  0 → [2(1)]       (0→2 original)
  1 → [2(0)]       (1→2 reversed, vì thêm v→u=2→1)
  2 → [1(1), 0(0)] (2→1 original, 2→0 reversed)

BFS từ 0:
  Queue [0]       | visited={0}, result=0
  Process 0:
    neighbors: [2(1)]
    2 not visited → visited={0,2}, result++(1), queue=[2]
  Process 2:
    neighbors: [1(1), 0(0)]
    1 not visited → visited={0,2,1}, result++(2), queue=[1]
    0 visited skip
  Queue rỗng

→ return 2 ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Reorder Routes - BFS từ City 0 với Direction Flag
 * Time: O(n + E) | Space: O(n + E)
 */
function minReorder(n, connections) {
  const graph = {};

  for (const [u, v] of connections) {
    if (!graph[u]) graph[u] = [];
    if (!graph[v]) graph[v] = [];
    graph[u].push([v, 1]);   // original direction
    graph[v].push([u, 0]);   // reversed direction
  }

  let result = 0;
  const visited = new Set([0]);
  const queue = [0];

  while (queue.length > 0) {
    const city = queue.shift();
    for (const [neighbor, isOriginal] of graph[city]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        if (isOriginal === 1) result++;
        queue.push(neighbor);
      }
    }
  }

  return result;
}
```

---

## 🧪 Test Cases

```javascript
console.log(minReorder(6, [
  [0,1],[1,3],[2,3],[4,0],[4,5],[4,6],[5,4],[6,4],[6,7]
])); // 2

console.log(minReorder(3, [[1,2],[2,0]])); // 1

console.log(minReorder(4, [[1,0],[2,0],[3,0],[0,2]])); // 1

console.log(minReorder(2, [[1,0]])); // 0

console.log(minReorder(2, [[0,1]])); // 1
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Graph Direction Reordering

💡 KEY INSIGHT:
   "Lưu 2 chiều với flag: isOriginal=1 cho original, isOriginal=0 cho reversed"
   "BFS từ city 0: isOriginal=1 → count++"

⚠️ PITFALLS:
   - Luôn tạo 2 chiều trong adjacency list
   - Chỉ count isOriginal=1 edges

🔄 VARIATIONS:
   - Course Schedule II (#210) → topological sort

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Minimize Reorder Operations
// Tối thiểu hóa số operations

// Variation 2: Count Reorder Operations Needed
// Đếm số operations cần thiết

// Variation 3: Reorder to Specific Target
// Đổi hướng đến target cụ thể

// Variation 4: Longest Path After Reorders
// Tìm longest path sau khi reorder

// Variation 5: Reorder with Cost
// Mỗi reorder có cost khác nhau
```

---

## ➡️ Quay lại README Week 7
