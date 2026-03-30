# 📈 Dynamic Programming

> **Tuần 6** | **11 bài** | **🟢🟡🔴** | ⏱️ ~1.5 tuần

---

## 🎯 MỤC TIÊU TUẦN NÀY

- [ ] Hiểu sâu 2 cách tiếp cận DP: **Top-Down (Memoization)** vs **Bottom-Up (Tabulation)**
- [ ] Nắm vững 4 DP patterns chính: **1D**, **2D Grid**, **Knapsack**, **Subsequence**
- [ ] Biết cách identify bài toán DP và xác định **State**, **Transition**, **Base case**
- [ ] Thành thạo **Space Optimization** — giảm từ O(n) space xuống O(1)

---

## 📖 TỔNG QUAN

### Dynamic Programming là gì?

**DP** là kỹ thuật giải bài toán bằng cách:
1. **Chia nhỏ** bài toán thành bài toán con (overlapping subproblems)
2. **Lưu kết quả** của bài toán con (memoization)
3. **Tái sử dụng** kết quả đã tính

```
┌─────────────────────────────────────────────────────────┐
│  Fibonacci không DP:                                    │
│                                                         │
│  fib(5)                                                 │
│    ├─ fib(4)                                            │
│    │   ├─ fib(3)                                        │
│    │   │   ├─ fib(2) ─┐                                │
│    │   │   └─ fib(1)  │ → Tính lại nhiều lần!       │
│    │   └─ fib(2) ────┘                                 │
│    └─ fib(3) ─────────────────────────────────┐        │
│        (fib(2) và fib(1) tính lại)           │        │
│                                                  ▼     │
│  VỚI DP (Memoization):                              │
│                                                         │
│  fib(5)                                                 │
│    ├─ fib(4) ─ fib(3) ─ fib(2) ─ fib(1)              │
│    └─ fib(3) → ĐÃ CACHE! Không tính lại ✓           │
│                                                         │
│  fib(5) = fib(4) + fib(3) = 5 + 3 = 8                │
└─────────────────────────────────────────────────────────┘
```

### Khi nào dùng DP?

```
✅ OPTIMAL SUBSTRUCTURE
   "Giải pháp tối ưu của bài toán lớn = kết hợp tối ưu các bài toán con"

✅ OVERLAPPING SUBPROBLEMS
   "Cùng một bài toán con được tính nhiều lần"

Ví dụ:
  ✅ Tìm max/min sum/path → DP
  ✅ Đếm số cách → DP
  ✅ Exhaustive search với constraints → DP

  ❌ Divide & Conquer không overlap → Không cần DP
  ❌ Mỗi subproblem unique → Không cần DP
```

### Hai cách tiếp cận:

#### 1. Top-Down (Memoization) — Đệ quy từ trên xuống

```javascript
// Gọi đệ quy, lưu kết quả vào cache
const memo = {};

function fib(n) {
  if (n <= 1) return n;

  if (memo[n]) return memo[n];  // Đã tính rồi → return

  memo[n] = fib(n - 1) + fib(n - 2);  // Tính và lưu
  return memo[n];
}

// Hoặc dùng Map
const memo = new Map();
function fib(n) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);
  const result = fib(n - 1) + fib(n - 2);
  memo.set(n, result);
  return result;
}
```

#### 2. Bottom-Up (Tabulation) — Tính từ nhỏ đến lớn

```javascript
function fib(n) {
  if (n <= 1) return n;

  const dp = new Array(n + 1).fill(0);
  dp[1] = 1;

  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }

  return dp[n];
}

// Space Optimization: chỉ cần 2 biến
function fib(n) {
  if (n <= 1) return n;
  let prev2 = 0, prev1 = 1;
  for (let i = 2; i <= n; i++) {
    const curr = prev1 + prev2;
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
}
```

### Visual: Top-Down vs Bottom-Up

```
TOP-DOWN (Memoization):              BOTTOM-UP (Tabulation):

fib(5)                               dp[0] = 0
├─ fib(4)                           dp[1] = 1
│  ├─ fib(3) ─ fib(2)              dp[2] = dp[1] + dp[0] = 1
│  └─ fib(2) ─ fib(1)               dp[3] = dp[2] + dp[1] = 2
└─ fib(3) → CACHED ✓                dp[4] = dp[3] + dp[2] = 3
                                       dp[5] = dp[4] + dp[3] = 5

Call stack: O(n) space               Loop: O(n) time, O(n) space
```

