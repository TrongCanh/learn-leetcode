# Prototype Chain — Cách JavaScript Thực Sự Xây Dựng OOP

## Câu hỏi mở đầu

```javascript
const arr = [1, 2, 3];

// Ai định nghĩa .push(), .map(), .filter()?
console.log(arr.push);     // function
console.log(arr.hasOwnProperty('push')); // false

// arr.push() đến từ đâu?
// prototype chain
```

`arr` là array. Nhưng **ai cho `arr` biết `.push()` là gì?**

Không phải bạn viết. Không phải array tự có. Mà là **prototype chain** — cơ chế ngầm của JavaScript.

---

## 1. Prototype Là Gì?

### Định nghĩa

> **Prototype** = một object mà mọi object trong JavaScript đều có property ẩn `[[Prototype]]`. Khi bạn truy cập property, JS tìm trong object trước, không thấy → lên prototype chain tìm tiếp.

### Truy cập prototype

```javascript
const obj = { name: 'Alice' };

// Cách cũ (legacy, không nên dùng)
console.log(obj.__proto__); // {constructor: ƒ, __defineGetter__: ...}

// Cách chuẩn (ES5+)
console.log(Object.getPrototypeOf(obj)); // Object.prototype

// prototype chain
obj.__proto__ === Object.prototype; // true
```

### Prototype chain cho array

```javascript
const arr = [1, 2, 3];

arr.__proto__ === Array.prototype;        // true — direct prototype
arr.__proto__.__proto__ === Object.prototype; // true — chain tiếp
arr.__proto__.__proto__.__proto__ === null;  // true — null = end of chain

// Đây là chain:
arr → Array.prototype → Object.prototype → null
```

---

## 2. Property Lookup — Tìm Property Đi Qua Đâu?

### Cơ chế tìm kiếm

```javascript
const parent = { a: 1 };
const child = Object.create(parent);
child.b = 2;

console.log(child.a); // 1 — tìm thấy ở parent
console.log(child.b); // 2 — tìm thấy ở chính child
console.log(child.c); // undefined — không tìm thấy ở đâu trong chain
```

```
Truy cập child.a:
  1. Tìm trong child → không có
  2. Tìm trong child.__proto__ (parent) → có → trả về 1
```

### hasOwnProperty vs `in`

```javascript
const parent = { a: 1 };
const child = Object.create(parent);
child.b = 2;

console.log(child.hasOwnProperty('a')); // false — a không thuộc child
console.log(child.hasOwnProperty('b')); // true — b thuộc child

console.log('a' in child);  // true — có trong chain
console.log('b' in child);   // true — có trong chain
```

---

## 3. Prototype Chain Chi Tiết

### Array prototype chain

```javascript
const arr = [1, 2, 3];

// arr có những gì của riêng mình?
Object.getOwnPropertyNames(arr); // ['0', '1', '2', 'length']

// arr kế thừa từ đâu?
Object.getOwnPropertyNames(Array.prototype);
// push, pop, shift, unshift, map, filter, reduce,
// concat, slice, find, findIndex, includes, ...
// ...và cả constructor, toString, valueOf, ...

// Object.prototype có gì?
Object.getOwnPropertyNames(Object.prototype);
// constructor, toString, valueOf, hasOwnProperty,
// toLocaleString, propertyIsEnumerable, __defineGetter__, ...
```

### Function prototype chain

```javascript
function Person(name) {
  this.name = name;
}

const p = new Person('Alice');

// p.__proto__ === Person.prototype
p.__proto__.constructor === Person; // true

// Person là function → có prototype riêng
Person.prototype.constructor === Person; // true

// Chain:
p → Person.prototype → Object.prototype → null
```

---

## 4. Tạo Object Với Prototype

### Object.create()

```javascript
// Cách cổ điển tạo object với prototype tùy chỉnh
const animal = {
  speak() { console.log(`${this.name} makes a sound`); }
};

const dog = Object.create(animal);
dog.name = 'Buddy';
dog.speak(); // 'Buddy makes a sound'

// dog kế thừa từ animal
dog.__proto__ === animal; // true
animal.isPrototypeOf(dog); // true
```

### Constructor function

```javascript
function Animal(name) {
  this.name = name;
}

Animal.prototype.speak = function() {
  console.log(`${this.name} makes a sound`);
};

Animal.prototype.walk = function() {
  console.log(`${this.name} is walking`);
};

const cat = new Animal('Whiskers');
const fish = new Animal('Goldy');

cat.speak(); // 'Whiskers makes a sound'
fish.walk(); // 'Goldy is walking'
```

**Điểm quan trọng:** `cat` và `fish` **không có** `speak` và `walk` trong chính object. Chúng tìm thấy qua prototype chain.

---

## 5. `__proto__` vs `prototype` — Hai Thứ Khác Nhau

### `__proto__` (internal prototype)

```javascript
// __proto__ = internal prototype slot của object
// Dùng để ĐỌC/GHI prototype của object

const obj = {};
obj.__proto__ === Object.getPrototypeOf(obj); // true
```

