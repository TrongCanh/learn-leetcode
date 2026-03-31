# 🏗️ Singleton Pattern

## 🎯 Problem & Motivation

**Bài toán:** Bạn cần một object **duy nhất** trong toàn bộ ứng dụng — ví dụ: logger, database connection, config manager.

**Tại sao không dùng global variable?** Global variable rất dễ bị ghi đè, không kiểm soát được lifecycle, và khó test.

**Singleton đảm bảo:**
- Chỉ có **một instance** tồn tại trong app
- Truy cập **toàn cục** từ bất kỳ đâu
- Lazy initialization — tạo khi cần, không lãng phí resource

---

## 💡 Use Cases

1. **Logger** — Tất cả các module cùng ghi vào một instance duy nhất
2. **Database Connection Pool** — Một connection pool dùng chung cho toàn app, tránh mở quá nhiều connections
3. **Configuration Manager** — Đọc config từ file một lần, share cho toàn bộ app
4. **Cache Service** — Một cache instance duy nhất, đảm bảo state nhất quán

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

  async getUser(id: number) {
    return this.connection.query(`SELECT * FROM users WHERE id = ?`, [id]);
  }
}
```

```typescript
// auth.ts — Tạo connection riêng
import { createConnection } from './db';
const conn1 = createConnection(); // ❌ Connection #1

// payment.ts — Tạo connection riêng
import { createConnection } from './db';
const conn2 = createConnection(); // ❌ Connection #2

// → 10 modules = 10 connections → Database quá tải!
```

→ **Vấn đề:** Mỗi `createConnection()` tạo một connection mới → resource leak, không nhất quán state, khó quản lý.

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
    console.log('📦 Database connection created');
  }

  // Static method — cách duy nhất để lấy instance
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  private connect(): any {
    return { /* actual connection logic */ };
  }

  public query(sql: string, params: any[] = []): any {
    return this.connection.execute(sql, params);
  }
}

export const db = DatabaseConnection.getInstance();
```

```typescript
// auth.ts
import { db } from './singleton';
const user1 = db.query('SELECT * FROM users WHERE id = ?', [1]);

// payment.ts
import { db } from './singleton';
const user2 = db.query('SELECT * FROM users WHERE id = ?', [2]);

// → Cả hai dùng cùng 1 connection!
```

→ **Cải thiện:** `getInstance()` kiểm tra — nếu đã có instance thì trả về, không tạo mới.

---

## 🏗️ UML Diagram

```
┌─────────────────────────────────┐
│       Singleton Class          │
├─────────────────────────────────┤
│ - static instance: Singleton   │
├─────────────────────────────────┤
│ - constructor()                 │
│ + static getInstance(): Singleton│
└─────────────────────────────────┘

Singleton instance ──→ Singleton (self-reference)
```

---

## 🔍 Step-by-step Trace

**Scenario:** Gọi `getInstance()` 3 lần từ 3 modules khác nhau.

```
Bước 1: auth.ts → db.getInstance()
  ├── instance === null? → TRUE
  ├── new DatabaseConnection() → instance created
  └── return instance #1

Bước 2: payment.ts → db.getInstance()
  ├── instance === null? → FALSE (đã có #1)
  └── return instance #1 ← cùng instance với auth.ts!

Bước 3: user.ts → db.getInstance()
  ├── instance === null? → FALSE
  └── return instance #1 ← vẫn là instance ban đầu!

Kết quả: 3 modules, 1 instance ✅
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Cách dùng Singleton |
|---------------------|---------------------|
| **Redux (React)** | `createStore()` trả về một store instance duy nhất |
| **Angular DI** | `Injector` là singleton per module |
| **Winston Logger** | `createLogger()` mặc định là singleton |
| **Java `java.lang.Runtime`** | `Runtime.getRuntime()` là Singleton thực sự |
| **Node.js `process` object** | Global singleton trong Node |

---

## 📊 So sánh với Patterns liên quan

| Criteria | **Singleton** | Module/Global Variable | Static Class |
|----------|--------------|------------------------|--------------|
| Instance count | 1 | 1 (global) | 1 (nhưng không phải object) |
| Lazy init | ✅ Có | ❌ Không | ❌ Không |
| Interface / Polymorphism | ✅ Có | ❌ Không | ❌ Không |
| Testability | ⚠️ Khó mock | ❌ Rất khó | ❌ Khó |
| Thread safety | ⚠️ Cần cẩn thận | ✅ An toàn | ✅ An toàn |

---

## 💻 TypeScript Implementation

```typescript
// ─────────────────────────────────────────
// Version 1: Basic Singleton (simple)
// ─────────────────────────────────────────
class SingletonV1 {
  private static instance: SingletonV1;

  private constructor() {}

  public static getInstance(): SingletonV1 {
    if (!SingletonV1.instance) {
      SingletonV1.instance = new SingletonV1();
    }
    return SingletonV1.instance;
  }

  public doSomething(): void {
    console.log('Singleton V1 doing something');
  }
}

