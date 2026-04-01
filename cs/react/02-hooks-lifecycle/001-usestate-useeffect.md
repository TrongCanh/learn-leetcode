# useState & useEffect — Internals Chi Tiết

## Câu hỏi mở đầu

```jsx
// Bạn viết form với 3 fields:
function Form() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState(0);

  useEffect(() => {
    // fetch user data
    setName('Alice');
    setEmail('alice@example.com');
    setAge(30);
  }, []);

  return <div>{/* 3 renders! */}</div>;
}

// ❌ 3 lần setState → 3 lần re-render
// ✅ Gộp thành object state → 1 lần re-render
```

Bạn dùng `useState` và `useEffect` mỗi ngày. Nhưng bạn có biết bên trong chúng hoạt động ra sao? Và tại sao đoạn code trên render 3 lần thay vì 1?

---

## 1. useState — Bản Chất Bên Trong

### Hooks Array

React giữ một **hooks array** cho mỗi component instance:

```
Component Instance "Form"
  │
  ├── Hooks Array (theo thứ tự gọi):
  │     ├── [0] { state: '', setState: fn }   ← useState('')
  │     ├── [1] { state: '', setState: fn }   ← useState('')
  │     ├── [2] { state: 0, setState: fn }   ← useState(0)
  │     └── [3] { effect: fn, deps: [] }    ← useEffect
  │
  └── Re-render: React đọc hooks theo index
```

### Re-render Hoạt Động Như Thế Nào

```jsx
const [name, setName] = useState('');
const [email, setEmail] = useState('');

// Render #1:
useState('') → hooks[0] → state = ''
useState('') → hooks[1] → state = ''

// Render #2 (sau setName('Alice')):
useState('') → hooks[0] → state = 'Alice'  ← lấy từ hooks[0]
useState('') → hooks[1] → state = ''       ← lấy từ hooks[1]
```

**Đây là lý do "Rules of Hooks" tồn tại — thứ tự hooks phải consistent.**

---

## 2. setState — Async & Batching

### Batching Trong React 18+

```jsx
function Form() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    setName('Alice');   // Schedule update
    setEmail('alice@example.com'); // Schedule update
    // React 18+: batched → 1 re-render, không phải 2
  };
}
```

**React 17 và trước**: chỉ batch trong event handlers.
**React 18+**: batch trong tất cả trường hợp (setTimeout, Promises, etc.)

### Functional Updater

```jsx
const [count, setCount] = useState(0);

const handleClick = () => {
  // ❌ 3 setState với giá trị trực tiếp — stale!
  setCount(count + 1);  // read count=0
  setCount(count + 1);  // read count=0 (stale!)
  setCount(count + 1);  // read count=0 (stale!)
  // Result: count = 1 (3 updates, cùng đọc 0)

  // ✅ Functional updater — mỗi lần đọc fresh state
  setCount(prev => prev + 1);  // f(0)=1
  setCount(prev => prev + 1);  // f(1)=2
  setCount(prev => prev + 1);  // f(2)=3
  // Result: count = 3
};
```

### Batch Processing Chi Tiết

```
BATCHING SEQUENCE:

Without functional updater:
  setCount(count + 1)  ┐
  setCount(count + 1)  ┤ batched: [1, 1, 1]
  setCount(count + 1)  ┘
  All read count=0 (stale) → Final: 1

With functional updater:
  setCount(prev => prev + 1) ┐
  setCount(prev => prev + 1) ┤ batched: [f, f, f]
  setCount(prev => prev + 1) ┘
  f(0)=1, f(1)=2, f(2)=3  → Final: 3
```

---

## 3. useEffect — Timing Chi Tiết

### Không Phải Lifecycle Hook — Đây Là Lý Do

```jsx
// ❌ SAI: useEffect = "componentDidMount + componentDidUpdate"
// ✅ ĐÚNG: useEffect = side effect mechanism chạy SAU commit phase

useEffect(() => {
  // Side effect ở đây
  document.title = `Count: ${count}`;
  return () => {
    // Cleanup — chạy trước effect tiếp theo HOẶC unmount
  };
}, [count]);
```

### Timing Pipeline Đầy Đủ

```
┌──────────────────────────────────────────────────────────────┐
│  RENDER PHASE (interruptible)                               │
│                                                               │
│  1. Component function executes                              │
│     ├── useState() → get/set state                         │
│     ├── useEffect() → register callback + deps             │
│     └── return JSX                                         │
│                                                               │
│  2. Virtual DOM created                                     │
└──────────────────────────────────────────────────────────────┘
          ↓
┌──────────────────────────────────────────────────────────────┐
│  RECONCILIATION                                            │
│  Diff old VDOM vs new VDOM                               │
└──────────────────────────────────────────────────────────────┘
          ↓
┌──────────────────────────────────────────────────────────────┐
│  COMMIT PHASE (synchronous, cannot interrupt)               │
│                                                               │
│  1. DOM mutations applied                                  │
│  2. useLayoutEffect callbacks (SYNC — before paint)        │
│  3. Browser paint                                         │
│  4. useEffect callbacks (ASYNC — after paint)             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Ba Trường Hợp Dependency Array

```jsx
// ─── TRƯỜNG HỢP 1: [] ───
useEffect(() => {
  // Chạy 1 LẦN: sau mount, SAU paint
  // Cleanup: sau unmount

  const subscription = api.subscribe(setData);
  return () => subscription.unsubscribe(); // ✅
}, []);

