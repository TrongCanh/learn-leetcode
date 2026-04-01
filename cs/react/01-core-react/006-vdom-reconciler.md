# Virtual DOM & Reconciliation — Chi Tiết

## Câu hỏi mở đầu

Bạn đã biết React re-renders khi state thay đổi. Nhưng:

- React thực sự update DOM như thế nào?
- Tại sao React dùng Virtual DOM thay vì update trực tiếp?
- Reconciliation algorithm là gì, hoạt động ra sao?
- Fiber là gì và tại sao cần nó?
- Render phase và commit phase khác nhau thế nào?

---

## 1. DOM vs Virtual DOM

### Real DOM — Slow và Expensive

```
Real DOM Problem:
  • DOM APIs là SYNCHRONOUS
  • Mỗi mutation → browser recalculate:
      - Layout (reflow)
      - Paint
      - Composite layers
  • Nhiều mutations = nhiều reflows = CHẬM

Example:
  list.items.forEach(item => {
    div.textContent = item.text; // → reflow mỗi lần!
  });
  // 100 items → 100 reflows → janky UI
```

### Virtual DOM — Smart Wrapper

```
┌──────────────────────────────────────────────────────────────┐
│  Your Code: <div className="active">Hello</div>             │
│   ↓                                                          │
│  React.createElement()                                       │
│   ↓                                                          │
│  Virtual DOM Node (plain object)                             │
│   ↓                                                          │
│  React builds VDOM tree (in-memory)                        │
│   ↓                                                          │
│  React diffs old tree vs new tree                          │
│   ↓                                                          │
│  React applies MINIMAL changes to Real DOM                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Virtual DOM Node — Bản Chất

### Object Structure

```javascript
// Virtual DOM node = plain JavaScript object
{
  $$typeof: Symbol.for('react.element'),  // Marker for React elements

  type: 'h1',           // Tag name hoặc Component function
  key: null,           // List key (for reconciliation)
  ref: null,           // Ref to DOM node

  props: {
    className: 'title',  // Attributes
    children: 'Hello!'     // Children
  },

  // Internal
  _owner: null,
  _store: { validated: false }
}
```

### JSX → Object → DOM

```jsx
// JSX bạn viết
const element = (
  <div className="container">
    <h1>Hello</h1>
    <p>World</p>
  </div>
);

// Compile thành:
React.createElement('div', { className: 'container' },
  React.createElement('h1', null, 'Hello'),
  React.createElement('p', null, 'World')
);

// Thành VDOM tree:
{
  type: 'div',
  props: {
    className: 'container',
    children: [
      { type: 'h1', props: { children: 'Hello' } },
      { type: 'p', props: { children: 'World' } }
    ]
  }
}
```

---

## 3. Reconciliation — Chi Tiết

### Reconciliation Là Gì?

> **Reconciliation = Algorithm để so sánh old VDOM tree với new VDOM tree, xác định minimal changes cần apply vào real DOM.**

```
Old VDOM Tree                              New VDOM Tree
─────────────────                          ──────────────────
<div>                                      <div>
  <p>Count: 0</p>     ← UPDATE          <p>Count: 1</p>
  <button>+</button>  ← SAME            <button>+</button>
</div>                                      </div>

Diffing Result:
  → Only update text content of <p>
  → DOM operations: 1 text node update
```

### Diffing Rules

#### Rule 1: Element Khác Type → Destroy & Recreate

```jsx
// Type thay đổi → destroy toàn bộ subtree
<div>...</div>  →  <span>...</span>
// ↓
// React: destroy <div> và subtree, create <span>
// Old children bị DESTROYED!
```

#### Rule 2: Element Cùng Type (DOM Element)

```jsx
// Same type → update attributes only
<div className="old" id="main">Hello</div>
     ↓
<div className="new" id="main">Hello</div>

Diffing:
  → Update className attribute
  → Keep <div> DOM node
  → Keep text content
  → DOM operations: 1 attribute update
```

#### Rule 3: Element Cùng Type (Component)

```jsx
// Same component type → re-render component
<Counter count={0} />  →  <Counter count={1} />

React:
  1. Gọi <Counter /> với props mới
  2. So sánh returned VDOM với previous VDOM
  3. Apply changes
