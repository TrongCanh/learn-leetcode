# Debounce & Throttle — Kiểm Soát Tần Suất Gọi

## Câu hỏi mở đầu

```javascript
// User resize cửa sổ liên tục:
// resize → handler → resize → handler → resize → handler
// 1 pixel change = 1 handler call → 500 resize events!
// Mỗi handler gọi API → server nhận 500 requests!

// Hoặc user type trong search box:
// t → API → "t"
// ty → API → "ty"
// typ → API → "ty"
// type → API → "type"
// → 5 requests, chỉ request CUỐI là có ích!

// Làm sao giảm số lần gọi mà không mất functionality?
```

**Debounce** và **throttle** là hai kỹ thuật kiểm soát tần suất gọi function. Chúng không phải thư viện phức tạp — bạn hoàn toàn có thể tự viết trong vài dòng. Quan trọng là hiểu **khi nào dùng cái nào** và **bản chất hoạt động** thế nào.

---

## 1. Debounce — Chờ Đến Khi "Im Lặng"

### Bản chất

```
Debounce: "Đợi cho đến khi có một khoảng im lặng"

User types:  t-y-p-e------------------- (dashes = time)
Debounce(300):

         [====300ms====][====300ms====][====300ms====]
Call:                              [ CALL ]
                                  (Sau khi user ngừng 300ms)

→ Chỉ gọi khi user NGỪNG type 300ms
→ Request CUỐI CÙNG là request bạn gửi
```

### Implement debounce từ đầu

```javascript
// Debounce — gọi function SAU KHI delay kết thúc
// Nếu called lại trước khi delay kết thúc → reset timer

function debounce(fn, delay) {
  let timeoutId = null;

  return function (...args) {
    // Mỗi lần gọi: hủy timer trước đó
    clearTimeout(timeoutId);

    // Đặt timer mới
    timeoutId = setTimeout(() => {
      fn.apply(this, args); // Gọi function với đúng context
      timeoutId = null;
    }, delay);
  };
}

// Usage với event handler:
const handleSearch = debounce((query) => {
  console.log('Searching for:', query);
  fetch(`/api/search?q=${query}`);
}, 300);

searchInput.addEventListener('input', (e) => {
  handleSearch(e.target.value); // Debounced!
});
```

### Debounce với leading edge

```javascript
// Debounce mặc định: trailing edge (gọi SAU khi delay kết thúc)
// Nhưng đôi khi muốn gọi NGAY LẬP TỨC, rồi đợi

function debounceWithOptions(fn, delay, options = {}) {
  const { leading = false, trailing = true } = options;

  let timeoutId = null;
  let lastArgs = null;

  return function (...args) {
    lastArgs = args;

    // Leading: gọi ngay lần đầu
    if (!timeoutId && leading) {
      fn.apply(this, args);
    }

    // Clear previous timer
    clearTimeout(timeoutId);

    // Set new timer
    timeoutId = setTimeout(() => {
      // Trailing: gọi sau khi delay kết thúc
      if (trailing) {
        fn.apply(this, lastArgs);
      }
      timeoutId = null;
    }, delay);
  };
}

// Debounce leading edge — gọi ngay, KHÔNG gọi sau
const debounceLeading = (fn, delay) =>
  debounceWithOptions(fn, delay, { leading: true, trailing: false });

// Example: Button double-click prevention
const submitOnce = debounceLeading(() => {
  // Chỉ gọi lần đầu, bỏ qua clicks tiếp trong 2s
  console.log('Submitted!');
  submitForm();
}, 2000);

button.addEventListener('click', submitOnce);
// Click 1 → Submitted!
// Click 2 (trong 2s) → Bỏ qua!
```

### Debounce với cancel

```javascript
function debouncedFetch(query) {
  console.log('Fetching:', query);
}

const debounced = debounce(debouncedFetch, 300);

// Cancel pending call
debounced('a');
debounced('ab');
debounced.cancel(); // Hủy pending 'ab' call

// Không có gì được log!

// Implementation với cancel:
function debounce(fn, delay) {
  let timeoutId = null;

  const debouncedFn = function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };

  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFn;
}
```

---

## 2. Throttle — Gọi Tối Đa Một Lần Mỗi N Khoảnh Khắc

### Bản chất

