# CDN & Multi-layer Caching — Edge Computing

## Câu hỏi mở đầu

```javascript
// User ở Vietnam truy cập website có server ở US:
// → Request: Vietnam → US = 200ms latency
// → Response: US → Vietnam = 200ms latency
// → Total: 400ms just for network!

// User ở Vietnam truy cập CDN:
// → CDN Edge server: Vietnam (Ho Chi Minh City)
// → Request: Vietnam → Vietnam CDN = 5ms latency!
// → Vietnam CDN → US Origin = 50ms
// → Vietnam CDN → User = 5ms
// → Total: 60ms!

// CDN = đưa content đến GẦN user nhất
// → Giảm latency TỪ 400ms → 60ms (6.7x faster)
```

**CDN (Content Delivery Network)** = hệ thống servers phân bố toàn cầu, đưa content đến gần user nhất. Kết hợp với multi-layer caching → giảm latency, giảm server load, tăng availability.

---

## 1. CDN Fundamentals

### How CDN works

```
┌──────────────────────────────────────────────────────────────┐
│  CDN NETWORK                                                   │
│                                                               │
│  ORIGIN SERVER                                                 │
│  (US East - N Virginia)                                      │
│  Hosts: HTML, dynamic API responses                          │
│                                                               │
│  CDN PoPs (Points of Presence) — 200+ locations globally    │
│  ├── Asia Pacific: Tokyo, Singapore, Sydney, Mumbai...       │
│  ├── Europe: Frankfurt, London, Paris, Amsterdam...        │
│  ├── Americas: New York, Los Angeles, São Paulo...          │
│  └── Africa/Middle East: Johannesburg, Dubai...             │
│                                                               │
│  CACHING LAYERS:                                             │
│  ├── Browser Cache                                           │
│  ├── CDN Edge Cache (closest PoP to user)                 │
│  ├── CDN Origin Shield (optional, reduces origin load)        │
│  └── Origin Server                                          │
│                                                               │
│  REQUEST FLOW:                                              │
│  User → Nearest Edge → Cache HIT?                          │
│                    ├── YES → Return cached content         │
│                    └── NO  → Origin Shield → Origin       │
│                                        → Cache at Edge      │
│                                        → Return to User     │
└──────────────────────────────────────────────────────────────┘
```

### CDN Caching rules

```javascript
// HTTP headers control CDN caching behavior

// STATIC ASSETS (immutable, hashed filenames)
// Cache: 1 year (immutable)
Cache-Control: public, max-age=31536000, immutable
// immutable = content NEVER changes at this URL
// → Browser/CDN NEVER revalidates

// DYNAMIC HTML
// Cache: short, revalidate
Cache-Control: public, max-age=0, must-revalidate
// → Always revalidate on each request
// → CDN serves stale + revalidates in background

// API RESPONSES
// Cache: stale-while-revalidate
Cache-Control: public, max-age=60, stale-while-revalidate=300
// → Serve stale for up to 5 minutes while revalidating
// → 95% fast (from cache) + 5% fresh (revalidation)

// USER-SPECIFIC DATA
// Cache: private, short
Cache-Control: private, max-age=300
// → Only browser caches, NOT CDN
// → Personalized content

// NEVER CACHE
Cache-Control: no-store
// → Never cache sensitive/personal data
```

### Cache-Control directives

```
┌──────────────────────────────────────────────────────────────┐
│  CACHE-CONTROL DIRECTIVES                                    │
│                                                               │
│  WHO CAN CACHE:                                              │
│  ├── public: CDN + browser can cache                       │
│  ├── private: only browser, NOT CDN                        │
│  └── no-store: never cache                               │
│                                                               │
│  HOW LONG:                                                    │
│  ├── max-age=N: cache for N seconds                       │
│  ├── s-maxage=N: CDN-specific max-age (overrides max-age)  │
│  └── no-cache: revalidate every request                   │
│                                                               │
│  REVALIDATION:                                               │
│  ├── must-revalidate: stale = cannot serve                 │
│  ├── proxy-revalidate: same, for proxies/CDN             │
│  └── stale-while-revalidate=N: serve stale for Ns        │
│                                                               │
│  OTHER:                                                        │
│  ├── immutable: content never changes at this URL          │
│  └── no-transform: don't compress/convert                 │
│                                                               │
│  VARY HEADER:                                                 │
│  ├── Vary: Accept-Encoding (cache gzip vs brotli)     │
│  ├── Vary: Accept-Language (cache en vs vi)            │
│  └── Vary: Cookie (cache per user if needed)           │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. CDN Configuration

### Cloudflare configuration

```javascript
// cloudflare-pages-config.js hoặc dashboard settings:

