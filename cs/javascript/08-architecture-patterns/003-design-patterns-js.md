# Design Patterns in JavaScript — 12 Patterns Thực Chiến

## Câu hỏi mở đầu

```javascript
// Câu hỏi phỏng vấn:
// "Bạn có biết Singleton pattern không? Implement nó."
// Ứng viên A:
// const instance = new Singleton();
// Ứng viên B:
// const instance = new Singleton();
// const instance2 = new Singleton();
// console.log(instance === instance2); // ???

// Bạn trả lời sao? Singleton thực sự hoạt động như thế nào trong JavaScript?
// Và quan trọng hơn: khi nào NÊN và KHÔNG NÊN dùng nó?
```

Design patterns là những **giải pháp đã được kiểm chứng** cho các vấn đề phổ biến trong thiết kế phần mềm. Chúng không phải copy-paste code — chúng là **tư duy thiết kế**. Bài này cover 12 patterns phổ biến nhất trong JavaScript, giải thích **khi nào dùng**, **khi nào không**, và **implement đúng**.

---

## 1. Creational Patterns — Tạo Object

### 1a. Singleton — Một Instance Duy Nhất

**Khi nào dùng:** Config object, database connection, logging service, state management store.

**Khi nào không:** Global state (dễ abuse), testing (hard to mock).

```javascript
// ❌ Singleton class = anti-pattern trong JS vì có thể override
class Database {
  constructor() {
    if (Database.instance) {
      return Database.instance;
    }
    Database.instance = this;
    this.connection = 'connected';
  }
}

const db1 = new Database();
const db2 = new Database();
console.log(db1 === db2); // true ✅

// ✅ Module pattern = Singleton tự nhiên trong JavaScript
// Module được cached sau lần import đầu tiên
// Export tạo SINGLETON vì module chỉ execute MỘT LẦN

// db.js — Singleton module
let connection = null;

function connect() {
  if (!connection) {
    connection = { host: 'localhost', port: 5432 };
    console.log('Connected!');
  }
  return connection;
}

function disconnect() {
  connection = null;
}

export { connect, disconnect };

// main.js — sử dụng
import { connect, disconnect } from './db.js';
const db1 = connect();
const db2 = connect();
console.log(db1 === db2); // true ✅
// db2 là same instance như db1

// ✅ ES2022 Private Fields — clean Singleton
class Database {
  static #instance = null;

  constructor() {
    if (Database.#instance) {
      return Database.#instance;
    }
    this.connection = 'connected';
    Database.#instance = this;
  }

  static getInstance() {
    if (!this.#instance) {
      this.#instance = new Database();
    }
    return this.#instance;
  }
}

const db = Database.getInstance();
const db2 = Database.getInstance();
console.log(db === db2); // true ✅
```

### 1b. Factory — Tạo Object Theo Điều Kiện

**Khi nào dùng:** Object creation có điều kiện, polymorphism, DRY object creation.

```javascript
// ❌ Nếu không dùng factory
function createButton(type) {
  if (type === 'primary') {
    return { text: 'Submit', className: 'btn-primary', disabled: false };
  }
  if (type === 'secondary') {
    return { text: 'Cancel', className: 'btn-secondary', disabled: false };
  }
  if (type === 'danger') {
    return { text: 'Delete', className: 'btn-danger', disabled: false };
  }
  // Thêm type mới → phải sửa function này!
}

// ✅ Factory pattern — dễ mở rộng
class ButtonFactory {
  static create(type, text) {
    const styles = {
      primary: { className: 'btn-primary', variant: 'filled' },
      secondary: { className: 'btn-secondary', variant: 'outlined' },
      danger: { className: 'btn-danger', variant: 'filled' },
    };

    const style = styles[type];
    if (!style) throw new Error(`Unknown button type: ${type}`);

    return {
      text,
      ...style,
      disabled: false,
      onClick() { console.log(`Clicked: ${text}`); }
    };
  }
}

// Thêm type mới? Chỉ thêm vào styles map — không sửa logic
ButtonFactory.create('warning', '⚠️ Warning'); // dễ dàng thêm

// ✅ Factory với subclasses (Abstract Factory)
class Button {
  render() { throw new Error('Must implement render()'); }
}

class PrimaryButton extends Button {
  render() { return '<button class="primary">Submit</button>'; }
}

class DangerButton extends Button {
  render() { return '<button class="danger">Delete</button>'; }
}

function createButton(type) {
  const buttons = { primary: PrimaryButton, danger: DangerButton };
  const ButtonClass = buttons[type];
  if (!ButtonClass) throw new Error(`Unknown: ${type}`);
  return new ButtonClass();
}

createButton('primary'); // instance of PrimaryButton
createButton('danger'); // instance of DangerButton
```

