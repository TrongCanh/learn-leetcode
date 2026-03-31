# #206 - Reverse Linked List

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | Linked List |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/reverse-linked-list/

---

## 📖 Đề bài

### Mô tả
Đảo ngược một singly linked list và trả về head mới.

### Ví dụ

**Example 1:**
```
Input:  1 → 2 → 3 → 4 → 5
Output: 5 → 4 → 3 → 2 → 1
```

**Example 2:**
```
Input:  1 → 2
Output: 2 → 1
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Đảo ngược linked list
Mô hình: Pointer manipulation
→ prev → curr → next (đảo next pointer)
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Pointer swapping

> **Aha moment:**
> ```
> prev = null (ban đầu)
> curr = head
>
> while curr:
>   next = curr.next   ← Save next trước
>   curr.next = prev   ← Đảo pointer
>   prev = curr         ← prev tiến
>   curr = next         ← curr tiến
>
> return prev (là head mới)
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "3 pointers: prev, curr, next"                  │
│   → Lưu next TRƯỚC khi đảo                      │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "prev = null ban đầu"                           │
│   → Tail cũ trỏ về null                          │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Recursive: đệ quy đến cuối rồi đảo ngược"    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Không save next trước khi đảo
curr.next = prev;
curr = curr.next; // ❌ curr đã bị đảo rồi!
curr = next; // ✅

// ❌ Pitfall 2: Không khởi tạo prev = null
let prev = head; // ❌ prev ban đầu không phải null
let prev = null; // ✅
```

---

### 🔄 5. Các hướng tiếp cận

#### 🔹 Cách 1: Iterative (O(n), O(1)) ⭐

```javascript
function reverseList(head) {
  let prev = null;
  let curr = head;

  while (curr) {
    const next = curr.next; // Save next
    curr.next = prev;      // Reverse
    prev = curr;           // Move prev
    curr = next;           // Move curr
  }

  return prev; // prev là head mới
}
```

---

#### 🔹 Cách 2: Recursive (O(n), O(n) stack)

```javascript
function reverseList(head) {
  if (!head || !head.next) return head;

  const newHead = reverseList(head.next);
  head.next.next = head;
  head.next = null;

  return newHead;
}
```

---

### 🚀 6. Visual Walkthrough

```
1 → 2 → 3 → null

Step 1:
  prev=null, curr=1
  next = 2
  1→null
  prev=1, curr=2

Step 2:
  next = 3
  2→1→null
  prev=2, curr=3

Step 3:
  next = null
  3→2→1→null
  prev=3, curr=null

→ return 3 (head mới) ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Reverse Linked List - Iterative
 * Time: O(n) | Space: O(1)
 */
function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}
```

---

## 🧪 Test Cases

```javascript
// [1,2,3,4,5] → [5,4,3,2,1]
// [1,2] → [2,1]
// [] → []
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Pointer Reversal

💡 KEY INSIGHT:
   "prev=null, curr=head"
   "next=save, curr.next=prev, prev=curr, curr=next"
   "return prev"

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Reverse Linked List II (#92)
// Đảo ngược từ vị trí m đến n
function reverseBetween(head, m, n) {
  // Bước 1: Tìm node trước m
  // Bước 2: Đảo ngược từ m đến n
  // Bước 3: Nối lại
}

// Variation 2: Palindrome Linked List (#234)
// Kiểm tra linked list có phải palindrome không
function isPalindrome(head) {
  // Bước 1: Tìm middle (slow-fast)
  // Bước 2: Reverse second half
  // Bước 3: So sánh 2 halves
}

// Variation 3: Swap Nodes in Pairs (#24)
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

// Variation 4: Reverse Nodes in K-Group (#25)
// Đảo ngược mỗi k nodes
function reverseKGroup(head, k) {
  // Dùng dummy node + recursion
}

// Variation 5: Add Two Numbers (#2)
// Cộng 2 linked lists (số ngược)
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

// Variation 6: Copy List with Random Pointer (#138)
// Deep copy linked list với random pointer
```

---

## ➡️ Bài tiếp theo

[Bài 2: Merge Two Sorted Lists](./002-merge-two-sorted-lists.md)
