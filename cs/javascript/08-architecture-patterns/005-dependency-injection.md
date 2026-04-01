# Dependency Injection — Kiến Trúc Linh Hoạt, Dễ Test

## Câu hỏi mở đầu

```javascript
// Tại sao đoạn code này KHÓ TEST?

class UserService {
  constructor() {
    this.db = new MySQLDatabase();  // Hard-coded dependency!
    this.logger = new ConsoleLogger(); // Hard-coded!
    this.cache = new RedisCache();   // Hard-coded!
  }

  async getUser(id) {
    const cached = await this.cache.get(`user:${id}`);
    if (cached) return cached;

    const user = await this.db.query(`SELECT * FROM users WHERE id = ${id}`);
    await this.cache.set(`user:${id}`, user);
    return user;
  }
}

// Muốn test getUser()?
// → Phải setup MySQL, Redis, Console → 30 phút setup!
// → Không thể test logic riêng của getUser()!
```

**Dependency Injection (DI)** giải quyết vấn đề này: thay vì class tự tạo dependencies, **bạn truyền dependencies vào**. Kết quả: testable, flexible, và loosely coupled code. Angular dùng DI làm nền tảng. Bạn sẽ hiểu TẠI SAO và LÀM SAO.

---

## 1. Dependency Injection — Bản Chất

### Inversion of Control (IoC)

```
┌──────────────────────────────────────────────────────────────┐
│  WITHOUT DI — YOUR CODE CONTROLS CREATION                      │
│                                                               │
│  UserService                                                   │
│    └── creates: new MySQLDatabase()  ← tight coupling         │
│    └── creates: new ConsoleLogger() ← tight coupling         │
│    └── creates: new RedisCache()    ← tight coupling         │
│  → UserService PHỤ THUỘC vào implementation details          │
│  → Không thể thay đổi database mà không sửa UserService       │
│  → Không thể test UserService mà không có database thật!     │
│                                                               │
│  WITH DI — FRAMEWORK CONTROLS CREATION                         │
│                                                               │
│  Framework/Container                                          │
│    └── creates: MySQLDatabase (or mock)                      │
│    └── injects into: UserService                             │
│  → UserService chỉ NHẬN, không tự tạo                       │
│  → Thay đổi database = thay đổi container config              │
│  → Test = truyền mock vào                                     │
└──────────────────────────────────────────────────────────────┘
```

### Constructor Injection — Phổ biến nhất

```javascript
// ❌ WITHOUT DI — hard-coded, untestable
class EmailService {
  send(email, message) {
    const client = new SMTPClient(); // Hard-coded!
    client.connect();
    client.send(email, message);
  }
}

// ✅ WITH DI — injectable, testable
class EmailService {
  constructor(mailClient) {
    this.client = mailClient; // Injected!
  }

  send(email, message) {
    this.client.connect();
    this.client.send(email, message);
  }
}

// Test với mock:
const mockClient = {
  connect: jest.fn(),
  send: jest.fn()
};

const emailService = new EmailService(mockClient);
emailService.send('test@example.com', 'Hello');

// Assertions:
expect(mockClient.connect).toHaveBeenCalled();
expect(mockClient.send).toHaveBeenCalledWith('test@example.com', 'Hello');
// → Test logic của EmailService mà không cần SMTP server!
```

### Property Injection — Khi Constructor Quá Bự

```javascript
// ❌ Quá nhiều dependencies trong constructor = ugly
class VeryLargeService {
  constructor(db, cache, logger, config, metrics, auth, http) {
    // 7 dependencies!
  }
}

// ✅ Property injection — set dependencies sau khi constructed
class VeryLargeService {
  setDatabase(db) { this.db = db; }
  setCache(cache) { this.cache = cache; }
  setLogger(logger) { this.logger = logger; }
  // ...
}

// Hoặc:
class VeryLargeService {
  db = null;
  cache = null;
  logger = null;

  // Default = null, được inject trước khi dùng
  async getUser(id) {
    if (!this.db) throw new Error('Database not injected!');
    return this.db.query(id);
  }
}

// ✅ Framework-style: decorator injection (Angular)
class UserService {
  constructor(
    @Inject('DATABASE') private db,
    @Inject('LOGGER') private logger,
    @Optional() private cache
  ) {}
}
```

### Method Injection — Khi Chỉ Cần Dependency Trong Method

