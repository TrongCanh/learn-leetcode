# State — setState, Batching, và Reference Equality

## Câu hỏi mở đầu

```jsx
function Counter() {
  let count = 0; // ❌ Biến thường — reset mỗi render!

  return (
    <button onClick={() => count++}>
      Count: {count}
    </button>
  );
}
```

Click 10 lần, counter vẫn hiển thị `0`. Tại sao?

**Vì `count` là regular variable — nó reset về `0` mỗi khi function re-render.**

`useState` giải quyết vấn đề này bằng cách **persist giá trị across renders**. Nhưng cách nó hoạt động phức tạp hơn bạn nghĩ.

---

## 1. State Là Gì — Bản Chất

> **State = data tồn tại xuyên suốt lifecycle của component, thay đổi khi trigger → component re-render.**

```
┌──────────────────────────────────────────────────────────────┐
│  Mount: useState(0)                                        │
│    hooks[0] = { state: 0 }                               │
│    ↓ render                                                 │
│    <Counter count={0} />                                  │
│                                                              │
│  Click → setCount(1)                                       │
│    ↓ (re-render)                                           │
│    useState(0) → hooks[0].state = 1 ← persisted!        │
│    ↓ render                                                 │
│    <Counter count={1} /> ← UI updated                     │
└──────────────────────────────────────────────────────────────┘
```

**Điều quan trọng**: `useState` được gọi mỗi render, nhưng React giữ nguyên giá trị state giữa các render thông qua internal hooks array.

---

## 2. useState — Bên Trong Hoạt Động Như Thế Nào

### Hooks Array

React maintain một **hooks array** cho mỗi component instance:

```
Component Instance "Counter"
  │
  ├── Hooks Array (theo thứ tự gọi):
  │     ├── [0] { state: 0, setState: fn }    ← useState(0)
  │     ├── [1] { state: null, setState: fn } ← useState(null)
  │     └── [2] { state: [], setState: fn }   ← useState([])
  │
  └── Mỗi hook = { state, queue of pending updates }
```

### Đây Là Lý Do "Rules of Hooks" Tồn Tại

```jsx
// ❌ SAI TUYỆT ĐỐI — thay đổi thứ tự hooks
function Component({ show }) {
  if (show) {
    const [name, setName] = useState('');   // Hook index = 0
  }
  const [age, setAge] = useState(0);         // Hook index = 1 — SHIFTED khi !show!
  // Khi show=false, hooks order: [age], count=1
  // Khi show=true, hooks order: [name, age], count=2
  // → React lấy sai state!
}

// ✅ ĐÚNG — luôn gọi hooks cùng thứ tự
function Component({ show }) {
  const [name, setName] = useState('');     // Hook index = 0 — ALWAYS
  const [age, setAge] = useState(0);        // Hook index = 1 — ALWAYS
}
```

---

## 3. setState — Async & Batching

### Bản Chất: setState Là Async

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
    setCount(count + 1);
    console.log(count); // ⚠️ Vẫn là 0 — chưa updated!
  };

  return <button onClick={handleClick}>Count: {count}</button>;
}
```

**Click một lần** → count tăng lên **1**, không phải 2.

**Tại sao?**

```
setCount(count + 1) → React schedule update với value hiện tại
setCount(count + 1) → React schedule update với value hiện tại
                                        ↑
                                  Cả hai đọc count=0 (stale trong batch)

