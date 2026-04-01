# Chương 08 — Architecture & Design Patterns

> Viết code đúng → viết code sạch → viết code scale được. Chương này là bước chuyển từ "biết làm" sang "thiết kế tốt".

**Level**: 🔴 Advanced | **Bài**: 6 | **Thời gian**: ~1.5 tuần

---

## 🧩 Tại sao chương này quan trọng?

> Phỏng vấn senior thường hỏi: "Anh/chị thiết kế cái này thế nào?" — không phải "viết thuật toán này".

Design patterns trong JavaScript có 3 nhóm:

```
Creational (tạo object):
  ├── Singleton         → global state
  ├── Factory           → khởi tạo theo điều kiện
  └── Builder           → object phức tạp, nhiều config

Structural (cấu trúc):
  ├── Decorator         → thêm behavior lúc runtime
  ├── Adapter           → wrapper cho interface không tương thích
  └── Proxy             → control access, logging, validation

Behavioral (hành vi):
  ├── Observer/Pub-Sub   → event system
  ├── Strategy           → interchangeable algorithms
  └── Command            → encapsulate request
```

---

## 🔗 Liên quan đến các chương khác

```
Chương 08 (Architecture)
  ├── Prototype/OOP (02)    ← OOP patterns xây trên prototype
  ├── Functional (02)        ← functional composition
  ├── Module (06)            ← module boundary = architectural boundary
  ├── Dependency Injection    ← testability, loose coupling
  └── System Design (10)     ← patterns ghép lại thành system
```

---

## 📋 Danh sách bài

| # | File | Chủ đề | Level |
|---|------|--------|-------|
| 1 | `001-oop-fundamentals.md` | OOP Fundamentals — encapsulation, polymorphism | 🟡 |
| 2 | `002-functional-programming.md` | Functional Programming — pure functions, immutability | 🟡 |
| 3 | `003-design-patterns-js.md` | Design Patterns in JS — 12 patterns thực chiến | 🔴 |
| 4 | `004-observable-pattern.md` | Observable & Reactive — RxJS, custom events | 🔴 |
| 5 | `005-dependency-injection.md` | Dependency Injection — IoC container, testability | 🔴 |
| 6 | `006-clean-architecture.md` | Clean Architecture — layers, boundaries | 🔴 |

---

## 🎯 Mục tiêu sau khi học xong

- [ ] Phân biệt được composition vs inheritance, biết khi nào dùng
- [ ] Nhận diện và implement được 12 patterns phổ biến
- [ ] Hiểu reactive programming (Observable)
- [ ] Thiết kế được architecture cho 1 feature nhỏ
- [ ] Giải thích được "tại sao dùng pattern này, không dùng cái kia"

---

## 💡 Cách học

```
1. Đọc 001-002 — nền tảng OOP + FP
2. Đọc 003 — design patterns, mỗi pattern cần hiểu 1 usecase thực tế
3. Đọc 004-005 — reactive + DI, hay hỏi trong interview
4. Đọc 006 — Clean Architecture, dùng cho system design
```

---

*Last updated: 2026-03-31*
