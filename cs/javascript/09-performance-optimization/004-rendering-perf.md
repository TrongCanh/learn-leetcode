# Rendering Performance — Từ Frame Drop Đến 60fps Mượt

## Câu hỏi mở đầu

```javascript
// Animation choppy? 30fps thay vì 60fps?
// Scroll không smooth?
// UI "lag" khi user tương tác?

// Nguyên nhân THƯỜNG KHÔNG phải JavaScript chậm
// Mà là: DOM manipulation → Layout → Paint → Composite

// 1 DOM change có thể trigger:
// 1. Style recalculation (TẤT CẢ elements)
// 2. Layout (reflow) — TÍNH TOÁN LẠI POSITION/SIZE
// 3. Paint — VẼ LẠI PIXELS
// 4. Composite — TỔNG HỢP LAYERS

// Mỗi bước TỐN THỜI GIAN
```

**Rendering performance** = làm sao để browser paint pixels nhanh nhất. Hiểu rendering pipeline giúp bạn viết code mượt 60fps, không cần guess. Bài này cover từ browser rendering basics đến advanced optimization techniques.

---

## 1. Rendering Pipeline — Từ Code Đến Pixel

### 6 bước của rendering pipeline

```
┌──────────────────────────────────────────────────────────────┐
│  RENDERING PIPELINE                                            │
│                                                               │
│  1. JavaScript → DOM change                                   │
│     │                                                         │
│  2. Style Calculation                                          │
│     │ ← Recalculate Styles (TÌM computed styles)              │
│     │                                                         │
│  3. Layout (Reflow)                                           │
│     │ ← Calculate position + size (POSITION, SIZE)          │
│     │ ← ⚠️ MOST EXPENSIVE step!                              │
│     │                                                         │
│  4. Update Layer Tree                                          │
│     │ ← GPU layers được updated                               │
│     │                                                         │
│  5. Paint                                                      │
│     │ ← DRAW pixels vào layers (STROKES, FILLS)             │
│     │ ← ⚠️ EXPENSIVE!                                       │
│     │                                                         │
│  6. Composite                                                  │
│     │ ← COMBINE layers, send to GPU                          │
│     │ ← ⚠️ CHEAP — done by GPU                             │
│     │                                                         │
│  7. Display                                                    │
│     └───── Monitor receives final frame                        │
└──────────────────────────────────────────────────────────────┘
```

### Bước nào tốn kém nhất?

```
┌──────────────────────────────────────────────────────────────┐
│  COST COMPARISON (approximate)                                │
│                                                               │
│  Composite change    ██░░░░░░░░  ~0.5ms                     │
│  Paint change        ██████░░░░░  ~2-3ms                      │
│  Layout change       ███████████  ~5-20ms ⚠️ EXPENSIVE!      │
│  JS + Layout + Paint ████████████  ~10-30ms                 │
│                                                               │
│  ⚠️ Layout change LUÔN trigger Paint!                       │
│  ⚠️ 1 frame budget = 16.67ms (60fps)                        │
│  ⚠️ Nếu pipeline > 16.67ms → DROP FRAME → JANK!           │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Layout Thrashing — Bug Phổ Biến Nhất

### Bản chất

```javascript
// Layout thrashing = alternating READ → WRITE → READ → WRITE
// Mỗi READ trigger layout → WASTEFUL

// ❌ Classic layout thrashing
const boxes = document.querySelectorAll('.box');

boxes.forEach(box => {
  const width = box.offsetWidth; // READ → trigger layout
  box.style.width = (width + 10) + 'px'; // WRITE → trigger layout
});
// → 2N layout recalculations thay vì N!

// ⚠️ N = 100 elements
// → 200 layout recalculations = 200 * 10ms = 2 giây!
```

### Read-Write Batching

```javascript
// ✅ FIX: Batch all READS first
const boxes = document.querySelectorAll('.box');

// READS: đọc TẤT CẢ trước
const widths = Array.from(boxes).map(box => box.offsetWidth);

// WRITES: ghi TẤT CẢ sau
boxes.forEach((box, i) => {
  box.style.width = (widths[i] + 10) + 'px';
});
// → N layout recalculations thay vì 2N!

// ✅ Even better: requestAnimationFrame batch
requestAnimationFrame(() => {
  // Batch reads
  const positions = elements.map(el => el.getBoundingClientRect());

  // Batch writes
  elements.forEach((el, i) => {
    el.style.transform = `translateY(${positions[i].top}px)`;
  });
});
```

### Auto-sizing element

```javascript
// ❌ Layout thrashing với auto-sizing
elements.forEach(el => {
  const height = el.offsetHeight; // READ → reflow
  el.style.height = height + 'px'; // WRITE → reflow
});

