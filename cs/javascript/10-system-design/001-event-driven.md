# Event-Driven Architecture — Kiến Trúc Theo Sự Kiện

## Câu hỏi mở đầu

```javascript
// Thiết kế notification system:
// User đăng bài → cần:
// - Gửi email cho 10,000 followers
// - Cập nhật notification feed
// - Cập nhật search index
// - Gửi push notifications
// - Thống kê analytics
// - Cập nhật trending scores

// ❌ SYNCHRONOUS: mỗi bước đợi bước trước
async function postArticle(article) {
  await saveToDatabase(article);
  await sendEmails(article);      // 10,000 emails = 30 phút!
  await updateSearchIndex(article);
  await sendPushNotifications(article);
  await recordAnalytics(article);
  // User đợi 30 phút để post 1 bài!

// ✅ EVENT-DRIVEN: publish event, components tự đăng ký
async function postArticle(article) {
  await saveToDatabase(article);
  await eventBus.publish('article.posted', { article });
  // User đợi ~100ms!
}
```

**Event-driven architecture** giải quyết vấn đề coupling và scalability: thay vì service gọi trực tiếp các service khác, nó **publish event** và các service quan tâm **subscribe** vào. Đây là nền tảng của Kafka, RabbitMQ, Redis Pub/Sub, và event systems trong React, Vue, Node.js.

---

## 1. Pub/Sub — Nền Tảng Của Event Systems

### Bản chất

```
┌──────────────────────────────────────────────────────────────┐
│  PUB/SUB — PUBLISHER / SUBSCRIBER                            │
│                                                               │
│  Publisher (Event Producer)                                   │
│  │    │                                                     │
│  │    └────────── Event Bus / Message Broker ─────────┐   │
│  │         │                                               │   │
│  │         ├──→ Subscriber A                            │   │
│  │         ├──→ Subscriber B                            │   │
│  │         ├──→ Subscriber C                            │   │
│  │         └──→ Subscriber D                            │   │
│                                                               │
│  DECOUPLED: Publisher không biết subscribers                │
│  → Publishers và Subscribers hoàn toàn độc lập             │
│  → Thêm subscriber mới = không sửa publisher              │
└──────────────────────────────────────────────────────────────┘
```

### Implement event bus đơn giản

```javascript
class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  // Subscribe: đăng ký lắng nghe event
  subscribe(eventName, handler) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventName).delete(handler);
    };
  }

  // Publish: gửi event
  publish(eventName, payload) {
    const handlers = this.listeners.get(eventName) || [];
    handlers.forEach(handler => {
      try {
        handler(payload);
      } catch (err) {
        console.error(`Error in handler for ${eventName}:`, err);
      }
    });
  }

  // Once: chỉ subscribe 1 lần
  once(eventName, handler) {
    const unsubscribe = this.subscribe(eventName, (payload) => {
      unsubscribe();
      handler(payload);
    });
    return unsubscribe;
  }
}

// Usage:
const eventBus = new EventBus();

eventBus.subscribe('user.registered', (payload) => {
  console.log('Send welcome email to:', payload.email);
});

eventBus.subscribe('user.registered', (payload) => {
  console.log('Create user profile for:', payload.userId);
});

eventBus.subscribe('order.placed', async (payload) => {
  await sendConfirmationEmail(payload);
  await updateInventory(payload.items);
  await notifyWarehouse(payload);
});

eventBus.publish('user.registered', {
  userId: '123',
  email: 'alice@example.com',
  name: 'Alice'
});
```

---

## 2. Message Queue — Khi Event Cần Persistence

### In-memory vs Persistent queue

```
┌──────────────────────────────────────────────────────────────┐
│  EVENT BUS vs MESSAGE QUEUE                                    │
│                                                               │
│  EVENT BUS (In-Memory)                                       │
│  ├── Events tồn tại trong memory                          │
│  ├── Fast, low latency                                     │
│  ├── ❌ Messages bị LOST khi server crash                  │
│  ├── ❌ Không có persistence                                │
│  └── Use case: local events, same process                   │
│                                                               │
│  MESSAGE QUEUE (Persistent)                                  │
│  ├── Messages được PERSIST trên disk                        │
│  ├── Survives server restarts                              │
│  ├── Guarantee delivery (at-least-once, exactly-once)     │
│  ├── Can have multiple consumers                            │
│  └── Use case: distributed systems, inter-service comms      │
└──────────────────────────────────────────────────────────────┘
```

