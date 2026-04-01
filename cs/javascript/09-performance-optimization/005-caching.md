# Caching Strategies — Lớp Bảo Vệ Tốc Độ

## Câu hỏi mở đầu

```javascript
// User lần đầu vào app:
// → Tải HTML (50KB)
// → Tải CSS (100KB)
// → Tải JS (500KB)
// → Tải images (2MB)
// → API calls (500ms latency)
// → Total: 8 giây chờ đợi!

// User thứ 2:
// → Browser có CACHE!
// → HTML: from cache ✓
// → CSS: from cache ✓
// → JS: 30KB mới (1 chunk update)
// → Images: from cache ✓
// → API calls: cached responses ✓
// → Total: 0.3 giây!

// Caching = kỹ thuật LƯU ĐỂ DÙNG LẠI
// → Giảm network requests, giảm latency, giảm server load
```

Caching là kỹ thuật **lưu trữ data gần nơi cần dùng** để tránh fetch từ xa lặp lại. Đây là cách hiệu quả nhất để improve performance — không cần tối ưu code, chỉ cần không fetch lại những thứ đã có. Bài này cover mọi layers từ HTTP cache đến in-memory caching.

---

## 1. HTTP Cache — Tầng Đầu Tiên

### Cache-Control Headers

```javascript
// Server response headers:
Cache-Control: max-age=3600          // Cache trong 3600 giây
Cache-Control: no-cache             // Vẫn cache nhưng luôn revalidate
Cache-Control: no-store             // KHÔNG BAO GIỜ cache
Cache-Control: private              // Chỉ browser cache, không CDN
Cache-Control: public               // Có thể cache ở CDN
Cache-Control: max-stale=600        // Dùng cache cũ đến 600s sau expiration
Cache-Control: must-revalidate       // Không dùng stale cache

// ETag: identifier cho version của content
ETag: "v1.0.0"
If-None-Match: "v1.0.0"  // Client gửi lên để check

// Last-Modified: ngày sửa cuối
Last-Modified: Mon, 01 Apr 2026 10:00:00 GMT
If-Modified-Since: Mon, 01 Apr 2026 10:00:00 GMT
```

### Cache strategies

```
┌──────────────────────────────────────────────────────────────┐
│  HTTP CACHE STRATEGIES                                        │
│                                                               │
│  1. CACHE-FIRST (Cache-First, Stale-While-Revalidate)     │
│     Cache → Serve → Background fetch → Update cache          │
│     Dùng: Static assets (CSS, JS, images)                  │
│                                                               │
│  2. NETWORK-FIRST                                            │
│     Network → Cache → Serve                                  │
│     Dùng: Fresh data cần (API data thay đổi thường xuyên)   │
│                                                               │
│  3. STALE-WHILE-REVALIDATE                                  │
│     Cache → Serve (stale) + Fetch → Update                   │
│     Dùng: Non-critical data, balances speed và freshness      │
│                                                               │
│  4. NETWORK-ONLY                                            │
│     Network → Never cache                                    │
│     Dùng: Real-time data, authentication-required content     │
│                                                               │
│  5. CACHE-ONLY                                              │
│     Cache → Never network                                    │
│     Dùng: Offline-first apps, pre-cached data               │
└──────────────────────────────────────────────────────────────┘
```

### Practical cache headers

```javascript
// Express.js — static assets
app.use(express.static('public', {
  maxAge: '1y',           // Cache 1 năm cho hashed assets
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // hashed files (bundle.[contenthash].js) → long cache
    if (path.includes('.')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// API responses — shorter cache
app.get('/api/users', (req, res) => {
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.json(users);
});

// User-specific data — private cache
app.get('/api/profile', (req, res) => {
  res.set('Cache-Control', 'private, max-age=300');
  res.json(userProfile);
});

// Never cache sensitive data
app.get('/api/token', (req, res) => {
  res.set('Cache-Control', 'no-store'); // Never cache!
  res.json(newToken);
});
```

---

## 2. Service Worker Caching

### Cache-First Strategy

```javascript
// sw.js — Cache-First với Service Worker
const CACHE_NAME = 'v1-static-assets';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/main.js',
  '/images/logo.png'
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Cache-First strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached; // ✅ Serve from cache

      // ❌ Not in cache → fetch from network
      return fetch(event.request).then(response => {
        // Cache new response
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
```

### Stale-While-Revalidate

```javascript
// sw.js — Stale-While-Revalidate
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cachedResponse = await cache.match(event.request);

      // Fetch fresh version in background
      const fetchPromise = fetch(event.request).then(response => {
        if (response.status === 200) {
          cache.put(event.request, response.clone());
        }
        return response;
      }).catch(() => null);

      // Return cached immediately (may be stale)
      return cachedResponse || fetchPromise;
    })
  );
});
```

