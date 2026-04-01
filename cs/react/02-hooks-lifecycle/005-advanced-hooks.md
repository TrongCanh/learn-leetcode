# Advanced Hooks Patterns

## Câu hỏi mở đầu

Bạn đã nắm vững useState, useEffect, useReducer, useMemo, useCallback. Nhưng:

- `useSyncExternalStore` là gì và khi nào cần?
- `useId` là gì?
- `useInsertionEffect` dùng khi nào?
- Viết hooks để share logic giữa nhiều components như thế nào?

---

## 1. useReducer + Context = State Management

### Pattern: State + Dispatch Context

```jsx
const StateContext = createContext(null);
const DispatchContext = createContext(null);

const initialState = { user: null, theme: 'light' };

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user };
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    default:
      return state;
  }
}

function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>
        {children}
      </StateContext.Provider>
    </DispatchContext.Provider>
  );
}

function useStore() {
  const state = useContext(StateContext);
  if (!state) throw new Error('useStore must be inside StoreProvider');
  return state;
}

function useDispatch() {
  const dispatch = useContext(DispatchContext);
  if (!dispatch) throw new Error('useDispatch must be inside StoreProvider');
  return dispatch;
}
```

**Đây chính là pattern cơ bản của Redux.**

---

## 2. useSyncExternalStore

### Định Nghĩa

```jsx
const state = useSyncExternalStore(
  subscribe,    // callback khi store thay đổi
  getSnapshot,  // () => current state
  getServerSnapshot? // () => state for SSR
);
```

### Ví dụ: External Store

```jsx
const store = {
  _state: { count: 0, theme: 'dark' },
  _listeners: [],

  getState() { return this._state; },

  dispatch(action) {
    this._state = reducer(this._state, action);
    this._listeners.forEach(fn => fn());
  },

  subscribe(fn) {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter(l => l !== fn);
    };
  }
};

function Counter() {
  // ✅ useSyncExternalStore = đồng bộ React state với external store
  const state = useSyncExternalStore(
    store.subscribe.bind(store),
    () => store.getState()
  );

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => store.dispatch({ type: 'INC' })}>+</button>
    </div>
  );
}
```

### Khi Nào Cần?

```
Dùng useSyncExternalStore KHI:
  ✓ Dùng external state (vanilla JS store, Web APIs)
  ✓ React 18+ concurrent features cần synchronous reads
  ✓ Muốn integrate Redux/Zustand WITHOUT library adapter

Thường dùng cho:
  • Redux/Zustand internal implementation
  • Browser APIs (online status, media queries)
  • Third-party state libraries
```

---

## 3. useId

### Định Nghĩa

```jsx
// React 18+ — tạo unique ID cho accessibility
const id = useId();
```

### Ví dụ

```jsx
function FormField({ label }) {
  const id = useId(); // unique, stable across renders

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" />
    </div>
  );
}

function LoginForm() {
  return (
    <form>
      <FormField label="Email" /> {/* id: ":r0:..." */}
      <FormField label="Password" /> {/* id: ":r1:..." */}
    </form>
  );
}
```

**Lưu ý**: `useId` tạo IDs stable across SSR và hydration.

---

## 4. useInsertionEffect

### Định Nghĩa

```jsx
// React 18+ — chạy TRƯỚC DOM mutations
useInsertionEffect(() => {
  // Inject <style> tags
}, [deps]);
```

### Khi Nào Dùng?

```jsx
import { useInsertionEffect } from 'react';

function useDynamicCSS(css) {
  useInsertionEffect(() => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, [css]);
}
```

**Thường bạn KHÔNG cần dùng useInsertionEffect** — nó là low-level API cho CSS-in-JS libraries.

---

## 5. Hooks Compositions Pattern

### Middleware-style Hooks

```jsx
function createAsyncHook(asyncFn) {
  return function useAsync(initialParams) {
    const [state, setState] = useState({
      loading: false,
      error: null,
      data: null,
    });

    const execute = useCallback(async (params = initialParams) => {
      setState(s => ({ ...s, loading: true, error: null }));
      try {
        const data = await asyncFn(params);
        setState({ loading: false, error: null, data });
      } catch (err) {
        setState({ loading: false, error: err, data: null });
      }
    }, [asyncFn, initialParams]);

    useEffect(() => {
      execute();
    }, [execute]);

    return { ...state, execute, reload: execute };
  };
}

const useUser = createAsyncHook(fetchUser);
const usePosts = createAsyncHook(fetchPosts);

function UserProfile({ userId }) {
  const { loading, error, data } = useUser(userId);
}
```

