# #253 - Meeting Rooms II

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Array, Intervals, Heap, Greedy |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/meeting-rooms-ii/

---

## 📖 Đề bài

### Mô tả
Cho một mảng intervals. Tìm **số phòng họp tối thiểu** cần thiết để tất cả meetings có thể diễn ra.

### Ví dụ

**Example 1:**
```
Input:  [[0,30],[5,10],[15,20]]
Output: 2
Giải thích:
  Room 1: [0,30]
  Room 2: [5,10] và [15,20] (không overlap)
```

**Example 2:**
```
Input:  [[7,10],[2,4],[6,8]]
Output: 2
Giải thích:
  Room 1: [2,4]
  Room 2: [7,10]
  [6,8] có thể dùng Room 1 sau khi [2,4] kết thúc
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
Hỏi: Cần bao nhiêu phòng họp tối thiểu?
→ Equivalent: Số overlap tối đa tại bất kỳ thời điểm nào
→ Approach: Min Heap lưu end times
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Nghĩ brute force

> **Hỏi:** "Làm sao track số phòng?"

```
Với mỗi interval, kiểm tra xem có phòng trống không?
→ Phòng trống = có end time <= start time của interval mới
→ Heap lưu end times → top = earliest end time
```

---

#### Bước 2: "Aha moment!" — Min Heap

> **Aha moment:**
> ```
> 1. Sort intervals theo start
> 2. Min Heap lưu end times của các phòng đang dùng
> 3. Với mỗi interval:
>    - Nếu earliest end <= curr.start → phòng trống → pop heap
>    - Push curr.end vào heap
> 4. Heap size = số phòng cần thiết
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Min Heap lưu end times"                         │
│   → top = phòng trống sớm nhất                     │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Earliest end <= curr.start → phòng trống"      │
│   → pop → push curr.end                            │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Heap size = số phòng đang dùng"                │
│   → max heap size = câu trả lời                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Không pop khi phòng trống
// Khi gặp interval mới, phải pop TẤT CẢ phòng có end <= start
// ❌ Chỉ pop 1 lần
// while (heap.length && heap[0] <= start) {
//   heap.shift(); // ❌ pop tất cả phòng trống
// }
// ✅ Có thể dùng while để pop nhiều phòng

// ❌ Pitfall 2: Dùng Array.sort() thay vì Heap
// Array.sort() cho min → O(n) per operation
// ✅ Dùng heap array với swap logic, hoặc dùng built-in sort + manual heap
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Sort + Min Heap (O(n log n)) ⭐

```javascript
function minMeetingRooms(intervals) {
  if (intervals.length === 0) return 0;

  // Sort theo start
  intervals.sort((a, b) => a[0] - b[0]);

  // Min Heap lưu end times
  const heap = [intervals[0][1]];

  for (let i = 1; i < intervals.length; i++) {
    const start = intervals[i][0];
    const end = intervals[i][1];

    // Phòng trống (earliest end <= start)?
    if (heap[0] <= start) {
      heap.shift(); // Pop phòng trống
    }

    heap.push(end);
    heap.sort((a, b) => a - b); // Sort lại để get min
  }

  return heap.length;
}
```

**📊 Phân tích:**
```
Time:  O(n log n) — sort + heap sort mỗi insertion
Space: O(n) — heap
```

---

### 🚀 6. Visual Walkthrough

```
intervals = [[0,30],[5,10],[15,20]]

Sort by start: [[0,30],[5,10],[15,20]]

heap = [30]

i=1: [5,10], start=5
  heap[0]=30 > 5 → không có phòng trống
  push 10 → heap=[10,30] → sort → [10,30]

i=2: [15,20], start=15
  heap[0]=10 <= 15 → phòng trống! → pop → heap=[30]
  push 20 → heap=[20,30]

heap size = 2 → return 2 ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Meeting Rooms II - Sort + Min Heap
 * Time: O(n log n) | Space: O(n)
 */
function minMeetingRooms(intervals) {
  if (intervals.length === 0) return 0;

  intervals.sort((a, b) => a[0] - b[0]);
  const heap = [intervals[0][1]];

  for (let i = 1; i < intervals.length; i++) {
    if (heap[0] <= intervals[i][0]) {
      heap.shift();
    }
    heap.push(intervals[i][1]);
    heap.sort((a, b) => a - b);
  }

  return heap.length;
}
```

---

## 🧪 Test Cases

```javascript
console.log(minMeetingRooms([[0,30],[5,10],[15,20]])); // 2

console.log(minMeetingRooms([[7,10],[2,4],[6,8]])); // 2

console.log(minMeetingRooms([[1,5],[2,4],[3,6]])); // 3 (tất cả overlap)

console.log(minMeetingRooms([[1,10],[2,7],[3,6],[4,5]])); // 2

console.log(minMeetingRooms([])); // 0
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Min Heap cho Interval Scheduling

💡 KEY INSIGHT:
   "Min Heap lưu end times"
   "Earliest end <= start → phòng trống → pop"
   "Max heap size = số phòng cần"

⚠️ PITFALLS:
   - Pop TẤT CẢ phòng có end <= start (dùng while)
   - Heap sort mỗi insertion để giữ min ở top

🔄 VARIATIONS:
   - Meeting Rooms III → return max concurrent meetings

✅ Đã hiểu
✅ Tự code lại được
```