// Page Rules:
// *.example.com/images/*
//   → Cache Level: Cache Everything
//   → Edge Cache TTL: 1 month
//   → Browser Cache TTL: 1 year

// api.example.com/*
//   → Cache Level: Bypass
//   → Disable cache for API routes

// Static assets (with content hash):
// app.abc123.js
//   → Automatically cached by CDN
//   → immutabe cache headers applied

// Cache purge:
// When deploying new version:
// → Filename changes (content hash): automatic cache busting
// → Pattern purge: purges.cache.example.com
await fetch('https://api.cloudflare.com/client/v4/zones/{id}/purge_cache', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${CF_API_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    files: [
      'https://example.com/app.abc123.js',
      'https://example.com/styles.abc123.css'
    ]
  })
});
```

### Cache invalidation strategies

```javascript
// STRATEGY 1: Content-addressable (content hashing)
// Static assets: app.[contenthash].js
// → Content changes → new hash → new URL
// → Old URL automatically stale
// → No explicit invalidation needed!

// STRATEGY 2: Versioned URLs
// /v1/api/data → cached 1 hour
// Deploy new API version → /v2/api/data
// → Old cache automatically stale

// STRATEGY 3: Tag-based invalidation
// Cache tags: associate content with tags
// CDN.invalidate(['product-page', 'product-123']);
// → Invalidates ALL cached content with that tag

// STRATEGY 4: Purge by URL pattern
// Purge all JS files:
// *.js → purged on deploy

// STRATEGY 5: TTL-based expiration
// Dynamic content: max-age=0
// → Always revalidates
// → CDN always checks origin
```

### Vary header và cache keys

```javascript
// Vary header = CDN creates SEPARATE cache entry per variation
// ❌ Too many variations = cache fragmentation

// BAD: varies by every cookie = cache explosion
Set-Cookie: session=abc123
Set-Cookie: preferences=dark_mode
Vary: Cookie
// → CDN creates entry per session!
// → Cache essentially useless!

// GOOD: only vary by what matters
// Mobile vs Desktop:
Vary: User-Agent
// → CDN caches: mobile version, desktop version

// API with language:
Vary: Accept-Language
// → CDN caches: en version, vi version

// ❌ BAD: Vary: Accept-Encoding, User-Agent, Cookie
// 100 user agents × 2 encodings × infinite cookies = millions!

// ✅ GOOD:
// Static resources: no Vary needed (immutable)
// API with language: Vary: Accept-Language
// Authenticated: Cache-Control: private
```

---

## 3. Edge Computing

### Edge functions

```javascript
// Edge Function = JavaScript chạy ở CDN edge servers
// → Close to user = low latency
// → Can modify requests/responses without hitting origin