### 1c. Builder — Object Phức Tạp, Nhiều Config

**Khi nào dùng:** Object có nhiều optional parameters, object creation phức tạp với validation.

```javascript
// ❌ Constructor với nhiều params = khó đọc
const user = new User(
  'Alice',        // firstName
  'Smith',        // lastName
  'alice@...',    // email
  '123 Main St',  // address
  'Apt 4B',       // address2
  'New York',     // city
  '10001',        // zip
  true,           // isAdmin (WTF is this?)
  false,          // isVerified
  null            // phone?
);
// → Ai biết param nào là gì?

// ✅ Builder pattern
class UserBuilder {
  constructor(name) {
    this.name = name;
  }

  email(value) {
    this.email = value;
    return this; // chainable
  }

  address(value) {
    this.address = value;
    return this;
  }

  city(value) {
    this.city = value;
    return this;
  }

  admin(value = true) {
    this.isAdmin = value;
    return this;
  }

  build() {
    // Validation
    if (!this.email) throw new Error('Email required');
    return new User(this);
  }
}

const user = new UserBuilder('Alice')
  .email('alice@example.com')
  .address('123 Main St')
  .city('New York')
  .admin(true)
  .build();

// ✅ Fluent interface — chainable và readable
// Thứ tự không quan trọng
// Optional params rõ ràng
```

### 1d. Module — Encapsulation và Namespace

**Khi nào dùng:** Code organization, encapsulation, IIFE cho scripts, module pattern.

```javascript
// ❌ Global variables = namespace pollution
var counter = 0;
function increment() { counter++; }
function getCount() { return counter; }

// ✅ Module pattern — IIFE tạo private scope
const Counter = (function() {
  // Private — không truy cập được từ ngoài
  let count = 0;
  const version = '1.0.0';

  function validate(n) {
    if (typeof n !== 'number') throw new Error('Must be number');
  }

  // Public API
  return {
    increment() { count++; },
    decrement() { count--; },
    getCount() { return count; },
    reset() { count = 0; }
    // version không export — private!
  };
})();

Counter.increment();
Counter.increment();
Counter.getCount(); // 2
Counter.count;      // undefined — private!
Counter.version;   // undefined — private!

// ✅ Revealing Module — expose explicit public interface
const MathUtils = (function() {
  // Private
  const PI = 3.14159;

  function circleArea(r) { return PI * r * r; }
  function circleCircumference(r) { return 2 * PI * r; }

  function squareArea(s) { return s * s; }

  // Reveal public interface
  return {
    circleArea,
    circleCircumference,
    // squareArea không reveal — private!
  };
})();

// ✅ Modern ESM — native module (2026 standard)
export const add = (a, b) => a + b;
export const multiply = (a, b) => a * b;
export default function divide(a, b) { return a / b; }
```

---

## 2. Structural Patterns — Cấu Trúc Object

### 2a. Decorator — Thêm Behavior Lúc Runtime

**Khi nào dùng:** Thêm features cho object mà không modify class gốc, AOP (aspect-oriented programming).

