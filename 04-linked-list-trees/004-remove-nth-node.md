# #19 - Remove Nth Node From End of List

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Linked List, Two Pointers |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/remove-nth-node-from-end-of-list/

---

## 📖 Đề bài

### Mô tả
Xóa node thứ `n` từ **cuối** của linked list.

### Ví dụ

**Example 1:**
```
Input:  [1,2,3,4,5], n = 2
Output: [1,2,3,5]
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Xóa node thứ n từ cuối
→ Two pointers: fast đi trước n bước
→ Khi fast=null → slow đang ở node cần xóa
```

---

### 🤔 2. Tư duy từng bước

> **Aha moment:**
> ```
> Dummy node để handle xóa head
> fast = dummy → đi n+1 bước
> Khi fast=null → slow.next = node cần xóa
> → slow.next = slow.next.next
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Fast đi trước n+1 bước"                        │
│   → Khi fast=null → slow đang ở node TRƯỚC node cần xóa│
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Dummy node = xử lý xóa head dễ dàng"           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Two Pointers + Dummy (O(n), O(1)) ⭐

```javascript
function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0);
  dummy.next = head;
  let fast = dummy;
  let slow = dummy;

  // Đi n+1 bước
  for (let i = 0; i <= n; i++) {
    fast = fast.next;
  }

  // Đi đến cuối
  while (fast) {
    fast = fast.next;
    slow = slow.next;
  }

  // Xóa
  slow.next = slow.next.next;

  return dummy.next;
}
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Remove Nth Node From End - Two Pointers
 * Time: O(n) | Space: O(1)
 */
function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0);
  dummy.next = head;
  let fast = dummy, slow = dummy;
  for (let i = 0; i <= n; i++) fast = fast.next;
  while (fast) { fast = fast.next; slow = slow.next; }
  slow.next = slow.next.next;
  return dummy.next;
}
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Two Pointers - Fast đi trước n+1 bước

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Remove Nth Node from End of List II (#82)
// Xóa node thứ n từ cuối, nhưng có thể xóa head
function removeNthFromEnd(head, n) {
  let dummy = new ListNode(0);
  dummy.next = head;
  let slow = dummy, fast = dummy;
  
  for (let i = 0; i <= n; i++) {
    fast = fast.next;
  }
  
  while (fast) {
    slow = slow.next;
    fast = fast.next;
  }
  
  slow.next = slow.next.next;
  return dummy.next;
}

// Variation 2: Delete Node in a Linked List (#237)
// Xóa 1 node (không phải cuối)
function deleteNode(node) {
  node.val = node.next.val;
  node.next = node.next.next;
}

// Variation 3: Remove Duplicates from Sorted List (#83)
// Xóa duplicates (giữ lại 1)
function deleteDuplicates(head) {
  let curr = head;
  while (curr && curr.next) {
    if (curr.val === curr.next.val) {
      curr.next = curr.next.next;
    } else {
      curr = curr.next;
    }
  }
  return head;
}

// Variation 4: Remove All Adjacent Duplicates (#1047)
// Xóa tất cả adjacent duplicates
function removeDuplicates(s) {
  let stack = [];
  for (const char of s) {
    if (stack.length && stack[stack.length-1] === char) {
      stack.pop();
    } else {
      stack.push(char);
    }
  }
  return stack.join('');
}

// Variation 5: Delete N Nodes After M (#1474)
// Xóa n nodes sau m nodes
```

---

## ➡️ Bài tiếp theo

[Bài 5: Maximum Depth of Binary Tree](./005-maximum-depth.md)
