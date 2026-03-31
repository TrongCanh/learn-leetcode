# Chương 1 — Creational Patterns

> **Creational Patterns** giải quyết vấn đề **khởi tạo object** — cách tạo object sao cho linh hoạt, dễ mở rộng, và tránh phụ thuộc trực tiếp vào concrete class.

---

## 3 Patterns trong chương này

| # | Pattern | Độ khó | Giải quyết |
|---|---------|--------|------------|
| 001 | [Singleton](./001-singleton.md) | 🟢 Easy | Đảm bảo chỉ có **một instance duy nhất** |
| 002 | [Factory Method](./002-factory-method.md) | 🟢 Easy | Tạo object **không cần chỉ định class cụ thể** |
| 003 | [Builder](./003-builder.md) | 🟢 Easy | Tạo object **phức tạp** theo từng bước |

---

## 🔑 Khái niệm chung

### Single Responsibility Principle
Mỗi pattern đều tách biệt **cách tạo** (creation) khỏi **logic sử dụng** (usage).

### Dependency Inversion
Các creational pattern đều hướng tới việc phụ thuộc vào **abstraction** (interface/abstract class), không phải concrete class.

```
❌ Client → ConcreteClass
✅ Client → Factory/Builder → ConcreteClass
```

---

## 📚 Tài liệu tham khảo

- [Refactoring.Guru — Creational](https://refactoring.guru/design-patterns/creational-patterns)
- [Source Making — Creational](https://sourcemaking.com/design_patterns/creational_patterns)

---

## → Bắt đầu với [001 — Singleton](./001-singleton.md)