// ✅ Auto-sizing trick: đọc CSS trước
const computed = getComputedStyle(el);
const height = parseFloat(computed.height); // no reflow
// ... sau đó write

// ✅ Hoặc: force layout cache
function getSize(el) {
  const rect = el.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

const sizes = elements.map(getSize); // force layout ONCE

elements.forEach((el, i) => {
  el.style.height = sizes[i].height + 'px';
});
```

---

## 3. CSS Properties và Rendering Cost

### Properties gây Layout, Paint, Composite

```
┌──────────────────────────────────────────────────────────────┐
│  LAYOUT (position + size) — TRIGGER REFLOW — ⚠️ EXPENSIVE  │
│  ├── width, height                                           │
│  ├── padding, margin                                        │
│  ├── left, top, right, bottom                              │
│  ├── transform: translate() ← COMPOSITE ONLY! ✅             │
│  └── position: absolute/fixed ← COMPOSITE ONLY! ✅           │
│                                                               │
│  PAINT (pixels) — EXPENSIVE                                  │
│  ├── color, background-color                                 │
│  ├── border, box-shadow                                     │
│  └── opacity ← COMPOSITE ONLY! ✅                           │
│                                                               │
│  COMPOSITE (layers) — CHEAP ✅                               │
│  ├── transform: translate(), scale(), rotate()              │
│  ├── opacity                                                 │
│  ├── filter: blur(), drop-shadow()                          │
│  └── will-change: transform                                 │
│                                                               │
│  ✅ LUÔN ƯU TIÊN: transform + opacity                     │
│  ⚠️ NẾU CÓ THỂ: thay layout/paint → composite             │
└──────────────────────────────────────────────────────────────┘
```

### Animations đúng cách

```css
/* ❌ Layout changes — ANIMALS SLOW */
@keyframes slideLeft {
  from { left: 0; }
  to { left: -100%; } /* → Layout → Paint → Composite */
}

/* ✅ Transform changes — ANIMATE FAST */
@keyframes slideLeft {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); } /* → Composite ONLY */
}

/* ❌ Opacity via visibility — COMPOUND SLOW */
@keyframes fadeIn {
  from { opacity: 0; visibility: visible; }
  to { opacity: 1; visibility: visible; }
}

/* ✅ Pure opacity — COMPOSITE ONLY */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Real-world example

```javascript
// ❌ Tất cả animation = layout changes
function animateSlide(element, from, to) {
  let pos = from;
  const step = () => {
    pos += 1;
    element.style.left = pos + 'px'; // Layout reflow!
    if (pos < to) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ✅ Transform = composite only
function animateSlide(element, from, to) {
  let pos = from;
  const step = () => {
    pos += 1;
    element.style.transform = `translateX(${pos}px)`; // Composite ONLY!
    if (pos < to) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
```

---

## 4. GPU Compositing và Layers

### Composite Layers

```javascript
// Trình duyệt tạo LAYERS — mỗi layer vẽ ra 1 canvas
// Layers được GPU composite → rất nhanh

// Transform và opacity CHỈ cần composite — KHÔNG repaint
// → ANIMATION MƯỢT NHẤT

// ❌ Composite-only properties trong animation vẫn chậm nếu...
// Element không có layer riêng
// → Phải repaint parent layer!

// ✅ will-change: gợi ý browser tạo layer riêng
.animating-element {
  will-change: transform; /* → Tạo layer riêng → smooth animation */
}
```

### Khi nào tạo layers?

```
┌──────────────────────────────────────────────────────────────┐
│  ELEMENTS TẠO LAYERS TỰ ĐỘNG                                │
│                                                               │
│  ├── <video> elements                                         │
│  ├── <canvas> elements                                       │
│  ├── CSS transforms với animation/transition                │
│  ├── CSS will-change property                                │
│  ├── CSS filter effects                                       │
│  ├── Elements với opacity animation                          │
│  └── Elements với overflow: hidden/visible/scroll           │
│                                                               │
│  ⚠️ WILL-CHANGE: CHỈ dùng KHI CẦN, có thời hạn             │
│  ⚠️ Quá nhiều layers → OUT OF VRAM → PERFORMANCE DROP!    │
└──────────────────────────────────────────────────────────────┘
```

### will-change best practices

