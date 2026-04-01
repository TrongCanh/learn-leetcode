# OOP Fundamentals — Khi Object Trở Thành Trung Tâm

## Câu hỏi mở đầu

```javascript
// Câu hỏi phỏng vấn kinh điển:
// Có 2 cách để "mở rộng" behavior trong JavaScript:
// 1. Kế thừa (inheritance): class Dog extends Animal
// 2. Composition: const dog = { ...animal, bark: () => {} }
// Bạn chọn cách nào? Tại sao?

// Senior dev trả lời: "Tùy. Nhưng composition được ưu tiên."
// Có bạn trả lời được TẠI SAO không?
```

Câu trả lời nằm ở bản chất của **object** trong JavaScript — ngôn ngữ prototype-based, không phải class-based như Java hay C++. Hiểu sai OOP trong JS dẫn đến thiết kế yếu, tight coupling, và code khó maintain. Bài này giúp bạn hiểu đúng, không phải học vẹt.

---

## 1. JavaScript Có Phải OOP Language?

### Sự thật đáng ngạc nhiên

```javascript
// JavaScript dùng PROTOTYPE, không phải CLASS
// "class" keyword chỉ là SYNTAXIC SUGAR

class Dog {
  constructor(name) {
    this.name = name;
  }

  bark() {
    return `${this.name} says woof!`;
  }
}

const buddy = new Dog('Buddy');
// buddy.__proto__ === Dog.prototype ✅

// Nhưng prototype chain thực ra là:
Dog.prototype.constructor === Dog;       // true
Dog.prototype.__proto__ === Object.prototype; // true

// Và class cũng là object:
typeof Dog;        // 'function' ← class = function!
Dog.prototype;     // object ← prototype = object!
```

### Prototype chain — Bản chất thực của JavaScript OOP

```javascript
// Khi bạn truy cập buddy.bark():
// JS tìm: buddy (không có bark)
// → buddy.__proto__ = Dog.prototype (có bark!) → TÌM THẤY!

// Full prototype chain:
buddy
  → Dog.prototype
    → Object.prototype
      → null (end of chain)

// Mỗi bước là một object có thể có properties
// Đây là prototype chain, KHÔNG phải class hierarchy
```

### Cốt lõi: Prototypal Inheritance

```javascript
// Tạo object từ object — không cần class
const animal = {
  alive: true,
  breathe() { return 'inhale... exhale...'; }
};

// Tạo dog TỪ animal (prototype)
const dog = Object.create(animal);
// dog.__proto__ === animal ✅

console.log(dog.breathe()); // kế thừa từ animal!
console.log(dog.alive);     // kế thừa từ animal!

// Gán thêm property riêng cho dog
dog.legs = 4;
dog.bark = () => 'Woof!';

console.log(Object.getPrototypeOf(dog)); // animal
```

---

## 2. Four Pillars of OOP in JavaScript

### 2a. Encapsulation — Giấu Chi Tiết, Chỉ Cho Phép Nhìn Thấy

```javascript
// JavaScript có 3 cách để "encapsulate":

// Cách 1: closure (best for private state)
function Counter() {
  let count = 0; // ← PRIVATE, closure giấu biến này

  this.increment = () => {
    count++;
    return count;
  };

  this.decrement = () => {
    count--;
    return count;
  };

  this.getCount = () => count; // chỉ read, không write trực tiếp
}

const counter = new Counter();
counter.increment(); // 1
counter.increment(); // 2
counter.count;       // undefined — count là private!
counter.getCount();   // 2

// Cách 2: ES2022 private fields (#)
class SecureCounter {
  #count = 0; // ← Truly private, compiler-enforced

  increment() { this.#count++; return this.#count; }
  getCount()   { return this.#count; }
}

const sc = new SecureCounter();
sc.#count; // SyntaxError: Private field '#count'
sc.getCount(); // 2 ✅

// Cách 3: Symbol keys (weak encapsulation)
const _count = Symbol('count');
class SymbolCounter {
  constructor() {
    this[_count] = 0;
  }
  increment() { this[_count]++; return this[_count]; }
}
// ⚠️ Symbol không thực sự private — dùng Object.getOwnPropertySymbols()
```

