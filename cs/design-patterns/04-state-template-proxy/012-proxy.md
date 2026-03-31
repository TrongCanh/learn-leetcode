# 🛡️ Proxy Pattern

## 🎯 Problem & Motivation

**Bài toán thực tế:** Bạn cần **kiểm soát access** đến một object — nhưng không muốn client biết object thực sự là gì. Hoặc cần thêm logic **trước/sau** khi gọi object mà không sửa object gốc.

**Ví dụ thực tế:**
- **Credit Card** → Proxy cho cash (access control)
- **Door lock** → Proxy cho door (kiểm soát access)
- **Lazy loading** → Proxy load ảnh nặng (chỉ load khi cần)
- **Caching** → Proxy lưu response để không gọi lại API
- **Authentication** → Proxy kiểm tra token trước khi gọi service

```typescript
// ❌ Client gọi trực tiếp object thật — không kiểm soát được
class ExpensiveService {
  loadData(): string {
    console.log('💾 Loading heavy data from disk...');
    return '...large data...';
  }
}

// Mỗi lần gọi đều load lại — không caching
// Không access control, không logging
// Client phụ thuộc vào object thật
```

→ **Hậu quả:** Mọi cross-cutting concerns (caching, auth, logging) phải implement trong Client hoặc Service → violate Single Responsibility.

**Proxy giải quyết:** Tạo một object **thay thế** (proxy) cho object thật. Client gọi Proxy, Proxy kiểm soát access, sau đó delegate sang RealSubject.

---

## 💡 Use Cases

1. **Lazy Initialization (Virtual Proxy)** — Load heavy resource chỉ khi cần (VD: ảnh trên trang web)
2. **Access Control (Protection Proxy)** — Kiểm tra quyền trước khi gọi service (VD: Auth middleware)
3. **Caching (Cache Proxy)** — Cache response để tránh gọi API/DB nhiều lần
4. **Remote Object (Remote Proxy)** — Stub gọi remote service như local object (VD: gRPC client)
5. **Logging / Monitoring** — Log mọi calls đến object thật
6. **Rate Limiting** — Giới hạn số lần gọi API

---

## ❌ Before (Không dùng Proxy)

```typescript
// ❌ Client phải tự xử lý tất cả cross-cutting concerns
class UserService {
  async getUser(id: string) {
    // ⚠️ Access control? Thêm vào đây?
    if (!this.isAuthenticated()) {
      throw new Error('Unauthorized');
    }

    // ⚠️ Logging? Thêm vào đây?
    console.log(`📝 GET /api/users/${id}`);

    // ⚠️ Caching? Thêm vào đây?
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    // ⚠️ Rate limiting? Thêm vào đây?
    if (this.rateLimiter.isExceeded()) {
      throw new Error('Rate limit exceeded');
    }

    const result = await this.database.query(`SELECT * FROM users WHERE id = ?`, [id]);
    this.cache.set(id, result);
    return result;
  }
}
// ⚠️ Một method làm quá nhiều thứ!
```

→ **Hậu quả:** Single Responsibility vi phạm. Logic trùng lặp ở mọi method. Khó test từng concern riêng.

---

## ✅ After (Dùng Proxy)

