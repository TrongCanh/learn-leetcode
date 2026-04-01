# Components — Function vs Class, Bản Chất Component

## Câu hỏi mở đầu

```jsx
// Bạn viết cái này mỗi ngày:
function Welcome({ name }) {
  return <h1>Hello, {name}</h1>;
}

// Hoặc cái này (legacy):
class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}
```

Cả hai đều render ra cùng thứ. Vậy:

- Component thực sự là gì?
- Function component khác class component thế nào?
- Tại sao phải viết hoa? `<welcome>` có được không?
- `this` trong class component là cái gì?
- Component phải pure — pure có nghĩa là gì?

---

## 1. Component Là Gì — Định Nghĩa Chính Xác

> **Component = Function (hoặc Class) nhận input (props) → trả về React element (JSX).**

```
┌──────────────────────────────────────────────────────────────┐
│  Component                                                    │
│                                                               │
│  Input: props (read-only)                                    │
│    ↓                                                          │
│  Logic: compute, transform, branch                          │
│    ↓                                                          │
│  Output: React element (JSX)                                  │
│    ↓ = plain object                                          │
│  React: render → diff → update DOM                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Đặc Điểm Quan Trọng Nhất

Component phải behave như **pure function** với props:

```
pure function:
  - Cùng input → cùng output
  - Không có side effects
  - Không modify input

React component:
  - Cùng props → cùng JSX output
  - Side effects phải ở useEffect (hoặc class lifecycle)
  - Props là read-only
```

---

## 2. Function Component — Hiện Đại (2024+)

### Cú Pháp

```jsx
// Function declaration
function Welcome({ name, age }) {
  return <h1>Hello, {name} (age {age})</h1>;
}

// Arrow function
const Welcome = ({ name, age }) => {
  return <h1>Hello, {name}</h1>;
};

// Rút gọn khi return trực tiếp
const Welcome = ({ name }) => <h1>Hello, {name}</h1>;
```

### Props = Arguments

```jsx
// Props nhận vào là plain object
function UserCard({ name, age, isActive, onClick }) {
  // props = { name: 'Alice', age: 30, isActive: true, onClick: fn }
  return (
    <div className={isActive ? 'active' : 'inactive'}>
      <h2>{name}</h2>
      <p>Age: {age}</p>
      <button onClick={onClick}>View Profile</button>
    </div>
  );
}

// Gọi với:
<UserCard
  name="Alice"
  age={30}
  isActive={true}
  onClick={() => navigate('/profile/alice')}
/>
```

### Props Là Read-Only

```jsx
// ❌ SAI TUYỆT ĐỐI — không được mutate props
function BadComponent({ count }) {
  count = count + 1; // ❌ Assignment to parameter
  return <div>{count}</div>;
}

// ❌ SAI — không được tạo side effect
function BadComponent({ name }) {
  document.title = name; // ❌ Side effect trong render
  return <div>{name}</div>;
}

// ✅ ĐÚNG
function GoodComponent({ name }) {
  const displayName = name.toUpperCase(); // ✅ Tạo biến mới
  return <div>{displayName}</div>;
}

// ✅ ĐÚNG — side effect đúng chỗ
function GoodComponent({ name }) {
  useEffect(() => {
    document.title = name; // ✅ useEffect = side effect mechanism
  }, [name]);
  return <div>{name}</div>;
}
```

---

## 3. Tại Sao Component Phải Viết Hoa?

### JSX Transform Phân Biệt Bằng Tag Name

```jsx
// <div> → DOM element
const element = <div>content</div>;

// <Welcome> → React Component
const element = <Welcome name="Alice" />;
```

Babel transform JSX theo quy tắc:

```
Tag viết thường (lowercase):
  <div>  →  React.createElement('div', ...)
           → string tag → DOM element

Tag viết hoa (PascalCase):
  <Welcome>  →  React.createElement(Welcome, ...)
              → variable reference → React Component
```

### Demo Bug

```jsx
// ❌ Component viết thường → React treat như DOM element
function welcome({ name }) { // Function name là 'welcome'
  return <div>{name}</div>;
}

