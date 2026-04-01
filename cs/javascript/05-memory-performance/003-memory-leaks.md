# Memory Leaks — 5 Nguồn Rò Rỉ Phổ Biến

## Câu hỏi mở đầu

```javascript
// App chạy 5 phút → OK
// App chạy 1 giờ → chậm dần
// App chạy 1 ngày → crash!

// Memory usage tăng đều đặn mỗi action
// Garbage Collector chạy liên tục
// Heap size tăng không ngừng

// Memory leak = object vẫn trong memory dù không còn cần
// → GC không thể thu hồi vì vẫn có reference
```

**Memory leak xảy ra khi object không còn cần nhưng GC không thể thu hồi vì code vẫn giữ reference.** Hiểu 5 nguồn leak phổ biến và cách fix sẽ giúp bạn debug và prevent leaks hiệu quả.

---

## 1. Leak #1 — Forgotten Timers

### setInterval — Leak Phổ Biến Nhất

```javascript
// ❌ Timer giữ reference vĩnh viễn
const bigData = new Array(100_000).fill('x'); // 10MB

setInterval(() => {
  if (condition) {
    processData(bigData); // bigData không thể GC!
  }
}, 1000);

// → interval callback giữ bigData
// → bigData KHÔNG bao giờ được GC
// → Timer chạy mãi → leak mãi!

// ✅ Fix: clearInterval khi không cần
let timerId;

function startProcessing() {
  const bigData = new Array(100_000).fill('x');

  timerId = setInterval(() => {
    if (condition) {
      processData(bigData);
    }
  }, 1000);
}

function stopProcessing() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
    // bigData bây giờ được GC (nếu không có references khác)
  }
}
```

### setTimeout Closure Leak

```javascript
// ❌ Closure giữ tất cả scope
function processWithDelay(data) {
  setTimeout(() => {
    doSomething(data); // Closure giữ data
  }, 5000);
}

// data được truyền vào → closure giữ
// → setTimeout pending → data không thể GC

// ✅ Fix: chỉ truyền những gì cần
function processWithDelay(data) {
  const neededValue = data.critical; // chỉ capture primitive
  setTimeout(() => {
    doSomething(neededValue);
  }, 5000);
}
```

### Cleanup Pattern Hoàn Chỉnh

```javascript
class Component {
  constructor() {
    this.timers = [];
    this.bigData = new Array(100_000).fill('x');
  }

  start() {
    // Lưu timer IDs
    const timer1 = setInterval(() => this.tick1(), 1000);
    const timer2 = setInterval(() => this.tick2(), 5000);
    const timer3 = setTimeout(() => this.delayed(), 3000);

    this.timers.push(timer1, timer2, timer3);
  }

  stop() {
    // Clear ALL timers
    this.timers.forEach(id => clearInterval(id));
    this.timers = [];

    // Nullify references
    this.bigData = null;
  }

  // React use case
  useEffect(() => {
    this.start();
    return () => this.stop(); // Cleanup on unmount
  });
}
```

---

## 2. Leak #2 — Closures

### Closure Giữ Toàn Bộ Scope

```javascript
// ❌ Closure giữ reference đến entire object
function createHandler() {
  const config = loadHeavyConfig(); // 10MB

  return function handler() {
    return config.version; // Chỉ cần version, nhưng giữ cả config!
  };
}

// config không thể GC vì handler closure tham chiếu
// → 10MB leak PER handler!

// ✅ Fix: chỉ capture những gì cần
function createHandler() {
  const config = loadHeavyConfig();
  const version = config.version; // Chỉ capture primitive

  return function handler() {
    return version; // Chỉ giữ version
  };
}
```

### Closures Trong Event Handlers

```javascript
// ❌ Mỗi click tạo closure giữ bigData
function attachHandlers() {
  const bigData = loadHeavyData(); // 5MB

  // Mỗi button click → closure giữ bigData
  buttons.forEach(button => {
    button.addEventListener('click', function() {
      console.log(bigData.length); // Closure giữ bigData!
    });
  });

  // bigData không thể GC vì tất cả handlers tham chiếu
}

// ✅ Fix 1: removeEventListener
function createHandlers() {
  const bigData = loadHeavyData();

  const handler = function() {
    console.log(bigData.length);
  };

  buttons.forEach(button => {
    button.addEventListener('click', handler);
  });

  // Export để cleanup
  return {
    cleanup() {
      buttons.forEach(button => {
        button.removeEventListener('click', handler);
      });
      bigData = null;
    }
  };
}

// ✅ Fix 2: WeakMap cho object references
const handlerCache = new WeakMap();

function createHandler(element, data) {
  const handler = function() {
    console.log(data.critical);
  };
  handlerCache.set(element, handler);
  element.addEventListener('click', handler);
  return handler;
}
```

