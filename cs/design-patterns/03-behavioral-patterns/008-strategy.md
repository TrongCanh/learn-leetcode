# 🔄 Strategy Pattern

## 🎯 Problem & Motivation

**Bài toán:** Bạn có một thuật toán/behavior có **nhiều variants**, và muốn **chọn variant lúc runtime** mà không thay đổi code client.

**Ví dụ thực tế:** Thanh toán — user chọn Stripe, PayPal, hay VNPay? Logic xử lý khác nhau nhưng interface giống nhau. Hoặc sắp xếp — sort theo name, date, hay price?

**Strategy giải quyết:** Đóng gói mỗi thuật toán vào **class riêng**, client chọn strategy cần dùng lúc runtime.

---

## 💡 Use Cases

1. **Payment Processing** — Stripe vs PayPal vs VNPay
2. **Sorting Algorithms** — QuickSort vs MergeSort vs TimSort tùy data size
3. **Compression** — ZIP vs RAR vs GZIP tùy file type
4. **Routing** — A* vs Dijkstra vs BFS tùy graph type
5. **Authentication** — JWT vs OAuth vs Session vs API Key
6. **Shipping Calculator** — FedEx vs UPS vs DHL vs Vietnam Post

---

## ❌ Before (Không dùng Strategy)

```typescript
// ❌ Strategy được chọn bằng if/else trong client
async function processPayment(amount: number, method: string) {
  if (method === 'stripe') {
    // Stripe logic: 10 dòng
    const stripe = new StripeGateway();
    await stripe.charge(amount);
  } else if (method === 'paypal') {
    // PayPal logic: 10 dòng khác
    const paypal = new PayPalGateway();
    await paypal.sendMoney(amount);
  } else if (method === 'vnpay') {
    // VNPay logic: 10 dòng nữa
    const vnpay = new VNPayGateway();
    await vnpay.process(amount);
  }
  // ⚠️ Thêm method mới? Sửa function này!
}
```

→ **Vấn đề:** Client phải biết tất cả concrete implementations. Thêm strategy mới → sửa client. Vi phạm Open/Closed Principle.

---

## ✅ After (Dùng Strategy)

```typescript
// ─────────────────────────────────────────
// 1. Strategy Interface — contract cho mọi strategy
// ─────────────────────────────────────────
interface PaymentStrategy {
  pay(amount: number): Promise<PaymentResult>;
  getName(): string;
}

interface PaymentResult {
  success: boolean;
  transactionId: string;
  message?: string;
}

// ─────────────────────────────────────────
// 2. Concrete Strategies — đóng gói từng thuật toán
// ─────────────────────────────────────────
class StripePayment implements PaymentStrategy {
  async pay(amount: number): Promise<PaymentResult> {
    console.log(`💳 [Stripe] Processing $${amount}...`);
    // Stripe API call
    return {
      success: true,
      transactionId: `stripe_${Date.now()}`
    };
  }

  getName() { return 'Stripe'; }
}

class PayPalPayment implements PaymentStrategy {
  async pay(amount: number): Promise<PaymentResult> {
    console.log(`🅿️ [PayPal] Processing $${amount}...`);
    return {
      success: true,
      transactionId: `paypal_${Date.now()}`
    };
  }

  getName() { return 'PayPal'; }
}

class VNPayPayment implements PaymentStrategy {
  async pay(amount: number): Promise<PaymentResult> {
    console.log(`🇻🇳 [VNPay] Processing $${amount}...`);
    return {
      success: true,
      transactionId: `vnpay_${Date.now()}`
    };
  }

  getName() { return 'VNPay'; }
}

class CryptoPayment implements PaymentStrategy {
  async pay(amount: number): Promise<PaymentResult> {
    console.log(`₿ [Crypto] Processing $${amount}...`);
    return {
      success: true,
      transactionId: `crypto_${Date.now()}`
    };
  }

  getName() { return 'Cryptocurrency'; }
}

// ─────────────────────────────────────────
// 3. Context — chứa strategy, client tương tác với context
// ─────────────────────────────────────────
class ShoppingCart {
  private items: Array<{ name: string; price: number }> = [];
  private paymentStrategy!: PaymentStrategy; // Bắt buộc set trước khi checkout

  addItem(item: { name: string; price: number }) {
    this.items.push(item);
  }

  getTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }

  // Inject strategy từ bên ngoài
  setPaymentStrategy(strategy: PaymentStrategy) {
    this.paymentStrategy = strategy;
  }

  // Checkout — không biết strategy cụ thể là gì!
  async checkout(): Promise<PaymentResult> {
    if (!this.paymentStrategy) {
      throw new Error('❌ No payment strategy set!');
    }

    const total = this.getTotal();
    console.log(`🛒 Cart total: $${total} via ${this.paymentStrategy.getName()}`);
    return this.paymentStrategy.pay(total);
  }
}

// ─────────────────────────────────────────
// 4. Client — chọn strategy lúc runtime!
// ─────────────────────────────────────────
async function main() {
  const cart = new ShoppingCart();
  cart.addItem({ name: 'Laptop', price: 999 });
  cart.addItem({ name: 'Mouse', price: 49 });

  // User chọn thanh toán Stripe
  cart.setPaymentStrategy(new StripePayment());
  await cart.checkout();
  // 💳 [Stripe] Processing $1048...

  // User đổi sang PayPal
  cart.setPaymentStrategy(new PayPalPayment());
  await cart.checkout();
  // 🅿️ [PayPal] Processing $1048...

  // Thêm Crypto? Tạo class mới — không sửa ShoppingCart!
  cart.setPaymentStrategy(new CryptoPayment());
  await cart.checkout();
  // ₿ [Crypto] Processing $1048...
}
```

