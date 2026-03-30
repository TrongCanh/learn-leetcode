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

**Dùng khi:** Gộp các overlapping intervals.

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
