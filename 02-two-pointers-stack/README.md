# 👆📍 Two Pointers & Stack

> **Tuần 2** | **8 bài** | **🟢🟢🟡** | ⏱️ ~1 tuần

---

## 🎯 MỤC TIÊU TUẦN NÀY

- [ ] Nắm vững 2 loại Two Pointers: **Opposite Directions** vs **Same Direction**
- [ ] Hiểu Stack LIFO và ứng dụng trong parentheses, DFS
- [ ] Tối ưu từ O(n²) brute force → O(n) với two pointers
- [ ] Phân biệt được khi nào dùng Stack vs khi nào dùng Two Pointers

---

## 📖 TỔNG QUAN

### Two Pointers

**Two Pointers** là kỹ thuật dùng **2 con trỏ** duyệt mảng để giảm độ phức tạp từ O(n²) → O(n).

```
┌─────────────────────────────────────────────────────┐
│  Mảng:    [1, 2, 3, 4, 5, 6, 7, 8, 9]              │
│             ↑                       ↑              │
│           left                     right            │
│                                                     │
│  Di chuyển pointers để cover tất cả pairs!          │
└─────────────────────────────────────────────────────┘
```

### Hai loại Two Pointers:

#### 1. Opposite Directions (Hai hướng ngược nhau)

- Left pointer ở **đầu**, right pointer ở **cuối**
- Di chuyển vào giữa
- **Thường dùng cho:** Sorted array, Palindrome, Two Sum

```
Step 1: [1, 2, 3, 4, 5]
         ↑           ↑
       left       right

Step 2: [1, 2, 3, 4, 5]
             ↑       ↑
          left    right (left++, right--)

Step 3: [1, 2, 3, 4, 5]
                 ↑
              left=right (stop)
```

#### 2. Same Direction (Cùng hướng - Slow & Fast)

- Cả 2 pointer cùng di chuyển về 1 hướng
- Fast chạy trước, Slow theo sau
- **Thường dùng cho:** Remove Duplicates, Middle of List, Cycle Detection

```
Step 1: [1, 2, 2, 3, 3, 4]
         ↑  ↑
        s   f    (s=0, f=1)

Step 2: [1, 2, 2, 3, 3, 4]
            ↑     ↑
           s     f   (s=1, f=2)

Step 3: [1, 2, 3, 3, 4]
             ↑       ↑
            s       f
```

### Khi nào dùng Two Pointers?

- ✅ Mảng đã sorted (sorted = tiên quyết!)
- ✅ Tìm cặp thỏa điều kiện (sum, palindrome)
- ✅ Remove duplicates từ sorted array
- ✅ Container With Most Water
- ✅ Palindrome checking
- ❌ Mảng không sorted → phải sort trước hoặc dùng Hash Map

---

### Stack (Ngăn xếp)

**Stack** là cấu trúc dữ liệu **LIFO** (Last In First Out).

```
Stack Operations:
┌──────────────────────┐
│  push(4) → Stack:    │
│    ┌───┐             │
│    │ 4 │  ← TOP      │  ← Lấy ra trước
│    └───┘             │
│    ┌───┐             │
│    │ 3 │             │
│    └───┘             │
│    ┌───┐             │
│    │ 1 │  ← BOTTOM   │  ← Lấy ra sau
│    └───┘             │
└──────────────────────┘
```

### Đặc điểm Stack:

| Thao tác | Độ phức tạp | Mô tả |
|-----------|-------------|--------|
| Push | O(1) | Thêm vào top |
| Pop | O(1) | Lấy ra từ top |
| Peek/Top | O(1) | Xem top |
| isEmpty | O(1) | Kiểm tra rỗng |
| Search | O(n) | Tìm kiếm |

### Stack trong JavaScript:

```javascript
// Cách 1: Dùng Array (phổ biến)
const stack = [];

// Push - thêm vào cuối
stack.push(1);  // [1]
stack.push(2);  // [1, 2]
stack.push(3);  // [1, 2, 3]

// Pop - lấy ra từ cuối
stack.pop();    // returns 3, stack = [1, 2]

// Peek - xem cuối
stack[stack.length - 1];  // 2

// isEmpty
stack.length === 0;  // false

// Cách 2: Dùng class riêng
class Stack {
  constructor() {
    this.items = [];
  }
  push(item) { this.items.push(item); }
  pop() { return this.items.pop(); }
  peek() { return this.items[this.items.length - 1]; }
  isEmpty() { return this.items.length === 0; }
}
```