```
Throttle: "Gọi tối đa 1 lần mỗi N giây"

User scrolls: |-----|-----|-----|-----|-----| (continuous)
Throttle(100ms):
Call:       [✓]   [ ]   [✓]   [ ]   [✓]   [ ] (tối đa 1 lần/100ms)
→ Gọi 100ms một lần, không quan tâm user scroll bao nhiêu lần
```

### Implement throttle từ đầu

```javascript
// Throttle — gọi function NHƯNG KHÔNG QUÁ 1 LẦN trong mỗi delay

// Version 1: trailing throttle (gọi cuối trong mỗi period)
function throttle(fn, delay) {
  let lastCall = 0;
  let timeoutId = null;

  return function (...args) {
    const now = Date.now();

    // Nếu đã quá delay từ last call
    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    } else {
      // Nếu chưa đủ delay: hủy pending, đặt lại
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
      }, delay - (now - lastCall));
    }
  };
}

// Version 2: leading throttle (gọi ngay lần đầu)
function throttleLeading(fn, delay) {
  let lastCall = 0;
  let timeoutId = null;

  return function (...args) {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    } else {
      // Không làm gì cho đến khi đủ delay
    }
  };
}
```

### RAF Throttle — Best cho animations

```javascript
// requestAnimationFrame throttle — sync với display refresh rate
// Tốt nhất cho: scroll handlers, resize handlers, mousemove

function rafThrottle(fn) {
  let frameId = null;
  let lastArgs = null;

  return function (...args) {
    lastArgs = args;

    if (frameId === null) {
      frameId = requestAnimationFrame(() => {
        fn.apply(this, lastArgs);
        frameId = null;
      });
    }
  };
}

// Usage:
const handleScroll = rafThrottle(() => {
  console.log('Scroll Y:', window.scrollY);
  updateStickyHeader();
});

window.addEventListener('scroll', handleScroll);
// → Gọi tối đa 60 lần/giây (1 lần mỗi frame)
// → Không gọi nhiều hơn cần thiết
// → Luôn sync với repaint → smooth animation

// ⚠️ Nếu user scroll 1000px trong 16ms → chỉ gọi 1 lần (tốt!)
```

---

## 3. So Sánh Debounce vs Throttle

```
┌────────────────┬──────────────────────────────────────────────────┐
│ Debounce       │ Gọi SAU KHI có khoảng im lặng                      │
│                │ Dùng khi: chỉ cuối cùng là quan trọng             │
│                │                                                  │
│                │ Ví dụ:                                           │
│                │ ├── Search: chỉ request khi user NGỪNG type   │
│                │ ├── Resize: chỉ xử lý khi user NGỪNG resize  │
│                │ ├── Autocomplete: kết quả tìm kiếm               │
│                │ └── Button clicks: chỉ xử lý click CUỐI      │
├────────────────┼──────────────────────────────────────────────────┤
│ Throttle       │ Gọi TỐI ĐA 1 LẦN trong mỗi khoảng thời gian     │
│                │ Dùng khi: cần feedback liên tục                 │
│                │                                                  │
│                │ Ví dụ:                                           │
│                │ ├── Scroll: update sticky header liên tục      │
│                │ ├── Mouse move: drag-and-drop tracking          │
│                │ ├── Resize: update layout liên tục              │
│                │ └── Button spam: ngăn double-submit              │
├────────────────┼──────────────────────────────────────────────────┤
│ RAF Throttle   │ Gọi 1 lần mỗi animation frame (~60fps)          │
│                │ Dùng khi: cần smooth visual updates             │
│                │                                                  │
│                │ Ví dụ:                                           │
│                │ ├── Scroll handler cho animations                │
│                │ ├── Parallax effects                              │
│                │ └── Mouse position tracking                      │
└────────────────┴──────────────────────────────────────────────────┘
```

### Quyết định chọn cái nào