### 2b. Abstraction — Ẩn Chi Tiết Phức Tạp

```javascript
// Abstraction = chỉ cho người dùng thấy những gì cần thiết

// ❌ Không có abstraction: user thấy tất cả
class HttpRequest {
  socket; timeout; encoding; headers; encodingOptions;
  pipeline; connectionPool; retryCount;
  // User phải hiểu tất cả → dễ sai!
}

// ✅ Có abstraction: user chỉ thấy intent
class HttpClient {
  // Implementation chi tiết được ẨN
  #socket;
  #connectionPool;
  #retryLogic;

  async get(url, options = {}) {
    // Làm gì với options? User không cần biết
    return this.#request('GET', url, options);
  }

  async post(url, data) {
    return this.#request('POST', url, { body: data });
  }
}

const api = new HttpClient();
await api.get('https://api.example.com/users'); // User chỉ cần biết get/post
```

### 2c. Inheritance — Kế Thừa (Nhưng Dùng Cẩn Thận)

```javascript
// ES5: Prototype chain inheritance
function Animal(name) {
  this.name = name;
}

Animal.prototype.breathe = function() {
  return `${this.name} is breathing`;
};

function Dog(name, breed) {
  Animal.call(this, name); // Gọi parent constructor
  this.breed = breed;
}

// Link prototypes — quan trọng nhất!
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

// Override
Dog.prototype.breathe = function() {
  return `${this.name} (a ${this.breed}) is panting`;
};

Dog.prototype.bark = function() {
  return `${this.name} says WOOF!`;
};

// ES6+ class syntax (đẹp hơn):
class Animal {
  constructor(name) { this.name = name; }
  breathe() { return `${this.name} breathes`; }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name); // Gọi Animal constructor
    this.breed = breed;
  }

  bark() { return `${this.name} says WOOF!`; }

  // Override
  breathe() { return `${this.name} is panting`; }
}

const rex = new Dog('Rex', 'German Shepherd');
rex.breathe(); // 'Rex is panting' (override)
rex.bark();    // 'Rex says WOOF!' (Dog's own)
```

### 2d. Polymorphism — Nhiều Hình Thái

```javascript
// Polymorphism = cùng một interface, nhiều implementations

// Ví dụ: render function chấp nhận NHIỀU loại objects

class Animal {
  speak() { throw new Error('Must override speak()'); }
}

class Dog extends Animal {
  speak() { return 'Woof!'; }
}

class Cat extends Animal {
  speak() { return 'Meow!'; }
}

class Cow extends Animal {
  speak() { return 'Moo!'; }
}

// render nhận BẤT KỲ Animal nào
function makeThemSpeak(animals) {
  return animals.map(animal => animal.speak());
}

makeThemSpeak([new Dog(), new Cat(), new Cow()]);
// ['Woof!', 'Meow!', 'Moo!'] — cùng method, khác behavior

// Đây là AD-HOC polymorphism (override method)
// Parameter polymorphism = generic functions
```

---

## 3. Inheritance vs Composition — Câu Trả Lời Đầy Đủ

### Composition — Được Ưu Tiên

```javascript
// ❌ Inheritance sâu → "Gorilla-banana problem"
class Animal { /* ... */ }
class Mammal extends Animal { /* ... */ }
class Dog extends Mammal { /* ... */ }
// Muốn dog có bark()? → phải thêm ở Dog
// Muốn dog có swim()? → phải thêm ở Dog
// Muốn dog có fly()? → không hợp lý với inheritance!

// ✅ Composition: compose từ behaviors nhỏ
const canBark = {
  bark() { return 'Woof!'; }
};

const canSwim = {
  swim() { return 'Swimming...'; }
};

const canFly = {
  fly() { return 'Flying...'; }
};

const dog = {
  name: 'Buddy',
  ...canBark,   // mix in bark behavior
  ...canSwim,   // mix in swim behavior
  // KHÔNG có fly — không cần
};

dog.bark(); // 'Woof!' ✅
dog.fly();  // undefined — không có ✅ (đúng business logic)

// ⚠️ Spread operator chỉ shallow copy methods
// ⚠️ Nếu canBark có state, dùng Object.assign() hoặc factory function
```