### Ứng dụng Stack:

| Ứng dụng | Ví dụ |
|----------|--------|
| Undo/Redo | Ctrl+Z, text editors |
| Function Call Stack | Recursion memory |
| Valid Parentheses | Compiler, syntax checking |
| DFS Traversal | Graph/Tree traversal |
| Expression Evaluation | Calculator |
| Monotonic Stack | Next Greater Element |
| Browser Back/Forward | Navigation history |

---

## 🔄 PATTERNS CỐT LÕI

### Pattern 1: Valid Parentheses (Stack)

**Dùng khi:** Kiểm tra cặp đóng/mở ngoặc hợp lệ.

```javascript
// ✅ Stack - O(n)
function isValid(s) {
  const stack = [];
  const map = {
    ')': '(',
    '}': '{',
    ']': '['
  };

  for (const char of s) {
    if (map[char]) {
      // Là ngoặc đóng → pop và so sánh
      if (stack.pop() !== map[char]) {
        return false;
      }
    } else {
      // Là ngoặc mở → push
      stack.push(char);
    }
  }

  return stack.length === 0;
}
```

**Visual — Valid Parentheses:**
```
Input: "({[]})"

Char   Action    Stack
─────────────────────────
  (    push      [(]
  {    push      [(, {]
  [    push      [(, {, []
  ]    pop [     [(, {]  ✓ match
  }    pop {     [(]    ✓ match
  )    pop (     []     ✓ match
                        → Stack EMPTY → TRUE ✓

Input: "([)]"

Char   Action    Stack
─────────────────────────
  (    push      [(]
  [    push      [(, []
  )    pop [     [(]    ✗ expected [ but got ( → FALSE ✗
```

---

### Pattern 2: Two Sum (Sorted Array)

**Dùng khi:** Tìm 2 số có tổng = target trong sorted array.

```javascript
// ❌ Brute Force: O(n²)
function twoSumSorted(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
}

// ✅ Two Pointers: O(n)
function twoSumSorted(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const sum = nums[left] + nums[right];

    if (sum === target) {
      return [left, right];
    } else if (sum < target) {
      left++;   // Tăng sum → di chuyển left sang phải
    } else {
      right--;  // Giảm sum → di chuyển right sang trái
    }
  }

  return [-1, -1];
}
```

**Visual — Two Pointers vs Brute Force:**
```
Mảng sorted: [1, 2, 3, 4, 5, 6, 7, 8, 9], target = 9

BRUTE FORCE (O(n²)):
  Check mọi cặp:
    (1,2)(1,3)(1,4)...(1,9)
    (2,3)(2,4)...(2,9)
    ...

TWO POINTERS (O(n)):
  Step 1: left=1, right=9 → sum=10 > 9 → right--  [1,2,3,4,5,6,7,8,9]
                                                      ↑           ↑
                                                    left       right

  Step 2: left=1, right=8 → sum=9 → FOUND!  [1,2,3,4,5,6,7,8,9]
                                                  ↑       ↑
                                                left   right
```

---

### Pattern 3: Palindrome Check

**Dùng khi:** Kiểm tra chuỗi/số có đọc ngược giống như đọc xuôi không.

```javascript
// ❌ Brute Force: Reverse rồi so sánh → O(n) space
function isPalindrome(s) {
  const reversed = s.split('').reverse().join('');
  return s === reversed;
}

// ✅ Two Pointers: O(1) space
function isPalindrome(s) {
  let left = 0;
  let right = s.length - 1;

  while (left < right) {
    if (s[left] !== s[right]) {
      return false;
    }
    left++;
    right--;
  }
  return true;
}

// ✅ Two Pointers (cho số nguyên - không chuyển thành string)
function isPalindromeNumber(x) {
  if (x < 0) return false;

  let reversed = 0;
  let original = x;

  while (x > 0) {
    reversed = reversed * 10 + (x % 10);
    x = Math.floor(x / 10);
  }

  return original === reversed;
}
```