```javascript
// Question: "User typing in search box"
// → Debounce ✅ — chỉ request CUỐI cùng
const search = debounce((query) => fetch(`/search?q=${query}`), 300);

// Question: "Mouse position for custom cursor"
// → RAF Throttle ✅ — smooth, frame-synced updates
const updateCursor = rafThrottle((x, y) => moveCursor(x, y));
document.addEventListener('mousemove', (e) => updateCursor(e.clientX, e.clientY));

// Question: "Window resize — need to update layout"
// → Throttle (không phải debounce) ✅
// → Debounce: nếu user resize xong → chỉ 1 call → delayed
// → Throttle: liên tục update → responsive
const updateLayout = throttle(() => recalculateLayout(), 100);
window.addEventListener('resize', updateLayout);

// Question: "Form submission — prevent spam clicks"
// → Debounce leading ✅ — gọi ngay lần đầu, ignore sau đó
const safeSubmit = debounceLeading(() => submitForm(), 2000);

// Question: "Analytics tracking on scroll"
// → Throttle ✅ — gửi event rate-limited
const trackScroll = throttle((position) => {
  analytics.track('scroll', { position });
}, 1000);
window.addEventListener('scroll', () => trackScroll(window.scrollY));
```

---

## 4. Lodash Implementation vs Custom

### Lodash debounce/throttle

```javascript
import { debounce, throttle } from 'lodash';

// lodash.debounce có thêm options:
const debouncedFn = debounce(fn, 300, {
  leading: false,   // gọi ở start của delay period
  trailing: true,    // gọi ở end của delay period
  maxWait: 1000     // gọi ít nhất 1 lần trong 1000ms (giữa trailing)
});

// Cancel
debouncedFn.cancel();

// Flush — gọi ngay lập tức nếu đang pending
debouncedFn.flush();

// Pending — kiểm tra có call đang chờ không
debouncedFn.pending(); // true/false

// lodash.throttle:
const throttledFn = throttle(fn, 100, {
  leading: true,  // gọi ở đầu period
  trailing: false // KHÔNG gọi ở cuối period
});
```

### Khi nào tự viết, khi nào dùng lodash

```
┌────────────────────────────────────────────────────────────┐
│  TỰ VIẾT khi:                                             │
│  ├── Debounce/throttle đơn giản, không cần cancel/flush   │
│  ├── Không muốn thêm dependency                            │
│  └── Bundle size quan trọng (lodash = ~70KB minified)      │
│                                                            │
│  DÙNG LODASH khi:                                          │
│  ├── Cần cancel(), flush(), pending()                     │
│  ├── Cần maxWait (debounce guarantees)                     │
│  └── Dự án đã có lodash (shared dependency)               │
│                                                            │
│  ⚠️ Lodash import strategy:                              │
│  import debounce from 'lodash/debounce'; // ✅ tree-shake │
│  import { debounce } from 'lodash'; // ❌ full lodash!    │
└────────────────────────────────────────────────────────────┘
```

### Modern JavaScript — Native equivalents

```javascript
// React 16+ — useCallback với debounce
const debouncedCallback = useCallback(
  debounce((value) => doSomething(value), 300),
  []
);

// useEffect cleanup:
useEffect(() => {
  return () => debouncedCallback.cancel();
}, [debouncedCallback]);

// Vue — watch với debounce
watch(searchQuery, debounce((newVal) => {
  fetchResults(newVal);
}, 300));

// Angular — debounceTime operator với RxJS
fromEvent(searchInput, 'input').pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(query => http.get(`/search?q=${query}`))
).subscribe(results => this.results = results);
```

---

## 5. Real-World Examples

### Search với debounce

```javascript
// ❌ BAD: request mỗi keystroke
input.addEventListener('input', (e) => {
  fetch(`/api/search?q=${e.target.value}`)
    .then(r => r.json())
    .then(displayResults);
});
// 10 characters → 10 requests, 9 là vô nghĩa!

// ✅ GOOD: debounce 300ms
const searchInput = document.getElementById('search');
let abortController;

const performSearch = debounce(async (query) => {
  // Abort previous request
  if (abortController) abortController.abort();
  abortController = new AbortController();

  if (!query.trim()) {
    clearResults();
    return;
  }

  try {
    const response = await fetch(`/api/search?q=${query}`, {
      signal: abortController.signal
    });
    const results = await response.json();
    displayResults(results);
  } catch (err) {
    if (err.name !== 'AbortError') {
      showError(err);
    }
  }
}, 300);

searchInput.addEventListener('input', (e) => {
  showLoading();
  performSearch(e.target.value);
});
```

### Resize handler với throttle

