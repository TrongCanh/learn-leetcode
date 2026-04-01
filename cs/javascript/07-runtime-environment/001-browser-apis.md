# Browser APIs — Những Thứ JavaScript Được Phép Làm

## Trước khi bắt đầu

Bạn có biết sự khác biệt giữa:

```javascript
console.log('hello');           // JavaScript built-in
Math.random();                   // JavaScript built-in
document.getElementById('app'); // Browser API
fetch('/api/data');             // Browser API
window.innerWidth;             // Browser API
navigator.geolocation.getCurrentPosition(...); // Browser API
```

Phần lớn dev nhầm lẫn giữa **JavaScript** và **Browser APIs** (Web APIs). JavaScript engine chỉ hiểu JavaScript — nó không biết gì về DOM, network, hay storage. Trình duyệt cung cấp các Web APIs để JavaScript có thể tương tác với thế giới bên ngoài.

---

## 1. JavaScript Engine vs Browser APIs

### Ai làm gì?

```
┌─────────────────────────────────────────────────────────┐
│  JavaScript Engine (V8, SpiderMonkey, JavaScriptCore)      │
│  • Thực thi JavaScript code                            │
│  • Quản lý execution context, call stack             │
│  • Garbage collection                                 │
│  • Built-in objects: Math, Array, Object, Promise     │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│  Browser Web APIs (Browser cung cấp cho JS)             │
│  • DOM APIs: document, elements                      │
│  • Network: fetch, XMLHttpRequest, WebSocket          │
│  • Storage: localStorage, sessionStorage, IndexedDB   │
│  • Graphics: Canvas, WebGL, SVG                       │
│  • Media: Audio, Video APIs                           │
│  • Hardware: Geolocation, Bluetooth, USB               │
└─────────────────────────────────────────────────────────┘
```

### Vậy `fetch()` đến từ đâu?

```javascript
// fetch() là Web API — browser cung cấp, không phải JS
typeof fetch;         // 'function' — có sẵn
typeof Promise;      // 'function' — JavaScript built-in

// Trong Node.js không có fetch (trước v18)
node -e "console.log(typeof fetch)" // undefined
```

---

## 2. Window API — Cửa Sổ Trình Duyệt

### Đối tượng Window

`window` là global object trong browser. Nó đại diện cho cửa sổ trình duyệt và chứa hầu hết Web APIs.

```javascript
// window là global
window.document === document; // true
window.console === console;   // true
window.setTimeout === setTimeout; // true
```

### Kích thước viewport

```javascript
// Chiều rộng viewport (không tính scrollbar)
window.innerWidth;

// Chiều cao viewport
window.innerHeight;

// Chiều rộng document
document.documentElement.scrollWidth;

// Kiểm tra responsive
function handleResize() {
  if (window.innerWidth < 768) {
    console.log('Mobile view');
  } else if (window.innerWidth < 1024) {
    console.log('Tablet view');
  } else {
    console.log('Desktop view');
  }
}

window.addEventListener('resize', handleResize);
```

### Scroll position

```javascript
// Vị trí scroll hiện tại
window.scrollX; // horizontal
window.scrollY; // vertical

// Scroll đến vị trí
window.scrollTo({ top: 0, behavior: 'smooth' });
window.scrollBy({ top: 100, behavior: 'smooth' });

// Element scroll
element.scrollIntoView({ behavior: 'smooth', block: 'start' });
```

### Timers

```javascript
// setTimeout — chạy 1 lần
const timerId = setTimeout(() => {
  console.log('Chạy sau 2 giây');
}, 2000);

// Hủy timeout
clearTimeout(timerId);

// setInterval — chạy lặp lại
const intervalId = setInterval(() => {
  console.log('Chạy mỗi 1 giây');
}, 1000);

// Hủy interval
clearInterval(intervalId);

// Lưu ý: timers vẫn chạy ngay cả khi tab không active
// → Dùng Page Visibility API để pause/resume
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearInterval(intervalId);
  } else {
    intervalId = setInterval(tick, 1000);
  }
});
```

---

## 3. Location API — URL và Navigation

