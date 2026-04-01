# Props — Data Flow Một Chiều

## Câu hỏi mở đầu

Bạn có component tree:

```
App (state: user, theme, notifications)
  └── Layout
        └── Sidebar
              └── NavBar
                    └── UserMenu
                          └── Avatar (cần: user.avatar)
```

Bạn phải truyền `user.avatar` qua **4 levels** dù chỉ có `Avatar` cần nó. Đây gọi là **prop drilling**.

- Tại sao React bắt buộc data flow một chiều?
- Props drilling có phải luôn xấu?
- Có cách nào truyền data mà không qua props?
- `children` prop là gì và tại sao nó mạnh mẽ?

---

## 1. Props — Định Nghĩa Chính Xác

### Props = Arguments Trong Function Call

```jsx
// Props compile thành argument object
<UserCard name="Alice" age={30} active={true} onClick={handleClick} />

// = compile thành:
React.createElement(UserCard, {
  name: 'Alice',
  age: 30,
  active: true,
  onClick: handleClick
});

// Trong component:
function UserCard(props) {
  // props = { name: 'Alice', age: 30, active: true, onClick: fn }
  // props là plain object — hoàn toàn không có magic
}
```

### Props Là Read-Only

```jsx
// ❌ SAI TUYỆT ĐỐI — props là CONSTANT
function Badge({ count }) {
  count = count + 1; // ❌ Assignment to parameter
  return <span>{count}</span>;
}

// ✅ ĐÚNG — tạo derived value
function Badge({ count }) {
  const displayCount = count + 1;
  return <span>{displayCount}</span>;
}
```

---

## 2. Unidirectional Data Flow — Nguyên Tắc Quan Trọng Nhất

### Nguyên Tắc

```
┌──────────────────────────────────────────────────────────────┐
│  DATA FLOW MỘT CHIỀU                                          │
│                                                               │
│       State lives HERE ──→ Props ───→ UI                    │
│       (in some component)      ↓                              │
│                         Only flows DOWN                       │
│                                                               │
│  Child KHÔNG thể pass data ngược lên parent                  │
│  Siblings KHÔNG thể talk trực tiếp                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Minh Hoạ

```jsx
// State ở App
function App() {
  const [theme, setTheme] = useState('dark');

  return (
    <ThemeContext.Provider value={theme}>
      <Header />           {/* Header nhận theme từ Context */}
      <Sidebar />          {/* Sidebar nhận theme từ Context */}
      <Content />          {/* Content nhận theme từ Context */}
    </ThemeContext.Provider>
  );
}

// Không cần props drilling:
function Header() {
  const theme = useContext(ThemeContext); // ✅ Đọc trực tiếp
  return <nav style={{ background: theme }}>...</nav>;
}
```

### Tại Sao Thiết Kế Như Vậy?

**Unidirectional data flow làm cho code có thể predict và debug được:**

```
Traditional (bidirectional, e.g. Angular 1):
  Parent ←→ Child
  → Data có thể thay đổi từ nhiều nơi
  → Khó biết "state này thay đổi ở đâu"
  → Debug = nightmare

React (unidirectional):
  Parent → Child
  → Data chỉ thay đổi từ 1 nơi (state owner)
  → Data flow rõ ràng
  → Debug = trace về state owner
```

---

## 3. Props Types — Chi Tiết

### String Literal

```jsx
// Truyền string trực tiếp — không cần curly braces
<Welcome name="Alice" />      // ✅

// Tương đương:
<Welcome name={'Alice'} />    // ✅ — explicit expression
```

### Number, Boolean, Array, Object

```jsx
<UserCard
  age={30}                              // number — PHẢI dùng {}
  isActive={true}                       // boolean
  hobbies={['reading', 'swimming']}     // array
  profile={{
    city: 'Hanoi',
    country: 'Vietnam',
    bio: 'Developer'
  }}                                   // object
/>
```

### Function Làm Props

```jsx
// Parent: truyền callback xuống child
function App() {
  const handleLike = (postId) => {
    console.log('Liked:', postId);
    updateLikeCount(postId);
  };

  return <PostList onLike={handleLike} />;
}

// Child: nhận function và gọi khi event xảy ra
function PostList({ onLike }) {
  return (
    <div>
      {posts.map(post => (
        <Post
          key={post.id}
          {...post}
          onLike={() => onLike(post.id)}  // Gọi với post.id
        />
      ))}
    </div>
  );
}

// Grandchild: gọi callback từ props
function Post({ id, title, onLike }) {
  return (
    <article>
      <h2>{title}</h2>
      <button onClick={() => onLike(id)}>❤️ Like</button>
    </article>
  );
}
```

**Đây chính là pattern "lifting state up"** — state ở parent, function để thay đổi state truyền xuống child qua props.

### Boolean Shorthand

```jsx
// Boolean shorthand — phổ biến trong UI libraries
<Input disabled />              // = disabled={true}
<Input disabled={false} />      // = disabled={false}
<Checkbox checked={isChecked} />

