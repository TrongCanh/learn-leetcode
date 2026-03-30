# #57 - Insert Interval

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Array, Intervals |
| **Trạng thích** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/insert-interval/

---

## 📖 Đề bài

### Mô tả
Cho một danh sách **non-overlapping** intervals được sắp xếp theo `start`, và một interval mới. Chèn interval mới vào và **merge** các intervals chồng chéo.

### Ví dụ

**Example 1:**
```
Input:  intervals = [[1,3],[6,9]], newInterval = [2,5]
Output: [[1,5],[6,9]]
```

**Example 2:**
```
Input:  intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]
Output: [[1,2],[4,10],[12,16]]
```

### Constraints
```
intervals.length >= 0
0 <= start_i <= end_i <= 10^5
newInterval.length == 2
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giấy)

```
Hỏi: Chèn và merge intervals
Đặc biệt: intervals đã sorted theo start
→ Có thể dùng 3-pass approach
```

### 🤔 2. Tư duy từng bước

**Aha moment:**
```
3 khu vực: before | overlap | after
→ Result = before + merged + after
```

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│ KEY INSIGHT #1:                                   │
│ "3 khu vực: before | overlap | after"            │
│                                                     │
│ KEY INSIGHT #2:                                   │
│ "Merge = lấy min start, max end"                 │
│                                                     │
│ KEY INSIGHT #3:                                   │
│ "Sorted intervals → chỉ duyệt 1 lần"            │
└─────────────────────────────────────────────────────┘
```

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Overlap: intervals[i][1] >= new[0]
// ✅ Overlap: intervals[i][0] <= new[1]
```

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: 3-Pass (O(n)) ⭐

```javascript
function insert(intervals, newInterval) {
  const result = [];
  let i = 0;

  while (i < intervals.length && intervals[i][1] < newInterval[0]) {
    result.push(intervals[i++]);
  }

  while (i < intervals.length && intervals[i][0] <= newInterval[1]) {
    newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
    newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
    i++;
  }
  result.push(newInterval);

  while (i < intervals.length) {
    result.push(intervals[i++]);
  }

  return result;
}
```

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Insert Interval into Sorted List
// Chèn vào sorted linked list của intervals

// Variation 2: Range Module (#715)
// Track intervals với add/remove/query

// Variation 3: My Calendar I/II/III (#731, #732, #732)
// Đặt lịch không conflict

// Variation 4: Merge Sorted Array
// Merge 2 sorted arrays

// Variation 5: Employee Free Time (#759)
// Tìm free time của employees
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Insert Interval - 3-Pass
 * Time: O(n) | Space: O(n)
 */
function insert(intervals, newInterval) {
  const result = [];
  let i = 0;

  while (i < intervals.length && intervals[i][1] < newInterval[0]) {
    result.push(intervals[i++]);
  }

  while (i < intervals.length && intervals[i][0] <= newInterval[1]) {
    newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
    newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
    i++;
  }
  result.push(newInterval);

  while (i < intervals.length) {
    result.push(intervals[i++]);
  }

  return result;
}
```

---

## 🧪 Test Cases

```javascript
console.log(insert([[1,3],[6,9]], [2,5])); // [[1,5],[6,9]]
console.log(insert([[1,2],[3,5],[6,7],[8,10],[12,16]], [4,8])); // [[1,2],[4,10],[12,16]]
console.log(insert([], [5,7])); // [[5,7]]
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Interval Insert + Merge

💡 KEY INSIGHT:
   "3 khu vực: before | merge | after"
   "Merge: min start, max end"

✅ Đã hiểu
✅ Tự code lại được
```
