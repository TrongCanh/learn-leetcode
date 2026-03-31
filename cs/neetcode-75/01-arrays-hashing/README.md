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

**🤔 Tư duy:** Thay vì so sánh mọi cặp (O(n²)), ta đếm mỗi phần tử xuất hiện bao nhiêu lần rồi dùng con số đó để so sánh. Đếm tần suất = hash table (key = phần tử, value = số lần).

**🔍 Dùng khi:**
- Đề bài có: "đếm số lần xuất hiện", "tần suất", "frequency", "có bao nhiêu..."
- Tìm phần tử xuất hiện nhiều nhất / ít nhất
- Kiểm tra duplicate (hasDuplicate)
- So sánh 2 chuỗi: anagram, isomorphic, palindrome permutation
- Đề bài yêu cầu "top K phần tử hay gặp nhất"

**📝 Tại sao nó hoạt động:**
Mỗi phần tử ta chỉ duyệt **đúng 1 lần** để insert vào map. Sau đó đọc kết quả bất kỳ lúc nào → tổng O(n) thay vì O(n²) của brute force.

**💻 Code mẫu:**

```javascript
// === HAS DUPLICATE ===
// ❌ Brute Force: O(n²)
function hasDuplicateBrute(nums) {
  for (let i = 0; i < nums.length; i++)
    for (let j = i + 1; j < nums.length; j++)
      if (nums[i] === nums[j]) return true;
  return false;
}

// ✅ Frequency Counter: O(n)
function hasDuplicate(nums) {
  const seen = new Set();
  for (const num of nums) {
    if (seen.has(num)) return true; // gặp lần 2 → duplicate!
    seen.add(num);
  }
  return false;
}

// === TOP K FREQUENT ===
// ❌ Sort toàn bộ: O(n log n)
function topKFrequentSort(nums, k) {
  const freq = new Map();
  for (const num of nums)
    freq.set(num, (freq.get(num) || 0) + 1);
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([v]) => v);
}

// ✅ Bucket Sort: O(n) — freq tối đa = nums.length
function topKFrequent(nums, k) {
  const freq = new Map();
  for (const num of nums)
    freq.set(num, (freq.get(num) || 0) + 1);

  // index = frequency → bucket[freq] chứa các số có freq đó
  const buckets = Array(nums.length + 1).fill(null).map(() => []);
  for (const [num, count] of freq)
    buckets[count].push(num);

  const result = [];
  for (let f = buckets.length - 1; f >= 0 && result.length < k; f--)
    if (buckets[f].length) result.push(...buckets[f]);
  return result;
}
```

**🔍 Visual — Bucket Sort cho Top K:**
```
nums = [1, 1, 1, 2, 2, 3], k = 2

Frequency map:
  1 → 3
  2 → 2
  3 → 1

Buckets (index = frequency):
  [0]: []       [1]: [3]      [2]: [2]      [3]: [1]
  freq=0       freq=1         freq=2         freq=3

Lấy từ freq cao → thấp: freq=3 → [1], freq=2 → [2]

Answer: [1, 2] ✓
```

---

### Pattern 2: Two Sum (Hash Map)

**🤔 Tư duy:** Với mỗi số `num`, ta cần tìm `complement = target - num`. Thay vì duyệt toàn bộ, ta hỏi: "Ta đã thấy `complement` chưa?". Nếu có → tìm thấy. Chưa có → lưu `num` lại để dùng sau. Nhìn từ **tương lai ngược về quá khứ**.

**🔍 Dùng khi:**
- Đề bài có: "tìm 2 số có tổng bằng target", "có cặp nào thỏa..."
- Trả về **index** (không phải giá trị)
- Mảng có thể unsorted
- LeetCode #1 (Two Sum) — bài kinh điển nhất

**📝 Tại sao nó hoạt động:**
Với mỗi `num` tại index `i`, `complement = target - num` là **duy nhất** nếu pair tồn tại. Dùng Map lưu `{value → index}` giúp tra O(1). Quan trọng: **check trước, insert sau** — để tránh tìm thấy chính mình.

**💻 Code mẫu:**

```javascript
// ✅ Hash Map: O(n)
function twoSum(nums, target) {
  const map = new Map(); // { value → index }

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];

    // ① CHECK trước: complement đã có trong map?
    if (map.has(complement))
      return [map.get(complement), i]; // ← Tìm thấy!

    // ② INSERT sau: lưu số hiện tại
    map.set(nums[i], i);
  }
}
```