// ⚠️ CAVEAT:
<input disabled={0} />         // KHÔNG disabled! (0 là falsy)
<input disabled={''} />         // KHÔNG disabled! ('' là falsy)
```

---

## 4. Special Prop: `children`

### children = Nội Dung Giữa Tag

```jsx
// Parent truyền nội dung bên trong
<Card>
  <h2>Card Title</h2>
  <p>This is the card content</p>
  <Button>Action</Button>
</Card>

// Card nhận children qua props.children
function Card({ children, title }) {
  return (
    <div className="card">
      {title && <h3 className="card-title">{title}</h3>}
      <div className="card-content">
        {children}  {/* ← Nội dung được truyền vào */}
      </div>
    </div>
  );
}
```

### Children Types

```jsx
// String
<Alert>Operation completed!</Alert>
// props.children = "Operation completed!"

// JSX Element
<Alert><Icon /> Text here</Alert>
// props.children = React element

// Multiple children
<Layout>
  <Sidebar />
  <Main />
  <Footer />
</Layout>
// props.children = [Sidebar, Main, Footer] (array)

// Function as children (render prop pattern)
<MouseTracker>
  {(position) => <Cat position={position} />}
</MouseTracker>
// props.children = function
```

---

## 5. Prop Drilling — Vấn Đề Và Giải Pháp

### Vấn Đề

```jsx
// Prop drilling: truyền qua 4 levels
function App() {
  const [user, setUser] = useState(null);
  return <Layout user={user} />; // Level 1
}

function Layout({ user }) {
  return <Sidebar user={user} />; // Level 2
}

function Sidebar({ user }) {
  return <UserMenu user={user} />; // Level 3
}

function UserMenu({ user }) {
  return <Avatar url={user?.avatar} />; // Level 4 ← Dùng ở đây
}
// → user được truyền qua Layout, Sidebar, UserMenu
// → Mặc dù chỉ Avatar cần nó
```

### Giải Pháp 1: Composition

```jsx
// ❌ Truyền data qua props không cần thiết
<Layout user={user}>
  <Sidebar user={user} />  // Sidebar không cần user
</Layout>

// ✅ Composition: truyền content, không truyền data
<Layout>
  <Sidebar />
  <Main />
</Layout>
// Sidebar và Main không nhận user prop

// Data cần ở đâu → đặt ở đó
function App() {
  const [user, setUser] = useState(null);
  return (
    <Layout>
      <UserSection>
        <UserMenu user={user} />
        <Avatar url={user?.avatar} />
      </UserSection>
    </Layout>
  );
}
```

### Giải Pháp 2: Context API

```jsx
// Tạo Context
const UserContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);
  return (
    <UserContext.Provider value={user}>
      <Layout />    {/* Layout không cần user prop */}
    </UserContext.Provider>
  );
}

function UserMenu() {
  const user = useContext(UserContext); // ✅ Đọc trực tiếp
  return <Avatar url={user?.avatar} />;
}
```

### Giải Pháp 3: State Management (Redux/Zustand)

```jsx
// Zustand store
const useUserStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

// Bất kỳ component nào đều đọc được
function Avatar() {
  const user = useUserStore(state => state.user);
  return user ? <img src={user.avatar} /> : null;
}
```

### Decision Framework

```
┌──────────────────────────────────────────────────────────────┐
│  KHI NÀO DÙNG GÌ?                                           │
│                                                               │
│  Props Drilling (1-2 levels)?                                │
│    → ✅ OK — đơn giản, rõ ràng                             │
│                                                               │
│  Prop Drilling (3+ levels)?                                  │
│    → ⚠️ Xem xét: composition hoặc Context                  │
│                                                               │
│  Multiple features cần same data?                            │
│    → Context API (simple) hoặc Zustand (complex)            │
│                                                               │
│  Frequently changing data?                                  │
│    → Zustand/Redux (performance optimization)               │
│                                                               │
│  Server data?                                                │
│    → React Query (caching, refetching)                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Default Props Và Validation

### Default Parameters (Hiện Đại)

```jsx
// ES6 default parameters
function Button({ label = 'Click', variant = 'primary', size = 'medium' }) {
  return <button className={`btn-${variant} btn-${size}`}>{label}</button>;
}

// ✅ Component hoạt động với minimal props
<Button />  // label="Click", variant="primary", size="medium"
<Button label="Submit" /> // variant="primary", size="medium"
```

### Default Values Với Destructuring

