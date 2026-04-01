# Error Handling — Bắt Và Xử Lý Lỗi Đúng Cách

## Câu hỏi mở đầu

```javascript
async function fetchData() {
  const response = await fetch('/api/data');
  const data = await response.json();
  return data;
}

fetchData()
  .then(data => console.log(data))
  .catch(err => console.error('Error:', err));
```

**Nếu `/api/data` trả về 404, error sẽ được catch ở đâu?**

Vấn đề: `fetch()` chỉ reject khi network error. HTTP 404 không reject — phải check `response.ok`.

---

## 1. Error Types

### Built-in Error types

```javascript
new Error('message');          // Generic
new TypeError('expected function'); // Type mismatch
new ReferenceError('not defined'); // Reference error
new SyntaxError('invalid syntax');  // Parse error
new RangeError('out of range');    // Value out of range
new URIError('invalid URI');       // URI function error
new AggregateError([...errors]);   // Multiple errors (ES2022)
```

### Custom errors

```javascript
class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

throw new ValidationError('email', 'Invalid email format');
```

---

## 2. Synchronous Error Handling

### try/catch

```javascript
try {
  const result = riskyOperation();
  console.log(result);
} catch (error) {
  console.error('Error occurred:', error.message);
} finally {
  cleanup(); // luôn chạy
}
```

### Error propagation

```javascript
function a() { throw new Error('from a'); }
function b() { a(); }
function c() { b(); }

try {
  c();
} catch (err) {
  console.error(err.stack); // Stack trace: a → b → c
}
```

---

## 3. Async Error Handling

### Promise rejection

```javascript
// ❌ Bad: error mất trong không gian
new Promise((_, reject) => {
  reject(new Error('oops'));
});

// ✅ Good: luôn handle
new Promise((resolve, reject) => {
  reject(new Error('oops'));
}).catch(err => console.error(err));
```

### async/await

```javascript
async function fetchUser(id) {
  try {
    const response = await fetch(`/api/users/${id}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    if (err instanceof TypeError) {
      console.error('Network error:', err);
    } else {
      console.error('Application error:', err);
    }
    throw err; // re-throw
  }
}
```

### Error trong Promise chain

```javascript
async function demo() {
  try {
    await Promise.reject(new Error('oops'))
      .catch(err => {
        console.log('caught:', err.message);
        return 'recovered'; // recover
      });
    console.log('continues'); // chạy được
  } catch (err) {
    console.error('outer catch:', err);
  }
}
```

---

## 4. Error Handling Patterns

### Pattern 1: Result Object

```javascript
// Không dùng try/catch — trả về result object
async function fetchUser(id) {
  try {
    const user = await db.getUser(id);
    return { success: true, data: user };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

const result = await fetchUser(1);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

### Pattern 2: Either monad

```javascript
class Either {
  constructor(value, isLeft = false) {
    this.value = value;
    this.isLeft = isLeft; // true = Error
  }

  static left(err) { return new Either(err, true); }
  static right(val) { return new Either(val, false); }

  map(fn) {
    return this.isLeft ? this : Either.right(fn(this.value));
  }

  flatMap(fn) {
    return this.isLeft ? this : fn(this.value);
  }
}

async function safeFetch(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Either.right(await res.json());
  } catch (err) {
    return Either.left(err);
  }
}
```

### Pattern 3: Global error handler

```javascript
// Browser
window.addEventListener('error', event => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled rejection:', event.reason);
});

// Node.js
process.on('uncaughtException', (err, origin) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection:', reason);
});
```

---

## 5. Retry Logic

### Simple retry

```javascript
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
}
```

### Exponential backoff

```javascript
async function fetchWithBackoff(url, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url).then(r => r.json());
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await sleep(Math.min(1000 * 2 ** i, 30000));
    }
  }
}
```

---

## 6. Các Traps

### Trap 1: swallowing errors

```javascript
// ❌ Error bị nuốt
async function bad() {
  try {
    await riskyOperation();
  } catch (err) {
    // làm gì đó nhưng không throw
  }
}

// ✅ Always log hoặc throw
async function good() {
  try {
    await riskyOperation();
  } catch (err) {
    console.error('Operation failed:', err);
    throw err; // hoặc return default value
  }
}
```

### Trap 2: Error trong setTimeout/setInterval

```javascript
// ❌ Unhandled rejection
setTimeout(() => {
  Promise.reject(new Error('async error'));
}, 0);

// ✅ Wrap
setTimeout(() => {
  Promise.reject(new Error('async error'))
    .catch(err => console.error(err));
}, 0);
```

### Trap 3: async/await và finally

```javascript
async function demo() {
  try {
    await fetchData();
  } finally {
    cleanup(); // cleanup chạy, nhưng error vẫn propagate
  }
}
```

---

## 7. Câu Hỏi Phỏng Vấn

### Câu 1: Error propagation

```javascript
async function a() { throw new Error('A'); }
async function b() { await a(); }

async function c() {
  try {
    await b();
  } catch (err) {
    console.log(err.message); // ?
  }
}
c();
```

**Trả lời:** `'A'` — error propagate qua chain

---

### Câu 2: finally và return

```javascript
function demo() {
  try {
    return 1;
  } finally {
    console.log('finally');
  }
}

console.log(demo());
```

**Trả lời:** `'finally', 1`

---

### Câu 3: AggregateError

```javascript
const err = new AggregateError([
  new Error('error 1'),
  new Error('error 2')
], 'Multiple errors');

console.log(err.errors); // [Error, Error]
console.log(err.message); // 'Multiple errors'
```

---

## 8. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  ERROR HANDLING                                           │
│                                                         │
│  Sync: try/catch/finally                               │
│  Async: .catch() hoặc try/catch với await           │
│                                                         │
│  Patterns:                                             │
│    • Result object → không dùng try/catch           │
│    • Either monad → functional error handling         │
│    • Retry logic → với exponential backoff            │
│                                                         │
│  ⚠️ Error trong setTimeout không tự catch         │
│  ⚠️ Luôn log hoặc throw, không swallow errors       │
└─────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Xử lý error trong cả sync và async code
- [ ] Implement được retry logic
- [ ] Tránh được trap: swallowing errors
- [ ] Hiểu AggregateError

---

*Last updated: 2026-03-31*