### Closures Trong Loops

```javascript
// ❌ Closure trong loop — biến i SHARED
for (var i = 0; i < 3; i++) {
  setTimeout(function() {
    console.log(i); // Luôn in 3! Closure shared biến i
  }, 100);
}

// ✅ Fix: let (block-scoped)
for (let i = 0; i < 3; i++) {
  setTimeout(function() {
    console.log(i); // 0, 1, 2 ✅
  }, 100);
}

// ✅ Fix: IIFE (tạo scope riêng)
for (var i = 0; i < 3; i++) {
  (function(index) {
    setTimeout(function() {
      console.log(index); // 0, 1, 2 ✅
    }, 100);
  })(i);
}
```

---

## 3. Leak #3 — Global Variables

### Implicit Globals

```javascript
// ❌ Quên khai báo → global variable!
function processData() {
  result = computeHeavy(); // Quên const/let/var!
  // → window.result = ... → global → NEVER GC!
}

// ✅ Fix: luôn khai báo
function processData() {
  const result = computeHeavy(); // Local → GC khi function return
  return result;
}

// ✅ ESLint rule: no-undef
```

### Global Caches Không Giới Hạn

```javascript
// ❌ Cache tăng mãi mãi
const cache = {};

function getData(id) {
  if (!cache[id]) {
    cache[id] = fetchExpensive(id); // Lưu vĩnh viễn!
  }
  return cache[id];
}

// → Cache không bao giờ bị xóa
// → Cache tăng = memory leak

// ✅ Fix 1: Giới hạn size
const cache = {};
const MAX_CACHE = 500;

function getData(id) {
  if (cache[id]) return cache[id];

  if (Object.keys(cache).length >= MAX_CACHE) {
    // LRU: xóa entry cũ nhất
    const firstKey = Object.keys(cache)[0];
    delete cache[firstKey];
  }

  cache[id] = fetchExpensive(id);
  return cache[id];
}

// ✅ Fix 2: LRU Cache
class LRUCache {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;

    const value = this.cache.get(key);
    this.cache.delete(key);      // Remove
    this.cache.set(key, value);  // Re-add to end (most recent)
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Delete oldest (first) entry
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, value);
  }
}

// ✅ Fix 3: WeakMap cho object keys
const weakCache = new WeakMap();

function getData(obj) {
  if (weakCache.has(obj)) {
    return weakCache.get(obj);
  }

  const data = compute(obj);
  weakCache.set(obj, data);
  return data;
}
// obj bị GC → WeakMap entry tự động bị xóa!
```

### Global Event Bus Leak

```javascript
// ❌ Global event bus giữ references
const EventEmitter = require('events');
const globalBus = new EventEmitter();

function onUserLogin(user) {
  globalBus.on('logout', () => {
    console.log(user.profile); // Closure giữ user
  });
}

// → Mỗi user login → 'logout' listener thêm
// → user không thể GC vì listener giữ
// → EVENT BUS LEAK!

// ✅ Fix: remove listener hoặc dùng WeakMap
const globalBus = new EventEmitter();
const userCleanup = new WeakMap();

function onUserLogin(user) {
  const handler = () => {
    console.log(user.profile);
  };

  globalBus.on('logout', handler);
  userCleanup.set(user, handler);
}

function onUserLogout(user) {
  const handler = userCleanup.get(user);
  if (handler) {
    globalBus.off('logout', handler);
    userCleanup.delete(user);
  }
}
```

---

## 4. Leak #4 — Detached DOM Nodes

### DOM Reference Trong Array

```javascript
// ❌ Lưu DOM element reference
const elements = [];

function addElement() {
  const el = document.createElement('div');
  elements.push(el); // Giữ reference vĩnh viễn
  document.body.appendChild(el);
}

function removeAllElements() {
  document.body.innerHTML = ''; // DOM remove
  // elements[] vẫn giữ tất cả references!
  elements.length = 0; // PHẢI clear!
}

// ✅ Fix: cleanup array khi remove
function removeAllElements() {
  document.body.innerHTML = '';
  elements.length = 0; // Clear reference
}

// ✅ Hoặc dùng WeakSet
const elements = new WeakSet();

function addElement() {
  const el = document.createElement('div');
  elements.add(el);
  document.body.appendChild(el);
}

function removeAllElements() {
  document.body.innerHTML = '';
  // elements tự cleanup khi DOM nodes bị GC
}
```

