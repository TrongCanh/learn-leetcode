# Advanced Promise Patterns — Cancellation, Retry, Memoization

## Câu hỏi mở đầu

```javascript
// Bạn fetch data, nhưng user navigate away trước khi xong
// Request vẫn chạy → lãng phí

// Có cách nào cancel request không?
// → AbortController
```

---

## 1. Promise Cancellation — AbortController

### Browser AbortController

```javascript
const controller = new AbortController();
const { signal } = controller;

// Fetch với signal
async function fetchData() {
  try {
    const response = await fetch('/api/data', { signal });
    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Request cancelled');
    }
    throw err;
  }
}

const promise = fetchData();

// Cancel sau 1 giây
setTimeout(() => controller.abort(), 1000);
```

### Custom Promise cancellation

```javascript
function cancellablePromise(executor) {
  let cancelFn = null;

  const promise = new Promise((resolve, reject) => {
    cancelFn = () => reject(new Error('Cancelled'));

    executor(
      (value) => resolve(value),
      (err) => reject(err),
      () => reject(new Error('Cancelled')) // onCancel
    );
  });

  return {
    promise,
    cancel: () => cancelFn?.()
  };
}

// Usage
const { promise, cancel } = cancellablePromise((resolve, reject, onCancel) => {
  const id = setTimeout(() => resolve('done'), 5000);
  onCancel(() => clearTimeout(id));
});

// Cancel sau 1 giây
setTimeout(cancel, 1000);
```

---

## 2. Promise Retry

### Retry với delay

```javascript
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url).then(r => r.json());
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}
```

### Exponential backoff

```javascript
async function fetchWithBackoff(url, options = {}) {
  const {
    maxRetries = 5,
    baseDelay = 1000,
    maxDelay = 30000
  } = options;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetch(url).then(r => r.json());
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;

      const waitTime = Math.min(
        baseDelay * 2 ** attempt,
        maxDelay
      );

      // Thêm jitter để tránh thundering herd
      const jitter = Math.random() * 1000;
      await new Promise(r => setTimeout(r, waitTime + jitter));
    }
  }
}
```

### Retry với circuit breaker

```javascript
class CircuitBreaker {
  constructor(fn, options = {}) {
    this.fn = fn;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.failures = 0;
    this.lastFailure = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async call(...args) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit is OPEN');
      }
    }

    try {
      const result = await this.fn(...args);
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    this.lastFailure = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}
```

---

## 3. Promise Memoization

### Cache results

```javascript
function memoize(fn) {
  const cache = new Map();

  return async function memoized(...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = await fn(...args);
    cache.set(key, result);
    return result;
  };
}

// Usage
const fetchUser = memoize(async (id) => {
  return fetch(`/api/users/${id}`).then(r => r.json());
});

fetchUser(1); // actual fetch
fetchUser(1); // từ cache
fetchUser(2); // actual fetch
```

### TTL cache

```javascript
function memoizeWithTTL(fn, ttl = 60000) {
  const cache = new Map();

  return async function memoized(...args) {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value;
    }

    const value = await fn(...args);
    cache.set(key, { value, timestamp: Date.now() });
    return value;
  };
}
```

---

## 4. Promise Utilities

### race with timeout

```javascript
function timeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    )
  ]);
}

// Usage
async function fetchWithTimeout(url) {
  return timeout(fetch(url), 5000);
}
```

### promiseToCallback

```javascript
function promisify(fn) {
  return (...args) =>
    new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
}

// Node.js style callback → Promise
const readFile = promisify(fs.readFile);
const content = await readFile('./file.txt', 'utf8');
```

### callbackToPromise

```javascript
function callbackToPromise(fn, ...args) {
  return new Promise((resolve, reject) => {
    fn(...args, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}
```

---

## 5. Deferred Promise

```javascript
class Deferred {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

// Usage
const deferred = new Deferred();

setTimeout(() => deferred.resolve('done'), 1000);

const result = await deferred.promise;
```

### Deferred với timeout

```javascript
function deferred(timeoutMs) {
  const deferred = {
    promise: null,
    resolve: null,
    reject: null
  };

  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
    setTimeout(() => reject(new Error('Timeout')), timeoutMs);
  });

  return deferred;
}
```

---

## 6. Promise Pool

```javascript
async function promisePool(promises, concurrency = 5) {
  const results = [];
  const executing = new Set();

  for (const promise of promises) {
    const p = Promise.resolve().then(() => promise);
    results.push(p);
    executing.add(p);

    if (executing.size >= concurrency) {
      await Promise.race(executing);
      executing.delete(p);
    }
  }

  return Promise.all(results);
}

// Usage
const urls = Array.from({ length: 100 }, (_, i) => `/api/item/${i}`);

const results = await promisePool(
  urls.map(url => fetch(url).then(r => r.json())),
  10 // max 10 concurrent
);
```

---

## 7. Câu Hỏi Phỏng Vấn

### Câu 1: Cancellation

```javascript
const controller = new AbortController();
const promise = fetch('/api/data', { signal: controller.signal });

controller.abort();

promise.catch(err => {
  console.log(err.name); // AbortError
});
```

---

### Câu 2: Retry

```javascript
// Retry với exponential backoff
async function retry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delay * 2 ** i));
    }
  }
}
```

---

## 8. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  ADVANCED PROMISE PATTERNS                                 │
│                                                         │
│  Cancellation: AbortController                       │
│  Retry: với delay, exponential backoff, jitter     │
│  Memoization: cache với TTL                        │
│  Deferred: resolve/reject từ bên ngoài            │
│  Pool: giới hạn concurrency                       │
│  Utilities: promisify, timeout                     │
└─────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Implement được retry với exponential backoff
- [ ] Dùng được AbortController
- [ ] Implement được memoization với TTL
- [ ] Hiểu promise pool pattern

---

## 🎉 Chương 03 Hoàn Thành!

Tiếp theo: **Chương 04 — Concurrency**

---

*Last updated: 2026-03-31*
