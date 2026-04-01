# Mixins — Khi Multiple Inheritance Cần Thiết

## Câu hỏi mở đầu

```javascript
// Bạn muốn class Dog có cả speak() và bark() từ 2 nguồn khác nhau
// JavaScript không có multiple inheritance
// → Mixin là giải pháp

const withSpeaker = {
  speak() { console.log(`${this.name} speaks`); }
};

const withBarker = {
  bark() { console.log(`${this.name} barks`); }
};

class Dog {
  constructor(name) { this.name = name; }
}

Object.assign(Dog.prototype, withSpeaker, withBarker);

const rex = new Dog('Rex');
rex.speak(); // Rex speaks
rex.bark();  // Rex barks
```

**Mixins = cách "mix" behavior từ nhiều object vào một class — không dùng inheritance.**

---

## 1. Mixin Cơ Bản

### Object.assign

```javascript
const flyMixin = {
  fly() { console.log(`${this.name} flies`); }
};

const swimMixin = {
  swim() { console.log(`${this.name} swims`); }
};

class Animal {
  constructor(name) { this.name = name; }
}

Object.assign(Animal.prototype, flyMixin, swimMixin);

const duck = new Animal('Duck');
duck.fly();  // Duck flies
duck.swim(); // Duck swims
```

### Function Mixin (Factory)

```javascript
const withSpeaker = (Base) =>
  class extends Base {
    speak() {
      console.log(`${this.name} speaks`);
    }
  };

const withFlyer = (Base) =>
  class extends Base {
    fly() {
      console.log(`${this.name} flies`);
    }
  };

class Animal {
  constructor(name) { this.name = name; }
}

class Bird extends withFlyer(withSpeaker(Animal)) {
  constructor(name) {
    super(name);
  }
}

const bird = new Bird('Tweety');
bird.speak(); // Tweety speaks
bird.fly();   // Tweety flies
```

---

## 2. Mixin Thực Tế

### Logger Mixin

```javascript
const withLogger = (Base) =>
  class extends Base {
    log(level, message) {
      console.log(`[${level.toUpperCase()}] ${message}`);
    }

    info(message) { this.log('info', message); }
    error(message) { this.log('error', message); }
    warn(message) { this.log('warn', message); }
  };

class Service extends withLogger(Object) {
  fetchData(url) {
    this.info(`Fetching ${url}`);
    // fetch logic
    this.info('Fetch complete');
  }
}

const svc = new Service();
svc.info('Starting...'); // [INFO] Starting...
```

### Serializable Mixin

```javascript
const withSerializable = (Base) =>
  class extends Base {
    toJSON() {
      const obj = {};
      for (const key of Object.keys(this)) {
        const val = this[key];
        if (typeof val !== 'function' && typeof val !== 'object') {
          obj[key] = val;
        }
      }
      return obj;
    }

    static fromJSON(data) {
      const obj = new this();
      Object.assign(obj, data);
      return obj;
    }
  };

class User extends withSerializable(Object) {
  constructor(name, email) {
    super();
    this.name = name;
    this.email = email;
  }
}

const user = new User('Alice', 'alice@example.com');
const json = user.toJSON();
console.log(JSON.stringify(json)); // {"name":"Alice","email":"alice@example.com"}
```

---

## 3. Mixin vs extends — So Sánh

### extends: IS-A relationship

```javascript
class Animal {}
class Dog extends Animal {} // Dog IS-A Animal
```

### Mixin: HAS-A behavior

```javascript
class Animal {}
const withBarker = (Base) => class extends Base {};
class Dog extends withBarker(Animal) {} // Dog HAS bark behavior
```

| | extends | Mixin |
|--|--------|-------|
| Kiểu | IS-A | HAS-A / CAN-DO |
| Số lượng | 1 class cha | Nhiều behaviors |
| Khả năng thay đổi | Khó thay đổi lúc runtime | Có thể thêm/bớt lúc runtime |
| Type checking | instanceof hoạt động | instanceof không phản ánh mixin |

