# #208 - Implement Trie

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Trie, Design |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/implement-trie-prefix-tree/

---

## 📖 Đề bài

### Mô tả
Triển khai một **Trie** (Prefix Tree) với các operations:
- `insert(word)` — chèn một word
- `search(word)` — tìm kiếm chính xác một word
- `startsWith(prefix)` — kiểm tra xem có word nào bắt đầu với prefix không

### Ví dụ

```
Trie t = new Trie();
t.insert("apple");
t.search("apple");    // true
t.search("app");       // false
t.startsWith("app");   // true
t.insert("app");
t.search("app");       // true
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Implement Trie (Prefix Tree)
Mô hình: Tree với mỗi node có 26 children (a-z)
→ TrieNode: children{letter: TrieNode}, isEnd: boolean
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: TrieNode structure

```
TrieNode:
  children: Map<String, TrieNode> (hoặc Object)
  isEnd: boolean (word kết thúc tại node này)
```

#### Bước 2: "Aha moment!" — Insert/Search

> **Aha moment:**
> ```
> Insert:
>   Từ root → đi theo từng char
>   Nếu char chưa có → tạo node mới
>   Đến cuối → isEnd = true
>
> Search:
>   Từ root → đi theo từng char
>   Nếu char không có → return false
>   Đến cuối → return isEnd
>
> startsWith:
>   Từ root → đi theo từng char
>   Nếu char không có → return false
>   Đến cuối → return true (chỉ cần prefix tồn tại)
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "TrieNode = children + isEnd"                    │
│   → children: Map/Object 26 keys                   │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Search vs startsWith:"                          │
│   → Search: phải đến cuối VÀ isEnd=true         │
│   → startsWith: chỉ cần đến cuối                 │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Insert = create nodes + mark isEnd"            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Search không check isEnd
// Chỉ đến cuối word nhưng không check isEnd → "app" s�i sai trả về true
// khi chỉ insert "apple"
// ✅ return node !== null && node.isEnd === true

// ❌ Pitfall 2: Dùng children['a'] thay vì children.char
// ✅ for (const char of word) { if (!node.children[char]) ... }

// ❌ Pitfall 3: startsWith return node !== null
// ✅ startsWith: đi đến cuối prefix là đủ
```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Trie Implementation (O(L), O(L)) ⭐

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

  search(word) {
    let node = this.traverse(word);
    return node !== null && node.isEnd === true;
  }

  startsWith(prefix) {
    return this.traverse(prefix) !== null;
  }

  traverse(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) {
        return null;
      }
      node = node.children[char];
    }
    return node;
  }
}
```

**📊 Phân tích:**
```
Time:  O(L) — L = độ dài word
Space: O(L) — worst case, mỗi char 1 node mới
```

---

### 🚀 6. Visual Walkthrough

```
Insert: "apple", "app", "bad"

Root
 └── a
      └── p
           └── p
                └── e (isEnd=true)
      (và b→a→d isEnd=true)

Search "apple":
  root→a→p→p→e → isEnd=true ✓

Search "app":
  root→a→p→p → isEnd=false ✗ → return false

startsWith "ap":
  root→a→p → found ✓ → return true
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Implement Trie - Prefix Tree
 * Time: O(L) per operation | Space: O(L)
 */
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

  search(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) return false;
      node = node.children[char];
    }
    return node.isEnd;
  }

  startsWith(prefix) {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children[char]) return false;
      node = node.children[char];
    }
    return true;
  }
}
```

---

## 🧪 Test Cases

```javascript
const t = new Trie();
t.insert("apple");
console.log(t.search("apple"));    // true
console.log(t.search("app"));       // false
console.log(t.startsWith("app"));   // true
t.insert("app");
console.log(t.search("app"));       // true
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Trie (Prefix Tree)

💡 KEY INSIGHT:
   "TrieNode = children + isEnd"
   "Search: đến cuối + isEnd=true"
   "startsWith: đến cuối là đủ"

⚠️ PITFALLS:
   - Search phải check isEnd
   - Traverse trả null nếu char không có

🔄 VARIATIONS:
   - Autocomplete System
   - Longest Common Prefix (#14)

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Autocomplete System
// Gợi ý từ prefix
class AutocompleteSystem {
  constructor(sentences, times) {
    this.root = new TrieNode();
    this.searchWord = '';
    // Build trie với sentences
  }
  
  input(c) {
    if (c === '#') {
      // Add sentence to trie
      return [];
    }
    this.searchWord += c;
    return this.getSuggestions(this.searchWord);
  }
}

// Variation 2: Longest Common Prefix (#14)
// Tìm prefix chung dài nhất
function longestCommonPrefix(strs) {
  if (!strs.length) return '';
  let prefix = strs[0];
  for (let i = 1; i < strs.length; i++) {
    while (strs[i].indexOf(prefix) !== 0) {
      prefix = prefix.substring(0, prefix.length - 1);
    }
  }
  return prefix;
}

// Variation 3: Replace Words (#648)
// Thay thế prefix bằng root word
function replaceWords(dict, sentence) {
  const trie = new Trie();
  for (const word of dict) {
    trie.insert(word);
  }
  
  return sentence.split(' ').map(word => {
    let root = '';
    for (const char of word) {
      root += char;
      if (trie.startsWith(root)) break;
    }
    return trie.search(word) ? word : root;
  }).join(' ');
}

// Variation 4: Word Search II (#212)
// Tìm tất cả words trong board
function findWords(board, words) {
  const trie = new Trie();
  for (const word of words) {
    trie.insert(word);
  }
  
  const result = [];
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[0].length; j++) {
      dfs(i, j, '', trie.root);
    }
  }
  return result;
}

// Variation 5: Map Sum Pairs (#677)
// Sum tất cả words bắt đầu với prefix
class MapSum {
  constructor() {
    this.trie = new MapSumNode();
  }
  
  insert(key, val) {
    let node = this.trie;
    for (const char of key) {
      if (!node.children[char]) {
        node.children[char] = new MapSumNode();
      }
      node = node.children[char];
    }
    node.val = val;
  }
  
  sum(prefix) {
    let node = this.trie;
    for (const char of prefix) {
      if (!node.children[char]) return 0;
      node = node.children[char];
    }
    return this.getSum(node);
  }
}
```

---

## ➡️ Bài tiếp theo

[Bài 2: Design Add and Search Words](./002-design-search-words.md)
