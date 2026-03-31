# 🏭 Factory Method Pattern

## 🎯 Problem & Motivation

**Bài toán thực tế:** Bạn cần tạo object nhưng **không muốn hard-code** class cụ thể. Ví dụ: hệ thống thanh toán cần support Stripe, PayPal, VNPay — class nào được tạo phụ thuộc config hoặc user input.

**Tại sao `new` trực tiếp là vấn đề?**

```typescript
// ❌ Hard-coded — thêm payment method mới phải sửa code
async function checkout(paymentType: string, amount: number) {
  if (paymentType === 'stripe') {
    const payment = new StripeGateway(); // ❌ Client biết StripeGateway tồn tại
    await payment.charge(amount);
  } else if (paymentType === 'paypal') {
    const payment = new PayPalGateway();
    await payment.sendMoney(amount);
  } else if (paymentType === 'vnpay') {
    const payment = new VNPayGateway();
    await payment.process(amount);
  }
  // ⚠️ Thêm method mới? Sửa function này!
}
```

→ **Hậu quả:** Client phụ thuộc trực tiếp vào concrete classes. Thêm method mới → phải sửa client. Vi phạm **Open/Closed Principle** (open for extension, closed for modification).

**Factory Method giải quyết:** Đưa việc khởi tạo vào **subclass**, để client chỉ cần biết **interface**, không biết concrete class.

---

## 💡 Use Cases

1. **Payment Gateways** — Tạo processor theo config/env: Stripe cho US, PayPal cho EU, VNPay cho Vietnam
2. **UI Component Factory** — Tạo button theo platform: `WindowsButton` (Windows), `MacButton` (macOS), `LinuxButton` (Linux)
3. **Document Parsers** — Tạo parser theo file type: `PDFParser`, `WordParser`, `MarkdownParser`
4. **Database Drivers** — Tạo connection theo config: `MySQLConnection`, `PostgreSQLConnection`, `MongoDBConnection`
5. **Notification Channels** — Tạo sender theo user preference: `EmailSender`, `SMSSender`, `PushSender`
6. **Strategy Selector** — Chọn algorithm theo data size: small → quicksort, large → mergesort

---

## ❌ Before (Không dùng Factory Method)

```typescript
// ❌ Client phải biết tất cả concrete classes
async function createReport(type: 'pdf' | 'csv' | 'excel') {
  if (type === 'pdf') {
    const generator = new PDFReportGenerator();
    return generator.generate();
  } else if (type === 'csv') {
    const generator = new CSVReportGenerator();
    return generator.generate();
  } else if (type === 'excel') {
    const generator = new ExcelReportGenerator();
    return generator.generate();
  }
  // ⚠️ 3 concrete classes rải trong if/else → khó maintain
}
```

→ **Hậu quả:** Mỗi thay đổi (thêm format, đổi logic) đều phải sửa `createReport`. Test từng format khó vì phụ thuộc vào nhau.

---

## ✅ After (Dùng Factory Method)

