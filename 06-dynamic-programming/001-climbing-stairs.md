# #70 - Climbing Stairs

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | DP, Math |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/climbing-stairs/

---

## 📖 Đề bài

### Mô tả
Bạn đang leo cầu thang. Cần `n` bậc. Mỗi lần bước, bạn có thể leo **1 bậc** hoặc **2 bậc**. Có bao nhiêu cách khác nhau để leo lên đỉnh?

### Ví dụ

**Example 1:**
```
Input:  n = 2
Output: 2
Giải thích:
  Cách 1: 1 bước + 1 bước
  Cách 2: 2 bước
```

**Example 2:**
```
Input:  n = 4
Output: 5
Giải thích:
  Cách 1: 1+1+1+1
  Cách 2: 1+1+2
  Cách 3: 1+2+1
  Cách 4: 2+1+1
  Cách 5: 2+2
```

### Constraints
```
1 <= n <= 45
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Đếm số cách leo n bậc
Mô hình: Mỗi cách = sequence của 1 và 2
Có thể mô hình = Fibonacci!
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Liệt kê brute force

```
n=1: 1 cách → [1]
n=2: 2 cách → [1+1], [2]
n=3: 3 cách → [1+1+1], [1+2], [2+1]
n=4: 5 cách → [1+1+1+1], [1+1+2], [1+2+1], [2+1+1], [2+2]
```

---

#### Bước 2: "Aha moment!" — DP Pattern

> **Aha moment:**
> ```
> Gọi f(n) = số cách leo n bậc
>
> Bước cuối cùng:
>   - Bước 1 từ bậc n-1: f(n-1) cách
>   - Bước 2 từ bậc n-2: f(n-2) cách
>
> → f(n) = f(n-1) + f(n-2)
> → ĐÂY LÀ FIBONACCI!
>
> Base cases:
>   f(1) = 1
>   f(2) = 2
>
> → f(3) = f(2) + f(1) = 2 + 1 = 3 ✓
> → f(4) = f(3) + f(2) = 3 + 2 = 5 ✓
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "f(n) = f(n-1) + f(n-2) → FIBONACCI!"          │
│   → Last step: từ n-1 (step 1) hoặc n-2 (step 2) │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Base cases: f(1)=1, f(2)=2"                   │
│   (khác với Fibonacci thông thường f(0)=0,f(1)=1)│
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "DP tối ưu: chỉ cần 2 biến (space O(1))"        │
│   → prev1, prev2 thay vì array                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Fibonacci đệ quy (exponential!)
function climbStairsRecursive(n) {
  if (n <= 1) return 1;
  return climbStairsRecursive(n-1) + climbStairsRecursive(n-2);
}
// → T(n) = O(2^n) → sẽ timeout cho n lớn!

// ❌ Pitfall 2: Base case sai
// f(1) = 1, f(2) = 2 (không phải f(0) = 0, f(1) = 1)
// Nếu dùng f(0)=0, f(1)=1 → f(2)=1 → SAI!

// ❌ Pitfall 3: Tạo DP array lớn không cần thiết
// dp = Array(n+1).fill(0)
// → Chỉ cần 2 biến!
```

---

### 🔄 5. Các hướng tiếp cận

#### 🔹 Cách 1: Iterative DP (O(n)) ⭐

```javascript
function climbStairs(n) {
  if (n <= 2) return n;

  let prev1 = 2; // f(2)
  let prev2 = 1; // f(1)

  for (let i = 3; i <= n; i++) {
    const curr = prev1 + prev2;
    prev2 = prev1;
    prev1 = curr;
  }

  return prev1;
}
```

**📊 Phân tích:**
```
Time:  O(n)
Space: O(1) — chỉ 2 biến!
```

---

#### 🔹 Cách 2: DP Array (O(n)) Space O(n)

```javascript
function climbStairs(n) {
  if (n <= 2) return n;
  const dp = Array(n + 1).fill(0);
  dp[1] = 1;
  dp[2] = 2;
  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}
```

---

### 🚀 6. Visual Walkthrough

```
n = 4

Step-by-step (2 biến):
  prev1 = f(2) = 2
  prev2 = f(1) = 1

  i=3: curr = prev1 + prev2 = 2+1 = 3 = f(3)
        prev2 = prev1 = 2
        prev1 = curr = 3

  i=4: curr = prev1 + prev2 = 3+2 = 5 = f(4) ✓
        prev2 = prev1 = 3
        prev1 = curr = 5

→ return 5 ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Climbing Stairs - Fibonacci DP (Space O(1))
 * Time: O(n) | Space: O(1)
 */
function climbStairs(n) {
  if (n <= 2) return n;
  let prev1 = 2;
  let prev2 = 1;
  for (let i = 3; i <= n; i++) {
    const curr = prev1 + prev2;
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
}
```

---

## 🧪 Test Cases

```javascript
console.log(climbStairs(2)); // 2

console.log(climbStairs(4)); // 5

console.log(climbStairs(1)); // 1

console.log(climbStairs(5)); // 8

console.log(climbStairs(10)); // 89
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Fibonacci DP

💡 KEY INSIGHT:
   "f(n) = f(n-1) + f(n-2) = FIBONACCI"
   "Base: f(1)=1, f(2)=2"
   "2 biến thay vì array"

⚠️ PITFALLS:
   - KHÔNG dùng đệ quy (O(2^n))
   - Base case f(1)=1, f(2)=2

🔄 VARIATIONS:
   - Min Cost Climbing Stairs (#746) → thêm cost
   - House Robber (#198) → không chọn 2 nhà liền kề

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Min Cost Climbing Stairs (#746)
// Thêm cost cho mỗi bước
function minCostClimbingStairs(cost) {
  const n = cost.length;
  let prev1 = cost[1];
  let prev2 = cost[0];
  
  for (let i = 2; i < n; i++) {
    const curr = Math.min(prev1, prev2) + cost[i];
    prev2 = prev1;
    prev1 = curr;
  }
  return Math.min(prev1, prev2);
}

// Variation 2: House Robber (#198)
// Không cướp 2 nhà liền kề
function rob(nums) {
  if (nums.length === 1) return nums[0];
  let prev1 = Math.max(nums[0], nums[1]);
  let prev2 = nums[0];
  for (let i = 2; i < nums.length; i++) {
    const curr = Math.max(prev1, nums[i] + prev2);
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
}

// Variation 3: Climb Stairs with Variable Steps
// Có thể bước 1, 2, hoặc k steps
function climbStairsVaried(n, k) {
  const dp = Array(n + 1).fill(0);
  dp[0] = 1;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= k; j++) {
      if (i >= j) dp[i] += dp[i - j];
    }
  }
  return dp[n];
}

// Variation 4: Minimum Falling Path Sum (#931)
// Tìm path có sum nhỏ nhất
function minFallingPathSum(matrix) {
  const n = matrix.length;
  const dp = [...matrix[n - 1]];
  
  for (let i = n - 2; i >= 0; i--) {
    const newDp = [...matrix[i]];
    for (let j = 0; j < n; j++) {
      const below = dp[j];
      const belowLeft = j > 0 ? dp[j - 1] : Infinity;
      const belowRight = j < n - 1 ? dp[j + 1] : Infinity;
      newDp[j] += Math.min(below, belowLeft, belowRight);
    }
    dp.length = 0;
    dp.push(...newDp);
  }
  return Math.min(...dp);
}

// Variation 5: Min Cost to Reach Destination
// Chi phí tối thiểu đến đích với K steps
```

---

## ➡️ Bài tiếp theo

[Bài 2: Min Cost Climbing Stairs](./002-min-cost-climbing.md)