---

## 🔄 DP PATTERNS CỐT LÕI

### Pattern 1: 1D DP — Fibonacci Pattern

**Dùng khi:** Bài toán có thể giải bằng cách nhìn vào 1 hoặc 2 states trước đó.

```javascript
// Climbing Stairs (LeetCode 70)
function climbStairs(n) {
  if (n <= 2) return n;

  const dp = new Array(n + 1).fill(0);
  dp[1] = 1;   // 1 way to climb 1 stair
  dp[2] = 2;   // 2 ways to climb 2 stairs

  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }

  return dp[n];
}

// Space Optimization
function climbStairs(n) {
  if (n <= 2) return n;
  let prev2 = 1, prev1 = 2;
  for (let i = 3; i <= n; i++) {
    const curr = prev1 + prev2;
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
}
```

**Visual — Climbing Stairs:**
```
n = 5 stairs

dp[1] = 1  (1 way: [1])
dp[2] = 2  (2 ways: [1,1], [2])

dp[3] = dp[2] + dp[1] = 2 + 1 = 3
  → 3 = climb(2) + climb(1)
  → Cách lên bậc 3 = (lên bậc 2 rồi 1 bước) + (lên bậc 1 rồi 2 bước)

dp[4] = dp[3] + dp[2] = 3 + 2 = 5
dp[5] = dp[4] + dp[3] = 5 + 3 = 8

Answer: 8
```

---

### Pattern 2: 1D DP — House Robber Pattern

**Dùng khi:** Chọn items sao cho không chọn 2 items liền kề (non-adjacent selection).

```javascript
// House Robber (LeetCode 198)
function rob(nums) {
  if (nums.length === 0) return 0;
  if (nums.length === 1) return nums[0];

  const dp = new Array(nums.length);
  dp[0] = nums[0];
  dp[1] = Math.max(nums[0], nums[1]);

  for (let i = 2; i < nums.length; i++) {
    dp[i] = Math.max(
      dp[i - 1],           // Không rob nhà i → lấy best đến i-1
      dp[i - 2] + nums[i] // Rob nhà i → cộng với best đến i-2
    );
  }

  return dp[nums.length - 1];
}

// Space Optimization: O(1)
function rob(nums) {
  if (nums.length === 0) return 0;
  if (nums.length === 1) return nums[0];

  let prev2 = nums[0];                    // dp[i-2]
  let prev1 = Math.max(nums[0], nums[1]); // dp[i-1]

  for (let i = 2; i < nums.length; i++) {
    const curr = Math.max(prev1, prev2 + nums[i]);
    prev2 = prev1;
    prev1 = curr;
  }

  return prev1;
}
```

**Visual — House Robber:**
```
nums = [2, 7, 9, 3, 1]

dp[0] = 2              → Rob house 0: 2
dp[1] = max(2, 7) = 7 → Rob house 1: 7

dp[2] = max(dp[1]=7, dp[0]+9=11) = 11
  → Skip house 2: get 7 from houses 0-1
  → Rob house 2: 9 + 2 = 11 ✓ (Rob house 2, skip house 1)

dp[3] = max(dp[2]=11, dp[1]+3=10) = 11
  → Skip house 3: get 11 from houses 0-2
  → Rob house 3: 3 + 7 = 10

dp[4] = max(dp[3]=11, dp[2]+1=12) = 12
  → Rob house 4: 1 + 11 = 12 ✓

Answer: 12 (houses: 0, 2, 4)
```

---

### Pattern 3: 2D DP — Grid Pattern

**Dùng khi:** Di chuyển trên grid, cần consider cả row và column.

```javascript
// Unique Paths (LeetCode 62)
function uniquePaths(m, n) {
  const dp = Array(m).fill().map(() => Array(n).fill(0));

  // Base case: đi được đến mọi ô ở row 0 và column 0
  for (let i = 0; i < m; i++) dp[i][0] = 1;
  for (let j = 0; j < n; j++) dp[0][j] = 1;

  // dp[i][j] = dp[i-1][j] + dp[i][j-1]
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
    }
  }

  return dp[m - 1][n - 1];
}

// Space Optimization: O(n) thay vì O(mn)
function uniquePaths(m, n) {
  const dp = Array(n).fill(1);

  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      dp[j] += dp[j - 1];  // dp[j] (trên) + dp[j-1] (trái)
    }
  }

  return dp[n - 1];
}
```

