# Stale Closure — Tại Sao Xảy Ra

## Câu hỏi mở đầu

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      console.log('Count:', count); // ???
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []); // empty deps

  return <div>{count}</div>;
}
```

Bạn mong muốn counter tăng: 1, 2, 3... Nhưng counter dừng ở 1. Tại sao?

**Đây là stale closure — bug phổ biến nhất trong React.**

---

## 1. Closure — Ôn Lại Nhanh

### Closure = Function Nhớ Environment

```javascript
function makeCounter() {
  let count = 0;  // biến được "nhớ"

  return function increment() {
    count++;
    return count;
  };
}

const counter = makeCounter();
counter(); // 1
counter(); // 2
counter(); // 3
```

`increment` closure nhớ `count` từ lần gọi `makeCounter()`. Dù `makeCounter()` đã return rồi, `count` vẫn tồn tại trong closure scope.

---

## 2. Stale Closure — Định Nghĩa

> **Stale Closure = Khi closure capture một giá trị đã LỖI THỜI (stale) — giá trị từ thời điểm scope được tạo, không phải giá trị hiện tại.**

### Ví dụ Cơ Bản Nhất

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      console.log('Count is:', count); // ???
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []); // deps = []

  return <div>{count}</div>;
}
```

```
Timeline:
  Mount: useEffect runs
    → Closure captures count = 0
    → setInterval fires
    → setCount(0 + 1) → count = 1
    → setCount(0 + 1) → count = 1 (STALE!)
    → setCount(0 + 1) → count = 1 (STALE!)

  count NEVER goes beyond 1
```

**Tại sao?** `count` trong `setCount(count + 1)` là value được closure capture từ lần `useEffect` setup — giá trị đó là `0`. `count` trong React state đã thay đổi (1), nhưng closure vẫn dùng `0`.

---

## 3. Các Trường Hợp Stale Closure

### Trường Hợp 1: Empty Deps + State

```jsx
// ⚠️ STALE
useEffect(() => {
  function handleClick() {
    setMessage(message); // message = stale forever!
  }
  document.addEventListener('click', handleClick);
  return () => document.removeEventListener('click', handleClick);
}, []); // ⚠️ message not in deps

// ✅ FIX 1: functional updater
useEffect(() => {
  function handleClick() {
    setMessage(prev => prev); // ✅ fresh
  }
  document.addEventListener('click', handleClick);
  return () => document.removeEventListener('click', handleClick);
}, []);

// ✅ FIX 2: include in deps
useEffect(() => {
  function handleClick() {
    setMessage(message); // ✅ fresh (re-created when message changes)
  }
  document.addEventListener('click', handleClick);
  return () => document.removeEventListener('click', handleClick);
}, [message]); // ⚠️ Re-create listener mỗi message change
```

### Trường Hợp 2: Object/Array Dependency

```jsx
const [config, setConfig] = useState({ theme: 'dark', font: 14 });

// ⚠️ Empty deps → stale object
useEffect(() => {
  applyTheme(config); // config = {} từ lần đầu
}, []); // ⚠️ config không trong deps

// ⚠️ Object trong deps → effect re-run MỖl render (vì new reference)
useEffect(() => {
  applyTheme(config);
}, [config]); // {} !== {} mỗi render
```

### Trường Hợp 3: useCallback Stale Reference

```jsx
// ⚠️ STALE
const handleSubmit = useCallback((data) => {
  submitForm(data, extraData); // extraData = stale!
}, []); // ⚠️ empty deps

// ✅ FIX
const handleSubmit = useCallback((data) => {
  submitForm(data, extraData); // ✅ fresh
}, [extraData]);
```

---

## 4. Cách Fix Stale Closure

### Fix 1: Functional Updater (LUÔN Ưu Tiên)

```jsx
// ✅ Khi cập nhật state
setCount(prev => prev + 1);      // ✅ reads FRESH state
setItems(prev => [...prev, item]); // ✅
setUser(prev => ({ ...prev, name })); // ✅
```

