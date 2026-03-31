# 🏗️ Builder Pattern

## 🎯 Problem & Motivation

**Bài toán thực tế:** Tạo một object có **nhiều tham số** — mandatory, optional, có thể có validation. Constructor với 10+ tham số là cơn ác mộng.

**Ba cách tồi:**

```typescript
// ❌ Cách 1: Telescoping Constructor — thứ tự dễ nhầm
const req = new HttpRequest(
  'POST',              // method
  '/api/users',        // url
  true,               // enableLogging? cái này là cái gì?
  5000,               // timeout
  { 'Content-Type': 'application/json' }, // headers
  { name: 'John' },   // body
);
// ⚠️ Quên tham số? Thứ tự sai? Ai biết được!

// ❌ Cách 2: Too many setters — object inconsistent
const req = new HttpRequest();
req.method = 'POST';
req.url = '/api/users';
// ... 15 dòng setters
// ⚠️ Nếu quên set timeout? Request có timeout = undefined → crash

// ❌ Cách 3: Config object — không validation, không type safety
const req = {
  method: 'POST',
  url: '/api/users',
  enableLogging: true,
  timeout: 5000,
};
// ⚠️ TypeScript không kiểm tra bắt buộc fields
```

**Builder giải quyết:** Tạo object bằng **method chaining**, mỗi bước rõ ràng, có validation, và cuối cùng `build()` trả về immutable object.

---

## 💡 Use Cases

1. **HTTP Request Builder** — Tạo HTTP request với headers, query params, body, timeout, auth, retry... tùy ý
2. **SQL Query Builder** — Chain method như `.select().from().where().orderBy().limit()` → chuỗi SQL
3. **Test Data Builder** — Tạo test fixtures với default values và override tùy ý
4. **Document/Report Builder** — Tạo PDF report với title, sections, footer, styles, metadata
5. **Complex Configuration** — Tạo Docker/Kubernetes config với nhiều optional fields
6. **Game Character Builder** — Tạo character với class, stats, inventory, abilities — mỗi thứ tùy chọn

---

## ❌ Before (Không dùng Builder)

```typescript
// ❌ Telescoping constructor — tối hảo là không
class HttpRequest {
  constructor(
    public method: string,
    public url: string,
    public enableLogging: boolean,
    public timeout: number,
    public headers: Record<string, string>,
    public body: any,
    public retryCount: number,
    public authToken?: string,
    public cacheEnabled?: boolean
  ) {}
}

// Gọi:
const req = new HttpRequest(
  'POST',
  '/api/users',
  true,    // ⚠️ Cái này là enableLogging? Hay timeout? Ai nhớ?
  5000,    // ⚠️ Ai biết thứ tự này đúng không?
  { 'Content-Type': 'application/json' },
  { name: 'John' },
  3
);
// → Có 2 tham số cuối (authToken, cacheEnabled) bị undefined
```

→ **Hậu quả:** Thứ tự params dễ nhầm, không biết optional fields nào đã set, runtime crash vì undefined.

---

## ✅ After (Dùng Builder)