### Đọc URL

```javascript
window.location.href;        // 'https://example.com/path?query=1'
window.location.protocol;    // 'https:'
window.location.host;       // 'example.com'
window.location.hostname;    // 'example.com'
window.location.port;       // '8080'
window.location.pathname;    // '/path'
window.location.search;     // '?query=1'
window.location.hash;        // '#section'
```

### Thay đổi URL

```javascript
// Chuyển trang — tạo history entry mới
window.location.href = 'https://example.com/new-page';
window.location.assign('https://example.com/new-page');

// Chuyển trang — không tạo history entry
window.location.replace('https://example.com/new-page');

// Reload trang
window.location.reload();
window.location.reload(true); // force cache bypass
```

### Query parameters

```javascript
// Đọc query params
const params = new URLSearchParams(window.location.search);
params.get('id');    // '123'
params.get('name');  // 'alice'

// Tạo URL với params
const url = new URL('https://example.com/api');
url.searchParams.set('page', '1');
url.searchParams.set('limit', '10');
console.log(url.toString());
// 'https://example.com/api?page=1&limit=10'
```

---

## 4. History API — Navigation không Reload

### Quản lý history

```javascript
// Push state — thêm entry mới
window.history.pushState({ pageId: 'home' }, '', '/home');

// Replace state — thay thế entry hiện tại
window.history.replaceState({ pageId: 'about' }, '', '/about');

// Số lượng entries
window.history.length; // 5

// Go back/forward
window.history.back();     // về trang trước
window.history.forward(); // về trang sau
window.history.go(-2);   // về 2 trang
```

### Popstate event

```javascript
// Browser back/forward button → popstate event
window.addEventListener('popstate', (event) => {
  console.log('State:', event.state);
  console.log('URL:', window.location.pathname);
  // Load content tương ứng
});
```

---

## 5. Navigator API — Thông Tin Trình Duyệt

### Thông tin về trình duyệt

```javascript
// User Agent
navigator.userAgent;
// 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...'

// Ngôn ngữ
navigator.language;        // 'en-US'
navigator.languages;       // ['en-US', 'en', 'vi']

// Platform
navigator.platform;        // 'Win32'

// Online status
navigator.onLine;         // true/false

// Cookies enabled
navigator.cookieEnabled;   // true
```

### Service Worker detection

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('SW registered'))
    .catch(err => console.error('SW failed:', err));
}
```

### Battery API

```javascript
if ('getBattery' in navigator) {
  navigator.getBattery().then(battery => {
    console.log('Charging:', battery.charging);
    console.log('Level:', battery.level * 100 + '%');

    battery.addEventListener('levelchange', () => {
      console.log('Battery:', battery.level * 100 + '%');
    });
  });
}
```

---

## 6. Screen API — Thông Tin Màn Hình

```javascript
// Kích thước màn hình
screen.width;       // 1920
screen.height;      // 1080

// Kích thước trừ taskbar
screen.availWidth;  // 1920
screen.availHeight;  // 1040

