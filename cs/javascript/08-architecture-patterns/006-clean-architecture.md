# Clean Architecture — Thiết Kế Hệ Thống Theo Nguyên Tắc

## Câu hỏi mở đầu

```javascript
// Tại sao code này KHÓ thay đổi?

// app.js — 2000 dòng
// ├── Database connection (mysql connect)
// ├── Express routes
// ├── HTML templates
// ├── Business logic
// ├── Email sending
// ├── File uploads
// ├── Authentication
// └── TODO comments everywhere!

// Muốn thay MySQL → PostgreSQL?
// → Sửa 47 chỗ trong 12 files!
// Muốn đổi từ Express → Fastify?
// → Sửa toàn bộ routes!
// Muốn test business logic?
// → Cần cả database + email server!
```

**Clean Architecture** giải quyết vấn đề này bằng cách chia code thành **layers** rõ ràng, mỗi layer chỉ phụ thuộc layer bên trong. Thay đổi database, framework, hay infrastructure không ảnh hưởng business logic. Đây là cách các hệ thống lớn (Uber, Netflix) tổ chức code.

---

## 1. Clean Architecture Layers

### Dependency Rule

```
┌──────────────────────────────────────────────────────────────┐
│  CLEAN ARCHITECTURE — CONCENTRIC CIRCLES                       │
│                                                               │
│      ┌──────────────────────────────────────────┐            │
│      │   ④ FRAMEWORKS & DRIVERS                │            │
│      │   (Express, React, MySQL, MongoDB)       │            │
│      │   External tools, UI, DB, Web clients    │            │
│      ├──────────────────────────────────────────┤            │
│      │   ③ INTERFACE ADAPTERS                   │            │
│      │   (Controllers, Gateways, Presenters)    │            │
│      │   Convert data between formats           │            │
│      ├──────────────────────────────────────────┤            │
│      │   ② APPLICATION BUSINESS RULES           │            │
│      │   (Use Cases, Application Services)       │            │
│      │   Application-specific business rules     │            │
│      ├──────────────────────────────────────────┤            │
│      │   ① ENTERPRISE BUSINESS RULES           │            │
│      │   (Entities, Value Objects)              │            │
│      │   Core business rules — MAXIMUM stability│            │
│      └──────────────────────────────────────────┘            │
│                                                               │
│  DEPENDENCY RULE:                                             │
│  ┌──────────────────────────────────────────────────┐        │
│  │ Dependency chỉ đi ONE WAY: OUTER → INNER         │        │
│  │ Inner layer KHÔNG BIẾT gì về outer layer         │        │
│  │ Outer layer IMPLEMENTS interfaces của inner       │        │
│  └──────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────┘
```

### Chi tiết từng layer

```javascript
// Layer 1: ENTITIES — Pure business objects
// Không có imports từ outer layers!
class User {
  constructor(id, email, role) {
    if (!email.includes('@')) throw new Error('Invalid email');
    this.id = id;
    this.email = email;
    this.role = role;
  }

  isAdmin() { return this.role === 'admin'; }
}

class Order {
  constructor(items, customer) {
    if (!items?.length) throw new Error('Empty order');
    this.items = items;
    this.customer = customer;
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  }
}

// Layer 2: USE CASES — Application business rules
// Phụ thuộc vào Entities, KHÔNG phụ thuộc vào database, HTTP, etc.
class CreateOrderUseCase {
  constructor(orderRepository, emailService, paymentGateway) {
    this.orderRepository = orderRepository; // Interface!
    this.emailService = emailService;        // Interface!
    this.paymentGateway = paymentGateway;    // Interface!
  }

  async execute(input) {
    // 1. Validate
    const order = new Order(input.items, input.customer);

    // 2. Payment
    const payment = await this.paymentGateway.charge(order.getTotal());
    if (!payment.success) throw new Error('Payment failed');

    // 3. Save
    await this.orderRepository.save(order);

    // 4. Notify
    await this.emailService.send(order.customer.email, 'Order confirmed');

    return { orderId: order.id, paymentId: payment.id };
  }
}

// Layer 3: INTERFACE ADAPTERS — Implement interfaces
// Implement Repository interface
class MySQLOrderRepository {
  async save(order) {
    // Implement với MySQL
    const db = await mysql.connect();
    await db.query('INSERT INTO orders ...');
  }

  async findById(id) {
    // Implement với MySQL
  }
}

class StripePaymentGateway {
  async charge(amount) {
    // Implement với Stripe API
  }
}

// Layer 4: FRAMEWORKS & DRIVERS — Entry points
// Express routes, React components, etc.
class OrderController {
  constructor(createOrderUseCase) {
    this.createOrderUseCase = createOrderUseCase;
  }

  async handle(req, res) {
    try {
      const result = await this.createOrderUseCase.execute(req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

// Express setup
const orderRepo = new MySQLOrderRepository();
const emailSvc = new SendGridEmailService();
const paymentGateway = new StripePaymentGateway();
const createOrder = new CreateOrderUseCase(orderRepo, emailSvc, paymentGateway);
const controller = new OrderController(createOrder);

app.post('/orders', controller.handle.bind(controller));
```