### Factory pattern với Composition

```javascript
// Tạo object từ behaviors — LINH HOẠT hơn class

function createAnimal(name, behaviors = []) {
  return {
    name,
    ...behaviors.reduce((acc, b) => ({ ...acc, ...b }), {}),
    speak() {
      return `${name} makes a sound`;
    }
  };
}

const dogBehaviors = [
  {
    bark() { return `${this.name} says Woof!`; }
  },
  {
    fetch(item) { return `${this.name} fetches ${item}`; }
  }
];

const catBehaviors = [
  {
    meow() { return `${this.name} says Meow!`; }
  },
  {
    scratch() { return `${this.name} scratches`; }
  }
];

const buddy = createAnimal('Buddy', dogBehaviors);
const whiskers = createAnimal('Whiskers', catBehaviors);

buddy.bark();      // ✅
whiskers.meow();  // ✅
buddy.meow();     // undefined — đúng!
```

### Khi nào dùng Inheritance

```javascript
// ✅ DÙNG INHERITANCE khi:
// - Có "is-a" relationship rõ ràng (Dog IS-A Animal)
// - Subclass thực sự CHIA SẺ implementation với parent
// - Lớp cha thay đổi → lớp con tự động thay đổi
// - Bạn muốn dùng POLYMORPHISM (override methods)

class Animal {
  eat() { /* same for all animals */ }
  sleep() { /* same for all animals */ }
}

class Dog extends Animal {
  // eat() và sleep() được KẾ THỪA — không phải viết lại
  bark() { /* dog-specific */ }
}

// ❌ DÙNG COMPOSITION khi:
// - Có "has-a" relationship (Car HAS-A Engine)
// - Bạn muốn THAY ĐỔI behavior lúc runtime
// - Bạn muốn TRÁNH deep inheritance hierarchies
// - Behaviors không tự nhiên fit vào type hierarchy

class Engine { start() { /* ... */ } }
class Car {
  constructor() { this.engine = new Engine(); }
  start() { this.engine.start(); }
}
```

### The Diamond Problem (Multiple Inheritance)

```javascript
// JavaScript KHÔNG có multiple inheritance trực tiếp
// nhưng có thể mô phỏng qua mixins

// Mixin = function nhận class, thêm methods, return class mới
const FlyMixin = (Base) => class extends Base {
  fly() { return `${this.name} flies!`; }
};

const SwimMixin = (Base) => class extends Base {
  swim() { return `${this.name} swims!`; }
};

class Animal {
  constructor(name) { this.name = name; }
}

class Bird extends FlyMixin(Animal) {}
class Fish extends SwimMixin(Animal) {}

// 🦆 Duck = vừa bay vừa bơi được?
class Duck extends FlyMixin(SwimMixin(Animal)) {}

const duck = new Duck('Donald');
duck.fly();  // ✅
duck.swim(); // ✅

// ⚠️ Mixin order matters!
// class Duck extends SwimMixin(FlyMixin(Animal))
// → methods của FlyMixin override SwimMixin
```

---

## 4. SOLID Principles in JavaScript

### S — Single Responsibility

```javascript
// ❌ Class làm quá nhiều việc
class UserManager {
  validateUser() { /* ... */ }
  saveToDatabase() { /* ... */ }
  sendEmail() { /* ... */ }
  generateReport() { /* ... */ }
  encryptPassword() { /* ... */ }
}

// ✅ Mỗi class một trách nhiệm
class UserValidator { validateUser() { /* ... */ } }
class UserRepository { save(user) { /* ... */ } }
class UserEmailService { sendEmail(user) { /* ... */ } }
class PasswordHasher { hash(password) { /* ... */ } }
```

