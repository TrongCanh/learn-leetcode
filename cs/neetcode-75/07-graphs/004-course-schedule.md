# #207 - Course Schedule

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Graph, DFS, Topological Sort, BFS |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/course-schedule/

---

## 📖 Đề bài

### Mô tả
Có `numCourses` khóa học được đánh số từ `0` đến `numCourses-1`. Bạn được cho một mảng `prerequisites`, trong đó `prerequisites[i] = [ai, bi]` có nghĩa: **phải hoàn thành `ai` TRƯỚC `bi`**.

Kiểm tra xem có thể hoàn thành tất cả các khóa học không (tức là không có cycle trong đồ thị).

### Ví dụ

**Example 1:**
```
Input: numCourses = 2, prerequisites = [[1,0]]
Output: true
Giải thích: Phải học khóa 0 trước khóa 1 → có thể hoàn thành
```

**Example 2:**
```
Input: numCourses = 2, prerequisites = [[1,0],[0,1]]
Output: false
Giải thích: 0→1 và 1→0 → CYCLE! → không thể hoàn thành
```

### Constraints
```
1 <= numCourses <= 2000
0 <= prerequisites.length <= 5000
prerequisites[i].length == 2
0 <= ai, bi < numCourses
ai != bi
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Có thể hoàn thành tất cả khóa học không?
Mô hình: Prerequisites = Directed Graph (có hướng)
  ai → bi  có nghĩa: ai phải học TRƯỚC bi
Vấn đề: Có cycle → deadlock!
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Nghĩ brute force

> **Hỏi:** "Làm sao biết có cycle không?"

Kiểm tra từng course, DFS để tìm xem có quay lại chính nó không.

```
→ Cần phân biệt: đang thăm (visiting) vs đã thăm xong (visited)
→ Nếu gặp "đang thăm" = CYCLE!
```

---

#### Bước 2: "Aha moment!" — Detect Cycle trong Directed Graph

> **Aha moment:**
> **3 states cho mỗi node:**
>
> ```
> 0 = UNVISITED    (chưa visited)
> 1 = VISITING     (đang trong recursion stack)
> 2 = VISITED      (đã done, không có cycle từ node này)
> ```
>
> **→ Nếu đang DFS mà gặp node đang VISITING = CYCLE!**

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Prerequisites = Directed Graph"                │
│   → ai → bi (ai must come before bi)              │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "3-color DFS: 0=unvisited, 1=visiting, 2=done"  │
│   → Gặp 1 trong lúc đang DFS = CYCLE             │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Topological Sort = DFS với cycle detection"    │
│   → Không cycle = topological sort possible       │
│   → Có cycle = impossible                          │
│                                                     │
│   KEY INSIGHT #4:                                   │
│   "Kahn's BFS = in-degree counting"               │
│   → Remove nodes có in-degree = 0                │
│   → Nếu remove hết = no cycle                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Chỉ dùng 1 visited flag (không đủ cho directed graph)
function hasCycle(node, visited, graph) {
  if (visited[node]) return true; // ❌ Không phân biệt đang thăm / đã xong
  visited[node] = true;
  for (const neighbor of graph[node]) {
    if (hasCycle(neighbor, visited, graph)) return true;
  }
  return false;
}
// → Câu hỏi: nếu A→B và B→C và C→A, DFS(A) → DFS(B) → DFS(C) → gặp A
//   → visited[A]=true → cycle → OK nhưng đúng.
// → Nhưng nếu A→B, B→C, B không có cycle, visited[B]=true khi return C
//   → DFS(A) tiếp (có nhiều component) → gặp B → visited[B]=true → cycle SAI!
// → Cần 3 states

// ✅ Đúng: 3 states
function dfs(node) {
  if (state[node] === 1) return true;  // VISITING → cycle!
  if (state[node] === 2) return false; // VISITED → no cycle from here
  state[node] = 1; // VISITING
  for (const neighbor of graph[node]) {
    if (dfs(neighbor)) return true;
  }
  state[node] = 2; // VISITED
  return false;
}

// ❌ Pitfall 2: Xây graph sai hướng
// [ai, bi] = "ai phải trước bi" → ai → bi (edge từ ai đến bi)
graph[ai].push(bi); // ✅ Đúng
// ❌ graph[bi].push(ai); // Sai hướng!
```

---

### 🔄 5. Các hướng tiếp cận

#### 🔹 Cách 1: DFS 3-color (O(V + E)) ⭐

