# 🔄 Strategy Pattern

## 🎯 Problem & Motivation

**Bài toán thực tế:** Bạn có một thuật toán/behavior có **nhiều variants**, và muốn **chọn variant lúc runtime** mà không thay đổi code client.

**Ví dụ thực tế:** Thanh toán — user chọn Stripe, PayPal, hay VNPay? Logic xử lý khác nhau nhưng interface giống nhau. Hoặc sắp xếp — sort theo name, date, hay price?

```typescript
// ❌ Strategy được chọn bằng if/else trong client
async function processPayment(amount: number, method: string) {
  if (method === 'stripe') {
    const stripe = new StripeGateway();
    await stripe.charge(amount);
  } else if (method === 'paypal') {
    const paypal = new PayPalGateway();
    await paypal.sendMoney(amount);
  } else if (method === 'vnpay') {
    const vnpay = new VNPayGateway();
    await vnpay.process(amount);
  } else if (method === 'crypto') {
    const crypto = new CryptoGateway();
    await crypto.transfer(amount);
  }
  // ⚠️ Thêm method → sửa function này!
}
```

→ **Hậu quả:** Client phải biết tất cả concrete implementations. Thêm strategy → sửa client. Khó test vì phụ thuộc vào if/else chain.

**Strategy giải quyết:** Đóng gói mỗi thuật toán vào **class riêng**, client chọn strategy cần dùng và inject vào Context.

---

## 💡 Use Cases

1. **Payment Processing** — Stripe vs PayPal vs VNPay vs Crypto
2. **Sorting Algorithms** — QuickSort vs MergeSort vs TimSort tùy data size và distribution
3. **Compression** — ZIP vs RAR vs GZIP tùy file type và size
4. **Routing Algorithms** — A* vs Dijkstra vs BFS tùy graph characteristics
5. **Authentication** — JWT vs OAuth vs Session vs API Key vs Biometric
6. **Shipping Calculator** — FedEx vs UPS vs DHL vs Vietnam Post vs Self-pickup

---

## ❌ Before (Không dùng Strategy)

```typescript
// ❌ Client chứa tất cả logic — vi phạm Single Responsibility
async function processOrder(order: Order, shippingMethod: string) {
  if (shippingMethod === 'standard') {
    const warehouse = selectNearestWarehouse(order.zip);
    const carrier = await getCarrier('USPS');
    const rate = await carrier.calculateRate(order.weight);
    const tracking = await carrier.createLabel(order.address, rate);
    await sendEmail(order.email, tracking);
  } else if (shippingMethod === 'express') {
    const warehouse = selectNearestWarehouse(order.zip);
    const carrier = await getCarrier('FedEx');
    const rate = await carrier.calculateExpressRate(order.weight);
    const tracking = await carrier.createExpressLabel(order.address, rate);
    await sendSMS(order.phone, tracking);
  } else if (shippingMethod === 'overnight') {
    const carrier = await getCarrier('UPS');
    const rate = await carrier.calculatePriorityRate(order.weight);
    // ⚠️ Logic lặp lại ở khắp nơi!
  }
  // ⚠️ Thêm shipping method → sửa function này!
}
```

→ **Hậu quả:** Single Responsibility vi phạm. Thêm method → sửa client. Logic trùng lặp. Khó test từng shipping method riêng.

---

## ✅ After (Dùng Strategy)

