# #347 - Top K Frequent Elements

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Heap, Hash Table |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/top-k-frequent-elements/

---

## 📖 Đề bài

### Mô tả
Cho một mảng, trả về **k phần tử có tần suất xuất hiện cao nhất**.

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: K elements có tần suất cao nhất
→ Count frequency → Sort by frequency → Top k
→ Bucket Sort: O(n)
```

---

### 🤔 2. Tư duy từng bước

> **Aha moment:**
> ```
> Bucket Sort:
>   frequency array (bucket): bucket[i] = elements có freq = i
>   Đếm ngược từ max → lấy k elements
> ```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Bucket Sort (O(n)) ⭐

```javascript
function topKFrequent(nums, k) {
  const freq = new Map();
  for (const num of nums) {
    freq.set(num, (freq.get(num) || 0) + 1);
  }

  const buckets = Array(nums.length + 1).fill(null).map(() => []);
  for (const [num, count] of freq) {
    buckets[count].push(num);
  }

  const result = [];
  for (let i = buckets.length - 1; i >= 0 && result.length < k; i--) {
    if (buckets[i].length > 0) {
      result.push(...buckets[i]);
    }
  }
  return result;
}
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Top K Frequent Elements - Bucket Sort
 */
function topKFrequent(nums, k) {
  const freq = new Map();
  for (const num of nums) freq.set(num, (freq.get(num) || 0) + 1);
  const buckets = Array(nums.length + 1).fill(null).map(() => []);
  for (const [num, count] of freq) buckets[count].push(num);
  const result = [];
  for (let i = buckets.length - 1; i >= 0 && result.length < k; i--) {
    if (buckets[i].length > 0) result.push(...buckets[i]);
  }
  return result;
}
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Bucket Sort cho Frequency

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Top K Frequent Words (#692)
// Top K words theo frequency
function topKFrequentWords(words, k) {
  const freq = new Map();
  for (const word of words) {
    freq.set(word, (freq.get(word) || 0) + 1);
  }
  
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, k)
    .map(([word]) => word);
}

// Variation 2: Sort Characters by Frequency (#451)
// Sắp xếp characters theo frequency
function frequencySort(s) {
  const freq = {};
  for (const char of s) {
    freq[char] = (freq[char] || 0) + 1;
  }
  
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([char, count]) => char.repeat(count))
    .join('');
}

// Variation 3: K Closest Points to Origin (#973)
// Tìm K points gần origin nhất
function kClosest(points, k) {
  return points
    .sort((a, b) => (a[0]**2 + a[1]**2) - (b[0]**2 + b[1]**2))
    .slice(0, k);
}

// Variation 4: Top K Largest Numbers in Stream
// Top K largest từ stream
function topKLargest(nums, k) {
  const heap = nums.slice(0, k);
  heap.sort((a, b) => a - b);
  
  for (let i = k; i < nums.length; i++) {
    if (nums[i] > heap[0]) {
      heap[0] = nums[i];
      heap.sort((a, b) => a - b);
    }
  }
  return heap;
}

// Variation 5: Least Number of Unique Integers (#1481)
// Số integers unique ít nhất sau khi loại bỏ k groups
function leastUniqueIntegers(nums, k) {
  const freq = {};
  for (const num of nums) freq[num] = (freq[num] || 0) + 1;
  
  const frequencies = Object.values(freq).sort((a, b) => a - b);
  let unique = frequencies.length;
  let remaining = k;
  
  for (let i = 0; i < frequencies.length && remaining > 0; i++) {
    if (frequencies[i] <= remaining) {
      remaining -= frequencies[i];
      unique--;
    } else {
      break;
    }
  }
  return unique;
}
```

---

## ➡️ Bài tiếp theo

[Bài 5: Find Median from Data Stream](./005-median-data-stream.md)
