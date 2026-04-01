# React Internals — Fiber, Scheduler, Lanes

## Câu hỏi mở đầu

Bạn đã biết React re-renders khi state thay đổi. Nhưng:

- React thực sự làm gì GIỮA render và commit?
- Fiber nodes là gì và hoạt động ra sao?
- Scheduler và Lanes khác nhau thế nào?
- Concurrent mode thực sự làm được gì?

---

## 1. Rendering Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│  1. TRIGGER                                                  │
│     ├── setState() → mark Update                             │
│     └── render phase begins                                   │
│                                                                  │
│  2. RENDER PHASE (interruptible)                             │
│     ├── Walk fiber tree (beginWork)                          │
│     ├── Compute new state (reconcile)                        │
│     ├── Diff children                                         │
│     └── Create work list (effect list)                       │
│         ← CAN BE PAUSED (concurrent mode)                    │
│         ← CAN BE RESTARTED                                   │
│                                                                  │
│  3. COMMIT PHASE (synchronous, cannot interrupt)             │
│     ├── DOM mutations (placement, update, deletion)           │
│     ├── run Layout effects (useLayoutEffect)              │
│     └── schedule useEffect callbacks                        │
│                                                                  │
│  4. AFTER COMMIT                                            │
│     └── useEffect callbacks run (async)                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Fiber Architecture

### Fiber Node Structure

```
┌──────────────────────────────────────────────────────────────┐
│  Fiber Node                                                     │
│  type:           'div' / Component function                  │
│  stateNode:      actual DOM node / component ref            │
│  child:          first child fiber                           │
│  sibling:        next sibling fiber                          │
│  return:         parent fiber                               │
│  flags:          effect type (Update, Insert, Delete)        │
│  lanes:          priority of this work                     │
│  memoizedProps:  props from last render                     │
│  updateQueue:    pending state updates                      │
└──────────────────────────────────────────────────────────────┘
```

### Fiber Tree = Linked List Tree

```
Traversal:
  down (child) → across (sibling) → up (return)
```

---

## 3. Render Phase vs Commit Phase

```
RENDER PHASE (interruptible):
  • Compute new VDOM
  • Diff children
  • Create effect list
  • Side effects KHÔNG chạy ở đây

COMMIT PHASE (synchronous, cannot interrupt):
  • DOM mutations applied
  • useLayoutEffect callbacks (sync)
  • useEffect callbacks (async)
```

---

## 4. Lanes — Priority System

```
SyncLane       ← Immediate (click, typing)
InputLane     ← Continuous (scroll, drag)
DefaultLane   ← Default (fetch, setTimeout)
TransitionLane ← useTransition
IdleLane     ← Prefetch
```

---

## 5. useTransition

```jsx
function Search({ query }) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e) {
    startTransition(() => {
      setQuery(e.target.value); // Low priority
    });
  }

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending ? <Loading /> : <Results query={query} />}
    </div>
  );
}
```

---

## Checklist

- [ ] Fiber = singly linked list node per component
- [ ] Render phase = interruptible (concurrent)
- [ ] Commit phase = synchronous, cannot interrupt
- [ ] Side effects = useEffect (commit phase)
- [ ] Lanes = priority scheduling system

---

*Last updated: 2026-04-01*
