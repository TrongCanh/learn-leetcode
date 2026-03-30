# #347 - Top K Frequent Elements

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Array, Hash Table, Sorting, Heap |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/top-k-frequent-elements/

---

## 📖 Đề bài

Cho một mảng `nums` và số `k`, trả về `k` phần tử xuất hiện **nhiều nhất**.

### Ví dụ

```
Input:  nums = [1,1,1,2,2,3], k = 2
Output: [1, 2]
Giải thích: 1 xuất hiện 3 lần, 2 xuất hiện 2 lần
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài

```
Hỏi: Tìm k phần tử xuất hiện nhiều nhất
Trả về: Array of k elements (thứ tự không quan trọng)
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Phân tích bài toán

```
1. Đếm tần suất của mỗi phần tử
2. Tìm k phần tử có tần suất cao nhất
```

---

#### Bước 2: "Aha moment!"

> **Aha moment:**
> "Frequency ≤ n (độ dài mảng)"
> "→ Có thể dùng **BUCKET SORT** với index = frequency!"
>
> "Bucket[i] chứa các số xuất hiện i lần"

```
nums = [1,1,1,2,2,3], n=6

Frequency:
  1 → 3 lần
  2 → 2 lần
  3 → 1 lần

Buckets (index = frequency):
  bucket[1] = [3]      (3 xuất hiện 1 lần)
  bucket[2] = [2]      (2 xuất hiện 2 lần)
  bucket[3] = [1]      (1 xuất hiện 3 lần)

→ Duyệt từ cuối (frequency cao → thấp) → lấy k phần tử
```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Frequency ≤ n" → Bucket Sort = O(n)            │
│   → bucket[frequency] = [elements]                │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Duyệt từ frequency CAO → THẤP"                │
│   → Đảm bảo top K elements                       │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Đếm tần suất = Hash Map"                      │
│   → Map<value, frequency>                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Bucket array size sai
// Bucket cần size = n + 1 (frequency từ 1 đến n)
const buckets = new Array(n).fill(null); // ❌ Sai! n-1 = last index
const buckets = new Array(n + 1).fill(null); // ✅ Đúng

// ❌ Pitfall 2: Quên check empty bucket
for (let i = n; i >= 0 && result.length < k; i--) {
  if (buckets[i]) {  // ✅ Check null/undefined
    result.push(...buckets[i]);
  }
}

// ❌ Pitfall 3: Dùng sort không cần thiết
// Bucket sort O(n) thay vì sort O(n log n)
```

---

### 🔄 5. Các hướng tiếp cận

#### 🔹 Cách 1: Hash Map + Sort (O(n log n))

```javascript
function topKFrequent(nums, k) {
  // 1. Đếm tần suất
  const freq = new Map();
  for (const num of nums) {
    freq.set(num, (freq.get(num) || 0) + 1);
  }

  // 2. Sort theo frequency
  const sorted = [...freq.entries()]
    .sort((a, b) => b[1] - a[1]);

  // 3. Lấy k phần tử đầu
  return sorted.slice(0, k).map(([num]) => num);
}
```

**📊 Phân tích:**
```
Time:  O(n log n) — sort entries
Space: O(n)
```

---

#### 🔹 Cách 2: Bucket Sort (O(n)) ⭐ **TỐI ƯU**

```javascript
function topKFrequent(nums, k) {
  // 1. Đếm tần suất
  const freq = new Map();
  for (const num of nums) {
    freq.set(num, (freq.get(num) || 0) + 1);
  }

  // 2. Tạo buckets
  // bucket[i] = các số xuất hiện i lần
  const buckets = new Array(nums.length + 1).fill(null).map(() => []);
  for (const [num, count] of freq) {
    buckets[count].push(num);
  }

  // 3. Duyệt từ cuối (frequency cao → thấp)
  const result = [];
  for (let i = buckets.length - 1; i > 0 && result.length < k; i--) {
    if (buckets[i]) {
      result.push(...buckets[i]);
    }
  }

  return result;
}
```

**📊 Phân tích:**
```
Time:  O(n) — count + bucket
Space: O(n)
```

---

### 🚀 6. Visual Walkthrough

```
nums = [1,1,1,2,2,3], k = 2, n = 6

Step 1: Count frequency
  freq = {1: 3, 2: 2, 3: 1}

Step 2: Create buckets
  bucket[1] = [3]      // 3 xuất hiện 1 lần
  bucket[2] = [2]      // 2 xuất hiện 2 lần
  bucket[3] = [1]      // 1 xuất hiện 3 lần

Step 3: Duyệt từ frequency cao → thấp
  i=6: bucket[6] = null → skip
  i=5: bucket[5] = null → skip
  i=4: bucket[4] = null → skip
  i=3: bucket[3] = [1] → result = [1]  ✓
  i=2: bucket[2] = [2] → result = [1, 2]  ✓ k=2 → STOP

→ Kết quả: [1, 2]
```

---

### 🎯 7. Biến thể

```javascript
// Variation: Heap approach
// → Tốt khi k nhỏ hơn nhiều
// → O(n log k) thay vì O(n)
function topKFrequentHeap(nums, k) {
  const freq = new Map();
  for (const num of nums) {
    freq.set(num, (freq.get(num) || 0) + 1);
  }

  // Min heap giữ k phần tử lớn nhất
  const heap = new MinHeap((a, b) => freq.get(a) - freq.get(b));
  for (const num of freq.keys()) {
    heap.insert(num);
    if (heap.size() > k) heap.extractMin();
  }

  return heap.getAll().map(x => x);
}
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Top K Frequent Elements - Bucket Sort
 * Time: O(n) | Space: O(n)
 */
var topKFrequent = function(nums, k) {
  const freq = new Map();
  for (const num of nums) {
    freq.set(num, (freq.get(num) || 0) + 1);
  }

  const buckets = new Array(nums.length + 1).fill(null).map(() => []);
  for (const [num, count] of freq) {
    buckets[count].push(num);
  }

  const result = [];
  for (let i = buckets.length - 1; i > 0 && result.length < k; i--) {
    if (buckets[i]) {
      result.push(...buckets[i]);
    }
  }

  return result;
};
```

---

## 🧪 Test Cases

```javascript
console.log(topKFrequent([1,1,1,2,2,3], 2)); // [1, 2]
console.log(topKFrequent([1], 1)); // [1]
console.log(topKFrequent([1,1,1,1], 1)); // [1]
```

---

## 📝 Ghi chú

```
PATTERN: Bucket Sort với frequency làm index

💡 KEY INSIGHT:
   "Frequency ≤ n → bucket[frequency]"

⚠️ PITFALLS:
   - Bucket size = n + 1
   - Check empty bucket trước khi push

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Bài tiếp theo

[Bài 6: Product of Array Except Self](./006-product-of-array-except-self.md)