// Khi dùng:
<welcome name="Alice" />
// → Babel transform thành: React.createElement('welcome', { name: 'Alice' })
// → React tìm DOM element '<welcome>' → KHÔNG CÓ → lỗi!

// ✅ ĐÚNG — viết hoa
function Welcome({ name }) {
  return <div>{name}</div>;
}

<Welcome name="Alice" />
// → Babel transform: React.createElement(Welcome, { name: 'Alice' })
// → React tìm component 'Welcome' → found ✅
```

---

## 4. Class Component — Legacy Nhưng Vẫn Quan Trọng

### Cú Pháp

```jsx
class Counter extends React.Component {
  // 1. State declaration
  state = {
    count: 0
  };

  // 2. Event handler binding
  handleClick = () => {
    this.setState({ count: this.state.count + 1 });
  };

  // 3. Render method
  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={this.handleClick}>Increment</button>
      </div>
    );
  }
}
```

### `this` Trong Class Component

Đây là phần **khó hiểu nhất** của class component.

```
`this` trong class component = INSTANCE của class đó

Instance có:
  ├── this.props        → props được truyền vào
  ├── this.state        → state object
  ├── this.setState()  → method để update state
  ├── this.render()    → render method
  └── Lifecycle methods  → componentDidMount, etc.
```

### `this` Binding — Vấn Đề Thực Sự

```jsx
class Button extends React.Component {
  state = { clicked: false };

  // ❌ handleClick được gọi mà không có `this` binding
  handleClick() {
    this.setState({ clicked: true }); // TypeError: Cannot read...
  }

  render() {
    // onClick gọi handleClick() nhưng `this` không được bind!
    return <button onClick={this.handleClick}>Click me</button>;
    //                                        ↑
    //     onClick gọi: handleClick() → this = undefined
  }
}
```

### Ba Cách Fix `this` Binding

```jsx
// ─── Cách 1: Bind trong constructor (cũ) ───
class Button extends React.Component {
  state = { clicked: false };

  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this); // ✅ bind
  }

  handleClick() {
    this.setState({ clicked: true });
  }

  render() {
    return <button onClick={this.handleClick}>Click</button>;
  }
}

// ─── Cách 2: Class field arrow function (recommended) ───
class Button extends React.Component {
  state = { clicked: false };

  handleClick = () => {          // ✅ Arrow function = lexical this
    this.setState({ clicked: true });
  };

  render() {
    return <button onClick={this.handleClick}>Click</button>;
  }
}

// ─── Cách 3: Arrow function trong render (tránh dùng) ───
class Button extends React.Component {
  handleClick() {
    this.setState({ clicked: true });
  }

  render() {
    return (
      <button onClick={() => this.handleClick()}>
        Click
      </button>
    );
    // ⚠️ Arrow function TẠO MỚI MỖI RENDER
    // → child component re-render nếu nhận onClick prop
  }
}
```

---

## 5. Function vs Class — So Sánh Toàn Diện

| Khía cạnh | Function Component | Class Component |
|---|---|---|
| Syntax | Function thuần | Class extends React.Component |
| `this` | Không có `this` | `this` = instance, cần bind |
| State | `useState` hook | `this.state` + `this.setState` |
| Lifecycle | `useEffect` hook | `componentDidMount`, `componentDidUpdate`, etc. |
| Logic reuse | Custom Hooks | HOC, Render Props |
| Boilerplate | Ít | Nhiều |
| Bundle size | Nhỏ hơn | Lớn hơn (class instance overhead) |
| Performance | Tốt hơn | Có instance overhead |
| Recommended | ✅ Luôn dùng | ❌ Legacy |

### Khi Nào Vẫn Dùng Class Component?

```
Thực tế 2024:
  • Legacy codebase: có class components, vẫn hoạt động
  • Không cần migrate nếu đang hoạt động tốt
  • Class components KHÔNG bị deprecated (React team confirm)
  • Tuy nhiên: KHÔNG nên viết class components mới

Migration path:
  class → function + hooks = straightforward
