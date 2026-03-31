# 🔌 Adapter Pattern

## 🎯 Problem & Motivation

**Bài toán:** Bạn có một **interface cũ** (LegacyPayment) và một **thư viện mới** (ModernPayment) có interface **không tương thích** nhau. Không thể thay thế thư viện cũ ngay lập tức — nhưng cần dùng thư viện mới mà không sửa code client hiện có.

```typescript
// ❌ Interface không tương thích
interface LegacyPayment {
  makePayment(amount: number, currency: string): void;
}

interface ModernPayment {
  charge(request: { amount: number; currency: string; idempotencyKey: string }): Promise<string>;
}

// Client muốn gọi ModernPayment nhưng chỉ biết LegacyPayment interface
```

**Adapter giải quyết:** Tạo một **wrapper** để interface không tương thích hoạt động được cùng nhau — client gọi Adapter, Adapter gọi thư viện thực sự.

---

## 💡 Use Cases

1. **Legacy System Integration** — Kết nối hệ thống cũ với API mới mà không rewrite code cũ
2. **Third-party Library** — Wrapper cho thư viện bên thứ ba có interface khác với internal code
3. **Data Format Conversion** — Convert JSON → XML, hoặc Adapter cho các data format khác nhau
4. **API Normalization** — Nhiều payment providers (Stripe, PayPal, VNPay) có interface khác nhau → Adapter đồng bộ về một interface
5. **Testing** — Adapter mock để test code mà không cần thư viện thật

---

## ❌ Before (Không dùng Adapter)

```typescript
// ❌ Client phải biết và gọi trực tiếp concrete class
import { StripePayment } from './stripe';
import { PayPalPayment } from './paypal';

// Client phải xử lý từng loại khác nhau!
async function checkout(amount: number, provider: 'stripe' | 'paypal') {
  if (provider === 'stripe') {
    const payment = new StripePayment();
    await payment.charge({ amount, currency: 'USD' });
  } else if (provider === 'paypal') {
    const payment = new PayPalPayment();
    await payment.makePayment(amount, 'USD');
  }
  // ⚠️ Mỗi lần thêm provider mới → sửa function này!
}
```

→ **Vấn đề:** Client phụ thuộc trực tiếp vào concrete class → vi phạm Dependency Inversion. Thêm provider mới → sửa client.

---

## ✅ After (Dùng Adapter)

```typescript
// ─────────────────────────────────────────
// 1. Unified Interface (Target) — Client chỉ biết interface này
// ─────────────────────────────────────────
interface PaymentGateway {
  processPayment(amount: number, currency: string): Promise<PaymentResult>;
}

interface PaymentResult {
  transactionId: string;
  status: 'success' | 'failed';
}

// ─────────────────────────────────────────
// 2. Adaptee — Third-party library có interface KHÁC
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
  makePayment(amountDollars: number, currencyCode: string): void {
    console.log(`🅿️ [PayPal SDK] Paying ${amountDollars} ${currencyCode}`);
  }
}

// ─────────────────────────────────────────
// 3. Adapters — Wrapper biến đổi interface
// ─────────────────────────────────────────
class StripeAdapter implements PaymentGateway {
  constructor(private stripe: StripeSDK) {}

  async processPayment(amount: number, currency: string): Promise<PaymentResult> {
    // Biến đổi: amount → amountCents, currency → currencyCode
    const result = await this.stripe.charge({
      amountCents: amount * 100,       // dollars → cents
      currency: currency.toUpperCase(),
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
    // Biến đổi: USD → '$', trả về Promise sync → async
    this.paypal.makePayment(amount, this.currencySymbol(currency));
    return {
      transactionId: `paypal_${Date.now()}`,
      status: 'success'
    };
  }

  private currencySymbol(code: string): string {
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

// ✅ Thêm provider mới? KHÔNG cần sửa client!
const stripeService = new PaymentService(new StripeAdapter(new StripeSDK()));
const paypalService = new PaymentService(new PayPalAdapter(new PayPalSDK()));

stripeService.checkout(99.99, 'USD');
paypalService.checkout(49.99, 'USD');
```

