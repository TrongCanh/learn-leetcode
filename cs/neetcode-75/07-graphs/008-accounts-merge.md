# #721 - Accounts Merge

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Graph, DFS, Union-Find, Hash Map |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/accounts-merge/

---

## 📖 Đề bài

### Mô tả
Cho một danh sách `accounts`, trong đó `accounts[i] = [name, email1, email2, ...]`. Cùng một người có thể có nhiều email thuộc nhiều accounts. Hợp nhất (merge) các accounts có cùng người — tức là những accounts có **ít nhất 1 email chung**.

Trả về danh sách accounts đã merge, sắp xếp emails theo thứ tự alphabet.

### Ví dụ

**Example 1:**
```
Input:
[
  ["John","johnsmith@mail.com","john_newyork@mail.com"],
  ["John","johnsmith@mail.com","john_bravimail.com"],
  ["Mary","mary@mail.com"],
  ["John","johnny@mail.com"]
]
Output:
[
  ["John","john_newyork@mail.com","johnsmith@mail.com","john_bravimail.com"],
  ["Mary","mary@mail.com"],
  ["John","johnny@mail.com"]
]
Giải thích:
  John[0] và John[1] merge (cùng johnsmith@mail.com)
  John[3] không merge (không có email chung với 2 account kia)
```

### Constraints
```
1 <= accounts.length <= 1000
2 <= accounts[i].length <= 10
accounts[i][0] là tên (string)
Tất cả emails có định dạng hợp lệ
Email trong mỗi account là duy nhất
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: Merge accounts có cùng người (dựa trên email chung)
Mô hình: Đồ thị
  - Node = email
  - Edge = 2 emails thuộc cùng account
  - Connected component = 1 person
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: Xây đồ thị

> **Hỏi:** "Làm sao biết 2 emails thuộc cùng người?"

```
Account: ["John", "a@mail.com", "b@mail.com", "c@mail.com"]
→ a-b, a-c, b-c đều là edges (cùng person)
→ Đây là CLIQUE!
→ Mô hình: Email → Person (Union-Find)
```

---

#### Bước 2: "Aha moment!"

> **Aha moment:**
> **Dùng Union-Find (Disjoint Set)**
>
> 1. **Xây map**: email → tên
> 2. **Union**: Trong mỗi account, union tất cả emails lại
> 3. **Group by root**: Tất cả emails có cùng root = 1 person
> 4. **Build result**: name + sorted emails

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Email = unique identifier của person"            │
│   → Không dùng tên (vì cùng tên ≠ cùng người)    │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Union-Find: connect emails trong cùng account"  │
│   → Email1-email2-edge → union                     │
│   → Emails cùng root = cùng person                 │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Email xuất hiện ở nhiều accounts → same person"│
│   → Union tất cả emails trong 1 account lại       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Dùng tên làm key thay vì email
// Tên giống nhau ≠ cùng người (có thể là 2 người trùng tên)
function mergeAccounts(accounts) {
  const map = {};
  for (const account of accounts) {
    const name = account[0];
    if (!map[name]) map[name] = []; // ❌ Sai! Tên có thể trùng
    map[name].push(...account.slice(1));
  }
}
// ✅ Đúng: Dùng Union-Find theo email

// ❌ Pitfall 2: Không sắp xếp emails trước khi trả về
// ✅ emails.sort() trước khi push vào result

// ❌ Pitfall 3: Không thêm tất cả emails vào Union
// Trong 1 account có nhiều emails → union tất cả pairs
for (let i = 1; i < account.length; i++) {
  for (let j = i + 1; j < account.length; j++) {
    uf.union(account[i], account[j]); // ← Cần union TẤT CẢ
  }
}
```

---

### 🔄 5. Các hướng tiếp cận

#### 🔹 Cách 1: Union-Find (O(n × k log k)) ⭐

```javascript
class UnionFind {
  constructor() {
    this.parent = new Map();
  }

  find(x) {
    if (!this.parent.has(x)) this.parent.set(x, x);
    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x)));
    }
    return this.parent.get(x);
  }

  union(x, y) {
    const px = this.find(x);
    const py = this.find(y);
    if (px !== py) {
      this.parent.set(px, py);
    }
  }
}

function accountsMerge(accounts) {
  const uf = new UnionFind();
  const emailToName = new Map();

  // 1. Union all emails trong cùng account
  for (const account of accounts) {
    const name = account[0];
    for (let i = 1; i < account.length; i++) {
      emailToName.set(account[i], name);
      if (i > 1) uf.union(account[1], account[i]);
    }
  }

  // 2. Group emails by root
  const rootToEmails = new Map();
  for (const email of emailToName.keys()) {
    const root = uf.find(email);
    if (!rootToEmails.has(root)) rootToEmails.set(root, []);
    rootToEmails.get(root).push(email);
  }

  // 3. Build result
  const result = [];
  for (const [root, emails] of rootToEmails) {
    emails.sort(); // Alphabetical order
    result.push([emailToName.get(emails[0]), ...emails]);
  }

  return result;
}
```

