# 🪟 Sliding Window & Binary Search

> **Tuần 3** | **8 bài** | **🟢🟡🟡** | ⏱️ ~1 tuần

---

## 🎯 MỤC TIÊU TUẦN NÀY

- [ ] Nắm vững 2 loại Sliding Window: **Fixed** vs **Dynamic**
- [ ] Hiểu sâu Binary Search: không chỉ tìm giá trị, mà còn tìm **boundary** (vị trí chèn, giá trị nhỏ nhất/lớn nhất thỏa điều kiện)
- [ ] Tối ưu từ O(n·k) → O(n) với Sliding Window
- [ ] Tối ưu từ O(n) → O(log n) với Binary Search

---

## 📖 TỔNG QUAN

### Sliding Window

**Sliding Window** là kỹ thuật dùng một "cửa sổ" **trượt** qua mảng để tính toán trên từng window, thay vì tính lại từ đầu cho mỗi subarray.

```
┌─────────────────────────────────────────────────────────┐
│  Fixed Window Size = 3                                 │
│                                                         │
│  [1, 2, 3, 4, 5, 6, 7]                                │
│   ┌─────┐                                              │
│   │1,2,3│ → sum = 6    (Window 1)                      │
│   └─────┘                                              │
│     ┌─────┐                                             │
│     │2,3,4│ → sum = 9    (Window 2) ← slide by 1      │
│     └─────┘                                             │
│       ┌─────┐                                           │
│       │3,4,5│ → sum = 12   (Window 3)                  │
│       └─────┘                                           │
│         ...                                             │
│                                                         │
│  Thay vì O(n·k) = 7×3 = 21 operations                  │
│  Ta chỉ cần: O(n) = 7 operations (slide thôi)         │
└─────────────────────────────────────────────────────────┘
```

### Hai loại Sliding Window:

#### 1. Fixed Window (Cửa sổ cố định)

- Kích thước window **không đổi** = `k`
- Dùng khi đề bài cho sẵn kích thước window

```
Window size = 3, find max sum:
[1, 2, 3] → sum = 6   → max = 6
  [2, 3, 4] → sum = 9  → max = 9  ✓
    [3, 4, 5] → sum = 12 → max = 12 ✓
      [4, 5, 6] → sum = 15 → max = 15 ✓
        [5, 6, 7] → sum = 18 → max = 18 ✓
```

#### 2. Dynamic Window (Cửa sổ động)

- Kích thước window **thay đổi** dựa trên điều kiện
- Expand khi thỏa điều kiện, shrink khi vi phạm
- **Phổ biến hơn Fixed Window**

```
Longest substring without repeating chars:
"abcabcbb"
  "abc" → valid (expand)
    "abca" → repeat 'a' → shrink left → "bca"
      "bcab" → repeat 'b' → shrink left → "cabc"
        ... → continue

Kết quả: "abc" hoặc "bca" hoặc "cab" = 3
```

### Khi nào dùng Sliding Window?

- ✅ Tìm subarray/substring thỏa điều kiện (max sum, longest length)
- ✅ Đếm số subarrays thỏa điều kiện
- ✅ Fixed size: maximum/minimum/average trong mọi windows
- ✅ Variable size: longest/shortest substring thỏa điều kiện
- ❌ Cần tất cả subarrays (output quá lớn) → Sliding Window không giúp

---

### Binary Search

**Binary Search** tìm kiếm trong mảng **đã sorted** bằng cách chia đôi liên tục phạm vi tìm kiếm.

```
┌──────────────────────────────────────────────────────┐
│  Tìm: 7 trong [1, 3, 5, 7, 9, 11, 13, 15, 17]       │
│                                                      │
│  Step 1: left=0, right=8, mid=4                      │
│          [1, 3, 5, 7, 9, 11, 13, 15, 17]            │
│                    ↑                                 │
│                   mid=7 < target=7? KHÔNG           │
│          → left = mid + 1 = 5                       │
│                                                      │
│  Step 2: left=5, right=8, mid=6                      │
│          [1, 3, 5, 7, 9, 11, 13, 15, 17]            │
│                            ↑                         │
│                         mid=13 > 7                  │
│          → right = mid - 1 = 5                      │
│                                                      │
│  Step 3: left=5, right=5, mid=5                    │
│          [1, 3, 5, 7, 9, 11, 13, 15, 17]            │
│                  ↑                                   │
│               mid=9 > 7                              │
│          → right = mid - 1 = 4                      │
│                                                      │
│  Step 4: left=5 > right=4 → STOP → NOT FOUND       │
│                                                      │
│  Độ phức tạp: O(log n) = log₂(9) ≈ 4 steps ✓       │
└──────────────────────────────────────────────────────┘
```

### Các biến thể Binary Search:

Binary Search không chỉ tìm **giá trị** — nó còn tìm **vị trí chèn**, **boundary** (ranh giới thỏa điều kiện).

#### Template 1: Standard — Tìm giá trị chính xác

```javascript
function binarySearch(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {           // ⚠️ Dấu <= (not <)
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;  // Not found
}
```

#### Template 2: Leftmost Boundary — Tìm vị trí ĐẦU TIÊN ≥ target

