# State Management Architecture — Quản Lý State Toàn Cục

## Câu hỏi mở đầu

```javascript
// State management = "Data của app ở ĐÂU?"

// ❌ PROBLEM: State ở khắp nơi
// - Server: database
// - API cache: Redis
// - Client memory: JavaScript variables
// - URL: query params
// - localStorage: persisted user preferences
// - Form inputs: uncontrolled

// ❌ PROBLEM: State không đồng bộ
// - Server: users[0].name = 'Alice'
// - localStorage: users[0].name = 'Bob' (outdated)
// - Redux store: users[0].name = 'Carol' (another copy)
// → Which one is TRUTH?

// ❌ PROBLEM: State không predictable
// - async/await random places
// - Side effects everywhere
// - Mutations without tracking
```

**State management architecture** = thiết kế cách data flow trong application. Từ đâu data đến, ở đâu được lưu, ai được phép thay đổi, và làm sao UI update khi data thay đổi. Bài này cover từ server state đến client state, synchronization patterns.

---

## 1. State Categories

### The 4 types of state

```
┌──────────────────────────────────────────────────────────────┐
│  FOUR TYPES OF STATE                                           │
│                                                               │
│  1. SERVER STATE (Remote)                                     │
│     ├── Source: Database, APIs                                  │
│     ├── Cached in: React Query, SWR, Apollo                  │
│     ├── Characteristics: async, can be stale               │
│     └── Tools: React Query, SWR, Apollo Client, Redux RTK   │
│                                                               │
│  2. URL STATE (Semantic)                                       │
│     ├── Source: Browser URL                                   │
│     ├── Examples: /users?page=2&sort=name                  │
│     ├── Characteristics: shareable, bookmarkable          │
│     └── Tools: react-router, history API                     │
│                                                               │
│  3. FORM STATE (ephemeral)                                    │
│     ├── Source: User input                                    │
│     ├── Examples: form values, validation state              │
│     ├── Characteristics: local, temporary, validating    │
│     └── Tools: React Hook Form, Formik                     │
│                                                               │
│  4. CLIENT STATE (Local)                                       │
│     ├── Source: Browser memory                                │
│     ├── Examples: theme, sidebar open, selected item       │
│     ├── Characteristics: private, fast, not synced       │
│     └── Tools: Zustand, Redux, Jotai, Context API        │
└──────────────────────────────────────────────────────────────┘
```

### State ownership

```javascript
// WHERE TO STORE EACH TYPE:

// SERVER STATE: Don't duplicate!
const { data, isLoading, error, refetch } = useSWR('/api/users', fetcher);
// ✅ One source of truth
// ✅ React Query caches, deduplicates, revalidates
// ❌ Don't also store in Redux!

// URL STATE: Good for shareable filters
const [searchParams, setSearchParams] = useSearchParams();
// URL: /products?category=electronics&minPrice=100
// ✅ User can share URL
// ✅ Browser back/forward works
// ✅ SEO-friendly

// FORM STATE: Local until submit
const { register, handleSubmit, formState } = useForm();
// ✅ No need to store in Redux
// ✅ Performance: only re-render what matters
// ✅ Reset on unmount

// CLIENT STATE: Local when possible
// ✅ Theme: Context or Zustand
// ✅ Modal open state: local
// ✅ Selected tab: local
// ❌ Theme in Redux = overkill
```

---

## 2. Server State Management

### React Query / SWR pattern

```javascript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 30 * 60 * 1000,        // 30 minutes (garbage collected)
      refetchOnWindowFocus: true,     // Refetch when tab focuses
      retry: 3,                       // Retry failed requests
      refetchInterval: false,          // Don't auto-refetch
    }
  }
});

// Query: read server state
function UserList() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json()),
    staleTime: 60 * 1000 // 1 minute before considered stale
  });

  if (isLoading) return <Skeleton />;
  if (isError) return <ErrorMessage error={error} />;

  return <UserList users={data} />;
}

// Mutation: write server state
function CreateUserForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newUser) =>
      fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(newUser)
      }).then(r => r.json()),

    onSuccess: (newUser) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });

      // OR: Optimistic update
      queryClient.setQueryData(['users'], (old) => [...old, newUser]);
    },

    onError: (error, newUser, context) => {
      // Rollback on error
      queryClient.setQueryData(['users'], context?.previousUsers);
    }
  });

  return (
    <form onSubmit={handleSubmit(mutation.mutate)}>
      {/* form fields */}
    </form>
  );
}
```

