# Chương 3 — Behavioral Patterns

> **Behavioral Patterns** giải quyết vấn đề **giao tiếp giữa các objects** — cách objects tương tác và phân chia trách nhiệm một cách rõ ràng, dễ bảo trì.

---

## 3 Patterns trong chương này

| # | Pattern | Độ khó | Giải quyết |
|---|---------|--------|------------|
| 007 | [Observer](./007-observer.md) | 🟢 Easy | Thông báo cho **nhiều objects** khi state thay đổi |
| 008 | [Strategy](./008-strategy.md) | 🟢 Easy | Thay đổi **thuật toán/behavior** lúc runtime |
| 009 | [Command](./009-command.md) | 🟡 Medium | Gói request thành object → **undo/redo, queue, logging** |

---

## 🔑 Khái niệm chung

### Loosely Coupled Design
Behavioral patterns đều hướng tới **decoupling** — giảm sự phụ thuộc giữa objects.

```
❌ Publisher ↔ Subscriber (gắn chặt)
✅ Subject ↔ Observer (qua interface — Subject không biết ConcreteObserver)
```

### Strategy vs State — Dễ nhầm lẫn
- **Strategy**: Client **chủ động chọn** algorithm
- **State**: Object **tự thay đổi** behavior khi state bên trong thay đổi

---

## 📚 Tài liệu tham khảo

- [Refactoring.Guru — Behavioral](https://refactoring.guru/design-patterns/behavioral-patterns)
- [Source Making — Behavioral](https://sourcemaking.com/design_patterns/behavioral_patterns)

---

## → Bắt đầu với [007 — Observer](./007-observer.md)
