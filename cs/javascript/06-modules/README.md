# Chương 06 — Modules & Code Organization

> Không còn là script tag spam. JavaScript hiện đại có module system mạnh mẽ — ESM, CommonJS, dynamic import. Hiểu để tránh circular dependency, tối ưu bundle, và design architecture tốt.

**Level**: 🟡 Intermediate | **Bài**: 4 | **Thời gian**: ~3–4 ngày

---

## 🧩 Tại sao chương này quan trọng?

```
CommonJS (Node.js truyền thống):   require() / module.exports
ES Modules (ES6+):                 import / export
Dynamic Import (lazy loading):     import('./module.js')
```

```
❌ Sai lầm phổ biến:
   "Tất cả import giống nhau, chỉ là syntax khác thôi"

✅ Thực tế:
   - ESM là deferred, CJS là eager
   - ESM import là live binding, CJS là copy
   - Circular dependency xử lý khác nhau
   - Tree shaking chỉ hoạt động với ESM
```

---

## 🔗 Liên quan đến các chương khác

```
Chương 06 (Modules)
  ├── Closure (01)       ← Module pattern dựa trên closure
  ├── Execution Context  ← mỗi module có EC riêng
  ├── Code Splitting (09) ← dynamic import là cơ sở
  ├── Tree Shaking       ← chỉ hoạt động với ESM
  └── Bundlers           ← Vite, Webpack, Rollup
```

---

## 📋 Danh sách bài

| # | File | Chủ đề | Level |
|---|------|--------|-------|
| 1 | `001-esm-cjs.md` | ESM vs CommonJS — sự khác biệt thực sự | 🟡 |
| 2 | `002-dynamic-import.md` | Dynamic Import — lazy loading, code splitting | 🟡 |
| 3 | `003-module-patterns.md` | Module Patterns — revealing module, singleton | 🟡 |
| 4 | `004-tree-shaking.md` | Tree Shaking — cách bundlers loại bỏ dead code | 🟡 |

---

## 🎯 Mục tiêu sau khi học xong

- [ ] Giải thích được 5+ sự khác biệt giữa ESM và CJS
- [ ] Biết khi nào dùng static `import` vs dynamic `import()`
- [ ] Hiểu cách tránh circular dependency
- [ ] Biết tree shaking hoạt động và cách viết code thân thiện với bundler

---

## 💡 Cách học

```
1. Đọc 001 — phân biệt ESM vs CJS
2. Thực hành: viết 1 module, export bằng cả 2 cách
3. Đọc 002 → kết hợp với Code Splitting (09)
4. Đọc 003-004 — bonus, hiểu bundler internals
```

---

*Last updated: 2026-03-31*