---

## 2. Entities — Trái Tim Của Hệ Thống

### Entities vs Data Models

```javascript
// ❌ Data Model — chỉ là data container
class UserModel {
  id: number;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ Entity — có identity và business logic
class User {
  #id;
  #email;
  #role;
  #createdAt;

  constructor(id, email, role) {
    this.#validateEmail(email);
    this.#id = id;
    this.#email = email;
    this.#role = role;
    this.#createdAt = new Date();
  }

  #validateEmail(email) {
    if (!email.includes('@')) {
      throw new Error('Invalid email format');
    }
  }

  isAdmin() { return this.#role === 'admin'; }
  isGuest() { return this.#role === 'guest'; }
  canEdit(article) {
    return this.isAdmin() || article.authorId === this.#id;
  }
}
```

### Value Objects — Immutable Values

```javascript
// Value Object — không có identity, chỉ có giá trị
// So sánh bằng VALUE, không bằng reference

class Money {
  constructor(amount, currency) {
    if (amount < 0) throw new Error('Negative money');
    if (!currency) throw new Error('Currency required');

    // Immutable
    this.amount = amount;
    this.currency = currency;
  }

  add(other) {
    if (other.currency !== this.currency) {
      throw new Error('Cannot add different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  equals(other) {
    return this.amount === other.amount && this.currency === other.currency;
  }

  toString() { return `${this.amount} ${this.currency}`; }
}

const price = new Money(100, 'USD');
const tax = new Money(10, 'USD');
const total = price.add(tax); // 110 USD

console.log(total.equals(new Money(110, 'USD'))); // true
console.log(price.equals(new Money(100, 'USD'))); // true (price không đổi!)
```

---

## 3. Use Cases — Application Business Rules

### Use Case structure

```javascript
// Standard use case structure:
class UseCase {
  // Input: structured object hoặc primitive
  // Output: structured object
  // Dependencies: injected via constructor (interfaces)

  // execute() là duy nhất public method
  async execute(input) {
    // 1. Validate input
    // 2. Call entities for business rules
    // 3. Interact with repositories (interfaces)
    // 4. Return structured output
  }
}

// Example: GetUserUseCase
class GetUserUseCase {
  constructor(userRepository, logger) {
    this.userRepository = userRepository; // Interface!
    this.logger = logger;
  }

  async execute(input) {
    // Validate
    if (!input.id) {
      throw new ValidationError('User ID required');
    }

    // Business logic
    const user = await this.userRepository.findById(input.id);
    if (!user) {
      throw new NotFoundError(`User ${input.id} not found`);
    }

    // Logging
    this.logger.info(`User ${input.id} retrieved`);

    // Return DTO
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      // KHÔNG return password!
    };
  }
}
```

### Transaction Script vs Domain Model