### Optimistic updates

```javascript
// Optimistic update = update UI BEFORE server responds
// → Instant feedback
// → Rollback if server fails

function ToggleTodo({ todo }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (completed) =>
      fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed })
      }),

    onMutate: async (completed) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      // Snapshot previous value
      const previousTodos = queryClient.getQueryData(['todos']);

      // Optimistically update
      queryClient.setQueryData(['todos'], (old) =>
        old.map(t => t.id === todo.id ? { ...t, completed } : t)
      );

      // Return context for rollback
      return { previousTodos };
    },

    onError: (err, completed, context) => {
      // Rollback on error
      queryClient.setQueryData(['todos'], context.previousTodos);
      toast.error('Failed to update todo');
    },

    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });

  return (
    <Checkbox
      checked={todo.completed}
      onChange={() => mutation.mutate(!todo.completed)}
    />
  );
}
```

---

## 3. Client State Management

### Zustand — Simple, Scalable

```javascript
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

// Store definition
const useStore = create(
  devtools(
    subscribeWithSelector((set, get) => ({
      // State
      user: null,
      cart: [],
      isSidebarOpen: false,
      theme: 'light',

      // Actions
      setUser: (user) => set({ user }),

      addToCart: (item) => set((state) => ({
        cart: [...state.cart, item]
      })),

      removeFromCart: (itemId) => set((state) => ({
        cart: state.cart.filter(item => item.id !== itemId)
      })),

      toggleSidebar: () => set((state) => ({
        isSidebarOpen: !state.isSidebarOpen
      })),

      setTheme: (theme) => set({ theme }),

      // Computed (derived state)
      getCartTotal: () => {
        return get().cart.reduce((sum, item) => sum + item.price, 0);
      },

      getCartItemCount: () => {
        return get().cart.length;
      }
    }))
  )
);

// Usage in component:
function CartIcon() {
  const itemCount = useStore((state) => state.getCartItemCount());
  const toggleSidebar = useStore((state) => state.toggleSidebar);

  return (
    <button onClick={toggleSidebar}>
      <Badge count={itemCount}>
        <ShoppingCart />
      </Badge>
    </button>
  );
}

// Selector patterns:
const user = useStore((s) => s.user);              // Single value
const { user, cart } = useStore((s) => ({           // Multiple values
  user: s.user,
  cart: s.cart
}));
const cart = useStore((s) => s.cart, shallow);      // Shallow equality
```

### Redux Toolkit — When you need it

```javascript
// Redux Toolkit = opinionated Redux with less boilerplate
import { createSlice, configureStore } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query';

// API slice (automatically generates hooks)
const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => '/users',
    }),
    getUser: builder.query({
      query: (id) => `/users/${id}`,
    }),
    createUser: builder.mutation({
      query: (newUser) => ({
        url: '/users',
        method: 'POST',
        body: newUser,
      }),
    })
  })
});

// Slice for UI state
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: 'light',
    sidebarOpen: false,
    notifications: []
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push(action.payload);
    }
  }
});

// Store setup
const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    ui: uiSlice.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware)
});

// Generated hooks
const { useGetUsersQuery, useCreateUserMutation } = api;
const { toggleSidebar } = uiSlice.actions;

// Component usage
function App() {
  const { data: users } = useGetUsersQuery();
  const [createUser] = useCreateUserMutation();
  const theme = useSelector((state) => state.ui.theme);
  const dispatch = useDispatch();

  return (
    <div data-theme={theme}>
      <button onClick={() => dispatch(toggleSidebar())}>
        Toggle
      </button>
    </div>
  );
}
```

### Zustand vs Redux vs Context

