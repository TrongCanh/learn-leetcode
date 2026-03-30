# #703 - Kth Largest Element in Stream

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | Heap, Design |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/kth-largest-element-in-a-stream/

---

## 📖 Đề bài

### Mô tả
Thiết kế một class `KthLargest` với:
- `KthLargest(k, nums)` — khởi tạo với stream `nums`
- `add(val)` — thêm giá trị mới, trả về k-th largest

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: K-th largest trong stream
→ Min Heap size k → top = k-th largest
→ Khi thêm val > heap[0]: replace top
```

---

### 🤔 2. Tư duy từng bước

> **Aha moment:**
> ```
> Min Heap size k:
>   - Nếu heap.length < k: push
>   - Nếu val > heap[0]: pop heap[0], push val
>   - Return heap[0]
>
> → Top của min heap = k-th largest!
> ```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Min Heap (O(n log k), O(k)) ⭐

```javascript
class KthLargest {
  constructor(k, nums) {
    this.k = k;
    this.heap = [];
    for (const num of nums) {
      this.add(num);
    }
  }

  add(val) {
    if (this.heap.length < this.k) {
      this.heap.push(val);
      this.heap.sort((a, b) => a - b);
    } else if (val > this.heap[0]) {
      this.heap.shift();
      this.heap.push(val);
      this.heap.sort((a, b) => a - b);
    }
    return this.heap[0];
  }
}
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Kth Largest Element in Stream - Min Heap
 */
class KthLargest {
  constructor(k, nums) {
    this.k = k;
    this.heap = [];
    for (const num of nums) this.add(num);
  }
  add(val) {
    if (this.heap.length < this.k) {
      this.heap.push(val);
      this.heap.sort((a, b) => a - b);
    } else if (val > this.heap[0]) {
      this.heap.shift();
      this.heap.push(val);
      this.heap.sort((a, b) => a - b);
    }
    return this.heap[0];
  }
}
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Min Heap cho K-th Largest

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Kth Largest Element in Array (#215)
// Tìm kth largest trong array (đã sort)
function findKthLargest(nums, k) {
  nums.sort((a, b) => b - a);
  return nums[k - 1];
}

// Variation 2: Find Median from Data Stream (#295)
// Median = kth largest với k = n/2
class MedianFinder {
  constructor() {
    this.small = []; // Max heap
    this.large = [];  // Min heap
  }
  
  addNum(num) {
    if (!this.large.length || num <= -this.large[0]) {
      this.large.push(-num);
    } else {
      this.small.push(num);
    }
    this.rebalance();
  }
  
  rebalance() {
    if (this.large.length > this.small.length + 1) {
      this.small.push(-this.large.shift());
    } else if (this.small.length > this.large.length) {
      this.large.push(-this.small.shift());
    }
  }
  
  findMedian() {
    if (this.large.length > this.small.length) {
      return -this.large[0];
    }
    return (-this.large[0] + this.small[0]) / 2;
  }
}

// Variation 3: Sliding Window Median (#480)
// Median trong sliding window
function medianSlidingWindow(nums, k) {
  // Dùng 2 heaps
}

// Variation 4: Top K Frequent Words (#692)
// Top K words theo frequency
function topKFrequent(words, k) {
  const freq = new Map();
  for (const word of words) {
    freq.set(word, (freq.get(word) || 0) + 1);
  }
  
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, k)
    .map(([word]) => word);
}

// Variation 5: Find K Pairs with Smallest Sums (#373)
// Tìm k pairs có sum nhỏ nhất
```

---

## ➡️ Bài tiếp theo

[Bài 4: Top K Frequent Elements](./004-top-k-frequent.md)
