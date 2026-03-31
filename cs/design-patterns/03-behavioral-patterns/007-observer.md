# 👁️ Observer Pattern

## 🎯 Problem & Motivation

**Bài toán thực tế:** Một object (**Subject**) thay đổi state, cần **thông báo** cho **nhiều other objects (Observers)** biết — mà Subject không biết Observers là ai, không cần import chúng.

**Ví dụ thực tế:** YouTube channel — khi có video mới, channel thông báo cho tất cả subscribers. Channel không cần biết subscriber là ai (email, phone, notification app). Thêm subscriber mới? Không cần sửa channel.

```typescript
// ❌ Tight coupling: Subject phải biết và gọi từng observer cụ thể
class NewsAgency {
  private news: string = '';

  // ❌ Mỗi khi thêm subscriber → phải sửa class này!
  private emailService = new EmailService();
  private smsService = new SmsService();
  private pushService = new PushNotificationService();

  setNews(news: string) {
    this.news = news;
    // ⚠️ Subject phải biết tất cả observers!
    this.emailService.send(news);
    this.smsService.send(news);
    this.pushService.send(news);
    // Thêm subscriber → sửa đây!
  }
}
```

→ **Hậu quả:** Subject phụ thuộc vào concrete observers → tight coupling. Thêm observer → sửa Subject. Observable không tái sử dụng được.

**Observer giải quyết:** Định nghĩa **subscription mechanism** — Observers đăng ký nhận thông báo, Subject gửi notification khi state thay đổi.

---

## 💡 Use Cases

1. **Event System / Pub-Sub** — Message brokers (Kafka, Redis pub/sub), DOM events (`addEventListener`)
2. **MVC Architecture** — Model thay đổi → View tự update
3. **Real-time Data** — Stock price changes → UI widgets update, WebSocket push
4. **Newsletter / Notification** — User đăng ký topic → notification khi có update
5. **Auto-save / Sync** — File thay đổi → observers auto-sync lên cloud
6. **Distributed Systems** — Service mesh event notification

---

## ❌ Before (Không dùng Observer)

```typescript
// ❌ Tight coupling: Subject biết tất cả observers
class OrderManager {
  private status: string = 'pending';

  private emailNotifier = new EmailNotifier();
  private smsNotifier = new SmsNotifier();
  private warehouseSystem = new WarehouseSystem();
  private accountingSystem = new AccountingSystem();

  updateStatus(newStatus: string) {
    this.status = newStatus;
    // ⚠️ Subject phải gọi từng observer theo đúng logic!
    this.emailNotifier.notify(this.status);
    this.smsNotifier.notify(this.status);
    if (this.status === 'shipped') {
      this.warehouseSystem.notify(this.status); // ⚠️ Logic rải khắp nơi
    }
    if (this.status === 'completed') {
      this.accountingSystem.notify(this.status);
    }
    // Thêm observer → sửa toàn bộ method
  }
}
```

→ **Hậu quả:** Subject phải biết thứ tự, dependencies, logic của từng observer. Thêm observer → sửa Subject. Khó test vì khó mock.

---

## ✅ After (Dùng Observer)

