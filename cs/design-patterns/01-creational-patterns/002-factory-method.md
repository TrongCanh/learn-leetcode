# 🏭 Factory Method Pattern

## 🎯 Problem & Motivation

**Bài toán:** Bạn cần tạo object nhưng **không muốn hard-code** class cụ thể cần tạo. Ví dụ: một hệ thống logistics cần tạo transport (Ship, Truck, Drone) — class nào được tạo phụ thuộc vào config hoặc user input.

**Tại sao không dùng `new` trực tiếp?**

```typescript
// ❌ Code tồi: hard-coded, khó mở rộng
const transport = new Truck(); // Nếu cần Ship thì sao? Sửa code?
deliver(transport);
```

**Factory Method giải quyết:** Đưa việc khởi tạo vào **subclass**, để client chỉ cần biết **interface** mà không cần biết concrete class.

---

## 💡 Use Cases

1. **UI Framework** — Tạo button theo platform: `createButton()` trả về `WindowsButton` (Windows) hoặc `MacButton` (macOS) mà client không cần biết
2. **Logistics App** — Tạo transport theo region hoặc config
3. **Document App** — Tạo document: `createDocument()` trả về `PDFDocument`, `WordDocument` tùy loại project
4. **Payment Gateway** — Tạo payment processor: Stripe, PayPal, VNPay — factory quyết định dựa trên config

---

## ❌ Before (Không dùng Factory Method)

```typescript
// ❌ Mỗi lần thêm payment mới → sửa hàm này
function createPaymentProcessor(type: string) {
  if (type === 'stripe') {
    return new StripeProcessor(); // Hard-coded
  } else if (type === 'paypal') {
    return new PayPalProcessor();
  } else if (type === 'vnpay') {
    return new VNPayProcessor();
  }
  // ... thêm càng nhiều if/else → code càng rối
  throw new Error('Unknown payment type');
}

// Client
const processor = createPaymentProcessor('stripe');
processor.charge(100);
```

→ **Vấn đề:** Thêm payment type mới → phải sửa `createPaymentProcessor`. Vi phạm **Open/Closed Principle** (open for extension, closed for modification).

---

## ✅ After (Dùng Factory Method)

```typescript
// ─────────────────────────────────────────
// 1. Định nghĩa interface — client chỉ cần biết interface này
// ─────────────────────────────────────────
interface PaymentProcessor {
  charge(amount: number): Promise<void>;
  refund(transactionId: string): Promise<void>;
}

// ─────────────────────────────────────────
// 2. Các concrete implementations
// ─────────────────────────────────────────
class StripeProcessor implements PaymentProcessor {
  async charge(amount: number): Promise<void> {
    console.log(`💳 [Stripe] Charging $${amount}`);
    // Stripe API call
  }
  async refund(transactionId: string): Promise<void> {
    console.log(`💳 [Stripe] Refunding ${transactionId}`);
  }
}

class PayPalProcessor implements PaymentProcessor {
  async charge(amount: number): Promise<void> {
    console.log(`🅿️ [PayPal] Charging $${amount}`);
  }
  async refund(transactionId: string): Promise<void> {
    console.log(`🅿️ [PayPal] Refunding ${transactionId}`);
  }
}

class VNPayProcessor implements PaymentProcessor {
  async charge(amount: number): Promise<void> {
    console.log(`🇻🇳 [VNPay] Charging $${amount}`);
  }
  async refund(transactionId: string): Promise<void> {
    console.log(`🇻🇳 [VNPay] Refunding ${transactionId}`);
  }
}

// ─────────────────────────────────────────
// 3. Factory Method — mỗi factory tạo một loại
// ─────────────────────────────────────────
abstract class PaymentProcessorFactory {
  // Factory Method — subclass quyết định tạo gì
  protected abstract createProcessor(): PaymentProcessor;

  // Template: business logic xung quanh việc tạo object
  public processPayment(amount: number): void {
    const processor = this.createProcessor();
    console.log(`📋 Processing payment via ${processor.constructor.name}`);
    processor.charge(amount);
  }
}

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
// 4. Client — hoàn toàn tách biệt khỏi concrete class
// ─────────────────────────────────────────
function checkout(factory: PaymentProcessorFactory, amount: number) {
  factory.processPayment(amount);
}

// Thêm payment mới? Chỉ cần tạo class mới + factory mới, KHÔNG sửa code cũ
checkout(new StripeFactory(), 100);
checkout(new PayPalFactory(), 200);
```