### Redis Pub/Sub

```javascript
import { createClient } from 'redis';

const publisher = createClient();
const subscriber = createClient();

await publisher.connect();
await subscriber.connect();

// Publisher
async function publishArticle(article) {
  await publisher.publish('articles', JSON.stringify(article));
}

// Subscriber
async function startSubscribers() {
  await subscriber.subscribe('articles', (message) => {
    const article = JSON.parse(message);
    processArticle(article);
  });

  await subscriber.subscribe('notifications', (message) => {
    sendPushNotification(JSON.parse(message));
  });
}

// ⚠️ Redis Pub/Sub: fire-and-forget
// → Message BỊ LOST nếu subscriber không online!
// → Dùng Redis Streams hoặc proper message queue cho reliability
```

### Redis Streams (Reliable)

```javascript
// Redis Streams: persistent, consumer groups, replayable
const { Redisearch } = require('redis');

const stream = 'article-events';

// Producer: ADD to stream
await client.xAdd(stream, '*', {
  type: 'article.posted',
  title: article.title,
  authorId: article.authorId
});

// Consumer Group: reliable processing
await client.xGroupCreate(stream, 'processors', '0');

// Consumer: READ from stream
const results = await client.xReadGroup(
  'processors',   // group name
  'worker-1',       // consumer name
  { stream, maxLen: 1000 },
  { block: 5000 }
);

for (const result of results) {
  for (const message of result.messages) {
    const event = message.fields;
    await processEvent(event);
    // ACK: mark as processed
    await client.xAck(stream, 'processors', message.id);
  }
}
```

---

## 3. Event Sourcing — Events As Source Of Truth

### Bản chất

```
┌──────────────────────────────────────────────────────────────┐
│  EVENT SOURCING                                               │
│                                                               │
│  TRADITIONAL: Store current STATE                           │
│  User: { name: "Alice", balance: 100 }                      │
│  → Update balance: SET balance = 150                        │
│  → LOST: không biết tại sao balance = 150                   │
│                                                               │
│  EVENT SOURCING: Store EVENTS, rebuild STATE               │
│  AccountOpened: { userId: 1, balance: 0 }                    │
│  Deposit: { amount: 50 } → balance = 50                      │
│  Deposit: { amount: 100 } → balance = 150                    │
│  Withdraw: { amount: 30 } → balance = 120                   │
│  → Audit trail COMPLETE! replay events = current state       │
│  → Có thể rollback, debug, replay                         │
└──────────────────────────────────────────────────────────────┘
```

### Event sourcing implementation