```typescript
// ─────────────────────────────────────────
// 1. Observer Interface — contract cho tất cả observers
// ─────────────────────────────────────────
interface Observer<T> {
  update(data: T): void;
}

// ─────────────────────────────────────────
// 2. Subject — maintain state, manage observers
// ─────────────────────────────────────────
class Observable<T> {
  private observers: Observer<T>[] = [];
  private subscribers: Array<(data: T) => void> = [];
  private data: T;

  constructor(initialData: T) {
    this.data = initialData;
  }

  // Subscribe — hỗ trợ cả Observer interface và function
  subscribe(observer: Observer<T> | ((data: T) => void)): () => void {
    if (typeof observer === 'function') {
      this.subscribers.push(observer);
    } else {
      this.observers.push(observer);
    }

    // Return unsubscribe function — quan trọng để tránh memory leak!
    return () => this.unsubscribe(observer);
  }

  unsubscribe(observer: Observer<T> | ((data: T) => void)): void {
    if (typeof observer === 'function') {
      this.subscribers = this.subscribers.filter(o => o !== observer);
    } else {
      this.observers = this.observers.filter(o => o !== observer);
    }
  }

  protected notifyObservers(): void {
    for (const observer of this.observers) {
      observer.update(this.data);
    }
    for (const fn of this.subscribers) {
      fn(this.data);
    }
  }

  getData(): T {
    return this.data;
  }

  protected updateData(newData: T): void {
    this.data = newData;
    this.notifyObservers();
  }
}

// ─────────────────────────────────────────
// 3. Concrete Subject — Order với status
// ─────────────────────────────────────────
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  customerEmail: string;
}

class OrderManager extends Observable<Order> {
  constructor(order: Order) {
    super(order);
  }

  updateStatus(newStatus: OrderStatus) {
    const previousStatus = this.getData().status;
    const updatedOrder = { ...this.getData(), status: newStatus };
    console.log(`📦 Order ${updatedOrder.id}: ${previousStatus} → ${newStatus}`);
    this.updateData(updatedOrder);
  }
}

// ─────────────────────────────────────────
// 4. Concrete Observers — react to notifications
// ─────────────────────────────────────────
class EmailNotifier implements Observer<Order> {
  update(order: Order): void {
    if (order.status === 'shipped') {
      console.log(`📧 [Email] Sending shipping notification to ${order.customerEmail}`);
    }
    if (order.status === 'cancelled') {
      console.log(`📧 [Email] Sending cancellation to ${order.customerEmail}`);
    }
  }
}

class WarehouseNotifier implements Observer<Order> {
  update(order: Order): void {
    if (order.status === 'processing') {
      console.log(`🏭 [Warehouse] Preparing order ${order.id} for shipment`);
    }
  }
}

class AccountingNotifier implements Observer<Order> {
  update(order: Order): void {
    if (order.status === 'delivered') {
      console.log(`💰 [Accounting] Recording revenue: $${order.total}`);
    }
    if (order.status === 'cancelled') {
      console.log(`💰 [Accounting] Issuing refund for ${order.id}: $${order.total}`);
    }
  }
}

// ─────────────────────────────────────────
// 5. Client — subscribe/unsubscribe dynamically
// ─────────────────────────────────────────
const order = new OrderManager({
  id: 'ORD_123',
  status: 'pending',
  total: 299.99,
  customerEmail: 'john@example.com'
});

const emailNotif = new EmailNotifier();
const warehouseNotif = new WarehouseNotifier();
const accountingNotif = new AccountingNotifier();

order.subscribe(emailNotif);
order.subscribe(warehouseNotif);
order.subscribe(accountingNotif);

// Order lifecycle
order.updateStatus('processing');
// 📦 Order ORD_123: pending → processing
// 🏭 [Warehouse] Preparing order ORD_123

order.updateStatus('shipped');
// 📦 Order ORD_123: processing → shipped
// 📧 [Email] Sending shipping notification to john@example.com

order.unsubscribe(warehouseNotif);

order.updateStatus('delivered');
// 📦 Order ORD_123: shipped → delivered
// 💰 [Accounting] Recording revenue: $299.99
// (Warehouse notification NOT sent — đã unsubscribe ✅)

// Hoặc dùng function subscriber — không cần class
const logOrder = (order: Order) => {
  console.log(`📝 [Logger] Order ${order.id} is now ${order.status}`);
};
const unsubLogger = order.subscribe(logOrder);

order.updateStatus('cancelled');
// 📧 [Email] Sending cancellation to john@example.com
// 💰 [Accounting] Issuing refund for ORD_123: $299.99
// 📝 [Logger] Order ORD_123 is now cancelled

unsubLogger(); // Cleanup
```

---

## 🏗️ UML Diagram

```
┌──────────────────────┐         ┌─────────────────────────────────┐
│      Subject           │         │       <<interface>> Observer      │
│    (OrderManager)     │         ├─────────────────────────────────┤
├──────────────────────┤         │ +update(data: T): void            │
│ +observers: []         │         └──────────────┬──────────────────┘
├──────────────────────┤                        │ implements
│ +subscribe()           │         ┌─────────────┴─────────────┐
│ +unsubscribe()        │         ▼                              ▼
│ +notifyObservers()  │  ┌──────────────────┐    ┌──────────────────┐
└──────────┬───────────┘  │  EmailNotifier   │    │ WarehouseNotifier │
           │               └──────────────────┘    └──────────────────┘
           │ notifies
           └───────────────→ observers[i].update(data)
```

---

## 🔍 Step-by-step Trace

**Scenario:** Order từ pending → processing → shipped.