### Network-First với Fallback

```javascript
// sw.js — Network-First, fallback to cache
self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/')) {
    // API: Network-First
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open('api-cache').then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Network failed → return cached data
          return caches.match(event.request);
        })
    );
  } else {
    // Static assets: Cache-First
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request);
      })
    );
  }
});
```

---

## 3. In-Memory Caching

### Simple memoization

```javascript
// ❌ Không cache: tính lại mỗi lần gọi
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
fibonacci(40); // O(2^n) — rất chậm!

// ✅ Memoization: cache kết quả
function memoize(fn) {
  const cache = new Map();

  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const fastFib = memoize(function(n) {
  if (n <= 1) return n;
  return fastFib(n - 1) + fastFib(n - 2);
});
fastFib(40); // O(n) — rất nhanh!
```

### LRU Cache

```javascript
// LRU (Least Recently Used) Cache — giới hạn size
class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;

    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Delete oldest (first) entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key) { return this.cache.has(key); }
  clear() { this.cache.clear(); }
  get size() { return this.cache.size; }
}

// Usage:
const cache = new LRUCache(100);

function fetchUser(id) {
  if (cache.has(id)) {
    console.log('Cache hit!');
    return Promise.resolve(cache.get(id));
  }

  return fetch(`/api/users/${id}`)
    .then(res => res.json())
    .then(user => {
      cache.set(id, user);
      return user;
    });
}
```

### TTL Cache (Time-To-Live)

```javascript
// Cache với expiration time
class TTLCache {
  constructor(ttlMs = 60000, maxSize = 100) {
    this.ttlMs = ttlMs;
    this.maxSize = maxSize;
    this.cache = new Map();
    this.timestamps = new Map();
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.delete(firstKey);
    }
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;

    const timestamp = this.timestamps.get(key);
    if (Date.now() - timestamp > this.ttlMs) {
      this.delete(key);
      return undefined;
    }

    // Move to end (LRU)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    this.timestamps.delete(key);
    this.timestamps.set(key, Date.now());
    return value;
  }

  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }
}

// Usage:
const userCache = new TTLCache(5 * 60 * 1000); // 5 minutes TTL
const apiCache = new TTLCache(60 * 1000); // 1 minute TTL
```

---

## 4. Browser Storage Caching

### Storage comparison

```
┌──────────────────────────────────────────────────────────────┐
│  BROWSER STORAGE COMPARISON                                  │
│                                                               │
│  localStorage                                                │
│  ├── Capacity: ~5-10MB                                       │
│  ├── Sync: SYNC (blocks main thread!) ⚠️                   │
│  ├── Scope: Origin only                                      │
│  ├── Type: Strings only                                     │
│  └── Expiry: Never (manual delete)                          │
│                                                               │
│  sessionStorage                                              │
│  ├── Capacity: ~5-10MB                                       │
│  ├── Sync: SYNC (blocks main thread!) ⚠️                   │
│  ├── Scope: Tab only                                         │
│  ├── Type: Strings only                                     │
│  └── Expiry: Tab close                                       │
│                                                               │
│  IndexedDB                                                    │
│  ├── Capacity: Unlimited                                     │
│  ├── Sync: ASYNC ✅                                          │
│  ├── Type: Objects, blobs                                   │
│  └── Expiry: Manual (nên implement TTL)                     │
│                                                               │
│  Cache API (Service Worker)                                  │
│  ├── Capacity: Unlimited                                     │
│  ├── Sync: ASYNC ✅                                          │
│  ├── Type: Request/Response pairs                            │
│  └── Expiry: Manual (lifespan: Cache-Control based)        │
│                                                               │
│  ⚠️ localStorage/sessionStorage = SYNC = block main thread   │
│  ⚠️ Use IndexedDB or Cache API for large data              │
└──────────────────────────────────────────────────────────────┘
```

### IndexedDB caching

