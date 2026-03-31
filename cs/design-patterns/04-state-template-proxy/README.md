# Chương 4 — State, Template Method & Proxy

> Chương cuối tổng hợp **3 patterns mạnh mẽ** thường xuất hiện trong system design và interview: State machine, Algorithm skeleton, và Access control.

---

## 3 Patterns trong chương này

| # | Pattern | Độ khó | Giải quyết |
|---|---------|--------|------------|
| 010 | [State](./010-state.md) | 🟡 Medium | Object **thay đổi behavior** khi internal state thay đổi |
| 011 | [Template Method](./011-template-method.md) | 🟡 Medium | Định nghĩa **skeleton thuật toán**, để subclass implement steps |
| 012 | [Proxy](./012-proxy.md) | 🟡 Medium | Kiểm soát **access** đến object (lazy load, cache, auth) |

---

## 🔑 Khái niệm chung

### State vs Strategy vs Template Method
Ba patterns này đều liên quan đến **behavior delegation**, nhưng khác nhau về cơ chế:

| Pattern | Ai quyết định behavior? | Khi nào thay đổi? |
|---------|-------------------------|-------------------|
| State | Object tự quyết (state machine) | Khi transition xảy ra |
| Strategy | Client chủ động chọn | Client gọi setter |
| Template Method | Base class định sẵn | Compile time (inheritance) |

### Proxy trong thực tế
Proxy không chỉ là "placeholder" — nó là nền tảng của:
- **Lazy Loading**: Hibernate lazy initialization
- **Caching**: Redis cache layer
- **Access Control**: API gateway, Auth middleware
- **Remote Call**: gRPC stubs, GraphQL data loading

---

## 📚 Tài liệu tham khảo

- [Refactoring.Guru — Design Patterns](https://refactoring.guru/design-patterns)
- [Proxy Pattern — Martin Fowler](https://martinfowler.com/articles/dipInTheRuth.html)

---

## → Bắt đầu với [010 — State](./010-state.md)