```

#### Rule 4: List Reconciliation — Key Quan Trọng

```
Không có key (index):
  Old: [A, B, C] → New: [D, A, C]
  React so sánh:
    index 0: A → D   ← changed
    index 1: B → A   ← changed
    index 2: C → C   ← same
  → React: A, B thay đổi → destroy & recreate A, B
  → Bugs: state bị mất, animation broken

Có key (stable ID):
  Old: [A, B, C] → New: [D, A, C]
  React so sánh:
    key=1: A → A     ← same, just moved
    key=2: C → C     ← same, just moved
    key=3: D → D     ← new, insert
    key=4: B → REMOVED
  → React: A, C kept; D insert; B remove
  → Minimal DOM operations ✅
```

### Key Caveat: Index Không Ổn Định

```jsx
// ❌ Index làm key — buggy khi list thay đổi
{ items.map((item, i) => <Item key={i} {...item} />) }

// ✅ Stable unique ID
{ items.map(item => <Item key={item.id} {...item} />) }
```

---

## 4. Fiber Architecture

### Fiber — Work Unit

Từ React 16+, reconciliation dùng **Fiber** — singly linked list tree structure thay thế recursive stack.

```
┌──────────────────────────────────────────────────────────────┐
│  Fiber Node (per component/element)                          │
│                                                               │
│  type:          'div', 'span', hoặc Component function  │
│  key:           list key                                   │
│  stateNode:     actual DOM node / component instance       │
│                                                               │
│  // Tree structure (linked list):                          │
│  child:          first child fiber                        │
│  sibling:        next sibling fiber                         │
│  return:        parent fiber                              │
│                                                               │
│  // Work tracking:                                        │
│  flags:          effect type (UPDATE, INSERT, DELETE)    │
│  subtreeFlags:   effects in children                      │
│  lanes:          priority of this work                    │
│                                                               │
│  // Memoization:                                          │
│  memoizedProps:  props from last render                  │
│  memoizedState:  state from last render                  │
│                                                               │
│  // Update queue:                                          │
│  updateQueue:    pending state updates                    │
└──────────────────────────────────────────────────────────────┘
```

### Fiber Tree = Linked List Tree

```
Fiber Tree Structure:
┌──────────────────────────────────────────────┐
│  App (Fiber)                                 │
│    child: Component (Fiber)                  │
│    sibling: null                             │
│    return: null (root)                       │
│                                                │
│  Component (Fiber)                          │
│    child: Child1 (Fiber)                    │
│    sibling: null                             │
│    return: App (Fiber)                      │
│                                                │
│  Child1 (Fiber)                            │
│    child: null                              │
│    sibling: Child2 (Fiber)                   │
│    return: Component                        │
│                                                │
│  Child2 (Fiber)                            │
│    child: null                              │
│    sibling: null                            │
│    return: Component                        │
└──────────────────────────────────────────────┘

Traversal pattern:
  down (child) → across (sibling) → up (return)
```

---

## 5. Render Phase vs Commit Phase

### Two Phases

```
┌──────────────────────────────────────────────────────────────┐
│  RENDER PHASE (can be interrupted — concurrent mode)        │
│                                                               │
│  1. Component function executes                             │
│     ├── useState() → get/set state from hooks array       │
│     ├── useEffect() → register callback + deps              │
│     └── return JSX                                         │
│                                                               │
│  2. Virtual DOM created                                    │
│                                                               │
│  3. Diffing: reconcile old vs new                          │
│                                                               │
│  4. Create work list (effect list)                        │
│                                                               │
│  ← CAN BE PAUSED (concurrent mode)                        │
│  ← CAN BE RESTARTED                                        │
└──────────────────────────────────────────────────────────────┘
          ↓
