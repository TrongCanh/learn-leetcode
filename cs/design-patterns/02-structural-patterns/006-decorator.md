# 🎁 Decorator Pattern

## 🎯 Problem & Motivation

**Bài toán:** Bạn muốn thêm behavior mới vào object **lúc runtime**, mà **không sửa class gốc** và **không tạo subclass** cho mỗi behavior mới.

**Ví dụ:** Coffee shop — coffee base ($5), muốn thêm:
- Milk (+$1)
- Whipped cream (+$0.5)
- Chocolate (+$0.75)

Nếu dùng inheritance: `Coffee → MilkCoffee → MilkChocolateCoffee → MilkChocolateWhippedCoffee` → **class explosion**!

**Decorator giải quyết:** Wrap object trong decorator, decorator thêm behavior trước/sau khi gọi object gốc.

---

## 💡 Use Cases

1. **Coffee/Restaurant ordering system** — Thêm toppings, condiments dynamically
2. **UI Components** — Add borders, scrollbars, shadows vào components lúc runtime
3. **I/O Streams** — `BufferedInputStream(FileInputStream)` — wrap stream để thêm buffering
4. **Middleware / Logging / Auth** — Wrap handler để thêm logging, caching, rate limiting
5. **Taxi ride** — Base fare + distance + peak surcharge + tolls = total price

---

## ❌ Before (Không dùng Decorator)

```typescript
// ❌ Class explosion với inheritance!
abstract class Coffee {
  abstract cost(): number;
  abstract description(): string;
}

class SimpleCoffee extends Coffee {
  cost() { return 5; }
  description() { return 'Coffee'; }
}

// Thêm milk → tạo class mới
class MilkCoffee extends Coffee {
  constructor(private coffee: Coffee) { super(); }
  cost() { return this.coffee.cost() + 1; }
  description() { return this.coffee.description() + ', Milk'; }
}

// Thêm chocolate → lại tạo class mới!
class ChocolateMilkCoffee extends Coffee {
  // ⚠️ Phải extend MilkCoffee? Hay SimpleCoffee?
  // Nếu extend MilkCoffee → không dùng ChocolateCoffee được
  // Nếu extend SimpleCoffee → phải tự thêm milk cost
  constructor(private coffee: Coffee) { super(); }
  // ... lặp lại tất cả logic!
}

// Thêm 5 toppings? → 2^5 = 32 classes! 😱
```

→ **Vấn đề:** Class explosion. Mỗi combination cần class riêng. Nếu thêm topping mới → phải tạo class mới cho tất cả combinations.

---

## ✅ After (Dùng Decorator)

```typescript
// ─────────────────────────────────────────
// 1. Base Component (Interface)
// ─────────────────────────────────────────
interface Coffee {
  cost(): number;
  description(): string;
}

// ─────────────────────────────────────────
// 2. Concrete Component — Object gốc
// ─────────────────────────────────────────
class SimpleCoffee implements Coffee {
  cost(): number { return 5; }
  description(): string { return 'Coffee'; }
}

// ─────────────────────────────────────────
// 3. Base Decorator — wrap và delegate
// ─────────────────────────────────────────
abstract class CoffeeDecorator implements Coffee {
  constructor(protected coffee: Coffee) {}

  abstract cost(): number;
  abstract description(): string;
}

// ─────────────────────────────────────────
// 4. Concrete Decorators — thêm behavior
// ─────────────────────────────────────────
class MilkDecorator extends CoffeeDecorator {
  cost(): number { return this.coffee.cost() + 1; }
  description(): string { return this.coffee.description() + ', Milk'; }
}

class ChocolateDecorator extends CoffeeDecorator {
  cost(): number { return this.coffee.cost() + 0.75; }
  description(): string { return this.coffee.description() + ', Chocolate'; }
}

class WhippedCreamDecorator extends CoffeeDecorator {
  cost(): number { return this.coffee.cost() + 0.5; }
  description(): string { return this.coffee.description() + ', Whipped Cream'; }
}

class CaramelDecorator extends CoffeeDecorator {
  cost(): number { return this.coffee.cost() + 0.6; }
  description(): string { return this.coffee.description() + ', Caramel'; }
}

// ─────────────────────────────────────────
// 5. Client — kết hợp thoải mái lúc runtime!
// ─────────────────────────────────────────

// Simple
let order1 = new SimpleCoffee();
console.log(`${order1.description()} = $${order1.cost()}`);
// Coffee = $5

// Coffee + Milk + Chocolate
let order2 = new ChocolateDecorator(
  new MilkDecorator(new SimpleCoffee())
);
console.log(`${order2.description()} = $${order2.cost()}`);
// Coffee, Milk, Chocolate = $6.75

// Coffee + Milk + Chocolate + Whipped Cream + Caramel
let order3 = new CaramelDecorator(
  new WhippedCreamDecorator(
    new ChocolateDecorator(
      new MilkDecorator(new SimpleCoffee())
    )
  )
);
console.log(`${order3.description()} = $${order3.cost()}`);
// Coffee, Milk, Chocolate, Whipped Cream, Caramel = $7.85
```

