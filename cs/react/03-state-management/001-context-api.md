# Context API — Internals & Pitfalls Chi Tiết

## Câu hỏi mở đầu

```jsx
function App() {
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [posts, setPosts] = useState([]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, user, setUser, notifications, setNotifications, posts, setPosts }}>
      <Dashboard />
    </ThemeContext.Provider>
  );
}
```

Bạn click notification → toàn bộ app re-render. Tại sao?

---

## 1. Context API — Bản Chất Bên Trong

### Tạo Context

```typescript
// createContext(defaultValue)
// defaultValue: giá trị khi component đọc context KHÔNG có Provider
const ThemeContext = createContext('light'); // default = 'light'
```

### Context Value — Reference Equality Là Tất Cả

```typescript
// Context re-render hoạt động như thế nào?
function App() {
  const [count, setCount] = useState(0);

  // ❌ NEW OBJECT MỖI RENDER
  const value = { count, setCount }; // {} !== {} mỗi render

  return (
    <ThemeContext.Provider value={value}>
      <Dashboard />
    </ThemeContext.Provider>
  );
}

// Dashboard đọc ThemeContext → KHÔNG CÓ Provider → dùng default
// ❌ Nhưng nếu Dashboard đọc value mà không có Provider → crash!

// ✅ Luôn wrap trong Provider:
return (
  <ThemeContext.Provider value={value}>
    <Dashboard />
  </ThemeContext.Provider>
);
```

---

## 2. Context Re-render — Vấn Đề Nghiêm Trọng

### Trigger: Provider Value Change

```
┌──────────────────────────────────────────────────────────────┐
│  RENDER CYCLE:                                              │
│                                                               │
│  1. App re-renders (state thay đổi)                        │
│  2. ThemeContext.Provider receives NEW value prop           │
│     └── {} !== {} (new reference!)                         │
│  3. React marks ALL consumers as dirty                     │
│  4. React re-renders ALL consumers                          │
│                                                               │
│  CONSUMER = component gọi useContext(ThemeContext)         │
│  ALL consumers = every component reading that context       │
└──────────────────────────────────────────────────────────────┘
```

### Demo: Re-render Storm

```jsx
// ❌ BAD: Single large context
const AppContext = createContext({});

function App() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [posts, setPosts] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [sidebar, setSidebar] = useState(false);

  // ❌ Single object: bất kỳ value nào thay đổi → TẤT CẢ re-render!
  const value = {
    user, setUser,
    notifications, setNotifications,
    posts, setPosts,
    theme, setTheme,
    sidebar, setSidebar,
  };

  return (
    <AppContext.Provider value={value}>
      <Layout />         {/* Re-render khi notification đổi? YES! */}
      <Sidebar />        {/* Re-render khi posts đổi? YES! */}
      <Header />         {/* Re-render khi sidebar đổi? YES! */}
      <Notifications /> {/* Re-render khi posts đổi? YES! */}
      <Settings />       {/* Re-render khi sidebar đổi? YES! */}
      <Footer />         {/* Re-render khi notification đổi? YES! */}
    </AppContext.Provider>
  );
}
```

### Memory Visualization

```
BEFORE OPTIMIZATION:
──────────────────────────────────────────────────────────────
State change: notifications = [...]
  → Layout re-render       (50ms)
  → Sidebar re-render      (30ms)
  → Header re-render      (20ms)
  → Notifications re-render (10ms)
  → Settings re-render     (40ms)
  → Footer re-render      (15ms)
  ──────────────────────────────────────
  Total: 165ms × EVERY state change = POOR PERFORMANCE
──────────────────────────────────────────────────────────────

AFTER OPTIMIZATION (split contexts):
──────────────────────────────────────────────────────────────
State change: notifications = [...]
  → Notifications re-render ONLY
  Total: 10ms
──────────────────────────────────────────────────────────────
```

---

## 3. Giải Pháp 1: Tách Context

### Tách Theo Domain

```typescript
// ✅ TÁCH: Mỗi context cho một domain
const UserContext = createContext<UserContextType | null>(null);
const NotificationContext = createContext<NotificationContextType | null>(null);
const ThemeContext = createContext<ThemeContextType | null>(null);
const SidebarContext = createContext<SidebarContextType | null>(null);
```