// Cloudflare Workers example:
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // A/B Testing at the edge
  if (url.pathname.startsWith('/landing')) {
    const variant = Math.random() < 0.5 ? 'A' : 'B';
    const response = await fetch(request);
    const cloned = response.clone();

    // Modify HTML to inject variant
    const html = await cloned.text();
    const modified = html.replace(
      '{{VARIANT}}',
      `<script>window.variant='${variant}';</script>`
    );

    return new Response(modified, response);
  }

  // Authentication check at edge
  if (url.pathname.startsWith('/api/')) {
    const token = request.headers.get('Authorization');

    if (!token) {
      return new Response('Unauthorized', { status: 401 });
    }

    const verified = await verifyToken(token);
    if (!verified) {
      return new Response('Invalid token', { status: 401 });
    }

    // Forward verified request to origin
    return fetch(request);
  }

  // Default: pass through
  return fetch(request);
}
```

### Edge use cases

```
┌──────────────────────────────────────────────────────────────┐
│  EDGE FUNCTION USE CASES                                     │
│                                                               │
│  AUTHENTICATION:                                             │
│  ├── Verify JWT at edge                                     │
│  ├── Redirect unauthenticated users                         │
│  ├── Add auth headers to origin requests                   │
│                                                               │
│  PERSONALIZATION:                                            │
│  ├── A/B testing                                           │
│  ├── Geo-based content                                      │
│  ├── User-specific headers                                  │
│                                                               │
│  SECURITY:                                                   │
│  ├── Rate limiting                                          │
│  ├── DDoS protection                                        │
│  ├── WAF (Web Application Firewall)                         │
│  ├── Bot detection                                          │
│                                                               │
│  PERFORMANCE:                                                │
│  ├── Response streaming                                      │
│  ├── HTML modification (inject scripts)                    │
│  ├── Image optimization at edge                            │
│  └── Static asset compression                              │
│                                                               │
│  DATA PROCESSING:                                            │
│  ├── Transform API responses                               │
│  ├── Aggregate multiple origin requests                     │
│  └── Real-time data processing                              │
└──────────────────────────────────────────────────────────────┘
```

### Edge vs Origin computation

```javascript
// EDGE COMPUTING: lightweight, stateless
// ✅ Do at edge:
// - Auth verification (JWT check)
// - Rate limiting
// - Geo-routing
// - A/B testing
// - Response modification
// - CORS handling

// ORIGIN COMPUTATION: complex, stateful
// ❌ Do at origin:
// - Database queries
// - Heavy computation
// - File processing
// - Business logic requiring state
// - Payment processing

// Example: Authentication flow
async function handleRequest(request) {
  const token = request.headers.get('Cookie')
    ?.match(/session=([^;]+)/)?.[1];

  if (token) {
    // Fast JWT verification at edge
    const payload = await verifyJWT(token);

    if (payload) {
      // Add user context
      const modifiedRequest = new Request(request, {
        headers: {
          ...Object.fromEntries(request.headers),
          'X-User-Id': payload.sub,
          'X-User-Role': payload.role
        }
      });

      return fetch(modifiedRequest);
    }
  }

  // Redirect to login
  return Response.redirect('/login', 302);
}
```

---

## 4. Multi-layer Caching Architecture

### Complete caching layers

```
┌──────────────────────────────────────────────────────────────┐
│  MULTI-LAYER CACHING                                         │
│                                                               │
│  LAYER 1: BROWSER CACHE                                      │
│  ├── URL-based (localStorage, IndexedDB)                    │
│  ├── HTTP Cache (Cache-Control headers)                      │
│  ├── Service Worker Cache (offline-first)                   │
│  └── Latency: < 1ms                                        │
│                                                               │
│  LAYER 2: CDN EDGE CACHE                                     │
│  ├── 200+ PoPs globally                                    │
│  ├── Close to user (5-50ms)                                 │
│  ├── Immutable assets: 1 year                              │
│  ├── Dynamic: stale-while-revalidate                       │
│                                                               │
│  LAYER 3: CDN ORIGIN SHIELD                                  │
│  ├── Single point behind CDN edges                          │
│  ├── Reduces origin requests by 80-90%                     │
│  ├── Aggregate requests from multiple edges                │
│                                                               │
│  LAYER 4: REDIS CACHE                                        │
│  ├── In-memory (< 1ms)                                     │
│  ├── Application-level cache                               │
│  ├── Session, hot data, computed results                   │
│  ├── TTL-based expiration                                 │
│                                                               │
│  LAYER 5: DATABASE CACHE                                    │
│  ├── Query cache                                          │
│  ├── Buffer pool (hot pages)                              │
│  └── Connection pool                                      │
│                                                               │
│  LAYER 6: DATABASE                                          │
│  └── Source of truth                                       │
└──────────────────────────────────────────────────────────────┘
```

### Cache decision tree

```javascript
// REQUEST → CHECK LAYERS IN ORDER

