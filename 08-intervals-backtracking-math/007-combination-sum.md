# #39 - Combination Sum

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Array, Backtracking |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/combination-sum/

---

## 📖 Đề bài

### Mô tả
Cho một mảng distinct `candidates` (không có duplicates) và một target. Tìm tất cả **combinations** có tổng bằng target.

Mỗi candidate có thể được dùng **unlimited number of times**.

### Ví dụ

**Example 1:**
```
Input:  candidates = [2,3,6,7], target = 7
Output: [[2,2,3],[7]]
Giải thích:
  2+2+3 = 7
  7 = 7
```

**Example 2:**
```
Input:  candidates = [2,3,5], target = 8
Output: [[2,2,2,2],[2,3,3],[3,5]]
```

### Constraints
```
2 <= candidates.length <= 30
1 <= candidates[i] <= 200
1 <= target <= 500
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Tìm tất cả combinations có tổng = target
Đặc biệt: Dùng unlimited (không giới hạn)
→ Backtracking với index KHÔNG tăng (vì dùng lại được)
→ Thêm điều kiện dừng: sum > target
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: DFS nhưng không giới hạn

```
Giống Subsets nhưng:
  - Không push khi sum === target
  - Dừng khi sum > target
  - i để nguyên (không tăng) vì dùng lại được
```

---

#### Bước 2: "Aha moment!"

> **Aha moment:**
> ```
> KHÔNG tăng i khi dùng lại được!
>
> backtrack(i, path, sum):
>   if sum === target → push
>   if sum > target → return (pruning)
>   for j = i → n-1:
>     path.push(candidates[j])
>     backtrack(j, path, sum + candidates[j])  ← j KHÔNG tăng!
>     path.pop()
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Dùng lại được = giữ nguyên i"                  │
│   → backtrack(i, ...) thay vì backtrack(i+1, ...) │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Pruning: sum > target → return ngay"            │
│   → Loại bỏ nhánh không cần thiết                │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "BASE: sum === target → push và return"          │
│   → Không return ở đây vì có thể push rồi backtrack│
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Tăng i khi không nên
function backtrack(i, path, sum) {
  for (let j = i + 1; j < candidates.length; j++) { // ❌ Tăng i!
    path.push(candidates[j]);
    backtrack(j + 1, path, sum + candidates[j]);
    path.pop();
  }
}
// → Chỉ dùng mỗi phần tử 1 lần → sai!

// ✅ Giữ nguyên i (hoặc dùng j)
backtrack(j, path, sum + candidates[j]); // ✅ Dùng lại j

// ❌ Pitfall 2: Không prune khi sum > target
// → Chương trình sẽ explore vô số nhánh không cần thiết
// ✅ Thêm if (sum > target) return;
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Backtracking với Pruning (O(...)) ⭐

```javascript
function combinationSum(candidates, target) {
  const result = [];

  function backtrack(index, path, sum) {
    if (sum === target) {
      result.push([...path]);
      return;
    }
    if (sum > target) return;

    for (let i = index; i < candidates.length; i++) {
      path.push(candidates[i]);
      backtrack(i, path, sum + candidates[i]); // ← giữ nguyên i
      path.pop();
    }
  }

  backtrack(0, [], 0);
  return result;
}
```

**📊 Phân tích:**
```
Time:  Exponential (nhiều combinations)
Space: O(target / min(candidates)) — recursion depth
```

---

### 🚀 6. Visual Walkthrough

```
candidates=[2,3,6,7], target=7

backtrack(0, [], 0)
  i=0 (2): path=[2] → backtrack(0, [2], 2)
    i=0 (2): path=[2,2] → backtrack(0, [2,2], 4)
      i=0: path=[2,2,2] → sum=6 → backtrack(0, [2,2,2], 6)
        i=0: path=[2,2,2,2] → sum=8 > 7 → return
        i=1: path=[2,2,2,3] → sum=9 > 7 → return
      i=1: path=[2,2,3] → sum=7 = 7 → push [2,2,3] ✓
      i=2: path=[2,2,6] → sum=10 > 7 → return
    i=1: path=[2,3] → sum=5 → backtrack(1, [2,3], 5)
      i=1: path=[2,3,3] → sum=8 > 7 → return
      i=2: path=[2,3,6] → sum=11 > 7 → return
    i=2: path=[2,6] → sum=8 > 7 → return
  i=1: path=[3] → ...
  i=2: path=[6] → ...
  i=3: path=[7] → sum=7 = 7 → push [7] ✓

Result: [[2,2,3],[7]] ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Combination Sum - Backtracking với Pruning
 * Time: Exponential | Space: O(depth)
 */
function combinationSum(candidates, target) {
  const result = [];

  function backtrack(index, path, sum) {
    if (sum === target) { result.push([...path]); return; }
    if (sum > target) return;

    for (let i = index; i < candidates.length; i++) {
      path.push(candidates[i]);
      backtrack(i, path, sum + candidates[i]); // i giữ nguyên
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
console.log(combinationSum([2,3,6,7], 7));
// [[2,2,3],[7]]

console.log(combinationSum([2,3,5], 8));
// [[2,2,2,2],[2,3,3],[3,5]]

console.log(combinationSum([2], 1));
// []
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Backtracking với Unlimited Usage

💡 KEY INSIGHT:
   "i giữ nguyên (không tăng) khi dùng lại được"
   "Pruning: sum > target → return"
   "push → backtrack → pop"

⚠️ PITFALLS:
   - KHÔNG tăng i (để dùng lại)
   - Prune khi sum > target

🔄 VARIATIONS:
   - Combination Sum II (#40) → dùng mỗi phần tử 1 lần + duplicates

✅ Đã hiểu
✅ Tự code lại được
```
