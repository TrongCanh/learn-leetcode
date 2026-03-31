# #62 - Unique Paths

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | DP, Math |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/unique-paths/

---

## 📖 Đề bài

### Mô tả
Một robot bắt đầu từ góc trên trái `(0, 0)` và cần đến góc dưới phải `(m-1, n-1)` của một lưới `m × n`. Robot chỉ có thể di chuyển **xuống** hoặc **sang phải**. Đếm số **đường đi duy nhất**.

### Ví dụ

**Example 1:**
```
Input:  m = 3, n = 7
Output: 28
```

**Example 2:**
```
Input:  m = 3, n = 2
Output: 3
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Số đường đi từ (0,0) → (m-1, n-1)
Chỉ di chuyển: xuống hoặc phải
→ Cần đi xuống (m-1) lần VÀ sang phải (n-1) lần
→ Tổng (m-1+n-1) bước, chọn (m-1) bước xuống
→ C(m+n-2, m-1)
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: DP

> **Aha moment:**
> ```
> dp[i][j] = dp[i-1][j] + dp[i][j-1]
> dp[0][j] = 1, dp[i][0] = 1
> ```
>
> → Tối ưu: chỉ cần 1 row dp

#### Bước 2: Math (tối ưu hơn)

> **→ C(m+n-2, m-1) = (m+n-2)! / ((m-1)! × (n-1)!)**

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "dp[i][j] = dp[i-1][j] + dp[i][j-1]"           │
│   → Xuống từ trên + Sang từ trái                 │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "dp[i] = dp[i] + dp[i-1] (1D optimization)"     │
│   → dp[j] += dp[j-1] với j=1→n-1               │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Math: C(m+n-2, m-1)"                           │
│   → Combination formula                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: DP 1D (O(m × n), O(n)) ⭐

```javascript
function uniquePaths(m, n) {
  const dp = Array(n).fill(1);

  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      dp[j] += dp[j - 1];
    }
  }

  return dp[n - 1];
}
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Unique Paths - DP 1D Row
 * Time: O(m × n) | Space: O(n)
 */
function uniquePaths(m, n) {
  const dp = Array(n).fill(1);
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      dp[j] += dp[j - 1];
    }
  }
  return dp[n - 1];
}
```

---

## 🧪 Test Cases

```javascript
console.log(uniquePaths(3, 7)); // 28

console.log(uniquePaths(3, 2)); // 3
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Grid DP

💡 KEY INSIGHT:
   "dp[i][j] = dp[i-1][j] + dp[i][j-1]"
   "1D: dp[j] += dp[j-1]"

✅ Đã hiểu
✅ Tự code lại được
```
