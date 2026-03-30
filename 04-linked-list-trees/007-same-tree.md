# #100 - Same Tree

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | Tree, DFS |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/same-tree/

---

## 📖 Đề bài

### Mô tả
Kiểm tra xem 2 binary trees có giống nhau hay không.

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: 2 trees có giống nhau hoàn toàn?
→ So sánh node theo node (DFS)
```

---

### 🤔 2. Tư duy từng bước

> **Aha moment:**
> ```
> sameTree(p, q):
>   if !p && !q → true
>   if !p || !q → false
>   if p.val !== q.val → false
>   return sameTree(p.left, q.left) && sameTree(p.right, q.right)
> ```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: DFS Recursive (O(n), O(h)) ⭐

```javascript
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
 * Same Tree - DFS
 * Time: O(n) | Space: O(h)
 */
function isSameTree(p, q) {
  if (!p && !q) return true;
  if (!p || !q) return false;
  if (p.val !== q.val) return false;
  return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Tree DFS - Compare Nodes

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Merge Two Binary Trees (#617)
// Gộp 2 trees cùng cấu trúc
function mergeTrees(root1, root2) {
  if (!root1) return root2;
  if (!root2) return root1;
  root1.val += root2.val;
  root1.left = mergeTrees(root1.left, root2.left);
  root1.right = mergeTrees(root1.right, root2.right);
  return root1;
}

// Variation 2: Subtree of Another Tree với Hash
// Dùng hash để so sánh nhanh hơn

// Variation 3: Check if Tree is Subtree (#572)
// Đã là bài này!

// Variation 4: Identical Binary Tree (chính là Same Tree)
// Kiểm tra 2 trees giống hệt nhau

// Variation 5: All Possible Full Binary Trees (#894)
// Tạo tất cả full binary trees với n nodes
```

---

## ➡️ Bài tiếp theo

[Bài 8: Subtree of Another Tree](./008-subtree.md)
