# #211 - Design Add and Search Words

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Trie, Backtracking |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/design-add-and-search-words-data-structure/

---

## 📖 Đề bài

### Mô tả
Giống Trie nhưng `search(word)` có thể chứa ký tự `.` đại diện cho **bất kỳ ký tự nào**.

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Trie với wildcard '.' trong search
→ '.' = match bất kỳ ký tự
→ Dùng DFS/Backtracking để handle '.'
```

---

### 🤔 2. Tư duy từng bước

> **Aha moment:**
> ```
> search(word):
>   if word[i] === '.':
>     DFS vào TẤT CẢ children
>   else:
>     Đi vào child cụ thể
>
>   Nếu đến cuối word → check isEnd
> ```

---

### 🔄 5. Hướng tiếp cận

#### 🔹 Cách 1: Trie + DFS (O(n × 26^k)) ⭐

```javascript
class WordDictionary {
  constructor() {
    this.root = {};
  }

  addWord(word) {
    let node = this.root;
    for (const char of word) {
      if (!node[char]) node[char] = {};
      node = node[char];
    }
    node.isEnd = true;
  }

  search(word) {
    return this.searchHelper(word, 0, this.root);
  }

  searchHelper(word, i, node) {
    if (i === word.length) return node.isEnd === true;

    const char = word[i];
    if (char === '.') {
      for (const key in node) {
        if (key !== 'isEnd' && this.searchHelper(word, i + 1, node[key])) {
          return true;
        }
      }
      return false;
    }

    if (!node[char]) return false;
    return this.searchHelper(word, i + 1, node[char]);
  }
}
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Design Add and Search Words - Trie + DFS
 */
class WordDictionary {
  constructor() { this.root = {}; }
  addWord(word) {
    let node = this.root;
    for (const char of word) {
      if (!node[char]) node[char] = {};
      node = node[char];
    }
    node.isEnd = true;
  }
  search(word) { return this.searchHelper(word, 0, this.root); }
  searchHelper(word, i, node) {
    if (i === word.length) return node.isEnd === true;
    if (word[i] === '.') {
      for (const key in node) {
        if (key !== 'isEnd' && this.searchHelper(word, i + 1, node[key])) return true;
      }
      return false;
    }
    if (!node[word[i]]) return false;
    return this.searchHelper(word, i + 1, node[word[i]]);
  }
}
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Trie + DFS cho Wildcard

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Word Search II (#212)
// Tìm tất cả words trong 2D board
function findWords(board, words) {
  const trie = new Trie();
  for (const word of words) {
    trie.insert(word);
  }
  const result = [];
  
  function dfs(r, c, node, path) {
    if (node.isEnd) {
      result.push(path);
      node.isEnd = false; // Tránh duplicate
    }
    if (r < 0 || c < 0 || r >= board.length || 
        c >= board[0].length || !board[r][c]) return;
    
    const char = board[r][c];
    if (!node.children[char]) return;
    
    board[r][c] = null;
    dfs(r+1, c, node.children[char], path + char);
    dfs(r-1, c, node.children[char], path + char);
    dfs(r, c+1, node.children[char], path + char);
    dfs(r, c-1, node.children[char], path + char);
    board[r][c] = char;
  }
  
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[0].length; j++) {
      dfs(i, j, trie.root, '');
    }
  }
  return result;
}

// Variation 2: Implement Magic Dictionary
// Tìm word với đúng 1 character khác
class MagicDictionary {
  constructor() {
    this.dict = [];
  }
  
  buildDict(dict) {
    this.dict = dict;
  }
  
  search(word) {
    for (const w of this.dict) {
      if (w.length !== word.length) continue;
      let diff = 0;
      for (let i = 0; i < word.length; i++) {
        if (w[i] !== word[i]) diff++;
        if (diff > 1) break;
      }
      if (diff === 1) return true;
    }
    return false;
  }
}

// Variation 3: Search Suggestions System (#1268)
// Gợi ý search với 3 suggestions
function suggestedProducts(products, searchWord) {
  products.sort();
  const result = [];
  let prefix = '';
  
  for (const char of searchWord) {
    prefix += char;
    const suggestions = products.filter(p => 
      p.startsWith(prefix)
    ).slice(0, 3);
    result.push(suggestions);
  }
  return result;
}

// Variation 4: Maximum XOR of Two Numbers in Array (#421)
// Tìm max XOR trong array
function findMaximumXOR(nums) {
  let max = 0, mask = 0;
  for (let i = 31; i >= 0; i--) {
    mask |= (1 << i);
    const prefixes = new Set(nums.map(n => n & mask));
    const candidate = max | (1 << i);
    for (const prefix of prefixes) {
      if (prefixes.has(prefix ^ candidate)) {
        max = candidate;
        break;
      }
    }
  }
  return max;
}

// Variation 5: Prefix and Suffix Search (#745)
// Tìm word với prefix và suffix
```

---

## ➡️ Bài tiếp theo

[Bài 3: Kth Largest Element in Stream](./003-kth-largest.md)
