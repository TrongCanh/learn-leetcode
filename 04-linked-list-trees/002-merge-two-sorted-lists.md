# #21 - Merge Two Sorted Lists

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | Linked List |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/merge-two-sorted-lists/

---

## 📖 Đề bài

### Mô tả
Merge 2 sorted linked lists thành 1 sorted linked list mới.

### Ví dụ

**Example 1:**
```
Input:  l1 = [1,2,4], l2 = [1,3,4]
Output: [1,1,2,3,4,4]
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Merge 2 sorted lists thành 1 sorted
→ Two-pointer trên linked list
→ Dùng dummy node để đơn giản hóa
```

---

### 🤔 2. Tư duy từng bước

> **Aha moment:**
> ```
> Dummy node: tạo node giả để track head
> curr = dummy
>
> while l1 && l2:
>   if l1.val <= l2.val:
>     curr.next = l1; l1 = l1.next
>   else:
>     curr.next = l2; l2 = l2.next
>   curr = curr.next
>
> curr.next = l1 || l2 (phần còn lại)
> return dummy.next
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Dummy node = đơn giản hóa head tracking"       │
│   → Không cần check head rỗng đặc biệt          │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "curr = dummy → luôn attach vào tail"           │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "curr.next = l1 || l2 (phần còn lại)"           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Không dùng dummy → phải check đặc biệt cho head
// ✅ Dùng dummy → code sạch hơn

// ❌ Pitfall 2: Không attach phần còn lại
// → while loop kết thúc, quên curr.next = l1 || l2
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Iterative (O(n), O(1)) ⭐

```javascript
function mergeTwoLists(l1, l2) {
  const dummy = new ListNode(0);
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

  curr.next = l1 || l2;
  return dummy.next;
}
```

---

### 🚀 6. Visual Walkthrough

```
l1: 1 → 2 → 4
l2: 1 → 3 → 4

dummy → (0)
curr = dummy

1 vs 1: <= → curr.next = l1(1) → l1=2
  dummy → 1
curr = 1

2 vs 1: > → curr.next = l2(1) → l2=3
  dummy → 1 → 1
curr = 1

2 vs 3: <= → curr.next = l1(2) → l1=4
  dummy → 1 → 1 → 2
curr = 2

4 vs 3: > → curr.next = l2(3) → l2=4
  dummy → 1 → 1 → 2 → 3
curr = 3

4 vs 4: <= → curr.next = l1(4) → l1=null
  dummy → 1 → 1 → 2 → 3 → 4
curr = 4

l1=null, l2=4 → curr.next = l2
  dummy → 1 → 1 → 2 → 3 → 4 → 4 ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Merge Two Sorted Lists - Dummy Node
 * Time: O(n) | Space: O(1)
 */
function mergeTwoLists(l1, l2) {
  const dummy = new ListNode(0);
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
  curr.next = l1 || l2;
  return dummy.next;
}
```

---

## 🧪 Test Cases

```javascript
// [1,2,4] + [1,3,4] → [1,1,2,3,4,4]
// [] + [] → []
// [] + [0] → [0]
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Dummy Node + Two Pointers

💡 KEY INSIGHT:
   "Dummy = đơn giản hóa head"
   "curr = dummy → attach vào tail"
   "curr.next = l1 || l2"

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Merge K Sorted Lists (#23)
// Merge nhiều sorted lists
function mergeKLists(lists) {
  // Priority Queue (Min Heap)
  // Lấy node nhỏ nhất từ heap, add vào result
}

// Variation 2: Add Two Numbers (#2)
// Cộng 2 số dưới dạng linked list
function addTwoNumbers(l1, l2) {
  let dummy = new ListNode(0);
  let curr = dummy;
  let carry = 0;
  
  while (l1 || l2 || carry) {
    const sum = (l1?.val || 0) + (l2?.val || 0) + carry;
    carry = Math.floor(sum / 10);
    curr.next = new ListNode(sum % 10);
    l1 = l1?.next;
    l2 = l2?.next;
    curr = curr.next;
  }
  return dummy.next;
}

// Variation 3: Partition List (#86)
// Chia list thành 2 phần: < x và >= x
function partition(head, x) {
  let before = new ListNode(0); // nodes < x
  let after = new ListNode(0);  // nodes >= x
  let beforeCurr = before, afterCurr = after;
  
  while (head) {
    if (head.val < x) {
      beforeCurr.next = head;
      beforeCurr = beforeCurr.next;
    } else {
      afterCurr.next = head;
      afterCurr = afterCurr.next;
    }
    head = head.next;
  }
  beforeCurr.next = after.next;
  return before.next;
}

// Variation 4: Sort List (#148)
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

// Variation 5: Reorder List (#143)
// Tạo list mới theo thứ tự: 1, n, 2, n-1, ...
```

---

## ➡️ Bài tiếp theo

[Bài 3: Reorder List](./003-reorder-list.md)