async function handleRequest(url, options = {}) {
  // Layer 1: Browser HTTP Cache
  const cachedResponse = await caches.match(url);
  if (cachedResponse && !options.noCache) {
    if (isFresh(cachedResponse)) {
      return cachedResponse; // ✅ Cache HIT
    }
    // Stale but usable: return + revalidate in background
    const revalidated = await revalidateInBackground(url, cachedResponse);
    if (revalidated) return revalidated;
  }

  // Layer 2: CDN Cache
  const cdnResponse = await fetchViaCDN(url);
  if (cdnResponse && cdnResponse.fromCache) {
    if (isFresh(cdnResponse)) {
      // ✅ CDN HIT
      // Copy to browser cache
      await caches.put(url, cdnResponse.clone());
      return cdnResponse;
    }
  }

  // Layer 3: Redis Cache
  const redisData = await redis.get(cacheKey(url));
  if (redisData && isFresh(redisData)) {
    // ✅ Redis HIT
    // Construct response from cached data
    return buildResponse(redisData);
  }

  // Layer 4: Origin
  const originResponse = await fetchFromOrigin(url);

  // Cache in Redis
  await redis.setex(cacheKey(url), 300, JSON.stringify(originData));

  // CDN will cache automatically based on headers
  return originResponse;
}
```

---

## 5. Real-world Caching Strategies

### E-commerce caching

```javascript
// E-commerce caching strategy by content type

const CACHE_CONFIG = {
  // Product listing (changes frequently)
  '/api/products': {
    cdn: { maxAge: 60, staleWhileRevalidate: 300 },
    redis: { ttl: 120 }
  },

  // Product detail (changes less)
  '/api/products/:id': {
    cdn: { maxAge: 300, staleWhileRevalidate: 3600 },
    redis: { ttl: 600 }
  },

  // User-specific data
  '/api/cart': {
    cdn: { cacheControl: 'private' }, // No CDN
    redis: { ttl: 86400 }
  },

  // Search results (highly dynamic)
  '/api/search': {
    cdn: { maxAge: 0, cacheControl: 'no-store' } // Bypass CDN
  },

  // Static assets (immutable)
  '/static/*': {
    cdn: { maxAge: 31536000, immutable: true },
    browser: { maxAge: 31536000 }
  }
};

function getCacheHeaders(path) {
  const config = CACHE_CONFIG[path] || CACHE_CONFIG['default'];

  const headers = new Headers();

  if (config.cdn.cacheControl) {
    headers.set('Cache-Control', config.cdn.cacheControl);
  } else {
    const parts = [];
    if (config.cdn.maxAge !== undefined) {
      parts.push(`max-age=${config.cdn.maxAge}`);
    }
    if (config.cdn.immutable) {
      parts.push('immutable');
    }
    if (config.cdn.staleWhileRevalidate) {
      parts.push(`stale-while-revalidate=${config.cdn.staleWhileRevalidate}`);
    }
    headers.set('Cache-Control', parts.join(', '));
  }

  return headers;
}
```

### API caching pattern

```javascript
// API Gateway caching
class APIGateway {
  constructor(config) {
    this.redis = config.redis;
    this.cdn = config.cdn;
  }

  async handleRequest(req) {
    const cacheKey = this.buildCacheKey(req);

    // Try Redis first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);

      // Return stale data while revalidating
      if (this.isStale(data)) {
        // Fire-and-forget revalidation
        this.revalidateInBackground(req, cacheKey);
      }

      return this.buildResponse(data, { fromCache: true });
    }

    // Fetch from origin
    const response = await fetchFromOrigin(req);
    const data = await response.json();

    // Cache
    const ttl = this.getTTL(req.path);
    await this.redis.setex(cacheKey, ttl, JSON.stringify({
      data,
      cachedAt: Date.now(),
      ttl
    }));

