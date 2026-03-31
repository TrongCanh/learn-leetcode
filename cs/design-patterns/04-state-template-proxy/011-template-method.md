# 🦴 Template Method Pattern

## 🎯 Problem & Motivation

**Bài toán thực tế:** Bạn có một **thuật toán với skeleton cố định**, nhưng một vài steps có **implementations khác nhau** tùy subclass.

**Ví dụ thực tế:** Quy trình mua hàng online:
1. Validate items (luôn giống nhau)
2. Process payment (thay đổi: card, PayPal, COD)
3. Ship (thay đổi: express, standard, pickup)
4. Send confirmation (luôn giống nhau)

Bạn muốn viết skeleton **một lần**, và chỉ override steps thay đổi.

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
  // ⚠️ 5 steps, 3 cái giống nhau → duplicate!
}

class JSONDataMiner {
  analyze(file: string) {
    this.openFile(file);     // Giống → DUPLICATE!
    this.extractData();      // Khác
    this.parseData();        // Khác
    this.sendReport();       // Giống → DUPLICATE!
    this.closeFile();        // Giống → DUPLICATE!
  }
}
```

→ **Hậu quả:** Code skeleton (openFile, closeFile, sendReport) trùng lặp trong mỗi class. Sửa logic → sửa tất cả.

**Template Method giải quyết:** Định nghĩa **skeleton của thuật toán** trong base class, để subclass **override only specific steps**.

---

## 💡 Use Cases

1. **Data Processing Pipeline** — Read → Transform → Validate → Write (read/write thay đổi, validate luôn giống)
2. **Test Framework** — Setup → Execute → Teardown (setup/teardown thay đổi, execute luôn giống)
3. **Game AI** — Start → PlayTurn → CheckWin → End (Start/End giống, PlayTurn khác)
4. **Document Export** — Validate → Format → Compress → Save (validate/save giống, format/compress thay đổi)
5. **Build Pipeline** — Checkout → Install → Build → Test → Deploy (steps giống, implementation khác)

---

## ❌ Before (Không dùng Template Method)

```typescript
// ❌ Skeleton trùng lặp trong mỗi class
abstract class DataMiner {
  abstract extractData(): void;
  abstract parseData(): void;

  analyze(file: string) {
    // ❌ Skeleton này lặp lại trong mọi subclass!
    console.log(`📂 Open ${file}`);
    this.extractData();
    this.parseData();
    console.log('📧 Send report');
    console.log('📂 Close file');
  }
}

class CSVDataMiner extends DataMiner {
  extractData() { /* CSV */ }
  parseData() { /* CSV */ }
}

class JSONDataMiner extends DataMiner {
  extractData() { /* JSON */ }
  parseData() { /* JSON */ }
}
// ⚠️ Sửa skeleton? Phải sửa CẢ BASE CLASS
```

→ **Hậu quả:** Skeleton gắn chặt với base class. Muốn thay đổi thứ tự? Sửa base class → ảnh hưởng tất cả subclasses.

---

## ✅ After (Dùng Template Method)

```typescript
// ─────────────────────────────────────────
// 1. Abstract Class — định nghĩa Template Method
// ─────────────────────────────────────────
abstract class DataMiner {
  // 🎯 TEMPLATE METHOD — skeleton của thuật toán
  // Final — subclasses không được override thứ tự!
  public final analyze(file: string): void {
    this.openFile(file);
    this.validateData();
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

  protected validateData(): void {
    console.log('✅ Validating data format...');
  }

  // ─── Abstract steps — subclasses phải override ───
  protected abstract openFile(file: string): void;
  protected abstract extractData(): void;
  protected abstract parseData(): void;
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

  // Override common step!
  protected sendReport(): void {
    console.log('📧 [XML] Sending XML-formatted report via API...');
  }
}

// ─────────────────────────────────────────
// 3. Client — gọi template method, không cần biết algorithm
// ─────────────────────────────────────────
function runAnalysis(miner: DataMiner, file: string) {
  console.log(`\n🚀 Starting: ${file}`);
  miner.analyze(file); // Template Method — fixed order!
  console.log('✅ Complete\n');
}

runAnalysis(new CSVDataMiner(), 'sales.csv');
// 🚀 Starting: sales.csv
// 📂 [CSV] Opening: sales.csv
// ✅ Validating data format...
// 📊 [CSV] Extracting rows...
// 🔢 [CSV] Parsing...
// 📧 Sending report via email...
// 📂 Closing file...

runAnalysis(new JSONDataMiner(), 'users.json');
// 🚀 Starting: users.json
// 📂 [JSON] Opening: users.json
// ✅ Validating data format...
// 📊 [JSON] Extracting...
// 🔢 [JSON] Parsing...
// 📧 Sending report...
// 📂 Closing...

runAnalysis(new XMLDataMiner(), 'config.xml');
// 🚀 Starting: config.xml
// 📂 [XML] Opening: config.xml
// ✅ Validating...
// 📊 [XML] Extracting...
// 🔢 [XML] Parsing...
// 📧 [XML] Sending XML-formatted report... ← overridden!
// 📂 Closing...
```

---

## 🏗️ UML Diagram

```
┌─────────────────────────────────────────────────────┐
│           AbstractClass (DataMiner)                   │
├─────────────────────────────────────────────────────┤
│ +final analyze(file): void ←─── TEMPLATE METHOD     │
│                                                       │
│ #openFile()         ←─── abstract (must override)  │
│ #validateData()     ←─── default                   │
│ #extractData()      ←─── abstract                  │
│ #parseData()        ←─── abstract                  │
│ #sendReport()       ←─── default (can override)    │
│ #closeFile()        ←─── default                   │
└──────────┬──────────────────────────────────────────┘
           │ extends
           ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  CSVDataMiner     │  │  JSONDataMiner    │  │  XMLDataMiner     │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ #openFile() ✅   │  │ #openFile() ✅   │  │ #openFile() ✅   │
│ #extractData() ✅│  │ #extractData() ✅│  │ #extractData() ✅│
│ #parseData() ✅  │  │ #parseData() ✅  │  │ #parseData() ✅  │
│ (uses default)   │  │ (uses default)   │  │ #sendReport() ✅ │
│  sendReport()    │  │  sendReport()    │  │ (OVERRIDDEN!)  │
│  closeFile()     │  │  closeFile()     │  │  closeFile()     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 🔍 Step-by-step Trace

**Scenario:** CSVDataMiner.analyze('sales.csv')

```
Bước 1: miner.analyze('sales.csv')
  → DataMiner.analyze() (Template Method — final, không override được)

Bước 2: this.openFile('sales.csv')
  → CSVDataMiner.openFile() — override ✅
  → 📂 [CSV] Opening: sales.csv

Bước 3: this.validateData()
  → DataMiner.validateData() — default ✅
  → ✅ Validating...

Bước 4: this.extractData()
  → CSVDataMiner.extractData() — override ✅
  → 📊 [CSV] Extracting...

Bước 5: this.parseData()
  → CSVDataMiner.parseData() — override ✅
  → 🔢 [CSV] Parsing...

Bước 6: this.sendReport()
  → DataMiner.sendReport() — default (không override)
  → 📧 Sending report...

Bước 7: this.closeFile()
  → DataMiner.closeFile() — default
  → 📂 Closing...

→ Subclass chỉ implement 3 methods, không phải 6!
→ Skeleton an toàn, không bị subclass override sai
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Chi tiết implementation |
|--------------------|----------------------|
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

### Version 1: Test Framework

```typescript
abstract class TestCase {
  // Template Method — fixed order
  public final run(): void {
    try {
      this.setUp();
      this.testBody();
      this.onSuccess();
    } catch (error) {
      this.onFailure(error);
    } finally {
      this.tearDown();
    }
  }

