# Event Loop — Vòng Lặp Đằng Sau Mọi Thứ

## Câu hỏi mở đầu

```javascript
console.log('script start');

setTimeout(() => {
  console.log('setTimeout');
}, 0);

Promise.resolve()
  .then(() => console.log('promise 1'))
  .then(() => console.log('promise 2'));

console.log('script end');
```

Kết quả in ra thứ tự nào?

```
script start
script end
promise 1
promise 2
setTimeout
```

**Tại sao `setTimeout` chạy SAU Promise, dù cả hai đều có độ trễ 0?**

Vì event loop có **microtask queue** và **macrotask queue** — hai queue có độ ưu tiên khác nhau.

---

## 1. Event Loop — Vòng Lặp 3 Bước

### Mô hình tổng quát

```
┌─────────────────────────────────────────────────────┐
│                    Call Stack                        │
│   (Execution contexts — code đang chạy)            │
└─────────────────────────────────────────────────────┘
                          │
                          │ Stack rỗng?
                          ▼
┌─────────────────────────────────────────────────────┐
│                   Event Loop                         │
│   ┌─────────────────────────────────────────────┐  │
│   │  1. Microtask Queue (Priority: HIGH)        │  │
│   │     • Promise.then/catch/finally            │  │
│   │     • queueMicrotask()                     │  │
│   │     • MutationObserver                      │  │
│   │     → Xử lý HẾT microtasks TRƯỚC         │  │
│   └─────────────────────────────────────────────┘  │
│   ┌─────────────────────────────────────────────┐  │
│   │  2. Macrotask Queue (Priority: LOW)        │  │
│   │     • setTimeout                            │  │
│   │     • setInterval                          │  │
│   │     • I/O operations                       │  │
│   │     • UI rendering (browser)                │  │
│   │     → Xử lý 1 macrotask MỖI lần lặp     │  │
│   └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Vòng lặp (mỗi tick)

```
1. Đang có callback trong microtask queue?
   → YES: lấy và execute HẾT microtasks (kể cả thêm mới trong quá trình)
   → NO: qua bước 2

2. Đang có callback trong macrotask queue?
   → YES: lấy 1 macrotask, execute
   → NO: đợi

3. Render (nếu browser)

4. Lặp lại
```

---

## 2. Minh Họa Chi Tiết

### Đoạn code ban đầu

```javascript
console.log('1');          // sync → stack

setTimeout(() => console.log('2'), 0); // → macrotask queue

Promise.resolve()
  .then(() => console.log('3')); // → microtask queue

console.log('4');          // sync → stack
```

### Execution step-by-step

```
1. Call Stack: console.log('1') → execute → pop
2. Call Stack: setTimeout() → đẩy callback vào macrotask queue
3. Call Stack: Promise.resolve().then() → đẩy callback vào microtask queue
4. Call Stack: console.log('4') → execute → pop
5. Stack rỗng → kiểm tra microtask queue
6. Microtask queue: console.log('3') → execute → pop
7. Microtask queue rỗng → kiểm tra macrotask queue
8. Macrotask queue: console.log('2') → execute

Output: 1, 4, 3, 2
```

---

## 3. Microtask — Ưu Tiên Cao Hơn

### Promise callbacks

```javascript
console.log('script start');

setTimeout(() => console.log('setTimeout'), 0);

Promise.resolve('from promise')
  .then(val => console.log(val));

queueMicrotask(() => console.log('queueMicrotask'));

console.log('script end');
```

```
Output:
script start
script end
from promise     ← microtask: promise.then()
queueMicrotask    ← microtask: queueMicrotask()
setTimeout       ← macrotask: setTimeout()
```

### Microtasks có thể thêm microtasks

```javascript
Promise.resolve()
  .then(() => {
    console.log('microtask 1');
    Promise.resolve().then(() => {
      console.log('microtask nested');
    });
  })
  .then(() => {
    console.log('microtask 2');
  });

// Output:
// microtask 1
// microtask nested
// microtask 2
```

**Microtask queue được xử lý HẾT trước khi quay lại macrotask.**

---

## 4. Macrotask — Ưu Tiên Thấp Hơn

### Một macrotask mỗi lần lặp

```javascript
setTimeout(() => console.log('1'), 0);
setTimeout(() => console.log('2'), 0);
setTimeout(() => console.log('3'), 0);

