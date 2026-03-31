# 👁️ Observer Pattern

## 🎯 Problem & Motivation

**Bài toán:** Một object (**Subject**) thay đổi state, cần **thông báo** cho **nhiều other objects (Observers)** biết — mà Subject không biết Observers là ai.

**Ví dụ thực tế:** YouTube channel — khi có video mới, channel thông báo cho tất cả subscribers. Channel không cần biết subscriber là ai (email, phone, notification app).

**Observer giải quyết:** Định nghĩa **subscription mechanism** — Observers đăng ký nhận thông báo, Subject gửi notification khi state thay đổi.

---

## 💡 Use Cases

1. **Event System / Pub-Sub** — Message brokers (Kafka, Redis pub/sub), DOM events (`addEventListener`)
2. **MVC Architecture** — Model thay đổi → View tự update
3. **Real-time Data** — Stock price changes → UI widgets update
4. **Newsletter / Notification** — User đăng ký topic → notification khi có update
5. **Auto-save / Sync** — File thay đổi → observers auto-sync lên cloud

---

## ❌ Before (Không dùng Observer)

```typescript
// ❌ Tight coupling: Subject phải biết và gọi từng observer cụ thể
class NewsAgency {
  private news: string = '';

  // ❌ Mỗi khi thêm subscriber mới → phải sửa class này!
  private emailService = new EmailService();
  private smsService = new SmsService();
  private pushService = new PushNotificationService();

  setNews(news: string) {
    this.news = news;
    // ⚠️ Subject phải biết tất cả observers!
    this.emailService.send(news);
    this.smsService.send(news);
    this.pushService.send(news);
    // Thêm subscriber mới? Sửa đây!
  }
}
```

→ **Vấn đề:** Subject phụ thuộc vào concrete observers → tight coupling. Thêm observer mới → sửa Subject. Observable không tái sử dụng được.

---

## ✅ After (Dùng Observer)

```typescript
// ─────────────────────────────────────────
// 1. Observer Interface — contract cho tất cả observers
// ─────────────────────────────────────────
interface Observer {
  update(subject: Subject): void;
}

// ─────────────────────────────────────────
// 2. Subject Interface — defines subscription
// ─────────────────────────────────────────
interface Subject {
  attach(observer: Observer): void;
  detach(observer: Observer): void;
  notify(): void;
}

// ─────────────────────────────────────────
// 3. Concrete Subject — maintain state, notify observers
// ─────────────────────────────────────────
class NewsPortal implements Subject {
  private observers: Observer[] = [];
  private news: string = '';

  attach(observer: Observer): void {
    const exists = this.observers.includes(observer);
    if (!exists) {
      this.observers.push(observer);
      console.log(`✅ Observer subscribed`);
    }
  }

  detach(observer: Observer): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
      console.log(`❌ Observer unsubscribed`);
    }
  }

  notify(): void {
    console.log(`📢 Notifying ${this.observers.length} observers...`);
    for (const observer of this.observers) {
      observer.update(this);
    }
  }

  // Business logic — khi news thay đổi
  setNews(news: string): void {
    console.log(`📰 NewsPortal: New article — "${news}"`);
    this.news = news;
    this.notify(); // Tự động notify tất cả observers
  }

  getNews(): string {
    return this.news;
  }
}

// ─────────────────────────────────────────
// 4. Concrete Observers — react to notifications
// ─────────────────────────────────────────
class EmailSubscriber implements Observer {
  constructor(private email: string) {}

  update(subject: Subject): void {
    const portal = subject as NewsPortal;
    console.log(`📧 Email to ${this.email}: "${portal.getNews()}"`);
  }
}

class SmsSubscriber implements Observer {
  constructor(private phone: string) {}

  update(subject: Subject): void {
    const portal = subject as NewsPortal;
    console.log(`📱 SMS to ${this.phone}: "${portal.getNews()}"`);
  }
}

class PushSubscriber implements Observer {
  constructor(private deviceId: string) {}

  update(subject: Subject): void {
    const portal = subject as NewsPortal;
    console.log(`🔔 Push to ${this.deviceId}: "${portal.getNews()}"`);
  }
}

// ─────────────────────────────────────────
// 5. Client — subscribe/unsubscribe dynamically
// ─────────────────────────────────────────
const portal = new NewsPortal();

const email1 = new EmailSubscriber('john@example.com');
const sms1 = new SmsSubscriber('+1234567890');
const push1 = new PushSubscriber('device_001');

portal.attach(email1);
portal.attach(sms1);
portal.attach(push1);

portal.setNews('🚀 Breaking: AI beats humans at Go!');
// 📢 Notifying 3 observers...
// 📧 Email to john@example.com: "🚀 Breaking: AI beats humans at Go!"
// 📱 SMS to +1234567890: "🚀 Breaking: AI beats humans at Go!"
// 🔔 Push to device_001: "🚀 Breaking: AI beats humans at Go!"

portal.detach(sms1); // Unsubscribe SMS
portal.setNews('💻 New programming language released!');
// 📢 Notifying 2 observers... (SMS đã unsubscribe)
// ...
```

