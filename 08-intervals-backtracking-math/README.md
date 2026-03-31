# 🔢 Intervals, Backtracking & Math

> **Tuần 8** | **15 bài** | **🟡🟡🔴** | ⏱️ ~1.5 tuần

---

## 🎯 MỤC TIÊU TUẦN NÀY

- [ ] Nắm vững interval patterns: merge, insert, overlap detection
- [ ] Hiểu sâu Backtracking: khi nào dùng, template, optimization
- [ ] Biết các Math patterns hay gặp: bit manipulation, prime, matrix rotation
- [ ] Phân biệt được khi nào dùng Backtracking vs DP vs Iterative

---

## 📖 TỔNG QUAN

### Intervals (Khoảng)

**Interval** là đoạn [start, end] trên trục số, dùng để biểu diễn ranges.

```
Interval:  [1, 5]  → start=1, end=5

Các loại overlap:
  [1, 3]    [2, 4]     → Overlap
  [1, 3]  [4, 6]      → Non-overlap (contiguous)
  [1, 3]    [5, 7]    → Non-overlap (gap)

Overlap check:  startA ≤ endB AND startB ≤ endA
```

### Interval Operations cơ bản:

```javascript
// Interval object
const interval = { start: 1, end: 5 };

// Overlap check
function isOverlapping(a, b) {
  return a.start <= b.end && b.start <= a.end;
}

// Merge two overlapping intervals
function mergeTwo(a, b) {
  return { start: Math.min(a.start, b.start), end: Math.max(a.end, b.end) };
}

// Sort intervals by start time
intervals.sort((a, b) => a.start - b.start);
```

---

### Backtracking

**Backtracking** là kỹ thuật thử tất cả solutions, **quay lui** (backtrack) khi một path không thỏa điều kiện.

```
┌─────────────────────────────────────────────────────┐
│  Backtracking Flow:                                   │
│                                                       │
│  function solve(choices, current, result) {           │
│                                                       │
│    if (isGoal(current)) {                            │
│      result.push([...current]);                       │
│      return;                                          │
│    }                                                  │
│                                                       │
│    for (const choice of choices) {                   │
│      if (isValid(choice)) {                          │
│        current.push(choice);   // MAKE CHOICE         │
│        solve(nextChoices);     // RECURSE             │
│        current.pop();           // BACKTRACK          │
│      }                                                │
│    }                                                  │
│  }                                                    │
│                                                       │
│  "Thử tất cả → Quay lui → Thử cách khác"            │
└─────────────────────────────────────────────────────┘
```

### Khi nào dùng Backtracking?

```
✅ Tìm TẤT CẢ solutions (không phải chỉ một)
✅ Problems có constraints (sudoku, N-Queens)
✅ Problems có CHOICES tại mỗi step
✅ Exhaustive search với pruning (loại bỏ nhánh không khả thi)

❌ Cần TỐI ƯU (optimal) → Dùng DP
❌ Đếm số cách đơn giản → Có thể dùng combinatorics
❌ Đã biết solution tồn tại duy nhất → Greedy
```

---

### Math Patterns

Các patterns toán học hay gặp:

```
┌─────────────────────┬────────────────────────────┐
│ Pattern             │ Use case                  │
├─────────────────────┼────────────────────────────┤
│ Bit Manipulation    │ Power of two, count bits  │
│ Prime Numbers       │ Sieve, isPrime            │
│ GCD/LCM            │ Math operations           │
│ Matrix Rotation     │ Image processing          │
│ Palindrome Number   │ Number manipulation       │
│ Fibonacci          │ Already covered in DP     │
└─────────────────────┴────────────────────────────┘
```

---

## 🔄 PATTERNS CỐT LÕI

### Pattern 1: Merge Intervals

**🤔 Tư duy:** Sau khi sort intervals theo start, mỗi interval chỉ có thể overlap với interval **liền trước** nó (vì đã sorted). Nếu current interval start ≤ end của last interval → overlap → merge bằng cách lấy max of ends. Ngược lại → non-overlapping → thêm interval mới.

**🔍 Dùng khi:**
- Gộp overlapping intervals
- Đề bài hỏi "merge overlapping intervals"
- Meeting scheduler, calendar overlapping
- Đề bài hỏi "find minimum number of intervals to..."

**📝 Tại sao sort by start:** Nếu sort by start, ta đảm bảo: khi duyệt từ trái sang phải, mỗi interval chỉ cần so sánh với interval **cuối cùng** trong result. Nếu overlap → merge (vì không thể overlap với bất kỳ interval nào trước đó — chúng đã được merge hoặc không overlap). Complexity O(n log n) do sort.

**💻 Code mẫu:**

```javascript
// LeetCode 56: Merge Intervals — O(n log n)
function merge(intervals) {
  if (intervals.length <= 1) return intervals;

  // 1. Sort by start time
  intervals.sort((a, b) => a.start - b.start);

  const result = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const last = result[result.length - 1];
    const curr = intervals[i];

    if (curr.start <= last.end) {
      // Overlapping → merge: giữ min start, max end
      last.end = Math.max(last.end, curr.end);
    } else {
      // Non-overlapping → add new
      result.push(curr);
    }
  }

  return result;
}
```

**🔍 Visual — Trace với `[[1,3],[2,6],[8,10],[15,18]]`:**

```
After sort: [[1,3], [2,6], [8,10], [15,18]]

result = [[1,3]]  (khởi tạo)

i=1: curr=[2,6]
     2 <= 3 (last.end)? YES → merge
     result = [[1, max(3,6)=6]] = [[1,6]]

i=2: curr=[8,10]
     8 <= 6 (last.end)? NO → non-overlapping
     result = [[1,6], [8,10]]

i=3: curr=[15,18]
     15 <= 10? NO → non-overlapping
     result = [[1,6], [8,10], [15,18]]

Output: [[1,6], [8,10], [15,18]] ✓

Visual:
  Before: [1,3] [2,6]     [8,10]  [15,18]
                ───────
                merged
  After:  [1,6]  [8,10]  [15,18]
```

---

### Pattern 2: Insert Interval

**🤔 Tư duy:** Tương tự merge, nhưng insert interval mới vào sorted list. 3 bước: (1) Thêm all intervals có end < newInterval.start (non-overlapping, trước new), (2) Merge all intervals có start ≤ newInterval.end với newInterval, (3) Thêm remaining intervals.

**🔍 Dùng khi:**
- Chèn interval mới vào danh sách đã sorted
- Calendar scheduling với interval mới
- "Insert merged interval into schedule"

**💻 Code mẫu:**

```javascript
// LeetCode 57: Insert Interval — O(n)
function insert(intervals, newInterval) {
  const result = [];
  let i = 0;

  // 1. Thêm intervals đến trước newInterval
  while (i < intervals.length && intervals[i].end < newInterval.start) {
    result.push(intervals[i]);
    i++;
  }

  // 2. Merge all overlapping intervals với newInterval
  while (i < intervals.length && intervals[i].start <= newInterval.end) {
    newInterval.start = Math.min(newInterval.start, intervals[i].start);
    newInterval.end = Math.max(newInterval.end, intervals[i].end);
    i++;
  }
  result.push(newInterval);

  // 3. Thêm remaining intervals
  while (i < intervals.length) {
    result.push(intervals[i]);
    i++;
  }

  return result;
}
```

