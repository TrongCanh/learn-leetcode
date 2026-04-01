# ES6 Class Syntax — Syntax Sugar Hay Thật Sự Khác?

## Câu hỏi mở đầu

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    console.log(`${this.name} makes a sound`);
  }
}

const cat = new Animal('Whiskers');
console.log(typeof Animal); // ?
console.log(Animal.prototype); // ?
console.log(cat.speak === Animal.prototype.speak); // ?
```

Kết quả: `Animal` là `function`, `Animal.prototype` tồn tại, và `cat.speak === Animal.prototype.speak` là `true`.

**Vì class trong JavaScript = syntax sugar trên prototype.** Không có gì thật sự mới — chỉ là cách viết gọn hơn.

---

## 1. Class Declaration vs Expression

### Declaration

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    console.log(`${this.name} speaks`);
  }
}
```

### Expression

```javascript
const Animal = class {
  constructor(name) {
    this.name = name;
  }
};

// Có tên (named class expression)
const Animal2 = class AnimalNamed {
  constructor(name) {
    this.name = name;
  }
};
```

### Hoisting

```javascript
// ❌ ReferenceError — class không hoist như function
const cat = new Animal('Whiskers');
class Animal { constructor(name) { this.name = name; } }

// ✅ Function hoisting
const dog = new Dog('Buddy');
function Dog(name) { this.name = name; }
```

**Class không hoist — phải khai báo trước khi dùng.**

---

## 2. Constructor

### Cơ bản

```javascript
class Animal {
  constructor(name, sound) {
    this.name = name;
    this.sound = sound;
  }

  speak() {
    console.log(`${this.name} says ${this.sound}!`);
  }
}

const dog = new Animal('Buddy', 'Woof');
dog.speak(); // 'Buddy says Woof!'
```

### Constructor return

```javascript
// Constructor không nên return primitive
class Animal {
  constructor(name) {
    this.name = name;
    return 'ignored'; // bị ignore vì return primitive
  }
}

// Nếu return object — nó ghi đè instance
class Animal2 {
  constructor(name) {
    this.name = name;
    return { name: 'OVERRIDE' }; // override instance
  }
}

const a = new Animal2('Buddy');
console.log(a.name); // 'OVERRIDE'
```

---

## 3. Methods

### Instance methods

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    return `${this.name} makes a sound`;
  }
}

// Methods được đặt trên Animal.prototype
Animal.prototype.speak === new Animal().speak; // true
```

### Static methods

```javascript
class Animal {
  static createWithDefaults(name) {
    return new Animal(name, 'generic sound');
  }

  static count = 0; // ES2022 class field

  constructor(name, sound) {
    this.name = name;
    this.sound = sound;
    Animal.count++;
  }
}

const a = Animal.createWithDefaults('Cat');
console.log(a.sound); // 'generic sound'
console.log(Animal.count); // 1

// Static methods thuộc về class, không phải instance
// Gọi: Animal.createWithDefaults()
```

### Getters và Setters

```javascript
class Temperature {
  constructor(celsius) {
    this._celsius = celsius;
  }

  get fahrenheit() {
    return this._celsius * 9/5 + 32;
  }

  set fahrenheit(value) {
    this._celsius = (value - 32) * 5/9;
  }
}

const t = new Temperature(0);
console.log(t.fahrenheit); // 32
t.fahrenheit = 100;
console.log(t._celsius); // 37.78
```

---

## 4. Class Fields (ES2022)

### Public fields

```javascript
class Animal {
  name = 'Unknown';     // public field
  count = 0;           // field với giá trị mặc định

  constructor(name) {
    this.name = name;  // override field
    this.count++;
  }
}

const a = new Animal('Buddy');
console.log(a.name); // 'Buddy'
console.log(a.count); // 1
```

### Private fields

```javascript
class BankAccount {
  // Private field — không truy cập được từ bên ngoài
  #balance = 0;
  #transactionHistory = [];

  constructor(initialBalance) {
    this.#balance = initialBalance;
  }

  deposit(amount) {
    if (amount <= 0) throw new Error('Invalid amount');
    this.#balance += amount;
    this.#transactionHistory.push({ type: 'deposit', amount });
  }

