# Garbage Collection — JavaScript Dọn Rác Như Thế Nào

## Câu hỏi mở đầu

```javascript
function createUser() {
  const user = { name: 'Alice', data: new Array(10000) };
  return user.name; // chỉ dùng name
}

createUser();
// Biến user và data đi đâu?
// Ai dọn?
// Bao giờ dọn?
```

**Garbage Collector (GC) tự động dọn objects không còn được sử dụng.** Hiểu cách GC hoạt động giúp bạn tránh memory leaks, tối ưu performance, và debug khi GC gây "stop-the-world" pauses.

---

## 1. Garbage Collection — Tại Sao Cần?

### Manual vs Automatic

```javascript
// C/C++: manual memory management
char* buffer = (char*)malloc(1000);
buffer[0] = 'A';
free(buffer); // Tự giải phóng — có thể quên!

// ❌ Double free: free(buffer) hai lần → crash
// ❌ Use after free: dùng buffer sau khi free → undefined behavior
// ❌ Memory leak: quên free → memory không thể reclaim

// JavaScript: automatic GC
const buffer = new Array(1000);
buffer[0] = 'A';
// Khi buffer không còn reference → GC tự dọn
// KHÔNG cần tự quản lý memory
```

### Reference Counting

```javascript
// Reference counting: đếm số references đến object
let obj = { x: 1 }; // reference count = 1
let ref = obj;       // reference count = 2
ref = null;          // reference count = 1
obj = null;           // reference count = 0 → GC!
```

### Vấn đề với Reference Counting

```javascript
// ❌ Reference counting không detect được circular references
const a = { name: 'A' };
const b = { name: 'B' };

a.ref = b; // A tham chiếu B
b.ref = a; // B tham chiếu A

// reference count: a = 1 (từ biến 'a')
// reference count: b = 1 (từ biến 'b')
// NHƯNG a và b tham chiếu nhau → không ai dùng nhưng không GC!

a = null; // a reference count = 0? KHÔNG! b.ref = a → count = 1
b = null; // b reference count = 0? KHÔNG! a.ref = b → count = 1
// → CIRCULAR REFERENCE = MEMORY LEAK!

// ⚠️ Old browsers (IE) dùng reference counting → leaks phổ biến
// ⚠️ JavaScript engines hiện đại KHÔNG dùng reference counting
```

---

## 2. Mark and Sweep — Thuật Toán Chính

### Nguyên lý

```
┌─────────────────────────────────────────────────────────────┐
│  MARK AND SWEEP                                                │
│                                                               │
│  1. MARK: Đánh dấu objects có thể truy cập từ "roots"      │
│     Roots = global variables, stack frames đang chạy,        │
│            closures tham chiếu, etc.                          │
│                                                               │
│  2. SWEEP: Quét heap, xóa objects không được mark            │
│                                                               │
│  3. COMPACT (tùy chọn): Sắp xếp lại memory                  │
│     → Tránh memory fragmentation                             │
└─────────────────────────────────────────────────────────────┘
```

### Minh họa chi tiết

```
TRƯỚC GC:
┌─────────────────────────────────────────────────────────────┐
│  Object A  (✓ reachable) ← tham chiếu từ global variable   │
│  Object B  (✓ reachable) ← tham chiếu từ A                │
│  Object C  (✗ unreachable) ← không ai tham chiếu!          │
│  Object D  (✗ unreachable) ← circular reference với C      │
│  Object E  (✓ reachable) ← tham chiếu từ closure           │
└─────────────────────────────────────────────────────────────┘

MARK PHASE:
→ Bắt đầu từ roots
→ Mark A ✅ (từ root)
→ Mark B ✅ (từ A)
→ Mark E ✅ (từ closure)
→ C: không mark ❌
→ D: không mark ❌

SWEEP PHASE:
→ Xóa C và D (unreachable)
→ Memory reclaimed

SAU GC:
┌─────────────────────────────────────────────────────────────┐
│  Object A  (kept)                                          │
│  Object B  (kept)                                          │
│  Object E  (kept)                                          │
│  ─── freed ─── C and D removed                             │
└─────────────────────────────────────────────────────────────┘
```

### Triển khai đơn giản

