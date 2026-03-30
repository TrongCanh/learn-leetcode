# 🔗 Linked List & Trees

> **Tuần 4** | **9 bài** | **🟢🟢🟡** | ⏱️ ~1 tuần

---

## 🎯 MỤC TIÊU TUẦN NÀY

- [ ] Nắm vững Linked List operations: reverse, merge, remove Nth, detect cycle
- [ ] Hiểu sâu Tree traversals: DFS (Pre/In/Post) vs BFS (Level Order)
- [ ] Phân biệt được khi nào dùng **Recursive** vs **Iterative**
- [ ] Thành thạo **Two Pointers** (Slow & Fast) cho Linked List

---

## 📖 TỔNG QUAN

### Linked List (Danh sách liên kết)

**Linked List** là cấu trúc dữ liệu gồm các **node**, mỗi node chứa **data** và **con trỏ** đến node tiếp theo.

```
┌────────────────────────────────────────────────────────┐
│  Singly Linked List: 1 → 2 → 3 → 4 → null            │
│                                                        │
│  Node Structure:                                       │
│  ┌─────────────┐                                       │
│  │ data │ next │                                       │
│  └─────────────┘                                       │
│     ↑                                               │
│  head ────→ next ────→ next ────→ null               │
│                                                        │
│  ┌───────┐    ┌───────┐    ┌───────┐    ┌───────┐    │
│  │  1    │ → │  2    │ → │  3    │ → │  4    │ → null │
│  │ data  │    │ data  │    │ data  │    │ data  │         │
│  │ next ─┼──→│ next ─┼──→│ next ─┼──→│ next  │         │
│  └───────┘    └───────┘    └───────┘    └───────┘         │
│    head                                                    │
└────────────────────────────────────────────────────────┘
```

### Node trong JavaScript:

```javascript
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// Tạo linked list: 1 → 2 → 3 → null
const n1 = new ListNode(1);
const n2 = new ListNode(2);
const n3 = new ListNode(3);
n1.next = n2;
n2.next = n3;
// Result: 1 → 2 → 3 → null
```

### Đặc điểm Linked List:

| Thao tác | Độ phức tạp | Ghi chú |
|-----------|-------------|---------|
| Random Access (get i-th) | O(n) | Phải duyệt từ head |
| Insert/Delete (at head) | O(1) | Pointer thay đổi |
| Insert/Delete (at tail) | O(n) | Cần traverse to tail |
| Insert/Delete (given node) | O(1) | Nếu có pointer |
| Search | O(n) | Duyệt tuyến tính |

### Linked List vs Array:

```
┌────────────────┬──────────────┬─────────────────┐
│     Criteria   │  Linked List  │      Array      │
├────────────────┼──────────────┼─────────────────┤
│ Access by index│    O(n)       │      O(1)       │
│ Insert at head │    O(1)       │      O(n)       │
│ Insert at tail │    O(n)*      │      O(1) amort │
│ Delete at head │    O(1)       │      O(n)       │
│ Memory         │   scattered   │    contiguous   │
│ Size           │   dynamic     │    fixed**      │
└────────────────┴──────────────┴─────────────────┘
* O(1) nếu có tail pointer
** dynamic array thì tự mở rộng
```

---

### Tree (Cây)

**Tree** là cấu trúc dữ liệu **phi tuyến tính** gồm các **node** có quan hệ **cha-con**, không có chu trình.

```
Binary Tree:
                1
              /   \
             2     3
            / \   / \
           4   5 6   7

Depth: root = 0, children = 1, grandchildren = 2, ...
Height: số tầng = 3 (0, 1, 2)
```

### Binary Tree Node:

```javascript
class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Tạo cây:
const root = new TreeNode(1);
root.left = new TreeNode(2);
root.right = new TreeNode(3);
root.left.left = new TreeNode(4);
root.left.right = new TreeNode(5);
```

### Binary Tree Traversals:

```
                1
              /   \
             2     3
            / \   /
           4   5 6

Preorder  (Root → Left → Right):  1, 2, 4, 5, 3, 6
Inorder   (Left → Root → Right):   4, 2, 5, 1, 6, 3
Postorder (Left → Right → Root):  4, 5, 2, 6, 3, 1
Level Order (BFS):                 1, 2, 3, 4, 5, 6
```

---

## 🔄 PATTERNS CỐT LÕI

### Pattern 1: Reverse Linked List

**Dùng khi:** Đảo ngược linked list.

```javascript
// ❌ Brute Force: Dùng array → O(n) space
function reverseListBrute(head) {
  const arr = [];
  let curr = head;
  while (curr) {
    arr.push(curr.val);
    curr = curr.next;
  }
  arr.reverse();
  // Rebuild list...
}

// ✅ Iterative: O(1) space
function reverseList(head) {
  let prev = null;
  let curr = head;

  while (curr) {
    const next = curr.next;  // Lưu next
    curr.next = prev;        // Đảo chiều
    prev = curr;             // Di chuyển prev
    curr = next;             // Di chuyển curr
  }

  return prev;  // prev là head mới
}

// ✅ Recursive: O(n) space (call stack)
function reverseListRecursive(head, prev = null) {
  if (!head) return prev;
  const next = head.next;
  head.next = prev;
  return reverseListRecursive(next, head);
}
```

**Visual — Reverse Linked List:**
```
Before:  null ← 1   2   3   4
              ↑   ↑
            prev curr

Step 1:  next = 2
         1.next = null
         prev = 1, curr = 2

Step 2:  next = 3
         2.next = 1
         prev = 2, curr = 3

Step 3:  next = 4
         3.next = 2
         prev = 3, curr = 4

Step 4:  next = null
         4.next = 3
         prev = 4, curr = null

Return: prev = 4

After:  4 → 3 → 2 → 1 → null
```

---

### Pattern 2: Find Middle (Slow & Fast Pointers)

**Dùng khi:** Tìm middle node, detect cycle, find Nth from end.

```javascript
// Tìm middle node (2 middle nếu chẵn → trả về second)
function middleNode(head) {
  let slow = head;
  let fast = head;

  while (fast && fast.next) {
    slow = slow.next;           // Slow: 1 step
    fast = fast.next.next;      // Fast: 2 steps
  }

  return slow;  // Slow đang ở middle
}

// Tìm middle (2 middle nếu chẵn → trả về first)
function middleNodeFirst(head) {
  let slow = head;
  let fast = head.next;  // Khác cách trên!

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }

  return slow;
}
```

**Visual — Slow & Fast Pointers:**
```
Odd length: 1 → 2 → 3 → 4 → 5

Step 0: slow=1, fast=1
Step 1: slow=2, fast=3
Step 2: slow=3, fast=5
Step 3: fast=null → stop → return slow=3 ✓

Even length: 1 → 2 → 3 → 4

Step 0: slow=1, fast=2
Step 1: slow=2, fast=4
Step 2: fast.next=null → stop → return slow=2
        (second middle = 3)

        Nếu muốn first middle → fast=1 → stop → slow=2 ✓
```

---

### Pattern 3: Merge Two Sorted Lists

**Dùng khi:** Merge hai sorted linked lists thành một sorted list.

```javascript
// ✅ Iterative với Dummy Node
function mergeTwoLists(l1, l2) {
  const dummy = new ListNode(0);  // Dummy node
  let curr = dummy;

  while (l1 && l2) {
    if (l1.val <= l2.val) {
      curr.next = l1;
      l1 = l1.next;
    } else {
      curr.next = l2;
      l2 = l2.next;
    }
    curr = curr.next;
  }

  // Append phần còn lại
  curr.next = l1 || l2;

  return dummy.next;
}

// ✅ Recursive
function mergeTwoListsRecursive(l1, l2) {
  if (!l1) return l2;
  if (!l2) return l1;

  if (l1.val <= l2.val) {
    l1.next = mergeTwoListsRecursive(l1.next, l2);
    return l1;
  } else {
    l2.next = mergeTwoListsRecursive(l1, l2.next);
    return l2;
  }
}
```

