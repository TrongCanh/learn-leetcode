# useRef vs useMemo vs useCallback — Phân Biệt

## Câu hỏi mở đầu

Bạn có:

```jsx
const [count, setCount] = useState(0);

// ❌ Biến thường — reset mỗi render
let data = fetchData();

// ❌ Object literal — new reference mỗi render
<Child data={{ name: 'Alice' }} />

// ❌ Function literal — new reference mỗi render
<Child onClick={() => handleClick(id)} />
```

Bạn cần: `useRef`, `useMemo`, `useCallback`. Nhưng dùng sai thì có hại.

---

## 1. useRef

### Định Nghĩa

```jsx
const ref = useRef(initialValue);

// ref.current = initialValue (lần đầu)
// ref.current = giá trị bạn gán (sau đó)
```

### useRef Tạo Stable Reference

```jsx
function Component() {
  // ref object LUÔN stable — same reference across renders
  const countRef = useRef(0);

  console.log(countRef); // { current: 0 } → same object every render

  return (
    <button onClick={() => countRef.current++}>
      Clicked: {countRef.current}
    </button>
    // ⚠️ UI KHÔNG update khi countRef.current thay đổi!
  );
}
```

**Key insight**: `useRef` không trigger re-render. Nó chỉ lưu giá trị.

### useRef — 3 Use Cases

#### Use Case 1: DOM Access

```jsx
function AutoFocusInput() {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} />;
}
```

#### Use Case 2: Previous Value

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  const prevCountRef = useRef();

  useEffect(() => {
    prevCountRef.current = count;
  });

  return (
    <div>
      <p>Now: {count}, Previous: {prevCountRef.current}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}
```

#### Use Case 3: Mutable Value Không Trigger Re-render

```jsx
function Timer() {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return <div>Elapsed: {elapsed}s</div>;
}
```

---

## 2. useMemo

### Định Nghĩa

```jsx
const memoizedValue = useMemo(() => expensiveComputation(a, b), [a, b]);

// () => ...: compute function — chỉ chạy khi dependencies thay đổi
// [a, b]: dependencies — re-compute khi thay đổi
// Returns: memoized value
```

### Khi Nào Dùng useMemo?

```
Dùng useMemo KHI:
  ✓ Computation expensive (sort, filter, calculate lớn)
  ✓ Value dùng trong dependency array
  ✓ Value dùng trong React.memo child
  ✓ Object/array reference cần stable (cho child props)

KHÔNG DÙNG useMemo KHI:
  ✗ Computation rẻ tiền (< 1ms)
  ✗ Value không dùng trong dependency arrays
  ✗ KHÔNG CÓ performance problem — premature optimization!
```

### Ví dụ

```jsx
function SortedList({ items, filter }) {
  // ✅ Expensive computation — memoize
  const sortedItems = useMemo(
    () => items
      .filter(item => item.name.includes(filter))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [items, filter]
  );

  return <List items={sortedItems} />;
}

function UserCard({ user }) {
  // ❌ KHÔNG CẦN — string primitive
  const displayName = useMemo(() => user.name.toUpperCase(), [user.name]);

  // ✅ Dùng trong dependency array
  const filteredItems = useMemo(
    () => items.filter(i => i.userId === user.id),
    [items, user.id]
  );
}
```

### Anti-Pattern: useMemo Thừa

```jsx
// ❌ useMemo CÓ THỂ LÀM CHẬM
function Component({ a, b }) {
  const value = useMemo(() => a + b, [a, b]);
  // ↑ useMemo overhead (create closure, check deps, store)
  // ↓ Simple addition có thể nhanh hơn overhead này

  return <div>{value}</div>;
}

// ✅ ĐÚNG: Chỉ memoize khi:
function Component({ items, filter }) {
  const filtered = useMemo(
    () => items.filter(i => i.name.includes(filter)),
    [items, filter] // items lớn → filter tốn CPU
  );
}
```

---

## 3. useCallback

### Định Nghĩa

```jsx
const memoizedCallback = useCallback(
  (arg1, arg2) => {
    doSomething(arg1, arg2);
    return result;
  },
  [dep1, dep2]
);

