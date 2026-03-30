# 📦 Arrays & Hashing

> **Tuần 1** | **8 bài** | **🟢🟢🟡** | ⏱️ ~1 tuần

---

## 🎯 MỤC TIÊU TUẦN NÀY

- [ ] Hiểu sâu Array & Hash Table (cách hoạt động, khi nào dùng)
- [ ] Nắm vững 3 patterns cốt lõi: **Frequency Counter**, **Two Sum**, **Anagram**
- [ ] Phân biệt được O(n²) brute force vs O(n) hash table
- [ ] Áp dụng được Bucket Sort cho bài toán top K

---

## 📖 TỔNG QUAN

### Array (Mảng)

**Array** là cấu trúc dữ liệu lưu trữ các phần tử cùng kiểu tại các vị trí bộ nhớ **liền kề**.

```
Index:     0    1    2    3    4
Value:    [1]  [2]  [3]  [4]  [5]
Memory:   0x01 0x02 0x03 0x04 0x05
          ↑──────────────────────↑
            contiguous (liền kề)
```

### Đặc điểm Array:

| Thao tác | Độ phức tạp | Ghi chú |
|-----------|-------------|---------|
| Random Access | O(1) | `arr[i]` — tính offset ngay |
| Search (unsorted) | O(n) | Duyệt toàn bộ |
| Search (sorted) | O(log n) | Binary search |
| Append (dynamic array) | O(1) amortized | JavaScript arrays tự mở rộng |
| Insert/Delete đầu | O(n) | Phải dịch tất cả phần tử |
| Insert/Delete giữa | O(n) | Phải dịch phần tử phía sau |

### Ưu điểm:
- ✅ Random access cực nhanh O(1)
- ✅ Cache-friendly — CPU prefetch các phần tử liền kề
- ✅ Memory overhead thấp

### Nhược điểm:
- ❌ Thêm/Xóa phần tử chậm O(n)
- ❌ Kích thước cố định (với array thuần, không phải dynamic array)

---

### Hash Table (Bảng băm)

**Hash Table** dùng **hash function** để ánh xạ key → index, cho phép lookup O(1) trung bình.

```
┌──────────────────────────────────────────────────┐
│              Hash Function: h(key)                │
│                   h("apple") = 2                  │
│                   h("banana") = 5                 │
├──────────────────────────────────────────────────┤
│ Index:   [0]    [1]    [2]    [3]    [4]    [5]  │
│ Value:  null   null  "🍎"   null   null  "🍌"  │
└──────────────────────────────────────────────────┘
```

### Đặc điểm Hash Table:

| Thao tác | Độ phức tạp | Ghi chú |
|-----------|-------------|---------|
| Insert | O(1) avg | Có thể O(n) nếu hash collision nhiều |
| Delete | O(1) avg | Tương tự insert |
| Search/Lookup | O(1) avg | Trung bình, không đảm bảo worst case |
| Collision | — | Xử lý bằng chaining hoặc open addressing |

### HashMap trong JavaScript:

```javascript
// Tạo HashMap
const map = new Map();

// Thêm - O(1)
map.set("name", "Alice");
map.set("age", 25);

// Lấy - O(1)
map.get("name");  // "Alice"
map.get("age");   // 25

// Kiểm tra tồn tại - O(1)
map.has("name");  // true

// Xóa - O(1)
map.delete("age");

// Duyệt
map.forEach((value, key) => {
  console.log(`${key}: ${value}`);
});

// Keys / Values
[...map.keys()];    // ["name"]
[...map.values()];  // ["Alice"]
[...map.entries()]; // [["name", "Alice"]]

// Size
map.size;  // 1
```

### HashSet trong JavaScript:

```javascript
const set = new Set();

// Thêm - O(1)
set.add(1);
set.add(2);
set.add(3);

// Kiểm tra - O(1)
set.has(2);  // true

// Xóa - O(1)
set.delete(2);

// Duyệt
for (const item of set) { ... }

// Size
set.size;  // 2
```

---

