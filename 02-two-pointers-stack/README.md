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

**🤔 Tư duy:** Stack hoạt động theo nguyên tắc **LIFO (Last In First Out)** — cái nào vào sau cùng thì ra trước. Với bài toán parentheses, mỗi ngoặc đóng `) } ]` phải khớp với ngoặc mở gần nhất chưa được đóng phía trước nó. Stack chính là cách ta "nhớ" ngoặc mở đang chờ được đóng.

**🔍 Dùng khi:**
- Đề bài hỏi "valid parentheses" / "balanced brackets"
- Cần kiểm tra nesting đúng thứ tự (lồng nhau đúng cách)
- Input là chuỗi chỉ chứa `(`, `)`, `{`, `}`, `[`, `]`
- Compiler kiểm tra syntax code — lỗi "unexpected token"
- Cần kiểm tra HTML/XML tags có đóng đúng thứ tự không

**📝 Tại sao nó hoạt động:** Mỗi ngoặc đóng phải khớp với ngoặc mở **gần nhất** chưa được đóng. Stack đảm bảo: push ngoặc mở khi gặp → pop khi gặp ngoặc đóng → nếu pop ra không khớp → invalid. Cuối cùng stack rỗng nghĩa là tất cả đã được đóng đúng.

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

**🔍 Visual — Trace với input `"{[()]}"` và `"([)]"`:**

```
Input: "{[()]}"
══════════════════════════════════════════════════════
Char   Action    Stack              Giải thích
──────────────────────────────────────────────────────
  {    push      [{]               Mở curly
  [    push      [{, []            Mở square
  (    push      [{, [, (]         Mở paren
  )    pop → (   [{, []            Đóng paren khớp ✓
  ]    pop → [   [{]               Đóng square khớp ✓
  }    pop → {   []                Đóng curly khớp ✓
                                           Stack EMPTY → TRUE ✓
══════════════════════════════════════════════════════
Input: "([)]"
══════════════════════════════════════════════════════
Char   Action    Stack              Giải thích
──────────────────────────────────────────────────────
  (    push      [(]               Mở paren
  [    push      [(, []            Mở square
  )    pop → [   [(]               Đóng paren... nhưng top là [! ✗
                                           Mismatch → FALSE ✗
══════════════════════════════════════════════════════
```

---

### Pattern 2: Two Sum (Sorted Array)

**🤔 Tư duy:** Vì mảng đã sorted, nếu tổng 2 phần tử **lớn hơn** target thì dù có thay đổi left hay không, **luôn cần giảm right** (vì right càng lớn sum càng lớn). Tương tự, nếu sum **nhỏ hơn**, cần tăng left. Hai pointer đi ngược nhau thu hẹp không gian tìm kiếm từ O(n²) xuống O(n) vì mỗi phần tử chỉ được duyệt tối đa 1 lần.

**🔍 Dùng khi:**
- Mảng đã sorted, tìm 2 số có tổng = target
- Đề bài hỏi "find two numbers that add up to target in a sorted array"
- Đề bài hỏi "pair with given sum in sorted order"
- Container With Most Water (biến thể: không tìm sum mà tìm max area)
- Trapping Rain Water

**📝 Tại sao nó hoạt động:** Sorted array cho ta **monotonicity** — khi left tăng, sum tăng; khi right giảm, sum giảm. Vậy nếu sum > target, ta chắc chắn cần giảm sum → chỉ có thể di chuyển right sang trái. Không bao giờ cần di chuyển left sang phải vì điều đó chỉ làm sum lớn hơn.

```javascript
// ✅ Two Pointers: O(n)
function twoSumSorted(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const sum = nums[left] + nums[right];

    if (sum === target) {
      return [left, right];
    } else if (sum < target) {
      left++;   // Sum nhỏ → tăng left để tăng sum
    } else {
      right--;  // Sum lớn → giảm right để giảm sum
    }
  }

  return [-1, -1];
}
```

