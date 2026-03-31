# 🔀 State Pattern

## 🎯 Problem & Motivation

**Bài toán:** Object có behavior **thay đổi hoàn toàn** tùy theo internal state. Logic code trở nên rối với `if/else` kiểm tra state ở khắp nơi.

**Ví dụ thực tế:** Vending machine:
- **Idle state** → nhận tiền
- **Has money** → chọn sản phẩm
- **Dispensing** → đang bán
- **Out of stock** → từ chối

Nếu dùng `if/else`: mỗi action đều phải check state → hàng chục `if/else` trùng lặp.

**State giải quyết:** Mỗi state được đóng gói thành **class riêng**. Object delegate behavior sang current state class — khi state thay đổi, behavior tự thay đổi theo.

---

## 💡 Use Cases

1. **Order/Workflow Systems** — Order: Pending → Processing → Shipped → Delivered → Cancelled
2. **Document State** — Draft → Review → Approved → Published
3. **TCP Connection** — Closed → Listen → Syn Sent → Established → Fin Wait → Closed
4. **Media Player** — Stopped → Playing → Paused → Stopped
5. **Game Character** — Idle → Walking → Running → Jumping → Falling
6. **Auth Flow** — LoggedOut → LoginForm → TwoFactor → LoggedIn → LoggingOut

---

## ❌ Before (Không dùng State)

```typescript
// ❌ if/else hell — state rải khắp nơi!
class Document {
  private state: 'draft' | 'review' | 'published' = 'draft';
  private currentUser: string | null = null;

  publish(user: string) {
    if (this.state === 'draft') {
      if (user === 'author') {
        this.state = 'review';
        console.log('📤 Sent to review');
      } else {
        console.log('❌ Only author can submit for review');
      }
    } else if (this.state === 'review') {
      if (user === 'editor') {
        this.state = 'published';
        console.log('✅ Published!');
      } else {
        console.log('❌ Only editor can publish');
      }
    } else {
      console.log('❌ Already published');
    }
  }

  edit(user: string, content: string) {
    if (this.state === 'draft') {
      console.log(`✏️ ${user} editing...`);
    } else if (this.state === 'review') {
      console.log(`❌ Cannot edit while in review`);
    } else {
      console.log(`❌ Cannot edit published document`);
    }
  }

  approve(editor: string) {
    if (this.state === 'review') {
      this.state = 'published';
    }
  }
  // ⚠️ Thêm state mới? Tìm tất cả if/else và sửa!
}
```

→ **Vấn đề:** `if/else` trùng lặp ở mọi method. Thêm state mới → sửa tất cả methods. State transition logic phân tán khắp nơi.

---

## ✅ After (Dùng State)

```typescript
// ─────────────────────────────────────────
// 1. State Interface — contract cho mỗi state
// ─────────────────────────────────────────
interface DocumentState {
  publish(context: DocumentContext): void;
  edit(context: DocumentContext, user: string, content: string): void;
  review(context: DocumentContext, editor: string): void;
}

// ─────────────────────────────────────────
// 2. Context — maintain current state, delegate to state
// ─────────────────────────────────────────
class DocumentContext {
  private state: DocumentState;

  constructor() {
    this.state = new DraftState(); // Initial state
  }

  setState(state: DocumentState) {
    this.state = state;
    console.log(`🔄 State changed to: ${state.constructor.name}`);
  }

  // Delegate all actions to current state
  publish(user: string) {
    this.state.publish(this, user);
  }

  edit(user: string, content: string) {
    this.state.edit(this, user, content);
  }

  review(editor: string) {
    this.state.review(this, editor);
  }
}

// ─────────────────────────────────────────
// 3. Concrete States — encapsulate behavior cho mỗi state
// ─────────────────────────────────────────

class DraftState implements DocumentState {
  publish(context: DocumentContext, user: string): void {
    if (user === 'author') {
      console.log('📤 Author submitting for review...');
      context.setState(new ReviewState());
    } else {
      console.log('❌ Only author can submit for review');
    }
  }

  edit(context: DocumentContext, user: string, content: string): void {
    console.log(`✏️ [Draft] ${user} editing: "${content}"`);
  }

  review(context: DocumentContext, editor: string): void {
    console.log('❌ Document must be published first before reviewing');
  }
}

class ReviewState implements DocumentState {
  publish(context: DocumentContext, user: string): void {
    console.log('❌ Already submitted for review. Wait for editor.');
  }

  edit(context: DocumentContext, user: string, content: string): void {
    console.log('❌ [Review] Cannot edit while in review. Request changes instead.');
  }

  review(context: DocumentContext, editor: string): void {
    console.log(`✅ [Review] Editor "${editor}" approved! Publishing...`);
    context.setState(new PublishedState());
  }
}

class PublishedState implements DocumentState {
  publish(context: DocumentContext, user: string): void {
    console.log('❌ Already published!');
  }

  edit(context: DocumentContext, user: string, content: string): void {
    console.log('❌ [Published] Cannot edit. Create a new version.');
  }

  review(context: DocumentContext, editor: string): void {
    console.log('❌ Already published. Archive and create new document.');
  }
}

// ─────────────────────────────────────────
// 4. Client — gọi context mà không biết state
// ─────────────────────────────────────────
const doc = new DocumentContext();

doc.edit('author', 'Chapter 1 content...');
// ✏️ [Draft] author editing: "Chapter 1 content..."

doc.publish('author');
// 📤 Author submitting for review...
// 🔄 State changed to: ReviewState

doc.edit('author', 'New content...');
// ❌ [Review] Cannot edit while in review. Request changes instead.

doc.review('editor_jane');
// ✅ [Review] Editor "editor_jane" approved! Publishing...
// 🔄 State changed to: PublishedState

doc.publish('author');
// ❌ Already published!
```