## 🔄 PATTERNS CỐT LÕI

### Pattern 1: Frequency Counter

**Dùng khi:** Đếm tần suất xuất hiện của các phần tử.

```javascript
// ❌ Brute Force: O(n²) - so sánh mọi cặp
function hasDuplicateBrute(nums) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] === nums[j]) return true;
    }
  }
  return false;
}

// ✅ Frequency Counter: O(n) - dùng Set
function hasDuplicate(nums) {
  const seen = new Set();
  for (const num of nums) {
    if (seen.has(num)) return true;
    seen.add(num);
  }
  return false;
}
```

**Visual — Frequency Counter cho "anagram":**
```
Input: s = "cba", t = "abc"

Step 1: Count s
  c → 1
  b → 1
  a → 1

Step 2: Decrement t
  a: 1 - 1 = 0  ✓
  c: 1 - 1 = 0  ✓
  b: 1 - 1 = 0  ✓

Step 3: Check - tất cả = 0 → ANAGRAM ✓
```

---

### Pattern 2: Two Sum

**Dùng khi:** Tìm 2 phần tử có tổng bằng target.

```javascript
// ❌ Brute Force: O(n²)
function twoSumBrute(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
}

// ✅ Hash Map: O(n) - complement = target - num
function twoSum(nums, target) {
  const map = new Map(); // { value → index }

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];

    if (map.has(complement)) {
      return [map.get(complement), i];
    }

    map.set(nums[i], i);
  }
}
```

**Visual — Two Sum:**
```
Input: nums = [2, 7, 11, 15], target = 9

i=0: num=2,  complement=7  → map={} → miss → map={2:0}
i=1: num=7,  complement=2  → map={2:0} → HIT! → return [0, 1]

Logic: "Ta đã thấy 2 trước đó, giờ cần 7 để = 9"
```

---

### Pattern 3: Anagram Check

**Dùng khi:** Kiểm tra 2 strings có cùng ký tự hay không.

```javascript
// ❌ Brute Force: O(n log n) - sort rồi so sánh
function isAnagramBrute(s, t) {
  return s.split('').sort().join('') ===
         t.split('').sort().join('');
}

// ✅ Hash Map: O(n) - đếm tần suất
function isAnagram(s, t) {
  if (s.length !== t.length) return false;

  const count = {};
  for (const char of s) {
    count[char] = (count[char] || 0) + 1;
  }

  for (const char of t) {
    if (!count[char]) return false;
    count[char]--;
  }

  return true;
}

// ✅ Simplified: O(n) - dùng Map
function isAnagram(s, t) {
  if (s.length !== t.length) return false;

  const freq = new Map();
  for (const char of s) {
    freq.set(char, (freq.get(char) || 0) + 1);
  }
  for (const char of t) {
    if (!freq.has(char)) return false;
    freq.set(char, freq.get(char) - 1);
    if (freq.get(char) === 0) freq.delete(char);
  }
  return freq.size === 0;
}
```

**Visual — Group Anagrams:**
```
Input: ["eat","tea","tan","ate","nat","bat"]

Phân loại theo sorted key:
  "aet" → ["eat", "tea", "ate"]
  "ant" → ["tan", "nat"]
  "abt" → ["bat"]

Kết quả: [["eat","tea","ate"], ["tan","nat"], ["bat"]]
```

---

### Pattern 4: Prefix / Suffix Product

**Dùng khi:** Tính product của tất cả phần tử TRỪ chính nó, mà KHÔNG dùng division.

```javascript
// ❌ Naive với Division: O(n) nhưng có edge case (0)
// ✅ Prefix/Suffix: O(n) - không division
function productExceptSelf(nums) {
  const n = nums.length;
  const result = new Array(n).fill(1);

  // Prefix: result[i] = product của tất cả phần tử TRƯỚC i
  let prefix = 1;
  for (let i = 0; i < n; i++) {
    result[i] = prefix;
    prefix *= nums[i];
  }

  // Suffix: nhân thêm product của tất cả phần tử SAU i
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    result[i] *= suffix;
    suffix *= nums[i];
  }

  return result;
}
```

