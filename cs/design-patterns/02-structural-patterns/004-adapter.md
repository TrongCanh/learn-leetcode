# 🔌 Adapter Pattern

## 🎯 Problem & Motivation

**Bài toán thực tế:** Bạn có một **interface cũ** (LegacyPayment) và một **thư viện mới** (ModernPayment) có interface **không tương thích** nhau. Không thể thay thế thư viện cũ ngay lập tức — nhưng cần dùng thư viện mới mà không sửa code client hiện có.

**Ba interface không tương thích:**

```typescript
// Old System: sync, nhận primitive params
interface LegacyPayment {
  makePayment(amount: number, currency: string): void;
}

// New System: async, nhận object
interface ModernPayment {
  charge(request: {
    amount: number;
    currency: string;
    idempotencyKey: string;
    metadata?: Record<string, string>;
  }): Promise<string>;
}
```

→ Không thể gọi `ModernPayment.charge()` với `LegacyPayment` interface. Hoặc ngược lại.

**Adapter giải quyết:** Tạo một **wrapper** biến đổi interface này → interface kia. Client gọi Adapter qua Target interface, Adapter biến đổi và gọi Adaptee thực sự.

---

## 💡 Use Cases

1. **Legacy System Integration** — Kết nối hệ thống cũ với API mới mà không rewrite code cũ
2. **Third-party Library** — Wrapper cho thư viện bên thứ ba có interface khác với internal code
3. **Data Format Conversion** — Convert JSON ↔ XML, hoặc Adapter cho các data format khác nhau
4. **API Normalization** — Nhiều payment providers (Stripe, PayPal, VNPay) có interface khác nhau → Adapter đồng bộ về một interface
5. **Testing** — Adapter mock để test code mà không cần thư viện thật
6. **Database Driver** — JDBC API = Adapter interface → MySQL, PostgreSQL, Oracle = Adaptees

---

## ❌ Before (Không dùng Adapter)

```typescript
// ❌ Client phải biết và gọi trực tiếp concrete class
import { StripePayment } from './stripe';
import { PayPalPayment } from './paypal';
import { VNPayPayment } from './vnpay';

// Client phải xử lý từng loại khác nhau!
async function checkout(amount: number, provider: 'stripe' | 'paypal' | 'vnpay') {
  if (provider === 'stripe') {
    const payment = new StripePayment();
    await payment.charge({ amount, currency: 'USD' });
  } else if (provider === 'paypal') {
    const payment = new PayPalPayment();
    await payment.sendMoney(amount, 'USD');
  } else if (provider === 'vnpay') {
    const payment = new VNPayPayment();
    await payment.processPayment(amount, '$');
  }
  // ⚠️ Mỗi lần thêm provider → sửa function này!
  // ⚠️ Client phụ thuộc vào tất cả concrete classes
}
```

→ **Hậu quả:** Client phụ thuộc trực tiếp vào concrete class → vi phạm Dependency Inversion. Thêm provider mới → sửa client. Khó test vì khó mock.

---

## ✅ After (Dùng Adapter)

