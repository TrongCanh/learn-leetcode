# Browser Engine — Cách Trình Duyệt Chạy JavaScript

## Câu hỏi mở đầu

```javascript
// Tại sao cùng một đoạn code này:
// Chrome chạy mất 12ms
// Firefox chạy mất 18ms
// Safari chạy mất 25ms

const result = Array.from({ length: 1_000_000 }, (_, i) => i * 2)
  .filter(n => n % 3 === 0)
  .map(n => n + 1)
  .reduce((a, b) => a + b, 0);

// Tại sao performance KHÁC NHAU giữa các trình duyệt?
```

Câu trả lời nằm ở **Browser Engine** — mỗi trình duyệt có JavaScript engine và rendering engine riêng, với chiến lược tối ưu hoá khác nhau. Hiểu engine không phải để trở thành compiler engineer, mà để **biết tại sao code chạy nhanh hay chậm** và **debug được các vấn đề performance kỳ lạ**.

---

## 1. Hai Engine Trong Một Trình Duyệt

### Sự phân chia trách nhiệm

```
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER                                                          │
│                                                                   │
│  ┌───────────────────────┐    ┌───────────────────────────┐     │
│  │  JavaScript Engine    │    │   Rendering Engine         │     │
│  │                       │    │                            │     │
│  │  • Chạy JavaScript    │    │  • Parse HTML/CSS          │     │
│  │  • Quản lý Call Stack │    │  • Build Render Tree       │     │
│  │  • Garbage Collection  │    │  • Layout / Reflow        │     │
│  │  • Optimize bytecode   │    │  • Paint / Composite       │     │
│  │                       │    │                            │     │
│  │  V8, SpiderMonkey,    │    │  Blink, Gecko, WebKit      │     │
│  │  JavaScriptCore        │    │                            │     │
│  └───────────────────────┘    └────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

**Quan trọng:** JavaScript engine và rendering engine **chạy song song nhưng phối hợp chặt chẽ**. Khi JS thay đổi DOM, rendering engine phải recalculate layout. Khi rendering engine gặp `<script>`, nó phải chờ JS engine chạy xong. Hiểu được sự phối hợp này giúp bạn viết code không block rendering.

---

## 2. JavaScript Engine — Các Engine Phổ Biến

### Bảng tổng quan

```
┌────────────────────┬──────────────────┬──────────────────────────────┐
│ Engine             │ Trình duyệt      │ Đặc điểm nổi bật            │
├────────────────────┼──────────────────┼──────────────────────────────┤
│ V8                 │ Chrome, Edge,    │ TurboFan JIT, Ignition      │
│                    │ Node.js, Deno    │ Bytecode interpreter         │
│ SpiderMonkey       │ Firefox          │ Baseline + IonMonkey JIT      │
│ JavaScriptCore     │ Safari           │ FTL JIT (Fast-Times Lang)   │
│ Hermes             │ React Native     │ Optimized for mobile         │
└────────────────────┴──────────────────┴──────────────────────────────┘
```

### JavaScript Engine là gì?

JavaScript Engine là một chương trình **biên dịch và thực thi JavaScript**. Nó nhận source code → parse thành AST → biên dịch thành machine code → thực thi.

**Không có JS engine thì JavaScript chỉ là text.** Engine là "máy ảo" hiểu ngôn ngữ JavaScript.

---

## 3. V8 Engine — Chi Tiết

V8 là engine phổ biến nhất, dùng trong Chrome, Edge, Node.js, Deno. Được Google phát triển từ 2008 và liên tục được tối ưu.

### Pipeline thực thi

```
┌──────────────────────────────────────────────────────────────────┐
│  SOURCE CODE: console.log('hello')                              │
│                                                                  │
│  PARSER ────────────► AST (Abstract Syntax Tree)                │
│  │                       {                                      │
│  │                         "type": "CallExpression",            │
│  │                         "callee": { "name": "console.log" }  │
│  │                       }                                       │
│  │                                                                  │
│  IGNITION ──────────► BYTECODE + Feedback Vector                  │
│  │                       [0x01, 0x23, 0x45...]                     │
│  │                       ← Interpreter, chạy ngay lập tức        │
│  │                       ← Thu thập "feedback": type nào?         │
│  │                                                                  │
│  TURBOFAN ──────────► OPTIMIZED MACHINE CODE                    │
│  (when "hot")           ← Speculative optimization                │
│                          ← Deoptimize nếu assumption sai         │
│                                                                  │
│  ORINOCO ────────────► GARBAGE COLLECTION                        │
│  (GC, chạy song song)   ← Scavenger (nhẹ, chạy thường xuyên)    │
│                          ← Full GC (nặng, chạy ít)               │
└──────────────────────────────────────────────────────────────────┘
```

### Ignition — Bytecode Interpreter

```javascript
// V8 KHÔNG chạy machine code ngay lập tức
// Đầu tiên, Ignition biên dịch thành bytecode và chạy bytecode đó
// bytecode nhẹ hơn AST nhưng vẫn chậm hơn optimized machine code