---

## 6. useDebugValue

### Định Nghĩa

```jsx
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    function handleOnline() { setIsOnline(true); }
    function handleOffline() { setIsOnline(false); }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useDebugValue(isOnline ? 'Online' : 'Offline');

  return isOnline;
}
```

---

## 7. Các Traps Phổ Biến

### ❌ Trap 1: Hook Trong Loop, Condition

```jsx
// ❌ SAI — rules of hooks violated
function Component({ show }) {
  if (show) {
    const [a, setA] = useState(0); // ❌ hook trong if
  }
  const [b, setB] = useState(0);
}

// ✅ ĐÚNG
function Component({ show }) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
}
```

### ❌ Trap 2: useSyncExternalStore Thiếu getServerSnapshot

```jsx
// ❌ SSR: hydration mismatch nếu không có getServerSnapshot
const state = useSyncExternalStore(
  subscribe,
  getSnapshot,
  // ⚠️ THIẾU = server snapshot = undefined
);

// ✅ ĐÚNG
const state = useSyncExternalStore(
  subscribe,
  getSnapshot,
  () => ({ count: 0 }) // stable snapshot for SSR
);
```

---

## 8. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  Advanced Hooks Patterns                                      │
│                                                               │
│  useReducer + Context = simple state management              │
│  ├── Dispatch pattern cho Redux-like store               │
│  └── Selector = read specific parts of state             │
│                                                               │
│  useSyncExternalStore                                       │
│  ├── Subscribe external state sources                     │
│  └── SSR-safe với getServerSnapshot                   │
│                                                               │
│  useId: stable unique ID cho accessibility               │
│  useInsertionEffect: CSS-in-JS low-level               │
│  useDebugValue: debug custom hooks in DevTools           │
│                                                               │
│  Rules of Hooks: không gọi trong loop/condition/if     │
└──────────────────────────────────────────────────────────────┘
```

---

## 9. Câu Hỏi Phỏng Vấn

### Q1: useSyncExternalStore là gì?

**Trả lời:** useSyncExternalStore là React 18 hook để subscribe vào external state sources (vanilla JS stores, Web APIs, third-party libs). Nhận subscribe callback, getSnapshot, và optional getServerSnapshot. Đảm bảo React re-render khi external store thay đổi, đồng thời tương thích với concurrent features.

### Q2: Rules of Hooks — tại sao?

**Trả lời:** Hooks dùng array index để track state. Gọi hooks trong loop/condition → thứ tự hooks thay đổi → state tracking sai. ESLint plugin enforce rules này. Đây là implementation detail của React.

### Q3: Custom hook có thể dùng custom hook không?

**Trả lời:** Có! Custom hooks có thể call other custom hooks. Ví dụ: `useUserProfile` có thể dùng `useUser` và `useUserPosts`. Đây là composition pattern — tách logic thành layers nhỏ, dễ test và reuse.

### Q4: useId dùng khi nào?

**Trả lời:** Dùng useId để tạo unique IDs cho form labels và inputs (accessibility), ARIA attributes, hay bất kỳ nơi nào cần stable unique ID không thay đổi across renders. useId stable across SSR và hydration.

---

## 10. Thực Hành

### Bài 1: Mini Redux với useReducer + Context

```jsx
// Tạo:
// 1. StateContext + DispatchContext
// 2. Reducer với actions
// 3. useStore() + useDispatch() hooks
// 4. Demo
```

### Bài 2: Browser API Hooks

```jsx
// Tạo:
// 1. useOnlineStatus()
// 2. useWindowSize()
// 3. useMediaQuery(query)
```

---

## Checklist

- [ ] useReducer + Context = simple state management
- [ ] useSyncExternalStore: subscribe external state
- [ ] useId: stable unique ID cho accessibility
- [ ] useInsertionEffect: CSS-in-JS low-level (hiếm cần)
- [ ] Hooks có thể compose — custom hook dùng custom hook
- [ ] useDebugValue: debug custom hooks in DevTools
- [ ] Rules of hooks: không gọi trong loop/condition/if

---

*Last updated: 2026-04-01*