```css
/* ❌ OVERUSE will-change — MEMORY LEAK */
.bad-element {
  will-change: transform, opacity, left, top, width, height;
  /* Tạo quá nhiều layers = out of VRAM! */
}

/* ✅ CONSERVATIVE will-change — only what's needed */
.smooth-element {
  will-change: transform; /* Chỉ transform cần layer riêng */
}

/* ✅ WILL-CHANGE với animation class */
.animating-element {
  will-change: transform;
}

.animating-element.animating {
  animation: slide 0.5s ease-out;
}

/* ✅ Remove will-change sau animation để reclaim memory */
.animating-element {
  animation: slide 0.5s ease-out forwards;
  will-change: transform;
}
/* animation-fill-mode: forwards giữ end state → will-change hết tác dụng */
```

---

## 5. Virtual DOM và Reconciliation

### React rendering flow

```javascript
// 1. setState() called
// 2. React schedules re-render
// 3. Component re-renders → returns new JSX
// 4. React compares (reconcile) new JSX vs old DOM
// 5. DOM được UPDATE CHỈ NHỮNG GÌ THAY ĐỔI

// Virtual DOM = in-memory representation của real DOM
// Reconciliation = diffing algorithm để tìm minimal updates

// ⚠️ Re-render ≠ DOM update
// Component re-renders nhưng DOM có thể KHÔNG update
// Nếu JSX output giống hệt trước → React skip DOM update

// Virtual DOM overhead: tạo objects + diffing = CPU cost
// Nhưng tránh được direct DOM manipulation = faster overall
```

### Avoid unnecessary re-renders

```javascript
// ❌ Component re-renders MỖI LẦI parent re-renders
class Parent extends React.Component {
  render() {
    return <Child onClick={() => {}} />; // New function = new prop!
  }
}

// ✅ useCallback — stabilize function reference
class Parent extends React.Component {
  handleClick = useCallback(() => {
    // stable reference
  }, []);

  return <Child onClick={handleClick} />;
}

// ✅ useMemo — stabilize computed values
const derived = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// ✅ React.memo — skip re-render nếu props unchanged
const MemoizedChild = React.memo(Child);

// ✅ React.memo with custom comparison
const MemoizedList = React.memo(List, (prevProps, nextProps) => {
  return prevProps.items.length === nextProps.items.length;
});
```

### Key rules

```javascript
// ❌ Key là index → reconciliation broken khi reorder
{items.map((item, i) => (
  <div key={i}>{item.name}</div>
))}

// ✅ Key là stable ID → correct reconciliation
{items.map(item => (
  <div key={item.id}>{item.name}</div>
))}

// ⚠️ Key sai = React không thể reuse elements
// → DOM nodes được DESTROYED + RECREATED = performance disaster
```

---

## 6. Chrome DevTools Performance

### Reading flame chart

```
Chrome DevTools Performance Tab:
├── Frames: show frame rate
│   ├── Green bar = 60fps
│   └── Red bar = dropped frames (JANK)
│
├── Main thread:
│   ├── Task (long): JavaScript execution
│   │   ├── function A
│   │   │   └── function B
│   │   └── function C
│   └── Style recalc + Layout (reflow)
│
└── Frames section:
    ├── Paint profiler
    └── Composite layers
```

### Performance budget

```
┌──────────────────────────────────────────────────────────────┐
│  PERFORMANCE BUDGETS                                          │
│                                                               │
│  Time:                                                         │
│  ├── JS Long Task: < 50ms                                    │
│  ├── Total Blocking Time (TBT): < 200ms                       │
│  ├── Time to Interactive (TTI): < 3.8s                       │
│  └── First Input Delay (FID): < 100ms                         │
│                                                               │
│  Network:                                                       │
│  ├── Initial JS bundle: < 170KB (gzipped)                     │
│  ├── Total page weight: < 1MB                                  │
│  └── Critical path resources: < 14.6KB                         │
│                                                               │
│  Rendering:                                                    │
│  ├── Frame budget: < 16.67ms (60fps)                          │
│  └── Long frames: < 3 per second                              │
│                                                               │
│  ⚠️ Target: 95+ Lighthouse Performance score                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. CSS Containment

```css
/* CSS Containment: ngăn style/layout changes trong subtree
   ảnh hưởng ra ngoài, và ngược lại */

.container {
  /* isloatree hoàn toàn */
  contain: strict;
  /* Tương đương: contain: layout style paint size; */
}

.widget {
  /* Chỉ isolate layout */
  contain: layout;
}

.scroll-area {
  /* Layout không affect bên ngoài */
  contain: layout strict;
}