**Visual — Merge Two Sorted Lists:**
```
l1: 1 → 3 → 5
l2: 2 → 4 → 6

dummy: 0
         ↓
Step 1: 1 < 2 → curr.next = 1 → curr = 1, l1 = 3
Step 2: 3 < 2? NO → curr.next = 2 → curr = 2, l2 = 4
Step 3: 3 < 4 → curr.next = 3 → curr = 3, l1 = 5
Step 4: 5 < 4? NO → curr.next = 4 → curr = 4, l2 = 6
Step 5: 5 < 6 → curr.next = 5 → curr = 5, l1 = null
Step 6: l1 = null → curr.next = 6

Result: 1 → 2 → 3 → 4 → 5 → 6 ✓
```

---

### Pattern 4: DFS Tree Traversals

```javascript
// 1. Preorder (Root → Left → Right)
function preorder(root) {
  if (!root) return;
  console.log(root.val);    // Visit root
  preorder(root.left);       // Visit left
  preorder(root.right);      // Visit right
}

// 2. Inorder (Left → Root → Right)
function inorder(root) {
  if (!root) return;
  inorder(root.left);
  console.log(root.val);     // Visit root
  inorder(root.right);
}

// 3. Postorder (Left → Right → Root)
function postorder(root) {
  if (!root) return;
  postorder(root.left);
  postorder(root.right);
  console.log(root.val);     // Visit root
}

// 4. Level Order (BFS)
function levelOrder(root) {
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

**Visual — Tree Traversals:**
```
                1
              /   \
             2     3
            / \   / \
           4   5 6   7

Preorder:   [1] → [2,4,5] → [3,6,7]
            Visit 1, then recurse left, then right
            Result: 1, 2, 4, 5, 3, 6, 7

Inorder:    [4,2,5] → [1] → [6,3,7]
            Visit left, then root, then right
            Result: 4, 2, 5, 1, 6, 3, 7

Postorder:  [4,5,2] → [6,7,3] → [1]
            Visit left, then right, then root
            Result: 4, 5, 2, 6, 7, 3, 1

Level:      [[1], [2,3], [4,5,6,7]]
            BFS level by level
            Result: 1, 2, 3, 4, 5, 6, 7
```

---

### Pattern 5: Maximum Depth of Tree

```javascript
// DFS - Recursive
function maxDepth(root) {
  if (!root) return 0;

  const leftDepth = maxDepth(root.left);
  const rightDepth = maxDepth(root.right);

  return Math.max(leftDepth, rightDepth) + 1;
}

