# Redux vs Zustand — So Sánh Chi Tiết

## Câu hỏi mở đầu

Bạn cần global state cho app 50+ components. Lựa chọn:

```
Redux:
  - Boilerplate: 200+ lines setup
  - DevTools: time-travel debugging
  - Ecosystem: Redux Toolkit, RTK Query, Redux Saga
  - Learning curve: steep

Zustand:
  - Boilerplate: ~20 lines
  - DevTools: basic
  - Ecosystem: minimal
  - Learning curve: flat
```

**Khi nào chọn cái nào?**

---

## 1. Redux Toolkit — Hiện Đại (2024+)

### Setup Hoàn Chỉnh

```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import userReducer from './slices/userSlice';
import postsReducer from './slices/postsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    posts: postsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// ─── Type Exports ───
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ─── Typed Hooks ───
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### Redux Slice

```typescript
// store/slices/userSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userApi } from '@/features/users/api/usersApi';
import type { User } from '@/features/users/types';

// ─── Types ───
interface UserState {
  currentUser: User | null;
  users: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  users: [],
  loading: false,
  error: null,
};

// ─── Async Thunks ───
export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrentUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const user = await userApi.getById(userId);
      return user;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch user');
    }
  }
);

export const loginUser = createAsyncThunk(
  'user/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const result = await userApi.login(credentials);
      localStorage.setItem('token', result.token);
      return result.user;
    } catch (error) {
      return rejectWithValue(error instanceof ApiError ? error.message : 'Login failed');
    }
  }
);

// ─── Slice ───
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout: (state) => {
      state.currentUser = null;
      localStorage.removeItem('token');
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCurrentUser
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // loginUser
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, updateUser, clearError } = userSlice.actions;
export default userSlice.reducer;
```

### Normalized State Shape

```typescript
// store/slices/postsSlice.ts
import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import type { Post } from '@/features/posts/types';
import { RootState } from '../index';

// ─── Entity Adapter (Normalized State) ───
const postsAdapter = createEntityAdapter<Post>({
  selectId: (post) => post.id,
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt), // newest first
});

// ─── Slice with Normalized State ───
interface PostsState {
  ids: string[];
  entities: Record<string, Post>;
  selectedPostId: string | null;
  filters: { search: string; status: string };
  loading: boolean;
}

const postsSlice = createSlice({
  name: 'posts',
  initialState: postsAdapter.getInitialState<PostsState>({
    selectedPostId: null,
    filters: { search: '', status: 'all' },
    loading: false,
  }),
  reducers: {
    addPost: postsAdapter.addOne,
    addPosts: postsAdapter.addMany,
    updatePost: postsAdapter.updateOne,
    removePost: postsAdapter.removeOne,

    setSelectedPost: (state, action: PayloadAction<string | null>) => {
      state.selectedPostId = action.payload;
    },

    setFilters: (state, action: PayloadAction<Partial<PostsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

// ─── Selectors (with createSelector) ───
const postsSelectors = postsAdapter.getSelectors<RootState>(
  (state) => state.posts
);

export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
  selectIds: selectPostIds,
  selectEntities: selectPostEntities,
} = postsSelectors;

// Derived selectors
export const selectSelectedPost = (state: RootState) => {
  const id = state.posts.selectedPostId;
  return id ? selectPostById(state, id) : null;
};

export const selectFilteredPosts = (state: RootState) => {
  const posts = selectAllPosts(state);
  const { search, status } = state.posts.filters;

  return posts.filter((post) => {
    const matchesSearch = search
      ? post.title.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesStatus = status !== 'all' ? post.status === status : true;
    return matchesSearch && matchesStatus;
  });
};
```

---

## 2. Zustand — Minimal Alternative

### Store Cơ Bản

```typescript
// stores/useUserStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User } from '@/features/users/types';

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UserActions {
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  clearError: () => void;
}

type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions
        login: async ({ email, password }) => {
          set({ isLoading: true, error: null });
          try {
            const result = await userApi.login({ email, password });
            set({ user: result.user, isAuthenticated: true, isLoading: false });
          } catch (error) {
            set({
              error: error instanceof ApiError ? error.message : 'Login failed',
              isLoading: false,
            });
          }
        },

        logout: () => {
          set({ user: null, isAuthenticated: false });
        },

        updateUser: (data) => {
          const currentUser = get().user;
          if (currentUser) {
            set({ user: { ...currentUser, ...data } });
          }
        },

        clearError: () => set({ error: null }),
      }),
      {
        name: 'user-storage', // localStorage key
        partialize: (state) => ({ user: state.user }), // Chỉ persist user
      }
    )
  )
);
```

### Zustand với Slices Pattern

```typescript
// stores/useStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User, Post } from '@/features/types';