```typescript
// ─────────────────────────────────────────
// Product: Immutable HTTP Request
// ─────────────────────────────────────────
interface HttpRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly body?: unknown;
  readonly timeout: number;
  readonly enableLogging: boolean;
  readonly retryCount: number;
  readonly authToken?: string;
}

class HttpRequestBuilder {
  private request = {
    method: 'GET' as string,
    url: '' as string,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    timeout: 3000 as number,
    enableLogging: false as boolean,
    retryCount: 0 as number,
    authToken: undefined as string | undefined,
  };

  method(value: string): this {
    this.request.method = value;
    return this;
  }

  url(value: string): this {
    this.request.url = value;
    return this;
  }

  header(key: string, value: string): this {
    this.request.headers[key] = value;
    return this;
  }

  headers(headers: Record<string, string>): this {
    this.request.headers = { ...this.request.headers, ...headers };
    return this;
  }

  body(data: unknown): this {
    this.request.body = data;
    return this;
  }

  timeout(ms: number): this {
    this.request.timeout = ms;
    return this;
  }

  logging(enable: boolean): this {
    this.request.enableLogging = enable;
    return this;
  }

  retry(count: number): this {
    this.request.retryCount = count;
    return this;
  }

  auth(token: string): this {
    this.request.authToken = token;
    return this;
  }

  build(): HttpRequest {
    this.validate();
    return Object.freeze({ ...this.request });
  }

  private validate(): void {
    if (!this.request.url) {
      throw new Error('❌ URL is required');
    }
    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(this.request.method)) {
      throw new Error(`❌ Invalid method: ${this.request.method}`);
    }
    if (this.request.timeout < 0) {
      throw new Error('❌ Timeout must be non-negative');
    }
  }
}

// Client: Đọc như câu tiếng Anh!
const request = new HttpRequestBuilder()
  .method('POST')
  .url('/api/users')
  .header('Content-Type', 'application/json')
  .header('Authorization', 'Bearer token123')
  .body({ name: 'John', email: 'john@example.com' })
  .timeout(5000)
  .logging(true)
  .retry(3)
  .build();
```

---

## 🏗️ UML Diagram

```
┌────────────────┐         ┌────────────────┐
│     Client     │────────▶│    Builder     │ (interface)
└────────────────┘         ├────────────────┤
                           │ +build()       │
                           │ +withX(): this │
                           │ +withY(): this │
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
                         │ (Immutable)    │
                         └────────────────┘
```

---

## 🔍 Step-by-step Trace

**Scenario:** Tạo POST request đến `/api/users`.

```
Builder state (ban đầu):
{
  method: 'GET',
  url: '',
  headers: {},
  body: undefined,
  timeout: 3000,
  logging: false,
  retry: 0,
  authToken: undefined
}

Bước 1: .method('POST')
  → request.method = 'POST' → return this

Bước 2: .url('/api/users')
  → request.url = '/api/users' → return this

Bước 3: .header('Content-Type', 'application/json')
  → request.headers['Content-Type'] = 'application/json' → return this

Bước 4: .body({ name: 'John' })
  → request.body = { name: 'John' } → return this

Bước 5: .timeout(5000)
  → request.timeout = 5000 → return this

Bước 6: .build()
  → validate(): URL ✓, Method ✓, Timeout ✓
  → return Object.freeze({ ...request })
    → Immutable! Không thể mutate sau build()

Final Immutable Object:
{
  method: 'POST',
  url: '/api/users',
  headers: { 'Content-Type': 'application/json' },
  body: { name: 'John' },
  timeout: 5000,
  ...
}
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Chi tiết implementation |
|---------------------|------------------------|
| **OkHttp (Java/Android)** | `new Request.Builder().url().post().build()` |
| **Lombok `@Builder`** | Annotation tự động sinh Builder class |
| **Protocol Buffers** | Builder pattern cho message với optional fields |
| **Jest `expect()`** | Fluent assertions: `.toBe().toHaveLength().toContain()` |
| **TypeORM** | `createQueryBuilder().select().from().where().getMany()` |
| **Antd (Ant Design)** | `new Form.Builder().addItem().addItem().build()` |

---

## 📊 So sánh với Patterns liên quan

| Criteria | **Builder** | Factory Method | Constructor |
|----------|------------|-----------------|-------------|
| Mục đích | Tạo **1 object phức tạp**, step-by-step | Tạo **1 object** theo type | Tạo **1 object** đơn giản |
| Parameters | Nhiều optional ✅ | Thường ít params | Tất cả bắt buộc |
| Readability | ✅ Fluent, rõ ràng | ⚠️ Có thể telescoping | ❌ Thứ tự dễ nhầm |
| Validation | ✅ Validate từng bước hoặc cuối | ❌ Không có | ❌ Không có |
| Immutability | ✅ Dễ trả về immutable object | ❌ Thường mutate | ❌ Thường mutate |

---

## 💻 TypeScript Implementation

### Version 1: SQL Query Builder

```typescript
// Product
class SqlQuery {
  constructor(
    public readonly select: string[],
    public readonly from: string,
    public readonly where: string[],
    public readonly orderBy: string,
    public readonly limit: number
  ) {}
}