**Visual — Unique Paths:**
```
Grid 3×3 (m=3, n=3):

       j=0   j=1   j=2
i=0  [  1  |  1  |  1  ]
i=1  [  1  |  2  |  3  ]
i=2  [  1  |  3  |  6  ]

dp[0][0] = 1
dp[0][1] = dp[0][0] + dp[-1][1] = 1 + 0 = 1 (first row)
dp[1][0] = dp[0][0] + dp[1][-1] = 1 + 0 = 1 (first col)
dp[1][1] = dp[0][1] + dp[1][0] = 1 + 1 = 2
dp[2][2] = dp[1][2] + dp[2][1] = 3 + 3 = 6

Answer: 6 paths

Paths:
  RRR, RRU, RUR, RURR, URRR, URRU, UUR, URU, URR
  Wait... let me trace:
  1. (0,0)→(0,1)→(0,2)→(1,2)→(2,2)     R R R D D = RRR
  2. (0,0)→(0,1)→(1,1)→(1,2)→(2,2)     R D R D = RRRD
  3. (0,0)→(0,1)→(1,1)→(2,1)→(2,2)     R D D R = RDDR
  4. (0,0)→(1,0)→(1,1)→(1,2)→(2,2)     D R R D
  5. (0,0)→(1,0)→(1,1)→(2,1)→(2,2)     D R D R
  6. (0,0)→(1,0)→(2,0)→(2,1)→(2,2)     D D R R
```

---

### Pattern 4: 2D DP — Longest Palindromic Substring

**Dùng khi:** Tìm longest substring/palindrome, cần consider cả left và right boundaries.

```javascript
// Longest Palindromic Substring (LeetCode 5)
function longestPalindrome(s) {
  const n = s.length;
  if (n === 0) return "";

  let start = 0, maxLen = 1;

  // dp[i][j] = true nếu s[i..j] là palindrome
  const dp = Array(n).fill().map(() => Array(n).fill(false));

  // Base case 1: Single characters (length = 1)
  for (let i = 0; i < n; i++) {
    dp[i][i] = true;
  }

  // Base case 2: Two characters (length = 2)
  for (let i = 0; i < n - 1; i++) {
    if (s[i] === s[i + 1]) {
      dp[i][i + 1] = true;
      if (maxLen < 2) {
        start = i;
        maxLen = 2;
      }
    }
  }

  // Length >= 3
  for (let len = 3; len <= n; len++) {
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1;  // End index

      if (dp[i + 1][j - 1] && s[i] === s[j]) {
        dp[i][j] = true;
        if (maxLen < len) {
          start = i;
          maxLen = len;
        }
      }
    }
  }

  return s.substring(start, start + maxLen);
}

// ✅ Space Optimization: Expand Around Center
function longestPalindrome(s) {
  let result = "";

  function expand(left, right) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      left--;
      right++;
    }
    // Trả về palindrome từ left+1 đến right-1
    return s.substring(left + 1, right);
  }

  for (let i = 0; i < s.length; i++) {
    const odd = expand(i, i);     // Odd length palindrome
    const even = expand(i, i + 1); // Even length palindrome

    if (odd.length > result.length) result = odd;
    if (even.length > result.length) result = even;
  }

  return result;
}
```

**Visual — Expand Around Center:**
```
s = "babad"

i=0: "b" → expand(0,0) → "b"
i=1: "b" → expand(1,1) → "b"
        "ba" → expand(0,2) → s[0]≠s[2] → stop → "b"
        "bab" → expand(0,2) is "b" → wait, let me trace:
        expand(1,1): left=1, right=1 → "b"
        expand(1,2): left=0, right=2 → s[0]='b', s[2]='b' ✓ → left=0, right=3
                    s[0]='b', s[3]='a' ✗ → stop → "bab"
i=2: expand(2,2) → "b"
      expand(2,3) → s[2]='b', s[3]='a' ✗ → "b"
i=3: expand(3,3) → "a"
      expand(3,4) → s[3]='a', s[4]='d' ✗ → "a"
i=4: expand(4,4) → "d"

Longest: "bab" or "aba"
```

---

### Pattern 5: 1D DP — Coin Change (Unbounded Knapsack)

**Dùng khi:** Chọn items có thể dùng nhiều lần (unbounded), tìm min/max số items.