```typescript
// ─────────────────────────────────────────
// 1. Product Interface — Client chỉ biết interface này
// ─────────────────────────────────────────
interface PaymentProcessor {
  charge(amount: number): Promise<ChargeResult>;
  refund(transactionId: string): Promise<RefundResult>;
}

interface ChargeResult {
  transactionId: string;
  status: 'success' | 'failed';
  amount: number;
}

interface RefundResult {
  refundId: string;
  status: 'success' | 'failed';
}

// ─────────────────────────────────────────
// 2. Concrete Products — Implementation thực sự
// ─────────────────────────────────────────
class StripeProcessor implements PaymentProcessor {
  async charge(amount: number): Promise<ChargeResult> {
    console.log(`💳 [Stripe] Charging $${amount}...`);
    return {
      transactionId: `stripe_${Date.now()}`,
      status: 'success',
      amount
    };
  }

  async refund(transactionId: string): Promise<RefundResult> {
    console.log(`💳 [Stripe] Refunding ${transactionId}...`);
    return { refundId: `stripe_refund_${Date.now()}`, status: 'success' };
  }
}

class PayPalProcessor implements PaymentProcessor {
  async charge(amount: number): Promise<ChargeResult> {
    console.log(`🅿️ [PayPal] Charging $${amount}...`);
    return {
      transactionId: `paypal_${Date.now()}`,
      status: 'success',
      amount
    };
  }

  async refund(transactionId: string): Promise<RefundResult> {
    console.log(`🅿️ [PayPal] Refunding ${transactionId}...`);
    return { refundId: `paypal_refund_${Date.now()}`, status: 'success' };
  }
}

class VNPayProcessor implements PaymentProcessor {
  async charge(amount: number): Promise<ChargeResult> {
    console.log(`🇻🇳 [VNPay] Charging $${amount}...`);
    return {
      transactionId: `vnpay_${Date.now()}`,
      status: 'success',
      amount
    };
  }

  async refund(transactionId: string): Promise<RefundResult> {
    console.log(`🇻🇳 [VNPay] Refunding ${transactionId}...`);
    return { refundId: `vnpay_refund_${Date.now()}`, status: 'success' };
  }
}

// ─────────────────────────────────────────
// 3. Creator (abstract) — định nghĩa factory method
// ─────────────────────────────────────────
abstract class PaymentProcessorFactory {
  // Factory Method — subclass quyết định tạo product gì
  protected abstract createProcessor(): PaymentProcessor;

  // Template operation — business logic xung quanh việc tạo object
  public async processPayment(amount: number): Promise<void> {
    const processor = this.createProcessor();
    console.log(`📋 Processing via ${processor.constructor.name}`);

    const result = await processor.charge(amount);

    if (result.status === 'success') {
      console.log(`✅ Charged $${result.amount} → ${result.transactionId}`);
    } else {
      console.log(`❌ Charge failed`);
    }
  }
}

// ─────────────────────────────────────────
// 4. Concrete Creators — override factory method
// ─────────────────────────────────────────
class StripeFactory extends PaymentProcessorFactory {
  protected createProcessor(): PaymentProcessor {
    return new StripeProcessor();
  }
}

class PayPalFactory extends PaymentProcessorFactory {
  protected createProcessor(): PaymentProcessor {
    return new PayPalProcessor();
  }
}

class VNPayFactory extends PaymentProcessorFactory {
  protected createProcessor(): PaymentProcessor {
    return new VNPayProcessor();
  }
}

// ─────────────────────────────────────────
// 5. Client — hoàn toàn tách biệt khỏi concrete classes
// ─────────────────────────────────────────
class CheckoutService {
  constructor(private factory: PaymentProcessorFactory) {}

  async checkout(amount: number) {
    // Client không biết Stripe, PayPal hay VNPay!
    // Chỉ biết factory tạo ra PaymentProcessor
    await this.factory.processPayment(amount);
  }
}

// Thêm Crypto? Chỉ cần tạo CryptoFactory — KHÔNG sửa code cũ!
const stripeCheckout = new CheckoutService(new StripeFactory());
const paypalCheckout = new CheckoutService(new PayPalFactory());
stripeCheckout.checkout(99.99);
paypalCheckout.checkout(49.99);
```

---

## 🏗️ UML Diagram

```
              ┌─────────────────────────────────┐
              │     Creator (abstract)            │
              ├─────────────────────────────────┤
              │ + factoryMethod(): Product ← ABSTRACT│
              │ + processPayment() (template)     │
              └──────────┬────────────────────────┘
                         │ extends
       ┌─────────────────┴───────────────────────┐
       ▼                                       ▼
┌───────────────────┐              ┌───────────────────┐
│  StripeFactory    │              │  PayPalFactory    │
├───────────────────┤              ├───────────────────┤
│ +createProcessor():│              │ +createProcessor():│
│   StripeProcessor │              │   PayPalProcessor │
└───────────────────┘              └───────────────────┘

              ┌─────────────────────────────────┐
              │   <<interface>> Product         │
              ├─────────────────────────────────┤
              │ + charge()                      │
              │ + refund()                      │
              └──────────┬──────────────────────┘
                         │ implements
       ┌─────────────────┴───────────────────────┐
       ▼                                       ▼
┌───────────────────┐              ┌───────────────────┐
│ StripeProcessor   │              │ PayPalProcessor   │
└───────────────────┘              └───────────────────┘
```

---

## 🔍 Step-by-step Trace

**Scenario:** Client chọn thanh toán PayPal, amount = $150.