```javascript
// Event store
class EventStore {
  constructor() {
    this.events = [];
  }

  // Append event
  append(event) {
    const eventRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type: event.type,
      payload: event.payload,
      version: this.events.length + 1
    };

    this.events.push(eventRecord);
    return eventRecord;
  }

  // Get events for aggregate
  getEvents(aggregateId) {
    return this.events.filter(e => e.payload.aggregateId === aggregateId);
  }

  // Rebuild state from events
  rebuildState(aggregateId, initialState = {}) {
    const events = this.getEvents(aggregateId);

    return events.reduce((state, event) => {
      return applyEvent(state, event);
    }, initialState);
  }

  // Projections: read models
  getAllAccounts() {
    return this.events
      .filter(e => e.type === 'AccountOpened')
      .map(e => this.rebuildState(e.payload.aggregateId));
  }
}

function applyEvent(state, event) {
  switch (event.type) {
    case 'AccountOpened':
      return { ...state, ...event.payload, balance: 0 };
    case 'Deposit':
      return { ...state, balance: state.balance + event.payload.amount };
    case 'Withdraw':
      return { ...state, balance: state.balance - event.payload.amount };
    case 'AccountClosed':
      return { ...state, status: 'closed' };
    default:
      return state;
  }
}

// Usage:
const store = new EventStore();

// Commands → Events
store.append({ type: 'AccountOpened', payload: { aggregateId: 'acc-1', name: 'Alice' } });
store.append({ type: 'Deposit', payload: { aggregateId: 'acc-1', amount: 100 } });
store.append({ type: 'Deposit', payload: { aggregateId: 'acc-1', amount: 50 } });
store.append({ type: 'Withdraw', payload: { aggregateId: 'acc-1', amount: 30 } });

// Rebuild current state
const account = store.rebuildState('acc-1');
console.log(account.balance); // 120

// Get audit trail
const events = store.getEvents('acc-1');
console.log(events);
// [
//   { type: 'AccountOpened', payload: {...}, version: 1 },
//   { type: 'Deposit', payload: {amount: 100}, version: 2 },
//   { type: 'Deposit', payload: {amount: 50}, version: 3 },
//   { type: 'Withdraw', payload: {amount: 30}, version: 4 }
// ]
```

---

## 4. CQRS — Command Query Responsibility Segregation

### Bản chất

```
┌──────────────────────────────────────────────────────────────┐
│  CQRS — Command Query Responsibility Segregation                │
│                                                               │
│  COMMAND (Write): "Làm gì đó"                                 │
│  ├── createUser(), updateProfile(), placeOrder()             │
│  ├── Returns: void hoặc confirmation                         │
│  └── Writes → Command Model                                  │
│                                                               │
│  QUERY (Read): "Cho tôi biết"                                │
│  ├── getUser(id), searchProducts(), getOrderHistory()       │
│  ├── Returns: Data                                          │
│  └── Reads → Query Model (Denormalized)                    │
│                                                               │
│  Command Model →→ Event Bus →→ Query Models (Projections)    │
│                                                               │
│  BENEFITS:                                                   │
│  ├── Different models for read/write (optimized separately)│
│  ├── Scalable independently                                  │
│  ├── Can have multiple query models for different use cases │
│  └── Event store = complete audit trail                     │
└──────────────────────────────────────────────────────────────┘
```

### CQRS implementation

```javascript
// Command side: validate + persist + emit event
class UserCommandHandler {
  constructor(eventStore) {
    this.eventStore = eventStore;
  }

  async handleCreateUser(command) {
    // Validate
    if (!command.email.includes('@')) {
      throw new ValidationError('Invalid email');
    }

    // Create event
    const event = {
      type: 'UserCreated',
      payload: {
        userId: crypto.randomUUID(),
        email: command.email,
        name: command.name,
        createdAt: new Date().toISOString()
      }
    };

    // Persist
    this.eventStore.append(event);

    // Return result
    return { userId: event.payload.userId, success: true };
  }
}

// Query side: read from projections
class UserQueryHandler {
  constructor(eventStore) {
    this.eventStore = eventStore;
  }

  // Projection: user by email (for login)
  async findByEmail(email) {
    const events = this.eventStore.events.filter(
      e => e.type === 'UserCreated' && e.payload.email === email
    );

    if (events.length === 0) return null;

    const event = events[0];
    return {
      id: event.payload.userId,
      email: event.payload.email,
      name: event.payload.name
    };
  }

  // Projection: user profile (for display)
  async getProfile(userId) {
    return this.eventStore.rebuildState(userId, {});
  }

  // Projection: user list (for admin)
  async getAllUsers() {
    const createdEvents = this.eventStore.events.filter(
      e => e.type === 'UserCreated'
    );

    return createdEvents.map(e => this.eventStore.rebuildState(e.payload.userId, {}));
  }
}
```

---

## 5. Domain Events

### Event naming conventions