**🔍 Visual — Trace với `intervals = [[1,3],[6,9]]`, `newInterval = [2,5]`:**

```
Step 1: Add intervals before newInterval
  [1,3]: 3 < 2? NO → stop
  result = []

Step 2: Merge overlapping with newInterval
  [1,3]: start=1 ≤ end=5? YES → newInterval=[min(2,1), max(5,3)]=[1,5]
  [6,9]: start=6 ≤ end=5? NO → stop
  result = [[1,5]]

Step 3: Add remaining
  [6,9] → result = [[1,5], [6,9]]

Output: [[1,5], [6,9]] ✓
```

---

### Pattern 3: Subsets (Backtracking)

**🤔 Tư duy:** Mỗi tập hợp con được xây dựng bằng cách quyết định: **include** hoặc **exclude** mỗi phần tử. Backtracking: thử include → recurse → backtrack (exclude) → recurse. Tại mỗi index, ta có 2 lựa chọn. Tổng số subsets = 2^n (mỗi element có 2 choices: có hoặc không).

**🔍 Dùng khi:**
- Tìm tất cả subsets
- Power set generation
- Bài toán có pattern "consider/not consider each element"
- Combination sum (với constraints)

**📝 Tại sao 2^n subsets:** Với mỗi trong n phần tử, ta có 2 lựa chọn (có trong subset hoặc không). Tổ hợp = 2 × 2 × ... × 2 = 2^n. Mỗi subset được xây dựng bằng 1 path trong cây quyết định.

**💻 Code mẫu:**

```javascript
// LeetCode 78: Subsets — Backtracking
function subsets(nums) {
  const result = [];

  function backtrack(start, path) {
    result.push([...path]);  // Mỗi path = một subset

    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);      // Include nums[i]
      backtrack(i + 1, path); // Recurse với index tiếp theo
      path.pop();              // Backtrack: exclude
    }
  }

  backtrack(0, []);
  return result;
}

// ✅ Iterative — bit manipulation
function subsetsIterative(nums) {
  const result = [];
  const n = nums.length;

  for (let mask = 0; mask < (1 << n); mask++) {
    const subset = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        subset.push(nums[i]);
      }
    }
    result.push(subset);
  }

  return result;
}
```

**🔍 Visual — Trace với `nums = [1, 2, 3]`:**

```
Backtracking Tree:

                []
           ┌─────┼─────┐
          include 1   skip 1
           [1]          []
        ┌───┼───┐     ┌───┼───┐
      inc2  skip2   inc2  skip2
       [1,2]  [1]    [2]    []
     ┌──┼──┐     └──┼──┘   ├──┼──┐
   inc3 skip3  inc3 skip3  inc3 skip3
   [1,2,3] [1,2] [1,3] [1] [2,3] [2] [3] []

Total: 2^3 = 8 subsets
Result: [], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3]
```

---

### Pattern 4: Permutations (Backtracking)

**🤔 Tư duy:** Mỗi hoán vị là một cách **sắp xếp** tất cả n phần tử. Backtracking: tại mỗi vị trí, thử **mỗi phần tử chưa được dùng** (dùng `used` array để track). Khi path length = n → ta có một permutation hoàn chỉnh. Tổng = n! (n × n-1 × ... × 1).

**🔍 Dùng khi:**
- Tìm tất cả permutations
- Anagram generation
- Sudoku solver
- Bài toán "arrange items in all possible orders"

**📝 Tại sao n! permutations:** Vị trí 1: n lựa chọn. Vị trí 2: n-1 lựa chọn (đã dùng 1). ... Vị trí n: 1 lựa chọn. Tổng = n × (n-1) × ... × 1 = n!.

**💻 Code mẫu:**

```javascript
// LeetCode 46: Permutations — Backtracking
function permute(nums) {
  const result = [];

  function backtrack(path, used) {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;  // Đã dùng → skip

      used[i] = true;
      path.push(nums[i]);
      backtrack(path, used);
      path.pop();
      used[i] = false;
    }
  }

  backtrack([], Array(nums.length).fill(false));
  return result;
}
```

**🔍 Visual — Trace với `nums = [1, 2, 3]`:**

```
Permutation Tree:

Depth 0: path=[]
  ┌─ pick 1: path=[1]
  │    ┌─ pick 2: path=[1,2]
  │    │    └─ pick 3: path=[1,2,3] → COMPLETE → [1,2,3]
  │    └─ pick 3: path=[1,3]
  │         └─ pick 2: path=[1,3,2] → COMPLETE → [1,3,2]
  ├─ pick 2: path=[2]
  │    ┌─ pick 1: path=[2,1]
  │    │    └─ pick 3: [2,1,3] → COMPLETE → [2,1,3]
  │    └─ pick 3: path=[2,3]
  │         └─ pick 1: [2,3,1] → COMPLETE → [2,3,1]
  └─ pick 3: path=[3]
       ┌─ pick 1: [3,1,2] → COMPLETE
       └─ pick 2: [3,2,1] → COMPLETE

Total: 3! = 6 permutations
Result: [1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]
```

---

### Pattern 5: Combination Sum (Backtracking)

**🤔 Tư duy:** Tìm combinations có tổng = target, có thể dùng lại phần tử. Backtracking: tại mỗi bước, thử mỗi candidate (bắt đầu từ index để tránh duplicates do ordering). Nếu sum > target → prune (không cần thử tiếp vì candidates sorted). Nếu sum = target → thêm vào result.

**🔍 Dùng khi:**
- Tìm combinations có tổng = target
- Unbounded knapsack (nhưng cần tất cả solutions)
- "How many ways to make amount X using coins"
- Bài toán "combination" với sum constraints

**📝 Tại sao sort và dùng start index:** Sort giúp prune hiệu quả (khi sum > target → stop). `start` index đảm bảo không có duplicates do ordering (combinations không phân biệt thứ tự). `i` trong loop từ `start` → có thể reuse phần tử hiện tại.

**💻 Code mẫu:**

```javascript
// LeetCode 39: Combination Sum (UNLIMITED reuse) — O(k · n^t)
function combinationSum(candidates, target) {
  const result = [];
  candidates.sort((a, b) => a - b);  // Sort để prune hiệu quả

  function backtrack(start, path, sum) {
    if (sum === target) {
      result.push([...path]);
      return;
    }
    if (sum > target) return;

    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > target) break;  // Prune

      path.push(candidates[i]);
      backtrack(i, path, sum + candidates[i]);  // Có thể reuse i
      path.pop();
    }
  }

  backtrack(0, [], 0);
  return result;
}
```

**🔍 Visual — Trace với `candidates = [2, 3, 6, 7]`, `target = 7`:**