```javascript
// Áp dụng: "first position where...", "lower bound"
// Ví dụ: [1,2,2,2,3] target=2 → return 1
function lowerBound(nums, target) {
  let left = 0;
  let right = nums.length;  // ⚠️ = length (not -1)

  while (left < right) {    // ⚠️ Dấu < (not <=)
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid;          // ⚠️ Không -1
    }
  }

  return left;  // left = right = first ≥ target
}
```

#### Template 3: Rightmost Boundary — Tìm vị trí CUỐI CÙNG ≤ target

```javascript
// Áp dụng: "last position where...", "upper bound"
// Ví dụ: [1,2,2,2,3] target=2 → return 3
function upperBound(nums, target) {
  let left = 0;
  let right = nums.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] <= target) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return left - 1;  // last ≤ target
}
```

### Visual: Left Bound vs Right Bound vs Standard

```
Array:    [1,  2,  2,  2,  3,  5,  7,  9]
Index:      0   1   2   3   4   5   6   7

Target = 2

Standard Binary Search:  return 1, 2, or 3 (any match)
Lower Bound (first ≥):   return 1  ↑
Upper Bound (last ≤):    return 3  ↑
```

### Khi nào dùng Binary Search?

- ✅ Mảng **đã sorted** (hoặc có thể sort được)
- ✅ Tìm giá trị cụ thể
- ✅ Tìm vị trí chèn (insertion point)
- ✅ Tìm giá trị nhỏ nhất/lớn nhất thỏa điều kiện (answer = "minimum speed to finish in H hours")
- ❌ Unsorted data mà không thể sort → Hash Table thay thế

---

## 🔄 PATTERNS CỐT LÕI

### Pattern 1: Fixed Sliding Window — Max Sum Subarray

**🤔 Tư duy:** Window có kích thước cố định `k` trượt từ trái sang phải. Tại mỗi step, ta bỏ phần tử rời khỏi window (bên trái) và thêm phần tử mới vào (bên phải). Sum mới = Sum cũ − phần tử rời + phần tử mới. Không cần tính lại tổng từ đầu mỗi window.

**🔍 Dùng khi:**
- Đề bài cho kích thước window cố định `k`
- Tìm maximum/minimum/average sum của mọi subarray k elements
- Đề bài hỏi "maximum subarray of size k", "longest substring with at most k distinct characters" (k cố định)
- Network packet processing, moving average

**📝 Tại sao O(n) thay vì O(n·k):** Brute force tính sum mỗi window từ đầu → O(k) cho mỗi window × O(n) windows = O(n·k). Sliding window chỉ cần 2 phép toán: `-arr[left]` và `+arr[right]` → O(1) cho mỗi slide × O(n) slides = O(n). Mỗi phần tử được cộng/trừ đúng 1 lần.

**💻 Code mẫu:**

```javascript
// ❌ Brute Force: O(n·k)
function maxSumSubarrayBrute(arr, k) {
  let maxSum = -Infinity;
  for (let i = 0; i <= arr.length - k; i++) {
    let sum = 0;
    for (let j = i; j < i + k; j++) {
      sum += arr[j];
    }
    maxSum = Math.max(maxSum, sum);
  }
  return maxSum;
}

// ✅ Sliding Window: O(n)
function maxSumSubarray(arr, k) {
  let windowSum = 0;

  // 1. Tính sum của window đầu tiên
  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }
  let maxSum = windowSum;

  // 2. Slide window: bỏ trái, thêm phải
  for (let i = k; i < arr.length; i++) {
    windowSum = windowSum - arr[i - k] + arr[i];
    maxSum = Math.max(maxSum, windowSum);
  }

  return maxSum;
}
```

**🔍 Visual — Trace với `arr = [2, 1, 5, 1, 3, 2]`, `k = 3`:**

```
arr: [2,  1,  5,  1,  3,  2]
      ─────────
       window 1: sum = 2+1+5 = 8     max = 8
            ─────────
             window 2: sum = 8-2+1 = 7   max = 8
                  ─────────
                   window 3: sum = 7-1+3 = 9   max = 9 ✓
                        ─────────
                         window 4: sum = 9-5+2 = 6   max = 9

Step-by-step:
  Step 0: sum first k elements = 2+1+5 = 8
  Step 1: i=3 → sum = 8 - arr[0] + arr[3] = 8 - 2 + 1 = 7
  Step 2: i=4 → sum = 7 - arr[1] + arr[4] = 7 - 1 + 3 = 9  ← NEW MAX
  Step 3: i=5 → sum = 9 - arr[2] + arr[5] = 9 - 5 + 2 = 6

Answer: 9 (window [5, 1, 3])
```

---

### Pattern 2: Dynamic Sliding Window — Longest Substring

**🤔 Tư duy:** Window mở rộng (right tăng) cho đến khi gặp điều kiện vi phạm (ví dụ: duplicate character). Khi vi phạm, thu nhỏ window từ bên trái (left tăng) cho đến khi điều kiện hợp lệ trở lại. Window **động** — không có kích thước cố định, tự điều chỉnh.

**🔍 Dùng khi:**
- Đề bài hỏi longest substring/subarray **thỏa điều kiện** (không có kích thước cho trước)
- "Longest substring without repeating characters"
- "Minimum window substring" (tìm window nhỏ nhất thỏa điều kiện)
- Expand khi thỏa → shrink khi vi phạm