**Visual — Palindrome với Two Pointers:**
```
Input: "A man, a plan, a canal: Panama"

Bước 1: Normalize (bỏ non-alphanumeric, lowercase)
  → "amanaplanacanalpanama"

Bước 2: Two Pointers
  a m a n a p l a n a c a n a l p a n a m a
  ↑                                     ↑
 left                                 right

  a m a n a p l a n a c a n a l p a n a m a
      ↑                               ↑
    left                            right

  → So sánh từng cặp, tất cả match → PALINDROME ✓
```

---

### Pattern 4: Remove Duplicates (Slow & Fast)

**Dùng khi:** Xóa duplicates từ sorted array, giữ unique elements.

```javascript
// ❌ Brute Force: Dùng Set → O(n) space
function removeDuplicatesBrute(nums) {
  return [...new Set(nums)].length;
}

// ✅ Two Pointers (in-place): O(1) space
function removeDuplicates(nums) {
  if (nums.length === 0) return 0;

  let slow = 0; // Vị trí cuối cùng của unique elements

  for (let fast = 1; fast < nums.length; fast++) {
    // Nếu fast khác slow → tìm thấy unique mới
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast]; // Đưa unique vào vị trí slow
    }
    // Nếu bằng → skip (duplicate)
  }

  return slow + 1; // Số lượng unique elements
}
```

**Visual — Remove Duplicates:**
```
Input:  [1, 1, 2, 2, 3, 4, 4, 5]
        slow=0, fast=1

fast=1: nums[1]=1 == nums[0]=1 → skip (duplicate)
fast=2: nums[2]=2 != nums[0]=1 → slow=1 → nums[1]=2
        [1, 2, 2, 2, 3, 4, 4, 5]  (đè lên vị trí 1)
fast=3: nums[3]=2 == nums[1]=2 → skip
fast=4: nums[4]=3 != nums[1]=2 → slow=2 → nums[2]=3
        [1, 2, 3, 2, 3, 4, 4, 5]
fast=5: nums[5]=4 != nums[2]=3 → slow=3 → nums[3]=4
        [1, 2, 3, 4, 3, 4, 4, 5]
fast=6: nums[6]=4 == nums[3]=4 → skip
fast=7: nums[7]=5 != nums[3]=4 → slow=4 → nums[4]=5
        [1, 2, 3, 4, 5, 4, 4, 5]

Return slow+1 = 5
Unique array: [1, 2, 3, 4, 5]
```

---

## ⚠️ COMMON PITFALLS (Lỗi hay mắc)

### ❌ Pitfall 1: Two Pointers - quên `while (left < right)`
```javascript
// ❌ Sai: dùng for loop không đúng điều kiện dừng
for (let i = 0; i < nums.length; i++) {
  // Vòng for không kiểm soát được 2 pointers
}

// ✅ Đúng: while loop với điều kiện left < right
while (left < right) {
  // ... xử lý
  left++;
  right--;
}
```

### ❌ Pitfall 2: Valid Parentheses - quên check stack rỗng khi pop
```javascript
// ❌ Sai: stack có thể rỗng → pop() = undefined
function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };

  for (const char of s) {
    if (map[char]) {
      // KHÔNG kiểm tra stack rỗng → undefined !== '(' → crash tiềm ẩn
      if (stack.pop() !== map[char]) return false;
    } else {
      stack.push(char);
    }
  }
  return stack.length === 0;
}

// ✅ Đúng: kiểm tra stack rỗng trước khi pop
function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };

  for (const char of s) {
    if (map[char]) {
      if (stack.length === 0 || stack.pop() !== map[char]) {
        return false;
      }
    } else {
      stack.push(char);
    }
  }
  return stack.length === 0;
}
```

### ❌ Pitfall 3: Container With Most Water - dùng sai pointer movement
```javascript
// ❌ Sai: di chuyển cả 2 pointers mỗi lần
while (left < right) {
  area = Math.min(height[left], height[right]) * (right - left);
  // Di chuyển cả 2 → BỎ SÓT nhiều trường hợp!
  left++;
  right--;
}

// ✅ Đúng: luôn di chuyển pointer có height NHỎ HƠN
while (left < right) {
  area = Math.min(height[left], height[right]) * (right - left);
  if (height[left] < height[right]) {
    left++;    // Di chuyển cái nhỏ vì có thể tìm được cái lớn hơn
  } else {
    right--;
  }
}
```