→ **Cải thiện:** Thêm observer mới? Tạo class mới implements `Observer`. Subject hoàn toàn không cần biết observer cụ thể.

---

## 🏗️ UML Diagram

```
┌──────────────────────┐         ┌─────────────────────────────┐
│      Subject         │         │       <<interface>>         │
│     (NewsPortal)     │         │         Observer            │
├──────────────────────┤         ├─────────────────────────────┤
│ +observers: []       │         │ +update(subject): void      │
├──────────────────────┤         └──────────────┬──────────────┘
│ +attach()            │                        │ implements
│ +detach()            │         ┌──────────────┴──────────────┐
│ +notify()            │         ▼                              ▼
└──────────┬───────────┘  ┌──────────────────┐    ┌──────────────────┐
           │               │  EmailSubscriber  │    │   PushSubscriber │
           │               ├──────────────────┤    ├──────────────────┤
           └──────────────→│ +update()        │    │ +update()        │
               notifies    └──────────────────┘    └──────────────────┘
```

---

## 🔍 Step-by-step Trace

**Scenario:** User subscribe email + push, news thay đổi.

```
Bước 1: portal.attach(email1) → observers = [email1]
Bước 2: portal.attach(push1)  → observers = [email1, push1]
Bước 3: portal.setNews('Breaking: AI!')
  → this.news = 'Breaking: AI!'
  → this.notify()

Bước 4: notify() loops through observers:
  Loop 1: email1.update(portal)
    → portal.getNews() → 'Breaking: AI!'
    → 📧 Email sent

  Loop 2: push1.update(portal)
    → portal.getNews() → 'Breaking: AI!'
    → 🔔 Push sent

→ Subject không biết email1 hay push1 là gì!
→ Chỉ biết "có Observer interface" → gọi update()
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Cách dùng Observer |
|--------------------|-------------------|
| **DOM Events** | `element.addEventListener('click', handler)` |
| **Redux Store** | `store.subscribe(() => rerender())` |
| **RxJS** | Observable + Observer + subscription |
| **Vue 2 `watch`** | `watch(() => this.value, callback)` |
| **Java `java.util.Observer`** | Deprecated nhưng là implementation gốc |
| **Kafka / Redis Pub/Sub** | Topic-based publish/subscribe |
| **Angular `Subject`** | `BehaviorSubject`, `ReplaySubject` |

---

## 📊 So sánh với Patterns liên quan

| Criteria | **Observer** | Mediator | Event Bus |
|----------|-------------|----------|-----------|
| Communication | Subject → Observers | Objects ↔ Mediator | Any → Any |
| Coupling | Subject tách biệt observers | Mọi object tách biệt nhau | Loose coupling |
| Central point | Subject (per observable) | Mediator (central) | Event Bus (global) |
| Use case | 1:many, push-based | Many:many, complex interaction | Distributed events |

---

## 💻 TypeScript Implementation

```typescript
// ─────────────────────────────────────────
// Example: Reactive State (mini-Redux)
// ─────────────────────────────────────────

type Listener<T> = (state: T) => void;

class ReactiveStore<T> {
  private state: T;
  private listeners: Listener<T>[] = [];

  constructor(initialState: T) {
    this.state = initialState;
  }

  // Observer pattern: subscribe
  subscribe(listener: Listener<T>): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  // Update state → auto notify
  setState(partial: Partial<T>): void {
    this.state = { ...this.state, ...partial };
    this.emit();
  }

  getState(): T {
    return this.state;
  }
}

// Usage
interface AppState {
  user: string | null;
  theme: 'light' | 'dark';
  notifications: number;
}

const store = new ReactiveStore<AppState>({
  user: null,
  theme: 'light',
  notifications: 0
});

// Observer 1: Theme switcher
const unsubTheme = store.subscribe(state => {
  document.body.dataset.theme = state.theme;
  console.log(`🎨 Theme changed to ${state.theme}`);
});

// Observer 2: Notification badge
const unsubNotif = store.subscribe(state => {
  const badge = document.querySelector('.notification-badge');
  if (badge) badge.textContent = String(state.notifications);
  console.log(`🔔 Notifications: ${state.notifications}`);
});

