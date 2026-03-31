# 🦴 Template Method Pattern

## 🎯 Problem & Motivation

**Bài tu toán:** Bạn có một **thuật toán với skeleton cố định**, nhưng một vài steps có **implementations khác nhau** tùy subclass.

**Ví dụ thực tế:** Quy trình mua hàng online:
1. Select product (luôn giống nhau)
2. Process payment (thay đổi: card, PayPal, COD)
3. Ship (thay đổi: express, standard, pickup)
4. Send confirmation (luôn giống nhau)

Mà không muốn duplicate code ở bước 1, 3, 4.

**Template Method giải quyết:** Định nghĩa **skeleton của thuật toán** trong base class, để subclass **override only specific steps**.

---

## 💡 Use Cases

1. **Data Processing Pipeline** — Read → Transform → Validate → Write (read/write thay đổi, validate luôn giống)
2. **Test Framework** — Setup → Execute → Teardown (setup/teardown thay đổi, execute luôn giống)
3. **Game AI** — Start → PlayTurn → CheckWin → End (Start/End giống, PlayTurn khác)
4. **Document Export** — Validate → Format → Compress → Save (validate/save giống, format/compress thay đổi)
5. **Build Pipeline** — Checkout → Install → Build → Test → Deploy (steps giống nhau, implementation khác)

---

## ❌ Before (Không dùng Template Method)

```typescript
// ❌ Mỗi class duplicate skeleton
class CSVDataMiner {
  analyze(file: string) {
    this.openFile(file);     // Giống
    this.extractData();      // Khác
    this.parseData();        // Khác
    this.sendReport();       // Giống
    this.closeFile();        // Giống
  }
  openFile(f: string) { console.log(`📂 Open ${f}`); }
  closeFile() { console.log('📂 Close file'); }
  sendReport() { console.log('📧 Send report via email'); }
  extractData() { /* CSV specific */ }
  parseData() { /* CSV specific */ }
}

class JSONDataMiner {
  analyze(file: string) {
    this.openFile(file);     // Giống y hệt → DUPLICATE!
    this.extractData();      // JSON specific
    this.parseData();        // JSON specific
    this.sendReport();       // Giống y hệt → DUPLICATE!
    this.closeFile();        // Giống y hệt → DUPLICATE!
  }
  openFile(f: string) { console.log(`📂 Open ${f}`); }
  closeFile() { console.log('📂 Close file'); }
  sendReport() { console.log('📧 Send report via email'); }
  extractData() { /* JSON specific */ }
  parseData() { /* JSON specific */ }
}
```

→ **Vấn đề:** Code skeleton (openFile, closeFile, sendReport) trùng lặp trong mỗi class. Sửa logic → sửa tất cả.

---

## ✅ After (Dùng Template Method)

```typescript
// ─────────────────────────────────────────
// 1. Abstract Class — định nghĩa Template Method
// ─────────────────────────────────────────
abstract class DataMiner {
  // 🎯 TEMPLATE METHOD — skeleton của thuật toán
  // Không override được — subclasses phải chạy đúng thứ tự này
  public analyze(file: string): void {
    this.openFile(file);
    this.extractData();
    this.parseData();
    this.sendReport();
    this.closeFile();
  }

  // ─── Common steps — default implementation ───
  protected sendReport(): void {
    console.log('📧 Sending report via email...');
  }

  protected closeFile(): void {
    console.log('📂 Closing file...');
  }

  // ─── Abstract steps — subclasses phải override ───
  protected abstract openFile(file: string): void;
  protected abstract extractData(): void;
  protected abstract parseData(): void;

  // ─── Hook — optional override ───
  protected getFileType(): string {
    return 'unknown';
  }
}

// ─────────────────────────────────────────
// 2. Concrete Classes — override only specific steps
// ─────────────────────────────────────────
class CSVDataMiner extends DataMiner {
  protected openFile(file: string): void {
    console.log(`📂 [CSV] Opening: ${file}`);
  }

  protected extractData(): void {
    console.log('📊 [CSV] Extracting rows...');
  }

  protected parseData(): void {
    console.log('🔢 [CSV] Parsing comma-separated values...');
  }
}

class JSONDataMiner extends DataMiner {
  protected openFile(file: string): void {
    console.log(`📂 [JSON] Opening: ${file}`);
  }

  protected extractData(): void {
    console.log('📊 [JSON] Extracting JSON object...');
  }

  protected parseData(): void {
    console.log('🔢 [JSON] Parsing JSON structure...');
  }

  // Override hook — customize behavior
  protected getFileType(): string {
    return 'json';
  }
}

class XMLDataMiner extends DataMiner {
  protected openFile(file: string): void {
    console.log(`📂 [XML] Opening: ${file}`);
  }

  protected extractData(): void {
    console.log('📊 [XML] Extracting XML elements...');
  }

  protected parseData(): void {
    console.log('🔢 [XML] Parsing DOM tree...');
  }

  // Override the common step!
  protected sendReport(): void {
    console.log('📧 [XML] Sending XML-formatted report via API...');
  }
}

// ─────────────────────────────────────────
// 3. Client — gọi template method, không cần biết algorithm
// ─────────────────────────────────────────
function runAnalysis(miner: DataMiner, file: string) {
  console.log(`\n🚀 Starting analysis for: ${file}`);
  miner.analyze(file); // Template method — fixed order!
  console.log('✅ Analysis complete\n');
}

runAnalysis(new CSVDataMiner(), 'sales.csv');
// 🚀 Starting analysis: sales.csv
// 📂 [CSV] Opening: sales.csv
// 📊 [CSV] Extracting rows...
// 🔢 [CSV] Parsing comma-separated values...
// 📧 Sending report via email...
// 📂 Closing file...
// ✅ Analysis complete

runAnalysis(new JSONDataMiner(), 'users.json');
// 🚀 Starting analysis: users.json
// 📂 [JSON] Opening: users.json
// ...

runAnalysis(new XMLDataMiner(), 'config.xml');
// 🚀 Starting analysis: config.xml
// 📂 [XML] Opening: config.xml
// 📊 [XML] Extracting XML elements...
// 🔢 [XML] Parsing DOM tree...
// 📧 [XML] Sending XML-formatted report via API... ← overridden!
// 📂 Closing file...
```