```

---

## 6. Render Method — Pure Function Requirements

### Render Phải Trả Về JSX, Không Có Side Effects

```jsx
class BadComponent extends React.Component {
  render() {
    // ❌ Side effect: thay đổi DOM bên ngoài React
    document.title = `Count: ${this.state.count}`;

    // ❌ Side effect: gọi API
    fetch('/api/user').then(setUser);

    // ❌ Side effect: thay đổi state
    this.setState({ rendered: true });

    return <div>{this.state.count}</div>;
  }
}

class GoodComponent extends React.Component {
  render() {
    // ✅ Pure: chỉ compute và return JSX
    const doubled = this.state.count * 2;
    const status = this.state.active ? 'Active' : 'Inactive';
    return (
      <div>
        <span>{doubled}</span>
        <span>{status}</span>
      </div>
    );
  }

  componentDidMount() {
    // ✅ Side effects đúng chỗ: lifecycle methods
    document.title = `Count: ${this.state.count}`;
    fetch('/api/user').then(user => this.setState({ user }));
  }
}
```

---

## 7. Liên Hệ Với JavaScript Core

### Function Component = Regular Function

```javascript
// Function component là function thuần JavaScript
// Nó có [[Environment]] reference đến outer scope

function Welcome({ name }) {
  // Scope của Welcome = lexical scope nơi nó được define
  const greeting = `Hello, ${name}`;
  return <span>{greeting}</span>;
}

// JavaScript: Welcome là function
console.log(typeof Welcome); // "function"

// React: Welcome là component vì:
// 1. Nó là function
// 2. Nó trả về JSX (React element)
// 3. Nó bắt đầu bằng chữ hoa (quy ước)
```

### Class Component = Prototype Chain

```javascript
// Class component dùng prototype inheritance
class Counter extends React.Component {
  render() {
    return <div>{this.props.count}</div>;
  }
}

// Prototype chain:
// Counter.prototype có render method
// Counter instance có: props, state, setState, forceUpdate

// Instance creation:
const instance = new Counter({ count: 5 });
// instance có: props={count:5}, state={}, this=instance

// Component.render() được gọi với this=instance
```

---

## 8. Component Composition — Sức Mạnh Thực Sự

### Composition Thay Cho Kế Thừa

```jsx
// ❌ Kế thừa: Button extends BasicButton → ButtonWithIcon → ...
// → Tight coupling, khó maintain

// ✅ Composition: component nhận children, tự do layout
function Card({ children, title }) {
  return (
    <div className="card">
      {title && <h3 className="card-title">{title}</h3>}
      <div className="card-body">{children}</div>
    </div>
  );
}

// Dùng linh hoạt:
<Card title="User Profile">
  <Avatar src={user.avatar} />
  <Name>{user.name}</Name>
  <Bio>{user.bio}</Bio>
</Card>

<Card title="Settings">
  <ToggleOption label="Dark Mode" />
  <ToggleOption label="Notifications" />
</Card>
```

### Special Prop: `children`

```jsx
// children = nội dung giữa opening và closing tag
<Parent>
  <Child />       {/* children[0] */}
  <Child />       {/* children[1] */}
</Parent>

// Được truyền vào props.children
function Parent({ children }) {
  return <div className="parent">{children}</div>;
}
```

---

## 9. Các Traps Phổ Biến

### ❌ Trap 1: Component Viết Thường

```jsx
// ❌ SAI — lowercase → DOM element
function button({ label }) {
  return <button>{label}</button>;
}

// ✅ ĐÚNG — PascalCase → Component
function Button({ label }) {
  return <button>{label}</button>;
}
```

### ❌ Trap 2: Render Trả Về `undefined`

```jsx
// ❌ RENDER TRẢ VỀ undefined = blank screen!
function Component({ isLoggedIn }) {
  if (!isLoggedIn) return; // ❌ undefined!
  return <div>Content</div>;
}