### O — Open/Closed

```javascript
// ❌ Phải sửa existing code khi thêm feature mới
class AreaCalculator {
  calculate(shape) {
    if (shape.type === 'circle') {
      return Math.PI * shape.radius ** 2;
    }
    if (shape.type === 'rectangle') {
      return shape.width * shape.height;
    }
    // Thêm hình mới → PHẢI SỬA ĐOẠN NÀY!
  }
}

// ✅ Mở rộng bằng cách thêm class, không sửa existing code
class Shape {
  getArea() { throw new Error('Must implement'); }
}

class Circle extends Shape {
  constructor(radius) { super(); this.radius = radius; }
  getArea() { return Math.PI * this.radius ** 2; }
}

class Rectangle extends Shape {
  constructor(w, h) { super(); this.width = w; this.height = h; }
  getArea() { return this.width * this.height; }
}

class AreaCalculator {
  calculate(shape) {
    return shape.getArea(); // Polymorphism!
  }
}
```

### L — Liskov Substitution

```javascript
// ❌ Liskov violation: Rectangle không thể thay thế Square
class Rectangle {
  setWidth(w) { this.width = w; }
  setHeight(h) { this.height = h; }
  area() { return this.width * this.height; }
}

class Square extends Rectangle {
  setWidth(w) { this.width = w; this.height = w; }
  setHeight(h) { this.height = h; this.width = h; }
}

function increaseWidth(rect) {
  rect.setWidth(rect.width + 10);
}

const rect = new Rectangle();
increaseWidth(rect); // works

const square = new Square();
increaseWidth(square); // Liskov violation!
// square area tăng 10*(10+10)=200 thay vì (10+10)*10=200?
// Behavior không nhất quán!

// ✅ Tách Square ra khỏi Rectangle hierarchy
class Shape {
  getArea() { throw new Error('Must implement'); }
}

class Rectangle extends Shape {
  constructor(w, h) { super(); this.width = w; this.height = h; }
  getArea() { return this.width * this.height; }
}

class Square extends Shape {
  constructor(side) { super(); this.side = side; }
  getArea() { return this.side ** 2; }
}
```

### I — Interface Segregation

```javascript
// ❌ Fat interface: class phải implement methods không cần
class Animal {
  eat() { /* ... */ }
  fly() { throw new Error('Not all animals can fly'); }
  swim() { throw new Error('Not all animals can swim'); }
}

// ✅ Small interfaces (roles)
class Eater {
  eat() { /* ... */ }
}

class Flyer {
  fly() { /* ... */ }
}

class Swimmer {
  swim() { /* ... */ }
}

// Kết hợp theo nhu cầu:
class Dog extends Eater {
  // swim() KHÔNG implement → Dog không thể swim
}

class Duck extends Eater {
  // Dùng nhiều interfaces
  constructor() {
    super();
    Object.assign(this, new Flyer(), new Swimmer());
  }
}
```

### D — Dependency Inversion

```javascript
// ❌ High-level phụ thuộc low-level
class MySQLDatabase {
  query(sql) { /* ... */ }
}

class UserService {
  constructor() {
    this.db = new MySQLDatabase(); // tight coupling!
  }
}

// ✅ Abstractions (interfaces) giữa layers
class Database {
  query(sql) { throw new Error('Must implement'); }
  save(data) { throw new Error('Must implement'); }
}

class MySQLDatabase extends Database {
  query(sql) { /* MySQL implementation */ }
}

class MongoDBDatabase extends Database {
  query(sql) { /* MongoDB implementation */ }
}

class UserService {
  constructor(database) {
    this.db = database; // inject dependency
  }
}

// Thay đổi database mà không sửa UserService!
const service = new UserService(new MongoDBDatabase());
```

---

## 5. Các Traps Phổ Biến