  withdraw(amount) {
    if (amount > this.#balance) throw new Error('Insufficient funds');
    this.#balance -= amount;
    this.#transactionHistory.push({ type: 'withdraw', amount });
  }

  getBalance() {
    return this.#balance;
  }
}

const account = new BankAccount(1000);
account.deposit(500);
console.log(account.getBalance()); // 1500
console.log(account.#balance);   // SyntaxError — private!
```

**Private field `#name` ≠ public field `name` — đây là 2 fields khác nhau.**

---

## 5. Extends — Kế Thừa

### Cơ bản

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    console.log(`${this.name} makes a sound`);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name); // gọi Animal constructor
    this.breed = breed;
  }

  speak() {
    console.log(`${this.name} barks`);
  }
}

const rex = new Dog('Rex', 'German Shepherd');
rex.speak(); // 'Rex barks'
console.log(rex instanceof Dog);     // true
console.log(rex instanceof Animal);  // true
```

### super — Phải Gọi Trước Khi Dùng `this`

```javascript
class Dog extends Animal {
  constructor(name, breed) {
    // ❌ ReferenceError nếu gọi this trước super
    this.tail = 'wagging';

    // ✅ super phải gọi trước
    super(name);
    this.breed = breed;
  }
}
```

### super — Gọi Parent Methods

```javascript
class Dog extends Animal {
  speak() {
    const parentSound = super.speak(); // gọi parent version
    console.log(parentSound);
    console.log(`${this.name} barks loudly`);
  }
}

const rex = new Dog('Rex');
rex.speak();
// 'Rex makes a sound'
// 'Rex barks loudly'
```

---

## 6. So Sánh Class vs Prototype

### Tương đương

```javascript
// CLASS SYNTAX
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() { console.log(`${this.name} speaks`); }
}

// PROTOTYPE (tương đương)
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function() {
  console.log(`${this.name} speaks`);
};
```

### Bảng so sánh

| Tính năng | Class | Prototype |
|------------|-------|-----------|
| Hoisting | ❌ Không hoist | ✅ Function hoist |
| `this` binding | ✅ Tự động | ✅ Tự động |
| Private fields | ✅ `#field` | ❌ Không hỗ trợ |
| Static fields | ✅ `static field` | ❌ Phải gắn sau |
| Method definitions | Trong class body | Phải gắn prototype sau |
| `extends` | `class A extends B` | `A.prototype = Object.create(B.prototype)` |
| `super` | `super.method()` | `B.prototype.method.call(this)` |

---

## 7. Điều Class Không Có

### Class không phải object

```javascript
class Animal {}
console.log(Animal.prototype); // ✅ prototype tồn tại
console.log(Animal.__proto__);  // Function.prototype

// Nhưng Animal không phải object — là function
Animal.someProperty = 'value'; // ⚠️ không phải instance method
```

### Class không tự động có private

```javascript
// Trước ES2022 — không có private
class BankAccount {
  constructor(balance) {
    this.balance = balance; // public!
  }
}

// Phải dùng convention (underscore)
class BankAccount2 {
  constructor(balance) {
    this._balance = balance; // underscore = convention "đừng đụng vào"
  }
}

// Hoặc dùng closure (module pattern)
class BankAccount3 {
  constructor(balance) {
    const _balance = balance; // closure
    this.getBalance = () => _balance;
  }
}
```

---

## 8. Các Traps

### Trap 1: Class không hoist

```javascript
// ❌ ReferenceError
const dog = new Dog('Buddy');
class Dog {}

// ✅ Đúng
class Cat {}
const cat = new Cat();
```

### Trap 2: Class body = strict mode

```javascript
class Test {
  method() {
    delete Object.prototype; // TypeError: Cannot delete property
  }
}
```

### Trap 3: Method không phải property

```javascript
class Animal {
  speak() { console.log('sound'); }
}

const dog = new Animal();
const speakRef = dog.speak;
speakRef(); // undefined — this bị mất như function thường

// Phải bind hoặc dùng arrow field
class Animal2 {
  speak = () => { console.log('sound'); }
}
```