```javascript
// ❌ Transaction Script — tất cả logic trong 1 function
async function processOrder(orderData) {
  // 500 dòng, tất cả logic ở đây
  // Validate → Calculate → Save → Email → Inventory → ...
  // → Monolithic, hard to test, hard to reuse
}

// ✅ Use Case — chia nhỏ, test được, reuse được
class PlaceOrderUseCase {
  async execute(input) {
    // Delegate to smaller use cases or entities
    const validatedOrder = this.validateOrder(input);
    const payment = await this.processPayment(validatedOrder);
    await this.reserveInventory(validatedOrder.items);
    const savedOrder = await this.saveOrder(validatedOrder);
    await this.notifyCustomer(savedOrder);
    return savedOrder;
  }
}

// Mỗi bước = 1 use case riêng:
class ValidateOrderUseCase { ... }
class ProcessPaymentUseCase { ... }
class ReserveInventoryUseCase { ... }
class NotifyCustomerUseCase { ... }
```

---

## 4. Interface Adapters

### Repository Pattern

```javascript
// Repository = interface cho data access
// Business layer KHÔNG biết MySQL hay MongoDB

// Interface (abstract)
class IUserRepository {
  async findById(id) { throw new Error('Not implemented'); }
  async findByEmail(email) { throw new Error('Not implemented'); }
  async save(user) { throw new Error('Not implemented'); }
  async delete(id) { throw new Error('Not implemented'); }
}

// MySQL implementation
class MySQLUserRepository extends IUserRepository {
  constructor(db) { super(); this.db = db; }

  async findById(id) {
    const result = await this.db.query('SELECT * FROM users WHERE id = ?', [id]);
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  mapToEntity(row) {
    return new User(row.id, row.email, row.role);
  }
}

// MongoDB implementation
class MongoUserRepository extends IUserRepository {
  constructor(collection) { super(); this.collection = collection; }

  async findById(id) {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.mapToEntity(doc) : null;
  }

  mapToEntity(doc) {
    return new User(doc.id, doc.email, doc.role);
  }
}

// Controller: dùng interface
class UserController {
  constructor(userRepository) { // Interface!
    this.userRepository = userRepository;
  }

  async getUser(req, res) {
    const user = await this.userRepository.findById(req.params.id);
    // Dùng MySQL hay MongoDB? Controller không cần biết!
  }
}
```

### Data Transfer Objects (DTOs)

```javascript
// ❌ Return entity trực tiếp = expose internal structure
class UserController {
  async getUser(req, res) {
    const user = await this.repo.findById(req.params.id);
    res.json(user); // Return full entity!
    // → Exposes password, internal fields!
  }
}

// ✅ DTO — chỉ expose những gì cần thiết
class GetUserDTO {
  static from(user) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
    // password KHÔNG có!
  }
}

class CreateUserDTO {
  static validate(input) {
    const errors = [];
    if (!input.email?.includes('@')) errors.push('Invalid email');
    if (!input.password || input.password.length < 8) errors.push('Password too short');
    if (errors.length) throw new ValidationError(errors);
    return input;
  }
}

// Usage:
res.json(GetUserDTO.from(user));
```

### Presenters

```javascript
// Presenter = format data cho specific output
class UserPresenter {
  // Web response format
  static forWeb(user) {
    return {
      id: user.id,
      name: user.fullName,
      avatar: user.avatarUrl,
      isAdmin: user.isAdmin()
    };
  }

  // API response format
  static forAPI(user) {
    return {
      userId: user.id,
      email: user.email,
      role: user.role
    };
  }

  // CLI format
  static forCLI(user) {
    return `${user.fullName} (${user.email}) - ${user.role}`;
  }
}

// In controller:
res.json(UserPresenter.forWeb(user));
```

---

## 5. Dependency Injection trong Clean Architecture

### Wiring everything together

