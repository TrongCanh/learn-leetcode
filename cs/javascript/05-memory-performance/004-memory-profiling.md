# Memory Profiling — Tìm Và Sửa Memory Leaks

## Câu hỏi mở đầu

```javascript
// App chạy OK lúc đầu
// Sau 1 giờ → chậm dần
// Sau 2 giờ → crash!

// Memory usage tăng đều đặn mỗi action
// Garbage Collector chạy liên tục

// Làm sao tìm được CHÍNH XÁC object nào gây leak?
// Và bao nhiêu memory đang bị leak?
```

**Chrome DevTools Memory tab là công cụ chuẩn để phát hiện và debug memory leaks.** Nắm vững cách dùng sẽ giúp bạn tìm leak trong vài phút thay vì vài ngày. Phần này hướng dẫn chi tiết từng view, workflow thực tế, và cách đọc snapshot như pro.

---

## 1. Memory Tab — Tổng Quan Các Views

### Ba Views Chính

```
┌─────────────────────────────────────────────────────────────┐
│  MEMORY TAB                                                   │
│                                                               │
│  ┌──────────────┬────────────────────────────────────────┐  │
│  │              │                                        │  │
│  │  Heap        │  Heap Snapshot View:                   │  │
│  │  Snapshot    │  Tất cả objects tại thời điểm snapshot │  │
│  │              │  Dùng để: so sánh 2 snapshots          │  │
│  ├──────────────┤                                        │  │
│  │              │                                        │  │
│  │  Allocation   │  Allocation Timeline:                 │  │
│  │  Timeline     │  Objects được allocate theo thời gian │  │
│  │              │  Dùng để: tìm objects chưa được GC'd   │  │
│  ├──────────────┤                                        │  │
│  │              │                                        │  │
│  │  Allocation   │  Allocation Profile (Sampler):        │  │
│  │  Profile      │  Recording JS execution + memory      │  │
│  │  (Sampler)    │  Dùng để: xem code gây allocation nhiều│  │
│  └──────────────┴────────────────────────────────────────┘  │
```

### Khi Nào Dùng View Nào

```
┌──────────────────────┬──────────────────────────────────────┐
│ HEAP SNAPSHOT        │ Biết app bị leak nhưng không biết    │
│                      │ object nào → So sánh 2 snapshots      │
├──────────────────────┼──────────────────────────────────────┤
│ ALLOCATION TIMELINE  │ Leak xảy ra liên tục theo thời gian │
│                      │ → Xem objects nào CHƯA được GC'd     │
├──────────────────────┼──────────────────────────────────────┤
│ ALLOCATION PROFILE   │ Code gây allocation nhiều nhất       │
│                      │ → Optimize code allocation           │
└──────────────────────┴──────────────────────────────────────┘
```

---

## 2. Heap Snapshot — Chi Tiết

### Snapshot Workflow Hoàn Chỉnh

```javascript
// Step-by-step để tìm leak bằng Heap Snapshot

// 1. Mở DevTools → Memory tab
// 2. Chọn "Heap Snapshot"
// 3. Click "Take snapshot" — baseline snapshot

// 4. Thực hiện action gây leak
// Ví dụ: click button thêm element, mỗi click thêm listener

// 5. Force Garbage Collection
// Click trash icon trong DevTools
// HOẶC: console ta GCLC() nếu có

// 6. Take snapshot lần 2

// 7. So sánh
// Summary view → chọn "Comparison" dropdown
// Filter: objects tăng lên = potential leak sources
```

### Đọc Heap Snapshot — Các Columns

```
┌─────────────────────────────────────────────────────────────┐
│  COLUMN              │ Ý NGHĨA                                │
│──────────────────────┼────────────────────────────────────────│
│  Constructor         │ Loại object (Array, Object, Function) │
│  Distance            │ Khoảng cách từ GC root (near = leak)  │
│  Objects Count       │ Số lượng instances                    │
│  Shallow Size        │ Kích thước object itself (không tính  │
│                      │ references)                            │
│  Retained Size       │ Kích thước object + tất cả objects    │
│                      │ nó giữ lại (quan trọng hơn)           │
└─────────────────────────────────────────────────────────────┘

// Distance column — quan trọng!
Distance = 1-5:   Rất gần GC root → LEAK THƯỜNG GẶP
Distance = 10+:   Xa GC root → thường không phải leak

// Retained Size — kích thước thật sự bị leak
// Nếu Object A (1KB) giữ Object B (10MB)
→ A: Retained Size = ~10MB (không phải 1KB!)
→ Bị leak kèm theo khi A bị leak
```