```javascript
// Dùng khi dependency chỉ cần trong 1 method
class PaymentProcessor {
  // Database chỉ cần trong processPayment()
  // Không cần giữ reference toàn bộ lifetime

  async processPayment(amount, billingService) { // billingService injected here!
    const isValid = await billingService.validate(amount);
    if (!isValid) throw new Error('Invalid amount');

    // process payment...
  }
}

class OrderService {
  constructor(private billing: BillingService) {}

  async checkout(cart) {
    const processor = new PaymentProcessor();
    // billingService chỉ cần khi cần
    await processor.processPayment(cart.total, this.billing);
  }
}
```

---

## 2. DI Container — Tự Động Hóa

### Simple DI Container

```javascript
// Tự viết DI container đơn giản
class DIContainer {
  constructor() {
    this.services = new Map();
    this.factories = new Map();
  }

  // Register singleton
  registerSingleton(token, factory) {
    this.factories.set(token, () => {
      const instance = factory(this); // Recursive resolve dependencies
      this.services.set(token, instance);
      return instance;
    });
  }

  // Register transient (new instance each time)
  registerTransient(token, factory) {
    this.factories.set(token, factory);
  }

  // Resolve
  resolve(token) {
    // Singleton: return cached
    if (this.services.has(token)) {
      return this.services.get(token);
    }

    // Create new instance
    const factory = this.factories.get(token);
    if (!factory) {
      throw new Error(`Service not registered: ${token}`);
    }

    return factory(this);
  }
}

// Usage:
const container = new DIContainer();

// Register services
container.registerSingleton('Database', (c) => new MySQLDatabase());
container.registerSingleton('Cache', (c) => new RedisCache());
container.registerSingleton('Logger', (c) => new ConsoleLogger());

// Register factory với dependencies
container.registerTransient('UserService', (c) => {
  const db = c.resolve('Database');
  const cache = c.resolve('Cache');
  const logger = c.resolve('Logger');
  return new UserService(db, cache, logger);
});

// Resolve — container tự inject dependencies!
const userService = container.resolve('UserService');
// userService.db = MySQLDatabase instance ✅
// userService.cache = RedisCache instance ✅
// userService.logger = ConsoleLogger instance ✅
```

### Container với Decorators

```javascript
// TypeScript/Angular-style decorators

// Inject decorator — đánh dấu property là dependency
function Injectable(target, key) {
  // Metadata gì đó...
}

// Reflect metadata (ES decorator standard)
 Reflect.defineMetadata('inject:db', 'DATABASE', UserService.prototype, 'db');
 Reflect.defineMetadata('inject:cache', 'CACHE', UserService.prototype, 'cache');

// Container resolve dựa trên metadata
function resolve(target) {
  const instance = Object.create(target.prototype);
  const metadata = Reflect.getMetadata('injections', target);

  if (metadata) {
    for (const [prop, token] of Object.entries(metadata)) {
      instance[prop] = container.resolve(token);
    }
  }

  return instance;
}

// Usage:
class UserService {
  @Inject('Database') db;
  @Inject('Cache') cache;
}

// Resolve:
const svc = resolve(UserService);
// Container tự inject db và cache!
```

---

## 3. Testability — Lợi Ích Lớn Nhất Của DI

### Unit testing với mocks

```javascript
// ❌ System under test phụ thuộc real implementations
class OrderService {
  async placeOrder(order) {
    const db = new MySQLDatabase(); // Real DB!
    const emailer = new SendGridEmail(); // Real email!
    const inventory = new WarehouseAPI(); // Real API!

    await db.save(order);
    await inventory.reserve(order.items);
    await emailer.send(order.customer.email, 'Order confirmed');
  }
}

// ✅ DI: inject mocks
class OrderService {
  constructor(db, emailer, inventory) {
    this.db = db;
    this.emailer = emailer;
    this.inventory = inventory;
  }

  async placeOrder(order) {
    await this.db.save(order);
    await this.inventory.reserve(order.items);
    await this.emailer.send(order.customer.email, 'Order confirmed');
  }
}

// Test:
describe('OrderService', () => {
  let service;
  let mockDb;
  let mockEmailer;
  let mockInventory;

  beforeEach(() => {
    mockDb = {
      save: jest.fn().mockResolvedValue({ id: '123' })
    };
    mockEmailer = { send: jest.fn().mockResolvedValue() };
    mockInventory = { reserve: jest.fn().mockResolvedValue() };

    service = new OrderService(mockDb, mockEmailer, mockInventory);
  });

  test('places order successfully', async () => {
    const order = { id: '1', customer: { email: 'a@b.com' } };
    await service.placeOrder(order);

    expect(mockDb.save).toHaveBeenCalledWith(order);
    expect(mockInventory.reserve).toHaveBeenCalledWith(order.items);
    expect(mockEmailer.send).toHaveBeenCalledWith('a@b.com', 'Order confirmed');
  });

  test('throws if inventory fails', async () => {
    mockInventory.reserve.mockRejectedValue(new Error('Out of stock'));

    const order = { id: '1', customer: { email: 'a@b.com' }, items: [] };

    await expect(service.placeOrder(order)).rejects.toThrow('Out of stock');
    expect(mockDb.save).not.toHaveBeenCalled(); // Transaction rollback!
  });
});
```

