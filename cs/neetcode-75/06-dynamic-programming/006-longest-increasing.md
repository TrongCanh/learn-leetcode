# #300 - Longest Increasing Subsequence

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | DP, Binary Search |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/longest-increasing-subsequence/

---

## 📖 Đề bài

### Mô tả
Cho một mảng `nums`. Tìm **độ dài của LIS** (Longest Increasing Subsequence) — subsequence không nhất thiết liền kề nhưng phải theo thứ tự tăng dần.

### Ví dụ

**Example 1:**
```
Input:  nums = [10,9,2,5,3,7,101,18]
Output: 4
Giải thích: LIS = [2,3,7,101] hoặc [2,3,7,18] → độ dài 4
```

**Example 2:**
```
Input:  nums = [0,1,0,3,2,3]
Output: 4
```

### Constraints
```
1 <= nums.length <= 2500
-10^4 <= nums[i] <= 10^4
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Độ dài LIS
Cách 1: DP O(n²)
Cách 2: Binary Search O(n log n) ← TỐI ƯU
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: DP O(n²)

```
dp[i] = LIS kết thúc tại i
dp[i] = max(dp[j] + 1) cho j < i và nums[j] < nums[i]
```

---

#### Bước 2: "Aha moment!" — Binary Search (Patience Sorting)

> **Aha moment:**
> **Dùng array `tails` = dãy tails của LIS có độ dài khác nhau:**
>
> ```
> Với mỗi num:
>   - Tìm vị trí thích hợp trong tails bằng Binary Search
>   - Nếu num > tails[tails.length-1]: push
>   - Ngược lại: thay thế tails[pos] = num
>
> tails[i] = smallest tail của LIS có độ dài i+1
>
> → tails.length = LIS length!
> ```
>
> **→ Tìm vị trí = lower_bound (first >= num)**

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "tails[i] = smallest tail của LIS độ dài i+1"    │
│   → tails luôn sorted                               │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Binary Search: tìm first tail >= num"            │
│   → num > last tail → push (tăng LIS)              │
│   → num <= last tail → thay thế tails[pos]        │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "tails.length = LIS length"                       │
│   → Không cần tìm LIS thực sự, chỉ cần độ dài    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Dùng bisect_right thay vì bisect_left
// → Với LIS, cần first >= num (lower_bound)
// → bisect_right sẽ tìm first > num → sai!

// ❌ Pitfall 2: tails[0] không initialized
// → tails = [nums[0]] khởi tạo

// ❌ Pitfall 3: Binary Search tự viết sai
// → Dùng built-in hoặc viết cẩn thận
```

---

### 🔄 5. Các hướng tiếp cận

#### 🔹 Cách 1: DP O(n²) — dễ hiểu

```javascript
function lengthOfLIS(nums) {
  if (nums.length === 0) return 0;
  const dp = Array(nums.length).fill(1);

  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
  }

  return Math.max(...dp);
}
```

---

#### 🔹 Cách 2: Binary Search O(n log n) ⭐

```javascript
function lengthOfLIS(nums) {
  if (nums.length === 0) return 0;

  const tails = [nums[0]];

  for (let i = 1; i < nums.length; i++) {
    let left = 0;
    let right = tails.length;

    // Binary search: tìm vị trí để insert
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (tails[mid] < nums[i]) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    if (left === tails.length) {
      tails.push(nums[i]); // num lớn hơn mọi tail → tăng LIS
    } else {
      tails[left] = nums[i]; // Thay thế
    }
  }

  return tails.length;
}
```

**📊 Phân tích:**
```
Time:  O(n log n)
Space: O(n) — tails array
```

---

### 🚀 6. Visual Walkthrough