**📝 Tại sao O(n):** Mỗi phần tử được `right` duyệt đúng 1 lần (O(n)). Left chỉ di chuyển tổng cộng tối đa n lần trong toàn bộ quá trình (không có nested loop cả hai cùng duyệt O(n²)). Tổng = O(n) + O(n) = O(n).

**💻 Code mẫu:**

```javascript
// ✅ Dynamic Sliding Window: O(n)
function lengthOfLongestSubstring(s) {
  const set = new Set();
  let left = 0;
  let maxLen = 0;

  for (let right = 0; right < s.length; right++) {
    // Expand: thêm s[right] vào window
    while (set.has(s[right])) {
      // Shrink: remove s[left] cho đến khi không trùng
      set.delete(s[left]);
      left++;
    }
    set.add(s[right]);
    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}
```

**🔍 Visual — Trace với `s = "abcabcbb"`:**

```
Step  right  char   Action              Set               len  max
──────────────────────────────────────────────────────────────────
init    0      a     add                 {a}               1    1
  1     1      b     add                 {a,b}             2    2
  2     2      c     add                 {a,b,c}           3    3
  3     3      a     dup! shrink         delete 'a'        2    3
                  shrink←'a' gone→      {b,c}             2    3
  4     4      b     dup! shrink         delete 'b'        1    3
                  shrink←'b' gone→      {c}               1    3
  5     5      c     dup! shrink         delete 'c'        0    3
                  shrink←'c' gone→      {}                0    3
  6     6      b     add                 {b}               1    3
  7     7      b     dup! shrink         delete 'b'        0    3
                  shrink←'b' gone→      {}                0    3

Window states at key steps:
  "abc" (len=3) → "abca" duplicate 'a' → shrink to "bca" (len=3)
  "bca" (len=3) → "bcab" duplicate 'b' → shrink to "cab" (len=3)

Answer: 3 ("abc" or "bca" or "cab")
```

---

### Pattern 3: Binary Search — Tìm giá trị nhỏ nhất thỏa điều kiện

**🤔 Tư duy:** Binary search không chỉ tìm **giá trị**, mà còn tìm **boundary** (ranh giới). Bài toán dạng "minimum X such that..." → tìm giá trị nhỏ nhất thỏa điều kiện. Hàm `can(mid)` phải là **monotonic** (nếu true cho X thì true cho mọi Y ≥ X).

**🔍 Dùng khi:**
- Đề bài hỏi "minimum/maximum X such that..."
- "Find the minimum speed to finish in H hours"
- "Find the smallest divisor such that sum ≤ threshold"
- Tìm giá trị nhỏ nhất/lớn nhất thỏa điều kiện (not the exact value)

**📝 Tại sao nó hoạt động:** Nếu một giá trị `mid` thỏa điều kiện, thì mọi giá trị **lớn hơn** `mid` cũng thỏa (monotonic). Ngược lại, nếu `mid` không thỏa, mọi giá trị **nhỏ hơn** cũng không thỏa. Vậy ta có thể loại bỏ nửa không thỏa qua mỗi bước → O(log range).

**💻 Code mẫu:**

```javascript
// LeetCode 875: Koko Eating Bananas — Tìm minimum speed K để ăn hết trong H giờ
function minEatingSpeed(piles, H) {
  let left = 1;
  let right = Math.max(...piles);  // max possible speed
  let result = right;

  while (left <= right) {
    const speed = Math.floor((left + right) / 2);
    let hours = 0;

    for (const pile of piles) {
      hours += Math.ceil(pile / speed);
    }

    if (hours <= H) {
      // Ăn kịp → thử speed nhỏ hơn
      result = speed;
      right = speed - 1;
    } else {
      // Không kịp → cần speed lớn hơn
      left = speed + 1;
    }
  }

  return result;
}
```

**🔍 Visual — Trace với `piles = [3, 6, 7, 11]`, `H = 8`:**

```
Range: [1, 11]

Binary Search Trace:
┌──────────────────────────────────────────────────────────┐
│ Step │  left  │  right  │  mid  │  Hours  │  Decision     │
├──────────────────────────────────────────────────────────┤
│  1   │    1   │   11    │   6   │  1+1+2+2=6 │ ≤8 → right=5 │
│  2   │    1   │    5    │   3   │  1+2+3+4=10│ >8 → left=4 │
│  3   │    4   │    5    │   4   │  1+2+2+3=8 │ ≤8 → result=4, right=3 │
│  4   │    4   │    3    │  STOP │    left > right          │
└──────────────────────────────────────────────────────────┘

can(mid) monotonic: nếu speed=4 kịp → speed=5,6,7... cũng kịp
Result: 4 (kiểm tra: ceil(3/4)+ceil(6/4)+ceil(7/4)+ceil(11/4) = 1+2+2+3 = 8 ✓)
```

---

### Pattern 4: Binary Search — Rotated Sorted Array

**🤔 Tư duy:** Rotated sorted array là mảng đã sorted rồi rotated. Nó có tính chất: **luôn có một nửa sorted** tại mỗi bước. Tại mỗi bước, ta xác định nửa nào đang sorted, rồi kiểm tra target có nằm trong nửa sorted đó không để thu hẹp phạm vi.

**🔍 Dùng khi:**
- Đề bài hỏi "search in rotated sorted array"
- Mảng ban đầu sorted, đã rotated đi một số vị trí
- Tìm min/max trong rotated array
- Đề bài có từ khóa "sorted but rotated"