### Trap 4: Static methods không kế thừa

```javascript
class Animal {
  static create(name) { return new Animal(name); }
}

class Dog extends Animal {}

console.log(Dog.create); // undefined — static không kế thừa tự động
// Phải khai báo lại
Dog.create = function(name) { return new Dog(name); };
```

---

## 9. Câu Hỏi Phỏng Vấn

### Câu 1: Class hay function?

```javascript
console.log(typeof class {});       // ①
console.log(typeof function() {});  // ②
console.log(class Animal {} instanceof Function); // ③
```

**Trả lời:** ① `'function'`, ② `'function'`, ③ `true`

Class là function — `typeof` nó là `'function'`.

---

### Câu 2: prototype vs __proto__

```javascript
class Animal {
  constructor(name) { this.name = name; }
  speak() { return 'sound'; }
}

const cat = new Animal('Whiskers');
console.log(cat.__proto__ === Animal.prototype); // ①
console.log(Animal.prototype.__proto__ === Object.prototype); // ②
```

**Trả lời:** ① `true`, ② `true`

---

### Câu 3: Private field vs public field

```javascript
class Counter {
  #count = 0;
  count = 0;
}

const c = new Counter();
c.#count++; // ?
c.count++;
console.log(c.#count, c.count); // ?
```

**Trả lời:** SyntaxError cho `c.#count++` — private không truy cập từ bên ngoài

---

### Câu 4: super() gọi mấy lần?

```javascript
class A { constructor() { console.log('A'); } }
class B extends A { constructor() { console.log('B'); super(); console.log('after super'); } }

new B();
```

**Trả lời:** `'B'`, `'A'`, `'after super'`

---

### Câu 5: Static kế thừa

```javascript
class Parent {
  static staticMethod() { return 'parent'; }
}

class Child extends Parent {}

console.log(Child.staticMethod()); // ?
```

**Trả lời:** `'parent'` — static methods KẾ THỪA qua prototype chain

---

### Câu 6: this trong arrow field

```javascript
class Counter {
  count = 0;
  increment = () => { this.count++; };
}

const c = new Counter();
const inc = c.increment;
inc();
console.log(c.count); // ?
```

**Trả lời:** `1`

Arrow field `increment = () => {}` được bind khi instance được tạo → `this` luôn = instance.

---

### Câu 7: Getters trong class

```javascript
class Circle {
  #radius = 0;
  constructor(r) { this.#radius = r; }

  get diameter() { return this.#radius * 2; }
}

const c = new Circle(5);
console.log(c.diameter); // ?
c.diameter = 20; // ?
```

**Trả lời:** `10`, assignment bị ignore (setter không được định nghĩa) hoặc TypeError tùy engine.

---

## 10. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  CLASS = SYNTAX SUGAR TRÊN PROTOTYPE                   │
│                                                         │
│  class Animal                                          │
│    → Animal = function constructor                    │
│    → Animal.prototype.speak = function() {}           │
│    → Animal.prototype.constructor = Animal            │
│                                                         │
│  class Dog extends Animal                             │
│    → Dog.prototype = Object.create(Animal.prototype)│
│    → Dog.prototype.constructor = Dog                  │
│                                                         │
│  KEY DIFFERENCES:                                     │
│    • Class không hoist (khác function)                │
│    • Class body = strict mode                        │
│    • Private fields: #field (ES2022)                 │
│    • super() phải gọi trước this                   │
│    • Static: static keyword                           │
│    • Arrow field: arrow = bound at creation          │
└─────────────────────────────────────────────────────────┘
```

---

## 11. Mối Liên Hệ

```
Class Syntax
  ├── Prototype Chain (001) ← class xây trên prototype
  ├── Inheritance (003) ← extends = kết nối prototype chain
  ├── Memory (05) ← instance fields nằm trên heap
  └── Closure (02) ← private fields = closure pattern
```

---

## Checklist

- [ ] Hiểu class = syntax sugar trên prototype
- [ ] Biết class không hoist như function
- [ ] Dùng được extends, super, static, private fields
- [ ] Trả lời được các câu hỏi phỏng vấn

---

*Last updated: 2026-03-31*
