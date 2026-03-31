# 🏗️ Singleton Pattern

## 🎯 Problem & Motivation

**Bài toán thực tế:** Bạn cần một object **duy nhất** trong toàn bộ ứng dụng, với **global access point** và **controlled lifecycle**.

**Tại sao không dùng global variable?**

```typescript
// ❌ Global variable — đầy rủi ro
const db = new Database(); // Tạo ngay khi load, không kiểm soát
db.query('SELECT * FROM users');

// Ai đó có thể ghi đè:
const db = createMockDatabase(); // Toàn bộ app bị ảnh hưởng!

// Hoặc tệ hơn:
db = null; // 💥 Runtime crash ở bất kỳ đâu gọi db.query()
```

**Singleton đảm bảo ba điều:**
1. Chỉ có **một instance** tồn tại trong app
2. Truy cập **toàn cục** từ bất kỳ đâu qua well-known access point
3. **Lazy initialization** — tạo khi cần, không lãng phí resource khi không dùng

---

## 💡 Use Cases

1. **Logger** — Tất cả các module cùng ghi vào một stream duy nhất, đảm bảo thứ tự log nhất quán
2. **Database Connection Pool** — Một pool dùng chung, tránh mở quá nhiều connections gây resource exhaustion
3. **Configuration Manager** — Đọc config từ file/env một lần khi app khởi động, share cho toàn bộ app mà không đọc lại
4. **Cache Service** — Một cache instance duy nhất, invalidation nhất quán trong toàn app
5. **Thread Pool / Worker Pool** — Một pool quản lý workers, tránh tạo quá nhiều threads
6. **Event Emitter (global)** — Một global event bus cho inter-module communication

---

## ❌ Before (Không dùng Singleton)

```typescript
// database.ts
// Mỗi module import đều tạo connection mới!
import { createConnection } from './db';

export class UserRepository {
  constructor() {
    this.connection = createConnection(); // ❌ Mỗi repo tạo connection riêng
  }
  async findById(id: number) {
    return this.connection.query(`SELECT * FROM users WHERE id = ?`, [id]);
  }
}

export class OrderRepository {
  constructor() {
    this.connection = createConnection(); // ❌ Connection #2
  }
  async findByUser(userId: number) {
    return this.connection.query(`SELECT * FROM orders WHERE user_id = ?`, [userId]);
  }
}

// auth.ts — Tạo connection #3
// payment.ts — Tạo connection #4
// → 10 modules = 10 connections → Database quá tải!
```

→ **Hậu quả:** Connection pool exhaustion, không có shared state, mỗi query có thể nằm ở connection khác nhau → không transaction được.

---

## ✅ After (Dùng Singleton)

```typescript
// singleton.ts
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connection: any;

  // Private constructor — không thể new trực tiếp
  private constructor() {
    this.connection = this.connect();
  }

  // Static access point — cách DUY NHẤT để lấy instance
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  private connect(): any {
    // Connection pool thực sự: 10 connections
    return { pool: [], maxConnections: 10 };
  }

  public query(sql: string, params: any[] = []): any {
    return this.connection.pool[0].execute(sql, params);
  }
}

// Export singleton instance — module-level singleton
export const db = DatabaseConnection.getInstance();
```

```typescript
// auth.ts
import { db } from './singleton';
const user = db.query('SELECT * FROM users WHERE id = ?', [1]);

// payment.ts
import { db } from './singleton';
const order = db.query('SELECT * FROM orders WHERE user_id = ?', [1]);

// → Cả hai cùng dùng một DatabaseConnection instance!
```

→ **Cải thiện:** `getInstance()` kiểm tra — nếu đã có instance thì trả về, không tạo mới. Toàn app dùng chung một connection pool.

---

## 🏗️ UML Diagram

```
┌─────────────────────────────────┐
│       SingletonClass            │
├─────────────────────────────────┤
│ - static instance: Singleton    │
├─────────────────────────────────┤
│ - constructor()                 │
│ + static getInstance(): Singleton│
│ + doSomething()                 │
└─────────────────────────────────┘

┌──────────────────────────────────┐
│  Module A          │ Module B   │
│  db = Singleton.getInstance()   │
│         ↕                      │
│  ┌─────────────────────────────┐ │
│  │    Singleton.instance       │ │
│  │    (shared reference)      │ │
│  └─────────────────────────────┘ │
└──────────────────────────────────┘
```

---

## 🔍 Step-by-step Trace

**Scenario:** Gọi `getInstance()` 3 lần từ 3 modules khác nhau.