┌──────────────────────────────────────────────────────────────┐
│  COMMIT PHASE (synchronous, cannot be interrupted)            │
│                                                               │
│  1. DOM mutations applied (placement, update, deletion)   │
│                                                               │
│  2. useLayoutEffect callbacks (SYNCHRONOUS)                 │
│     └── Runs BEFORE browser paint                          │
│                                                               │
│  3. Browser paint                                          │
│                                                               │
│  4. useEffect callbacks (ASYNCHRONOUS)                    │
│     └── Runs AFTER paint — does NOT block UI               │
└──────────────────────────────────────────────────────────────┘
```

### Side Effects — Ở Đâu?

```
RENDER PHASE:
  ✗ Side effects ở đây = CÓ THỂ INTERRUPTED!
  ✗ Nếu interrupted → side effect chạy 0 lần, 1 lần, hoặc nhiều lần
  ✗ DOM ở trạng thái không xác định

COMMIT PHASE:
  ✓ Side effects safe ở đây
  ✓ useEffect = side effect mechanism
  ✓ useLayoutEffect = synchronous side effects (before paint)
```

---

## 6. Fiber Work Loop

```javascript
// Simplified work loop pseudocode

function workLoop() {
  while (workInProgress !== null) {
    workInProgress = performUnitOfWork(workInProgress);
  }

  if (workInProgress === null && root !== null) {
    commitRoot();  // All work done → commit phase
  }
}

function performUnitOfWork(fiber) {
  // 1. beginWork: compute state, reconcile children
  beginWork(fiber);

  // 2. Return next fiber to process
  if (fiber.child) return fiber.child;
  if (fiber.sibling) return fiber.sibling;

  // 3. No more children → complete this fiber
  completeUnitOfWork(fiber);
}

function commitRoot() {
  // Commit phase: DOM mutations, run effects
  // This runs synchronously and cannot be interrupted
}
```

---

## 7. Concurrent Features — Lanes & Priority

### Priority Lanes (React 18)

React 18 dùng **lanes** (bitmask) cho priority scheduling:

```
┌──────────────────────────────────────────────────────────────┐
│  Lanes (Priority Levels)                                   │
│                                                               │
│  SyncLane       ← Immediate (click, typing)                 │
│    └── blocking, highest priority                           │
│                                                               │
│  InputContinuousLane ← Continuous input (scroll, drag)     │
│                                                               │
│  DefaultLane   ← Default (fetch, setTimeout)               │
│                                                               │
│  TransitionLane ← useTransition, useDeferredValue         │
│    └── can be interrupted, low priority                    │
│                                                               │
│  IdleLane     ← Low priority (prefetch, background)        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### useTransition

```jsx
function Search({ query }) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e) {
    startTransition(() => {
      setQuery(e.target.value); // Lower priority
    });
  }

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending ? <Loading /> : <Results query={query} />}
    </div>
  );
}

// WITHOUT transition:
// typing → immediate re-render → janky (Results slow)

// WITH transition:
// typing → schedule low priority
// → Input updates immediately (high priority)
// → Results re-render when idle (low priority)
```

---

## 8. Traps Phổ Biến

### ❌ Trap 1: Side Effect Trong Render

```jsx
// ❌ RENDER PHASE CÓ THỂ INTERRUPT!
// Side effect ở đây = unpredictable
function Component() {
  console.log('Render');      // ⚠️ Run nhiều lần trong concurrent
  document.title = 'title';  // ❌ Side effect
  return <div>...</div>;
}

// ✅ useEffect = side effect mechanism
function Component() {
  useEffect(() => {
    document.title = 'title';  // ✅ Safe, sau commit
  }, []);
  return <div>...</div>;
}
```

### ❌ Trap 2: Key Thay Đổi Khi Không Cần

```jsx
// ❌ Key thay đổi = destroy & recreate
const [items, setItems] = useState(initialItems);

items.map(item => (
  <Component key={Math.random()} {...item} />  // ❌ Destroy & recreate every render
));
```

### ❌ Trap 3: StrictMode Double-Invoke

```jsx
// React 18 StrictMode: render phase CHẠY 2 LẦN (dev only)
function Component() {
  console.log('Render'); // 2 LẦN trong dev
  return <ExpensiveChild />;
}

// Purpose: phơi bày side effects không clean
// Production: chỉ 1 render thực sự
```

---

