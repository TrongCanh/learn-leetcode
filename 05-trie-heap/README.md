# 🌲 Trie & Heap

> **Tuần 5** | **6 bài** | **🟡🟡🟡** | ⏱️ ~1 tuần

---

## 🎯 MỤC TIÊU TUẦN NÀY

- [ ] Hiểu Trie (Prefix Tree) — cấu trúc chuyên biệt cho string operations
- [ ] Nắm vững Heap — Min Heap vs Max Heap, implementation và ứng dụng
- [ ] Biết khi nào dùng Trie thay vì Hash Table
- [ ] Biết khi nào dùng Heap thay vì sorting

---

## 📖 TỔNG QUAN

### Trie (Prefix Tree)

**Trie** (đọc là "try") là cấu trúc dữ liệu **chuyên cho strings**, cho phép tìm kiếm prefix và word lookup trong O(m) với m = độ dài từ.

```
Trie cho ["app", "apple", "apply", "banana", "band"]:

root
├── a
│   └── p
│       ├── p (isEnd) → "app"
│       └── p → l → e (isEnd) → "apple"
│           └── p → l → y (isEnd) → "apply"
│
└── b
    └── a
        └── n
            ├── d → a → n → a (isEnd) → "banana"
            └── d → (isEnd) → "band"
```

### Trie Node trong JavaScript:

```javascript
class TrieNode {
  constructor() {
    this.children = {};  // Map<character, TrieNode>
    this.isEnd = false; // Đánh dấu kết thúc từ
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  // Thêm từ - O(m)
  insert(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEnd = true;
  }

  // Tìm kiếm chính xác - O(m)
  search(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) {
        return false;
      }
      node = node.children[char];
    }
    return node.isEnd;
  }

  // Tìm kiếm prefix - O(m)
  startsWith(prefix) {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children[char]) {
        return false;
      }
      node = node.children[char];
    }
    return true;
  }

  // Tìm prefix nhưng không cần full word
  searchPrefix(prefix) {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children[char]) {
        return null;
      }
      node = node.children[char];
    }
    return node;
  }
}
```

### Trie vs Hash Table cho String Operations:

```
┌────────────────┬─────────────────┬─────────────────┐
│    Criteria    │     Trie        │   Hash Table    │
├────────────────┼─────────────────┼─────────────────┤
│ Search prefix  │  O(m) ✅        │  O(m + n) ❌    │
│ Word lookup    │  O(m)           │  O(m)           │
│ Memory (many   │  O(Σm)          │  O(n·m)         │
│   shared prefix)│ (shared)       │  (no sharing)   │
│ Autocomplete   │  Natural ✅     │  Difficult ❌   │
│ Sorted output  │  Easy (DFS) ✅  │  Hard ❌        │
└────────────────┴─────────────────┴─────────────────┘
```

### Ứng dụng Trie:

| Ứng dụng | Ví dụ |
|----------|--------|
| Autocomplete | Google search, VS Code IntelliSense |
| Spell checker | Word editors, code editors |
| IP routing | Longest prefix match |
| T9 predictive text | Old phone texting |
| Word games | Boggle, Scrabble |
| Phone directory | Contact search by name |

---

### Heap (Priority Queue)

**Heap** là cấu trúc dữ liệu dạng **complete binary tree** thỏa mãn:

- **Max Heap:** Parent ≥ Children (lớn nhất ở trên)
- **Min Heap:** Parent ≤ Children (nhỏ nhất ở trên)

```
Min Heap:                    Max Heap:
            1                        9
          /   \                    /   \
         3     2                  7     8
        / \   / \                / \   / \
       5   7 6   8              5   6 3   4

  Top (root) = min → 1     Top (root) = max → 9
```

### Array Representation (index-based):

```
Index:   0    1    2    3    4    5    6
Value:   1    3    2    5    7    6    8

Parent(i)    = Math.floor((i - 1) / 2)
LeftChild(i) = 2 * i + 1
RightChild(i)= 2 * i + 2

Ví dụ: i = 1
  Parent(1)    = floor(0/2) = 0    → parent = nums[0] = 1
  LeftChild(1) = 2*1+1 = 3   → left = nums[3] = 5
  RightChild(1)= 2*1+2 = 4   → right = nums[4] = 7
```