// Returns: memoized function reference
// useCallback(fn, deps) = useMemo(() => fn, deps)
```

### Ví dụ

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  // ❌ Function mới mỗi render → Child re-render
  const handleClick = (id) => {
    console.log(id, count);
  };

  // ✅ Stable function reference — Child KHÔNG re-render
  const handleClick = useCallback((id) => {
    console.log(id, count); // count = stale?
  }, [count]); // ⚠️ vẫn re-create khi count đổi

  // ✅ Functional updater
  const handleClick = useCallback((id) => {
    setItems(prev => [...prev, id]); // ✅ fresh
  }, []); // ✅ stable, count không cần

  return <Child onClick={handleClick} />;
}
```

### useCallback vs useMemo

```
useMemo: memoize VALUE
  const value = useMemo(() => compute(a, b), [a, b]);

useCallback: memoize FUNCTION (syntactic sugar)
  const fn = useCallback((x) => compute(x, y), [y]);

  // Tương đương với:
  const fn = useMemo(() => (x) => compute(x, y), [y]);
```

---

## 4. So Sánh Toàn Diện

```
┌──────────────────┬──────────────────┬───────────────────────────┐
│ useRef           │ useMemo          │ useCallback              │
├──────────────────┼──────────────────┼───────────────────────────┤
│ Return           │ memoized VALUE   │ memoized FUNCTION        │
│ { current: x } │ any type        │ function                 │
├──────────────────┼──────────────────┼───────────────────────────┤
│ Changes          │ re-compute when │ re-create when          │
│ do NOT trigger  │ deps change    │ deps change            │
│ re-render        │                  │                           │
├──────────────────┼──────────────────┼───────────────────────────┤
│ Stable ref?      │ ✅ stable value │ ✅ stable function ref  │
│ (always)        │ (when deps same) │ (when deps same)          │
├──────────────────┼──────────────────┼───────────────────────────┤
│ Primary use     │ • Expensive calc │ • Props to memo child    │
│                  │ • Stable deps   │ • Event handler arrays   │
│                  │ • Stable ref    │ • Function deps          │
└──────────────────┴──────────────────┴───────────────────────────┘
```

### Decision Tree

```
Bạn cần gì?
  │
  ├── DOM access?                    → useRef
  │
  ├── Mutable value (không re-render)?
  │     └── prev value tracking      → useRef
  │
  ├── Memoize expensive computation?
  │     └── useMemo
  │
  └── Memoize function reference?
        │
        ├── Props cho React.memo child?
        │     └── useCallback
        │
        ├── Props cho event handler array?
        │     └── useCallback
        │
        └── KHÔNG truyền cho child?
              └── KHÔNG CẦN useCallback (thường)
```

---

## 5. Common Patterns

### Pattern: React.memo + useCallback

```jsx
const Child = React.memo(function Child({ onClick, data }) {
  console.log('Child rendered');
  return <button onClick={() => onClick(data.id)}>Click</button>;
});

function Parent() {
  const [count, setCount] = useState(0);

  // ✅ Stable reference
  const handleClick = useCallback((id) => {
    console.log('Clicked', id);
  }, []);

  // ❌ Object mới mỗi render → child re-render
  // <Child onClick={handleClick} data={{ id: 1 }} />
  // ✅ Stable object
  const data = useMemo(() => ({ id: 1 }), []);
  <Child onClick={handleClick} data={data} />
}
```

### Pattern: Stable Function với Curry

```jsx
function ItemList({ items }) {
  // ✅ Curry: tạo stable function
  const handleDelete = useCallback((id) => () => {
    deleteItem(id);
  }, []);

  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          {item.name}
          <button onClick={handleDelete(item.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

### Pattern: useRef cho Timer ID

```jsx
function Search({ query }) {
  const [results, setResults] = useState([]);
  const abortRef = useRef(null);

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    fetch(`/search?q=${query}`, { signal: abortRef.current.signal })
      .then(r => r.json())
      .then(setResults);

    return () => abortRef.current?.abort();
  }, [query]);
}
```

---

## 6. Các Traps Phổ Biến

### ❌ Trap 1: Dùng useMemo/useCallback Không Cần

```jsx
// ❌ OVER-ENGINEERED — useMemo có overhead
const doubled = useMemo(() => count * 2, [count]);
// Simple expression rẻ hơn overhead useMemo!

// ✅ ĐÚNG: chỉ khi computation expensive
const sorted = useMemo(
  () => bigList.sort(compareFn),
  [bigList]
);
```

### ❌ Trap 2: useCallback Nhưng Không Dùng React.memo

```jsx
// ❌ useCallback không có memo child = vô nghĩa
const handleClick = useCallback(() => doSomething(), []);