function add(a, b) {
  return a + b;
}

add(1, 2);        // Ignition: "chưa biết type, chạy bytecode"
add(3, 4);        // Ignition: vẫn bytecode
add(5, 6);        // Ignition: vẫn bytecode
// ... nhiều lần gọi → function trở nên "hot"
```

### TurboFan — Optimizing Compiler

```javascript
// Khi một function được gọi NHIỀU LẦN (trở nên "hot"):
// TurboFan nhảy vào, phân tích và biên dịch lại thành optimized machine code

// Turbofan đưa ra GIẢ THUYẾT (speculation):
// "Có vẻ add() luôn nhận 2 số"
// → Tối ưu machine code cho phép cộng số

add(1, 2);        // bytecode
add(3, 4);        // bytecode
add(5, 6);        // bytecode
// ... 10000 lần → TurboFan: "Được rồi, optimize nào!"

// Nhưng nếu gọi:
add('hello', 'world'); // ← Giả thuyết SAI!
// → TurboFan: "Đợi đã, đây là string, không phải số!"
// → DEOPTIMIZE: quay về bytecode
// → Performance drop tạm thời
```

### Điều gì làm TurboFan deoptimize?

```javascript
// ❌ Type polymorphism — function nhận nhiều kiểu khác nhau
function calc(x) {
  return x + 1;
}

calc(5);      // number
calc('a');   // string — DEOPTIMIZE!
calc(true);  // boolean — DEOPTIMIZE tiếp!

// ✅ Monomorphic — luôn cùng kiểu → TurboFan V8 cực nhanh
function calc(x) {
  return x + 1;
}

calc(5);
calc(10);
calc(1000); // Tất cả number → TỐI ƯU TỐI ĐA
```

### Deoptimization — Khi nào xảy ra?

```javascript
// 1. Type feedback bị sai
function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

sum([1, 2, 3]);     // Array of numbers
sum(['a', 'b']);   // Array of strings → DEOPTIMIZE!

// 2. arguments object bị thay đổi
function demo() {
  arguments[0] = 999; // ghi đè → DEOPTIMIZE
  return arguments[0];
}

// 3. eval() — TurboFan không thể optimize
function slow() {
  eval('console.log("hi")'); // toàn bộ function không optimize được
}

// 4. with statement
function slow2() {
  with ({ x: 1 }) { // TurboFan né
    console.log(x);
  }
}
```

---

## 4. Rendering Engine — Cách Trình Duyệt Vẽ Trang

### Các rendering engines

```
┌────────────────────┬──────────────────┬──────────────────────────┐
│ Rendering Engine  │ Trình duyệt      │ Viết bằng               │
├────────────────────┼──────────────────┼──────────────────────────┤
│ Blink              │ Chrome, Edge,    │ C++ (fork từ WebKit)    │
│                    │ Opera, Samsung   │                          │
│ Gecko              │ Firefox          │ C++                     │
│ WebKit             │ Safari, iOS      │ C++                     │
│ Trident            │ IE (legacy)      │ C++                     │
└────────────────────┴──────────────────┴──────────────────────────┘
```

**Lưu ý quan trọng:** Rendering Engine **không hiểu JavaScript**. Nó chỉ hiểu DOM tree (do JavaScript engine tạo ra thông qua DOM API). Khi JavaScript gọi `document.createElement()`, DOM API binding chuyển lời gọi thành node trong render tree.

---

## 5. Critical Rendering Path — Từ Code Đến Pixel

### 6 bước trình duyệt vẽ trang

```
1. DOM CONSTRUCTION     HTML → tokens → nodes → DOM Tree
                          ↓
