# Câu Hỏi Phỏng Vấn Thực Tế + Đáp Án Chi Tiết

## Lưu ý

> **Cách trả lời tốt nhất**: KHÔNG chỉ nói "React re-renders khi state thay đổi". Mà phải giải thích **TẠI SAO**, cho **ví dụ cụ thể**, nêu **ngoại lệ**, và liên hệ **JavaScript core**.

---

## PHẦN 1: Core React

---

### Q1: JSX compile thành gì?

**Trả lời:** JSX compile thành `React.createElement()` function calls, trả về plain JavaScript object (Virtual DOM node). Object có shape: `{ type, props: { children, ... }, key, ref }`. Babel transform JSX syntax thành `React.createElement()` calls trong quá trình build.

---

### Q2: Virtual DOM là gì và tại sao cần nó?

**Trả lời:** Virtual DOM = JavaScript object representation của real DOM tree. React tạo VDOM tree, so sánh (diff) với tree trước, chỉ apply changes thực sự vào real DOM. Direct DOM manipulation là synchronous và expensive (trigger reflow/repaint). VDOM batching + diffing giảm DOM operations.

---

### Q3: Reconciliation hoạt động thế nào?

**Trả lời:** Reconciliation là diffing algorithm so sánh old và new VDOM trees. Element khác type → destroy and recreate. Cùng type → update attrs (DOM) hoặc re-render (component). Lists dùng `key` để match items.

---

### Q4: Props là gì? Tại sao read-only?

**Trả lời:** Props là plain JavaScript object chứa data truyền từ parent xuống child. Props compile thành argument object trong `React.createElement()`. Props là read-only vì React components phải behave như pure functions: cùng input → cùng output.

---

### Q5: State là gì? setState hoạt động như thế nào?

**Trả lời:** State = data tồn tại xuyên suốt component lifecycle, thay đổi → component re-render. `setState` là **asynchronous** và **batched**. `setCount(count + 1)` khi count=0 gọi 3 lần → kết quả = 1 (stale). `setCount(prev => prev + 1)` gọi 3 lần → kết quả = 3 (fresh).

---

### Q6: Tại sao React re-render?

**Trả lời — ĐẦY ĐỦ:**

```
RE-RENDER TRIGGERS:
  1. setState() / useState setter                  ✅
  2. useReducer dispatch                         ✅
  3. Parent re-renders                          ✅
     └── Children luôn re-render khi parent re-render
  4. Props thay đổi                            ✅
  5. Context value thay đổi                     ✅
     └── ALL consumers re-render
  6. forceUpdate()                              ✅
```

---

## PHẦN 2: Hooks

---

### Q7: useEffect hoạt động như thế nào bên trong?

**Trả lời:**

```
useEffect chạy SAU commit phase, SAU browser paint (async).

TIMING:
  1. Render phase: component executes, JSX returned
  2. Reconciliation: diffing
  3. Commit phase:
     a. DOM mutations applied
     b. useLayoutEffect (sync, before paint)
     c. Browser paint
     d. useEffect callbacks (async, after paint)
```

Dependency array quyết định khi nào callback re-register. Cleanup chạy trước khi callback re-register (khi deps changed) hoặc sau unmount.

---

### Q8: Stale closure là gì? Tại sao xảy ra?

**Trả lời:** Stale closure = khi closure capture giá trị từ thời điểm được tạo, không tự động update. Ví dụ: `setInterval(() => setCount(count + 1), 1000)` với `[]` → count luôn là 0 → counter dừng ở 1.

**Fix:**
1. Functional updater: `setCount(prev => prev + 1)`
2. Include trong deps
3. useRef cho stable reference

---

### Q9: useMemo vs useCallback vs useRef?

**Trả lời:**

```
useMemo(value)     → memoize COMPUTED VALUE
useCallback(fn)   → memoize FUNCTION (syntactic sugar)
useRef(initial)    → stable object, .current mutable, NO re-render
```

---

## PHẦN 3: Performance

---

### Q10: React.memo hoạt động thế nào?

**Trả lời:** React.memo wrap component và thực hiện shallow comparison trên props trước mỗi render. Nếu props same (shallow equality), React skip re-render. Shallow comparison: primitives by value, references by reference.

---

### Q11: Context vs Redux — khi nào dùng cái nào?

**Trả lời:**

| Aspect | Context | Redux |
|--------|---------|-------|
| Re-render | ALL consumers | Selector → only subscribed |
| Boilerplate | Low | High |
| DevTools | Limited | Full |
| Best For | Theme, auth, locale | Complex state |

---

## PHẦN 4: Architecture

---

### Q12: Thiết kế folder structure cho app lớn?

**Trả lời:**

```
src/
  ├── features/         ← Feature-based (recommended)
  │   ├── auth/
  │   │   ├── components/
  │   │   ├── hooks/
  │   │   ├── api/
  │   │   └── index.ts
  │   └── dashboard/
  ├── shared/
  │   ├── components/
  │   └── hooks/
  └── app/
```

Feature tự chứa mọi thứ cần. Shared: truly reusable components và hooks.

---

## PHẦN 5: 5 Câu Hỏi Tổng Hợp

---

### Q1: Tại sao React re-render?

Trigger đầy đủ: setState, dispatch, parent re-render, props change, context change, forceUpdate. Children re-render khi parent re-render (default). Đây là fundamental React behavior — bạn không control trực tiếp DOM.

---

### Q2: useEffect hoạt động như thế nào bên trong?

useEffect chạy **SAU commit phase, SAU browser paint** (async). Dependency array quyết định khi nào chạy lại. Cleanup chạy trước effect mới hoặc sau unmount. Empty deps `[]` = chỉ chạy 1 lần.

---

### Q3: Stale closure là gì?

Closure capture giá trị từ thời điểm được tạo. Empty deps `[]` capture giá trị từ mount. `setCount(count + 1)` trong effect với `[]` → count luôn là 0. Fix: functional updater hoặc include deps.

---

### Q4: Context vs Redux?

Context cho: simple global data ít thay đổi (theme, auth). Redux cho: complex state, many update types, cần devtools/middleware. Với project hiện đại: Zustand cho global state, React Query cho server state.

---

### Q5: Thiết kế folder structure?

Feature-based structure: `features/` chứa `auth/`, `dashboard/`, mỗi feature tự chứa `components/`, `hooks/`, `api/`. Shared: `shared/` cho truly reusable. Mỗi feature có `index.ts` export public API.

---

## Gợi Ý Khi Trả Lời

```
1. Đừng chỉ nói ĐÚNG — giải thích TẠI SAO
2. Luôn có ví dụ code minh hoạ
3. Nêu trade-offs và khi nào KHÔNG nên dùng
4. Liên hệ với JavaScript core khi có thể
5. Thể hiện hiểu biết về internals (Fiber, reconciler)
```

---

*Last updated: 2026-04-01*
