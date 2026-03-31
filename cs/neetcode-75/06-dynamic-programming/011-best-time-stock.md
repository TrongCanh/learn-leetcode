# #714 - Best Time to Buy and Sell Stock with Transaction Fee

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | DP, Greedy |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-transaction-fee/

---

## 📖 Đề bài

### Mô tả
Cho một mảng `prices` với giá cổ phiếu mỗi ngày và một `fee` cho mỗi giao dịch. Tìm **lợi nhuận tối đa** với không giới hạn giao dịch.

### Ví dụ

**Example 1:**
```
Input:  prices = [1,3,2,8,4,9], fee = 2
Output: 8
Giải thích:
  Mua ngày 0 (1), bán ngày 3 (8): profit = 8-1-2 = 5
  Mua ngày 4 (4), bán ngày 5 (9): profit = 9-4-2 = 3
  Tổng = 8
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Lợi nhuận max với fee mỗi giao dịch
→ DP: hold[i] và cash[i] (có 2 states)
```

---

### 🤔 2. Tư duy từng bước

> **Aha moment:**
> ```
> 2 states mỗi ngày:
>   cash[i] = lợi nhuận max khi KHÔNG hold (có thể bán)
>   hold[i] = lợi nhuận max khi ĐANG hold (có thể mua)
>
> cash[i] = max(cash[i-1], prices[i] + hold[i-1] - fee)
> hold[i] = max(hold[i-1], cash[i-1] - prices[i])
>
> → cash = lợi nhuận khi không có cổ phiếu
> → hold = lợi nhuận khi đang giữ cổ phiếu
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "2 states: cash và hold"                          │
│   → cash: không hold | hold: đang hold              │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "cash[i] = max(cash[i-1], prices[i]+hold[i-1]-fee)"│
│   "hold[i] = max(hold[i-1], cash[i-1]-prices[i])"  │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Không giới hạn giao dịch"                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: DP 2 States (O(n), O(1)) ⭐

```javascript
function maxProfit(prices, fee) {
  let cash = 0;       // Lợi nhuận khi không hold
  let hold = -prices[0]; // Lợi nhuận khi đang hold

  for (let i = 1; i < prices.length; i++) {
    cash = Math.max(cash, hold + prices[i] - fee);
    hold = Math.max(hold, cash - prices[i]);
  }

  return cash;
}
```

**📊 Phân tích:**
```
Time:  O(n)
Space: O(1)
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Best Time to Buy and Sell Stock with Fee - DP 2 States
 * Time: O(n) | Space: O(1)
 */
function maxProfit(prices, fee) {
  let cash = 0;
  let hold = -prices[0];
  for (let i = 1; i < prices.length; i++) {
    cash = Math.max(cash, hold + prices[i] - fee);
    hold = Math.max(hold, cash - prices[i]);
  }
  return cash;
}
```

---

## 🧪 Test Cases

```javascript
console.log(maxProfit([1,3,2,8,4,9], 2)); // 8

console.log(maxProfit([1,3,7,5,10,3], 3)); // 6
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: DP Stock Trading với Fee

💡 KEY INSIGHT:
   "cash = max(cash, hold + price - fee)"
   "hold = max(hold, cash - price)"

✅ Đã hiểu
✅ Tự code lại được
```