2. CSSOM CONSTRUCTION    CSS → tokens → rules → CSSOM Tree
                          ↓
3. RENDER TREE           DOM + CSSOM → Render Tree
                          (chỉ visible nodes)
                          ↓
4. LAYOUT                Calculate position + size
                          (reflow — có thể triggered lại)
                          ↓
5. PAINT                 Draw pixels vào layers
                          ↓
6. COMPOSITE             Combine layers, send to GPU
```

### Mỗi bước có thể bị block

```javascript
// ❌ <script> không async/defer → BLOCKS DOM CONSTRUCTION
<html>
  <body>
    <div>Content</div>
    <script>
      // Trình duyệt DỪNG parse HTML tại đây
      // Phải chờ JS chạy xong mới tiếp tục
      document.querySelector('div').textContent = 'Changed!';
    </script>
    <p>This paragraph won't appear until script runs</p>
  </body>
</html>

// ✅ defer — chạy sau khi DOM parsed xong, theo thứ tự xuất hiện
<script defer src="app.js"></script>

// ✅ async — chạy ngay khi download xong, không block
<script async src="analytics.js"></script>

// ✅ type="module" — luôn deferred
<script type="module" src="app.js"></script>
```

### DOM + CSSOM = Render Tree

```javascript
// Trình duyệt đọc HTML và CSS, xây dựng 2 tree riêng:
// DOM Tree ← HTML
// CSSOM Tree ← CSS
// → Merge thành Render Tree

// Render Tree CHỈ chứa visible nodes:
// display: none → KHÔNG có trong render tree
// <head> → KHÔNG có trong render tree

const el = document.createElement('div');
el.style.display = 'none';
el.textContent = 'You will not see this in render tree';
// display:none không layout, không paint
```

### Layout (Reflow) — Bước Tốn Kém Nhất

```javascript
// ❌ Trigger layout nhiều lần = Performance disaster
element.style.width = element.offsetWidth + 10 + 'px'; // read
element.style.height = element.offsetHeight + 10 + 'px'; // read → reflow
element.style.margin = '10px'; // write → reflow AGAIN!

// ✅ Đọc tất cả → Ghi tất cả
const width = element.offsetWidth;  // read
const height = element.offsetHeight; // read (cached, no extra reflow)

requestAnimationFrame(() => {  // write batched
  element.style.width = width + 10 + 'px';
  element.style.height = height + 10 + 'px';
});
```

---

## 6. JavaScript ↔ Rendering Engine Coordination

### Event loop quyết định khi nào rendering xảy ra

```
┌─────────────────────────────────────────────────────┐
│  EVENT LOOP (mỗi vòng lặp)                          │
│                                                      │
│  1. Execute task (JS code từ call stack)           │
│     │                                                │
│     │ ← setTimeout(fn, 0) → thêm vào next task queue│
│     │                                                │
│  2. Microtasks (Promise callbacks)                  │
│     │ ← .then() → microtask queue                   │
│     │                                                │
│  3. RENDER (chỉ nếu cần)                           │
│     │ ← requestAnimationFrame callbacks              │
│     │ ← Recalculate styles, layout, paint            │
│     │ ← Composite layers                             │
│     │                                                │
│  4. Next task                                       │
└─────────────────────────────────────────────────────┘
```

```javascript
// RENDER xảy ra SAU task và SAU microtasks
console.log('1');

requestAnimationFrame(() => console.log('RAF')); // render phase

Promise.resolve().then(() => console.log('microtask')); // chạy TRƯỚC render

setTimeout(() => console.log('macrotask'), 0);

console.log('2');

// Output: 1, 2, microtask, RAF, macrotask
// Render xảy ra sau "2", trước macrotask
```

### requestAnimationFrame vs requestIdleCallback

```javascript
// requestAnimationFrame — trước mỗi frame (~60fps = 16.67ms)
// Dùng cho: animation, smooth updates