// Builder
class SqlQueryBuilder {
  private query = new QueryState();

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

  build(): SqlQuery {
    if (!this.query.from) {
      throw new Error('❌ FROM clause is required');
    }
    return new SqlQuery(
      this.query.select,
      this.query.from,
      [...this.query.where],
      this.query.orderBy,
      this.query.limit
    );
  }
}

class QueryState {
  select: string[] = ['*'];
  from = '';
  where: string[] = [];
  orderBy = '';
  limit = 0;
}

// Fluent Usage
const sql = new SqlQueryBuilder()
  .select('id', 'name', 'email', 'created_at')
  .from('users')
  .where('active = true')
  .where('role = "admin"')
  .orderBy('created_at', 'DESC')
  .limit(10)
  .build();

console.log(sql);
// SqlQuery {
//   select: ['id', 'name', 'email', 'created_at'],
//   from: 'users',
//   where: ['active = true', 'role = "admin"'],
//   orderBy: 'created_at DESC',
//   limit: 10
// }
```

---

### Version 2: Director Pattern — Preset Configurations

```typescript
// Director: Preset configurations
class HttpRequestDirector {
  // Static presets — gọi nhanh
  static jsonPost(builder: HttpRequestBuilder, url: string, body: unknown): HttpRequest {
    return builder
      .method('POST')
      .url(url)
      .header('Content-Type', 'application/json')
      .header('Accept', 'application/json')
      .body(body)
      .timeout(10000)
      .logging(false)
      .build();
  }

  static authenticatedGet(builder: HttpRequestBuilder, url: string, token: string): HttpRequest {
    return builder
      .method('GET')
      .url(url)
      .auth(token)
      .header('Accept', 'application/json')
      .timeout(5000)
      .build();
  }
}

// Usage: Preset nhanh
const postRequest = HttpRequestDirector.jsonPost(
  new HttpRequestBuilder(),
  '/api/users',
  { name: 'Jane' }
);

// Hoặc custom từ đầu
const customRequest = new HttpRequestBuilder()
  .method('PUT')
  .url('/api/users/123')
  .header('Content-Type', 'application/json')
  .auth('Bearer token456')
  .body({ name: 'Jane Updated' })
  .retry(2)
  .build();
```

---

## ⚖️ Trade-offs & Common Mistakes

### ✅ Khi nào nên dùng

- ✅ Object có **nhiều tham số** (>4) hoặc **nhiều optional fields**
- ✅ Muốn **tách bước construction** khỏi representation
- ✅ Cần **validation** trước khi object hoàn chỉnh
- ✅ Cần tạo **nhiều variants** của cùng một object
- ✅ Muốn **immutable product** — builder chỉ là temporary, product là immutable

### ❌ Khi nào không nên dùng

- ❌ Object chỉ có 2-3 fields bắt buộc — dùng constructor thông thường
- ❌ Object luôn luôn tạo với tất cả fields — không có optional
- ❌ Construction logic **rất đơn giản** — thêm Builder là over-engineer

### 🚫 Common Mistakes

**1. Builder return mutable object**
```typescript
// ❌ Sai: Client có thể mutate sau khi build
build(): HttpRequest {
  return this.request; // ❌ Return reference!
}

// ✅ Đúng: Return immutable copy
build(): HttpRequest {
  return Object.freeze({ ...this.request }); // ✅ Immutable
}
```

**2. Không validate khi build**
```typescript
// ❌ Sai: Object có thể missing required fields
build(): HttpRequest {
  return { ...this.request }; // ❌ Không check!
}
// → req.url === undefined → runtime crash khi gọi fetch(req.url)