**Visual — Product Except Self:**
```
Input: [1, 2, 3, 4]

Index:   0    1    2    3
nums:   [1]  [2]  [3]  [4]
prefix:  1    1    2    6    (product trước i)
suffix:  24   24   12   4    (product sau i)

result:  24   12   8    6    (prefix × suffix)

         2×3×4  1×3×4  1×2×4  1×2×3
         = 24   = 12   = 8    = 6   ✓
```

---

## ⚠️ COMMON PITFALLS (Lỗi hay mắc)

### ❌ Pitfall 1: Quên kiểm tra độ dài
```javascript
// ❌ Sai - chưa kiểm tra độ dài
function isAnagram(s, t) {
  const freq = new Map();
  for (const char of s) freq.set(char, (freq.get(char)||0) + 1);
  for (const char of t) {
    freq.set(char, freq.get(char) - 1); // freq.get(char) có thể là undefined → NaN
  }
  return true; // sai!
}

// ✅ Đúng - kiểm tra độ dài trước
function isAnagram(s, t) {
  if (s.length !== t.length) return false; // ← THÊM DÒNG NÀY
  // ... rest of code
}
```

### ❌ Pitfall 2: Map dùng key là object mà không hash đúng
```javascript
// ❌ Sai - object key không so sánh được
const map = new Map();
map.set({id: 1}, "value");  // Object không hash được như primitive
// map.get({id: 1}) → undefined ❌

// ✅ Đúng - dùng string hoặc primitive
const map = {};
map["1"] = "value";  // String key
map[1] = "value";    // Number → auto converted to string
```

### ❌ Pitfall 3: Two Sum - thêm vào map SAU khi check
```javascript
// ❌ Sai - thêm trước khi check → tìm thấy chính nó
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    map.set(nums[i], i);  // ← thêm ngay → có thể gặp chính nó
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
  }
}

// ✅ Đúng - CHECK TRƯỚC, THÊM SAU
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];  // ← check trước
    map.set(nums[i], i);  // ← thêm sau
  }
}
```

### ❌ Pitfall 4: Quên reset Map/Set khi tái sử dụng
```javascript
// Khi duyệt nhiều test cases, nhớ reset
// map.clear() hoặc map = new Map()
```

### ❌ Pitfall 5: Bucket Sort - index tính sai
```javascript
// ❌ Sai: index có thể âm hoặc > nums.length
function topKFrequent(nums, k) {
  const freq = new Map();
  for (const num of nums) freq.set(num, (freq.get(num)||0) + 1);

  const buckets = [];
  // index = freq → bucket[freq] chứa các số có freq đó
  for (const [num, count] of freq) {
    buckets[count] = buckets[count] || [];
    buckets[count].push(num);
  }

  // Flatten từ freq cao xuống thấp
  const result = [];
  for (let i = buckets.length - 1; i > 0 && result.length < k; i--) {
    if (buckets[i]) result.push(...buckets[i]);
  }
  return result;
}
```

---

## 💡 TIPS & TRICKS

### 1. Khi nào dùng Map vs Set?

```
Map:  Cần lưu (key → value) và truy cập theo key
Set:  Chỉ cần kiểm tra tồn tại (unique items)
      Hoặc đếm frequency với Map là đủ rồi
```

### 2. Object `{}` vs `new Map()` trong JS

```javascript
// Object - key luôn là string/symbol, không maintain order (ES2015+ thì có)
// Dùng cho simple key-value
const obj = { "name": "Alice" };

// Map - key có thể là bất kỳ type, maintain insertion order
// Dùng khi cần Map operations hoặc non-string keys
const map = new Map();
map.set(1, "one");  // Number key OK
map.set({}, "obj");  // Object key OK
```

### 3. Mẹo đếm frequency nhanh

```javascript
// Thay vì if-else dài dòng:
freq.set(char, (freq.get(char) || 0) + 1);

// Có thể viết gọn hơn với nullish coalescing:
freq.set(char, (freq.get(char) ?? 0) + 1);

// Hoặc dùng Object:
count[char] = (count[char] || 0) + 1;
```