### Integration testing

```javascript
// Dùng DI container để swap implementations
const container = new DIContainer();

// Production config:
function setupProduction() {
  container.registerSingleton('DB', () => new MySQLDatabase());
  container.registerSingleton('Email', () => new SendGridEmail());
}

// Test config:
function setupTest() {
  const testDb = new InMemoryDatabase();
  container.registerSingleton('DB', () => testDb);
  container.registerSingleton('Email', new MockEmailer());
}

// Setup:
setupTest(); // hoặc setupProduction()

const service = container.resolve('OrderService');
// Test với InMemoryDatabase — fast, isolated, repeatable!
```

---

## 4. Factory Pattern + DI

### Factory cho complex creation

```javascript
// Dùng factory khi DI container không đủ
class Container {
  registerSingleton(token, implementation) {
    this.services.set(token, { instance: null, impl: implementation, singleton: true });
  }

  resolve(token) {
    const registration = this.services.get(token);
    if (!registration) throw new Error(`Unknown: ${token}`);

    if (registration.singleton && registration.instance) {
      return registration.instance;
    }

    // Create instance — có thể là class hoặc factory function
    const instance = registration.impl(this);
    if (registration.singleton) {
      registration.instance = instance;
    }
    return instance;
  }
}

// Factory cho object cần nhiều config
container.registerSingleton('UserRepository', (c) => {
  const db = c.resolve('Database');
  const config = c.resolve('Config');

  return new UserRepository({
    db,
    tableName: config.userTable,
    maxRetries: 3,
    cache: c.resolve('Cache'),
    logger: c.resolve('Logger')
  });
});
```

---

## 5. DI Trong JavaScript Thực Tế

### Angular DI

```typescript
// Angular — built-in DI container
@Injectable({ providedIn: 'root' })
class UserService {
  constructor(private http: HttpClient, private logger: LoggerService) {}

  getUsers() {
    this.logger.log('Fetching users');
    return this.http.get<User[]>('/api/users');
  }
}

// providedIn: 'root' = singleton toàn app
// providedIn: 'platform' = singleton toàn browser tab
// providedIn: 'any' = new instance per module

// @Inject decorator:
constructor(
  @Inject(API_URL) private apiUrl: string,
  @Optional() @Inject(OPTIONAL_TOKEN) private optional: any
) {}
```

### React Context + DI

```javascript
// DI container as React Context
import { createContext, useContext } from 'react';

const ServiceContext = createContext({});

// Provider — setup DI container
function App() {
  const container = {
    db: new MySQLDatabase(),
    cache: new RedisCache(),
    logger: new ConsoleLogger()
  };

  return (
    <ServiceContext.Provider value={container}>
      <UserPage />
    </ServiceContext.Provider>
  );
}

// Consumer — nhận injected services
function UserPage() {
  const { db, logger } = useContext(ServiceContext);

  const loadUser = async (id) => {
    logger.info(`Loading user ${id}`);
    return db.query(`SELECT * FROM users WHERE id = ${id}`);
  };

  // Test: chỉ cần mock context!
  return null;
}

// Test với mocks:
function TestUserPage() {
  const mockContainer = {
    db: { query: jest.fn() },
    logger: { info: jest.fn() }
  };

  return (
    <ServiceContext.Provider value={mockContainer}>
      <UserPage />
    </ServiceContext.Provider>
  );
}
```