```javascript
// ❌ BAD: mỗi pixel = 1 call
window.addEventListener('resize', () => {
  updateLayout(); // 500+ calls khi resize 500px!
});

// ✅ GOOD: throttle 100ms
const handleResize = throttle(() => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Update CSS variables
  document.documentElement.style.setProperty('--vw', `${width}px`);
  document.documentElement.style.setProperty('--vh', `${height}px`);

  // Responsive breakpoints
  updateResponsiveLayout(width);
}, 100);

window.addEventListener('resize', handleResize);

// ⚠️ ResizeObserver thay thế resize listener cho specific elements
new ResizeObserver(entries => {
  entries.forEach(entry => {
    const { width, height } = entry.contentRect;
    updateChart(entry.target, width, height);
  });
}).observe(document.querySelector('.chart-container'));
```

### Drag and drop với RAF throttle

```javascript
// ❌ BAD: mousemove có thể fire 1000+ lần/giây
container.addEventListener('mousemove', (e) => {
  updateDraggable(e.clientX, e.clientY);
});

// ✅ GOOD: RAF throttle — smooth và efficient
const handleMouseMove = rafThrottle((x, y) => {
  const element = document.querySelector('.draggable');
  element.style.transform = `translate(${x}px, ${y}px)`;
});

container.addEventListener('mousemove', (e) => {
  handleMouseMove(e.clientX, e.clientY);
});

// Drop handler — cancel pending RAF
container.addEventListener('mouseup', () => {
  handleMouseMove.cancel();
  savePosition();
});
```

### Button spam prevention

```javascript
// Debounce leading: chỉ gọi lần đầu
const handleSubmit = debounceWithOptions(async () => {
  const form = document.getElementById('form');
  const data = new FormData(form);

  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: data
    });

    if (response.ok) {
      showSuccess('Submitted successfully!');
      form.reset();
    } else {
      showError('Submission failed');
    }
  } catch (err) {
    showError('Network error');
  }
}, 2000, { leading: true, trailing: false });

submitButton.addEventListener('click', () => {
  submitButton.disabled = true;
  handleSubmit().finally(() => {
    submitButton.disabled = false;
  });
});
```

---

## 6. Các Traps Phổ Biến

### Trap 1: Dùng debounce trong useEffect không cleanup

```javascript
// ❌ Memory leak + unexpected behavior
useEffect(() => {
  const handler = debounce((e) => process(e), 300);
  window.addEventListener('resize', handler);
  // ❌ Không cleanup → event listener tồn tại sau unmount!
  // ❌ Debounced function không bị hủy khi component unmount!
}, []);

// ✅ Proper cleanup
useEffect(() => {
  const handler = debounce((e) => process(e), 300);
  window.addEventListener('resize', handler);

  return () => {
    window.removeEventListener('resize', handler);
    handler.cancel(); // Hủy pending call
  };
}, []);
```

### Trap 2: Debounce làm cho UX chậm

```javascript
// ❌ Debounce quá lâu = user thấy delay
const search = debounce((q) => fetch(`/search?q=${q}`), 1000);
// → User đợi 1 giây sau khi type xong → chậm!

// ✅ Debounce 200-300ms là sweet spot cho search
const search = debounce((q) => fetch(`/search?q=${q}`), 300);

// ✅ Hoặc dùng: immediate feedback + debounced search
input.addEventListener('input', (e) => {
  showTypingIndicator(); // Immediate
  performSearch(e.target.value); // Debounced
});
```

### Trap 3: Arrow function trong debounce = không cancel được

```javascript
// ❌ Không thể cancel/stop vì không có reference
const handler = debounce((e) => process(e), 300);
button.addEventListener('click', (e) => handler(e));
// handler.cancel() → không hoạt động vì handler không được lưu!

// ✅ Lưu reference
const debouncedHandler = debounce(process, 300);
button.addEventListener('click', (e) => debouncedHandler(e));

// Khi cần cancel:
function cleanup() {
  debouncedHandler.cancel(); // ✅ Works!
}
```

### Trap 4: Không dùng debounce/throttle khi cần

```javascript
// ❌ Unnecessary calls khi scroll
window.addEventListener('scroll', () => {
  analytics.track('scroll', { position: window.scrollY });
  saveScrollPosition();
  updateProgressBar();
  checkStickyHeader();
  // → 1000+ calls/second khi scrolling!
});

// ✅ Throttle hoặc RAF
window.addEventListener('scroll', throttle(() => {
  analytics.track('scroll', { position: window.scrollY });
}, 1000));

window.addEventListener('scroll', rafThrottle(() => {
  updateProgressBar(); // Visual → RAF
}));

window.addEventListener('scroll', debounce(() => {
  saveScrollPosition(); // Non-critical → debounce
}, 2000));
```

