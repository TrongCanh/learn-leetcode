# Optimization Patterns Thực Chiến

## Câu hỏi mở đầu

```jsx
function Dashboard({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard(userId).then(result => {
      setData(result);       // Re-render 1
      setLoading(false);     // Re-render 2
    });
  }, [userId]);

  return (
    <div>
      <Header />              {/* Re-render 1, 2, 3 */}
      <Sidebar />             {/* Re-render 1, 2, 3 */}
      <Chart data={data} />  {/* Re-render 1, 2, 3 */}
      <Table rows={data?.rows} /> {/* Re-render 1, 2, 3 */}
      <Footer />              {/* Re-render 1, 2, 3 */}
    </div>
  );
}
```

Bạn đoán xem: có bao nhiêu lần **toàn bộ component tree** re-render? Và tại sao dù đã dùng `React.memo`, performance vẫn chậm?

**Câu trả lời không nằm ở memo — mà nằm ở architecture.**

---

## 1. State Colocation — Nguyên Tắc Quan Trọng Nhất

### Định nghĩa

> **State Colocation = Đặt state ở nơi gần nhất có thể với nơi nó được sử dụng.**

```
❌ BAD: State ở quá cao trong tree
───────────────────────────────────────────────────────────
App
 └── Dashboard (state: { sidebarOpen, filter, chartData, userPrefs })
      ├── Header (dùng: userPrefs)
      ├── Layout
      │     ├── Sidebar (dùng: sidebarOpen)
      │     └── Content
      │           ├── Chart (dùng: chartData)
      │           └── Table (dùng: filter, chartData)
      └── Footer

→ Khi sidebarOpen thay đổi → TẤT CẢ children re-render!

✅ GOOD: State ở gần nơi dùng
───────────────────────────────────────────────────────────
App
 └── Dashboard
      ├── Header
      ├── Layout
      │     ├── Sidebar
      │     │    └── SidebarOpenProvider ← state ở đây
      │     └── Content
      │           ├── Chart ← có state chartData riêng
      │           └── Table ← có state filter riêng
      └── Footer
```

### Ví dụ Cụ Thể

```jsx
// ❌ BAD: Modal state ở App
function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // isModalOpen chỉ dùng trong Dashboard/Header
  return (
    <div>
      <Header />
      <Dashboard />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

// ✅ GOOD: Modal state ở nơi cần
function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div>
      <Sidebar />
      <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
```

### Colocation với useState Object

```jsx
// ❌ BAD: Một object state chứa mọi thứ
function Form() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    bio: '',
    avatar: null,
    preferences: { theme: 'light', notifications: true },
    lastSaved: null,
  });

  // Thay đổi theme → re-render mọi thứ!
  return (
    <>
      <AvatarPreview avatar={form.avatar} />
      <NameInput value={form.name} />
      <EmailInput value={form.email} />
      <BioInput value={form.bio} />
      <ThemeToggle value={form.preferences.theme} />
      <NotificationToggle value={form.preferences.notifications} />
    </>
  );
}

// ✅ GOOD: Chia state thành chunks nhỏ
function Form() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [prefs, setPrefs] = useState({ theme: 'light', notifications: true });

  return (
    <>
      <AvatarPreview avatar={avatar} />     // Re-render khi avatar đổi
      <NameInput value={name} />             // Re-render khi name đổi
      <EmailInput value={email} />           // Re-render khi email đổi
      <BioInput value={bio} />               // Re-render khi bio đổi
      <Preferences prefs={prefs} setPrefs={setPrefs} /> // Riêng
    </>
  );
}
```

---

## 2. Lazy Initialization — Không Tạo State Đắt Tiền

### Định nghĩa

> **Lazy Initialization = Đặt computation tạo initial state vào function, không phải value — chỉ chạy một lần khi mount.**