```
┌──────────────────────────────────────────────────────────────┐
│  STATE MANAGEMENT TOOLS COMPARISON                            │
│                                                               │
│  Zustand                                                      │
│  ├── Boilerplate: Very minimal                              │
│  ├── Performance: Fine-grained subscriptions              │
│  ├── DevTools: Yes                                       │
│  ├── Async: Manual (thunk)                                 │
│  └── Best for: Simple-medium apps, fast development     │
│                                                               │
│  Redux Toolkit                                               │
│  ├── Boilerplate: Moderate                                 │
│  ├── Performance: Excellent with memoization            │
│  ├── DevTools: Best-in-class                            │
│  ├── Async: RTK Query included                           │
│  └── Best for: Large apps, complex state, team scaling  │
│                                                               │
│  Context API                                                │
│  ├── Boilerplate: Low                                    │
│  ├── Performance: Can cause unnecessary renders       │
│  ├── DevTools: Limited                                   │
│  └── Best for: Simple prop-drilling replacement     │
│                                                               │
│  RULE OF THUMB:                                              │
│  Zustand: Most new React projects                      │
│  Redux Toolkit: Large apps, complex async, RTK Query   │
│  Context: Theme, locale, simple shared state         │
│  NOT Context: Frequent updates, computed values    │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. URL as State

### Search params

```javascript
// URL = State nên được sync
function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse from URL
  const category = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1');
  const minPrice = parseInt(searchParams.get('minPrice') || '0');

  // Sync to URL
  const setCategory = (cat) => {
    setSearchParams(prev => {
      prev.set('category', cat);
      prev.set('page', '1'); // Reset pagination
      return prev;
    });
  };

  const setSort = (sort) => {
    setSearchParams(prev => {
      prev.set('sort', sort);
      prev.set('page', '1');
      return prev;
    });
  };

  return (
    <>
      <FilterPanel>
        <CategoryFilter
          value={category}
          onChange={setCategory}
        />
        <SortSelect value={sort} onChange={setSort} />
        <PriceRange
          value={minPrice}
          onChange={(p) => {
            setSearchParams(prev => {
              prev.set('minPrice', p.toString());
              return prev;
            })}
        />
      </FilterPanel>

      <Pagination
        current={page}
        onChange={(p) => setSearchParams(prev => {
          prev.set('page', p.toString());
          return prev;
        })}
      />
    </>
  );
}

// URL is now shareable: /products?category=electronics&sort=price&page=2&minPrice=100
// Browser back/forward = filter history!
```

### History management

```javascript
// React Router v6 history patterns
import { useNavigate, useLocation } from 'react-router-dom';

// Programmatic navigation
function UserProfile({ userId }) {
  const navigate = useNavigate();

  const goToSettings = () => {
    navigate(`/users/${userId}/settings`);
  };

  const replaceProfile = (newUserId) => {
    navigate(`/users/${newUserId}`, { replace: true });
  };

  return <button onClick={goToSettings}>Settings</button>;
}

// Protected routes with auth state
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Spinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  return children;
}

// Usage:
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />
</Routes>
```

---

## 5. Data Fetching Architecture

###分层 data fetching

```javascript
// LAYER 1: Server Components (React Server Components)
// Fetch directly in component, no client-side fetching
async function UserProfile({ userId }) {
  // This runs on server
  const user = await db.users.find(userId);
  const posts = await db.posts.findByUser(userId);

  return (
    <div>
      <UserHeader user={user} />
      <PostList posts={posts} />
    </div>
  );
}

// LAYER 2: Client Components with React Query
function ProductList() {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000
  });

  if (isLoading) return <Skeleton />;
  return <ProductGrid products={data} />;
}

// LAYER 3: Local state for form/UI state
function CheckoutForm() {
  const form = useForm({
    defaultValues: {
      address: '',
      paymentMethod: 'card'
    }
  });

  return <Form {...form} />;
}
```

### Data fetching patterns

```javascript
// Pattern 1: Fetch on mount (most common)
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  enabled: !!userId // Only fetch if userId exists
});

// Pattern 2: Fetch on event (button click)
const { data, refetch } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  enabled: false // Don't auto-fetch
});

<button onClick={() => refetch()}>Refresh</button>

// Pattern 3: Fetch on parameter change
function UserDetails({ userId }) {
  const { data } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId
  });
}

// Pattern 4: Dependent queries
function UserWithCompany() {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
  });

  const { data: company } = useQuery({
    queryKey: ['company', user?.companyId],
    queryFn: () => fetchCompany(user.companyId),
    enabled: !!user?.companyId // Only fetch when user.companyId exists
  });
}
```

---

## 6. State Synchronization

### Server-client synchronization

```javascript
// Real-time sync pattern: WebSocket + React Query
class RealTimeSync {
  constructor(queryClient) {
    this.queryClient = queryClient;
    this.ws = null;
  }

  connect() {
    this.ws = new WebSocket('wss://api.example.com/realtime');

    this.ws.onmessage = (event) => {
      const { type, payload } = JSON.parse(event.data);

      switch (type) {
        case 'user.updated':
          // Update React Query cache
          this.queryClient.setQueryData(
            ['user', payload.id],
            (old) => ({ ...old, ...payload })
          );
          break;

        case 'post.created':
          // Prepend to list
          this.queryClient.setQueryData(['posts'], (old) => [
            payload,
            ...(old || [])
          ]);
          break;

        case 'post.deleted':
          // Remove from list
          this.queryClient.setQueryData(['posts'], (old) =>
            old?.filter(p => p.id !== payload.id)
          );
          break;
      }
    };

    this.ws.onclose = () => {
      // Reconnect with exponential backoff
      setTimeout(() => this.connect(), 1000);
    };
  }

