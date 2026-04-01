# Rendering & Re-render — Tại Sao React Re-render?

## Câu hỏi mở đầu

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  console.log('Render!'); // Bạn thấy log này khi nào?

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

Click 5 lần → console log 5 lần. Nhưng đôi khi component re-render dù không click. Tại sao?

**Đây là câu hỏi quan trọng nhất trong React performance.**

---

## 1. Render Cycle — Từ Đầu

### Bước 1: Component Function Chạy

```
Component renders = Function executes

┌──────────────────────────────────────────────────────────────┐
│  function Counter() {                                       │
│    const [count, setCount] = useState(0);                  │
│    // ↑ React kiểm tra: đã có state chưa?                  │
│    //   - Lần đầu: tạo state mới                          │
│    //   - Render sau: lấy state cũ                        │
│    return (                                                 │
│      <div>                                                  │
│        <p>Count: {count}</p>                                │
│        <button onClick={...}>Increment</button>            │
│      </div>                                                 │
│    );                                                       │
│  }                                                          │
│  ↓ Output: React Element (plain object)                    │
└──────────────────────────────────────────────────────────────┘
```

### Bước 2: JSX Compile Thành Object

```jsx
// Component return:
return (
  <div>
    <p>Count: {count}</p>
    <button onClick={...}>Increment</button>
  </div>
);

// Compile thành:
return React.createElement('div', null,
  React.createElement('p', null, 'Count: ', count),
  React.createElement('button', { onClick: ... }, 'Increment')
);

// ↓ Object (Virtual DOM node):
{
  type: 'div',
  props: {
    children: [
      { type: 'p', props: { children: ['Count: ', countValue] } },
      { type: 'button', props: { onClick: fn, children: 'Increment' } }
    ]
  }
}
```

### Bước 3: Virtual DOM Diffing

```
Old VDOM vs New VDOM:

Old VDOM:              New VDOM:
<div>                  <div>
  <p>0</p>    →        <p>1</p>       ← Text node changed
  <button>+</button> →   <button>+</button> ← Same
</div>                  </div>

React: "Chỉ update <p>0</p> → <p>1</p>"
→ 1 DOM text node update ✅
```

---

## 2. Tại Sao React Re-render — Đầy Đủ

### Trigger #1: setState / useState Setter

```jsx
const [count, setCount] = useState(0);

setCount(5);         // ✅ Trigger re-render
setCount(prev => prev + 1); // ✅ Trigger re-render
```

### Trigger #2: Parent Re-renders

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <>
      <ExpensiveChild />      {/* Re-render khi Parent re-render! */}
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </>
  );
}
```

**Đây là source phổ biến nhất của performance problems.**

```
Parent re-renders
  → function Parent() executes again
    → new JSX returned
      → React: "children changed"
        → Child re-renders
```

Child không có cách tự biết "props không đổi" — phải dùng `React.memo()`.

### Trigger #3: Props Thay Đổi

```jsx
function Child({ name, count }) {
  return <div>{name}: {count}</div>;
}

function Parent() {
  const [count, setCount] = useState(0);
  return <Child name="Alice" count={count} />;
  //                              ↑
  //              count thay đổi → Child re-render
}
```

### Trigger #4: Context Value Thay Đổi

```jsx
const ThemeContext = createContext('light');

function App() {
  const [theme, setTheme] = useState('dark');

  return (
    <ThemeContext.Provider value={theme}>
      <Toolbar />    {/* Re-render khi theme đổi */}
      <Content />    {/* Re-render khi theme đổi */}
    </ThemeContext.Provider>
  );
}
```

**All consumers re-render** khi Context value thay đổi (reference change).

### Trigger #5: useReducer Dispatch

```jsx
const [state, dispatch] = useReducer(reducer, initial);
dispatch({ type: 'INCREMENT' }); // → Re-render
```

### Trigger #6: Force Update

```jsx
const [, forceUpdate] = useReducer(x => x + 1, 0);
forceUpdate(); // → Force re-render
```

---

## 3. React KHÔNG Re-render Khi...

### Primitive Value Giữ Nguyên

```jsx
// React 18+: có thể bail out nếu setState giá trị same
setCount(5); // count đã là 5 → React có thể skip
```

### Object/Array Reference Không Đổi

```jsx
// ⚠️ NHƯNG: React dùng Object.is() so sánh
const [config, setConfig] = useState({ theme: 'dark' });