```javascript
// Conceptual GC implementation để hiểu
class SimpleGC {
  constructor() {
    this.heap = new Map(); // address → object
    this.roots = new Set();
    this.nextAddress = 1;
  }

  allocate(obj) {
    const address = this.nextAddress++;
    this.heap.set(address, {
      data: obj,
      marked: false
    });
    return address;
  }

  addRoot(address) {
    this.roots.add(address);
  }

  mark() {
    // Mark from roots
    const stack = [...this.roots];

    while (stack.length > 0) {
      const addr = stack.pop();
      const obj = this.heap.get(addr);
      if (obj && !obj.marked) {
        obj.marked = true;
        // Push referenced objects
        for (const ref of this.getReferences(obj.data)) {
          if (this.heap.has(ref)) {
            stack.push(ref);
          }
        }
      }
    }
  }

  sweep() {
    for (const [addr, obj] of this.heap) {
      if (!obj.marked) {
        this.heap.delete(addr);
        console.log(`Freed object at ${addr}`);
      } else {
        obj.marked = false; // Reset for next GC
      }
    }
  }

  getReferences(obj) {
    // Traverse references in object
    const refs = [];
    if (typeof obj === 'object' && obj !== null) {
      for (const key of Object.keys(obj)) {
        refs.push(obj[key]);
      }
    }
    return refs;
  }

  gc() {
    this.mark();
    this.sweep();
  }
}
```

---

## 3. Generational GC — Chia Nhỏ Để Nhanh

### Tại sao chia generations?

```
OBSERVATION:
┌──────────────────────────────────────────────────────────────┐
│  Object lifetimes trong JavaScript:                              │
│                                                               │
│  Objects mới:                                                  │
│    80-90% chết SỚM (trong vài milliseconds)                │
│    Ví dụ: function local variables, temporary objects        │
│                                                               │
│  Objects cũ:                                                  │
│    10-20% sống LÂU (persistent app state)                 │
│    Ví dụ: global cache, event listeners, closures           │
│                                                               │
│  → Không cần GC toàn bộ heap mỗi lần!                     │
│  → Young generation GC nhanh vì hầu hết objects đã dead  │
│  → Old generation GC ít vì objects cũ ít thay đổi          │
└──────────────────────────────────────────────────────────────┘
```

### Hai Generations Chi Tiết

```
┌─────────────────────────────────────────────────────────────┐
│  GENERATIONAL GC                                                 │
│                                                               │
│  YOUNG GENERATION (Minor GC):                                  │
│  ├── Eden: objects mới được tạo                          │
│  ├── Survivor S0 → objects sống sót sau GC lần 1      │
│  └── Survivor S1 → objects sống sót sau GC lần 2      │
│                                                               │
│  OLD GENERATION (Major GC):                                    │
│  ├── Objects sống qua nhiều Minor GCs                  │
│  └── GC ít khi hơn, nhưng chạy lâu hơn               │
│                                                               │
│  FLOW:                                                        │
│  1. Object tạo → Eden                                    │
│  2. Minor GC → dead objects bị sweep → live → S0     │
│  3. Minor GC → S0 → S1 (flip) → dead → sweep          │
│  4. Objects sống lâu → promoted → Old Generation      │
│  5. Old Generation GC khi cần (Major GC)                │
└─────────────────────────────────────────────────────────────┘
```

### V8 Engine Memory Layout

```
┌─────────────────────────────────────────────────────────────┐
│  V8 PROCESS HEAP                                                │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  NEW SPACE (1-8 MB, configurable)                        │  │
│  │  ├── Eden: objects mới                                 │  │
│  │  │   Minor GC: thường xuyên (vài ms)                  │  │
│  │  └── S0 / S1 (Survivors): objects sống sót            │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  OLD SPACE                                              │  │
│  │    ├── Object space: objects đã promoted            │  │
│  │    ├── Large object space: > pre-allocated size      │  │
│  │    └── Code space: JIT compiled code                   │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  LARGE OBJECT SPACE                                     │  │
│  │    └── Objects quá lớn cho generations             │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  MAP SPACE                                              │  │
│  │    └── Internal V8 structures (hidden classes)     │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  CODE SPACE                                            │  │
│  │    └── Executable code                                │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Minor vs Major GC

```javascript
// Minor GC (Scavenge — Young Generation):
// - Chạy thường xuyên (~ms)
// - Nhanh: chỉ quét New Space
// - Objects chết sớm → reclaim memory nhanh
// - Survivor objects được copy S0 ↔ S1

// Major GC (Mark-Sweep-Compact — Old Generation):
// - Chạy khi Old Space đầy
// - Chậm hơn: quét toàn bộ heap
// - Mark → Sweep → Compact (giảm fragmentation)
// - Có thể gây "stop-the-world" pauses

// Incremental GC (V8 optimization):
// - Thay vì chạy 1 lần dài → chạy TỪNG BƯỚC NHỎ
// - Giảm pause time
// - V8 tự động incremental khi heap lớn
```

---

## 4. V8 Optimizations

### Hidden Classes (Shape Optimization)

```javascript
// V8 dùng "hidden classes" (shapes) để tối ưu property access
// Objects cùng structure → cùng hidden class → fast lookup

// Object A và B cùng shape → cùng hidden class
const a = { x: 1, y: 2 };
const b = { x: 3, y: 4 };
// V8: cùng HC_0 (x=0, y=1) → fast property access

