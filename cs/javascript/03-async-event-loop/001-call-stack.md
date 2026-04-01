# Call Stack — JavaScript Thực Thi Code Như Thế Nào

## Câu hỏi mở đầu

```javascript
function multiply(a, b) {
  return a * b;
}

function square(n) {
  return multiply(n, n);
}

function printSquare(n) {
  const result = square(n);
  console.log(result);
}

printSquare(5);
```

Khi `console.log(result)` chạy, **thứ tự stack** như thế nào?

```
printSquare(5)  ← đang chạy
  └─ square(5)
       └─ multiply(5, 5)  ← đang chạy ở đỉnh
```

**Call stack = stack của execution contexts.** JavaScript là single-threaded — chỉ có MỘT stack.

---

## 1. Call Stack Là Gì?

### Định nghĩa

> **Call Stack** = stack (LIFO) chứa execution contexts của các function đang được gọi. Code chạy trong context ở đỉnh (top) của stack.

### LIFO — Last In, First Out

```javascript
function first() { console.log('first'); }
function second() { first(); console.log('second'); }
function third() { second(); console.log('third'); }

third();

// Stack:
// third() → second() → first() → pop first() → pop second() → pop third()
```

---

## 2. Execution Context — Mỗi Function Call Tạo Một EC

### Global Execution Context

```
Khi script bắt đầu:
┌─────────────────────────┐
│  Global EC              │
│  - this = globalThis  │
│  - Variable Environment │
│  - Lexical Environment  │
└─────────────────────────┘
```

### Function Execution Context

```javascript
function greet(name) {
  const greeting = `Hello, ${name}`;
  return greeting;
}

greet('Alice');
```

```
1. Global EC tạo
2. greet('Alice') được gọi
   ┌─────────────────────────┐
   │  greet() EC            │ ← TOP
   │  - this = globalThis   │
   │  - name = 'Alice'     │
   │  - greeting = '...'    │
   └─────────────────────────┘
   ┌─────────────────────────┐
   │  Global EC              │
   └─────────────────────────┘

3. greet() return → pop greet EC
4. Chỉ còn Global EC
```

---

## 3. Stack Overflow

### Recursion không có base case

```javascript
function recursive() {
  return recursive();
}

recursive();
// RangeError: Maximum call stack size exceeded
```

```
recursive() → recursive() → recursive() → ... → Stack Overflow!
```

### Số lượng stack frames có giới hạn

```javascript
// Chrome: ~10460 frames
// Firefox: ~26633 frames
// Node.js: ~11178 frames
```

---

## 4. Stack Trong Thực Tế

### Synchronous execution

```javascript
function a() { return 'a'; }
function b() { return a() + 'b'; }
function c() { return b() + 'c'; }

console.log(c()); // 'abc'
```

```
Stack khi console.log chạy:
c() ← top
  └─ b()
       └─ a()
```

### Với async (setTimeout)

```javascript
console.log('1');

setTimeout(() => {
  console.log('3');
}, 0);

console.log('2');
```

```
Step 1: console.log('1') → pop
Step 2: setTimeout() → callback đẩy vào Web APIs (không phải stack)
Step 3: console.log('2') → pop
Step 4: Stack rỗng → event loop đẩy callback vào stack
Step 5: console.log('3')
```

---

## 5. Các Traps

### Trap 1: Deep recursion

```javascript
// ❌ Stack overflow
function fibonacci(n) {
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// ✅ Tail recursion (không hỗ trợ rộng rãi)
// hoặc dùng iteration
function fibonacciIterative(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}
```

### Trap 2: Async code không block stack

```javascript
function syncTask() {
  console.log('start');
  // blocking
  const start = Date.now();
  while (Date.now() - start < 1000) {} // 1 second blocking!
  console.log('end');
}
```

---

## 6. Câu Hỏi Phỏng Vấn

### Câu 1: Stack trace

```javascript
function a() { b(); }
function b() { c(); }
function c() { console.log('here'); }

a();
```

**Trả lời:** Khi console.log chạy, stack từ dưới lên: `Global → a() → b() → c()`

---

### Câu 2: Stack overflow

```javascript
function recurse(x) {
  if (x === 0) return;
  return recurse(x - 1);
}

recurse(100000); // ?
```

**Trả lời:** Tùy engine — Chrome ~10k frames. Nếu quá giới hạn → RangeError

---

### Câu 3: Exception và stack trace

```javascript
function a() { b(); }
function b() { throw new Error('oops'); }

try {
  a();
} catch (e) {
  console.log(e.stack);
}
```

**Trả lời:** Stack trace hiển thị: `Error: oops at b() at a()`

---

## 7. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  CALL STACK = LIFO stack của Execution Contexts          │
│                                                         │
│  • Single thread — chỉ có 1 call stack               │
│  • Mỗi function call tạo 1 EC, đẩy lên stack     │
│  • Function return → pop EC khỏi stack               │
│  • Stack overflow: recursion quá sâu                  │
│  • Async: callback không ở trong call stack          │
└─────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Vẽ được call stack của một đoạn code
- [ ] Hiểu stack overflow và khi nào xảy ra
- [ ] Phân biệt được call stack vs task queue

---

*Last updated: 2026-03-31*