## 9. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  VIRTUAL DOM & RECONCILIATION                                │
│                                                               │
│  Virtual DOM = JavaScript object representation of DOM        │
│  └── JSX → React.createElement() → plain object            │
│                                                               │
│  Reconciliation = Diffing Algorithm                         │
│  ├── Element khác type → destroy & recreate                │
│  ├── Element cùng type (DOM) → update attrs               │
│  ├── Element cùng type (Component) → re-render            │
│  └── Lists → dùng key để match                           │
│                                                               │
│  Fiber = Singly Linked List Node                           │
│  ├── child, sibling, return (linked list)               │
│  ├── flags, lanes (work tracking)                       │
│  └── updateQueue (pending updates)                       │
│                                                               │
│  Render Phase vs Commit Phase:                              │
│  ├── Render: interruptible, compute + diff               │
│  └── Commit: synchronous, DOM mutations + effects       │
│                                                               │
│  Concurrent Features:                                      │
│  ├── Lanes = priority scheduling                         │
│  ├── useTransition = low priority updates                │
│  └── Suspense = placeholder during load                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 10. Câu Hỏi Phỏng Vấn

### Q1: Virtual DOM là gì và tại sao cần nó?

**Trả lời:** Virtual DOM = JavaScript object tree mô tả real DOM structure. React dùng VDOM vì direct DOM manipulation là synchronous và expensive (trigger reflow/repaint). VDOM cho phép React batch updates, diffing, và chỉ apply minimal changes vào real DOM. Không phải magic — là strategy để minimize DOM operations và keep UI predictable.

### Q2: Reconciliation hoạt động thế nào?

**Trả lời:** Reconciliation là diffing algorithm so sánh old và new VDOM trees. Element khác type → destroy and recreate. Cùng type → update attrs (DOM) hoặc re-render (component). Lists dùng `key` để match items — có key O(n), không key O(n²) và potential bugs.

### Q3: Fiber là gì?

**Trả lời:** Fiber là internal data structure từ React 16+, thay thế recursive stack reconciliation. Fiber tree = singly linked list tree, cho phép React pause, prioritize, và resume work. Mỗi fiber node có: type, child, sibling, return (linked list), flags (effect type), lanes (priority), updateQueue (pending updates). Đây là nền tảng cho concurrent features.

### Q4: Render phase vs Commit phase?

**Trả lời:** Render phase: compute VDOM, diff, plan updates — **có thể interrupt** (concurrent mode). Side effects không nên ở đây. Commit phase: apply DOM changes, run effects (useLayoutEffect sync, useEffect async) — **không thể interrupt**. Side effects phải trong commit phase (useEffect), không phải render phase.

### Q5: Lanes/priority là gì?

**Trả lời:** Lanes là priority system trong React 18 concurrent mode. Mỗi work unit có priority (SyncLane=highest, TransitionLane=low). High priority (click, typing) interrupt low priority (data fetching). `useTransition` mark updates as low priority. Điều này cho phép UI luôn responsive — user input không bị block bởi heavy computation.

---

## 11. Thực Hành

### Bài 1: Observe Fiber Tree

```jsx
// Trong React DevTools:
// - Components tab → view fiber data
// - Profiler tab → record renders → view fiber work
// Thực hành: click button → observe fiber tree update
```

### Bài 2: Concurrent Demo

```jsx
// Tạo component với useTransition
// Input search → render 1000 items (chậm)
// Observe: typing không bị block
// So sánh với version không dùng useTransition
```

### Bài 3: Key Bug

```jsx
// Tạo list với inputs
// Thêm item vào giữa (không phải đầu/cuối)
// Observe: input values có bị scramble không?
// Fix: stable key
```

---

## Checklist

- [ ] VDOM = JavaScript object representation of DOM
- [ ] VDOM cho phép batching + minimal DOM updates
- [ ] Element khác type → destroy and recreate
- [ ] Element cùng type → update attrs hoặc re-render component
- [ ] List cần stable key để match items
- [ ] Fiber = singly linked list tree structure
- [ ] Render phase: có thể interrupt, side effects KHÔNG chạy ở đây
- [ ] Commit phase: DOM updates + useEffect, không thể interrupt
- [ ] React 18+ dùng Lanes cho priority scheduling
- [ ] Side effects → useEffect, KHÔNG trong render body

---

*Last updated: 2026-04-01*