→ **Cải thiện:** ShoppingCart hoàn toàn không biết payment strategies cụ thể. Thêm method mới? Tạo `BitcoinPayment implements PaymentStrategy` — KHÔNG sửa ShoppingCart.

---

## 🏗️ UML Diagram

```
┌──────────────────────┐
│       Context        │
│   (ShoppingCart)     │
├──────────────────────┤
│ -strategy: Strategy  │
├──────────────────────┤
│ +setStrategy()       │
│ +execute()           │
└──────────┬───────────┘
           │ uses
           ▼
┌────────────────────────┐         ┌─────────────────────────┐
│   <<interface>>        │         │   <<interface>>         │
│     Strategy           │         │    PaymentStrategy      │
├────────────────────────┤         ├─────────────────────────┤
│ +execute()             │         │ +pay(): Promise<Result> │
└──────────┬─────────────┘         └────────────┬────────────┘
           │ implements                        │ implements
   ┌──────┴──────┐                    ┌────────┴────────┐
   ▼             ▼                    ▼                 ▼
┌────────┐  ┌────────┐         ┌──────────┐    ┌──────────┐
│  SortA │  │  SortB │         │  Stripe  │    │  PayPal  │
└────────┘  └────────┘         └──────────┘    └──────────┘
```

---

## 🔍 Step-by-step Trace

**Scenario:** User mua laptop, chọn PayPal thanh toán.

```
Bước 1: cart.addItem({ name: 'Laptop', price: 999 })
  → items = [{ name: 'Laptop', price: 999 }]

Bước 2: cart.setPaymentStrategy(new PayPalPayment())
  → cart.strategy = PayPalPayment instance

Bước 3: cart.checkout()
  → total = 999
  → gọi cart.strategy.pay(999)
          ↓
     PayPalPayment.pay(999)
          ↓
     return { success: true, transactionId: 'paypal_123...' }

Output: 🅿️ [PayPal] Processing $999...

→ ShoppingCart không biết PayPal là gì!
→ Chỉ biết PaymentStrategy interface ✅
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Cách dùng Strategy |
|---------------------|-------------------|
| **React `useState` + reducers** | Different reducer = different state update strategy |
| **Lodash `_.sortBy`** | Sort strategy tùy field |
| **TypeScript `Array.sort(comparator)`** | Comparator function = Strategy |
| **Node.js middleware** | `authStrategy`, `compressionStrategy` |
| **Java `Collections.sort(List, Comparator)`** | Comparator = Strategy |
| **Netflix Zuul** | Filter strategies cho routing |

---

## 📊 So sánh với Patterns liên quan

| Criteria | **Strategy** | State | Command |
|----------|-------------|-------|---------|
| Ai quyết định behavior? | **Client chủ động** chọn strategy | Object tự thay đổi theo state | Encapsulate request as object |
| Khi nào thay đổi? | Client gọi setter | State machine transition | Executed later |
| Mục đích | Chọn algorithm | Model state transitions | Undo/redo, queue |
| Relationship | Composition | Composition + self-transition | Composition |

---

## 💻 TypeScript Implementation

```typescript
// ─────────────────────────────────────────
// Example: Route Planning Strategies
// ─────────────────────────────────────────

interface RouteStrategy {
  buildRoute(start: [number, number], end: [number, number]): string;
}

// Strategies
class WalkingStrategy implements RouteStrategy {
  buildRoute(start: [number, number], end: [number, number]): string {
    return `🚶 Walking route from (${start}) to (${end}): 5.2km, ~1 hour`;
  }
}

class CyclingStrategy implements RouteStrategy {
  buildRoute(start: [number, number], end: [number, number]): string {
    return `🚴 Cycling route from (${start}) to (${end}): 4.1km, ~20 min`;
  }
}

class DrivingStrategy implements RouteStrategy {
  buildRoute(start: [number, number], end: [number, number]): string {
    return `🚗 Driving route from (${start}) to (${end}): 3.8km, ~10 min`;
  }
}