// Orientation
screen.orientation.type;
// 'landscape-primary', 'portrait-secondary', ...
```

---

## 7. Fetch API — HTTP Requests

### GET request

```javascript
async function fetchUser(id) {
  const response = await fetch(`/api/users/${id}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}
```

### POST request

```javascript
async function createUser(userData) {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token123'
    },
    body: JSON.stringify(userData),
    // credentials: 'include' — gửi cookies cross-origin
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return await response.json();
}
```

### Error handling

```javascript
// fetch() chỉ reject khi network error
// HTTP 404, 500 không reject!

async function safeFetch(url) {
  try {
    const response = await fetch(url);

    // Phải check response.ok
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    if (err.name === 'TypeError') {
      console.error('Network error:', err);
    } else {
      console.error('Application error:', err);
    }
    throw err;
  }
}
```

### AbortController

```javascript
const controller = new AbortController();

// Request với abort signal
const response = await fetch('/api/data', {
  signal: controller.signal
});

// Hủy request
controller.abort();

// Timeout
const timeoutId = setTimeout(() => controller.abort(), 5000);

async function fetchWithTimeout(url, ms = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return await response.json();
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw err;
  }
}
```

---

## 8. Các Storage APIs

### localStorage

```javascript
// Lưu trữ vĩnh viễn (trừ khi xóa)
localStorage.setItem('theme', 'dark');
localStorage.getItem('theme');         // 'dark'
localStorage.removeItem('theme');
localStorage.clear(); // xóa tất cả

// Chỉ lưu strings
localStorage.setItem('count', 42);
const count = parseInt(localStorage.getItem('count'));

// Lưu object
localStorage.setItem('user', JSON.stringify({ name: 'Alice', age: 30 }));
const user = JSON.parse(localStorage.getItem('user'));

// Storage event (khi tab khác thay đổi)
window.addEventListener('storage', (event) => {
  console.log('Key changed:', event.key);
  console.log('Old value:', event.oldValue);
  console.log('New value:', event.newValue);
});
```

### sessionStorage

```javascript
// Giống localStorage nhưng chỉ tồn tại trong tab hiện tại
sessionStorage.setItem('token', 'abc123');
sessionStorage.getItem('token');

// Tab đóng → mất hết
// Nhiều tabs → mỗi tab có session riêng
```

### IndexedDB — Database phía client

```javascript
// Mở database
const request = indexedDB.open('myDatabase', 1);

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  db.createObjectStore('users', { keyPath: 'id' });
  db.createObjectStore('posts', { keyPath: 'id' });
};

request.onsuccess = (event) => {
  const db = event.target.result;
  console.log('Database opened:', db.name);
};

request.onerror = (event) => {
  console.error('Database error:', event.target.error);
};
```

### IndexedDB CRUD

```javascript
// Open DB
function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Create
async function createUser(user) {
  const db = await openDB('myDB', 1);
  const tx = db.transaction('users', 'readwrite');
  const store = tx.objectStore('users');
  return new Promise((resolve, reject) => {
    const req = store.add(user);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Read
async function getUser(id) {
  const db = await openDB('myDB', 1);
  const tx = db.transaction('users', 'readonly');
  const store = tx.objectStore('users');
  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Delete
async function deleteUser(id) {
  const db = await openDB('myDB', 1);
  const tx = db.transaction('users', 'readwrite');
  const store = tx.objectStore('users');
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
```

---

## 9. Service Workers — Proxy Phía Client

### Đăng ký Service Worker

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => {
      console.log('SW registered:', reg.scope);
    })
    .catch(err => {
      console.error('SW registration failed:', err);
    });
}
```

### Service Worker lifecycle

```javascript
// sw.js
const CACHE_NAME = 'v1';
const urlsToCache = [
  '/',
  '/styles/main.css',
  '/scripts/main.js'
];

// Install — cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Activate — cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    )
  );
});

// Fetch — serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

### Cache-First strategy

```javascript
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache successful responses only
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
```

---

## 10. Các Traps Phổ Biến

### Trap 1: fetch() không reject khi HTTP error

```javascript
// ❌ SAI: tưởng fetch reject khi 404
async function getUser(id) {
  const response = await fetch(`/api/users/${id}`);
  return response.json(); // 404 → JSON parse error!
}

// ✅ ĐÚNG: luôn check response.ok
async function getUser(id) {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) throw new Error(`User ${id} not found`);
  return response.json();
}
```

### Trap 2: localStorage chỉ lưu strings

```javascript
// ❌ SAI: lưu object
localStorage.setItem('user', { name: 'Alice' });
localStorage.getItem('user'); // '[object Object]'

// ✅ ĐÚNG: serialize
localStorage.setItem('user', JSON.stringify({ name: 'Alice' }));
JSON.parse(localStorage.getItem('user')); // { name: 'Alice' }
```

### Trap 3: setInterval không pause khi tab ẩn

```javascript
// ❌ SAI: interval vẫn chạy khi tab ẩn
setInterval(() => {
  updateNotifications(); // Gọi API liên tục!
}, 1000);

// ✅ ĐÚNG: dùng visibility API
let intervalId;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearInterval(intervalId);
  } else {
    intervalId = setInterval(updateNotifications, 1000);
  }
});
```

