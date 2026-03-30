# #572 - Subtree of Another Tree

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | Tree |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/subtree-of-another-tree/

---

## 📖 Đề bài

### Mô tả
Kiểm tra xem tree `s` có chứa subtree `t` (giống hệt cấu trúc và giá trị).

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: s có chứa t như subtree?
→ Dùng lại isSameTree từ bài trước
→ DFS: nếu sameTree → return true
```

---

### 🤔 2. Tư duy từng bước

> **Aha moment:**
> ```
> isSubtree(s, t):
>   if !s → false
>   if sameTree(s, t) → true
>   return isSubtree(s.left, t) || isSubtree(s.right, t)
> ```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: DFS + SameTree (O(|s| × |t|)) ⭐

```javascript
function isSubtree(s, t) {
  if (!s) return false;
  if (isSameTree(s, t)) return true;
  return isSubtree(s.left, t) || isSubtree(s.right, t);
}

function isSameTree(p, q) {
  if (!p && !q) return true;
  if (!p || !q) return false;
  if (p.val !== q.val) return false;
  return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Subtree - DFS + SameTree
 * Time: O(|s| × |t|) | Space: O(h)
 */
function isSubtree(s, t) {
  if (!s) return false;
  if (isSameTree(s, t)) return true;
  return isSubtree(s.left, t) || isSubtree(s.right, t);
}
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: DFS + Reuse SameTree

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Lowest Common Ancestor in Binary Tree (không phải BST)
// Không có BST property, dùng parent pointers hoặc DFS
function lowestCommonAncestor(root, p, q) {
  if (!root || root === p || root === q) return root;
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);
  if (!left) return right;
  if (!right) return left;
  return root;
}

// Variation 2: Lowest Common Ancestor với Parent Pointer
// Mỗi node có pointer đến parent
function lcaWithParent(p, q) {
  const pAncestors = new Set();
  while (p) {
    pAncestors.add(p);
    p = p.parent;
  }
  while (q) {
    if (pAncestors.has(q)) return q;
    q = q.parent;
  }
}

// Variation 3: Find Distance between 2 Nodes
// Khoảng cách giữa 2 nodes
function distance(root, p, q) {
  const lca = lowestCommonAncestor(root, p, q);
  return dist(lca, p) + dist(lca, q);
  
  function dist(node, target) {
    if (!node) return -1;
    if (node === target) return 0;
    const left = dist(node.left, target);
    if (left !== -1) return left + 1;
    const right = dist(node.right, target);
    if (right !== -1) return right + 1;
    return -1;
  }
}

// Variation 4: Kth Ancestor of Node
// Tìm tổ tiên thứ k của node

// Variation 5: Lowest Common Ancestor in Binary Tree III (#1650)
// 2 nodes có parent pointers
```

---

## ➡️ Bài tiếp theo

[Bài 9: Lowest Common Ancestor](./009-lowest-common-ancestor.md)