// ─── TRƯỜNG HỢP 2: [dep] ───
useEffect(() => {
  // Chạy: sau mount + MỖI LẦN dep thay đổi

  document.title = `${count} items`;

  return () => {
    // Cleanup: trước effect mới HOẶC unmount
  };
}, [count]);

// ─── TRƯỜNG HỢP 3: không có array ───
useEffect(() => {
  // ⚠️ Chạy SAU EVERY render!
  // ⚠️ Risk: infinite loop nếu setState bên trong!
},);
```

---

## 4. Cleanup Function — Chi Tiết

### Cleanup Timing

```
MOUNT:         effect runs
UPDATE:        cleanup → effect (deps changed)
UNMOUNT:       cleanup runs

Timeline:
  Mount:
    useEffect runs

  Update (dep changed):
    "Cleanup runs"
    "Effect runs"

  Update (dep unchanged):
    (không có gì chạy)

  Unmount:
    "Cleanup runs"
```

### Cleanup Patterns

```jsx
// 1. Timer
useEffect(() => {
  const timer = setTimeout(() => setReady(true), 1000);
  return () => clearTimeout(timer); // ✅
}, []);

// 2. Event listener
useEffect(() => {
  function handleResize() { setWidth(window.innerWidth); }
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize); // ✅
}, []);

// 3. AbortController
useEffect(() => {
  const controller = new AbortController();
  fetch(url, { signal: controller.signal })
    .then(res => res.json())
    .then(setData)
    .catch(err => {
      if (err.name !== 'AbortError') setError(err);
    });
  return () => controller.abort(); // ✅
}, [url]);

// 4. Subscription
useEffect(() => {
  const unsub = eventBus.subscribe('update', setData);
  return () => unsub(); // ✅
}, []);
```

---

## 5. Side Effects Trong Render — Sai

### Render Phase Có Thể Interrupt!

```jsx
// ❌ RENDER PHASE = CÓ THỂ INTERRUPT!
// Side effect ở đây = unpredictable
function Component() {
  // Side effect
  document.title = `Count: ${count}`;

  // ⚠️ Nếu render interrupted:
  // → document.title được gọi 0 lần, 1 lần, hoặc nhiều lần
  // → DOM ở trạng thái không xác định

  return <div>{count}</div>;
}

// ✅ ĐÚNG: Side effect trong useEffect
function Component() {
  useEffect(() => {
    document.title = `Count: ${count}`; // ✅ Chạy sau commit
  }, [count]);
  return <div>{count}</div>;
}
```

---

## 6. Async Trong useEffect

### Không Dùng Async Function Trực Tiếp

```jsx
// ❌ Warning!
useEffect(async () => {
  const data = await fetch(url); // Returns Promise!
  setData(data);
}, [url]);
// ⚠️ Warning: "an effect must not return anything besides a function"
```

```jsx
// ✅ ĐÚNG: async function bên trong
useEffect(() => {
  let cancelled = false;

  async function fetchData() {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!cancelled) setData(data);
    } catch (err) {
      if (!cancelled) setError(err);
    }
  }

  fetchData();

  return () => { cancelled = true; }; // ✅ Cleanup
}, [url]);
```

---

## 7. useLayoutEffect vs useEffect

```jsx
// useLayoutEffect: SYNCHRONOUS, trước paint
// Dùng cho: DOM measurements, synchronous visual updates
useLayoutEffect(() => {
  const rect = element.getBoundingClientRect();
  // ✅ DOM measurement an toàn
  // ⚠️ Block paint — dùng cẩn thận
}, [dep]);

// useEffect: ASYNCHRONOUS, sau paint
// Dùng cho: data fetching, subscriptions
useEffect(() => {
  fetchData(); // ✅ Async, không block UI
}, [dep]);
```

---

## 8. Các Traps Phổ Biến

### ❌ Trap 1: Empty Deps [] → Stale Closure

```jsx
// ❌ Stale closure — capture count=0 forever
useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1); // count=0 (stale)
  }, 1000);
  return () => clearInterval(timer);
}, []);
// Counter dừng ở 1!

// ✅ Functional updater
useEffect(() => {
  const timer = setInterval(() => {
    setCount(prev => prev + 1); // ✅ Fresh
  }, 1000);
  return () => clearInterval(timer);
}, []);

