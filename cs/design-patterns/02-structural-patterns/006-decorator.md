# 🎁 Decorator Pattern

## 🎯 Problem & Motivation

**Bài toán thực tế:** Bạn muốn thêm behavior mới vào object **lúc runtime**, mà **không sửa class gốc** và **không tạo subclass** cho mỗi behavior mới.

**Ví dụ thực tế:** Coffee shop — coffee base ($5), muốn thêm:
- Milk (+$1)
- Whipped cream (+$0.5)
- Chocolate (+$0.75)
- Caramel (+$0.6)

Nếu dùng inheritance: `Coffee → MilkCoffee → MilkChocolateCoffee → MilkChocolateWhippedCoffee → MilkChocolateWhippedCaramelCoffee` → **2^n classes**!

```typescript
// ❌ Class explosion với inheritance!
class Coffee {}
class MilkCoffee extends Coffee {}
class ChocolateCoffee extends Coffee {}
class MilkChocolateCoffee extends Coffee {}
// 4 toppings → 2^4 = 16 classes! 😱
```

→ **Hậu quả:** Class explosion. Mỗi combination cần class riêng. Thêm topping mới → phải tạo class mới cho **tất cả combinations**.

**Decorator giải quyết:** Wrap object trong decorator, decorator thêm behavior trước/sau khi delegate đến object gốc.

---

## 💡 Use Cases

1. **Coffee/Restaurant ordering** — Thêm toppings, condiments dynamically, mỗi topping có giá
2. **UI Components** — Add borders, scrollbars, shadows, validation vào component lúc runtime
3. **I/O Streams** — `BufferedInputStream(FileInputStream)` — wrap stream để thêm buffering
4. **Middleware / Logging / Auth** — Wrap handler để thêm logging, caching, rate limiting
5. **Taxi ride** — Base fare + distance surcharge + peak + tolls = total
6. **Encryption/Compression** — Wrap data với compression → encryption → signature

---

## ❌ Before (Không dùng Decorator)

```typescript
// ❌ Mỗi combination = một class riêng!
abstract class Coffee {
  abstract cost(): number;
  abstract description(): string;
}

class SimpleCoffee extends Coffee {
  cost() { return 5; }
  description() { return 'Coffee'; }
}

// Thêm milk
class MilkCoffee extends Coffee {
  constructor(private coffee: Coffee) { super(); }
  cost() { return this.coffee.cost() + 1; }
  description() { return this.coffee.description() + ', Milk'; }
}

// Thêm chocolate → lại class riêng!
class MilkChocolateCoffee extends Coffee {
  constructor(private coffee: Coffee) { super(); }
  cost() { return this.coffee.cost() + 0.75; }
  description() { return this.coffee.description() + ', Chocolate'; }
}

// 4 toppings → 16 classes
// 5 toppings → 32 classes
// ⚠️ Thêm topping mới? Tạo class mới cho TẤT CẢ combinations!
```

---

## ✅ After (Dùng Decorator)

```typescript
// ─────────────────────────────────────────
// 1. Component Interface — contract cho object gốc và decorators
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
// 3. Base Decorator — wrap và delegate (không thêm behavior)
// ─────────────────────────────────────────
abstract class CoffeeDecorator implements Coffee {
  constructor(protected coffee: Coffee) {}

  cost(): number { return this.coffee.cost(); }
  description(): string { return this.coffee.description(); }
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
let coffee1 = new SimpleCoffee();
console.log(`${coffee1.description()} = $${coffee1.cost()}`);
// Coffee = $5

// Coffee + Milk + Chocolate
let coffee2 = new ChocolateDecorator(
  new MilkDecorator(new SimpleCoffee())
);
console.log(`${coffee2.description()} = $${coffee2.cost()}`);
// Coffee, Milk, Chocolate = $6.75

// Coffee + Milk + Chocolate + Whipped Cream + Caramel
let coffee3 = new CaramelDecorator(
  new WhippedCreamDecorator(
    new ChocolateDecorator(
      new MilkDecorator(new SimpleCoffee())
    )
  )
);
console.log(`${coffee3.description()} = $${coffee3.cost()}`);
// Coffee, Milk, Chocolate, Whipped Cream, Caramel = $7.85
```

