# 🏠 Facade Pattern

## 🎯 Problem & Motivation

**Bài toán:** Bạn có một **subsystem phức tạp** gồm nhiều classes tương tác với nhau. Client chỉ cần một chức năng đơn giản nhưng phải biết và orchestrate nhiều objects khác nhau.

**Ví dụ thực tế:** Đặt pizza qua app — phía sau cần: Order → Kitchen → Inventory → Delivery → Payment. Client không muốn gọi tất cả, chỉ muốn gọi `orderPizza()`.

**Facade giải quyết:** Cung cấp một **interface đơn giản** che giấu tất cả complexity của subsystem bên dưới.

---

## 💡 Use Cases

1. **Order/Checkout System** — Một method `placeOrder()` che giấu inventory check, payment, warehouse selection, shipping calculation
2. **Computer Startup** — `computer.start()` che giấu BIOS, bootloader, OS loading, drivers
3. **Video Converter** — `converter.convert(file, format)` che giấu decode, filters, encode, mux
4. **API Gateway** — Một endpoint che giấu gọi đến 5 microservices khác nhau
5. **Test Setup** — `testFixture.setup()` khởi tạo tất cả mocks và dependencies cần thiết

---

## ❌ Before (Không dùng Facade)

```typescript
// ❌ Client phải biết và orchestrate toàn bộ subsystem
class ComputerClient {
  useComputer() {
    // Phải gọi từng thành phần theo đúng thứ tự!
    const cpu = new CPU();
    const memory = new Memory();
    const disk = new HardDrive();

    cpu.freeze();
    memory.load(0, disk.read(0, 1024));
    cpu.jump(0);
    cpu.execute();
  }
}
```

→ **Vấn đề:** Client phải biết quá nhiều về internal implementation → tight coupling. Nếu thứ tự gọi sai → crash.

---

## ✅ After (Dùng Facade)

```typescript
// ─────────────────────────────────────────
// 1. Complex Subsystem Classes
// ─────────────────────────────────────────
class CPU {
  freeze() { console.log('🔒 CPU freezing...'); }
  jump(addr: number) { console.log(`⬆️ CPU jumping to ${addr}`); }
  execute() { console.log('⚡ CPU executing...'); }
}

class Memory {
  load(position: number, data: string) {
    console.log(`📦 Memory loading at ${position}: ${data}`);
  }
}

class HardDrive {
  read(sector: number, size: number): string {
    console.log(`💿 HardDrive reading sector ${sector}`);
    return 'bootloader_data';
  }
}

class Display {
  initialize() { console.log('🖥️ Display initializing...'); }
}

class NetworkCard {
  enable() { console.log('🌐 Network card enabling...'); }
}

// ─────────────────────────────────────────
// 2. Facade — Simple interface cho client
// ─────────────────────────────────────────
class ComputerFacade {
  private cpu: CPU;
  private memory: Memory;
  private disk: HardDrive;
  private display: Display;
  private network: NetworkCard;

  constructor() {
    // Facade tự khởi tạo toàn bộ subsystem
    this.cpu = new CPU();
    this.memory = new Memory();
    this.disk = new HardDrive();
    this.display = new Display();
    this.network = new NetworkCard();
  }

  // Simple interface — client chỉ cần gọi một method!
  start(): void {
    console.log('🚀 ComputerFacade: Starting computer...');
    this.cpu.freeze();
    this.memory.load(0, this.disk.read(0, 1024));
    this.cpu.jump(0);
    this.cpu.execute();
    this.display.initialize();
    this.network.enable();
    console.log('✅ Computer ready!');
  }

  shutdown(): void {
    console.log('🛑 ComputerFacade: Shutting down...');
    this.network.enable();
    this.cpu.jump(0);
    console.log('💤 Computer powered off.');
  }
}

// ─────────────────────────────────────────
// 3. Client — chỉ biết Facade, không biết subsystem
// ─────────────────────────────────────────
const computer = new ComputerFacade();
computer.start();   // ✅ Một dòng duy nhất!
computer.shutdown();
```

→ **Cải thiện:** Client gọi `computer.start()` — một dòng thay vì orchestrate 5+ objects. Thứ tự, dependencies được Facade quản lý.

---

## 🏗️ UML Diagram

```
┌─────────────┐
│   Client    │────── (uses only Facade)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│              ComputerFacade                  │
│                  (Facade)                   │
├─────────────────────────────────────────┤
│ +start()                                  │
│ +shutdown()                                │
└──────────────────┬────────────────────────┘
                   │ uses
    ┌──────────────┼──────────────┐
    ▼              ▼              ▼
┌─────────┐  ┌──────────┐  ┌───────────┐
│   CPU   │  │  Memory  │  │ HardDrive │
└─────────┘  └──────────┘  └───────────┘
                              (Subsystem Classes)
```

