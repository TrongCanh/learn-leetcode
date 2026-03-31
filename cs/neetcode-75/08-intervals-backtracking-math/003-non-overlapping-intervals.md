# #435 - Non-overlapping Intervals

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Array, Intervals, Greedy |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/non-overlapping-intervals/

---

## 📖 Đề bài

### Mô tả
Cho một mảng intervals. Trả về **số intervals cần xóa** để tất cả intervals còn lại **không chồng chéo** nhau.

### Ví dụ

**Example 1:**
```
Input:  [[1,2],[2,3],[3,4],[1,3]]
Output: 1
Giải thích: Xóa [1,3] → còn [[1,2],[2,3],[3,4]] (không overlap)
```

**Example 2:**
```
Input:  [[1,2],[1,2],[1,2]]
Output: 2
Giải thích: Xóa 2 intervals trong 3 intervals trùng nhau
```

### Constraints
```
1 <= intervals.length <= 10^5
intervals[i].length == 2
-5 * 10^4 <= start_i < end_i <= 5 * 10^4
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Xóa tối thiểu bao nhiêu intervals để không overlap?
Tương tự: Merge Intervals, nhưng đếm số bị xóa thay vì merge
→ Sort → Greedy → đếm removals
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Sort theo end

```
→ Vì sao sort theo end?
→ "Greedy: giữ interval có end NHỎ NHẤT"
→ Để có nhiều không gian cho các intervals sau
```

---

#### Bước 2: Greedy approach

> **Aha moment:**
> **Sort theo end → đi từ trái sang phải**
>
> ```
> Nếu curr.start < prevEnd → OVERLAP!
> → Xóa curr (vì curr có end lớn hơn) → count++
>
> Nếu curr.start >= prevEnd → không overlap
> → Giữ curr → update prevEnd
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Sort THEO END (không phải start!)"              │
│   → Greedy: luôn giữ interval có end nhỏ nhất     │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Khi overlap: xóa interval có end LỚN HƠN"     │
│   → Xóa curr (vì đã sort theo end)               │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Số cần xóa = total - max non-overlapping"      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Sort theo start thay vì end
// ❌ intervals.sort((a,b) => a[0] - b[0]);
// ✅ intervals.sort((a,b) => a[1] - b[1]);

// ❌ Pitfall 2: Xóa prev thay vì curr khi overlap
// Vì sort theo end, curr.end >= prev.end
// → Xóa curr luôn là tối ưu (vì curr có end lớn hơn)
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Greedy Sort by End (O(n log n)) ⭐

```javascript
function eraseOverlapIntervals(intervals) {
  if (intervals.length === 0) return 0;

  // Sort theo end (tăng dần)
  intervals.sort((a, b) => a[1] - b[1]);

  let end = intervals[0][1];
  let count = 0;

  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] < end) {
      // Overlap → xóa interval hiện tại
      count++;
    } else {
      // Không overlap → update end
      end = intervals[i][1];
    }
  }

  return count;
}
```

**📊 Phân tích:**
```
Time:  O(n log n) — sorting
Space: O(1) — không dùng thêm space (sort in-place)
```

---

### 🚀 6. Visual Walkthrough

```
intervals = [[1,2],[2,3],[3,4],[1,3]]

Sort by end: [[1,2],[2,3],[3,4],[1,3]]
            → end:   [2,   3,   4,   3]
            → sau sort: [[1,2],[2,3],[1,3],[3,4]]

end = 2, count = 0

i=1: [2,3], start=2, 2 < 2? NO → end=3, count=0
i=2: [1,3], start=1, 1 < 3? YES → count=1 (xóa [1,3])
i=3: [3,4], start=3, 3 < 3? NO → end=4, count=1

→ return 1 ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Non-overlapping Intervals - Greedy Sort by End
 * Time: O(n log n) | Space: O(1)
 */
function eraseOverlapIntervals(intervals) {
  if (intervals.length === 0) return 0;

  intervals.sort((a, b) => a[1] - b[1]);

  let end = intervals[0][1];
  let count = 0;

  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] < end) {
      count++;
    } else {
      end = intervals[i][1];
    }
  }

  return count;
}
```

---

## 🧪 Test Cases

```javascript
console.log(eraseOverlapIntervals([[1,2],[2,3],[3,4],[1,3]])); // 1

console.log(eraseOverlapIntervals([[1,2],[1,2],[1,2]])); // 2

console.log(eraseOverlapIntervals([[1,2],[2,3]])); // 0

console.log(eraseOverlapIntervals([[1,100],[2,3],[3,4],[4,5]])); // 2

console.log(eraseOverlapIntervals([])); // 0
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Greedy Interval Removal

💡 KEY INSIGHT:
   "Sort THEO END (không phải start!)"
   "Overlap: xóa interval có end lớn hơn (curr)"

⚠️ PITFALLS:
   - Sort bằng end, không phải start

✅ Đã hiểu
✅ Tự code lại được
```