→ **Cải thiện:** Thêm `CryptoProcessor`? Tạo `CryptoFactory extends PaymentProcessorFactory` — không sửa bất kỳ code nào hiện có!

---

## 🏗️ UML Diagram

```
              ┌──────────────────────────┐
              │   Creator (abstract)      │
              ├──────────────────────────┤
              │ + factoryMethod(): Product│
              │ + someOperation()         │
              └──────────┬───────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                              │
          ▼                              ▼
┌─────────────────────┐    ┌─────────────────────┐
│  ConcreteCreatorA  │    │  ConcreteCreatorB  │
├─────────────────────┤    ├─────────────────────┤
│ + factoryMethod()   │    │ + factoryMethod()  │
│   → ProductA        │    │   → ProductB      │
└─────────────────────┘    └─────────────────────┘

              ┌──────────────────────────┐
              │      Product (interface)  │
              ├──────────────────────────┤
              │ + doSomething()          │
              └──────────┬───────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                              │
          ▼                              ▼
┌─────────────────────┐    ┌─────────────────────┐
│   ConcreteProductA  │    │   ConcreteProductB │
└─────────────────────┘    └─────────────────────┘
```

---

## 🔍 Step-by-step Trace

**Scenario:** Client chọn thanh toán qua PayPal, amount = $150.

```
Bước 1: Client gọi
  checkout(new PayPalFactory(), 150)

Bước 2: checkout() gọi
  paypalFactory.processPayment(150)

Bước 3: processPayment() gọi factory method
  const processor = this.createProcessor()
                    ↑
                    PayPalFactory.createProcessor()

Bước 4: createProcessor() tạo
  return new PayPalProcessor()

Bước 5: processPayment() gọi
  processor.charge(150)
        ↓
  PayPalProcessor.charge(150)

Output: 🅿️ [PayPal] Charging $150

→ Client không biết PayPalProcessor tồn tại!
→ Chỉ biết PaymentProcessor interface ✅
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Cách dùng Factory Method |
|---------------------|------------------------|
| **React `React.createElement()`** | Tạo React element (DOM, Native, Portal) tùy type |
| **Java `java.util.Calendar.getInstance()`** | Factory method trả về Calendar instance theo locale |
| **Java `java.net.URLStreamHandlerFactory`** | Tạo protocol handler động |
| **TypeScript `Array.from()`** | Factory method tạo array từ iterable |
| **React Router `createBrowserRouter()`** | Factory tạo router với config |

---

## 📊 So sánh với Patterns liên quan

| Criteria | **Factory Method** | Abstract Factory | Builder |
|----------|-------------------|-----------------|---------|
| Mục đích | Tạo **1 loại** product | Tạo **họ related products** | Tạo **1 product phức tạp**, step-by-step |
| Hierarchy | 1 Creator → 1 Product | Nhiều Creators → Nhiều Products | 1 Director → 1 Builder → 1 Product |
| Khi dùng | Cần tạo object nhưng để subclass quyết loại | Cần tạo **họ objects** liên quan | Object có nhiều tham số / cấu hình |
| Ví dụ | Logistics transport | UI across platforms | HTTP request với nhiều headers |

---

## 💻 TypeScript Implementation

```typescript
// ─────────────────────────────────────────
// Framework-agnostic example: Document Creator
// ─────────────────────────────────────────

// Product Interface
interface Document {
  open(): void;
  save(): void;
  close(): void;
}

// Concrete Products
class PDFDocument implements Document {
  open() { console.log('📄 Opening PDF'); }
  save() { console.log('💾 Saving PDF'); }
  close() { console.log('🚪 Closing PDF'); }
}

class WordDocument implements Document {
  open() { console.log('📄 Opening Word'); }
  save() { console.log('💾 Saving Word'); }
  close() { console.log('🚪 Closing Word'); }
}

class MarkdownDocument implements Document {
  open() { console.log('📄 Opening Markdown'); }
  save() { console.log('💾 Saving Markdown'); }
  close() { console.log('🚪 Closing Markdown'); }
}

// Creator (abstract)
abstract class DocumentCreator {
  // Factory Method — subclasses override
  protected abstract createDocument(): Document;

  // Template operation
  public editDocument(filename: string): void {
    const doc = this.createDocument();
    doc.open();
    console.log(`   Editing: ${filename}`);
    doc.save();
    doc.close();
  }
}

// Concrete Creators
class PDFCreator extends DocumentCreator {
  protected createDocument(): Document {
    return new PDFDocument();
  }
}