    return this.buildResponse(data);
  }

  async revalidateInBackground(req, cacheKey) {
    try {
      const fresh = await fetchFromOrigin(req);
      const data = await fresh.json();
      const ttl = this.getTTL(req.path);

      await this.redis.setex(cacheKey, ttl, JSON.stringify({
        data,
        cachedAt: Date.now(),
        ttl
      }));
    } catch (err) {
      console.error('Revalidation failed:', err);
    }
  }
}
```

---

## 6. Cache Stampede Prevention

### Thundering herd

```javascript
// ❌ Thundering herd: 100 requests hit cache miss simultaneously
// → All 100 go to origin simultaneously
// → Origin overwhelmed!

// Without stampede prevention:
async function getProduct(id) {
  const cached = await redis.get(`product:${id}`);
  if (cached) return JSON.parse(cached);

  // 100 requests arrive at same time, all miss cache
  const product = await fetchFromOrigin(`/products/${id}`);
  await redis.setex(`product:${id}`, 300, JSON.stringify(product));

  return product;
}

// ✅ With mutex lock:
const locks = new Map();

async function getProduct(id) {
  const cached = await redis.get(`product:${id}`);
  if (cached) return JSON.parse(cached);

  // Acquire lock
  const lockKey = `lock:product:${id}`;
  const acquired = await redis.set(lockKey, '1', { NX: true, EX: 10 });

  if (!acquired) {
    // Wait and retry
    await new Promise(r => setTimeout(r, 100));
    return getProduct(id); // Recursive retry
  }

  try {
    const product = await fetchFromOrigin(`/products/${id}`);
    await redis.setex(`product:${id}`, 300, JSON.stringify(product));
    return product;
  } finally {
    await redis.del(lockKey); // Release lock
  }
}

// ✅ With probabilistic early expiration:
async function getProductEarlyExpiration(id) {
  const cached = await redis.get(`product:${id}`);
  if (!cached) {
    return refreshProduct(id);
  }

  const data = JSON.parse(cached);
  const age = (Date.now() - data.cachedAt) / 1000;
  const ttl = data.ttl - age;

  // Probabilistic early expiration
  // As TTL gets lower, probability of refresh increases
  const threshold = 0.2; // 20% of TTL remaining
  const probability = 1 - (ttl / data.ttl) / threshold;

  if (ttl < 10 || Math.random() < probability) {
    refreshProduct(id); // Fire-and-forget refresh
  }

  return data;
}
```

---

## 7. Các Traps Phổ Biến

### Trap 1: Caching personalized content

```javascript
// ❌ Cache personalized page per user
Set-Cookie: session=abc123
// NOT setting Cache-Control: private
// → CDN caches page with user session
// → OTHER users see first user's data!

// ✅ Always set private for user-specific content
Set-Cookie: session=abc123
Cache-Control: private, max-age=0
// → CDN bypasses, only browser caches
```

### Trap 2: Cache key ignoring variations

```javascript
// ❌ Case sensitivity ignored by CDN?
// /api/users and /API/users cached separately?
// → Depends on CDN configuration

// ✅ Always normalize URLs before caching
const normalizedUrl = url.toLowerCase().split('?')[0];
const cacheKey = `cdn:${normalizedUrl}`;

// ✅ Query parameter ordering
const url1 = '/api?a=1&b=2';
const url2 = '/api?b=2&a=1';
// These should be SAME cached resource
const sortedParams = new URLSearchParams(params).toString();
```

### Trap 3: Stale data for too long

```javascript
// ❌ Long cache + infrequent updates = stale data problem
Cache-Control: public, max-age=86400 // 1 day
// → Product out of stock but cached for 1 day!
// → Users can't buy!

// ✅ Cache with invalidation on update
async function updateProduct(id, data) {
  await db.products.update(id, data);

  // Explicit cache invalidation
  await redis.del(`product:${id}`);
  await cdn.purge(`/api/products/${id}`);
}

