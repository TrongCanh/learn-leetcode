# #235 - Lowest Common Ancestor of BST

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Tree, BST |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/

---

## 📖 Đề bài

### Mô tả
Tìm **LCA** (Lowest Common Ancestor) của 2 nodes trong BST.

LCA = node thấp nhất (xa root nhất) mà cả `p` và `q` đều nằm trong subtree của nó.

### Ví dụ
```
Input: root = [6,2,8,0,4,7,9,null,null,3,5], p=2, q=8
Output: 6
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: LCA trong BST
→ BST property: left < root < right
→ LCA = node mà p và q nằm ở 2 bên
```

---

### 🤔 2. Tư duy từng bước

> **Aha moment:**
> ```
> LCA = node mà p và q nằm ở 2 phía
> if p.val < root.val && q.val < root.val → go left
> if p.val > root.val && q.val > root.val → go right
> else → root là LCA
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "BST: dùng giá trị để quyết định hướng"         │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "LCA = node đầu tiên mà p và q nằm 2 phía"      │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Iterative đơn giản, O(h)"                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Iterative (O(h), O(1)) ⭐

```javascript
function lowestCommonAncestor(root, p, q) {
  while (root) {
    if (p.val < root.val && q.val < root.val) {
      root = root.left;
    } else if (p.val > root.val && q.val > root.val) {
      root = root.right;
    } else {
      return root; // Đây là LCA
    }
  }
}
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Lowest Common Ancestor BST - Iterative
 * Time: O(h) | Space: O(1)
 */
function lowestCommonAncestor(root, p, q) {
  while (root) {
    if (p.val < root.val && q.val < root.val) root = root.left;
    else if (p.val > root.val && q.val > root.val) root = root.right;
    else return root;
  }
}
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: BST + Value-based Navigation

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Lowest Common Ancestor in Binary Tree (không phải BST)
// Không có BST property, dùng DFS
function lowestCommonAncestor(root, p, q) {
  if (!root || root === p || root === q) return root;
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);
  if (!left) return right;
  if (!right) return left;
  return root;
}

// Variation 2: Lowest Common Ancestor of Deepest Leaves (#1123)
// LCA của 2 deepest leaves
function lcaDeepestLeaves(root) {
  function dfs(node) {
    if (!node) return [null, 0];
    const [lNode, lDepth] = dfs(node.left);
    const [rNode, rDepth] = dfs(node.right);
    if (lDepth > rDepth) return [lNode, lDepth + 1];
    if (rDepth > lDepth) return [rNode, rDepth + 1];
    return [node, lDepth + 1];
  }
  return dfs(root)[0];
}

// Variation 3: Find Elements in BST
// Tìm tất cả elements trong khoảng
function rangeSumBST(root, low, high) {
  if (!root) return 0;
  let sum = 0;
  if (root.val > low) sum += rangeSumBST(root.left, low, high);
  if (root.val < high) sum += rangeSumBST(root.right, low, high);
  if (root.val >= low && root.val <= high) sum += root.val;
  return sum;
}

// Variation 4: BST Iterator
// Duyệt BST theo thứ tự

// Variation 5: Validate BST (#98)
// Kiểm tra có phải BST không
function isValidBST(root) {
  function validate(node, min, max) {
    if (!node) return true;
    if (node.val <= min || node.val >= max) return false;
    return validate(node.left, min, node.val) && 
           validate(node.right, node.val, max);
  }
  return validate(root, -Infinity, Infinity);
}
```

---

## ➡️ Quay lại README Week 4