```
Bước 1: order.subscribe(emailNotif)
  → observers = [emailNotif]

Bước 2: order.subscribe(warehouseNotif)
  → observers = [emailNotif, warehouseNotif]

Bước 3: order.updateStatus('processing')
  → data.status = 'processing'
  → notifyObservers()

Bước 4: Loop observers:
  emailNotif.update(data)
    → order.status === 'processing'? NO → do nothing

  warehouseNotif.update(data)
    → order.status === 'processing'? YES
    → 🏭 [Warehouse] Preparing order ORD_123

Bước 5: order.updateStatus('shipped')
  → notifyObservers()

  emailNotif.update(data)
    → order.status === 'shipped'? YES
    → 📧 [Email] Sending shipping notification

  warehouseNotif.update(data)
    → order.status === 'shipped'? NO → do nothing

→ Subject hoàn toàn không biết observers làm gì!
→ Subject chỉ biết "gọi update(data)" → observers tự xử lý
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Chi tiết implementation |
|---------------------|-------------------------|
| **DOM Events** | `element.addEventListener('click', handler)` |
| **Redux Store** | `store.subscribe(() => rerender())` |
| **RxJS** | Observable + Observer + subscription |
| **Vue 3 `ref/reactive`** | Reactive dependencies tự track observers |
| **Kafka / Redis Pub/Sub** | Topic-based publish/subscribe |
| **Node.js EventEmitter** | `emitter.on()` = subscribe, `emitter.emit()` = notify |

---

## 📊 So sánh với Patterns liên quan

| Criteria | **Observer** | Mediator | Event Bus |
|----------|-------------|----------|----------|
| Communication | Subject → Observers | Objects ↔ Mediator | Any ↔ Any |
| Coupling | Subject tách biệt observers | Mọi object tách biệt nhau | Loose coupling |
| Central point | Subject (per observable) | Mediator (central) | Event Bus (global) |
| Use case | 1:many, push-based | Many:many, complex interaction | Distributed events |

---

## 💻 TypeScript Implementation

### Version 1: Reactive Store (Mini-Redux)

```typescript
type Listener<T> = (state: T) => void;

class ReactiveStore<T extends object> {
  private state: T;
  private listeners: Set<Listener<T>> = new Set();

  constructor(initialState: T) {
    this.state = initialState;
  }

  // Subscribe với Set — tự động tránh duplicate
  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Immutable update
  setState(partial: Partial<T> | ((prev: T) => Partial<T>)): void {
    const updates = typeof partial === 'function' ? partial(this.state) : partial;
    this.state = { ...this.state, ...updates };
    this.emit();
  }