---

## 🏗️ UML Diagram

```
                    ┌────────────────────┐
                    │  <<interface>>     │
                    │      Coffee        │
                    ├────────────────────┤
                    │ +cost(): number    │
                    │ +description(): str │
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
│ +description()  │  │ +cost()           │           │ extends
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

**Scenario:** Tính giá "Coffee + Milk + Whipped Cream"

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

→ Mỗi decorator chỉ thêm cost/description riêng của nó
→ Base cost + additions = total ✅
→ Không cần class riêng cho mỗi combination!
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Chi tiết implementation |
|---------------------|------------------------|
| **Java I/O Streams** | `BufferedInputStream(FileInputStream)` — thêm buffering |
| **NestJS Middleware** | `UseInterceptors()`, `UseGuards()` — decorator wrapping |
| **Express middleware** | `app.use(auth())` wraps handler để thêm logic |
| **Python decorators** | `@property`, `@staticmethod`, `@cache` |
| **Java `@Transactional`** | Decorator annotation cho transaction management |
| **AWS Lambda middleware** | Wrapper chain: logger → authenticator → handler |

---

## 📊 So sánh với Patterns liên quan

| Criteria | **Decorator** | Proxy | Composite |
|----------|--------------|-------|----------|
| Mục đích | Thêm behavior lúc runtime | Kiểm soát access | Tree structure |
| Wrapper có cùng interface? | ✅ Cùng interface | ✅ Cùng interface | ✅ Cùng interface |
| Thay đổi behavior | Thêm/chỉnh behavior gốc | Kiểm soát access, không thay đổi behavior | Duyệt tree |
| Multiple decorators | ✅ Stack được | ❌ Thường chỉ 1 proxy | ❌ Không áp dụng |
| Proxy vs Decorator | Decorator **thêm** behavior | Proxy **kiểm soát** access |

---

## 💻 TypeScript Implementation

### Version 1: HTTP Middleware Pipeline

```typescript
interface HttpHandler {
  handle(request: HttpRequest): HttpResponse;
}

class HttpRequest {
  constructor(
    public url: string,
    public method: string,
    public headers: Record<string, string> = {},
    public body?: unknown
  ) {}
}

class HttpResponse {
  constructor(
    public status: number,
    public body: unknown,
    public headers: Record<string, string> = {}
  ) {}
}

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

// Chain middleware: Auth → Log → Echo
const handler = new LoggingMiddleware(
  new AuthMiddleware(
    new CorsMiddleware(
      new EchoHandler()
    )
  )
);

handler.handle(new HttpRequest('/api/users', 'GET', {
  'Authorization': 'Bearer token123'
}));
```

---

## ⚖️ Trade-offs & Common Mistakes

### ✅ Khi nào nên dùng

- ✅ Cần thêm behavior **lúc runtime** (không biết lúc compile)
- ✅ Có **nhiều independent behaviors** có thể kết hợp tùy ý
- ✅ Muốn **tránh class explosion** từ inheritance
- ✅ Cần **middleware pipeline** (logging, auth, caching, validation)

### ❌ Khi nào không nên dùng

- ❌ Behavior cố định lúc compile — dùng inheritance cho đơn giản
- ❌ Chỉ cần **kiểm soát access** — dùng **Proxy**
- ❌ Decorator stack quá sâu (>7 layers) — design có vấn đề

### 🚫 Common Mistakes

**1. Decorator không delegate đúng cách**
```typescript
// ❌ Sai: Quên gọi this.next → request không được xử lý
class BadMiddleware extends MiddlewareDecorator {
  handle(req: HttpRequest): HttpResponse {
    console.log('Before');
    return new HttpResponse(200, {}); // ❌ Không gọi next!
  }
}