```jsx
function App() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [sidebar, setSidebar] = useState(false);

  return (
    <>
      {/* User changes → only user consumers re-render */}
      <UserContext.Provider value={{ user, setUser }}>
        <UserConsumer />
      </UserContext.Provider>

      {/* Notifications change → only notification consumers re-render */}
      <NotificationContext.Provider value={{ notifications, setNotifications }}>
        <NotificationBadge />
        <NotificationList />
      </NotificationContext.Provider>

      {/* Theme changes → only theme consumers re-render */}
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <Header />
        <Sidebar />
      </ThemeContext.Provider>

      {/* Sidebar changes → only sidebar consumers re-render */}
      <SidebarContext.Provider value={{ sidebar, setSidebar }}>
        <Layout />
      </SidebarContext.Provider>
    </>
  );
}
```

### Component Tree Optimization

```
BEFORE: Single AppContext
─────────────────────────────────────────────────────────────
<AppContext.Provider>
  <Layout />           ← Consumer: AppContext
    <Header />         ← Consumer: AppContext
    <Sidebar />        ← Consumer: AppContext
    <Content />        ← Consumer: AppContext
      <Dashboard />   ← Consumer: AppContext
        <Chart />      ← Consumer: AppContext
        <Stats />      ← Consumer: AppContext
        <Notifications /> ← Consumer: AppContext
      </Dashboard />
    </Content>
  </Layout>
</AppContext.Provider>

→ ANY state change → ALL components re-render
─────────────────────────────────────────────────────────────

AFTER: Split contexts
─────────────────────────────────────────────────────────────
<UserContext.Provider>
  <UserConsumer />     ← Only UserContext
</UserContext.Provider>

<NotificationContext.Provider>
  <NotificationBadge /> ← Only NotificationContext
  <NotificationList /> ← Only NotificationContext
</NotificationContext.Provider>

<ThemeContext.Provider>
  <Header />           ← Only ThemeContext
  <Sidebar />          ← Only ThemeContext
</ThemeContext.Provider>

<SidebarContext.Provider>
  <Layout />           ← Only SidebarContext
</SidebarContext.Provider>

<Dashboard /> ← NO context (local state hoặc props)
  <Chart /> ← NO context
  <Stats /> ← NO context
</Dashboard>
─────────────────────────────────────────────────────────────
```

---

## 4. Giải Pháp 2: Memoize Provider Value

### useMemo Cho Value Object

```jsx
function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');

  // ✅ useMemo: object chỉ thay đổi KHI deps thay đổi
  const userValue = useMemo(() => ({ user, setUser }), [user]);
  const themeValue = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <UserContext.Provider value={userValue}>
      <ThemeContext.Provider value={themeValue}>
        <Dashboard />
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}
```

### So Sánh: Không Memoize vs Có Memoize

```
┌──────────────────────────────────────────────────────────────┐
│  WITHOUT useMemo:                                              │
│                                                               │
│  function App() {                                            │
│    const [user, setUser] = useState(null);                 │
│    const [theme, setTheme] = useState('dark');            │
│                                                               │
│    const value = { user, setUser, theme, setTheme };     │
│    // ↑ NEW {} every render → Provider re-renders        │
│                                                               │
│    return (                                                 │
│      <Context.Provider value={value}>                      │
│        <Dashboard />                                         │
│      </Context.Provider>                                    │
│    );                                                       │
│  }                                                          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  WITH useMemo:                                               │
│                                                               │
│  function App() {                                            │
│    const [user, setUser] = useState(null);                 │
│    const [theme, setTheme] = useState('dark');            │
│                                                               │
│    const value = useMemo(                                  │
│      () => ({ user, setUser, theme, setTheme }),         │
│      [user, theme]                                          │
│    );                                                       │
│    // ↑ {} chỉ new khi user HOẶC theme thay đổi        │
│                                                               │
│    return (                                                 │
│      <Context.Provider value={value}>                      │
│        <Dashboard />                                         │
│      </Context.Provider>                                    │
│    );                                                       │
│  }                                                          │
└──────────────────────────────────────────────────────────────┘
```

### Callback Memoization

