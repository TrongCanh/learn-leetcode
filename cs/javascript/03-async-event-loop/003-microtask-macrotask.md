# Microtask vs Macrotask — Ai Chạy Trước, Ai Chạy Sau

## Câu hỏi mở đầu

```javascript
console.log('sync 1');

setTimeout(() => console.log('setTimeout'), 0);

Promise.resolve().then(() => console.log('Promise'));

queueMicrotask(() => console.log('queueMicrotask'));

console.log('sync 2');
```

Thứ tự in ra là gì?

**`sync 1`, `sync 2`, `Promise`, `queueMicrotask`, `setTimeout`**

Mọi thứ **synchronous** chạy trước. Sau đó **microtasks** (Promise, queueMicrotask). Cuối cùng **macrotasks** (setTimeout).

---

## 1. Microtask — High Priority Queue

### Những gì nằm trong microtask queue

```javascript
// 1. Promise callbacks (.then, .catch, .finally)
Promise.resolve().then(fn);

// 2. queueMicrotask
queueMicrotask(fn);

// 3. MutationObserver (browser)
new MutationObserver(fn);

// 4. process.nextTick (Node.js) — cao hơn cả Promise!
process.nextTick(fn);
```

### Đặc điểm

```
• Xử lý HẾT trước khi làm gì khác
• Microtasks tạo trong quá trình xử lý → CŨNG được xử lý
• Cho đến khi queue rỗng hoàn toàn
```

---

## 2. Macrotask — Low Priority Queue

### Những gì nằm trong macrotask queue

```javascript
// 1. setTimeout / setInterval
setTimeout(fn, 0);
setInterval(fn, 100);

// 2. setImmediate (Node.js)
setImmediate(fn);

// 3. I/O operations (Node.js)
fs.readFile('file.txt', callback);

// 4. UI rendering (browser)
requestAnimationFrame(fn);

// 5. requestIdleCallback (browser)
requestIdleCallback(fn);
```

### Đặc điểm

```
• Chỉ xử lý 1 macrotask MỖI lần lặp event loop
• Sau mỗi macrotask → kiểm tra microtask queue
• Nếu microtasks mới → xử lý hết trước macrotask tiếp theo
```

---

## 3. So Sánh Trực Tiếp

| | Microtask | Macrotask |
|--|-----------|-----------|
| Priority | Cao nhất | Thấp |
| Xử lý | Hết tất cả | 1 mỗi lần lặp |
| Ví dụ | Promise, queueMicrotask, MutationObserver | setTimeout, setInterval, I/O |
| Tạo trong lúc xử lý | Được xử lý ngay | Chờ tick tiếp theo |
| Blocking UI | Có thể | Có thể |

---

## 4. Minh Họa Chi Tiết

### Ví dụ 1: Promise tạo Promise

```javascript
Promise.resolve()
  .then(() => {
    console.log('task 1');
    Promise.resolve().then(() => console.log('task 2'));
  })
  .then(() => console.log('task 3'));
```

```
1. Microtask queue: [task1]
2. Execute task1 → console.log('task 1')
3. Promise.resolve().then() → thêm task2 vào microtask queue
4. Microtask queue: [task2, task3]
5. Execute task2 → console.log('task 2')
6. Microtask queue: [task3]
7. Execute task3 → console.log('task 3')

Output: task 1, task 2, task 3
```

### Ví dụ 2: Microtask thêm macrotask

```javascript
Promise.resolve()
  .then(() => {
    console.log('microtask');
    setTimeout(() => console.log('macrotask'), 0);
  })
  .then(() => console.log('microtask 2'));

setTimeout(() => console.log('macrotask 2'), 0);
```

```
Output:
microtask
microtask 2
macrotask
macrotask 2
```

---

## 5. Thứ Tự Execution — Tổng Hợp

```javascript
// 1. Synchronous (call stack)
console.log('sync');

// 2. process.nextTick (Node.js) — ƯU TIÊN CAO NHẤT
process.nextTick(() => console.log('nextTick'));

// 3. Microtasks (Promise, queueMicrotask)
Promise.resolve().then(() => console.log('promise'));
queueMicrotask(() => console.log('queueMicrotask'));

// 4. requestAnimationFrame (Browser) — trước render
requestAnimationFrame(() => console.log('rAF'));

// 5. Macrotasks (setTimeout, setInterval, I/O)
setTimeout(() => console.log('setTimeout'), 0);
setImmediate(() => console.log('setImmediate')); // Node.js

// 6. Render (Browser)
```