### Summary vs Containment View

```javascript
// SUMMARY VIEW (default) — tổng hợp theo Constructor
// Tốt để: xem có bao nhiêu Array, Object, Function...

Constructor     | Count | Shallow | Retained
─────────────────────────────────────────────
Array          | 245   | 12.5MB  | 15.2MB   ← Objects tăng nhiều = leak
(10 properties)| 120   | 5.1MB   | 8.3MB
Object         | 389   | 2.1MB   | 3.4MB
Closure        | 156   | 1.2MB   | 2.8MB

// CONTAINMENT VIEW — xem object graph chi tiết
// Tốt để: trace reference chain dẫn đến GC root

//展开:
// Closure (bigData reference)  ← Closure giữ bigData
//   └─ [[Scopes]] → bigData: Array (10MB)  ← ĐÂY LÀ LEAK!
//       [[Scopes]] → Closure giữ bigData
//           └─ [[Scopes]] → ...
```

### Filter Objects

```javascript
// FILTER TRONG HEAP SNAPSHOT

// 1. Filter theo Constructor name
// Gõ "Array" → chỉ hiện Array objects

// 2. Filter theo class name (nếu có)
"MyClass"

// 3. Filter theo property name
// Ví dụ: tìm closures giữ biến "cache"
Filter: "cache"

// 4. Snapshot comparison
// Dropdown: "All objects" | "Objects between snapshot 1 & 2"
// → Chỉ hiện objects khác nhau giữa 2 snapshots

// 5. Retained size filter
// ">1MB" → chỉ hiện objects giữ >1MB
```

---

## 3. Allocation Timeline — Tìm Leak Theo Thời Gian

### Workflow

```javascript
// 1. Chọn "Allocation timeline"
// 2. Click Record (🎤) — bắt đầu ghi
// 3. Thực hiện actions trong app (click, navigate, etc.)
// 4. Click Stop (■)

// Đọc kết quả:
```

```
┌──────────────────────────────────────────────────────────────┐
│  ALLOCATION TIMELINE                                            │
│                                                               │
│  Time ────────────────────────────────────────────────────→  │
│  │                                                              │
│  ▼ Blue bars: objects KHÔNG được GC'd (potential leaks)     │
│  ▼ Gray bars: objects được GC'd (normal, tốt)               │
│                                                               │
│  Blue bar tại "Button Click #5" → object tạo tại click #5  │
│  → Blue bar tồn tại đến cuối timeline                       │
│  → Object đó LEAKED!                                         │
└──────────────────────────────────────────────────────────────┘
```

### Color Coding Chi Tiết

```javascript
// Blue bars (retained objects)
obj = { huge: new Array(1000000) }; // Tạo object lớn
// → Blue bar xuất hiện tại thời điểm này
// → Blue bar kéo dài đến cuối timeline
// → ĐÂY LÀ LEAK!

// Gray bars (already GC'd — good)
function tempComputation() {
  const arr = new Array(1000); // Tạo array nhỏ
  return arr.map(x => x * 2);
}
// → Gray bar xuất hiện khi function call
// → Gray bar biến mất khi function return
// → Array được GC'd → KHÔNG LEAK, BÌNH THƯỜNG
```

### Trace Allocation Trong Code

```javascript
// 1. Click vào blue bar → hiện object details
// 2. Xem "Allocation stack" — code line nào tạo object
// 3. Trace: function nào → call site nào → action nào

// Ví dụ: trace đến button click handler
Allocation Stack:
  at createChart (Chart.js:45)
    at Button.click (index.html:120)
      at HTMLButtonElement.onclick (index.html:118)
        at HTMLDocument.<connected> (index.html:100)

// → Biết chính xác: Button#add → createChart → leak!
```

---

## 4. Allocation Profile — Ai Allocations Nhiều Nhất

### Đọc Profile