### Heap trong JavaScript — MinHeap Implementation:

```javascript
class MinHeap {
  constructor() {
    this.heap = [];
  }

  // Helper functions
  parent(i) { return Math.floor((i - 1) / 2); }
  left(i) { return 2 * i + 1; }
  right(i) { return 2 * i + 2; }

  // Swap
  swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  // Insert - O(log n)
  insert(val) {
    this.heap.push(val);
    this.bubbleUp(this.heap.length - 1);
  }

  bubbleUp(i) {
    while (i > 0 && this.heap[this.parent(i)] > this.heap[i]) {
      this.swap(i, this.parent(i));
      i = this.parent(i);
    }
  }

  // Extract Min (root) - O(log n)
  extractMin() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.bubbleDown(0);
    return min;
  }

  bubbleDown(i) {
    const n = this.heap.length;
    let smallest = i;
    const l = this.left(i);
    const r = this.right(i);

    if (l < n && this.heap[l] < this.heap[smallest]) {
      smallest = l;
    }
    if (r < n && this.heap[r] < this.heap[smallest]) {
      smallest = r;
    }

    if (smallest !== i) {
      this.swap(i, smallest);
      this.bubbleDown(smallest);
    }
  }

  // Peek (xem root) - O(1)
  peek() {
    return this.heap[0];
  }

  // Size
  size() {
    return this.heap.length;
  }
}
```

### Heap trong JavaScript — MaxHeap (đảo dấu):

```javascript
// MaxHeap = MinHeap nhưng insert -val, extractMin rồi đảo lại
class MaxHeap {
  constructor() {
    this.minHeap = new MinHeap();
  }

  insert(val) {
    this.minHeap.insert(-val);  // Đảo dấu
  }

  extractMax() {
    return -this.minHeap.extractMin();
  }

  peekMax() {
    return -this.minHeap.peek();
  }

  size() {
    return this.minHeap.size();
  }
}
```

### Built-in Alternative: `Array` với built-in sort

```javascript
// Cho simple cases, dùng array + sort thay vì implement Heap
// Nhưng Heap có lợi thế:
// - Insert: O(log n) vs O(n) cho array push + sort
// - Extract: O(log n) vs O(n log n) cho sort lại
// - Top K problems: O(n log k) vs O(n log n) với sort
```

---

## 🔄 PATTERNS CỐT LÕI

### Pattern 1: Implement Trie (Prefix Tree)

**Dùng khi:** Cần insert/search/prefix-lookup strings.

```javascript
class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEnd = true;
  }

  searchPrefix(prefix) {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children[char]) return null;
      node = node.children[char];
    }
    return node;
  }

  search(word) {
    const node = this.searchPrefix(word);
    return node !== null && node.isEnd;
  }

  startsWith(prefix) {
    return this.searchPrefix(prefix) !== null;
  }
}
```

**Visual — Trie Operations:**
```
Insert "apple":
  root → a → p → p → l → e(isEnd)

Search "apple":
  root → a ✓ → p ✓ → p ✓ → l ✓ → e(isEnd) ✓ → return true

Search "app":
  root → a ✓ → p ✓ → p ✓
  → isEnd = false → return false

StartsWith "app":
  root → a ✓ → p ✓ → p ✓ → return true

StartsWith "bat":
  root → b ✓ → a ✓ → t ✗ → return false
```

---

### Pattern 2: Design Search Words (Trie with wildcard)

**Dùng khi:** Trie cần hỗ trợ `.` wildcard cho any character.

```javascript
class WordDictionary {
  constructor() {
    this.root = new TrieNode();
  }

  addWord(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEnd = true;
  }

  search(word) {
    return this.searchDFS(word, 0, this.root);
  }

  searchDFS(word, index, node) {
    if (!node) return false;

    if (index === word.length) {
      return node.isEnd;
    }

    const char = word[index];

    if (char === '.') {
      // Thử TẤT CẢ children
      for (const child of Object.values(node.children)) {
        if (this.searchDFS(word, index + 1, child)) {
          return true;
        }
      }
      return false;
    } else {
      // Normal character
      if (!node.children[char]) return false;
      return this.searchDFS(word, index + 1, node.children[char]);
    }
  }
}
```

