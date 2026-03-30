# #841 - Keys and Rooms

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Graph, DFS, BFS |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/keys-and-rooms/

---

## 📖 Đề bài

### Mô tả
Có `n` phòng đánh số từ `0` đến `n-1`. Mỗi phòng `i` có một danh sách `rooms[i]` chứa các khóa của các phòng khác. Bạn bắt đầu ở phòng `0` với khóa của phòng đó. Kiểm tra xem có thể vào **tất cả các phòng** không.

### Ví dụ

**Example 1:**
```
Input: [[1],[2],[3],[]]
Output: true
Giải thích:
  Bắt đầu ở phòng 0 → có khóa phòng 1
  Vào phòng 1 → có khóa phòng 2
  Vào phòng 2 → có khóa phòng 3
  Vào phòng 3 → xong!
```

**Example 2:**
```
Input: [[1,3],[3,0,1],[2],[0]]
Output: false
Giải thích:
  Phòng 2 và 3 không thể vào được
```

### Constraints
```
1 <= n <= 1000
rooms.length == n
0 <= rooms[i].length <= n
rooms[i] không chứa giá trị trùng lặp
0 <= rooms[i][j] < n
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Có thể visit TẤT CẢ nodes từ node 0?
Mô hình: Directed Graph
  Node i → Keys in rooms[i]
  Bắt đầu: room 0
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Nghĩ brute force

> **Hỏi:** "Làm sao biết có thể vào hết phòng?"

Bắt đầu từ room 0, DFS/BFS theo khóa để vào các phòng khác. Đếm số phòng visited. Nếu visited count = n → true.

```
→ Rất đơn giản: DFS/BFS graph traversal!
```

---

#### Bước 2: "Aha moment!"

> **Aha moment:**
> "Đây là bài **Reachable from Node 0** — hoàn toàn tương tự Number of Islands!"
>
> ```
> Số rooms có thể vào = số nodes reachable từ node 0
> → Đếm visited = n ? true : false
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Rooms[i] = outgoing edges từ node i"            │
│   → Directed graph traversal từ node 0             │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Reachable from start = DFS/BFS"                 │
│   → Count visited → so sánh với n                  │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Không có cycle problem ở đây"                   │
│   → Vì là directed nên DFS sẽ tự dừng khi không    │
│     có outgoing edges                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Thêm room vào queue TRƯỚC khi process
function canVisitAllRooms(rooms) {
  const visited = new Set([0]);
  const queue = [0];
  while (queue.length) {
    const room = queue.shift();
    for (const key of rooms[room]) {
      queue.push(key); // ❌ Không check visited → duplicate queue entries
      visited.add(key);
    }
  }
  return visited.size === rooms.length;
}
// ✅ Check visited trước khi push
for (const key of rooms[room]) {
  if (!visited.has(key)) {
    visited.add(key);
    queue.push(key);
  }
}

// ❌ Pitfall 2: Dùng visited array thay vì Set
// ✅ Set tốt hơn vì dễ đọc, nhưng array cũng được
```

---

### 🔄 5. Các hướng tiếp cận

#### 🔹 Cách 1: BFS (O(n + E)) ⭐

```javascript
function canVisitAllRooms(rooms) {
  const visited = new Set([0]);
  const queue = [0];

  while (queue.length > 0) {
    const room = queue.shift();
    for (const key of rooms[room]) {
      if (!visited.has(key)) {
        visited.add(key);
        queue.push(key);
      }
    }
  }

  return visited.size === rooms.length;
}
```

---

#### 🔹 Cách 2: DFS Recursive (O(n + E))

```javascript
function canVisitAllRooms(rooms) {
  const visited = new Set();

  function dfs(room) {
    visited.add(room);
    for (const key of rooms[room]) {
      if (!visited.has(key)) dfs(key);
    }
  }

  dfs(0);
  return visited.size === rooms.length;
}
```

**📊 Phân tích:**
```
Time:  O(n + E) — n nodes + tổng số keys
Space: O(n) — visited + queue/stack
```

---

### 🚀 6. Visual Walkthrough

```
rooms = [[1,3],[3,0,1],[2],[0]]

Graph:
  0 → [1, 3]
  1 → [3, 0, 1] (3, 0 là back, 1 là self — loop)
  2 → [2]       (self-loop)
  3 → [0]

BFS từ 0:
  Queue [0]         | visited = {0}
  Process 0: keys=[1,3]
    Add 1 → visited={0,1}, queue=[1]
    Add 3 → visited={0,1,3}, queue=[1,3]
  Process 1: keys=[3,0,1]
    3: visited skip
    0: visited skip
    1: visited skip
  Process 3: keys=[0]
    0: visited skip
  Queue rỗng

visited.size = 3 < 4 → return false ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Keys and Rooms - BFS
 * Time: O(n + E) | Space: O(n)
 */
function canVisitAllRooms(rooms) {
  const visited = new Set([0]);
  const queue = [0];

  while (queue.length > 0) {
    const room = queue.shift();
    for (const key of rooms[room]) {
      if (!visited.has(key)) {
        visited.add(key);
        queue.push(key);
      }
    }
  }

  return visited.size === rooms.length;
}
```

---

## 🧪 Test Cases

```javascript
console.log(canVisitAllRooms([[1],[2],[3],[]])); // true

console.log(canVisitAllRooms([[1,3],[3,0,1],[2],[0]])); // false

console.log(canVisitAllRooms([[],[1]])); // false (phòng 1 không thể vào)

console.log(canVisitAllRooms([[1,2,3],[0],[0],[0]])); // true

console.log(canVisitAllRooms([[]])); // true (chỉ có phòng 0)
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Graph Reachability (DFS/BFS)

💡 KEY INSIGHT:
   "rooms[i] = outgoing edges"
   "Reachable from node 0 = visited.size = n"

⚠️ PITFALLS:
   - Check visited TRƯỚC khi push vào queue

🔄 VARIATIONS:
   - Number of Provinces (#547) → tương tự nhưng undirected
   - Flood Fill → BFS đến khi không còn fill được

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Number of Islands (#200)
// Tương tự nhưng trong grid 2D

// Variation 2: Graph Valid Tree (#261)
// Kiểm tra có phải valid tree không

// Variation 3: All Paths from Source to Target (#797)
// Tìm tất cả paths từ source đến target
function allPathsSourceTarget(graph) {
  const result = [];
  const path = [0];
  
  function dfs(node) {
    if (node === graph.length - 1) {
      result.push([...path]);
      return;
    }
    for (const next of graph[node]) {
      path.push(next);
      dfs(next);
      path.pop();
    }
  }
  
  dfs(0);
  return result;
}

// Variation 4: Keys and Rooms with Exit Condition
// Kiểm tra có thể thoát ra

// Variation 5: BFS/DFS from Multiple Sources
// Từ nhiều starting points
```

---

## ➡️ Bài tiếp theo

[Bài 8: Accounts Merge](./008-accounts-merge.md)
