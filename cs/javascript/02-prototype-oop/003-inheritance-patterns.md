# Inheritance Patterns — Khi Nào Extends, Khi Nào Không

## Câu hỏi mở đầu

```javascript
class Animal {
  constructor(name) { this.name = name; }
  speak() { console.log(`${this.name} makes a sound`); }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }

  speak() {
    super.speak();
    console.log(`${this.name} barks`);
  }
}

const rex = new Dog('Rex', 'Shepherd');
rex.speak();
```

Kết quả:
```
Rex makes a sound
Rex barks
```

**Tại sao `super.speak()` gọi được method của Animal?**

Vì `Dog.prototype.__proto__ === Animal.prototype`. Prototype chain. Mọi thứ trong JavaScript đều xoay quanh prototype.

---

## 1. Prototype Inheritance — Cách Xây Dựng Kế Thừa

### Bước 1: Kết nối prototype

```javascript
function Animal(name) {
  this.name = name;
}

Animal.prototype.speak = function() {
  console.log(`${this.name} makes a sound`);
};

function Dog(name, breed) {
  Animal.call(this, name); // gọi parent constructor
  this.breed = breed;
}

// Kết nối prototype chain
Dog.prototype = Object.create(Animal.prototype);

// Sửa constructor reference
Dog.prototype.constructor = Dog;

// Thêm method riêng
Dog.prototype.bark = function() {
  console.log(`${this.name} barks!`);
};

const rex = new Dog('Rex', 'Shepherd');
rex.speak(); // kế thừa từ Animal
rex.bark();  // riêng của Dog
```

### Bước 2: Kiểm tra chain

```javascript
rex instanceof Dog;    // true
rex instanceof Animal; // true — vì chain
rex instanceof Object; // true

// prototype chain:
rex → Dog.prototype → Animal.prototype → Object.prototype → null
```

---

## 2. Class extends — ES6+

### Đơn kế thừa

```javascript
class Animal {
  constructor(name) { this.name = name; }
  speak() { console.log(`${this.name} speaks`); }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }

  speak() {
    super.speak();
    console.log(`${this.name} barks`);
  }
}
```

### Method overriding

```javascript
class Cat extends Animal {
  speak() {
    console.log(`${this.name} meows`);
  }
}

const cat = new Cat('Whiskers');
cat.speak(); // 'Whiskers meows'
```

---

## 3. Composition Thay Vì Inheritance

### Vấn đề với Inheritance

```javascript
// Inheritance sâu → diamond problem
class Living {}
class Animal extends Living {}
class Bird extends Animal {}
class Parrot extends Bird {}
// Mỗi layer thêm phức tạp
```

### Composition — mạnh hơn

```javascript
// Thay vì "Dog IS-A Animal"
// → "Dog HAS-A Animal behavior"

const canSpeak = {
  speak() { console.log(`${this.name} speaks`); }
};

const canBark = {
  bark() { console.log(`${this.name} barks`); }
};

const canFly = {
  fly() { console.log(`${this.name} flies`); }
};

function createDog(name) {
  const dog = { name };
  return Object.assign(dog, canSpeak, canBark);
}

function createFlyingDog(name) {
  const dog = createDog(name);
  return Object.assign(dog, canFly);
}

const rex = createDog('Rex');
rex.speak();
rex.bark();
```

### Mixin pattern

```javascript
const withSpeaker = (Base) => class extends Base {
  speak() { console.log(`${this.name} speaks`); }
};

const withBarker = (Base) => class extends Base {
  bark() { console.log(`${this.name} barks`); }
};

class Dog extends withBarker(withSpeaker(Animal)) {
  constructor(name) {
    super();
    this.name = name;
  }
}

const rex = new Dog('Rex');
rex.speak();
rex.bark();
```

---

## 4. Multiple Inheritance — Giả Lập Bằng Mixins

### Object.assign với nhiều sources

```javascript
const sayHi = {
  sayHi() { console.log(`${this.name} says hi`); }
};

const sayBye = {
  sayBye() { console.log(`${this.name} says bye`); }
};

class Greeter {
  constructor(name) { this.name = name; }
}

Object.assign(Greeter.prototype, sayHi, sayBye);

const g = new Greeter('Alice');
g.sayHi();  // 'Alice says hi'
g.sayBye(); // 'Alice says bye'
```

### Mixin factory

```javascript
function mixin(...mixins) {
  return function(Base) {
    return mixins.reduce((Base, mixin) => mixin(Base), Base);
  };
}

const withLogging = (Base) => class extends Base {
  log(msg) { console.log(`[LOG] ${msg}`); }
};

const withTiming = (Base) => class extends Base {
  time(label) { console.time(label); }
};

class Service extends mixin(withLogging, withTiming)(Object) {
  doSomething() {
    this.log('Starting...');
    this.time('operation');
    // do work
    console.timeEnd('operation');
  }
}
```

---

## 5. Kế Thừa vs Composition — Khi Nào Dùng Gì?

### Dùng Inheritance khi:

```
✓ Có quan hệ IS-A rõ ràng (Dog IS-A Animal)
✓ Chia sẻ behavior cố định, không thay đổi
✓ Có hierarchy ổn định, ít thay đổi
✓ Cần instanceof check
```

