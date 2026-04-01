# Khi Nào Dùng Gì — Decision Framework

## 1. Decision Tree

```
① State dùng trong bao nhiêu components?
  ├── Chỉ 1 component → useState
  ├── 2-3 sibling → Lifting State Up
  └── Nhiều levels → Context/Store

② State thay đổi thường xuyên?
  ├── Thưa thớt (< 10x/second) → Context OK
  └── Thường xuyên → State management

③ Cần persistence, undo/redo?
  └── Redux / Zustand với middleware

④ Cần SSR hydration?
  └── Zustand / Context
```

---

## 2. Cụ Thể

```
useState:
  • Single component
  • Ephemeral UI state (modal, form input)

Lifting State:
  • 2+ siblings cần share data
  • 1-2 levels up

Context:
  • App-wide data ít thay đổi (theme, auth)
  • Consumers ít

Redux/Zustand:
  • Complex state logic
  • Many update types
  • Team collaboration
```

---

## 3. Common Patterns

### Collocate State

```jsx
// ❌ BAD: state ở quá cao
function App() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // ...
}

// ✅ GOOD: state ở gần nơi dùng
function DropdownFeature() {
  const [isOpen, setIsOpen] = useState(false);
  // ...
}
```

---

## Checklist

- [ ] useState: single component hoặc 1-2 child
- [ ] Lifting: siblings cần share data, gần nhất có thể
- [ ] Context: app-wide data ít thay đổi, tách nhỏ
- [ ] Redux/Zustand: complex state, nhiều update types

---

*Last updated: 2026-04-01*
