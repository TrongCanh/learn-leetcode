# #1197 - Minimum Knight Moves

## 📌 Thông tin

| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Graph, BFS |
| **Trạng thái** | ⬜ Chưa làm |

**Link:** https://leetcode.com/problems/minimum-knight-moves/

---

## 📖 Đề bài

### Mô tả
Trên một bàn cờ vô hạn, một quân mã (knight) có thể di chuyển theo hình chữ L:
- 2 ô theo 1 hướng + 1 ô vuông góc
- 8 hướng di chuyển: `(2,1), (2,-1), (-2,1), (-2,-1), (1,2), (1,-2), (-1,2), (-1,-2)`

Tìm **số bước tối thiểu** để quân mã di chuyển từ `(0, 0)` đến `(x, y)`.

### Ví dụ

**Example 1:**
```
Input: x = 2, y = 1
Output: 1
Giải thích: [0,0] → [2,1] = 1 bước
```

**Example 2:**
```
Input: x = 5, y = 5
Output: 4
```

### Constraints
```
-300 <= x, y <= 300
|x| + |y| > 0
```

---

## 🧠 Phân tích & Hướng tư duy

### 🔍 1. Hiểu đề bài (5 giây)

```
Hỏi: BFS shortest path từ (0,0) → (x,y) trên lưới infinite
Di chuyển: Knight moves (8 hướng)
Mô hình: Unweighted graph → BFS tìm shortest path
```

---

### 🤔 2. Tư duy từng bước

#### Bước 1: BFS đơn giản

> **Hỏi:** "Làm sao tìm đường đi ngắn nhất?"

```
BFS từ (0,0), mỗi level = 1 bước
Khi gặp (x,y) → return level (số bước)
→ Unweighted graph = BFS shortest path!
```

---

#### Bước 2: "Aha moment!" — Optimizations

> **Aha moment:**
> **3 edge cases đặc biệt:**
>
> ```
> (1,0) và (0,1): cần 3 bước (không thể đến trong 1 bước)
> (1,1): cần 2 bước
>
> → Hardcode các edge cases để tránh BFS quá sâu
> ```
>
> **Optimization 2:** Symmetry
> ```
> |x| và |y| → có thể flip signs
> → Đưa về quadrant I (x ≥ 0, y ≥ 0)
> ```

---

### 🔑 3. Key Insight

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   KEY INSIGHT #1:                                   │
│   "Knight = Unweighted Graph → BFS = shortest path"│
│   → BFS level = số bước                             │
│                                                     │
│   KEY INSIGHT #2:                                   │
│   "Symmetry: flip signs → chỉ cần xử lý x≥0, y≥0" │
│   → abs(x), abs(y)                                 │
│                                                     │
│   KEY INSIGHT #3:                                   │
│   "Edge cases đặc biệt cho (1,0), (1,1)"           │
│   → (1,0)/(0,1) = 3 bước, (1,1) = 2 bước          │
│                                                     │
│   KEY INSIGHT #4:                                   │
│   "8 knight moves"                                  │
│   [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]│
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### ⚠️ 4. Common Pitfalls

```javascript
// ❌ Pitfall 1: Không handle edge cases (1,0), (0,1), (1,1)
// BFS sẽ vẫn đúng nhưng chậm và đi vòng
// → Cần hardcode để tối ưu

// ❌ Pitfall 2: Không dùng visited Set → infinite loop (cycle!)
function minKnightMoves(x, y) {
  const queue = [[0, 0, 0]];
  while (queue.length) {
    const [r, c, moves] = queue.shift();
    if (r === x && c === y) return moves;
    // ❌ Không check visited → quay lại ô đã đi
    for (const [dr, dc] of dirs) {
      queue.push([r + dr, c + dc, moves + 1]);
    }
  }
}
// ✅ Always check visited Set trước khi push

// ❌ Pitfall 3: Visited dùng chuỗi sai format
const visited = new Set();
visited.add([r, c]); // ❌ Array không hash được trong Set
// ✅
visited.add(`${r},${c}`);
```

---

### 🔄 5. Các hướng tiếp cận

#### 🔹 Cách 1: BFS với Optimizations (O(max(|x|,|y|)²)) ⭐