### 4. Mẹo flatten array

```javascript
// Flatten 2D → 1D
const flat = arr.flat();  // ES2019

// Hoặc spread:
const flat = [].concat(...arr);

// Với depth:
arr.flatMap(x => Array.isArray(x) ? x : [x]);
```

### 5. Bucket Sort cho Top K Frequent

```javascript
// Thay vì sort O(n log n), dùng bucket sort O(n)
// freq tối đa = nums.length → tạo buckets theo frequency
const buckets = Array(nums.length + 1).fill(null).map(() => []);
for (const [num, freq] of freqMap) {
  buckets[freq].push(num);
}

// Lấy từ freq cao nhất
const result = [];
for (let f = buckets.length - 1; f > 0 && result.length < k; f--) {
  if (buckets[f].length) result.push(...buckets[f]);
}
```

---

## 🔍 BRUTE FORCE → OPTIMAL (So sánh từng bài)

### Bài 1: Contains Duplicate (#217)

| Approach | Time | Space | Code |
|----------|------|-------|------|
| Double Loop | O(n²) | O(1) | `for i, for j if nums[i]===nums[j]` |
| Sort | O(n log n) | O(1) | `sorted.every((x,i)=>i===0\|\|x!==sorted[i-1])` |
| **Hash Set** | **O(n)** | **O(n)** | ✅ `new Set(nums).size !== nums.length` |
| **Hash Set (optimal)** | **O(n)** | **O(n)** | ✅ Loop + `if (set.has(num)) return true` |

### Bài 2: Two Sum (#1)

| Approach | Time | Space | Notes |
|----------|------|-------|-------|
| Double Loop | O(n²) | O(1) | Tìm mọi cặp |
| Hash Map | **O(n)** | **O(n)** | ✅ `complement = target - num` |

### Bài 3: Group Anagrams (#49)

| Approach | Time | Space | Notes |
|----------|------|-------|-------|
| Sort each string | O(n·k log k) | O(n·k) | k = avg string length |
| Count char (26-array) | O(n·k) | O(n·k) | Count 26 letters |
| **Count char (Map key)** | **O(n·k)** | **O(n·k)** | ✅ `"a1b2c1..."` làm key |

### Bài 5: Top K Frequent Elements (#347)

| Approach | Time | Space | Notes |
|----------|------|-------|-------|
| Sort by frequency | O(n log n) | O(n) | Sort pairs |
| **Bucket Sort** | **O(n)** | **O(n)** | ✅ freq = index |

### Bài 6: Product Except Self (#238)

| Approach | Time | Space | Notes |
|----------|------|-------|-------|
| Division | O(n) | O(1) | ❌ Gặp 0 → Infinity |
| **Prefix/Suffix** | **O(n)** | **O(1)*** | ✅ Không division |

### Bài 7: Valid Sudoku (#36)

| Approach | Time | Space | Notes |
|----------|------|-------|-------|
| 3 nested loops | O(9·9·9) | O(1) | 81 ô × kiểm tra hàng/cột/box |
| **Hash Set (3 passes)** | **O(n²)** | **O(n²)** | ✅ Dùng Set per row/col/box |

---

## ⏱️ TIME & SPACE COMPLEXITY TỔNG HỢP

| Data Structure | Access | Search | Insert | Delete |
|----------------|--------|--------|--------|--------|
| Array (static) | O(1) | O(n) | O(n) | O(n) |
| Dynamic Array | O(1) | O(n) | O(1)* | O(n) |
| Hash Map | O(n) | O(1)* | O(1)* | O(1)* |
| Hash Set | — | O(1)* | O(1)* | O(1)* |

*amortized / average

---

## 🏭 REAL-WORLD APPLICATIONS