```javascript
// infrastructure.js — setup DI container
import { DIContainer } from './container';
import { MySQLUserRepository } from './repositories/mysql-user';
import { MySQLOrderRepository } from './repositories/mysql-order';
import { StripePaymentGateway } from './gateways/stripe';
import { SendGridEmailService } from './services/email';
import { CreateOrderUseCase } from './use-cases/create-order';
import { GetUserUseCase } from './use-cases/get-user';

function setupContainer() {
  const container = new DIContainer();

  // Infrastructure
  container.registerSingleton('DB', () => new MySQLConnection());
  container.registerSingleton('EmailService', () => new SendGridEmailService());

  // Repositories
  container.registerTransient('IUserRepository', (c) =>
    new MySQLUserRepository(c.resolve('DB'))
  );
  container.registerTransient('IOrderRepository', (c) =>
    new MySQLOrderRepository(c.resolve('DB'))
  );

  // Gateways
  container.registerTransient('IPaymentGateway', () => new StripePaymentGateway());

  // Use Cases
  container.registerTransient('CreateOrderUseCase', (c) =>
    new CreateOrderUseCase(
      c.resolve('IOrderRepository'),
      c.resolve('EmailService'),
      c.resolve('IPaymentGateway')
    )
  );

  container.registerTransient('GetUserUseCase', (c) =>
    new GetUserUseCase(
      c.resolve('IUserRepository')
    )
  );

  return container;
}

export { setupContainer };
```

---

## 6. Real-World Implementation

### Folder Structure

```
src/
├── domain/                          # Layer 1: Entities
│   ├── entities/
│   │   ├── User.js
│   │   ├── Order.js
│   │   └── Product.js
│   ├── value-objects/
│   │   ├── Money.js
│   │   └── Email.js
│   └── interfaces/                  # Contracts (no implementation!)
│       ├── IUserRepository.js
│       ├── IOrderRepository.js
│       └── IPaymentGateway.js
│
├── application/                    # Layer 2: Use Cases
│   ├── use-cases/
│   │   ├── create-order/
│   │   │   ├── CreateOrderUseCase.js
│   │   │   └── CreateOrderInput.js
│   │   ├── get-user/
│   │   │   └── GetUserUseCase.js
│   │   └── index.js
│   └── services/
│       └── NotificationService.js
│
├── infrastructure/                  # Layer 3: Interface Adapters
│   ├── repositories/
│   │   ├── mysql/
│   │   │   ├── MySQLUserRepository.js
│   │   │   └── MySQLOrderRepository.js
│   │   └── mongodb/
│   │       ├── MongoUserRepository.js
│   │       └── MongoOrderRepository.js
│   ├── gateways/
│   │   └── StripePaymentGateway.js
│   └── services/
│       └── SendGridEmailService.js
│
├── presentation/                    # Layer 4: Frameworks & Drivers
│   ├── controllers/
│   │   └── UserController.js
│   ├── routes/
│   │   └── userRoutes.js
│   └── express/
│       └── app.js
│
└── shared/
    ├── errors/
    │   ├── NotFoundError.js
    │   └── ValidationError.js
    └── container.js
```

### Validation trong Use Cases

```javascript
// UseCase input validation — giữ business rules clean

class CreateOrderInput {
  constructor(items, customerId, paymentMethod) {
    this.items = items;
    this.customerId = customerId;
    this.paymentMethod = paymentMethod;
  }

  static validate(input) {
    const errors = [];

    if (!input.items || input.items.length === 0) {
      errors.push('Order must have at least 1 item');
    }

    if (!input.customerId) {
      errors.push('Customer ID is required');
    }

    const validMethods = ['credit_card', 'paypal', 'bank_transfer'];
    if (!validMethods.includes(input.paymentMethod)) {
      errors.push(`Payment method must be one of: ${validMethods.join(', ')}`);
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    return new CreateOrderInput(input.items, input.customerId, input.paymentMethod);
  }
}

class CreateOrderUseCase {
  async execute(input) {
    // Validate input
    const validInput = CreateOrderInput.validate(input);

    // Business logic
    const order = new Order(validInput.items, validInput.customerId);
    await this.orderRepository.save(order);

    return { orderId: order.id, total: order.getTotal() };
  }
}
```

---

## 7. Các Traps Phổ Biến

### Trap 1: Entities có dependencies

```javascript
// ❌ Entity phụ thuộc vào database, logger, etc.
class User {
  constructor(id, email, db) {
    this.db = db; // ❌ Entity không nên có DB!
  }

  async save() {
    await this.db.save(this); // ❌ Entity biết implementation!
  }
}

// ✅ Entity chỉ là data + business logic
class User {
  constructor(id, email, role) {
    this.id = id;
    this.email = email;
    this.role = role;
  }

  isAdmin() { return this.role === 'admin'; }
}

// Save logic → Repository
class UserRepository {
  async save(user) {
    await this.db.query('INSERT INTO users ...', [user.email, user.role]);
  }
}
```