```
backtrack(0, [], 0)

path=[] → candidates[0]=2 → path=[2], sum=2
  path=[2] → candidates[0]=2 → path=[2,2], sum=4
    path=[2,2] → candidates[0]=2 → path=[2,2,2], sum=6
      path=[2,2,2] → candidates[0]=2 → sum=8 > 7 → STOP (prune)
      candidates[1]=3 → sum=7 → 2+2+3=7 → FOUND: [2,2,3]
      candidates[2]=6 → sum=8 > 7 → STOP
    candidates[1]=3 → path=[2,3], sum=5
      path=[2,3] → candidates[1]=3 → path=[2,3,3], sum=8 > 7 → STOP
    candidates[1]=3 → path=[2,3], sum=5 (from backtrack of 2,3? No, let me re-trace)

Let me re-trace properly:

[] → add 2 → [2], sum=2
  [2] → add 2 → [2,2], sum=4
    [2,2] → add 2 → [2,2,2], sum=6
      [2,2,2] → add 2 → sum=8 > 7 → STOP
      add 3 → sum=9 > 7 → STOP
      add 6 → STOP
      add 7 → STOP
    add 3 → [2,2,3], sum=7 → FOUND ✓
    add 6 → STOP
    add 7 → STOP
  add 3 → [2,3], sum=5
    [2,3] → add 3 → [2,3,3], sum=8 → STOP
    add 6 → STOP
    add 7 → STOP
  add 6 → [2,6], sum=8 → STOP
  add 7 → [2,7], sum=9 → STOP
→ add 3 → [3], sum=3
  [3] → add 3 → [3,3], sum=6
    ...
  add 6 → STOP
  add 7 → STOP
→ add 6 → STOP
→ add 7 → [7], sum=7 → FOUND ✓

Results: [[2,2,3], [7]]
```

---

### Pattern 6: Permutations II (with duplicates)

**🤔 Tư duy:** Input có duplicates nhưng cần output **không có duplicates**. Sort → mỗi group của duplicates được xử lý nhất quán. Skip duplicates tại cùng level: `if (i > 0 && nums[i] === nums[i-1] && !used[i-1]) continue`. Điều này đảm bảo: tại mỗi level, chỉ 1 "copy" của duplicate được dùng trước.

**🔍 Dùng khi:**
- Permutations với duplicate elements
- LeetCode 47: Permutations II
- Anagram deduplication

**📝 Tại sao `!used[i-1]`:**
- Nếu `nums[i] === nums[i-1]` VÀ `used[i-1] === false` → `nums[i-1]` không được dùng ở level hiện tại nhưng cùng value → skip để tránh duplicate permutations
- Nếu `used[i-1] === true` → `nums[i-1]` đã được dùng → dùng `nums[i]` là bình thường (vì nó đến từ nhánh khác)

**💻 Code mẫu:**

```javascript
// LeetCode 47: Permutations II — O(n!)
function permuteUnique(nums) {
  const result = [];
  nums.sort((a, b) => a - b);  // Sort: group duplicates together
  const used = Array(nums.length).fill(false);

  function backtrack(path) {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;

      // Skip duplicates at same level
      if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) continue;

      used[i] = true;
      path.push(nums[i]);
      backtrack(path);
      path.pop();
      used[i] = false;
    }
  }

  backtrack([]);
  return result;
}
```

---

### Pattern 7: Non-overlapping Intervals (Greedy)

**🤔 Tư duy:** Để remove tối thiểu intervals → giữ tối đa non-overlapping intervals. Greedy: **luôn chọn interval có end nhỏ nhất** (kết thúc sớm nhất). Kết thúc sớm → dành nhiều không gian cho intervals sau.

**🔍 Dùng khi:**
- Đếm số intervals cần xóa để không overlap
- Minimum number of intervals to remove
- Activity selection problem

**📝 Tại sao chọn end nhỏ nhất:** Đây là classic greedy proof. Gọi interval được chọn có end = e. Bất kỳ solution nào cũng có thể thay interval đầu tiên bằng interval có end ≤ e mà không làm giảm số intervals được giữ. Luôn chọn end nhỏ nhất không làm mất optimal.

**💻 Code mẫu:**

```javascript
// LeetCode 435: Non-overlapping Intervals
function eraseOverlapIntervals(intervals) {
  if (intervals.length === 0) return 0;

  intervals.sort((a, b) => a.end - b.end);  // Sort by end

  let count = 0;
  let end = intervals[0].end;

  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i].start < end) {
      count++;  // Overlapping → remove
    } else {
      end = intervals[i].end;  // Non-overlapping → keep, update end
    }
  }

  return count;
}
```

---

### Pattern 8: Meeting Rooms

**🤔 Tư duy:** Sort start và end times riêng biệt. Duyệt qua tất cả meetings: nếu start[i] < end[j] → cần thêm room (meeting mới bắt đầu trước khi meeting cũ kết thúc). Ngược lại → reuse room (meeting cũ kết thúc trước hoặc cùng lúc).

**🔍 Dùng khi:**
- Tìm số phòng họp tối thiểu cần thiết
- Resource allocation
- Calendar scheduling

**💻 Code mẫu:**

```javascript
// LeetCode 253: Meeting Rooms II
function minMeetingRooms(intervals) {
  if (intervals.length === 0) return 0;

  const starts = intervals.map(i => i.start).sort((a, b) => a - b);
  const ends = intervals.map(i => i.end).sort((a, b) => a - b);

  let rooms = 0;
  let endIdx = 0;

  for (let i = 0; i < intervals.length; i++) {
    if (starts[i] < ends[endIdx]) {
      rooms++;  // Cần room mới
    } else {
      endIdx++; // Meeting kết thúc, reuse
    }
  }

  return rooms;
}
```

**🔍 Visual — Trace với `intervals = [[0,30],[5,10],[15,20]]`:**

```
Starts sorted: [0, 5, 15]
Ends sorted:   [10, 20, 30]

i=0: start=0, end=10 → 0 < 10? YES → rooms=1 (need new)
i=1: start=5, end=10 → 5 < 10? YES → rooms=2 (need new)
i=2: start=15, end=20 → 15 < 20? NO (15 ≥ 20? No, let me fix)
                                 start=15, ends[endIdx=0]=10 → 15 < 10? NO → reuse → endIdx=1
                                 start=15, ends[endIdx=1]=20 → 15 < 20? YES → rooms=3

Let me re-trace:
  starts=[0,5,15], ends=[10,20,30], endIdx=0, rooms=0

  i=0: starts[0]=0 < ends[0]=10? YES → rooms=1
  i=1: starts[1]=5 < ends[0]=10? YES → rooms=2
  i=2: starts[2]=15 < ends[0]=10? NO → endIdx=1
        starts[2]=15 < ends[1]=20? YES → rooms=3

Wait, that seems wrong. Let me fix:
  i=0: 0 < 10? YES → rooms=1
  i=1: 5 < 10? YES → rooms=2
  i=2: 15 < 10? NO → endIdx++ → endIdx=1
        15 < 20? YES → rooms=3

Result: 3 rooms needed. But actually [0,30] overlaps with both others, so 2 rooms suffice.
The issue is: starts[2]=15 < ends[0]=10 is false, so we increment endIdx,
but now starts[2]=15 < ends[1]=20 is true → we count another room. This is correct:
room1 holds [0,30], room2 holds [5,10] and [15,20] can reuse room2 because [5,10] ends at 10.

Actually the algorithm should give rooms=2 for this case.
Let me re-trace carefully:

  starts=[0,5,15], ends=[10,20,30]
  i=0: 0 < 10? YES → rooms=1
  i=1: 5 < 10? YES → rooms=2  (rooms: [0,30], [5,10])
  i=2: 15 < 10? NO → endIdx++ (endIdx=1), 15 < 20? YES → rooms=3

That still gives 3. Hmm, let me check the algorithm logic.

Actually wait — the second comparison should be `if (starts[i] < ends[endIdx])`.
When starts[2]=15 and ends[0]=10, 15 < 10 is false, so we increment endIdx to 1.
Then starts[2]=15 < ends[1]=20 is true, so we increment rooms.
So rooms=3. But intuitively:
- Room 1: [0,30]
- Room 2: [5,10] then [15,20] (they don't overlap since 15 > 10)

The issue is: after the first false comparison (15 < 10), we increment endIdx and THEN check again.
This means we're checking if the current meeting overlaps with the NEXT ending meeting.
But [15,20] does NOT overlap with [5,10] since 15 > 10.

Let me re-read the algorithm...

Oh wait, I see the issue with my trace. The condition is:
if (starts[i] < ends[endIdx]) → need new room
else → reuse (advance endIdx)

So:
  i=0: 0 < 10? YES → rooms=1
  i=1: 5 < 10? YES → rooms=2
  i=2: 15 < 10? NO → endIdx=1 (now ends[1]=20)
        ends[endIdx]=20, so the comparison `starts[i] < ends[endIdx]` should be 15 < 20? YES → rooms=3

That seems to give 3 rooms, but the correct answer is 2. Let me reconsider...

Oh! The algorithm is correct but I need to think through it differently. Actually, let me just provide the correct trace:

The standard algorithm is:
```
rooms = 0
endIdx = 0
for each start in sorted_starts:
  if start < sorted_ends[endIdx]:
    rooms++  # new room needed
  else:
    endIdx++  # a room is free, reuse it