---

### Pattern 3: Kth Largest Element (Min Heap size K)

**Dùng khi:** Tìm K phần tử lớn nhất / nhỏ nhất mà KHÔNG cần sort toàn bộ.

```javascript
// ❌ Brute Force: Sort → O(n log n)
function kthLargestBrute(nums, k) {
  nums.sort((a, b) => b - a);
  return nums[k - 1];
}

// ✅ Min Heap size K → O(n log k)
function findKthLargest(nums, k) {
  const minHeap = new MinHeap();

  // Chỉ giữ K phần tử lớn nhất
  for (const num of nums) {
    minHeap.insert(num);
    if (minHeap.size() > k) {
      minHeap.extractMin();  // Bỏ phần tử nhỏ nhất
    }
  }

  return minHeap.peek();  // Root = Kth largest
}
```

**Visual — Kth Largest với MinHeap:**
```
nums = [3, 2, 1, 5, 6, 4], k = 2

MinHeap size K = 2 → giữ 2 phần tử LỚN NHẤT

Step 1: insert 3 → heap=[3], size=1 ≤ 2
Step 2: insert 2 → heap=[2,3], size=2 ≤ 2
Step 3: insert 1 → heap=[2,3,1], size=3 > 2 → extractMin(1) → heap=[2,3]
Step 4: insert 5 → heap=[2,5,3], size=3 > 2 → extractMin(2) → heap=[5,3]
Step 5: insert 6 → heap=[3,5,6], size=3 > 2 → extractMin(3) → heap=[5,6]
Step 6: insert 4 → heap=[4,5,6], size=3 > 2 → extractMin(4) → heap=[5,6]

Result: peek() = 5 = 2nd largest ✓
```

---

### Pattern 4: Top K Frequent Elements (MinHeap với frequency)

**Dùng khi:** Tìm K phần tử xuất hiện nhiều nhất.

```javascript
// ✅ MinHeap theo frequency - O(n log k)
function topKFrequent(nums, k) {
  // 1. Đếm frequency
  const freq = new Map();
  for (const num of nums) {
    freq.set(num, (freq.get(num) || 0) + 1);
  }

  // 2. MinHeap giữ K phần tử có freq cao nhất
  const heap = new MinHeap();
  for (const [num, count] of freq) {
    heap.insert({ val: num, freq: count });
    if (heap.size() > k) {
      heap.extractMin();  // Bỏ phần tử ít xuất hiện nhất
    }
  }

  // 3. Extract tất cả → đảo ngược thứ tự
  const result = [];
  while (heap.size() > 0) {
    result.push(heap.extractMin().val);
  }
  return result.reverse();
}
```

---

### Pattern 5: Median Data Stream (MaxHeap + MinHeap)

**Dùng khi:** Tìm median của data stream (dữ liệu đến liên tục).

```javascript
// ✅ Two Heaps approach - O(n log n)
class MedianFinder {
  constructor() {
    this.small = new MaxHeap();  // MaxHeap: giữ nửa NHỎ hơn median
    this.large = new MinHeap();   // MinHeap: giữ nửa LỚN hơn median
  }

  addNum(num) {
    // Luôn insert vào small trước, rồi balance
    this.small.insert(num);

    // Đảm bảo mọi phần tử trong small ≤ mọi phần tử trong large
    if (this.large.size() > 0 && this.small.peekMax() > this.large.peek()) {
      const val = this.small.extractMax();
      this.large.insert(val);
    }

    // Balance: |small| = |large| hoặc |small| = |large| + 1
    if (this.small.size() > this.large.size() + 1) {
      this.large.insert(this.small.extractMax());
    }
    if (this.large.size() > this.small.size()) {
      this.small.insert(this.large.extractMin());
    }
  }

  findMedian() {
    if (this.small.size() > this.large.size()) {
      return this.small.peekMax();  // Odd: median = top của max heap
    }
    return (this.small.peekMax() + this.large.peek()) / 2;  // Even
  }
}
```

