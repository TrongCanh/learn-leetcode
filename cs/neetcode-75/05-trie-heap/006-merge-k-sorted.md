# #23 - Merge K Sorted Lists

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🔴 Hard |
| **Chủ đề** | Heap, Linked List |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/merge-k-sorted-lists/

---

## 📖 Đề bài

### Mô tả
Merge `k` sorted linked lists thành 1 sorted linked list.

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Merge k sorted lists
→ K-way merge = Priority Queue (Min Heap)
→ Lấy min từ k heads → nối vào result
```

---

### 🤔 2. Tư duy từng bước

> **Aha moment:**
> ```
> Min Heap lưu k nodes (1 head mỗi list)
> Pop min → attach vào result
> Push next node của list vừa pop
> ```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Min Heap (O(n log k)) ⭐

```javascript
function mergeKLists(lists) {
  const heap = [];

  // Khởi tạo: push 1 head mỗi list
  for (const list of lists) {
    if (list) heap.push(list);
  }

  // Min heap by val
  heap.sort((a, b) => a.val - b.val);

  const dummy = new ListNode(0);
  let curr = dummy;

  while (heap.length > 0) {
    const min = heap.shift();
    curr.next = min;
    curr = curr.next;

    if (min.next) {
      heap.push(min.next);
      heap.sort((a, b) => a.val - b.val);
    }
  }

  return dummy.next;
}
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Merge K Sorted Lists - Min Heap
 */
function mergeKLists(lists) {
  const heap = [];
  for (const list of lists) if (list) heap.push(list);
  heap.sort((a, b) => a.val - b.val);

  const dummy = new ListNode(0);
  let curr = dummy;

  while (heap.length > 0) {
    const min = heap.shift();
    curr.next = min;
    curr = curr.next;
    if (min.next) {
      heap.push(min.next);
      heap.sort((a, b) => a.val - b.val);
    }
  }
  return dummy.next;
}
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: K-way Merge với Min Heap

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Merge K Sorted Lists với Priority Queue
// Dùng Priority Queue (custom comparator)
function mergeKLists(lists) {
  const heap = [];
  for (const list of lists) {
    if (list) heap.push(list);
  }
  heap.sort((a, b) => a.val - b.val);
  
  const dummy = new ListNode(0);
  let curr = dummy;
  
  while (heap.length) {
    const node = heap.shift();
    curr.next = node;
    curr = curr.next;
    if (node.next) heap.push(node.next);
    heap.sort((a, b) => a.val - b.val);
  }
  return dummy.next;
}

// Variation 2: Merge Two Sorted Lists (#21)
// Merge 2 lists
function mergeTwoLists(l1, l2) {
  if (!l1 || !l2) return l1 || l2;
  if (l1.val < l2.val) {
    l1.next = mergeTwoLists(l1.next, l2);
    return l1;
  } else {
    l2.next = mergeTwoLists(l1, l2.next);
    return l2;
  }
}

// Variation 3: Sort List (#148)
// Sắp xếp linked list (Merge Sort)
function sortList(head) {
  if (!head || !head.next) return head;
  
  let slow = head, fast = head.next;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  
  const mid = slow.next;
  slow.next = null;
  
  return mergeTwoLists(sortList(head), sortList(mid));
}

// Variation 4: Kth Smallest Element in Sorted Matrix (#378)
// Tìm kth smallest trong sorted matrix
function kthSmallest(matrix, k) {
  const heap = [];
  for (let i = 0; i < matrix.length; i++) {
    heap.push([matrix[i][0], i, 0]);
  }
  heap.sort((a, b) => a[0] - b[0]);
  
  for (let i = 0; i < k - 1; i++) {
    const [_, r, c] = heap.shift();
    if (c + 1 < matrix[0].length) {
      heap.push([matrix[r][c+1], r, c+1]);
      heap.sort((a, b) => a[0] - b[0]);
    }
  }
  return heap[0][0];
}

// Variation 5: Smallest Range Covering Elements from K Lists (#632)
// Tìm range nhỏ nhất chứa elements từ K lists
```

---

## ➡️ Quay lại README Week 5