**Khi nào dùng?** Khi new state phụ thuộc vào previous state.

### Fix 2: Đúng Dependency Array

```jsx
// ✅ Include trong deps
useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1); // ✅ fresh (effect re-created when count changes)
  }, 1000);
  return () => clearInterval(timer);
}, [count]); // ⚠️ Cleanup + re-create interval mỗi lần
```

### Fix 3: useRef để Lưu Mutable Value

```jsx
function Component({ url }) {
  const [data, setData] = useState(null);

  // ✅ Ref giữ stable reference, value có thể update
  const urlRef = useRef(url);
  urlRef.current = url; // update ref mỗi render

  useEffect(() => {
    const controller = new AbortController();
    fetch(urlRef.current, { signal: controller.signal })
      .then(res => res.json())
      .then(setData);

    return () => controller.abort();
  }, []); // ✅ urlRef stable → effect không re-run

  return <div>{JSON.stringify(data)}</div>;
}
```

**Khi nào dùng ref thay vì deps?**

```
Dùng ref khi:
  • Cần stable reference (không re-run effect)
  • Value dùng bên trong async callback
  • Value là optional/legacy

Dùng deps khi:
  • Cần re-run effect khi value thay đổi
  • Value là primary trigger cho effect
```

### Fix 4: useCallback với Correct Deps

```jsx
// ✅ useCallback memoize function, giữ stable reference
const handleClick = useCallback((id) => {
  setItems(prev => [...prev, id]);
}, []); // ✅ empty deps = stable

// ✅ Khi cần deps
const handleSearch = useCallback((query) => {
  search(query, filter); // filter = fresh
}, [filter]);
```

---

## 5. Visual Summary

```
┌──────────────────────────────────────────────────────────────┐
│  CLOSURE TIMELINE                                           │
│                                                               │
│  Render #1:                                                 │
│    useState(0)                                             │
│    useEffect runs → closure captures count = 0              │
│    ↓ closure created with count=0                          │
│                                                               │
│  Render #2:                                                 │
│    useState(1)                                             │
│    useEffect SKIPS (deps=[])                               │
│    ↓ BUT closure still holds count=0!                      │
│                                                               │
│  Click → setCount(count + 1)                             │
│    closure.count + 1 = 0 + 1 = 1  ← stale forever        │
│                                                               │
└──────────────────────────────────────────────────────────────┘

FIX:
  useEffect(() => {
    setCount(prev => prev + 1); // ✅ reads FRESH state
  }, []);
```

---

## 6. Liên Hệ Với JavaScript Core

Stale closure xuất phát từ cách JavaScript closure hoạt động ở engine level:

```javascript
// JS Engine: mỗi function có [[Environment]] reference
// [[Environment]] trỏ đến LexicalEnvironment tại thời điểm function được TẠO

function outer() {
  let x = 0;
  return function inner() {
    return x; // inner()'s [[Environment]] → outer()'s scope
  };
}

// x được lưu trong outer()'s scope
// inner() nhìn thấy x qua [[Environment]] chain

// Trong synchronous code:
outer()(); // x = 0
outer()(); // x = 0 — tạo NEW closure mỗi lần gọi outer()

// NHƯNG trong async:
function outer() {
  let x = 0;
  setTimeout(() => {
    console.log(x); // x = 0 (tại thời điểm setTimeout được gọi)
  }, 1000);
  x = 5; // sau 1s, vẫn log 0!
}

// React stale closure tương tự
// → Effect callback được tạo với closure chứa state
// → Không tự động update khi state thay đổi
```

---

## 7. Các Traps Phổ Biến

### ❌ Trap 1: Nghĩ rằng Empty Deps [] = "Chạy Một Lần"

```jsx
// ❌ [] không nghĩa là "never use fresh values"
// [] chỉ nghĩa là "setup một lần, cleanup một lần"
useEffect(() => {
  setCount(count + 1); // stale!
}, []);
```

### ❌ Trap 2: Thêm Object Vào Deps Mà Không Hiểu

