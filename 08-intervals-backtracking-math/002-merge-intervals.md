# #56 - Merge Intervals

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Array, Intervals, Sorting |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/merge-intervals/

---

## 📖 Đề bài

### Mô tả
Cho một mảng intervals `[[start1, end1], [start2, end2], ...]`. Merge tất cả các overlapping intervals và trả về danh sách các **non-overlapping** intervals.

### Ví dụ

**Example 1:**
```
Input:  [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]
Giải thích: [1,3] và [2,6] chồng chéo → merge thành [1,6]
```

**Example 2:**
```
Input:  [[1,4],[4,5]]
Output: [[1,5]]
Giải thích: [1,4] và [4,5] touch → merge thành [1,5]
```

### Constraints
```
1 <= intervals.length <= 10^4
intervals[i].length == 2
0 <= start <= end <= 10^4
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Merge overlapping intervals
Input: có thể unsorted
→ BƯỚC QUAN TRỌNG: Sort theo start
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Sort trước

```
Input unsorted: [[1,3],[2,6],[8,10],[15,18]]
Sau sort:      [[1,3],[2,6],[8,10],[15,18]] (đã sorted theo start)
```

---

#### Bước 2: Merge đơn giản

> **Aha moment:**
> ```
> Sort → chỉ cần so sánh với interval TRƯỚC ĐÓ!
>
> merged[-1] = [1,3]
> current = [2,6]
> → 2 <= 6 (current.start <= mergedEnd) → OVERLAP!
> → merged[-1] = [min(1,2), max(3,6)] = [1,6]
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "SORT TRƯỚC → chỉ cần so sánh với prev"         │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Overlap: curr.start <= mergedEnd"               │
│   → curr.start < prevEnd (strict) hoặc <= (touch) │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Merge = min start, max end"                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Không sort trước
// Không sort → thuật toán sai hoặc phức tạp
// ✅ Luôn sort intervals trước

// ❌ Pitfall 2: So sánh overlap sai
// ❌ if (curr.start < prev.end) // strict < bỏ qua touch case
// ✅ if (curr.start <= prev.end) // <= bao gồm touch (edge)
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Sort + Merge (O(n log n)) ⭐

```javascript
function merge(intervals) {
  if (intervals.length <= 1) return intervals;

  // 1. Sort theo start
  intervals.sort((a, b) => a[0] - b[0]);

  // 2. Merge
  const result = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const curr = intervals[i];
    const last = result[result.length - 1];

    if (curr[0] <= last[1]) {
      // Overlap → merge
      last[1] = Math.max(last[1], curr[1]);
    } else {
      // Không overlap → push
      result.push(curr);
    }
  }

  return result;
}
```

**📊 Phân tích:**
```
Time:  O(n log n) — sorting
Space: O(n) — result array
```

---

### 🚀 6. Visual Walkthrough

```
Input: [[1,3],[2,6],[8,10],[15,18],[6,10]]

Sort: [[1,3],[2,6],[6,10],[8,10],[15,18]]

result = [[1,3]]

i=1: [2,6]
  2 <= 3 → overlap → [1,3] → [1, max(3,6)]=[1,6]

i=2: [6,10]
  6 <= 1 → FALSE! 6 > 1 → hmm...

  Wait: last = [1,6]
  6 <= 6 → overlap! → [1, max(6,10)]=[1,10]

i=3: [8,10]
  last = [1,10]
  8 <= 10 → overlap → [1,10]

i=4: [15,18]
  15 <= 10 → FALSE → push [15,18]

Result: [[1,10],[15,18]] ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Merge Intervals - Sort + Merge
 * Time: O(n log n) | Space: O(n)
 */
function merge(intervals) {
  if (intervals.length <= 1) return intervals;

  intervals.sort((a, b) => a[0] - b[0]);
  const result = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const curr = intervals[i];
    const last = result[result.length - 1];
    if (curr[0] <= last[1]) {
      last[1] = Math.max(last[1], curr[1]);
    } else {
      result.push(curr);
    }
  }

  return result;
}
```

---

## 🧪 Test Cases

```javascript
console.log(merge([[1,3],[2,6],[8,10],[15,18]])); // [[1,6],[8,10],[15,18]]

console.log(merge([[1,4],[4,5]])); // [[1,5]]

console.log(merge([[1,4],[0,4]])); // [[0,4]]

console.log(merge([[1,4],[2,3]])); // [[1,4]] (2-3 nằm trong 1-4)

console.log(merge([[1,4]])); // [[1,4]]
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Sort + Merge Intervals

💡 KEY INSIGHT:
   "Sort TRƯỚC → chỉ so sánh với prev"
   "Overlap: curr.start <= prev.end"
   "Merge: min start, max end"

✅ Đã hiểu
✅ Tự code lại được
```