```
Bước 1: Client gọi
  checkoutService.checkout(150)
  → CheckoutService.checkout(150)

Bước 2: CheckoutService gọi factory template
  factory.processPayment(150)
  → PaymentProcessorFactory.processPayment(150)

Bước 3: Template gọi factory method
  const processor = this.createProcessor()
                    ↑
                    PayPalFactory.createProcessor()

Bước 4: createProcessor() trả về concrete product
  return new PayPalProcessor()

Bước 5: Template gọi product method
  processor.charge(150)
        ↓
  PayPalProcessor.charge(150)

Output: 🅿️ [PayPal] Charging $150
        ✅ Charged $150 → paypal_...

→ Client hoàn toàn không biết PayPalProcessor tồn tại!
→ Client chỉ biết PaymentProcessorFactory interface ✅
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Chi tiết implementation |
|---------------------|------------------------|
| **React `React.createElement()`** | Factory tạo React element (DOM, Native, Portal) tùy type |
| **Java `java.util.Calendar.getInstance()`** | Factory method trả về Calendar theo locale |
| **Java `java.net.URLStreamHandlerFactory`** | Tạo protocol handler động theo scheme |
| **TypeScript `Array.from()`** | Factory method tạo array từ iterable/array-like |
| **Vue Router `createRouter()`** | Factory tạo router với config |
| **Express `express()`** | Factory tạo app instance — không phải class, nhưng concept tương tự |

---

## 📊 So sánh với Patterns liên quan

| Criteria | **Factory Method** | Abstract Factory | Builder |
|----------|-------------------|-----------------|---------|
| Mục đích | Tạo **1 loại** product | Tạo **họ related products** | Tạo **1 product phức tạp**, step-by-step |
| Hierarchy | 1 Creator → 1 Product | Nhiều Creators → Nhiều Products | 1 Director → 1 Builder → 1 Product |
| Khi dùng | Cần tạo object nhưng để subclass quyết loại | Cần tạo **họ objects** liên quan | Object có nhiều tham số / cấu hình |
| Object tạo | Thường đơn giản | Thường phức tạp, có liên quan | Phức tạp với nhiều optional fields |

---

## 💻 TypeScript Implementation

### Version 1: Framework-agnostic — Document Creator

```typescript
// Product Interface
interface Document {
  open(): void;
  save(filename: string): void;
  close(): void;
}

// Concrete Products
class PDFDocument implements Document {
  constructor(private filename: string) {
    console.log(`📄 [PDF] Opening "${filename}"`);
  }
  open() { console.log('📄 [PDF] Document ready'); }
  save(filename: string) { console.log(`💾 [PDF] Saving as "${filename}"`); }
  close() { console.log('🚪 [PDF] Closing document'); }
}

class WordDocument implements Document {
  constructor(private filename: string) {
    console.log(`📄 [Word] Opening "${filename}"`);
  }
  open() { console.log('📄 [Word] Document ready'); }
  save(filename: string) { console.log(`💾 [Word] Saving as "${filename}"`); }
  close() { console.log('🚪 [Word] Closing document'); }
}

// Creator (abstract)
abstract class DocumentCreator {
  protected abstract createDocument(filename: string): Document;

  // Template: mở → xử lý → lưu → đóng
  public edit(filename: string, content: string): void {
    const doc = this.createDocument(filename);
    doc.open();
    console.log(`   ✏️  Editing: "${content}"`);
    doc.save(filename);
    doc.close();
  }
}

// Concrete Creators
class PDFCreator extends DocumentCreator {
  protected createDocument(filename: string): Document {
    return new PDFDocument(filename);
  }
}

class WordCreator extends DocumentCreator {
  protected createDocument(filename: string): Document {
    return new WordDocument(filename);
  }
}

// Client
function exportDocument(creator: DocumentCreator, filename: string, content: string) {
  creator.edit(filename, content);
}

exportDocument(new PDFCreator(), 'report.pdf', 'Annual Report 2026');
```

---

### Version 2: Map-based Factory (không cần subclass cho mỗi type)

```typescript
// Factory đơn giản hơn — dùng Map thay vì inheritance
type ProductCreator<T> = () => T;

class FactoryRegistry {
  private static creators = new Map<string, ProductCreator<any>>();

  static register<T>(name: string, creator: ProductCreator<T>): void {
    FactoryRegistry.creators.set(name, creator);
  }

  static create<T>(name: string): T {
    const creator = FactoryRegistry.creators.get(name);
    if (!creator) {
      throw new Error(`❌ Unknown product type: ${name}`);
    }
    return creator();
  }
}

// Register products
FactoryRegistry.register('pdf', () => new PDFDocument('report.pdf'));
FactoryRegistry.register('word', () => new WordDocument('report.docx'));