### ❌ Pitfall 4: Backspace String Compare - so sánh sau khi đã xử lý
```javascript
// ❌ Sai: so sánh 2 strings đã được processed không đúng cách
function backspaceCompare(s, t) {
  // Cần build processed strings rồi mới so sánh
  return s === t;  // ❌ Sai - so sánh chuỗi gốc
}

// ✅ Đúng: build processed strings rồi so sánh
function backspaceCompare(s, t) {
  function process(str) {
    const stack = [];
    for (const char of str) {
      if (char === '#') {
        stack.pop();
      } else {
        stack.push(char);
      }
    }
    return stack.join('');
  }
  return process(s) === process(t);
}
```

### ❌ Pitfall 5: 3Sum - quên skip duplicates ở outer loop
```javascript
// ❌ Sai: không skip duplicates → có kết quả trùng lặp
function threeSum(nums) {
  const result = [];
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      for (let k = j + 1; k < nums.length; k++) {
        if (nums[i] + nums[j] + nums[k] === 0) {
          result.push([nums[i], nums[j], nums[k]]);
        }
      }
    }
  }
  return result;
}

// ✅ Đúng: skip duplicates ở tất cả các loop
function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const result = [];

  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue; // Skip i duplicates
    let left = i + 1, right = nums.length - 1;

    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);
        left++; right--;
        while (left < right && nums[left] === nums[left - 1]) left++;  // Skip
        while (left < right && nums[right] === nums[right + 1]) right--; // Skip
      } else if (sum < 0) {
        left++;
      } else {
        right--;
      }
    }
  }
  return result;
}
```

---

## 💡 TIPS & TRICKS

### 1. Khi nào dùng Stack vs Two Pointers?

```
┌────────────────┬─────────────────────┬──────────────────────────┐
│    Stack       │  Two Pointers        │  Slow & Fast            │
├────────────────┼─────────────────────┼──────────────────────────┤
│ LIFO order     │  Opposite/Same dir  │  Same direction         │
│ Match pairs    │  Find pairs         │  Find middle/cycle      │
│ DFS traversal  │  Sorted array       │  Remove duplicates      │
│ Undo/Redo      │  Palindrome         │  Linked list            │
└────────────────┴─────────────────────┴──────────────────────────┘
```

### 2. Two Pointers - mẹo nhanh nhận biết

```
Nếu đề bài có:
  ✅ "sorted array" → Two Pointers (opposite)
  ✅ "remove duplicates" → Slow & Fast
  ✅ "container with most water" → Two Pointers
  ✅ "palindrome" → Two Pointers
  ✅ "valid parentheses" → Stack
```

### 3. Stack cho DFS (Depth-First Search)

```javascript
// Stack-based DFS (thay thế recursion)
function dfsStack(graph, start) {
  const visited = new Set();
  const stack = [start];
  const result = [];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!visited.has(node)) {
      visited.add(node);
      result.push(node);

      // Thêm neighbors (reverse để LIFO = same order as recursive)
      for (const neighbor of graph[node].reverse()) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }
  }

  return result;
}
```

### 4. Mẹo xử lý Backspace nhanh

```javascript
// Cách 1: Stack
function processBackspace(str) {
  const stack = [];
  for (const char of str) {
    if (char === '#') stack.pop();
    else stack.push(char);
  }
  return stack.join('');
}

// Cách 2: Two Pointers (không dùng extra space)
function backspaceCompare(s, t) {
  let i = s.length - 1, j = t.length - 1;
  let skipS = 0, skipT = 0;

  while (i >= 0 || j >= 0) {
    // Di chuyển i đến ký tự hợp lệ trong s
    while (i >= 0) {
      if (s[i] === '#') { skipS++; i--; }
      else if (skipS > 0) { skipS--; i--; }
      else break;
    }

    // Di chuyển j đến ký tự hợp lệ trong t
    while (j >= 0) {
      if (t[j] === '#') { skipT++; j--; }
      else if (skipT > 0) { skipT--; j--; }
      else break;
    }

    // So sánh
    if (i >= 0 && j >= 0) {
      if (s[i] !== t[j]) return false;
    } else if (i >= 0 || j >= 0) {
      return false; // Một trong hai đã hết nhưng cái kia còn
    }

    i--; j--;
  }
  return true;
}
```