**🔍 Visual — Two Sum:**
```
Input: nums = [2, 7, 11, 15], target = 9

i=0: num=2,  complement=7
     map={} → 7 chưa có → map.set(2, 0)

i=1: num=7,  complement=2
     map={2:0} → 2 đã có! → return [0, 1] ✓

Logic: "Số 2 ta đã thấy ở index 0,
        giờ cần 7 → pair (0,1)"
```

**⚠️ Lưu ý:**
- Trả về **index** (nên dùng Map, không phải Set)
- Check **trước** khi insert — không thì tìm thấy chính mình
- Map trong JS lưu **insertion order** → an toàn khi duyệt

---

### Pattern 3: Anagram Check

**🤔 Tư duy:** Anagram = 2 chuỗi có cùng ký tự, chỉ khác thứ tự. Nếu đếm ký tự của cả 2 chuỗi → 2 bảng giống nhau → là anagram. Đếm bằng Hash Map với key = ký tự, value = số lần.

**🔍 Dùng khi:**
- "2 chuỗi có phải là anagram không"
- "cùng ký tự, thứ tự khác"
- "group các strings là anagram của nhau"
- Đề bài về ký tự: đếm chữ cái, kiểm tra permutation

**📝 Tại sao nó hoạt động:**
Anagram có tính chất: tổng tần suất mỗi ký tự bằng nhau. Dùng Map đếm → nếu 2 Map giống nhau → anagram. Tương tự có thể dùng **sorted string** làm key: `"eat"` → `"aet"`, `"tea"` → `"aet"` → cùng key = cùng anagram group.

**💻 Code mẫu:**

```javascript
// ✅ Cách 1: Hash Map — O(n)
function isAnagram(s, t) {
  if (s.length !== t.length) return false;

  const count = new Map();
  for (const char of s)
    count.set(char, (count.get(char) || 0) + 1);

  for (const char of t) {
    if (!count.get(char)) return false; // char không có hoặc hết
    count.set(char, count.get(char) - 1);
  }
  return true;
}

// ✅ Cách 2: Sorted Key — O(n·k log k), k = avg length
// "eat", "tea", "ate" → sorted = "aet" → cùng key
function groupAnagrams(strs) {
  const map = new Map();
  for (const str of strs) {
    const key = str.split('').sort().join(''); // sorted key
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(str);
  }
  return [...map.values()];
}
```

**🔍 Visual — Group Anagrams:**
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

**🤔 Tư duy:** Muốn tính product của tất cả TRỪ chính mình. Nếu dùng division → gặp số 0 sẽ ra Infinity. Thay vào đó: với mỗi index `i`, chia mảng làm 2 phần — **trước i** và **sau i**. Tích trước + tích sau = kết quả. Mỗi phần tính **một lần duy nhất** qua mảng.

**🔍 Dùng khi:**
- Tính product của array **trừ chính nó**
- Đề bài cấm dùng division
- Có số 0 trong mảng
- LeetCode #238 (Product Except Self)

**📝 Tại sao nó hoạt động:**
Tại index `i`, `result[i]` = (tích tất cả trước `i`) × (tích tất cả sau `i`). Prefix tích từ trái sang, Suffix tích từ phải sang — mỗi phần tử được nhân đúng 1 lần → O(n). Không dùng division nên không có vấn đề với số 0.

**💻 Code mẫu:**

```javascript
// ✅ Prefix/Suffix: O(n), O(1) space (không tính result array)
function productExceptSelf(nums) {
  const n = nums.length;
  const result = new Array(n).fill(1);

  // ① Prefix: tích tất cả phần tử TRƯỚC i
  let prefix = 1;
  for (let i = 0; i < n; i++) {
    result[i] = prefix;      // gán trước khi nhân
    prefix *= nums[i];      // cập nhật prefix
  }

  // ② Suffix: nhân thêm tích sau i
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    result[i] *= suffix;   // nhân thêm suffix
    suffix *= nums[i];      // cập nhật suffix
  }

  return result;
}
```

**🔍 Visual — Product Except Self:**
```
Input: [1, 2, 3, 4]

Pass 1 (Prefix):
  i=0: result[0]=1,     prefix=1×1=1
  i=1: result[1]=1,     prefix=1×2=2
  i=2: result[2]=2,     prefix=2×3=6
  i=3: result[3]=6,     prefix=6×4=24
  → result = [1, 1, 2, 6]

Pass 2 (Suffix):
  i=3: result[3]=6×1=6,   suffix=1×4=4
  i=2: result[2]=2×4=8,   suffix=4×3=12
  i=1: result[1]=1×12=12, suffix=12×2=24
  i=0: result[0]=1×24=24, suffix=24×1=24
  → result = [24, 12, 8, 6]

Kiểm tra: result[0] = 2×3×4 = 24 ✓
          result[2] = 1×2×4 = 8  ✓
```

