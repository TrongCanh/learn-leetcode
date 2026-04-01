# API Layer & Data Fetching Patterns

## Câu hỏi mở đầu

Bạn mở component và thấy:

```jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [userId]);

  // ... 100 lines later
  return <div>...</div>;
}
```

Bạn thấy pattern này **5 lần trong 3 files**. Mỗi lần:
- Copy 30 lines boilerplate
- Lỗi xử lý khác nhau
- Không có retry
- Không có cache
- Loading state không consistent

**Đây là dấu hiệu cần API layer.**

---

## 1. API Layer — Tổng Quan

### Kiến Trúc分层

```
┌──────────────────────────────────────────────────────────────┐
│  COMPONENTS                                                  │
│  ├── Chỉ nhận data → render UI                            │
│  ├── KHÔNG gọi API trực tiếp                              │
│  └── Dùng hooks từ data layer                             │
│                                                               │
│  ─────────────────────────────────────────────────────────  │
│  DATA LAYER (React Query / SWR)                              │
│  ├── Cache management                                      │
│  ├── Background refetch                                     │
│  ├── Optimistic updates                                     │
│  └── Loading/error states                                   │
│                                                               │
│  ─────────────────────────────────────────────────────────  │
│  API SERVICE LAYER                                           │
│  ├── Type-safe API calls                                    │
│  ├── Request/response interceptors                        │
│  ├── Error transformation                                  │
│  └── Authentication headers                                 │
│                                                               │
│  ─────────────────────────────────────────────────────────  │
│  HTTP CLIENT (Axios / Fetch)                                 │
│  ├── Base URL configuration                                 │
│  ├── Timeout settings                                       │
│  └── Global interceptors                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. HTTP Client — Axios Instance

### Tại Sao Cần Wrapper

```
❌ Direct fetch/axios mọi nơi:
  → Mỗi file phải config baseURL, timeout, headers
  → Auth token phải thêm mỗi request
  → Error format không consistent
  → Retry logic phải lặp lại

✅ API client wrapper:
  → Một nơi config → mọi nơi dùng
  → Interceptors tự động thêm auth
  → Error transformation tập trung
  → Retry được handle ở layer dưới
```

### Axios Instance

```typescript
// lib/api/client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

// ─── Create instance ───
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  timeout: 10_000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ───
apiClient.interceptors.request.use(
  (config) => {
    // Thêm auth token
    const token = getAuthToken(); // từ localStorage/cookies
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Thêm request ID cho tracing
    config.headers['X-Request-ID'] = generateRequestId();

    return config;
  },
  (error) => {
    // Handle request config error
    return Promise.reject(transformError(error));
  }
);

// ─── Response Interceptor ───
apiClient.interceptors.response.use(
  (response) => {
    // Transform successful response
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // ─── Token expired → attempt refresh ───
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshToken();
        saveAuthToken(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest); // Retry original request
      } catch (refreshError) {
        // Refresh failed → logout
        clearAuthToken();
        redirectToLogin();
        return Promise.reject(transformError(refreshError));
      }
    }

    // ─── Other errors → transform and reject ───
    return Promise.reject(transformError(error));
  }
);

export default apiClient;

// ─── Error Transformation ───
function transformError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    return new ApiError(
      error.response?.data?.message ?? error.message,
      error.response?.status ?? 500,
      error.response?.data?.code
    );
  }
  return new ApiError('Unknown error', 500);
}

// ─── Auth Helpers ───
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

function saveAuthToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

function clearAuthToken(): void {
  localStorage.removeItem('auth_token');
}
```

### Fetch Wrapper (Không Dùng Axios)

```typescript
// lib/api/fetchClient.ts

class FetchClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = { ...this.defaultHeaders, ...options.headers };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new ApiError(
          errorBody.message ?? `HTTP ${response.status}`,
          response.status,
          errorBody.code
        );
      }

      return response.json();
    } catch (err) {
      clearTimeout(timeout);
      throw transformError(err);
    }
  }

  get<T>(path: string, options?: RequestInit) {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, data?: unknown, options?: RequestInit) {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put<T>(path: string, data?: unknown, options?: RequestInit) {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete<T>(path: string, options?: RequestInit) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const fetchClient = new FetchClient(
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
);
```

---

## 3. API Error Class

```typescript
// lib/api/errors.ts

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';

    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  get isForbidden(): boolean {
    return this.statusCode === 403;
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  get isServerError(): boolean {
    return this.statusCode >= 500;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
    };
  }
}

// Usage:
try {
  const user = await usersApi.getById(123);
} catch (error) {
  if (error instanceof ApiError) {
    if (error.isNotFound) {
      showToast('User not found');
    } else if (error.isUnauthorized) {
      redirectToLogin();
    }
  }
}
```

---

## 4. API Service Layer

### Users API

```typescript
// features/users/api/usersApi.ts
import apiClient from '@/lib/api/client';
import type { User, CreateUserDto, UpdateUserDto } from '../types';

// ─── GET /users ───
export async function getUsers(
  params?: PaginationParams & { search?: string }
): Promise<PaginatedResponse<User>> {
  const response = await apiClient.get<PaginatedResponse<User>>('/users', {
    params,
  });
  return response.data;
}

// ─── GET /users/:id ───
export async function getUserById(id: string): Promise<User> {
  const response = await apiClient.get<User>(`/users/${id}`);
  return response.data;
}

// ─── POST /users ───
export async function createUser(data: CreateUserDto): Promise<User> {
  const response = await apiClient.post<User>('/users', data);
  return response.data;
}

// ─── PUT /users/:id ───
export async function updateUser(
  id: string,
  data: UpdateUserDto
): Promise<User> {
  const response = await apiClient.put<User>(`/users/${id}`, data);
  return response.data;
}

// ─── DELETE /users/:id ───
export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
```

### Posts API với Zod Validation

```typescript
// features/posts/api/postsApi.ts
import apiClient from '@/lib/api/client';
import { z } from 'zod';
import type { Post, CreatePostDto, PostFilters } from '../types';

// ─── Zod Schemas ───
export const PostSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  authorId: z.string(),
  publishedAt: z.string().datetime().nullable(),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  tags: z.array(z.string()).max(5).optional(),
});

export const UpdatePostSchema = CreatePostSchema.partial();

// ─── Type inference ───
export type PostResponse = z.infer<typeof PostSchema>;

// ─── API Functions ───
export async function getPosts(
  filters?: PostFilters
): Promise<PaginatedResponse<Post>> {
  const response = await apiClient.get<PaginatedResponse<Post>>('/posts', {
    params: filters,
  });
  return response.data;
}

export async function getPostBySlug(slug: string): Promise<Post> {
  const response = await apiClient.get<Post>(`/posts/slug/${slug}`);
  return PostSchema.parse(response.data); // Runtime validation
}

export async function createPost(data: CreatePostDto): Promise<Post> {
  const validated = CreatePostSchema.parse(data); // Validate before sending
  const response = await apiClient.post<Post>('/posts', validated);
  return response.data;
}

export async function updatePost(
  id: string,
  data: Partial<CreatePostDto>
): Promise<Post> {
  const validated = UpdatePostSchema.parse(data);
  const response = await apiClient.put<Post>(`/posts/${id}`, validated);
  return response.data;
}
```

### Shared Types

```typescript
// shared/types/api.ts

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
```

---

## 5. Retry & Exponential Backoff

### Retry Interceptor

```typescript
// lib/api/retryInterceptor.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // ms
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableMethods: ['GET', 'HEAD', 'OPTIONS'],
};

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableError(error: AxiosError): boolean {
  if (!error.config) return false;

  const method = error.config.method?.toUpperCase();
  const status = error.response?.status;

  return (
    RETRY_CONFIG.retryableMethods.includes(method ?? '') &&
    (RETRY_CONFIG.retryableStatuses.includes(status ?? 0) ||
      !status) // Network error = retry
  );
}

export function createRetryClient(baseUrl: string): AxiosInstance {
  const client = axios.create({ baseURL: baseUrl, timeout: 10_000 });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as AxiosRequestConfig & { _retryCount?: number };

      if (!config || !isRetryableError(error)) {
        return Promise.reject(transformError(error));
      }

      config._retryCount = (config._retryCount ?? 0) + 1;

      if (config._retryCount >= RETRY_CONFIG.maxRetries) {
        return Promise.reject(
          new ApiError('Max retries exceeded', 503, 'MAX_RETRIES_EXCEEDED')
        );
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = RETRY_CONFIG.retryDelay * Math.pow(2, config._retryCount - 1);

      console.log(`Retrying request (${config._retryCount}/${RETRY_CONFIG.maxRetries}) after ${delay}ms`);

      await sleep(delay);
      return client(config);
    }
  );

  return client;
}
```

### Retry với React Query

```typescript
// React Query tự handle retry
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: () => usersApi.getUsers(),
  retry: 3,                    // Retry 3 lần khi fail
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  retry: (failureCount, error) => {
    // Chỉ retry network/server errors, không retry 404/401
    if (error instanceof ApiError) {
      return !error.isUnauthorized && !error.isForbidden && !error.isNotFound;
    }
    return true;
  },
});
```

---

## 6. React Query — Toàn Diện

### Query Definitions

```typescript
// features/posts/api/postsQueries.ts
import { queryOptions } from '@tanstack/react-query';
import { postsApi } from './postsApi';
import type { PostFilters } from '../types';