---

## 7. Câu Hỏi Phỏng Vấn

### Câu 1: Debounce vs Throttle — giải thích bằng ví dụ?

**Trả lời:** Debounce: đợi cho đến khi có khoảng im lặng. Dùng cho search input: user type "react", debounce(300) → chờ 300ms sau khi user gõ xong → gọi API với "react". Throttle: gọi tối đa 1 lần trong mỗi khoảng thời gian. Dùng cho scroll handler: user scroll 1000px trong 1s → throttle(100ms) → gọi ~10 lần, không phải 1000 lần.

---

### Câu 2: Implement debounce với options?

```javascript
function debounce(fn, delay, { leading = false, trailing = true } = {}) {
  let timeoutId = null;

  return function(...args) {
    const invokeImmediately = leading && !timeoutId;

    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (trailing) fn.apply(this, args);
    }, delay);

    if (invokeImmediately) {
      fn.apply(this, args);
    }
  };
}
```

---

### Câu 3: RAF throttle vs normal throttle?

**Trả lời:** `requestAnimationFrame` throttle sync với display refresh rate (~60fps), chỉ gọi trước khi browser repaint → animation mượt nhất. Normal throttle dùng timer, có thể gọi giữa frames → có thể gây jank. Dùng RAF throttle cho visual updates (scroll, drag, mousemove). Dùng normal throttle cho non-visual operations (analytics, API calls).

---

### Câu 4: Khi nào KHÔNG nên dùng debounce/throttle?

**Trả lời:** (1) **Precision timing** — debounce/throttle không đảm bảo timing chính xác. (2) **Critical events** — payment processing, security-sensitive operations. (3) **High-frequency with value** — mouse position tracking trong game engine cần mọi value. (4) **Keyboard shortcuts** — user expect immediate response.

---

### Câu 5: lodash debounce có gì đặc biệt?

**Trả lời:** `debounce` và `throttle` của lodash có: `cancel()` (hủy pending call), `flush()` (gọi pending ngay), `pending()` (kiểm tra có call đang chờ), `maxWait` option (debounce guarantee minimum call frequency). Implement custom đủ cho đa số cases, nhưng lodash hữu ích cho advanced use cases.

---

### Câu 6: Debounce 0ms = gì?

```javascript
// debounce(fn, 0) — không có nghĩa là "gọi ngay"
const handler = debounce(fn, 0);

// → Vẫn đợi cho đến next tick (setTimeout 0)
// → Nhưng gọi được đặt trong queue
// → Vẫn là debounce, không phải "immediate"

setTimeout(() => handler('value'), 0);
// handler được gọi ở next tick

// ⚠️ Nếu muốn "gọi ngay lập tức" → dùng leading: true
const immediateDebounce = debounce(fn, 300, { leading: true });
```

---

## 8. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  DEBOUNCE vs THROTTLE                                         │
│                                                               │
│  DEBOUNCE                                                     │
│  ├── Gọi SAU KHI có khoảng im lặng                          │
│  ├── Reset timer mỗi lần được gọi                           │
│  ├── Use case: search, resize-end, form validation          │
│  └── Leading option: gọi ngay lần đầu                      │
│                                                               │
│  THROTTLE                                                     │
│  ├── Gọi TỐI ĐA 1 LẦN trong mỗi period                     │
│  ├── Không reset — chỉ skip trong period                   │
│  ├── Use case: scroll, resize, mouse move                   │
│  └── Leading/Trailing options                               │
│                                                               │
│  RAF THROTTLE                                                 │
│  ├── Gọi 1 LẦN mỗi animation frame (~60fps)                 │
│  ├── Sync với browser repaint                               │
│  └── Best cho animations, visual updates                    │
│                                                               │
│  ⚠️ Luôn cleanup trong useEffect/componentDidMount        │
│  ⚠️ Debounce quá lâu → UX chậm                            │
│  ⚠️ Lodash debounce đủ cho hầu hết cases                 │
│  ⚠️ Không dùng debounce cho critical operations           │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Implement được debounce từ đầu
- [ ] Implement được throttle từ đầu
- [ ] Implement được RAF throttle
- [ ] Phân biệt được khi nào dùng debounce vs throttle
- [ ] Biết dùng cancel(), flush() với lodash
- [ ] Trả lời được 4/6 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