function animate() {
  element.style.transform = `translateX(${x}px)`;
  x += velocity;
  requestAnimationFrame(animate); // tiếp tục next frame
}

requestAnimationFrame(animate);

// requestIdleCallback — khi browser rảnh rỗi
// Dùng cho: non-critical work, analytics, prefetching

requestIdleCallback(() => {
  console.log('Browser is idle, do heavy work here');
}, { timeout: 2000 }); // max wait 2s
```

---

## 7. GPU Acceleration — Tại Sao Animation Mượt?

### Composite layers

```javascript
// Trình duyệt tạo LAYERS riêng cho các element:
// transform và opacity CHỈ cần composite (không repaint)
// → GPU xử lý, rất nhanh và mượt

// ❌ Layout-triggering properties — CHẬM
element.style.left = x + 'px';     // → reflow
element.style.top = y + 'px';      // → reflow
element.style.width = w + 'px';    // → reflow

// ✅ Compositor-only properties — NHANH
element.style.transform = `translateX(${x}px)`; // → composite only
element.style.transform = `translateY(${y}px)`; // → composite only
element.style.opacity = '0.5';                  // → composite only
```

### will-change — Gợi ý trình duyệt tạo layer riêng

```javascript
// ⚠️ Dùng có chừng mực — mỗi layer tốn VRAM
.will-change {
  will-change: transform;  // → tạo layer riêng, smooth animation
}

// ❌ OVERUSE — tạo quá nhiều layers = out of memory
.will-change {
  will-change: transform, opacity, left, top; // quá nhiều!
}
```

---

## 8. Các Traps Phổ Biến

### Trap 1: Đổ blame giữa JS engine và rendering engine

```javascript
// ❌ Không phải lúc nào "chậm" cũng do JavaScript
// Có thể do:
// - CSS selector phức tạp → CSSOM chậm
// - Layout trì trệ (reflow liên tục)
// - Paint quá nhiều area
// - Composite layer không được GPU accelerated

// ✅ Debug đúng cách:
// 1. Performance tab trong DevTools
// 2. Look vào: Main thread (JS + Rendering)
// 3. Xem Flame chart — cái gì chiếm nhiều ms nhất?
```

### Trap 2: eval() phá hủy toàn bộ function optimization

```javascript
// ❌ eval() trong function → TurboFan không bao giờ optimize
function process(data) {
  const script = generateScript(data);
  eval(script); // toàn bộ function chạy bytecode chậm
}

// ✅ Nếu bắt buộc dùng eval:
function outer() {
  const safeCode = 'return 1 + 1'; // ít nhất chỉ affect inner scope
  return new Function(safeCode)(); // Function() ít destructive hơn eval
}
```

### Trap 3: innerHTML parse HTML + execute JS = rất chậm

```javascript
// ❌ innerHTML parse toàn bộ string thành DOM
// Nếu HTML lớn, đây là bottleneck
const container = document.getElementById('list');
for (let i = 0; i < 1000; i++) {
  container.innerHTML += `<div>Item ${i}</div>`;
  // ⚠️ Mỗi lần gán: parse HTML → rebuild DOM → reflow
  // → 1000 lần reflow!
}

// ✅ batch DOM insertions
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
  const div = document.createElement('div');
  div.textContent = `Item ${i}`;
  fragment.appendChild(div);
}
container.appendChild(fragment); // → 1 reflow duy nhất
```

### Trap 4: Layout thrashing

```javascript
// ❌ Layout thrashing: đọc layout → ghi DOM → lặp lại
function resizeAll(items) {
  items.forEach(item => {
    const height = item.offsetHeight;  // READ → trigger reflow
    item.style.height = height + 10 + 'px'; // WRITE → trigger reflow AGAIN
  });
}

// ✅ Tránh layout thrashing
function resizeAll(items) {
  // Đọc TẤT CẢ trước
  const heights = items.map(item => item.offsetHeight);
  // Ghi TẤT CẢ sau
  items.forEach((item, i) => {
    item.style.height = heights[i] + 10 + 'px';
  });
}
```

### Trap 5: V8 hidden class (internal structure)

```javascript
// V8 dùng "hidden class" để track object shape
// Thay đổi shape = hidden class thay đổi = deoptimize