/* Khi .scroll-area layout thay đổi: */
/* → Parent không bị affect */
/* → Siblings không bị affect */
/* → Browser có thể optimize tốt hơn */
```

### content-visibility

```css
/* content-visibility: auto = skip rendering công việc
   cho elements không visible */

.long-list {
  content-visibility: auto;
  contain-intrinsic-size: 0 50px; /* Ước lượng size để tránh scrollbar jump */
}

/* Elements outside viewport được skip rendering */
/* → Significant performance boost cho long pages */
/* → Browser vẫn reserve space nhưng không paint content */

/* ⚠️ progressive enhancement: dùng với @supports */
@supports (content-visibility: auto) {
  .skip-rendering {
    content-visibility: auto;
  }
}
```

---

## 8. Web Workers — Offload JavaScript

```javascript
// Main thread: UI + JS
// Worker thread: Heavy JS computation

// ❌ Heavy computation block main thread → UI freezes
function processData(items) {
  return items
    .filter(item => item.active)
    .sort((a, b) => b.score - a.score)
    .map(item => expensiveTransform(item));
}

document.querySelector('button').onclick = () => {
  const result = processData(hugeArray); // Main thread blocked!
  renderResults(result);
};

// ✅ Heavy work in Web Worker
const worker = new Worker('processor.js');

worker.postMessage({ items: hugeArray });

worker.onmessage = (event) => {
  renderResults(event.data); // Main thread free!
};

// processor.js:
self.onmessage = (event) => {
  const { items } = event.data;
  const result = items
    .filter(item => item.active)
    .sort((a, b) => b.score - a.score)
    .map(item => expensiveTransform(item));
  self.postMessage(result);
};
```

### When to use Web Workers

```
┌──────────────────────────────────────────────────────────────┐
│  USE WEB WORKERS for:                                        │
│  ├── Data processing (filter, sort, transform large arrays)│
│  ├── Image processing (canvas manipulation)                 │
│  ├── Crypto operations                                      │
│  ├── Parsing (JSON, XML, CSV)                              │
│  ├── Search indexing                                         │
│  └── Any CPU-intensive task > 50ms                         │
│                                                               │
│  DON'T USE for:                                              │
│  ├── DOM manipulation (Workers can't touch DOM!)            │
│  ├── Simple calculations (< 50ms)                           │
│  ├── UI updates                                              │
│  └── Event handlers                                          │
│                                                               │
│  ⚠️ Communication overhead — transfer data efficiently      │
│  ⚠️ No DOM access — Workers are pure computation           │
└──────────────────────────────────────────────────────────────┘
```

---

## 9. Các Traps Phổ Biến

### Trap 1: getComputedStyle gây style recalculation

```javascript
// ❌ getComputedStyle = force style recalculation!
const width = getComputedStyle(element).width; // Expensive!

// ✅ Cache computed styles
const computed = getComputedStyle(element);
const width = computed.width;
const height = computed.height;
// → Chỉ 1 recalculation

// ✅ Hoặc dùng getBoundingClientRect để batch
const rect = element.getBoundingClientRect();
const width = rect.width; // rect chứa width, height, top, left
```

### Trap 2: Animating "top" thay vì "transform"

```javascript
// ❌ Animating top/left = Layout = Expensive
@keyframes bounce {
  0%, 100% { top: 0; }
  50% { top: 100px; }
}

// ✅ Animating transform = Composite = Fast
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(100px); }
}
```

### Trap 3: Frequent DOM reads after write

```javascript
// ❌ Read sau write = force synchronous layout
box.style.width = newWidth + 'px';
const height = box.offsetHeight; // ← Force layout để read最新 height!

// ✅ Read all first, then write all
const newHeight = box.offsetHeight; // Read
box.style.width = newWidth + 'px'; // Write — không cần read sau
```

### Trap 4: Multiple DOM refslows in loop

```javascript
// ❌ Loop tạo nhiều reflows
items.forEach(item => {
  item.style.height = calculateHeight(item) + 'px';
  item.style.width = calculateWidth(item) + 'px';
  item.style.opacity = calculateOpacity(item);
});

// ✅ Batch DOM reads + writes
const items = Array.from(document.querySelectorAll('.item'));
const heights = items.map(i => calculateHeight(i));
const widths = items.map(i => calculateWidth(i));
const opacities = items.map(i => calculateOpacity(i));