→ **Cải thiện:** Thêm state mới? Tạo class mới implements `DocumentState`. Context hoàn toàn không biết state cụ thể. State transition logic nằm trong mỗi state class.

---

## 🏗️ UML Diagram

```
┌─────────────────────┐         ┌──────────────────────────┐
│       Context       │         │    <<interface>>         │
│  (DocumentContext)  │────────▶│      DocumentState       │
├─────────────────────┤         ├──────────────────────────┤
│ -state: State       │         │ +publish()               │
├─────────────────────┤         │ +edit()                  │
│ +setState()         │         │ +review()                │
│ +request()          │         └───────────┬──────────────┘
└─────────────────────┘                      │ implements
                                            │
        ┌───────────────────────────────────┼────────────────────┐
        ▼                                   ▼                    ▼
┌─────────────────┐              ┌─────────────────┐    ┌─────────────────┐
│  DraftState     │              │  ReviewState     │    │ PublishedState  │
├─────────────────┤              ├─────────────────┤    ├─────────────────┤
│ +publish()      │──setState()─▶│ +review()       │───▶│ +publish()      │
│ +edit()         │              │ +edit() ❌      │    │ +edit() ❌      │
│ +review() ❌    │              │                 │    │                 │
└─────────────────┘              └─────────────────┘    └─────────────────┘
```

---

## 🔍 Step-by-step Trace

**Scenario:** Document từ Draft → Review → Published.

```
Bước 1: doc.edit('author', 'content')
  → DraftState.edit() → ✏️ Editing...

Bước 2: doc.publish('author')
  → DraftState.publish()
    → user === 'author' → TRUE
    → context.setState(new ReviewState())
    → 🔄 State: ReviewState

Bước 3: doc.edit('author', 'new content')
  → ReviewState.edit()
    → ❌ Cannot edit while in review

Bước 4: doc.review('editor_jane')
  → ReviewState.review()
    → ✅ Editor approved
    → context.setState(new PublishedState())
    → 🔄 State: PublishedState

→ DocumentContext hoàn toàn không biết state transitions!
→ Chỉ gọi methods → state tự quyết định transition
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Cách dùng State |
|--------------------|-----------------|
| **TCP Protocol** | State machine: LISTEN, SYN_SENT, ESTABLISHED, FIN_WAIT... |
| **Redux** | Store state machine: actions trigger transitions |
| **Angular Router** | State machine cho route transitions |
| **Order System (Shopify)** | Pending → Processing → Fulfilled → Cancelled |
| **Media Players** | paused → playing → buffering → paused |

---

## 📊 So sánh với Patterns liên quan

| Criteria | **State** | Strategy | Template Method |
|----------|----------|----------|-----------------|
| Ai quyết định next state? | **State tự quyết** (transition logic) | Client chủ động chọn | Base class định sẵn |
| Khi nào thay đổi? | Automatic (after action) | Manual (client calls setter) | Compile time |
| Object có biết state tiếp theo? | ✅ Có | ❌ Không | ❌ Không |
| Use case | State machine | Algorithm selection | Skeleton algorithm |

---

## 💻 TypeScript Implementation

```typescript
// ─────────────────────────────────────────
// Example: TCP Connection State Machine
// ─────────────────────────────────────────

interface TcpState {
  open(connection: TcpConnection): void;
  close(connection: TcpConnection): void;
  acknowledge(connection: TcpConnection): void;
}

class TcpConnection {
  private state: TcpState;