// ❌ Thay đổi shape liên tục
const obj = {};
obj.a = 1;  // hidden class C1
obj.b = 2;  // hidden class C2 ← transition, slower
obj.c = 3;  // hidden class C3 ← another transition

// ✅ Khởi tạo đầy đủ từ đầu
const obj = { a: 1, b: 2, c: 3 }; // 1 hidden class, optimal
```

---

## 9. Câu Hỏi Phỏng Vấn

### Câu 1: Phân biệt JavaScript engine và Rendering engine

**Trả lời:** JavaScript Engine (V8, SpiderMonkey, JavaScriptCore) thực thi JavaScript code, quản lý call stack và garbage collection. Rendering Engine (Blink, Gecko, WebKit) parse HTML/CSS và vẽ pixels lên màn hình. Chúng phối hợp qua DOM API — khi JS gọi `document.createElement()`, JS engine gửi lệnh qua binding, rendering engine tạo DOM node.

---

### Câu 2: V8 pipeline hoạt động thế nào?

**Trả lời:** Source code → Parser → AST → Ignition (bytecode interpreter, chạy ngay và thu thập type feedback) → TurboFan (khi function "hot", tối ưu thành machine code bằng speculation) → ORINOCO (garbage collector, chạy song song). Nếu TurboFan giả thuyết sai kiểu → deoptimize quay về bytecode.

---

### Câu 3: Tại sao `for(let i=0; i<arr.length; i++)` chậm?

```javascript
// ❌ Chậm: đọc .length mỗi iteration
for (let i = 0; i < arr.length; i++) { ... }

// ✅ Nhanh hơn: cache length
for (let i = 0, len = arr.length; i < len; i++) { ... }

// ✅ Tốt nhất: reverse loop (chỉ so sánh với 0, nhanh nhất)
for (let i = arr.length - 1; i >= 0; i--) { ... }
```

**Trả lời:** `arr.length` mỗi iteration có thể trigger property lookup. Reverse loop chỉ so sánh với `0` (primitive) thay vì property access. Ngoài ra, dùng `for...of` hoặc `forEach` còn có thể nhanh hơn nữa vì engine optimize tốt.

---

### Câu 4: DOM reflow xảy ra khi nào?

**Trả lời:** Reflow xảy ra khi DOM thay đổi geometry (size, position): thêm/xoá element, thay đổi `width/height/margin/padding`, `offsetWidth/Height`, `scrollTop`, `getBoundingClientRect()`. Tránh bằng cách batch reads và writes riêng biệt, dùng `transform`/`opacity` thay cho layout properties.

---

### Câu 5: `<script>` vs `<script defer>` vs `<script async>`

| | Blocking | Execution timing | Use case |
|--|---------|-------------------|----------|
| `<script>` | Yes | Immediately when found | Scripts that need to modify DOM above |
| `<script defer>` | No | After DOM parsed, in order | General scripts |
| `<script async>` | No | When downloaded, any time | Third-party analytics, independent |

---

### Câu 6: requestAnimationFrame vs setTimeout(fn, 16)

```javascript
// setTimeout — không đồng bộ với frame rate
setTimeout(() => {
  element.style.left = x + 'px';
  x += velocity;
}, 16); // ~60fps nhưng không sync với vsync

