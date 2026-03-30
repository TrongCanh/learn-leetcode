# #49 - Group Anagrams

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Array, Hash Table, String, Sorting |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/group-anagrams/

---

## 📖 Đề bài

### Mô tả
Cho một mảng strings `strs`, nhóm các **anagrams** lại với nhau.

### Ví dụ

**Example 1:**
```
Input:  ["eat", "tea", "tan", "ate", "nat", "bat"]
Output: [["bat"], ["nat","tan"], ["ate","eat","tea"]]
```

**Example 2:**
```
Input:  [""]
Output: [[""]]
```

### Constraints
```
1 <= strs.length <= 10^4
0 <= strs[i].length <= 100
strs[i] chỉ chứa chữ cái tiếng Anh thường
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Nhóm strings nào là anagrams của nhau?
Trả về: Array của arrays (mỗi group là 1 array)
Tính chất: Anagrams có cùng character frequency
```

---

### 🤔 2. Tư duy từng bước (Step-by-step)

#### Bước 1: Hiểu Anagrams

```
"eat", "tea", "ate" → đều có: a:1, e:1, t:1 → ANAGRAMS
"tan", "nat" → đều có: a:1, n:1, t:1 → ANAGRAMS
"bat" → có: b:1, a:1, t:1 → KHÔNG có anagram trong list
```

---

#### Bước 2: "Aha moment!"

> **Aha moment:**
> "Làm sao nhóm anagrams lại NHANH?"
>
> "Nếu sort mỗi string, tất cả anagrams sẽ có **cùng sorted string**!"
>
> **Sorted string = KEY để nhóm!**

```
"eat" → sort → "aet"
"tea" → sort → "aet"  ← CÙNG KEY!
"ate" → sort → "aet"  ← CÙNG KEY!

→ Dùng sorted string làm KEY trong Hash Map
→ Cùng KEY = cùng group!
```

---

#### Bước 3: Xác định edge cases

```
Edge 1: [""] → [""]
  sort("") = "" → key="" → group=[""]

Edge 2: ["a"] → [["a"]]
  sort("a") = "a" → key="a" → group=["a"]

Edge 3: ["abc", "bca", "cab"] → [["abc", "bca", "cab"]]
  sort → "abc", "abc", "abc" → cùng key → cùng group
```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Anagrams có cùng sorted string"                │
│   → sort(string) = shared key                     │
│                                                     │
│   KEY INSIGHT #2:                                  │
│   "Hash Map: key = sorted string, value = group" │
│   → Mỗi group = array of strings                  │
│                                                     │
│   KEY INSIGHT #3:                                  │
│   "Sorted string có thể dùng làm hash key"      │
│   → O(k log k) cho mỗi string, k = độ dài       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Dùng Array làm Map key (sai!)
function groupAnagrams(strs) {
  const map = {};
  for (const str of strs) {
    const sorted = str.split('').sort();
    // ❌ Array không dùng được làm object key!
    // map[sorted] sẽ convert array thành string "a,e,t"
    // → Hoạt động nhưng không intentional
  }
}

// ✅ Đúng: convert thành string
const sorted = str.split('').sort().join(''); // "aet"
map[sorted].push(str);

// ❌ Pitfall 2: Quên handle empty string
// sort("") = "" → vẫn hoạt động, nhưng cần test

// ❌ Pitfall 3: Sort không consistent
// str.split('').sort() không sort stable trong mọi browser
// → Nên dùng .sort().join('') để tạo string
```

---

### 🔄 5. Các hướng tiếp cận

#### 🔹 Cách 1: Sort + Hash Map (O(n * k log k)) ⭐

```javascript
function groupAnagrams(strs) {
  const map = new Map();

  for (const str of strs) {
    const sorted = str.split('').sort().join('');

    if (!map.has(sorted)) {
      map.set(sorted, []);
    }
    map.get(sorted).push(str);
  }

  return [...map.values()];
}
```

**📊 Phân tích:**
```
Time:  O(n * k log k) — n strings, mỗi string độ dài k
Space: O(n * k) — lưu tất cả strings
```

**🔍 Step-by-step:**
```
Input: ["eat", "tea", "tan", "ate", "nat", "bat"]