```typescript
// ─────────────────────────────────────────
// 1. Strategy Interface — contract cho mọi strategy
// ─────────────────────────────────────────
interface ShippingStrategy {
  calculateRate(weight: number, destination: string): Promise<ShippingRate>;
  createLabel(order: Order, rate: ShippingRate): Promise<TrackingInfo>;
  getCarrierName(): string;
}

interface ShippingRate {
  cost: number;
  currency: string;
  estimatedDays: number;
}

interface TrackingInfo {
  trackingId: string;
  carrier: string;
  estimatedDelivery: string;
}

interface Order {
  id: string;
  weight: number;
  address: string;
  zip: string;
  email: string;
  phone: string;
}

// ─────────────────────────────────────────
// 2. Concrete Strategies — đóng gói từng thuật toán
// ─────────────────────────────────────────
class StandardShippingStrategy implements ShippingStrategy {
  async calculateRate(weight: number, destination: string): Promise<ShippingRate> {
    console.log(`📦 [Standard] Calculating rate for ${weight}kg to ${destination}`);
    return { cost: weight * 2.5, currency: 'USD', estimatedDays: 5 };
  }

  async createLabel(order: Order, rate: ShippingRate): Promise<TrackingInfo> {
    console.log(`🏷️  [Standard] Creating USPS label...`);
    return {
      trackingId: `USPS_${Date.now()}`,
      carrier: 'USPS',
      estimatedDelivery: `${rate.estimatedDays} business days`
    };
  }

  getCarrierName() { return 'USPS'; }
}

class ExpressShippingStrategy implements ShippingStrategy {
  async calculateRate(weight: number, destination: string): Promise<ShippingRate> {
    console.log(`🚀 [Express] Calculating rate for ${weight}kg to ${destination}`);
    return { cost: weight * 8.0, currency: 'USD', estimatedDays: 2 };
  }

  async createLabel(order: Order, rate: ShippingRate): Promise<TrackingInfo> {
    console.log(`🏷️  [Express] Creating FedEx label...`);
    return {
      trackingId: `FEDEX_${Date.now()}`,
      carrier: 'FedEx',
      estimatedDelivery: `${rate.estimatedDays} business days`
    };
  }

  getCarrierName() { return 'FedEx'; }
}

class OvernightShippingStrategy implements ShippingStrategy {
  async calculateRate(weight: number, destination: string): Promise<ShippingRate> {
    console.log(`⚡ [Overnight] Calculating rate for ${weight}kg to ${destination}`);
    return { cost: weight * 15.0, currency: 'USD', estimatedDays: 1 };
  }

  async createLabel(order: Order, rate: ShippingRate): Promise<TrackingInfo> {
    console.log(`🏷️  [Overnight] Creating UPS Next Day Air label...`);
    return {
      trackingId: `UPS_${Date.now()}`,
      carrier: 'UPS',
      estimatedDelivery: 'Next business day'
    };
  }

  getCarrierName() { return 'UPS'; }
}

// ─────────────────────────────────────────
// 3. Context — chứa strategy, client tương tác với context
// ─────────────────────────────────────────
class OrderFulfillment {
  constructor(private shippingStrategy: ShippingStrategy) {}

  // Inject strategy mới lúc runtime
  setShippingStrategy(strategy: ShippingStrategy) {
    this.shippingStrategy = strategy;
  }

  async processOrder(order: Order): Promise<void> {
    const carrier = this.shippingStrategy.getCarrierName();
    console.log(`\n📋 Processing order ${order.id} via ${carrier}...`);

    const rate = await this.shippingStrategy.calculateRate(order.weight, order.zip);
    console.log(`💵 Rate: $${rate.cost} (${rate.estimatedDays} days)`);

    const tracking = await this.shippingStrategy.createLabel(order, rate);
    console.log(`✅ Shipped! Tracking: ${tracking.trackingId}`);
  }
}

// ─────────────────────────────────────────
// 4. Client — chọn strategy lúc runtime!
// ─────────────────────────────────────────
const order: Order = {
  id: 'ORD_456',
  weight: 2.5,
  address: '123 Main St',
  zip: '10001',
  email: 'customer@example.com',
  phone: '+1234567890'
};

const fulfillment = new OrderFulfillment(new StandardShippingStrategy());
await fulfillment.processOrder(order);
// 📋 Processing ORD_456 via USPS...
// 💵 Rate: $6.25 (5 days)
// ✅ Shipped! Tracking: USPS_...

fulfillment.setShippingStrategy(new ExpressShippingStrategy());
await fulfillment.processOrder(order);
// 📋 Processing ORD_456 via FedEx...
// 💵 Rate: $20.00 (2 days)
// ✅ Shipped! Tracking: FEDEX_...

fulfillment.setShippingStrategy(new OvernightShippingStrategy());
await fulfillment.processOrder(order);
// 📋 Processing ORD_456 via UPS...
// 💵 Rate: $37.50 (1 day)
// ✅ Shipped! Tracking: UPS_...
```

---

## 🏗️ UML Diagram

```
┌──────────────────────┐
│       Context        │
│ (OrderFulfillment)  │
├──────────────────────┤
│ -strategy: Strategy  │
├──────────────────────┤
│ +setStrategy()       │
│ +processOrder()      │
└──────────┬───────────┘
           │ uses
           ▼
┌────────────────────────┐         ┌──────────────────────────────┐
│   <<interface>>        │         │     <<interface>>           │
│     Strategy           │         │    ShippingStrategy          │
├────────────────────────┤         ├──────────────────────────────┤
│ +execute()             │         │ +calculateRate()            │
└──────────┬─────────────┘         │ +createLabel()              │
           │ implements            └────────────┬─────────────────┘
   ┌───────┴───────┐                         │ implements
   ▼               ▼                         │
┌────────┐    ┌────────┐              ┌───────┴──────────┐
│SortA   │    │SortB   │              ▼                  ▼
└────────┘    └────────┘         ┌──────────────┐  ┌──────────────┐
                                 │ StandardShip  │  │ ExpressShip  │
                                 └──────────────┘  └──────────────┘
```