→ **Cải thiện:** Skeleton (analyze) viết một lần trong base class. Subclasses chỉ override steps cần thiết. Thêm format mới? Tạo class extends `DataMiner`, override 3-4 methods.

---

## 🏗️ UML Diagram

```
┌──────────────────────────────────────────────────┐
│            AbstractClass (DataMiner)              │
├──────────────────────────────────────────────────┤
│ +analyze(file): void        ←─── TEMPLATE METHOD │
│ #openFile(file)              (final, not override)│
│ #extractData()              (abstract)            │
│ #parseData()                (abstract)             │
│ #sendReport()               (default)             │
│ #closeFile()                (default)              │
└──────────┬───────────────┬────────────────────────┘
           │ extends        │ extends
           ▼                ▼
┌──────────────────┐  ┌──────────────────┐
│  CSVDataMiner    │  │  JSONDataMiner   │
├──────────────────┤  ├──────────────────┤
│ #openFile() ✅   │  │ #openFile() ✅   │
│ #extractData() ✅│  │ #extractData() ✅│
│ #parseData() ✅  │  │ #parseData() ✅  │
│ (uses default)   │  │ (uses default)   │
│ sendReport()     │  │ sendReport()     │
│ closeFile()      │  │ closeFile()      │
└──────────────────┘  └──────────────────┘
```

---

## 🔍 Step-by-step Trace

**Scenario:** CSVDataMiner.analyze('sales.csv')

```
Bước 1: miner.analyze('sales.csv')
  → DataMiner.analyze() (Template Method)

Bước 2: this.openFile('sales.csv')
  → CSVDataMiner.openFile() — override
  → 📂 [CSV] Opening: sales.csv

Bước 3: this.extractData()
  → CSVDataMiner.extractData() — override
  → 📊 [CSV] Extracting rows...

Bước 4: this.parseData()
  → CSVDataMiner.parseData() — override
  → 🔢 [CSV] Parsing...

Bước 5: this.sendReport()
  → DataMiner.sendReport() — default (không override)
  → 📧 Sending report via email...

Bước 6: this.closeFile()
  → DataMiner.closeFile() — default
  → 📂 Closing file...

→ Subclass chỉ implement 3 methods, không phải 5!
→ Skeleton logic an toàn, không bị subclass override sai
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Cách dùng Template Method |
|--------------------|-------------------------|
| **JUnit Test** | `@Before → @Test → @After` — subclasses override steps |
| **Spring `AbstractDao`** | Template method cho CRUD, override find/insert |
| **Java `InputStream.read()`** | Template: open → read → close |
| **Node.js Mongoose `Model.create()`** | Hooks: validate → pre-save → save → post-save |
| **Express middleware** | `next()` pattern = implicit template |

---

## 📊 So sánh với Patterns liên quan

| Criteria | **Template Method** | Strategy | State |
|----------|--------------------|----------|-------|
| Mechanism | Inheritance (compile-time) | Composition (runtime) | Composition (runtime) |
| Override | Override **steps** | Replace **entire algorithm** | Replace **behavior by state** |
| Algorithm structure | Fixed skeleton | Varies | Varies by state |
| When | Steps giống nhau, implementation khác | Algorithm khác nhau hoàn toàn | State machine |

---

## 💻 TypeScript Implementation

```typescript
// ─────────────────────────────────────────
// Example: Test Framework
// ─────────────────────────────────────────

abstract class TestCase {
  // Template Method — fixed order
  public run(): void {
    this.setUp();
    try {
      this.testBody();
      this.onSuccess();
    } catch (error) {
      this.onFailure(error);
    } finally {
      this.tearDown();
    }
  }