### Node.js + Express DI

```javascript
// Express app với DI
class App {
  constructor(container) {
    this.container = container;
  }

  setup() {
    const userService = this.container.resolve('UserService');

    app.get('/users/:id', async (req, res) => {
      const user = await userService.getUser(req.params.id);
      res.json(user);
    });

    return app;
  }
}

// Setup:
const container = new Container();
container.registerSingleton('UserService', (c) => {
  return new UserService(c.resolve('Database'));
});
container.registerSingleton('Database', () => new MySQLDatabase());

const app = new App(container).setup();
```

---

## 6. Các Traps Phổ Biến

### Trap 1: Constructor injection quá nhiều params

```javascript
// ❌ Constructor có 10+ dependencies = bad smell
class GiantService {
  constructor(db, cache, logger, config, auth, http, metrics, events, queue, storage) {
    // 10!
  }
}

// ✅ Refactor: group related dependencies
class GiantService {
  constructor(
    data: DataLayer,      // db + cache
    infra: InfraLayer,     // logger + metrics + events
    core: CoreLayer       // config + auth + http
  ) {}
}

// Hoặc dùng Facade pattern
class AppServices {
  constructor(private container: DIContainer) {}

  get db() { return this.container.resolve('Database'); }
  get logger() { return this.container.resolve('Logger'); }
}
```

### Trap 2: Circular dependencies

```javascript
// ❌ Circular: A needs B, B needs A
class A {
  constructor(b) { this.b = b; }
}

class B {
  constructor(a) { this.a = a; }
}

const a = new A(new B(new A(...))); // Stack overflow!

// ✅ Fix: lazy injection (property or method injection)
class A {
  constructor() {}
  setB(b) { this.b = b; }
}

class B {
  constructor(a) { this.a = a; }
}

// Setup:
const a = new A();
const b = new B(a);
a.setB(b);

// Hoặc dùng getter injection
class A {
  _b;
  setB(b) { this._b = b; }
  get b() { return this._b; }
}
```

### Trap 3: Injecting concrete classes thay vì interfaces

```javascript
// ❌ Tight coupling: phụ thuộc implementation
constructor(private db: MySQLDatabase) {}

// ✅ Loose coupling: phụ thuộc abstraction
constructor(private db: IDatabase) {}

// Register:
container.registerSingleton('IDatabase', () => new MySQLDatabase());
// Hoặc swap:
container.registerSingleton('IDatabase', () => new MongoDatabase());
```

### Trap 4: Global container = hidden dependency

```javascript
// ❌ Global container = global state = anti-pattern
const globalContainer = new Container();

// A.js
const db = globalContainer.resolve('Database');

// B.js
const db = globalContainer.resolve('Database'); // Same instance

// ✅ Explicit DI — truyền qua constructor
// A.js — rõ ràng A cần Database
function createUserService(db, logger) { ... }

// B.js
function createOrderService(userService, db) { ... }

// root.js
const db = new MySQLDatabase();
const logger = new ConsoleLogger();
const userService = createUserService(db, logger);
const orderService = createOrderService(userService, db);

// Test: truyền mocks trực tiếp
const mockDb = new MockDatabase();
const userService = createUserService(mockDb, mockLogger);
```

---

## 7. Câu Hỏi Phỏng Vấn

### Câu 1: Dependency Injection là gì? Khác gì Service Locator?

**Trả lời:** DI = dependencies được **đưa vào** (injected) từ bên ngoài, qua constructor, property, hoặc method. Container/framework tự resolve và inject. **Service Locator** = object có method `getService('token')`, consumer gọi `locator.getService('DB')` khi cần. **Khác nhau**: DI rõ ràng hơn (constructor liệt kê dependencies), Service Locator ẩn dependencies (gọi khi cần → hard to test). DI = explicit, Service Locator = implicit.

---

### Câu 2: DI có lợi ích gì?

**Trả lời:** (1) **Testability** — mock/stub dependencies dễ dàng, test isolation. (2) **Loose coupling** — consumer không biết implementation cụ thể. (3) **Flexibility** — swap implementations (MySQL → PostgreSQL) không sửa consumer. (4) **Reusability** — same service với different configs. (5) **Single responsibility** — class không tự tạo dependencies. (6) **Lifetime management** — singletons, transients được control bởi container.

---