export const postsKeys = {
  all: ['posts'] as const,
  lists: () => [...postsKeys.all, 'list'] as const,
  list: (filters: PostFilters) => [...postsKeys.lists(), filters] as const,
  details: () => [...postsKeys.all, 'detail'] as const,
  detail: (id: string) => [...postsKeys.details(), id] as const,
  bySlug: (slug: string) => [...postsKeys.details(), 'slug', slug] as const,
};

// ─── Query Options (với retry config) ───
export const postsQueryOptions = (filters: PostFilters) =>
  queryOptions({
    queryKey: postsKeys.list(filters),
    queryFn: () => postsApi.getPosts(filters),
    staleTime: 5 * 60 * 1000,    // 5 phút trước khi stale
    gcTime: 10 * 60 * 1000,      // 10 phút trước khi garbage collect
    retry: 3,
    placeholderData: (prev) => prev, // Giữ data cũ khi refetching
  });

export const postDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: postsKeys.detail(id),
    queryFn: () => postsApi.getPostById(id),
    staleTime: 5 * 60 * 1000,
  });
```

### useQuery Hooks

```typescript
// features/posts/hooks/usePosts.ts
import { useQuery } from '@tanstack/react-query';
import { postsKeys, postsQueryOptions, postDetailQueryOptions } from '../api/postsQueries';
import { postsApi } from '../api/postsApi';
import type { PostFilters } from '../types';

// ─── List Posts ───
export function usePosts(filters: PostFilters = {}) {
  return useQuery(postsQueryOptions(filters));
}

// ─── Single Post ───
export function usePost(id: string | undefined) {
  return useQuery({
    ...postDetailQueryOptions(id!),
    enabled: Boolean(id), // Không fetch nếu id = undefined
  });
}

// ─── Optimized: Prefetch Next Page ───
export function usePostsPrefetch(filters: PostFilters) {
  const queryClient = useQueryClient();

  return {
    prefetchNextPage: async () => {
      const nextFilters = {
        ...filters,
        page: (filters.page ?? 1) + 1,
      };

      await queryClient.prefetchQuery(postsQueryOptions(nextFilters));
    },
  };
}
```

### useMutation

```typescript
// features/posts/hooks/usePostEditor.ts
import {
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { postsApi } from '../api/postsApi';
import { postsKeys } from '../api/postsQueries';
import type { CreatePostDto } from '../types';

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostDto) => postsApi.createPost(data),

    onSuccess: (newPost) => {
      // Invalidate list queries → refetch
      queryClient.invalidateQueries({ queryKey: postsKeys.lists() });

      // HOẶC update cache trực tiếp (faster)
      queryClient.setQueryData<Post[]>(
        postsKeys.list({}),
        (old) => [newPost, ...(old ?? [])]
      );
    },

    onError: (error) => {
      if (error instanceof ApiError) {
        showToast(`Failed to create post: ${error.message}`);
      }
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePostDto> }) =>
      postsApi.updatePost(id, data),

    onMutate: async ({ id, data }) => {
      // 1. Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: postsKeys.detail(id) });

      // 2. Snapshot previous value
      const previousPost = queryClient.getQueryData(postsKeys.detail(id));

      // 3. Optimistically update
      queryClient.setQueryData(postsKeys.detail(id), (old: Post) => ({
        ...old,
        ...data,
      }));

      return { previousPost };
    },

    onError: (err, { id }, context) => {
      // Revert on error
      if (context?.previousPost) {
        queryClient.setQueryData(postsKeys.detail(id), context.previousPost);
      }
    },

    onSettled: (_, __, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: postsKeys.detail(id) });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => postsApi.deletePost(id),

    onSuccess: (_, deletedId) => {
      // Invalidate all list queries
      queryClient.invalidateQueries({ queryKey: postsKeys.lists() });
    },
  });
}
```

### Infinite Query (Pagination)

```typescript
// features/posts/hooks/useInfinitePosts.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { postsApi } from '../api/postsApi';