// requestAnimationFrame — luôn sync với vsync
function animate() {
  element.style.transform = `translateX(${x}px)`; // composite only, smooth
  x += velocity;
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
```

**Trả lời:** `requestAnimationFrame` callback chạy trước mỗi repaint, đồng bộ với display refresh rate (vsync). `setTimeout(fn, 16)` có thể chạy giữa frame, gây tearing. Luôn dùng `requestAnimationFrame` cho animation.

---

### Câu 7: Hidden class trong V8 là gì?

**Trả lời:** V8 dùng "hidden classes" (internal maps) để track object structure. Objects có cùng shape (cùng properties, cùng thứ tự) share hidden class → V8 có thể generate optimized machine code cho tất cả. Thay đổi shape bằng cách thêm property sau khi tạo → hidden class transition → deoptimization. Luôn khởi tạo object đầy đủ từ đầu để V8 optimize tối đa.

---

### Câu 8: Speculative optimization là gì?

**Trả lời:** TurboFan đưa ra giả thuyết về kiểu dữ liệu dựa trên feedback từ Ignition. Ví dụ: "function này luôn nhận number". Nếu đúng → machine code cực nhanh. Nếu sai (gọi với string) → deoptimize quay về bytecode. Speculative = "đoán trước rồi tối ưu". Đây là lý do `monomorphic` code chạy nhanh hơn `polymorphic`.

---

### Câu 9: CSS Containment là gì?

```javascript
// CSS containment: gợi ý trình duyệt isolate subtree
// → render engine không phải recalculate toàn bộ page

.element {
  contain: layout style paint;  // isolate completely
  // contain: content;           // cheap version
  // contain: strict;            // strictest
}

// Khi .element thay đổi:
// → KHÔNG trigger reflow ở parent
// → KHÔNG trigger repaint ở siblings
// → Chỉ recalculate trong .element subtree
```

**Trả lời:** `contain` property giúp trình duyệt xác định rằng thay đổi trong 1 subtree không ảnh hưởng gì bên ngoài. Cải thiện đáng kể performance cho các dashboard có nhiều widgets độc lập.

---

### Câu 10: Painting và Compositing khác nhau thế nào?

**Trả lời:** Paint = vẽ pixels vào layer (CPU-intensive, rasterization). Composite = tổng hợp các layers thành final frame và gửi GPU (GPU-accelerated, nhanh). Layout changes → Paint → Composite. `transform`/`opacity` → Composite trực tiếp, không qua Paint. Đây là lý do `transform` animation mượt hơn `left`/`top`.

---

## 10. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  BROWSER ENGINE                                                 │
│                                                               │
│  JS ENGINE                    RENDERING ENGINE                 │
│  ├── V8 (Chrome/Edge/Node)    ├── Blink (Chrome/Edge)          │
│  │   ├── Parser → AST         │   ├── Parse HTML → DOM Tree   │
│  │   ├── Ignition bytecode    │   ├── Parse CSS → CSSOM       │
│  │   ├── TurboFan JIT        │   ├── DOM + CSSOM → Render    │
│  │   └── Orinoco GC          │   ├── Layout (reflow)         │
│  ├── SpiderMonkey (Firefox)   │   ├── Paint                   │
│  │   └── Baseline + IonMonkey│   └── Composite               │
│  └── JSCore (Safari)         │                              │
│      └── FTL JIT             │                              │
│                                                               │
│  CRITICAL PATH:                                                │
│  Parse → DOM+CSSOM → RenderTree → Layout → Paint → Composite  │
│                                                               │
│  ⚠️ JS engine + Rendering engine phối hợp qua DOM API       │
│  ⚠️ requestAnimationFrame = trước paint, đồng bộ vsync      │
│  ⚠️ transform/opacity = composite only → mượt                 │
│  ⚠️ eval/arguments/with = deoptimize V8                     │
│  ⚠️ innerHTML loop = layout thrashing                        │
│  ⚠️ Batch reads → batch writes để tránh reflow liên tục    │
└──────────────────────────────────────────────────────────────┘
```

---

## 11. Mối Liên Hệ

```
Browser Engine
  ├── Event Loop (03)    ← render xảy ra sau tasks + microtasks
  ├── DOM API (001/002) ← JS engine gọi DOM qua bindings
  ├── Concurrency (04)  ← Web Workers chạy trong engine riêng
  ├── Performance (09)  ← critical rendering path, paint, composite
  └── Memory (05)        ← Orinoco GC, memory leaks
```

---

## Checklist

- [ ] Phân biệt được JavaScript Engine vs Rendering Engine
- [ ] Vẽ được V8 pipeline: AST → Ignition → TurboFan → GC
- [ ] Giải thích được khi nào TurboFan deoptimize
- [ ] Tránh được layout thrashing bằng cách batch reads/writes
- [ ] Biết dùng `transform`/`opacity` thay vì layout properties
- [ ] Hiểu script defer/async và impact lên rendering
- [ ] Giải thích được requestAnimationFrame vs setTimeout
- [ ] Trả lời được 8/10 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