**Visual — Median Data Stream:**
```
Stream: [2, 1, 5, 7, 3, 8, 9]

add(2):  small=[2], large=[] → median = 2
add(1):  small=[2,1] → balance → small=[1], large=[2] → median = (1+2)/2 = 1.5
add(5):  small=[2,1], insert 5 → small=[5,1], large=[2]
         5 > 2 → swap → small=[2,1], large=[5] → median = (2+5)/2 = 3.5
add(7):  small=[5,2], insert 7 → small=[7,2], balance → median = (2+7)/2 = 4.5
add(3):  small=[5,3], insert 3 → small=[5,3,2] → balance → small=[3,2], large=[5]
         median = (3+5)/2 = 4
add(8):  small=[5,3,8] → balance → small=[5,3], large=[8]
         median = (5+8)/2 = 6.5
add(9):  small=[8,5,9] → balance → median = (8+9)/2 = 8.5

Final: [1,1.5,3.5,4.5,4,6.5,8.5]
```

---

### Pattern 6: Merge K Sorted Lists (MinHeap)

**Dùng khi:** Merge nhiều sorted lists thành một sorted list.

```javascript
// ❌ Brute Force: Collect all → sort → O(n log n)
function mergeKListsBrute(lists) {
  const arr = [];
  for (const list of lists) {
    let curr = list;
    while (curr) {
      arr.push(curr.val);
      curr = curr.next;
    }
  }
  arr.sort((a, b) => a - b);
  // Rebuild list...
}

// ✅ MinHeap: O(n log k) với k = number of lists
function mergeKLists(lists) {
  const heap = new MinHeap();
  const dummy = new ListNode(0);
  let curr = dummy;

  // 1. Insert head của mỗi list vào heap
  for (const list of lists) {
    if (list) {
      heap.insert({ val: list.val, node: list });
    }
  }

  // 2. Extract min, insert next của nó
  while (heap.size() > 0) {
    const { val, node } = heap.extractMin();
    curr.next = node;
    curr = curr.next;

    if (node.next) {
      heap.insert({ val: node.next.val, node: node.next });
    }
  }

  return dummy.next;
}
```

**Visual — Merge K Sorted Lists:**
```
Lists: [1→4→5], [1→3→4], [2→6]

Heap init: [1(list1), 1(list2), 2(list3)]
           min=1

Step 1: Extract 1(list1) → output: 1
        Push 4(list1) → heap: [1(list2), 2(list3), 4(list1)]

Step 2: Extract 1(list2) → output: 1→1
        Push 3(list2) → heap: [2(list3), 3(list2), 4(list1)]

Step 3: Extract 2(list3) → output: 1→1→2
        Push 6(list3) → heap: [3(list2), 4(list1), 6(list3)]

Step 4: Extract 3(list2) → output: 1→1→2→3
        Push 4(list2) → heap: [4(list1), 4(list2), 6(list3)]

Step 5: Extract 4(list1) → output: 1→1→2→3→4
        Push 5(list1) → heap: [4(list2), 5(list1), 6(list3)]

Step 6: Extract 4(list2) → output: 1→1→2→3→4→4

Step 7: Extract 5(list1) → output: 1→1→2→3→4→4→5

Step 8: Extract 6(list3) → output: 1→1→2→3→4→4→5→6

Result: 1→1→2→3→4→4→5→6 ✓
```

---

## ⚠️ COMMON PITFALLS (Lỗi hay mắc)

### ❌ Pitfall 1: Trie — quên reset isEnd khi word là prefix của word khác

```javascript
// ❌ Sai: "app" được insert trước, "apple" insert sau
// Khi search "app", vẫn phải return true
// Nhưng code này sai vì:
// addWord("app") → root→a→p→p(isEnd=true)
// addWord("apple") → root→a→p→p→l→e(isEnd=true) → OK
// search("app") → root→a→p→p(isEnd=true) → OK

// Lỗi thực sự là khi xử lý prefix deletion:
// KHÔNG có deletion trong Trie cơ bản!
// Nếu cần delete, phải giữ count hoặc flag
```