return <RegularChild onClick={handleClick} />;
// RegularChild re-render khi Parent re-render
// → useCallback không giúp gì!

// ✅ ĐÚNG
const MemoChild = React.memo(({ onClick }) => <button onClick={onClick}>Click</button>);
const handleClick = useCallback(() => doSomething(), []);
return <MemoChild onClick={handleClick} />;
```

### ❌ Trap 3: useRef Nhầm Với useState

```jsx
// ❌ useRef KHÔNG trigger re-render
const timerRef = useRef(0);
timerRef.current++; // UI KHÔNG update!

// ✅ Dùng useState cho UI state
const [time, setTime] = useState(0);
setTime(time + 1); // UI updates!
```

---

## 7. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  useRef         → stable object, .current mutable, NO re-render│
│  useMemo(value) → memoize COMPUTED VALUE                     │
│  useCallback(fn) → memoize FUNCTION (useMemo for fns)      │
│                                                               │
│  MỐI QUAN HỆ:                                              │
│  memo → nhận props                                        │
│    ↓                                                       │
│  Props = reference types → new ref = re-render             │
│    ↓                                                       │
│  useCallback/useMemo → stable reference                   │
│    ↓                                                       │
│  memo → props same → skip re-render ✅                    │
│                                                               │
│  ⚠️ CO ST: useMemo/useCallback có overhead              │
│  ⚠️ Chỉ dùng khi CÓ performance issue                │
│  ⚠️ Premature optimization = anti-pattern                │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Câu Hỏi Phỏng Vấn

### Q1: Phân biệt useMemo và useCallback?

**Trả lời:** `useMemo` memoizes computed VALUE: `const x = useMemo(() => a + b, [a, b])`. `useCallback` memoizes FUNCTION (syntactic sugar): `const fn = useCallback((x) => a + x, [a])` tương đương `useMemo(() => (x) => a + x, [a])`. Dùng useMemo khi cần memoize result. Dùng useCallback khi cần stable function reference (thường là props cho memo child).

### Q2: useRef hoạt động như thế nào?

**Trả lời:** useRef trả về `{ current: initialValue }` với stable reference across renders. Thay đổi `ref.current` KHÔNG trigger re-render. Thường dùng cho: DOM access, storing previous values, mutable values không liên quan đến render.

### Q3: Khi nào DÙNG useMemo?

**Trả lời:** (1) Expensive computation (sort/filter large dataset); (2) Object/array reference cần stable cho child component dependencies; (3) Value dùng trong other hooks' dependency arrays. KHÔNG dùng khi: computation rẻ tiền, không có performance issue, không trong deps.

### Q4: Khi nào DÙNG useCallback?

**Trả lời:** (1) Truyền callback làm props cho React.memo child; (2) Callback dùng trong useEffect deps; (3) Callback array dùng như dependency. KHÔNG cần khi: child không memo, callback không truyền qua props.

### Q5: useRef vs useState khi nào?

**Trả lời:** useState: khi thay đổi giá trị CẦN re-render UI. useRef: khi cần lưu giá trị KHÔNG cần re-render (timer ID, DOM ref, previous value tracking, stable closure value).

---

## 9. Thực Hành

### Bài 1: Fix Performance Issue

```jsx
// Tạo component với:
// const [items, setItems] = useState(largeArray);
// const [filter, setFilter] = useState('');
// Render list với expensive filter
// Measure: có cần useMemo không? Bao nhiêu items thì đáng?
```

### Bài 2: React.memo + useCallback Pattern

```jsx
// Tạo Parent → Child → GrandChild tree
// Parent có counter state
// Measure: GrandChild re-render khi counter đổi?
// Apply memo + useCallback → verify optimization
```

---

## Checklist

- [ ] useRef: stable object, `.current` mutable, KHÔNG trigger re-render
- [ ] useMemo: memoize COMPUTED VALUE, re-compute khi deps đổi
- [ ] useCallback: memoize FUNCTION, re-create khi deps đổi
- [ ] useMemo/useCallback có overhead — CHỈ dùng khi CÓ data
- [ ] useCallback cần với React.memo child, không cần với regular child
- [ ] useRef cho DOM access, prev value, mutable non-UI state
- [ ] Premature optimization = anti-pattern

---

*Last updated: 2026-04-01*