```jsx
// ❌ BAD: Computation chạy MỖI render
function ExpensiveList() {
  const [items, setItems] = useState(
    expensiveComputation(largeDataset)  // ❌ Chạy mỗi render!
  );
}

// ✅ GOOD: Function chỉ chạy LẦN ĐẦU
function ExpensiveList() {
  const [items, setItems] = useState(
    () => expensiveComputation(largeDataset)  // ✅ Chỉ chạy 1 lần
  );
}
```

### Khi Nào Cần Lazy Init

```jsx
// 1. Parse JSON lớn
const [data, setData] = useState(() => JSON.parse(largeJsonString));

// 2. Đọc từ localStorage
const [token, setToken] = useState(
  () => localStorage.getItem('auth_token') || null
);

// 3. Tính toán phức tạp từ props
function ProductList({ rawData }) {
  const [processed, setProcessed] = useState(
    () => rawData
      .filter(item => item.available)
      .sort((a, b) => b.price - a.price)
  );
  // Không cần useMemo vì useState lazy init đã đủ
}

// 4. Regex compilation
const [emailRegex] = useState(
  () => new RegExp('^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$')
);
```

---

## 3. Virtualization — Render Chỉ Những Gì Nhìn Thấy

### Vấn đề

```
Bạn có list 10,000 items. Render tất cả:
  → 10,000 DOM nodes
  → 10,000 re-renders khi scroll
  → Memory usage cực lớn
  → 60fps? Quên đi.
```

### Giải pháp: Virtual List

```jsx
import { FixedSizeList } from 'react-window';

function VirtualizedList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ListItem item={items[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}           // Chiều cao viewport
      itemCount={items.length} // Tổng số items
      itemSize={64}          // Chiều cao mỗi item
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

### So sánh Performance

```
RENDERING 10,000 ITEMS:
──────────────────────────────────────────────────────────
No virtualization:
  DOM nodes:     10,000
  Initial paint: ~2000ms
  Scroll FPS:    ~15fps (janky)
  Memory:        ~150MB

With react-window (FixedSizeList):
  DOM nodes:     ~20 (viewport + buffer)
  Initial paint: ~50ms
  Scroll FPS:     60fps ✅
  Memory:        ~10MB
──────────────────────────────────────────────────────────
```

### Variable Size List

```jsx
import { VariableSizeList } from 'react-window';
import { useVirtualizer } from '@tanstack/react-virtual';