```typescript
// ─────────────────────────────────────────
// 1. Subject Interface — contract cho RealSubject và Proxy
// ─────────────────────────────────────────
interface DataService {
  getData(key: string): string;
  saveData(key: string, value: string): void;
}

// ─────────────────────────────────────────
// 2. RealSubject — Object thật, heavy
// ─────────────────────────────────────────
class RealDataService implements DataService {
  getData(key: string): string {
    console.log(`💾 [RealService] Loading data for: "${key}"`);
    return `Data for ${key} (loaded from DB)`;
  }

  saveData(key: string, value: string): void {
    console.log(`💾 [RealService] Saving: ${key} = ${value}`);
  }
}

// ─────────────────────────────────────────
// 3. Proxy Types — kiểm soát access theo cách khác nhau
// ─────────────────────────────────────────

// 3a. Protection Proxy — Access Control
class AccessControlProxy implements DataService {
  constructor(
    private realService: DataService,
    private userRole: string
  ) {}

  getData(key: string): string {
    console.log(`🔐 [AccessProxy] User role: ${this.userRole}`);
    if (this.userRole !== 'admin' && key.startsWith('admin_')) {
      console.log('❌ [AccessProxy] Access denied!');
      return 'Access Denied';
    }
    return this.realService.getData(key);
  }

  saveData(key: string, value: string): void {
    if (this.userRole !== 'admin') {
      console.log('❌ [AccessProxy] Write denied!');
      return;
    }
    this.realService.saveData(key, value);
  }
}

// 3b. Caching Proxy — Tránh gọi lại
class CachingProxy implements DataService {
  constructor(private realService: DataService) {}

  private cache = new Map<string, string>();
  private cacheTime = new Map<string, number>();
  private readonly TTL_MS = 5000; // 5 seconds

  getData(key: string): string {
    const cached = this.cache.get(key);
    const cachedTime = this.cacheTime.get(key);

    if (cached !== undefined && cachedTime !== undefined) {
      const age = Date.now() - cachedTime;
      if (age < this.TTL_MS) {
        console.log(`⚡ [CacheProxy] HIT for "${key}" (age: ${age}ms)`);
        return cached;
      }
      console.log(`⏰ [CacheProxy] EXPIRED for "${key}"`);
    }

    const result = this.realService.getData(key);
    this.cache.set(key, result);
    this.cacheTime.set(key, Date.now());
    console.log(`💾 [CacheProxy] MISS → fetched and cached`);
    return result;
  }

  saveData(key: string, value: string): void {
    this.realService.saveData(key, value);
    this.cache.delete(key); // Invalidate cache on write
    this.cacheTime.delete(key);
  }
}

// 3c. Logging Proxy — Monitor calls
class LoggingProxy implements DataService {
  constructor(private realService: DataService) {}

  getData(key: string): string {
    const start = Date.now();
    console.log(`📝 [LoggingProxy] GET "${key}" at ${new Date().toISOString()}`);

    const result = this.realService.getData(key);

    const duration = Date.now() - start;
    console.log(`📝 [LoggingProxy] GET completed in ${duration}ms`);

    return result;
  }

  saveData(key: string, value: string): void {
    console.log(`📝 [LoggingProxy] SET "${key}" = "${value}"`);
    this.realService.saveData(key, value);
  }
}

// ─────────────────────────────────────────
// 4. Client — gọi qua Proxy, không biết RealSubject
// ─────────────────────────────────────────

// Case 1: Access control
console.log('=== Access Control ===');
const userProxy = new AccessControlProxy(new RealDataService(), 'user');
console.log(userProxy.getData('public_data'));
// 🔐 User role: user
// 💾 [RealService] Loading...

const adminProxy = new AccessControlProxy(new RealDataService(), 'admin');
console.log(adminProxy.getData('admin_config'));
// 🔐 User role: admin
// 💾 [RealService] Loading...

// Case 2: Caching
console.log('\n=== Caching ===');
const cachedProxy = new CachingProxy(new RealDataService());
console.log(cachedProxy.getData('user_profile'));
// 💾 [RealService] Loading... → MISS
console.log(cachedProxy.getData('user_profile'));
// ⚡ [CacheProxy] HIT (age: 50ms) → RealService không được gọi!

// Case 3: Chain proxies — Logging → Caching → Access → Real
console.log('\n=== Chained Proxies ===');
const chained = new LoggingProxy(
  new CachingProxy(
    new AccessControlProxy(new RealDataService(), 'admin')
  )
);
chained.getData('config');
```

---

## 🏗️ UML Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ calls
       ▼
┌──────────────────────┐
│  <<interface>>      │
│    Subject           │
├──────────────────────┤
│ +getData()            │
│ +saveData()            │
└──────────┬───────────┘
           │ implements
           │               ┌────────────────────────┐
           │               │   RealSubject          │
           │               │  (RealDataService)      │
           │               ├────────────────────────┤
           │               │ +getData()              │
           │               │ +saveData()              │
           │               └────────────────────────┘
           │                         ▲
           │               ┌──────────┴──────────┐
           ▼               │ (stores reference)
