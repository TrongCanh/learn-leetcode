# #322 - Coin Change

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | DP, BFS |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/coin-change/

---

## 📖 Đề bài

### Mô tả
Cho một mảng `coins` (các denominations) và một số `amount`. Tìm **số coins tối thiểu** để tạo thành `amount`. Nếu không thể, trả về `-1`.

### Ví dụ

**Example 1:**
```
Input:  coins = [1,2,5], amount = 11
Output: 3
Giải thích: 5 + 5 + 1 = 11 (3 coins)
```

**Example 2:**
```
Input:  coins = [2], amount = 3
Output: -1
Giải thích: Không thể tạo 3 với coins = [2]
```

### Constraints
```
1 <= coins.length <= 12
1 <= coins[i] <= 2^31 - 1
0 <= amount <= 10^4
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Số coins tối thiểu để tạo amount
Pattern: Unbounded Knapsack (đếm tối thiểu)
→ dp[i] = số coins tối thiểu cho amount i
→ dp[i] = min(dp[i], dp[i-coin] + 1)
```

---

### 🤔 2. Tư duy từng bước

> **Aha moment:**
> ```
> dp[i] = số coins tối thiểu cho amount i
>
> Với mỗi coin:
>   dp[i] = min(dp[i], dp[i - coin] + 1)
>   → Dùng coin này: dp[i-coin] + 1 coin
>   → Hoặc không dùng: giữ nguyên dp[i]
>
> Base: dp[0] = 0, dp[i] = Infinity cho i > 0
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Unbounded = dùng coin nhiều lần"                 │
│   → Loop coins bên ngoài, amount bên trong         │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "dp[i] = min(dp[i], dp[i-coin] + 1)"             │
│   → Infinity = chưa tính được                       │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "dp[amount] === Infinity → return -1"             │
│   → Không thể tạo thành amount                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Khởi tạo dp = [0] thay vì Infinity
// dp = Array(amount+1).fill(Infinity)
// dp[0] = 0

// ❌ Pitfall 2: Loop sai thứ tự
// → Với Unbounded: coins loop NGOÀI, amount loop TRONG
// for (const coin of coins) {
//   for (let i = coin; i <= amount; i++) {
//     dp[i] = Math.min(dp[i], dp[i - coin] + 1);
//   }
// }

// ❌ Pitfall 3: Check dp[amount] === Infinity thay vì -1
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: DP Bottom-up (O(n × amount)) ⭐

```javascript
function coinChange(coins, amount) {
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;

  for (const coin of coins) {
    for (let i = coin; i <= amount; i++) {
      dp[i] = Math.min(dp[i], dp[i - coin] + 1);
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}
```

**📊 Phân tích:**
```
Time:  O(n × amount) — n = coins.length
Space: O(amount)
```

---

### 🚀 6. Visual Walkthrough

```
coins = [1, 2, 5], amount = 11

dp = [0, ∞, ∞, ∞, ∞, ∞, ∞, ∞, ∞, ∞, ∞, ∞]

coin=1: for i=1→11:
  i=1: dp[1]=min(∞, dp[0]+1)=1
  i=2: dp[2]=min(∞, dp[1]+1)=2
  ...
  dp=[0,1,2,3,4,5,6,7,8,9,10,11]

coin=2: for i=2→11:
  i=2: dp[2]=min(2, dp[0]+1)=1
  i=3: dp[3]=min(3, dp[1]+1)=2
  i=4: dp[4]=min(4, dp[2]+1)=2
  i=5: dp[5]=min(5, dp[3]+1)=3
  ...
  dp=[0,1,1,2,2,3,4,5,6,7,8,9]

coin=5: for i=5→11:
  i=5: dp[5]=min(3, dp[0]+1)=1
  i=6: dp[6]=min(4, dp[1]+1)=2
  i=7: dp[7]=min(5, dp[2]+1)=2
  i=8: dp[8]=min(6, dp[3]+1)=3
  i=9: dp[9]=min(7, dp[4]+1)=3
  i=10: dp[10]=min(8, dp[5]+1)=2
  i=11: dp[11]=min(9, dp[6]+1)=3

→ return 3 ✓ (5+5+1)
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Coin Change - Unbounded Knapsack DP
 * Time: O(n × amount) | Space: O(amount)
 */
function coinChange(coins, amount) {
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;

  for (const coin of coins) {
    for (let i = coin; i <= amount; i++) {
      dp[i] = Math.min(dp[i], dp[i - coin] + 1);
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}
```

---

## 🧪 Test Cases

```javascript
console.log(coinChange([1, 2, 5], 11)); // 3

console.log(coinChange([2], 3)); // -1

console.log(coinChange([1], 0)); // 0

console.log(coinChange([1], 2)); // 2
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Unbounded Knapsack (min count)

💡 KEY INSIGHT:
   "coins NGOÀI, amount TRONG"
   "dp[i] = min(dp[i], dp[i-coin] + 1)"
   "Infinity = chưa tính được, return -1"

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Coin Change 2 (#518)
// Đếm số cách tạo amount (combinations)
function change(amount, coins) {
  const dp = Array(amount + 1).fill(0);
  dp[0] = 1;
  
  for (const coin of coins) {
    for (let i = coin; i <= amount; i++) {
      dp[i] += dp[i - coin];
    }
  }
  return dp[amount];
}

// Variation 2: Minimum Number of Coins for 1, 2, 5 denominations
// Tương tự nhưng với denominations cố định

// Variation 3: Target Sum (#494)
// Tìm số cách thêm +/- để đạt target
function findTargetSumWays(nums, target) {
  const sum = nums.reduce((a, b) => a + b, 0);
  if (Math.abs(target) > sum) return 0;
  
  const dp = Array(2 * sum + 1).fill(0);
  dp[sum] = 1;
  
  for (const num of nums) {
    const next = Array(2 * sum + 1).fill(0);
    for (let i = 0; i <= 2 * sum; i++) {
      if (dp[i] !== 0) {
        next[i + num] += dp[i];
        next[i - num] += dp[i];
      }
    }
    dp.length = 0;
    dp.push(...next);
  }
  return dp[sum + target];
}

// Variation 4: Maximum Number of Ways to Cut Stick (#1547)
// Cắt stick thành pieces với chi phí tối thiểu
function minCost(n, cuts) {
  const c = [0, ...cuts.sort((a, b) => a - b), n];
  const m = c.length;
  const dp = Array(m).fill(0).map(() => Array(m).fill(0));
  
  for (let len = 2; len < m; len++) {
    for (let i = 0; i + len < m; i++) {
      dp[i][i + len] = Infinity;
      for (let k = i + 1; k < i + len; k++) {
        dp[i][i + len] = Math.min(
          dp[i][i + len],
          dp[i][k] + dp[k][i + len] + c[i + len] - c[i]
        );
      }
    }
  }
  return dp[0][m - 1];
}

// Variation 5: Combination Sum IV (#377)
// Đếm số combinations tạo target (thứ tự quan trọng)
function combinationSum4(nums, target) {
  const dp = Array(target + 1).fill(0);
  dp[0] = 1;
  for (let i = 1; i <= target; i++) {
    for (const num of nums) {
      if (num <= i) dp[i] += dp[i - num];
    }
  }
  return dp[target];
}
```

---

## ➡️ Bài tiếp theo

[Bài 6: Longest Increasing Subsequence](./006-longest-increasing.md)