// ✅ Đúng: Validate trước khi return
build(): HttpRequest {
  if (!this.request.url) throw new Error('❌ URL is required');
  if (!this.request.method) throw new Error('❌ Method is required');
  return Object.freeze({ ...this.request });
}
```

**3. Dùng Builder cho object quá đơn giản**
```typescript
// ❌ Thừa: Point chỉ có x, y — không cần Builder
const point = new PointBuilder().withX(10).withY(20).build();
// → Quá phức tạp cho 2 params

// ✅ Đúng:
const point = new Point(10, 20);
```

**4. Builder quá lớn — làm quá nhiều thứ**
```typescript
// ❌ Sai: Builder làm cả business logic
build(): HttpRequest {
  const req = { ... };
  await this.sendRequest(req); // ❌ Không nên!
  return req;
}
```

---

## 🧪 Testing Strategies

```typescript
// Test builder với validation
describe('HttpRequestBuilder', () => {
  it('should build valid request', () => {
    const req = new HttpRequestBuilder()
      .method('POST')
      .url('/api/users')
      .body({ name: 'Test' })
      .build();

    expect(req.method).toBe('POST');
    expect(req.url).toBe('/api/users');
    expect(req.body).toEqual({ name: 'Test' });
    expect(req.timeout).toBe(3000); // Default value
  });

  it('should throw on missing URL', () => {
    expect(() =>
      new HttpRequestBuilder().method('POST').build()
    ).toThrow('❌ URL is required');
  });

  it('should throw on invalid method', () => {
    expect(() =>
      new HttpRequestBuilder().method('INVALID').url('/').build()
    ).toThrow('❌ Invalid method');
  });

  it('should produce immutable object', () => {
    const req = new HttpRequestBuilder()
      .method('GET').url('/api').build();

    // @ts-expect-error — readonly field
    expect(() => { req.method = 'POST'; }).toThrow();
  });

  it('should allow partial configuration with defaults', () => {
    const req = new HttpRequestBuilder()
      .url('/api').build();

    expect(req.method).toBe('GET');       // Default
    expect(req.timeout).toBe(3000);      // Default
    expect(req.enableLogging).toBe(false); // Default
  });
});
```

---

## 🔄 Refactoring Path

**Từ Constructor/Config Object → Builder:**

```typescript
// ❌ Before: Config object — không type safety, không validation
function processPayment(config: {
  method: string;
  amount: number;
  currency?: string;
  retry?: number;
}) { /* ... */ }

// ❌ After: Builder — type safe, validation, readable
function processPayment(request: HttpRequest) {
  // request đã được validate khi build()
}
```

---

## 🎤 Interview Q&A

**Q: Builder Pattern là gì? Khi nào dùng?**
> A: Builder giúp tạo object phức tạp bằng chain các method, mỗi method set một thuộc tính và return `this`. Cuối cùng `build()` validate và trả về immutable object. Dùng khi object có nhiều tham số, đặc biệt là optional fields, và muốn code dễ đọc như câu tiếng Anh. Ví dụ: HTTP request, SQL query, PDF document, test fixtures.

**Q: Builder khác Factory Method?**
> A: Factory Method tạo object theo **type** (tạo A hay B). Builder tạo object theo **cấu hình** (A với config x=1, y=2). Factory Method dùng khi không biết type trước. Builder dùng khi biết type nhưng cấu hình phức tạp.

**Q: Immutable Builder là gì?**
> A: Kỹ thuật return **copy immutable** của object từ `build()`, không phải reference. Trong TypeScript: `Object.freeze({ ...this.request })`. Điều này ngăn client mutate object sau khi build — giá trị không thay đổi ngoài ý muốn.

**Q: Director trong Builder là gì?**
> A: Director là optional class định nghĩa **preset configurations** — cách tạo object phổ biến. Ví dụ: `HttpRequestDirector.jsonPost(url, body)` internally gọi builder với preset method=POST, headers=JSON, timeout=10s. Giúp client không phải chain từ đầu mỗi lần.