// ─── User Slice ───
interface UserSlice {
  user: User | null;
  setUser: (user: User | null) => void;
}

const createUserSlice = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
});

// ─── Posts Slice ───
interface PostsSlice {
  posts: Post[];
  addPost: (post: Post) => void;
  removePost: (id: string) => void;
  updatePost: (id: string, data: Partial<Post>) => void;
}

const createPostsSlice = (set) => ({
  posts: [],
  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
  removePost: (id) =>
    set((state) => ({ posts: state.posts.filter((p) => p.id !== id) })),
  updatePost: (id, data) =>
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),
});

// ─── Combine Slices ───
type StoreState = UserSlice & PostsSlice;

export const useStore = create<StoreState>()(
  devtools((...args) => ({
    ...createUserSlice(...args),
    ...createPostsSlice(...args),
  }))
);

// Usage:
export const useUser = () => useStore((s) => s.user);
export const usePosts = () => useStore((s) => s.posts);
```

### Zustand với React Query Integration

```typescript
// stores/useQueryStore.ts
import { create } from 'zustand';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '@/features/posts/api/postsApi';
import type { CreatePostDto, Post } from '@/features/posts/types';

// ─── Zustand Store for UI State ───
interface PostsUIStore {
  selectedPostId: string | null;
  isEditorOpen: boolean;
  setSelectedPost: (id: string | null) => void;
  openEditor: () => void;
  closeEditor: () => void;
}

export const usePostsUIStore = create<PostsUIStore>((set) => ({
  selectedPostId: null,
  isEditorOpen: false,
  setSelectedPost: (id) => set({ selectedPostId: id }),
  openEditor: () => set({ isEditorOpen: true }),
  closeEditor: () => set({ isEditorOpen: false, selectedPostId: null }),
}));