class PublicTransportStrategy implements RouteStrategy {
  buildRoute(start: [number, number], end: [number, number]): string {
    return `🚌 Transit from (${start}) to (${end}): 5.0km, ~25 min, 2 transfers`;
  }
}

// Context
class NavigationApp {
  private strategy: RouteStrategy;

  constructor(strategy: RouteStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: RouteStrategy) {
    this.strategy = strategy;
  }

  navigate(start: [number, number], end: [number, number]) {
    const route = this.strategy.buildRoute(start, end);
    console.log(`📍 ${route}`);
  }
}

// Usage
const app = new NavigationApp(new WalkingStrategy());
app.navigate([10.7629, 106.6803], [10.7789, 106.6983]);
// 🚶 Walking route: 5.2km, ~1 hour

app.setStrategy(new DrivingStrategy());
app.navigate([10.7629, 106.6803], [10.7789, 106.6983]);
// 🚗 Driving route: 3.8km, ~10 min
```

---

## 📝 LeetCode Problems áp dụng

- [Coin Change](https://leetcode.com/problems/coin-change/) — có thể implement nhiều DP strategies
- [Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/) — iterative vs recursive strategy
- [LFU Cache](https://leetcode.com/problems/lfu-cache/) — multiple eviction strategies

---

## ✅ Pros / ❌ Cons

**Ưu điểm:**
- ✅ **Open/Closed** — thêm algorithm mới mà không sửa client
- ✅ **Single Responsibility** — mỗi strategy class một responsibility
- ✅ **Runtime switching** — thay đổi behavior lúc runtime
- ✅ **Testability** — test từng strategy riêng biệt

**Nhược điểm:**
- ❌ **Clients must be aware** — client phải biết strategies khác nhau để chọn
- ❌ **Overkill if few algorithms** — nếu chỉ có 1-2 strategies, Strategy pattern thừa
- ❌ **Increased objects** — mỗi strategy là một class mới

---

## ⚠️ Khi nào nên / không nên dùng

**Nên dùng khi:**
- ✅ Có **nhiều related algorithms** (sorting, validation, compression...)
- ✅ Cần **chọn algorithm lúc runtime**
- ✅ Mỗi algorithm có **variant behavior** nhưng cùng interface
- ✅ Muốn **tách biệt business logic** khỏi algorithm cụ thể

**Không nên dùng khi:**
- ❌ Chỉ có 1 algorithm — dùng thẳng
- ❌ Algorithm rất đơn giản — if/else đủ
- ❌ Clients phải **sensitive data** để chọn strategy — nên dùng factory

---

## 🚫 Common Mistakes / Pitfalls

1. **Strategy không nên giữ state nếu có thể**
   ```typescript
   // ❌ Sai: Strategy giữ mutable state → shared state bugs
   class StatefulStrategy implements Strategy {
     private step = 0; // ❌ Mutable state

     execute() {
       this.step++; // ⚠️ Shared across calls
     }
   }

   // ✅ Đúng: Strategy stateless, state trong Context
   class StatelessStrategy implements Strategy {
     execute(state: ContextState) {
       return { ...state, step: state.step + 1 };
     }
   }
   ```

2. **Dùng Strategy khi chỉ cần callback**
   ```typescript
   // ❌ Thừa: 1 algorithm duy nhất, chỉ cần callback
   class BadContext {
     setStrategy(fn: () => void) {} // → Just use callback!
   }

   // ✅ Đúng: Khi CÓ NHIỀU algorithms cần swap
   class GoodContext {
     setStrategy(algorithm: SortStrategy) {}
   }
   ```

---

## 🎤 Interview Q&A

**Q: Strategy Pattern là gì? Khi nào dùng?**
> A: Strategy đóng gói một family of algorithms vào các classes riêng biệt implement cùng interface. Client chọn strategy cần dùng và inject vào Context. Dùng khi có nhiều variants của cùng logic (payment methods, sort algorithms, routing) và muốn chọn lúc runtime mà không sửa client code.

**Q: Strategy khác State như thế nào?**
> A: Trong Strategy, **client chủ động** chọn algorithm và gọi setter để swap. Trong State, **object tự thay đổi** behavior khi internal state thay đổi — state pattern làm việc với state machine, khi transition xảy ra → object tự chuyển sang state class khác mà client không cần gọi setter.

**Q: Strategy có phải là if/else refactored không?**
> A: Đúng về bản chất, nhưng Strategy tốt hơn nhiều: (1) Mỗi algorithm trong class riêng → test được, maintain được. (2) Thêm algorithm mới không sửa code cũ. (3) Có thể swap lúc runtime. Nếu chỉ có 2 cases đơn giản, if/else vẫn được — đừng over-engineer.