export function useInfinitePosts(filters?: Omit<PostFilters, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['posts', 'infinite', filters],
    queryFn: ({ pageParam = 1 }) =>
      postsApi.getPosts({ ...filters, page: pageParam }),

    initialPageParam: 1,

    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNextPage
        ? lastPage.pagination.page + 1
        : undefined;
    },

    getPreviousPageParam: (firstPage) => {
      return firstPage.pagination.hasPrevPage
        ? firstPage.pagination.page - 1
        : undefined;
    },
  });
}

// Component usage:
function PostList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfinitePosts({ limit: 20 });

  const allPosts = data?.pages.flatMap(p => p.data) ?? [];

  return (
    <div>
      {status === 'pending' ? (
        <PostListSkeleton />
      ) : status === 'error' ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          {allPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}

          <button
            onClick={() => fetchNextPage()}
            disabled={!hasNextPage || isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading...' : hasNextPage ? 'Load More' : 'No More'}
          </button>
        </>
      )}
    </div>
  );
}
```

---

## 7. Error Handling — Global Error Boundary

```typescript
// shared/components/feedback/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service (Sentry, etc.)
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="error-boundary">
            <h2>Something went wrong</h2>
            <button onClick={() => this.setState({ hasError: false, error: null })}>
              Try again
            </button>
            {process.env.NODE_ENV === 'development' && (
              <pre>{this.state.error?.stack}</pre>
            )}
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

### Query Error Handling

```typescript
// app/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,

      throwOnError: false, // Không throw, chỉ set error state

      // Global error handler
      meta: {
        errorHandler: (error: unknown) => {
          if (error instanceof ApiError) {
            if (error.isUnauthorized) {
              redirectToLogin();
            } else if (error.isServerError) {
              showToast('Server error. Please try again.');
            }
          }
        },
      },
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

## 8. SWR vs React Query

```
┌──────────────────────┬──────────────────────┬──────────────────────┐
│ Feature              │ React Query           │ SWR                  │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Cache Management     │ ✅ Full               │ ✅ Basic             │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Mutations            │ ✅ Optimistic updates │ ⚠️ Limited          │
│                      │ ✅ Cache invalidation │ ⚠️ SWR mutate       │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Infinite Query       │ ✅ Built-in           │ ⚠️ swr/infinite     │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ DevTools             │ ✅ Full DevTools      │ ✅ DevTools          │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Bundle Size          │ ~13KB                │ ~4.3KB              │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ TypeScript           │ ✅ First-class TS     │ ✅ TS support        │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ SSR/Hydration        │ ✅ Supported          │ ✅ Supported         │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Best For             │ Complex state,       │ Simple fetch cache, │
│                      │ mutations, pagination │ stale-while-revalidate│
└──────────────────────┴──────────────────────┴──────────────────────┘

RECOMMENDATION:
  • Data fetching only (cache):      SWR ✅
  • Complex state + mutations:       React Query ✅
  • Server State Management:         React Query ✅
  • Real-time updates:               SWR or polling with RQ ✅
```

---

## 9. Optimistic Updates Chi Tiết

```typescript
// features/likes/hooks/useLike.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likesApi } from '../api/likesApi';
import { postsKeys } from '@/features/posts/api/postsQueries';

export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, userId }: { postId: string; userId: string }) =>
      likesApi.like(postId),

    onMutate: async ({ postId }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: postsKeys.detail(postId) });

      // Snapshot
      const previousPost = queryClient.getQueryData(postsKeys.detail(postId));

      // Optimistic update
      queryClient.setQueryData(postsKeys.detail(postId), (old: Post) => ({
        ...old,
        likesCount: old.likesCount + 1,
        isLiked: true,
      }));

      return { previousPost };
    },

    onError: (err, { postId }, context) => {
      // Revert
      if (context?.previousPost) {
        queryClient.setQueryData(postsKeys.detail(postId), context.previousPost);
      }
      showToast('Failed to like');
    },

    onSettled: (_, __, { postId }) => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: postsKeys.detail(postId) });
    },
  });
}

// Component:
function LikeButton({ post }: { post: Post }) {
  const likeMutation = useLikePost();

  const handleLike = () => {
    likeMutation.mutate({ postId: post.id, userId: post.authorId });
  };

  return (
    <button
      onClick={handleLike}
      disabled={likeMutation.isPending}
    >
      {post.isLiked ? '❤️' : '🤍'} {post.likesCount}
    </button>
  );
}
```

---

## 10. Các Traps Phổ Biến

### ❌ Trap 1: API Calls Trong Component (Không Qua Service)

```jsx
// ❌ BAD: fetch trong component
function UserProfile({ id }) {
  const [user, setUser] = useState();
  useEffect(() => {
    fetch(`/api/users/${id}`) // ❌ Config lặp lại mỗi component
      .then(res => res.json())
      .then(setUser);
  }, [id]);
}