// ✅ Đúng: Luôn delegate xuống next
class GoodMiddleware extends MiddlewareDecorator {
  handle(req: HttpRequest): HttpResponse {
    console.log('Before');
    const response = this.next.handle(req); // ✅ Delegate
    console.log('After');
    return response;
  }
}
```

**2. Stack decorators quá sâu**
```typescript
// ❌ 10 decorators nested — khó debug và maintain
const r = new D10(new D9(new D8(...(new D1(base))...)));
// → Maximum 3-5 decorators, nếu nhiều hơn → chia groups
```

**3. Decorator thêm behavior không mong muốn**
```typescript
// ❌ Decorator không nên thay đổi interface
class BadDecorator extends CoffeeDecorator {
  // ❌ Thêm method mới — interface không còn nhất quán!
  newMethod() { /* ... */ }
}
```

---

## 🧪 Testing Strategies

```typescript
// Test Decorator: Mock wrapped object
describe('MilkDecorator', () => {
  it('should add milk cost to wrapped coffee', () => {
    const mockCoffee: Coffee = {
      cost: jest.fn().mockReturnValue(5),
      description: jest.fn().mockReturnValue('Coffee')
    };

    const milkCoffee = new MilkDecorator(mockCoffee);

    expect(milkCoffee.cost()).toBe(6);
    expect(milkCoffee.description()).toBe('Coffee, Milk');
    expect(mockCoffee.cost).toHaveBeenCalled();
  });

  it('should chain multiple decorators', () => {
    const coffee = new CaramelDecorator(
      new WhippedCreamDecorator(
        new MilkDecorator(new SimpleCoffee())
      )
    );

    expect(coffee.cost()).toBe(5 + 1 + 0.5 + 0.6); // $7.10
    expect(coffee.description()).toBe('Coffee, Milk, Whipped Cream, Caramel');
  });
});
```

---

## 🔄 Refactoring Path

**Từ Inheritance → Decorator:**

```typescript
// ❌ Before: Class explosion
class Coffee {}
class MilkCoffee extends Coffee {}
class ChocolateCoffee extends Coffee {}
class VanillaCoffee extends Coffee {}
class MilkChocolateCoffee extends Coffee {}
class MilkVanillaCoffee extends Coffee {}
// ... exponential growth

// ✅ After: Decorator composition
interface Coffee { cost(): number; description(): string; }
class SimpleCoffee implements Coffee { /* ... */ }
abstract class CoffeeDecorator implements Coffee { /* ... */ }
class MilkDecorator extends CoffeeDecorator { /* ... */ }
class ChocolateDecorator extends CoffeeDecorator { /* ... */ }
class VanillaDecorator extends CoffeeDecorator { /* ... */ }

// Combine at runtime
const coffee = new VanillaDecorator(
  new MilkDecorator(new SimpleCoffee())
);
```

---

## 🎤 Interview Q&A

**Q: Decorator Pattern là gì? Khi nào dùng?**
> A: Decorator wrap một object trong decorator object để thêm behavior lúc runtime mà không sửa class gốc. Mỗi decorator implement cùng interface với object gốc, thêm behavior trước/sau khi delegate. Dùng khi cần kết hợp nhiều independent behaviors (toppings, middleware, formatting layers) và muốn tránh class explosion từ inheritance.

**Q: Decorator khác Proxy như thế nào?**
> A: Proxy kiểm soát **access** đến object (lazy load, auth, caching) — object gốc và proxy giống nhau về behavior. Decorator thêm **behavior mới** — object wrapped có thêm chức năng. Nói đơn giản: Proxy là "cửa ngõ kiểm soát vào", Decorator là "lắp thêm phụ kiện vào".

**Q: Khi nào dùng Decorator thay vì Inheritance?**
> A: Khi số lượng behavior combinations lớn (n behaviors → 2^n subclasses nếu dùng inheritance), hoặc khi behavior được thêm/bớt **lúc runtime**. Dùng inheritance khi behavior cố định và hierarchy đơn giản. Decorator là composition-based, inheritance là class-based.
