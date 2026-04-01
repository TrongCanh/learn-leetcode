# Parallel Patterns — Chạy Nhiều Promises Cùng Lúc

## Câu hỏi mở đầu

```javascript
// Bạn cần fetch 3 APIs — users, posts, comments
// Mỗi API mất 500ms

// ❌ Sequential: 1.5s
async function bad() {
  const users = await fetchUsers();    // 500ms
  const posts = await fetchPosts();    // 500ms
  const comments = await fetchComments(); // 500ms
}

// ✅ Parallel: ~500ms
async function good() {
  const [users, posts, comments] = await Promise.all([
    fetchUsers(),
    fetchPosts(),
    fetchComments()
  ]);
}
```

**Sequential: 1500ms. Parallel: 500ms.** Khi nào dùng cái nào?

---

## 1. Promise.all — Chờ Tất Cả

### Basic

```javascript
const [users, posts, settings] = await Promise.all([
  fetch('/api/users').then(r => r.json()),
  fetch('/api/posts').then(r => r.json()),
  fetch('/api/settings').then(r => r.json())
]);
```

### Error handling

```javascript
// ❌ Một fail → toàn bộ fail
try {
  const results = await Promise.all([
    fetch('/api/data1'),
    fetch('/api/data2'),
    fetch('/api/data3')
  ]);
} catch (err) {
  console.error(err); // chỉ biết có lỗi, không biết cái nào
}

// ✅ Xử lý error
const results = await Promise.allSettled([
  fetch('/api/data1'),
  fetch('/api/data2'),
  fetch('/api/data3')
]);

results.forEach((result, i) => {
  if (result.status === 'fulfilled') {
    console.log(`API ${i}:`, result.value);
  } else {
    console.error(`API ${i} failed:`, result.reason);
  }
});
```

---

## 2. Promise.allSettled — Luôn Hoàn Thành

### Khi nào dùng

```javascript
// Load nhiều widgets — một widget fail không ảnh hưởng widgets khác
async function loadDashboard() {
  const results = await Promise.allSettled([
    loadUserProfile(),
    loadNotifications(),
    loadRecommendations(),
    loadSidebar()
  ]);

  return results.map((result, i) => {
    if (result.status === 'fulfilled') return result.value;
    return null; // widget fail → trả null
  });
}
```

### Results structure

```javascript
const results = await Promise.allSettled([
  Promise.resolve(1),
  Promise.reject(new Error('failed')),
  Promise.resolve(3)
]);

// [
//   { status: 'fulfilled', value: 1 },
//   { status: 'rejected', reason: Error('failed') },
//   { status: 'fulfilled', value: 3 }
// ]
```

---

## 3. Promise.race — Ai Về Trước

### Timeout pattern

```javascript
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms)
  );
  return Promise.race([promise, timeout]);
}

async function fetchWithTimeout(url) {
  return withTimeout(fetch(url), 5000);
}
```

### Fallback

```javascript
async function getData(urls) {
  return Promise.race(
    urls.map(url => fetch(url))
  );
}
```

---

## 4. Promise.any — Lấy Cái Nhanh Nhất

### Khi nào dùng

```javascript
// Thử nhiều CDNs, dùng cái nào phản hồi trước
async function loadFromFastestCDN() {
  const cdnUrls = [
    'https://cdn1.example.com/resource',
    'https://cdn2.example.com/resource',
    'https://cdn3.example.com/resource'
  ];

  return Promise.any(
    cdnUrls.map(url => fetch(url).then(r => r.json()))
  );
}
```

### Error handling

```javascript
// Promise.any fail khi TẤT CẢ fail
// → AggregateError
```

---

## 5. Sequential Processing

### Khi nào cần sequential

```javascript
// Cần kết quả trước mới fetch tiếp
async function processUserWorkflow(userId) {
  const user = await fetchUser(userId);
  const profile = await fetchProfile(user.profileId);  // cần user
  const posts = await fetchPosts(user.postIds);         // cần user
  return { user, profile, posts };
}

// Không dùng Promise.all vì các request PHỤ THUỘC nhau
```

---

## 6. Batching

### Batch requests

```javascript
// ❌ 100 requests riêng lẻ
async function fetchUsersBad(ids) {
  return Promise.all(ids.map(id => fetchUser(id)));
}

// ✅ Batch thành 1 request
async function fetchUsers(ids) {
  const response = await fetch('/api/users/batch', {
    method: 'POST',
    body: JSON.stringify({ ids })
  });
  return response.json();
}
```

### Promise pooling

```javascript
// Giới hạn concurrency — chỉ 5 request cùng lúc
async function promisePool(tasks, limit = 5) {
  const results = [];
  const executing = [];

  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    results.push(p);

    if (tasks.indexOf(task) >= limit - 1) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}
```

---

## 7. Câu Hỏi Phỏng Vấn

### Câu 1: Fail fast

```javascript
const p1 = new Promise(r => setTimeout(() => r(1), 100));
const p2 = new Promise((_, r) => setTimeout(() => r(new Error('fail')), 50));

Promise.all([p1, p2])
  .then(console.log)
  .catch(err => console.error(err.message));
```

**Trả lời:** `'fail'` — p2 fail trước → Promise.all reject ngay

---

### Câu 2: allSettled luôn resolve

```javascript
const results = await Promise.allSettled([
  Promise.reject(new Error('fail')),
  Promise.resolve(42)
]);

console.log(results[0].status); // 'rejected'
console.log(results[1].status); // 'fulfilled'
```

---

### Câu 3: Race timeout

```javascript
function withTimeout(p, ms) {
  return Promise.race([
    p,
    new Promise((_, r) => setTimeout(() => r('timeout'), ms))
  ]);
}

withTimeout(
  new Promise(r => setTimeout(() => r('done'), 2000)),
  1000
).then(console.log);
```

**Trả lời:** `'timeout'` — timeout resolve trước

---

## 8. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  PARALLEL PATTERNS                                        │
│                                                         │
│  Promise.all — tất cả resolved, fail fast             │
│  Promise.allSettled — tất cả settled, không fail    │
│  Promise.race — về trước nhất                      │
│  Promise.any — resolved đầu tiên (ignore reject)    │
│                                                         │
│  Sequential — khi requests phụ thuộc nhau           │
│  Batching — gộp nhiều requests thành 1               │
│  Pooling — giới hạn concurrency                      │
└─────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Chọn đúng pattern: all, allSettled, race, any
- [ ] Implement được timeout với race
- [ ] Hiểu khi nào cần sequential vs parallel

---

*Last updated: 2026-03-31*
