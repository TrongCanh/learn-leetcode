# #104 - Maximum Depth of Binary Tree

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | Tree, DFS |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/maximum-depth-of-binary-tree/

---

## 📖 Đề bài

### Mô tả
Tìm **độ sâu tối đa** (số nodes trên đường đi dài nhất từ root đến leaf) của một binary tree.

### Ví dụ

**Example:**
```
Input:  [3,9,20,null,null,15,7]
Output: 3
Giải thích: Path dài nhất = 3 → 20 → 7
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Độ sâu tối đa của tree
→ DFS: độ sâu = 1 + max(left, right)
```

---

### 🤔 2. Tư duy từng bước

> **Aha moment:**
> ```
> maxDepth(node):
>   if !node: return 0
>   return 1 + max(maxDepth(node.left), maxDepth(node.right))
>
> → Recursive đơn giản!
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Depth = 1 + max(depth(left), depth(right))"  │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Leaf node: return 1"                             │
│   "Null node: return 0"                            │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "BFS: đếm levels"                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: DFS Recursive (O(n), O(h)) ⭐

```javascript
function maxDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

#### 🔹 Cách 2: BFS Level Count (O(n), O(w))

```javascript
function maxDepth(root) {
  if (!root) return 0;
  let depth = 0;
  const queue = [root];
  while (queue.length) {
    depth++;
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }
  return depth;
}
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Maximum Depth - DFS Recursive
 * Time: O(n) | Space: O(h)
 */
function maxDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Tree DFS

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Minimum Depth of Binary Tree (#111)
// Tìm độ sâu NHỎ NHẤT (root → leaf ngắn nhất)
function minDepth(root) {
  if (!root) return 0;
  if (!root.left) return 1 + minDepth(root.right);
  if (!root.right) return 1 + minDepth(root.left);
  return 1 + Math.min(minDepth(root.left), minDepth(root.right));
}

// Variation 2: Maximum Width of Binary Tree (#662)
// Tìm độ rộng lớn nhất của tree
function widthOfBinaryTree(root) {
  // Dùng BFS + index đánh dấu vị trí
}

// Variation 3: Count Complete Tree Nodes (#222)
// Đếm số nodes trong complete binary tree
function countNodes(root) {
  if (!root) return 0;
  let left = root.left, right = root.right;
  let leftDepth = 0, rightDepth = 0;
  
  while (left) {
    leftDepth++;
    left = left.left;
  }
  while (right) {
    rightDepth++;
    right = right.right;
  }
  
  if (leftDepth === rightDepth) {
    return Math.pow(2, leftDepth + 1) - 1;
  }
  
  return 1 + countNodes(root.left) + countNodes(root.right);
}

// Variation 4: Height of Binary Tree (#104)
// Chiều cao tree (khác với depth!)
// Depth: root → node
// Height: node → leaf (sâu nhất)

// Variation 5: Balanced Binary Tree (#110)
// Kiểm tra tree có cân bằng không
function isBalanced(root) {
  function dfs(node) {
    if (!node) return 0;
    const left = dfs(node.left);
    const right = dfs(node.right);
    if (left === -1 || right === -1) return -1;
    if (Math.abs(left - right) > 1) return -1;
    return Math.max(left, right) + 1;
  }
  return dfs(root) !== -1;
}
```

---

## ➡️ Bài tiếp theo

[Bài 6: Invert Binary Tree](./006-invert-tree.md)