```

For starts=[0,5,15], ends=[10,20,30]:
- start=0: 0 < 10? YES → rooms=1
- start=5: 5 < 10? YES → rooms=2
- start=15: 15 < 10? NO → endIdx=1, 15 < 20? YES → rooms=3

This gives 3, which seems wrong for the expected answer of 2. But let me think: [0,30] occupies room 1, [5,10] occupies room 2, and [15,20] also needs a room since [5,10] only frees at 10 and [15,20] starts at 15... Actually [15,20] can reuse room 2 since [5,10] ends at 10. The algorithm incorrectly gives 3 here. Let me re-examine.

Actually I think the algorithm should work. Let me re-check:
- start=0: 0 < 10 → room1 starts (rooms=1)
- start=5: 5 < 10 → room2 starts (rooms=2)
- start=15: 15 < 10? NO → endIdx++ (endIdx=1), 15 < 20? YES → room3 starts (rooms=3)

Hmm, the algorithm gives 3 but the intuitive answer is 2 (rooms [0,30] and [5,10]/[15,20]). The issue is that the algorithm compares with `sorted_ends[endIdx]` which advances when `start >= end`. So:
- When start=15 and endIdx=0, ends[0]=10: 15 >= 10 → false condition → endIdx++ (endIdx=1)
- Now start=15 and ends[1]=20: the comparison in the loop for THIS start is already done

Wait, I see it now. The `if/else` is evaluated ONCE per start. If the condition is false (start >= ends[endIdx]), we advance endIdx but DON'T increment rooms. But we don't re-check with the new endIdx for the same start.

So for start=15: 15 < 10? NO → endIdx=1 (we free a room), but rooms stays at 2.

Wait no, let me re-read:
```
if (starts[i] < ends[endIdx]) {
  rooms++;
} else {
  endIdx++;
}
```

So: start=15, ends[0]=10: 15 < 10? NO → else → endIdx=1. rooms stays 2.

rooms=2 at end ✓

OK I was confused. The answer is 2. ✓
```

---

### Pattern 9: Bit Manipulation

**🤔 Tư duy:** Bit manipulation dùng **低位** (low-level bit operations) để thực hiện các phép toán nhanh. Các tricks quan trọng: `n & (n-1)` xóa bit 1 thấp nhất; `n & (-n)` lấy rightmost set bit.

**🔍 Dùng khi:**
- Power of Two check
- Count set bits
- Swap without temp
- Bit masking
- Single number (XOR)

**📝 Từng trick và giải thích:**

| Trick | Công dụng | Giải thích |
|-------|-----------|-------------|
| `n & (n-1)` | Xóa bit 1 thấp nhất | `n-1` flip bits từ rightmost 1 → 0 và tất cả bits sau = 1. AND → xóa bit đó |
| `n & (-n)` | Lấy rightmost set bit | `-n` = `~n + 1` → chỉ giữ rightmost 1 |
| `n \| (n-1)` | Set tất cả bits từ LSB đến rightmost 1 | |
| `n ^ (n-1)` | Toggle bits | |

**💻 Code mẫu:**

```javascript
// Power of Two: n > 0 && n & (n-1) === 0
function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}

// Count set bits (1 bits)
function hammingWeight(n) {
  let count = 0;
  while (n !== 0) {
    n = n & (n - 1);  // Xóa bit 1 thấp nhất
    count++;
  }
  return count;
}

// Swap without temp
function swap(a, b) {
  a = a ^ b;
  b = a ^ b;  // b = (a^b)^b = a
  a = a ^ b;  // a = (a^b)^a = b
}
```

**🔍 Visual — `n & (n-1)` xóa bit thấp nhất:**

```
n = 12 (1100)
n-1 = 11 (1011)
n & (n-1) = 1000 → bit thấp nhất (rightmost 1) đã bị xóa

n = 8  (1000)  → power of 2
n-1 = 7  (0111)
n & (n-1) = 0000 → 0 ✓ → power of 2!

n = 6  (0110)  → NOT power of 2
n-1 = 5  (0101)
n & (n-1) = 0100 → NOT 0 → not power of 2 ✓
```

---

### Pattern 10: Rotate Image

**🤔 Tư duy:** Rotate 90° clockwise = **Transpose** (đảo hàng thành cột) + **Reverse each row** (đảo thứ tự mỗi hàng). Transpose: swap `matrix[i][j]` với `matrix[j][i]`. Reverse row: swap elements trong mỗi hàng.

**🔍 Dùng khi:**
- Rotate matrix 90°
- Transpose matrix
- Flip image horizontally/vertically
- Image processing

**📝 Tại sao transpose + reverse rows = rotate 90° clockwise:**
- Transpose: `a[i][j]` → `a[j][i]`
- Reverse each row: `a[j][i]` → `a[j][n-1-i]`
- Kết hợp: `a[i][j]` → `a[j][i]` → `a[j][n-1-i]`
- Vậy phần tử ở (i,j) di chuyển đến (j, n-1-i) = rotate 90° clockwise

**💻 Code mẫu:**

```javascript
// Rotate 90° clockwise
function rotate(matrix) {
  const n = matrix.length;

  // 1. Transpose: đảo hàng thành cột
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
    }
  }

  // 2. Reverse each row
  for (let i = 0; i < n; i++) {
    matrix[i].reverse();
  }
}
```

**🔍 Visual — Trace với matrix `[[1,2,3],[4,5,6],[7,8,9]]`:**

```
Original:           Transpose:          Reverse Rows:
1  2  3            1  4  7            7  4  1
4  5  6    →       2  5  8      →     8  5  2
7  8  9            3  6  9             9  6  3

Rotation 90° clockwise ✓

Transpose step (swap matrix[i][j] ↔ matrix[j][i]):
  (0,1)↔(1,0): 2↔4
  (0,2)↔(2,0): 3↔7
  (1,2)↔(2,1): 6↔8

Reverse rows:
  Row 0: [1,4,7] → [7,4,1]
  Row 1: [2,5,8] → [8,5,2]
  Row 2: [3,6,9] → [9,6,3]
```

