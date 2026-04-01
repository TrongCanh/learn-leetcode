# Promise — Cách JavaScript Xử Lý Bất Đồng Bộ

## Câu hỏi mở đầu

```javascript
const promise = new Promise((resolve, reject) => {
  setTimeout(() => resolve('done'), 1000);
});

promise.then(result => console.log(result));
console.log('after promise');
```

Output:
```
after promise
done
```

**Tại sao 'after promise' in ra TRƯỚC 'done'?**

Vì `promise.then()` là **async** — callback được đẩy vào **microtask queue**, không phải call stack. Code synchronous chạy xong trước.

---

## 1. Promise States

### Ba trạng thái

```
Promise có 3 states:
  ┌─────────────────────────────────────┐
  │  1. PENDING (initial)               │
  │       ↕ resolve(value)              │
  │  2. FULFILLED (resolved)            │
  │       ↕ reject(error)                │
  │  3. REJECTED (rejected)             │
  └─────────────────────────────────────┘

  ✓ PENDING → FULFILLED (vĩnh viễn)
  ✓ PENDING → REJECTED (vĩnh viễn)
  ✓ Một Promise đã settled (fulfilled/rejected) → KHÔNG đổi
```

### Minh họa

```javascript
const promise = new Promise((resolve, reject) => {
  // PENDING
  setTimeout(() => {
    if (Math.random() > 0.5) {
      resolve('Success!'); // → FULFILLED
    } else {
      reject(new Error('Failed!')); // → REJECTED
    }
  }, 100);
});

promise
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

---

## 2. Promise Chaining

### .then() trả về Promise

```javascript
Promise.resolve(2)
  .then(x => x * 2)       // nhận 2, trả 4
  .then(x => x + 1)       // nhận 4, trả 5
  .then(x => {
    console.log(x);        // 5
  })
  .catch(err => console.error(err));
```

### Return undefined → chained Promise nhận undefined

```javascript
Promise.resolve(1)
  .then(x => {
    // không return
    x * 2;
  })
  .then(x => {
    console.log(x); // undefined — vì then() nhận undefined
  });
```

### Return Promise → awaited

```javascript
Promise.resolve(1)
  .then(async x => {
    const result = await fetchData(x); // await Promise
    return result;
  })
  .then(x => console.log(x));
```

---

## 3. Promise Static Methods

### Promise.resolve() / Promise.reject()

```javascript
// Trả về Promise đã resolved
const p1 = Promise.resolve(42);
p1.then(x => console.log(x)); // 42

// Promise từ giá trị
const p2 = Promise.resolve(Promise.resolve(3));
p2.then(x => x).then(console.log); // 3

// Trả về Promise đã rejected
const p3 = Promise.reject(new Error('oops'));
p3.catch(e => console.error(e.message)); // 'oops'
```

### Promise.all()

```javascript
// Chờ TẤT CẢ promises — tất cả resolved → resolved
// Một bị rejected → rejected ngay

const [a, b, c] = await Promise.all([
  fetch('/api/users'),
  fetch('/api/posts'),
  fetch('/api/comments')
]);
```

```javascript
Promise.all([
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3)
]).then(([a, b, c]) => console.log(a, b, c)); // 1 2 3

// Một rejected
Promise.all([
  Promise.resolve(1),
  Promise.reject(new Error('failed')),
  Promise.resolve(3)
]).catch(e => console.error(e.message)); // 'failed'
```

### Promise.race()

```javascript
// Ai về trước → kết quả đó
// Nếu về trước là rejected → rejected

const p = Promise.race([
  fetch('https://slow-api.com'),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 3000)
  )
]);
```

### Promise.allSettled() (ES2020)

```javascript
// Chờ TẤT CẢ settled — không fail nhanh
// Luôn resolved, mỗi result có status: 'fulfilled' | 'rejected'

Promise.allSettled([
  Promise.resolve(1),
  Promise.reject(new Error('failed')),
  Promise.resolve(3)
]).then(results => {
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      console.log(result.value);
    } else {
      console.error(result.reason);
    }
  });
});
```

### Promise.any() (ES2021)

```javascript
// Chờ promise ĐẦU TIÊN resolved
// Bỏ qua rejected — chỉ fail khi TẤT CẢ rejected

Promise.any([
  fetch('https://fast-cdn.com/data'),
  fetch('https://slow-cdn.com/data')
]).then(result => console.log(result));
```

---

## 4. Error Handling

### .catch()

```javascript
Promise.resolve(1)
  .then(x => x * 2)
  .then(x => {
    if (x > 5) throw new Error('Too large');
    return x;
  })
  .catch(err => {
    console.error(err.message); // 'Too large'
    return -1; // return để chain tiếp
  })
  .then(x => console.log(x)); // -1