```javascript
// Coin Change (LeetCode 322)
function coinChange(coins, amount) {
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;  // Base case: 0 coins cho amount 0

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}
```

**Visual — Coin Change:**
```
coins = [1, 2, 5], amount = 11

dp[i] = số coins ÍT NHẤT để tạo amount i

dp[0] = 0  (0 coins cho 0 amount)

dp[1] = min(dp[0]+1=1, INF, INF) = 1
        → 1 coin (1)
dp[2] = min(dp[1]+1=2, dp[0]+1=1) = 1
        → 1 coin (2)
dp[3] = min(dp[2]+1=2, dp[1]+1=2) = 2
        → 2 coins (1+2)
dp[4] = min(dp[3]+1=3, dp[2]+1=2) = 2
        → 2 coins (2+2)
dp[5] = min(dp[4]+1=3, dp[3]+1=3, dp[0]+1=1) = 1
        → 1 coin (5)
dp[6] = min(dp[5]+1=2, dp[4]+1=3, dp[1]+1=2) = 2
        → 2 coins (1+5)
dp[7] = min(dp[6]+1=3, dp[5]+1=2, dp[2]+1=2) = 2
        → 2 coins (2+5)
dp[8] = min(dp[7]+1=3, dp[6]+1=3, dp[3]+1=3) = 3
        → 3 coins (1+2+5)
dp[9] = min(dp[8]+1=4, dp[7]+1=3, dp[4]+1=3) = 3
        → 3 coins (5+2+2)
dp[10] = min(dp[9]+1=4, dp[8]+1=4, dp[5]+1=2) = 2
        → 2 coins (5+5)
dp[11] = min(dp[10]+1=3, dp[9]+1=4, dp[6]+1=3) = 3
        → 3 coins (5+5+1)

Answer: 3
```

---

### Pattern 6: 1D DP — Longest Increasing Subsequence (LIS)

**Dùng khi:** Tìm longest subsequence (không cần liền kề) thỏa điều kiện.

```javascript
// Longest Increasing Subsequence (LeetCode 300)
function lengthOfLIS(nums) {
  if (nums.length === 0) return 0;

  // dp[i] = LIS length kết thúc tại index i
  const dp = new Array(nums.length).fill(1);
  let maxLen = 1;

  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
    maxLen = Math.max(maxLen, dp[i]);
  }

  return maxLen;
}

// ✅ O(n log n) với Binary Search (PATIENCE SORTING)
function lengthOfLISBinarySearch(nums) {
  const piles = [];  // tails of piles

  for (const num of nums) {
    // Tìm vị trí thích hợp cho num
    let left = 0, right = piles.length;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (piles[mid] < num) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    if (left === piles.length) {
      piles.push(num);  // Tạo pile mới
    } else {
      piles[left] = num;  // Thay thế
    }
  }

  return piles.length;
}
```

**Visual — LIS:**
```
nums = [10, 9, 2, 5, 3, 7, 101, 18]

dp[i] = LIS ending at i

dp[0] = 1  ([10])
dp[1] = 1  ([9]) → 9 không > 10
dp[2] = 1  ([2]) → 2 không > 10, 9
dp[3] = 2  ([2,5]) → 5 > 2
dp[4] = 2  ([2,3]) → 3 > 2
dp[5] = 3  ([2,3,7]) → 7 > 2, 3, 5
dp[6] = 4  ([2,3,7,101]) → 101 > 2, 3, 7
dp[7] = 4  ([2,3,7,18]) → 18 > 2, 3, 7

Answer: 4

Binary Search (Patience):
  num=10: piles=[10]
  num=9:  find 9 in [10] → left=0 → piles=[9]
  num=2:  find 2 in [9] → left=0 → piles=[2]
  num=5:  find 5 in [2] → left=1 → piles=[2,5]
  num=3:  find 3 in [2,5] → left=1 → piles=[2,3]
  num=7:  find 7 in [2,3] → left=2 → piles=[2,3,7]
  num=101: find 101 in [2,3,7] → left=3 → piles=[2,3,7,101]
  num=18: find 18 in [2,3,7,101] → left=3 → piles=[2,3,7,18]

Answer: 4 ✓
```

---

### Pattern 7: 1D DP — Longest Common Subsequence (LCS)

**Dùng khi:** So sánh 2 sequences, tìm common subsequence.