setConfig({ theme: 'dark' }); // → RE-RENDER (new reference!)
// {} !== {} → React nghĩ "different"
```

---

## 4. Reconciliation — Chi Tiết

### Reconciliation Algorithm

```
React's reconciliation (diffing algorithm):

1. Element khác type:
   → Destroy old tree
   → Create new tree

2. Element cùng type (DOM element):
   → So sánh và update attributes
   → <div className="old"> → <div className="new">
   → Result: className updated

3. Element cùng type (Component):
   → Gọi component mới
   → So sánh result

4. Lists:
   → Dùng key để match items
   → Có key: O(n) — match by key
   → Không key: O(n²) — match by index
```

### Key Importance — Bug Demo

```jsx
const [names, setNames] = useState(['Alice', 'Bob', 'Carol']);

function List() {
  return (
    <ul>
      {names.map((name, i) => (
        <li key={i}>           {/* ❌ key = index */}
          <input type="text" />
          {name}
        </li>
      ))}
    </ul>
  );
}

function prepend() {
  setNames(['Zara', ...names]);
}
```

**Bug timeline:**

```
TRƯỚC:
  key=0: <li>Alice</li>  <input />
  key=1: <li>Bob</li>    <input />
  key=2: <li>Carol</li> <input />

SAU PREPEND ['Zara']:
  key=0: <li>Zara</li>  <input /> ← kept (key=0 matched)
  key=1: <li>Alice</li> <input /> ← kept (key=1 matched)
  key=2: <li>Bob</li>   <input /> ← kept (key=2 matched)
  key=3: <li>Carol</li> <input /> ← new

→ React giữ nguyên input DOM nodes vì key matched
→ Nhưng label đổi: Alice→Zara, Bob→Alice, etc.
→ Result: input của Alice hiển thị nhưng label là Zara!
```

---

## 5. Children Re-render — Chi Tiết

### Đây Là Default Behavior

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  // ❌ Child re-render khi Parent re-render!
  // Ngay cả khi Child không nhận props nào!
  return (
    <div>
      <StaticChild />  {/* Re-render khi count đổi */}
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}
```

**Tại sao React không tự optimize?**

```
Parent re-renders
  → React không biết props của StaticChild có thay đổi không
  → React mặc định re-render children
  → Đây là SAFE behavior (đúng theo React model)
  → Performance optimization là OPTIONAL

React.memo() = explicit opt-in để skip unnecessary re-renders
```

### Prevent Với React.memo

```jsx
// ❌ Without memo: re-render always
function Child() {
  console.log('Child rendered');
  return <div>Child</div>;
}

// ✅ With memo: re-render only when props change
const MemoizedChild = React.memo(function Child() {
  console.log('Child rendered');
  return <div>Child</div>;
});

function Parent() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <MemoizedChild /> {/* Không re-render khi count đổi */}
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}
```

---

## 6. Traps Phổ Biến

### ❌ Trap 1: Object Literal Trong JSX

```jsx
// ❌ Object mới MỖI render → child re-render
function Parent() {
  return <Child data={{ name: 'Alice' }} />;
  //                          ↑ new object {} mỗi render
}

// ✅ Stable reference
function Parent() {
  const data = useMemo(() => ({ name: 'Alice' }), []);
  return <Child data={data} />;
}

// ✅ Hoặc truyền primitive
return <Child name="Alice" />;
```

### ❌ Trap 2: Array Literal Trong JSX

```jsx
// ❌ Array mới MỖI render → child re-render
return <List items={[1, 2, 3]} />;  // [] new mỗi render

// ✅ Stable reference
const items = useMemo(() => [1, 2, 3], []);
return <List items={items} />;
```

### ❌ Trap 3: Function Trong JSX

```jsx
// ❌ Function mới MỖI render → child re-render
return <Child onClick={() => handleClick(id)} />;
//                    ↑ arrow fn mới mỗi render

// ✅ useCallback
const handleClick = useCallback((id) => { ... }, []);
return <Child onClick={handleClick} />;
```