```javascript
function minKnightMoves(x, y) {
  // Symmetry: chỉ cần xử lý quadrant I
  x = Math.abs(x);
  y = Math.abs(y);

  // Edge cases đặc biệt
  if (x === 0 && y === 0) return 0;
  if (x === 1 && y === 0) return 3;
  if (x === 0 && y === 1) return 3;
  if (x === 1 && y === 1) return 2;

  const dirs = [
    [2, 1], [2, -1], [-2, 1], [-2, -1],
    [1, 2], [1, -2], [-1, 2], [-1, -2]
  ];

  const visited = new Set(['0,0']);
  const queue = [[0, 0, 0]];

  while (queue.length > 0) {
    const [r, c, moves] = queue.shift();

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;

      if (nr >= -2 && nc >= -2 && !visited.has(key)) {
        if (nr === x && nc === y) return moves + 1;
        visited.add(key);
        queue.push([nr, nc, moves + 1]);
      }
    }
  }
}
```

**📊 Phân tích:**
```
Time:  O(max(|x|,|y|)²) — BFS trên lưới
Space: O(max(|x|,|y|)²)
```

---

### 🚀 6. Visual Walkthrough

```
Tìm minKnightMoves(1, 0)

Symmetry: (1,0) → (1,0)

Edge case: x=1, y=0 → return 3 ✓

---

Tìm minKnightMoves(5, 5)

BFS từ (0,0):
  Level 0: (0,0)
  Level 1: 8 neighbors (2,1),(1,2),(-1,2),(-2,1),(-2,-1),(-1,-2),(1,-2),(2,-1)
  Level 2: ...
  ...
  Level 4: (5,5) found → return 4 ✓
```

---

## ✅ Đáp án cuối cùng

```javascript
/**
 * Minimum Knight Moves - BFS với Edge Cases & Symmetry
 * Time: O(max(|x|,|y|)²) | Space: O(max(|x|,|y|)²)
 */
function minKnightMoves(x, y) {
  x = Math.abs(x);
  y = Math.abs(y);

  if (x === 0 && y === 0) return 0;
  if (x === 1 && y === 0) return 3;
  if (x === 0 && y === 1) return 3;
  if (x === 1 && y === 1) return 2;

  const dirs = [
    [2, 1], [2, -1], [-2, 1], [-2, -1],
    [1, 2], [1, -2], [-1, 2], [-1, -2]
  ];

  const visited = new Set(['0,0']);
  const queue = [[0, 0, 0]];

  while (queue.length > 0) {
    const [r, c, moves] = queue.shift();
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (nr >= -2 && nc >= -2 && !visited.has(key)) {
        if (nr === x && nc === y) return moves + 1;
        visited.add(key);
        queue.push([nr, nc, moves + 1]);
      }
    }
  }
}
```

---

## 🧪 Test Cases

```javascript
console.log(minKnightMoves(2, 1)); // 1

console.log(minKnightMoves(5, 5)); // 4

console.log(minKnightMoves(1, 0)); // 3

console.log(minKnightMoves(1, 1)); // 2

console.log(minKnightMoves(0, 0)); // 0

console.log(minKnightMoves(-2, -1)); // 1 (symmetry)
```

---

## 📝 Ghi chú cá nhân

```
PATTERN: BFS Shortest Path cho Knight

💡 KEY INSIGHT:
   "Unweighted graph = BFS shortest path"
   "Symmetry: abs(x), abs(y)"
   "Edge cases: (1,0)=3, (1,1)=2"
   "8 knight directions"

⚠️ PITFALLS:
   - Dùng Set với string key `"r,c"`
   - Check visited trước khi push
   - Handle edge cases đặc biệt

🔄 VARIATIONS:
   - Chessboard distance formula (mathematical)

✅ Đã hiểu
✅ Tự code lại được
```

---

---

## 🎯 7. Biến thể (Variations)

```javascript
// Variation 1: Shortest Path in Binary Matrix (#1293)
// BFS trong grid với obstacles

// Variation 2: Chess Knight Minimum Moves (#1197)
// Với constraints đặc biệt

// Variation 3: Minimum Moves to Reach Target
// Với knight đặc biệt

// Variation 4: Shortest Path with Obstacles
// BFS với obstacles

// Variation 5: Minimum Steps to Reach End
// BFS với steps nhất định
```

---

## ➡️ Bài tiếp theo

[Bài 10: Reorder Routes to Make All Paths Lead to City Zero](./010-reorder-routes.md)
