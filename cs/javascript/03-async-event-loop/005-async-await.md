# async/await — Syntax Sugar Trên Promises

## Câu hỏi mở đầu

```javascript
// Promise chain
fetch('/api/user')
  .then(user => fetch(`/api/posts/${user.id}`))
  .then(posts => posts.filter(p => p.published))
  .then(posts => posts.map(p => p.title))
  .then(titles => console.log(titles))
  .catch(err => console.error(err));

// async/await
async function getTitles() {
  try {
    const user = await fetch('/api/user');
    const posts = await fetch(`/api/posts/${user.id}`);
    return posts.filter(p => p.published).map(p => p.title);
  } catch (err) {
    console.error(err);
  }
}
```

Cả hai hoạt động **giống hệt nhau**. `async/await` chỉ là syntax sugar.

---

## 1. async Function

### Định nghĩa

```javascript
// async function LUÔN trả về Promise
async function getData() {
  return 42;
}

getData() instanceof Promise; // true
getData().then(console.log); // 42
```

### return value

```javascript
async function example() {
  return 1; // → Promise.resolve(1)
}

async function exampleThrow() {
  throw new Error('oops'); // → Promise.reject(new Error('oops'))
}
```

---

## 2. await — Đợi Promise Settle

### Basic

```javascript
async function demo() {
  const result = await Promise.resolve(42);
  console.log(result); // 42
}
```

### Await expression

```javascript
async function demo() {
  const a = await 1; // await Promise.resolve(1)
  const b = await 2; // await Promise.resolve(2)
  return a + b;
}
```

### await non-Promise

```javascript
async function demo() {
  const result = await 42; // tự động wrap thành Promise.resolve(42)
  console.log(result); // 42
}
```

---

## 3. Error Handling

### try/catch

```javascript
async function fetchUser(id) {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error('User not found');
    return await response.json();
  } catch (error) {
    console.error('Failed:', error.message);
    return null;
  }
}
```

### Catch re-throws

```javascript
async function demo() {
  try {
    await Promise.reject(new Error('oops'));
  } catch (err) {
    console.log('caught:', err.message);
    // Nếu không throw → function tiếp tục bình thường
  }
  console.log('continues'); // chạy được
}
```

### finally

```javascript
async function withFinally() {
  try {
    await doSomething();
  } catch (err) {
    console.error(err);
  } finally {
    cleanup(); // luôn chạy
  }
}
```

---

## 4. async/await vs Promise Chain

### Tương đương

```javascript
// Promise chain
function getUser(id) {
  return fetch(`/api/users/${id}`)
    .then(r => r.json())
    .then(user => user.name);
}

// async/await
async function getUser(id) {
  const response = await fetch(`/api/users/${id}`);
  const user = await response.json();
  return user.name;
}
```

### async/await không phải blocking

```javascript
// ❌ SAI: await trong vòng lặp = sequential
async function processAllBad(items) {
  for (const item of items) {
    const result = await process(item); // chờ từng cái
  }
}

// ✅ ĐÚNG: Promise.all = parallel
async function processAllGood(items) {
  return await Promise.all(items.map(item => process(item)));
}
```

---

## 5. Thứ Tự Execution

### await và microtask

```javascript
async function demo() {
  console.log('1');

  await Promise.resolve();
  console.log('2');

  await new Promise(r => setTimeout(r, 0));
  console.log('3');
}

console.log('A');
demo();
console.log('B');
```

```
Output:
A
1
B
2
3

Phân tích:
  1. console.log('A') → sync
  2. demo() → tạo async execution
  3. console.log('1') → sync trong demo()
  4. await Promise.resolve() → đẩy rest vào microtask
  5. console.log('B') → sync → stack rỗng
  6. microtask → console.log('2')
  7. await setTimeout → đẩy vào macrotask
  8. macrotask → console.log('3')
```

---

## 6. async/await Patterns

### Sequential vs Parallel

```javascript
// ❌ Sequential (chậm)
async function getData() {
  const user = await fetchUser();
  const posts = await fetchPosts(); // đợi user xong mới bắt đầu posts
  return { user, posts };
}

// ✅ Parallel (nhanh)
async function getData() {
  const [user, posts] = await Promise.all([fetchUser(), fetchPosts()]);
  return { user, posts };
}
```

### Sequential khi cần

```javascript
// Cần kết quả trước mới fetch tiếp
async function processFile(file) {
  const metadata = await validateFile(file);
  if (!metadata.valid) throw new Error('Invalid');
  const content = await readFile(file.path);
  return process(content);
}
```