┌──────────────────────┐ │
│        Proxy           │ │
│ (Caching/Protection/ │─┘
│   LoggingProxy)      │
├──────────────────────┤
│ +getData()            │
│   → control logic    │
│   → real.getData()   │
└──────────────────────┘
```

---

## 🔍 Step-by-step Trace

**Scenario:** CachedProxy.getData('user') — cache hit.

```
Bước 1: cachedProxy.getData('user')
  → CachingProxy.getData('user')

Bước 2: Kiểm tra cache
  → cache.has('user')? YES
  → cacheTime.get('user') = T1
  → age = now - T1 = 50ms < 5000ms? → TRUE
  → ✅ HIT!

Bước 3: Return cached value
  → ⚡ [CacheProxy] HIT (age: 50ms)
  → return "Data for user (loaded from DB)"
  → RealService.getData() KHÔNG được gọi!

Kết quả: O(1) hash lookup thay vì heavy operation
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Chi tiết implementation |
|--------------------|------------------------|
| **Hibernate Lazy Loading** | Proxy trả về object placeholder, load thực khi accessed |
| **Spring AOP** | `@Transactional`, `@Cacheable` dùng proxy |
| **Prisma ORM** | Generated client = proxy cho database |
| **GraphQL DataLoader** | Batch + cache = proxy pattern |
| **CDN (Cloudflare)** | Proxy server cache static assets |
| **API Gateway** | Proxy kiểm soát auth, rate limit, caching |

---

## 📊 So sánh với Patterns liên quan

| Criteria | **Proxy** | Decorator | Adapter |
|----------|----------|-----------|---------|
| Mục đích | Kiểm soát **access** | Thêm **behavior** | Đổi **interface** |
| Cùng interface? | ✅ Cùng interface | ✅ Cùng interface | ✅ Cùng interface |
| Khi nào hoạt động | Trước/sau access | Trước/sau behavior | Khi interfaces không tương thích |
| Object thật bị thay đổi? | ❌ Không | ❌ Không | ❌ Không |
| Cache/Auth/Logging | ✅ Proxy | ❌ Decorator | ❌ Adapter |

---

## 💻 TypeScript Implementation

### Version 1: Image Lazy Loading Proxy

```typescript
interface Image {
  display(): void;
}

class RealImage implements Image {
  constructor(private filename: string) {
    console.log(`💾 [RealImage] Loading "${filename}" from disk...`);
  }

  display(): void {
    console.log(`🖼️  [RealImage] Displaying "${this.filename}"`);
  }
}

class ImageProxy implements Image {
  private realImage: RealImage | null = null;

  constructor(private filename: string) {
    // Lightweight: chỉ lưu filename, chưa load gì!
    console.log(`📦 [Proxy] Placeholder created for "${filename}"`);
  }

  display(): void {
    // Lazy load — chỉ load khi thực sự cần display
    if (!this.realImage) {
      this.realImage = new RealImage(this.filename);
    }
    this.realImage.display();
  }
}

// Usage
console.log('Creating proxy (no loading yet)...');
const img = new ImageProxy('photo_1.jpg');
// 📦 [Proxy] Placeholder created

console.log('\nDisplaying first time (loads now)...');
img.display();
// 💾 [RealImage] Loading "photo_1.jpg" from disk...
// 🖼️  [RealImage] Displaying "photo_1.jpg"

console.log('\nDisplaying second time (cached!)...');
img.display();
// 🖼️  [RealImage] Displaying "photo_1.jpg" (RealImage đã load rồi)
```

---

## ⚖️ Trade-offs & Common Mistakes

### ✅ Khi nào nên dùng

- ✅ Cần **access control** (auth, rate limit)
- ✅ Cần **lazy loading** resource nặng
- ✅ Cần **caching** response
- ✅ Cần **logging/metrics** cho object mà không sửa object

### ❌ Khi nào không nên dùng

- ❌ Không cần kiểm soát access — dùng object trực tiếp
- ❌ Proxy quá nhiều layers — complexity tăng
- ❌ Cần thêm behavior mới — dùng **Decorator**