  getState(): T {
    return this.state;
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

// Usage
interface AppState {
  user: string | null;
  theme: 'light' | 'dark';
  notifications: number;
  cartItems: number;
}

const store = new ReactiveStore<AppState>({
  user: null,
  theme: 'light',
  notifications: 0,
  cartItems: 0
});

const unsubTheme = store.subscribe(state => {
  console.log(`🎨 Theme: ${state.theme}`);
});

const unsubBadge = store.subscribe(state => {
  console.log(`🔔 Notifications: ${state.notifications}`);
});

const unsubCart = store.subscribe(state => {
  console.log(`🛒 Cart: ${state.cartItems} items`);
});

// Update → all observers notified
store.setState({ user: 'john_doe', theme: 'dark' });
// 🎨 Theme: dark
// 🔔 Notifications: 0
// 🛒 Cart: 0 items

store.setState({ cartItems: 3, notifications: 5 });
// 🎨 Theme: dark (full state re-emitted)
// 🔔 Notifications: 5
// 🛒 Cart: 3 items

unsubBadge(); // Cleanup — quan trọng!
store.setState({ theme: 'light' });
// 🎨 Theme: light
// 🛒 Cart: 3 items (badge đã unsubscribe)
```

---

## ⚖️ Trade-offs & Common Mistakes

### ✅ Khi nào nên dùng

- ✅ Một object thay đổi → nhiều objects khác cần react
- ✅ Cần subscribe/unsubscribe động lúc runtime
- ✅ Muốn maintain **loose coupling** giữa publisher và subscribers

### ❌ Khi nào không nên dùng

- ❌ Observer cần thay đổi Subject trong update() → có thể tạo circular updates
- ❌ Đơn giản quá — chỉ cần callback là đủ
- ❌ Cần synchronous update ordering nghiêm ngặt → dùng Mediator

### 🚫 Common Mistakes

**1. Quên unsubscribe → memory leak**
```typescript
// ❌ Sai: Component unmount nhưng không cleanup
class Component {
  ngOnInit() {
    store.subscribe(state => this.render(state)); // ❌ Memory leak!
  }
}

// ✅ Đúng: Luôn unsubscribe
class Component {
  private unsub: () => void = () => {};

  ngOnInit() {
    this.unsub = store.subscribe(state => this.render(state));
  }

  ngOnDestroy() {
    this.unsub(); // ✅ Cleanup khi unmount
  }
}
```

**2. Notification trong vòng lặp → infinite loop**
```typescript
// ❌ Sai: Observer update Subject → Subject notify → observer update...
observer.update(subject: Subject) {
  subject.setState({ ... }); // Subject thay đổi → notify lại → infinite!
}

// ✅ Đúng: Observer chỉ đọc, không sửa Subject
```

**3. Dùng Array thay vì Set → duplicate subscribers**
```typescript
// ❌ Sai: Array có thể duplicate nếu subscribe 2 lần
this.observers.push(observer); // ⚠️ Duplicate!

// ✅ Đúng: Set tự động tránh duplicate
this.listeners.add(listener); // ✅
```

---

## 🧪 Testing Strategies

```typescript
describe('Observable', () => {
  it('should notify all subscribers', () => {
    const observable = new Observable<number>(0);
    const fn1 = jest.fn();
    const fn2 = jest.fn();

    observable.subscribe({ update: fn1 });
    observable.subscribe({ update: fn2 });

    (observable as any).notifyObservers();

    expect(fn1).toHaveBeenCalledWith(0);
    expect(fn2).toHaveBeenCalledWith(0);
  });

  it('should allow unsubscribe and prevent notification', () => {
    const observable = new Observable<number>(0);
    const fn = jest.fn();
    const unsub = observable.subscribe({ update: fn });

    (observable as any).notifyObservers();
    expect(fn).toHaveBeenCalledTimes(1);

    unsub(); // Unsubscribe
    (observable as any).notifyObservers();
    expect(fn).toHaveBeenCalledTimes(1); // Không tăng
  });

  it('should support function subscribers', () => {
    const observable = new Observable<string>('initial');
    const fn = jest.fn();
    observable.subscribe(fn);

    (observable as any).notifyObservers();
    expect(fn).toHaveBeenCalledWith('initial');
  });
});
```

---

## 🔄 Refactoring Path

**Từ Callback Hell → Observer:**

```typescript
// ❌ Before: Nested callbacks
api.getUser(id, (err, user) => {
  api.getOrders(user.id, (err, orders) => {
    api.getProducts(orders, (err, products) => {
      // Callback hell!
    });
  });
});

// ✅ After: Observable chain (RxJS-style)
api.getUser$(id)
  .pipe(
    switchMap(user => api.getOrders$(user.id)),
    switchMap(orders => api.getProducts$(orders))
  )
  .subscribe({
    next: products => render(products),
    error: err => showError(err)
  });
```

---

## 🎤 Interview Q&A

**Q: Observer Pattern là gì? Khi nào dùng?**
> A: Observer định nghĩa subscription mechanism — một object (Subject) maintain danh sách observers và notify tất cả khi state thay đổi. Mỗi observer implement interface có method `update()`. Dùng khi một object thay đổi → nhiều objects khác cần react. Ví dụ: DOM events, Redux store, message brokers, newsletter. Quan trọng: luôn return unsubscribe function để tránh memory leak.

**Q: Pub/Sub khác Observer thế nào?**
> A: Observer là direct subscription — Subject trực tiếp gọi `observer.update()`. Pub/Sub dùng Event Bus/Channel trung gian — publisher gửi message vào channel, subscribers đăng ký vào channel mà không biết publisher là ai. Pub/Sub decoupled hơn, scale tốt hơn cho distributed systems.

**Q: Làm sao tránh memory leak trong Observer?**
> A: Luôn return unsubscribe function từ `subscribe()`. Trong frontend, nhớ cleanup subscription trong `componentWillUnmount` / `ngOnDestroy`. Subscription giữ reference đến observer → observer không bị garbage collected nếu không unsubscribe. Dùng `Set` thay vì `Array` để tự động tránh duplicate subscribers.