```javascript
// 1. Chọn "Allocation profile (sampler)"
// 2. Record → thực hiện actions → Stop

// Kết quả: tất cả functions được gọi + memory allocated

Function                     | Count  | Size
────────────────────────────────────────────────
total                       | 1,245  | 45.2MB
────────────────────────────────────────────────
▼ processItems              | 120    | 15.3MB
  ▼ forEach                 | 890    | 12.1MB
      createObject           | 890    | 8.9MB   ← VẤN ĐỀ!
  ▼ array.map               | 120    | 3.1MB
      cloneDeep              | 120    | 3.1MB   ← Allocations nhiều!
▼ renderChart               | 50     | 12.4MB
    allocateBuffer           | 50     | 10.2MB
```

### Tối Ưu Allocations Từ Profile

```javascript
// Sau khi xem profile → biết code nào allocate nhiều

// ❌ Problem: createObject trong loop → allocation nhiều
function processItems(items) {
  return items.map(item => {
    const obj = new Object();  // Mỗi item → 1 object mới!
    obj.id = item.id;
    obj.data = item.data;
    return obj;
  });
}

// ✅ Fix: reuse object
function processItems(items) {
  return items.map(item => ({
    id: item.id,
    data: item.data
  }));
}

// ✅ Fix: pooled allocation cho high-frequency objects
class ObjectPool {
  constructor(factory, initialSize = 100) {
    this.pool = [];
    this.factory = factory;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire() {
    return this.pool.pop() || this.factory();
  }

  release(obj) {
    this.pool.push(obj);
  }
}

const pool = new ObjectPool(() => ({ id: 0, data: null }));
const obj = pool.acquire();
// ... use ...
pool.release(obj);
```

---

## 5. Common Leak Patterns — Tìm Trong Profiler

### Pattern 1: Array Growth

```javascript
// SYMPTOM: Array constructor count tăng liên tục
// Heap Snapshot → Filter: "Array"
// Objects Count tăng mỗi action

// SOURCE:
function onMessage(data) {
  results.push(data); // results tăng mãi mãi!
}

// FIX:
const results = [];
const MAX_RESULTS = 1000;

function onMessage(data) {
  results.push(data);
  if (results.length > MAX_RESULTS) {
    results.shift(); // hoặc: results = results.slice(-MAX_RESULTS);
  }
}
```

### Pattern 2: Closure Giữ bigData

```javascript
// SYMPTOM: Closure objects count tăng
// Retained size lớn (vài MB mỗi closure)

// SOURCE:
function createHandler(data) {
  const bigData = loadHeavyData(); // 10MB

  return function handler() {
    return bigData.value; // Giữ bigData mãi mãi!
  };
}

// FIX: chỉ capture những gì cần
function createHandler(data) {
  const neededValue = data.critical; // chỉ 1 primitive
  const bigData = loadHeavyData();

  return function handler() {
    return neededValue; // bigData có thể GC sau khi load xong?
  };
}

// TỐT HƠN: tách ra
function createHandler(criticalValue) {
  return function handler() {
    return criticalValue; // chỉ capture primitive
  };
}

// Usage:
const handler = createHandler(data.critical);
// bigData không bị closure giữ → được GC
```

### Pattern 3: Detached DOM Tree

```javascript
// SYMPTOM: Detached DOM tree trong Heap Snapshot
// Heap Snapshot → Filter: "Detached"
// Hiện DOM nodes đã remove khỏi DOM nhưng vẫn trong memory

// SOURCE:
const detachedNodes = [];
elements.forEach(el => {
  const clone = el.cloneNode(true);
  detachedNodes.push(clone); // Giữ reference sau khi remove
});

// Remove từ DOM nhưng vẫn trong array
container.innerHTML = ''; // DOM nodes removed
// detachedNodes vẫn giữ tất cả!

// FIX:
function removeOldElement(newElement) {
  const old = container.querySelector('.active');
  if (old) {
    old.remove(); // DOM remove
    // old không còn reference → GC'd
  }
  container.appendChild(newElement);
}
```

### Pattern 4: Event Listener Không Remove

