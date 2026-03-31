# #40 - Combination Sum II

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Array, Backtracking |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/combination-sum-ii/

---

## 📖 Đề bài

### Mô tả
Cho một mảng `candidates` (có thể chứa duplicates) và một `target`. Tìm tất cả combinations có tổng bằng target. **Mỗi candidate chỉ được dùng TỐI ĐA 1 lần**.

### Ví dụ

**Example 1:**
```
Input:  candidates = [10,1,2,7,6,1,5], target = 8
Output: [[1,1,6],[1,2,5],[7]]
Giải thích:
  1+1+6=8
  1+2+5=8
  7=8
```

**Example 2:**
```
Input:  candidates = [2,5,2,1,2], target = 5
Output: [[1,2,2],[5]]
Giải thích:
  1+2+2=5
  5=5
```

### Constraints
```
2 <= candidates.length <= 25
1 <= candidates[i] <= 30
1 <= target <= 30
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Combination Sum với:
  - Mỗi candidate dùng TỐI ĐA 1 lần
  - Có duplicates trong candidates

→ Combination Sum (dùng lại) + Subsets II (skip duplicates)
→ Tăng i trong recursion (không giữ nguyên)
→ Skip duplicates trong for loop
```

---

### 🤔 2. Tư duy từng bước

> **Aha moment:**
> ```
> Kết hợp 2 patterns:
>
> 1. KHÔNG dùng lại: backtrack(i + 1, ...)
> 2. Skip duplicates: i > start && nums[i] === nums[i-1]
>
> Combination Sum II = Subsets II + Sum Check
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Mỗi phần tử dùng tối đa 1 lần"                │
│   → i + 1 trong recursion (tăng index)            │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Có duplicates trong candidates"                 │
│   → i > start && nums[i] === nums[i-1] → skip      │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Pruning: sum > target → return"                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Giữ nguyên i (dùng lại được)
// → Sẽ tạo ra combinations trùng lặp không giới hạn
// ✅ Dùng i + 1

// ❌ Pitfall 2: Không skip duplicates
// ✅ i > start && nums[i] === nums[i-1] → continue

// ❌ Pitfall 3: Không sort
// ✅ Sort trước để duplicates cạnh nhau
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Sort + Skip + i+1 (O(...)) ⭐

```javascript
function combinationSum2(candidates, target) {
  candidates.sort((a, b) => a - b); // Sort trước
  const result = [];

  function backtrack(start, path, sum) {
    if (sum === target) {
      result.push([...path]);
      return;
    }
    if (sum > target) return;

    for (let i = start; i < candidates.length; i++) {
      // Skip duplicates
      if (i > start && candidates[i] === candidates[i - 1]) continue;

      if (sum + candidates[i] > target) break; // Optional: prune

      path.push(candidates[i]);
      backtrack(i + 1, path, sum + candidates[i]); // ← i + 1
      path.pop();
    }
  }

  backtrack(0, [], 0);
  return result;
}
```

---

### 🚀 6. Visual Walkthrough

```
candidates=[1,1,2,5,6,7,10], target=8 → sort: [1,1,2,5,6,7,10]

backtrack(0, [], 0)
  i=0(1a): path=[1], sum=1 → backtrack(1, [1], 1)
    i=1(1b): nums[1]===nums[0] && 1>0? YES → SKIP ✨
    i=2(2): path=[1,2], sum=3 → backtrack(3, [1,2], 3)
      i=3(5): sum=8 = 8 → push [1,2,5] ✓
      i=4(6): sum=9 > 8 → break
    i=3(5): path=[1,5], sum=6 → backtrack(4, [1,5], 6)
      i=4(6): sum=12 > 8 → break
    i=5(7): path=[1,7], sum=8 → push [1,7] ✓
    i=6(10): > break
  i=1(1b): path=[1], sum=1 → backtrack(2, [1], 1)
    i=2(2): path=[1,2] ... → push [1,2,5] (duplicate)
    ✨ i=2: nums[2]===nums[1]? NO → dùng 2
  i=2(2): path=[2], sum=2 → backtrack(3, [2], 2)
    ...
  i=3(5): path=[5], sum=5 → backtrack(4, [5], 5)
    push [5,?] → [5,?] không được (5+...)

→ Result deduplicated: [[1,2,5],[1,7],[2,5,?],...] ✨
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Combination Sum II - Sort + Skip Duplicates + i+1
 * Time: Exponential | Space: O(depth)
 */
function combinationSum2(candidates, target) {
  candidates.sort((a, b) => a - b);
  const result = [];

  function backtrack(start, path, sum) {
    if (sum === target) { result.push([...path]); return; }
    if (sum > target) return;

    for (let i = start; i < candidates.length; i++) {
      if (i > start && candidates[i] === candidates[i - 1]) continue;
      if (sum + candidates[i] > target) break;
      path.push(candidates[i]);
      backtrack(i + 1, path, sum + candidates[i]);
      path.pop();
    }
  }

  backtrack(0, [], 0);
  return result;
}
```

---

## 🧪 Test Cases

```javascript
console.log(combinationSum2([10,1,2,7,6,1,5], 8));
// [[1,1,6],[1,2,5],[7]]

console.log(combinationSum2([2,5,2,1,2], 5));
// [[1,2,2],[5]]

console.log(combinationSum2([2], 1));
// []
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Backtracking với 1-Limited Usage + Duplicates

💡 KEY INSIGHT:
   "i + 1 (không dùng lại) + i > start skip duplicates"
   "Sort TRƯỚC"
   "Pruning: sum > target → return"

⚠️ PITFALLS:
   - Dùng i (giữ nguyên) → sai (sẽ dùng lại)
   - KHÔNG skip duplicates

✅ Đã hiểu
✅ Tự code lại được
```