// BFS - Iterative (Level Order)
function maxDepthBFS(root) {
  if (!root) return 0;

  let depth = 0;
  const queue = [root];

  while (queue.length > 0) {
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

### Pattern 6: Invert Binary Tree

```javascript
// ✅ Recursive
function invertTree(root) {
  if (!root) return null;

  // Swap children
  const temp = root.left;
  root.left = root.right;
  root.right = temp;

  // Recurse
  invertTree(root.left);
  invertTree(root.right);

  return root;
}

// ✅ Iterative (BFS)
function invertTreeIterative(root) {
  if (!root) return null;

  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    [node.left, node.right] = [node.right, node.left];  // Swap

    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }

  return root;
}
```

**Visual — Invert Tree:**
```
Before:          After:
    1                  1
   / \                / \
  2   3     ────→    3   2
 / \                  / \
4   5                5   4

Recursive:
  invert(1): swap 2↔3
    invert(2): swap 4↔5
      invert(4): null → return
      invert(5): null → return
    invert(3): null → return
  return 1
```

---

### Pattern 7: Validate BST

```javascript
// ✅ Recursive với bounds
function isValidBST(root, min = -Infinity, max = Infinity) {
  if (!root) return true;

  // Node phải thỏa: min < root.val < max
  if (root.val <= min || root.val >= max) {
    return false;
  }

  // Left subtree: all values < root.val → max = root.val
  // Right subtree: all values > root.val → min = root.val
  return isValidBST(root.left, min, root.val) &&
         isValidBST(root.right, root.val, max);
}

// ✅ Iterative với Inorder Traversal (BST: inorder sorted)
function isValidBSTInorder(root) {
  const stack = [];
  let prev = -Infinity;
  let curr = root;

  while (curr || stack.length > 0) {
    // Go to leftmost
    while (curr) {
      stack.push(curr);
      curr = curr.left;
    }

    curr = stack.pop();
    if (curr.val <= prev) return false;  // Not sorted!
    prev = curr.val;

    curr = curr.right;
  }

  return true;
}
```

---

### Pattern 8: Lowest Common Ancestor (BST)

```javascript
// ✅ For BST: dùng binary search property
function lowestCommonAncestorBST(root, p, q) {
  const minVal = Math.min(p.val, q.val);
  const maxVal = Math.max(p.val, q.val);

  while (root) {
    if (root.val < minVal) {
      root = root.right;  // p, q đều ở bên phải
    } else if (root.val > maxVal) {
      root = root.left;    // p, q đều ở bên trái
    } else {
      return root;         // minVal ≤ root.val ≤ maxVal → found!
    }
  }
}

// ✅ For Binary Tree (không phải BST): dùng DFS
function lowestCommonAncestor(root, p, q) {
  if (!root) return null;

  // Nếu p hoặc q là root → root là LCA
  if (root === p || root === q) return root;

  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);

  // Nếu cả 2 bên đều tìm thấy → root là LCA
  if (left && right) return root;

  // Ngược lại, return bên nào tìm thấy
  return left || right;
}
```

---

## ⚠️ COMMON PITFALLS (Lỗi hay mắc)

### ❌ Pitfall 1: Linked List - không handle null pointers
```javascript
// ❌ Sai: không kiểm tra null
function reverseList(head) {
  let prev = null, curr = head;
  while (curr) {
    const next = curr.next;
    curr.next = prev;  // OK
    prev = curr;
    curr = next;  // curr = null → loop stops, OK
  }
  return prev;  // OK
}

// ⚠️ Thực ra code này đúng, nhưng sai khi:
function getMiddle(head) {
  let slow = head;
  let fast = head;

  while (fast.next) {  // ❌ Nên là: while (fast && fast.next)
    // Nếu fast.next = null (odd length), OK
    // Nếu fast = null (even length) → crash khi gọi fast.next
    slow = slow.next;
    fast = fast.next.next;
  }
}

// ✅ Luôn kiểm tra CẢ fast VÀ fast.next
while (fast && fast.next) {
  slow = slow.next;
  fast = fast.next.next;
}
```

### ❌ Pitfall 2: Linked List - quên Dummy Node khi rebuild
```javascript
// ❌ Sai: không có dummy → phải handle head separately
function mergeTwoLists(l1, l2) {
  let head;       // Uninitialized!
  let curr;       // Uninitialized!
  while (l1 && l2) {
    // ...
  }
  return head;
}

// ✅ Đúng: dùng dummy node
function mergeTwoLists(l1, l2) {
  const dummy = new ListNode(0);  // ← Dummy node
  let curr = dummy;               // ← curr bắt đầu từ dummy

  while (l1 && l2) {
    if (l1.val <= l2.val) {
      curr.next = l1;
      l1 = l1.next;
    } else {
      curr.next = l2;
      l2 = l2.next;
    }
    curr = curr.next;
  }
  curr.next = l1 || l2;

  return dummy.next;  // ← Return dummy.next (bỏ qua dummy node)
}
```

### ❌ Pitfall 3: Tree - quên base case
```javascript
// ❌ Sai: không có base case → stack overflow
function maxDepth(root) {
  // if (!root) return 0;  // ← QUÊN DÒNG NÀY → crash
  return Math.max(maxDepth(root.left), maxDepth(root.right)) + 1;
}

// ✅ Đúng
function maxDepth(root) {
  if (!root) return 0;
  return Math.max(maxDepth(root.left), maxDepth(root.right)) + 1;
}
```

### ❌ Pitfall 4: Tree - dùng BST property sai cho Binary Tree thường
```javascript
// ❌ Sai: dùng BST logic cho Binary Tree thường
function isValidBST(root) {
  // Binary Tree (không phải BST) thì không có property này!
  return root.val > root.left.val && root.val < root.right.val;
}

// ✅ Đúng cho BST: dùng min/max bounds
function isValidBST(root, min = -Infinity, max = Infinity) {
  if (!root) return true;
  if (root.val <= min || root.val >= max) return false;
  return isValidBST(root.left, min, root.val) &&
         isValidBST(root.right, root.val, max);
}
```

### ❌ Pitfall 5: Reorder List - quên tách list sau khi tìm middle
```javascript
// ❌ Sai: merge mà không split trước
function reorderList(head) {
  // Tìm middle
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }

  // Đảo nửa sau
  let prev = null, curr = slow;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }

  // Merge 2 halves
  // ❌ BUG: slow và prev vẫn trỏ vào cùng list!
  // Nếu merge: head.next = prev → tạo cycle!
}

// ✅ Đúng: cần tách 2 halves trước khi merge
function reorderList(head) {
  // Tìm middle
  let slow = head, fast = head;
  while (fast && fast.next && fast.next.next) {
    slow = slow.next;
    fast = fast.next.next;
  }

  // Split: tách thành 2 lists
  let second = slow.next;
  slow.next = null;  // ← QUAN TRỌNG: cắt link giữa 2 halves

  // Đảo nửa sau
  let prev = null, curr = second;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }

  // Merge
  let first = head;
  while (prev) {
    const tmp1 = first.next;
    const tmp2 = prev.next;
    first.next = prev;
    prev.next = tmp1;
    first = tmp1;
    prev = tmp2;
  }
}
```

---

## 💡 TIPS & TRICKS

### 1. Linked List - kỹ thuật Dummy Node

Dummy node giúp **đơn giản hóa** việc xử lý head pointer.

```javascript
// Thay vì:
function addAtHead(val) {
  const newNode = new ListNode(val);
  newNode.next = head;
  head = newNode;  // Phải update head pointer
  return head;
}

// ✅ Với Dummy:
function addAtHead(val) {
  const dummy = new ListNode(0);
  dummy.next = head;  // dummy luôn đứng trước head
  const newNode = new ListNode(val);
  newNode.next = dummy.next;
  dummy.next = newNode;
  return dummy.next;  // return new head
}
```

### 2. Linked List - Remove Nth Node from End

```javascript
// ✅ One-pass: dùng dummy + distance technique
function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0);
  dummy.next = head;

  let first = dummy;
  let second = dummy;

  // Move first n+1 steps ahead
  for (let i = 0; i <= n; i++) {
    first = first.next;
  }

  // Move both until first reaches end
  while (first) {
    first = first.next;
    second = second.next;
  }

  // second is now right before the node to delete
  second.next = second.next.next;

  return dummy.next;
}
```

**Visual — Remove Nth from End:**
```
List: 1 → 2 → 3 → 4 → 5, n = 2

Goal: Remove node 4

Step 1: first = dummy → move 3 steps → first = 4
        dummy → 1 → 2 → 3 → 4 → 5
        ↑              ↑
     second         first

Step 2: first=5, second=3
Step 3: first=null, second=4

        dummy → 1 → 2 → 3     → 5
                          ↑
                       second

second.next = second.next.next → xóa 4

Result: 1 → 2 → 3 → 5 ✓
```

### 3. Tree - Recursive vs Iterative

```
Recursion tốt khi:
  ✅ Logic đơn giản, đệ quy tự nhiên
  ✅ Không lo stack overflow (n < 1000 nodes)
  ✅ Đọc code dễ hiểu

Iterative tốt khi:
  ✅ Tree rất sâu (> 1000 nodes) → tránh stack overflow
  ✅ Cần BFS (level order) → queue
  ✅ Cần kiểm soát chính xác thứ tự
```

### 4. Mẹo Subtree Detection

```javascript
// Kiểm tra xem T có phải subtree của S không
function isSubtree(S, T) {
  // Cách 1: Convert thành string rồi so sánh
  function treeToString(node) {
    if (!node) return "#";
    const left = treeToString(node.left);
    const right = treeToString(node.right);
    return `(${left}${node.val}${right})`;
  }

  const sStr = treeToString(S);
  const tStr = treeToString(T);
  return sStr.includes(tStr);

  // Cách 2: DFS tìm node match rồi so sánh
  function isIdentical(s, t) {
    if (!s && !t) return true;
    if (!s || !t) return false;
    return s.val === t.val &&
           isIdentical(s.left, t.left) &&
           isIdentical(s.right, t.right);
  }

  function dfs(node) {
    if (!node) return false;
    if (node.val === T.val && isIdentical(node, T)) return true;
    return dfs(node.left) || dfs(node.right);
  }

  return dfs(S);
}
```

---

## 🔍 BRUTE FORCE → OPTIMAL

### Linked List

| Bài | Brute Force | Optimal | Cải thiện |
|-----|-------------|---------|-----------|
| Reverse Linked List | Array O(n) | Iterative O(1) space | ✅ |
| Merge Two Sorted Lists | Merge all O(n) | Dummy + merge O(n) | ✅ |
| Remove Nth Node | 2 passes O(n) | 1 pass O(n) | ✅ |
| Reorder List | Array O(n) | 3 steps O(n) | ✅ |

### Tree

| Bài | Brute Force | Optimal | Key insight |
|-----|-------------|---------|-------------|
| Maximum Depth | BFS all nodes | DFS recursion O(n) | ✅ |
| Invert Tree | Rebuild | Swap children | ✅ |
| Same Tree | Stringify | DFS compare | ✅ |
| Subtree | String matching | DFS match | ✅ |
| LCA (BST) | Search 2 times | 1 pass O(log n) | ✅ |

---

## ⏱️ TIME & SPACE COMPLEXITY TỔNG HỢP

### Linked List

| Operation | Time | Space |
|-----------|------|-------|
| Traverse | O(n) | — |
| Search | O(n) | — |
| Insert/Delete (at pointer) | O(1) | — |
| Reverse | O(n) | O(1) iterative |
| Find Middle | O(n) | O(1) |

### Tree

| Traversal | Time | Space (recursion) | Space (iterative) |
|-----------|------|-------------------|-------------------|
| Preorder | O(n) | O(h) | O(w) |
| Inorder | O(n) | O(h) | O(w) |
| Postorder | O(n) | O(h) | O(w) |
| Level Order | O(n) | — | O(w) |

*h = height (sâu), w = width (rộng nhất, tức max nodes per level)*

---

## 🏭 REAL-WORLD APPLICATIONS

| Pattern | Ứng dụng thực tế |
|---------|-------------------|
| Linked List | Browser back/forward (doubly linked), undo/redo, music playlist |
| Stack (LL based) | Expression evaluation, function call stack |
| Tree | File system, DOM tree, organizational charts |
| BST | Database indexing (B-Tree variant), sorted data storage |
| Trie | Autocomplete, spell checker, IP routing |
| DFS | Maze solving, path finding, topological sort |
| BFS | Shortest path (unweighted), level-order processing |

---

## ✅ KHI NÀO DÙNG / KHÔNG DÙNG

### Linked List

**NÊN dùng khi:**
- ✅ Thêm/xóa ở đầu thường xuyên
- ✅ Kích thước không biết trước
- ✅ Không cần random access

**KHÔNG NÊN dùng khi:**
- ❌ Cần random access thường xuyên → **Array**
- ❌ Cần search nhanh → **Hash Table**
- ❌ Memory overhead nghiêm ngặt → Array efficient hơn

### Tree

**NÊN dùng khi:**
- ✅ Dữ liệu có quan hệ phân cấp
- ✅ Cần sorted data với search O(log n) → **BST**
- ✅ DOM manipulation, file systems

**KHÔNG NÊN dùng khi:**
- ❌ Dữ liệu phẳng, không có hierarchy → Array/Hash Table
- ❌ Cần hash-based lookup → Hash Table

### DFS vs BFS

```
DFS (Stack/Recursion):
  ✅ Tìm path / kiểm tra tồn tại
  ✅ Tree height, subtree
  ✅ Topological sort
  ✅ Deep traversal

BFS (Queue):
  ✅ Shortest path (unweighted)
  ✅ Level order processing
  ✅ Shallow solutions
  ✅ Mind breadth of tree
```

---

## 📋 CHEAT SHEET — Tuần 4

### Linked List Templates

```javascript
// 1. Reverse
function reverse(head) {
  let prev = null, curr = head;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}

// 2. Middle
function middle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}

// 3. Merge
function merge(l1, l2) {
  const dummy = new ListNode(0);
  let curr = dummy;
  while (l1 && l2) {
    curr.next = l1.val <= l2.val ? l1 : l2;
    curr = curr.next;
    l1 === curr ? l1 = l1.next : l2 = l2.next;
  }
  curr.next = l1 || l2;
  return dummy.next;
}
```

### Tree Templates

```javascript
// DFS Recursive
function dfs(root) {
  if (!root) return;
  // Preorder: xử lý root ở đây
  dfs(root.left);
  // Inorder: xử lý root ở đây
  dfs(root.right);
  // Postorder: xử lý root ở đây
}

// BFS Level Order
function bfs(root) {
  if (!root) return [];
  const queue = [root], result = [];
  while (queue.length) {
    const level = [], size = queue.length;
    for (let i = 0; i < size; i++) {
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

### Quick Decision Tree

```
Bài toán Linked List:
  ├── Reverse? ──→ prev=null, curr, swap next
  ├── Find middle? ──→ Slow & Fast pointers
  ├── Merge sorted? ──→ Dummy node + compare
  ├── Cycle? ──→ Floyd's algorithm (slow & fast)
  └── Remove Nth from end? ──→ Distance = n + 1

Bài toán Tree:
  ├── Depth/Height? ──→ DFS recursion
  ├── Level order? ──→ BFS + queue
  ├── BST validation? ──→ Inorder sorted hoặc min/max bounds
  ├── LCA (BST)? ──→ Binary search theo giá trị
  └── LCA (BT)? ──→ DFS, return node if p or q
```

---

## 📝 BÀI TẬP TUẦN NÀY

### Linked List

| # | Bài | LeetCode | Độ khó | Pattern | Status |
|---|-----|----------|--------|---------|--------|
| 1 | Reverse Linked List | #206 | 🟢 Easy | Reverse | ⬜ |
| 2 | Merge Two Sorted Lists | #21 | 🟢 Easy | Merge + Two Pointers | ⬜ |
| 3 | Reorder List | #143 | 🟡 Medium | Middle + Reverse + Merge | ⬜ |
| 4 | Remove Nth Node From End | #19 | 🟡 Medium | Two Pointers | ⬜ |

### Trees

| # | Bài | LeetCode | Độ khó | Pattern | Status |
|---|-----|----------|--------|---------|--------|
| 5 | Maximum Depth of Binary Tree | #104 | 🟢 Easy | DFS/BFS | ⬜ |
| 6 | Invert Binary Tree | #226 | 🟢 Easy | DFS/BFS | ⬜ |
| 7 | Same Tree | #100 | 🟢 Easy | DFS | ⬜ |
| 8 | Subtree of Another Tree | #572 | 🟢 Easy | DFS | ⬜ |
| 9 | Lowest Common Ancestor of BST | #235 | 🟡 Medium | BST Search | ⬜ |

**Hoàn thành:** 0/9 (0%)

---

## 📚 TÀI NGUYÊN

- Video: [NeetCode Linked List](https://www.youtube.com/)
- Video: [NeetCode Trees](https://www.youtube.com/)
- Article: [GeeksforGeeks - Linked List](https://geeksforgeeks.org/data-structures/linked-list/)
- Article: [GeeksforGeeks - Tree](https://geeksforgeeks.org/binary-tree-data-structure/)
- Visual: [Linked List Visualization](https://visualgo.net/en/list)
- Visual: [Tree Traversal Visualization](https://visualgo.net/en/bt)