```javascript
// ❌ Inheritance cho decorator = class explosion
class Coffee { cost() { return 2; } }
class CoffeeWithMilk extends Coffee { cost() { return this.cost() + 0.5; } }
class CoffeeWithSugar extends Coffee { cost() { return this.cost() + 0.2; } }
class CoffeeWithMilkAndSugar extends CoffeeWithMilk { ... }
// 10 decorators → 2^10 combinations!

// ✅ Decorator pattern
class Coffee {
  cost() { return 2; }
  description() { return 'Coffee'; }
}

function withMilk(coffee) {
  const cost = coffee.cost();
  const desc = coffee.description();
  return {
    cost() { return cost + 0.5; },
    description() { return desc + ', Milk'; }
  };
}

function withSugar(coffee) {
  const cost = coffee.cost();
  const desc = coffee.description();
  return {
    cost() { return cost + 0.2; },
    description() { return desc + ', Sugar'; }
  };
}

let coffee = new Coffee();
coffee = withMilk(coffee);     // add milk decorator
coffee = withSugar(coffee);    // add sugar decorator
coffee.cost();         // 2.7
coffee.description();  // 'Coffee, Milk, Sugar'

// ✅ ES7+ Decorator proposal (@decorator syntax)
class Coffee {
  cost() { return 2; }
}

function log(target, name, descriptor) {
  const original = descriptor.value;
  descriptor.value = function(...args) {
    console.log(`Calling ${name} with`, args);
    return original.apply(this, args);
  };
  return descriptor;
}

class DecoratedCoffee extends Coffee {
  @log
  cost() { return 3; }
}

// ✅ Nesting decorators
const finalCoffee = withMilk(withSugar(new Coffee()));
```

### 2b. Adapter — Wrapper cho Interface Không Tương Thích

**Khi nào dùng:** Integrate legacy code, third-party libraries, refactoring without breaking existing code.

```javascript
// ❌ Không tương thích interface
class OldPaymentSystem {
  processPayment(amount, currencyCode) {
    // Old API: amount, currencyCode
    console.log(`Paying ${amount} ${currencyCode}`);
  }
}

// New code expects:
interface PaymentProcessor {
  pay(amount: Money): Promise<Receipt>;
}

// ✅ Adapter — wrap OldPaymentSystem để satisfy new interface
class PaymentAdapter {
  constructor() {
    this.oldSystem = new OldPaymentSystem();
  }

  async pay(amount) {
    // Transform new format → old format
    const amountNumber = amount.value; // Money → number
    const currencyCode = amount.currency; // Money.currency → string

    // Call old system
    this.oldSystem.processPayment(amountNumber, currencyCode);

    // Transform result → new format
    return {
      transactionId: Math.random().toString(36),
      timestamp: new Date(),
      amount
    };
  }
}

class ModernPaymentService {
  constructor(adapter) {
    this.processor = adapter;
  }

  async pay(amount) {
    // Dùng adapter — không cần biết OldPaymentSystem tồn tại
    return this.processor.pay(amount);
  }
}

// ✅ Fetch adapter — wrapper cho different APIs
class FetchAdapter {
  async get(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
}

class AxiosAdapter {
  constructor() { this.client = axios.create(); }
  async get(url) {
    const response = await this.client.get(url);
    return response.data;
  }
}
```

### 2c. Proxy — Control Access

**Khi nào dùng:** Lazy loading, access control, logging, caching, validation.

```javascript
// ✅ Proxy = Object đứng trước object khác, kiểm soát access
const user = {
  name: 'Alice',
  age: 30,
  _ssn: '123-45-6789' // private
};

// Proxy với validation
const safeUser = new Proxy(user, {
  get(target, prop) {
    if (prop.startsWith('_')) {
      throw new Error(`Cannot access private property: ${prop}`);
    }
    return target[prop];
  },

  set(target, prop, value) {
    if (prop === 'age' && (value < 0 || value > 150)) {
      throw new Error('Invalid age');
    }
    if (prop.startsWith('_')) {
      throw new Error(`Cannot set private property: ${prop}`);
    }
    target[prop] = value;
    return true;
  },

  has(target, prop) {
    return !prop.startsWith('_') && prop in target;
  }
});

safeUser.name;       // 'Alice'
safeUser._ssn;       // Error!
safeUser.age = -5;   // Error!

// ✅ Lazy loading proxy
const lazyImage = new Proxy({}, {
  set(target, prop, value) {
    if (prop === 'src') {
      const img = new Image();
      img.src = value;
      target[prop] = img;
    } else {
      target[prop] = value;
    }
    return true;
  }
});
lazyImage.alt = 'My Image'; // set immediately
lazyImage.src = 'large-image.jpg'; // load only when src set

// ✅ Virtual Proxy — expensive objects
class ExpensiveObject {
  constructor() {
    this.data = this.loadExpensiveData(); // load ngay cả khi không cần!
  }

  loadExpensiveData() {
    console.log('Loading expensive data...');
    return new Array(1_000_000).fill('data');
  }
}

const VirtualExpensive = new Proxy({}, {
  construct(target, args) {
    let instance = null;
    return new Proxy({}, {
      get(_, prop) {
        if (!instance) {
          instance = new ExpensiveObject();
        }
        return instance[prop];
      }
    });
  }
});

// Only creates ExpensiveObject when a property is accessed
```