### Error với nhiều awaits

```javascript
// ❌ Một catch cho nhiều awaits
async function demo() {
  try {
    const a = await fetchA(); // fail → catch
    const b = await fetchB(); // không chạy
    const c = await fetchC(); // không chạy
  } catch (err) {
    // Không biết a, b, hay c fail
  }
}

// ✅ Sequential với error handling tốt hơn
async function demo() {
  let a;
  try {
    a = await fetchA();
  } catch (err) {
    console.error('fetchA failed');
    throw err;
  }

  const b = await fetchB(a); // dùng a
  const c = await fetchC(b); // dùng b
}
```

---

## 7. Các Traps

### Trap 1: forEach không đợi

```javascript
// ❌
async function processItems(items) {
  items.forEach(async item => {
    await processItem(item);
  });
  console.log('done'); // chạy NGAY, không đợi
}

// ✅
async function processItems(items) {
  await Promise.all(items.map(item => processItem(item)));
  console.log('done'); // đợi hết
}

// ✅ Sequential
async function processItems(items) {
  for (const item of items) {
    await processItem(item);
  }
  console.log('done');
}
```

### Trap 2: await không có async

```javascript
// ❌ SyntaxError
function demo() {
  await sleep(1000); // await chỉ dùng được trong async function
}

// ✅
async function demo() {
  await sleep(1000);
}
```

### Trap 3: Await không block thread

```javascript
// ❌ Tưởng blocking nhưng không
async function heavyTask() {
  // ĐÂY KHÔNG BLOCK UI
  const result = await computeHeavyThing();
  // Nhưng nếu synchronous part quá lâu → block
  const syncResult = heavyComputation(); // BLOCK nếu quá lâu
  return syncResult;
}
```

### Trap 4: Loop với await cuối

```javascript
// ❌ Sai: biến bị ghi đè
async function getItemsBad(ids) {
  const results = [];
  for (const id of ids) {
    results.push(await fetchItem(id));
  }
  return results;
}

// ✅ Đúng: tất cả promises tạo trước
async function getItems(ids) {
  return Promise.all(ids.map(id => fetchItem(id)));
}
```

---

## 8. Câu Hỏi Phỏng Vấn

### Câu 1: Output

```javascript
async function demo() {
  console.log('1');
  await Promise.resolve();
  console.log('2');
  return 'done';
}

console.log('A');
demo().then(console.log);
console.log('B');
```

**Trả lời:** `A, 1, B, 2, done`

---

### Câu 2: async function luôn trả Promise

```javascript
async function test() {
  return 42;
}

console.log(test() instanceof Promise); // ?
```

**Trả lời:** `true`

---

### Câu 3: Error propagation

```javascript
async function test() {
  try {
    await Promise.reject(new Error('oops'));
  } catch (err) {
    return 'caught';
  }
}

test().then(console.log);
```

**Trả lời:** `'caught'`

---

### Câu 4: Sequential vs parallel

```javascript
async function demo() {
  const start = Date.now();
  const [a, b] = await Promise.all([
    new Promise(r => setTimeout(() => r(1), 100)),
    new Promise(r => setTimeout(() => r(2), 100))
  ]);
  console.log(Date.now() - start); // ?
}
```

**Trả lời:** ~100ms (parallel)

---

### Câu 5: forEach không đợi

```javascript
async function test() {
  [1, 2, 3].forEach(async x => {
    await new Promise(r => setTimeout(r, 10));
    console.log(x);
  });
  console.log('done');
}

test();
```

**Trả lời:** `done, 1, 2, 3` — 'done' in trước vì forEach không đợi async callbacks.

---

## 9. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  ASYNC/AWAIT = SYNTAX SUGAR TRÊN PROMISES               │
│                                                         │
│  async function → luôn trả Promise                    │
│  await → đợi Promise settle                          │
│  await non-Promise → tự wrap thành Promise.resolve()  │
│                                                         │
│  RULES:                                                 │
│    ✓ await chỉ dùng trong async function             │
│    ✓ await không block thread                         │
│    ✓ forEach/for-of khác nhau với async              │
│    ✓ Dùng Promise.all() cho parallel                │
│                                                         │
│  ⚠️ forEach không đợi async callbacks             │
│  ⚠️ Sequential await trong loop → SLOW           │
└─────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Hiểu async function luôn trả Promise
- [ ] Phân biệt được sequential vs parallel await
- [ ] Tránh được trap: forEach không đợi
- [ ] Trả lời được các câu hỏi phỏng vấn

---

*Last updated: 2026-03-31*