// ✅ GOOD: Gọi qua service layer
function UserProfile({ id }) {
  const { data: user, isLoading } = useUser(id); // Từ React Query hook
}
```

### ❌ Trap 2: Không Xử Lý Error

```jsx
// ❌ BAD: Error bị nuốt chửng
const { data } = useQuery({
  queryFn: () => api.getData(),
  onError: (error) => {}, // ❌ Empty handler!
});

// ✅ GOOD: Error được handle + user được thông báo
const { data, error, isError } = useQuery({
  queryFn: () => api.getData(),
});

if (isError) {
  return <ErrorState message={error.message} onRetry={() => refetch()} />;
}
```

### ❌ Trap 3: Stale Time Quá Nhỏ

```typescript
// ❌ StaleTime = 0 → refetch liên tục, UX kém
const { data } = useQuery({
  queryFn: () => api.getPosts(),
  staleTime: 0, // ❌ Mỗi lần component mount → refetch
});

// ✅ staleTime phù hợp với data nature
const { data } = useQuery({
  queryFn: () => api.getPosts(),
  staleTime: 5 * 60 * 1000,  // 5 phút — posts không thay đổi thường xuyên
  gcTime: 30 * 60 * 1000,    // Cache 30 phút
});
```

### ❌ Trap 4: Mutation Without Invalidation

```typescript
// ❌ Mutation success nhưng list không update
const mutation = useMutation({
  mutationFn: (data) => api.createPost(data),
  onSuccess: () => {
    showToast('Created!'); // Toast hiện nhưng list không đổi!
  },
});

// ✅ Luôn invalidate hoặc update cache
const mutation = useMutation({
  mutationFn: (data) => api.createPost(data),
  onSuccess: (newPost) => {
    queryClient.invalidateQueries({ queryKey: postsKeys.lists() });
    // HOẶC
    queryClient.setQueryData(postsKeys.lists(), (old) => [newPost, ...old]);
  },
});
```

### ❌ Trap 5: Dependency Array Trong useEffect Gọi API

```jsx
// ❌ Không dùng React Query cho async data
function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers().then(setUsers);
  }, []); // ❌ []

  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}

