# #295 - Find Median from Data Stream

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Heap, Design |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/find-median-from-data-stream/

---

## 📖 Đề bài

### Mô tả
Thiết kế một class `MedianFinder`:
- `addNum(num)` — thêm số vào stream
- `findMedian()` — trả về median

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Median trong stream
→ 2 Heaps: max-heap (lower half) + min-heap (upper half)
→ Median = top của heaps kết hợp
```

---

### 🤔 2. Tư duy từng bước

> **Aha moment:**
> ```
> 2 Heaps:
>   small: max-heap (lower half) → -val để simulate
>   large: min-heap (upper half)
>
> Invariant: |small| == |large| hoặc |small| = |large| + 1
>
> Median:
>   Nếu |small| > |large|: return -small[0]
>   Ngược lại: return (-small[0] + large[0]) / 2
> ```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Two Heaps (O(log n), O(n)) ⭐

```javascript
class MedianFinder {
  constructor() {
    this.small = []; // Max heap (lower half)
    this.large = []; // Min heap (upper half)
  }

  addNum(num) {
    // Max heap: push -num
    this.small.push(-num);
    this.small.sort((a, b) => a - b);

    // Move max from small to large
    this.large.push(-this.small.shift());
    this.large.sort((a, b) => a - b);

    // Balance: small có thể nhiều hơn large 1 element
    if (this.small.length > this.large.length) {
      this.small.push(-this.large.shift());
      this.small.sort((a, b) => a - b);
    }
  }

  findMedian() {
    if (this.small.length > this.large.length) {
      return -this.small[0];
    }
    return (-this.small[0] + this.large[0]) / 2;
  }
}
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Find Median from Data Stream - Two Heaps
 */
class MedianFinder {
  constructor() {
    this.small = [];
    this.large = [];
  }
  addNum(num) {
    this.small.push(-num);
    this.small.sort((a, b) => a - b);
    this.large.push(-this.small.shift());
    this.large.sort((a, b) => a - b);
    if (this.small.length > this.large.length) {
      this.small.push(-this.large.shift());
      this.small.sort((a, b) => a - b);
    }
  }
  findMedian() {
    if (this.small.length > this.large.length) return -this.small[0];
    return (-this.small[0] + this.large[0]) / 2;
  }
}
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Two Heaps cho Median

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Sliding Window Median (#480)
// Median trong sliding window
function medianSlidingWindow(nums, k) {
  const result = [];
  const balance = new Map();
  let odd = k % 2 === 1;
  let median = 0;
  
  for (let i = 0; i < nums.length; i++) {
    // Add nums[i]
    balance.set(nums[i], (balance.get(nums[i]) || 0) + 1);
    
    // Remove if window size > k
    if (i >= k) {
      balance.set(nums[i - k], balance.get(nums[i - k]) - 1);
    }
    
    // Calculate median
    if (i >= k - 1) {
      let count = 0;
      let left = null, right = null;
      for (const [num, freq] of balance) {
        count += freq;
        if (!left && count >= (k + 1) / 2) left = num;
        if (!right && count >= (k + 2) / 2) right = num;
      }
      median = odd ? left : (left + right) / 2;
      result.push(median);
    }
  }
  return result;
}

// Variation 2: Data Stream from Disk
// Median từ dữ liệu lớn trên disk

// Variation 3: Running Median using BST
// Dùng BST thay vì 2 heaps
class MedianFinderBST {
  constructor() {
    this.bst = new Map(); // value -> count
    this.size = 0;
  }
  
  addNum(num) {
    this.bst.set(num, (this.bst.get(num) || 0) + 1);
    this.size++;
  }
  
  findMedian() {
    let count = 0;
    let median = 0;
    let mid1 = Math.floor((this.size + 1) / 2);
    let mid2 = Math.floor((this.size + 2) / 2);
    
    for (const [num, freq] of this.bst) {
      count += freq;
      if (count >= mid1 && median === 0) median = num;
      if (count >= mid2) {
        return (median + num) / 2;
      }
    }
    return median;
  }
}

// Variation 4: Continuous Median with Deletion
// Median hỗ trợ xóa

// Variation 5: Mode of Data Stream
// Tìm mode (giá trị xuất hiện nhiều nhất)
```

---

## ➡️ Bài tiếp theo

[Bài 6: Merge K Sorted Lists](./006-merge-k-sorted.md)