---

### Pattern 5: Hash Map vs Object vs Set

**🤔 Tư duy:** 3 cấu trúc này đều dùng hash, nhưng phục vụ mục đích khác nhau. **Set** = "có hay không", **Object** = key→value đơn giản, **Map** = key→value với đầy đủ tính năng.

**🔍 Khi nào dùng cái nào:**

| Cấu trúc | Dùng khi | Ví dụ |
|-----------|-----------|--------|
| **Set** | Chỉ cần kiểm tra tồn tại | duplicate check, seen values |
| **Object `{}`** | Key là string/symbol, cần `.` hoặc `[]` access | simple key-value |
| **Map** | Key là bất kỳ type, cần `.get/.set/.has()`, cần iteration order | đa số bài LeetCode |

**💻 Code mẫu:**

```javascript
// Set — kiểm tra tồn tại
const seen = new Set();
seen.add(1);           // O(1)
seen.has(1);           // true
seen.delete(1);

// Object — key luôn là string/symbol
const obj = { name: "Alice", 1: "one" };
obj[1];        // "one" — number tự convert sang "1"
obj.name;     // "Alice"
obj["name"];  // "Alice"

// Map — key là bất kỳ type
const map = new Map();
map.set(1, "one");           // number key OK
map.set({}, "object");        // object key OK
map.get(1);                  // "one"
map.keys();                   // iterable, giữ insertion order
```

**⚠️ Pitfall hay mắc:**
```javascript
// ❌ Object dùng number key → tự convert sang string
const obj = {};
obj[1] = "a";
obj["1"]; // "a" ← 1 và "1" là cùng 1 key!

// ✅ Map giữ nguyên type
const map = new Map();
map.set(1, "a");
map.set("1", "b");
map.get(1);   // "a"
map.get("1"); // "b"
```

---

### Pattern 6: Tại sao Bucket Sort là O(n)?

**🤔 Tư duy:** Bucket Sort hoạt động O(n) vì nó **không sort** theo nghĩa truyền thống. Thay vào đó, nó **phân loại** phần tử vào các bucket dựa trên giá trị. Mỗi phần tử chỉ được xử lý O(1) khi bỏ vào bucket.

**🔍 Tại sao không phải O(n log n)?**

Sort truyền thống (quicksort, mergesort) mất O(n log n) vì phải **so sánh và sắp xếp** giữa các phần tử. Bucket Sort bỏ qua bước so sánh — nó dùng **giá trị làm index trực tiếp**.

```
Ví dụ: nums = [1,1,1,2,2,3], freq = {1:3, 2:2, 3:1}
Bước 1: Đếm — mỗi phần tử duyệt 1 lần → O(n)
Bước 2: Bỏ vào bucket[freq] — O(1) mỗi phần tử → O(n)
Bước 3: Duyệt bucket từ freq cao → thấp → O(n + range)

Tổng: O(n) vì không có bước so sánh nào!
```

**⚠️ Điều kiện để Bucket Sort đạt O(n):**
- Range của giá trị phải **nhỏ và biết trước** (để tạo đủ bucket)
- Nếu range = n² (ví dụ số từ 1 đến 10⁹), thì Bucket Sort trở nên O(n²)
- Top K Frequent dùng được vì `freq ≤ nums.length` → range = n

**💻 Code mẫu:**

```javascript
// Bucket Sort cho Top K Frequent — điều kiện lý tưởng
// freq tối đa = nums.length → tạo n+1 buckets
function topKFrequent(nums, k) {
  const freq = new Map();
  for (const num of nums)
    freq.set(num, (freq.get(num) || 0) + 1);

  // Bucket: index = frequency
  // bucket[3] = [các số xuất hiện 3 lần]
  const buckets = Array(nums.length + 1).fill(null).map(() => []);
  for (const [num, count] of freq)
    buckets[count].push(num);

  // Thu thập từ freq cao nhất
  const result = [];
  for (let i = buckets.length - 1; i >= 0 && result.length < k; i--)
    if (buckets[i].length) result.push(...buckets[i]);

  return result;
}
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