→ **Cải thiện:** Thêm topping mới? Chỉ cần tạo một class `CinnamonDecorator`. Kết hợp với bao nhiêu topping cũng được — không cần class mới!

---

## 🏗️ UML Diagram

```
                    ┌────────────────────┐
                    │  <<interface>>     │
                    │      Coffee        │
                    ├────────────────────┤
                    │ +cost(): number    │
                    │ +description(): str│
                    └─────────┬──────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │ implements        │ extends           │
          ▼                   ▼                   ▼
┌─────────────────┐  ┌────────────────────┐  ┌─────────────────┐
│  SimpleCoffee   │  │ CoffeeDecorator    │  │  OtherCoffee   │
│  (Concrete)     │  │ (Abstract)        │  │  (Concrete)    │
├─────────────────┤  ├────────────────────┤  └─────────────────┘
│ +cost() = 5     │  │ #coffee: Coffee   │           ▲
│ +description() │  │ +cost(): number   │           │ extends
└─────────────────┘  └─────────┬──────────┘  ┌─────────┴──────────┐
                               │             │ MilkDecorator     │
                    ┌──────────┼──────────┐  │ ChocolateDecorator│
                    ▼          ▼          ▼  └───────────────────┘
              ┌─────────┐ ┌───────────┐ ┌────────────┐
              │  Milk   │ │ Chocolate │ │WhippedCream│
              └─────────┘ └───────────┘ └────────────┘
```

---

## 🔍 Step-by-step Trace

**Scenario:** Tính giá cho "Coffee + Milk + Whipped Cream"