**📝 Tại sao nó hoạt động:** Trong mảng `[4, 5, 6, 7, 0, 1, 2]`, tại mỗi mid, ta có thể xác định: nếu `nums[left] ≤ nums[mid]` thì nửa trái [left..mid] sorted; ngược lại nửa phải [mid..right] sorted. Vì sorted half có rõ ràng boundary, ta có thể quyết định chắc chắn target nằm ở đâu.

**💻 Code mẫu:**

```javascript
// LeetCode 33: Search in Rotated Sorted Array
function search(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] === target) return mid;

    // Xác định nửa nào sorted
    if (nums[left] <= nums[mid]) {
      // Nửa trái [left..mid] sorted
      if (nums[left] <= target && target < nums[mid]) {
        right = mid - 1;  // target trong nửa trái
      } else {
        left = mid + 1;   // target trong nửa phải
      }
    } else {
      // Nửa phải [mid..right] sorted
      if (nums[mid] < target && target <= nums[right]) {
        left = mid + 1;   // target trong nửa phải
      } else {
        right = mid - 1;  // target trong nửa trái
      }
    }
  }

  return -1;
}
```

**🔍 Visual — Trace với `nums = [4, 5, 6, 7, 0, 1, 2]`, `target = 0`:**

```
Original: [0, 1, 2, 4, 5, 6, 7]
Rotated:  [4, 5, 6, 7, 0, 1, 2]

Step 1: left=0, right=6, mid=3
        ┌──────────────────────────────────────────┐
        │  [4, 5, 6, 7, 0, 1, 2]               │
        │   ↑         ↑         ↑                  │
        │ left=0   mid=3     right=6               │
        │ nums[left]=4 ≤ nums[mid]=7 → LEFT sorted │
        │ 4 ≤ 0? NO → target không trong [4,5,6,7]│
        │ → left = 4                                │
        └──────────────────────────────────────────┘

Step 2: left=4, right=6, mid=5
        ┌──────────────────────────────────────────┐
        │  [4, 5, 6, 7, 0, 1, 2]               │
        │               ↑     ↑   ↑               │
        │            left=4  mid=5 right=6        │
        │ nums[left]=0 ≤ nums[mid]=1 → LEFT sorted│
        │ 0 ≤ 0? YES, và 0 < 1? YES              │
        │ → target trong [0,1] → right = 4        │
        └──────────────────────────────────────────┘

Step 3: left=4, right=4, mid=4
        nums[4] = 0 = target → FOUND! ✓ (return 4)
```

---

### Pattern 5: Tại sao Sliding Window O(n)?

**🤔 Tư duy:** Sliding Window đạt O(n) vì **mỗi phần tử** được duyệt **tối đa 2 lần**: 1 lần bởi `right` (expand) và tối đa 1 lần bởi `left` (shrink). `left` không bao giờ quay lại phía sau. Tổng số operations = O(n) + O(n) = O(n).

**📝 Phân biệt O(n·k) vs O(n):**

```
BRUTE FORCE: O(n·k)
  for each starting position i:
    for each ending position j:
      compute sum of arr[i..j]

  = n windows × k operations per window
  = n × k operations

SLIDING WINDOW: O(n)
  right trượt từ 0 → n-1: n steps
  left trượt từ 0 → n-1: ≤ n steps
  = 2n steps = O(n)

  Key insight: KHÔNG có nested loop duyệt cùng lúc
  Trong lúc right di chuyển, left chỉ di chuyển thôi
```

**📝 Checklist — Fixed vs Dynamic Sliding Window:**

| Tiêu chí | Fixed Window | Dynamic Window |
|-----------|-------------|---------------|
| Kích thước cho trước? | ✅ Có (`k` cố định) | ❌ Không |
| Điều kiện dừng | `right - left + 1 === k` | `!isValid(window)` |
| Shrink khi nào | Sau mỗi slide (đủ k) | Khi điều kiện vi phạm |
| Expand | Luôn +1 mỗi step | Tùy điều kiện |
| Template chính | `sum - arr[left++] + arr[right++]` | `while (!valid) { delete arr[left++] }` |

**📝 Checklist — Khi nào dùng Binary Search biến thể nào?**

| Đề bài hỏi | Template | Key |
|-----------|----------|-----|
| Tìm giá trị `x` chính xác | Standard `while (l ≤ r)` | Return mid |
| First position ≥ target | Left Bound `while (l < r)` | `r = mid` |
| Last position ≤ target | Right Bound `while (l < r)` | `l = mid + 1` |
| Minimum X such that can() | BS on Answer `while (l < r)` | `can(mid) → r = mid` |
| Maximum X such that can() | BS on Answer `while (l < r)` | `can(mid) → l = mid + 1` |
| Rotated array tìm min | Compare with right | `l < r`, `r = mid` |
| Rotated array tìm target | Check sorted half | `l ≤ r`, xác định half |