function VariableList({ rows }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => rows[index].estimatedHeight,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
          >
            <DynamicHeightRow row={rows[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Infinite Scroll

```jsx
import { useInfiniteQuery } from '@tanstack/react-query';

function InfiniteUserList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['users'],
    queryFn: ({ pageParam = 0 }) => fetchUsers(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const allRows = data?.pages.flatMap(p => p.users) ?? [];

  const virtualizer = useVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    onChange: (items) => {
      const lastItem = items[items.length - 1];
      if (lastItem?.index === allRows.length - 1 && hasNextPage) {
        fetchNextPage();
      }
    },
  });

  return (
    <div ref={parentRef} style={{ height: '100vh', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const isLoaderRow = virtualRow.index >= allRows.length;
          return (
            <div key={virtualRow.key}>
              {isLoaderRow
                ? <LoadingSpinner />
                : <UserRow user={allRows[virtualRow.index]} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 4. Optimistic Updates — UI Trước, Server Sau

### Pattern Cơ Bản

```jsx
function LikeButton({ postId, initialLikes }) {
  const [optimisticLikes, setOptimisticLikes] = useState(initialLikes);
  const [isOptimistic, setIsOptimistic] = useState(false);

  async function handleLike() {
    // 1. Update UI NGAY
    setOptimisticLikes(prev => prev + 1);
    setIsOptimistic(true);

    try {
      // 2. Gửi request lên server
      await api.likePost(postId);
      setIsOptimistic(false);
    } catch (error) {
      // 3. Revert nếu fail
      setOptimisticLikes(initialLikes);
      setIsOptimistic(false);
      showToast('Failed to like. Please try again.');
    }
  }

  return (
    <button onClick={handleLike} disabled={isOptimistic}>
      ❤️ {optimisticLikes}
      {isOptimistic && <LoadingSpinner />}
    </button>
  );
}
```

### Optimistic Delete

```jsx
function TodoList() {
  const [todos, setTodos] = useState(initialTodos);
  const queryClient = useQueryClient();

  async function handleDelete(todoId) {
    // Snapshot để revert
    const previousTodos = todos;

    // Optimistic delete
    setTodos(prev => prev.filter(t => t.id !== todoId));

    try {
      await api.deleteTodo(todoId);
      queryClient.invalidateQueries(['todos']);
    } catch {
      // Revert
      setTodos(previousTodos);
      toast.error('Delete failed');
    }
  }

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          {todo.text}
          <button onClick={() => handleDelete(todo.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

### Optimistic Edit với React Query

```jsx
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: (updatedTodo) => api.updateTodo(updatedTodo),

  onMutate: async (newTodo) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['todo', newTodo.id]);

    // Snapshot previous value
    const previousTodo = queryClient.getQueryData(['todo', newTodo.id]);

    // Optimistically update
    queryClient.setQueryData(['todo', newTodo.id], newTodo);

    return { previousTodo };
  },

  onError: (err, newTodo, context) => {
    // Revert on error
    queryClient.setQueryData(['todo', newTodo.id], context.previousTodo);
  },

  onSettled: (newTodo) => {
    // Sync with server
    queryClient.invalidateQueries(['todo', newTodo.id]);
  },
});
```

---

## 5. Selective Re-render — Splitting Large Components

### Vấn đề: Một State Thay Đổi, Mọi Thứ Re-render

```jsx
// ❌ BAD: Tất cả trong một component
function Dashboard() {
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState([]);
  const [chartData, setChartData] = useState(null);

  // notifications thay đổi → chart và header CŨNG re-render!

  return (
    <div>
      <Header theme={theme} />           {/* Re-render khi notifications đổi */}
      <NotificationBadge count={notifications.length} />
      <Sidebar />
      <Chart data={chartData} />         {/* Re-render khi notifications đổi */}
      <SettingsPanel theme={theme} />
    </div>
  );
}
```

### Giải pháp: Tách Thành Các Component Độc Lập

```jsx
// ✅ Dashboard chỉ quản lý layout, KHÔNG có state gì
function Dashboard() {
  return (
    <div>
      <Header />
      <Sidebar />
      <Content />
      <SettingsPanel />
    </div>
  );
}

// ✅ Mỗi component quản lý state riêng
function Header() {
  const [theme, setTheme] = useState('dark');
  return <header className={theme}>...</header>;
}

function NotificationBadge() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications().then(setNotifications);
  }, []);

  return <span>{notifications.length} new</span>;
}

function Chart() {
  const [data, setData] = useState(null);
  useEffect(() => { fetchChartData().then(setData); }, []);
  return <div>{/* chart */}</div>;
}
```

### Children Với Stable Reference

```jsx
// ❌ children là new object MỖI render
function Layout({ children }) {
  return <div className="layout">{children}</div>;
}

function App() {
  const [count, setCount] = useState(0);
  return (
    <Layout>
      <Sidebar />   {/* ❌ children prop thay đổi khi Layout re-render */}
      <Content />
    </Layout>
  );
}

// ✅ Children là JSX trong parent, KHÔNG phải prop
function App() {
  const [count, setCount] = useState(0);
  return (
    <Layout>
      <Sidebar />
      <Content />
    </Layout>
  );
}
// → Sidebar và Content KHÔNG re-render khi Layout re-render
// → Vì chúng KHÔNG nhận props thay đổi
```

---

## 6. Callback Stabilization — useCallback + useMemo

### Rule of Thumb

```
Dùng useCallback KHI:
  ├── Truyền callback làm PROPS cho React.memo child
  ├── Callback dùng trong dependency array của useEffect
  └── Callback là dependency của useMemo / useCallback khác

KHÔNG CẦN useCallback KHI:
  ├── Callback chỉ dùng TRONG component (không truyền đi)
  ├── Child component KHÔNG dùng React.memo
  └── Callback không trong dependency arrays
```

### Stabilizing Event Handlers

```jsx
const ItemList = React.memo(function ItemList({ items, onDelete }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          {item.name}
          <button onClick={() => onDelete(item.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
});

function Parent() {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState('');

  // ✅ Stable: dùng functional updater → không cần deps
  const handleDelete = useCallback((id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []); // [] → function không bao giờ thay đổi

  // ✅ Stable: filter dùng trong callback, include trong deps
  const handleSearch = useCallback((query) => {
    setFilter(query);
  }, []);

  // ✅ Stable object cho memo child
  const config = useMemo(() => ({
    showActions: true,
    variant: 'compact',
  }), []);

  return (
    <div>
      <SearchBar onSearch={handleSearch} />
      <ItemList items={items} onDelete={handleDelete} config={config} />
      {/* Counter thay đổi → ItemList KHÔNG re-render */}
      <Counter />
    </div>
  );
}
```

### Curry Pattern Cho List Handlers

```jsx
// ❌ Arrow function trong JSX — new function MỖI render
{items.map(item => (
  <button onClick={(e) => handleClick(item.id, e)}>Click</button>
))}

// ✅ Curry pattern — stable reference
const handleClick = useCallback((id) => (e) => {
  console.log('Clicked', id);
}, []);

{items.map(item => (
  <button onClick={handleClick(item.id)}>Click</button>
))}
```

---

## 7. Debounce & Throttle — Giảm Tần Suất Updates

### Debounce: Chờ User Ngừng Gõ

```jsx
function SearchInput() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // Debounce: đợi 300ms sau khi user ngừng gõ
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 0) {
        fetchResults(query).then(setResults);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

### Throttle: Giới Hạn Tần Suất

```jsx
function MouseTracker() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let lastCall = 0;

    function handleMouseMove(e) {
      const now = Date.now();
      if (now - lastCall >= 16) { // ~60fps
        setPosition({ x: e.clientX, y: e.clientY });
        lastCall = now;
      }
    }

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return <div>Mouse: {position.x}, {position.y}</div>;
}
```

### Custom Debounce Hook

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
      fetchResults(debouncedQuery).then(setResults);
    }
  }, [debouncedQuery]);

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {/* debouncedQuery chỉ thay đổi 300ms sau khi ngừng gõ */}
    </>
  );
}
```

---

## 8. Các Traps Phổ Biến

### ❌ Trap 1: Virtualization Sai Chiều Cao

```jsx
// ❌ Fixed height nhưng item thật cao hơn → overlap/gap
<FixedSizeList itemSize={64}>
  {rows.map(row => (
    <Row key={row.id} style={{ minHeight: row.estimatedHeight }} />
    // ⚠️ style.height bị ignore, itemSize=64 cố định!
  ))}
</FixedSizeList>

// ✅ Dùng VariableSizeList khi items có height khác nhau
<VariableSizeList itemSize={(index) => rows[index].estimatedHeight}>
```

### ❌ Trap 2: Optimistic Update Không Revert Đúng

```jsx
// ❌ Không snapshot → không revert được
async function handleDelete(id) {
  setItems(prev => prev.filter(i => i.id !== id)); // ❌ Lost previous state
  try {
    await api.deleteTodo(id);
  } catch {
    // ❌ Không có cách revert!
    // Phải re-fetch toàn bộ list
  }
}

// ✅ Snapshot TRƯỚC khi mutate
async function handleDelete(id) {
  const snapshot = todos; // ✅ Save trước
  setItems(prev => prev.filter(i => i.id !== id));
  try {
    await api.deleteTodo(id);
  } catch {
    setTodos(snapshot); // ✅ Revert chính xác
  }
}
```

### ❌ Trap 3: useCallback Thừa

```jsx
// ❌ useCallback không có memo child = vô nghĩa
const handleClick = useCallback(() => doSomething(), []);

return <RegularChild onClick={handleClick} />;
// RegularChild re-render khi Parent re-render
// → useCallback không giúp gì!

// ✅ Chỉ dùng khi có memo child
const MemoChild = React.memo(({ onClick }) => <button onClick={onClick}>X</button>);
const handleClick = useCallback(() => doSomething(), []);
return <MemoChild onClick={handleClick} />;
```

### ❌ Trap 4: Debounce Trong Dependency Array

```jsx
// ❌ DEBOUNCE KHÔNG HOẠT ĐỘNG trong dependency array
function Search() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    fetchResults(debouncedQuery);
  }, [debouncedQuery]); // ✅ ĐÚNG — debouncedQuery là dependency
}
```

### ❌ Trap 5: State Colocation Quá Mức

```jsx
// ❌ Tách nhỏ QUÁ MỨC → prop drilling ngược
function Page() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  // 20 state variables trong 1 component = quá nhỏ

  return <Form name={name} email={email} />;
  // → Form phải nhận name, email → không cải thiện gì
}

// ✅ Khi siblings CẦN shared state → group lại
function Page() {
  const [form, setForm] = useState({ name: '', email: '' }); // Grouped
  return <Form form={form} setForm={setForm} />;
}
```

---

## 9. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  OPTIMIZATION PATTERNS THỰC CHIẾN                             │
│                                                               │
│  1. STATE COLOCATION (QUAN TRỌNG NHẤT)                        │
│     ├── Đặt state ở nơi gần nhất dùng nó                  │
│     ├── Chia state thành chunks nhỏ                        │
│     └── Tránh một state object lớn chứa mọi thứ           │
│                                                               │
│  2. LAZY INITIALIZATION                                        │
│     ├── useState(() => expensiveComputation)                │
│     └── Chỉ chạy 1 lần khi mount                          │
│                                                               │
│  3. VIRTUALIZATION                                           │
│     ├── react-window cho fixed-size list                   │
│     ├── @tanstack/react-virtual cho variable-size          │
│     ├── Chỉ render items NHÌN THẤY + buffer                │
│     └── Infinite scroll: kết hợp virtual + pagination     │
│                                                               │
│  4. OPTIMISTIC UPDATES                                       │
│     ├── Update UI NGAY → Server request sau               │
│     ├── Snapshot trước → Revert khi fail                   │
│     └── React Query onMutate/onError pattern              │
│                                                               │
│  5. SELECTIVE RE-RENDER                                       │
│     ├── Tách component lớn thành pieces nhỏ               │
│     ├── Mỗi piece có state riêng                          │
│     └── Children là JSX, không phải prop                   │
│                                                               │
│  6. CALLBACK STABILIZATION                                    │
│     ├── useCallback cho memo child props                   │
│     ├── Functional updater: prev => newState               │
│     └── Curry pattern cho list handlers                    │
│                                                               │
│  7. DEBOUNCE & THROTTLE                                      │
│     ├── Debounce: đợi user ngừng action                  │
│     ├── Throttle: giới hạn tần suất                      │
│     └── Custom hooks: useDebounce, useThrottle            │
│                                                               │
│  ⚠️  MEASURE FIRST!                                          │
│  ⚠️  Architecture optimization > micro-optimizations       │
│  ⚠️  Premature optimization = anti-pattern                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 10. Câu Hỏi Phỏng Vấn

### Q1: State colocation là gì và tại sao quan trọng?

**Trả lời:** State colocation = đặt state ở nơi gần nhất có thể với nơi nó được sử dụng. Quan trọng vì React re-render bao gồm tất cả children khi state ở parent thay đổi. Nếu state "mở modal" ở App, thì Header, Sidebar, Chart — không liên quan — cũng re-render. Colocation giới hạn re-render scope, giảm DOM operations. Ví dụ: `isModalOpen` nên ở trong component chứa Modal, không phải App.

### Q2: Virtualization hoạt động như thế nào?

**Trả lời:** Virtualization chỉ render items nằm trong viewport + buffer (thường 3-5 items mỗi direction). Khi scroll, React tính visible range và render/ recycle DOM nodes. `react-window` dùng `position: absolute` để position items trong container có fixed height. Chiều cao total = `itemSize * itemCount`, nhưng DOM chỉ có ~20 nodes thay vì 10,000. Kết quả: initial paint từ 2000ms → 50ms, scroll 60fps.

### Q3: Optimistic update là gì?

**Trả lời:** Optimistic update = update UI trước khi server request hoàn thành. User thấy phản hồi tức thì thay vì chờ network. Pattern: (1) Snapshot current state; (2) Update UI immediately; (3) Send request; (4) On success → invalidate cache; (5) On fail → revert từ snapshot. React Query cung cấp `onMutate`/`onError` callbacks hỗ trợ pattern này.

### Q4: Khi nào DÙNG useCallback?

**Trả lời:** Dùng useCallback khi: (1) Truyền callback làm props cho `React.memo` child — tránh child re-render vì props thay đổi; (2) Callback là dependency trong `useEffect`/`useMemo`/`useCallback` khác — tránh stale closure hoặc re-creation; (3) Callback được dùng trong list rendering với `.map()`. KHÔNG cần khi: child không memo, callback chỉ dùng nội bộ, không trong dependency arrays.

### Q5: Debounce vs Throttle khác nhau thế nào?

**Trả lời:** Debounce: reset timer mỗi lần action xảy ra → chỉ fire khi action NGỪNG trong X ms. Dùng cho: search input, form validation (chờ user ngừng gõ). Throttle: fire action tối đa 1 lần mỗi X ms, không quan tâm có action mới hay không. Dùng cho: scroll handler, mousemove (giới hạn tần suất ~60fps). `lodash.debounce` và `lodash.throttle` là implementations phổ biến.

---

## 11. Thực Hành

### Bài 1: State Colocation

```jsx
// Refactor component này — tách state ra đúng nơi cần:
function BadDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [notifications, setNotifications] = useState([]);
  const [userPrefs, setUserPrefs] = useState({ theme: 'dark' });

  // 5 state variables — đâu là nơi tốt nhất cho mỗi cái?
  return <DashboardLayout>...</DashboardLayout>;
}

// Yêu cầu:
// 1. Phân tích: mỗi state dùng ở đâu trong tree?
// 2. Colocate: di chuyển state đến component cần nó nhất
// 3. Verify: dùng React DevTools Profiler đếm renders
```

### Bài 2: Virtualization + Infinite Scroll

```jsx
// Tạo InfiniteUserList:
// 1. React Query useInfiniteQuery
// 2. @tanstack/react-virtual cho virtualization
// 3. Auto-fetch khi scroll gần cuối
// 4. Optimistic loading state

// Test: 10,000 fake users
// Measure: initial paint, scroll FPS, memory
```

### Bài 3: Optimistic Delete với React Query

```jsx
// Tạo TodoApp với:
// 1. Danh sách todos từ React Query
// 2. Optimistic delete: remove ngay → revert nếu fail
// 3. Simulate 20% failure rate
// 4. Demo: user xóa → thấy disappear → 20% revert
```

---

## Checklist

- [ ] State colocation: đặt state ở nơi gần nhất cần nó
- [ ] Lazy init: `useState(() => expensiveFn())` — tránh re-run
- [ ] Virtualization: list > 100 items → `react-window` hoặc `@tanstack/react-virtual`
- [ ] Infinite scroll: virtual kết hợp pagination
- [ ] Optimistic update: snapshot → update UI → request → revert on error
- [ ] React Query `onMutate`/`onError` cho optimistic pattern
- [ ] Selective re-render: tách component lớn thành pieces nhỏ
- [ ] useCallback: chỉ dùng khi truyền cho memo child hoặc trong deps
- [ ] Debounce: search input (đợi user ngừng)
- [ ] Throttle: scroll/mousemove (giới hạn tần suất)
- [ ] Measure TRƯỚC khi optimize — React DevTools Profiler

---

*Last updated: 2026-04-01*