// ─── React Query Hooks ───
export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: () => postsApi.getPosts(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { closeEditor } = usePostsUIStore();

  return useMutation({
    mutationFn: (data: CreatePostDto) => postsApi.createPost(data),
    onSuccess: (newPost) => {
      queryClient.setQueryData<Post[]>(['posts'], (old) =>
        [newPost, ...(old ?? [])]
      );
      closeEditor();
    },
  });
}
```

---

## 3. So Sánh Chi Tiết

### Side-by-Side Comparison

```
┌─────────────────────┬────────────────────────────┬────────────────────────────┐
│ Aspect              │ Redux Toolkit                │ Zustand                     │
├─────────────────────┼────────────────────────────┼────────────────────────────┤
│ Setup Lines         │ ~200 lines                  │ ~20 lines                   │
├─────────────────────┼────────────────────────────┼────────────────────────────┤
│ Bundle Size         │ ~13KB (@reduxjs/toolkit)   │ ~1KB (zustand)             │
├─────────────────────┼────────────────────────────┼────────────────────────────┤
│ Boilerplate         │ High (slices, actions,     │ Low (store + actions)      │
│                     │   thunks, selectors)      │                            │
├─────────────────────┼────────────────────────────┼────────────────────────────┤
│ DevTools            │ ✅ Full (time-travel,      │ ⚠️ Basic (state viewer,    │
│                     │   action log, jump to       │    action log)            │
│                     │   snapshot)                │                            │
├─────────────────────┼────────────────────────────┼────────────────────────────┤
│ Ecosystem           │ RTK Query, Redux Saga,    │ Minimal (middleware)      │
│                     │ Redux Observable           │                            │
├─────────────────────┼────────────────────────────┼────────────────────────────┤
│ Learning Curve      │ Steep (concepts, patterns) │ Flat (store pattern)      │
├─────────────────────┼────────────────────────────┼────────────────────────────┤
│ TypeScript          │ ✅ Excellent types          │ ✅ Good types               │
├─────────────────────┼────────────────────────────┼────────────────────────────┤
│ SSR Support         │ ✅ Built-in               │ ✅ Built-in                 │
├─────────────────────┼────────────────────────────┼────────────────────────────┤
│ Middleware          │ Custom + built-in          │ Custom + zustand/middleware│
├─────────────────────┼────────────────────────────┼────────────────────────────┤
│ Performance         │ ✅ Normalized state +     │ ✅ Fine-grained updates    │
│                     │   selector memoization     │   (no re-render cascade)   │
├─────────────────────┼────────────────────────────┼────────────────────────────┤
│ Best For            │ Large teams (5+), complex │ Small-medium teams, fast   │
│                     │   state, time-travel,      │   prototyping, simple apps │
│                     │   large-scale apps         │                            │
└─────────────────────┴────────────────────────────┴────────────────────────────┘
```

### So Sánh Use Trong Component

```typescript
// ─── Redux ───
import { useAppSelector, useAppDispatch } from '@/store';
import { logout } from '@/store/slices/userSlice';
import { createSelector } from '@reduxjs/toolkit';

// Selector tự memoize (createSelector)
const selectUserName = createSelector(
  [(state) => state.user.currentUser],
  (user) => user?.name ?? 'Guest'
);

function UserProfile() {
  const dispatch = useAppDispatch();
  const userName = useAppSelector(selectUserName);
  const isLoading = useAppSelector((state) => state.user.loading);

  return (
    <div>
      <p>{userName}</p>
      <button onClick={() => dispatch(logout())}>Logout</button>
    </div>
  );
}

// ─── Zustand ───
import { useUserStore } from '@/stores/useUserStore';