```javascript
// ❌ Brute Force: O(n·k)
function maxSumSubarrayBrute(arr, k) {
  let maxSum = -Infinity;
  for (let i = 0; i <= arr.length - k; i++) {
    let sum = 0;
    for (let j = i; j < i + k; j++) {
      sum += arr[j];
    }
    maxSum = Math.max(maxSum, sum);
  }
  return maxSum;
}

// ✅ Sliding Window: O(n)
function maxSumSubarray(arr, k) {
  let windowSum = 0;

  // 1. Tính sum của window đầu tiên
  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }
  let maxSum = windowSum;

  // 2. Slide window: bỏ trái, thêm phải
  for (let i = k; i < arr.length; i++) {
    windowSum = windowSum - arr[i - k] + arr[i];
    maxSum = Math.max(maxSum, windowSum);
  }

  return maxSum;
}
```

**Visual — Fixed Sliding Window:**
```
arr = [2, 1, 5, 1, 3, 2], k = 3

Window 1: [2, 1, 5] → sum = 8    max = 8
           ↑
          left=0, right=2

Window 2: [1, 5, 1] → sum = 7    max = 8  (slide: -2, +1)
           ↑           ↑
          left=1      right=3

Window 3: [5, 1, 3] → sum = 9    max = 9  (slide: -1, +3)
           ↑           ↑
          left=2      right=4

Window 4: [1, 3, 2] → sum = 6    max = 9  (slide: -5, +2)
           ↑           ↑
          left=3      right=5

Answer: 9
```

---

### Pattern 2: Dynamic Sliding Window — Longest Substring

**Dùng khi:** Tìm longest substring không có ký tự lặp lại.

```javascript
// ❌ Brute Force: O(n²) hoặc O(n³)
function lengthOfLongestSubstringBrute(s) {
  let maxLen = 0;
  for (let i = 0; i < s.length; i++) {
    const seen = new Set();
    for (let j = i; j < s.length; j++) {
      if (seen.has(s[j])) break;
      seen.add(s[j]);
      maxLen = Math.max(maxLen, j - i + 1);
    }
  }
  return maxLen;
}

// ✅ Dynamic Sliding Window: O(n)
function lengthOfLongestSubstring(s) {
  const set = new Set();
  let left = 0;
  let maxLen = 0;

  for (let right = 0; right < s.length; right++) {
    // Expand: thêm s[right] vào window
    while (set.has(s[right])) {
      // Shrink: remove s[left] cho đến khi không trùng
      set.delete(s[left]);
      left++;
    }
    set.add(s[right]);
    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}
```

**Visual — Dynamic Sliding Window:**
```
s = "abcabcbb", tìm longest substring không lặp

Step 1: right=0, 'a' → set={a}, len=1, max=1
Step 2: right=1, 'b' → set={a,b}, len=2, max=2
Step 3: right=2, 'c' → set={a,b,c}, len=3, max=3
Step 4: right=3, 'a' → 'a' đã có!
         → set.delete('a'), left=1 → set={b,c}
         → set.delete('b'), left=2 → set={c}
         → set.delete('c'), left=3 → set={}
         → set.add('a') → set={a}, len=1, max=3
Step 5: right=4, 'b' → 'b' đã có!
         → shrink: left=3→4, set={b}
         → set.add('b') → set={b}, len=1, max=3
Step 6: right=5, 'c' → set={b,c}, len=2, max=3
Step 7: right=6, 'b' → 'b' đã có!
         → shrink: left=4→5, set={c}
         → set.add('b') → set={c,b}, len=2, max=3
Step 8: right=7, 'b' → 'b' đã có!
         → shrink: left=5→6, set={b}
         → set.add('b') → set={b}, len=2, max=3

Answer: 3 ("abc")
```

---

### Pattern 3: Binary Search — Tìm giá trị nhỏ nhất thỏa điều kiện

**Dùng khi:** Đề bài hỏi "minimum X such that..." hoặc "maximum X such that..."

```javascript
// LeetCode 875: Koko Eating Bananas
// Tìm minimum eating speed K sao cho ăn hết trong H hours

// ❌ Brute Force: thử từ 1 → max speed → O(n·maxP)
function minEatingSpeedBrute(piles, H) {
  for (let speed = 1; speed <= Math.max(...piles); speed++) {
    let hours = 0;
    for (const pile of piles) {
      hours += Math.ceil(pile / speed);
    }
    if (hours <= H) return speed;
  }
}

// ✅ Binary Search: O(n · log(maxP))
function minEatingSpeed(piles, H) {
  let left = 1;
  let right = Math.max(...piles);  // max possible speed
  let result = right;

  while (left <= right) {
    const speed = Math.floor((left + right) / 2);
    let hours = 0;

    for (const pile of piles) {
      hours += Math.ceil(pile / speed);
    }

    if (hours <= H) {
      // Có thể ăn trong H giờ → thử speed nhỏ hơn
      result = speed;
      right = speed - 1;
    } else {
      // Không kịp ăn → cần speed lớn hơn
      left = speed + 1;
    }
  }

  return result;
}
```

**Visual — Binary Search cho Min Speed:**
```
piles = [3, 6, 7, 11], H = 8

Speed range: [1, 11]

mid = 6: hours = ceil(3/6)+ceil(6/6)+ceil(7/6)+ceil(11/6) = 1+1+2+2 = 6
         6 ≤ 8 → speed có thể → try smaller → right = 5

mid = 3: hours = 1+2+3+4 = 10
         10 > 8 → cần speed lớn hơn → left = 4

mid = 4: hours = 1+2+2+3 = 8
         8 ≤ 8 → speed OK → result=4, right = 3

mid = (1+3)/2 = 2: hours = 2+3+4+6 = 15
         15 > 8 → left = 3

mid = (3+3)/2 = 3: hours = 1+2+3+4 = 10
         10 > 8 → left = 4

left=4 > right=3 → STOP
Result: 4

Kiểm tra: ceil(3/4)+ceil(6/4)+ceil(7/4)+ceil(11/4) = 1+2+2+3 = 8 ✓
```