---

## 7. Performance Optimization Overview

```
┌─────────────────────────────────────────────────────────────┐
│                 OPTIMIZATION PYRAMID                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Architecture (BIGGEST impact)                          │
│     └── Đặt state đúng chỗ, tránh re-render chain        │
│                                                              │
│  2. Memoization at Component Level                         │
│     └── React.memo() — prevent child re-render            │
│                                                              │
│  3. Memoization at Value Level                             │
│     └── useMemo — memoize expensive computation            │
│     └── useCallback — memoize function reference            │
│                                                              │
│  4. Code Splitting (not render optimization)               │
│     └── React.lazy, Suspense                               │
│                                                              │
│  ⚠️ Premature optimization is the root of all evil.        │
│     Measure FIRST, then optimize.                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Câu Hỏi Phỏng Vấn

### Q1: Khi nào component re-render?

**Trả lời:** (1) `setState`/`useState` setter được gọi; (2) `useReducer` dispatch; (3) Parent re-renders (children always re-render by default); (4) Props thay đổi (khi parent re-renders); (5) Context value thay đổi (all consumers re-render); (6) `forceUpdate()`. Children re-render khi parent re-renders vì React không có cách tự động skip — phải dùng `React.memo()`.

### Q2: Virtual DOM là gì và tại sao nó nhanh?

**Trả lời:** Virtual DOM là JavaScript representation của real DOM. React tạo VDOM tree, so sánh (diff) với tree trước, chỉ apply changes thực sự vào real DOM. Direct DOM manipulation là synchronous và expensive (browser recalculate: layout, paint, composite). VDOM batching + diffing giảm DOM operations từ O(n) xuống O(1) per change trong hầu hết trường hợp.

### Q3: Reconciliation hoạt động thế nào?

**Trả lời:** Reconciliation là quá trình React so sánh new VDOM với old VDOM. Element khác type → destroy and recreate. Element cùng type → update attrs (DOM) hoặc re-render (component). Lists dùng `key` để match items. Không có key → fallback to index, gây bugs khi list thay đổi.

### Q4: Tại sao không dùng index làm key?

**Trả lời:** Index làm key gây bug khi list items được thêm, xóa, hoặc reorder. React dùng key để xác định "đây là cùng một item". Dùng index thì khi item được prepend, tất cả keys shift → React nghĩ tất cả items thay đổi → re-create DOM nodes → lose state (input values, scroll position, etc).

### Q5: Child re-render khi nào?

**Trả lời:** Child luôn re-render khi parent re-render (default behavior). React không có cách tự động skip children — phải dùng `React.memo()` để prevent. `memo` thực hiện shallow comparison trên props trước khi re-render. Nếu props same → skip re-render.

---

## 9. Thực Hành

### Bài 1: Debug Re-render Chain

```jsx
// Tạo component tree: App → Layout → Sidebar → Nav → NavItem
// App có counter state
// Thêm console.log vào mỗi component:
// console.log('App rendered'), console.log('NavItem rendered')
// Observe: những component nào re-render khi counter thay đổi?
```

### Bài 2: List Key Bug

```jsx
// Tạo form với list items
// Mỗi item có input field
// THÊM item vào ĐẦU list
// Verify: input values có bị scramble không?
// Fix: dùng stable key (unique ID)
```

### Bài 3: Optimize Parent-Child

```jsx
// Tạo component tree với 5 levels
// Parent có counter state
// Measure: NavItem (level 5) re-render khi counter đổi?
// Apply React.memo() → verify optimization
// Apply useCallback → verify optimization
```

---

## Checklist

- [ ] Re-render = component function executes again
- [ ] setState/useState setter → re-render
- [ ] Parent re-renders → children re-render (default)
- [ ] Props thay đổi → re-render
- [ ] Context value đổi → all consumers re-render
- [ ] Object/Array literal trong JSX → new reference → re-render children
- [ ] Function literal trong JSX → new reference → re-render children
- [ ] Key phải stable và unique trong sibling list
- [ ] Measure trước khi optimize

---

*Last updated: 2026-04-01*