i=0: "eat" → sorted="aet" → map.set("aet", ["eat"])
i=1: "tea" → sorted="aet" → map.get("aet").push("tea")
i=2: "tan" → sorted="ant" → map.set("ant", ["tan"])
i=3: "ate" → sorted="aet" → map.get("aet").push("ate")
i=4: "nat" → sorted="ant" → map.get("ant").push("nat")
i=5: "bat" → sorted="abt" → map.set("abt", ["bat"])

map.values():
  ["eat", "tea", "ate"]
  ["tan", "nat"]
  ["bat"]

→ Kết quả: [["eat","tea","ate"], ["tan","nat"], ["bat"]]
```

---

#### 🔹 Cách 2: Character Count + Hash Map (O(n * k))

```javascript
function groupAnagrams(strs) {
  const map = new Map();

  for (const str of strs) {
    const count = new Array(26).fill(0);
    const base = 'a'.charCodeAt(0);

    for (const char of str) {
      count[char.charCodeAt(0) - base]++;
    }

    const key = count.join(','); // "1,0,0,1,..." làm key

    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(str);
  }

  return [...map.values()];
}
```

**📊 Phân tích:**
```
Time:  O(n * k) — n strings, mỗi string độ dài k
Space: O(n * k)
```

**⚠️ Ưu điểm:** Nhanh hơn sort O(k log k)

---

### 🚀 6. Visual Walkthrough

```
Input: ["eat", "tea", "tan", "ate", "nat", "bat"]

┌────────────────────────────────────────────────────────┐
│ Hash Map Evolution:                                        │
│                                                          │
│ Key      │ Value                                          │
│ ─────────┼─────────────────────────────────              │
│ "aet"   │ ["eat"]                                        │
│ "aet"   │ ["eat", "tea"]                                 │
│ "ant"   │ ["tan"]                                        │
│ "aet"   │ ["eat", "tea", "ate"]                          │
│ "ant"   │ ["tan", "nat"]                                  │
│ "abt"   │ ["bat"]                                        │
└────────────────────────────────────────────────────────┘

Final Map:
  "aet" → ["eat", "tea", "ate"]
  "ant" → ["tan", "nat"]
  "abt" → ["bat"]

→ Output: [["eat","tea","ate"], ["tan","nat"], ["bat"]]
```

---

### 🎯 7. Biến thể

```javascript
// Variation 1: Count thay vì sort
// → O(n * k) thay vì O(n * k log k)

// Variation 2: Tìm largest group
// → Tìm group có size lớn nhất

// Variation 3: Group valid sentences
// → Dùng cùng concept
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Group Anagrams - Sort + Hash Map
 * Time: O(n * k log k) | Space: O(n * k)
 */
var groupAnagrams = function(strs) {
  const map = new Map();

  for (const str of strs) {
    const sorted = str.split('').sort().join('');
    if (!map.has(sorted)) {
      map.set(sorted, []);
    }
    map.get(sorted).push(str);
  }

  return [...map.values()];
};
```

---

## 🧪 Test Cases

```javascript
console.log(groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]));
// [["bat"],["nat","tan"],["ate","eat","tea"]]

console.log(groupAnagrams([""]));
// [[""]]

console.log(groupAnagrams(["a"]));
// [["a"]]

console.log(groupAnagrams(["abc", "bca", "cab", "xyz", "zyx"]));
// [["abc","bca","cab"], ["xyz","zyx"]]
```

---

## 📝 Ghi chú

```
PATTERN: Sort string → Key for Hash Map

💡 KEY INSIGHT:
   "Sorted string = anagram key"

⚠️ PITFALLS:
   - Dùng .join('') để tạo string key
   - Array sort: .sort().join('')

✅ Đã hiểu
✅ Tự code lại được
```

---

## ➡️ Bài tiếp theo

[Bài 5: Top K Frequent Elements](./005-top-k-frequent-elements.md)