### 2d. Facade — Đơn Giản Hóa Complex System

**Khi nào dùng:** Wrap complex subsystem, provide simple API, hide implementation details.

```javascript
// ❌ Complex subsystem — user phải hiểu tất cả details
class VideoFile {}
class Codec {}
class BitrateReader {}
class BitrateWriter {}
class AudioMixer {}

// User phải gọi 10+ methods để convert video!

// ✅ Facade — simple API cho complex subsystem
class VideoConverter {
  convert(filename, format) {
    // User chỉ cần gọi 1 method
    const file = this.readFile(filename);          // Facade handles
    const codec = this.getCodec(format);
    const data = this.extractVideo(file, codec);    // Facade handles
    const mixed = this.mixAudio(data);              // Facade handles
    const result = this.encodeVideo(mixed, codec); // Facade handles
    return result;
  }

  // Private methods — user không cần biết
  readFile(filename) { /* ... */ }
  getCodec(format) { /* ... */ }
  extractVideo(file, codec) { /* ... */ }
  mixAudio(data) { /* ... */ }
  encodeVideo(data, codec) { /* ... */ }
}

// Usage:
const converter = new VideoConverter();
converter.convert('movie.ogg', 'mp4'); // Simple!
// User không biết có 50 dòng code bên dưới
```

---

## 3. Behavioral Patterns — Hành Vi

### 3a. Observer — Event System

**Khi nào dùng:** Event handling, reactive programming, pub/sub, MVC architecture.

```javascript
// ✅ Observer pattern — một object notify nhiều objects
class Observable {
  constructor() {
    this.observers = new Set();
  }

  subscribe(observer) {
    this.observers.add(observer);
    return () => this.observers.delete(observer); // unsubscribe
  }

  notify(data) {
    this.observers.forEach(observer => observer.update(data));
  }
}

class PriceStore extends Observable {
  constructor() {
    super();
    this.price = 0;
  }

  setPrice(newPrice) {
    this.price = newPrice;
    this.notify({ price: newPrice, timestamp: Date.now() });
  }
}

class ChartComponent {
  update(data) {
    console.log(`Chart: price updated to ${data.price}`);
  }
}

class NotificationService {
  update(data) {
    if (data.price > 100) {
      console.log(`ALERT: Price spike! ${data.price}`);
    }
  }
}

const priceStore = new PriceStore();
const chart = new ChartComponent();
const notifier = new NotificationService();

const unsubChart = priceStore.subscribe(chart);
const unsubNotif = priceStore.subscribe(notifier);

priceStore.setPrice(95);  // Both notified
priceStore.setPrice(105); // Both notified + alert

unsubChart();             // Unsubscribe
priceStore.setPrice(110); // Only notifier notified

// ✅ EventEmitter (Node.js style)
class EventEmitter {
  constructor() { this.events = {}; }

  on(event, listener) {
    (this.events[event] ??= []).push(listener);
    return () => this.off(event, listener);
  }

  emit(event, ...args) {
    this.events[event]?.forEach(fn => fn(...args));
  }

  off(event, listener) {
    this.events[event] = this.events[event]
      ?.filter(fn => fn !== listener);
  }

  once(event, listener) {
    const unsub = this.on(event, (...args) => {
      listener(...args);
      unsub();
    });
  }
}
```

### 3b. Strategy — Interchangeable Algorithms

**Khi nào dùng:** Multiple algorithms for same task, runtime algorithm selection, eliminate conditionals.