### `prototype` (property trên function)

```javascript
// prototype = property CÓ SẴN trên function
// Chỉ tồn tại trên FUNCTION CONSTRUCTOR
// Dùng làm prototype CHO OBJECTS TẠO BỞI new

function Person(name) {
  this.name = name;
}

console.log(Person.prototype); // { constructor: Person, __proto__: Object.prototype }
console.log(Person.prototype === Object.getPrototypeOf(new Person())); // true
```

### So sánh

| | `__proto__` | `prototype` |
|--|-------------|-------------|
| Tồn tại trên | Mọi object | Chỉ function |
| Dùng làm gì | Đọc/ghi prototype của object | Làm prototype cho `new` objects |
| Truy cập chain | `obj.__proto__.__proto__` | `fn.prototype.__proto__` |
| Tên chuẩn | `Object.getPrototypeOf()` | Chỉ là property |

---

## 6. Sửa Đổi Prototype — Hậu Quả

### Thêm method vào prototype

```javascript
function Animal(name) {
  this.name = name;
}

const cat = new Animal('Whiskers');
const dog = new Animal('Buddy');

// Thêm sau — tất cả instances đều thấy ngay
Animal.prototype.greet = function() {
  console.log(`${this.name} says hi!`);
};

cat.greet(); // 'Whiskers says hi!' ✅ — cat thấy ngay
dog.greet(); // 'Buddy says hi!' ✅
```

### Thay đổi prototype = thay đổi tất cả instances

```javascript
// ⚠️ Thay đổi prototype ảnh hưởng TẤT CẢ objects
Animal.prototype.speak = function() {
  console.log(`${this.name} BARKS!`); // thay đổi speak cho TẤT CẢ
};

cat.speak(); // 'Whiskers BARKS!' — thay đổi
dog.speak(); // 'Buddy BARKS!' — thay đổi
```

### Caching trong prototype chain

```javascript
function Animal(name) {
  this.name = name;
}

Animal.prototype.speak = function() {
  return `${this.name} makes a sound`;
};

const cat = new Animal('Whiskers');
cat.speak === cat.__proto__.speak; // true — cùng function
cat.speak === Animal.prototype.speak; // true

// V8 optimization: Hidden Classes — objects cùng prototype
// được tối ưu cùng kiểu (inline caching)
```

---

## 7. Inheritance Qua Prototype

### Kế thừa đơn

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

// Kết nối prototype chain: Dog.prototype → Animal.prototype
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog; // sửa constructor

Dog.prototype.bark = function() {
  console.log(`${this.name} barks!`);
};

const rex = new Dog('Rex', 'German Shepherd');
rex.speak(); // 'Rex makes a sound' — kế thừa từ Animal
rex.bark();  // 'Rex barks!' — của Dog

// Chain:
rex → Dog.prototype → Animal.prototype → Object.prototype → null
```

### instanceof

```javascript
rex instanceof Dog;     // true
rex instanceof Animal;  // true
rex instanceof Object;  // true

// instanceof kiểm tra prototype chain
// Kiểm tra: Dog.prototype có trong chain của rex không?
Object.getPrototypeOf(rex) === Dog.prototype; // true
```

### isPrototypeOf

```javascript
Animal.prototype.isPrototypeOf(rex);   // true
Dog.prototype.isPrototypeOf(rex);      // true
Object.prototype.isPrototypeOf(rex);   // true

// Còn Object là prototype không?
Animal.prototype.isPrototypeOf(Dog.prototype); // true
```

---

## 8. Những Traps

### Trap 1: Shadowing — property trong instance ghi đè prototype

```javascript
function Animal() {}
Animal.prototype.name = 'Animal';

const dog = new Animal();
console.log(dog.name); // 'Animal' — tìm ở prototype

dog.name = 'Buddy'; // tạo property TRONG INSTANCE
console.log(dog.name); // 'Buddy' — instance shadow prototype

// Muốn sửa prototype?
delete dog.name; // xóa property instance
console.log(dog.name); // 'Animal' — quay lại prototype
```

### Trap 2: __proto__ trên Object.prototype

```javascript
Object.prototype.__proto__; // null — Object.prototype là đỉnh chain

// Không thể đi cao hơn
```

### Trap 3: prototype chain với for...in

```javascript
function Parent() { this.parentProp = true; }
function Child() { this.childProp = true; }
Child.prototype = new Parent();

const c = new Child();

for (const key in c) {
  console.log(key);
}
// parentProp, childProp — for...in đi qua CẢ chain
// Muốn chỉ instance: Object.keys(c)
```

### Trap 4: Object.create vs new

```javascript
// new: chạy constructor, prototype chain đúng
const a = new Function();
a instanceof Function; // true

// Object.create: KHÔNG chạy constructor
const b = Object.create(Function.prototype);
b instanceof Function; // true — cùng prototype

// Nhưng b không có [[Construct]] — không thể gọi new
```

---

## 9. Câu Hỏi Phỏng Vấn

### Câu 1: Prototype chain của array

```javascript
const arr = [1, 2, 3];

