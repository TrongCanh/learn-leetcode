# #416 - Partition Equal Subset Sum

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | DP |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/partition-equal-subset-sum/

---

## 📖 Đề bài

### Mô tả
Cho một mảng `nums`. Kiểm tra xem có thể chia thành **2 subsets có tổng bằng nhau** hay không.

### Ví dụ

**Example 1:**
```
Input:  nums = [1,5,11,5]
Output: true
Giải thích: Có thể chia thành [1,5,5] và [11] → tổng = 11
```

**Example 2:**
```
Input:  nums = [1,2,3,5]
Output: false
Giải thích: Tổng = 11, không chia được thành 2 subsets = 5.5
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Có thể chia 2 subsets tổng bằng nhau?
→ Tổng chẵn? sum/2 có thể đạt được?
→ Đây là 0/1 Knapsack: tìm subset có sum = target
```

---

### 🤔 2. Tư duy từng bước

> **Aha moment:**
> ```
> sum = tổng mảng
> Nếu sum lẻ → return false
> target = sum / 2
>
> → Tìm xem có subset nào có tổng = target?
> → 0/1 Knapsack: dp[i] = true nếu có subset có tổng = i
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "sum lẻ → false ngay"                           │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "target = sum / 2 → 0/1 Knapsack"               │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "dp[i] = true nếu tổng i có thể đạt được"    │
│   → dp[j] = dp[j] || dp[j - num]                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Không check sum % 2 !== 0
// → sum = 11, target = 5.5 → không hợp lệ

// ❌ Pitfall 2: Loop ngược trong 0/1 Knapsack
// for (let j = target; j >= num; j--) // ✅
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: DP 0/1 Knapsack (O(n × sum)) ⭐

```javascript
function canPartition(nums) {
  const sum = nums.reduce((a, b) => a + b, 0);
  if (sum % 2 !== 0) return false;

  const target = sum / 2;
  const dp = Array(target + 1).fill(false);
  dp[0] = true;

  for (const num of nums) {
    for (let j = target; j >= num; j--) {
      dp[j] = dp[j] || dp[j - num];
    }
  }

  return dp[target];
}
```

---

### 🚀 6. Visual Walkthrough

```
nums = [1, 5, 11, 5], sum = 22, target = 11

dp = [T,F,F,F,F,F,F,F,F,F,F,F]

num=1: for j=11→1:
  j=11: dp[11]=dp[11]||dp[10]=F
  ...
  j=1: dp[1]=dp[1]||dp[0]=T → dp[1]=T

num=5: for j=11→5:
  j=11: dp[11]=dp[11]||dp[6]=F
  ...
  j=5: dp[5]=dp[5]||dp[0]=T → dp[5]=T

num=11: for j=11→11:
  j=11: dp[11]=dp[11]||dp[0]=T → dp[11]=T ✓

→ return true ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Partition Equal Subset Sum - 0/1 Knapsack
 * Time: O(n × sum) | Space: O(sum)
 */
function canPartition(nums) {
  const sum = nums.reduce((a, b) => a + b, 0);
  if (sum % 2 !== 0) return false;
  const target = sum / 2;
  const dp = Array(target + 1).fill(false);
  dp[0] = true;
  for (const num of nums) {
    for (let j = target; j >= num; j--) {
      dp[j] = dp[j] || dp[j - num];
    }
  }
  return dp[target];
}
```

---

## 🧪 Test Cases

```javascript
console.log(canPartition([1, 5, 11, 5])); // true

console.log(canPartition([1, 2, 3, 5])); // false

console.log(canPartition([1, 2, 5])); // false
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: 0/1 Knapsack cho Subset Sum

💡 KEY INSIGHT:
   "sum lẻ → false | target = sum/2"
   "dp[j] = dp[j] || dp[j-num]"
   "Loop ngược j = target → num"

✅ Đã hiểu
✅ Tự code lại được
```