```javascript
// Longest Common Subsequence (LeetCode 1143)
function longestCommonSubsequence(text1, text2) {
  const m = text1.length, n = text2.length;
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}

// Space Optimization: O(n) space
function longestCommonSubsequence(text1, text2) {
  const m = text1.length, n = text2.length;
  let prev = Array(n + 1).fill(0);
  let curr = Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        curr[j] = prev[j - 1] + 1;
      } else {
        curr[j] = Math.max(prev[j], curr[j - 1]);
      }
    }
    [prev, curr] = [curr, prev];  // Swap
  }

  return prev[n];
}
```

**Visual — LCS:**
```
text1 = "abcde", text2 = "ace"

       ""   a   c   e
    ""  0   0   0   0
     a  0   1   1   1
     b  0   1   1   1
     c  0   1   2   2
     d  0   1   2   2
     e  0   1   2   3

dp[5][3] = 3 → LCS = "ace"

Trace: a-c-e match in both sequences (not necessarily contiguous)
```

---

### Pattern 8: 1D DP — Best Time to Buy and Sell Stock

**Dùng khi:** Tìm max profit với constraints (1 transaction, fee, cooldown, etc).

```javascript
// Best Time to Buy and Sell Stock with Transaction Fee (LeetCode 714)
// Có thể giao dịch nhiều lần, nhưng trả fee cho mỗi transaction

function maxProfit(prices, fee) {
  let cash = 0;      // Không hold stock, có cash
  let hold = -prices[0];  // Đang hold stock

  for (let i = 1; i < prices.length; i++) {
    // Option 1: Không làm gì (giữ cash hoặc giữ stock)
    cash = Math.max(cash, hold + prices[i] - fee);  // Bán stock
    hold = Math.max(hold, cash - prices[i]);          // Mua stock
  }

  return cash;
}
```

**Visual — Stock with Fee:**
```
prices = [1, 3, 2, 8, 4, 9], fee = 2

Day 0: cash=0, hold=-1
Day 1: cash=max(0, -1+3-2=0)=0, hold=max(-1, 0-3=-1)=-1
Day 2: cash=max(0, -1+2-2=-1)=0, hold=max(-1, 0-2=-2)=-1
Day 3: cash=max(0, -1+8-2=5)=5, hold=max(-1, 5-8=-3)=-1
Day 4: cash=max(5, -1+4-2=1)=5, hold=max(-1, 5-4=1)=1
Day 5: cash=max(5, 1+9-2=8)=8, hold=max(1, 8-9=-1)=1

Answer: 8

Profit: Buy day 0 (1), Sell day 3 (8) = 7 - fee=2 = 5
        Buy day 4 (4), Sell day 5 (9) = 5 - fee=2 = 3
        Total = 5 + 3 = 8 ✓
```

---

## ⚠️ COMMON PITFALLS (Lỗi hay mắc)

### ❌ Pitfall 1: Không xác định đúng State và Transition

```javascript
// ❌ Sai: Nhầm state
// Bài House Robber: dp[i] = max profit đến nhà i
// Nhầm thành: dp[i] = max profit từ nhà i đến cuối
// → Transition sai!

// ✅ Đúng:
dp[i] = max(dp[i-1], dp[i-2] + nums[i])
//        skip i    rob i
```

### ❌ Pitfall 2: Quên Base Case

```javascript
// ❌ Sai: không init base case
function fib(n) {
  const dp = new Array(n + 1);
  // dp[0] và dp[1] không được init!
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];  // dp[1] = undefined!
  }
  return dp[n];
}

// ✅ Đúng: init base cases
function fib(n) {
  if (n <= 1) return n;
  const dp = new Array(n + 1);
  dp[0] = 0;
  dp[1] = 1;
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}
```

### ❌ Pitfall 3: Nhầm index trong 2D DP

```javascript
// ❌ Sai: Access nhầm text1 vs text2
dp[i][j] = dp[i-1][j-1] + 1;  // OK
// Nhưng khi truy xuất text:
dp[i][j] = ...;
// text1[i] ← SAI! text1 index từ 0, dp index từ 1
// Phải là: text1[i-1]

// ✅ Đúng:
for (let i = 1; i <= m; i++) {
  for (let j = 1; j <= n; j++) {
    if (text1[i - 1] === text2[j - 1]) {  // ← -1
      dp[i][j] = dp[i - 1][j - 1] + 1;
    }
  }
}
```

### ❌ Pitfall 4: Coin Change — init sai giá trị