// Observer 3: User status
const unsubUser = store.subscribe(state => {
  const nav = document.querySelector('.user-nav');
  if (nav) nav.textContent = state.user ?? 'Login';
  console.log(`👤 User: ${state.user ?? 'Guest'}`);
});

// Trigger updates — observers tự động update!
store.setState({ user: 'john_doe', theme: 'dark' });
// 🎨 Theme changed to dark
// 🔔 Notifications: 0
// 👤 User: john_doe

store.setState({ notifications: 5 });
// 🎨 Theme changed to dark  (bị gọi lại vì full state)
// 🔔 Notifications: 5
// 👤 User: john_doe

unsubNotif(); // Unsubscribe notification badge
store.setState({ theme: 'light' });
// 🎨 Theme changed to light
// 👤 User: john_doe
// (Notification không được gọi — đã unsubscribe)
```

---

## 📝 LeetCode Problems áp dụng

- [Design Twitter](https://leetcode.com/problems/design-twitter/) — Observer: user posts → followers see tweets
- [Find Bottom Left Tree Value](https://leetcode.com/problems/find-bottom-left-tree-value/) — level-order traversal = push-based observer
- [Exam Room](https://leetcode.com/problems/exam-room/) — Observer pattern khi seat thay đổi → notify students

---

## ✅ Pros / ❌ Cons

**Ưu điện:**
- ✅ **Open/Closed** — thêm observer mới không sửa Subject
- ✅ **Loose coupling** — Subject và Observers hoàn toàn tách biệt
- ✅ **Dynamic relationships** — subscribe/unsubscribe lúc runtime
- ✅ **Broadcast communication** — một state change → notify tất cả

**Nhược điểm:**
- ❌ **Memory leaks** — nếu quên unsubscribe → observer không bị GC
- ❌ **Order không đảm bảo** — thứ tự observers được notify không xác định
- ❌ **Cascade updates** — observer A notify → observer B notify → infinite loop
- ❌ **Unexpected notifications** — nếu Subject thay đổi quá nhiều → performance

---

## ⚠️ Khi nào nên / không nên dùng

**Nên dùng khi:**
- ✅ Một object thay đổi → nhiều objects khác cần react
- ✅ Cần subscribe/unsubscribe động
- ✅ Want to maintain **loose coupling** giữa publisher và subscribers

**Không nên dùng khi:**
- ❌ Observer cần thay đổi Subject — có thể tạo circular updates
- ❌ Đơn giản quá — chỉ cần callback là đủ
- ❌ Cần synchronous update ordering nghiêm ngặt

---

## 🚫 Common Mistakes / Pitfalls

1. **Quên unsubscribe → memory leak**
   ```typescript
   // ❌ Sai: Component unmount nhưng không cleanup
   class Component {
     ngOnInit() {
       this.store.subscribe(state => this.render(state));
       // ❌ Khi component unmount, listener vẫn tồn tại!
     }
   }

   // ✅ Đúng: Luôn unsubscribe
   ngOnInit() {
     this.unsubscribe = this.store.subscribe(state => this.render(state));
   }

   ngOnDestroy() {
     this.unsubscribe(); // ✅ Cleanup khi unmount
   }
   ```

2. **Notification trong vòng lặp → infinite loop**
   ```typescript
   // ❌ Sai: Observer update Subject → Subject notify → observer update...
   observer.update(subject: Subject) {
     subject.setState({ ... }); // Subject thay đổi → notify lại → infinite loop!
   }
   ```

---

## 🎤 Interview Q&A

**Q: Observer Pattern là gì? Khi nào dùng?**
> A: Observer định nghĩa subscription mechanism — một object (Subject) maintain danh sách observers và notify tất cả khi state thay đổi. Mỗi observer implement interface có method `update()`. Dùng khi một object thay đổi → nhiều objects khác cần react. Ví dụ: DOM events, Redux store, message brokers, newsletter.

**Q: Pub/Sub khác Observer thế nào?**
> A: Observer là direct subscription — Subject trực tiếp gọi `observer.update()`. Pub/Sub dùng Event Bus/Channel trung gian — publisher gửi message vào channel, subscribers đăng ký vào channel mà không biết publisher là ai. Pub/Sub decoupled hơn, scale tốt hơn vì publisher và subscriber không biết nhau.

**Q: Làm sao tránh memory leak trong Observer?**
> A: Luôn cung cấp `detach()` hoặc trả về unsubscribe function từ `subscribe()`. Trong frontend, nhớ cleanup subscription trong `componentWillUnmount` / `ngOnDestroy`. Trong garbage-collected languages, object không được referenced mới bị GC, nên subscription giữ reference → leak.