class WordCreator extends DocumentCreator {
  protected createDocument(): Document {
    return new WordDocument();
  }
}

class MarkdownCreator extends DocumentCreator {
  protected createDocument(): Document {
    return new MarkdownDocument();
  }
}

// Client — chỉ biết abstract creator
function openAndEdit(creator: DocumentCreator, filename: string): void {
  creator.editDocument(filename);
}

openAndEdit(new PDFCreator(), 'report.pdf');
openAndEdit(new MarkdownCreator(), 'readme.md');
```

---

## 📝 LeetCode Problems áp dụng

- [Serialize and Deserialize BST](https://leetcode.com/problems/serialize-and-deserialize-bst/) — Factory cho TreeNode construction
- [Flatten Nested List Iterator](https://leetcode.com/problems/flatten-nested-list-iterator/) — Factory tạo iterator từ nested structure
- [Design HashMap](https://leetcode.com/problems/design-hashmap/) — Factory tạo bucket strategy

---

## ✅ Pros / ❌ Cons

**Ưu điểm:**
- ✅ **Open/Closed Principle** — thêm product mới mà không sửa code cũ
- ✅ **Single Responsibility** — code tạo object nằm ở một chỗ (factory)
- ✅ **Loose coupling** — client chỉ phụ thuộc vào interface, không concrete class
- ✅ Dễ test — có thể mock factory để test client

**Nhược điểm:**
- ❌ Code phức tạp hơn — cần tạo nhiều subclass cho mỗi product
- ❌ Đôi khi **over-engineering** — nếu chỉ có 1-2 loại product, dùng `new` cho nhanh
- ❌ Factory con phải return đúng type — không compile-time type checking nếu dùng interface

---

## ⚠️ Khi nào nên / không nên dùng

**Nên dùng khi:**
- ✅ Không biết trước loại object cần tạo (phụ thuộc config, input, env)
- ✅ Muốn để subclass quyết định class cụ thể
- ✅ Cần tách biệt code tạo object và code sử dụng object
- ✅ Thêm loại product mới thường xuyên

**Không nên dùng khi:**
- ❌ Chỉ có 1-2 loại product cố định — dùng `new` cho đơn giản
- ❌ Object creation đơn giản (chỉ `new Foo()` là đủ) — đừng over-engineer
- ❌ Cần tạo **họ related products** (nhiều families) — dùng **Abstract Factory**

---

## 🚫 Common Mistakes / Pitfalls

1. **Factory Method dùng `new` thay vì override**
   ```typescript
   // ❌ Sai: Gọi new trong base class → vô hiệu hóa factory
   abstract class Creator {
     protected abstract createProduct(): Product;

     public someOperation() {
       // Base gọi new, không phải factory method!
       const p = new ConcreteProduct(); // ❌
     }
   }

   // ✅ Đúng: Luôn dùng this.createProduct()
   public someOperation() {
     const p = this.createProduct(); // ✅ Gọi polymorphic factory method
   }
   ```

2. **Overusing Factory cho objects đơn giản**
   ```typescript
   // ❌ Thừa: class Point có 2 tham số, không cần factory
   class PointFactory {
     static createCartesian(x: number, y: number) { return new Point(x, y); }
     static createPolar(r: number, theta: number) { return new Point(r * Math.cos(theta), r * Math.sin(theta)); }
   }
   // ⚠️ Over-engineering cho 2 constructors thông thường
   ```

---

## 🎤 Interview Q&A

**Q: Factory Method là gì? Khác gì Abstract Factory?**
> A: Factory Method dùng inheritance — một method được override bởi subclass để quyết định tạo object nào. Abstract Factory dùng composition — một object chứa nhiều factory methods để tạo **họ related products**. Dùng Factory Method khi có 1 product hierarchy; Abstract Factory khi có nhiều families of products.

**Q: Khi nào dùng Factory Method thay vì `new`?**
> A: Khi type của object phụ thuộc vào config, input, hoặc environment mà không biết trước lúc compile. Hoặc khi việc tạo object phức tạp và muốn tách ra khỏi business logic. Nếu chỉ có 1-2 concrete class cố định, `new` là đủ.

**Q: Factory Method liên quan gì đến Dependency Inversion?**
> A: Factory Method tuân theo Dependency Inversion Principle (D trong SOLID) — high-level module (client) không phụ thuộc vào low-level module (concrete class), mà cả hai đều phụ thuộc vào abstraction (interface). Client dùng factory qua interface, không biết concrete class nào được tạo.