| Pattern | Ứng dụng thực tế |
|---------|-------------------|
| Frequency Counter | Đếm từ trong văn bản, phân tích log file, kiểm tra spam |
| Two Sum | Tìm cặp giao dịch hòa vốn, pairing problem |
| Anagram Check | Spell checker, DNA sequence matching |
| Hash Map | Caching, memoization, database indexing |
| Bucket Sort | Đếm người theo độ tuổi (range nhỏ), grading system |

---

## ✅ KHI NÀO DÙNG / KHÔNG DÙNG

### NÊN dùng Array khi:
- ✅ Cần random access theo index thường xuyên
- ✅ Kích thước cố định hoặc ít thay đổi
- ✅ Cần iteration nhiều lần (cache-friendly)
- ✅ Cần đơn giản, performance tốt

### KHÔNG NÊN dùng Array khi:
- ❌ Thêm/xóa phần tử ở đầu mảng thường xuyên → Dùng **Linked List**
- ❌ Cần tìm kiếm theo giá trị (không phải index) → Dùng **Hash Table**
- ❌ Cần sorted data với nhiều insert/delete → Dùng **BST**

### NÊN dùng Hash Table khi:
- ✅ Lookup theo key (thay vì index)
- ✅ Đếm tần suất, kiểm tra duplicate
- ✅ Cần O(1) cho hầu hết operations
- ✅ Mapping key → value

### KHÔNG NÊN dùng Hash Table khi:
- ❌ Cần dữ liệu sorted/ordered → Dùng **Tree / BST**
- ❌ Cần prefix/suffix search → Dùng **Trie**
- ❌ Hash collision quá nhiều (performance degrade) → Dùng **Balanced BST**
- ❌ Memory nghiêm ngặt → Array có thể tốt hơn

---

## 📋 CHEAT SHEET — Tuần 1

### Hash Map Template

```javascript
// Frequency Counter
const freq = new Map();
for (const item of arr) {
  freq.set(item, (freq.get(item) || 0) + 1);
}

// Two Sum
const map = new Map();
for (let i = 0; i < nums.length; i++) {
  const complement = target - nums[i];
  if (map.has(complement)) return [map.get(complement), i];
  map.set(nums[i], i);
}

// Anagram Key
function getKey(str) {
  return str.split('').sort().join('');  // "eat" → "aet"
}
// Hoặc count 26 letters:
// "eat" → "a:1,e:1,t:1"
```

### Big O Quick Reference

```
Hash Map:    Insert O(1)  Search O(1)  Space O(n)
Array:       Access O(1)  Search O(n)  Space O(n)
Bucket Sort: Sort O(n)    Space O(n)   (khi range nhỏ)
```

---

## 📝 BÀI TẬP TUẦN NÀY

| # | Bài | LeetCode | Độ khó | Pattern | Status |
|---|-----|----------|--------|---------|--------|
| 1 | Contains Duplicate | #217 | 🟢 Easy | Hash Set | ⬜ |
| 2 | Valid Anagram | #242 | 🟢 Easy | Hash Map | ⬜ |
| 3 | Two Sum | #1 | 🟢 Easy | Hash Map | ⬜ |
| 4 | Group Anagrams | #49 | 🟡 Medium | Hash Map | ⬜ |
| 5 | Top K Frequent Elements | #347 | 🟡 Medium | Bucket Sort | ⬜ |
| 6 | Product of Array Except Self | #238 | 🟡 Medium | Prefix/Suffix | ⬜ |
| 7 | Valid Sudoku | #36 | 🟡 Medium | Hash Set | ⬜ |
| 8 | Encode and Decode Strings | #271 | 🟡 Medium | Design | ⬜ |

**Hoàn thành:** 0/8 (0%)

---

## 📚 TÀI NGUYÊN

- Video: [NeetCode Arrays & Hashing](https://www.youtube.com/)
- Article: [GeeksforGeeks - Hashing](https://geeksforgeeks.org/hashing-data-structure/)
- Cheat Sheet: [Big O Cheat Sheet](https://www.bigocheatsheet.com/)
- Visual: [Hash Table Visualization](https://visualgo.net/en/hashset)
