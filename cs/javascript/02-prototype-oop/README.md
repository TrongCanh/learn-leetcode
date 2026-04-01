# Chương 02 — Object Model & Prototype

> Cách JavaScript thực sự implement OOP — không phải class như Java/C#, mà là **prototype delegation**.

**Level**: 🟡 Intermediate → Advanced | **Bài**: 6 | **Thời gian**: ~1 tuần

---

## 🧩 Tại sao chương này quan trọng?

> JavaScript không có class inheritance. Nó có **prototype chain** — và hầu hết dev không hiểu điều đó.

Khi bạn viết:

```javascript
class Dog extends Animal { ... }
```

Thực chất JavaScript đang làm:
1. Tạo một object với `[[Prototype]]` trỏ đến `Animal.prototype`
2. Khi truy cập `dog.bark()`, JS đi lên chain: `dog → Dog.prototype → Animal.prototype → Object.prototype`

**Nếu không hiểu chain này**, bạn sẽ:
- Không debug được khi method bị ghi đè sai
- Không hiểu tại sao `instanceof` hoạt động
- Nhầm lẫn giữa `__proto__` và `prototype`

---

## 🔗 Liên quan đến các chương khác

```
Chương 02 (Prototype)
  ├── Scope chain (01) ← property lookup đi qua scope + prototype chain
  ├── Class syntax (ES6) → module system (06)
  ├── Memory (05)       ← prototype chain ảnh hưởng heap allocation
  └── Inheritance patterns → Clean Architecture (08)
```

---

## 📋 Danh sách bài

| # | File | Chủ đề | Level |
|---|------|--------|-------|
| 1 | `001-prototype-chain.md` | Prototype Chain — bản chất property lookup | 🟡 |
| 2 | `002-class-syntax.md` | ES6 Class — syntax sugar hay gì khác? | 🟡 |
| 3 | `003-inheritance-patterns.md` | Inheritance patterns — extends, mixin | 🟡 |
| 4 | `004-mixins.md` | Mixins — composition thay vì inheritance | 🟡 |
| 5 | `005-object-patterns.md` | Object patterns — freezing, sealing, descriptors | 🟡 |
| 6 | `006-symbols-wells.md` | Symbols & Well-known Symbols | 🔴 |

---

## 🎯 Mục tiêu sau khi học xong

- [ ] Vẽ được prototype chain của bất kỳ object nào
- [ ] Phân biệt được `__proto__`, `prototype`, `Object.getPrototypeOf()`
- [ ] Hiểu `instanceof` check gì (không phải type)
- [ ] Biết khi nào dùng mixin thay vì extends
- [ ] Giải thích được class syntax là syntax sugar

---

## 💡 Cách học

```
1. Vẽ prototype chain trên giấy trước khi đọc
2. Đọc bài, đối chiếu với bản vẽ
3. Chạy thử `Object.getPrototypeOf()` trong console
```

---

*Last updated: 2026-03-31*