// ✅ ĐÚNG: return null hoặc JSX
function Component({ isLoggedIn }) {
  if (!isLoggedIn) return null; // ✅
  return <div>Content</div>;
}
```

### ❌ Trap 3: `this.setState` Trong Render

```jsx
// ❌ SAI — setState trong render = infinite loop
class BadComponent extends React.Component {
  render() {
    if (this.state.count > 10) {
      this.setState({ count: 0 }); // ❌ Trigger re-render → loop!
    }
    return <div>{this.state.count}</div>;
  }
}
```

---

## 10. Câu Hỏi Phỏng Vấn

### Q1: Component là gì trong React?

**Trả lời:** Component là function hoặc class nhận props làm input và trả về React element (JSX) mô tả UI. Component phải behave như pure function: cùng props → cùng output, không side effects. Function component là function thuần. Class component kế thừa React.Component và có render method. Component là nền tảng của React — mọi thứ là component.

### Q2: Function component khác class component thế nào?

**Trả lời:** Function component là function thuần, không có instance, không có `this`. Dùng hooks cho state và lifecycle. Class component có instance, dùng `this.state`/`this.setState`, có lifecycle methods (`componentDidMount`, etc.). Function component hiện đại hơn, bundle size nhỏ hơn, được khuyến nghị dùng cho code mới. Class component vẫn hoạt động, không deprecated.

### Q3: Tại sao component phải viết hoa?

**Trả lời:** JSX transform dùng tag name để phân biệt DOM element và React component. Tag lowercase `<div>` → `createElement('div')` → DOM element. Tag PascalCase `<Welcome>` → `createElement(Welcome)` → React component (function/object reference). Viết thường → React tìm DOM element không tồn tại → lỗi.

### Q4: `this` trong class component là gì?

**Trả lời:** `this` trong class component trỏ đến **instance của class component**. Instance được React tạo khi render, chứa `props`, `state`, `setState`, `forceUpdate`, và các lifecycle methods. `this` phải được bind trong constructor hoặc dùng arrow function (class field) để event handlers giữ đúng `this`. Không bind → `this = undefined` khi event handler được gọi.

### Q5: Component phải pure — nghĩa là gì?

**Trả lời:** Pure component = cùng props → cùng JSX output, không side effects. Tương tự pure function trong JavaScript. Side effects (DOM manipulation, API calls, subscriptions) phải ở ngoài render: trong `useEffect` (function component) hoặc lifecycle methods (class component). Render phải chỉ compute và return — không thay đổi external state.

---

## 11. Thực Hành

### Bài 1: Class → Function Refactor

```jsx
// Refactor class component này thành function component:
// 1. state → useState
// 2. setState → setter từ useState
// 3. props.name → { name } destructure
// 4. Lifecycle → useEffect
// 5. Event handlers → arrow functions hoặc useCallback

class UserProfile extends React.Component {
  state = { followers: [], loading: true };

  async componentDidMount() {
    const res = await fetch(`/api/users/${this.props.userId}/followers`);
    const followers = await res.json();
    this.setState({ followers, loading: false });
  }

  handleFollow = () => {
    this.setState(prev => ({
      followers: [...prev.followers, { id: 'new', name: 'New User' }]
    }));
  };

  render() {
    if (this.state.loading) return <p>Loading...</p>;
    return (
      <div>
        <h2>{this.props.name}'s Followers</h2>
        <ul>
          {this.state.followers.map(f => (
            <li key={f.id}>{f.name}</li>
          ))}
        </ul>
        <button onClick={this.handleFollow}>Follow</button>
      </div>
    );
  }
}
```

### Bài 2: Component Composition

```jsx
// Tạo 4 components:
// 1. Modal — wrapper với backdrop, children content, close button
// 2. Modal.Header — title, subtitle
// 3. Modal.Body — scrollable content
// 4. Modal.Footer — action buttons

// Demo:
<Modal isOpen={showModal} onClose={() => setShow(false)}>
  <Modal.Header title="Confirm Delete" subtitle="This action cannot be undone" />
  <Modal.Body>
    Are you sure you want to delete this item?
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button>
    <Button variant="danger" onClick={handleDelete}>Delete</Button>
  </Modal.Footer>
</Modal>
```

---

## Checklist

- [ ] Component = function nhận props → trả về JSX
- [ ] Component phải viết hoa (PascalCase)
- [ ] Props là read-only — không được mutate
- [ ] `this` trong class component cần bind
- [ ] `render()` phải pure — không side effects
- [ ] Return `undefined` = blank screen, dùng `null`
- [ ] `children` prop = composition power
- [ ] Function component + hooks = cách hiện đại (2024+)

---

*Last updated: 2026-04-01*