```jsx
function UserCard({ name = 'Anonymous', age = 0, avatar }) {
  return (
    <div>
      <img src={avatar || '/default-avatar.png'} />
      <h2>{name}</h2>
      <p>{age} years old</p>
    </div>
  );
}
```

### PropTypes (Runtime Validation)

```jsx
import PropTypes from 'prop-types';

function UserCard({ name, age, onEmailClick }) {
  return <div>{name}</div>;
}

UserCard.propTypes = {
  name: PropTypes.string.isRequired,
  age: PropTypes.number,
  onEmailClick: PropTypes.func,
  avatar: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.string),
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  }),
};
```

### TypeScript (Khuyến Nghị)

```tsx
// TypeScript = compile-time validation, tốt hơn PropTypes

interface UserCardProps {
  name: string;
  age?: number;
  avatar?: string;
  onClick?: () => void;
  onEmailClick?: (email: string) => void;
  status: 'active' | 'inactive' | 'pending';
  children?: React.ReactNode;
}

function UserCard({ name, age = 0, avatar, onClick }: UserCardProps) {
  // TypeScript: name là required, age có default, others optional
}
```

---

## 7. Liên Hệ Với JavaScript Core

### Props = Arguments Trong Function Call

```javascript
// Tương tự như function arguments
function greet(name, age) {
  return `Hello ${name}, age ${age}`;
}

greet('Alice', 30);
// Arguments: ['Alice', 30]
// Parameters: name='Alice', age=30

// JSX props tương đương:
<UserCard name="Alice" age={30} />
// Arguments: { name: 'Alice', age: 30 }
// Props object: { name: 'Alice', age: 30 }
```

### Destructuring Trong Props

```jsx
// ❌ Nested access — khó đọc
function BadComponent({ user: { profile: { avatar } } }) {
  return <img src={avatar} />;
}

// ✅ Destructuring với alias
function GoodComponent({ user: { profile: { avatar } } }) {
  return <img src={avatar} />;
}

// ✅ Hoặc destructure nhiều levels
function GoodComponent({ user: { profile: { avatar: avatarUrl } } }) {
  return <img src={avatarUrl} />;
}

// ✅ Nested destructuring
function GoodComponent({ user: { name, profile: { avatar } } }) {
  return <img src={avatar} alt={name} />;
}
```

---

## 8. Các Traps Phổ Biến

### ❌ Trap 1: Nhầm Props Với State

```
Props                            State
─────────────────────────────    ─────────────────────────────
Truyền vào từ parent           Quản lý bên trong component
Read-only (không thay đổi)      Mutable (với setState)
Thay đổi ở parent → re-render  Thay đổi → component re-render
```

```jsx
// ❌ SAI — cố thay đổi props
function BadComponent({ count }) {
  count = count + 1; // ❌ Props là read-only!
  return <div>{count}</div>;
}

// ✅ ĐÚNG — muốn thay đổi → dùng state
function GoodComponent({ initialCount }) {
  const [count, setCount] = useState(initialCount);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### ❌ Trap 2: Truyền Object Literal Trong JSX

```jsx
// ❌ Object literal MỖI render → new reference → child re-render
function Parent() {
  return <Child config={{ theme: 'dark', size: 'large' }} />;
}

// ✅ Truyền primitive props
function Parent() {
  return <Child theme="dark" size="large" />;
}

// ✅ Hoặc memoize object
function Parent() {
  const config = useMemo(() => ({ theme: 'dark', size: 'large' }), []);
  return <Child config={config} />;
}
```

### ❌ Trap 3: Truyền Function Nhưng Function Tạo Mới Mỗi Render

```jsx
// ❌ Function mới mỗi render → child re-render
function Parent() {
  return (
    <Child onClick={() => handleClick(id)} /> // ❌ Arrow fn mới mỗi render
    <Child onClick={handleClick.bind(null, id)} /> // ❌ Bind tạo fn mới
  );
}

// ✅ useCallback — stable reference
function Parent() {
  const handleClick = useCallback((id) => {
    setItems(prev => [...prev, id]);
  }, []);
  return <Child onClick={handleClick} />;
}

// ✅ Curry pattern
const handleClick = useCallback((id) => () => {
  setItems(prev => [...prev, id]);
}, []);
<Child onClick={handleClick(itemId)} />
```

---

## 9. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  PROPS                                                          │
│                                                               │
│  = Arguments truyền vào component function                   │
│  = Plain JavaScript object (không có magic)                   │
│  = Read-only (không được mutate)                              │
│                                                               │
│  DATA FLOW:                                                    │
│  Parent → Props → Child                                       │
│  └── State ở parent quyết định props                        │
│                                                               │
│  PROP DRILLING:                                               │
│  ├── 1-2 levels: OK                                         │
│  ├── 3+ levels: cân nhắc composition/Context               │
│  └── Giải pháp: Context, Zustand, React Query               │
│                                                               │
│  CHILDREN:                                                     │
│  ├── props.children = nội dung giữa tags                     │
│  ├── Linh hoạt hơn truyền data prop                         │
│  └── Composition pattern                                      │
│                                                               │
│  VALIDATION:                                                  │
│  └── TypeScript (khuyến nghị) > PropTypes > nothing       │
└──────────────────────────────────────────────────────────────┘
```