### Trap 1: Class là object, không phải blueprint hoàn hảo

```javascript
// ❌ Class trong JS không tạo true encapsulation
class BankAccount {
  constructor(balance) { this.balance = balance; }
}

const account = new BankAccount(1000);
account.balance = -9999; // Không ai ngăn được!
// balance hoàn toàn public!

// ✅ Dùng private fields (#)
class BankAccount {
  #balance;
  constructor(balance) { this.#balance = balance; }
  getBalance() { return this.#balance; }
  deposit(amount) { this.#balance += amount; }
  withdraw(amount) {
    if (amount > this.#balance) throw new Error('Insufficient funds');
    this.#balance -= amount;
  }
}

account = new BankAccount(1000);
account.#balance;    // SyntaxError ✅
account.withdraw(500); // OK
account.withdraw(9999); // Error ✅
```

### Trap 2: Arrow function không có `this` riêng

```javascript
// ❌ Arrow function trong class = no own `this`
class Counter {
  count = 0;

  // ❌ Arrow function: this không bind được đúng
  increment = () => {
    this.count++;
  };
}

// Khi dùng:
const btn = document.querySelector('button');
btn.addEventListener('click', counter.increment);
// → this = button (event target)!
// → counter.count không tăng!

// ✅ Dùng regular method + bind hoặc arrow wrapper
class Counter {
  count = 0;
  increment() { this.count++; }
}

btn.addEventListener('click', counter.increment.bind(counter));
// hoặc:
btn.addEventListener('click', () => counter.increment());
```

### Trap 3: super() phải được gọi trước khi dùng this

```javascript
// ❌ super() phải gọi TRƯỚC
class Parent {
  constructor() { this.x = 1; }
}

class Child extends Parent {
  constructor() {
    this.y = 2; // ❌ ReferenceError: Must call super before this
    super();
  }
}

// ✅ super() trước
class Child extends Parent {
  constructor() {
    super(); // Gọi parent constructor TRƯỚC
    this.y = 2; // ✅ OK
  }
}
```

### Trap 4: Method overriding ≠ method overloading

```javascript
// ❌ JS KHÔNG có method overloading
class Calculator {
  add(a, b) { return a + b; }

  // ❌ Override hoàn toàn, không phải overload
  add(a, b, c) { return a + b + c; }
}

const calc = new Calculator();
calc.add(1, 2);   // NaN! — JS dùng method CUỐI cùng
calc.add(1, 2, 3); // 6

// ✅ Overload bằng default params hoặc rest
class Calculator {
  add(a, b, c = 0) { return a + b + c; }
}
```

### Trap 5: "Class" không phải đối tượng thực

```javascript
// ❌ Nhầm lẫn: class ≠ object instance
class Animal {
  static count = 0; // Animal.count, không phải instance property
  constructor() { Animal.count++; }
}

const dog = new Animal();
const cat = new Animal();
Animal.count;      // 2 ✅
dog.count;         // undefined ❌ (không phải property của dog)

class StaticVsInstance {
  static shared = 'shared';  // Class property
  instance = 'instance';      // Instance property

  static getShared() { return this.shared; } // Static method
  getInstance() { return this.instance; }     // Instance method
}

StaticVsInstance.getShared();     // 'shared' — gọi trên class
const obj = new StaticVsInstance();
obj.getInstance();                // 'instance' — gọi trên instance
```

---

## 6. Câu Hỏi Phỏng Vấn

### Câu 1: JavaScript là prototype-based hay class-based?

**Trả lời:** **Prototype-based.** JavaScript không có class trong runtime — `class` keyword chỉ là syntactic sugar trên prototype chain. Khi bạn viết `class Dog extends Animal`, JS tạo `Dog.prototype` với `[[Prototype]]` = `Animal.prototype`. Mọi object đều có `[[Prototype]]` (truy cập qua `.__proto__` hoặc `Object.getPrototypeOf()`). Class-based languages (Java, C++) dùng class templates → instances. JavaScript dùng prototype chain → objects tạo objects khác.

