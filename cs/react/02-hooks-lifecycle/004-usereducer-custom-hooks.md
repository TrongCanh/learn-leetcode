# useReducer & Custom Hooks

## Câu hỏi mở đầu

Bạn có form với nhiều fields:

```jsx
const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [errors, setErrors] = useState({});
const [isSubmitting, setIsSubmitting] = useState(false);
const [submitted, setSubmitted] = useState(false);
```

Nhiều state → quản lý phức tạp. `useReducer` là giải pháp.

---

## 1. useReducer — Từ Đầu

### Cú pháp

```jsx
const [state, dispatch] = useReducer(reducer, initialArg, init?);
```

### Ví dụ đơn giản

```jsx
const initialState = { count: 0 };

function reducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 };
    case 'DECREMENT':
      return { count: state.count - 1 };
    case 'RESET':
      return { count: 0 };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>+</button>
      <button onClick={() => dispatch({ type: 'DECREMENT' })}>-</button>
      <button onClick={() => dispatch({ type: 'RESET' })}>Reset</button>
    </div>
  );
}
```

---

## 2. useState vs useReducer — Khi Nào Dùng?

```
┌──────────────────────────────────────────────────────────────┐
│  useState:                                                  │
│    ✓ 1-2 state variables                                  │
│    ✓ Simple updates (toggle, increment, set value)          │
│    ✓ Independent state pieces                              │
│                                                              │
│  useReducer:                                                │
│    ✓ Multiple state variables interdependent               │
│    ✓ Complex state transitions (many cases)               │
│    ✓ State updates follow predictable patterns              │
│    ✓ Logic cần test riêng (reducer is pure function)     │
└──────────────────────────────────────────────────────────────┘
```

### useState → useReducer Refactor

```jsx
// ❌ useState với nhiều interrelated state
function Form() {
  const [values, setValues] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    validate(values)
      .then(errors => {
        if (Object.keys(errors).length > 0) {
          setErrors(errors);
          setStatus('error');
        } else {
          submit(values)
            .then(() => setStatus('success'))
            .catch(() => setStatus('error'));
        }
      });
  }
}

// ✅ useReducer
const initialState = {
  values: { name: '', email: '' },
  errors: {},
  status: 'idle',
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: '' },
      };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors, status: 'error' };
    case 'SUBMIT_START':
      return { ...state, status: 'loading' };
    case 'SUBMIT_SUCCESS':
      return { ...state, status: 'success' };
    case 'SUBMIT_ERROR':
      return { ...state, status: 'error' };
    default:
      return state;
  }
}
```

---

## 3. Reducer Pattern — Chi Tiết

### Reducer = Pure Function

```jsx
// ✅ Pure: same input → same output, no side effects
function reducer(state, action) {
  return { ...state, count: state.count + 1 };
}

// ❌ NOT pure: side effect!
function reducer(state, action) {
  if (action.type === 'INCREMENT') {
    fetch('/api/increment');
    return { count: state.count + 1 };
  }
}
```

### Action Payloads

```jsx
function reducer(state, action) {
  switch (action.type) {
    // Simple action (no payload)
    case 'RESET':
      return initialState;

    // Action với payload
    case 'ADD_TODO':
      return {
        ...state,
        todos: [
          ...state.todos,
          { id: Date.now(), text: action.payload.text, done: false }
        ]
      };

    // Action với type + payload
    case 'UPDATE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.id
            ? { ...todo, ...action.updates }
            : todo
        )
      };

    default:
      return state;
  }
}
```

---

## 4. Custom Hooks — Từ Đầu

### Định nghĩa

> **Custom Hook = Function bắt đầu bằng "use" → có thể dùng hooks bên trong → return logic có thể reuse.**

```
Regular Function:    useInput()     ❌ — Syntax error!
Custom Hook:         useInput()     ✅ — "use" prefix = custom hook
```

### Ví dụ: useInput

```jsx
function useInput(initialValue = '') {
  const [value, setValue] = useState(initialValue);

  function handleChange(e) {
    setValue(e.target.value);
  }

  function reset() {
    setValue(initialValue);
  }

  return { value, onChange: handleChange, reset, setValue };
}

function LoginForm() {
  const name = useInput('');
  const email = useInput('');

  return (
    <form>
      <input {...name} placeholder="Name" />
      <input {...email} type="email" placeholder="Email" />
      <button type="button" onClick={() => { name.reset(); email.reset(); }}>
        Clear
      </button>
    </form>
  );
}
```

### Ví dụ: useDebounce

```jsx
function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function Search() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      fetchResults(debouncedQuery);
    }
  }, [debouncedQuery]);

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

### Ví dụ: useLocalStorage

```jsx
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function
        ? value(storedValue)
        : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}
```

---

## 5. Custom Hooks Patterns

### Pattern 1: Compound Hook

```jsx
function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  const reset = useCallback(() => setCount(initial), [initial]);
  return { count, increment, decrement, reset };
}

function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle];
}