### Closure + DOM Leak

```javascript
// ❌ Closure giữ element + data
function attachChartHandler() {
  const element = document.getElementById('chart');
  const chartData = loadHeavyChartData(); // 50MB!

  element.addEventListener('click', function() {
    renderChart(chartData); // Closure giữ cả element và chartData
  });

  element.remove(); // DOM remove
  // Event listener vẫn giữ element và chartData!
  // → DETACHED DOM + MEMORY LEAK!
}

// ✅ Fix: removeEventListener
function attachChartHandler() {
  const element = document.getElementById('chart');
  const chartData = loadHeavyChartData();

  const handler = function() {
    renderChart(chartData);
  };

  element.addEventListener('click', handler);

  // Return cleanup function
  return function cleanup() {
    element.removeEventListener('click', handler);
    element.remove();
    chartData = null; // Giờ mới được GC
  };
}
```

### MutationObserver Không Disconnect

```javascript
// ❌ Observer không stopped
const observer = new MutationObserver(mutations => {
  processNodes(mutations, bigData); // Closure giữ bigData
});

observer.observe(document.body, { childList: true });

// → Observer chạy mãi
// → Closure giữ bigData
// → LEAK!

// ✅ Fix: disconnect khi không cần
function startObserver() {
  const observer = new MutationObserver(mutations => {
    processNodes(mutations, bigData);
  });

  observer.observe(document.body, { childList: true });

  return function stopObserver() {
    observer.disconnect(); // Stop observer
    bigData = null;
  };
}

// ✅ React useEffect cleanup
useEffect(() => {
  const observer = new MutationObserver(callback);

  observer.observe(targetNode, config);

  return () => {
    observer.disconnect(); // Cleanup!
  };
}, []);
```

---

## 5. Leak #5 — Event Listeners

### Dynamic Listeners Không Remove

```javascript
// ❌ Listener tích lũy mỗi call
function onClick() {
  button.addEventListener('click', function() {
    console.log(heavyData); // Mỗi call → thêm listener
  });
}

// 10 clicks → 10 listeners cùng giữ heavyData!

// ✅ Fix: remove trước khi add
function onClick() {
  button.removeEventListener('click', handler); // Remove cũ
  button.addEventListener('click', handler);   // Add mới
}

// ✅ Fix: singleton handler
class ButtonManager {
  constructor() {
    this.handler = this.handleClick.bind(this);
    this.heavyData = loadHeavyData();
  }

  attach(button) {
    button.addEventListener('click', this.handler);
  }

  detach(button) {
    button.removeEventListener('click', this.handler);
  }

  handleClick() {
    console.log(this.heavyData);
  }
}
```

### Event Delegation Thay Vì Nhiều Listeners

```javascript
// ❌ Nhiều listeners cho từng element
function attachHandlers(items) {
  items.forEach(item => {
    const handler = () => processItem(item);
    item.addEventListener('click', handler); // Mỗi item → listener
  });
}

// ✅ Event delegation: 1 listener cho container
function attachDelegatedHandler(container) {
  container.addEventListener('click', (event) => {
    const item = event.target.closest('.item');
    if (item) {
      processItem(item);
    }
  });
}
```

### Window/Document Event Listeners

```javascript
// ❌ Global listeners không cleanup
window.addEventListener('resize', handleResize);
window.addEventListener('scroll', handleScroll);
document.addEventListener('visibilitychange', handleVisibility);

// → Chạy mãi ngay cả khi component unmount!

// ✅ Always cleanup
function Component() {
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
}

// ✅ Hoặc dùng AbortController
useEffect(() => {
  const controller = new AbortController();

  window.addEventListener('resize', handler, { signal: controller.signal });
  window.addEventListener('scroll', handler, { signal: controller.signal });

  return () => controller.abort(); // Remove all listeners!
});
```

---

## 6. Detecting Leaks — Tools và Techniques

### Chrome DevTools Memory Tab