---

## 🔍 Step-by-step Trace

**Scenario:** Client gọi `computer.start()`.

```
Bước 1: computer.start()
  → Facade.start()

Bước 2: Facade orchestrate theo thứ tự:
  cpu.freeze()       → 🔒 CPU freezing...
  disk.read()        → 💿 HardDrive reading sector 0
  memory.load()       → 📦 Memory loading at 0: bootloader_data
  cpu.jump(0)        → ⬆️ CPU jumping to 0
  cpu.execute()      → ⚡ CPU executing...
  display.initialize() → 🖥️ Display initializing...
  network.enable()   → 🌐 Network card enabling...
  ✅ Computer ready!

→ Client không biết CPU, Memory, HardDrive tồn tại!
→ Client chỉ biết ComputerFacade.start()
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Cách dùng Facade |
|---------------------|-----------------|
| **jQuery** | `$()` là facade che giấu DOM manipulation, event binding, animation, AJAX |
| **Lodash** | `_.groupBy()`, `_.debounce()` — facade cho complex algorithm |
| **Express.js** | `app.use()`, `app.get()` — facade che giấu routing, middleware stack |
| **Spring Boot `@Service`** | Business facade cho nhiều DAOs |
| **React `useState`** | Facade che giấu component lifecycle, fiber tree, state fiber |

---

## 📊 So sánh với Patterns liên quan

| Criteria | **Facade** | Adapter | Decorator |
|----------|-----------|---------|----------|
| Mục đích | Đơn giản hóa subsystem phức tạp | Biến đổi interface không tương thích | Thêm behavior mới |
| Client biết gì? | Chỉ biết Facade | Biết Target interface, không biết Adaptee | Nghĩ là object gốc |
| Thay đổi gì? | Che giấu many classes | Đổi interface của 1 adaptee | Mở rộng object |
| Subsystem changes | Client không bị ảnh hưởng khi subsystem thay đổi | Phải sửa adapter nếu adaptee đổi | Không liên quan |

---

## 💻 TypeScript Implementation

```typescript
// ─────────────────────────────────────────
// Example: Order Processing Facade
// ─────────────────────────────────────────

// Subsystem Classes
class InventoryService {
  checkStock(productId: string, qty: number): boolean {
    console.log(`📋 [Inventory] Checking stock: ${productId} x${qty}`);
    return true;
  }
  reserve(productId: string, qty: number) {
    console.log(`📦 [Inventory] Reserved: ${productId} x${qty}`);
  }
}

class PaymentService {
  process(amount: number, method: string): boolean {
    console.log(`💰 [Payment] Processing ${amount} via ${method}`);
    return true;
  }
}

class WarehouseService {
  selectNearest(customerZip: string): string {
    console.log(`🏭 [Warehouse] Selected for ${customerZip}`);
    return 'warehouse_central';
  }
  ship(orderId: string, warehouseId: string) {
    console.log(`🚚 [Warehouse] Shipping ${orderId} from ${warehouseId}`);
  }
}

class NotificationService {
  sendEmail(to: string, template: string) {
    console.log(`📧 [Notification] Email to ${to}: ${template}`);
  }
  sendSMS(phone: string, message: string) {
    console.log(`📱 [Notification] SMS to ${phone}: ${message}`);
  }
}

// Facade
class OrderFacade {
  constructor(
    private inventory: InventoryService,
    private payment: PaymentService,
    private warehouse: WarehouseService,
    private notification: NotificationService
  ) {}

  placeOrder(request: {
    customerId: string;
    email: string;
    phone: string;
    zip: string;
    items: Array<{ productId: string; qty: number; price: number }>;
    paymentMethod: string;
  }): string {
    const orderId = `ORD_${Date.now()}`;

    // Step 1: Check inventory
    for (const item of request.items) {
      if (!this.inventory.checkStock(item.productId, item.qty)) {
        throw new Error(`❌ Out of stock: ${item.productId}`);
      }
    }

    // Step 2: Reserve items
    for (const item of request.items) {
      this.inventory.reserve(item.productId, item.qty);
    }

    // Step 3: Calculate total & charge
    const total = request.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    this.payment.process(total, request.paymentMethod);

    // Step 4: Ship
    const warehouse = this.warehouse.selectNearest(request.zip);
    this.warehouse.ship(orderId, warehouse);

    // Step 5: Notify
    this.notification.sendEmail(request.email, `Order ${orderId} placed!`);
    this.notification.sendSMS(request.phone, `Order ${orderId} confirmed!`);

    console.log(`✅ Order ${orderId} placed successfully! Total: $${total}`);
    return orderId;
  }
}