```javascript
// ❌ Conditionals quá nhiều
function calculateShipping(order) {
  if (order.country === 'US') {
    return order.weight * 0.5 + 5;
  }
  if (order.country === 'UK') {
    return order.weight * 0.7 + 10;
  }
  if (order.country === 'VN') {
    return order.weight * 0.3 + 3;
  }
  // Thêm country → thêm if → spaghetti!
}

// ✅ Strategy — encapsulate algorithms
class ShippingStrategy {
  calculate(order) { throw new Error('Must implement'); }
}

class USShipping extends ShippingStrategy {
  calculate(order) { return order.weight * 0.5 + 5; }
}

class UKShipping extends ShippingStrategy {
  calculate(order) { return order.weight * 0.7 + 10; }
}

class VNShipping extends ShippingStrategy {
  calculate(order) { return order.weight * 0.3 + 3; }
}

class ShippingCalculator {
  constructor(strategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy) { // Có thể thay đổi lúc runtime!
    this.strategy = strategy;
  }

  calculate(order) {
    return this.strategy.calculate(order);
  }
}

const calculator = new ShippingCalculator(new USShipping());
calculator.calculate({ weight: 10, country: 'US' }); // 10.0

calculator.setStrategy(new VNShipping());
calculator.calculate({ weight: 10, country: 'VN' }); // 6.0

// ✅ Strategy còn dùng trong validation, sorting, payment, etc.
const strategies = {
  byName: (a, b) => a.name.localeCompare(b.name),
  byDate: (a, b) => new Date(a.date) - new Date(b.date),
  byPrice: (a, b) => a.price - b.price,
};

function sort(items, strategy) {
  return [...items].sort(strategies[strategy]);
}

sort(users, 'byName');
sort(users, 'byDate');
```

### 3c. Command — Encapsulate Request

**Khi nào dùng:** Undo/redo, queuing operations, macro recording, decouple sender/receiver.

```javascript
// ❌ Tight coupling: invoker gọi receiver trực tiếp
button.onClick = () => light.on(); // tight coupling
// Button biết về Light → không tái sử dụng được

// ✅ Command — encapsulate request as object
class Command {
  execute() { throw new Error('Must implement'); }
  undo() { throw new Error('Must implement'); }
}

class LightOnCommand extends Command {
  constructor(light) {
    super();
    this.light = light;
  }
  execute() { this.light.on(); }
  undo() { this.light.off(); }
}

class LightOffCommand extends Command {
  constructor(light) {
    super();
    this.light = light;
  }
  execute() { this.light.off(); }
  undo() { this.light.on(); }
}

// RemoteControl = INVOKER, không cần biết receiver là gì
class RemoteControl {
  constructor() {
    this.history = [];
  }

  execute(command) {
    command.execute();
    this.history.push(command);
  }

  undo() {
    const command = this.history.pop();
    if (command) command.undo();
  }

  undoAll() {
    while (this.history.length) this.undo();
  }
}

// Usage:
const light = new Light();
const lightOn = new LightOnCommand(light);
const lightOff = new LightOffCommand(light);

const remote = new RemoteControl();
remote.execute(lightOn); // Light ON
remote.execute(lightOff); // Light OFF
remote.undo();          // Light ON (undo)
remote.undo();          // Light OFF (undo again)

// ✅ Macro command — batch operations
class MacroCommand extends Command {
  constructor(commands) {
    super();
    this.commands = commands;
  }
  execute() { this.commands.forEach(cmd => cmd.execute()); }
  undo() { this.commands.slice().reverse().forEach(cmd => cmd.undo()); }
}

const goToSleep = new MacroCommand([lightOff, lockDoor, setAlarm]);
remote.execute(goToSleep); // All done!
remote.undo(); // All undone in reverse!
```

### 3d. State — Object Thay Đổi Hành Vi Theo State

**Khi nào dùng:** Finite state machines, workflow states, UI states, connection states.