React batches: tất cả setState trong cùng event handler
→ Flush queue: cả hai update cùng dùng count=0 → kết quả = 1
```

### Functional Updater — Giải Pháp

```jsx
const handleClick = () => {
  // ✅ Functional updater — nhận previous state
  setCount(prev => prev + 1);  // React: queue f1 = (c) => c + 1
  setCount(prev => prev + 1);  // React: queue f2 = (c) → c + 1
  // Flush: f1(0)=1, f2(1)=2 → count = 2 ✅
};
```

### Batch Processing Chi Tiết

```
┌─────────────────────────────────────────────────────────────┐
│  WITHOUT functional updater:                                 │
│                                                               │
│  setCount(count + 1)  ─┐                                   │
│  setCount(count + 1)  ─┤ Batched: queue = [1, 1]       │
│  setCount(count + 1)  ─┘ All read count=0 (stale)      │
│  Final count = 1                                         │
│                                                               │
│  WITH functional updater:                                    │
│                                                               │
│  setCount(prev => prev + 1) ─┐                            │
│  setCount(prev => prev + 1) ─┤ Batched: queue = [f, f]  │
│  setCount(prev => prev + 1) ─┘ f(0)=1, f(1)=2, f(2)=3  │
│  Final count = 3                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Object & Array State

### Cập Nhật Object — Merge Không Phải Replace!

```jsx
const [user, setUser] = useState({ name: 'Alice', age: 30 });

// ❌ SAI — object replace hoàn toàn
setUser({ age: 31 });  // name BỊ MẤT!

// ✅ ĐÚNG — spread + override
setUser(prev => ({ ...prev, age: 31 }));

// Nested object:
setUser(prev => ({
  ...prev,
  address: { ...prev.address, city: 'HCMC' }
}));
```

### Cập Nhật Array

```jsx
const [items, setItems] = useState(['a', 'b', 'c']);

// Thêm vào cuối
setItems(prev => [...prev, 'd']);        // ✅

// Thêm vào đầu
setItems(prev => ['d', ...prev]);        // ✅

// Xóa item
setItems(prev => prev.filter(x => x !== 'b')); // ✅

// Update item
setItems(prev => prev.map(x => x === 'a' ? 'z' : x)); // ✅
```

---

## 5. Khi Nào State Trigger Re-render — Đầy Đủ

### Trigger Re-render

```
RE-RENDER TRIGGERS:
  ├── setState() / useState setter              ✅
  ├── useReducer dispatch                       ✅
  ├── Parent re-renders                        ✅
  │     └── Children luôn re-render khi parent re-render
  ├── Props thay đổi                          ✅
  │     └── Chỉ khi parent re-render → props mới
  ├── Context value thay đổi                  ✅
  │     └── ALL consumers re-render
  └── forceUpdate()                            ✅
```

### KHÔNG Trigger Re-render

```
NOT RE-RENDER TRIGGERS:
  ├── Gán trực tiếp state                     ❌
  │     count = 5 // ❌ React không biết!
  │
  ├── Re-assigning same primitive value        ⚠️
  │     setCount(5) khi count=5
  │     → React có thể optimize (bail out)
  │
  └── Props thay đổi nhưng parent same       ❌
        └── Nếu parent không re-render → props không đổi
```

### ⚠️ Important: Parent Re-render → Children Re-render

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  // ❌ Child re-render khi Parent re-render!
  return (
    <div>
      <ExpensiveChild />  {/* Re-render khi count thay đổi */}
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}
```

**Tại sao?** Parent re-render → function component re-executes → new JSX returned → React reconciliation: "children changed" → children re-render. Đây là nguồn gốc của hầu hết performance issues.

---

## 6. Reference Equality — Core Của Mọi Thứ

### Primitives vs References

```javascript
// Primitives: gán giá trị
let a = 1;
let b = a;  // b = 1 (copy)
b = 2;      // a = 1, b = 2 ✅

// References: gán pointer
let a = { x: 1 };
let b = a;  // b trỏ cùng object với a
b.x = 2;    // a.x = 2, b.x = 2 ❌ (cùng object!)

// React state tương tự:
// setState phải tạo NEW reference để React detect change
setUser({ ...user, name: 'Bob' });  // new object ✅
setUser(prev => ({ ...prev, name: 'Bob' })); // new object ✅
```

### React Dùng Object.is() So Sánh

```javascript
// Object.is() — so sánh bằng giá trị cho primitives
Object.is(5, 5);        // true
Object.is('hi', 'hi');  // true
Object.is(true, true);  // true