```
┌──────────────────────────────────────────────────────────────┐
│  DOMAIN EVENT NAMING                                          │
│                                                               │
│  FORMAT: Subject + PastTenseVerb                              │
│                                                               │
│  ✅ GOOD:                                                   │
│  ├── user.account.opened                                    │
│  ├── order.placed                                          │
│  ├── payment.processed                                     │
│  ├── inventory.reserved                                     │
│  ├── subscription.cancelled                                 │
│  └── notification.sent                                     │
│                                                               │
│  ❌ BAD:                                                    │
│  ├── USER_CREATED (SCREAMING_SNAKE_CASE)                    │
│  ├── createUser (imperative, not event)                    │
│  ├── onUserCreated (listener name, not event)               │
│  └── userCreatedButNotified (multiple concerns)             │
│                                                               │
│  PRINCIPLES:                                                 │
│  ├── Events = past tense (đã xảy ra)                      │
│  ├── Nouns.describe the thing affected                     │
│  └── One concern per event                                │
└──────────────────────────────────────────────────────────────┘
```

### Domain event class

```javascript
// Domain Event: meaningful, structured event
class DomainEvent {
  constructor(name, payload) {
    this.eventId = crypto.randomUUID();
    this.eventName = name;
    this.occurredOn = new Date().toISOString();
    this.payload = payload;
    this.metadata = {
      correlationId: null,
      causationId: null,
      userId: null
    };
  }

  setMetadata(metadata) {
    this.metadata = { ...this.metadata, ...metadata };
    return this;
  }
}

// Domain Events
class UserRegistered extends DomainEvent {
  constructor(payload) {
    super('user.registered', payload);
  }
}

class OrderPlaced extends DomainEvent {
  constructor(payload) {
    super('order.placed', payload);
  }
}

// Publishing
async function registerUser(command) {
  const event = new UserRegistered({
    userId: generateId(),
    email: command.email,
    name: command.name
  }).setMetadata({ userId: command.requestUserId });

  await eventStore.append(event);
  await eventBus.publish(event.eventName, {
    ...event.payload,
    eventId: event.eventId,
    occurredOn: event.occurredOn
  });

  return event.payload;
}
```

---

## 6. Real-World Event-Driven Patterns

### Saga Pattern — Distributed Transactions

```javascript
// Saga: sequence of local transactions, each publishes event
// If one fails → compensating transactions rollback

class OrderSaga {
  constructor(eventBus, repositories) {
    this.eventBus = eventBus;
    this.orderRepo = repositories.order;
    this.inventoryRepo = repositories.inventory;
    this.paymentRepo = repositories.payment;
  }

  async execute(orderData) {
    // Step 1: Create order (pending)
    const order = await this.orderRepo.create({
      ...orderData,
      status: 'pending'
    });

    try {
      // Step 2: Reserve inventory
      await this.inventoryRepo.reserve(order.items);
      this.eventBus.publish('inventory.reserved', { orderId: order.id });

      // Step 3: Process payment
      await this.paymentRepo.charge(order.customerId, order.total);
      this.eventBus.publish('payment.succeeded', { orderId: order.id });

      // Step 4: Confirm order
      await this.orderRepo.update(order.id, { status: 'confirmed' });
      this.eventBus.publish('order.confirmed', { orderId: order.id });

    } catch (error) {
      // Compensating transactions — ROLLBACK
      if (error.type === 'PAYMENT_FAILED') {
        // Compensate: release inventory
        await this.inventoryRepo.release(order.items);
        this.eventBus.publish('inventory.released', { orderId: order.id });

        // Update order status
        await this.orderRepo.update(order.id, {
          status: 'payment_failed',
          failureReason: error.message
        });
      }

      if (error.type === 'INSUFFICIENT_INVENTORY') {
        await this.orderRepo.update(order.id, {
          status: 'inventory_failed'
        });
      }
    }
  }
}
```

### Outbox Pattern — Reliable Event Publishing