```jsx
function App() {
  const [user, setUser] = useState(null);

  // ❌ NEW FUNCTION every render → consumers re-render
  const updateUser = () => {
    // do something
  };

  // ✅ useCallback: function chỉ thay đổi khi deps thay đổi
  const updateUser = useCallback((data) => {
    setUser(prev => ({ ...prev, ...data }));
  }, []);

  const value = useMemo(() => ({ user, updateUser }), [user, updateUser]);

  return (
    <UserContext.Provider value={value}>
      <Dashboard />
    </UserContext.Provider>
  );
}
```

---

## 5. Giải Pháp 3: useContextSelector Pattern

### Custom Hook: useContextSelector

```typescript
// hooks/useContextSelector.ts
import { useContext, useState, useEffect, useSyncExternalStore } from 'react';

// Selector-based context (not built-in React)
function useContextSelector<T, S>(
  context: React.Context<T>,
  selector: (value: T) => S
): S {
  const contextValue = useContext(context);

  // Selector tự memoize
  const selectedValue = selector(contextValue);

  // Hook state để trigger re-render khi selected value thay đổi
  const [derivedValue, setDerivedValue] = useState(() =>
    selector(contextValue)
  );

  useEffect(() => {
    // Compare: chỉ update khi selected value thực sự thay đổi
    const newValue = selector(contextValue);
    if (!Object.is(derivedValue, newValue)) {
      setDerivedValue(newValue);
    }
  }, [contextValue, selector, derivedValue]);

  return derivedValue;
}

// Usage:
const theme = useContextSelector(ThemeContext, (ctx) => ctx.theme);
// → Chỉ re-render khi ctx.theme thay đổi, không phải ctx thay đổi
```

### Zustand-Style Context

```typescript
// contexts/createStoreContext.ts
import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

type Selector<T> = (state: T) => unknown;
type EqualityFn<T> = (a: T, b: T) => boolean;

export function createStoreContext<T>(initialState: T) {
  const StoreContext = createContext<T | null>(null);
  const UpdateContext = createContext<((action: Partial<T>) => void) | null>(null);

  function Provider({ children, initial }: { children: ReactNode; initial?: Partial<T> }) {
    const [state, dispatch] = useReducer(
      (s: T, action: Partial<T>) => ({ ...s, ...action }),
      { ...initialState, ...initial }
    );

    const update = useCallback((action: Partial<T>) => dispatch(action), []);

    return (
      <UpdateContext.Provider value={update}>
        <StoreContext.Provider value={state}>
          {children}
        </StoreContext.Provider>
      </UpdateContext.Provider>
    );
  }

  function useStore<S>(selector: (state: T) => S, equality?: EqualityFn<S>): S {
    const state = useContext(StoreContext);
    if (!state) throw new Error('useStore must be used within Provider');

    const selected = selector(state);

    // State từ useReducer tự trigger re-render khi update
    // Nhưng selector có thể tạo new reference mỗi lần
    const [derived, setDerived] = useState(() => selected);

    useEffect(() => {
      const newSelected = selector(state);
      const shouldUpdate = equality ? !equality(derived, newSelected) : derived !== newSelected;
      if (shouldUpdate) setDerived(newSelected);
    }, [state, selector, derived, equality]);

    return derived;
  }

  return { Provider, useStore };
}

// Usage:
const { Provider, useStore } = createStoreContext({
  theme: 'light',
  user: null,
});

function ThemeToggle() {
  const theme = useStore((s) => s.theme); // Chỉ re-render khi theme đổi
  const setTheme = useContext(UpdateContext)!;

  return <button onClick={() => setTheme({ theme: 'dark' })}>{theme}</button>;
}
```

---

## 6. Context vs Redux vs Zustand — Khi Nào Dùng

### Decision Tree Chi Tiết