// Nhưng references thì KHÁC nhau
Object.is({}, {});           // false (2 objects khác nhau)
Object.is([], []);           // false (2 arrays khác nhau)
Object.is(function(){}, function(){}); // false

// Đây là lý do:
setUser({ name: 'Alice' });
setUser({ name: 'Alice' }); // → React: {} !== {} → RE-RENDER!
```

---

## 7. Liên Hệ Với JavaScript Core

### Closures Trong Functional Updater

```jsx
// Functional updater = closure
setCount(prev => prev + 1);
//               ↑
//  Closure capture giá trị state MỚI NHẤT

// Non-functional:
setCount(count + 1);
//         ↑
//  Closure capture count từ render TRƯỚC
//  Khi batched, count vẫn là giá trị cũ
```

### Execution Context

```javascript
// Mỗi render = function call = new execution context
function Counter() {
  // Render #1: EC1 — useState(0) → state = 0
  // Render #2: EC2 — useState(0) → state = 1 (from React)
  // Render #3: EC3 — useState(0) → state = 2 (from React)

  const [count, setCount] = useState(0);
  //                     ↑
  // React kiểm tra: hooks[0] đã có state?
  // Có → trả về current state
  // Không → tạo state mới với initialValue
}
```

---

## 8. Các Traps Phổ Biến

### ❌ Trap 1: Gán Trực Tiếp State

```jsx
// ❌ SAI TUYỆT ĐỐI
const [user, setUser] = useState({ name: 'Alice' });
user.name = 'Bob';  // ❌ Object mutated, React không re-render!
setUser(user);     // ❌ Same reference!

// ✅ ĐÚNG
setUser(prev => ({ ...prev, name: 'Bob' }));
```

### ❌ Trap 2: setState Trong Loop

```jsx
// ❌ SAI — nhiều setState trong loop, mỗi cái đọc stale state
for (let i = 0; i < 10; i++) {
  setCount(count + 1); // count là stale!
}

// ✅ ĐÚNG — functional updater
for (let i = 0; i < 10; i++) {
  setCount(prev => prev + 1);
}

// ✅ HOẶC — tổng hợp
setCount(c => c + 10);
```

### ❌ Trap 3: Nhầm State Với Derived Value

```jsx
// ❌ SAI — derived value không cần state
function BadComponent({ items }) {
  const [count, setCount] = useState(items.length);
  useEffect(() => {
    setCount(items.length); // Sync needed!
  }, [items]);
}

// ✅ ĐÚNG — derived value tính từ props/state
function GoodComponent({ items }) {
  const count = items.length; // ✅ Computed, no state needed
  return <div>{count} items</div>;
}
```

### ❌ Trap 4: State Là Immutable

```jsx
// ❌ SAI — mutate array
const [list, setList] = useState([1, 2, 3]);
list.push(4);      // ❌ Mutation!
setList(list);      // ❌ Same reference!