```javascript
// SYMPTOM: (事件监听器) listener count tăng mỗi action

// SOURCE:
function onClick() {
  // ⚠️ Mỗi click thêm listener mới!
  button.addEventListener('click', function() {
    console.log(heavyData); // Giữ heavyData
  });
}

// FIX:
const handler = function() {
  console.log(heavyData);
};
button.addEventListener('click', handler);
// Khi cleanup:
button.removeEventListener('click', handler);
```

### Pattern 5: Global Cache Không Limit

```javascript
// SYMPTOM: Map/Object count tăng, Retained Size tăng

// SOURCE:
const cache = new Map();

function getData(id) {
  if (!cache.has(id)) {
    cache.set(id, fetchExpensive(id)); // Cache vĩnh viễn!
  }
  return cache.get(id);
}

// FIX:
const cache = new Map();
const MAX_CACHE = 500;

function getData(id) {
  if (cache.has(id)) {
    return cache.get(id);
  }

  if (cache.size >= MAX_CACHE) {
    // LRU: xóa entry cũ nhất
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }

  const data = fetchExpensive(id);
  cache.set(id, data);
  return data;
}

// HOẶC: dùng WeakMap cho object keys
const weakCache = new WeakMap();
function getData(obj) {
  if (weakCache.has(obj)) {
    return weakCache.get(obj);
  }
  const data = compute(obj);
  weakCache.set(obj, data);
  return data;
}
// obj bị GC → entry trong WeakMap tự động bị xóa!
```

---

## 6. Node.js Memory Profiling

### heapSnapshot Trong Node.js

```javascript
// Node.js: tạo heap snapshot bằng code
const v8 = require('v8');
const fs = require('fs');

// Tạo snapshot
const filename = v8.writeHeapSnapshot('./heapdump.heapsnapshot');
console.log('Snapshot written to:', filename);

// Hoặc dùng CLI:
node --inspect app.js
// → Mở chrome://inspect → Memory → Heap Snapshots

// Dùng clinic.js:
npx clinic heapprofiler -- node app.js
// → Tự động tạo snapshot và visualize
```

### Chrome DevTools Remote Debugging

```javascript
// 1. Chạy Node.js với --inspect
node --inspect app.js

// 2. Mở Chrome → chrome://inspect
// 3. Click "Configure" → thêm localhost:9229
// 4. Click "Inspect" bên dưới target
// 5. DevTools mở ra → Memory tab → Heap Snapshot

// Hoặc dùng DevTools Protocol:
const inspector = require('inspector');
inspector.open(9229, 'localhost', true);
const session = new inspector.Session();
session.connect();
session.post('HeapProfiler.takeHeapSnapshot', (err, snapshot) => {
  // snapshot file path
});
```

### memwatch-next Cho Production

```javascript
// npm install memwatch-next

import memwatch from 'memwatch';

// Leak detection
memwatch.on('leak', (info) => {
  console.error('Memory leak detected:', info);
  console.error('Growth:', info.growth);
  console.error('Difference:', info.diff);
});

// Heap diff — so sánh 2 snapshots
const hd = new memwatch.HeapDiff();

setTimeout(() => {
  const diff = hd.end();
  console.log('Heap diff:', JSON.stringify(diff, null, 2));

  // Chi tiết:
  diff.change.details.forEach(change => {
    if (change['+'] > 0) {
      console.log(`+ ${change['+']} ${change.what}`);
    }
  });
}, 60000);
```

---

## 7. Memory Leak Investigation Workflow

### Quy Trình 5 Bước

```
BƯỚC 1: XÁC ĐỊNH CÓ LEAK
─────────────────────────
1. Mở Performance Monitor
2. Thực hiện action 10-20 lần (click, navigate, etc.)
3. Watch: JS Heap size tăng liên tục?
   → CÓ: có leak
   → KHÔNG: không leak, có thể GC bình thường

BƯỚC 2: TÌM OBJECT GÂY LEAK
──────────────────────────────
1. Heap Snapshot #1 (baseline)
2. Thực hiện action gây leak
3. Force GC
4. Heap Snapshot #2
5. Comparison view
6. Filter: objects count tăng = leak source

BƯỚC 3: TRACE REFERENCE CHAIN
──────────────────────────────
1. Click vào leaking object
2. Xem Object retainer chain (Containment view)
3. Tìm: object → (property) → ... → GC root
4. Xác định: variable nào giữ reference?

BƯỚC 4: FIX
───────────
Dựa trên pattern:
- Closures: chỉ capture những gì cần
- Arrays: thêm limit hoặc cleanup
- Event listeners: removeEventListener
- Global cache: WeakMap hoặc limit size

BƯỚC 5: VERIFY
──────────────
1. Fix code
2. Heap Snapshot #3
3. So sánh #1 và #3
4. Objects count không còn tăng → FIX THÀNH CÔNG
```