**🔍 Visual — Trace với `nums = [1, 2, 4, 7, 11, 15]`, target = 9:**

```
Step 1: left=1 (idx 0), right=15 (idx 5)  →  sum = 16 > 9
        ┌──────────────────────────────────────────────┐
        │  [1,  2,  4,  7,  11,  15]                │
        │   ↑                         ↑               │
        │  left                     right            │
        │  sum=16 > 9 → RIGHT--                             │
        └──────────────────────────────────────────────┘

Step 2: left=1, right=11  →  sum = 12 > 9
        ┌──────────────────────────────────────────────┐
        │  [1,  2,  4,  7,  11,  15]                │
        │   ↑               ↑                        │
        │  left            right                      │
        │  sum=12 > 9 → RIGHT--                             │
        └──────────────────────────────────────────────┘

Step 3: left=1, right=7  →  sum = 8 < 9
        ┌──────────────────────────────────────────────┐
        │  [1,  2,  4,  7,  11,  15]                │
        │   ↑          ↑                              │
        │  left      right                            │
        │  sum=8 < 9 → LEFT++                              │
        └──────────────────────────────────────────────┘

Step 4: left=2, right=7  →  sum = 9 = target = 9 ✓
        ┌──────────────────────────────────────────────┐
        │  [1,  2,  4,  7,  11,  15]                │
        │       ↑      ↑                              │
        │     left  right                             │
        │     Return [1, 3] (values 2 + 7 = 9)  ✓         │
        └──────────────────────────────────────────────┘
```

---

### Pattern 3: Palindrome Check

**🤔 Tư duy:** Palindrome là chuỗi đọc xuôi = đọc ngược. Ta không cần so sánh với reversed string (tốn O(n) space). Thay vào đó, với 2 pointers từ hai đầu, chỉ cần so sánh từng cặp characters từ ngoài vào trong. Nếu tất cả các cặp đều giống nhau → palindrome.

**🔍 Dùng khi:**
- Kiểm tra string là palindrome (bỏ spaces, punctuation, case)
- Kiểm tra số nguyên là palindrome (không dùng string)
- Đề bài hỏi "is this a palindrome?"
- Xử lý chuỗi đã normalize (lowercase, alphanumeric)

**📝 Tại sao nó hoạt động:** Nếu s[i] = s[n-1-i] với mọi i từ 0 → n/2, thì đọc xuôi = đọc ngược. Two pointers đảm bảo ta so sánh đúng từng cặp đối xứng mà không cần tạo reversed copy. Điều kiện dừng là left >= right nghĩa là đã so sánh hết các cặp.

```javascript
// ✅ Two Pointers: O(1) space
function isPalindrome(s) {
  // Normalize: bỏ non-alphanumeric, lowercase
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  let left = 0;
  let right = clean.length - 1;

  while (left < right) {
    if (clean[left] !== clean[right]) return false;
    left++;
    right--;
  }
  return true;
}

// ✅ Two Pointers (số nguyên — không chuyển string)
function isPalindromeNumber(x) {
  if (x < 0) return false;
  let reversed = 0, original = x;
  while (x > 0) {
    reversed = reversed * 10 + (x % 10);
    x = Math.floor(x / 10);
  }
  return original === reversed;
}
```

**🔍 Visual — Trace với `"A man, a plan, a canal: Panama"`:**

```
Step 0: Clean string = "amanaplanacanalpanama" (length=21)
        ┌──────────────────────────────────────────┐
        │  a  m  a  n  a  p  l  a  n  a  c  a  n  a  l  p  a  n  a  m  a  │
        │  ↑                                               ↑               │
        │ left=0                                           right=20           │
        │ 'a' == 'a' ✓  → left=1, right=19                          │
        └──────────────────────────────────────────┘

Step 1: left=1, right=19
        ┌──────────────────────────────────────────┐
        │  a  m  a  n  a  p  l  a  n  a  c  a  n  a  l  p  a  n  a  m  a  │
        │      ↑                                       ↑                │
        │   left=1                                  right=19             │
        │ 'm' == 'm' ✓  → left=2, right=18                          │
        └──────────────────────────────────────────┘

... tiếp tục cho đến left=10, right=10
(Tất cả 10 cặp đều match)

Result: PALINDROME ✓
```

