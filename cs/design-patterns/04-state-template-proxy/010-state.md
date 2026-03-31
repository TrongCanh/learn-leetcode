# 🔀 State Pattern

## 🎯 Problem & Motivation

**Bài toán thực tế:** Object có behavior **thay đổi hoàn toàn** tùy theo internal state. Logic code trở nên rối với `if/else` kiểm tra state ở khắp nơi.

**Ví dụ thực tế:** Vending machine:
- **Idle state** → nhận tiền
- **Has money** → chọn sản phẩm
- **Dispensing** → đang bán
- **Out of stock** → từ chối

Nếu dùng `if/else`: mỗi action đều phải check state → hàng chục `if/else` trùng lặp.

```typescript
// ❌ if/else hell — state rải khắp nơi!
class VendingMachine {
  private state: 'idle' | 'hasMoney' | 'dispensing' = 'idle';

  insertCoin() {
    if (this.state === 'idle') {
      this.state = 'hasMoney';
    }
  }

  selectProduct() {
    if (this.state === 'idle') {
      console.log('Insert coin first!');
    } else if (this.state === 'hasMoney') {
      this.state = 'dispensing';
    }
    // ⚠️ Mỗi method đều phải check state
  }

  dispense() {
    if (this.state === 'dispensing') {
      // dispense
      this.state = 'idle';
    }
    // ⚠️ Thêm state mới? Sửa TẤT CẢ methods!
  }
}
```

→ **Hậu quả:** `if/else` trùng lặp ở mọi method. Thêm state mới → sửa tất cả methods. State transition logic phân tán khắp nơi.

**State giải quyết:** Mỗi state được đóng gói thành **class riêng**. Object delegate behavior sang current state class — khi state thay đổi, behavior tự thay đổi theo.

---

## 💡 Use Cases

1. **Order/Workflow Systems** — Order: Pending → Processing → Shipped → Delivered → Cancelled
2. **Document State** — Draft → Review → Approved → Published
3. **TCP Connection** — Closed → Listen → Syn Sent → Established → Fin Wait → Closed
4. **Media Player** — Stopped → Playing → Paused → Buffering → Stopped
5. **Game Character** — Idle → Walking → Running → Jumping → Falling
6. **Auth Flow** — LoggedOut → LoginForm → TwoFactor → LoggedIn → LoggingOut

---

## ❌ Before (Không dùng State)

```typescript
// ❌ if/else trùng lặp ở mọi method
class Document {
  private state: 'draft' | 'review' | 'published' = 'draft';

  publish(user: string) {
    if (this.state === 'draft') {
      if (user === 'author') { this.state = 'review'; }
    } else if (this.state === 'review') {
      if (user === 'editor') { this.state = 'published'; }
    }
    // ⚠️ Mỗi method đều có if/else giống nhau!
  }

  edit(user: string) {
    if (this.state === 'draft') { /* allow */ }
    else if (this.state === 'review') { /* deny */ }
    else if (this.state === 'published') { /* deny */ }
  }

  approve(editor: string) {
    if (this.state === 'review') { this.state = 'published'; }
  }
  // ⚠️ Thêm state mới? Tìm tất cả if/else và sửa!
}
```

→ **Hậu quả:** State logic phân tán. Thêm state → sửa mọi method.

---

## ✅ After (Dùng State)

```typescript
// ─────────────────────────────────────────
// 1. State Interface — contract cho mỗi state
// ─────────────────────────────────────────
interface DocumentState {
  publish(context: DocumentContext, user: string): void;
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
    console.log(`🔄 State: ${state.constructor.name.replace('State', '')}`);
  }

  // Delegate all actions to current state
  publish(user: string) { this.state.publish(this, user); }
  edit(user: string, content: string) { this.state.edit(this, user, content); }
  review(editor: string) { this.state.review(this, editor); }
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
    console.log('❌ Document must be published first');
  }
}

class ReviewState implements DocumentState {
  publish(context: DocumentContext, user: string): void {
    console.log('❌ Already submitted for review. Wait for editor.');
  }

  edit(context: DocumentContext, user: string, content: string): void {
    console.log('❌ [Review] Cannot edit while in review.');
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
    console.log('❌ Already published.');
  }
}

// ─────────────────────────────────────────
// 4. Client — gọi context mà không biết state
// ─────────────────────────────────────────
const doc = new DocumentContext();

doc.edit('author', 'Chapter 1...');
// ✏️ [Draft] author editing: "Chapter 1..."

doc.publish('author');
// 📤 Author submitting for review...
// 🔄 State: Review

doc.edit('author', 'New content...');
// ❌ [Review] Cannot edit while in review.

doc.review('editor_jane');
// ✅ [Review] Editor "editor_jane" approved!
// 🔄 State: Published

doc.publish('author');
// ❌ Already published!
```

---

## 🏗️ UML Diagram