---

## 🔍 Step-by-step Trace

**Scenario:** Order 2.5kg, Express shipping.

```
Bước 1: fulfillment.processOrder(order)
  → OrderFulfillment.processOrder(order)

Bước 2: this.shippingStrategy.calculateRate(2.5, '10001')
  → ExpressShippingStrategy.calculateRate(2.5, '10001')
  → Rate: 2.5 * $8 = $20

Bước 3: this.shippingStrategy.createLabel(order, rate)
  → ExpressShippingStrategy.createLabel(order, rate)
  → Tracking: FEDEX_...

Output: $20, 2 days, FEDEX_...

→ OrderFulfillment hoàn toàn không biết shipping strategy cụ thể là gì!
→ Chỉ gọi Strategy interface ✅
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Chi tiết implementation |
|---------------------|-------------------------|
| **React + Zustand/Redux** | Different reducers = different state update strategies |
| **Lodash `_.sortBy`** | Sort strategy tùy field |
| **TypeScript `Array.sort(comparator)`** | Comparator function = Strategy |
| **Python HTTP libraries** | `requests.Session` với different auth strategies |
| **Spring Security** | Multiple `AuthenticationProvider` = Strategy pattern |
| **Express middleware** | `authStrategy`, `compressionStrategy` |

---

## 📊 So sánh với Patterns liên quan

| Criteria | **Strategy** | State | Command |
|----------|-------------|-------|---------|
| Ai quyết định behavior? | **Client chủ động** chọn strategy | Object tự thay đổi theo state | Encapsulate request as object |
| Khi nào thay đổi? | Client gọi setter | State machine transition | Executed later |
| Mục đích | Chọn algorithm | Model state transitions | Undo/redo, queue, logging |
| Relationship | Composition | Composition + self-transition | Composition |

---

## 💻 TypeScript Implementation

### Version 1: Route Planning Strategies

```typescript
interface RouteStrategy {
  buildRoute(start: [number, number], end: [number, number]): RouteResult;
}

interface RouteResult {
  path: string;
  distanceKm: number;
  estimatedMinutes: number;
  mode: string;
}

class WalkingStrategy implements RouteStrategy {
  buildRoute(start: [number, number], end: [number, number]): RouteResult {
    const dist = this.haversine(start, end);
    return {
      path: `🚶 Walking from (${start[0]},${start[1]}) to (${end[0]},${end[1]})`,
      distanceKm: dist,
      estimatedMinutes: Math.round(dist * 12),
      mode: 'walking'
    };
  }

  private haversine(a: [number, number], b: [number, number]): number {
    return Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2) * 111;
  }
}

class DrivingStrategy implements RouteStrategy {
  buildRoute(start: [number, number], end: [number, number]): RouteResult {
    const dist = this.haversine(start, end);
    return {
      path: `🚗 Driving from (${start[0]},${start[1]}) to (${end[0]},${end[1]})`,
      distanceKm: dist * 1.2,
      estimatedMinutes: Math.round(dist * 1.2 * 1.5),
      mode: 'driving'
    };
  }

  private haversine(a: [number, number], b: [number, number]): number {
    return Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2) * 111;
  }
}

class PublicTransportStrategy implements RouteStrategy {
  buildRoute(start: [number, number], end: [number, number]): RouteResult {
    const dist = this.haversine(start, end);
    return {
      path: `🚌 Transit from (${start[0]},${start[1]}) to (${end[0]},${end[1]})`,
      distanceKm: dist,
      estimatedMinutes: Math.round(dist * 4),
      mode: 'transit'
    };
  }

  private haversine(a: [number, number], b: [number, number]): number {
    return Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2) * 111;
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

  navigate(start: [number, number], end: [number, number]): void {
    const result = this.strategy.buildRoute(start, end);
    console.log(`${result.path}`);
    console.log(`   Distance: ${result.distanceKm.toFixed(1)}km, ~${result.estimatedMinutes} min`);
  }
}

// Usage
const app = new NavigationApp(new WalkingStrategy());
app.navigate([10.7629, 106.6803], [10.7789, 106.6983]);
// 🚶 Walking: 5.2km, ~62 min