---

### Pattern 4: Remove Duplicates (Slow & Fast)

**🤔 Tư duy:** Slow pointer đánh dấu **vị trí cuối cùng** của unique elements (kết quả tính đến thời điểm hiện tại). Fast pointer duyệt toàn bộ mảng. Khi `nums[fast] ≠ nums[slow]`, ta tìm thấy một unique element mới → đẩy nó vào vị trí `slow + 1`. Các duplicates sẽ bị skip tự động.

**🔍 Dùng khi:**
- Mảng **đã sorted**, cần xóa duplicates in-place
- Đề bài hỏi "remove duplicates from sorted array"
- Giữ kết quả trong cùng mảng (không dùng extra array/Set)
- Đếm số unique elements trong sorted array

**📝 Tại sao nó hoạt động:** Trong sorted array, duplicates luôn nằm **liền kề nhau**. Khi `nums[fast]` khác `nums[slow]`, ta biết chắc `nums[fast]` là một giá trị mới chưa xuất hiện (vì mảng sorted). Việc đặt nó tại `slow + 1` đảm bảo thứ tự tăng dần được bảo toàn mà không cần shift cả mảng.

```javascript
// ✅ Two Pointers (in-place): O(1) space
function removeDuplicates(nums) {
  if (nums.length === 0) return 0;

  let slow = 0; // Vị trí cuối cùng của unique elements

  for (let fast = 1; fast < nums.length; fast++) {
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast];
    }
  }

  return slow + 1;
}
```

**🔍 Visual — Trace với `nums = [1, 1, 2, 2, 3, 4, 4, 5]`:**

```
Index:    [ 0  1  2  3  4  5  6  7 ]
Value:    [ 1, 1, 2, 2, 3, 4, 4, 5 ]
          slow=0, fast=1

Step     fast    nums[fast]   nums[slow]   Equal?   Action       Array
───────────────────────────────────────────────────────────────────────────────
init      1         1           1          ✓        skip        [1, 1, 2, 2, 3, 4, 4, 5]
          2         2           1          ✗        slow=1       [1, 2, 2, 2, 3, 4, 4, 5]
                                                    nums[1]=2
          3         2           2          ✓        skip
          4         3           2          ✗        slow=2       [1, 2, 3, 2, 3, 4, 4, 5]
                                                    nums[2]=3
          5         4           3          ✗        slow=3       [1, 2, 3, 4, 3, 4, 4, 5]
                                                    nums[3]=4
          6         4           4          ✓        skip
          7         5           4          ✗        slow=4       [1, 2, 3, 4, 5, 4, 4, 5]
                                                    nums[4]=5

Return slow+1 = 5
Unique array (first 5 elements): [1, 2, 3, 4, 5] ✓
```

---

### Pattern 5: Container With Most Water (Two Pointers — Opposite Direction)

**🤔 Tư duy:** Diện tích container = `chiều cao nhỏ hơn × khoảng cách`. Vì khoảng cách giữa 2 walls càng xa thì tiềm năng diện tích càng lớn, nhưng chiều cao bị giới hạn bởi **wall thấp hơn**. Tại mỗi bước, nếu ta di chuyển wall cao hơn → diện tích **không thể tăng** (khoảng cách giảm, chiều cao không tăng). Nên **luôn di chuyển wall thấp hơn** để có cơ hội tìm được wall cao hơn.

**🔍 Dùng khi:**
- Đề bài hỏi "maximum area between two lines/containers"
- Đề bài hỏi "max water container"
- Tìm 2 điểm trên đồ thị tạo diện tích lớn nhất với constraint `area = min(height[i], height[j]) × |i - j|`

