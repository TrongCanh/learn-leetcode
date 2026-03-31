# #252 - Meeting Rooms

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | Array, Intervals, Sorting |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/meeting-rooms/

---

## 📖 Đề bài

### Mô tả
Cho một mảng intervals `[[start, end], ...]`, kiểm tra xem một người có thể **tham dự tất cả các cuộc họp** không (mỗi cuộc họp cần 1 phòng riêng).

### Ví dụ

**Example 1:**
```
Input:  [[0,30],[5,10],[15,20]]
Output: false
Giải thích: [0,30] và [5,10] overlap → cần 2 phòng
```

**Example 2:**
```
Input:  [[7,10],[2,4]]
Output: true
Giải thích: [2,4] kết thúc TRƯỚC [7,10] bắt đầu
```

### Constraints
```
0 <= intervals.length <= 10^4
intervals[i].length == 2
0 <= start_i < end_i <= 10^5
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Có thể tham dự tất cả meetings không?
→ Cần check xem có 2 intervals overlap không
→ Nếu có bất kỳ overlap nào → false
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Sort theo start

> **Aha moment:**
> ```
> Sort theo start → chỉ cần so sánh với interval TRƯỚC ĐÓ
>
> Nếu curr.start < prevEnd → OVERLAP!
> → return false
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Sort theo start → so sánh với prev"             │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Overlap: curr.start < prev.end"                 │
│   (strict < vì curr.start == prev.end = không overlap)│
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Chỉ cần O(n log n) để sort"                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Dùng <= thay vì <
// intervals = [[0,10],[10,20]]
// start(10) <= end(10) = TRUE → sai! Đây không phải overlap
// ✅ Dùng < (strict)
if (intervals[i][0] < intervals[i-1][1]) return false;
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Sort + Check (O(n log n)) ⭐

```javascript
function canAttendMeetings(intervals) {
  if (intervals.length <= 1) return true;

  intervals.sort((a, b) => a[0] - b[0]);

  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] < intervals[i - 1][1]) {
      return false; // Overlap!
    }
  }

  return true;
}
```

**📊 Phân tích:**
```
Time:  O(n log n)
Space: O(1) — sort in-place
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Meeting Rooms - Sort + Check Overlap
 * Time: O(n log n) | Space: O(1)
 */
function canAttendMeetings(intervals) {
  if (intervals.length <= 1) return true;
  intervals.sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] < intervals[i - 1][1]) return false;
  }
  return true;
}
```

---

## 🧪 Test Cases

```javascript
console.log(canAttendMeetings([[0,30],[5,10],[15,20]])); // false

console.log(canAttendMeetings([[7,10],[2,4]])); // true

console.log(canAttendMeetings([[0,10],[10,20]])); // true (touch, không overlap)

console.log(canAttendMeetings([[1,5],[2,3]])); // false (2-3 nằm trong 1-5)

console.log(canAttendMeetings([])); // true
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Interval Overlap Check

💡 KEY INSIGHT:
   "Sort theo start → chỉ so sánh với prev"
   "Overlap: curr.start < prev.end (strict <)"

✅ Đã hiểu
✅ Tự code lại được
```