app.setStrategy(new DrivingStrategy());
app.navigate([10.7629, 106.6803], [10.7789, 106.6983]);
// 🚗 Driving: 6.2km, ~14 min
```

---

## ⚖️ Trade-offs & Common Mistakes

### ✅ Khi nào nên dùng

- ✅ Có **nhiều related algorithms** (sorting, validation, compression...)
- ✅ Cần **chọn algorithm lúc runtime**
- ✅ Mỗi algorithm có **variant behavior** nhưng cùng interface
- ✅ Muốn **tách biệt business logic** khỏi algorithm cụ thể

### ❌ Khi nào không nên dùng

- ❌ Chỉ có 1 algorithm — dùng thẳng
- ❌ Algorithm rất đơn giản — if/else đủ
- ❌ Clients cần sensitive data để chọn strategy — nên dùng factory

### 🚫 Common Mistakes

**1. Strategy giữ mutable state → shared state bugs**
```typescript
// ❌ Sai: Strategy giữ state → shared across calls
class StatefulSort implements SortStrategy {
  private comparisons = 0; // ❌ Mutable state

  sort(data: number[]): number[] {
    this.comparisons++; // ⚠️ Shared across calls!
    return data.sort((a, b) => a - b);
  }
}

// ✅ Đúng: Strategy stateless, state trong Context
```

**2. Dùng Strategy khi chỉ cần callback**
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

## 🧪 Testing Strategies

```typescript
describe('OrderFulfillment', () => {
  it('should use shipping strategy to calculate rate', async () => {
    const mockStrategy: ShippingStrategy = {
      calculateRate: jest.fn().mockResolvedValue({ cost: 10, currency: 'USD', estimatedDays: 3 }),
      createLabel: jest.fn().mockResolvedValue({ trackingId: 'T123', carrier: 'Mock', estimatedDelivery: '3 days' }),
      getCarrierName: () => 'MockCarrier'
    };

    const fulfillment = new OrderFulfillment(mockStrategy);
    await fulfillment.processOrder({ id: 'O1', weight: 1, address: '', zip: '', email: '', phone: '' });

    expect(mockStrategy.calculateRate).toHaveBeenCalledWith(1, '');
    expect(mockStrategy.createLabel).toHaveBeenCalled();
  });

  it('should switch strategy at runtime', async () => {
    const standard = new StandardShippingStrategy();
    const express = new ExpressShippingStrategy();
    const fulfillment = new OrderFulfillment(standard);

    fulfillment.setShippingStrategy(express);
    expect(fulfillment).toBeDefined();
  });
});
```

---

## 🔄 Refactoring Path

**Từ if/else → Strategy:**

```typescript
// ❌ Before: if/else chain
function calculateDiscount(user: User, cart: Cart): number {
  if (user.type === 'premium') return cart.total * 0.2;
  if (user.type === 'vip') return cart.total * 0.3;
  if (user.type === 'first_time') return cart.total * 0.1;
  if (user.loyaltyPoints > 1000) return cart.total * 0.15;
  return 0;
}

// ✅ After: Strategy
interface DiscountStrategy {
  calculate(user: User, cart: Cart): number;
}

class PremiumDiscount implements DiscountStrategy {
  calculate(user: User, cart: Cart) { return cart.total * 0.2; }
}
class VIPDiscount implements DiscountStrategy {
  calculate(user: User, cart: Cart) { return cart.total * 0.3; }
}
```

---

## 🎤 Interview Q&A

**Q: Strategy Pattern là gì? Khi nào dùng?**
> A: Strategy đóng gói một family of algorithms vào các classes riêng biệt implement cùng interface. Client chọn strategy cần dùng và inject vào Context. Dùng khi có nhiều variants của cùng logic (payment methods, sort algorithms, routing) và muốn chọn lúc runtime mà không sửa client code. Strategy stateless — state nên ở trong Context, không phải Strategy.

**Q: Strategy khác State như thế nào?**
> A: Trong Strategy, **client chủ động** chọn algorithm và gọi setter để swap. Trong State, **object tự thay đổi** behavior khi internal state thay đổi — state pattern làm việc với state machine, khi transition xảy ra → object tự chuyển sang state class khác mà client không cần gọi setter. Strategy là algorithm selection; State là state machine.

**Q: Strategy có phải là if/else refactored không?**
> A: Đúng về bản chất, nhưng Strategy tốt hơn nhiều: (1) Mỗi algorithm trong class riêng → test được, maintain được. (2) Thêm algorithm mới không sửa code cũ. (3) Có thể swap lúc runtime. Nếu chỉ có 2 cases đơn giản, if/else vẫn được — đừng over-engineer.