### ❌ Pitfall 2: Heap — nhầm MaxHeap và MinHeap khi dùng cho Top K

```javascript
// ❌ Sai: Dùng MaxHeap cho "K largest"
function kthLargestWrong(nums, k) {
  const heap = new MaxHeap();  // ❌ MaxHeap không phù hợp
  for (const num of nums) {
    heap.insert(num);
  }
  // Extract k lần → lấy K LỚN NHẤT → O(k log n)
  // Nhưng không thể early exit nếu chỉ cần top K
  for (let i = 0; i < k - 1; i++) {
    heap.extractMax();
  }
  return heap.peekMax();
}

// ✅ Đúng: Dùng MinHeap size K
// Chỉ giữ K phần tử LỚN NHẤT trong heap
// Nếu num > heap.min → có thể là top K
// insert O(log k), extractMin O(log k)
// → Total O(n log k) thay vì O(n log n)
```

### ❌ Pitfall 3: Heap — không handle duplicate elements đúng cách

```javascript
// ❌ Sai: Khi đếm frequency, duplicate elements có thể bị miss
function topKFrequent(nums, k) {
  const freq = new Map();
  for (const num of nums) {
    freq.set(num, (freq.get(num) || 0) + 1);
  }

  const heap = new MinHeap();
  for (const [num, count] of freq) {
    heap.insert({ num, count });
    if (heap.size() > k) {
      heap.extractMin();
    }
  }

  const result = [];
  while (heap.size() > 0) {
    result.push(heap.extractMin().num);
  }
  return result; // ❌ SAI: extractMin lấy NHỎ NHẤT, không phải LỚN NHẤT!
  // Nếu heap là MinHeap theo count → đúng
  // Nhưng phải đảm bảo heap SO SÁNH theo count, không phải num
}

// ✅ Đúng: heap theo count
heap.insert({ val: num, count: count });
// Và extractMin sẽ lấy item có count NHỎ NHẤT trong K items
// → đó là K items có count LỚN NHẤT ✓
```

### ❌ Pitfall 4: Median — không balance sizes đúng

```javascript
// ❌ Sai: không kiểm tra size balance sau mỗi insert
addNum(num) {
  this.small.insert(num);  // MaxHeap
  // Không check: small.size > large.size + 1
  // Không check: small.max > large.min
  // → Invariant bị phá vỡ
}

// ✅ Đúng: luôn đảm bảo invariant
addNum(num) {
  this.small.insert(num);

  // Ensure: all elements in small ≤ all elements in large
  if (this.large.size() > 0 && this.small.peekMax() > this.large.peek()) {
    const val = this.small.extractMax();
    this.large.insert(val);
  }

  // Balance: |small| = |large| hoặc |small| = |large| + 1
  if (this.small.size() > this.large.size() + 1) {
    this.large.insert(this.small.extractMax());
  }
  if (this.large.size() > this.small.size()) {
    this.small.insert(this.large.extractMin());
  }
}
```

### ❌ Pitfall 5: Trie với wildcard — quên null check

```javascript
// ❌ Sai: không kiểm tra node tồn tại
searchDFS(word, index, node) {
  if (index === word.length) return node.isEnd;

  if (word[index] === '.') {
    for (const child of node.children) {  // ❌ node có thể null
      // ...
    }
  }
  // ...
}

// ✅ Đúng
searchDFS(word, index, node) {
  if (!node) return false;  // ← THÊM CHECK NÀY
  if (index === word.length) return node.isEnd;
  // ...
}
```

---

## 💡 TIPS & TRICKS

### 1. Khi nào dùng Trie vs Hash Table

