# Chương 07 — Runtime Environment

> JavaScript chạy ở đâu? Trình duyệt (Chrome, Safari, Firefox) hay server (Node.js, Deno, Bun)? Mỗi runtime cung cấp API khác nhau — hiểu để viết code portable và debug được.

**Level**: 🟡 Intermediate → Advanced | **Bài**: 7 | **Thời gian**: ~1 tuần

---

## 🧩 Tại sao chương này quan trọng?

```
Browser:                          Node.js:
  ├── DOM APIs                      ├── File system (fs)
  ├── Window / Navigator            ├── HTTP/HTTPS modules
  ├── Web APIs (fetch, crypto)       ├── Buffer, Stream
  ├── Service Workers               ├── Worker Threads
  └── WebAssembly                   ├── Native addons (.node)
```

```
❌ Sai lầm phổ biến:
   "fetch() có ở mọi nơi"

✅ Thực tế:
   - fetch() là Web API, không phải JS
   - Node.js từ v18 mới có fetch() native
   - localStorage không tồn tại trong Node.js
```

---

## 🔗 Liên quan đến các chương khác

```
Chương 07 (Runtime Environment)
  ├── Event Loop (03)      ← browser có event loop, Node.js cũng vậy
  ├── Browser APIs         ← phỏng vấn hay hỏi về DOM, event model
  ├── Concurrency (04)     ← Web Workers vs Worker Threads
  └── Performance (09)      ← browser rendering pipeline
```

---

## 📋 Danh sách bài

| # | File | Chủ đề | Level |
|---|------|--------|-------|
| 1 | `001-browser-apis.md` | Browser APIs — Window, Navigator, Screen | 🟡 |
| 2 | `002-dom-api.md` | DOM API — traversal, manipulation, events | 🟡 |
| 3 | `003-nodejs-runtime.md` | Node.js Runtime — event loop, libuv, C++ bindings | 🟡 |
| 4 | `004-browser-engine.md` | Browser Engine — V8, Blink, Gecko, WebKit | 🟡 |
| 5 | `005-security-model.md` | Security Model — same-origin, CSP, XSS | 🟡 |
| 6 | `006-web-assembly.md` | WebAssembly — WASM, khi nào dùng | 🔴 |
| 7 | `007-cross-platform.md` | Cross-platform JS — writing portable code | 🟡 |

---

## 🎯 Mục tiêu sau khi học xong

- [ ] Phân biệt được JS engine vs browser engine vs runtime
- [ ] Hiểu DOM event model: capture, target, bubble
- [ ] Giải thích được event loop của Node.js (libuv)
- [ ] Nhận biết được khi nào code phụ thuộc runtime
- [ ] Viết được portable code với feature detection

---

## 💡 Cách học

```
1. Đọc 001-002 (Browser APIs + DOM) — phổ biến trong phỏng vấn Frontend
2. Đọc 003 (Node.js Runtime) — phổ biến trong phỏng vấn Backend
3. Đọc 005 (Security) — thường bị bỏ qua nhưng rất hay hỏi
4. Đọc 006-007 — bonus
```

---

*Last updated: 2026-03-31*
