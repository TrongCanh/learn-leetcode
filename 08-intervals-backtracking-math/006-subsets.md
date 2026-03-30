# #78 - Subsets

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Array, Backtracking, Bit Manipulation |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/subsets/

---

## 📖 Đề bài

### Mô tả
Cho một mảng distinct integers `nums`. Trả về **tất cả các subsets** (tập con) có thể, bao gồm tập rỗng và chính nums.

### Ví dụ

**Example 1:**
```
Input:  nums = [1,2,3]
Output: [[],[1],[2],[3],[1,2],[1,3],[2,3],[1,2,3]]
```

**Example 2:**
```
Input:  nums = [0]
Output: [[],[0]]
```

### Constraints
```
1 <= nums.length <= 10
nums có distinct elements
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Liệt kê tất cả subsets của nums
Pattern: Backtracking / DFS
Với n phần tử → 2^n subsets
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Hình dung cây quyết định

```
nums = [1, 2, 3]

Cây DFS:
                    []
          /         |         \
        [1]       [2]        [3]
       /   \      |
     [1,2] [1,3] [2,3]
       |
    [1,2,3]
```

---

#### Bước 2: Backtracking pattern

> **Aha moment:**
> ```
> backtrack(index, path):
>   1. BASE: push copy of path → result
>   2. FOR i = index → n-1:
>        path.push(nums[i])
>        backtrack(i + 1, path)  ← đi sâu hơn
>        path.pop()               ← BACKTRACK
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Tại mỗi index: 2 lựa chọn — include hoặc skip" │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Luôn push path TRƯỚC khi for loop"              │
│   → Đảm bảo push empty set [] vào result          │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "BACKTRACK = pop() SAU khi gọi đệ quy"          │
│   → path.pop() để quay về trạng thái trước       │
│                                                     │
│   KEY INSIGHT #4:                                   │
│   "2^n subsets = tất cả binary strings của n bits" │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Push array reference thay vì copy
result.push(path); // ❌ Reference → thay đổi khi path.pop()
// ✅ Push [...path] (spread copy)
result.push([...path]);

// ❌ Pitfall 2: Gọi backtrack(index + 1) thay vì (i + 1)
// Dùng i + 1 để không dùng lại phần tử đã dùng
function backtrack(path, index) {
  for (let i = index; i < nums.length; i++) { // ✅
  // for (let i = index + 1; ...) { // ❌ Không đúng!
  // }
}

// ❌ Pitfall 3: Quên backtrack (pop)
// Phải pop sau mỗi recursion để restore path
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Backtracking (O(2^n)) ⭐

```javascript
function subsets(nums) {
  const result = [];

  function backtrack(index, path) {
    // Push tất cả subsets (bao gồm empty set)
    result.push([...path]);

    // Try adding each remaining element
    for (let i = index; i < nums.length; i++) {
      path.push(nums[i]);
      backtrack(i + 1, path);
      path.pop(); // Backtrack
    }
  }

  backtrack(0, []);
  return result;
}
```

**📊 Phân tích:**
```
Time:  O(2^n × n) — 2^n subsets, mỗi subset copy O(n)
Space: O(n) — recursion stack
```

---

#### 🔹 Cách 2: Bit Manipulation (O(n × 2^n))

```javascript
function subsets(nums) {
  const result = [];
  const n = nums.length;

  // 0 đến 2^n - 1
  for (let mask = 0; mask < (1 << n); mask++) {
    const subset = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        subset.push(nums[i]);
      }
    }
    result.push(subset);
  }

  return result;
}
```

---

### 🚀 6. Visual Walkthrough

```
nums = [1, 2, 3]

backtrack(0, [])
  push [] ✓
  i=0: path=[1] → backtrack(1, [1])
    push [1] ✓
    i=1: path=[1,2] → backtrack(2, [1,2])
      push [1,2] ✓
      i=2: path=[1,2,3] → backtrack(3, [1,2,3])
        push [1,2,3] ✓
        i=3: stop (i < n? no)
      pop 3
    pop 2
    i=2: path=[1,3] → backtrack(3, [1,3])
      push [1,3] ✓
      pop 3
    pop 1
  i=1: path=[2] → backtrack(2, [2])
    push [2] ✓
    i=2: path=[2,3] → backtrack(3, [2,3])
      push [2,3] ✓
      pop 3
    pop 2
  i=2: path=[3] → backtrack(3, [3])
    push [3] ✓
    pop 3

Result: [[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]] ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Subsets - Backtracking
 * Time: O(2^n × n) | Space: O(n)
 */
function subsets(nums) {
  const result = [];

  function backtrack(index, path) {
    result.push([...path]);
    for (let i = index; i < nums.length; i++) {
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
console.log(subsets([1, 2, 3]));
// [[],[1],[2],[3],[1,2],[1,3],[2,3],[1,2,3]]

console.log(subsets([0]));
// [[],[0]]

console.log(subsets([1]));
// [[],[1]]
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Backtracking - Generate All Subsets

💡 KEY INSIGHT:
   "Luôn push path TRƯỚC for loop (để push [])"
   "push → recurse → pop"
   "i + 1 để không reuse elements"

⚠️ PITFALLS:
   - Push [...path] (copy), không push(path) (reference)
   - Backtrack = pop() SAU recurse

🔄 VARIATIONS:
   - Subsets II (#90) → có duplicates → skip trùng lặp
   - Letter Case Permutation (#784) → tương tự nhưng thêm lựa chọn

✅ Đã hiểu
✅ Tự code lại được
```