// ✅ Or use shorter TTL + revalidation
Cache-Control: public, max-age=60, stale-while-revalidate=300
// → Max 1 minute definitely stale
// → 5 minutes possibly stale
```

---

## 8. Câu Hỏi Phỏng Vấn

### Câu 1: CDN hoạt động thế nào?

**Trả lời:** CDN = distributed network of servers (PoPs) globally. User request → routed to nearest PoP → PoP checks cache. Cache hit → return cached content (5-50ms). Cache miss → fetch from origin/origin shield → cache response → return to user. Caching controlled by HTTP headers: `Cache-Control`, `ETag`, `Last-Modified`. PoPs periodically revalidate or expire cached content.

---

### Câu 2: stale-while-revalidate vs must-revalidate?

**Trả lời:** `stale-while-revalidate=N`: serve stale content while revalidating in background for N seconds. Benefit: instant response + eventual consistency. `must-revalidate`: cannot serve stale content even if revalidation takes time. User waits for fresh. Use stale-while-revalidate for non-critical content, must-revalidate for critical/real-time data.

---

### Câu 3: Cache invalidation strategies?

**Trả lời:** (1) **TTL expiration**: automatic invalidation by time. (2) **Content-addressable**: URL = hash of content, changes automatically. (3) **Tag-based**: associate content with tags, invalidate by tag. (4) **Explicit purge**: API call to CDN to invalidate specific URLs. (5) **Event-driven**: invalidate on data change (webhook, event bus).

---

### Câu 4: Edge computing vs Origin?

**Trả lời:** Edge: lightweight, stateless, runs on CDN servers close to users. Good for: auth, routing, modification, personalization. Origin: complex, stateful, business logic, database queries. Edge cannot replace origin for heavy computation. Edge complements origin: offload lightweight tasks, reduce latency, reduce origin load.

---

### Câu 5: Multi-layer caching benefits?

**Trả lời:** Each layer serves different purpose: Browser (0ms), CDN Edge (5-50ms), Redis (0.1-1ms), DB (5-50ms). More layers = fewer origin requests, lower latency, higher availability. Cache hit at any layer = faster than origin. Multi-layer = resilience: if one layer fails, others serve traffic.

---

## 9. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  CDN & MULTI-LAYER CACHING                                  │
│                                                               │
│  CDN BASICS                                                   │
│  ├── 200+ PoPs globally                                      │
│  ├── User → Nearest PoP → Cache HIT? → Origin           │
│  └── Cache-Control headers control behavior               │
│                                                               │
│  CACHE HEADERS                                                │
│  ├── public/private/no-store: who caches               │
│  ├── max-age/s-maxage: how long                          │
│  ├── stale-while-revalidate: serve stale + refresh       │
│  └── immutable: never revalidate                        │
│                                                               │
│  EDGE COMPUTING                                               │
│  ├── Lightweight JS at CDN edge                            │
│  ├── Auth, routing, A/B testing, personalization       │
│  └── Cannot replace origin for heavy computation          │
│                                                               │
│  MULTI-LAYER CACHE                                           │
│  ├── Browser: < 1ms                                        │
│  ├── CDN Edge: 5-50ms                                      │
│  ├── Redis: 0.1-1ms                                        │
│  └── Origin: 5-50ms                                       │
│                                                               │
│  INVALIDATION                                                 │
│  ├── TTL expiration                                         │
│  ├── Content hash (automatic busting)                     │
│  ├── Tag-based                                             │
│  └── Explicit purge API                                     │
│                                                               │
│  ⚠️ Never cache personalized/private content as public     │
│  ⚠️ Watch for thundering herd on cache misses          │
│  ⚠️ Vary header = separate cache per variation       │
│  ⚠️ Edge = lightweight tasks, not replacement for origin │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Hiểu CDN caching flow từ request đến response
- [ ] Configure được Cache-Control headers đúng cho từng content type
- [ ] Phân biệt được edge computing vs origin computation
- [ ] Implement được multi-layer caching
- [ ] Tránh được thundering herd với cache stampede prevention
- [ ] Trả lời được 4/5 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