```
┌──────────────────────────────────────────────────────────────┐
│  BẮT ĐẦU: Bạn cần share state?                             │
│  │                                                           │
│  ├── CHỈ 1 component dùng?                                 │
│  │     └── useState() LOCAL ✅ — KHÔNG cần context          │
│  │                                                           │
│  ├── 2-3 sibling components cùng cấp?                      │
│  │     └── Lift state to parent ✅ — props là đủ            │
│  │                                                           │
│  ├── Nhiều levels, ít consumers (< 5)?                     │
│  │     └── Context API ✅ — simple và đủ                    │
│  │                                                           │
│  ├── App-wide, nhiều consumers (10+)?                      │
│  │     │                                                     │
│  │     ├── State thay đổi THƯỜNG XUYÊN (counter, form)?   │
│  │     │     └── Zustand/Redux ✅ — selector pattern        │
│  │     │                                                     │
│  │     ├── State ít thay đổi (theme, locale, auth)?        │
│  │     │     └── Context + useMemo ✅ — đủ                 │
│  │     │                                                     │
│  │     └── Cần middleware (logging, persistence)?           │
│  │           └── Zustand/Redux ✅                          │
│  │                                                           │
│  └── Data từ SERVER?                                         │
│        └── React Query/SWR ✅ — KHÔNG dùng Context/Redux   │
└──────────────────────────────────────────────────────────────┘
```

### So Sánh Chi Tiết

```
┌──────────────────┬──────────────┬───────────────┬────────────────┐
│ Criteria          │ Context API   │ Redux/Zustand │ React Query   │
├──────────────────┼──────────────┼───────────────┼────────────────┤
│ Re-render        │ ALL          │ SELECTED      │ SELECTED       │
│ Optimization      │ consumers    │ subscribers   │ queries        │
├──────────────────┼──────────────┼───────────────┼────────────────┤
│ Boilerplate       │ Low          │ Medium-High   │ Low            │
├──────────────────┼───────────────┼───────────────┼────────────────┤
│ Use Case          │ Theme, auth, │ Complex state│ Server data    │
│                   │ locale, config│ multi-update │ caching       │
├──────────────────┼───────────────┼───────────────┼────────────────┤
│ DevTools          │ Limited      │ ✅ Full       │ ✅ Built-in    │
├──────────────────┼───────────────┼───────────────┼────────────────┤
│ Middleware        │ ❌ None      │ ✅ Yes        │ ✅ Built-in    │
├──────────────────┼───────────────┼───────────────┼────────────────┤
│ Performance       │ ⚠️ O(n)     │ ✅ O(1)      │ ✅ O(1)        │
│ (many consumers)  │ (all re-render)│ (selective)  │ (caching)     │
├──────────────────┼───────────────┼───────────────┼────────────────┤
│ SSR Support       │ ✅           │ ✅           │ ✅             │
└──────────────────┴───────────────┴───────────────┴────────────────┘
```

---

## 7. Context Pattern Thực Chiến

### Pattern: Provider Composition

```typescript
// contexts/providers/AppProviders.tsx

// 1. Individual providers
function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState('dark');
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState([]);
  const value = useMemo(() => ({ notifications, setNotifications }), [notifications]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

// 2. Composed provider
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <ThemeProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </ThemeProvider>
    </UserProvider>
  );
}

// 3. Custom hook để access all contexts
export function useApp() {
  const user = useContext(UserContext);
  const theme = useContext(ThemeContext);
  const notifications = useContext(NotificationContext);
  return { user, theme, notifications };
}
```

### Pattern: Custom Hook Wrappers

```typescript
// contexts/hooks.ts

// Thay vì:
function Header() {
  const { theme, setTheme } = useContext(ThemeContext);
  // ...
}

// ✅ Tạo custom hook:
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

// ✅ Tự động check provider exists:
function Header() {
  const { theme, setTheme } = useTheme(); // Clearer error message
}
```

### Pattern: Selector Hooks

```typescript
// contexts/hooks.ts

// Thay vì đọc toàn bộ context:
const { user, setUser, notifications, setNotifications } = useApp();

// ✅ Chỉ đọc what you need:
export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return {
    user: context.user,
    setUser: context.setUser,
    // Không expose internal state không cần thiết
  };
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be within NotificationProvider');
  return {
    notifications: context.notifications,
    unreadCount: context.notifications.filter(n => !n.read).length,
    markAsRead: context.markAsRead,
  };
}

// Usage — only re-renders when USER changes, not notifications:
function UserAvatar() {
  const { user } = useUser(); // ✅ Only user
}

// Usage — only re-renders when NOTIFICATIONS change:
function NotificationBadge() {
  const { unreadCount } = useNotifications(); // ✅ Only unread count
}
```

---

## 8. Advanced: useSyncExternalStore Cho External State