console.log(arr.__proto__ === Array.prototype);     // ①
console.log(arr.__proto__.__proto__ === Object.prototype); // ②
console.log(arr.__proto__.__proto__.__proto__);      // ③
```

**Trả lời:** ① `true`, ② `true`, ③ `null`

---

### Câu 2: Object.create vs new

```javascript
const parent = { a: 1 };
const child1 = Object.create(parent);
const child2 = new Object(parent);

console.log(child1.a); // ①
console.log(child2.a);  // ②
```

**Trả lời:** ① `1`, ② `1`

Cả hai đều kế thừa `a`, nhưng khác nhau:
- `Object.create(parent)` — tạo object với prototype = `parent`, **không** gọi constructor
- `new Object(parent)` — gọi Object constructor với argument → trả về `parent` luôn

---

### Câu 3: Kế thừa constructor

```javascript
function Animal(name) { this.name = name; }
Animal.prototype.speak = function() { return 'sound'; };

function Dog(name, breed) {
  Animal.call(this, name); // ①
  this.breed = breed;
}

Dog.prototype = Object.create(Animal.prototype);

const rex = new Dog('Rex', 'Shepherd');

console.log(rex.name); // ②
console.log(rex.breed); // ③
console.log(rex.speak()); // ④
```

**Trả lời:** ① phải gọi để set `this.name`, ② `'Rex'`, ③ `'Shepherd'`, ④ `'sound'`

---

### Câu 4: instanceof vs typeof

```javascript
console.log(typeof []);            // ①
console.log([] instanceof Array);    // ②
console.log([] instanceof Object);    // ③
```

**Trả lời:** ① `'object'`, ② `true`, ③ `true`

`typeof []` = `'object'` vì array là object. Dùng `Array.isArray([])` để phân biệt.

---

### Câu 5: Prototype và method

```javascript
function Animal() {}
Animal.prototype.greet = function() {
  return 'Hello';
};

const dog = new Animal();
console.log(dog.greet === Animal.prototype.greet); // ?
```

**Trả lời:** `true` — cùng function trong prototype

---

### Câu 6: Ghi đè prototype

```javascript
function Animal(name) { this.name = name; }
Animal.prototype.speak = function() { return 'sound'; };

function Dog(name) {
  Animal.call(this, name);
}
Dog.prototype = Object.create(Animal.prototype);

Dog.prototype.speak = function() { return 'bark'; }; // ghi đè

const rex = new Dog('Rex');
console.log(rex.speak()); // ?

Animal.prototype.speak.call(rex); // gọi parent version?
```

**Trả lời:** `'bark'` — instance tìm `speak` trong Dog.prototype trước

---

### Câu 7: __proto__ circular

```javascript
console.log(Object.prototype.__proto__); // ?
```

**Trả lời:** `null` — Object.prototype là đỉnh cao nhất của prototype chain

---

### Câu 8: Prototype và this

```javascript
function Animal(name) {
  this.name = name;
}

Animal.prototype.identify = function() {
  return `I am ${this.name}`;
};

const cat = new Animal('Whiskers');
const fn = cat.identify;
console.log(fn()); // ?
```

**Trả lời:** `'I am '` (hoặc `undefined`)

`fn()` gọi không có `this` → default binding → `this.name` = undefined → `'I am undefined'`

---

## 10. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  PROTOTYPE CHAIN                                         │
│                                                         │
│  Mỗi object có [[Prototype]] (truy cập qua __proto__)  │
│  Khi truy cập property:                                 │
│    1. Tìm trong object                               │
│    2. Không thấy → tìm trong prototype               │
│    3. Lặp cho đến null                              │
│                                                         │
│  Array chain:                                          │
│    arr → Array.prototype → Object.prototype → null   │
│                                                         │
│  new Constructor chain:                                │
│    instance → Constructor.prototype → Object.prototype │
│                                                         │
│  __proto__ = prototype slot (mọi object)             │
│  prototype = property trên FUNCTION (làm prototype   │
│  cho new objects)                                      │
│                                                         │
│  ⚠️ Thay đổi prototype → ảnh hưởng TẤT CẢ instances │
│  ⚠️ prototype chain cho phép kế thừa nhưng không    │
│    copy — modifications ảnh hưởng tất cả           │
└─────────────────────────────────────────────────────────┘
```

---

## 11. Mối Liên Hệ

```
Prototype Chain
  ├── Class Syntax (002) ← class = syntax sugar cho prototype
  ├── Inheritance (003) ← kế thừa xây trên prototype
  ├── Memory (05) ← objects trong prototype chain nằm trên heap
  ├── Data Types (005) ← reference type xây trên prototype
  └── Object Patterns (005) ← Object.freeze, descriptors
```

---

## Checklist

- [ ] Vẽ được prototype chain của array, object, function
- [ ] Phân biệt được `__proto__` và `prototype`
- [ ] Hiểu instanceof kiểm tra gì
- [ ] Implement được kế thừa qua prototype
- [ ] Trả lời được 8/8 câu hỏi phỏng vấn

---

*Last updated: 2026-03-31*