  // Hooks (optional override)
  protected onSuccess(): void {
    console.log(`✅ ${this.constructor.name}.testBody() passed`);
  }

  protected onFailure(error: any): void {
    console.log(`❌ ${this.constructor.name}.testBody() failed: ${error}`);
  }

  // Abstract (must override)
  protected abstract testBody(): void;

  // Default implementation (can override)
  protected setUp(): void {
    console.log(`🔧 [${this.constructor.name}] setUp()`);
  }

  protected tearDown(): void {
    console.log(`🧹 [${this.constructor.name}] tearDown()`);
  }
}

class CalculatorTest extends TestCase {
  private calc!: Calculator;

  protected setUp(): void {
    super.setUp();
    this.calc = new Calculator();
    console.log(`   → Calculator instance created`);
  }

  protected testBody(): void {
    const result = this.calc.add(2, 3);
    if (result !== 5) throw new Error(`Expected 5, got ${result}`);
    console.log(`   → add(2,3) = ${result}`);
  }

  protected tearDown(): void {
    this.calc = undefined!;
    super.tearDown();
  }
}

class FailingTest extends TestCase {
  protected testBody(): void {
    throw new Error('Intentional failure');
  }
}

class Calculator {
  add(a: number, b: number) { return a + b; }
}

// Run tests
const tests: TestCase[] = [
  new CalculatorTest(),
  new FailingTest(),
];

for (const test of tests) {
  test.run();
  console.log('---');
}
```

---

## 📝 LeetCode Problems áp dụng

- Template Method ít xuất hiện trong LeetCode nhưng phổ biến trong **System Design**: thiết kế data pipeline, game engine, test framework.

---

## ✅ Pros / ❌ Cons

**Ưu điểm:**
- ✅ **Code reuse** — skeleton viết một lần, không duplicate
- ✅ **Single Responsibility** — base class quản lý skeleton, subclasses quản lý steps
- ✅ **Reverse inheritance** — có thể call parent methods từ subclass
- ✅ **Hooks** — subclasses có thể override optional steps

**Nhược điểm:**
- ❌ **Tight coupling với inheritance** — khó thay đổi skeleton (đã compile)
- ❌ **Liskov Substitution risk** — subclass override default step có thể break base contract
- ❌ **Inheritance hierarchy** — có thể phức tạp với nhiều levels

---

## ⚠️ Khi nào nên / không nên dùng

**Nên dùng khi:**
- ✅ Có skeleton algorithm cố định với steps thay đổi
- ✅ Muốn reuse common code, chỉ override specific steps
- ✅ Cần **hooks** — optional steps mà subclasses có thể override

**Không nên dùng khi:**
- ❌ Algorithm hoàn toàn khác nhau giữa subclasses — dùng **Strategy**
- ❌ Cần **runtime flexibility** — Template Method cố định lúc compile

---

## 🚫 Common Mistakes / Pitfalls

1. **Override template method — phá vỡ algorithm**
   ```typescript
   // ❌ Sai: Subclass override analyze() — phá vỡ skeleton!
   class BadCSVDataMiner extends DataMiner {
     public analyze(file: string): void { // ❌ KHÔNG NÊN override!
       // Skip steps → logic inconsistent!
     }
   }

   // ✅ Đúng: Dùng final để ngăn override (trong Java/C++)
   // public final analyze() { ... } ← Java syntax
   ```

2. **Không gọi super method khi cần**
   ```typescript
   // ❌ Sai: Override setUp nhưng quên gọi super
   protected setUp(): void {
     // ❌ super.setUp() bị bỏ qua!
     this.calc = new Calculator();
   }

   // ✅ Đúng: Gọi super khi cần
   protected setUp(): void {
     super.setUp(); // ✅ Setup chain
     this.calc = new Calculator();
   }
   ```

---

## 🎤 Interview Q&A

**Q: Template Method là gì? Khi nào dùng?**
> A: Template Method định nghĩa skeleton của algorithm trong base class, để subclasses override specific steps. Một method `analyze()` gọi theo thứ tự `openFile() → extract() → parse() → sendReport() → closeFile()`. Steps cố định (sendReport, closeFile) có default implementation; steps thay đổi (openFile, extract, parse) là abstract. Dùng khi có algorithm skeleton cố định nhưng implementations của steps khác nhau.

**Q: Template Method khác Strategy như thế nào?**
> A: Template Method dùng **inheritance** — base class có method chính, subclasses override steps. Strategy dùng **composition** — object chứa algorithm được inject. Template Method cố định về cấu trúc (compile time), Strategy hoán đổi được hoàn toàn (runtime).

**Q: Hook trong Template Method là gì?**
> A: Hook là method có **default implementation** mà subclasses có thể override nếu cần. Không bắt buộc override như abstract methods. Ví dụ: `onSuccess()` và `onFailure()` trong test framework — subclasses có thể override để customize logging.