```javascript
function canFinish(numCourses, prerequisites) {
  // 0 = UNVISITED, 1 = VISITING, 2 = VISITED
  const state = new Array(numCourses).fill(0);
  const graph = Array.from({ length: numCourses }, () => []);

  for (const [course, prereq] of prerequisites) {
    graph[prereq].push(course);
  }

  function dfs(node) {
    if (state[node] === 1) return true;   // Cycle!
    if (state[node] === 2) return false;  // No cycle từ node này

    state[node] = 1; // VISITING
    for (const neighbor of graph[node]) {
      if (dfs(neighbor)) return true;
    }
    state[node] = 2; // VISITED
    return false;
  }

  for (let i = 0; i < numCourses; i++) {
    if (state[i] === 0) {
      if (dfs(i)) return false;
    }
  }

  return true;
}
```

**📊 Phân tích:**
```
Time:  O(V + E) — V = numCourses, E = prerequisites.length
Space: O(V + E) — adjacency list + state array
```

---

#### 🔹 Cách 2: Kahn's BFS / Topological Sort (O(V + E))

```javascript
function canFinish(numCourses, prerequisites) {
  // Xây graph + in-degree
  const graph = Array.from({ length: numCourses }, () => []);
  const inDegree = new Array(numCourses).fill(0);

  for (const [course, prereq] of prerequisites) {
    graph[prereq].push(course); // prereq → course
    inDegree[course]++;
  }

  // Queue: all courses có in-degree = 0
  const queue = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }

  let count = 0;
  while (queue.length > 0) {
    const course = queue.shift();
    count++;

    for (const neighbor of graph[course]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }

  // Nếu count < numCourses → có cycle
  return count === numCourses;
}
```

**📊 Phân tích:**
```
Time:  O(V + E)
Space: O(V + E)
✅ Ưu điểm: Không recursion, tránh stack overflow
```

---

### 🚀 6. Visual Walkthrough

```
Graph: numCourses=4, prerequisites=[[1,0],[2,0],[3,1],[3,2]]

Adjacency List:
  0 → [1, 2]
  1 → [3]
  2 → [3]
  3 → []

In-Degree: [0, 1, 1, 2]

DFS 3-color:
  dfs(0): state[0]=1 VISITING
    dfs(1): state[1]=1 VISITING
      dfs(3): state[3]=1 VISITING
        neighbors [] → state[3]=2 → return false
      state[1]=2 → return false
    dfs(2): state[2]=1 VISITING
      dfs(3): state[3]=2 (đã visited) → return false
      state[2]=2 → return false
    state[0]=2 → return false
  → No cycle → return true ✓

Kahn's BFS:
  Queue [0] (in-degree=0)
  Process 0: neighbors[1,2] → in-degree[1]=0, in-degree[2]=0 → queue=[1,2]
  Process 1: neighbors[3] → in-degree[3]=1 → queue=[2]
  Process 2: neighbors[3] → in-degree[3]=0 → queue=[3]
  Process 3: neighbors[] → queue=[]
  count=4=numCourses → return true ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Course Schedule - DFS 3-color Cycle Detection
 * Time: O(V + E) | Space: O(V + E)
 */
var canFinish = function(numCourses, prerequisites) {
  const state = new Array(numCourses).fill(0); // 0=unvisited, 1=visiting, 2=done
  const graph = Array.from({ length: numCourses }, () => []);

  for (const [course, prereq] of prerequisites) {
    graph[prereq].push(course);
  }

  function dfs(node) {
    if (state[node] === 1) return true;   // Cycle detected!
    if (state[node] === 2) return false;    // Already processed

    state[node] = 1;
    for (const neighbor of graph[node]) {
      if (dfs(neighbor)) return true;
    }
    state[node] = 2;
    return false;
  }

  for (let i = 0; i < numCourses; i++) {
    if (state[i] === 0 && dfs(i)) return false;
  }

  return true;
};
```

---

## 🧪 Test Cases