  disconnect() {
    this.ws?.close();
  }
}

// Integration:
function App() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const sync = new RealTimeSync(queryClient);
    sync.connect();
    return () => sync.disconnect();
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}><App /></QueryClientProvider>;
}
```

### Offline-first pattern

```javascript
// Service Worker + IndexedDB for offline support
class OfflineStore {
  constructor(db) {
    this.db = db;
  }

  async saveOffline(action) {
    // Save action to IndexedDB
    await this.db.offlineActions.add({
      action,
      timestamp: Date.now(),
      synced: false
    });
  }

  async syncOffline() {
    const pending = await this.db.offlineActions
      .where('synced').equals(false)
      .sortBy('timestamp');

    for (const item of pending) {
      try {
        await processAction(item.action);
        await this.db.offlineActions.update(item.id, { synced: true });
      } catch (err) {
        console.error('Sync failed for', item.id, err);
      }
    }
  }
}

// React component with offline support
function OfflineCapableForm() {
  const offlineStore = useOfflineStore();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  const mutation = useMutation({
    mutationFn: submitForm,

    onMutate: async (data) => {
      // Optimistically update
      await offlineStore.saveOffline({ type: 'CREATE_FORM', data });

      // Mark for sync
      await queryClient.setQueryData(['forms', data.id], data);

      return { savedOffline: true };
    },

    onError: () => {
      if (!isOnline) {
        toast.info('Saved offline. Will sync when online.');
      }
    }
  });

  // Auto-sync when back online
  useEffect(() => {
    if (isOnline) {
      offlineStore.syncOffline();
    }
  }, [isOnline]);
}
```

---

## 7. Derived State và Computations

### Computed values

```javascript
// Zustand: computed is just a selector
const useStore = create((set, get) => ({
  items: [],

  // ✅ Computed in selector (calculated on read)
  getTotal: () => get().items.reduce((sum, i) => sum + i.price, 0),
  getCount: () => get().items.length,
  getFilteredItems: (filter) =>
    get().items.filter(i => i.category === filter)
}));

// Usage: computed only runs when accessed
function CartTotal() {
  const total = useStore((s) => s.getTotal()); // Recomputes every render!
  // OR:
  const items = useStore((s) => s.items);
  const total = useMemo(() =>
    items.reduce((sum, i) => sum + i.price, 0),
    [items]
  );
}

// Redux Toolkit: createSelector
import { createSelector } from '@reduxjs/toolkit';

const selectItems = (state) => state.cart.items;

const selectCartTotal = createSelector(
  [selectItems],
  (items) => items.reduce((sum, i) => sum + i.price, 0)
);

const selectFilteredItems = createSelector(
  [selectItems, (_, filter) => filter],
  (items, filter) => items.filter(i => i.category === filter)
);

// React Query: derived data in query
const { data } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts
});

// Derived data = NOT stored, computed when needed
const expensiveProducts = useMemo(() =>
  data?.filter(p => p.price > 100) || [],
  [data]
);
```

---

## 8. Các Traps Phổ Biến

### Trap 1: Duplicating server state in client

```javascript
// ❌ BAD: Store server data in Redux
const { data: users } = useQuery(...);
dispatch(setUsers(users)); // Why?!

// Then: two sources of truth
// React Query cache: users[0].name = 'Alice'
// Redux store: users[0].name = 'Bob'

// ✅ GOOD: Use React Query only for server state
// Redux = client state only
const { data: users } = useQuery(...); // One source of truth
// No Redux for users!
```

### Trap 2: Over-using global state

```javascript
// ❌ Everything in Redux/Zustand = complexity
store.dispatch({ type: 'SET_FORM_INPUT', payload: { field: 'email', value: 'a@b.com' } });

// ✅ Form state = local
const { register, handleSubmit } = useForm();

// ❌ Theme in Redux
dispatch({ type: 'SET_THEME', payload: 'dark' });

// ✅ Theme = Context (simple, rarely changes)
<ThemeProvider theme={theme}>
  <App />