### Trap 2: Use Cases gọi trực tiếp infrastructure

```javascript
// ❌ Use case dùng MySQL trực tiếp
class CreateOrderUseCase {
  async execute(input) {
    const db = await mysql.connect(); // ❌ Infrastructure leak!
    await db.query('INSERT INTO orders ...');
    await sendgrid.sendEmail(...); // ❌ Service leak!
  }
}

// ✅ Use case dùng interfaces
class CreateOrderUseCase {
  constructor(orderRepo, emailService) {
    this.orderRepo = orderRepo; // ✅ Interface
    this.emailService = emailService; // ✅ Interface
  }
}
```

### Trap 3: Domain logic trong Controllers

```javascript
// ❌ Controller có business logic
app.post('/orders', async (req, res) => {
  // 500 dòng business logic trong controller!
  const total = req.body.items.reduce((sum, item) => {
    return sum + item.price * item.qty;
  }, 0);

  if (total < 0) throw new Error('Negative total'); // Business logic!

  await db.query('INSERT INTO orders ...', [req.body.customerId, total]);
  // ...
});

// ✅ Controller chỉ nhận input, gọi use case
app.post('/orders', async (req, res) => {
  const useCase = container.resolve('CreateOrderUseCase');
  const result = await useCase.execute(req.body);
  res.json(result);
});
```

### Trap 4: Anemic Domain Model

```javascript
// ❌ Anemic — entities chỉ có data, không có logic
class Order {
  items;
  customerId;
  status;
  // KHÔNG có methods! Logic ở đâu?
}

class OrderService {
  calculateTotal(order) { ... }
  validateOrder(order) { ... }
  cancelOrder(order) { ... }
  // Tất cả logic ở đây!
}

// ✅ Rich Domain Model — entities có behavior
class Order {
  #items;
  #status;

  constructor(items, customerId) {
    this.#items = items;
    this.#status = 'pending';
  }

  getTotal() {
    return this.#items.reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  cancel() {
    if (this.#status === 'shipped') {
      throw new Error('Cannot cancel shipped order');
    }
    this.#status = 'cancelled';
  }

  isEditable() {
    return this.#status === 'pending';
  }
}
```

---

## 8. Câu Hỏi Phỏng Vấn

### Câu 1: Dependency Rule trong Clean Architecture là gì?

**Trả lời:** Dependency Rule = dependencies chỉ đi ONE WAY từ outer layers vào inner layers. Inner layer (Entities, Use Cases) KHÔNG BIẾT gì về outer layers (Database, UI, Frameworks). Outer layers IMPLEMENT interfaces được định nghĩa bởi inner layers. Đây là nguyên tắc cốt lõi: **"Source code dependencies can only point inward."**

---

### Câu 2: Sự khác nhau giữa Entities và Data Models?

| | Entity | Data Model |
|--|--------|-----------|
| Identity | Có identity (ID) | Không có |
| Business logic | Có methods, rules | Không có |
| Immutable | Có thể mutable | Thường mutable |
| Dependencies | Không có | Có thể có |
| Purpose | Business rules | Data transfer |
| Location | Domain layer | Infrastructure layer |

---

### Câu 3: Repository Pattern là gì?

**Trả lời:** Repository là interface trừu tượng hóa data access. Business layer dùng Repository interface, không biết MySQL, MongoDB, hay file system bên dưới. Implementation cụ thể (MySQLUserRepository, MongoUserRepository) ở infrastructure layer. Benefit: swap database without changing business logic.

---

### Câu 4: DTO và Presenter khác nhau thế nào?

**Trả lời:** DTO (Data Transfer Object) = structure để truyền data giữa layers, thường là flat object. Presenter = format data cho specific output (web, API, CLI). DTO dùng để structured input/output cho use cases. Presenter dùng để format output cho specific view/client.