```javascript
// ❌ Sai: init bằng 0 hoặc -1
const dp = Array(amount + 1).fill(0);
for (let i = 1; i <= amount; i++) {
  for (const coin of coins) {
    if (coin <= i) {
      dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      // Nếu dp[i] = 0 init, thì dp[i - coin] + 1 = 1 cho first coin
      // Nhưng dp[i - coin] có thể = 0 (invalid state)!
    }
  }
}

// ✅ Đúng: init bằng Infinity
const dp = Array(amount + 1).fill(Infinity);
dp[0] = 0;  // Base case rõ ràng
```

### ❌ Pitfall 5: LIS — O(n²) đủ cho interview nhưng nên biết O(n log n)

```javascript
// O(n²) thường đủ cho interview, nhưng:
// dp[i] = LIS ending at i
// dp[i] = max(dp[j] + 1) for all j < i where nums[j] < nums[i]
// O(n²) cho mỗi i duyệt tất cả j trước đó

// O(n log n):
// Thay vì duyệt j, dùng binary search để tìm vị trí thích hợp
// piles[i] = giá trị nhỏ nhất có thể làm tail của LIS length i+1
```

---

## 💡 TIPS & TRICKS

### 1. Cách identify DP problems

```
Hỏi patterns:
  ✅ "minimum/maximum..." → Optimize choice → DP
  ✅ "count the number of ways..." → Count ways → DP
  ✅ "is it possible..." → Boolean DP → DP

  ✅ Substring/Subarray/Subsequence → DP thường hữu ích
  ✅ Choices có constraints → DP

TỪ KHÓA:
  ✅ "longest", "shortest"
  ✅ "maximum profit"
  ✅ "minimum cost"
  ✅ "distinct ways"
  ✅ "total ways"
  ✅ "is subsequence"
```

### 2. 4 bước giải DP

```
Bước 1: Xác định State
  "dp[i] nghĩa là gì?"
  → dp[i] = [giải thích]
  → dp[i][j] nghĩa là gì? (cho 2D)

Bước 2: Xác định Transition
  "dp[i] = f(dp[...])"
  → Tìm công thức

Bước 3: Xác định Base Case
  → dp[0] = ?, dp[1] = ?

Bước 4: Tính Answer
  → dp[n] hoặc dp[m][n]
```

### 3. Space Optimization thường gặp

```javascript
// 1D: prev1, prev2
dp[i] = dp[i-1] + dp[i-2]
→ let prev1 = 1, prev2 = 1;
→ curr = prev1 + prev2;
→ prev2 = prev1; prev1 = curr;

// 2D grid: 2 rows
dp[i][j] = dp[i-1][j] + dp[i][j-1]
→ let prev = Array(n).fill(0);
→ let curr = Array(n).fill(0);
→ swap(prev, curr) mỗi row;

// 2D LCS: 2 rows với rolling
→ Tương tự
```

### 4. Mẹo đọc đề bài

```
"Không liên tục" (non-adjacent, non-consecutive)
  → 1D DP với dp[i] phụ thuộc dp[i-1] và dp[i-2]
  → House Robber pattern

"Subsequence" (có thể skip elements)
  → LIS hoặc LCS
  → O(n²) hoặc O(n log n)

"Grid/2D matrix"
  → 2D DP
  → dp[i][j] = f(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])

"Coins/items có thể reuse"
  → Unbounded knapsack
  → for coin in coins (loop bên ngoài)
```

---

## 🔍 BRUTE FORCE → OPTIMAL

| Bài | Brute Force | Optimal | Pattern |
|-----|-------------|---------|---------|
| Climbing Stairs | Recursion O(2^n) | DP O(n) | 1D |
| Min Cost Climbing | O(n) per step | DP O(n) | 1D |
| House Robber | O(2^n) | DP O(n) | 1D |
| Longest Palindromic | O(n³) | DP O(n²) / Expand O(n) | 2D |
| Coin Change | O(amount^n) | DP O(amount·n) | Unbounded |
| LIS | O(n²) | O(n log n) | Subsequence |
| Unique Paths | O(2^(m+n)) | DP O(mn) | 2D Grid |
| LCS | O(2^m·2^n) | DP O(mn) | 2D |
| Best Time Stock | O(n²) | DP O(n) | 1D |

---

## ⏱️ TIME & SPACE COMPLEXITY TỔNG HỢP