**📊 Phân tích:**
```
Time:  O(N × K log K) — N accounts, K emails mỗi account
Space: O(N × K)
```

---

### 🚀 6. Visual Walkthrough

```
Accounts:
  ["John","johnsmith@mail.com","john_newyork@mail.com"]
  ["John","johnsmith@mail.com","john_bravimail.com"]
  ["Mary","mary@mail.com"]

Step 1 - Union:
  Account 0: union(johnsmith, john_newyork)
  Account 1: union(johnsmith, john_bravimail)
  Account 2: union(mary) (only 1 email)

  Result groups:
    Group A: {johnsmith, john_newyork, john_bravimail} (root=johnsmith)
    Group B: {mary}

Step 2 - Build result:
  Group A: sorted = [john_bravimail, john_newyork, johnsmith]
           result = ["John", "john_bravimail", "john_newyork", "johnsmith"]
  Group B: result = ["Mary", "mary@mail.com"]

return [["John",...], ["Mary",...]]
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Accounts Merge - Union-Find
 * Time: O(N × K log K) | Space: O(N × K)
 */
class UnionFind {
  constructor() { this.parent = new Map(); }
  find(x) {
    if (!this.parent.has(x)) this.parent.set(x, x);
    if (this.parent.get(x) !== x)
      this.parent.set(x, this.find(this.parent.get(x)));
    return this.parent.get(x);
  }
  union(x, y) {
    const px = this.find(x), py = this.find(y);
    if (px !== py) this.parent.set(px, py);
  }
}

function accountsMerge(accounts) {
  const uf = new UnionFind();
  const emailToName = new Map();

  for (const account of accounts) {
    const name = account[0];
    for (let i = 1; i < account.length; i++) {
      emailToName.set(account[i], name);
      if (i > 1) uf.union(account[1], account[i]);
    }
  }

  const rootToEmails = new Map();
  for (const email of emailToName.keys()) {
    const root = uf.find(email);
    if (!rootToEmails.has(root)) rootToEmails.set(root, []);
    rootToEmails.get(root).push(email);
  }

  const result = [];
  for (const [root, emails] of rootToEmails) {
    emails.sort();
    result.push([emailToName.get(emails[0]), ...emails]);
  }
  return result;
}
```

---

## 🧪 Test Cases

```javascript
console.log(accountsMerge([
  ["John","johnsmith@mail.com","john_newyork@mail.com"],
  ["John","johnsmith@mail.com","john_bravimail.com"],
  ["Mary","mary@mail.com"],
  ["John","johnny@mail.com"]
]));
// [["John","john_bravimail.com","john_newyork@mail.com","johnsmith@mail.com"],
//  ["Mary","mary@mail.com"],
//  ["John","johnny@mail.com"]]

console.log(accountsMerge([["Alex","alex@m.com","ch@m.com"]]));
// [["Alex","alex@m.com","ch@m.com"]]
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: Union-Find với Email mapping

💡 KEY INSIGHT:
   "Email = unique identifier, không dùng tên"
   "Union tất cả emails trong 1 account"
   "Group by root = person"

⚠️ PITFALLS:
   - Không dùng tên làm key
   - Sort emails trước khi return
   - Union tất cả pairs trong 1 account

🔄 VARIATIONS:
   - Sentence Similarity III → tương tự nhưng dùng stack

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Merge Accounts Without Email
// Chỉ merge accounts trùng tên

// Variation 2: Number of Operations to Connect Wires
// Số operations để connect all wires

// Variation 3: Similar String Groups (#839)
// Nhóm strings "similar"

// Variation 4: Most Stones Connected with Same Row or Column
// Đếm stones cùng row hoặc column

// Variation 5: Account Merge with Priority
// Merge theo priority của email domains
```

---

## ➡️ Bài tiếp theo

[Bài 9: Minimum Knight Moves](./009-minimum-knight-moves.md)