// ⚠️ Thêm property KHÔNG cùng thứ tự → khác hidden class
const c = { y: 2, x: 1 }; // KHÁC hidden class!
```

### Inline Caching

```javascript
// Inline caching: V8 cache kết quả property lookups
function getX(obj) {
  return obj.x; // Gọi nhiều lần → V8 cache lookup
}

getX({ x: 1 }); // Lần 1: lookup x trong hidden class
getX({ x: 2 }); // Lần 2+: dùng cached lookup → FAST!

// ⚠️ Megamorphic: nhiều shapes → cache miss → chậm
function process(item) {
  return item.value; // item có nhiều types → megamorphic
}

process({ value: 1 });   // shape A
process({ value: 2 });   // shape B
process([1, 2]);         // shape C → megamorphic!
```

### Deoptimization

```javascript
// Type changes → V8 deoptimizes
function add(a, b) {
  return a + b;
}

add(1, 2);       // int32 optimized
add(1, 2.5);     // float64 → deoptimize!
add('a', 'b');   // string → deoptimize!

// Turbofan tạo machine code cho int32
// Khi type đổi → deoptimize → quay về bytecode

// Detect deoptimization:
node --trace-deopt app.js
// Hoặc:
console.log(%GetOptimizationStatus(addFunction));
```

---

## 5. GC và Performance

### Stop-the-World

```javascript
// ❌ GC chạy → event loop bị PAUSE!
console.log('A');
// GC starts (Stop-the-world: event loop PAUSED)
// ... GC runs for 100ms ...
console.log('B'); // Chỉ log sau khi GC xong!

// → UI freeze nếu GC chạy lâu trong browser
// → Request latency nếu GC chạy lâu trong Node.js
```

### Incremental GC (V8)

```javascript
// Incremental GC: chia GC thành nhiều bước nhỏ
// → Pause time giảm đáng kể

// Non-incremental:
[Pause 100ms]  → User thấy lag

// Incremental:
[Pause 10ms][Pause 10ms][Pause 10ms]...[Pause 10ms]
→ Mỗi pause ngắn → user không nhận ra
```

### Khi GC Gây Performance Issues

```javascript
// Symptoms:
// 1. "Long tasks" trong Performance tab
// 2. UI jank/freeze
// 3. Node.js: request latency spikes

// Solutions:

// 1. Tạo ít objects tạm
// ❌
function processItems(items) {
  return items.map(item => ({
    ...item,
    processed: true
  }));
}

// ✅
function processItems(items, out) {
  for (let i = 0; i < items.length; i++) {
    out[i] = { ...items[i], processed: true };
  }
  return out;
}

// 2. Object pooling
const buffer = [];
function getBuffer() {
  return buffer.pop() || { data: null };
}
function releaseBuffer(obj) {
  buffer.push(obj);
}

// 3. Nullify references
function bigFunction() {
  const temp = new Array(10000);
  // ... use temp ...
  temp = null; // GC có thể reclaim
}

// 4. Weak references
const cache = new WeakMap(); // auto-cleanup
```

---

## 6. Các Traps Phổ Biến

### Trap 1: Tưởng GC Dọn Tất Cả

```javascript
// ❌ Closures giữ references — không được GC!
function outer() {
  const bigData = new Array(100_000); // 10MB

  return function inner() {
    return bigData.length; // Closure giữ bigData!
  };
}

const fn = outer();
// bigData không thể GC vì inner() tham chiếu
// fn → inner closure → bigData → alive!

// ✅ Fix: chỉ capture primitive
function outer() {
  const bigData = new Array(100_000);
  const neededLength = bigData.length; // chỉ primitive

  return function inner() {
    return neededLength; // bigData không bị giữ
  };
}
```

### Trap 2: Detached DOM Nodes

```javascript
// ❌ DOM element đã remove nhưng vẫn trong memory
const element = document.getElementById('chart');
element.dataset.ref = someLargeObject;

document.body.removeChild(element);
// Element đã remove khỏi DOM
// NHƯNG element.dataset.ref → someLargeObject không GC'd!

// ✅ Fix: clear reference trước khi remove
element.dataset.ref = null;
document.body.removeChild(element);
```

### Trap 3: Global Variables

```javascript
// ❌ Global variables không bao giờ GC (vì roots luôn reference)
window.globalCache = new Array(1_000_000); // KHÔNG GC!

// ✅ Dùng IIFE để có scope riêng
const myModule = (function() {
  let cache = []; // Sẽ được GC khi module không còn reference
  return { /* public API */ };
})();
```

### Trap 4: console.log Giữ References

```javascript
// ❌ console.log có thể giữ references (DevTools)
const data = { huge: new Array(100_000) };
console.log(data); // DevTools console giữ reference!
data = null; // data có thể vẫn trong console memory