| Pattern | Time | Space | Optimization |
|---------|------|-------|-------------|
| 1D (Fibonacci) | O(n) | O(n) → O(1) | 2 variables |
| 1D (House Robber) | O(n) | O(n) → O(1) | 2 variables |
| 2D Grid | O(mn) | O(mn) → O(n) | 2 rows |
| Coin Change | O(amount·n) | O(amount) | — |
| LIS | O(n²) → O(n log n) | O(n) | Binary Search |
| LCS | O(mn) | O(mn) → O(min(m,n)) | Rolling |
| Palindrome | O(n²) → O(n) | O(n²) → O(1) | Expand |

---

## 🏭 REAL-WORLD APPLICATIONS

| Pattern | Ứng dụng thực tế |
|---------|-------------------|
| 1D DP | Resource scheduling, profit optimization |
| 2D Grid DP | Robot path planning, game level design |
| LIS | Longest increasing subsequence analysis |
| LCS | Diff tools (git diff), plagiarism detection |
| Knapsack | Resource allocation, cargo loading |

---

## ✅ KHI NÀO DÙNG / KHÔNG DÙNG

### NÊN dùng DP khi:
- ✅ Optimal substructure + overlapping subproblems
- ✅ Tìm min/max/count của solutions
- ✅ Constrained choices

### KHÔNG NÊN dùng DP khi:
- ❌ Mỗi subproblem unique (no overlap)
- ❌ Không có optimal substructure
- ❌ Exhaustive search đơn giản hơn

---

## 📋 CHEAT SHEET — Tuần 6

### DP Checklist

```
1. STATE:   dp[i] hoặc dp[i][j] nghĩa là gì?
2. TRANSITION: dp[i] = f(dp[...])
3. BASE CASE: dp[0], dp[..][0], dp[0][..]
4. ANSWER: dp[n] hoặc dp[m][n]
5. OPTIMIZE: Giảm space nếu có thể
```

### Quick Decision

```
Bài toán:
  ├── 1D sequence? → dp[i] phụ thuộc dp[i-1], dp[i-2]
  │     ├── Non-adjacent? → House Robber
  │     ├── Coin change? → Unbounded Knapsack
  │     └── LIS? → Subsequence pattern
  │
  ├── 2D grid? → dp[i][j] phụ thuộc dp[i-1][j], dp[i][j-1]
  │     ├── Grid path? → Unique Paths
  │     └── Substring? → Palindrome, LCS
  │
  └── Subsequence? → LCS hoặc LIS
```

---

## 📝 BÀI TẬP TUẦN NÀY

| # | Bài | LeetCode | Độ khó | Pattern | Status |
|---|-----|----------|--------|---------|--------|
| 1 | Climbing Stairs | #70 | 🟢 Easy | 1D DP | ⬜ |
| 2 | Min Cost Climbing Stairs | #746 | 🟢 Easy | 1D DP | ⬜ |
| 3 | House Robber | #198 | 🟡 Medium | 1D DP | ⬜ |
| 4 | Longest Palindromic Substring | #5 | 🟡 Medium | 2D DP | ⬜ |
| 5 | Coin Change | #322 | 🟡 Medium | Unbounded Knapsack | ⬜ |
| 6 | Longest Increasing Subsequence | #300 | 🟡 Medium | Subsequence | ⬜ |
| 7 | Partition Equal Subset Sum | #416 | 🟡 Medium | 0/1 Knapsack | ⬜ |
| 8 | Word Break | #139 | 🟡 Medium | 1D DP | ⬜ |
| 9 | Unique Paths | #62 | 🟡 Medium | 2D DP | ⬜ |
| 10 | Longest Common Subsequence | #1143 | 🟡 Medium | 2D DP | ⬜ |
| 11 | Best Time Stock with Fee | #714 | 🟡 Medium | 1D DP | ⬜ |

**Hoàn thành:** 0/11 (0%)

---

## 📚 TÀI NGUYÊN

- Video: [NeetCode Dynamic Programming](https://www.youtube.com/)
- Article: [DP Tutorial](https://www.geeksforgeeks.org/dynamic-programming/)
- Cheat Sheet: [DP Patterns](https://leetcode.com/discuss/general-discussion/458695/Dynamic-Programming-Pattern-Set)
- Article: [Memoization vs Tabulation](https://www.geeksforgeeks.org/tabulation-vs-memoization/)