```
Module A: db.getInstance()
  ├── instance === null? → TRUE
  ├── new DatabaseConnection()
  │     └── this.connect() → pool created
  └── return instance #1 ← stored in static field

Module B: db.getInstance()
  ├── instance === null? → FALSE (đã có #1)
  └── return instance #1 ← CÙNG reference với Module A!

Module C: db.getInstance()
  ├── instance === null? → FALSE
  └── return instance #1 ← Vẫn là instance ban đầu!

Kết quả: 3 modules, 1 instance ✅
Memory: chỉ 1 object được tạo ✅
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Chi tiết implementation |
|---------------------|------------------------|
| **Redux Store (React)** | `createStore()` — mỗi app chỉ có một store instance |
| **Winston Logger** | `createLogger()` mặc định là singleton; muốn multi-logger phải dùng `winston.createLogger()` nhiều lần |
| **Java `java.lang.Runtime`** | `Runtime.getRuntime()` — singleton thực sự trong JDK |
| **Node.js `process` object** | Global singleton, không thể thay thế |
| **Angular DI** | `Injector` là singleton per module scope, không phải global |
| **Spring `@Component`** | Spring beans mặc định là singleton per container |
| **Python `logging.getLogger()`** | Logger registry — có thể coi là singleton registry |

---

## 📊 So sánh với Patterns liên quan

| Criteria | **Singleton** | Module/ES6 Import | Static Class | DI Container |
|----------|--------------|-------------------|--------------|--------------|
| Instance count | 1 | 1 (module-level) | 1 | 1 per scope |
| Lazy init | ✅ Có | ❌ Khi load | ❌ Khi load | ✅ Có |
| Interface / Polymorphism | ✅ Có | ❌ Không | ❌ Không | ✅ Có |
| Testability | ⚠️ Khó mock | ❌ Rất khó | ❌ Khó | ✅ Dễ mock |
| Thread safety | ⚠️ Cần cẩn thận | ✅ An toàn | ✅ An toàn | ✅ An toàn |

---

## 💻 TypeScript Implementation

### Version 1: Basic Singleton (ES Module Pattern — Recommended in TypeScript)

```typescript
// Logger.ts — ES Module Singleton (đơn giản, TypeScript-friendly)
class Logger {
  private formatMessage(level: string, message: string): string {
    return `[${new Date().toISOString()}] [${level}] ${message}`;
  }

  info(message: string): void {
    console.log(this.formatMessage('INFO', message));
  }

  error(message: string): void {
    console.error(this.formatMessage('ERROR', message));
  }
}

// Export instance — TypeScript module singleton
// Module này được load 1 lần, logger là singleton thực sự
export const logger = new Logger();
```

```typescript
// auth.ts — dùng singleton
import { logger } from './Logger';

logger.info('User logged in');
```

```typescript
// payment.ts — cùng logger instance
import { logger } from './Logger';

logger.info('Payment processed');
// → [2026-03-31T...] [INFO] User logged in
// → [2026-03-31T...] [INFO] Payment processed
```

> **Tại sao ES Module Singleton tốt hơn classic `getInstance()`?**
> - Không cần `getInstance()` — module được load 1 lần → instance được tạo 1 lần
> - Không có static field → test dễ hơn (chỉ cần mock module)
> - TypeScript type inference tốt hơn

---

### Version 2: Singleton với Dependency Injection

```typescript
// injectable.ts — Singleton qua DI container
interface IDatabase {
  query(sql: string, params?: any[]): any;
  transaction<T>(fn: () => T): T;
}

class DatabaseConnection implements IDatabase {
  private pool: any[] = [];
  private static instance: DatabaseConnection;

  // Private constructor ngăn new trực tiếp
  private constructor(config: { host: string; port: number; max: number }) {
    console.log(`🔌 Connecting to ${config.host}:${config.port} (max ${config.max})`);
    this.pool = Array.from({ length: config.max }, (_, i) => ({ id: i }));
  }

  // Double-checked locking (cho multithreaded languages)
  public static getInstance(config?: { host: string; port: number; max: number }): IDatabase {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection(config ?? { host: 'localhost', port: 5432, max: 10 });
    }
    return DatabaseConnection.instance;
  }

  query(sql: string, params?: any[]): any {
    return { sql, params, result: [] };
  }

  transaction<T>(fn: () => T): T {
    return fn(); // Simplified
  }
}