requestAnimationFrame(() => {
  items.forEach((item, i) => {
    item.style.height = heights[i] + 'px';
    item.style.width = widths[i] + 'px';
    item.style.opacity = opacities[i];
  });
});
```

---

## 10. Câu Hỏi Phỏng Vấn

### Câu 1: Layout vs Paint vs Composite

**Trả lời:** Layout (reflow) = tính toán position và size của elements, **most expensive**. Paint = vẽ pixels vào layers. Composite = tổng hợp layers và gửi GPU, **cheapest**. Transform và opacity chỉ trigger composite — không layout, không paint. Luôn prefer animate transform/opacity thay vì left/top/width/height.

---

### Câu 2: Layout thrashing là gì? Làm sao fix?

**Trả lời:** Layout thrashing = alternating reads và writes liên tục. Mỗi read trigger synchronous layout, khiến browser phải recalculate layout N lần thay vì 1 lần. Fix: **batch reads trước, writes sau**. Đọc tất cả widths, heights → sau đó ghi tất cả styles. Dùng `requestAnimationFrame` để batch reads và writes trong frame.

---

### Câu 3: will-change nên dùng như thế nào?

**Trả lời:** `will-change: transform` gợi ý browser tạo layer riêng cho element → animation mượt hơn. Nhưng dùng **quá nhiều** will-change → quá nhiều layers → out of VRAM → performance drop. Chỉ dùng khi: (1) element sẽ animate, (2) trong thời gian ngắn. Remove sau khi animation done.

---

### Câu 4: requestAnimationFrame vs setTimeout(, 16)

```javascript
// setTimeout(fn, 16) ≈ 60fps nhưng:
// - Có thể chạy giữa frames → visual jank
// - Không đồng bộ với vsync

// requestAnimationFrame:
// - Chạy TRƯỚC MỖI FRAME
// - Đồng bộ với display refresh rate
// - Browser tối ưu hóa

// Luôn dùng rAF cho animations!
function animate() {
  update();
  requestAnimationFrame(animate); // smooth 60fps
}
requestAnimationFrame(animate);
```

---

### Câu 5: CSS Containment giúp gì?

**Trả lời:** `contain` property cho browser biết rằng thay đổi trong element **không ảnh hưởng gì bên ngoài** subtree. Browser có thể optimize: không recalculate parent/sibling layouts khi child thay đổi. `contain: layout` → isolate layout. `contain: paint` → isolate paint. `contain: strict` → isolate tất cả. Dùng cho widgets, dashboard panels, components độc lập.

---

### Câu 6: Virtual DOM và performance

**Trả lời:** Virtual DOM là JavaScript representation của DOM. Khi state change: (1) re-render tạo new VDOM, (2) diffing algorithm so sánh old vs new VDOM, (3) apply minimum changes vào real DOM. VDOM overhead (create objects, diffing) được bù bằng: tránh direct DOM manipulation, batch updates. VDOM không tự động nhanh — cần: avoid unnecessary re-renders, key correctly, memo components.

---

## 11. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  RENDERING PERFORMANCE                                         │
│                                                               │
│  RENDERING PIPELINE                                            │
│  1. JS → 2. Style → 3. Layout → 4. Layer → 5. Paint → 6. Composite
│                                                               │
│  LAYOUT THRASHING                                             │
│  ├── Alternating read → write = Nx expensive               │
│  ├── Fix: batch reads → batch writes                       │
│  └── requestAnimationFrame for synchronization              │
│                                                               │
│  CSS PERFORMANCE                                             │
│  ├── transform + opacity = composite ONLY ✅               │
│  ├── width/height/left/top = layout ❌                     │
│  └── will-change = create layers (use sparingly!)          │
│                                                               │
│  REACT OPTIMIZATION                                          │
│  ├── React.memo() = skip unnecessary re-renders            │
│  ├── useCallback/useMemo = stable references                │
│  └── Stable keys = correct reconciliation                   │
│                                                               │
│  TOOLS                                                        │
│  ├── Chrome DevTools Performance tab = flame charts          │
│  ├── Chrome DevTools Layers tab = layer visualization       │
│  ├── Lighthouse = performance metrics                         │
│  └── Web Workers = offload heavy computation               │
│                                                               │
│  ⚠️ Layout = most expensive, always triggers paint         │
│  ⚠️ 1 frame = 16.67ms (60fps) budget                      │
│  ⚠️ will-change overuse = VRAM exhaustion                 │
│  ⚠️ Layout thrashing = batch reads, then writes            │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Hiểu rendering pipeline và chi phí của từng bước
- [ ] Tránh được layout thrashing bằng read-write batching
- [ ] Animating bằng transform/opacity thay vì layout properties
- [ ] Đọc được flame chart trong Chrome DevTools
- [ ] Dùng được React.memo và useCallback đúng cách
- [ ] Trả lời được 4/6 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