// ✅ Serialize trước khi log
console.log(JSON.stringify(data)); // Không giữ reference
console.log('Size:', data.huge.length); // Chỉ log cần thiết

// ✅ Debugger cũng giữ!
debugger; // Pauses và giữ references
```

### Trap 5: Global Arrays Grow Forever

```javascript
// ❌ Array global không GC (vì root reference)
const results = [];

function onMessage(data) {
  results.push(data); // results tăng mãi mãi!
}

// ✅ Limit array size
const results = [];
const MAX_RESULTS = 1000;

function onMessage(data) {
  results.push(data);
  if (results.length > MAX_RESULTS) {
    results.shift();
  }
}

// ✅ Hoặc dùng circular buffer
class CircularBuffer {
  constructor(size) {
    this.buffer = new Array(size);
    this.head = 0;
  }

  push(item) {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.buffer.length;
  }
}
```

---

## 7. Câu Hỏi Phỏng Vấn

### Câu 1: Giải thích Mark and Sweep

**Trả lời:** GC đánh dấu (mark) tất cả objects có thể truy cập từ "roots" — roots bao gồm global variables, stack frames đang chạy, closures đang tham chiếu. GC quét (sweep) toàn bộ heap, xóa objects không được mark. Sau đó, optional: compact (sắp xếp lại memory để tránh fragmentation). Mark-and-sweep phát hiện được circular references (khác với reference counting).

---

### Câu 2: Circular references xử lý thế nào?

**Trả lời:** Reference counting cũ (IE): không phát hiện được circular references → memory leak. Modern JS engines (V8, SpiderMonkey): dùng mark-and-sweep → phát hiện được circular refs. A tham chiếu B, B tham chiếu A, nhưng không có external reference → cả hai không reachable → bị sweep.

---

### Câu 3: Tại sao dùng Generational GC?

**Trả lời:** Observations: 80-90% objects mới chết sớm (trong milliseconds). Young generation GC chỉ quét objects mới → nhanh. Objects sống lâu được promoted sang Old generation → ít GC. Old generation GC ít vì objects cũ ít thay đổi. Kết quả: GC pause time giảm đáng kể.

---

### Câu 4: Stop-the-world là gì và làm sao giảm?

**Trả lời:** Stop-the-world: GC chạy → event loop bị pause cho đến khi GC xong. User thấy UI freeze hoặc request latency. Giảm bằng: (1) Incremental GC: chia GC thành nhiều bước nhỏ → mỗi pause ngắn. (2) Generational GC: Young generation GC nhanh → ít pause. (3) Giảm allocations: ít objects mới → ít GC. (4) Object pooling: reuse objects → ít allocations.

---

### Câu 5: WeakMap và WeakRef là gì?

**Trả lời:** WeakMap: keys phải là objects, entries tự động bị xóa khi key bị GC. Dùng cho: caching theo object instances. WeakRef: hold reference đến object nhưng không ngăn GC. Dùng cho: cache có fallback, observer patterns. FinalizationRegistry: callback khi object bị GC.

---

## 8. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  GARBAGE COLLECTION                                            │
│                                                               │
│  ALGORITHMS                                                   │
│  ├── Reference counting: đếm references, không detect       │
│  │   circular refs → leak (old browsers)                    │
│  ├── Mark and Sweep: mark reachable → sweep unreachable   │
│  │   → phát hiện circular refs ✅                         │
│  └── Generational: chia objects theo age → GC nhanh     │
│                                                               │
│  V8 MEMORY LAYOUT                                             │
│  ├── New Space: Eden + Survivors (young objects)           │
│  ├── Old Space: promoted objects                           │
│  ├── Large Object Space: oversized objects                │
│  └── Map/Code Space: internal structures                 │
│                                                               │
│  GENERATIONAL FLOW                                            │
│  ├── Object → Eden                                       │
│  ├── Minor GC: dead → freed, alive → S0/S1            │
│  ├── Objects sống lâu → Old Space (promotion)        │
│  └── Major GC: Old Space full → full mark-sweep-compact  │
│                                                               │
│  ⚠️ Closures giữ references — không GC được            │
│  ⚠️ Detached DOM nodes: remove reference trước khi GC  │
│  ⚠️ Global variables: KHÔNG bao giờ GC                  │
│  ⚠️ console.log/debugger: có thể giữ references       │
│  ⚠️ Stop-the-world: giảm bằng incremental GC           │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Mô tả được mark-and-sweep algorithm
- [ ] Hiểu tại sao dùng generational GC
- [ ] Hiểu V8 heap layout
- [ ] Tránh được leak từ closures
- [ ] Tránh được detached DOM leaks
- [ ] Dùng được WeakMap cho caching
- [ ] Trả lời được 4/5 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
