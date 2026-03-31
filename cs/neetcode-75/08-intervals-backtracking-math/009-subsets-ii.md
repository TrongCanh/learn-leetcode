# #90 - Subsets II

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Array, Backtracking |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/subsets-ii/

---

## 📖 Đề bài

### Mô tả
Cho một mảng nums có thể chứa **duplicates**. Trả về tất cả các subsets **không trùng lặp** (unique subsets).

### Ví dụ

**Example 1:**
```
Input:  nums = [4,4,4,1,4]
Output:
[
  [],
  [1],
  [4],
  [4,4],
  [4,4,4],
  [4,4,4,4],
  [4,4,4,4,4],
  [1,4],
  [4,1,4],
  [4,4,1],
  [4,4,4,1],
  [4,4,4,4,1],
  [1,4,4],
  [1,4,4,4],
  [4,1,4,4]
]
(Deduplicate: [[],[1],[4],[1,4],[4,4],[1,4,4],[4,4,4],[1,4,4,4],[4,4,4,4],[1,4,4,4,4]])
```

**Example 2:**
```
Input:  nums = [1,2,2]
Output: [[],[1],[2],[1,2],[2,2],[1,2,2]]
```

### Constraints
```
1 <= nums.length <= 10
-10 <= nums[i] <= 10
nums có thể chứa duplicates
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Subsets nhưng KHÔNG trùng lặp
→ Giống Subsets + thêm bước skip duplicates
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Sort trước

```
nums = [1, 2, 2]
Sorted: [1, 2, 2]

→ Duplicates sẽ nằm cạnh nhau
→ Có thể skip 1 trong 2 giá trị giống nhau
```

---

#### Bước 2: "Aha moment!" — Skip duplicates

> **Aha moment:**
> ```
> Khi đã sort:
>   [1, 2a, 2b, ...]
>
> Skip nếu:
>   nums[i] === nums[i-1] && nums[i-1] KHÔNG được dùng ở level hiện tại
>
> → if (i > 0 && nums[i] === nums[i-1] && nums[i-1] NOT used at this level)
> → skip!
>
> → Dùng: i > start để track level
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "SORT ĐẦU TIÊN → duplicates nằm cạnh nhau"      │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Skip nếu nums[i] === nums[i-1] VÀ i > start"   │
│   → i > start: đảm bảo chỉ skip ở SAME LEVEL      │
│   → 2a đã dùng ở level này → 2b skip (trùng)     │
│   → 2b không dùng ở level này → 2b được dùng       │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "i > start là QUAN TRỌNG!"                       │
│   → Nếu dùng i > 0 → skip nhầm ở level khác       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Không sort trước
// → Duplicates không nằm cạnh nhau → skip sai

// ❌ Pitfall 2: Dùng i > 0 thay vì i > start
// Ví dụ: nums=[1,2,2], đang ở level 2 (path=[1])
//   i=1 (2a): dùng → path=[1,2]
//   i=2 (2b): nums[2]===nums[1] && 2>1 → skip ✓ (đúng)
// Nhưng nếu dùng i > 0:
//   i=2 (2b): 2 > 0 → skip ✓ vẫn đúng trong trường hợp này
// Trường hợp phức tạp:
//   path=[], i=0(1): dùng → path=[1]
//   path=[1], i=1(2a): dùng → path=[1,2]
//   path=[1,2], i=2(2b): nums[2]===nums[1] && 2>2 → FALSE → dùng → [1,2,2] ✓
// Nếu dùng i > 0: 2 > 0 → TRUE → skip [1,2,2] → SAI!
// ✅ Dùng i > start

function backtrack(start, path) {
  result.push([...path]);
  for (let i = start; i < nums.length; i++) {
    if (i > start && nums[i] === nums[i - 1]) continue; // ✅
  }
}
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Sort + Skip Duplicates (O(2^n)) ⭐

```javascript
function subsetsWithDup(nums) {
  nums.sort((a, b) => a - b); // Sort để duplicates cạnh nhau
  const result = [];

  function backtrack(start, path) {
    result.push([...path]);

    for (let i = start; i < nums.length; i++) {
      // Skip duplicates ở cùng level
      if (i > start && nums[i] === nums[i - 1]) continue;

      path.push(nums[i]);
      backtrack(i + 1, path);
      path.pop();
    }
  }

  backtrack(0, []);
  return result;
}
```

---

### 🚀 6. Visual Walkthrough

```
nums = [1, 2, 2] → sort: [1, 2, 2]

backtrack(0, [])
  push [] ✓
  i=0(1): path=[1] → backtrack(1, [1])
    push [1] ✓
    i=1(2a): path=[1,2] → backtrack(2, [1,2])
      push [1,2] ✓
      i=2(2b): nums[2]===nums[1] && 2>2? NO → dùng → path=[1,2,2] → backtrack(3, [1,2,2])
        push [1,2,2] ✓
        pop [2]
      pop [2]
    i=2(2b): nums[2]===nums[1] && 2>1? YES → SKIP ← ✨ Bỏ qua 2b sau 2a ở level này!
  i=1(2): path=[2] → backtrack(2, [2])
    push [2] ✓
    i=2(2b): nums[2]===nums[2] && 2>2? NO → dùng → [2,2] ✓

Result: [[],[1],[1,2],[1,2,2],[2],[2,2]] ✓ (unique)
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Subsets II - Sort + Skip Duplicates
 * Time: O(2^n × n) | Space: O(n)
 */
function subsetsWithDup(nums) {
  nums.sort((a, b) => a - b);
  const result = [];

  function backtrack(start, path) {
    result.push([...path]);
    for (let i = start; i < nums.length; i++) {
      if (i > start && nums[i] === nums[i - 1]) continue;
      path.push(nums[i]);
      backtrack(i + 1, path);
      path.pop();
    }
  }

  backtrack(0, []);
  return result;
}
```

---

## 🧪 Test Cases

```javascript
console.log(subsetsWithDup([1, 2, 2]));
// [[],[1],[2],[1,2],[2,2],[1,2,2]]

console.log(subsetsWithDup([4,4,4,1,4]));
// [[],[1],[4],[1,4],[4,4],[1,4,4],[4,4,4],[1,4,4,4],[4,4,4,4],[1,4,4,4,4]]
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Backtracking với Duplicate Skip

💡 KEY INSIGHT:
   "Sort TRƯỚC → duplicates cạnh nhau"
   "i > start (không phải i > 0) để skip đúng duplicates"
   "2a dùng → 2b skip (same level)"
   "2b không dùng → 2b dùng (vì start khác)"

⚠️ PITFALLS:
   - KHÔNG dùng i > 0 (phải là i > start)
   - PHẢI sort trước

✅ Đã hiểu
✅ Tự code lại được
```