// ❌ Side effects dùng useState cho server data
function UserList() {
  const [users, setUsers] = useState([]);      // ❌ Không cache
  const [loading, setLoading] = useState(true); // ❌ Manual state
  const [error, setError] = useState(null);   // ❌ Manual state

  useEffect(() => {
    setLoading(true);
    fetchUsers()
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  // ...
}

// ✅ React Query
function UserList() {
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  if (isLoading) return <Skeleton />;
  if (error) return <Error message={error.message} />;

  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

---

## 11. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  API LAYER — ARCHITECTURE                                     │
│                                                               │
│  HTTP CLIENT (axios instance / fetch wrapper):               │
│  ├── Base URL, timeout, headers                             │
│  ├── Request interceptor: auth token                        │
│  ├── Response interceptor: error transform, token refresh   │
│  └── Retry logic với exponential backoff                    │
│                                                               │
│  API SERVICE LAYER:                                          │
│  ├── Một function = một endpoint                            │
│  ├── Type-safe với Zod validation                          │
│  ├── Error class với status helpers                         │
│  └── KHÔNG có state management                              │
│                                                               │
│  DATA LAYER (React Query):                                  │
│  ├── useQuery: fetch + cache + background refetch           │
│  ├── useMutation: create/update/delete + optimistic       │
│  ├── Query keys: consistent cache invalidation             │
│  ├── Infinite query: pagination                             │
│  └── Error handling: global + per-query                     │
│                                                               │
│  LAYERS RULE:                                                │
│  ├── Components → useQuery/useMutation hooks              │
│  ├── Hooks → queryOptions + api functions                  │
│  ├── API functions → apiClient (axios instance)            │
│  └── Client → interceptors + retry + error transform       │
│                                                               │
│  KEY INSIGHTS:                                               │
│  ├── Server state ≠ Client state → React Query ≠ useState│
│  ├── Stale-while-revalidate = instant load + fresh data   │
│  ├── Optimistic update = perceived performance             │
│  └── Invalidation vs setQueryData: both valid approaches   │
└──────────────────────────────────────────────────────────────┘
```

---

## 12. Câu Hỏi Phỏng Vấn

### Q1: Phân biệt server state và client state?

**Trả lời:** Server state = data từ backend (API), có remote source of truth, có thể bị stale khi client có data mới, cần sync với server. Client state = data chỉ tồn tại trong browser (UI state, form inputs, modal). Server state cần: caching, background refetch, optimistic updates, deduplication. Client state dùng: useState, useReducer, Context, Zustand. React Query là solution cho server state, không phải client state.

### Q2: React Query vs SWR — khi nào dùng cái nào?

**Trả lời:** SWR tốt cho: simple data fetching với cache (stale-while-revalidate pattern), dự án cần bundle size nhỏ (~4KB). React Query tốt cho: complex mutations với optimistic updates, infinite queries, pagination, server state cần fine-grained control, project lớn cần DevTools mạnh. Khuyến nghị: dùng React Query cho hầu hết cases vì mutations + optimistic updates mạnh hơn.

### Q3: Optimistic update là gì và tại sao cần?

**Trả lời:** Optimistic update = update UI trước khi server request hoàn thành. User thấy phản hồi tức thì, không phải chờ network roundtrip. React Query pattern: (1) Snapshot current cache; (2) Optimistically update cache; (3) Send mutation; (4) On success → invalidate; (5) On error → revert từ snapshot. Lợi ích: UX perceived performance cải thiện rõ rệt. Side effect: cần handle race conditions.

### Q4: Tại sao cần retry với exponential backoff?

**Trả lời:** Exponential backoff = tăng delay theo cấp số nhân mỗi lần retry (1s → 2s → 4s). Ngăn thundering herd (tất cả clients retry cùng lúc sau server restart). Giảm load trên server đang có vấn đề. Exponential: delay = base * 2^attempt. Max retries để tránh infinite loop.

### Q5: Query keys quan trọng như thế nào?

**Trả lời:** Query keys = identifiers cho cache entries. Phải consistent giữa query definition và invalidation. Nên dùng nested arrays: `['posts', 'list', { page: 1, filter: 'draft' }]`. Khi invalidate: `queryClient.invalidateQueries({ queryKey: ['posts', 'list'] })` → invalidate tất cả list queries. Cache structure: key → data + metadata (staleTime, updatedAt). Key phải serializable.

---

## 13. Thực Hành

### Bài 1: API Layer Setup

```typescript
// Tạo API layer hoàn chỉnh:
// 1. lib/api/client.ts (axios instance với interceptors)
// 2. lib/api/errors.ts (ApiError class)
// 3. lib/api/retryInterceptor.ts
// 4. features/posts/api/postsApi.ts
// 5. features/posts/api/postsQueries.ts
// 6. features/posts/hooks/usePosts.ts

// Test:
import { usePosts } from '@/features/posts/hooks/usePosts';

function PostList() {
  const { data, isLoading, error, refetch } = usePosts({ page: 1 });
  // should handle all states correctly
}
```

### Bài 2: React Query với Optimistic Updates

```typescript
// Tạo comment feature:
// 1. commentsApi.ts
// 2. useComments query
// 3. useAddComment mutation với optimistic update
// 4. useDeleteComment mutation với optimistic update

// Demo: click delete → comment disappear immediately
// Verify: nếu API fail → comment reappear
```

### Bài 3: Error Handling

```typescript
// Tạo:
// 1. ErrorBoundary component
// 2. API error → toast notification
// 3. 401 error → redirect to login
// 4. Network error → retry button
// 5. 404 → "Not found" state
```

---

## Checklist

- [ ] HTTP Client: axios instance với interceptors (auth, error transform)
- [ ] API Service: mỗi function = một endpoint, type-safe
- [ ] Error class: ApiError với status helpers
- [ ] Retry: exponential backoff, max retries config
- [ ] React Query: useQuery cho fetching, useMutation cho mutations
- [ ] Query keys: consistent naming với nested arrays
- [ ] Stale time: phù hợp với data nature (5-10 phút cho stable data)
- [ ] Optimistic updates: snapshot → mutate → revert on error
- [ ] Cache invalidation: sau mutation, invalidate hoặc setQueryData
- [ ] Error handling: ErrorBoundary + per-query error state + toast
- [ ] SWR vs React Query: RQ cho complex mutations, SWR cho simple cache
- [ ] KHÔNG gọi API trực tiếp trong component

---

*Last updated: 2026-04-01*