```
Stack unwinding (từ trong ra ngoài):

Bước 1: SimpleCoffee
  cost() = 5
  description() = 'Coffee'

Bước 2: MilkDecorator(SimpleCoffee)
  cost() = SimpleCoffee.cost() + 1 = 5 + 1 = 6
  description() = SimpleCoffee.description() + ', Milk'
              = 'Coffee, Milk'

Bước 3: WhippedCreamDecorator(MilkDecorator(SimpleCoffee))
  cost() = MilkDecorator.cost() + 0.5 = 6 + 0.5 = 6.5
  description() = MilkDecorator.description() + ', Whipped Cream'
              = 'Coffee, Milk, Whipped Cream'

Final: Coffee, Milk, Whipped Cream = $6.50

→ Mỗi decorator chỉ thêm cost riêng của nó
→ Base cost + additions = total cost ✅
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Cách dùng Decorator |
|---------------------|---------------------|
| **Java I/O Streams** | `BufferedInputStream(FileInputStream)` — thêm buffering |
| **Java `@Transactional`** | Decorator annotation cho transaction management |
| **NestJS Middleware** | `UseInterceptors()`, `UseGuards()` — decorator wrapping |
| **Express middleware** | `app.use(auth())` wraps handler để thêm logic |
| **Python `@property`** | Decorator thay đổi method → property behavior |

---

## 📊 So sánh với Patterns liên quan

| Criteria | **Decorator** | Proxy | Composite |
|----------|--------------|-------|----------|
| Mục đích | Thêm behavior lúc runtime | Kiểm soát access | Tree structure |
| Wrapper có cùng interface? | ✅ Cùng interface | ✅ Cùng interface | ✅ Cùng interface |
| Thay đổi behavior | Thêm/chỉnh behavior gốc | Kiểm soát access, không thay đổi behavior | Duyệt tree |
| Multiple decorators | ✅ Stack được | ❌ Thường chỉ 1 proxy | ❌ Không áp dụng |

---

## 💻 TypeScript Implementation

```typescript
// ─────────────────────────────────────────
// Example: HTTP Middleware / Request Pipeline
// ─────────────────────────────────────────

interface HttpHandler {
  handle(request: HttpRequest): HttpResponse;
}

class HttpRequest {
  constructor(
    public url: string,
    public method: string,
    public headers: Record<string, string> = {},
    public body?: any
  ) {}
}

class HttpResponse {
  constructor(
    public status: number,
    public body: any,
    public headers: Record<string, string> = {}
  ) {}
}

// Base handler
class EchoHandler implements HttpHandler {
  handle(req: HttpRequest): HttpResponse {
    return new HttpResponse(200, { echo: req.body });
  }
}

// Base Decorator
abstract class MiddlewareDecorator implements HttpHandler {
  constructor(protected next: HttpHandler) {}

  abstract handle(request: HttpRequest): HttpResponse;
}

// Concrete Middlewares
class LoggingMiddleware extends MiddlewareDecorator {
  handle(req: HttpRequest): HttpResponse {
    console.log(`📝 [LOG] ${req.method} ${req.url}`);
    const response = this.next.handle(req);
    console.log(`📝 [LOG] Response ${response.status}`);
    return response;
  }
}

class AuthMiddleware extends MiddlewareDecorator {
  handle(req: HttpRequest): HttpResponse {
    if (!req.headers['Authorization']) {
      return new HttpResponse(401, { error: 'Unauthorized' });
    }
    return this.next.handle(req);
  }
}

class CorsMiddleware extends MiddlewareDecorator {
  handle(req: HttpRequest): HttpResponse {
    const response = this.next.handle(req);
    response.headers['Access-Control-Allow-Origin'] = '*';
    return response;
  }
}

class RateLimitMiddleware extends MiddlewareDecorator {
  private requests = new Map<string, number[]>();

  handle(req: HttpRequest): HttpResponse {
    const key = req.url;
    const now = Date.now();
    const window = this.requests.get(key) ?? [];

    const recent = window.filter(t => now - t < 60000);
    if (recent.length >= 10) {
      return new HttpResponse(429, { error: 'Too many requests' });
    }

    recent.push(now);
    this.requests.set(key, recent);
    return this.next.handle(req);
  }
}

// Chain middleware
const handler = new RateLimitMiddleware(
  new CorsMiddleware(
    new AuthMiddleware(
      new LoggingMiddleware(
        new EchoHandler()
      )
    )
  )
);

