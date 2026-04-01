# memo + useMemo + useCallback — Toàn Diện

## Câu hỏi mở đầu

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  // ❌ Stable reference — nhưng Child vẫn re-render
  const handleClick = () => console.log('click');

  return (
    <div>
      <ExpensiveList items={items} />
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}
```

Bạn bọc `React.memo` nhưng vẫn re-render? Bạn dùng `useMemo` cho mọi thứ?

---

## 1. React.memo — Prevent Child Re-render

### Cú pháp

```jsx
const MemoizedComponent = React.memo(function MyComponent(props) {
  return <div>{props.name}</div>;
});
```

### How It Works

```
WITHOUT memo:
  Parent re-render
    → Child function executes
    → New JSX returned
    → React: "children changed"
    → Child re-render

WITH memo:
  Parent re-render
    → Child executes
    → Compare old props vs new props (shallow comparison)
    → If PROPS SAME → "no change, skip"
    → Child NOT re-render
```

### Shallow Comparison

```
PRIMITIVE TYPES:
  5 === 5              → true   → memo skip ✅
  "hi" === "hi"        → true   → memo skip ✅
  true === true          → true   → memo skip ✅
  null === null          → true   → memo skip ✅

REFERENCE TYPES:
  {} === {}              → false  → memo re-render ❌
  [] === []              → false  → memo re-render ❌
  () => {} === () => {}  → false  → memo re-render ❌

  let a = { x: 1 };
  let b = a;             → a === b → true   → memo skip ✅
  let c = { x: 1 };     → a === c → false  → memo re-render ❌
```

---

## 2. memo Với Function Props

```jsx
const MemoizedChild = React.memo(({ onClick }) => {
  return <button onClick={onClick}>Click</button>;
});

function Parent() {
  const [count, setCount] = useState(0);

  // ❌ Function literal = new reference every render
  <MemoizedChild onClick={() => handleClick(id)} />;

  // ❌ Regular function = new reference every render
  function handleClick(id) { /* ... */ }
  <MemoizedChild onClick={handleClick} />;

  // ✅ useCallback = stable reference
  const handleClick = useCallback((id) => {
    setItems(prev => [...prev, id]);
  }, []);

  <MemoizedChild onClick={handleClick} />;
}
```

---

## 3. useMemo vs useCallback vs memo

```
┌──────────────────────────────────────────────────────────────┐
│  React.memo()      → prevent CHILD re-render                  │
│  ├── compare: props (shallow)                              │
│  └── use on: component nhận props                          │
│                                                               │
│  useMemo(value)     → memoize COMPUTED VALUE                 │
│  ├── re-compute khi deps đổi                           │
│  └── use on: expensive calc, deps, stable ref            │
│                                                               │
│  useCallback(fn)   → memoize FUNCTION (ref)               │
│  ├── equivalent to: useMemo(() => fn, deps)              │
│  └── use on: function props to memo child               │
└──────────────────────────────────────────────────────────────┘

MỐI QUAN HỆ:
  memo → nhận props
    ↓
  props so sánh bằng SHALLOW COMPARISON
    ↓
  function/object/array = reference type
    ↓
  useCallback/useMemo → tạo STABLE REFERENCE
    ↓
  memo → props same → skip re-render ✅
```

---

## 4. Comprehensive Example

```jsx
const List = React.memo(function List({ items, filter, onItemClick }) {
  console.log('List rendered');
  const filtered = useMemo(
    () => items.filter(i => i.name.includes(filter)),
    [items, filter]
  );
  return (
    <ul>
      {filtered.map(item => (
        <li key={item.id} onClick={() => onItemClick(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
});

function App() {
  const [count, setCount] = useState(0);
  const [filter, setFilter] = useState('');
  const [items, setItems] = useState(initialItems);

  const handleItemClick = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const memoizedItems = useMemo(() => items, [items]);

  return (
    <div>
      <List
        items={memoizedItems}
        filter={filter}
        onItemClick={handleItemClick}
      />
      <button onClick={() => setCount(c => c + 1)}>
        Counter: {count}
      </button>
    </div>
  );
}
```

---

## 5. When NOT to Use

```
TRÁNH DÙNG memo/useMemo/useCallback KHI:
  ✗ Component render < 1ms (overhead > benefit)
  ✗ Props thay đổi THƯỜNG XUYÊN
  ✗ KHÔNG CÓ performance issue (YAGNI)
```

---

## Checklist

- [ ] React.memo = prevent child re-render when props same
- [ ] Shallow comparison: primitives by value, refs by reference
- [ ] useMemo = memoize VALUE, useCallback = memoize FUNCTION
- [ ] useCallback cần khi props là function cho memo child
- [ ] Memo overhead có thể > benefit — measure first

---

*Last updated: 2026-04-01*