### Dùng Composition khi:

```
✓ Quan hệ HAS-A / USES-A
✓ Cần linh hoạt thay đổi behavior lúc runtime
✓ Tránh deep hierarchy
✓ Testability tốt hơn (mock dễ hơn)
✓ Tránh fragile base class problem
```

### Ví dụ thực tế

```javascript
// ❌ Inheritance quá sâu — khó maintain
class Entity {}
class Document extends Entity {}
class PrintableDocument extends Document {}
class SearchableDocument extends PrintableDocument {}

// ✅ Composition — linh hoạt
class Document {
  constructor() {
    this.behaviors = [];
  }

  addBehavior(behavior) {
    this.behaviors.push(behavior);
    behavior.attach(this);
  }
}

const searchable = new Document();
searchable.addBehavior(new SearchBehavior());
searchable.addBehavior(new PrintBehavior());
```

---

## 6. Các Traps

### Trap 1: Quên gọi super()

```javascript
class Dog extends Animal {
  constructor(name, breed) {
    // ❌ ReferenceError: Must call super constructor
    this.breed = breed;
  }
}
```

```javascript
// ✅
class Dog extends Animal {
  constructor(name, breed) {
    super(name); // gọi trước
    this.breed = breed;
  }
}
```

### Trap 2: Ghi đè prototype sau extends

```javascript
class Parent {
  speak() { return 'parent'; }
}

class Child extends Parent {
  speak() { return 'child'; }
}

// Ghi đè sau — ảnh hưởng tất cả
Child.prototype.speak = function() { return 'modified'; };
```

### Trap 3: instanceof không hoạt động với mixin

```javascript
const withFly = (Base) => class extends Base {};
class Bird extends withFly(Animal) {}

const bird = new Bird();
bird instanceof Animal; // true ✅
bird instanceof Bird;  // true ✅
```

### Trap 4: Shadowing vs Overriding

```javascript
class Parent {
  greet() { return 'Hello'; }
}

class Child extends Parent {
  greet() { return 'Hi'; }
}

// Gọi parent version?
const c = new Child();
Parent.prototype.greet.call(c); // 'Hello' ✅
```

---

## 7. Câu Hỏi Phỏng Vấn

### Câu 1: Prototype chain sau khi extends

```javascript
class Animal {}
class Dog extends Animal {}

console.log(Dog.prototype.__proto__ === Animal.prototype); // ①
console.log(Dog.__proto__ === Animal); // ②
```

**Trả lời:** ① `true`, ② `true`

---

### Câu 2: Composition vs Inheritance

```javascript
// Nên dùng cái nào?
class Vehicle {}
class FlyingVehicle extends Vehicle {}
class FlyingCar extends FlyingVehicle {}
// 3 levels — có quá sâu không?
```

**Trả lời:** 3 levels có thể được, nhưng nếu FlyingVehicle và FlyingCar không chia sẻ nhiều behavior → nên dùng composition.

---

### Câu 3: super() và this

```javascript
class A {
  constructor() { this.x = 1; }
}

class B extends A {
  constructor() {
    console.log(this.x); // ①
    super();
    console.log(this.x); // ②
  }
}

new B();
```

**Trả lời:** ① `undefined` (this tồn tại nhưng x chưa được set), ② `1`

---

### Câu 4: instanceof sau mixin

```javascript
function withFly(Base) {
  return class extends Base {
    fly() { return 'flying'; }
  };
}

class Bird extends withFly(Object) {}

const bird = new Bird();
console.log(bird instanceof Bird);  // ①
console.log(bird instanceof Object); // ②
```

**Trả lời:** ① `true`, ② `true`

---

### Câu 5: Method resolution order

```javascript
class A {
  method() { return 'A'; }
}

class B extends A {}
class C extends A {}
class D extends B {}

const d = new D();
console.log(d.method()); // ?
```

**Trả lời:** `'A'` — D → B → A → Object

---

## 8. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  INHERITANCE vs COMPOSITION                             │
│                                                         │
│  Inheritance:                                          │
│    IS-A relationship                                  │
│    prototype chain: Dog → Animal → Object            │
│    Dùng: extends, super(), instanceof               │
│                                                         │
│  Composition:                                         │
│    HAS-A / USES-A relationship                       │
│    Object.assign, mixins, factory functions          │
│    Dùng: khi cần linh hoạt, testable               │
│                                                         │
│  RULES:                                              │
│    ✓ Ưu tiên composition > inheritance               │
│    ✓ Inheritance khi IS-A rõ ràng, hierarchy ổn định│
│    ✓ Tránh deep inheritance (> 2-3 levels)          │
│    ✓ Dùng mixins cho multiple inheritance giả lập  │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Mối Liên Hệ

```
Inheritance
  ├── Prototype Chain (001) ← kế thừa xây trên prototype
  ├── Class Syntax (002) ← extends = kết nối prototype
  ├── Mixins ← composition pattern
  └── Clean Architecture ← dependency inversion
```

---

## Checklist

- [ ] Implement được kế thừa qua prototype và class
- [ ] Biết khi nào dùng composition thay vì extends
- [ ] Hiểu mixin pattern
- [ ] Trả lời được các câu hỏi phỏng vấn

---

*Last updated: 2026-03-31*
