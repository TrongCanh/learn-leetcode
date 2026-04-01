# Chương 01 — JavaScript Core

> Nền tảng vững nhất của JavaScript: cách engine thực thi code, quản lý scope, và những thứ dễ bị hiểu nhầm nhất.

**Level**: 🟢 Intermediate | **Bài**: 10 | **Thời gian**: ~2 tuần

---

## 🧩 Tại sao chương này quan trọng?

> JavaScript Core là **nền tảng** quyết định bạn hiểu hay chỉ *biết* JavaScript.

Hầu hết các câu hỏi phỏng vấn khó nhất đều xoay quanh:

- Tại sao `var` có hoisting mà `let`/`const` thì không?
- Closure `for (var)` chạy sai — tại sao, và `let` fix gì?
- `this` được resolve như thế nào?
- `null == undefined` nhưng `null !== undefined` — tại sao?

**Nắm chắc chương này → các chương sau trở nên dễ dàng hơn nhiều.**

---

## 🔗 Liên quan đến các chương khác

```
Chương 01 (JS Core)
  ├── Execution Context → sinh ra Closure (01)
  ├── Scope chain        → prototype lookup (02)
  ├── `this` binding      → event handler, class (02)
  └── Hoisting            → module loading, TDZ (06)
```

---

## 📋 Danh sách bài

| # | File | Chủ đề | Level |
|---|------|--------|-------|
| 1 | `001-scope.md` | Scope (lexical, global, local) | 🟢 |
| 2 | `002-closure.md` | Closure — bản chất và ứng dụng | 🟢 |
| 3 | `003-hoisting.md` | Hoisting — var, let, const, function | 🟢 |
| 4 | `004-this.md` | `this` — 4 cách bind và 4 contexts | 🟡 |
| 5 | `005-data-types.md` | Data types — primitive vs reference | 🟢 |
| 6 | `006-execution-context.md` | Execution Context — call stack bên trong | 🟡 |
| 7 | `007-spread-rest.md` | Spread & Rest operators | 🟢 |
| 8 | `008-destructuring.md` | Destructuring — array, object, nested | 🟢 |
| 9 | `009-type-coercion.md` | Type Coercion — implicit vs explicit | 🟡 |
| 10 | `010-equality.md` | Equality — `==` vs `===` | 🟡 |

---

## 🎯 Mục tiêu sau khi học xong

- [ ] Giải thích được **thứ tự scope resolution** (lexical scope chain)
- [ ] Giải thích được **hoisting hoạt động như thế nào** ở engine level
- [ ] Biết khi nào **closure tạo memory leak**
- [ ] Dự đoán được **giá trị `this`** trong mọi ngữ cảnh
- [ ] Phân biệt được **primitive vs reference**, biết khi nào cần deep copy

---

## 💡 Cách học

```
1. Đọc bài (15 phút/bài)
2. Gõ lại ví dụ trong console (10 phút)
3. Đọc phần "Sai lầm phổ biến" → tự kiểm tra
4. Đọc phần "Phỏng vấn hay hỏi"
```

---

*Last updated: 2026-03-31*
