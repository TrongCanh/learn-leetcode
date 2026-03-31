# 🏠 Facade Pattern

## 🎯 Problem & Motivation

**Bài toán thực tế:** Bạn có một **subsystem phức tạp** gồm nhiều classes tương tác với nhau. Client chỉ cần một chức năng đơn giản nhưng phải biết và orchestrate nhiều objects khác nhau.

**Ví dụ thực tế:** Đặt pizza qua app — phía sau cần: Inventory → Kitchen → Warehouse → Delivery → Payment. Client không muốn gọi tất cả, chỉ muốn `orderPizza()`.

```typescript
// ❌ Client phải biết và orchestrate toàn bộ subsystem
async function orderPizza(customerId: string, pizzaType: string) {
  const inventory = new InventoryService();
  const available = await inventory.checkStock(pizzaType);
  if (!available) throw new Error('Out of stock');

  const kitchen = new KitchenService();
  const orderId = await kitchen.createOrder(customerId, pizzaType);
  await kitchen.startCooking(orderId);

  const warehouse = new WarehouseService();
  const driver = await warehouse.assignDriver(orderId);

  const payment = new PaymentService();
  await payment.process(orderId, customerId);

  const notification = new NotificationService();
  await notification.sendSMS(customerId, `Order ${orderId} placed!`);
  // ⚠️ 5 services, 6+ steps — quá phức tạp cho client!
}
```

→ **Hậu quả:** Client phải biết quá nhiều về internal implementation → tight coupling. Nếu thứ tự gọi sai → crash. Thêm service mới → sửa tất cả clients.

**Facade giải quyết:** Cung cấp một **interface đơn giản** che giấu tất cả complexity của subsystem bên dưới.

---

## 💡 Use Cases

1. **Order/Checkout System** — Một method `placeOrder()` che giấu inventory check, payment, warehouse, shipping
2. **Computer Startup** — `computer.start()` che giấu BIOS, bootloader, OS loading, drivers
3. **Video Converter** — `converter.convert(file, format)` che giấu decode, filters, encode, mux
4. **API Gateway** — Một endpoint che giấu gọi đến 5 microservices khác nhau
5. **Test Setup** — `testFixture.setup()` khởi tạo tất cả mocks và dependencies
6. **Build System** — `build()` che giấu lint → compile → test → package → deploy

---

## ❌ Before (Không dùng Facade)

```typescript
// ❌ Client phải orchestrate toàn bộ subsystem theo đúng thứ tự
class ComputerClient {
  useComputer() {
    const cpu = new CPU();
    const memory = new Memory();
    const disk = new HardDrive();
    const display = new Display();
    const network = new NetworkCard();

    cpu.freeze();
    memory.load(0, disk.read(0, 1024));
    cpu.jump(0);
    cpu.execute();
    display.initialize();
    network.enable();
    // ⚠️ Nếu gọi sai thứ tự? → crash
    // ⚠️ Thêm component mới? → sửa tất cả clients
  }
}
```

→ **Hậu quả:** Client phải biết thứ tự khởi tạo, dependencies giữa các components. Không tái sử dụng được orchestration logic.

---

## ✅ After (Dùng Facade)

```typescript
// ─────────────────────────────────────────
// 1. Subsystem Classes — complexity bên trong
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
// 2. Facade — Simple interface che giấu subsystem
// ─────────────────────────────────────────
class ComputerFacade {
  private cpu: CPU;
  private memory: Memory;
  private disk: HardDrive;
  private display: Display;
  private network: NetworkCard;

  constructor() {
    // Facade khởi tạo toàn bộ subsystem
    this.cpu = new CPU();
    this.memory = new Memory();
    this.disk = new HardDrive();
    this.display = new Display();
    this.network = new NetworkCard();
  }

  // Simple public interface — client chỉ cần gọi một method!
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

---

## 🏗️ UML Diagram

```
┌─────────────┐
│   Client    │────── (uses only Facade)
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│                   ComputerFacade                       │
│                    (Facade)                          │
├──────────────────────────────────────────────────────┤
│ +start()                                             │
│ +shutdown()                                           │
│                                                      │
│  internals: CPU, Memory, HardDrive, Display, Network  │
└──────────────────┬───────────────────────────────────┘
                    │ orchestrates
    ┌───────────────┼───────────────┬─────────────┐
    ▼               ▼               ▼             ▼
┌─────────┐   ┌──────────┐  ┌───────────┐  ┌──────────┐
│   CPU   │   │  Memory  │  │ HardDrive │  │ Display  │
│(Subsys) │   │(Subsys)  │  │ (Subsys)  │  │(Subsys)  │
└─────────┘   └──────────┘  └───────────┘  └──────────┘
```

---

## 🔍 Step-by-step Trace

**Scenario:** Client gọi `computer.start()`.

```
Bước 1: computer.start()
  → ComputerFacade.start()