// ✅ HOẶC: include count in deps
useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1);
  }, 1000);
  return () => clearInterval(timer);
}, [count]); // ⚠️ Cleanup + re-create interval mỗi lần
```

### ❌ Trap 2: setState Trong useEffect Không Có Deps

```jsx
// ❌ INFINITE LOOP!
useEffect(() => {
  const data = compute(items);
  setData(data); // setData → re-render → useEffect → setData → loop!
});
```

### ❌ Trap 3: Object/Function Trong Deps

```jsx
// ❌ Object new reference mỗi render
useEffect(() => {
  applyTheme({ theme: 'dark', font: 16 });
}, [{ theme: 'dark', font: 16 }]); // {} mới mỗi render

// ✅ useMemo
const config = useMemo(() => ({ theme: 'dark', font: 16 }), []);
useEffect(() => {
  applyTheme(config);
}, [config]);
```

---

## 9. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  useState                                                      │
│  ├── Hoạt động bằng hooks array — thứ tự phải consistent │
│  ├── setState là ASYNC và BATCHED                           │
│  ├── Functional updater: luôn dùng khi phụ thuộc prev state │
│  └── Object/Array: tạo NEW reference khi set              │
│                                                               │
│  useEffect                                                    │
│  ├── Chạy SAU commit phase (SAU browser paint)           │
│  ├── Dependency array: điều khiển KHI NÀO chạy         │
│  ├── Cleanup: trước effect mới HOẶC unmount              │
│  ├── Stale closure: capture value tại thời điểm setup      │
│  └── Side effects: KHÔNG đặt trong render body         │
│                                                               │
│  Common Bugs:                                                │
│  ├── Empty deps [] → stale closure                         │
│  ├── No array → infinite loop                              │
│  └── Async in useEffect → guard pattern                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 10. Câu Hỏi Phỏng Vấn

### Q1: useEffect hoạt động như thế nào bên trong?

**Trả lời:** `useEffect` là side effect mechanism chạy **SAU commit phase**, **SAU browser paint**. Timing: render → reconciliation → commit (DOM mutations) → paint → useEffect callbacks. Dependency array quyết định khi nào callback re-register. Cleanup function chạy trước khi callback re-register (khi deps changed) hoặc sau unmount. `[]` = chỉ chạy 1 lần (sau mount).

### Q2: Functional updater là gì và tại sao cần?

**Trả lời:** `setCount(prev => prev + 1)` nhận **previous state** thay vì **current state**. Khi multiple setStates batch cùng nhau, functional updater đảm bảo mỗi update đọc fresh state. `setCount(count + 1)` với count=0 gọi 3 lần → kết quả = 1 (stale). `setCount(prev => prev + 1)` gọi 3 lần → kết quả = 3 (fresh).

### Q3: Cleanup function chạy khi nào?

**Trả lời:** Cleanup chạy trong 2 trường hợp: (1) Trước khi effect re-runs (khi dependency thay đổi) — để "undo" side effect cũ; (2) Sau unmount — để cleanup trước khi component bị destroy. Đây là cơ chế để tránh memory leaks và stale subscriptions.

### Q4: useLayoutEffect khác useEffect thế nào?

**Trả lời:** `useLayoutEffect`: synchronous, chạy **TRƯỚC browser paint**, ngay sau DOM mutations. Dùng cho DOM measurements (`getBoundingClientRect`), synchronous visual updates. Block paint. `useEffect`: asynchronous, chạy **SAU browser paint**, không block UI. Dùng cho data fetching, subscriptions, logging.

### Q5: Stale closure trong useEffect là gì?

**Trả lời:** Khi `useEffect` với `[]` chạy, closure capture giá trị tại thời điểm mount. Giá trị đó thay đổi (state đổi) nhưng closure vẫn dùng giá trị cũ. Ví dụ: `setInterval(() => setCount(count + 1), 1000)` với `[]` → count luôn là 0 trong closure → counter dừng ở 1. Fix: functional updater `setCount(prev => prev + 1)`.

---

## 11. Thực Hành

### Bài 1: Fix Stale Closure

```jsx
// Tạo component với:
// 1. useEffect + setInterval với stale closure
// 2. Fix bằng functional updater
// 3. Fix bằng include count trong deps
// 4. Fix bằng useRef
// Verify: timer count tăng đúng
```

### Bài 2: Async Fetch with Cleanup

```jsx
// Tạo useFetch custom hook:
// 1. Fetch khi url thay đổi
// 2. AbortController cleanup
// 3. Loading state
// 4. Error state
// 5. Debounce option
```

### Bài 3: Batch Updates

```jsx
// Tạo component đếm:
// 1. 3 setStates trong 1 handler
// Button "Batch 3": setCount + 1, +1, +1
// Verify: re-render count = ?
```

---

## Checklist

- [ ] useState hoạt động bằng hooks array index
- [ ] setState là async và batched
- [ ] Functional updater: dùng khi phụ thuộc previous state
- [ ] useEffect chạy sau browser paint (async)
- [ ] useLayoutEffect chạy trước browser paint (sync)
- [ ] Cleanup chạy trước effect mới HOẶC sau unmount
- [ ] Empty deps [] → stale closure
- [ ] Async function trong useEffect cần guard

---

*Last updated: 2026-04-01*