function UserProfile() {
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);
  const isLoading = useUserStore((s) => s.isLoading);

  return (
    <div>
      <p>{user?.name ?? 'Guest'}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## 4. Redux Selectors — Tối Ưu

### createSelector (Reselect)

```typescript
// selectors/postsSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { selectAllPosts, selectPostEntities } from '../slices/postsSlice';
import type { RootState } from '../index';

// ─── Basic Selector ───
export const selectPosts = (state: RootState) => state.posts.entities;

// ─── Memoized Selector ───
export const selectPublishedPosts = createSelector(
  [selectAllPosts],
  (posts) => posts.filter((post) => post.status === 'published')
);

// ─── Selector với Multiple Inputs ───
export const selectUserPosts = createSelector(
  [selectAllPosts, (state: RootState, userId: string) => userId],
  (posts, userId) => posts.filter((post) => post.authorId === userId)
);

// ─── Complex Selector ───
export const selectDashboardStats = createSelector(
  [
    selectAllPosts,
    (state: RootState) => state.user.currentUser,
  ],
  (posts, user) => {
    const myPosts = posts.filter((p) => p.authorId === user?.id);
    const publishedCount = myPosts.filter((p) => p.status === 'published').length;
    const draftCount = myPosts.filter((p) => p.status === 'draft').length;
    const totalViews = myPosts.reduce((sum, p) => sum + (p.views ?? 0), 0);

    return {
      totalPosts: myPosts.length,
      publishedCount,
      draftCount,
      totalViews,
    };
  }
);
```

### Selector Performance

```typescript
// ─── Selector Tối Ưu ───

// ❌ BAD: Object tạo mới mỗi render
const selectUser = (state) => ({
  name: state.user.name,
  email: state.user.email,
});
// → {} !== {} → Component re-render dù data không đổi!

// ✅ GOOD: Từng primitive selector
const selectUserName = (state) => state.user.name;
const selectUserEmail = (state) => state.user.email;
const selectUserAvatar = (state) => state.user.avatar;

// ✅ GOOD: Memoized createSelector
const selectUser = createSelector(
  [(state) => state.user.name, (state) => state.user.email],
  (name, email) => ({ name, email })
);
```

---

## 5. Redux Middleware

### Custom Middleware

```typescript
// store/middleware/logger.ts
import { Middleware } from '@reduxjs/toolkit';

export const loggerMiddleware: Middleware = (storeAPI) => (next) => (action) => {
  console.group(`[${(action as { type: string }).type}]`);
  console.log('Before:', storeAPI.getState());
  console.log('Action:', action);
  const result = next(action);
  console.log('After:', storeAPI.getState());
  console.groupEnd();
  return result;
};

// Usage
// store/index.ts
middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware().concat(loggerMiddleware),
```

### Redux Persist

```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// main.tsx
import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from '@/store';

root.render(
  <Provider store={store}>
    <PersistGate loading={<Loading />} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>
);
```

---

## 6. Zustand Middleware

```typescript
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';

// ─── Middleware Stack ───
export const useStore = create<UserStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          user: null,
          posts: [],
          addPost: (post) => set({ posts: [post, ...get().posts] }),
          // ...
        }),
        {
          name: 'app-storage',
          storage: {
            getItem: (name) => {
              const value = localStorage.getItem(name);
              return value ? JSON.parse(value) : null;
            },
            setItem: (name, value) => {
              localStorage.setItem(name, JSON.stringify(value));
            },
            removeItem: (name) => {
              localStorage.removeItem(name);
            },
          },
          partialize: (state) => ({
            // Chỉ persist user, không persist posts
            user: state.user,
          }),
        }
      )
    ),
    { name: 'AppStore' } // DevTools name
  )
);

// ─── Subscribe to Changes ───
useStore.subscribe(
  (state) => state.posts,
  (posts, previousPosts) => {
    console.log('Posts changed:', posts.length);
  }
);

// ─── Immer for Immutable Updates ───
import { immer } from 'zustand/middleware/immer';

const useStore = create<UserStore>()(
  devtools(
    persist(
      immer((set) => ({
        posts: [],
        addPost: (post) =>
          set((draft) => {
            draft.posts.unshift(post);
          }),
        updatePost: (id, data) =>
          set((draft) => {
            const post = draft.posts.find((p) => p.id === id);
            if (post) Object.assign(post, data);
          }),
      }))
    )
  )
);
```

---

## 7. RTK Query — Data Fetching Trong Redux

```typescript
// store/api/postsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const postsApi = createApi({
  reducerPath: 'postsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Post', 'Posts'],
  endpoints: (builder) => ({
    getPosts: builder.query<Post[], void>({
      query: () => '/posts',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Post' as const, id })), 'Posts']
          : ['Posts'],
    }),

    getPostById: builder.query<Post, string>({
      query: (id) => `/posts/${id}`,
      providesTags: (_, __, id) => [{ type: 'Post', id }],
    }),

    createPost: builder.mutation<Post, CreatePostDto>({
      query: (body) => ({ url: '/posts', method: 'POST', body }),
      invalidatesTags: ['Posts'], // Invalidate list after create
    }),

    updatePost: builder.mutation<Post, { id: string; data: Partial<Post> }>({
      query: ({ id, data }) => ({ url: `/posts/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Post', id }],
    }),

    deletePost: builder.mutation<void, string>({
      query: (id) => ({ url: `/posts/${id}`, method: 'DELETE' }),
      invalidatesTags: (_, __, id) => [{ type: 'Post', id }, 'Posts'],
    }),
  }),
});

