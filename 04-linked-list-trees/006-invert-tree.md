# #226 - Invert Binary Tree

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | Tree |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/invert-binary-tree/

---

## 📖 Đề bài

### Mô tả
Đảo ngược (invert) một binary tree — swap tất cả left và right children.

### Ví dụ

```
Input:       Output:
   4            4
  / \          / \
 2   7        7   2
/\  /\       /\  /\
1 3 6 9     9 6 3 1
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Swap left ↔ right của mỗi node
→ Recursive: swap → invert children
```

---

### 🤔 2. Tư duy từng bước

> **Aha moment:**
> ```
> invert(node):
>   if !node: return
>   swap(node.left, node.right)
>   invert(node.left)
>   invert(node.right)
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Swap TRƯỚC, đệ quy SAU"                        │
│   → Đảm bảo children được xử lý                   │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Iterative: dùng queue BFS"                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: DFS Recursive (O(n), O(h)) ⭐

```javascript
function invertTree(root) {
  if (!root) return root;

  const temp = root.left;
  root.left = root.right;
  root.right = temp;

  invertTree(root.left);
  invertTree(root.right);

  return root;
}
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Invert Binary Tree - Recursive
 * Time: O(n) | Space: O(h)
 */
function invertTree(root) {
  if (!root) return root;
  const temp = root.left;
  root.left = root.right;
  root.right = temp;
  invertTree(root.left);
  invertTree(root.right);
  return root;
}
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Tree Swap + Recursive

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Invert Binary Tree (Iterative)
// Dùng BFS thay vì DFS
function invertTreeIterative(root) {
  if (!root) return root;
  const queue = [root];
  
  while (queue.length) {
    const node = queue.shift();
    const temp = node.left;
    node.left = node.right;
    node.right = temp;
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  return root;
}

// Variation 2: Mirror Tree
// Kiểm tra 2 trees có phải mirror của nhau không
function isMirror(t1, t2) {
  if (!t1 && !t2) return true;
  if (!t1 || !t2) return false;
  return t1.val === t2.val &&
         isMirror(t1.left, t2.right) &&
         isMirror(t1.right, t2.left);
}

// Variation 3: Symmetric Tree (#101)
// Kiểm tra tree có đối xứng không
function isSymmetric(root) {
  return isMirror(root.left, root.right);
}

// Variation 4: Clone/Invert Tree
// Tạo bản sao đã invert

// Variation 5: Flip Equivalent Trees (#951)
// Kiểm tra có thể flip để bằng nhau không
function flipEquiv(root1, root2) {
  if (!root1 && !root2) return true;
  if (!root1 || !root2 || root1.val !== root2.val) return false;
  return (flipEquiv(root1.left, root2.left) && 
          flipEquiv(root1.right, root2.right)) ||
         (flipEquiv(root1.left, root2.right) && 
          flipEquiv(root1.right, root2.left));
}
```

---

## ➡️ Bài tiếp theo

[Bài 7: Same Tree](./007-same-tree.md)