```javascript
// Step 1: Performance Monitor
// Thực hiện action 10-20 lần
// Watch: JS Heap size tăng liên tục = leak

// Step 2: Heap Snapshot
// 1. Take snapshot #1 (baseline)
// 2. Thực hiện action gây leak
// 3. Force GC (trash icon)
// 4. Take snapshot #2
// 5. Comparison: objects tăng = leak source

// Step 3: Allocation Timeline
// 1. Record → thực hiện action → Stop
// 2. Blue bars = objects NOT GC'd (potential leaks)
```

### Snapshot Comparison Workflow

```
SNAPSHOT #1 ────────────────── SNAPSHOT #2 ─────────── COMPARISON
                                                                        │
Objects:                                  Objects:                           │
  Array: 100                               Array: 150  (+50) ← LEAK!      │
  Closure: 50                              Closure: 55  (+5)               │
  Object: 200                              Object: 200  (0)                │
                                                                        │
Delta: Array count tăng +50 → Tìm source                    │
```

### Node.js Memory Profiling

```javascript
// V8 heap snapshot
const v8 = require('v8');
const fs = require('fs');

// Tạo snapshot
const filename = v8.writeHeapSnapshot('./heapdump.heapsnapshot');
console.log('Snapshot:', filename);

// Load snapshot trong Chrome DevTools
// → Memory → Load snapshot → Phân tích

// memwatch-next
const memwatch = require('memwatch-next');

memwatch.on('leak', (info) => {
  console.error('Leak detected:', info);
  console.error('Growth:', info.growth);
  console.error('Diff:', info.diff);
});

// Heap diff
const hd = new memwatch.HeapDiff();
setTimeout(() => {
  const diff = hd.end();
  console.log('Changes:', diff.change);

  diff.change.details.forEach(d => {
    if (d['+'] > 0) {
      console.log(`+ ${d['+']} ${d.what}`);
    }
  });
}, 60000);
```

### Leak Detection Patterns

```javascript
// Memory threshold monitoring
function startLeakDetection(name, thresholdMB = 100) {
  let baseline = null;
  let checks = 0;

  function check() {
    const { heapUsed } = process.memoryUsage();
    const heapMB = heapUsed / 1024 / 1024;

    if (baseline === null) {
      baseline = heapMB;
    }

    checks++;
    const growth = heapMB - baseline;

    if (growth > thresholdMB && checks > 5) {
      console.error(`LEAK: ${name} - ${growth.toFixed(2)}MB growth`);
      // Alert / dump snapshot
      const file = v8.writeHeapSnapshot(`./leak-${Date.now()}.heapsnapshot`);
      console.log('Snapshot:', file);
    }

    setTimeout(check, 60000); // Check every minute
  }

  setTimeout(check, 60000);
}
```

---

## 7. Các Traps Phổ Biến

### Trap: console.log Giữ References

```javascript
// ❌ console.log giữ references trong DevTools
const big = new Array(10_000_000);
console.log(big); // DevTools console giữ reference!
big = null; // big có thể vẫn trong console memory!

// ✅ Serialize trước
console.log(JSON.stringify({ size: big.length })); // OK

// ✅ Chỉ log metadata
console.log('Big array size:', big.length);
```

### Trap: debugger; Giữ References

```javascript
// ❌ debugger; pauses và giữ tất cả references
function process() {
  const data = new Array(100_000);
  debugger; // Pauses và giữ data
  return data.length;
}
```

### Trap: WeakRef Confusing Behavior

```javascript
// ❌ WeakRef không đảm bảo object sẽ bị GC ngay
const ref = new WeakRef({ data: 'test' });

console.log(ref.deref()); // { data: 'test' } hoặc undefined
// → Có thể undefined sau khi deref() = GC đã chạy

// ✅ WeakRef cho cache với fallback
const cache = new Map();

function getCached(obj) {
  const ref = cache.get(obj);
  const cached = ref?.deref();

  if (cached) return cached;

  const computed = compute(obj);
  cache.set(obj, new WeakRef(computed));
  return computed;
}
```

---

## 8. Câu Hỏi Phỏng Vấn

### Câu 1: Những nguồn memory leak phổ biến nhất?

**Trả lời:** 5 nguồn phổ biến: (1) **Forgotten timers**: setInterval/setTimeout không clear. (2) **Closures**: closure giữ toàn bộ scope thay vì chỉ những gì cần. (3) **Global variables**: implicit globals, unbounded caches. (4) **Detached DOM nodes**: DOM removed nhưng JavaScript vẫn giữ reference. (5) **Event listeners**: listeners không remove, đặc biệt trong SPA components.

