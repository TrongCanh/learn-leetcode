# 🏗️ Builder Pattern

## 🎯 Problem & Motivation

**Bài toán:** Tạo một object có **rất nhiều tham số** — nhiều tham số bắt buộc, nhiều optional. Constructor với 10+ tham số là cơn ác mộng.

```typescript
// ❌ Constructor hell — thứ tự params dễ nhầm, không rõ ý nghĩa
const req = new HttpRequest(
  'POST',              // method
  '/api/users',        // url
  true,               // enableLogging? cái này là cái gì?
  5000,               // timeout
  'application/json', // contentType
  { name: 'John' },   // body
  // ... 10 tham số nữa — ai nhớ hết?
);
```

**Builder giải quyết:** Tạo object bằng **method chaining**, mỗi bước rõ ràng, dễ đọc như câu tiếng Anh.

---

## 💡 Use Cases

1. **HTTP Request / Response** — Tạo HTTP request với headers, query params, body, timeout, auth token...
2. **SQL Query Builder** — Chain các method như `.select().from().where().orderBy()`
3. **Complex Configuration** — Tạo config object cho Docker, CI/CD với nhiều optional fields
4. **Document/Report Builder** — Tạo PDF report với title, sections, footer, styles
5. **Game Character** — Tạo character với class, stats, inventory, abilities — nhiều thuộc tính tùy chọn

---

## ❌ Before (Không dùng Builder)

```typescript
// ❌ Cách 1: Telescoping Constructor
class HttpRequest {
  constructor(
    public method: string,
    public url: string,
    public enableLogging: boolean,
    public timeout: number,
    public headers: Record<string, string>,
    public body: any,
    public retryCount: number,
    public authToken?: string
  ) {}
}

// Gọi:
const req = new HttpRequest(
  'POST', '/api/users', true, 5000,
  { 'Content-Type': 'application/json' },
  { name: 'John' },
  3,
  'Bearer token123' // ⚠️ Quên tham số nào? Thứ tự sai? Debug mệt mỏi
);

// ❌ Cách 2: Too many setters — object inconsistent
const req = new HttpRequest();
req.method = 'POST';  // set từng cái...
req.url = '/api/users';
// ... 15 dòng setters
// ⚠️ Nếu quên set timeout? Request sẽ có timeout = undefined → crash
```

→ **Vấn đề:** Telescoping constructor → thứ tự dễ nhầm. Setters → object có thể ở trạng thái inconsistent (thiếu required fields).

---

## ✅ After (Dùng Builder)

```typescript
// ─────────────────────────────────────────
// Product: Object cần tạo
// ─────────────────────────────────────────
class HttpRequest {
  method!: string;
  url!: string;
  headers!: Record<string, string>;
  body?: any;
  timeout!: number;
  enableLogging!: boolean;
  retryCount!: number;
  authToken?: string;

  constructor() {
    this.headers = {};
    this.timeout = 3000;
    this.enableLogging = false;
    this.retryCount = 0;
  }
}

// ─────────────────────────────────────────
// Builder: Tạo object từng bước
// ─────────────────────────────────────────
class HttpRequestBuilder {
  private request: HttpRequest;

  constructor() {
    this.request = new HttpRequest(); // Bắt đầu với object rỗng
  }

  // Fluent interface — return this để chain
  withMethod(method: string): this {
    this.request.method = method;
    return this;
  }

  withUrl(url: string): this {
    this.request.url = url;
    return this;
  }

  withHeaders(headers: Record<string, string>): this {
    this.request.headers = { ...this.request.headers, ...headers };
    return this;
  }

  withBody(body: any): this {
    this.request.body = body;
    return this;
  }

  withTimeout(timeout: number): this {
    this.request.timeout = timeout;
    return this;
  }

  withLogging(enable: boolean): this {
    this.request.enableLogging = enable;
    return this;
  }

  withRetry(count: number): this {
    this.request.retryCount = count;
    return this;
  }

  withAuth(token: string): this {
    this.request.authToken = token;
    return this;
  }

  // Kết thúc — trả về immutable object
  build(): HttpRequest {
    this.validate();
    return { ...this.request }; // Return copy để tránh mutate
  }

  private validate(): void {
    if (!this.request.method) throw new Error('❌ method is required');
    if (!this.request.url) throw new Error('❌ url is required');
    if (this.request.timeout < 0) throw new Error('❌ timeout must be positive');
  }
}

// ─────────────────────────────────────────
// Client: Đọc như câu tiếng Anh!
// ─────────────────────────────────────────
const request = new HttpRequestBuilder()
  .withMethod('POST')
  .withUrl('/api/users')
  .withHeaders({ 'Content-Type': 'application/json' })
  .withBody({ name: 'John', email: 'john@example.com' })
  .withTimeout(5000)
  .withLogging(true)
  .withRetry(3)
  .withAuth('Bearer token123')
  .build();
```