---

### Pattern 4: Binary Search — Rotated Sorted Array

**Dùng khi:** Tìm kiếm trong rotated sorted array (đã rotated nhưng 2 nửa vẫn sorted).

```javascript
// LeetCode 33: Search in Rotated Sorted Array
// Mảng đã rotated: [4,5,6,7,0,1,2], tìm target

// ✅ Binary Search: O(log n)
function search(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] === target) {
      return mid;
    }

    // Xác định nửa nào sorted
    if (nums[left] <= nums[mid]) {
      // Nửa trái [left..mid] sorted
      if (nums[left] <= target && target < nums[mid]) {
        right = mid - 1;  // target trong nửa trái
      } else {
        left = mid + 1;   // target trong nửa phải
      }
    } else {
      // Nửa phải [mid..right] sorted
      if (nums[mid] < target && target <= nums[right]) {
        left = mid + 1;   // target trong nửa phải
      } else {
        right = mid - 1;  // target trong nửa trái
      }
    }
  }

  return -1;
}
```

**Visual — Rotated Array Search:**
```
nums = [4, 5, 6, 7, 0, 1, 2], target = 0

Original: [0, 1, 2, 4, 5, 6, 7]
Rotated:  [4, 5, 6, 7, 0, 1, 2]
                 ↑
              pivot

Step 1: left=0, right=6, mid=3
        nums[left]=4, nums[mid]=7, left ≤ mid?
          → Left half [4,5,6,7] sorted
          → 4 ≤ 0? NO → target không trong [4,5,6,7]
          → left = 4

Step 2: left=4, right=6, mid=5
        nums[left]=0, nums[mid]=1, left ≤ mid?
          → Left half [0,1] sorted
          → 0 ≤ 0? YES, và 0 < 1?
          → target trong [0,1] → right = 4

Step 3: left=4, right=4, mid=4
        nums[4] = 0 = target → FOUND! ✓
```

---

## ⚠️ COMMON PITFALLS (Lỗi hay mắc)

### ❌ Pitfall 1: Sliding Window - nhầm giữa fixed và dynamic

```javascript
// ❌ Sai cho dynamic window - không shrink
function longestSubstringWrong(s) {
  const set = new Set();
  let maxLen = 0;
  for (let i = 0; i < s.length; i++) {
    set.add(s[i]);           // Chỉ expand, không shrink!
    maxLen = Math.max(maxLen, set.size);
  }
  return maxLen;             // Sai! Đếm cả duplicates trong set
}

// ✅ Đúng - có shrink loop
function longestSubstring(s) {
  const set = new Set();
  let left = 0, maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    while (set.has(s[right])) {  // ← SHRINK cho đến khi không duplicate
      set.delete(s[left]);
      left++;
    }
    set.add(s[right]);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}
```

### ❌ Pitfall 2: Binary Search - dùng `<=` hoặc `<` sai chỗ

```javascript
// ❌ Sai: dùng < thay vì <= cho standard search
while (left < right) {  // ❌ Sẽ miss trường hợp left == right == target
  // ...
}
return -1;  // Có thể miss target ở giữa

// ✅ Đúng cho standard:
while (left <= right) {  // ← <=
// ...
}

// ⚠️ NHỚ: Lower/Upper bound dùng <, nhưng standard dùng <=
```

### ❌ Pitfall 3: Binary Search - left/right update sai

```javascript
// ❌ Sai: left = mid thay vì mid+1 (infinite loop!)
while (left <= right) {
  const mid = Math.floor((left + right) / 2);
  if (nums[mid] < target) {
    left = mid;   // ❌ left không thay đổi → infinite loop!
  } else {
    right = mid;  // ❌
  }
}

// ✅ Đúng: +1/-1 để thu hẹp range
if (nums[mid] < target) {
  left = mid + 1;
} else {
  right = mid - 1;
}
```

### ❌ Pitfall 4: Binary Search - Overflow khi tính mid

```javascript
// ❌ Có thể overflow trong Java (không phải JS nhưng nên tránh)
const mid = (left + right) / 2;        // left + right có thể overflow int

// ✅ An toàn hơn:
const mid = Math.floor(left + (right - left) / 2);
// Hoặc trong Java: int mid = left + (right - left) / 2;
```

### ❌ Pitfall 5: Sliding Window - quên handle empty/window size > n

```javascript
// ❌ Chưa xử lý edge cases
function maxSumSubarray(arr, k) {
  // arr = [], k = 3 → crash
  // arr = [1], k = 3 → không có window nào
}

// ✅ Xử lý edge cases
function maxSumSubarray(arr, k) {
  if (arr.length < k) return Math.max(...arr);  // Edge case

  let windowSum = 0;
  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }
  // ...
}
```

---

## 💡 TIPS & TRICKS

### 1. Nhận biết nhanh Sliding Window