</ThemeProvider>
```

### Trap 3: Normalized state for performance (premature optimization)

```javascript
// ❌ Over-normalized: complex to access/update
{
  users: {
    byId: { '1': { id: '1', name: 'Alice' } },
    allIds: ['1']
  },
  posts: {
    byId: { '1': { id: '1', authorId: '1', title: 'Hi' } },
    allIds: ['1']
  }
}

// Accessing: posts[0].author.name = ?
// users[posts[0].authorId].name = nested lookup!

// ✅ Flat for small-medium apps
// Just use arrays, let React handle rendering
// Normalize only when > 1000 items and performance critical
```

---

## 9. Câu Hỏi Phỏng Vấn

### Câu 1: Server state vs Client state?

**Trả lời:** Server state = data from server/API, can be stale, async, shared with other users. Client state = data in browser, private, synchronous. Server state managed by: React Query, SWR, Apollo, Redux Toolkit Query. Client state: Zustand, Redux, Context. Don't duplicate server state in client stores.

---

### Câu 2: Optimistic update là gì?

**Trả lời:** Optimistic update = update UI BEFORE server responds. User sees instant feedback. If server fails → rollback to previous state. Implementation: `onMutate`: cancel outgoing refetches, snapshot previous state, update cache optimistically. `onError`: restore previous state, show error. `onSettled`: revalidate to sync.

---

### Câu 3: React Query vs Redux?

| | React Query | Redux |
|--|-----------|------|
| Purpose | Server state | Client state |
| Caching | Built-in, automatic | Manual |
| Boilerplate | Low | High |
| DevTools | Query inspector | State inspector |
| Async | Automatic retry | Manual with thunks |
| Best for | Data fetching, caching | Complex client state |

**Trả lời:** Use both! React Query for server state, Redux for complex client state. Don't use Redux for server state — React Query better. Don't use Context for frequently updating state — causes unnecessary re-renders.

---

### Câu 4: URL as state khi nào?

**Trả lời:** URL = state should be shareable and bookmarkable: (1) Filters: `/products?category=electronics`. (2) Pagination: `/posts?page=3`. (3) Sort: `/users?sort=name`. (4) Search: `/search?q=javascript`. (5) Tab: `/dashboard?tab=analytics`. DON'T use URL for: user preferences, form draft state, modal open state, theme.

---

### Câu 5: Derived state best practices?

**Trả lời:** (1) **Don't store derived state** — compute when needed. (2) **Memoize expensive computations** — `useMemo` or `createSelector`. (3) **Normalize only if needed** — flat arrays usually fine for < 1000 items. (4) **Denormalize for reads, normalize for writes** — easier to read, but harder to update.

---

## 10. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  STATE MANAGEMENT ARCHITECTURE                                   │
│                                                               │
│  FOUR STATE TYPES                                             │
│  ├── Server State: React Query, SWR, Apollo                │
│  ├── URL State: react-router, search params               │
│  ├── Form State: React Hook Form, Formik                │
│  └── Client State: Zustand, Redux, Context              │
│                                                               │
│  SERVER STATE                                                  │
│  ├── React Query: caching, deduplication, revalidation   │
│  ├── Optimistic updates: instant feedback + rollback     │
│  ├── Don't duplicate in client stores                   │
│  └── Stale-while-revalidate pattern                    │
│                                                               │
│  CLIENT STATE                                                 │
│  ├── Zustand: simple, scalable, minimal boilerplate    │
│  ├── Redux Toolkit: complex apps, best DevTools       │
│  ├── Context: simple, theme, locale                 │
│  └── NOT for: frequent updates, computed values      │
│                                                               │
│  URL AS STATE                                                 │
│  ├── Filters, pagination, search, sort              │
│  ├── Shareable, bookmarkable, SEO-friendly          │
│  └── NOT for: form state, preferences             │
│                                                               │
│  DERIVED STATE                                                │
│  ├── Computed in selectors/useMemo                │
│  ├── Don't store what's derivable               │
│  └── Normalize only when performance critical   │
│                                                               │
│  ⚠️ One source of truth per data type       │
│  ⚠️ Don't over-globalize state          │
│  ⚠️ Optimistic updates need rollback          │
│  ⚠️ URL = shareable state only            │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Phân biệt được 4 loại state (server, URL, form, client)
- [ ] Dùng được React Query cho server state
- [ ] Implement được optimistic updates
- [ ] Chọn được Zustand vs Redux vs Context
- [ ] Biết khi nào dùng URL state
- [ ] Trả lời được 4/5 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