---

## 4. Runtime Mixin — Thêm Behavior Sau

### Thêm behavior lúc runtime

```javascript
class Animal {
  constructor(name) { this.name = name; }
}

const withGrowl = {
  growl() { console.log(`${this.name} growls`); }
};

// Thêm sau khi class đã định nghĩa
Object.assign(Animal.prototype, withGrowl);

const dog = new Animal('Dog');
dog.growl(); // Dog growls
```

### Conditional Mixin

```javascript
function createAnimal(name, abilities) {
  class Animal {
    constructor(n) { this.name = n; }
  }

  const mixins = { fly: { fly() { console.log(`${this.name} flies`); } } };
  const toApply = abilities.filter(a => mixins[a]).map(a => mixins[a]);

  if (toApply.length) {
    Object.assign(Animal.prototype, ...toApply);
  }

  return new Animal(name);
}

const bird = createAnimal('Bird', ['fly']);
bird.fly();   // Bird flies

const dog = createAnimal('Dog', ['fly']);
dog.fly;      // undefined — không có fly
```

---

## 5. Các Traps

### Trap 1: Collision — method trùng tên

```javascript
const withA = {
  greet() { return 'Hello from A'; }
};

const withB = {
  greet() { return 'Hello from B'; }
};

class Animal {}
Object.assign(Animal.prototype, withA, withB);

const a = new Animal();
console.log(a.greet()); // 'Hello from B' — withB ghi đè withA
```

**Thứ tự trong Object.assign quyết định — sau ghi đè trước.**

### Trap 2: Constructor không nhận arguments

```javascript
const withAge = (Base) =>
  class extends Base {
    constructor(...args) {
      super(...args);
      this.age = 0;
    }
  };

// Nếu parent constructor không nhận đúng args
class Animal {
  constructor(name) { this.name = name; }
}

class Dog extends withAge(Animal) {
  constructor(name, breed) {
    super(name); // truyền đúng arguments
    this.breed = breed;
  }
}
```

### Trap 3: this trong mixin

```javascript
const withCounter = (Base) =>
  class extends Base {
    constructor(...args) {
      super(...args);
      this._count = 0;
    }

    increment() {
      this._count++;
    }
  };

// this phải tồn tại khi mixin được gọi
// super() phải chạy trước khi dùng this trong mixin
```

---

## 6. Câu Hỏi Phỏng Vấn

### Câu 1: Mixin ghi đè

```javascript
const m1 = { x: 1 };
const m2 = { x: 2 };

class A {}
Object.assign(A.prototype, m1, m2);

console.log(new A().x); // ?
```

**Trả lời:** `2` — m2 ghi đè m1

---

### Câu 2: Mixin với class

```javascript
const withLog = {
  log() { console.log('log called'); }
};

class B {}
B.prototype.log = function() { console.log('original log'); };

Object.assign(B.prototype, withLog);

console.log(new B().log()); // ?
```

**Trả lời:** `'log called'` — Object.assign ghi đè

---

### Câu 3: Composition vs Mixin

```javascript
// Mixin
class Dog extends withBark(Animal) {}

// Composition
const dog = { ...animal, bark() {} };
```

**Khác nhau:** Mixin dùng prototype chain, composition dùng object assignment.

---

## 7. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  MIXIN                                                  │
│                                                         │
│  Cách thêm behavior từ nhiều nguồn (không extends)     │
│                                                         │
│  Object.assign(target.prototype, mixin1, mixin2)        │
│  Function mixin: (Base) => class extends Base {}       │
│                                                         │
│  Thứ tự: sau ghi đè trước                            │
│  Runtime: thêm được sau khi class định nghĩa          │
│  Trap: collision — method trùng tên                    │
└─────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Implement được mixin bằng Object.assign
- [ ] Implement được mixin bằng function factory
- [ ] Biết trap: collision ghi đè method
- [ ] Hiểu khi nào dùng mixin thay vì extends

---

*Last updated: 2026-03-31*