```
┌─────────────────────┐
│       Context        │
│ (DocumentContext)  │
├─────────────────────┤
│ -state: State       │
├─────────────────────┤
│ +setState()         │
│ +publish()          │
│ +edit()             │
│ +review()            │
└──────────┬──────────┘
           │ delegates
           ▼
┌──────────────────────────────┐
│    <<interface>>             │
│      DocumentState            │
├──────────────────────────────┤
│ +publish(context, user)       │
│ +edit(context, user, content)│
│ +review(context, editor)     │
└───────────┬──────────────────┘
            │ implements
┌───────────┼─────────────────────────┐
▼           ▼                         ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│    DraftState     │ │   ReviewState    │ │  PublishedState  │
├──────────────────┤ ├──────────────────┤ ├──────────────────┤
│ +publish(): ✅    │ │ +publish(): ❌   │ │ +publish(): ❌   │
│ +edit(): ✅      │ │ +edit(): ❌      │ │ +edit(): ❌      │
│ +review(): ❌    │ │ +review(): ✅───▶│ │ +review(): ❌    │
└──────────────────┘ └──────────────────┘ └──────────────────┘
                      setState(PublishedState)
```

---

## 🔍 Step-by-step Trace

**Scenario:** Document từ Draft → Review → Published.

```
Bước 1: doc.edit('author', 'content')
  → context.state = DraftState
  → DraftState.edit() → ✏️ Editing...

Bước 2: doc.publish('author')
  → DraftState.publish()
    → user === 'author' → TRUE
    → context.setState(new ReviewState())
    → 🔄 State: Review

Bước 3: doc.edit('author', 'new')
  → ReviewState.edit() → ❌ Cannot edit

Bước 4: doc.review('editor_jane')
  → ReviewState.review()
    → ✅ Editor approved
    → context.setState(new PublishedState())
    → 🔄 State: Published

→ DocumentContext hoàn toàn không biết state transitions!
→ Chỉ gọi methods → state tự quyết định transition
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Chi tiết implementation |
|--------------------|------------------------|
| **TCP Protocol** | State machine: LISTEN, SYN_SENT, ESTABLISHED, FIN_WAIT... |
| **Redux** | Store state machine: actions trigger transitions |
| **Angular Router** | State machine cho route transitions |
| **Order System (Shopify)** | Pending → Processing → Fulfilled → Cancelled |
| **Media Players** | paused → playing → buffering → paused |

---

## 📊 So sánh với Patterns liên quan

| Criteria | **State** | Strategy | Template Method |
|----------|----------|----------|----------------|
| Ai quyết định next state? | **State tự quyết** (transition logic) | Client chủ động chọn | Base class định sẵn |
| Khi nào thay đổi? | Automatic (after action) | Manual (client gọi setter) | Compile time |
| Object có biết state tiếp theo? | ✅ Có | ❌ Không | ❌ Không |
| Mục đích | State machine | Algorithm selection | Skeleton algorithm |

---

## 💻 TypeScript Implementation

### Version 1: TCP Connection State Machine

```typescript
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
    console.log('📤 [Listen] SYN → SYN+ACK...');
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
conn.open();       // 🔌 [Closed] Opening → Listen
conn.acknowledge(); // 📤 SYN+ACK → Established
conn.acknowledge(); // ✅ Data acknowledged
conn.close();      // 🔌 Closing → FinWait
conn.acknowledge(); // 🔌 FIN received → Closed
```

---

## ⚖️ Trade-offs & Common Mistakes

### ✅ Khi nào nên dùng

- ✅ Object có **nhiều states** với behavior khác nhau rõ ràng
- ✅ State transitions phức tạp, logic phân tán khắp nơi nếu dùng if/else
- ✅ Cần **state machine** với clear transitions

### ❌ Khi nào không nên dùng

- ❌ Chỉ có 2 states đơn giản — boolean hoặc enum đủ
- ❌ Behavior thay đổi theo external config — dùng Strategy

### 🚫 Common Mistakes

**1. State không access được context để transition**
```typescript
// ❌ Sai: State không thể gọi setState() vì không có context
class BadState implements State {
  publish() {
    // ❌ Làm sao gọi context.setState()?
  }
}

// ✅ Đúng: State nhận context để transition
class GoodState implements State {
  publish(context: Context) {
    context.setState(new NextState());
  }
}
```

**2. Dùng State khi chỉ cần Strategy**
```typescript
// ❌ Thừa: Client tự quyết strategy, không phải state machine
if (user.prefersDarkMode) {
  theme.setStrategy(new DarkTheme());
}
// → Dùng Strategy, không phải State
```

---

## 🧪 Testing Strategies

```typescript
describe('DocumentContext', () => {
  it('should transition from draft to published', () => {
    const doc = new DocumentContext();

    doc.publish('author');
    expect(doc).toBeDefined();

    doc.review('editor');
    expect(doc).toBeDefined();
  });

  it('should deny edit in review state', () => {
    const doc = new DocumentContext();
    doc.publish('author');

    let error = '';
    const originalLog = console.log;
    console.log = (msg: string) => { error = msg; };

    doc.edit('author', 'new content');

    console.log = originalLog;
    expect(error).toContain('Cannot edit');
  });
});
```

---

## 🎤 Interview Q&A

**Q: State Pattern là gì? Khi nào dùng?**
> A: State đóng gói behavior vào các state classes riêng biệt. Context delegate behavior sang current state — khi state thay đổi, behavior tự thay đổi. Dùng khi object có nhiều states với transitions rõ ràng (document: draft→review→published, TCP: listen→established→closed). Quan trọng: state nhận context để tự quyết định khi nào transition.

**Q: State khác Strategy như thế nào?**
> A: Strategy: **client chủ động** chọn algorithm qua setter. State: **object tự thay đổi** behavior khi internal state thay đổi — state class chứa transition logic. State là state machine; Strategy là algorithm selection. State transition là automatic (sau action); Strategy swap là manual (client gọi setter).