### Trap 4: Storage quota

```javascript
// localStorage có quota ~5-10MB
// Khi vượt quota → exception

try {
  localStorage.setItem('data', bigString);
} catch (err) {
  if (err.name === 'QuotaExceededError') {
    console.error('Storage full!');
    // Xóa data cũ hoặc dùng IndexedDB
  }
}
```

---

## 11. Câu Hỏi Phỏng Vấn

### Câu 1: Phân biệt JavaScript và Browser API

**Trả lời:** JavaScript là ngôn ngữ, có spec riêng (ECMAScript). Browser APIs là các interface mà trình duyệt cung cấp cho JavaScript gọi — như DOM, fetch, localStorage. `fetch()` là Web API, không phải JavaScript.

---

### Câu 2: Event loop và async operations

```javascript
console.log('1');

fetch('/api/data').then(() => console.log('2'));

setTimeout(() => console.log('3'), 0);

console.log('4');
```

**Trả lời:** `1, 4, 2, 3` — synchronous → microtask (fetch) → macrotask (setTimeout).

---

### Câu 3: localStorage vs sessionStorage vs IndexedDB

| | localStorage | sessionStorage | IndexedDB |
|--|-------------|----------------|-----------|
| Capacity | ~5-10MB | ~5-10MB | Unlimited |
| Expiry | Vĩnh viễn | Tab close | Vĩnh viễn |
| Data type | Strings only | Strings only | Objects, files |
| API | Sync | Sync | Async |
| Use case | Preferences | Session | Large data |

---

### Câu 4: Service Worker vs Web Worker

**Trả lời:** Service Worker hoạt động như proxy giữa app và network — dùng cho caching, offline, push notifications. Web Worker dùng cho CPU-intensive computation trên background thread.

---

### Câu 5: Cache-Control với fetch

```javascript
// Không cache
fetch('/api/data', {
  cache: 'no-store'
});

// Cache nhưng check network
fetch('/api/data', {
  cache: 'no-cache'
});

// Cache, fallback network
fetch('/api/data', {
  cache: 'force-cache'
});
```

---

### Câu 6: Navigator.onLine không reliable

```javascript
// ❌ Không nên tin tuyệt đối
if (navigator.onLine) {
  fetch('/api/data');
} else {
  console.log('Offline'); // nhưng thực ra có network!
}

// ✅ Dùng kết hợp
navigator.onLine && fetch('/api/data').catch(() => showOfflineMessage());
```

---

## 12. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  BROWSER APIS                                              │
│                                                         │
│  Window: viewport, scroll, navigation, timers            │
│  Location: URL, query params                           │
│  History: pushState, replaceState, popstate            │
│  Navigator: browser info, online status, language    │
│  Screen: display dimensions                         │
│  Fetch: HTTP requests (luôn check response.ok)     │
│  Storage: localStorage, sessionStorage, IndexedDB   │
│  Service Workers: caching, offline, push          │
│                                                         │
│  ⚠️ fetch() không reject khi HTTP error            │
│  ⚠️ localStorage chỉ lưu strings                │
│  ⚠️ Timers không pause khi tab ẩn              │
│  ⚠️ Storage có quota giới hạn                │
└─────────────────────────────────────────────────────────┘
```

---

## 13. Mối Liên Hệ

```
Browser APIs
  ├── DOM API (002) ← document, elements
  ├── Event Loop (03) ← async APIs chạy qua event loop
  ├── Concurrency (04) ← Web Workers
  ├── Performance (09) ← rendering, optimization
  └── Service Workers ← caching strategy
```

---

## Checklist

- [ ] Phân biệt được JavaScript và Browser APIs
- [ ] Dùng được fetch với error handling
- [ ] Chọn được storage phù hợp: localStorage, sessionStorage, IndexedDB
- [ ] Implement được Service Worker caching
- [ ] Trả lời được 6/6 câu hỏi phỏng vấn

---

*Last updated: 2026-03-31*