```javascript
// ❌ Finite state machine với if-else = hard to maintain
class Order {
  constructor() {
    this.state = 'pending';
  }

  pay() {
    if (this.state === 'pending') {
      this.state = 'paid';
      console.log('Payment accepted!');
    } else {
      console.log('Cannot pay — invalid state:', this.state);
    }
  }

  ship() {
    if (this.state === 'paid') {
      this.state = 'shipped';
      console.log('Order shipped!');
    } else {
      console.log('Cannot ship — invalid state:', this.state);
    }
  }

  // ... cancel, refund, deliver, etc.
  // Mỗi state transition = if-else
  // Thêm state mới → sửa TẤT CẢ methods!
}

// ✅ State pattern — mỗi state = class riêng
class OrderState {
  pay(order) { throw new Error('Cannot pay'); }
  ship(order) { throw new Error('Cannot ship'); }
  cancel(order) { throw new Error('Cannot cancel'); }
}

class PendingState extends OrderState {
  pay(order) {
    order.setState(new PaidState());
    console.log('Payment accepted!');
  }
  cancel(order) {
    order.setState(new CancelledState());
    console.log('Order cancelled!');
  }
  ship() { /* ❌ Cannot ship from pending */ }
}

class PaidState extends OrderState {
  pay(order) { console.log('Already paid!'); }
  ship(order) {
    order.setState(new ShippedState());
    console.log('Order shipped!');
  }
  cancel(order) {
    order.setState(new RefundState());
    console.log('Refund initiated!');
  }
}

class ShippedState extends OrderState {
  deliver(order) {
    order.setState(new DeliveredState());
    console.log('Delivered!');
  }
  cancel() { console.log('Cannot cancel — already shipped'); }
}

// Context
class Order {
  constructor() {
    this.state = new PendingState();
  }
  setState(state) { this.state = state; }
  pay() { this.state.pay(this); }
  ship() { this.state.ship(this); }
  cancel() { this.state.cancel(this); }
}

// Usage:
const order = new Order();
order.pay();    // PendingState → PaidState
order.ship();   // PaidState → ShippedState
order.cancel(); // 'Cannot cancel — already shipped' ✅
```

### 3e. Iterator — Duyệt Collection

```javascript
// ✅ Iterator — standard way to traverse any collection
class ArrayIterator {
  constructor(collection) {
    this.collection = collection;
    this.index = 0;
  }

  hasNext() { return this.index < this.collection.length; }
  next() {
    if (!this.hasNext()) throw new Error('No more elements');
    return this.collection[this.index++];
  }
}

class LinkedListIterator {
  constructor(node) {
    this.current = node;
  }

  hasNext() { return this.current !== null; }
  next() {
    if (!this.hasNext()) throw new Error('No more elements');
    const value = this.current.value;
    this.current = this.current.next;
    return value;
  }
}

// ✅ ES6 built-in iterator
const numbers = [1, 2, 3];
const iterator = numbers[Symbol.iterator]();

iterator.next(); // { value: 1, done: false }
iterator.next(); // { value: 2, done: false }
iterator.next(); // { value: 3, done: false }
iterator.next(); // { value: undefined, done: true }

// ✅ Custom iterable object
const range = {
  from: 1,
  to: 5,

  [Symbol.iterator]() {
    let current = this.from;
    const to = this.to;
    return {
      [Symbol.iterator]() { return this; },
      next() {
        if (current <= to) {
          return { value: current++, done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
};

for (const num of range) {
  console.log(num); // 1, 2, 3, 4, 5
}

// ✅ Spread với iterable
[...range]; // [1, 2, 3, 4, 5]
[...new Set([1, 2, 2, 3])]; // [1, 2, 3]
```

---

## 4. Các Traps Phổ Biến

### Trap 1: Singleton滥用 — Global State

```javascript
// ❌ Singleton trở thành global state = hard to test
const globalStore = new SingletonStore();
globalStore.set('user', { name: 'Alice' });
// Ở đâu đó trong code:
// const user = globalStore.get('user'); // Ai set? Khi nào?

// ✅ Thay bằng Dependency Injection
function createStore() { return new Map(); }

function UserService(store) {
  this.getUser = () => store.get('user');
}

function App({ userService }) {
  // Rõ ràng: App cần userService được inject
  // Dễ test: truyền mock store
}
```

### Trap 2: Observer memory leak

```javascript
// ❌ Subscriber không unsubscribe = memory leak
class EventBus {
  subscribe(event, callback) {
    this.listeners.push(callback); // Never cleaned!
    // Component bị unmount → callback vẫn trong memory
  }
}

// ✅ Luôn return unsubscribe function
class EventBus {
  subscribe(event, callback) {
    this.listeners.push(callback);
    return () => {
      const idx = this.listeners.indexOf(callback);
      if (idx > -1) this.listeners.splice(idx, 1);
    };
  }
}

// ✅ Trong React:
useEffect(() => {
  const unsub = eventBus.subscribe('update', handler);
  return () => unsub(); // Cleanup!
}, []);
```