```typescript
// ─────────────────────────────────────────
// 1. Target Interface — Client chỉ biết interface này
// ─────────────────────────────────────────
interface PaymentGateway {
  processPayment(amount: number, currency: string): Promise<PaymentResult>;
}

interface PaymentResult {
  transactionId: string;
  status: 'success' | 'failed';
  message?: string;
}

// ─────────────────────────────────────────
// 2. Adaptees — Third-party SDK có interface KHÁC
// ─────────────────────────────────────────
class StripeSDK {
  async charge(req: {
    amountCents: number;
    currency: string;
    idempotencyKey: string;
  }): Promise<{ id: string; status: string }> {
    console.log(`💳 [Stripe SDK] Charging ${req.amountCents} ${req.currency}`);
    return { id: `stripe_${Date.now()}`, status: 'succeeded' };
  }
}

class PayPalSDK {
  sendMoney(amountDollars: number, currencyCode: string): { transactionId: string } {
    console.log(`🅿️ [PayPal SDK] Sending ${amountDollars} ${currencyCode}`);
    return { transactionId: `paypal_${Date.now()}` };
  }
}

// ─────────────────────────────────────────
// 3. Adapters — Biến đổi interface
// ─────────────────────────────────────────
class StripeAdapter implements PaymentGateway {
  constructor(private stripe: StripeSDK) {}

  async processPayment(amount: number, currency: string): Promise<PaymentResult> {
    // Biến đổi: amount → amountCents, Promise → async
    const result = await this.stripe.charge({
      amountCents: amount * 100,            // dollars → cents
      currency: currency.toUpperCase(),      // format currency
      idempotencyKey: `txn_${Date.now()}`
    });

    return {
      transactionId: result.id,
      status: result.status === 'succeeded' ? 'success' : 'failed'
    };
  }
}

class PayPalAdapter implements PaymentGateway {
  constructor(private paypal: PayPalSDK) {}

  async processPayment(amount: number, currency: string): Promise<PaymentResult> {
    // Biến đổi: async → sync, dollars → format
    const result = this.paypal.sendMoney(amount, this.formatCurrency(currency));

    return {
      transactionId: result.transactionId,
      status: 'success'
    };
  }

  private formatCurrency(code: string): string {
    const map: Record<string, string> = { USD: '$', EUR: '€', VND: '₫' };
    return map[code] ?? code;
  }
}

// ─────────────────────────────────────────
// 4. Client — hoàn toàn tách biệt khỏi SDK thực sự
// ─────────────────────────────────────────
class PaymentService {
  constructor(private gateway: PaymentGateway) {}

  async checkout(amount: number, currency: string): Promise<void> {
    // Client không biết đang dùng Stripe hay PayPal!
    const result = await this.gateway.processPayment(amount, currency);
    console.log(`✅ Transaction: ${result.transactionId}`);
  }
}

// Thêm provider mới? Viết adapter, KHÔNG sửa code cũ!
const stripeCheckout = new PaymentService(new StripeAdapter(new StripeSDK()));
const paypalCheckout = new PaymentService(new PayPalAdapter(new PayPalSDK()));

stripeCheckout.checkout(99.99, 'USD');
paypalCheckout.checkout(49.99, 'USD');
```

---

## 🏗️ UML Diagram

```
┌─────────────┐
│   Client    │ (PaymentService)
└──────┬──────┘
       │ calls
       ▼
┌──────────────────────┐         ┌─────────────────────────┐
│  Target Interface    │         │        Adaptee          │
│  (PaymentGateway)    │         │   (StripeSDK)           │
├──────────────────────┤         ├─────────────────────────┤
│ +processPayment()     │         │ +charge(request)        │
└──────┬───────────────┘         └─────────────────────────┘
       │                                 ▲
       │ implements                       │
       ▼                                 │
┌──────────────────────┐                  │
│       Adapter        │──────────────────┘
│  (StripeAdapter)     │  wraps + adapts
├──────────────────────┤
│ +processPayment()     │
│   → transforms req    │
│   → adaptee.charge() │
│   → transforms res   │
└──────────────────────┘
```

---

## 🔍 Step-by-step Trace

**Scenario:** Client gọi `checkout(50, 'USD')` qua StripeAdapter.