  // Hooks (can override)
  protected onSuccess(): void {
    console.log(`✅ ${this.constructor.name} passed`);
  }

  protected onFailure(error: unknown): void {
    console.log(`❌ ${this.constructor.name} FAILED: ${error}`);
  }

  // Abstract (must override)
  protected abstract testBody(): void;

  // Default (can override)
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
  }

  protected testBody(): void {
    const result = this.calc.add(2, 3);
    if (result !== 5) throw new Error(`Expected 5, got ${result}`);
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

// Run
for (const test of [new CalculatorTest(), new FailingTest()]) {
  test.run();
  console.log('---');
}
```

---

## ⚖️ Trade-offs & Common Mistakes

### ✅ Khi nào nên dùng

- ✅ Có skeleton algorithm cố định với steps thay đổi
- ✅ Muốn reuse common code, chỉ override specific steps
- ✅ Cần **hooks** — optional steps mà subclasses có thể override

### ❌ Khi nào không nên dùng

- ❌ Algorithm hoàn toàn khác nhau giữa subclasses — dùng **Strategy**
- ❌ Cần **runtime flexibility** — Template Method cố định lúc compile

### 🚫 Common Mistakes

**1. Override template method — phá vỡ algorithm**
```typescript
// ❌ Sai: Subclass override analyze() — phá skeleton!
class BadCSVDataMiner extends DataMiner {
  public analyze(file: string): void { // ❌ KHÔNG NÊN override!
    // Skip steps → logic inconsistent!
  }
}
```

**2. Không gọi super khi cần**
```typescript
// ❌ Sai: Override setUp nhưng quên gọi super
protected setUp(): void {
  this.calc = new Calculator(); // ❌ super.setUp() bị bỏ qua!
}

// ✅ Đúng: Gọi super khi cần chain
protected setUp(): void {
  super.setUp(); // ✅ Setup chain
  this.calc = new Calculator();
}
```

---

## 🧪 Testing Strategies

```typescript
describe('DataMiner Template Method', () => {
  it('should call steps in correct order', () => {
    const calls: string[] = [];

    class TrackedMiner extends DataMiner {
      protected openFile(f: string): void { calls.push('open'); }
      protected extractData(): void { calls.push('extract'); }
      protected parseData(): void { calls.push('parse'); }
    }

    const miner = new TrackedMiner();
    miner.analyze('test.csv');

    expect(calls).toEqual(['open', 'extract', 'parse']);
  });
});
```

---

## 🎤 Interview Q&A

**Q: Template Method là gì? Khi nào dùng?**
> A: Template Method định nghĩa skeleton của algorithm trong base class, để subclasses override specific steps. Một method `analyze()` gọi theo thứ tự `openFile() → validate() → extract() → parse() → sendReport() → closeFile()`. Steps cố định (validate, sendReport, closeFile) có default implementation; steps thay đổi (openFile, extract, parse) là abstract. Dùng khi có algorithm skeleton cố định nhưng implementations của steps khác nhau.

**Q: Template Method khác Strategy như thế nào?**
> A: Template Method dùng **inheritance** — base class có method chính, subclasses override steps. Strategy dùng **composition** — object chứa algorithm được inject. Template Method cố định về cấu trúc (compile time), Strategy hoán đổi được hoàn toàn (runtime). Template Method dùng khi steps giống nhau; Strategy dùng khi algorithms hoàn toàn khác nhau.

**Q: Hook trong Template Method là gì?**
> A: Hook là method có **default implementation** mà subclasses có thể override nếu cần. Không bắt buộc override như abstract methods. Ví dụ: `onSuccess()` và `onFailure()` trong test framework — subclasses có thể override để customize logging, thay vì phải override toàn bộ test flow.