---

### Câu 2: Composition vs Inheritance — khi nào dùng cái nào?

**Trả lời:** Ưu tiên **composition** vì: tránh deep hierarchies, linh hoạt hơn (thay đổi behavior runtime), giảm coupling. Dùng **inheritance** khi có "is-a" relationship rõ ràng và subclass thực sự chia sẻ implementation với parent. Trong thực tế, composition chiếm 80%, inheritance chiếm 20% cho những trường hợp tự nhiên (Animal → Dog → Cat).

---

### Câu 3: SOLID là gì? Áp dụng được không trong JS?

**Trả lời:** 5 nguyên tắc thiết kế OOP: **S**ingle responsibility (mỗi class một việc), **O**pen/Closed (mở rộng không sửa), **L**iskov Substitution (thay thế được), **I**nterface Segregation (interface nhỏ), **D**ependency Inversion (phụ thuộc abstraction). Áp dụng ĐƯỢC trong JS: dùng class/ESM modules để enforce SRP, dùng abstract classes để enforce LSP, dùng composition để enforce ISP và DIP.

---

### Câu 4: Private fields vs Symbol keys vs closures

```javascript
// So sánh 3 cách encapsulation:
class ClosurePrivate {
  constructor(secret) {
    // Closure: tạo scope riêng, không truy cập được từ ngoài
    let _secret = secret;
    this.getSecret = () => _secret;
  }
}

class SymbolPrivate {
  constructor(secret) {
    const _key = Symbol('secret');
    this[_key] = secret;
  }
  // ⚠️ Symbol không truly private — getOwnPropertySymbols()
}

class RealPrivate {
  #secret; // ES2022, truly private, compiler-enforced
  constructor(secret) { this.#secret = secret; }
}
```

**Trả lời:** Closures → private state bằng closure scope, memory retained, phổ biến nhất. Symbol keys → pseudo-private, có thể enumerate qua `Object.getOwnPropertySymbols()`. Private fields (`#`) → truly private, engine-enforced, recommended cho ES2022+.

---

### Câu 5: Mixins vs Multiple Inheritance

**Trả lời:** Mixins là function nhận class và return class mới với additional methods. JavaScript không có multiple inheritance nhưng mixins mô phỏng được. Khác với multiple inheritance: mixins không copy state (chỉ methods), order matters (later mixin methods override earlier), không có diamond problem vì đơn giản hơn.

```javascript
const withLogger = (Base) => class extends Base {
  log(msg) { console.log(`[${this.constructor.name}]: ${msg}`); }
};

const withValidator = (Base) => class extends Base {
  validate(data) { /* ... */ }
};

class Service extends withLogger(withValidator(Base)) {}
```

---

### Câu 6: this binding trong OOP JS — các trường hợp

```javascript
const obj = {
  name: 'Alice',
  greet() { return this.name; }
};

const fn = obj.greet; // Lấy method, không gọi ngay
fn(); // undefined (strict) — this = globalThis

// 4 rules:
obj.greet();           // ① this = obj (object preceding dot)
fn.call(obj);          // ② this = obj (explicit bind)
const bound = fn.bind(obj);
bound();               // ③ this = obj (permanently bound)
const arrow = () => obj.greet();
arrow();               // ④ this = obj (arrow inherits from enclosing scope)
```

**Trả lời:** 4 cách bind `this`: (1) dot notation khi gọi, (2) `.call/.apply`, (3) `.bind()` tạo permanent bound function, (4) arrow function inherit từ enclosing scope. ES6 classes dùng `.bind(this)` trong constructor hoặc dùng arrow fields.

---

### Câu 7: Object.create() vs new ClassName()