### Trap 3: State pattern overkill

```javascript
// ❌ Dùng state pattern cho 2-3 states đơn giản = over-engineering
class Document {
  getState() { return this._state; }
  setState(s) { this._state = s; }
}

// ✅ Dùng simple state machine hoặc boolean flags
const states = ['draft', 'published', 'archived'];
const isEditable = ['draft'].includes(currentState);
```

### Trap 4: Factory không return interface nhất quán

```javascript
// ❌ Factory return objects KHÁC NHAU tùy type
function createShape(type) {
  if (type === 'circle') return { radius: 5, getArea: () => {} };
  if (type === 'rect') return { width: 5, height: 3, getArea: () => {} };
  // getArea() interface KHÁC NHAU!
}

// ✅ Factory phải return objects có cùng interface
function createShape(type, props) {
  const shape = { type, ...props };
  shape.getArea = () => {
    if (type === 'circle') return Math.PI * shape.radius ** 2;
    if (type === 'rect') return shape.width * shape.height;
  };
  return shape; // cùng interface: { getArea, type, ...props }
}
```

---

## 5. Câu Hỏi Phỏng Vấn

### Câu 1: Phân biệt Factory vs Builder

| | Factory | Builder |
|--|---------|---------|
| Purpose | Create objects của different types | Create complex object với many options |
| Arguments | Type identifier | Individual named parameters |
| Return | Single object (type tùy argument) | Same Builder instance (chainable) |
| Use case | Polymorphic creation | Objects với optional params |
| Example | `createButton('primary')` | `new ButtonBuilder().text('OK').color('blue').build()` |

---

### Câu 2: Observer vs Pub/Sub

**Trả lời:** Observer là implementation của Pub/Sub pattern. **Observer**: Subject có array of observers, chủ động notify khi state thay đổi. **Pub/Sub**: Publisher và Subscriber giao tiếp qua Event Channel/Broker, hoàn toàn decoupled — publisher và subscriber không biết nhau. Pub/Sub scale hơn vì không có direct dependency.

```javascript
// Observer: subject knows observers
class Subject {
  observers = [];
  attach(o) { this.observers.push(o); }
  notify() { this.observers.forEach(o => o.update()); }
}

// Pub/Sub: decoupled via broker
const broker = new EventEmitter();
publisher.publish('event', data); // Publisher
subscriber.subscribe('event', handler); // Subscriber
// Publisher và Subscriber không biết nhau!
```

---

### Câu 3: Strategy vs State

| | Strategy | State |
|--|---------|-------|
| Intent | Interchangeable algorithms | Object thay đổi behavior khi state thay đổi |
| Client knows | Strategy được dùng | Không biết state nào đang active |
| Changes | Client chủ động set strategy | Object tự đổi state (thường) |
| Relationship | Composition (has-a) | Inheritance-like (is-a) |
| Use case | Sorting algorithms, payment methods | Order states, connection states |

---

### Câu 4: Proxy vs Decorator

| | Proxy | Decorator |
|--|-------|-----------|
| Intent | Control access to object | Add behavior to object |
| Relationship | Represents same object | Wraps and enhances |
| Client | Dùng proxy thay vì real object | Dùng decorated object along with original |
| Changes | Access validation, lazy loading, caching | Add responsibilities dynamically |
| Interface | Same interface | Same interface |

---

### Câu 5: Command pattern làm sao implement undo/redo?

**Trả lời:** Command objects encapsulate requests. Mỗi Command có `execute()` và `undo()`. Invoker giữ history stack. `execute()` push command vào history. `undo()` pop từ history, gọi `undo()` trên command đó. Redo = re-execute command vừa undone. Limit history size để tránh memory issues.

```javascript
class HistoryManager {
  constructor() {
    this.history = [];
    this.redoStack = [];
  }

  execute(command) {
    command.execute();
    this.history.push(command);
    this.redoStack = []; // Clear redo on new action
  }

  undo() {
    const cmd = this.history.pop();
    if (cmd) {
      cmd.undo();
      this.redoStack.push(cmd);
    }
  }

  redo() {
    const cmd = this.redoStack.pop();
    if (cmd) {
      cmd.execute();
      this.history.push(cmd);
    }
  }
}
```