// Client: đăng ký ở config thay vì subclass
const doc = FactoryRegistry.create<Document>('pdf');
doc.open();
```

---

## ⚖️ Trade-offs & Common Mistakes

### ✅ Khi nào nên dùng

- ✅ Không biết trước loại object cần tạo (phụ thuộc config, input, env)
- ✅ Muốn để subclass quyết định class cụ thể
- ✅ Cần tách biệt code tạo object và code sử dụng object
- ✅ Thêm loại product mới thường xuyên

### ❌ Khi nào không nên dùng

- ❌ Chỉ có 1-2 loại product cố định — dùng `new` cho nhanh
- ❌ Object creation đơn giản (chỉ `new Foo()`) — đừng over-engineer
- ❌ Cần tạo **họ related products** (nhiều families) — dùng **Abstract Factory**

### 🚫 Common Mistakes

**1. Factory Method gọi `new` trong base class**
```typescript
// ❌ Sai: Base class gọi new, không phải factory method!
abstract class BadCreator {
  public someOperation() {
    // ❌ Base gọi new cụ thể, không gọi factory method!
    const p = new ConcreteProduct();
  }
}

// ✅ Đúng: Luôn dùng this.createProduct()
public someOperation() {
  const p = this.createProduct(); // ✅ Gọi polymorphic factory method
}
```

**2. Overusing Factory cho objects đơn giản**
```typescript
// ❌ Thừa: class Point có 2 tham số, không cần factory
class PointFactory {
  static createCartesian(x: number, y: number) { return new Point(x, y); }
  static createPolar(r: number, theta: number) { return new Point(r * Math.cos(theta), r * Math.sin(theta)); }
}
// ⚠️ Over-engineering cho 2 constructors thông thường
```

**3. Quên rằng factory method trả về interface**
```typescript
// ✅ Đúng: Return interface type, không concrete type
protected abstract createProcessor(): PaymentProcessor; // ✅ Interface
// protected abstract createProcessor(): StripeProcessor; // ❌ Concrete type
```

---

## 🧪 Testing Strategies

```typescript
// Test client mà không cần biết concrete factory
describe('CheckoutService', () => {
  it('should process payment through factory', async () => {
    // Mock factory — không cần biết Stripe hay PayPal
    const mockFactory = {
      processPayment: jest.fn().mockResolvedValue(undefined)
    } as unknown as PaymentProcessorFactory;

    const service = new CheckoutService(mockFactory);
    await service.checkout(100);

    expect(mockFactory.processPayment).toHaveBeenCalledWith(100);
  });
});

// Test concrete factory
describe('StripeFactory', () => {
  it('should create StripeProcessor', () => {
    const factory = new StripeFactory();
    const processor = factory.createProcessor();
    expect(processor).toBeInstanceOf(StripeProcessor);
  });
});
```

---

## 🔄 Refactoring Path

**Từ if/else → Factory Method:**

```typescript
// ❌ Before: if/else
function createParser(type: string) {
  if (type === 'json') return new JSONParser();
  if (type === 'xml') return new XMLParser();
  throw new Error('Unknown');
}

// ✅ After: Factory Method
abstract class ParserFactory {
  abstract createParser(): Parser;
}

class JSONParserFactory extends ParserFactory {
  createParser(): Parser { return new JSONParser(); }
}

class XMLParserFactory extends ParserFactory {
  createParser(): Parser { return new XMLParser(); }
}

// ✅ Even better: Registry-based (không cần subclass)
class ParserFactoryRegistry {
  static parsers = new Map<string, () => Parser>();
  static register(type: string, factory: () => Parser) {
    this.parsers.set(type, factory);
  }
  static create(type: string): Parser {
    const factory = this.parsers.get(type);
    if (!factory) throw new Error(`Unknown type: ${type}`);
    return factory();
  }
}
```

---

## 🎤 Interview Q&A

**Q: Factory Method là gì? Khác gì Abstract Factory?**
> A: Factory Method dùng **inheritance** — một method được override bởi subclass để quyết định tạo object nào. Client gọi `createProcessor()` trên factory, subclass quyết định tạo Stripe hay PayPal. Abstract Factory tạo **họ related products** — một factory có nhiều factory methods để tạo tất cả objects trong một product family (VD: UI factory tạo Button + Menu + Dialog cho mỗi platform).

**Q: Khi nào dùng Factory Method thay vì `new`?**
> A: Khi type của object phụ thuộc vào config, input, hoặc environment mà không biết trước lúc compile. Khi việc tạo object phức tạp và muốn tách ra khỏi business logic. Khi cần thêm loại product mới thường xuyên. Nếu chỉ có 1-2 concrete class cố định, `new` là đủ.

**Q: Factory Method liên quan gì đến Dependency Inversion (SOLID)?**
> A: Factory Method tuân theo Dependency Inversion Principle — high-level module (client) không phụ thuộc vào low-level module (concrete class), mà cả hai đều phụ thuộc vào abstraction (interface). Client dùng factory qua interface, không biết concrete class nào được tạo.