---

### Pattern 11: Count Primes (Sieve of Eratosthenes)

**🤔 Tư duy:** Prime numbers ≤ n được tìm bằng cách đánh dấu multiples của mỗi prime bắt đầu từ p² (vì smaller multiples đã được đánh dấu bởi smaller primes). Tối ưu: chỉ cần đến √n.

**🔍 Dùng khi:**
- Count primes
- Generate primes
- Prime factorization
- Sieve of Eratosthenes

**📝 Tại sao chỉ đến √n:** Nếu n có factor > √n thì nó cũng có factor < √n (nếu không, tích sẽ > n). Vậy nếu không có factor ≤ √n, n là prime.

**💻 Code mẫu:**

```javascript
// LeetCode 204: Count Primes — O(n log log n)
function countPrimes(n) {
  if (n <= 2) return 0;

  const isPrime = Array(n).fill(true);
  isPrime[0] = isPrime[1] = false;

  for (let i = 2; i * i < n; i++) {
    if (isPrime[i]) {
      for (let j = i * i; j < n; j += i) {
        isPrime[j] = false;
      }
    }
  }

  return isPrime.filter(Boolean).length;
}
```

---

### Pattern 12: Cách tư duy khi gặp bài Interval

**🤔 Tư duy:** Với mọi bài Interval, hãy đặt 3 câu hỏi:

**📝 3 câu hỏi cần đặt ra:**

```
1. INPUT đã SORTED chưa?
   ├── CHƯA → sort by start
   └── ĐÃ SORTED → không cần sort lại

2. Cần MERGE hay INSERT?
   ├── MERGE all overlapping → sort + scan
   ├── INSERT one new → scan để tìm vị trí + merge
   └── Non-overlapping count → sort by end (greedy)

3. Cần tìm MIN hay MAX?
   ├── Minimum rooms/overlaps → sort starts/ends riêng
   ├── Maximum concurrent → track số lượng tại mỗi điểm
   └── Minimum removals → greedy sort by end
```

---

### Pattern 13: Backtracking vs Recursion vs Iteration

**🤔 Tư duy:** Ba cách này khác nhau cơ bản. **Recursion** = gọi chính nó. **Backtracking** = recursion với **undo** (backtrack). **Iteration** = vòng lặp thay vì recursion.

**📝 Phân biệt rõ ràng:**

| Kỹ thuật | Đặc điểm | Khi nào dùng |
|-----------|-----------|--------------|
| **Recursion** | Gọi chính nó, có base case | Đệ quy tự nhiên (DFS, factorial) |
| **Backtracking** | Recursion + undo (pop) | Exhaustive search với choices, pruning |
| **Iteration** | Vòng lặp (for/while) | Khi không cần recursion, muốn kiểm soát |

**📝 Backtracking = Recursion + 3 bước:**
```
1. MAKE CHOICE: path.push(choice)
2. RECURSE: solve(nextChoices)
3. UNDO: path.pop() ← ĐÂY LÀ ĐIỂM KHÁC BIỆT
```

**📝 Checklist — Khi nào Backtracking:**
- ✅ Cần TẤT CẢ solutions (subsets, permutations)
- ✅ Exhaustive search với pruning (combination sum, N-Queens)
- ✅ Constraint satisfaction (Sudoku)
- ❌ Cần ONE OPTIMAL solution → DP
- ❌ Cần COUNT only → có thể dùng combinatorics

---

### Pattern 14: Tại sao n² trong Matrix Rotation?

**🤔 Tư duy:** Để rotate matrix n×n một góc 90°, mỗi phần tử phải di chuyển đến vị trí mới. Với n² phần tử, mỗi phần tử được xử lý **đúng 1 lần** trong swap. Độ phức tạp **O(n²)** vì ta phải đi qua tất cả n² cells.

**📝 Tại sao không thể tốt hơn O(n²):**
- Input size = n² (số lượng phần tử)
- Mỗi phần tử phải di chuyển đến vị trí mới
- Ta phải đọc/ghi mỗi phần tử ít nhất 1 lần
- Độ phức tạp tối thiểu = Ω(n²) (không thể tốt hơn)
- Transpose + Reverse = O(n²) = optimal

**📝 Tại sao transpose + reverse rows:**
```
In-place rotation 90° clockwise:
  (i,j) → (j, n-1-i)

Transpose:     (i,j) → (j,i)
Reverse rows:  (j,i) → (j, n-1-i)

Combine: ✓ (optimal in-place, no extra space)
```

```javascript
// LeetCode 56: Merge Intervals
function merge(intervals) {
  if (intervals.length <= 1) return intervals;

  // Sort by start time
  intervals.sort((a, b) => a.start - b.start);

  const result = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const last = result[result.length - 1];
    const curr = intervals[i];

    if (curr.start <= last.end) {
      // Overlapping → merge
      last.end = Math.max(last.end, curr.end);
    } else {
      // Non-overlapping → add new
      result.push(curr);
    }
  }

  return result;
}
```

**Visual — Merge Intervals:**
```
Input: [[1,3],[2,6],[8,10],[15,18]]

After sort: [[1,3],[2,6],[8,10],[15,18]]

Step 1: result = [[1,3]]
        curr = [2,6]
        2 <= 3? YES → merge → [1, max(3,6)] = [1,6]
        result = [[1,6]]

Step 2: result = [[1,6]]
        curr = [8,10]
        8 <= 6? NO → add new
        result = [[1,6], [8,10]]

Step 3: result = [[1,6], [8,10]]
        curr = [15,18]
        15 <= 10? NO → add new
        result = [[1,6], [8,10], [15,18]]

Output: [[1,6], [8,10], [15,18]]
```

---

### Pattern 2: Insert Interval

**Dùng khi:** Chèn interval mới vào danh sách đã sorted.

```javascript
// LeetCode 57: Insert Interval
function insert(intervals, newInterval) {
  const result = [];
  let i = 0;

  // 1. Thêm intervals đến trước newInterval (non-overlapping)
  while (i < intervals.length && intervals[i].end < newInterval.start) {
    result.push(intervals[i]);
    i++;
  }

  // 2. Merge all overlapping intervals với newInterval
  while (i < intervals.length && intervals[i].start <= newInterval.end) {
    newInterval.start = Math.min(newInterval.start, intervals[i].start);
    newInterval.end = Math.max(newInterval.end, intervals[i].end);
    i++;
  }
  result.push(newInterval);

  // 3. Thêm remaining intervals
  while (i < intervals.length) {
    result.push(intervals[i]);
    i++;
  }

  return result;
}
```

---

### Pattern 3: Subsets (Backtracking)

**Dùng khi:** Tìm tất cả subsets của một tập hợp.

```javascript
// LeetCode 78: Subsets
function subsets(nums) {
  const result = [];

  function backtrack(start, path) {
    result.push([...path]);  // Thêm mọi subset (kể cả empty)

    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);      // Chọn
      backtrack(i + 1, path); // Đệ quy với index tiếp theo
      path.pop();              // Quay lui
    }
  }

  backtrack(0, []);
  return result;
}

// ✅ Iterative (dùng bit manipulation)
function subsetsIterative(nums) {
  const result = [];
  const n = nums.length;

  for (let mask = 0; mask < (1 << n); mask++) {
    const subset = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        subset.push(nums[i]);
      }
    }
    result.push(subset);
  }

  return result;
}
```