```
Dùng TRIE khi:
  ✅ Tìm kiếm prefix (autocomplete)
  ✅ Tìm tất cả words bắt đầu bằng prefix
  ✅ Word games (Boggle, Scrabble)
  ✅ Tìm longest common prefix
  ✅ Sorted string operations

Dùng HASH TABLE khi:
  ✅ Chỉ cần exact match
  ✅ Memory nghiêm ngặt
  ✅ Không cần prefix operations
```

### 2. Khi nào dùng Heap vs Sorting

```
Dùng HEAP khi:
  ✅ Tìm Top K / Bottom K → O(n log k) vs O(n log n)
  ✅ Stream data (median, K largest ongoing)
  ✅ Priority queue (scheduling)
  ✅ Dijkstra's algorithm

Dùng SORTING khi:
  ✅ Cần sorted output
  ✅ Không cần partial top/bottom
  ✅ Đơn giản hơn, code ngắn hơn
```

### 3. Mẹo so sánh custom trong Heap

```javascript
// MinHeap với custom comparator (đếm frequency)
class FrequencyMinHeap {
  constructor() {
    this.heap = [];
  }

  swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  insert(item) {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].count <= this.heap[i].count) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  extractMin() {
    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.bubbleDown(0);
    return min;
  }

  bubbleDown(i) {
    while (true) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let smallest = i;

      if (left < this.heap.length && this.heap[left].count < this.heap[smallest].count) {
        smallest = left;
      }
      if (right < this.heap.length && this.heap[right].count < this.heap[smallest].count) {
        smallest = right;
      }

      if (smallest === i) break;
      this.swap(i, smallest);
      i = smallest;
    }
  }

  peek() { return this.heap[0]; }
  size() { return this.heap.length; }
}
```

### 4. Mẹo Count Characters (thay vì dùng Map)

```javascript
// 26-letter array thay vì Map → O(1) access
function getCharCount(str) {
  const count = new Array(26).fill(0);
  for (const char of str) {
    count[char.charCodeAt(0) - 97]++;
  }
  return count;
}

// Dùng trong Trie cho counting:
class TrieNode {
  constructor() {
    this.children = {};
    this.count = 0;  // Số từ đi qua node này
    this.isEnd = false;
  }
}

insert(word) {
  let node = this.root;
  for (const char of word) {
    if (!node.children[char]) {
      node.children[char] = new TrieNode();
    }
    node = node.children[char];
    node.count++;  // ← Increment count
  }
  node.isEnd = true;
}
```

---

## 🔍 BRUTE FORCE → OPTIMAL

### Trie

| Bài | Brute Force | Optimal | Cải thiện |
|-----|-------------|---------|-----------|
| Implement Trie | Linear search | Trie O(m) | ✅ Prefix search |
| Design Search Words | Linear search all | Trie + DFS O(m·k) | ✅ Wildcard |

### Heap

| Bài | Brute Force | Optimal | Cải thiện |
|-----|-------------|---------|-----------|
| Kth Largest | Sort O(n log n) | MinHeap O(n log k) | ✅ |
| Top K Frequent | Sort O(n log n) | MinHeap O(n log k) | ✅ |
| Median Data Stream | Sort O(n log n) per add | Two Heaps O(n log n) | ✅ |
| Merge K Sorted | Sort all O(n log n) | MinHeap O(n log k) | ✅ |

---

## ⏱️ TIME & SPACE COMPLEXITY TỔNG HỢP

### Trie

| Operation | Time | Space |
|-----------|------|-------|
| Insert | O(m) | O(m) worst |
| Search | O(m) | — |
| Prefix Search | O(m) | — |
| m = độ dài từ | | |

### Heap

| Operation | Time | Space |
|-----------|------|-------|
| Insert | O(log n) | — |
| Extract Min/Max | O(log n) | — |
| Peek | O(1) | — |
| Top K from n | O(n log k) | O(k) |
| Median Stream | O(n log n) | O(n) |
| Merge K Lists | O(n log k) | O(k) |

*n = total elements, k = number of lists or K elements*

---

## 🏭 REAL-WORLD APPLICATIONS