```
Từ khóa trong đề bài:
  ✅ "subarray" / "substring"
  ✅ "at most k..." / "at least k..."
  ✅ "maximum / minimum / longest / shortest"
  ✅ "distinct characters"
  ✅ "average" / "sum" trong window
```

### 2. Nhận biết nhanh Binary Search

```
Đặc điểm:
  ✅ Mảng sorted (hoặc có thể sort)
  ✅ Hỏi: "minimum X such that..." → BS cho min
  ✅ Hỏi: "maximum X such that..." → BS cho max
  ✅ Tìm insertion point
  ✅ Rotated sorted array
  ✅ Độ phức tạp O(log n) được yêu cầu

  ⚠️ "Search 2D Matrix": dùng BS 2 lần HOẶC binary search 1 lần với index
```

### 3. Sliding Window - đổi ký tự tối thiểu

```javascript
// LeetCode 424: Longest Repeating Character Replacement
// Tìm longest substring sau khi thay đổi tối đa k ký tự

function characterReplacement(s, k) {
  const count = new Array(26).fill(0);
  let left = 0;
  let maxCount = 0;  // Số lần xuất hiện nhiều nhất của 1 char trong window
  let result = 0;

  for (let right = 0; right < s.length; right++) {
    const idx = s.charCodeAt(right) - 65;
    count[idx]++;
    maxCount = Math.max(maxCount, count[idx]);

    // Window có thể valid nếu:
    // (window size - maxCount) ≤ k
    // tức: right - left + 1 - maxCount ≤ k
    while (right - left + 1 - maxCount > k) {
      const leftIdx = s.charCodeAt(left) - 65;
      count[leftIdx]--;
      left++;
      // maxCount không cần update ở đây (optimization)
    }

    result = Math.max(result, right - left + 1);
  }

  return result;
}
```

### 4. Binary Search 2D Matrix

```javascript
// LeetCode 74: Search 2D Matrix
// Mỗi row sorted, và row[i+1][0] > row[i][last]

// Cách 1: Two binary searches O(log(m) + log(n))
function searchMatrix(matrix, target) {
  let row = -1;
  // Binary search để tìm row
  for (let i = 0; i < matrix.length - 1; i++) {
    if (matrix[i][0] <= target && target < matrix[i + 1][0]) {
      row = i;
      break;
    }
  }
  if (row === -1) row = matrix.length - 1;

  // Binary search trong row
  let left = 0, right = matrix[row].length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (matrix[row][mid] === target) return true;
    if (matrix[row][mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return false;
}

// Cách 2: Binary search trên toàn bộ matrix O(log(mn))
function searchMatrix(matrix, target) {
  const m = matrix.length, n = matrix[0].length;
  let left = 0, right = m * n - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const val = matrix[Math.floor(mid / n)][mid % n];

    if (val === target) return true;
    if (val < target) left = mid + 1;
    else right = mid - 1;
  }
  return false;
}
```

### 5. Mẹo Binary Search cho Find Min in Rotated Array

```javascript
// LeetCode 153: Find Minimum in Rotated Sorted Array
function findMin(nums) {
  let left = 0, right = nums.length - 1;

  while (left < right) {  // < (không <=)
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] > nums[right]) {
      // Min ở bên phải
      left = mid + 1;
    } else {
      // Min ở bên trái (bao gồm mid)
      right = mid;
    }
  }

  return nums[left];  // left == right == minimum
}
```

---

## 🔍 BRUTE FORCE → OPTIMAL

### Sliding Window

| Bài | Brute Force | Optimal | Cải thiện |
|-----|-------------|---------|-----------|
| Max Average Subarray | O(n·k) | O(n) fixed window | ✅ |
| Max Vowels Substring | O(n²) | O(n) dynamic | ✅ |
| Longest Subarray 1's | O(n²) | O(n) dynamic | ✅ |

### Binary Search

| Bài | Brute Force | Optimal | Key insight |
|-----|-------------|---------|-------------|
| Binary Search | O(n) linear | **O(log n)** | Chia đôi liên tục |
| Search 2D Matrix | O(m·n) | **O(log(m·n))** | Treat as 1D array |
| Koko Eating Bananas | O(n·maxP) | **O(n·log(maxP))** | Min speed → BS |
| Find Min Rotated | O(n) | **O(log n)** | Compare with right |
| Search Rotated | O(n) | **O(log n)** | Check which half sorted |

---

## ⏱️ TIME & SPACE COMPLEXITY TỔNG HỢP

### Sliding Window

| Type | Time | Space | Ví dụ |
|------|------|-------|-------|
| Fixed Window | O(n) | O(1) | Max sum subarray |
| Dynamic Window | O(n) | O(k) or O(charset) | Longest distinct substring |
| Dynamic + Map | O(n) | O(n) worst | Longest k-repeating |

*Sliding window luôn O(n) cho duyệt 1 lần qua array*

### Binary Search Templates

| Template | Condition | Use case |
|----------|-----------|----------|
| Standard | `left <= right` | Tìm giá trị |
| Left Bound | `left < right`, `right = mid` | First ≥ target |
| Right Bound | `left < right`, `left = mid + 1` | Last ≤ target |
| For answer | Binary search on **range**, check **feasibility** | Min/Max X such that... |

---

## 🏭 REAL-WORLD APPLICATIONS