→ **Cải thiện:** Client `PaymentService` chỉ biết `PaymentGateway` interface. Stripe, PayPal, hay bất kỳ provider nào — chỉ cần viết Adapter.

---

## 🏗️ UML Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ uses
       ▼
┌──────────────────────┐         ┌─────────────────────┐
│   Target Interface   │         │      Adaptee        │
│  (PaymentGateway)    │         │  (StripeSDK)        │
├──────────────────────┤         ├─────────────────────┤
│ +processPayment()    │         │ +charge(request)    │
└──────┬───────────────┘         └─────────────────────┘
       │                                 ▲
       │ implements                       │
       ▼                                 │
┌──────────────────────┐                  │
│       Adapter        │──────────────────┘
│  (StripeAdapter)     │  wraps / adapts
├──────────────────────┤
│ +processPayment()    │
│   → adaptee.charge() │
└──────────────────────┘
```

---

## 🔍 Step-by-step Trace

**Scenario:** Client gọi `checkout(50, 'USD')` qua StripeAdapter.

```
Bước 1: stripeService.checkout(50, 'USD')
  → PaymentService.checkout(50, 'USD')

Bước 2: gateway.processPayment(50, 'USD')
  → StripeAdapter.processPayment(50, 'USD')

Bước 3: Adapter biến đổi request:
  - amount = 50 → amountCents = 5000
  - currency = 'USD' → currency = 'USD'
  - tạo idempotencyKey = 'txn_...'

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
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Cách dùng Adapter |
|---------------------|------------------|
| **Java `java.io.InputStreamReader`** | Adapter: Reader interface → InputStream (byte → char) |
| **Angular `$http`** | Adapter giữa XMLHttpRequest và Promise/Observable |
| **Redux `redux-thunk`** | Adapter cho side-effect library |
| **JDBC** | JDBC API là Adapter interface → implementation của từng DB (MySQL, PostgreSQL) |
| **Express middleware** | Adapter cho req/res objects giữa different Node versions |

---

## 📊 So sánh với Patterns liên quan

| Criteria | **Adapter** | Facade | Decorator |
|----------|-----------|--------|----------|
| Mục đích | Biến đổi **interface không tương thích** | Cung cấp **simple interface** cho subsystem phức tạp | Thêm behavior **mới** vào object |
| Thay đổi | Thay đổi interface của Adaptee | Che giấu complexity | Mở rộng functionality |
| Client biết? | Client biết Target, không biết Adaptee | Client biết Facade, che khuất mọi thứ | Client nghĩ là object gốc |
| Use case | Integrate legacy / third-party | Simplify complex system | Extend object dynamically |

---

## 💻 TypeScript Implementation

```typescript
// ─────────────────────────────────────────
// Example: JSON ↔ XML Adapter
// ─────────────────────────────────────────

interface DataParser {
  parse(data: string): Record<string, any>;
  stringify(obj: Record<string, any>): string;
}

// Third-party library chỉ hiểu XML
class XmlParser {
  parseXml(xmlString: string): Element {
    // Simplified XML parsing logic
    console.log(`📄 [XML Parser] Parsing: ${xmlString}`);
    return { tagName: 'root', children: [] } as Element;
  }

  toXml(obj: Record<string, any>): string {
    const pairs = Object.entries(obj).map(([k, v]) => `<${k}>${v}</${k}>`).join('');
    return `<root>${pairs}</root>`;
  }
}

interface Element {
  tagName: string;
  children: Element[];
  getAttribute(name: string): string | null;
  textContent: string;
}

// Adapter: XML → JSON interface
class XmlToJsonAdapter implements DataParser {
  constructor(private xmlParser: XmlParser) {}

  parse(data: string): Record<string, any> {
    const element = this.xmlParser.parseXml(data);
    return this.elementToObject(element);
  }

  stringify(obj: Record<string, any>): string {
    return this.xmlParser.toXml(obj);
  }

  private elementToObject(el: Element): Record<string, any> {
    // Convert XML Element → plain object
    return { tagName: el.tagName, content: 'parsed' };
  }
}

// Client: chỉ biết DataParser interface
function processData(parser: DataParser, data: string): void {
  const obj = parser.parse(data);
  console.log('📦 Parsed data:', obj);
  const back = parser.stringify(obj);
  console.log('📄 Stringified:', back);
}

const adapter = new XmlToJsonAdapter(new XmlParser());
processData(adapter, '<user><name>John</name><age>30</age></user>');
```