### Tại Sao Cần?

```typescript
// Context tích hợp với React suspension và concurrent mode
// Nhưng khi kết nối external stores (Redux, Zustand, MobX)
// → useSyncExternalStore đảm bảo consistent reads

import { useSyncExternalStore } from 'react';

// Zustand store:
const zustandStore = create((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
}));

// Context với Zustand:
const ZustandContext = createContext<typeof zustandStore | null>(null);

function ZustandProvider({ children }: { children: ReactNode }) {
  return (
    <ZustandContext.Provider value={zustandStore}>
      {children}
    </ZustandContext.Provider>
  );
}

function useZustandContext<S>(selector: (store: typeof zustandStore) => S): S {
  const store = useContext(ZustandContext);
  if (!store) throw new Error('useZustandContext must be within ZustandProvider');

  return useSyncExternalStore(
    (callback) => {
      // Subscribe: gọi callback khi store thay đổi
      return store.subscribe(callback);
    },
    () => selector(store.getState()), // getSnapshot
    () => selector(store.getState())  // getServerSnapshot (for SSR)
  );
}

// Usage
function Counter() {
  const count = useZustandContext((s) => s.count);
  const inc = useZustandContext((s) => s.inc);

  return (
    <button onClick={inc}>
      Count: {count}
    </button>
  );
}
```

---

## 9. Default Value — Chi Tiết

### Default Value Không Phải "Fallback"

```typescript
const ThemeContext = createContext('light'); // default: 'light'

// Component đọc context KHÔNG có Provider:
function Button() {
  const theme = useContext(ThemeContext);
  // theme = 'light' (default)

  return <button className={theme}>Click</button>;
}

// ❌ Nhưng: Button KHÔNG có Provider ancestor
// → dùng default value
// → Nếu Button nằm ngoài App tree → default được dùng

// ✅ Luôn wrap trong Provider ở root:
// <ThemeContext.Provider value="dark">
//   <App />
// </ThemeContext.Provider>
```

### Khi Nào Default Value Được Dùng

```typescript
// Default value ĐƯỢC dùng khi:
// 1. Component không có Provider ancestor
// 2. Provider.value = undefined (CHỈ khi đó!)

const ThemeContext = createContext('defaultTheme');

// Case 1: Không có Provider → dùng default
function OutsideApp() {
  return <Button />; // Button dùng 'defaultTheme'
}

// Case 2: Provider với undefined value
<ThemeContext.Provider value={undefined}>
  <Button /> {/* Button dùng 'defaultTheme' */}
</ThemeContext.Provider>

// Case 3: Provider với value
<ThemeContext.Provider value="dark">
  <Button /> {/* Button dùng 'dark' */}
</ThemeContext.Provider>
```

---

## 10. Context Với TypeScript

```typescript
// contexts/ThemeContext.tsx
import { createContext, useContext, useState, useMemo, ReactNode } from 'react';

// ─── Types ───
interface Theme {
  mode: 'light' | 'dark';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Partial<Theme>) => void;
  toggleMode: () => void;
}

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: Theme;
}

// ─── Context ───
const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Provider ───
export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>({
    mode: 'light',
    accentColor: '#007bff',
    fontSize: 'medium',
    ...initialTheme,
  });

  const setTheme = (updates: Partial<Theme>) => {
    setThemeState((prev) => ({ ...prev, ...updates }));
  };

  const toggleMode = () => {
    setThemeState((prev) => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : 'light',
    }));
  };

  // ✅ Memoize to prevent unnecessary re-renders
  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleMode }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ─── Hook ───
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// ─── Usage ───
function ThemeToggle() {
  const { theme, toggleMode } = useTheme();
  // TypeScript: theme.mode is 'light' | 'dark'
  // TypeScript: toggleMode() is () => void
}
```

---

## 11. Các Traps Phổ Biến

### ❌ Trap 1: Single Large Context

```jsx
// ❌ BAD: Một context cho mọi thứ
const AppContext = createContext({});
<AppContext.Provider value={{ user, theme, posts, settings, notifications }}>
  <Everything />
</AppContext.Provider>

// ✅ GOOD: Tách context
const UserContext = createContext(null);
const ThemeContext = createContext(null);
const PostsContext = createContext(null);
```