// ─────────────────────────────────────────
// Version 2: Thread-safe (Java/C#)
// Dùng IIFE + closure để simulate
// ─────────────────────────────────────────
const SingletonV2 = (() => {
  let instance: any = null;

  function createInstance() {
    return {
      timestamp: Date.now(),
      doSomething() {
        console.log('Singleton V2 doing something');
      }
    };
  }

  return {
    getInstance() {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    }
  };
})();

// ─────────────────────────────────────────
// Version 3: with Dependency Injection
// ─────────────────────────────────────────
interface IDatabase {
  query(sql: string): any;
}

class DatabaseConnection implements IDatabase {
  constructor(private config: { host: string; port: number }) {
    console.log(`Connecting to ${config.host}:${config.port}`);
  }

  query(sql: string): any {
    return { sql, result: [] };
  }
}

// Singleton Factory
class Container {
  private static services = new Map<string, any>();

  public static register<T>(token: string, factory: () => T): void {
    Container.services.set(token, factory());
  }

  public static get<T>(token: string): T {
    const service = Container.services.get(token);
    if (!service) throw new Error(`Service ${token} not found`);
    return service as T;
  }
}

// Usage
Container.register('db', () => new DatabaseConnection({ host: 'localhost', port: 5432 }));
const db = Container.get<IDatabase>('db');
```

---

## 📝 LeetCode Problems áp dụng

- **Không có bài LeetCode nào dành riêng cho Singleton** — nhưng pattern này xuất hiện trong:
  - [LRU Cache](https://leetcode.com/problems/lru-cache/) — dùng Singleton cho cache manager
  - [Min Stack](https://leetcode.com/problems/min-stack/) — dùng single instance pattern

---

## ✅ Pros / ❌ Cons

**Ưu điểm:**
- ✅ Đảm bảo một instance duy nhất, tiết kiệm resource
- ✅ Global access point — dễ gọi từ bất kỳ đâu
- ✅ Lazy initialization — chỉ tạo khi cần
- ✅ Có thể bảo vệ instance (private constructor)

**Nhược điểm:**
- ❌ **Vi phạm Single Responsibility** — quản lý lifecycle + logic nghiệp vụ trong 1 class
- ❌ **Hard coupling** — code phụ thuộc vào Singleton cụ thể, khó thay thế bằng mock trong test
- ❌ **Global state** — là một dạng global variable, dễ tạo hidden dependencies
- ❌ **Khó test** — không thể mock khi `getInstance()` trả về hardcoded instance
- ❌ **Multithreading issues** — trong Java/C++ nếu không cẩn thận, nhiều threads có thể tạo nhiều instances

---

## ⚠️ Khi nào nên / không nên dùng

**Nên dùng khi:**
- ✅ Cần đúng một instance trong toàn app (logger, config, connection pool)
- ✅ Cần global access point đã biết trước
- ✅ Instance được share giữa nhiều modules mà không muốn truyền qua mọi hàm

**Không nên dùng khi:**
- ❌ Có thể dùng **Dependency Injection** thay thế (DI tốt hơn vì test được)
- ❌ Cần **nhiều instances** cho testing khác nhau
- ❌ Object cần **nhiều configurations** khác nhau ( VD: test config ≠ prod config )
- ❌ Trong **multithreaded environment** mà không implement thread-safe

---

## 🚫 Common Mistakes / Pitfalls

1. **Global variable disguised as Singleton**
   ```typescript
   // ❌ Sai: Tạo biến global thay vì dùng getInstance()
   export const db = new DatabaseConnection(); // đây là global variable, không phải Singleton!
   ```

2. **Multithreading race condition**
   ```typescript
   // ❌ Sai: Trong multithreaded, 2 threads có thể vào cùng lúc
   public static getInstance(): Singleton {
     if (!instance) {           // Thread A check
       instance = new Singleton(); // Thread A + B đều vào đây!
     }
     return instance;
   }
   ```

3. **Serializable Singleton bị break**
   ```typescript
   // ❌ Sai: Deserialize tạo instance mới!
   const obj = JSON.parse(JSON.stringify(singleton));
   // obj !== singleton → vi phạm Singleton
   ```

---

## 🎤 Interview Q&A

**Q: Singleton là gì? Khi nào dùng?**
> A: Singleton đảm bảo một class chỉ có một instance duy nhất trong app, với global access point. Dùng khi cần shared resource như logger, database connection pool, configuration manager.

**Q: Singleton khác gì global variable?**
> A: Global variable tạo ngay khi load, không kiểm soát được lifecycle. Singleton lazy-init, có thể control khi nào tạo và destroy. Ngoài ra, Singleton có thể implement interface → test được, global variable thì không.

**Q: Nhược điểm của Singleton là gì?**
> A: Vi phạm Single Responsibility Principle (vừa quản lý instance vừa làm nghiệp vụ), gây hidden dependencies, khó test vì hard coupling, và là global state — anti-pattern trong OOP. Nhiều người khuyên tránh Singleton, dùng Dependency Injection thay thế.

**Q: Làm sao test được code dùng Singleton?**
> A: Có vài cách: (1) Thay `getInstance()` bằng Dependency Injection — inject mock instance vào constructor. (2) Dùng Singleton với `reset()` method cho test. (3) Interface hóa Singleton rồi mock qua DI container.