---

## 📝 LeetCode Problems áp dụng

- [Design Linked List](https://leetcode.com/problems/design-linked-list/) — adapter pattern cho các node operations
- [Implement Queue using Stacks](https://leetcode.com/problems/implement-queue-using-stacks/) — Adapter: Stack → Queue interface
- [Implement Stack using Queues](https://leetcode.com/problems/implement-stack-using-queues/) — Adapter: Queue → Stack interface

---

## ✅ Pros / ❌ Cons

**Ưu điểm:**
- ✅ **Open/Closed** — thêm adapter mới mà không sửa code cũ
- ✅ **Single Responsibility** — tách biệt việc biến đổi interface và business logic
- ✅ **Integrate incompatible interfaces** — dùng legacy code với code mới không conflict
- ✅ **Testability** — dễ mock adapter khi test

**Nhược điểm:**
- ❌ **Overhead** — thêm layer trung gian → performance penalty nhỏ
- ❌ **Complexity** — nhiều adapter classes → khó maintain nếu overused
- ❌ **Not all differences can be adapted** — nếu interface quá khác nhau, có thể không adapter được

---

## ⚠️ Khi nào nên / không nên dùng

**Nên dùng khi:**
- ✅ Cần integrate code có interface không tương thích (legacy + new, 2 third-party)
- ✅ Muốn reuse existing class nhưng interface không phù hợp
- ✅ Đang refactoring và muốn chuyển dần từ interface cũ sang mới

**Không nên dùng khi:**
- ❌ Interface đã tương thích — không cần adapter thừa
- ❌ Chỉ cần thêm behavior mới — dùng **Decorator**
- ❌ Cần đơn giản hóa subsystem phức tạp — dùng **Facade**

---

## 🚫 Common Mistakes / Pitfalls

1. **Adapter thay đổi behavior thay vì interface**
   ```typescript
   // ❌ Sai: Adapter thêm logic nghiệp vụ, không phải chỉ biến đổi interface
   class BadAdapter implements Target {
     doSomething() {
       this.adaptee.differentMethod(); // ✅ Gọi đúng method
       logToServer();                  // ❌ Thêm side effect!
       sendNotification();              // ❌ Thêm side effect!
     }
   }
   // → Adapter nên chỉ biến đổi interface, không thêm business logic
   ```

2. **Two-way Adapter phức tạp không cần thiết**
   ```typescript
   // ❌ Thừa: Tạo adapter có thể convert A→B VÀ B→A khi chỉ cần 1 chiều
   // → Chỉ tạo 1 chiều (A → Target) đủ cho use case
   ```

---

## 🎤 Interview Q&A

**Q: Adapter Pattern là gì? Khi nào dùng?**
> A: Adapter là wrapper giữa hai interface không tương thích. Client gọi Adapter qua Target interface, Adapter gọi Adaptee (thư viện thực sự) và biến đổi data giữa hai interface. Dùng khi cần integrate thư viện/thiện có interface khác, hoặc đang migrate từ hệ thống cũ sang mới.

**Q: Adapter vs Decorator khác nhau thế nào?**
> A: Adapter **thay đổi interface** (A → B interface) — object mới có interface khác. Decorator **thêm behavior** mà interface vẫn giữ nguyên — object mới có **thêm** chức năng. Nói đơn giản: Adapter làm cho "cái hộp vuông dùng được với ổ tròn"; Decorator là "lắp thêm bánh xe vào cái hộp".

**Q: Adapter có phải là anti-pattern không?**
> A: Không, Adapter là pattern hợp lệ. Tuy nhiên, nếu thấy mình cần quá nhiều adapters, đó là **warning sign** — có thể design ban đầu có vấn đề, hoặc nên dùng facade để tổ chức lại subsystem.