// Output: 1, 2, 3 — mỗi setTimeout = 1 macrotask
```

### Render trước macrotask kế tiếp

```javascript
// Browser: render xảy ra sau microtasks, trước macrotask tiếp theo
// Nếu muốn animation mượt → dùng requestAnimationFrame
```

---

## 5. requestAnimationFrame vs setTimeout

### requestAnimationFrame (rAF)

```javascript
// rAF được xử lý sau microtasks, trước macrotask tiếp theo
// VÀ trước render
function animate() {
  // Update DOM
  element.style.transform = `translateX(${x}px)`;
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// Thứ tự:
// 1. Microtasks (hết)
// 2. rAF callbacks
// 3. Render
// 4. Macrotask (setTimeout...)
```

### So sánh với setTimeout

| | `setTimeout(fn, 0)` | `requestAnimationFrame(fn)` |
|--|---------------------|--------------------------|
| Độ trễ | ~4ms minimum | 16.67ms (60fps) |
| Chạy khi nào | Mỗi tick event loop | Trước render |
| Phù hợp cho | Task scheduling | Animation |

---

## 6. Node.js Event Loop

### Các phase

```
┌───────────────────────┐
│   timers               │ ← setTimeout, setInterval
├───────────────────────┤
│   pending callbacks    │ ← I/O callbacks bị delayed
├───────────────────────┤
│   idle, prepare       │ ← nội bộ
├───────────────────────┤
│   poll                │ ← I/O operations, đọc file, network
├───────────────────────┤
│   check              │ ← setImmediate callbacks
├───────────────────────┤
│   close callbacks     │ ← socket.on('close', ...)
└───────────────────────┘
```

### Microtasks trong Node.js

```javascript
// Node.js cũng có microtask queue
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));

// Output: nextTick trước promise
// process.nextTick có độ ưu tiên CAO HƠN microtask
```

---

## 7. Các Traps

### Trap 1: Microtask nhiều → block render

```javascript
// Nếu microtask queue chạy quá lâu → UI bị block
async function processAll() {
  while (queue.length > 0) {
    await processOne(); // mỗi processOne() tạo microtask
  }
}
```

### Trap 2: setTimeout(fn, 0) không phải 0ms

```javascript
// Minimum delay thực tế:
// Chrome: ~1ms
// Node.js: ~1ms
// Nhưng có thể lớn hơn nếu system busy
```

### Trap 3: Event loop trong Node.js khác browser

```javascript
// File đọc xong → callback vào poll phase
// setImmediate() → check phase (sau poll)

// Thứ tự: timers → poll → check
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));

// Thường: timeout trước immediate
// Nhưng nếu trong I/O context: immediate trước timeout
```

---

## 8. Câu Hỏi Phỏng Vấn

### Câu 1: Thứ tự hoàn toàn

```javascript
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

queueMicrotask(() => console.log('4'));

console.log('5');
```

**Trả lời:** `1, 5, 3, 4, 2`

---

### Câu 2: Nested promises

```javascript
Promise.resolve()
  .then(() => {
    console.log('1');
    Promise.resolve().then(() => console.log('2'));
  })
  .then(() => console.log('3'));
```

**Trả lời:** `1, 2, 3`

---

### Câu 3: setTimeout trong promise

```javascript
Promise.resolve()
  .then(() => {
    console.log('a');
    setTimeout(() => console.log('b'), 0);
  })
  .then(() => console.log('c'));

setTimeout(() => console.log('d'), 0);
```

**Trả lời:** `a, d, c, b`

---

### Câu 4: Event loop trong Node

```javascript
console.log('1');
process.nextTick(() => console.log('2'));
Promise.resolve().then(() => console.log('3'));
setTimeout(() => console.log('4'), 0);
```

**Trả lời:** `1, 2, 3, 4` — `process.nextTick` chạy TRƯỚC microtasks

---

### Câu 5: Render timing

```javascript
// Browser
console.log('1');
requestAnimationFrame(() => console.log('rAF'));
Promise.resolve().then(() => console.log('microtask'));
setTimeout(() => console.log('macrotask'), 0);
console.log('2');
```

**Trả lời:** `1, 2, microtask, rAF, macrotask`

---

## 9. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  EVENT LOOP — mỗi tick                                      │
│                                                         │
│  1. Xử lý HẾT microtasks (queueMicrotask, Promise)     │
│  2. Xử lý 1 macrotask (setTimeout, setInterval, I/O)  │
│  3. Render (browser)                                     │
│  4. Lặp                                                 │
│                                                         │
│  Microtask > Macrotask > Render                         │
│  process.nextTick > Promise > setTimeout                  │
│                                                         │
│  ⚠️ Microtask chạy HẾT trước macrotask nào          │
│  ⚠️ rAF xảy ra sau microtasks, trước render       │
└─────────────────────────────────────────────────────────┘
```

---

## 10. Mối Liên Hệ

```
Event Loop
  ├── Call Stack (001) ← event loop đẩy task vào stack
  ├── Microtask/Macrotask (003) ← execution order
  ├── Promise (004) ← tạo microtasks
  └── Async/Await (005) ← syntax sugar cho promises
```

---

## Checklist

- [ ] Vẽ được event loop từ đầu
- [ ] Phân biệt được microtask vs macrotask
- [ ] Dự đoán được thứ tự execution của đoạn code
- [ ] Hiểu rAF khác setTimeout ở đâu

---

*Last updated: 2026-03-31*