### Performance Monitor

```javascript
// DevTools → Performance Monitor (trong Performance tab)

// Các metrics cần watch:
// JS Heap Size: → tăng = leak indicator
// DOM Nodes: → tăng = detached DOM
// Event Listeners: → tăng = listeners không removed

// Workflow:
1. Record Performance (1-2 minutes)
2. Thực hiện action cyclically
3. Stop → xem Timeline
4. JS Heap tăng đều đặn = leak
```

---

## 8. Các Traps Phổ Biến

### Trap 1: console.log Giữ References

```javascript
// ❌ console.log có thể giữ references
const data = { huge: new Array(1000000) };
console.log(data); // DevTools console giữ reference!

// Fix: serialize trước
console.log(JSON.stringify(data)); // Không giữ reference
console.log('Size:', data.huge.length); // Chỉ log cần thiết

// ⚠️ debugger; cũng giữ references!
```

### Trap 2: Force GC Không Hoạt Động

```javascript
// ❌ Gọi delete sau đó expect GC ngay
delete bigObject;
globalRef = null;
// GC chạy non-deterministic
// → Đợi hoặc trigger bằng DevTools

// ✅ Test leak trong DevTools:
// DevTools → Memory → click trash icon (Force GC)
// Hoặc: trong console:
// %gegc()  // undocumented V8 method
```

### Trap 3: Snapshot Quá Lớn

```javascript
// ❌ App lớn → snapshot có thể >1GB → DevTools chậm/kill

// ✅ Solutions:
// 1. Record allocation timeline thay vì snapshot
// 2. Snapshot sau khi isolate specific action
// 3. Dùng sampling profile thay vì full snapshot
// 4. Dùng DevTools Protocol để snapshot phần cần:
session.post('HeapProfiler.getObjectByHeapObjectId', { objectId }, cb);
```

### Trap 4: WeakRefs/WeakMap Confusion

```javascript
// ❌ Dùng Map thay vì WeakMap cho object keys
const cache = new Map();
function getData(key) {
  if (!cache.has(key)) {
    cache.set(key, compute(key));
  }
  return cache.get(key);
}

// key bị null/undefined nhưng vẫn trong Map → memory leak!

// ✅ Dùng WeakMap
const cache = new WeakMap();
function getData(key) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  const data = compute(key);
  cache.set(key, data);
  return data;
}
// key bị GC → WeakMap entry tự động bị xóa!

// ⚠️ WeakMap chỉ work với object keys, không work với primitive keys
```

### Trap 5: Symbol Key Trong Objects

```javascript
// Symbols as keys có thể gây confusion khi đọc snapshot
const key = Symbol('private');
obj[key] = { bigData: new Array(100000) };

// Heap snapshot: Symbol không hiện rõ trong filter
// → Có thể bỏ sót leak sources

// ✅ Tránh symbol keys cho data cần track memory
// Hoặc thêm debugger label:
const key = Symbol.for('cache');
// Có thể lookup bằng Symbol.for('cache')
```

---

## 9. Câu Hỏi Phỏng Vấn

### Câu 1: Làm sao detect memory leak trong JavaScript?

**Trả lời:** (1) **Performance Monitor**: watch JS Heap size tăng đều đặn sau nhiều actions. (2) **Heap Snapshot comparison**: take 2 snapshots trước/sau action, compare tìm objects tăng. (3) **Allocation Timeline**: xem objects nào không được GC'd. (4) **Allocation Profile**: xem code gây allocation nhiều nhất. (5) **DevTools + memwatch (Node.js)**: production leak detection.

---

### Câu 2: Heap Snapshot Comparison hoạt động thế nào?