```
nums = [10, 9, 2, 5, 3, 7, 101, 18]

tails = [10]

i=1 (9): left=0, right=1
  mid=0: tails[0]=10 >= 9 → right=0
  → left=0, tails[0]=9

tails = [9]

i=2 (2): left=0, right=1
  mid=0: tails[0]=9 >= 2 → right=0
  → left=0, tails[0]=2

tails = [2]

i=3 (5): left=0, right=1
  mid=0: tails[0]=2 < 5 → left=1
  → left=1, tails.push(5)

tails = [2, 5]

i=4 (3): left=0, right=2
  mid=1: tails[1]=5 >= 3 → right=1
  mid=0: tails[0]=2 < 3 → left=1
  → left=1, tails[1]=3

tails = [2, 3]

i=5 (7): left=0, right=2
  mid=1: tails[1]=3 < 7 → left=2
  → left=2, tails.push(7)

tails = [2, 3, 7]

i=6 (101): left=0, right=3
  mid=1: tails[1]=3 < 101 → left=2
  mid=2: tails[2]=7 < 101 → left=3
  → left=3, tails.push(101)

tails = [2, 3, 7, 101]

i=7 (18): left=0, right=4
  mid=2: tails[2]=7 < 18 → left=3
  mid=3: tails[3]=101 >= 18 → right=3
  → left=3, tails[3]=18

tails = [2, 3, 7, 18]

→ return tails.length = 4 ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Longest Increasing Subsequence - Binary Search
 * Time: O(n log n) | Space: O(n)
 */
function lengthOfLIS(nums) {
  if (nums.length === 0) return 0;

  const tails = [nums[0]];

  for (let i = 1; i < nums.length; i++) {
    let left = 0;
    let right = tails.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (tails[mid] < nums[i]) left = mid + 1;
      else right = mid;
    }

    if (left === tails.length) tails.push(nums[i]);
    else tails[left] = nums[i];
  }

  return tails.length;
}
```

---

## 🧪 Test Cases

```javascript
console.log(lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18])); // 4

console.log(lengthOfLIS([0, 1, 0, 3, 2, 3])); // 4

console.log(lengthOfLIS([7, 7, 7, 7, 7])); // 1

console.log(lengthOfLIS([1, 2, 3, 4, 5])); // 5
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: LIS - Binary Search với tails

💡 KEY INSIGHT:
   "tails[i] = smallest tail của LIS độ dài i+1"
   "Binary Search: tìm first >= num"
   "tails.length = LIS length"

⚠️ PITFALLS:
   - Dùng bisect_left (first >=)
   - tails[0] = nums[0]

🔄 VARIATIONS:
   - Longest Divisible Subset (#368) → similar DP
   - Russian Doll Envelopes (#354) → 2D LIS

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Longest Increasing Subsequence II (#2409)
// LIS với binary search O(n log n)
function lengthOfLIS(nums) {
  const tails = [];
  for (const num of nums) {
    let left = 0, right = tails.length;
    while (left < right) {
      const mid = (left + right) >> 1;
      if (tails[mid] < num) left = mid + 1;
      else right = mid;
    }
    tails[left] = num;
    if (left === tails.length) tails.push(num);
  }
  return tails.length;
}

// Variation 2: Number of LIS (#673)
// Đếm số LIS
function findNumberOfLIS(nums) {
  const n = nums.length;
  const lengths = Array(n).fill(1);
  const counts = Array(n).fill(1);
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        if (lengths[j] + 1 > lengths[i]) {
          lengths[i] = lengths[j] + 1;
          counts[i] = counts[j];
        } else if (lengths[j] + 1 === lengths[i]) {
          counts[i] += counts[j];
        }
      }
    }
  }
  
  const maxLen = Math.max(...lengths);
  return lengths.reduce((sum, len, i) => 
    len === maxLen ? sum + counts[i] : sum, 0);
}

// Variation 3: Longest Bitonic Subsequence
// Tăng rồi giảm
function longestBitonic(nums) {
  const lis = Array(nums.length).fill(1);
  const lds = Array(nums.length).fill(1);
  
  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) lis[i] = Math.max(lis[i], lis[j] + 1);
    }
  }
  
  for (let i = nums.length - 2; i >= 0; i--) {
    for (let j = nums.length - 1; j > i; j--) {
      if (nums[j] < nums[i]) lds[i] = Math.max(lds[i], lds[j] + 1);
    }
  }
  
  return Math.max(...lis.map((v, i) => v + lds[i] - 1));
}

// Variation 4: Russian Doll Envelopes (#354)
// LIS 2D
function maxEnvelopes(envelopes) {
  envelopes.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const heights = envelopes.map(e => e[1]);
  return lengthOfLIS(heights);
}

// Variation 5: Minimum Number of Removals (#1671)
// Xóa ít nhất để thành increasing
function minimumRemoval(nums) {
  const n = nums.length;
  const lis = Array(n).fill(1);
  
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        lis[i] = Math.max(lis[i], lis[j] + 1);
      }
    }
  }
  
  const maxLis = Math.max(...lis);
  return n - maxLis;
}
```

---

## ➡️ Quay lại README Week 6