function useCounterToggle() {
  const counter = useCounter(0);
  const [isActive, toggleActive] = useToggle(false);
  return { ...counter, isActive, toggleActive };
}
```

### Pattern 2: Hook với Reducer

```jsx
function useAsync(asyncFn, immediate = true) {
  const [state, dispatch] = useReducer((prev, action) => {
    switch (action.type) {
      case 'START':
        return { loading: true, error: null, data: null };
      case 'SUCCESS':
        return { loading: false, error: null, data: action.payload };
      case 'ERROR':
        return { loading: false, error: action.payload, data: null };
      default:
        return prev;
    }
  }, { loading: false, error: null, data: null });

  useEffect(() => {
    if (!immediate) return;

    dispatch({ type: 'START' });
    asyncFn()
      .then(data => dispatch({ type: 'SUCCESS', payload: data }))
      .catch(err => dispatch({ type: 'ERROR', payload: err }));
  }, [asyncFn, immediate]);

  const execute = useCallback(() => {
    dispatch({ type: 'START' });
    return asyncFn()
      .then(data => dispatch({ type: 'SUCCESS', payload: data }))
      .catch(err => dispatch({ type: 'ERROR', payload: err }));
  }, [asyncFn]);

  return { ...state, execute };
}
```

---

## 6. Các Traps Phổ Biến

### ❌ Trap 1: Reducer không return new state

```jsx
function reducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      state.count++; // ❌ MUTATE state!
      return state; // ⚠️ same reference = React nghĩ nothing changed

    case 'INCREMENT_CORRECT':
      return { ...state, count: state.count + 1 }; // ✅ new object
  }
}
```

### ❌ Trap 2: useReducer với complex side effects

```jsx
// ❌ Side effect trong reducer = BAD
function reducer(state, action) {
  if (action.type === 'LOGIN') {
    localStorage.setItem('token', action.token); // ❌ side effect!
    return { ...state, user: action.user };
  }
}

// ✅ Side effect RA KHỎI reducer
function reducer(state, action) {
  if (action.type === 'LOGIN') {
    return { ...state, user: action.user };
  }
}
// Trong component:
dispatch({ type: 'LOGIN', user, token });
localStorage.setItem('token', token); // ✅
```

### ❌ Trap 3: Custom hook không có "use" prefix

```jsx
// ❌ Function bắt đầu = use nhưng không phải hook
function MyComponent() {
  const data = input(''); // ❌ Syntax error hoặc silent failure
}

// ✅ Hook phải bắt đầu bằng "use"
function MyComponent() {
  const data = useInput(''); // ✅
}
```

---

## 7. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  useReducer = useState + tập trung logic                   │
│  ├── Reducer: pure function, return new state (never mutate) │
│  ├── useState → useReducer khi state phức tạp             │
│  └── Side effects: RA KHỎI reducer, vào useEffect       │
│                                                               │
│  Custom Hooks                                               │
│  ├── Function bắt đầu "use", có thể call hooks          │
│  ├── Mỗi component dùng hook → INDEPENDENT state        │
│  ├── Compose được: hook dùng hook                       │
│  └── Reducer + Custom Hook = powerful state logic       │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Câu Hỏi Phỏng Vấn

### Q1: useReducer hoạt động như thế nào?

**Trả lời:** useReducer nhận reducer function và initial state. Reducer là pure function nhận current state + action, trả về new state. `dispatch()` gửi action → reducer xử lý → new state → re-render. useReducer tương đương useState + switch statement logic, nhưng tập trung logic và dễ test.

### Q2: Khi nào dùng useReducer thay vì useState?

**Trả lời:** Dùng useReducer khi: (1) multiple state variables có relationship; (2) complex state transitions với nhiều cases; (3) state logic cần tách riêng để test; (4) predictable state transitions (state machine-like). useState cho simple independent state.

### Q3: Custom hooks là gì và khi nào dùng?

**Trả lời:** Custom hook = function start với "use", có thể call other hooks, return reusable logic. Dùng khi: logic dùng lại across multiple components, logic quá phức tạp cho component body, muốn tách concerns.

### Q4: Custom hook có share state không?

**Trả lời:** Mỗi component dùng hook → nhận INDEPENDENT state instance. useInput() dùng trong 2 components → mỗi component có state riêng. Hooks share logic, không share state.

### Q5: Reducer phải là pure function — tại sao?

**Trả lời:** Reducer phải pure vì React có thể call reducer multiple times (StrictMode), discard results, hoặc replay với different actions. Side effects trong reducer = unpredictable behavior. Side effects nên ở useEffect hoặc dispatch result handlers.

---

## 9. Thực Hành

### Bài 1: useReducer Todo App

```jsx
// Tạo Todo App với useReducer
// Actions: ADD_TODO, TOGGLE_TODO, DELETE_TODO, CLEAR_DONE
// State: { todos: [], filter: 'all' }
// Bonus: persist vào localStorage
```

### Bài 2: Custom Hook Library

```jsx
// Tạo hooks sau:
// 1. useToggle(initial)
// 2. useArray(initialArray)
// 3. usePrevious(value)
// 4. useOnClickOutside(ref, handler)
```

---

## Checklist

- [ ] useReducer = useState +集中的 logic
- [ ] Reducer: pure function, return new state (never mutate)
- [ ] useState → useReducer khi state phức tạp, có relationship
- [ ] Custom hook: function bắt đầu "use", call hooks, reuse logic
- [ ] Mỗi hook instance = independent state
- [ ] Side effects: ra khỏi reducer, vào useEffect
- [ ] Reducer dễ test vì là pure function

---

*Last updated: 2026-04-01*