```javascript
// Object.create(): tạo object với explicit prototype
const animal = { speak() { return '...'; } };
const dog = Object.create(animal); // dog.__proto__ = animal

// new ClassName(): tạo instance qua constructor + prototype chain
class Animal {}
const animal = new Animal(); // animal.__proto__ = Animal.prototype

// Object.create() dùng cho:
// - Prototype inheritance thuần
// - Object literal với custom prototype
// - Mixin patterns

// new ClassName() dùng cho:
// - OOP style với constructor
// - Instance properties
// - Khi cần instanceof
```

**Trả lời:** `Object.create(proto)` tạo object với prototype được chỉ định rõ ràng, không gọi constructor. `new ClassName()` gọi constructor, setup prototype chain, và tạo instance. `Object.create()` linh hoạt hơn, `new` OOP-friendly hơn.

---

### Câu 8: instanceof hoạt động như thế nào?

```javascript
function Animal() {}
function Dog() {}
Dog.prototype = Object.create(Animal.prototype);

const rex = new Dog();
rex instanceof Dog;    // true
rex instanceof Animal; // true (vì Dog.prototype.__proto__ = Animal.prototype)
rex instanceof Object; // true

// instanceof kiểm tra prototype chain:
// rex.__proto__ === Dog.prototype? ✅
// Dog.prototype.__proto__ === Animal.prototype? ✅
// Animal.prototype.__proto__ === Object.prototype? ✅
// Object.prototype.__proto__ === null ✅ → true
```

**Trả lời:** `instanceof` kiểm tra prototype chain bằng cách so sánh `ClassName.prototype` với `object.__proto__` liên tục. Nếu tìm thấy match → `true`. Nếu không → `false`. Hoạt động với class-based và prototype-based code.

---

## 7. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  OOP FUNDAMENTALS IN JAVASCRIPT                               │
│                                                               │
│  PROTOTYPE CHAIN                                              │
│  obj → Class.prototype → Object.prototype → null             │
│  typeof class = 'function', typeof prototype = 'object'       │
│  class = syntactic sugar trên prototype                      │
│                                                               │
│  FOUR PILLARS                                                  │
│  ├── Encapsulation: closures, #private, Symbol keys         │
│  ├── Abstraction: ẩn complexity, chỉ expose interface       │
│  ├── Inheritance: prototype chain, mixins                   │
│  └── Polymorphism: override methods, duck typing            │
│                                                               │
│  INHERITANCE vs COMPOSITION                                   │
│  ├── Inheritance: is-a, shared behavior, tight coupling       │
│  ├── Composition: has-a, flexible, loose coupling           │
│  └── Prefer composition → inheritance khi is-a rõ ràng      │
│                                                               │
│  SOLID                                                         │
│  ├── S: Single responsibility                                │
│  ├── O: Open/closed → extend, not modify                     │
│  ├── L: Liskov → substitute without breaking                 │
│  ├── I: Interface segregation → small interfaces             │
│  └── D: Dependency inversion → depend on abstractions        │
│                                                               │
│  ⚠️ class = syntactic sugar, không tạo true class            │
│  ⚠️ super() phải gọi trước khi dùng this                    │
│  ⚠️ Arrow functions không có own `this`                    │
│  ⚠️ Symbol keys không truly private                        │
│  ⚠️ private #fields là truly private (ES2022)              │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Mối Liên Hệ

```
OOP Fundamentals
  ├── Prototype Chain (02) ← prototype là nền tảng OOP trong JS
  ├── Class Syntax (02)    ← class = syntactic sugar
  ├── Inheritance Patterns (02) ← các cách implement inheritance
  ├── Mixins (02)          ← composition bằng mixins
  ├── Design Patterns (03)  ← OOP patterns: Singleton, Factory, Observer
  └── Clean Architecture (06) ← SOLID trong architecture design
```

---

## Checklist

- [ ] Hiểu prototype chain và cách JS thực sự hoạt động
- [ ] Phân biệt được class syntax vs prototype inheritance
- [ ] Implement được encapsulation bằng closure và private fields
- [ ] Biết khi nào dùng inheritance vs composition
- [ ] Áp dụng được 5 nguyên tắc SOLID
- [ ] Trả lời được 6/8 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
