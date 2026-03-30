# #46 - Permutations

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Array, Backtracking |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/permutations/

---

## 📖 Đề bài

### Mô tả
Cho một mảng distinct integers `nums`. Trả về **tất cả permutations** (hoán vị) có thể.

### Ví dụ

**Example 1:**
```
Input:  nums = [1,2,3]
Output: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
```

**Example 2:**
```
Input:  nums = [0,1]
Output: [[0,1],[1,0]]
```

### Constraints
```
1 <= nums.length <= 6
nums có distinct elements
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Tất cả permutations của nums
Pattern: Backtracking với used array
→ Dùng mỗi phần tử đúng 1 lần
→ n! permutations
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: So sánh với Subsets

```
Subsets: include/skip mỗi phần tử
Permutations: CHỌN THỨ TỰ cho tất cả phần tử

→ Tại mỗi vị trí, chọn 1 phần tử CHƯA dùng
```

---

#### Bước 2: "Aha moment!"

> **Aha moment:**
> ```
> Dùng used array để track phần tử nào đã dùng:
>
> backtrack(path, used):
>   if path.length === n → push vào result
>   for i = 0 → n-1:
>     if used[i] === true → SKIP (đã dùng)
>     else:
>       used[i] = true
>       path.push(nums[i])
>       backtrack(path, used)
>       path.pop()
>       used[i] = false  ← BACKTRACK
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Permutation = chọn thứ tự cho ALL elements"      │
│   → Mỗi vị trí trong path: chọn 1 element CHƯA dùng│
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "used array = tracking elements đã chọn"         │
│   → index-based, boolean array                     │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "KHÔNG dùng index trong recursion"              │
│   → Luôn duyệt 0 → n-1 (vì chọn bất kỳ vị trí nào)│
│                                                     │
│   KEY INSIGHT #4:                                   │
│   "used[i] = false SAU pop"                        │
│   → Để element có thể được chọn ở nhánh khác      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Dùng index thay vì used array
function backtrack(path, start) {
  for (let i = start; i < nums.length; i++) { // ❌ Không dùng start ở đây!
  }
}
// ✅ Permutations: duyệt 0 → n-1, skip bằng used

// ❌ Pitfall 2: Không reset used sau khi backtrack
path.pop();
used[i] = true; // ❌ Sai! Phải là used[i] = false

// ❌ Pitfall 3: Push reference của path
result.push(path); // ❌ Reference
// ✅
result.push([...path]);
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Backtracking với used array (O(n!)) ⭐

```javascript
function permute(nums) {
  const result = [];
  const used = new Array(nums.length).fill(false);

  function backtrack(path) {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue; // Đã dùng → skip

      used[i] = true;
      path.push(nums[i]);
      backtrack(path);
      path.pop();
      used[i] = false; // Backtrack
    }
  }

  backtrack([]);
  return result;
}
```

**📊 Phân tích:**
```
Time:  O(n! × n) — n! permutations, mỗi copy O(n)
Space: O(n) — recursion stack + used array
```

---

### 🚀 6. Visual Walkthrough

```
nums = [1, 2, 3]

backtrack([])

i=0(1): used=[T,F,F], path=[1] → backtrack([1])
  i=0: used[0]=T → skip
  i=1(2): used=[T,T,F], path=[1,2] → backtrack([1,2])
    i=0,1 skip, i=2(3): used=[T,T,T], path=[1,2,3] → push [1,2,3] ✓
    pop → used[2]=F
  pop → used[1]=F
  i=2(3): used=[T,F,T], path=[1,3] → backtrack([1,3])
    push [1,3,2] ✓
  pop → used[2]=F
pop → used[0]=F

i=1(2): ...

Result: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]] ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Permutations - Backtracking với used array
 * Time: O(n! × n) | Space: O(n)
 */
function permute(nums) {
  const result = [];
  const used = new Array(nums.length).fill(false);

  function backtrack(path) {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
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
console.log(permute([1, 2, 3]));
// [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]

console.log(permute([0, 1]));
// [[0,1],[1,0]]

console.log(permute([1]));
// [[1]]
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Backtracking - Permutations

💡 KEY INSIGHT:
   "used array track element đã dùng"
   "Duyệt 0→n-1, skip nếu used"
   "used[i]=false SAU pop"

⚠️ PITFALLS:
   - KHÔNG dùng index parameter
   - used[i]=false sau pop (không phải true)

🔄 VARIATIONS:
   - Permutations II (#47) → có duplicates → skip giống nhau

✅ Đã hiểu
✅ Tự code lại được
```
