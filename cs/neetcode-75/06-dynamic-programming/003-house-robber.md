# #198 - House Robber

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | DP |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/house-robber/

---

## 📖 Đề bài

### Mô tả
Bạn là kẻ cướp đêm. Có `n` ngôi nhà, nhà `i` có số tiền `nums[i]`. Không thể cướp hai nhà liền kề. Tìm **số tiền tối đa** có thể cướp.

### Ví dụ

**Example 1:**
```
Input:  nums = [1,2,3,1]
Output: 4 (cướp nhà 0 + nhà 2 = 1+3)
```

**Example 2:**
```
Input:  nums = [2,7,9,3,1]
Output: 12 (cướp nhà 0 + nhà 2 + nhà 4 = 2+9+1)
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Tổng tối đa không cướp 2 nhà liền kề
→ Tại mỗi nhà: CƯỚP hoặc BỎ QUA
→ dp[i] = max(dp[i-1], nums[i] + dp[i-2])
```

---

### 🤔 2. Tư duy từng bước

> **Aha moment:**
> ```
> dp[i] = số tiền tối đa cướp được từ nhà 0 đến nhà i
>
> Tại nhà i, 2 lựa chọn:
>   1. CƯỚP nhà i → nums[i] + dp[i-2]
>   2. BỎ QUA → dp[i-1]
>
> → dp[i] = max(dp[i-1], nums[i] + dp[i-2])
>
> Base: dp[0] = nums[0], dp[1] = max(nums[0], nums[1])
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "dp[i] = max(dp[i-1], nums[i] + dp[i-2])"       │
│   → Skip i: dp[i-1]                               │
│   → Rob i: nums[i] + dp[i-2]                       │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "2 biến: prev1 = dp[i-1], prev2 = dp[i-2]"      │
│   → O(1) space                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall: dp[i] = max(dp[i-1], nums[i] + dp[i-1])
// → Cướp i thì không cướp i-1 → phải là dp[i-2]
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: DP 2 biến (O(n), O(1)) ⭐

```javascript
function rob(nums) {
  if (nums.length === 1) return nums[0];

  let prev1 = Math.max(nums[0], nums[1]); // dp[1]
  let prev2 = nums[0]; // dp[0]

  for (let i = 2; i < nums.length; i++) {
    const curr = Math.max(prev1, nums[i] + prev2);
    prev2 = prev1;
    prev1 = curr;
  }

  return prev1;
}
```

---

### 🚀 6. Visual Walkthrough

```
nums = [2, 7, 9, 3, 1]

dp[0] = 2
dp[1] = max(2, 7) = 7

i=2: curr = max(7, 9+2=11) = 11 → prev2=7, prev1=11
i=3: curr = max(11, 3+7=10) = 11 → prev2=11, prev1=11
i=4: curr = max(11, 1+11=12) = 12 → prev2=11, prev1=12

→ return 12 ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * House Robber - DP O(1) Space
 * Time: O(n) | Space: O(1)
 */
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
```

---

## 🧪 Test Cases

```javascript
console.log(rob([1, 2, 3, 1])); // 4

console.log(rob([2, 7, 9, 3, 1])); // 12

console.log(rob([1])); // 1
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: DP - Choose or Skip

💡 KEY INSIGHT:
   "dp[i] = max(dp[i-1], nums[i] + dp[i-2])"
   "Skip: dp[i-1] | Rob: nums[i] + dp[i-2]"

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: House Robber II (#213)
// Nhà đầu nối với nhà cuối → không cướp cả 2 đầu
function robII(nums) {
  if (nums.length === 1) return nums[0];
  return Math.max(robRange(nums, 0, nums.length - 2),
                 robRange(nums, 1, nums.length - 1));
  
  function robRange(nums, start, end) {
    let prev1 = 0, prev2 = 0;
    for (let i = start; i <= end; i++) {
      const curr = Math.max(prev1, nums[i] + prev2);
      prev2 = prev1;
      prev1 = curr;
    }
    return prev1;
  }
}

// Variation 2: House Robber III (#337)
// Tree, không cướp 2 nodes liền kề (parent-child)
function robIII(root) {
  function dfs(node) {
    if (!node) return [0, 0]; // [rob, notRob]
    const [robLeft, notRobLeft] = dfs(node.left);
    const [robRight, notRobRight] = dfs(node.right);
    const rob = node.val + notRobLeft + notRobRight;
    const notRob = Math.max(robLeft, notRobLeft) + 
                   Math.max(robRight, notRobRight);
    return [rob, notRob];
  }
  return Math.max(...dfs(root));
}

// Variation 3: Paint House (#256)
// Mỗi nhà có 3 màu, 2 nhà liền kề khác màu
function minCost(costs) {
  if (!costs.length) return 0;
  for (let i = 1; i < costs.length; i++) {
    costs[i][0] += Math.min(costs[i-1][1], costs[i-1][2]);
    costs[i][1] += Math.min(costs[i-1][0], costs[i-1][2]);
    costs[i][2] += Math.min(costs[i-1][0], costs[i-1][1]);
  }
  return Math.min(...costs[costs.length - 1]);
}

// Variation 4: Delete and Earn (#740)
// Chọn number i → xóa i-1 và i+1
function deleteAndEarn(nums) {
  const max = Math.max(...nums);
  const dp = Array(max + 1).fill(0);
  for (const num of nums) dp[num] += num;
  
  for (let i = 2; i <= max; i++) {
    dp[i] = Math.max(dp[i - 1], dp[i - 2] + dp[i]);
  }
  return dp[max];
}

// Variation 5: Longest Palindromic Substring (#5)
// Tìm substring palindrome dài nhất
```

---

## ➡️ Bài tiếp theo

[Bài 4: Longest Palindromic Substring](./004-longest-palindromic.md)