```javascript
// Problem: publishing event AFTER database commit
// → If publishing fails → event lost!

// ❌ Unreliable:
async function transfer(from, to, amount) {
  await db.query('UPDATE accounts SET balance = ? WHERE id = ?', [newBalance, from]);
  await eventBus.publish('transfer.completed', { ... }); // CÓ THỂ FAIL!
}

// ✅ Outbox Pattern:
async function transfer(from, to, amount) {
  const db = await getConnection();

  await db.transaction(async (tx) => {
    // 1. Update balance
    await tx.query('UPDATE accounts...', [newBalance, from]);

    // 2. Write to OUTBOX (same transaction!)
    await tx.query(
      'INSERT INTO outbox (event_type, payload) VALUES (?, ?)',
      ['transfer.completed', JSON.stringify({ from, to, amount })]
    );
  });

  // 3. Outbox processor reads and publishes
  // (runs independently, retries if fails)
}

// Outbox processor:
async function processOutbox() {
  const pending = await db.query(
    'SELECT * FROM outbox WHERE published_at IS NULL ORDER BY created_at'
  );

  for (const row of pending) {
    try {
      await eventBus.publish(row.event_type, JSON.parse(row.payload));
      await db.query('UPDATE outbox SET published_at = NOW() WHERE id = ?', [row.id]);
    } catch (err) {
      // Will retry on next run
      console.error('Failed to publish:', err);
    }
  }
}
```

---

## 7. Các Traps Phổ Biến

### Trap 1: Eventual consistency confusion

```javascript
// ❌ User posts content → immediately reads → not found!
// (Because subscriber hasn't processed yet)
async function postContent(content) {
  await eventBus.publish('content.created', { content });
  const found = await db.query('SELECT * FROM content WHERE id = ?', [content.id]);
  return found; // ❌ Not found yet! Event not processed!
}

// ✅ Return data directly, not from subscriber
async function postContent(content) {
  // Save first
  await db.query('INSERT INTO content...', [content]);

  // Publish event AFTER save
  await eventBus.publish('content.created', { content });

  // Return from local save (immediate)
  return content;
}
```

### Trap 2: Coupling qua topic names

```javascript
// ❌ Hard-coded topic names = coupling
eventBus.publish('user.registered', payload);
eventBus.subscribe('user.registered', handler);

// ✅ Use constants or schema registry
const TOPICS = {
  USER_REGISTERED: 'user.registered',
  ORDER_PLACED: 'order.placed'
};

eventBus.publish(TOPICS.USER_REGISTERED, payload);
eventBus.subscribe(TOPICS.USER_REGISTERED, handler);

// ✅ Or use event schema registry
const EventSchema = {
  'user.registered': {
    required: ['userId', 'email'],
    optional: ['metadata']
  }
};
```

### Trap 3: Over-using events

```javascript
// ❌ Events for everything = complexity explosion
eventBus.publish('user.name.changed', { old: 'Alice', new: 'Bob' });
eventBus.publish('user.profile.updated', { field: 'avatar', value: 'new.jpg' });
eventBus.publish('user.preference.changed', { preference: 'theme', value: 'dark' });
// → 100 tiny events = unreadable!

// ✅ Group related changes into meaningful events
eventBus.publish('user.profile.updated', {
  changes: {
    name: { from: 'Alice', to: 'Bob' },
    avatar: { from: 'old.jpg', to: 'new.jpg' }
  }
});
```

### Trap 4: Missing error handling

```javascript
// ❌ Handler throws → event lost, nobody knows
eventBus.subscribe('payment.processed', (payload) => {
  throw new Error('Email service down!');
  // → Payment processed but email not sent! → Customer confused!
});

// ✅ Always wrap in try-catch + dead letter queue
eventBus.subscribe('payment.processed', async (payload) => {
  try {
    await sendConfirmationEmail(payload);
  } catch (err) {
    // Publish to dead letter queue
    await eventBus.publish('notification.failed', {
      originalEvent: payload,
      error: err.message
    });
    // Alert operations team
    await alertService.notify('Email service failure', err);
  }
});
```

---

## 8. Câu Hỏi Phỏng Vấn

### Câu 1: Pub/Sub vs Message Queue khác nhau thế nào?

