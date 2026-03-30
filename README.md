# 🚀 NEETCODE 75 - Lộ trình 75 bài LeetCode cho phỏng vấn

> **Mục tiêu**: Hoàn thành 75 bài LeetCode phổ biến nhất trong ~8 tuần
> **Thời gian**: 1 ngày học ~2 giờ → 8-10 tuần hoàn thành

---

## 📋 MỤC LỤC

1. [Tổng quan](#tổng-quan)
2. [Cấu trúc thư mục](#cấu-trúc-thư-mục)
3. [Chi tiết từng tuần](#chi-tiết-từng-tuần)
4. [Cách học hiệu quả](#cách-học-hiệu-quả)
5. [Đánh dấu tiến độ](#đánh-dấu-tiến-độ)

---

## 📊 TỔNG QUAN

| Tuần | Chủ đề | Số bài | Độ khó |
|------|---------|--------|--------|
| 1 | Arrays & Hashing | 8 | 🟢🟢🟡 |
| 2 | Two Pointers & Stack | 8 | 🟢🟢🟡 |
| 3 | Sliding Window & Binary Search | 8 | 🟢🟡🟡 |
| 4 | Linked List & Trees | 9 | 🟢🟢🟡 |
| 5 | Trie & Heap | 6 | 🟡🟡🟡 |
| 6 | Dynamic Programming | 11 | 🟢🟡🔴 |
| 7 | Graphs | 10 | 🟡🟡🔴 |
| 8 | Intervals, Backtracking & Math | 15 | 🟡🟡🔴 |
| **TỔNG** | | **75** | |

### Biểu đồ độ khó
```
🟢 Easy:     ~25 bài (33%)
🟡 Medium:   ~40 bài (53%)
🔴 Hard:     ~10 bài (14%)
```

---

## 📁 CẤU TRÚC THƯ MỤC

```
learn-leetcode/
├── README.md                                    # File này
│
├── 01-arrays-hashing/                          # Tuần 1: 8 bài
│   ├── README.md                                # Tổng quan tuần
│   ├── 001-contains-duplicate.md               # Contains Duplicate
│   ├── 002-valid-anagram.md                     # Valid Anagram
│   ├── 003-two-sum.md                           # Two Sum
│   ├── 004-group-anagrams.md                    # Group Anagrams
│   ├── 005-top-k-frequent-elements.md           # Top K Frequent Elements
│   ├── 006-product-of-array-except-self.md      # Product Except Self
│   ├── 007-valid-sudoku.md                      # Valid Sudoku
│   └── 008-encode-decode-strings.md             # Encode/Decode Strings
│
├── 02-two-pointers-stack/                       # Tuần 2: 8 bài
│   ├── README.md
│   ├── 001-valid-parentheses.md                # Valid Parentheses
│   ├── 002-longest-substring.md                  # Longest Substring
│   ├── 003-container-with-most-water.md          # Container With Most Water
│   ├── 004-backspace-string-compare.md           # Backspace String Compare
│   ├── 005-valid-palindrome.md                   # Valid Palindrome
│   ├── 006-remove-duplicates.md                  # Remove Duplicates
│   ├── 007-3sum.md                               # 3Sum
│   └── 008-trapping-rain-water.md                 # Trapping Rain Water
│
├── 03-sliding-window-binary-search/             # Tuần 3: 8 bài
│   ├── README.md
│   ├── 001-binary-search.md                     # Binary Search
│   ├── 002-search-2d-matrix.md                   # Search 2D Matrix
│   ├── 003-koko-eating-bananas.md                 # Koko Eating Bananas
│   ├── 004-find-min-rotated-array.md             # Find Min Rotated Array
│   ├── 005-search-rotated-array.md               # Search Rotated Array
│   ├── 006-max-average-subarray.md                # Max Average Subarray
│   ├── 007-max-vowels-substring.md                # Max Vowels Substring
│   └── 008-longest-subarray-ones.md              # Longest Subarray 1's
│
├── 04-linked-list-trees/                         # Tuần 4: 9 bài
│   ├── README.md
│   ├── 001-reverse-linked-list.md               # Reverse Linked List
│   ├── 002-merge-two-sorted-lists.md             # Merge Two Sorted Lists
│   ├── 003-reorder-list.md                       # Reorder List
│   ├── 004-remove-nth-node.md                    # Remove Nth Node
│   ├── 005-maximum-depth.md                       # Maximum Depth BT
│   ├── 006-invert-tree.md                         # Invert Binary Tree
│   ├── 007-same-tree.md                           # Same Tree
│   ├── 008-subtree.md                             # Subtree of Another
│   └── 009-lowest-common-ancestor.md              # Lowest Common Ancestor
│
├── 05-trie-heap/                                 # Tuần 5: 6 bài
│   ├── README.md
│   ├── 001-implement-trie.md                     # Implement Trie
│   ├── 002-design-search-words.md                 # Design Search Words
│   ├── 003-kth-largest.md                         # Kth Largest in Stream
│   ├── 004-top-k-frequent.md                      # Top K Frequent
│   ├── 005-median-data-stream.md                  # Median Data Stream
│   └── 006-merge-k-sorted.md                      # Merge K Sorted Lists
│
├── 06-dynamic-programming/                       # Tuần 6: 11 bài
│   ├── README.md
│   ├── 001-climbing-stairs.md                    # Climbing Stairs
│   ├── 002-min-cost-climbing.md                   # Min Cost Climbing
│   ├── 003-house-robber.md                        # House Robber
│   ├── 004-longest-palindromic.md                 # Longest Palindromic
│   ├── 005-coin-change.md                          # Coin Change
│   ├── 006-longest-increasing.md                   # Longest Increasing Subseq
│   └── 007-011-remaining.md                       # Bài 7-11
│
├── 07-graphs/                                    # Tuần 7: 10 bài
│   ├── README.md
│   ├── 001-number-of-islands.md                  # Number of Islands
│   └── 002-010-remaining.md                        # Bài 2-10
│
└── 08-intervals-backtracking-math/              # Tuần 8: 15 bài
    ├── README.md
    └── 001-015-all.md                             # Tất cả bài
```

---

## 📖 CHI TIẾT TỪNG TUẦN

### 📅 TUẦN 1: Arrays & Hashing
**Độ khó**: 🟢🟢🟡 | **8 bài** | ~1 tuần

| # | Bài | LeetCode | Độ khó | Pattern |
|---|-----|----------|--------|---------|
| 1 | Contains Duplicate | #217 | 🟢 Easy | Hash Set |
| 2 | Valid Anagram | #242 | 🟢 Easy | Hash Map |
| 3 | Two Sum | #1 | 🟢 Easy | Hash Map |
| 4 | Group Anagrams | #49 | 🟡 Medium | Hash Map |
| 5 | Top K Frequent Elements | #347 | 🟡 Medium | Bucket Sort |
| 6 | Product of Array Except Self | #238 | 🟡 Medium | Prefix/Suffix |
| 7 | Valid Sudoku | #36 | 🟡 Medium | Hash Set |
| 8 | Encode and Decode Strings | #271 | 🟡 Medium | Design |

**Key Patterns:**
- Hash Set: Kiểm tra duplicate nhanh O(1)
- Hash Map: Đếm tần suất, lookup O(1)
- Bucket Sort: Sắp xếp theo tần suất

---

### 📅 TUẦN 2: Two Pointers & Stack
**Độ khó**: 🟢🟢🟡 | **8 bài** | ~1 tuần

| # | Bài | LeetCode | Độ khó | Pattern |
|---|-----|----------|--------|---------|
| 1 | Valid Parentheses | #20 | 🟢 Easy | Stack |
| 2 | Longest Substring Without Repeating | #3 | 🟡 Medium | Sliding Window |
| 3 | Container With Most Water | #11 | 🟡 Medium | Two Pointers |
| 4 | Backspace String Compare | #844 | 🟢 Easy | Two Pointers |
| 5 | Valid Palindrome | #125 | 🟢 Easy | Two Pointers |
| 6 | Remove Duplicates Sorted Array | #26 | 🟢 Easy | Two Pointers |
| 7 | 3Sum | #15 | 🟡 Medium | Two Pointers |
| 8 | Trapping Rain Water | #42 | 🔴 Hard | Two Pointers |

**Key Patterns:**
- Stack: LIFO, xử lý parentheses
- Two Pointers: Duyệt từ 2 đầu, tìm cặp
- Sliding Window: Window có kích thước thay đổi

---

### 📅 TUẦN 3: Sliding Window & Binary Search
**Độ khó**: 🟢🟡🟡 | **8 bài** | ~1 tuần

| # | Bài | LeetCode | Độ khó | Pattern |
|---|-----|----------|--------|---------|
| 1 | Binary Search | #704 | 🟢 Easy | Binary Search |
| 2 | Search a 2D Matrix | #74 | 🟡 Medium | Binary Search |
| 3 | Koko Eating Bananas | #875 | 🟡 Medium | Binary Search |
| 4 | Find Min Rotated Array | #153 | 🟡 Medium | Binary Search |
| 5 | Search Rotated Array | #33 | 🟡 Medium | Binary Search |
| 6 | Max Average Subarray I | #643 | 🟢 Easy | Sliding Window |
| 7 | Max Vowels Substring | #1456 | 🟡 Medium | Sliding Window |
| 8 | Longest Subarray 1's | #1493 | 🟡 Medium | Sliding Window |

**Key Patterns:**
- Binary Search: Tìm kiếm trong sorted array O(log n)
- Sliding Window: Fixed/Variable size window

---

### 📅 TUẦN 4: Linked List & Trees
**Độ khó**: 🟢🟢🟡 | **9 bài** | ~1 tuần

| # | Bài | LeetCode | Độ khó | Pattern |
|---|-----|----------|--------|---------|
| 1 | Reverse Linked List | #206 | 🟢 Easy | Linked List |
| 2 | Merge Two Sorted Lists | #21 | 🟢 Easy | Linked List |
| 3 | Reorder List | #143 | 🟡 Medium | Linked List |
| 4 | Remove Nth Node | #19 | 🟡 Medium | Two Pointers |
| 5 | Maximum Depth Binary Tree | #104 | 🟢 Easy | DFS/BFS |
| 6 | Invert Binary Tree | #226 | 🟢 Easy | DFS/BFS |
| 7 | Same Tree | #100 | 🟢 Easy | DFS |
| 8 | Subtree of Another Tree | #572 | 🟢 Easy | DFS |
| 9 | Lowest Common Ancestor | #235 | 🟡 Medium | BST Search |

**Key Patterns:**
- Slow & Fast Pointers: Tìm middle, detect cycle
- DFS: Preorder, Inorder, Postorder
- BFS: Level order traversal

---

### 📅 TUẦN 5: Trie & Heap
**Độ khó**: 🟡🟡🟡 | **6 bài** | ~1 tuần

| # | Bài | LeetCode | Độ khó | Pattern |
|---|-----|----------|--------|---------|
| 1 | Implement Trie | #208 | 🟡 Medium | Trie |
| 2 | Design Search Words | #211 | 🟡 Medium | Trie |
| 3 | Kth Largest Element | #703 | 🟢 Easy | Heap |
| 4 | Top K Frequent Elements | #347 | 🟡 Medium | Heap |
| 5 | Median Data Stream | #295 | 🟡 Medium | Heap |
| 6 | Merge K Sorted Lists | #23 | 🔴 Hard | Heap |

**Key Patterns:**
- Trie: Prefix tree, search O(m) với m = word length
- Heap: Min/Max heap, tìm K lớn nhất/nhỏ nhất

---

### 📅 TUẦN 6: Dynamic Programming
**Độ khó**: 🟢🟡🔴 | **11 bài** | ~1.5 tuần

| # | Bài | LeetCode | Độ khó | Pattern |
|---|-----|----------|--------|---------|
| 1 | Climbing Stairs | #70 | 🟢 Easy | 1D DP |
| 2 | Min Cost Climbing Stairs | #746 | 🟢 Easy | 1D DP |
| 3 | House Robber | #198 | 🟡 Medium | 1D DP |
| 4 | Longest Palindromic Substring | #5 | 🟡 Medium | 2D DP |
| 5 | Coin Change | #322 | 🟡 Medium | 1D DP |
| 6 | Longest Increasing Subsequence | #300 | 🟡 Medium | 1D DP |
| 7 | Partition Equal Subset Sum | #416 | 🟡 Medium | 1D DP |
| 8 | Word Break | #139 | 🟡 Medium | 1D DP |
| 9 | Unique Paths | #62 | 🟡 Medium | 2D DP |
| 10 | Longest Common Subsequence | #1143 | 🟡 Medium | 2D DP |
| 11 | Best Time Stock | #714 | 🟡 Medium | DP |

**Key Patterns:**
- 1D DP: dp[i] = best answer up to i
- 2D DP: dp[i][j] = best for subarray i to j
- State transitions cần xác định rõ

---

### 📅 TUẦN 7: Graphs
**Độ khó**: 🟡🟡🔴 | **10 bài** | ~1.5 tuần

| # | Bài | LeetCode | Độ khó | Pattern |
|---|-----|----------|--------|---------|
| 1 | Number of Islands | #200 | 🟡 Medium | DFS/BFS |
| 2 | Clone Graph | #133 | 🟡 Medium | BFS/DFS |
| 3 | Pacific Atlantic | #417 | 🟡 Medium | BFS |
| 4 | Course Schedule | #207 | 🟡 Medium | Topological Sort |
| 5 | Number of Connected Components | #323 | 🟡 Medium | DFS/BFS |
| 6 | Rotting Oranges | #994 | 🟡 Medium | BFS |
| 7 | Keys and Rooms | #841 | 🟢 Easy | BFS/DFS |
| 8 | Accounts Merge | #721 | 🟡 Medium | Union Find |
| 9 | Minimum Knight Moves | #1197 | 🟡 Medium | BFS |
| 10 | Reorder Routes | #1466 | 🟡 Medium | BFS |

**Key Patterns:**
- DFS: Flood fill, connected components
- BFS: Shortest path, level order
- Topological Sort: Course prerequisites
- Union Find: Merge accounts, find components

---

### 📅 TUẦN 8: Intervals, Backtracking & Math
**Độ khó**: 🟡🟡🔴 | **15 bài** | ~1.5 tuần

#### Intervals (5 bài)
| # | Bài | LeetCode | Độ khó |
|---|-----|----------|--------|
| 1 | Insert Interval | #57 | 🔴 Hard |
| 2 | Merge Intervals | #56 | 🟡 Medium |
| 3 | Non-overlapping Intervals | #435 | 🟡 Medium |
| 4 | Meeting Rooms | #253 | 🟡 Medium |
| 5 | Meeting Rooms II | #253 | 🟡 Medium |

#### Backtracking (6 bài)
| # | Bài | LeetCode | Độ khó |
|---|-----|----------|--------|
| 6 | Subsets | #78 | 🟡 Medium |
| 7 | Combination Sum | #39 | 🟡 Medium |
| 8 | Permutations | #46 | 🟡 Medium |
| 9 | Subsets II | #90 | 🟡 Medium |
| 10 | Permutations II | #47 | 🟡 Medium |
| 11 | Combination Sum II | #40 | 🟡 Medium |

#### Math & Others (4 bài)
| # | Bài | LeetCode | Độ khó |
|---|-----|----------|--------|
| 12 | Power of Two | #231 | 🟢 Easy |
| 13 | Number of 1 Bits | #191 | 🟢 Easy |
| 14 | Count Primes | #204 | 🟡 Medium |
| 15 | Rotate Image | #48 | 🟡 Medium |

---

## 🎯 CÁCH HỌC HIỆU QUẢ

### 1. Cấu trúc mỗi bài
```
┌─────────────────────────────────────────┐
│ 📌 Thông tin                             │
│ - Độ khó, Chủ đề                        │
│ - Link LeetCode                         │
├─────────────────────────────────────────┤
│ 📖 Đề bài                               │
│ - Mô tả, Ví dụ                          │
├─────────────────────────────────────────┤
│ 🧠 Phân tích                            │
│ - Các hướng tiếp cận (Brute → Optimal)   │
│ - Tư duy, Flow chart                    │
├─────────────────────────────────────────┤
│ ✅ Đáp án                                │
│ - Code JavaScript có comment             │
│ - Độ phức tạp Time/Space                 │
├─────────────────────────────────────────┤
│ 🧪 Test Cases                            │
│ - Ví dụ chạy thử                         │
└─────────────────────────────────────────┘
```

### 2. Quy trình học 1 bài
1. **Đọc đề** (2 phút) → Hiểu input/output
2. **Tự code** (15-20 phút) → Không nhìn đáp án
3. **So sánh** → Với đáp án, note cách khác
4. **Ghi chú** → Pattern, tips, mistakes

### 3. Thứ tự ưu tiên
```
🟢 Easy → 🟡 Medium → 🔴 Hard
```
- Làm hết Easy trước (build confidence)
- Medium xong là đủ cho phỏng vấn
- Hard chỉ cần hiểu pattern

### 4. Daily Routine (2 giờ/ngày)
| Thời gian | Hoạt động |
|-----------|-----------|
| 30 phút | Ôn lại bài hôm trước |
| 60 phút | Làm 2-3 bài mới |
| 30 phút | Review & ghi chú |

---

## 📈 ĐÁNH DẤU TIẾN ĐỘ

### Week 1: Arrays & Hashing
- [x] Contains Duplicate
- [x] Valid Anagram
- [x] Two Sum
- [x] Group Anagrams
- [x] Top K Frequent Elements
- [x] Product of Array Except Self
- [x] Valid Sudoku
- [x] Encode and Decode Strings

### Week 2: Two Pointers & Stack
- [x] Valid Parentheses
- [x] Longest Substring
- [x] Container With Most Water
- [x] Backspace String Compare
- [x] Valid Palindrome
- [x] Remove Duplicates
- [x] 3Sum
- [x] Trapping Rain Water

### Week 3: Sliding Window & Binary Search
- [x] Binary Search
- [x] Search 2D Matrix
- [x] Koko Eating Bananas
- [x] Find Min Rotated Array
- [x] Search Rotated Array
- [x] Max Average Subarray
- [x] Max Vowels Substring
- [x] Longest Subarray 1's

### Week 4: Linked List & Trees
- [x] Reverse Linked List
- [x] Merge Two Sorted Lists
- [x] Reorder List
- [x] Remove Nth Node
- [x] Maximum Depth
- [x] Invert Tree
- [x] Same Tree
- [x] Subtree
- [x] Lowest Common Ancestor

### Week 5: Trie & Heap
- [x] Implement Trie
- [x] Design Search Words
- [x] Kth Largest
- [x] Top K Frequent
- [x] Median Data Stream
- [x] Merge K Sorted Lists

### Week 6: Dynamic Programming
- [x] Climbing Stairs
- [x] Min Cost Climbing
- [x] House Robber
- [x] Longest Palindromic
- [x] Coin Change
- [x] Longest Increasing Subsequence
- [x] Partition Equal Subset
- [x] Word Break
- [x] Unique Paths
- [x] Longest Common Subsequence
- [x] Best Time Stock

### Week 7: Graphs
- [x] Number of Islands
- [x] Clone Graph
- [x] Pacific Atlantic
- [x] Course Schedule
- [x] Number of Components
- [x] Rotting Oranges
- [x] Keys and Rooms
- [x] Accounts Merge
- [x] Minimum Knight Moves
- [x] Reorder Routes

### Week 8: Intervals, Backtracking & Math
- [x] Insert Interval
- [x] Merge Intervals
- [x] Non-overlapping Intervals
- [x] Meeting Rooms
- [x] Meeting Rooms II
- [x] Subsets
- [x] Combination Sum
- [x] Permutations
- [x] Subsets II
- [x] Permutations II
- [x] Combination Sum II
- [x] Power of Two
- [x] Number of 1 Bits
- [x] Count Primes
- [x] Rotate Image

---

## 🔑 KEY PATTERNS TỔNG HỢP

### Array & Hashing
- [ ] Hash Map: O(1) lookup
- [ ] Hash Set: O(1) existence check
- [ ] Prefix Sum: Range sum queries
- [ ] Sliding Window: Variable size

### Two Pointers
- [ ] Opposite direction: Sorted array
- [ ] Same direction: Fast & Slow
- [ ] Window shrinking

### Stack
- [ ] Matching parentheses
- [ ] Monotonic stack: Next greater/smaller
- [ ] Stack for DFS

### Binary Search
- [ ] Classic: Sorted array
- [ ] Modified: Find boundary
- [ ] 2D matrix search

### Linked List
- [ ] Dummy node
- [ ] Slow & Fast pointers
- [ ] Reverse
- [ ] Merge sorted lists

### Trees
- [ ] DFS: Pre/In/Post order
- [ ] BFS: Level order
- [ ] BST: Binary search property
- [ ] Traversal with parent pointer

### Trie
- [ ] Prefix search
- [ ] Word lookup
- [ ] Pattern matching

### Heap
- [ ] K smallest/largest
- [ ] Top K frequent
- [ ] Median maintain

### Dynamic Programming
- [ ] 1D: Fibonacci, House Robber
- [ ] 2D: Grid, Substring
- [ ] Knapsack
- [ ] Longest subsequence

### Graphs
- [ ] DFS: Flood fill
- [ ] BFS: Shortest path
- [ ] Topological Sort
- [ ] Union Find
- [ ] Dijkstra

### Backtracking
- [ ] Subsets
- [ ] Permutations
- [ ] Combination Sum
- [ ] N-Queens

### Math
- [ ] Bit manipulation
- [ ] Prime numbers
- [ ] Matrix rotation

---

## 📚 TÀI NGUYÊN THAM KHẢO

### Websites
- [LeetCode](https://leetcode.com/)
- [NeetCode 75](https://neetcode.io/practice)
- [NeetCode YouTube](https://www.youtube.com/c/NeetCode)

### Cheat Sheets
- [Big O Cheat Sheet](https://www.bigocheatsheet.com/)
- [Data Structures in JavaScript](https://github.com/jwasham/coding-interview-university)

---

## 🚀 BẮT ĐẦU

```bash
# Clone/Download project
cd learn-leetcode

# Bắt đầu từ Tuần 1
cd 01-arrays-hashing
cat README.md
```

**Chúc anh học tốt! 🎉**

---

*Generated: 2026-03-30*
*Author: Claude AI*