### 5. Mẹo Container With Most Water

```javascript
// Luôn di chuyển pointer có chiều cao NHỎ HƠN
// Vì:
function maxArea(height) {
  let left = 0, right = height.length - 1;
  let maxArea = 0;

  while (left < right) {
    const h = Math.min(height[left], height[right]);
    const w = right - left;
    maxArea = Math.max(maxArea, h * w);

    // Di chuyển cái nhỏ — có thể tìm được cái cao hơn
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }

  return maxArea;
}
```

---

## 🔍 BRUTE FORCE → OPTIMAL

### Bài 1: Valid Parentheses (#20)

| Approach | Time | Space | Notes |
|----------|------|-------|-------|
| Naive regex | O(n) | O(n) | Không reliable cho nested |
| **Stack** | **O(n)** | **O(n)** | ✅ Push/pop pairs |

### Bài 2: Longest Substring (#3)

| Approach | Time | Space | Notes |
|----------|------|-------|-------|
| Double Loop | O(n²) | O(1) | Check mọi substring |
| **Sliding Window + Set** | **O(n)** | **O(min(n, charset))** | ✅ Tuần sau học kỹ hơn |

### Bài 3: Container With Most Water (#11)

| Approach | Time | Space | Notes |
|----------|------|-------|-------|
| Double Loop | O(n²) | O(1) | Tính mọi cặp |
| **Two Pointers** | **O(n)** | **O(1)** | ✅ Move smaller pointer |

### Bài 4: Backspace String Compare (#844)

| Approach | Time | Space | Notes |
|----------|------|-------|-------|
| Build strings | O(n + m) | O(n + m) | Dùng stack |
| **Two Pointers** | **O(n + m)** | **O(1)** | ✅ Không extra space |

### Bài 5: Valid Palindrome (#125)

| Approach | Time | Space | Notes |
|----------|------|-------|-------|
| Reverse string | O(n) | O(n) | Extra space |
| **Two Pointers** | **O(n)** | **O(1)** | ✅ |

### Bài 6: Remove Duplicates (#26)

| Approach | Time | Space | Notes |
|----------|------|-------|-------|
| Set + rebuild | O(n) | O(n) | Not in-place |
| **Two Pointers** | **O(n)** | **O(1)** | ✅ In-place |

### Bài 7: 3Sum (#15)

| Approach | Time | Space | Notes |
|----------|------|-------|-------|
| Triple Loop | O(n³) | O(1) | Bỏ qua |
| **Sort + 2 Pointers** | **O(n²)** | **O(1)*** | ✅ Skip duplicates |

### Bài 8: Trapping Rain Water (#42)

| Approach | Time | Space | Notes |
|----------|------|-------|-------|
| Double Loop | O(n²) | O(1) | Tính leftMax/rightMax mỗi i |
| **DP (Precompute)** | **O(n)** | **O(n)** | Lưu leftMax, rightMax |
| **Two Pointers** | **O(n)** | **O(1)** | ✅ Optimal |

---

## ⏱️ TIME & SPACE COMPLEXITY TỔNG HỢP

### Two Pointers

| Type | Khi nào dùng | Time | Space |
|------|-------------|------|-------|
| Opposite Directions | Sorted array, Two Sum, Palindrome | O(n) | O(1) |
| Same Direction (Slow & Fast) | Remove duplicates, Middle, Cycle | O(n) | O(1) |

### Stack

| Operation | Time | Space |
|-----------|------|-------|
| Push/Pop/Peek | O(1) | O(n) total |
| Search | O(n) | — |
| Valid Parentheses | O(n) | O(n) |

---

## 🏭 REAL-WORLD APPLICATIONS

| Pattern | Ứng dụng thực tế |
|---------|-------------------|
| Valid Parentheses | Compiler syntax check, IDE error detection |
| Stack (DFS) | File system traversal, syntax parsing |
| Two Pointers | Image comparison, data reconciliation |
| Sliding Window | Stock price analysis, network packet processing |
| Container With Most Water | Resource allocation, area optimization |