---

### Câu 6: Iterator protocol là gì?

**Trả lời:** Object là iterable nếu có `Symbol.iterator` method trả về iterator. Iterator = object có `next()` method trả về `{ value, done }`. `for...of`, spread, `Array.from()` hoạt động với bất kỳ iterable nào. Generator functions (`function*`) là cách đơn giản nhất để tạo iterator.

```javascript
function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

const fib = fibonacci();
fib.next(); // { value: 0, done: false }
fib.next(); // { value: 1, done: false }
fib.next(); // { value: 1, done: false }

for (const f of fibonacci()) {
  if (f > 100) break;
  console.log(f);
}
```

---

### Câu 7: Module pattern vs ESM modules

| | Module Pattern (IIFE) | ES Modules |
|--|----------------------|------------|
| Syntax | IIFE + return object | `import`/`export` keywords |
| Loading | Manual | Native browser/Node support |
| Tree-shaking | No | Yes (bundlers) |
| Circular deps | Manual handling | Supported (hoisting) |
| Async loading | Manual | Native dynamic import |
| Browser support | All browsers | Modern browsers + Node |

---

### Câu 8: Khi nào KHÔNG nên dùng patterns?

**Trả lời:** (1) **Simple code**: đừng dùng strategy pattern cho 2 if-else. (2) **Over-engineering**: dùng state pattern cho login/logout = overkill. (3) **Premature abstraction**: thêm abstraction layer trước khi hiểu rõ requirements. (4) **Testing environment**: patterns làm test phức tạp hơn (mocking). (5) **Team unfamiliarity**: pattern không được team hiểu = maintainability nightmare. **Rule of thumb**: YAGNI (You Aren't Gonna Need It). Thêm pattern khi CẦN, không phải khi NGHĨ SẼ CẦN.

---

## 6. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  DESIGN PATTERNS — 12 PATTERNS IN JAVASCRIPT                   │
│                                                               │
│  CREATIONAL (Object Creation)                                  │
│  ├── Singleton — 1 instance, module pattern tự nhiên nhất   │
│  ├── Factory — polymorphic creation, type-based             │
│  ├── Builder — complex objects, fluent interface             │
│  └── Module — encapsulation, IIFE/ESM                        │
│                                                               │
│  STRUCTURAL (Object Structure)                                │
│  ├── Decorator — add behavior dynamically                   │
│  ├── Adapter — wrap incompatible interfaces                  │
│  ├── Proxy — control access (validation, lazy, logging)    │
│  └── Facade — simplify complex subsystem                    │
│                                                               │
│  BEHAVIORAL (Object Interaction)                              │
│  ├── Observer/PubSub — event systems, reactivity           │
│  ├── Strategy — interchangeable algorithms                  │
│  ├── Command — encapsulate requests, undo/redo              │
│  ├── State — FSM, workflow states                          │
│  └── Iterator — traverse any collection                     │
│                                                               │
│  ⚠️ Patterns = thinking tool, not copy-paste code          │
│  ⚠️ YAGNI: đừng dùng khi không cần                        │
│  ⚠️ Observable: luôn return unsubscribe function          │
│  ⚠️ Singleton → abuse = global state → hard to test        │
│  ⚠️ ESM modules = modern Singleton/Module approach        │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. Mối Liên Hệ

```
Design Patterns
  ├── OOP Fundamentals (001) ← patterns built on OOP concepts
  ├── Functional Programming (002) ← many patterns functional-friendly
  ├── Module System (06) ← Module pattern và ESM
  ├── Observable Pattern (004) ← Observer + RxJS
  ├── Dependency Injection (005) ← DI + pattern combination
  └── Clean Architecture (006) ← patterns combine into architecture
```

---

## Checklist

- [ ] Implement được Singleton, Factory, Builder, Module
- [ ] Biết dùng Decorator, Adapter, Proxy, Facade
- [ ] Implement được Observer, Strategy, Command, State patterns
- [ ] Hiểu Iterator protocol và custom iterables
- [ ] Phân biệt được Observer vs Pub/Sub
- [ ] Biết khi nào KHÔNG nên dùng patterns
- [ ] Trả lời được 6/8 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