---

### Câu 2: Closures leak khác detached DOM leak?

**Trả lời:** **Closure leak**: closure giữ reference đến object lớn (bigData), object không thể GC dù DOM đã remove. Detected: closure + retained size lớn trong Heap Snapshot. **Detached DOM leak**: DOM node bị remove khỏi DOM tree nhưng JavaScript vẫn giữ reference (trong Map, array, variable). Detected: "Detached DOM tree" filter trong Heap Snapshot. Fix closure leak: chỉ capture primitives. Fix detached DOM: remove JavaScript references.

---

### Câu 3: Event listener cleanup best practices?

**Trả lời:** (1) **Always cleanup**: mọi addEventListener cần removeEventListener. (2) **useEffect cleanup**: trong React, return cleanup function. (3) **AbortController**: `signal` option cho multiple listeners. (4) **Component pattern**: class với attach/detach methods. (5) **Event delegation**: 1 listener cho container thay vì nhiều listeners. (6) **Weak references**: WeakMap cho object keys.

---

### Câu 4: Debug memory leak trong production?

**Trả lời:** (1) **Heap snapshots on-demand**: dùng DevTools Protocol gọi `takeHeapSnapshot`. (2) **memwatch-next (Node.js)**: tự động detect leak growth. (3) **Metrics**: monitor `process.memoryUsage().heapUsed`, alert khi tăng. (4) **Allocation timeline**: record trong staging, analyze leak patterns. (5) **Code review**: checklist cho timers, listeners, caches.

---

### Câu 5: LRU Cache vs WeakMap?

**Trả lời:** **LRU Cache**: keys có thể là bất kỳ type, entries tồn tại vĩnh viễn (hoặc đến khi evicted). Dùng khi: cần control lifetime, keys là primitives. **WeakMap**: keys phải là objects, entries tự động bị xóa khi key bị GC. Dùng khi: cache theo object instances, không cần manual eviction. WeakMap tự động cleanup.

---

## 9. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  MEMORY LEAKS                                                 │
│                                                               │
│  5 NGUỒN RÒ RỈ                                              │
│  ├── Forgotten Timers — setInterval/setTimeout không clear │
│  │   Fix: clearInterval/clearTimeout, save timer IDs      │
│  ├── Closures — giữ toàn bộ scope                       │
│  │   Fix: chỉ capture primitives cần thiết            │
│  ├── Global Variables — implicit globals, unbounded cache  │
│  │   Fix: const/let, LRU cache, WeakMap                 │
│  ├── Detached DOM — element removed nhưng còn ref     │
│  │   Fix: remove JavaScript references, WeakSet       │
│  └── Event Listeners — không remove, tích lũy        │
│      Fix: removeEventListener, cleanup functions     │
│                                                               │
│  DETECTION                                                    │
│  ├── Performance Monitor: JS Heap tăng theo thời gian    │
│  ├── Heap Snapshot: so sánh 2 snapshots               │
│  ├── Allocation Timeline: objects not GC'd              │
│  └── Node.js: memwatch-next, v8.writeHeapSnapshot  │
│                                                               │
│  PREVENTION                                                   │
│  ├── Timers: luôn lưu timer IDs, clear khi cleanup  │
│  ├── Closures: chỉ capture những gì cần                │
│  ├── Caches: LRU hoặc WeakMap với limits            │
│  ├── DOM: WeakSet hoặc manual cleanup                 │
│  └── Events: AbortController hoặc cleanup functions   │
│                                                               │
│  ⚠️ Luôn cleanup: timers, listeners, observers         │
│  ⚠️ console.log/debugger giữ references              │
│  ⚠️ WeakRef không đảm bảo GC ngay lập tức         │
│  ⚠️ DevTools: Force GC = trash icon trước snapshot  │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Nhận diện được 5 nguồn leak phổ biến
- [ ] Fix được leak từ setInterval
- [ ] Fix được closure leak
- [ ] Fix được global cache leak
- [ ] Fix được detached DOM leak
- [ ] Fix được event listener leak
- [ ] Sử dụng được Heap Snapshot để detect leaks
- [ ] Implement được LRU Cache và WeakMap patterns
- [ ] Trả lời được 4/5 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