---

### Câu 5: Clean Architecture vs Layered Architecture vs Hexagonal?

| | Clean Architecture | Layered Architecture | Hexagonal (Ports & Adapters) |
|--|------------------|--------------------|------------------------------|
| Layers | 4 concentric | N flat layers | Core + Ports + Adapters |
| Dependency | Inward only | Mixed | Inward only |
| Entities | Core domain | Usually in data layer | Domain entities |
| Use Cases | Explicit layer | May be mixed | Explicit |
| Adapters | Outer layer | Usually same layer | Pluggable adapters |

**Trả lời:** Clean Architecture và Hexagonal Architecture tương tự, cả hai nhấn mạnh dependency inward. Clean Architecture nhấn mạnh 4 layers rõ ràng (Entities → Use Cases → Adapters → Frameworks). Hexagonal dùng "ports" (interfaces) và "adapters" (implementations). Layered Architecture thường có dependencies đi ngang, ít strict.

---

### Câu 6: Khi nào Clean Architecture overkill?

**Trả lời:** (1) **Small projects** — CRUD apps đơn giản không cần 4 layers. (2) **MVPs** — speed quan trọng hơn perfect architecture. (3) **Team nhỏ** — overhead của abstraction layers không worth. (4) **Microservices nhỏ** — mỗi service nhỏ, overkill để có full Clean Architecture. Indicator: nếu bạn cần 30+ files để implement 1 feature → có thể overkill.

---

### Câu 7: Đơn Tử Hay Đa Tử?

```javascript
// Monolith — 1 codebase, all layers together
// ✅ Dễ: shared code, transactions, debugging
// ❌ Chậm: deploy, test, scaling

// Microservices — separate processes, separate deploys
// ✅ Fast: deploy, test, scaling per service
// ❌ Phức tạp: distributed systems problems, data consistency

// Modular Monolith — Clean Architecture trong 1 process
// ✅ Best of both: modular, easy debugging, fast deploy
// ❌ Cần discipline để giữ boundaries

// Recommendation: Start with Modular Monolith
// → Scale to microservices khi CẦN THỰC SỰ
```

---

## 9. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  CLEAN ARCHITECTURE                                            │
│                                                               │
│  4 LAYERS (INWARD DEPENDENCIES ONLY)                          │
│  ├── Entities: business objects, no dependencies              │
│  │   ├── Identity + business rules                           │
│  │   ├── Methods = behavior                                   │
│  │   └── Value objects = immutable values                    │
│  ├── Use Cases: application business rules                    │
│  │   ├── 1 use case = 1 business action                      │
│  │   ├── Input validation (DTO)                               │
│  │   └── Orchestrate entities + repositories                │
│  ├── Adapters: implement interfaces                          │
│  │   ├── Repositories (implement IRepository)               │
│  │   ├── Gateways (implement IPaymentGateway)              │
│  │   └── Presenters (format output)                          │
│  └── Frameworks: entry points                                  │
│      ├── Controllers (HTTP handlers)                         │
│      ├── React/Vue components                                │
│      └── CLI commands                                         │
│                                                               │
│  DEPENDENCY RULE: Source code deps → inward ONLY              │
│                                                               │
│  KEY PATTERNS                                                  │
│  ├── Repository: abstract data access                        │
│  ├── DTO: structured input/output                             │
│  ├── Presenter: format for specific view                     │
│  └── Dependency Injection: wire everything                   │
│                                                               │
│  ⚠️ Entities không biết gì về database                     │
│  ⚠️ Use cases dùng interfaces, không implementations        │
│  ⚠️ Controllers chỉ nhận input, gọi use case              │
│  ⚠️ Anemic domain model = anti-pattern                      │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Vẽ được Clean Architecture diagram và giải thích Dependency Rule
- [ ] Tạo được Entity với business logic, không có infrastructure deps
- [ ] Implement được Use Case với input validation và DI
- [ ] Tạo được Repository interface và implementation
- [ ] Phân biệt được DTO, Entity, Data Model
- [ ] Hiểu folder structure của Clean Architecture
- [ ] Trả lời được 5/7 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