handler.handle(new HttpRequest('/api/users', 'GET', {
  'Authorization': 'Bearer token123'
}));
```

---

## 📝 LeetCode Problems áp dụng

- [Serialize and Deserialize BST](https://leetcode.com/problems/serialize-and-deserialize-bst/) — decorator wrapping node operations
- Không có bài LeetCode nào dành riêng cho Decorator, nhưng pattern xuất hiện trong OOD interviews: thiết kế Starbucks ordering, Text Editor với formatting layers, Cloud storage với compression/encryption decorators.

---

## ✅ Pros / ❌ Cons

**Ưu điểm:**
- ✅ **Open/Closed** — thêm behavior mới mà không sửa class gốc hoặc subclass
- ✅ **Single Responsibility** — mỗi decorator là một class nhỏ, một responsibility
- ✅ **Composition linh hoạt** — stack decorators theo bất kỳ combination nào lúc runtime
- ✅ **Thay thế Inheritance** — tránh class explosion

**Nhược điểm:**
- ❌ **Hard to debug** — stack of decorators phức tạp, khó trace execution flow
- ❌ **Order matters** — thứ tự decorators có thể ảnh hưởng kết quả (auth trước hay logging trước?)
- ❌ **Many small objects** — nhiều decorator classes → complexity tăng
- ❌ **Identical interface có thể gây confusion** — client khó phân biệt decorator vs component

---

## ⚠️ Khi nào nên / không nên dùng

**Nên dùng khi:**
- ✅ Cần thêm behavior **lúc runtime** (không biết lúc compile)
- ✅ Có **nhiều independent behaviors** có thể kết hợp tùy ý
- ✅ Muốn **tránh class explosion** từ inheritance
- ✅ Cần **middleware pipeline** (logging, auth, caching, validation)

**Không nên dùng khi:**
- ❌ Behavior cố định lúc compile — dùng inheritance cho đơn giản
- ❌ Chỉ cần **kiểm soát access** — dùng **Proxy**
- ❌ Decorator stack quá sâu (>5 layers) — design có vấn đề

---

## 🚫 Common Mistakes / Pitfalls

1. **Decorator không delegate đúng cách**
   ```typescript
   // ❌ Sai: Quên gọi this.next hoặc gọi sai thứ tự
   class BadMiddleware extends MiddlewareDecorator {
     handle(req: HttpRequest): HttpResponse {
       // ❌ Quên delegate! Request không được xử lý
       return new HttpResponse(200, {});
     }
   }

   // ✅ Đúng: Luôn delegate xuống next
   class GoodMiddleware extends MiddlewareDecorator {
     handle(req: HttpRequest): HttpResponse {
       // Thêm behavior TRƯỚC hoặc SAU delegate tùy use case
       console.log('Before');
       const response = this.next.handle(req); // ✅ Delegate
       console.log('After');
       return response;
     }
   }
   ```

2. **Stack decorators quá sâu**
   ```typescript
   // ❌ Quá 10 decorators nested — khó debug và maintain
   const r = new D10(new D9(new D8(...(new D1(base))...)));

   // ✅ Đúng: Maximum 3-5 decorators, nếu nhiều hơn → chia thành groups
   ```

---

## 🎤 Interview Q&A

**Q: Decorator Pattern là gì? Khi nào dùng?**
> A: Decorator wrap một object trong decorator object để thêm behavior lúc runtime mà không sửa class gốc. Mỗi decorator implement cùng interface với object gốc, thêm behavior trước/sau khi delegate. Dùng khi cần kết hợp nhiều independent behaviors (toppings, middleware, formatting layers) và muốn tránh class explosion từ inheritance.

**Q: Decorator khác Proxy như thế nào?**
> A: Proxy kiểm soát **access** đến object (lazy load, auth, caching) — object gốc và proxy giống nhau về behavior. Decorator thêm **behavior mới** — object wrapped có thêm chức năng so với gốc. Nói đơn giản: Proxy là "cửa ngõ kiểm soát vào", Decorator là "lắp thêm phụ kiện vào".

**Q: Khi nào dùng Decorator thay vì Inheritance?**
> A: Khi số lượng behavior combinations lớn (n behaviors → 2^n subclasses nếu dùng inheritance), hoặc khi behavior được thêm/bớt **lúc runtime**. Dùng inheritance khi behavior cố định và hierarchy đơn giản.