// ✅ ĐÚNG
setList([...list, 4]);       // new array
setList(prev => [...prev, 4]); // functional updater
```

---

## 9. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  useState                                                       │
│  ├── Hoạt động bằng hooks array — không gọi có điều kiện │
│  ├── setState là ASYNC và BATCHED                           │
│  ├── Functional updater: luôn dùng khi phụ thuộc prev state │
│  ├── Object/Array: luôn tạo NEW reference                  │
│  └── KHÔNG gán trực tiếp: state.x = y                      │
│                                                               │
│  Re-render Triggers:                                          │
│  ├── setState / dispatch                                     │
│  ├── Parent re-renders → children re-render                  │
│  ├── Props thay đổi                                         │
│  └── Context value thay đổi                                  │
│                                                               │
│  Reference Equality:                                          │
│  ├── {} !== {} vì Object.is() so sánh reference          │
│  ├── setState phải tạo new object/array                   │
│  └── Primitive: Object.is(a, a) = true                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 10. Câu Hỏi Phỏng Vấn

### Q1: setState là sync hay async?

**Trả lời:** Trong React, `setState` là **asynchronous**. React batch updates để optimize performance. Trong event handlers, tất cả `setState` được batch lại — chỉ re-render một lần ở cuối event. React 18+ automatic batching mở rộng cho cả async code (Promises, setTimeout). `setState(count + 1)` không đồng bộ với JavaScript event loop nhưng synchronous với React render cycle.

### Q2: Tại sao setState với object không merge tự động?

**Trả lời:** `setState({ ...updates })` thay thế hoàn toàn state object. React dùng shallow merge (`Object.assign(prev, next)`) với class component `this.setState()`, nhưng với `useState`, bạn phải tự spread: `setUser(prev => ({ ...prev, ...updates }))`. Đây là intentional vì immutable updates ngăn accidental mutations.

### Q3: Làm sao cập nhật state phụ thuộc state trước đó?

**Trả lời:** Dùng **functional updater**: `setCount(prev => prev + 1)`. Functional updater nhận previous state và trả về new state. Khi multiple setStates batch cùng nhau, mỗi functional updater đọc fresh previous state. `setCount(count + 1)` khi count=0 và gọi 3 lần → kết quả = 1. `setCount(prev => prev + 1)` 3 lần → kết quả = 3.

### Q4: Khi nào component re-render?

**Trả lời:** (1) `setState`/`useState` setter được gọi; (2) `useReducer` dispatch; (3) Parent component re-renders (children always re-render by default); (4) Props thay đổi (khi parent re-renders); (5) Context value thay đổi (all consumers re-render); (6) `forceUpdate()` được gọi. Children re-render khi parent re-renders vì React không có cách tự động skip — phải dùng `React.memo()`.

### Q5: Reference equality trong state object là gì?

**Trả lời:** React dùng `Object.is()` để so sánh old vs new state/props. `{ a: 1 } !== { a: 1 }` vì chúng là 2 objects khác nhau trong memory. Đây là lý do phải luôn tạo **new reference** khi update object/array state: `setItems([...items, newItem])` hoặc `setUser(prev => ({ ...prev, name: 'Bob' }))`. Đây là nguyên tắc **immutability** trong React.

---

## 11. Thực Hành

### Bài 1: Batch Updates Demo

```jsx
// Tạo component với 3 counters
// Mỗi counter có increment, decrement
// Demo batching:
// Button 1: setCount + 1, setCount + 1, setCount + 1
// → Verify: total re-renders = 1
// Button 2: setCount(count + 1), setCount(count + 1), setCount(count + 1)
// → Verify: total re-renders = 1, nhưng count chỉ tăng 1 lần
// Thêm console.log vào render body → count renders
```

### Bài 2: Object State Management

```jsx
// Tạo component Form với:
// - name (text input)
// - email (text input)
// - bio (textarea)
// - preferences (object: { newsletter, notifications, theme })

// Yêu cầu:
// 1. Dùng single object state hoặc multiple state variables
// 2. Thực hành: update nested object property đúng cách
// 3. Thực hành: update array trong state
```

### Bài 3: Optimistic Update

```jsx
// Tạo LikeButton:
// 1. Click → tăng count NGAY (optimistic)
// 2. Simulate API call với setTimeout (fail 20%)
// 3. Nếu API fail → revert lại
// 4. Dùng saved previous state để revert

function LikeButton({ postId, initialCount }) {
  // Viết code ở đây
}
```

---

## Checklist

- [ ] useState hoạt động bằng hooks array index
- [ ] setState là async và batched
- [ ] Functional updater: dùng khi phụ thuộc previous state
- [ ] Object/Array state: luôn tạo new reference
- [ ] KHÔNG gán trực tiếp: `state.x = y` → phải `setState`
- [ ] Derived values: tính từ props/state, không cần state riêng
- [ ] Children re-render khi parent re-render
- [ ] `Object.is()` so sánh reference, không nested values

---

*Last updated: 2026-04-01*