**Trả lời:** Pub/Sub = broadcast model, mỗi subscriber nhận copy của message. Message được fire-and-forget, subscriber phải online. Message Queue = point-to-point, message được consume bởi đúng 1 consumer, có acknowledgment. Pub/Sub cho events cần nhiều subscribers. Message Queue cho workloads cần reliability và ordered processing.

---

### Câu 2: Event sourcing vs CRUD?

| | Event Sourcing | CRUD |
|--|---------------|------|
| Storage | Events (immutable) | Current state (mutable) |
| History | Full audit trail | Usually lost |
| Replay | Rebuild state by replaying | Not possible |
| Complexity | Higher | Lower |
| Storage | More (all events) | Less (current state) |
| Use case | Financial, audit-critical | General CRUD |

---

### Câu 3: Saga Pattern giải quyết vấn đề gì?

**Trả lời:** Distributed transactions không có ACID across services. Saga chia thành sequence of local transactions, mỗi cái update 1 service. Nếu 1 step fail → compensating transactions chạy ngược lại để rollback. 2 types: Choreography (services tự emit events, self-organizing) và Orchestration (central orchestrator điều phối). Trade-off: eventual consistency thay vì strong consistency.

---

### Câu 4: Outbox Pattern là gì?

**Trả lời:** Giải quyết dual-write problem: writing to DB và publishing event không atomic. Outbox pattern: write event vào OUTBOX table TRONG CÙNG database transaction với business data. Separate outbox processor poll outbox và publish events. Nếu publish fail → retry. Events không bị lost vì persisted in DB.

---

### Câu 5: Eventual consistency là gì?

**Trả lời:** Trong distributed systems, khi you update data → replicas không update đồng thời. Có 1 khoảng thời gian (ms → seconds) mà different nodes có different values. Eventual consistency = sau 1 khoảng thời gian, tất cả replicas sẽ converge về cùng value. Đây là trade-off: strong consistency (ACID) vs availability và scalability. Event-driven systems embrace eventual consistency.

---

### Câu 6: CQRS khi nào nên dùng?

**Trả lời:** (1) **Complex domain** — read/write models very different. (2) **Scalability** — read và write có different load patterns. (3) **Performance** — read queries cần denormalized data. (4) **Event sourcing** — CQRS pairs naturally. (5) **Team separation** — different teams work on command vs query side. **Don't use** when: simple CRUD, low complexity, team unfamiliar with pattern.

---

## 9. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  EVENT-DRIVEN ARCHITECTURE                                    │
│                                                               │
│  PUB/SUB                                                     │
│  ├── Publisher → Event Bus → Subscribers                    │
│  ├── Decoupled components                                   │
│  └── Redis Pub/Sub, EventEmitter                          │
│                                                               │
│  MESSAGE QUEUE (Persistent)                                  │
│  ├── Messages persisted → survive restarts                  │
│  ├── Consumer groups → load balancing                       │
│  └── Redis Streams, RabbitMQ, Kafka                       │
│                                                               │
│  EVENT SOURCING                                              │
│  ├── Store events, rebuild state                           │
│  ├── Complete audit trail                                  │
│  └── Rebuild, replay, rollback                            │
│                                                               │
│  CQRS                                                         │
│  ├── Command (write) → Command model                        │
│  ├── Query (read) → Denormalized projections                │
│  └── Event Bus connects the two                          │
│                                                               │
│  PATTERNS                                                     │
│  ├── Saga: distributed transactions + compensation          │
│  ├── Outbox: reliable event publishing                     │
│  └── Dead Letter Queue: failed event handling               │
│                                                               │
│  ⚠️ Eventual consistency = don't expect immediate updates │
│  ⚠️ Always handle errors in subscribers                    │
│  ⚠️ Name events as past tense: user.registered          │
│  ⚠️ Don't over-event: group related changes              │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Implement được Event Bus với pub/sub
- [ ] Hiểu được Event Sourcing và rebuild state từ events
- [ ] Biết dùng CQRS cho complex domains
- [ ] Implement được Saga pattern với compensating transactions
- [ ] Hiểu Outbox pattern cho reliable event publishing
- [ ] Trả lời được 4/6 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