→ **Cải thiện:** Code đọc như câu văn: "POST request với URL này, headers kia, timeout...". Rõ ràng, không nhầm tham số.

---

## 🏗️ UML Diagram

```
┌────────────────┐         ┌────────────────┐
│     Client     │────────▶│    Builder     │ (interface)
└────────────────┘         ├────────────────┤
                           │ +build()       │
                           │ +withX()       │
                           └───────┬────────┘
                    implements    │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  ConcreteBuilder │    │  ConcreteBuilder │    │  ConcreteBuilder │
│      (A)         │    │      (B)         │    │      (C)         │
├──────────────────┤    ├──────────────────┤    ├──────────────────┤
│ +build() → A     │    │ +build() → B     │    │ +build() → C     │
│ +withX()         │    │ +withX()         │    │ +withX()         │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                        │                        │
         └────────────────────────┴────────────────────────┘
                                  │
                                  ▼
                         ┌────────────────┐
                         │    Product     │
                         │ (Complex Obj)  │
                         └────────────────┘
```

---

## 🔍 Step-by-step Trace

**Scenario:** Tạo HTTP POST request đến `/api/users` với JSON body.

```
Bước 1: new HttpRequestBuilder()
  → Tạo HttpRequest rỗng với defaults:
    { headers: {}, timeout: 3000, retryCount: 0, enableLogging: false }

Bước 2: .withMethod('POST')
  → request.method = 'POST'
  → return this

Bước 3: .withUrl('/api/users')
  → request.url = '/api/users'
  → return this

Bước 4: .withHeaders({ 'Content-Type': 'application/json' })
  → request.headers = { 'Content-Type': 'application/json' }
  → return this

Bước 5: .withBody({ name: 'John' })
  → request.body = { name: 'John' }
  → return this

Bước 6: .build()
  → validate(): kiểm tra method ✓, url ✓
  → return { ...request } ← immutable copy

Final Object:
{
  method: 'POST',
  url: '/api/users',
  headers: { 'Content-Type': 'application/json' },
  body: { name: 'John' },
  timeout: 3000,      ← default
  enableLogging: false, ← default
  retryCount: 0,       ← default
}
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Cách dùng Builder |
|---------------------|-------------------|
| **StringBuilder (Java/C#)** | `.append().append().toString()` |
| **OkHttp (Android/Retrofit)** | `new Request.Builder().url().post().build()` |
| **Lombok `@Builder`** | Annotation tự động sinh Builder |
| **Protocol Buffers** | `Builder pattern` để tạo message với optional fields |
| **Jest `expect()`** | `.toBe().toHaveLength().toContain()` — chain assertions |

---

## 📊 So sánh với Patterns liên quan

| Criteria | **Builder** | Factory Method | Abstract Factory |
|----------|------------|-----------------|------------------|
| Mục đích | Tạo **1 object phức tạp**, step-by-step | Tạo **1 object** theo type | Tạo **họ objects** liên quan |
| Parameters | Nhiều optional fields ✅ | Thường ít params | Nhiều params |
| Readability | ✅ Fluent, rõ ràng | ⚠️ Có thể telescoping | ⚠️ Nhiều factory calls |
| Immutability | ✅ Dễ return immutable object | ❌ Thường mutate | ❌ Thường mutate |
| Validation | ✅ Validate từng bước hoặc cuối | ❌ Không có | ❌ Không có |

---

## 💻 TypeScript Implementation

```typescript
// ─────────────────────────────────────────
// Example: SQL Query Builder
// ─────────────────────────────────────────
class SqlQuery {
  constructor(
    public select: string[] = ['*'],
    public from: string = '',
    public where: string[] = [],
    public orderBy: string = '',
    public limit: number = 0
  ) {}
}

class SqlQueryBuilder {
  private query = new SqlQuery();

  select(...fields: string[]): this {
    this.query.select = fields;
    return this;
  }

  from(table: string): this {
    this.query.from = table;
    return this;
  }

  where(condition: string): this {
    this.query.where.push(condition);
    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.query.orderBy = `${field} ${direction}`;
    return this;
  }

  limit(n: number): this {
    this.query.limit = n;
    return this;
  }

  build(): string {
    if (!this.query.from) throw new Error('❌ FROM clause required');

    let sql = `SELECT ${this.query.select.join(', ')} FROM ${this.query.from}`;

    if (this.query.where.length > 0) {
      sql += ` WHERE ${this.query.where.join(' AND ')}`;
    }

    if (this.query.orderBy) {
      sql += ` ORDER BY ${this.query.orderBy}`;
    }

    if (this.query.limit > 0) {
      sql += ` LIMIT ${this.query.limit}`;
    }

    return sql;
  }
}

// Fluent Usage
const sql = new SqlQueryBuilder()
  .select('id', 'name', 'email')
  .from('users')
  .where('active = true')
  .where('role = "admin"')
  .orderBy('created_at', 'DESC')
  .limit(10)
  .build();