```javascript
console.log(canFinish(2, [[1, 0]])); // true

console.log(canFinish(2, [[1, 0], [0, 1]])); // false (cycle: 0↔1)

console.log(canFinish(4, [[1, 0], [2, 0], [3, 1], [3, 2]])); // true

console.log(canFinish(3, [[1, 0], [2, 1]])); // true

console.log(canFinish(3, [[1, 0], [2, 1], [0, 2]])); // false (cycle)
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Cycle Detection trong Directed Graph

💡 KEY INSIGHT:
   "3-color DFS: VISITING → CYCLE"
   "DFS + cycle detection = Topological Sort check"
   "Kahn's BFS = in-degree zero removal"

⚠️ PITFALLS:
   - Cần 3 states (unvisited/visiting/done), không phải 2
   - Edge direction: prereq → course

🔄 VARIATIONS:
   - Course Schedule II (#210) → trả về topological order
   - Redundant Connection (#684) → tìm cạnh gây cycle
   - Minimum Height Trees (#310) → xóa leaves

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Course Schedule II (#210)
// Trả về thứ tự hợp lệ để hoàn thành courses
function findOrder(numCourses, prerequisites) {
  const graph = Array.from({length: numCourses}, () => []);
  const inDegree = Array(numCourses).fill(0);
  
  for (const [course, prereq] of prerequisites) {
    graph[prereq].push(course);
    inDegree[course]++;
  }
  
  const queue = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }
  
  const result = [];
  while (queue.length) {
    const course = queue.shift();
    result.push(course);
    for (const next of graph[course]) {
      inDegree[next]--;
      if (inDegree[next] === 0) queue.push(next);
    }
  }
  
  return result.length === numCourses ? result : [];
}

// Variation 2: Minimum Height Trees (#310)
// Tìm root của MHT
function findMinHeightTrees(n, edges) {
  if (n === 1) return [0];
  const graph = Array.from({length: n}, () => []);
  for (const [a, b] of edges) {
    graph[a].push(b);
    graph[b].push(a);
  }
  
  let leaves = graph.map((adj, i) => [adj.length, i])
    .filter(([len]) => len === 1).map(([, i]) => i);
  
  let remaining = n;
  while (remaining > 2) {
    const newLeaves = [];
    for (const leaf of leaves) {
      remaining--;
      for (const neighbor of graph[leaf]) {
        if (--graph[neighbor].length === 1) {
          newLeaves.push(neighbor);
        }
      }
    }
    leaves = newLeaves;
  }
  return leaves;
}

// Variation 3: Sequence Reconstruction (#444)
// Kiểm tra có thể reconstruct sequence
function sequenceReconstruction(nums, sequences) {
  const graph = Array.from({length: nums.length}, () => []);
  const inDegree = Array(nums.length).fill(0);
  
  for (const seq of sequences) {
    for (let i = 0; i < seq.length; i++) {
      if (i > 0) {
        graph[seq[i-1]].push(seq[i]);
        inDegree[seq[i]]++;
      }
    }
  }
  
  const queue = [];
  for (let i = 0; i < nums.length; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }
  
  const result = [];
  while (queue.length === 1) {
    const node = queue.shift();
    result.push(node);
    for (const next of graph[node]) {
      if (--inDegree[next] === 0) queue.push(next);
    }
  }
  
  return result.length === nums.length;
}

// Variation 4: Parallel Courses (#1136)
// Số "batches" tối thiểu để hoàn thành tất cả courses
function minimumSemesters(n, relations) {
  const graph = Array.from({length: n}, () => []);
  const inDegree = Array(n).fill(0);
  
  for (const [a, b] of relations) {
    graph[a-1].push(b-1);
    inDegree[b-1]++;
  }
  
  let semesters = 0;
  let completed = 0;
  let queue = [];
  
  for (let i = 0; i < n; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }
  
  while (queue.length) {
    semesters++;
    const next = [];
    for (const course of queue) {
      completed++;
      for (const nextCourse of graph[course]) {
        if (--inDegree[nextCourse] === 0) {
          next.push(nextCourse);
        }
      }
    }
    queue = next;
  }
  
  return completed === n ? semesters : -1;
}

// Variation 5: Find Eventual Safe States (#802)
// Tìm eventual safe states (không có cycle đến terminal)
function eventualSafeStates(graph) {
  const n = graph.length;
  const safe = Array(n).fill(false);
  const visited = Array(n).fill(0); // 0=unvisited, 1=visiting, 2=safe
  
  function dfs(node) {
    if (visited[node] === 2) return true;
    if (visited[node] === 1) return false;
    visited[node] = 1;
    for (const next of graph[node]) {
      if (!dfs(next)) return false;
    }
    visited[node] = 2;
    return true;
  }
  
  for (let i = 0; i < n; i++) {
    if (dfs(i)) safe[i] = true;
  }
  
  return safe.map((v, i) => v ? i : -1).filter(i => i !== -1);
}
```

---

## ➡️ Bài tiếp theo

[Bài 5: Number of Connected Components](./005-number-of-components.md)