**Trả lời:** Snapshot #1 lưu tất cả objects. Snapshot #2 lưu objects mới. Comparison view trừ 2 snapshots: (1) Objects có trong #2 nhưng không trong #1 = delta tăng. (2) Filter theo constructor → objects tăng theo loại. (3) Distance column: gần GC root = leak thường gặp. (4) Retained size: kích thước thật sự bị leak.

---

### Câu 3: Closure leak khác gì Detached DOM leak?

**Trả lời:** **Closure leak**: closure giữ reference đến object lớn (bigData), object không thể GC dù không còn DOM reference. Heap Snapshot: Closure + bigData retained. **Detached DOM leak**: DOM node bị remove khỏi DOM tree nhưng JavaScript vẫn giữ reference (trong Map, array, variable). Heap Snapshot: Detached DOM nodes. Fix closure leak: chỉ capture primitive cần. Fix detached DOM: remove reference hoặc cleanup.

---

### Câu 4: WeakMap vs Map cho caching?

**Trả lời:** WeakMap: keys phải là objects, entries tự động bị xóa khi key bị GC. Dùng khi: cache theo object instances, không cần manual cleanup. Map: keys có thể là bất kỳ type, entries tồn tại vĩnh viễn. Dùng khi: cần cache theo primitive keys, hoặc cần control lifetime của entries. Performance: WeakMap slightly chậm hơn nhưng tự động cleanup.

---

### Câu 5: Production memory leak detection như thế nào?

**Trả lời:** (1) **Heap snapshots on-demand**: dùng DevTools Protocol gọi `takeHeapSnapshot` trong production. (2) **memwatch-next (Node.js)**: tự động detect leak growth patterns, emit events. (3) **Clinic.js / 0x**: visualize production heap. (4) **Custom metrics**: theo dõi `process.memoryUsage().heapUsed` trong interval, alert khi tăng. (5) **ErrorBudget / SLAs**: alert nếu memory tăng quá threshold sau X requests.

---

### Câu 6: Distance trong Heap Snapshot là gì?

**Trả lời:** Distance = số bước từ GC root đến object. GC root = global objects, stack frames đang chạy. Distance càng nhỏ → object càng gần GC root → leak thường gặp. Objects có Distance 1-5: thường là closures, global variables. Distance cao (20+): objects được reach qua nhiều chain, ít khả năng leak. Filter theo Distance giúp isolate leak sources nhanh hơn.

---

## 10. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  MEMORY PROFILING                                              │
│                                                               │
│  TOOLS                                                         │
│  ├── Performance Monitor: quick check leak existence        │
│  ├── Heap Snapshot: so sánh 2 snapshots                   │
│  ├── Allocation Timeline: objects theo thời gian          │
│  └── Allocation Profile: ai allocation nhiều nhất        │
│                                                               │
│  WORKFLOW                                                      │
│  ├── 1. Xác định có leak (Performance Monitor)              │
│  ├── 2. Tìm object gây leak (Snapshot comparison)         │
│  ├── 3. Trace reference chain (Containment view)            │
│  ├── 4. Fix theo pattern                                     │
│  └── 5. Verify bằng snapshot mới                          │
│                                                               │
│  COMMON PATTERNS                                              │
│  ├── Array growth: thêm limit/cleanup                      │
│  ├── Closure: chỉ capture cần thiết                      │
│  ├── Detached DOM: remove reference                        │
│  ├── Event listeners: removeEventListener                 │
│  └── Global cache: WeakMap hoặc limit size              │
│                                                               │
│  ⚠️ console.log giữ references — serialize trước      │
│  ⚠️ Force GC = trash icon trong DevTools               │
│  ⚠️ Distance nhỏ = leak gần GC root               │
│  ⚠️ Production: dùng memwatch/clinic               │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Mở được DevTools Memory tab và sử dụng 3 views
- [ ] Take và compare được 2 Heap Snapshots
- [ ] Đọc được Retained Size và Distance columns
- [ ] Trace được reference chain trong Containment view
- [ ] Nhận diện được 5 common leak patterns
- [ ] Dùng được WeakMap cho caching objects
- [ ] Sử dụng được memwatch-next cho Node.js
- [ ] Trả lời được 5/6 câu hỏi phỏng vấn
- [ ] Hoàn thành full memory leak investigation workflow

---

*Last updated: 2026-04-01*