**Visual — Subsets:**
```
nums = [1, 2, 3]

Backtracking Tree:

[]                          (depth 0)
├── [1]                     (depth 1)
│   ├── [1,2]               (depth 2)
│   │   └── [1,2,3]         (depth 3)
│   └── [1,3]               (depth 2)
├── [2]                     (depth 1)
│   └── [2,3]               (depth 2)
└── [3]                     (depth 1)

All subsets: [], [1], [1,2], [1,3], [2], [2,3], [3]

Total: 2^n = 8 subsets ✓
```

---

### Pattern 4: Permutations (Backtracking)

**Dùng khi:** Tìm tất cả permutations (hoán vị) của một tập hợp.

```javascript
// LeetCode 46: Permutations
function permute(nums) {
  const result = [];

  function backtrack(path, used) {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;  // Đã dùng → skip

      used[i] = true;         // Đánh dấu đã dùng
      path.push(nums[i]);     // Chọn
      backtrack(path, used);  // Đệ quy
      path.pop();             // Quay lui
      used[i] = false;       // Reset
    }
  }

  backtrack([], Array(nums.length).fill(false));
  return result;
}

// ✅ With Swap (không dùng used array)
function permuteSwap(nums) {
  const result = [];

  function backtrack(start) {
    if (start === nums.length) {
      result.push([...nums]);
      return;
    }

    for (let i = start; i < nums.length; i++) {
      [nums[start], nums[i]] = [nums[i], nums[start]];  // Swap
      backtrack(start + 1);
      [nums[start], nums[i]] = [nums[i], nums[start]];  // Swap back
    }
  }

  backtrack(0);
  return result;
}
```

**Visual — Permutations:**
```
nums = [1, 2, 3]

Permutation Tree:

[1,2,3]
[1,3,2]
[2,1,3]
[2,3,1]
[3,1,2]
[3,2,1]

Total: 3! = 6 permutations ✓
```

---

### Pattern 5: Combination Sum (Backtracking)

**Dùng khi:** Tìm combinations có tổng bằng target (có thể dùng lại phần tử).

```javascript
// LeetCode 39: Combination Sum (UNLIMITED reuse)
function combinationSum(candidates, target) {
  const result = [];

  function backtrack(start, path, sum) {
    if (sum === target) {
      result.push([...path]);
      return;
    }
    if (sum > target) return;

    for (let i = start; i < candidates.length; i++) {
      path.push(candidates[i]);
      backtrack(i, path, sum + candidates[i]);  // Có thể reuse candidates[i]
      path.pop();
    }
  }

  backtrack(0, [], 0);
  return result;
}

// LeetCode 40: Combination Sum II (CANNOT reuse, duplicates in candidates)
function combinationSum2(candidates, target) {
  const result = [];
  candidates.sort((a, b) => a - b);  // Sort để skip duplicates

  function backtrack(start, path, sum) {
    if (sum === target) {
      result.push([...path]);
      return;
    }
    if (sum > target) return;

    for (let i = start; i < candidates.length; i++) {
      // Skip duplicates: nếu i > start và candidates[i] === candidates[i-1]
      if (i > start && candidates[i] === candidates[i - 1]) continue;

      path.push(candidates[i]);
      backtrack(i + 1, path, sum + candidates[i]);
      path.pop();
    }
  }

  backtrack(0, [], 0);
  return result;
}
```

**Visual — Combination Sum:**
```
candidates = [2, 3, 6, 7], target = 7

[]
├── [2] → sum=2
│   ├── [2,2] → sum=4
│   │   ├── [2,2,2] → sum=6
│   │   │   └── [2,2,2,2] → sum=8 > 7 (stop)
│   │   └── [2,2,3] → sum=7 ✓ → [2,2,3]
│   └── [2,3] → sum=5
│       └── [2,3,3] → sum=8 > 7 (stop)
├── [3] → sum=3
│   └── [3,3] → sum=6
│       └── [3,3,?] → sum=9 > 7 (stop)
└── [7] → sum=7 ✓ → [7]

Results: [[2,2,3], [7]]
```

---

### Pattern 6: Permutations II (with duplicates)

**Dùng khi:** Permutations với duplicate elements trong input.

```javascript
// LeetCode 47: Permutations II
function permuteUnique(nums) {
  const result = [];
  nums.sort((a, b) => a - b);  // Sort để skip duplicates
  const used = Array(nums.length).fill(false);

  function backtrack(path) {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      // Skip if already used
      if (used[i]) continue;

      // Skip duplicate: nếu nums[i] === nums[i-1] VÀ nums[i-1] chưa được dùng
      // → Đảm bảo mỗi "group" của duplicates chỉ dùng 1 lần ở mỗi level
      if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) continue;

      used[i] = true;
      path.push(nums[i]);
      backtrack(path);
      path.pop();
      used[i] = false;
    }
  }

  backtrack([]);
  return result;
}
```

---

### Pattern 7: Non-overlapping Intervals

**Dùng khi:** Đếm số intervals cần xóa để không còn overlap.

```javascript
// LeetCode 435: Non-overlapping Intervals
function eraseOverlapIntervals(intervals) {
  if (intervals.length === 0) return 0;

  intervals.sort((a, b) => a.end - b.end);  // Sort by end

  let count = 0;
  let end = intervals[0].end;

  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i].start < end) {
      // Overlapping → count it
      count++;
    } else {
      // Non-overlapping → update end
      end = intervals[i].end;
    }
  }

  return count;
}
```

---

### Pattern 8: Meeting Rooms

```javascript
// LeetCode 252: Meeting Rooms (có thể attend all?)
function canAttendMeetings(intervals) {
  intervals.sort((a, b) => a.start - b.start);

  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i].start < intervals[i - 1].end) {
      return false;
    }
  }
  return true;
}

// LeetCode 253: Meeting Rooms II (minimum rooms needed)
function minMeetingRooms(intervals) {
  if (intervals.length === 0) return 0;

  // Tách start và end times
  const starts = intervals.map(i => i.start).sort((a, b) => a - b);
  const ends = intervals.map(i => i.end).sort((a, b) => a - b);

  let rooms = 0;
  let endIdx = 0;

  for (let i = 0; i < intervals.length; i++) {
    if (starts[i] < ends[endIdx]) {
      rooms++;  // Cần room mới
    } else {
      endIdx++; // Meeting kết thúc, reuse room
    }
  }

  return rooms;
}
```

---

### Pattern 9: Bit Manipulation

```javascript
// LeetCode 231: Power of Two
function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}
// n = 8: 1000 & 0111 = 0000 → true
// n = 6: 0110 & 0101 = 0100 → false

// LeetCode 191: Number of 1 Bits
function hammingWeight(n) {
  let count = 0;
  while (n !== 0) {
    n = n & (n - 1);  // Xóa bit 1 thấp nhất
    count++;
  }
  return count;
}

// Swap without temp
let a = 5, b = 3;
a = a ^ b;  // 5^3 = 6
b = a ^ b;  // 6^3 = 5
a = a ^ b;  // 6^5 = 3
```