```javascript
// Simple IndexedDB wrapper
class IndexedDBCache {
  constructor(dbName, storeName) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
  }

  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async get(key) {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) return resolve(undefined);

        // Check TTL
        if (result.expires && Date.now() > result.expires) {
          this.delete(key);
          return resolve(undefined);
        }
        resolve(result.value);
      };
    });
  }

  async set(key, value, ttlMs = null) {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);

      const record = {
        key,
        value,
        timestamp: Date.now(),
        expires: ttlMs ? Date.now() + ttlMs : null
      };

      const request = store.put(record);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(record);
    });
  }

  async delete(key) {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const request = tx.objectStore(this.storeName).delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear() {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const request = tx.objectStore(this.storeName).clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Usage:
const apiCache = new IndexedDBCache('app-cache', 'api-responses');

async function fetchCached(url) {
  const cached = await apiCache.get(url);
  if (cached) return cached;

  const response = await fetch(url);
  const data = await response.json();

  await apiCache.set(url, data, 5 * 60 * 1000); // 5 min TTL
  return data;
}
```

---

## 5. React Caching Patterns

### useMemo — Cache expensive computations

```javascript
// ❌ Expensive computation chạy lại mỗi render
function ExpensiveList({ items, filter }) {
  const filtered = items
    .filter(item => item.category === filter)
    .sort((a, b) => b.price - a.price);
  // → Chạy lại MỖI LẦI render, even khi items không đổi
}

// ✅ useMemo — cache result
function ExpensiveList({ items, filter }) {
  const filtered = useMemo(() => {
    return items
      .filter(item => item.category === filter)
      .sort((a, b) => b.price - a.price);
  }, [items, filter]);
  // → Chỉ recompute khi items hoặc filter thay đổi
}

// ✅ useCallback — stabilize function references
function Parent() {
  const handleClick = useCallback(() => {
    // stable reference
  }, []);

  return <Child onClick={handleClick} />;
}
```

### SWR — Stale-While-Revalidate for React

```javascript
import useSWR from 'swr';

// SWR: fetch + cache + revalidate
const { data, error, isLoading } = useSWR('/api/user', fetcher, {
  revalidateOnFocus: true,     // Revalidate khi tab focus lại
  revalidateOnReconnect: true, // Revalidate khi online lại
  dedupingInterval: 2000,      // 2 giây không fetch lại cùng key
  fallbackData: [],            // Initial data khi loading
  refreshInterval: 30000,     // Revalidate mỗi 30s
  onSuccess: (data) => { /* success handler */ },
  onError: (err) => { /* error handler */ }
});

// Cách hoạt động:
// 1. Hiển thị cached data ngay lập tức (stale)
// 2. Fetch fresh data trong background
// 3. Update UI khi fresh data arrives
// → Instant display + eventual consistency
```

### React Query

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query với caching
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  staleTime: 5 * 60 * 1000,    // 5 phút trước khi considered stale
  cacheTime: 30 * 60 * 1000,  // 30 phút trước khi garbage collected
  refetchOnWindowFocus: true,  // Refetch khi focus
  retry: 3,                    // Retry on failure
  select: (data) => data.user  // Transform data
});

// Mutations với cache invalidation
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: updateUser,
  onSuccess: (data, variables) => {
    // Invalidate queries → trigger refetch
    queryClient.invalidateQueries({ queryKey: ['user', variables.id] });

    // Hoặc update cache trực tiếp (optimistic update)
    queryClient.setQueryData(['user', variables.id], data);
  }
});
```

---

## 6. CDN Caching

### CDN concepts

```
┌──────────────────────────────────────────────────────────────┐
│  CDN CACHING LAYERS                                           │
│                                                               │
│  User → CDN Edge (PoP) → CDN Origin → Origin Server         │
│                                                               │
│  CDN Edge (Point of Presence):                                │
│  ├── Server gần user nhất                                   │
│  ├── Cache static assets globally                           │
│  ├── Reduce latency từ 200ms → 5ms                         │
│  └── Handle traffic spikes                                    │
│                                                               │
│  CDN Cache Headers:                                           │
│  ├── Cache-Control: public, max-age=31536000                │
│  ├── Surrogate-Control (Akamai): edge caching               │
│  └── Vary: Accept-Encoding, Accept-Language                  │
│                                                               │
│  CDN Features:                                                 │
│  ├── Edge Functions: modify requests/responses at edge      │
│  ├── Image Optimization: resize, format conversion          │
│  └── DDoS Protection + WAF                                  │
└──────────────────────────────────────────────────────────────┘
```

### CDN cache busting

```javascript
// Content hashing — automatic cache busting
// webpack/vite output:
// bundle.abc123.js — contenthash = hash của CONTENT
// → File đổi nội dung → hash đổi → new filename → cache bust!

// HTML:
<script src="/bundle.abc123.js"></script>

// Sau deploy:
// bundle.xyz789.js — hash khác
// HTML updated:
// <script src="/bundle.xyz789.js"></script>

// Old users:
// → Load HTML mới với new filename
// → Cached /bundle.abc123.js không dùng nữa
// → Browser fetch new bundle.xyz789.js

