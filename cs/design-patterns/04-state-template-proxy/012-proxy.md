# 🛡️ Proxy Pattern

## 🎯 Problem & Motivation

**Bài toán:** Bạn cần **kiểm soát access** đến một object — nhưng không muốn client biết object thực sự là gì. Hoặc cần thêm logic **trước/sau** khi gọi object mà không sửa object gốc.

**Ví dụ thực tế:**
- **Credit Card** → Proxy cho cash (access control)
- **Door lock** → Proxy cho door (kiểm soát access)
- **Lazy loading** → Proxy load ảnh nặng (chỉ load khi cần)
- **Caching** → Proxy lưu response để không gọi lại API
- **Authentication** → Proxy kiểm tra token trước khi gọi service

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
// ❌ Client phải biết và gọi trực tiếp object thật
class ExpensiveService {
  loadData(): string {
    console.log('💾 Loading heavy data from disk...');
    return '...large data...';
  }
}

class Client {
  fetchData() {
    const service = new ExpensiveService();
    // ❌ Mỗi lần gọi đều load lại — không caching
    // ❌ Không access control
    // ❌ Không logging
    // ❌ Client phải biết ExpensiveService là gì
    return service.loadData();
  }
}
```

→ **Vấn đề:** Client phụ thuộc vào object thật. Mọi cross-cutting concerns (caching, auth, logging) phải implement trong Client hoặc Service.

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
  private data: Map<string, string> = new Map();

  getData(key: string): string {
    console.log(`💾 [RealService] Loading data for key: "${key}"`);
    // Heavy operation: DB call, disk read, API call...
    return `Data for ${key}`;
  }

  saveData(key: string, value: string): void {
    console.log(`💾 [RealService] Saving data: ${key} = ${value}`);
    this.data.set(key, value);
  }
}

// ─────────────────────────────────────────
// 3. Proxy Types — kiểm soát access theo cách khác nhau
// ─────────────────────────────────────────

// 3a. Protection Proxy — Access Control
class AccessControlProxy implements DataService {
  constructor(
    private realService: RealDataService,
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
      console.log('❌ [AccessProxy] Write permission denied!');
      return;
    }
    this.realService.saveData(key, value);
  }
}

// 3b. Caching Proxy — Tránh gọi lại
class CachingProxy implements DataService {
  constructor(private realService: RealDataService) {}

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
    // Invalidate cache
    this.cache.delete(key);
    this.cacheTime.delete(key);
  }
}

// 3c. Logging Proxy — Monitor calls
class LoggingProxy implements DataService {
  constructor(private realService: RealDataService) {}

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
const accessProxy = new AccessControlProxy(new RealDataService(), 'user');
console.log(accessProxy.getData('public_data'));
// 🔐 User role: user
// 💾 Loading... → Access Denied cho admin_* keys

console.log('---');
const adminProxy = new AccessControlProxy(new RealDataService(), 'admin');
console.log(adminProxy.getData('admin_config'));

// Case 2: Caching
console.log('\n=== Caching ===');
const cachedProxy = new CachingProxy(new RealDataService());
console.log(cachedProxy.getData('user_profile'));
// 💾 [RealService] Loading... → MISS
console.log(cachedProxy.getData('user_profile'));
// ⚡ [CacheProxy] HIT (age: 2ms) → không gọi RealService!

// Case 3: Chain proxies
console.log('\n=== Chained Proxies ===');
const chained = new LoggingProxy(
  new CachingProxy(
    new AccessControlProxy(new RealDataService(), 'admin')
  )
);
chained.getData('config');
```

→ **Cải thiện:** Client gọi Proxy mà không biết RealSubject. Caching, Access Control, Logging hoàn toàn tách biệt. Có thể chain proxies.

---

## 🏗️ UML Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ uses
       ▼
┌──────────────────────┐         ┌────────────────────────┐
│  <<interface>>       │         │   RealSubject          │
│    Subject           │         │ (RealDataService)      │
├──────────────────────┤         ├────────────────────────┤
│ +request()           │         │ +request()             │
└──────────┬───────────┘         └────────────────────────┘
           │ implements                    ▲
           │                               │
           │              ┌─────────────────┘
           ▼              │ (stores reference)
┌──────────────────────┐  │
│        Proxy         │──┘
│  (Caching/Protection/│
│   LoggingProxy)      │
├──────────────────────┤
│ +request()           │
│   → control (cache, │
│     auth, log...)    │
│   → real.request()  │
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
  → age = now - T1 < 5000ms?
  → TRUE → HIT!

Bước 3: Return cached value
  → ⚡ [CacheProxy] HIT for "user" (age: 50ms)
  → return "Data for user"
  → RealService.getData() KHÔNG được gọi!