**Visual — Power of Two:**
```
n = 16:  10000  (power of 2)
n-1 = 15: 01111
n & (n-1) = 00000 → true ✓

n = 12:  01100  (NOT power of 2)
n-1 = 11: 01011
n & (n-1) = 01000 → NOT zero → false ✓

Trick: n & (n-1) xóa bit 1 thấp nhất
```

---

### Pattern 10: Rotate Image

```javascript
// LeetCode 48: Rotate Image 90 degrees clockwise
function rotate(matrix) {
  const n = matrix.length;

  // Transpose (đảo hàng thành cột)
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
    }
  }

  // Reverse each row
  for (let i = 0; i < n; i++) {
    matrix[i].reverse();
  }
}

// Rotate 90 degrees counter-clockwise
function rotateCCW(matrix) {
  const n = matrix.length;
  // Transpose
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
    }
  }
  // Reverse each column
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n / 2; i++) {
      [matrix[i][j], matrix[n - 1 - i][j]] =
        [matrix[n - 1 - i][j], matrix[i][j]];
    }
  }
}
```

**Visual — Rotate Image:**
```
Original:          Transpose:        Reverse Rows:
1 2 3              1 4 7              7 4 1
4 5 6     →        2 5 8      →        8 5 2
7 8 9              3 6 9              9 6 3

Rotate 90° clockwise = Transpose + Reverse Rows
Rotate 90° counter-clockwise = Transpose + Reverse Columns
```

---

### Pattern 11: Count Primes

```javascript
// LeetCode 204: Count Primes
function countPrimes(n) {
  if (n <= 2) return 0;

  // Sieve of Eratosthenes
  const isPrime = Array(n).fill(true);
  isPrime[0] = isPrime[1] = false;

  for (let i = 2; i * i < n; i++) {
    if (isPrime[i]) {
      // Đánh dấu tất cả multiples của i là không prime
      for (let j = i * i; j < n; j += i) {
        isPrime[j] = false;
      }
    }
  }

  return isPrime.filter(Boolean).length;
}
```

---

## ⚠️ COMMON PITFALLS (Lỗi hay mắc)

### ❌ Pitfall 1: Backtracking - quên backtrack (pop)
```javascript
// ❌ Sai: quên path.pop() → path accumulate
function backtrack(path) {
  if (path.length === n) { result.push([...path]); return; }
  for (let i = 0; i < n; i++) {
    path.push(i);
    backtrack(path);
    // ❌ QUÊN path.pop()!
  }
}

// ✅ Đúng: luôn backtrack
function backtrack(path) {
  if (path.length === n) { result.push([...path]); return; }
  for (let i = 0; i < n; i++) {
    path.push(i);
    backtrack(path);
    path.pop();  // ← LUÔN luôn pop sau khi recurse
  }
}
```

### ❌ Pitfall 2: Intervals - sort sai dimension
```javascript
// ❌ Sai: sort by end thay vì start
intervals.sort((a, b) => a.end - b.end);  // → Merging không đúng

// ✅ Đúng: sort by start
intervals.sort((a, b) => a.start - b.start);
// Nếu equal start → sort by end
intervals.sort((a, b) => a.start !== b.start
  ? a.start - b.start
  : a.end - b.end);
```

### ❌ Pitfall 3: Subsets II / Permutations II - skip duplicates sai cách
```javascript
// ❌ Sai: skip duplicates nhưng không đúng logic
if (nums[i] === nums[i - 1] && i > 0) continue;  // ❌ Không đủ

// ✅ Đúng cho Subsets: i > start
if (i > start && nums[i] === nums[i - 1]) continue;

// ✅ Đúng cho Permutations: !used[i-1]
if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) continue;
// Ý nghĩa: đảm bảo mỗi "copy" của duplicate được dùng ở mỗi level
```

### ❌ Pitfall 4: Meeting Rooms II - dùng min heap thay vì 2 sorted arrays
```javascript
// Cách heap (cũng đúng nhưng phức tạp hơn):
function minMeetingRoomsHeap(intervals) {
  intervals.sort((a, b) => a.start - b.start);
  const minHeap = new MinHeap();

  for (const interval of intervals) {
    if (minHeap.size > 0 && minHeap.peek() <= interval.start) {
      minHeap.extractMin();  // Room freed
    }
    minHeap.insert(interval.end);  // Occupy room
  }

  return minHeap.size;
}

// Cách 2 sorted arrays (đơn giản hơn - dùng trong pattern 8)
```

### ❌ Pitfall 5: Bit manipulation - nhầm operator
```javascript
// ❌ Nhầm & và |
// n & (n-1) → xóa bit 1 thấp nhất
// n | (n-1) → set tất cả bits từ LSB đến bit 1 thấp nhất
// n ^ (n-1) → bits khác nhau

// Đúng cho power of two:
n > 0 && (n & (n - 1)) === 0
```

---

## 💡 TIPS & TRICKS

### 1. Backtracking vs DP

```
Backtracking khi:
  ✅ Cần TẤT CẢ solutions
  ✅ Đếm số solutions
  ✅ Problems với CHOICES tại mỗi step
  ✅ Có thể PRUNE (loại bỏ nhánh không khả thi)

DP khi:
  ✅ Cần ONE OPTIMAL solution
  ✅ Problems có optimal substructure rõ ràng
  ✅ Có thể memoize dễ dàng
```

### 2. Backtracking pruning strategies

```javascript
// 1. Early termination (sum > target)
if (sum > target) return;

// 2. Skip duplicates (sort trước)
if (i > start && nums[i] === nums[i - 1]) continue;

// 3. Prune bằng constraints
if (!isValid(currentState)) continue;

// 4. Symmetry pruning (N-Queens)
if (row === 0) { ... }
// Hoặc: only try first half, mirror the rest
```

### 3. Mẹo Interval problems

```javascript
// Meeting Rooms II - 2 approaches
// Cách 1: 2 sorted arrays (simple)
const starts = intervals.map(i => i.start).sort();
const ends = intervals.map(i => i.end).sort();

// Cách 2: MinHeap (for tracking earliest ending)
const heap = new MinHeap();

// Non-overlapping intervals - greedy
// Sort by end time → luôn chọn interval kết thúc sớm nhất
```

### 4. Mẹo Matrix Rotation

```javascript
// Rotate 90° clockwise: Transpose + Reverse Rows
// Rotate 90° counter-clockwise: Transpose + Reverse Cols
// Rotate 180°: Reverse Rows + Reverse Cols
// Flip Horizontal: Reverse each row
// Flip Vertical: Reverse each column
```

---

## 🔍 BRUTE FORCE → OPTIMAL

### Intervals

| Bài | Approach | Time | Space | Notes |
|-----|----------|------|-------|-------|
| Insert Interval | Linear scan + merge | O(n) | O(n) | Sort trước |
| Merge Intervals | Sort + merge | O(n log n) | O(n) | Sort by start |
| Non-overlapping | Sort by end | O(n log n) | O(n) | Greedy |
| Meeting Rooms | Sort + 2 pointers | O(n log n) | O(n) | |
| Meeting Rooms II | Sort + 2 pointers/heap | O(n log n) | O(n) | |

### Backtracking