```
Bước 1: stripeCheckout.checkout(50, 'USD')
  → PaymentService.checkout(50, 'USD')

Bước 2: gateway.processPayment(50, 'USD')
  → StripeAdapter.processPayment(50, 'USD')

Bước 3: Adapter biến đổi request:
  amount = 50 → amountCents = 5000
  currency = 'USD' → currency = 'USD'
  tạo idempotencyKey = 'txn_...'

Bước 4: Gọi Adaptee:
  stripeSDK.charge({
    amountCents: 5000,
    currency: 'USD',
    idempotencyKey: 'txn_...'
  })

Bước 5: Adapter biến đổi response:
  { id: 'stripe_123', status: 'succeeded' }
  → { transactionId: 'stripe_123', status: 'success' }

Output: ✅ Transaction: stripe_123

→ Client hoàn toàn không biết StripeSDK tồn tại!
→ Client chỉ biết PaymentGateway interface ✅
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Chi tiết implementation |
|---------------------|-------------------------|
| **Java `java.io.InputStreamReader`** | Adapter: Reader interface → InputStream (byte → char) |
| **JDBC API** | JDBC interface = Target; MySQL Driver, PostgreSQL Driver = Adaptees |
| **Express middleware adapters** | Adapter cho req/res objects giữa different Node versions |
| **NestJS** | `PassportStrategy` adapter — normalize different auth strategies sang AuthGuard |
| **Redux `redux-thunk`** | Adapter cho side-effect libraries sang synchronous dispatch |
| **Angular HTTP** | `HttpInterceptor` adapter — biến đổi requests/responses |

---

## 📊 So sánh với Patterns liên quan

| Criteria | **Adapter** | Facade | Decorator |
|----------|-----------|--------|----------|
| Mục đích | Biến đổi **interface không tương thích** | Cung cấp **simple interface** cho subsystem phức tạp | Thêm **behavior mới** vào object |
| Thay đổi | Thay đổi interface của Adaptee | Che giấu complexity | Mở rộng functionality |
| Client biết? | Client biết Target, không biết Adaptee | Client biết Facade, che khuất tất cả | Client nghĩ là object gốc |
| Use case | Integrate legacy / third-party | Simplify complex system | Extend object dynamically |
| Wrapper count | 1:1 (Adapter : Adaptee) | 1:N (Facade : subsystem) | 1:1, stack được |

---

## 💻 TypeScript Implementation

### Version 1: JSON ↔ XML Adapter

```typescript
// Third-party library: XML only
class XmlParser {
  parseXml(xmlString: string): Element {
    console.log(`📄 [XML Parser] Parsing: ${xmlString}`);
    return { tagName: 'root', attributes: {}, children: [] };
  }

  toXml(obj: Record<string, unknown>): string {
    const pairs = Object.entries(obj)
      .map(([k, v]) => `<${k}>${v}</${k}>`)
      .join('');
    return `<root>${pairs}</root>`;
  }
}

interface Element {
  tagName: string;
  attributes: Record<string, string>;
  children: Element[];
}

// Target Interface
interface DataParser {
  parse(data: string): Record<string, unknown>;
  stringify(obj: Record<string, unknown>): string;
}

// Adapter
class XmlToJsonAdapter implements DataParser {
  constructor(private xmlParser: XmlParser) {}

  parse(data: string): Record<string, unknown> {
    const element = this.xmlParser.parseXml(data);
    return this.elementToObject(element);
  }

  stringify(obj: Record<string, unknown>): string {
    return this.xmlParser.toXml(obj);
  }

  private elementToObject(el: Element): Record<string, unknown> {
    return { tagName: el.tagName };
  }
}

// Client: chỉ biết DataParser interface
function processData(parser: DataParser, data: string): void {
  const obj = parser.parse(data);
  const back = parser.stringify(obj);
  console.log('📦 Parsed:', obj);
  console.log('📄 Stringified:', back);
}

const adapter = new XmlToJsonAdapter(new XmlParser());
processData(adapter, '<user><name>John</name><age>30</age></user>');
```

---

## ⚖️ Trade-offs & Common Mistakes

### ✅ Khi nào nên dùng

- ✅ Cần integrate code có interface không tương thích (legacy + new, 2 third-party)
- ✅ Muốn reuse existing class nhưng interface không phù hợp
- ✅ Đang refactoring và muốn chuyển dần từ interface cũ → mới

### ❌ Khi nào không nên dùng

- ❌ Interface đã tương thích — không cần adapter thừa
- ❌ Chỉ cần thêm behavior — dùng **Decorator**
- ❌ Cần đơn giản hóa subsystem phức tạp — dùng **Facade**

### 🚫 Common Mistakes

**1. Adapter thay đổi behavior thay vì interface**
```typescript
// ❌ Sai: Adapter thêm logic nghiệp vụ
class BadAdapter implements Target {
  doSomething() {
    this.adaptee.differentMethod();
    logToServer(); // ❌ Thêm side effect!
    sendNotification(); // ❌ Thêm side effect!
  }
}
// → Adapter nên chỉ biến đổi interface, không thêm business logic
```

**2. Two-way Adapter phức tạp không cần thiết**
```typescript
// ❌ Thừa: Tạo adapter convert A→B VÀ B→A khi chỉ cần 1 chiều
// → Chỉ tạo 1 chiều đủ cho use case thực tế
```

**3. Adapter quá nhiều responsibility**
```typescript
// ❌ Sai: Một adapter làm quá nhiều thứ
class BadAdapter implements Target {
  doSomething() {
    this.validate();  // ❌ Nhiều trách nhiệm
    this.transform();
    this.log();
    this.adaptee.request();
    this.notify();
  }
}
```

---

## 🧪 Testing Strategies

```typescript
// Test client qua Adapter — không cần thư viện thật
describe('PaymentService', () => {
  it('should process payment through gateway interface', async () => {
    // Mock gateway — không cần biết Stripe hay PayPal
    const mockGateway: PaymentGateway = {
      processPayment: jest.fn().mockResolvedValue({
        transactionId: 'mock_txn',
        status: 'success'
      })
    };

    const service = new PaymentService(mockGateway);
    await service.checkout(100, 'USD');

    expect(mockGateway.processPayment).toHaveBeenCalledWith(100, 'USD');
  });
});