// Usage
const db = DatabaseConnection.getInstance({ host: 'db.prod.com', port: 5432, max: 20 });
```

---

## ⚖️ Trade-offs & Common Mistakes

### ✅ Khi nào nên dùng

- ✅ Cần **đúng một instance** trong toàn app (logger, config, connection pool)
- ✅ Cần **global access point** đã biết trước, không muốn truyền qua mọi hàm
- ✅ Instance được **reuse giữa nhiều modules** mà không muốn pass qua dependency chain

### ❌ Khi nào không nên dùng

- ❌ Có thể dùng **ES Module export** thay thế (đơn giản hơn, test dễ hơn)
- ❌ Cần **nhiều instances** cho testing khác nhau → Singleton khó mock
- ❌ Object cần **nhiều configurations** (dev vs prod) → dùng DI factory
- ❌ Trong **multithreaded environment** (Java, Go) nếu không implement thread-safe

### 🚫 Common Mistakes

**1. Global variable disguised as Singleton**
```typescript
// ❌ Sai: Tạo biến global — không phải Singleton đúng nghĩa
export const db = new Database(); // Đây là global variable!
```

**2. Multithreading race condition**
```typescript
// ❌ Sai: Trong multithreaded, 2 threads có thể vào cùng lúc → tạo 2 instances
public static getInstance(): Singleton {
  if (!instance) {           // Thread A check → TRUE
    instance = new Singleton(); // Thread A + B đều vào đây → 2 instances!
  }
  return instance;
}

// ✅ Đúng: Double-checked locking
public static getInstance(): Singleton {
  if (!instance) {
    synchronized (Singleton.class) {
      if (!instance) {
        instance = new Singleton();
      }
    }
  }
  return instance;
}
```

**3. Serializable Singleton bị break**
```typescript
// ❌ Sai: Deserialize tạo instance mới, vi phạm Singleton!
const obj = JSON.parse(JSON.stringify(singleton));

// ✅ Đúng: Implement readResolve() (Java) hoặc use ES Module pattern
```

**4. Singleton tự ý extend behavior**
```typescript
// ❌ Sai: Singleton chứa quá nhiều trách nhiệm
class BadSingleton {
  static getInstance() { /* ... */ }
  doA() { /* A */ }
  doB() { /* B */ }  // ❌ Nên là class riêng
  doC() { /* C */ }  // ❌ Quá nhiều responsibility
}
```

---

## 🧪 Testing Strategies

```typescript
// Singleton khó test vì hard-coded instance
// Cách 1: Mock ES Module
jest.mock('./Logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() }
}));

// Cách 2: Reset instance giữa tests
describe('UserService', () => {
  beforeEach(() => {
    // Reset singleton state (cần method công khai)
    (DatabaseConnection as any).instance = null;
  });

  afterEach(() => {
    (DatabaseConnection as any).instance = null;
  });

  it('should use database singleton', () => {
    const db = DatabaseConnection.getInstance();
    expect(db).toBe(DatabaseConnection.getInstance());
  });
});

// Cách 3: Tốt nhất — dùng DI thay vì Singleton
class UserService {
  constructor(private db: IDatabase) {} // Inject, don't hard-code
}
```

---

## 🔄 Refactoring Path

**Từ Singleton → Dependency Injection:**

```typescript
// ❌ Before: Singleton hard-coded
class UserService {
  private db = DatabaseConnection.getInstance();

  async findUser(id: number) {
    return this.db.query('SELECT * FROM users WHERE id = ?', [id]);
  }
}

// ✅ After: DI — test được, mock được
class UserService {
  constructor(private db: IDatabase) {}

  async findUser(id: number) {
    return this.db.query('SELECT * FROM users WHERE id = ?', [id]);
  }
}

// Container setup
container.register('db', () => DatabaseConnection.getInstance());
const userService = new UserService(container.get<IDatabase>('db'));
```

---

## 🎤 Interview Q&A

**Q: Singleton là gì? Khi nào dùng?**
> A: Singleton đảm bảo một class chỉ có một instance duy nhất trong app, với global access point. Dùng khi cần shared resource như logger, database connection pool, configuration manager. Trong TypeScript, ES Module pattern (export instance từ module) là cách tốt nhất vì đơn giản và test dễ hơn classic `getInstance()`.

**Q: Singleton khác global variable?**
> A: Global variable tạo ngay khi load module, không kiểm soát được lifecycle, có thể bị ghi đè. Singleton lazy-init khi cần, constructor private ngăn ghi đè, và có thể implement interface để mock trong test. Tuy nhiên, nhiều developer coi Singleton cũng là anti-pattern vì nó là global state ẩn — Dependency Injection được khuyên dùng thay thế.

**Q: Làm sao test được code dùng Singleton?**
> A: Ba cách: (1) Dùng ES Module pattern — chỉ cần `jest.mock()`. (2) Implement `resetInstance()` method cho test. (3) Tốt nhất: thay Singleton bằng Dependency Injection — inject mock instance vào constructor, không cần sửa code.

**Q: Eager Singleton vs Lazy Singleton khác nhau gì?**
> A: Eager tạo instance ngay khi class được load (an toàn trong multithreaded). Lazy tạo khi `getInstance()` được gọi lần đầu (tiết kiệm resource nếu không dùng). Trong TypeScript, ES Module singleton là eager (tạo khi module load) nhưng vì TypeScript module chỉ load một lần, nó hoạt động đúng.