Bước 2: Facade orchestrate theo đúng thứ tự:
  cpu.freeze()         → 🔒 CPU freezing...
  disk.read()          → 💿 HardDrive reading sector 0
  memory.load()        → 📦 Memory loading: bootloader_data
  cpu.jump(0)          → ⬆️ CPU jumping to 0
  cpu.execute()        → ⚡ CPU executing...
  display.initialize() → 🖥️ Display initializing...
  network.enable()     → 🌐 Network card enabling...
  ✅ Computer ready!

→ Client không biết CPU, Memory, HardDrive tồn tại!
→ Client chỉ biết ComputerFacade.start()
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Chi tiết implementation |
|---------------------|-------------------------|
| **jQuery** | `$()` là facade che giấu DOM manipulation, event binding, animation, AJAX |
| **Lodash** | `_.groupBy()`, `_.debounce()` — facade cho complex algorithm |
| **Express.js** | `app.use()`, `app.get()` — facade che giấu routing, middleware stack |
| **Spring `@Service`** | Business facade cho nhiều DAOs |
| **React `useState`** | Facade che giấu component lifecycle, fiber tree, state management |
| **Hibernate Session** | Facade cho ORM: save, query, transaction — che giấu SQL generation |

---

## 📊 So sánh với Patterns liên quan

| Criteria | **Facade** | Adapter | Decorator |
|----------|-----------|---------|----------|
| Mục đích | Đơn giản hóa subsystem phức tạp | Biến đổi interface không tương thích | Thêm behavior mới |
| Client biết gì? | Chỉ biết Facade | Biết Target interface, không biết Adaptee | Nghĩ là object gốc |
| Thay đổi gì? | Che giấu many classes | Đổi interface của 1 adaptee | Mở rộng object |
| Subsystem changes | Client không bị ảnh hưởng | Phải sửa adapter | Không liên quan |

---

## 💻 TypeScript Implementation

### Version 1: Order Processing Facade

```typescript
// Subsystem Classes
class InventoryService {
  checkStock(productId: string, qty: number): boolean {
    console.log(`📋 [Inventory] Checking: ${productId} x${qty}`);
    return true;
  }
  reserve(productId: string, qty: number) {
    console.log(`📦 [Inventory] Reserved: ${productId} x${qty}`);
  }
}

class PaymentService {
  process(amount: number, method: string): boolean {
    console.log(`💰 [Payment] Processing $${amount} via ${method}`);
    return true;
  }
}

class WarehouseService {
  selectNearest(zip: string): string {
    console.log(`🏭 [Warehouse] Selected for ${zip}`);
    return 'warehouse_central';
  }
  ship(orderId: string, warehouseId: string) {
    console.log(`🚚 [Warehouse] Shipping ${orderId} from ${warehouseId}`);
  }
}

class NotificationService {
  sendEmail(to: string, subject: string) {
    console.log(`📧 [Notification] Email to ${to}: ${subject}`);
  }
  sendSMS(phone: string, msg: string) {
    console.log(`📱 [Notification] SMS to ${phone}: ${msg}`);
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

    // Step 1: Check & reserve inventory
    for (const item of request.items) {
      if (!this.inventory.checkStock(item.productId, item.qty)) {
        throw new Error(`❌ Out of stock: ${item.productId}`);
      }
      this.inventory.reserve(item.productId, item.qty);
    }

    // Step 2: Process payment
    const total = request.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    this.payment.process(total, request.paymentMethod);

    // Step 3: Ship
    const warehouse = this.warehouse.selectNearest(request.zip);
    this.warehouse.ship(orderId, warehouse);

    // Step 4: Notify
    this.notification.sendEmail(request.email, `Order ${orderId} placed!`);
    this.notification.sendSMS(request.phone, `Order ${orderId} confirmed!`);

    console.log(`✅ Order ${orderId} placed! Total: $${total}`);
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

## ⚖️ Trade-offs & Common Mistakes

### ✅ Khi nào nên dùng

- ✅ Cần provide simple interface cho complex subsystem
- ✅ Client chỉ quan tâm kết quả, không quan tâm cách đạt được
- ✅ Muốn **layer** hệ thống: presentation → facade → services → repositories

### ❌ Khi nào không nên dùng

- ❌ Client **cần access chi tiết** vào subsystem — Facade che giấu quá nhiều
- ❌ Subsystem đã đơn giản — thêm Facade là thừa
- ❌ Cần implement specific behavior mà Facade không expose

### 🚫 Common Mistakes

**1. Facade quá "thick" — làm quá nhiều thứ**
```typescript
// ❌ Sai: Một Facade làm TẤT CẢ việc trong app → God Object
class BadAppFacade {
  order() { /* 1000 dòng */ }
  auth() { /* 500 dòng */ }
  analytics() { /* 300 dòi */ }
  // → Nên chia: OrderFacade, AuthFacade, AnalyticsFacade
}