  constructor() {
    this.state = new ClosedState();
  }

  setState(state: TcpState) {
    this.state = state;
  }

  open() { this.state.open(this); }
  close() { this.state.close(this); }
  acknowledge() { this.state.acknowledge(this); }
}

class ClosedState implements TcpState {
  open(conn: TcpConnection) {
    console.log('🔌 [Closed] Opening connection...');
    conn.setState(new ListenState());
  }
  close(conn: TcpConnection) { console.log('❌ Already closed'); }
  acknowledge(conn: TcpConnection) { console.log('❌ No connection'); }
}

class ListenState implements TcpState {
  open(conn: TcpConnection) { console.log('🔌 Already listening'); }
  close(conn: TcpConnection) {
    console.log('🔌 [Listen] Closing...');
    conn.setState(new ClosedState());
  }
  acknowledge(conn: TcpConnection) {
    console.log('📤 [Listen] SYN received, sending SYN+ACK...');
    conn.setState(new EstablishedState());
  }
}

class EstablishedState implements TcpState {
  open(conn: TcpConnection) { console.log('🔌 Already established'); }
  close(conn: TcpConnection) {
    console.log('🔌 [Established] Closing gracefully...');
    conn.setState(new FinWaitState());
  }
  acknowledge(conn: TcpConnection) {
    console.log('✅ [Established] Data acknowledged');
  }
}

class FinWaitState implements TcpState {
  open(conn: TcpConnection) { console.log('❌ Connection closing'); }
  close(conn: TcpConnection) { console.log('🔌 Already closing'); }
  acknowledge(conn: TcpConnection) {
    console.log('🔌 [FinWait] FIN received, closing...');
    conn.setState(new ClosedState());
  }
}

// Usage
const conn = new TcpConnection();
conn.open();      // 🔌 Opening → Listen
conn.acknowledge(); // 📤 SYN+ACK → Established
conn.acknowledge(); // ✅ Data acknowledged
conn.close();     // 🔌 Closing → FinWait
conn.acknowledge(); // 🔌 FIN received → Closed
```

---

## 📝 LeetCode Problems áp dụng

- [Design Phone Directory](https://leetcode.com/problems/design-phone-directory/) — available/allocated state management
- [Number of Island](https://leetcode.com/problems/number-of-islands/) — DFS state machine (visited/unvisited)
- [Can Place Flowers](https://leetcode.com/problems/can-place-flowers/) — slot state: empty/occupied

---

## ✅ Pros / ❌ Cons

**Ưu điểm:**
- ✅ **Single Responsibility** — mỗi state class một trách nhiệm
- ✅ **Open/Closed** — thêm state mới không sửa code cũ
- ✅ **State logic rõ ràng** — transition logic nằm trong state class
- ✅ **Loose coupling** — context không biết state cụ thể

**Nhược điểm:**
- ❌ **Overkill** — nếu chỉ có 2-3 states đơn giản, if/else đủ
- ❌ **State explosion** — mỗi state là một class
- ❌ **States phụ thuộc lẫn nhau** — nếu transition logic phức tạp

---

## ⚠️ Khi nào nên / không nên dùng

**Nên dùng khi:**
- ✅ Object có **nhiều states** với behavior khác nhau rõ ràng
- ✅ State transitions phức tạp, logic phân tán khắp nơi nếu dùng if/else
- ✅ Cần **state machine** với clear transitions

**Không nên dùng khi:**
- ❌ Chỉ có 2 states đơn giản — boolean hoặc enum đủ
- ❌ Behavior thay đổi theo external config — dùng Strategy

---

## 🚫 Common Mistakes / Pitfalls

1. **State quyết định transition nhưng không có context access**
   ```typescript
   // ❌ Sai: State không thể transition vì không access context
   class BadState implements State {
     publish() {
       // ❌ Làm sao gọi setState()?
       // Cần context truyền vào!
     }
   }

   // ✅ Đúng: State nhận context để transition
   class GoodState implements State {
     publish(context: Context) {
       context.setState(new NextState());
     }
   }
   ```

---

## 🎤 Interview Q&A

**Q: State Pattern là gì? Khi nào dùng?**
> A: State đóng gói behavior vào các state classes riêng biệt. Context delegate behavior sang current state — khi state thay đổi, behavior tự thay đổi. Dùng khi object có nhiều states với transitions rõ ràng (document: draft→review→published, TCP: listen→established→closed).

**Q: State khác Strategy như thế nào?**
> A: Strategy: **client chủ động** chọn algorithm qua setter. State: **object tự thay đổi** behavior khi internal state thay đổi — state class chứa transition logic. State là state machine; Strategy là algorithm selection.