### Câu 3: Singleton vs Transient vs Scoped

| Lifetime | Mô tả | Use case |
|----------|--------|----------|
| Singleton | 1 instance toàn app | Database, Logger, Config |
| Transient | Instance mới mỗi resolve | Lightweight stateless services |
| Scoped | 1 instance per scope/request | HTTP request context, user session |

```javascript
// Singleton: 1 instance, shared
container.registerSingleton('Logger', () => new Logger());
const logger1 = container.resolve('Logger');
const logger2 = container.resolve('Logger');
logger1 === logger2; // true ✅

// Transient: new instance mỗi lần
container.registerTransient('UserService', () => new UserService());
const svc1 = container.resolve('UserService');
const svc2 = container.resolve('UserService');
svc1 === svc2; // false ✅

// Scoped: 1 instance per scope
container.registerScoped('RequestContext', () => new Context());
// Mỗi HTTP request = 1 context instance
```

---

### Câu 4: DI container hoạt động như thế nào?

**Trả lời:** Container là registry của factories/singletons. Khi resolve: (1) kiểm tra singleton cache → return nếu có. (2) Gọi factory function, truyền container vào (để recursive resolution). (3) Factory gọi `container.resolve()` cho các dependencies của nó. (4) Cache instance nếu singleton. (5) Return instance. Recursive resolution: A phụ thuộc B, B phụ thuộc C → container resolve C → B → A.

---

### Câu 5: Khi nào KHÔNG nên dùng DI container?

**Trả lời:** (1) **Simple applications** — DI container thêm complexity không cần thiết cho app nhỏ. (2) **Explicit over implicit** — Service Locator và manual DI có thể rõ ràng hơn trong một số trường hợp. (3) **Library code** — thư viện không nên phụ thuộc vào user's DI container. (4) **Function-based code** — functional composition đơn giản hơn DI cho stateless functions.

---

### Câu 6: Inversion of Control là gì?

**Trả lời:** IoC = **nguyên tắc đảo ngược control flow**. Thay vì **your code** gọi library/framework, **framework** gọi **your code**. Ví dụ: bạn không gọi `database.query()`, mà framework gọi `yourService.getData()` khi cần. DI là một implementation của IoC. Others: Event-driven programming, Template Method pattern, Hollywood Principle ("Don't call us, we'll call you").

---

### Câu 7: DI trong React/Angular/Vue

```javascript
// React — Context as DI
const AppContext = createContext(container);
const service = useContext(AppContext);

// Angular — built-in DI (best-in-class)
@Injectable({ providedIn: 'root' })
class MyService {}

// Vue — provide/inject as DI
const App = {
  provide: { userService: new UserService() },
};
const Child = {
  inject: ['userService'],
};
```

---

## 8. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  DEPENDENCY INJECTION                                           │
│                                                               │
│  CORE CONCEPT                                                  │
│  ├── IoC: framework controls creation, not your code           │
│  ├── Inject: dependencies passed in, not created internally   │
│  └── Container: registry + resolver + lifetime manager        │
│                                                               │
│  INJECTION TYPES                                               │
│  ├── Constructor: dependencies in constructor (most common)   │
│  ├── Property: set dependencies as properties                │
│  └── Method: inject only where needed (method injection)      │
│                                                               │
│  LIFETIME                                                      │
│  ├── Singleton: 1 instance per app                           │
│  ├── Transient: new instance each resolve                    │
│  └── Scoped: 1 instance per scope/request                    │
│                                                               │
│  BENEFITS                                                      │
│  ├── Testability: mock dependencies easily                   │
│  ├── Loose coupling: depends on abstractions                 │
│  ├── Flexibility: swap implementations freely               │
│  └── Reusability: same code, different configs              │
│                                                               │
│  ⚠️ Too many constructor params = refactor needed           │
│  ⚠️ Circular deps = lazy injection or refactor              │
│  ⚠️ Global container = hidden dependencies                 │
│  ⚠️ Inject abstractions, not concrete classes               │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Hiểu Inversion of Control và Dependency Injection
- [ ] Implement được constructor injection
- [ ] Xây dựng được simple DI container
- [ ] Viết được unit test với mock dependencies
- [ ] Phân biệt được Singleton, Transient, Scoped lifetimes
- [ ] Tránh được circular dependencies
- [ ] Trả lời được 5/7 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