### ❌ Trap 2: Không Memoize Provider Value

```jsx
// ❌ BAD: Object literal trong JSX
<Context.Provider value={{ count, setCount }}>
  <Dashboard />
</Context.Provider>

// ✅ GOOD: useMemo
const value = useMemo(() => ({ count, setCount }), [count]);
<Context.Provider value={value}>
  <Dashboard />
</Context.Provider>
```

### ❌ Trap 3: Đọc Context Trong Render (Side Effect!)

```jsx
// ❌ BAD: Context read trong render body (side effect)
function Component() {
  const theme = useContext(ThemeContext);

  if (theme.mode === 'dark') {
    document.body.className = 'dark'; // ❌ Side effect in render!
  }

  return <div>...</div>;
}

// ✅ GOOD: useEffect cho side effects
function Component() {
  const theme = useContext(ThemeContext);

  useEffect(() => {
    document.body.className = theme.mode;
  }, [theme.mode]);

  return <div>...</div>;
}
```

### ❌ Trap 4: Context Cho Server Data

```jsx
// ❌ BAD: Server data trong Context
function App() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchPosts().then(setPosts);
  }, []);

  return <PostsContext.Provider value={posts}>...</PostsContext.Provider>;
}

// ✅ GOOD: Server data trong React Query
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <Dashboard />
      </AppProviders>
    </QueryClientProvider>
  );
}
```

### ❌ Trap 5: Context Cho Ephemeral State

```jsx
// ❌ BAD: Modal state trong Context toàn cục
const ModalContext = createContext(null);
<ModalContext.Provider value={{ isOpen, open, close }}>
  <App />
</ModalContext.Provider>

// ✅ GOOD: Local state hoặc component gần nhất
function ModalManager() {
  const [isOpen, setIsOpen] = useState(false);
  return <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}
```

---