// Client: Simple one-liner
const orderFacade = new OrderFacade(
  new InventoryService(),
  new PaymentService(),
  new WarehouseService(),
  new NotificationService()
);

orderFacade.placeOrder({
  customerId: 'cust_123',
  email: 'john@example.com',
  phone: '+1234567890',
  zip: '10001',
  items: [
    { productId: 'prod_a', qty: 2, price: 29.99 },
    { productId: 'prod_b', qty: 1, price: 49.99 }
  ],
  paymentMethod: 'credit_card'
});
```

---

## 📝 LeetCode Problems áp dụng

- [Design Browser History](https://leetcode.com/problems/design-browser-history/) — Facade cho back/forward navigation history
- [Design Parking System](https://leetcode.com/problems/design-parking-system/) — Facade đơn giản hóa parking slot management
- [Design Food Ratings System](https://leetcode.com/problems/design-food-ratings-system/) — Facade pattern cho multi-component system

---

## ✅ Pros / ❌ Cons

**Ưu điểm:**
- ✅ **Đơn giản hóa** — client chỉ cần gọi một method, không cần hiểu subsystem
- ✅ **Decoupling** — client tách biệt hoàn toàn khỏi subsystem implementation
- ✅ **Layering** — chia hệ thống thành layers: Facade → Services → Data
- ✅ **Single Responsibility** — mỗi Facade quản lý một workflow cụ thể

**Nhược điểm:**
- ❌ **Facade có thể trở thành God Object** — nếu một Facade làm quá nhiều thứ, nó vi phạm SRP
- ❌ **Hidden complexity** — nếu abuse, có thể che giấu bugs trong subsystem
- ❌ **Có thể over-simplify** — client cần access chi tiết nhưng Facade không cung cấp

---

## ⚠️ Khi nào nên / không nên dùng

**Nên dùng khi:**
- ✅ Cần provide simple interface cho complex subsystem
- ✅ Client chỉ quan tâm kết quả, không quan tâm cách đạt được
- ✅ Muốn **layer** hệ thống: presentation → facade → services → repositories

**Không nên dùng khi:**
- ❌ Client **cần access chi tiết** vào subsystem — Facade che giấu quá nhiều
- ❌ Subsystem đã đơn giản — thêm Facade là thừa
- ❌ Cần implement specific behavior mà Facade không expose

---

## 🚫 Common Mistakes / Pitfalls

1. **Facade quá "thick" — làm quá nhiều thứ**
   ```typescript
   // ❌ Sai: Một Facade làm TẤT CẢ việc trong app → God Object
   class AppFacade {
     order() { /* 1000 dòng */ }
     auth() { /* 500 dòng */ }
     analytics() { /* 300 dòng */ }
     // → Nên chia thành OrderFacade, AuthFacade, AnalyticsFacade
   }

   // ✅ Đúng: Mỗi Facade chỉ quản lý một domain
   class OrderFacade { order() { /* chỉ order */ } }
   class AuthFacade { login() { /* chỉ auth */ } }
   ```

2. **Dùng Facade khi không cần**
   ```typescript
   // ❌ Thừa: Subsystem chỉ có 1 class, không cần Facade
   class SimpleCache { get() { } set() { } }
   // → Gọi trực tiếp SimpleCache, đừng wrap thêm Facade
   ```

---

## 🎤 Interview Q&A

**Q: Facade Pattern là gì? Khi nào dùng?**
> A: Facade cung cấp một interface đơn giản che giấu complexity của một subsystem nhiều classes. Client gọi Facade, Facade orchestrate các subsystem classes bên dưới. Dùng khi client chỉ cần kết quả đơn giản mà không cần hiểu cách subsystem hoạt động — ví dụ: `computer.start()`, `orderFacade.placeOrder()`.

**Q: Facade khác Adapter như thế nào?**
> A: Adapter biến đổi interface để hai bên tương thích. Facade đơn giản hóa interface cho một subsystem phức tạp — không nhất thiết thay đổi interface, chỉ gom gọn. Adapter thường dùng cho 1:1 (một interface → một adaptee); Facade thường dùng cho 1:N (một facade → nhiều subsystem classes).

**Q: Facade có vi phạm nguyên tắc encapsulation không?**
> A: Ngược lại, Facade **bảo vệ** encapsulation! Nó che giấu internal structure của subsystem, client không thể access trực tiếp vào subsystem. Điều này cho phép thay đổi subsystem implementation mà không ảnh hưởng client.
