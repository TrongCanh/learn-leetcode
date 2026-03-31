# #143 - Reorder List

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Linked List |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/reorder-list/

---

## 📖 Đề bài

### Mô tả
Cho một linked list: L₀→L₁→...→Lₙ₋₁. Reorder thành: L₀→Lₙ₋₁→L₁→Lₙ₋₂→...

### Ví dụ

**Example 1:**
```
Input:  1 → 2 → 3 → 4 → 5
Output: 1 → 5 → 2 → 4 → 3
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Reorder thành alternating first-last
→ 3 steps: Find middle → Reverse second half → Merge
```

---

### 🤔 2. Tư duy từng bước

> **Aha moment:**
> ```
> Step 1: Slow-fast pointer → tìm middle
> Step 2: Reverse second half (từ middle trở đi)
> Step 3: Merge first half + reversed second half
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "3 steps: mid → reverse → merge"                │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Slow-Fast: slow đến middle"                     │
│   → fast=null → slow=mid                          │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "L₀→L₁→...→Lₘ→Lₘ₊₁→...→Lₙ₋₁"                 │
│   → Trở thành: L₀,Lₙ₋₁,L₁,Lₙ₋₂,..."            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: 3 Steps (O(n), O(1)) ⭐

```javascript
function reorderList(head) {
  // Step 1: Find middle
  let slow = head, fast = head;
  while (fast.next && fast.next.next) {
    slow = slow.next;
    fast = fast.next.next;
  }

  // Step 2: Reverse second half
  let prev = null, curr = slow.next;
  slow.next = null; // Tách đôi list
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }

  // Step 3: Merge two halves
  let first = head, second = prev;
  while (second) {
    const temp1 = first.next;
    const temp2 = second.next;
    first.next = second;
    second.next = temp1;
    first = temp1;
    second = temp2;
  }
}
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Reorder List - 3 Steps
 * Time: O(n) | Space: O(1)
 */
function reorderList(head) {
  let slow = head, fast = head;
  while (fast.next && fast.next.next) {
    slow = slow.next;
    fast = fast.next.next;
  }

  let prev = null, curr = slow.next;
  slow.next = null;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }

  let first = head, second = prev;
  while (second) {
    const t1 = first.next;
    const t2 = second.next;
    first.next = second;
    second.next = t1;
    first = t1;
    second = t2;
  }
}
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: 3 Steps (Mid → Reverse → Merge)

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Reverse Linked List II (#92)
// Đảo ngược từ vị trí left đến right
function reverseBetween(head, left, right) {
  let dummy = new ListNode(0);
  dummy.next = head;
  let prev = dummy;
  
  // Di chuyển đến node trước left
  for (let i = 1; i < left; i++) {
    prev = prev.next;
  }
  
  // Đảo ngược đoạn left → right
  let curr = prev.next;
  for (let i = 0; i < right - left; i++) {
    const next = curr.next;
    curr.next = next.next;
    next.next = prev.next;
    prev.next = next;
  }
  
  return dummy.next;
}

// Variation 2: Swap Nodes in Pairs (#24)
// Đổi chỗ 2 nodes liền kề
function swapPairs(head) {
  let dummy = new ListNode(0);
  dummy.next = head;
  let prev = dummy;
  
  while (prev.next && prev.next.next) {
    let first = prev.next;
    let second = prev.next.next;
    
    prev.next = second;
    first.next = second.next;
    second.next = first;
    prev = first;
  }
  return dummy.next;
}

// Variation 3: Reverse Nodes in K-Group (#25)
// Đảo ngược mỗi k nodes
function reverseKGroup(head, k) {
  let count = 0;
  let node = head;
  while (node && count < k) {
    node = node.next;
    count++;
  }
  
  if (count < k) return head;
  
  let prev = null;
  let curr = head;
  for (let i = 0; i < k; i++) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  
  head.next = reverseKGroup(curr, k);
  return prev;
}

// Variation 4: Rotate List (#61)
// Xoay list sang phải k vị trí
function rotateRight(head, k) {
  if (!head || !head.next || k === 0) return head;
  
  let len = 1;
  let tail = head;
  while (tail.next) {
    tail = tail.next;
    len++;
  }
  
  k = k % len;
  if (k === 0) return head;
  
  let newTail = head;
  for (let i = 1; i < len - k; i++) {
    newTail = newTail.next;
  }
  
  tail.next = head;
  head = newTail.next;
  newTail.next = null;
  
  return head;
}

// Variation 5: Flatten Nested List Iterator (#341)
// Làm phẳng nested linked list
```

---

## ➡️ Bài tiếp theo

[Bài 4: Remove Nth Node From End](./004-remove-nth-node.md)
