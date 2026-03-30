# #47 - Permutations II

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| ** Chủ đề** | Array, Backtracking |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/permutations-ii/

---

## 📖 Đề bài

### Mô tả
Cho một mảng `nums` có thể chứa duplicates. Trả về tất cả **unique permutations**.

### Ví dụ

**Example 1:**
```
Input:  nums = [1,1,2]
Output: [[1,1,2],[1,2,1],[2,1,1]]
```

**Example 2:**
```
Input:  nums = [1,2,2]
Output: [[1,2,2],[2,1,2],[2,2,1]]
```

### Constraints
```
1 <= nums.length <= 8
-10 <= nums[i] <= 10
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Permutations nhưng KHÔNG trùng lặp
→ Giống Permutations + skip duplicates
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Sort + used + skip

> **Aha moment:**
> ```
> Giống Subsets II nhưng với used array:
>
> if (used[i]) skip (đã dùng rồi)
> if (i > 0 && nums[i] === nums[i-1] && !used[i-1]) skip
> → Có 2 conditions:
>   1. used[i] = true → đã dùng ở path hiện tại
>   2. nums[i] === nums[i-1] && !used[i-1] → duplicate ở cùng level CHƯA dùng
> ```
>
> **Condition 2 giải thích:**
> ```
> Nếu nums[i] === nums[i-1] VÀ nums[i-1] chưa được dùng ở level này
> → Có nghĩa nums[i-1] đang bị SKIP ở level này
> → Nếu ta dùng nums[i] → tạo ra duplicate permutation
> → Skip!
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "used[i] + used[i-1] để skip duplicates"          │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "!used[i-1] = nums[i-1] chưa dùng ở level này"  │
│   → Đang ở level chọn element cho vị trí hiện tại│
│   → nums[i-1] chưa chọn → nums[i] cũng skip       │
│   → Vì nếu chọn nums[i] mà nums[i-1] chưa chọn   │
│     → Sẽ tạo ra trùng lặp (vì nums[i-1] có thể ở │
│       vị trí này thay thế nums[i])               │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Sort ĐẦU TIÊN"                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Skip khi nums[i] === nums[i-1] mà không check used[i-1]
// if (i > 0 && nums[i] === nums[i-1]) continue; // ❌ Không đủ!
// Ví dụ: [1a, 1b], đang chọn vị trí 2:
//   i=1 (1b): nums[1]===nums[0] && !used[0] → skip ✓
//   Nhưng nếu used[0]=true (1a đã dùng) → không skip → dùng 1b ✓
// ✅ Cần cả 2 điều kiện

// ❌ Pitfall 2: Không sort
// ✅ Sort trước
nums.sort((a, b) => a - b);
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Sort + used + Skip Duplicates (O(n!)) ⭐

```javascript
function permuteUnique(nums) {
  nums.sort((a, b) => a - b); // Sort
  const result = [];
  const used = new Array(nums.length).fill(false);

  function backtrack(path) {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;

      // Skip duplicates ở cùng level
      if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) continue;

      used[i] = true;
      path.push(nums[i]);
      backtrack(path);
      path.pop();
      used[i] = false;
    }
  }

  backtrack([]);
  return result;
}
```

---

### 🚀 6. Visual Walkthrough

```
nums = [1, 1, 2] → sort: [1, 1, 2]

backtrack([])

i=0(1a): used=[T,F,F], path=[1] → backtrack([1])
  i=0 skip, i=1(1b): nums[1]===nums[0] && !used[0]? FALSE (used[0]=T)
    → dùng → used=[T,T,F], path=[1,1] → backtrack([1,1])
      i=2(2): used=[T,T,F], path=[1,1,2] → push [1,1,2] ✓
      pop → used=[T,T,F]
    pop → used=[T,F,F]
  i=2(2): used=[T,F,T], path=[1,2] → backtrack([1,2])
    push [1,2,1] ✓
    pop → used=[T,F,T]
  pop → used=[F,F,F]

i=1(1b): used=[F,T,F], path=[1] → backtrack([1])
  i=0(1a): nums[0]===nums[1] && !used[1]? FALSE (used[1]=T)
    → dùng → used=[T,T,F], path=[1,1] → backtrack([1,1])
      i=2(2): used=[T,T,F], path=[1,1,2] → DUPLICATE → SKIP ✓
    → pop
  i=2(2): used=[F,T,T], path=[1,2] → DUPLICATE ✓
  pop

i=2(2): used=[F,F,T], path=[2] → backtrack([2])
  push [2,1,1] ✓

Result: [[1,1,2],[1,2,1],[2,1,1]] ✓ (3 unique permutations)
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Permutations II - Sort + used + Skip Duplicates
 * Time: O(n! × n) | Space: O(n)
 */
function permuteUnique(nums) {
  nums.sort((a, b) => a - b);
  const result = [];
  const used = new Array(nums.length).fill(false);

  function backtrack(path) {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) continue;
      used[i] = true;
      path.push(nums[i]);
      backtrack(path);
      path.pop();
      used[i] = false;
    }
  }

  backtrack([]);
  return result;
}
```

---

## 🧪 Test Cases

```javascript
console.log(permuteUnique([1, 1, 2]));
// [[1,1,2],[1,2,1],[2,1,1]]

console.log(permuteUnique([1, 2, 2]));
// [[1,2,2],[2,1,2],[2,2,1]]

console.log(permuteUnique([2, 2, 1, 1]));
// 12 unique permutations
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Backtracking Permutations với Duplicate Skip

💡 KEY INSIGHT:
   "Sort + used[i] + used[i-1] = skip duplicates"
   "!used[i-1]: duplicate ở cùng level CHƯA dùng"
   "→ Skip để tránh tạo trùng permutation"

⚠️ PITFALLS:
   - PHẢI sort
   - Dùng cả 3 điều kiện: used[i], i>0, nums[i]===nums[i-1], !used[i-1]

✅ Đã hiểu
✅ Tự code lại được
```
