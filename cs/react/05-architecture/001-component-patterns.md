# Component Patterns

## 1. Compound Components

### Ý tưởng

```jsx
// ❌ Prop drilling
<Tabs activeTab={activeTab} onChange={setActiveTab} tabs={['posts', 'albums']} />

// ✅ Compound components
<Tabs defaultTab="posts">
  <Tabs.List>
    <Tabs.Tab value="posts">Posts</Tabs.Tab>
    <Tabs.Tab value="albums">Albums</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="posts"><Posts /></Tabs.Panel>
  <Tabs.Panel value="albums"><Albums /></Tabs.Panel>
</Tabs>
```

### Implementation

```jsx
const TabsContext = createContext(null);

function Tabs({ defaultTab, children }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

Tabs.List = function TabsList({ children }) {
  return <div className="tabs-list">{children}</div>;
};

Tabs.Tab = function Tab({ value, children }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  return (
    <button className={`tab ${activeTab === value ? 'active' : ''}`} onClick={() => setActiveTab(value)}>
      {children}
    </button>
  );
};

Tabs.Panel = function Panel({ value, children }) {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== value) return null;
  return <div className="tab-panel">{children}</div>;
};
```

---

## 2. Higher-Order Components (HOC)

```jsx
const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { user } = useAuth();
    if (!user) return <LoginPage />;
    return <Component {...props} user={user} />;
  };
};

const ProtectedDashboard = withAuth(Dashboard);
```

---

## 3. Render Props

```jsx
<MouseTracker render={(position) => (
  <Cat position={position} />
)} />
```

---

## 4. Container/Presentational

```
┌──────────────────────────────────────────────────────┐
│  PRESENTATIONAL     │  CONTAINER                       │
│  • UI rendering    │  • Logic, state, API             │
│  • No side effects  │  • Fetches data                 │
│  • Reusable        │  • Passes as props              │
└──────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Compound Components: cho related UI elements
- [ ] Custom Hooks: cho logic reuse (ưu tiên)
- [ ] Container/Presentational: cho data vs UI separation
- [ ] HOC: legacy, cân nhắc trước khi dùng

---

*Last updated: 2026-04-01*