// Test Adapter riêng
describe('StripeAdapter', () => {
  it('should adapt Stripe SDK to PaymentGateway', async () => {
    const mockStripe = {
      charge: jest.fn().mockResolvedValue({ id: 'txn_123', status: 'succeeded' })
    };

    const adapter = new StripeAdapter(mockStripe as unknown as StripeSDK);
    const result = await adapter.processPayment(50, 'USD');

    expect(result.transactionId).toBe('txn_123');
    expect(result.status).toBe('success');
    expect(mockStripe.charge).toHaveBeenCalledWith({
      amountCents: 5000,
      currency: 'USD',
      idempotencyKey: expect.stringContaining('txn_')
    });
  });
});
```

---

## 🔄 Refactoring Path

**Từ Adapter → Native Interface (sau khi migration xong):**

```typescript
// ❌ Before: Code dùng Adapter để wrap legacy SDK
class LegacyPaymentAdapter implements PaymentGateway {
  constructor(private legacy: OldPaymentSDK) {}
  async processPayment(amount: number, currency: string) {
    return { transactionId: this.legacy.pay(amount, currency), status: 'success' };
  }
}

// ✅ After: Khi migration xong — code mới dùng NewPaymentSDK trực tiếp
// Adapter không cần nữa → xóa adapter, xóa OldPaymentSDK
class NewPaymentSDK implements PaymentGateway {
  async processPayment(amount: number, currency: string) {
    return { transactionId: await this.sdk.charge({ amount, currency }), status: 'success' };
  }
}
```

---

## 🎤 Interview Q&A

**Q: Adapter Pattern là gì? Khi nào dùng?**
> A: Adapter là wrapper giữa hai interface không tương thích. Client gọi Adapter qua Target interface, Adapter biến đổi data giữa Target và Adaptee. Dùng khi cần integrate thư viện/thiện có interface khác, hoặc đang migrate từ hệ thống cũ sang mới mà không rewrite toàn bộ.

**Q: Adapter vs Decorator khác nhau thế nào?**
> A: Adapter **thay đổi interface** (A → B interface) — object mới có interface khác với Adaptee. Decorator **thêm behavior** mà interface vẫn giữ nguyên — object mới có thêm chức năng. Nói đơn giản: Adapter làm cho "ổ cắm vuông dùng được với phích cắm tròn"; Decorator là "lắp thêm bánh xe vào xe hơi".

**Q: Adapter có phải là anti-pattern không?**
> A: Không, Adapter là pattern hợp lệ. Tuy nhiên, nếu thấy cần quá nhiều adapters, đó là **warning sign** — có thể design ban đầu có vấn đề, hoặc nên dùng Facade để tổ chức lại subsystem.

**Q: Two-way Adapter là gì?**
> A: Adapter có thể convert A→B và B→A. Dùng khi cần bidirectional compatibility giữa hai systems. Tuy nhiên, thường chỉ cần 1 chiều — implement theo hướng cần thiết.