→ Performance: O(1) hash lookup thay vì heavy operation
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Cách dùng Proxy |
|--------------------|-----------------|
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

```typescript
// ─────────────────────────────────────────
// Example: Image Lazy Loading Proxy
// ─────────────────────────────────────────

interface Image {
  display(): void;
}

class RealImage implements Image {
  constructor(private filename: string) {
    // Heavy: load from disk/network
    console.log(`💾 [RealImage] Loading "${filename}"...`);
  }

  display(): void {
    console.log(`🖼️  [RealImage] Displaying "${this.filename}"`);
  }
}

class ImageProxy implements Image {
  private realImage: RealImage | null = null;

  constructor(private filename: string) {
    // Lightweight: chỉ lưu filename, chưa load gì cả!
    console.log(`📦 [Proxy] Image placeholder created for "${filename}"`);
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
const img1 = new ImageProxy('photo_1.jpg');

console.log('\nDisplaying first time (loads now)...');
img1.display();

console.log('\nDisplaying second time (cached!)...');
img1.display();
```

---

## 📝 LeetCode Problems áp dụng

- [Design HashMap](https://leetcode.com/problems/design-hashmap/) — Caching Proxy: lưu key→value
- [Design Add and Search Words Data Structure](https://leetcode.com/problems/design-add-and-search-words-data-structure/) — Proxy wrapper
- [LRU Cache](https://leetcode.com/problems/lru-cache/) — Cache = Proxy

---

## ✅ Pros / ❌ Cons

**Ưu điểm:**
- ✅ **Access control** — kiểm soát ai được gọi, bao nhiêu lần
- ✅ **Lazy loading** — load resource nặng chỉ khi cần
- ✅ **Caching** — tránh gọi lại, tăng performance
- ✅ **Cross-cutting concerns** — logging, auth, metrics — không cần sửa object gốc
- ✅ **Client tách biệt** — không biết RealSubject

**Nhược điểm:**
- ❌ **Overkill** — nếu không cần access control, proxy thừa
- ❌ **Response latency** — thêm layer → thêm độ trễ nhỏ
- ❌ **Complexity** — nhiều proxy layers → khó debug

---

## ⚠️ Khi nào nên / không nên dùng

**Nên dùng khi:**
- ✅ Cần **access control** (auth, rate limit)
- ✅ Cần **lazy loading** resource nặng
- ✅ Cần **caching** response
- ✅ Cần **logging/metrics** cho object mà không sửa object

**Không nên dùng khi:**
- ❌ Không cần kiểm soát access — dùng object trực tiếp
- ❌ Proxy quá nhiều layers — complexity tăng
- ❌ Cần thêm behavior mới — dùng **Decorator**

---

## 🚫 Common Mistakes / Pitfalls

1. **Proxy thay đổi behavior — không phải kiểm soát access**
   ```typescript
   // ❌ Sai: Proxy thêm logic nghiệp vụ thay vì kiểm soát access
   class BadProxy implements Service {
     doSomething() {
       // ❌ Thêm business logic! Đây là Decorator, không phải Proxy!
       this.processBusinessLogic();
       this.realService.doSomething();
     }
   }

   // ✅ Đúng: Proxy chỉ kiểm soát access (auth, cache, log)
   class GoodProxy implements Service {
     doSomething() {
       if (!this.isAuthorized()) return;  // Access control ✅
       if (this.cache.has()) return;      // Caching ✅
       this.realService.doSomething();     // Delegate
     }
   }
   ```

2. **Quên cache invalidation**
   ```typescript
   // ❌ Sai: Caching nhưng save() không invalidate cache
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

## 🎤 Interview Q&A

**Q: Proxy Pattern là gì? Khi nào dùng?**
> A: Proxy là object thay thế cho object thật, kiểm soát access trước khi delegate. Client gọi Proxy như gọi RealSubject. Có 4 loại: (1) Remote Proxy — gọi remote service như local. (2) Virtual/Lazy Proxy — load resource nặng khi cần. (3) Protection Proxy — kiểm tra quyền truy cập. (4) Caching Proxy — lưu response để tránh gọi lại.

**Q: Proxy khác Decorator như thế nào?**
> A: Proxy kiểm soát **access** — ai được gọi, bao nhiêu lần, có cache không. Decorator thêm **behavior** — thêm chức năng vào object. Về mặt structure giống nhau (cùng interface, wraps object), nhưng **mục đích** khác nhau.

**Q: Proxy có phải là man-in-the-middle không?**
> A: Không. Proxy hoạt động **với sự cho phép** của cả client và service. Nó không偷窃 data mà kiểm soát access theo đúng business logic (auth, caching, logging). Man-in-the-middle là security attack, Proxy là design pattern có mục đích hợp lệ.