| Pattern | Ứng dụng thực tế |
|---------|-------------------|
| Trie | Autocomplete (Google, VS Code), spell checker, IP routing, contact search |
| Kth Largest | Leaderboard (top 10 players), trending topics |
| Top K Frequent | Word frequency analysis, trending hashtags, recommendation systems |
| Median Stream | Real-time analytics, stock price median, sensor data |
| Merge K Sorted | External sorting, database merge join, log aggregation |

---

## ✅ KHI NÀO DÙNG / KHÔNG DÙNG

### Trie

**NÊN dùng khi:**
- ✅ Prefix-based operations (autocomplete, search-as-you-type)
- ✅ Longest common prefix problem
- ✅ Word pattern matching (wildcard)
- ✅ Sorted string iteration

**KHÔNG NÊN dùng khi:**
- ❌ Chỉ cần exact match → Hash Table đủ và đơn giản hơn
- ❌ Memory nghiêm ngặt (Trie tốn nhiều space)
- ❌ Từ rất dài, ít shared prefixes

### Heap

**NÊN dùng khi:**
- ✅ Top K / Bottom K problems
- ✅ Median maintenance (two heaps)
- ✅ Priority scheduling
- ✅ Merge K sorted streams
- ✅ Dijkstra's shortest path

**KHÔNG NÊN dùng khi:**
- ❌ Cần random access / search → Array hoặc BST
- ❌ Cần sorted full output → Sort trực tiếp
- ❌ Memory nghiêm ngặt → Array đủ

---

## 📋 CHEAT SHEET — Tuần 5

### Trie Template

```javascript
class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }
  insert(word) { /* O(m) */ }
  search(word) { /* O(m), exact match */ }
  startsWith(prefix) { /* O(m), prefix match */ }
}
```

### Heap Quick Reference

```
MinHeap:   extractMin() → lấy NHỎ NHẤT → dùng cho "Top K Largest"
MaxHeap:   extractMax() → lấy LỚN NHẤT → dùng cho "Top K Smallest"

Top K Largest → MinHeap size K
Top K Smallest → MaxHeap size K

Median Stream → MaxHeap (small) + MinHeap (large)
```

### Decision Tree

```
String operations:
  ├── Exact match only? ──→ HashMap
  ├── Prefix/Autocomplete? ──→ Trie
  └── Pattern matching (. )? ──→ Trie + DFS

Top K / Frequency:
  ├── K很小? ──→ Heap
  ├── Need sorted output? ──→ Sort
  └── Stream data? ──→ Two Heaps (median)

K Sorted Streams:
  └── Merge K lists? ──→ MinHeap (theo value)
```

---

## 📝 BÀI TẬP TUẦN NÀY

### Trie

| # | Bài | LeetCode | Độ khó | Pattern | Status |
|---|-----|----------|--------|---------|--------|
| 1 | Implement Trie (Prefix Tree) | #208 | 🟡 Medium | Trie | ⬜ |
| 2 | Design Add and Search Words Data Structure | #211 | 🟡 Medium | Trie + DFS | ⬜ |

### Heap

| # | Bài | LeetCode | Độ khó | Pattern | Status |
|---|-----|----------|--------|---------|--------|
| 3 | Kth Largest Element in a Stream | #703 | 🟢 Easy | MinHeap K | ⬜ |
| 4 | Top K Frequent Elements | #347 | 🟡 Medium | MinHeap + Frequency | ⬜ |
| 5 | Find Median from Data Stream | #295 | 🟡 Medium | Two Heaps | ⬜ |
| 6 | Merge K Sorted Lists | #23 | 🔴 Hard | MinHeap | ⬜ |

**Hoàn thành:** 0/6 (0%)

---

## 📚 TÀI NGUYÊN

- Video: [NeetCode Trie](https://www.youtube.com/)
- Video: [NeetCode Heap](https://www.youtube.com/)
- Article: [GeeksforGeeks - Trie](https://geeksforgeeks.org/trie-insert-and-search/)
- Article: [GeeksforGeeks - Heap](https://geeksforgeeks.org/heap-data-structure/)
- Visual: [Trie Visualization](https://visualgo.net/en/structure)
- Visual: [Heap Visualization](https://visualgo.net/en/heap)