// ✅ Automatic cache busting!
// ✅ Old cache entries được ignored
```

---

## 7. Cache Invalidation

### When to invalidate

```
┌──────────────────────────────────────────────────────────────┐
│  CACHE INVALIDATION STRATEGIES                               │
│                                                               │
│  IMMEDIATE (on mutation)                                     │
│  ├── User update profile → invalidate user cache           │
│  ├── Create new item → invalidate list cache              │
│  └── Delete item → invalidate item + list cache           │
│                                                               │
│  TIME-BASED                                                   │
│  ├── TTL expiration (automatic)                            │
│  ├── Scheduled invalidation (cron job)                     │
│  └── Stale-while-revalidate (eventual consistency)        │
│                                                               │
│  EVENT-BASED                                                   │
│  ├── Webhook from server → invalidate cache               │
│  ├── Pusher/SSE event → invalidate relevant cache       │
│  └── Push notification → invalidate cache              │
│                                                               │
│  RULE OF THUMB:                                              │
│  └── "Cache invalidation is hardest problem in CS"         │
│      Don't cache prematurely. Cache when you MEASURE        │
│      that it's actually needed.                            │
└──────────────────────────────────────────────────────────────┘
```

### Cache invalidation strategies

```javascript
// Pattern: Cache-Aside (Read-Through)
async function getUser(id) {
  const cache = await cacheDB.get(`user:${id}`);
  if (cache) return cache;

  const user = await db.users.findById(id);
  await cacheDB.set(`user:${id}`, user, { ttl: 300 });
  return user;
}

async function updateUser(id, data) {
  const user = await db.users.update(id, data);
  await cacheDB.delete(`user:${id}`); // Invalidate
  return user;
}

// Pattern: Write-Through (Write-Update Cache Immediately)
async function updateUser(id, data) {
  const user = await db.users.update(id, data);
  await cacheDB.set(`user:${id}`, user, { ttl: 300 }); // Write-through
  return user;
}

// Pattern: Write-Behind (Async Update)
async function updateUser(id, data) {
  // Update DB immediately
  await db.users.update(id, data);

  // Queue cache update for later
  await cacheUpdateQueue.add({ id, data });

  // Worker processes queue in background
  // ...
}
```

---

## 8. Các Traps Phổ Biến

### Trap 1: Caching user-specific data như public

```javascript
// ❌ KHÔNG BAO GIỜ cache user-specific data ở CDN/public
// HTTP response:
// Cache-Control: public
// → CDN caches user A's data
// → User B receives User A's data! SECURITY VIOLATION!

// ✅ Cache-Control: private
res.set('Cache-Control', 'private, max-age=300');
// → Chỉ browser cache, không CDN cache
```

### Trap 2: Infinite cache = stale data forever

```javascript
// ❌ max-age=31536000 (1 năm) + KHÔNG có versioning
// → Nếu user cache data, data đổi ở server
// → User vẫn xem data cũ mãi mãi!

// ✅ Versioning hoặc short TTL
Cache-Control: public, max-age=60, stale-while-revalidate=300
// → Sau 60s: served from cache but revalidated
// → Guaranteed fresh within reasonable timeframe

// ✅ Cache busting headers
res.set('ETag', `"${contentHash}"`);
res.set('Cache-Control', 'public, max-age=31536000, immutable');
// → Immutable = browser cache FOREVER, but filename changes when content changes
```

### Trap 3: Stale data displayed without indication

```javascript
// ❌ User xem data cũ mà không biết
const { data } = useSWR('/api/data', fetcher);
// → SWR shows cached data
// → User doesn't know data might be stale
// → User acts on stale information!

// ✅ Show stale indicator
const { data, isValidating } = useSWR('/api/data', fetcher);

return (
  <div>
    {data && (
      <div>
        {data.content}
        {isValidating && <span className="refreshing">⟳</span>}
        {!isValidating && <span className="cached">cached</span>}
      </div>
    )}
  </div>
);
```

### Trap 4: Caching everything = memory bloat

```javascript
// ❌ Cache quá nhiều = memory issues
const cache = new Map(); // Unlimited!

// Cache càng ngày càng lớn → out of memory!