| Pattern | Ứng dụng thực tế |
|---------|-------------------|
| Sliding Window (Fixed) | Moving average trong tài chính, signal processing |
| Sliding Window (Dynamic) | Text editor autocomplete, DNA sequence matching |
| Binary Search | Database indexing, version control (git bisect), resource allocation |
| BS cho Min/Max | Minimum speed scheduling, optimal resource allocation |

---

## ✅ KHI NÀO DÙNG / KHÔNG DÙNG

### Sliding Window

**NÊN dùng khi:**
- ✅ Tìm subarray/substring thỏa điều kiện
- ✅ Đề bài hỏi longest/shortest/maximum/minimum của subarray
- ✅ Cần O(n) thay vì O(n²)

**KHÔNG NÊN dùng khi:**
- ❌ Cần tất cả subarrays (output = O(n²)) → không thể rút gọn
- ❌ Mảng không có thứ tự và cần giữ original order (window không shrink được)

### Binary Search

**NÊN dùng khi:**
- ✅ Mảng sorted
- ✅ Hỏi min/max value thỏa điều kiện ("minimum X such that...")
- ✅ Tìm insertion point
- ✅ Độ phức tạp O(log n) được yêu cầu/mong muốn

**KHÔNG NÊN dùng khi:**
- ❌ Mảng unsorted và không thể sort
- ❌ Cần tất cả occurrences (không phải first/last)
- ❌ Nhiều insertions/deletes → BST tốt hơn

---

## 📋 CHEAT SHEET — Tuần 3

### Sliding Window Templates

```javascript
// Fixed Window
function fixedWindow(arr, k) {
  let sum = 0;
  for (let i = 0; i < k; i++) sum += arr[i];
  let max = sum;
  for (let i = k; i < arr.length; i++) {
    sum = sum - arr[i - k] + arr[i];
    max = Math.max(max, sum);
  }
  return max;
}

// Dynamic Window
function dynamicWindow(s) {
  const set = new Set();
  let left = 0, maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    while (set.has(s[right])) {
      set.delete(s[left++]);
    }
    set.add(s[right]);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}
```

### Binary Search Templates

```javascript
// Standard
while (left <= right) {
  const mid = left + Math.floor((right - left) / 2);
  if (nums[mid] === target) return mid;
  if (nums[mid] < target) left = mid + 1;
  else right = mid - 1;
}

// Lower Bound
while (left < right) {
  const mid = left + Math.floor((right - left) / 2);
  if (nums[mid] < target) left = mid + 1;
  else right = mid;
}
return left;

// Binary Search on Answer (Monotonic function)
while (left < right) {
  const mid = left + Math.floor((right - left) / 2);
  if (can(mid)) right = mid;    // can(mid) = có thể với giá trị mid
  else left = mid + 1;
}
return left;
```

### Quick Decision Tree

```
Bài toán với array
    │
    ├── "sorted" có trong đề?
    │     │
    │     ├── Tìm giá trị cụ thể? ──→ Binary Search (Standard)
    │     │
    │     ├── Tìm min/max thỏa điều kiện? ──→ Binary Search on Answer
    │     │
    │     └── Rotated array? ──→ Binary Search (check sorted half)
    │         (Tìm giá trị) ──→ Standard BS
    │         (Tìm min) ──→ Compare with right
    │
    └── Cần subarray/substring?
          │
          ├── Kích thước CỐ ĐỊNH? ──→ Fixed Window
          │     (slide: -left + right)
          │
          └── Kích thước THAY ĐỔI? ──→ Dynamic Window
                (while condition violated: shrink left)
```

---

## 📝 BÀI TẬP TUẦN NÀY

| # | Bài | LeetCode | Độ khó | Pattern | Status |
|---|-----|----------|--------|---------|--------|
| 1 | Binary Search | #704 | 🟢 Easy | Binary Search | ⬜ |
| 2 | Search a 2D Matrix | #74 | 🟡 Medium | Binary Search | ⬜ |
| 3 | Koko Eating Bananas | #875 | 🟡 Medium | Binary Search on Answer | ⬜ |
| 4 | Find Minimum in Rotated Sorted Array | #153 | 🟡 Medium | Binary Search | ⬜ |
| 5 | Search in Rotated Sorted Array | #33 | 🟡 Medium | Binary Search | ⬜ |
| 6 | Maximum Average Subarray I | #643 | 🟢 Easy | Fixed Sliding Window | ⬜ |
| 7 | Maximum Number of Vowels in Substring | #1456 | 🟡 Medium | Dynamic Sliding Window | ⬜ |
| 8 | Longest Subarray of 1's After Deleting One Element | #1493 | 🟡 Medium | Dynamic Sliding Window | ⬜ |

**Hoàn thành:** 0/8 (0%)

---

## 📚 TÀI NGUYÊN

- Video: [NeetCode Sliding Window](https://www.youtube.com/)
- Video: [NeetCode Binary Search](https://www.youtube.com/)
- Article: [Binary Search Guide](https://www.geeksforgeeks.org/binary-search/)
- Visual: [Sliding Window Visualization](https://visualgo.net/en/slidingwindow)
- Article: [Monotonic Stack/Queue](https://medium.com/@timpark1207/the-sliding-window-algorithm-fa9d8f6019b2)