### 🚫 Common Mistakes

**1. Proxy thêm behavior thay vì kiểm soát access**
```typescript
// ❌ Sai: Proxy thêm business logic
class BadProxy implements Service {
  doSomething() {
    this.processBusinessLogic(); // ❌ Đây là Decorator, không phải Proxy!
    this.realService.doSomething();
  }
}

// ✅ Đúng: Proxy chỉ kiểm soát access (auth, cache, log)
class GoodProxy implements Service {
  doSomething() {
    if (!this.isAuthorized()) return; // ✅ Access control
    if (this.cache.has()) return;   // ✅ Caching
    this.realService.doSomething();   // ✅ Delegate
  }
}
```

**2. Quên cache invalidation on write**
```typescript
// ❌ Sai: save() không invalidate cache
saveData(key, value) {
  this.realService.saveData(key, value);
  // ❌ Cache vẫn chứa stale data!
}

// ✅ Đúng: Save → invalidate cache
saveData(key, value) {
  this.realService.saveData(key, value);
  this.cache.delete(key); // ✅ Invalidate
}
```

---

## 🧪 Testing Strategies

```typescript
describe('Proxy Pattern', () => {
  it('should cache repeated calls', () => {
    let callCount = 0;
    const mockService = {
      getData: jest.fn(() => { callCount++; return 'result'; })
    };

    const cached = new CachingProxy(mockService as any);

    cached.getData('key');
    cached.getData('key');
    cached.getData('key');

    expect(callCount).toBe(1); // Chỉ gọi 1 lần!
  });

  it('should deny access for non-admin', () => {
    const proxy = new AccessControlProxy(new RealDataService(), 'user');
    const result = proxy.getData('admin_secret');
    expect(result).toBe('Access Denied');
  });

  it('should allow access for admin', () => {
    const proxy = new AccessControlProxy(new RealDataService(), 'admin');
    const result = proxy.getData('admin_secret');
    expect(result).not.toBe('Access Denied');
  });
});
```

---

## 🔄 Refactoring Path

**Từ Mixed Concerns → Proxy:**

```typescript
// ❌ Before: UserService làm mọi thứ
class BadUserService {
  async getUser(id: string) {
    if (!this.auth()) throw new Error('Auth');
    if (this.cache.has(id)) return this.cache.get(id);
    const result = await this.db.query(id);
    this.cache.set(id, result);
    this.log(id);
    return result;
  }
}

// ✅ After: Proxy xử lý cross-cutting concerns
class GoodUserService implements DataService {
  getData(id: string) {
    return this.realService.getData(id);
  }
}

// Cross-cutting concerns ở proxy
const proxy = new LoggingProxy(
  new CachingProxy(
    new AccessControlProxy(new GoodUserService(), role)
  )
);
```

---

## 🎤 Interview Q&A

**Q: Proxy Pattern là gì? Khi nào dùng?**
> A: Proxy là object thay thế cho object thật, kiểm soát access trước khi delegate. Client gọi Proxy như gọi RealSubject. Có 4 loại: (1) Remote Proxy — gọi remote service như local. (2) Virtual/Lazy Proxy — load resource nặng khi cần. (3) Protection Proxy — kiểm tra quyền truy cập. (4) Caching Proxy — lưu response để tránh gọi lại. Proxy chỉ kiểm soát access; Decorator thêm behavior.

**Q: Proxy khác Decorator như thế nào?**
> A: Proxy kiểm soát **access** — ai được gọi, bao nhiêu lần, có cache không. Decorator thêm **behavior** — thêm chức năng vào object. Về mặt structure giống nhau (cùng interface, wraps object), nhưng **mục đích** khác nhau. Proxy giống "cửa ngõ kiểm soát vào"; Decorator giống "lắp thêm phụ kiện vào".

**Q: Proxy có phải là man-in-the-middle không?**
> A: Không. Proxy hoạt động **với sự cho phép** của cả client và service. Nó không ăn cắp data mà kiểm soát access theo business logic (auth, caching, logging). Man-in-the-middle là security attack, Proxy là design pattern có mục đích hợp lệ.