// ✅ Always use bounded cache
const cache = new LRUCache(100); // Max 100 entries
const apiCache = new TTLCache(5 * 60 * 1000, 1000); // TTL + max size
```

---

## 9. Câu Hỏi Phỏng Vấn

### Câu 1: HTTP Cache headers hoạt động thế nào?

**Trả lời:** Browser gửi request → Server respond với `Cache-Control` + optional `ETag`/`Last-Modified`. Next request: (1) Check `max-age`: nếu chưa hết hạn → serve from cache. (2) Nếu hết hạn hoặc `no-cache` → gửi request với `If-None-Match: "etag"` hoặc `If-Modified-Since: date`. Server: nếu unchanged → `304 Not Modified` → use cached. Nếu changed → `200 OK` + new content + new ETag.

---

### Câu 2: CDN hoạt động thế nào?

**Trả lời:** CDN = network of servers ở worldwide PoPs (Point of Presence). User request → routed to nearest PoP → PoP serves cached response. Cache miss → PoP fetches from origin → caches → serves. Benefits: reduced latency (geographic proximity), reduced origin load, DDoS protection, edge computing capabilities. Static assets được cache dài, dynamic content được cache ngắn hoặc không cache.

---

### Câu 3: Cache-Aside vs Read-Through vs Write-Through?

| | Cache-Aside | Read-Through | Write-Through |
|--|------------|--------------|---------------|
| Read | App checks cache → fetch from DB if miss → update cache | Cache auto-fetches from DB on miss | Same as cache-aside |
| Write | App writes to DB → invalidates/updates cache | Cache auto-writes to DB on update | App writes to cache → cache writes to DB |
| Pros | Explicit control | Automatic | Guaranteed consistency |
| Cons | App manages cache | Cache must understand DB | Write latency = cache + DB |
| Use case | Most common | Transparent caching | Write consistency critical |

---

### Câu 4: LRU vs LFU vs FIFO Cache?

| | LRU (Least Recently Used) | LFU (Least Frequently Used) | FIFO (First In, First Out) |
|--|--------------------------|----------------------------|---------------------------|
| Eviction | Evict least recently accessed | Evict least frequently accessed | Evict oldest |
| Implementation | LinkedHashMap | Frequency counter | Queue |
| Pros | Good temporal locality | Good frequency data | Simple |
| Cons | More overhead | Overhead tracking frequency | Ignores access patterns |
| Use case | Most scenarios | Popular items | Simple scenarios |

---

### Câu 5: Service Worker vs HTTP Cache?

| | Service Worker | HTTP Cache |
|--|---------------|-----------|
| Scope | Programmatic, full control | Declarative, limited |
| Timing | Intercept requests, decide per request | Automatic based on headers |
| Capabilities | Stale-while-revalidate, offline-first | Automatic header-based |
| Cache API | Access from SW | Browser-managed |
| Use case | Offline apps, complex strategies | Static assets |

---

### Câu 6: Khi nào KHÔNG nên cache?

**Trả lời:** (1) **Real-time data** — stock prices, live sports, chat messages. (2) **User-specific sensitive data** — passwords, tokens, personal info. (3) **Frequently changing data** — cache invalidation overhead > benefit. (4) **Small, fast operations** — caching overhead > fetch overhead. (5) **Debugging/testing** — cache hides real behavior.

---

## 10. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  CACHING STRATEGIES                                           │
│                                                               │
│  HTTP CACHE (Browser + CDN)                                 │
│  ├── Cache-Control headers                                   │
│  ├── ETag / Last-Modified for revalidation                 │
│  ├── Cache-First: static assets                            │
│  └── Stale-While-Revalidate: balance speed + freshness       │
│                                                               │
│  SERVICE WORKER                                              │
│  ├── Cache API for offline-first apps                       │
│  ├── Programmatic control over caching                     │
│  └── Advanced strategies: Network-First, Cache-First       │
│                                                               │
│  IN-MEMORY CACHING                                            │
│  ├── Memoization: expensive computations                   │
│  ├── LRU Cache: bounded size                               │
│  ├── TTL Cache: time-based expiration                       │
│  └── React: useMemo, useSWR, React Query                   │
│                                                               │
│  CACHE INVALIDATION                                           │
│  ├── On mutation: immediate invalidation                  │
│  ├── TTL: automatic expiration                             │
│  └── Event-based: webhooks, SSE                           │
│                                                               │
│  ⚠️ Never cache user-specific data as public              │
│  ⚠️ Bounded caches — prevent memory bloat                │
│  ⚠️ Show stale indicators when data might be old         │
│  ⚠️ Cache invalidation = hardest problem in CS          │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Set được HTTP cache headers đúng cho từng loại content
- [ ] Implement được Service Worker caching strategy
- [ ] Biết dùng LRU/TTL cache
- [ ] Dùng được useMemo/useSWR/React Query đúng cách
- [ ] Phân biệt được Cache-Aside vs Write-Through
- [ ] Trả lời được 4/6 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