console.log(sql);
// SELECT id, name, email FROM users
// WHERE active = true AND role = "admin"
// ORDER BY created_at DESC LIMIT 10
```

---

## 📝 LeetCode Problems áp dụng

- [String to Integer (atoi)](https://leetcode.com/problems/string-to-integer-atoi/) — có thể dùng builder pattern để build số từng character
- [Validate Stack Sequences](https://leetcode.com/problems/validate-stack-sequences/) — stack operations có thể viết dạng builder/fluent
- Không có bài LeetCode nào yêu cầu Builder đặc biệt, nhưng pattern này xuất hiện trong **OOD interview questions**: thiết kế Markdown Parser, SQL Builder, HTTP Request Builder...

---

## ✅ Pros / ❌ Cons

**Ưu điểm:**
- ✅ **Readable** — code đọc như câu tiếng Anh, không nhầm thứ tự params
- ✅ **Optional parameters** — dễ dàng skip các optional fields
- ✅ **Validation** — có thể validate từng bước hoặc tất cả cuối cùng trong `build()`
- ✅ **Immutable product** — `build()` return copy, prevent accidental mutation
- ✅ **Reusable** — một builder tạo nhiều variants của cùng product

**Nhược điểm:**
- ❌ **Boilerplate** — cần viết nhiều `withX()` methods cho mỗi field
- ❌ **Overkill cho object đơn giản** — đừng dùng builder cho class chỉ có 2-3 fields
- ❌ **Complex setup** — cần thêm Director class nếu có nhiều preset configurations

---

## ⚠️ Khi nào nên / không nên dùng

**Nên dùng khi:**
- ✅ Object có **nhiều tham số** (>4) hoặc **nhiều optional fields**
- ✅ Muốn **tách bước construction** khỏi representation
- ✅ Cần **validation** trước khi object hoàn chỉnh
- ✅ Cần tạo **nhiều variants** của cùng một object
- ✅ Muốn **immutable product** — builder chỉ là temporary, product là immutable

**Không nên dùng khi:**
- ❌ Object chỉ có 2-3 fields bắt buộc — dùng constructor thông thường
- ❌ Object luôn luôn tạo với tất cả fields — không có optional
- ❌ Construction logic **rất đơn giản** — thêm Builder là over-engineer

---

## 🚫 Common Mistakes / Pitfalls

1. **Builder return mutable object thay vì immutable**
   ```typescript
   // ❌ Sai: Client có thể mutate sau khi build
   build(): HttpRequest {
     return this.request; // ❌ Return reference!
   }

   // ✅ Đúng: Return copy
   build(): HttpRequest {
     return { ...this.request }; // ✅ Immutable copy
   }
   ```

2. **Không validate khi build**
   ```typescript
   // ❌ Sai: Object có thể missing required fields
   build(): HttpRequest {
     return this.request; // ❌ Không check!
   }
   // → req.method === undefined → runtime crash

   // ✅ Đúng: Validate trước khi return
   build(): HttpRequest {
     if (!this.request.method) throw new Error('❌ method required');
     if (!this.request.url) throw new Error('❌ url required');
     return { ...this.request };
   }
   ```

3. **Dùng Builder cho object quá đơn giản**
   ```typescript
   // ❌ Thừa: Point chỉ có x, y — không cần Builder
   const point = new PointBuilder().withX(10).withY(20).build();
   // → Quá phức tạp cho 2 params

   // ✅ Đúng:
   const point = new Point(10, 20);
   ```

---

## 🎤 Interview Q&A

**Q: Builder Pattern là gì? Khi nào dùng?**
> A: Builder giúp tạo object phức tạp bằng cách chain các method, mỗi method set một thuộc tính và return `this`. Dùng khi object có nhiều tham số, đặc biệt là optional fields, và muốn code dễ đọc như câu tiếng Anh. Ví dụ: HTTP request, SQL query, PDF document.

**Q: Builder khác gì Factory Method?**
> A: Factory Method tạo object theo **type** (tạo A hay B), Builder tạo object theo **cấu hình** (A với x=1 hay x=2). Factory Method dùng khi không biết type trước; Builder dùng khi biết type nhưng cấu hình phức tạp.

**Q: Immutable Builder là gì?**
> A: Kỹ thuật return **copy** của object từ `build()`, không phải reference. Ngăn client mutate object sau khi build. Trong TypeScript: `return { ...this.request }`. Trong Java: dùng `Collections.unmodifiableMap()`.

**Q: Director trong Builder Pattern là gì?**
> A: Director là optional class định nghĩa **các preset configurations** (cách tạo object phổ biến), giúp client không phải chain từ đầu mỗi lần. Ví dụ: `HttpRequestDirector.createJsonPostRequest(url)` → internally gọi builder với preset values.