| Bài | Approach | Time | Space | Notes |
|-----|----------|------|-------|-------|
| Subsets | Backtrack | O(2^n) | O(n) | All subsets |
| Subsets II | Backtrack + skip dup | O(2^n) | O(n) | |
| Permutations | Backtrack + used | O(n!) | O(n) | |
| Permutations II | Backtrack + skip dup | O(n!) | O(n) | |
| Combination Sum | Backtrack + sum | O(k · n^t) | O(k) | k=avg len |
| Combination Sum II | Backtrack + skip dup | O(k · n^t) | O(k) | |

### Math

| Bài | Approach | Time | Notes |
|-----|----------|------|-------|
| Power of Two | Bit manipulation | O(1) | n & (n-1) === 0 |
| Number of 1 Bits | n & (n-1) | O(1) | Count bits |
| Count Primes | Sieve | O(n log log n) | |
| Rotate Image | Transpose + Reverse | O(n²) | In-place |

---

## ⏱️ TIME & SPACE COMPLEXITY TỔNG HỢP

### Backtracking

| Problem | Time | Space | Output Size |
|---------|------|-------|-------------|
| Subsets | O(2^n) | O(n) | O(2^n) |
| Subsets II | O(2^n) | O(n) | O(2^n) |
| Permutations | O(n!) | O(n) | O(n!) |
| Permutations II | O(n!) | O(n) | O(n!) |
| Combination Sum | O(k · n^t) | O(k) | varies |
| N-Queens | O(n^n) | O(n²) | up to n solutions |

### Intervals

| Problem | Time | Space |
|---------|------|-------|
| Merge | O(n log n) | O(n) |
| Insert | O(n) | O(n) |
| Non-overlapping | O(n log n) | O(n) |
| Meeting Rooms | O(n log n) | O(n) |

---

## 🏭 REAL-WORLD APPLICATIONS

| Pattern | Ứng dụng thực tế |
|---------|-------------------|
| Intervals | Calendar scheduling, resource allocation, meeting room booking |
| Backtracking (Subsets) | Power set generation, feature selection |
| Backtracking (Permutations) | Anagram generation, Sudoku solver |
| Backtracking (Combination) | Password cracking (hypothetical), knapsack search |
| Bit Manipulation | Low-level programming, optimizations, set operations |
| Matrix Rotation | Image processing, graphics transformations |
| Sieve of Eratosthenes | Prime generation, cryptography |

---

## ✅ KHI NÀO DÙNG / KHÔNG DÙNG

### Backtracking

**NÊN dùng khi:**
- ✅ Cần tất cả combinations/subsets/permutations
- ✅ Constraint satisfaction problems (N-Queens, Sudoku)
- ✅ Path finding với pruning

**KHÔNG NÊN dùng khi:**
- ❌ Cần optimal solution → **DP** hoặc **Greedy**
- ❌ Output quá lớn (2^n hoặc n! với n lớn)
- ❌ Đếm số cách đơn giản → **Combinatorics formula**

### Intervals

**NÊN dùng khi:**
- ✅ Xử lý ranges, schedules
- ✅ Merge overlapping segments
- ✅ Tìm minimum resources cần thiết

**KHÔNG NÊN dùng khi:**
- ❌ Dữ liệu không phải range-based → Dùng Hash/Map
- ❌ Cần binary search trên ranges → Dùng segment tree

---

## 📋 CHEAT SHEET — Tuần 8

### Backtracking Template

```javascript
function backtrack(choices, path, result) {
  if (isGoal(path)) {
    result.push([...path]);
    return;
  }

  for (const choice of choices) {
    if (isValid(choice)) {
      path.push(choice);       // Make
      backtrack(nextChoices);  // Recurse
      path.pop();              // Undo (BACKTRACK)
    }
  }
}

// For Subsets: backtrack(i+1, path)
// For Permutations: backtrack(path, used)
// For Combinations: backtrack(i, path, sum) - có thể reuse i
```

### Intervals Template

```javascript
// Merge Overlapping Intervals
intervals.sort((a, b) => a.start - b.start);
const merged = [intervals[0]];
for (const interval of intervals.slice(1)) {
  if (interval.start <= merged.at(-1).end) {
    merged.at(-1).end = Math.max(merged.at(-1).end, interval.end);
  } else {
    merged.push(interval);
  }
}

// Insert Interval
// Split: [before], merge with new, [after]
```

### Bit Manipulation Quick Reference

```
n & (n-1)     → Xóa bit 1 thấp nhất
n & (-n)     → Lấy LSB (rightmost bit)
n | (n-1)    → Set tất cả bits từ LSB đến rightmost 1
isPowerOfTwo → n > 0 && (n & (n-1)) === 0
countBits    → while (n) { n &= n-1; count++; }
```

---

## 📝 BÀI TẬP TUẦN NÀY

### Intervals

| # | Bài | LeetCode | Độ khó | Pattern | Status |
|---|-----|----------|--------|---------|--------|
| 1 | Insert Interval | #57 | 🟡 Medium | Interval Merge | ⬜ |
| 2 | Merge Intervals | #56 | 🟡 Medium | Interval Sort + Merge | ⬜ |
| 3 | Non-overlapping Intervals | #435 | 🟡 Medium | Greedy | ⬜ |
| 4 | Meeting Rooms | #252 | 🟡 Medium | Sort | ⬜ |
| 5 | Meeting Rooms II | #253 | 🟡 Medium | Sort / Heap | ⬜ |

### Backtracking

| # | Bài | LeetCode | Độ khó | Pattern | Status |
|---|-----|----------|--------|---------|--------|
| 6 | Subsets | #78 | 🟡 Medium | Backtrack | ⬜ |
| 7 | Combination Sum | #39 | 🟡 Medium | Backtrack | ⬜ |
| 8 | Permutations | #46 | 🟡 Medium | Backtrack + used | ⬜ |
| 9 | Subsets II | #90 | 🟡 Medium | Backtrack + skip dup | ⬜ |
| 10 | Permutations II | #47 | 🟡 Medium | Backtrack + skip dup | ⬜ |
| 11 | Combination Sum II | #40 | 🟡 Medium | Backtrack + skip dup | ⬜ |

### Math

| # | Bài | LeetCode | Độ khó | Pattern | Status |
|---|-----|----------|--------|---------|--------|
| 12 | Power of Two | #231 | 🟢 Easy | Bit Manipulation | ⬜ |
| 13 | Number of 1 Bits | #191 | 🟢 Easy | Bit Manipulation | ⬜ |
| 14 | Count Primes | #204 | 🟡 Medium | Sieve | ⬜ |
| 15 | Rotate Image | #48 | 🟡 Medium | Matrix | ⬜ |

**Hoàn thành:** 0/15 (0%)

---

## 📚 TÀI NGUYÊN

- Video: [NeetCode Intervals](https://www.youtube.com/)
- Video: [NeetCode Backtracking](https://www.youtube.com/)
- Video: [NeetCode Math](https://www.youtube.com/)
- Article: [Backtracking Guide](https://www.geeksforgeeks.org/backtracking-algorithms/)
- Article: [Bit Manipulation](https://www.geeksforgeeks.org/bitwise-algorithms/)
- Article: [Sieve of Eratosthenes](https://www.geeksforgeeks.org/sieve-of-eratosthenes/)
- Visual: [N-Queens Visualization](https://algorithm-visualizer.org/backtracking/n-queens)