## 12. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  CONTEXT API — DECISION & PATTERNS                           │
│                                                               │
│  RE-RENDER MECHANISM:                                        │
│  ├── Provider value prop = reference                      │
│  ├── New reference → ALL consumers re-render             │
│  └── This is WHY splitting contexts is important         │
│                                                               │
│  OPTIMIZATION STRATEGIES:                                     │
│  ├── 1. Split contexts by domain                         │
│  ├── 2. Memoize provider value (useMemo)               │
│  ├── 3. Selector hooks (read only what you need)        │
│  ├── 4. useSyncExternalStore for external stores        │
│  └── 5. Colocate state (don't globalize prematurely)   │
│                                                               │
│  CONTEXT vs REDUX vs ZUSTAND:                               │
│  ├── Context: simple, built-in, O(n) re-renders          │
│  ├── Zustand: simple, O(1), selectors                  │
│  ├── Redux: complex, RTK, DevTools, time-travel       │
│  └── React Query: server data, NOT client state        │
│                                                               │
│  BEST PRACTICES:                                            │
│  ├── Separate contexts by domain                        │
│  ├── Always memoize provider value                      │
│  ├── Custom hooks: useX() with error boundary          │
│  ├── Don't use Context for server data                  │
│  ├── Don't use Context for frequently-changing data     │
│  └── Default value: only when no Provider found        │
│                                                               │
│  COMMON ANTI-PATTERNS:                                     │
│  ├── Single large context                               │
│  ├── No memoization in provider                        │
│  ├── Side effects from context read in render          │
│  ├── Context for server data                             │
│  └── Globalizing ephemeral/local state                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 13. Câu Hỏi Phỏng Vấn

### Q1: Context re-render tất cả consumers — giải thích cơ chế?

**Trả lời:** Khi Provider's value prop thay đổi reference, React re-render TẤT CẢ components đã gọi `useContext` để đọc context đó. Cơ chế: Provider nhận new value → React diff → thấy reference khác → đánh dấu tất cả consumers là dirty → batch re-render. Đây là vấn đề performance lớn. VD: `notifications` thay đổi → Dashboard, Header, Sidebar, Footer, Chart — tất cả re-render dù chúng không dùng notifications. Giải pháp: tách context thành nhiều small contexts (UserContext, NotificationContext).

### Q2: Khi nào dùng Context?

**Trả lời:** Dùng Context cho: (1) Data ít thay đổi (theme, locale, auth user); (2) Data cần ở nhiều nơi trong tree nhưng không thường xuyên thay đổi; (3) Simple dependency injection không cần complex state logic. Không dùng Context cho: (1) Server data → React Query/SWR; (2) Frequently changing data (counters, form inputs) → Zustand/useState; (3) Ephemeral state (modal open, dropdown) → local useState; (4) Complex state với nhiều interdependent updates → Redux/Zustand.

### Q3: Context khác Redux thế nào?

**Trả lời:** Context chỉ là dependency injection — không có optimization built-in. Redux có: (1) Selector pattern: component chỉ re-render khi selected value thay đổi; (2) Middleware: logging, persistence, async actions; (3) DevTools: time-travel debugging, action inspection; (4) Immutable updates: Immer; (5) Normalized state: createEntityAdapter. Context tốt cho simple global data, Redux cho complex app state management. Ngoài ra, Context re-render O(n) với n consumers, Redux selector re-render O(1).

### Q4: Tại sao phải memoize provider value?

**Trả lời:** `useMemo` trong Provider ngăn không tạo new object reference khi parent re-renders nhưng state không thay đổi. VD: `<Provider value={{ count, setCount }}>` → parent re-render → new `{}` → Context thấy value changed → all consumers re-render. Với `useMemo`: `const value = useMemo(() => ({ count, setCount }), [count])` → count unchanged → same reference → no re-renders. Đặc biệt quan trọng khi Context có nhiều consumers.

### Q5: useSyncExternalStore là gì và khi nào dùng?

**Trả lời:** `useSyncExternalStore` = hook để subscribe vào external state sources (Redux store, Zustand store, MobX observable, window object). Đảm bảo React tương thích với concurrent features (React 18). Nhận: `subscribe` callback (gọi khi store thay đổi), `getSnapshot` (lấy current state), `getServerSnapshot` (cho SSR). Dùng khi: kết nối Zustand/Redux vào React components để hưởng lợi từ React's concurrent rendering. Zustand và Redux đã tự wrap `useSyncExternalStore` trong `useSelector`/`useStore`.

---

## 14. Thực Hành

### Bài 1: Context Splitting

```typescript
// Refactor single AppContext thành nhiều contexts:
// 1. UserContext: user, setUser, isAuthenticated
// 2. ThemeContext: theme, setTheme, toggleMode
// 3. NotificationContext: notifications, unreadCount, markAsRead
// 4. UIContext: sidebarOpen, modalState

// Demo: thay đổi notification → chỉ NotificationBadge re-render
// Measure: React DevTools Profiler — renders count
```

### Bài 2: Context + useMemo

```typescript
// Tạo ThemeProvider với:
// 1. useMemo cho value object
// 2. useCallback cho setter functions
// 3. Custom hook: useTheme() với error boundary

// Test: parent re-render → consumers KHÔNG re-render nếu theme không đổi
```

### Bài 3: Context vs Redux Decision

```typescript
// Cho mỗi scenario, quyết định dùng gì:

// 1. User authentication state
// → ?

// 2. List of posts from API (paginated)
// → ?

// 3. Modal open/close state
// → ?

// 4. Shopping cart (items, add, remove, update quantity)
// → ?

// 5. Dark/light mode
// → ?

// 6. WebSocket real-time notifications
// → ?

// 7. Form input values (temporary, local)
// → ?
```

---

## Checklist

- [ ] Context re-render: ALL consumers khi provider value đổi reference
- [ ] Fix: tách context theo domain (UserContext, ThemeContext, etc.)
- [ ] Fix: useMemo cho provider value object
- [ ] Fix: useCallback cho provider setter functions
- [ ] Custom hooks: useTheme(), useUser() với error boundary
- [ ] Selector pattern: đọc only what you need
- [ ] KHÔNG dùng Context cho server data → React Query
- [ ] KHÔNG dùng Context cho frequently changing data → Zustand/useState
- [ ] KHÔNG dùng Context cho ephemeral state → local useState
- [ ] Default value: chỉ dùng khi không có Provider ancestor
- [ ] useSyncExternalStore: kết nối external stores (Zustand/Redux)
- [ ] Decision: Context → Zustand/Redux → React Query (theo complexity)

---

*Last updated: 2026-04-01*