export const {
  useGetPostsQuery,
  useGetPostByIdQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
} = postsApi;
```

### RTK Query Usage

```typescript
// Component sử dụng RTK Query
import { useGetPostsQuery, useCreatePostMutation } from '@/store/api/postsApi';

function PostsPage() {
  const {
    data: posts,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useGetPostsQuery();

  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();

  if (isLoading) return <Skeleton />;
  if (error) return <Error onRetry={refetch} />;

  return (
    <div>
      {isFetching && <Spinner />} {/* Background refetching */}
      <button onClick={() => createPost({ title: 'New Post' })} disabled={isCreating}>
        Create
      </button>
      <ul>
        {posts?.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 8. Decision Framework

```
┌──────────────────────────────────────────────────────────────┐
│  KHI NÀO DÙNG REDUX TOOLKIT?                               │
│                                                               │
│  ✓ Large team (5+ developers)                              │
│  ✓ Complex state (many interdependent slices)              │
│  ✓ Cần time-travel debugging                               │
│  ✓ Cần RTK Query cho data fetching                         │
│  ✓ Enterprise project với strict patterns                  │
│  ✓ Cần middleware phức tạp (saga, epic)                   │
│  ✓ SSR với complex hydration                                │
│  ✓ Project sẽ scale lớn trong tương lai                    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  KHI NÀO DÙNG ZUSTAND?                                     │
│                                                               │
│  ✓ Small-medium team (1-4 developers)                     │
│  ✓ Simple state (auth, UI state, settings)                │
│  ✓ Cần prototype nhanh                                      │
│  ✓ Project nhỏ-trung bình, không complex                     │
│  ✓ Bạn thích functional patterns đơn giản                  │
│  ✓ Microservices frontend (nhiều isolated stores)            │
│  ✓ React Native                                             │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  KHI NÀO DÙNG RTK QUERY?                                   │
│                                                               │
│  ✓ Cần data fetching trong Redux ecosystem                 │
│  ✓ Cần automatic cache invalidation                         │
│  ✓ Cần optimistic updates                                   │
│  ✓ Backend API phức tạp (pagination, filtering)            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  KHI NÀO DÙNG REACT QUERY (THAY VÌ RTK QUERY)?             │
│                                                               │
│  ✓ Không dùng Redux cho state management                  │
│  ✓ Cần flexibility trong state management                  │
│  ✓ Project đã có Zustand hoặc Context                     │
│  ✓ RTK Query chưa support backend của bạn                │
└──────────────────────────────────────────────────────────────┘
```

---

## 9. Redux vs Zustand — Migration

### Redux → Zustand

```typescript
// ─── Before (Redux) ───
const { user } = useAppSelector((state) => state.user);
const dispatch = useAppDispatch();
dispatch(updateUser({ name: 'Alice' }));

// ─── After (Zustand) ───
const user = useUserStore((s) => s.user);
const updateUser = useUserStore((s) => s.updateUser);
updateUser({ name: 'Alice' });

// Migration steps:
// 1. Create Zustand store với same state shape
// 2. Replace useAppSelector → useStore(selector)
// 3. Replace dispatch → direct store actions
// 4. Remove Redux setup (Provider, slices, store)
```

---

## 10. Các Traps Phổ Biến

### ❌ Trap 1: Selector Tạo Object Mới

```typescript
// ❌ BAD: Object mới mỗi render → re-render
const selectUserData = (state) => ({
  name: state.user.name,
  email: state.user.email,
});

// ✅ GOOD: createSelector memoizes
const selectUserData = createSelector(
  [(state) => state.user.name, (state) => state.user.email],
  (name, email) => ({ name, email })
);
```

### ❌ Trap 2: Zustand Selector Dùng get()

```typescript
// ❌ BAD: Dùng get() trong selector
const user = useStore((state) => get().user); // ❌ get không reactive!

// ✅ GOOD: Selector reactive
const user = useStore((s) => s.user);
```

### ❌ Trap 3: Redux Re-render Cascade

```typescript
// ❌ BAD: Parent state change → tất cả children re-render
function App() {
  const dispatch = useAppDispatch();
  const { user, theme, notifications } = useAppSelector((state) => state);

  return (
    <div>
      <Header user={user} theme={theme} />
      <Notifications notifications={notifications} />
      <Dashboard />
    </div>
  );
}

// ✅ GOOD: Mỗi component subscribe riêng
function Header() {
  const user = useAppSelector((state) => state.user.user);  // Only user
  const theme = useAppSelector((state) => state.ui.theme);  // Only theme
  // → Notification change → Header KHÔNG re-render
}
```

### ❌ Trap 4: Zustand Không Slice

```typescript
// ❌ BAD: Tất cả state trong một store
const useStore = create((set) => ({
  user: null,
  posts: [],
  comments: [],
  theme: 'light',
  // ... 50 properties later → hard to maintain
}));

// ✅ GOOD: Nhiều focused stores
const useUserStore = create(() => ({ ... }));
const usePostsStore = create(() => ({ ... }));
const useUIStore = create(() => ({ ... }));
```

### ❌ Trap 5: Redux Thunk với Side Effects Trong Reducer

```typescript
// ❌ BAD: Side effect trong reducer
const userSlice = createSlice({
  reducers: {
    loginSuccess: (state, action) => {
      localStorage.setItem('token', action.payload.token); // ❌ Side effect!
    },
  },
});

// ✅ GOOD: Side effect ở nơi khác
// useEffect sau khi loginSuccess
// Hoặc thunk / middleware
```

---

## 11. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  REDUX TOOLKIT vs ZUSTAND                                   │
│                                                               │
│  REDUX TOOLKIT:                                             │
│  ├── configureStore: store setup                          │
│  ├── createSlice: reducer + actions                       │
│  ├── createAsyncThunk: async logic                       │
│  ├── createEntityAdapter: normalized state               │
│  ├── createSelector: memoized selectors                 │
│  ├── RTK Query: data fetching inside Redux             │
│  └── Best: large teams, complex state, time-travel     │
│                                                               │
│  ZUSTAND:                                                   │
│  ├── create(): store factory                            │
│  ├── devtools: Redux DevTools integration              │
│  ├── persist: localStorage/sessionStorage               │
│  ├── subscribeWithSelector: subscribe to slices        │
│  └── Best: small-medium teams, simple state, rapid dev │
│                                                               │
│  HYBRID APPROACH (2024 recommended):                     │
│  ├── Zustand/Redux: UI state, simple global state     │
│  ├── React Query: server state, caching, mutations       │
│  └── Context: truly global (auth, theme only)          │
│                                                               │
│  ⚠️  DON'T over-engineer: simple app → Zustand + Context │
│  ⚠️  DON'T under-engineer: complex app → Redux Toolkit   │
│  ⚠️  React Query KHÔNG replace Zustand/Redux — khác domain│
└──────────────────────────────────────────────────────────────┘
```

---

## 12. Câu Hỏi Phỏng Vấn

### Q1: Redux Toolkit khác Redux vanilla thế nào?

**Trả lời:** Redux Toolkit (RTK) = opinionated wrapper giảm boilerplate đáng kể. Redux vanilla: viết action types, action creators, switch-case reducers thủ công. RTK: `createSlice` tự tạo actions + reducers, `createAsyncThunk` cho async, `createEntityAdapter` cho normalized state. RTK bên trong dùng Immer nên reducer có thể mutate state ( Immer produce immutable updates). DevTools, middleware, và store setup cũng đơn giản hơn nhiều. Khuyến nghị: luôn dùng RTK cho project mới, không dùng Redux vanilla.

### Q2: Zustand re-render như thế nào?

**Trả lời:** Zustand dùng fine-grained subscription: component chỉ re-render khi selector trả về giá trị khác. `useStore((s) => s.user)` → re-render khi `user` reference thay đổi. Khác Redux: Redux re-render khi store slice reference thay đổi (tất cả components subscribe cùng slice đều re-render). Zustand tránh cascade re-renders vì mỗi component tự define selector. Đây là lý do Zustand performance thường tốt hơn Redux cho fine-grained updates.

### Q3: Khi nào dùng RTK Query thay vì React Query?

**Trả lời:** RTK Query tốt khi: đã dùng Redux Toolkit, muốn data fetching unified trong Redux ecosystem. React Query tốt khi: dùng Zustand/Context, cần flexibility, đã có React Query trong stack. Về functionality: cả hai tương đương (caching, background refetch, optimistic updates). React Query có DevTools tốt hơn và ecosystem lớn hơn. Khuyến nghị: nếu project đã có RTK → RTK Query; nếu dùng Zustand → React Query.

### Q4: Redux DevTools hoạt động như thế nào?

**Trả lời:** Redux DevTools extension capture mọi action dispatch và state sau action. Time-travel: click vào action trong log → DevTools replay từ đầu đến action đó, state khôi phục. Jump to snapshot: click action → state được set về thời điểm đó. Action dispatch → DevTools gửi `{ type, action }` → DevTools store trong tab. `window.__REDUX_DEVTOOLS_EXTENSION__` hook vào store. Tính năng này Zustand chỉ có basic version qua middleware.

### Q5: State Normalization là gì và tại sao cần?

**Trả lời:** Normalization = lưu data trong flat object `{ [id]: entity }` thay vì nested arrays. VD: posts array → `{ byId: { '1': Post, '2': Post }, ids: ['1', '2'] }`. Lợi ích: (1) O(1) lookup thay vì O(n) find; (2) Update entity đơn lẻ không affect other entities; (3) Selector dễ memoize; (4) Tránh duplicate data. Redux Toolkit cung cấp `createEntityAdapter` tự động normalize. Khi có deeply nested state → normalization là best practice.

---

## 13. Thực Hành

### Bài 1: Redux Toolkit Setup

```typescript
// Tạo store hoàn chỉnh:
// 1. store/index.ts (configureStore)
// 2. store/slices/userSlice.ts (createSlice + createAsyncThunk)
// 3. store/hooks.ts (typed useSelector, useDispatch)
// 4. Type exports (RootState, AppDispatch)

// Test:
// const user = useAppSelector((state) => state.user.currentUser);
```

### Bài 2: Zustand Store

```typescript
// Tạo Zustand store với:
// 1. devtools middleware
// 2. persist middleware (localStorage)
// 3. Immer middleware
// 4. Subscribe to changes

// Demo:
// useStore.subscribe → console.log khi posts thay đổi
```

### Bài 3: Zustand + React Query Hybrid

```typescript
// Architecture:
// Zustand: user auth, UI state (theme, sidebarOpen, modal)
// React Query: server state (posts, users, comments)

// Demo:
// - useAuthStore → user, login, logout
// - usePostsQuery → posts list
// - useCreatePostMutation → optimistic update
```

---

## Checklist

- [ ] Redux Toolkit: `createSlice`, `createAsyncThunk`, `createEntityAdapter`
- [ ] Typed hooks: `useAppSelector<T>`, `useAppDispatch`
- [ ] createSelector: memoized selectors, tránh object re-renders
- [ ] Normalized state: entity adapter cho lists
- [ ] Zustand: `create()`, `devtools`, `persist`, `subscribeWithSelector`
- [ ] Zustand selector: reactive, không dùng `get()` trong selector
- [ ] RTK Query: `createApi`, `providesTags`, `invalidatesTags`
- [ ] React Query vs RTK Query: chọn theo existing stack
- [ ] Redux DevTools: time-travel, jump to snapshot
- [ ] Hybrid approach: Zustand + React Query (recommended 2024)
- [ ] Decision: small project → Zustand, large team → Redux Toolkit
- [ ] KHÔNG mutate state trong Redux reducer (dùng Immer/mutable syntax)
- [ ] KHÔNG side effects trong reducers

---

*Last updated: 2026-04-01*