```jsx
// ⚠️ Object mới mỗi render = effect re-run mỗi render
useEffect(() => {
  applyTheme(config);
}, [config]); // config = {} mới mỗi render → re-run

// ✅ Dùng useMemo
const config = useMemo(() => ({ theme }), [theme]);
useEffect(() => {
  applyTheme(config);
}, [config]); // ✅ stable reference
```

### ❌ Trap 3: useRef Nhầm Với useState

```jsx
// ❌ useRef không trigger re-render khi .current thay đổi
const countRef = useRef(0);
countRef.current++; // Component KHÔNG re-render

// ✅ Dùng useState cho UI state
const [count, setCount] = useState(0);
setCount(count + 1); // ✅ re-render
```

---

## 8. Câu Hỏi Phỏng Vấn

### Q1: Stale closure là gì trong React?

**Trả lời:** Stale closure = khi function (closure) capture giá trị từ scope tại thời điểm được tạo, nhưng giá trị đó đã thay đổi sau đó. Trong React: useEffect callback capture state từ lần setup, nhưng state thay đổi qua re-render → closure dùng giá trị cũ. Ví dụ: `setInterval(() => setCount(count + 1), 1000)` với `[]` → count luôn là 0.

### Q2: Cách fix stale closure trong useEffect?

**Trả lời:** (1) **Functional updater**: `setCount(prev => prev + 1)` — luôn ưu tiên khi update state phụ thuộc previous state. (2) **Correct deps array**: include value trong deps để re-create effect. (3) **useRef**: `ref.current` luôn đọc giá trị mới nhất nhưng stable reference.

### Q3: useRef giải quyết stale closure như thế nào?

**Trả lời:** useRef tạo object với stable reference — `ref.current` có thể thay đổi nhưng ref object reference giữ nguyên. Trong useEffect, dùng `ref.current` bên trong async callback (chạy sau render) → luôn đọc giá trị mới nhất từ `ref.current`. Không trigger re-run effect khi value thay đổi. Dùng ref khi cần stable reference không re-run effect.

### Q4: Khi nào dùng ref thay vì deps?

**Trả lời:** Dùng ref khi: (1) cần stable reference không trigger effect re-run; (2) value dùng trong async callback; (3) value là "informational" không phải trigger. Dùng deps khi effect cần re-run khi value thay đổi. Ref cho "read latest value without re-running", deps cho "re-run when value changes".

### Q5: Tại sao empty deps [] không fix stale closure?

**Trả lời:** `[]` chỉ nghĩa là "chỉ setup một lần". Closure vẫn capture giá trị từ thời điểm mount. `count` trong `setCount(count + 1)` vẫn là `0` forever vì closure capture `0` lúc mount. Empty deps không làm closure update — chỉ ngăn effect re-run.

---

## 9. Thực Hành

### Bài 1: Identify Stale Closure

```jsx
// Tìm stale closure:
function Search({ query }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    const id = setTimeout(() => {
      fetch(`/search?q=${query}`)
        .then(res => res.json())
        .then(data => setResults(data));
    }, 300);
    return () => clearTimeout(id);
  }, []); // ← Bug ở đây!

  return <ul>{results.map(r => <li key={r.id}>{r.title}</li>)}</ul>;
}
```

### Bài 2: Fix Multiple Scenarios

```jsx
// Fix bằng 3 cách:
// 1. Event listener với state
// 2. setInterval với state
// 3. Async fetch với latest props
```

---

## Checklist

- [ ] Stale closure = closure capture giá trị cũ, không tự update
- [ ] Empty deps [] vẫn capture giá trị từ thời điểm mount
- [ ] Functional updater: fix #1 cho state updates
- [ ] Correct deps array: fix #2 cho refs/triggers
- [ ] useRef: stable reference cho async callbacks
- [ ] useRef KHÔNG trigger re-render khi .current thay đổi
- [ ] Stale closure = hiểu sai closure + dependency array

---

*Last updated: 2026-04-01*
