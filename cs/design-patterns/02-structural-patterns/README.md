# Chương 2 — Structural Patterns

> **Structural Patterns** giải quyết vấn đề **tổ chức class và object** — cách kết hợp các class/object để tạo cấu trúc lớn hơn mà vẫn linh hoạt và hiệu quả.

---

## 3 Patterns trong chương này

| # | Pattern | Độ khó | Giải quyết |
|---|---------|--------|------------|
| 004 | [Adapter](./004-adapter.md) | 🟡 Medium | Biến interface **không tương thích** thành tương thích |
| 005 | [Facade](./005-facade.md) | 🟡 Medium | Cung cấp interface **đơn giản** cho hệ thống phức tạp |
| 006 | [Decorator](./006-decorator.md) | 🟡 Medium | Thêm behavior **runtime** mà không sửa class gốc |

---

## 🔑 Khái niệm chung

### Composition over Inheritance
Structural patterns ưu tiên **composition** (ghép object) hơn **inheritance** (kế thừa), giúp code linh hoạt hơn khi runtime.

```
❌ class Child extends Parent (kế thừa — gắn chặt lúc compile)
✅ class Child { parent: Parent } (composition — gắn khi runtime)
```

### Proxy vs Decorator — Dễ nhầm lẫn
- **Decorator**: Thêm behavior → object mới **khác behavior**
- **Proxy**: Kiểm soát access → object **giống hệt** về interface, chỉ khác cách truy cập

---

## 📚 Tài liệu tham khảo

- [Refactoring.Guru — Structural](https://refactoring.guru/design-patterns/structural-patterns)
- [Source Making — Structural](https://sourcemaking.com/design_patterns/structural_patterns)

---

## → Bắt đầu với [004 — Adapter](./004-adapter.md)