```

### .finally()

```javascript
// Chạy sau cùng — dù fulfilled hay rejected
fetch('/api/data')
  .then(data => console.log(data))
  .catch(err => console.error(err))
  .finally(() => {
    hideSpinner(); // luôn chạy
  });
```

### Global unhandled rejection

```javascript
// Node.js
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

// Browser
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled:', event.reason);
});
```

---

## 5. Promise Constructor

### Basic

```javascript
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    // Async work
    if (!id) {
      reject(new Error('ID required'));
      return;
    }

    db.query(`SELECT * FROM users WHERE id = $1`, [id], (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result.rows[0]);
    });
  });
}

fetchUser(1)
  .then(user => console.log(user))
  .catch(err => console.error(err));
```

### Executor chạy đồng bộ?

```javascript
const p = new Promise((resolve, reject) => {
  console.log('A'); // 1. sync
  resolve('B');
  console.log('C'); // 2. sync
});

console.log('D'); // 3. sync
p.then(x => console.log(x)); // 4. async

console.log('E'); // 5. sync

// Output: A, C, D, E, B
```

---

## 6. Các Traps

### Trap 1: Quên return trong .then()

```javascript
// ❌ Bug
Promise.resolve(1)
  .then(x => {
    fetch(`/api/${x}`); // quên return
  })
  .then(response => {
    console.log(response); // undefined — không có gì return
  });

// ✅ Fix
Promise.resolve(1)
  .then(x => fetch(`/api/${x}`))
  .then(response => console.log(response));
```

### Trap 2: Async error trong Promise

```javascript
// ❌ Promise không catch async error nếu không await
new Promise((resolve, reject) => {
  setTimeout(() => {
    throw new Error('async error'); // không được catch!
  }, 0);
}).catch(e => console.error(e)); // KHÔNG catch được!
```

```javascript
// ✅ Dùng async/await
async function demo() {
  try {
    await new Promise((_, reject) => {
      setTimeout(() => reject(new Error('async error')), 0);
    });
  } catch (e) {
    console.error(e.message); // 'async error' ✅
  }
}
```

### Trap 3: Promise.all fail fast

```javascript
// ❌ Nếu 1 fail, others bị cancel
const [user, posts] = await Promise.all([
  fetchUser(id),
  fetchPosts(id) // nếu fail → user bị cancel
]);

// ✅ Dùng allSettled
const results = await Promise.allSettled([fetchUser(id), fetchPosts(id)]);
const user = results[0].status === 'fulfilled' ? results[0].value : null;
const posts = results[1].status === 'fulfilled' ? results[1].value : [];
```

---

## 7. Câu Hỏi Phỏng Vấn

### Câu 1: Đoán thứ tự

```javascript
Promise.resolve(1)
  .then(x => x + 1)
  .then(x => {
    console.log(x);
    return Promise.resolve(x + 1);
  })
  .then(console.log);
```

**Trả lời:** `2, 3`

---

### Câu 2: Error propagation

```javascript
Promise.resolve(1)
  .then(x => { throw new Error('oops'); })
  .then(x => console.log('this'))
  .catch(e => console.log('caught:', e.message))
  .then(x => console.log('continues'));
```

**Trả lời:** `'caught: oops', 'continues'` — catch return → chain tiếp tục

---

### Câu 3: Promise.all vs race

```javascript
const p1 = new Promise(r => setTimeout(() => r(1), 100));
const p2 = new Promise(r => setTimeout(() => r(2), 50));

Promise.all([p1, p2]).then(console.log); // sau 100ms → [1, 2]
Promise.race([p1, p2]).then(console.log); // sau 50ms → 2
```

---

### Câu 4: Return undefined

```javascript
Promise.resolve(5)
  .then(x => {
    x * 2; // không return
  })
  .then(console.log); // ?
```

**Trả lời:** `undefined`

---

### Câu 5: Settled state

```javascript
const p = new Promise(r => r(1));
p.then(console.log);
p.then(console.log);
```

**Trả lời:** `1, 1` — settled Promise gọi .then() ngay

---

## 8. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  PROMISE                                                   │
│                                                         │
│  States: PENDING → FULFILLED / REJECTED (vĩnh viễn)    │
│                                                         │
│  Static methods:                                         │
│    Promise.resolve/reject                               │
│    Promise.all — tất cả resolved                       │
│    Promise.allSettled — tất cả settled              │
│    Promise.race — về trước nhất                      │
│    Promise.any — resolved đầu tiên                     │
│                                                         │
│  ⚠️ .then() luôn trả Promise mới                   │
│  ⚠️ Quên return → undefined trong chain               │
│  ⚠️ Promise.all fail fast — dùng allSettled nếu cần  │
└─────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Hiểu 3 states của Promise
- [ ] Dùng được Promise chaining
- [ ] Phân biệt được Promise.all, race, allSettled, any
- [ ] Trả lời được các câu hỏi phỏng vấn

---

*Last updated: 2026-03-31*