---

## 6. Các Traps

### Trap 1: Microtask chạy quá lâu → UI block

```javascript
// ❌ BAD: infinite microtasks
let count = 0;
function recurse() {
  Promise.resolve().then(recurse);
  count++;
}

recurse(); // event loop bận microtasks → không bao giờ render
```

```javascript
// ✅ GOOD: dùng macrotask để yield
async function processQueue(items) {
  for (const item of items) {
    await processItem(item);
    // Sau mỗi item → event loop có cơ hội xử lý khác
  }
}
```

### Trap 2: Async iteration

```javascript
// ❌ Mỗi iteration tạo microtask
async function processAllBad(items) {
  for (const item of items) {
    await process(item); // tạo microtask
  }
}

// ✅ Batch processing — ít microtasks hơn
async function processAllBatch(items) {
  const batch = [];
  for (const item of items) {
    batch.push(process(item));
  }
  await Promise.all(batch);
}
```

### Trap 3: Dùng await trong vòng lặp

```javascript
// ❌
for (const url of urls) {
  await fetch(url); // chờ từng request
}

// ✅
await Promise.all(urls.map(url => fetch(url))); // parallel
```

---

## 7. Câu Hỏi Phỏng Vấn

### Câu 1: Đoán thứ tự

```javascript
console.log('A');

setTimeout(() => console.log('B'), 0);

Promise.resolve().then(() => console.log('C'));

queueMicrotask(() => console.log('D'));

console.log('E');
```

**Trả lời:** `A, E, C, D, B`

---

### Câu 2: Promise nesting

```javascript
Promise.resolve()
  .then(() => {
    console.log('1');
    Promise.resolve().then(() => {
      console.log('2');
      Promise.resolve().then(() => console.log('3'));
    });
  })
  .then(() => console.log('4'));
```

**Trả lời:** `1, 2, 3, 4`

---

### Câu 3: Mix micro và macro

```javascript
Promise.resolve().then(() => {
  console.log('1');
  setTimeout(() => console.log('2'), 0);
});

setTimeout(() => console.log('3'), 0);

Promise.resolve().then(() => console.log('4'));
```

**Trả lời:** `1, 4, 3, 2`

---

### Câu 4: nextTick vs Promise

```javascript
// Node.js
process.nextTick(() => console.log('nextTick'));
Promise.resolve().then(() => console.log('promise'));
```

**Trả lời:** `nextTick, promise`

---

### Câu 5: Infinite microtask

```javascript
function infinite() {
  Promise.resolve().then(infinite);
}
infinite();

console.log('this runs');
```

**Trả lời:** `'this runs'` — synchronous chạy trước, rồi event loop bận infinite microtasks → không bao giờ đến macrotasks.

---

### Câu 6: Thứ tự với setImmediate

```javascript
// Node.js
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
```

**Trả lời:** Không xác định — thường `timeout` trước, nhưng nếu trong I/O context → `immediate` trước.

---

## 8. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  MICROTASK vs MACROTASK                                   │
│                                                         │
│  Microtask (HẾT mỗi tick):                             │
│    Promise.then/catch/finally                          │
│    queueMicrotask()                                      │
│    MutationObserver                                     │
│    process.nextTick (Node.js — cao nhất)               │
│                                                         │
│  Macrotask (1 mỗi tick):                               │
│    setTimeout, setInterval                             │
│    setImmediate (Node.js)                              │
│    I/O operations                                      │
│    requestAnimationFrame                                │
│                                                         │
│  RULES:                                                 │
│    1. Sync chạy trước                                │
│    2. Microtasks chạy HẾT trước macrotasks          │
│    3. Macrotasks chạy 1 mỗi tick                     │
│    4. Microtasks thêm trong quá trình → được xử lý  │
│    5. Macrotasks thêm trong quá trình → chờ tick mới│
│                                                         │
│  ⚠️ Infinite microtasks → block event loop            │
└─────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Nhớ được 5 loại microtask và macrotask
- [ ] Dự đoán được thứ tự execution của code phức tạp
- [ ] Hiểu tại sao infinite microtasks block event loop
- [ ] Trả lời được các câu hỏi phỏng vấn

---

*Last updated: 2026-03-31*
