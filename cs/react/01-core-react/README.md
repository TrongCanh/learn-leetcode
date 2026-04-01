# Chương 01 — Core React

> JSX, Components, Props, State, Rendering & Virtual DOM — nền tảng không thể bỏ qua.

**Level**: 🟢 Beginner → 🟡 Intermediate | **Bài**: 6 | **Thời gian**: ~2 tuần

---

## 🧩 Tại sao chương này quan trọng?

Đây là những thứ bạn sẽ dùng **mỗi ngày** khi làm việc với React. Nhưng:

- JSX **KHÔNG phải** HTML
- Component **KHÔNG phải** function bình thường
- State **KHÔNG hoạt động** như bạn nghĩ
- Re-render **KHÔNG chỉ** xảy ra khi state thay đổi
- Virtual DOM **KHÔNG phải** là magic

**Nắm vững chương này → phần sau trở nên rõ ràng.**

---

## 🔗 Relationship Map

```
JSX (01)            → compile thành React.createElement() → plain object
   ↓
Components (02)     → nhận props → trả về JSX
   ↓
Props (03)          → data flow một chiều → truyền xuống children
   ↓
State (04)          → setState() → trigger re-render
   ↓
Rendering (05)       → virtual DOM diff → DOM update
   ↓
VDOM + Reconciler (06) → algorithm → Fiber → concurrent features
```

---

## 📋 Danh sách bài

| # | File | Chủ đề | Level | Interview |
|---|------|--------|-------|-----------|
| 1 | `001-jsx.md` | JSX — thực chất là gì? | 🟢 | ⭐⭐ |
| 2 | `002-components.md` | Components — function vs class | 🟢 | ⭐⭐ |
| 3 | `003-props.md` | Props — data flow một chiều | 🟢 | ⭐⭐ |
| 4 | `004-state.md` | State — nguyên tắc setState | 🟢 | ⭐⭐⭐ |
| 5 | `005-rendering.md` | Rendering & Re-render | 🟡 | ⭐⭐⭐ |
| 6 | `006-vdom-reconciler.md` | Virtual DOM & Reconciliation | 🟡 | ⭐⭐⭐⭐ |

---

## 🎯 Mục tiêu sau khi học xong

- [ ] Giải thích được JSX compile thành gì
- [ ] Phân biệt được function vs class component
- [ ] Hiểu bản chất props — read-only, unidirectional
- [ ] Hiểu setState là async và batching
- [ ] Liệt kê được TẤT CẢ trigger gây re-render
- [ ] Giải thích được Virtual DOM diffing hoạt động như thế nào

---

## 💡 Cách học

```
1. Đọc toàn bộ bài (25 phút)
2. Gõ lại ví dụ trong CodeSandbox (20 phút)
3. Trả lời câu hỏi phỏng vấn bằng lời
4. Làm bài tập thực hành
```

---

*Last updated: 2026-04-01*