// ✅ Đúng: Mỗi Facade chỉ quản lý một domain
class OrderFacade { order() { /* chỉ order */ } }
class AuthFacade { login() { /* chỉ auth */ } }
```

**2. Dùng Facade khi không cần**
```typescript
// ❌ Thừa: Subsystem chỉ có 1 class, không cần Facade
class SimpleCache { get() {} set() {} }
// → Gọi trực tiếp SimpleCache, đừng wrap thêm Facade
```

**3. Che giấu quá nhiều → không debug được**
```typescript
// ⚠️ Cân nhắc: Facade tốt cho môi trường production
// Nhưng khi debug, cần có cách access subsystem trực tiếp
class Facade {
  // Provide escape hatch cho debugging
  getSubsystem(name: string) { return this[name]; }
}
```

---

## 🧪 Testing Strategies

```typescript
// Test Facade: Mock subsystem, verify orchestration
describe('OrderFacade', () => {
  it('should orchestrate all subsystem calls', () => {
    const mockInventory = { checkStock: jest.fn().mockReturnValue(true), reserve: jest.fn() };
    const mockPayment = { process: jest.fn().mockReturnValue(true) };
    const mockWarehouse = { selectNearest: jest.fn().mockReturnValue('wh_1'), ship: jest.fn() };
    const mockNotification = { sendEmail: jest.fn(), sendSMS: jest.fn() };

    const facade = new OrderFacade(
      mockInventory as unknown as InventoryService,
      mockPayment as unknown as PaymentService,
      mockWarehouse as unknown as WarehouseService,
      mockNotification as unknown as NotificationService
    );

    facade.placeOrder({
      customerId: 'c1', email: 'a@b.com', phone: '123', zip: '10001',
      items: [{ productId: 'p1', qty: 1, price: 10 }],
      paymentMethod: 'card'
    });

    expect(mockInventory.checkStock).toHaveBeenCalled();
    expect(mockInventory.reserve).toHaveBeenCalled();
    expect(mockPayment.process).toHaveBeenCalledWith(10, 'card');
    expect(mockWarehouse.selectNearest).toHaveBeenCalledWith('10001');
    expect(mockNotification.sendEmail).toHaveBeenCalled();
  });
});
```

---

## 🔄 Refactoring Path

**Từ Big Ball of Mud → Facade:**

```typescript
// ❌ Before: Client gọi 10 services trực tiếp
class BadClient {
  async checkout() {
    const inv = new InventoryService();
    const pay = new PaymentService();
    const ship = new ShippingService();
    const notif = new NotificationService();
    const db = new DatabaseService();
    const cache = new CacheService();
    const log = new LoggingService();
    // ... 10 services
  }
}

// ✅ After: Client chỉ gọi một Facade
class GoodClient {
  constructor(private orderFacade: OrderFacade) {}
  async checkout() {
    this.orderFacade.placeOrder({ /* ... */ });
  }
}
```

---

## 🎤 Interview Q&A

**Q: Facade Pattern là gì? Khi nào dùng?**
> A: Facade cung cấp một interface đơn giản che giấu complexity của một subsystem nhiều classes. Client gọi Facade, Facade orchestrate các subsystem classes bên dưới. Dùng khi client chỉ cần kết quả đơn giản mà không cần hiểu cách subsystem hoạt động — ví dụ: `computer.start()`, `orderFacade.placeOrder()`.

**Q: Facade khác Adapter như thế nào?**
> A: Adapter biến đổi interface để hai bên tương thích. Facade đơn giản hóa interface cho một subsystem phức tạp — không nhất thiết thay đổi interface, chỉ gom gọn. Adapter thường dùng cho 1:1 (một interface → một adaptee); Facade thường dùng cho 1:N (một facade → nhiều subsystem classes).

**Q: Facade có vi phạm nguyên tắc encapsulation không?**
> A: Ngược lại, Facade **bảo vệ** encapsulation! Nó che giấu internal structure của subsystem, client không thể access trực tiếp vào subsystem. Điều này cho phép thay đổi subsystem implementation mà không ảnh hưởng client — provided Facade interface không đổi.

**Q: Khi nào Facade trở thành anti-pattern?**
> A: Khi Facade làm quá nhiều thứ (God Object), che giấu bugs, hoặc được dùng khi không cần. Nếu subsystem đơn giản, Facade thừa. Nếu client cần access chi tiết, Facade che quá kỹ → cần cho phép escape hatch.