---

## ✅ KHI NÀO DÙNG / KHÔNG DÙNG

### NÊN dùng Two Pointers khi:
- ✅ Mảng **đã sorted**
- ✅ Cần tìm cặp thỏa điều kiện (sum, comparison)
- ✅ Cần xóa duplicates in-place
- ✅ Kiểm tra palindrome
- ✅ Container/water trapping (min-max area)

### KHÔNG NÊN dùng Two Pointers khi:
- ❌ Mảng không sorted và không thể sort (sẽ mất original order)
- ❌ Cần tất cả pairs (output size = n²) → Two Pointers không giúp
- ❌ Dữ liệu là linked list (cần adaptation, hoặc dùng slow/fast pointers)

### NÊN dùng Stack khi:
- ✅ Kiểm tra matching pairs (parentheses, tags)
- ✅ DFS traversal (explicit stack thay cho recursion)
- ✅ Undo operations
- ✅ Expression evaluation

### KHÔNG NÊN dùng Stack khi:
- ❌ Cần tìm min/max trong range → **Monotonic Queue**
- ❌ Cần random access → **Array**
- ❌ Cần FIFO order → **Queue**

---

## 📋 CHEAT SHEET — Tuần 2

### Two Pointers Template

```javascript
// Opposite Directions (Sorted Array)
function oppositeDirections(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    sum < target ? left++ : right--;
  }
  return [-1, -1];
}

// Same Direction (Remove Duplicates)
function removeDuplicates(nums) {
  let slow = 0;
  for (let fast = 1; fast < nums.length; fast++) {
    if (nums[fast] !== nums[slow]) {
      nums[++slow] = nums[fast];
    }
  }
  return slow + 1;
}
```

### Stack Template

```javascript
function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (const char of s) {
    if (map[char]) {
      if (stack.pop() !== map[char]) return false;
    } else {
      stack.push(char);
    }
  }
  return stack.length === 0;
}
```

### Quick Decision Tree

```
Bài toán với array/string
    │
    ├── Cần matching pairs? ──→ Stack
    │     (parentheses, tags)
    │
    ├── Mảng ĐÃ SORTED?
    │     │
    │     ├── Tìm cặp/tổng? ──→ Two Pointers (opposite)
    │     │
    │     ├── Xóa duplicates? ──→ Two Pointers (slow/fast)
    │     │
    │     └── Palindrome? ──→ Two Pointers (opposite)
    │
    └── Mảng KHÔNG SORTED?
          └── Container/Water? ──→ Two Pointers (opposite)
```

---

## 📝 BÀI TẬP TUẦN NÀY

| # | Bài | LeetCode | Độ khó | Pattern | Status |
|---|-----|----------|--------|---------|--------|
| 1 | Valid Parentheses | #20 | 🟢 Easy | Stack | ⬜ |
| 2 | Longest Substring Without Repeating Characters | #3 | 🟡 Medium | Sliding Window | ⬜ |
| 3 | Container With Most Water | #11 | 🟡 Medium | Two Pointers | ⬜ |
| 4 | Backspace String Compare | #844 | 🟢 Easy | Two Pointers | ⬜ |
| 5 | Valid Palindrome | #125 | 🟢 Easy | Two Pointers | ⬜ |
| 6 | Remove Duplicates from Sorted Array | #26 | 🟢 Easy | Two Pointers | ⬜ |
| 7 | 3Sum | #15 | 🟡 Medium | Two Pointers | ⬜ |
| 8 | Trapping Rain Water | #42 | 🔴 Hard | Two Pointers | ⬜ |

**Hoàn thành:** 0/8 (0%)

---

## 📚 TÀI NGUYÊN

- Video: [NeetCode Two Pointers](https://www.youtube.com/)
- Video: [NeetCode Stack](https://www.youtube.com/)
- Article: [GeeksforGeeks - Stack](https://geeksforgeeks.org/stack-data-structure/)
- Article: [Two Pointer Technique](https://www.geeksforgeeks.org/two-pointer-technique/)
- Visual: [Stack Visualization](https://visualgo.net/en/stack)