---

## 10. Câu Hỏi Phỏng Vấn

### Q1: Props là gì và data flow hoạt động như thế nào?

**Trả lời:** Props là plain JavaScript object chứa data truyền từ parent component xuống child component. Props compile thành argument object trong `React.createElement()`. Data flow là **unidirectional** (một chiều): state sống ở parent, props truyền xuống child. Child không thể tự thay đổi props — props là read-only. Khi state ở parent thay đổi → parent re-render → props mới được truyền xuống → child re-render.

### Q2: Tại sao React dùng unidirectional data flow?

**Trả lời:** Unidirectional data flow làm cho code predictable và debug được. Data chỉ có một nguồn gốc (state owner), và UI hoàn toàn phụ thuộc vào data đó. Nếu UI sai, chỉ cần trace ngược về state owner. Bidirectional data flow (như Angular 1) làm data có thể thay đổi từ nhiều nơi → khó debug, khó predict.

### Q3: Prop drilling là gì và cách giải quyết?

**Trả lời:** Prop drilling = truyền props qua nhiều lớp components trung gian không cần dùng props đó. Giải pháp: (1) **Composition** — truyền children thay vì data, đặt data ở nơi cần dùng; (2) **Context API** — truyền data không qua props, components đọc trực tiếp từ context; (3) **State management** (Zustand/Redux) — global store, components đọc từ store.

### Q4: children prop là gì?

**Trả lời:** `children` là special prop chứa nội dung JSX nằm giữa opening và closing tag của component. `<Card><p>Content</p></Card>` → `props.children = <p>Content</p>`. `children` cho phép component composition — tạo wrapper component mà vẫn linh hoạt về nội dung. So sánh: `<Card content={<p>Hi</p>} />` truyền content như prop, `<Card><p>Hi</p></Card>` truyền content như children.

### Q5: Khi nào nên lift state up?

**Trả lời:** Lift state up khi 2+ sibling components cần access same data, hoặc parent cần data để pass xuống children. State nên được đặt ở **lowest common ancestor** của tất cả components cần data. Nếu phải lift > 2 levels → Context hoặc state management. Đừng lift quá sớm — bắt đầu với local state, lift khi thực sự cần.

---

## 11. Thực Hành

### Bài 1: Prop Drilling → Composition Refactor

```jsx
// BEFORE: Prop drilling
<Dashboard
  user={user}
  theme={theme}
  notifications={notifications}
>
  <Layout user={user} theme={theme}>
    <Sidebar user={user} theme={theme}>
      <NavBar user={user} theme={theme}>
        <UserMenu user={user} />
      </NavBar>
    </Sidebar>
  </Layout>
</Dashboard>

// AFTER: Composition
<Dashboard>
  <Layout>
    <Sidebar>
      <NavBar>
        <UserSection user={user} />
      </NavBar>
    </Sidebar>
  </Layout>
</Dashboard>
```

### Bài 2: Compound Component Pattern

```jsx
// Tạo Tabs component với composition:
// <Tabs defaultTab="posts">
//   <Tabs.List>
//     <Tabs.Tab value="posts">Posts</Tabs.Tab>
//     <Tabs.Tab value="albums">Albums</Tabs.Tab>
//   </Tabs.List>
//   <Tabs.Panel value="posts">Posts content</Tabs.Panel>
//   <Tabs.Panel value="albums">Albums content</Tabs.Panel>
// </Tabs>

// Hints:
// 1. Tabs.Provider với Context chứa activeTab và setActiveTab
// 2. Tabs.List, Tabs.Tab, Tabs.Panel nhận từ Context
// 3. Dùng React.Children.map + React.cloneElement để enhance children
```

---

## Checklist

- [ ] Props = plain object, read-only
- [ ] Unidirectional data flow: state ở parent, props truyền xuống
- [ ] `children` = content giữa tags, composition power
- [ ] Prop drilling 1-2 levels OK, 3+ levels → consider composition/Context
- [ ] Props là arguments trong function call
- [ ] Function props = callback pattern cho "lift state up"
- [ ] Object/function literal trong JSX → new reference → child re-render

---

*Last updated: 2026-04-01*