**📝 Tại sao di chuyển pointer nhỏ hơn:** Giả sử left nhỏ hơn right. Nếu giữ left và di chuyển right, diện tích mới = `min(left, newRight) × (newDistance)`. Vì newRight ≤ right và min(left, newRight) ≤ left, nên area **giảm hoặc không đổi**. Ngược lại, di chuyển left có thể tìm được wall cao hơn → area tăng.

```javascript
function maxArea(height) {
  let left = 0, right = height.length - 1;
  let maxArea = 0;

  while (left < right) {
    const w = right - left;
    const h = Math.min(height[left], height[right]);
    maxArea = Math.max(maxArea, h * w);

    // Luôn di chuyển pointer có chiều cao NHỎ HƠN
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }

  return maxArea;
}
```

**🔍 Visual — Trace với `height = [1, 8, 6, 2, 5, 4, 8, 9, 3]`:**

```
Step 1: left=1, right=3  →  area = min(1,3)×8 = 8
        ┌──────────────────────────────────────────┐
        │  [1, 8, 6, 2, 5, 4, 8, 9, 3]           │
        │   ↑                           ↑          │
        │ left=1                       right=3        │
        │ h=min(1,3)=1, w=8 → area=8              │
        │ left=1 < right=3 → LEFT++                    │
        └──────────────────────────────────────────┘

Step 2: left=8, right=3  →  area = min(8,3)×7 = 21
        ┌──────────────────────────────────────────┐
        │  [1, 8, 6, 2, 5, 4, 8, 9, 3]           │
        │       ↑                       ↑          │
        │    left=8                     right=3       │
        │ h=min(8,3)=3, w=7 → area=21 ← MAX           │
        │ right=3 < left=8 → RIGHT--                    │
        └──────────────────────────────────────────┘

Step 3: left=8, right=8  →  area = min(8,8)×5 = 40 ← NEW MAX!
        (giải thích: 8×5=40)
        ...
```

---

### Pattern 6: Stack vs Two Pointers vs Slow & Fast — Khi nào dùng cái nào?

**🤔 Tư duy:** Ba kỹ thuật này đều dùng 2 "con trỏ" nhưng với tư duy hoàn toàn khác nhau. Stack dùng cho **matching pairs theo thứ tự** (LIFO), Two Pointers dùng cho **tìm cặp với sorted array**, còn Slow & Fast dùng cho **duyệt cùng hướng** với khoảng cách cố định.

**📝 Decision Tree:**

```
Bài toán của bạn
    │
    ├── Cần matching pairs theo thứ tự? ──→ STACK (LIFO)
    │     (parentheses, tags, undo history, DFS)
    │
    ├── Mảng ĐÃ SORTED?
    │     ├── Tìm cặp/tổng? ──────────────→ TWO POINTERS (Opposite)
    │     │   (Two Sum, Container With Most Water)
    │     ├── Palindrome check? ───────────→ TWO POINTERS (Opposite)
    │     └── Xóa duplicates in-place? ───→ SLOW & FAST (Same Direction)
    │
    ├── Tìm middle / cycle detection? ────→ SLOW & FAST
    │     (Linked List)
    │
    └── Không sorted, cần expand/shrink? ─→ SLIDING WINDOW
          (Longest substring, max subarray sum)
```

**📝 Khi nào Stack:**
- Parentheses/brackets validation
- DFS traversal (explicit stack thay recursion)
- Undo/Redo operations
- Monotonic stack (Next Greater Element)
- Expression evaluation

**📝 Khi nào Two Pointers (Opposite Directions):**
- Sorted array + pair finding
- Palindrome checking
- Container area
- Trapping rain water

**📝 Khi nào Slow & Fast:**
- Remove duplicates (sorted array)
- Find middle of list
- Cycle detection (Floyd's algorithm)
- Reorder list

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
