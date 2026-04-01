# Module Patterns — Tổ Chức Code Có Hệ Thống

## Câu hỏi mở đầu

```javascript
// Bạn có 500 dòng code utility functions
// Tất cả trong một file:

function formatDate() {}
function validateEmail() {}
function debounce() {}
let globalCounter = 0;  // ai sửa?

// Làm sao ẩn globalCounter?
// Làm sao chỉ public những thứ cần public?
// Làm sao tái sử dụng code giữa các files?
```

**Module Pattern giải quyết tất cả:** data privacy, code reuse, clear public API, dependency management. Trước ES Modules, developers dùng IIFE + closures. Với ES Modules, bạn có native solution. Quan trọng là hiểu cả hai — vì legacy codebase vẫn dùng patterns cũ.

---

## 1. Revealing Module Pattern — Private State Bằng Closures

### Bản chất

```javascript
// IIFE tạo scope riêng
// Closures giữ private state
// Object public API chỉ reveal những gì cần

const Counter = (function() {
  let count = 0; // ✅ Private — không truy cập được từ bên ngoài

  function increment() {
    count++;
    return count;
  }

  function getValue() {
    return count;
  }

  // Reveal: chỉ public những method cần thiết
  return {
    increment,
    getValue
    // count không được reveal → private
  };
})();

Counter.increment(); // 1
Counter.increment(); // 2
console.log(Counter.count); // undefined ✅
```

### Tại sao dùng IIFE?

```javascript
// ❌ Không có IIFE: biến global
let count = 0;
function increment() { return ++count; }

// → count có thể bị ghi đè từ bất kỳ đâu!

// ✅ Có IIFE: scope riêng
const Counter = (function() {
  let count = 0; // chỉ tồn tại trong scope này
  // ...
})();
```

### Advanced Revealing Module

```javascript
const UserModule = (function() {
  // Private state
  const users = new Map();
  let nextId = 1;

  // Private helpers
  function generateId() {
    return nextId++;
  }

  function validateUser(data) {
    if (!data.name || typeof data.name !== 'string') {
      throw new Error('Invalid name');
    }
    if (data.age !== undefined && (data.age < 0 || data.age > 150)) {
      throw new Error('Invalid age');
    }
    return true;
  }

  function sanitize(data) {
    return {
      id: data.id,
      name: data.name.trim(),
      age: data.age,
      createdAt: data.createdAt || new Date()
    };
  }

  // Public API
  return {
    create(userData) {
      validateUser(userData);
      const id = generateId();
      const user = sanitize({ ...userData, id });
      users.set(id, user);
      return user;
    },

    get(id) {
      return users.get(id) || null;
    },

    update(id, updates) {
      const user = users.get(id);
      if (!user) throw new Error(`User ${id} not found`);

      const updated = sanitize({ ...user, ...updates, id });
      users.set(id, updated);
      return updated;
    },

    delete(id) {
      return users.delete(id);
    },

    list() {
      return Array.from(users.values());
    },

    count() {
      return users.size;
    }
  };
})();

// Usage
UserModule.create({ name: 'Alice', age: 30 });
UserModule.create({ name: 'Bob', age: 25 });

console.log(UserModule.count());    // 2
console.log(UserModule.get(1));     // { id: 1, name: 'Alice', age: 30, ... }
UserModule.update(1, { age: 31 });
console.log(UserModule.count);      // undefined ✅ — count là function, không phải property
```

---

## 2. Revealing Singleton — Một Instance Duy Nhất

### Singleton cơ bản

```javascript
// Singleton = chỉ có 1 instance duy nhất toàn app
// Tất cả references trỏ cùng một object

const Database = (function() {
  let instance = null;

  function createConnection(config) {
    return {
      query: (sql) => console.log(`Executing: ${sql}`),
      connected: true,
      config
    };
  }

  return {
    getInstance(config) {
      if (!instance) {
        instance = createConnection(config);
        console.log('New connection created');
      } else {
        console.log('Reusing existing connection');
      }
      return instance;
    }
  };
})();

const db1 = Database.getInstance({ host: 'localhost' });
const db2 = Database.getInstance({ host: 'localhost' });

console.log(db1 === db2); // true — cùng instance
```

### Singleton với lazy initialization

```javascript
// Lazy singleton: instance chỉ được tạo khi cần lần đầu
const Cache = (function() {
  let instance = null;

  function createCache() {
    const store = new Map();
    const MAX_SIZE = 100;

    return {
      get(key) {
        return store.has(key) ? store.get(key) : null;
      },

      set(key, value) {
        if (store.size >= MAX_SIZE) {
          const firstKey = store.keys().next().value;
          store.delete(firstKey);
        }
        store.set(key, value);
      },

      clear() {
        store.clear();
      },

      size() {
        return store.size;
      }
    };
  }

  return {
    getInstance() {
      if (!instance) {
        instance = createCache();
      }
      return instance;
    }
  };
})();

// Sử dụng
const cache = Cache.getInstance();
cache.set('user:1', { name: 'Alice' });
```

### Trap: Singleton và testing

```javascript
// ❌ Singleton khó test vì shared state tồn tại giữa các tests
const Database = (function() {
  let instance = null;
  // shared state...
})();

// ✅ Solution: reset function cho testing
const Database = (function() {
  let instance = null;

  function createConnection() {
    return { query: () => {} };
  }

  return {
    getInstance() {
      if (!instance) instance = createConnection();
      return instance;
    },
    // Reset cho mỗi test
    _reset() {
      instance = null;
    }
  };
})();

// Trong test:
Database.getInstance();
Database._reset(); // clean slate
Database.getInstance(); // fresh instance
```

---

## 3. Factory Pattern — Tạo Object Theo Điều Kiện

### Simple Factory

```javascript
// Factory: quyết định tạo loại object nào dựa trên input
// Không dùng new, không dùng class

function UserFactory(role) {
  const defaults = {
    id: crypto.randomUUID(),
    createdAt: new Date()
  };

  switch (role) {
    case 'admin':
      return {
        ...defaults,
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'manage_users'],
        canDelete: true
      };

    case 'editor':
      return {
        ...defaults,
        role: 'editor',
        permissions: ['read', 'write'],
        canDelete: false
      };

    case 'viewer':
      return {
        ...defaults,
        role: 'viewer',
        permissions: ['read'],
        canDelete: false
      };

    default:
      throw new Error(`Unknown role: ${role}`);
  }
}

const admin = UserFactory('admin');
const viewer = UserFactory('viewer');
console.log(admin.permissions);    // ['read', 'write', 'delete', 'manage_users']
console.log(viewer.permissions);   // ['read']
```

### Factory với validation

```javascript
function createValidator(type) {
  const validators = {
    email(value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    url(value) {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    number(value, min, max) {
      const num = Number(value);
      if (isNaN(num)) return false;
      if (min !== undefined && num < min) return false;
      if (max !== undefined && num > max) return false;
      return true;
    }
  };

  return {
    validate(value, ...args) {
      const validator = validators[type];
      if (!validator) throw new Error(`Unknown validator: ${type}`);
      return validator(value, ...args);
    }
  };
}

const emailValidator = createValidator('email');
console.log(emailValidator.validate('test@example.com')); // true
console.log(emailValidator.validate('not-an-email'));     // false

const rangeValidator = createValidator('number');
console.log(rangeValidator.validate(50, 0, 100));          // true
```

---

## 4. Constructor Pattern — Tạo Nhiều Instances

### Constructor function

```javascript
// Constructor pattern: dùng function + new để tạo nhiều instances
// Mỗi instance có bản sao riêng của properties

function EventEmitter() {
  this.events = {};
}

EventEmitter.prototype.on = function(event, listener) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(listener);
  return this; // chainable
};

EventEmitter.prototype.off = function(event, listener) {
  if (!this.events[event]) return this;
  this.events[event] = this.events[event].filter(l => l !== listener);
  return this;
};

EventEmitter.prototype.emit = function(event, ...args) {
  if (!this.events[event]) return false;
  this.events[event].forEach(listener => listener(...args));
  return true;
};

// Usage
const emitter = new EventEmitter();

emitter.on('message', (data) => {
  console.log('Handler 1:', data);
});

emitter.on('message', (data) => {
  console.log('Handler 2:', data);
});

emitter.emit('message', { text: 'Hello' });
// Handler 1: { text: 'Hello' }
// Handler 2: { text: 'Hello' }
```

### Mixin Pattern — Mở Rộng Object

```javascript
// Mixin: thêm methods vào object mà không cần inheritance

const SerializableMixin = {
  serialize() {
    return JSON.stringify(this);
  }
};

const LoggableMixin = {
  log(message) {
    console.log(`[${this.constructor.name}] ${message}`);
  }
};

function createUser(name, email) {
  const user = {
    name,
    email,
    createdAt: new Date()
  };

  // Apply mixins
  Object.assign(user, SerializableMixin, LoggableMixin);

  return user;
}

const user = createUser('Alice', 'alice@example.com');
user.log('User created');       // [Object] User created
console.log(user.serialize());   // {"name":"Alice","email":"alice@example.com",...}
```

---

## 5. ES Module Advanced Patterns

### Namespace Import

```javascript
// import * as — nhập tất cả exports thành một object

// math.js
export const PI = 3.14159;
export const TAU = PI * 2;
export function add(a, b) { return a + b; }
export function subtract(a, b) { return a - b; }
export default function multiply(a, b) { return a * b; }

// main.js
import * as math from './math';

console.log(math.PI);            // 3.14159
console.log(math.TAU);           // 6.28318
console.log(math.add(2, 3));     // 5
console.log(math.multiply(3, 4)); // 12 (default export)

// ⚠️ Default export trở thành property "default"
console.log(math.default(3, 4)); // 12
```

### Dynamic Import

```javascript
// import() — nhập module động, trả về Promise
// Dùng khi: code splitting, lazy loading, conditional import

// Lazy load heavy library
async function useMathJs() {
  const mathjs = await import('mathjs');
  console.log(mathjs.evaluate('sqrt(16)')); // 4
}

// Lazy load feature module
async function loadEditor() {
  if (!editorLoaded) {
    const { RichTextEditor } = await import('./editor.js');
    mountEditor(new RichTextEditor());
    editorLoaded = true;
  }
}

// Conditional import dựa trên environment
async function getAdapter() {
  if (isNode) {
    const { NodeAdapter } = await import('./adapters/node.js');
    return new NodeAdapter();
  } else {
    const { BrowserAdapter } = await import('./adapters/browser.js');
    return new BrowserAdapter();
  }
}
```

### Re-export Patterns

```javascript
// Re-export: chuyển tiếp exports từ module khác

// utils/format.js
export function formatDate(date) {
  return date.toLocaleDateString();
}

// utils/validation.js
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// utils/index.js — barrel export
export { formatDate } from './format.js';
export { validateEmail } from './validation.js';
export * from './string.js';
export { default as debounce } from './debounce.js';

// main.js — clean imports
import { formatDate, validateEmail, debounce } from './utils/index.js';
```

### import.meta

```javascript
// import.meta — metadata về module hiện tại

// file: /src/utils/helpers.js

// URL của module hiện tại
console.log(import.meta.url);        // file:///path/to/helpers.js

// Directory của module
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve path relative to module
const configPath = new URL('./config.json', import.meta.url);
const schemaPath = join(__dirname, 'schemas/user.json');

// import.meta.url vs __dirname (ESM)
// __dirname không tồn tại trong ESM!
```

### Circular Dependencies Trong ESM

```javascript
// a.js
import { bValue } from './b.js';
export const aValue = 'a';

// b.js
import { aValue } from './a.js'; // a chưa export xong khi b import!
export const bValue = 'b';

// main.js
import { aValue, bValue } from './a.js';
// aValue: 'a' ✅
// bValue: 'b' ✅
// ESM xử lý tốt hơn CJS nhưng vẫn có vấn đề

// ❌ Vấn đề khi dùng giá trị trong constructor:
import { bar } from './bar.js';

export function foo() {
  return bar(); // bar có thể chưa được export!
}

// ✅ Fix: tách thành module riêng
// shared.js
export const SHARED_CONFIG = { version: '1.0' };

// a.js
import { SHARED_CONFIG } from './shared.js';
export const aValue = 'a';

// b.js
import { SHARED_CONFIG } from './shared.js';
export const bValue = 'b';
```

### Tree-Shakeable Named Exports

```javascript
// Bundle size: bạn import cái gì → chỉ cái đó được bundle
// Nếu export tất cả từ index, bundler vẫn tree-shake được

// ✅ Tree-shakeable
// utils/index.js
export { debounce } from './debounce.js';
export { throttle } from './throttle.js';
export { formatDate } from './format.js';
export { cloneDeep } from './clone.js';

// User chỉ import cái cần:
import { debounce } from './utils';
// → bundler loại bỏ throttle, formatDate, cloneDeep

// ⚠️ Re-export all có thể không tree-shakeable
// Nếu module có side effects, bundler không biết
```

---

## 6. Module Pattern Thực Tế Trong Dự Án

### State Management Module

```javascript
// store.js — đơn giản hóa Redux pattern

const createStore = (initialState = {}) => {
  let state = { ...initialState };
  const listeners = new Set();

  const getState = () => state;

  const setState = (updater) => {
    const nextState = typeof updater === 'function'
      ? updater(state)
      : { ...state, ...updater };

    state = Object.freeze(nextState); // immutable
    listeners.forEach(listener => listener(state));
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener); // unsubscribe
  };

  return { getState, setState, subscribe };
};

// Usage
const store = createStore({ user: null, theme: 'light' });

const unsubscribe = store.subscribe((state) => {
  console.log('State changed:', state);
});

store.setState({ user: { name: 'Alice' } });
store.setState(s => ({ theme: s.theme === 'light' ? 'dark' : 'light' }));

unsubscribe();
store.setState({ user: null }); // listener không được gọi
```

### Event Bus Module

```javascript
// eventBus.js — decouple components

const EventBus = (function() {
  const listeners = new Map();

  const on = (event, callback, once = false) => {
    if (!listeners.has(event)) {
      listeners.set(event, []);
    }
    listeners.get(event).push({ callback, once });
  };

  const off = (event, callback) => {
    if (!listeners.has(event)) return;
    listeners.set(
      event,
      listeners.get(event).filter(l => l.callback !== callback)
    );
  };

  const emit = (event, data) => {
    if (!listeners.has(event)) return;

    listeners.get(event).forEach(({ callback, once }) => {
      callback(data);
    });

    // Remove once listeners
    listeners.set(
      event,
      listeners.get(event).filter(l => !l.once)
    );
  };

  const once = (event, callback) => {
    on(event, callback, true);
  };

  return { on, off, emit, once };
})();

// Usage: decouple UI và business logic
EventBus.on('user:login', (user) => {
  EventBus.emit('analytics:track', { event: 'login', userId: user.id });
  EventBus.emit('ui:notify', { message: `Welcome ${user.name}!` });
});

EventBus.on('cart:add', (item) => {
  EventBus.emit('analytics:track', { event: 'add_to_cart', item });
});

EventBus.once('app:init', () => {
  console.log('App initialized for first time');
});
```

### API Module Pattern

```javascript
// api.js — centralized API layer

const ApiService = (function() {
  const BASE_URL = '/api/v1';
  let authToken = null;

  const setToken = (token) => {
    authToken = token;
  };

  const request = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(response.status, error.message);
    }

    return response.json();
  };

  // Public API
  return {
    setToken,
    get: (url, options) => request(url, { ...options, method: 'GET' }),
    post: (url, data, options) => request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    }),
    put: (url, data, options) => request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (url, options) => request(url, { ...options, method: 'DELETE' })
  };
})();

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
```

---

## 7. Các Traps Phổ Biến

### Trap 1: Accidental Global Trong Module Pattern

```javascript
// ❌ Quên const/let/var → tạo global!
const UserModule = (function() {
  // Quên khai báo
  cache = new Map(); // global! bug nghiêm trọng

  return { /* ... */ };
})();

// ✅ Luôn khai báo
const UserModule = (function() {
  const cache = new Map(); // private

  return { /* ... */ };
})();
```

### Trap 2: Mutable Shared State

```javascript
// ❌ Return object mà object có mutable reference
const Module = (function() {
  const defaultConfig = { theme: 'light', lang: 'en' };

  return {
    getConfig() {
      return defaultConfig; // trả reference, caller có thể sửa!
    }
  };
})();

Module.getConfig().theme = 'dark'; // Ảnh hưởng module!
defaultConfig.theme = 'dark';      // Bug khó debug!

// ✅ Trả về shallow copy
const Module = (function() {
  const defaultConfig = { theme: 'light', lang: 'en' };

  return {
    getConfig() {
      return { ...defaultConfig }; // copy, safe
    }
  };
})();

// Hoặc deep freeze
const Module = (function() {
  const config = Object.freeze({ theme: 'light', lang: 'en' });

  return {
    getConfig() {
      return config; // đã freeze, không sửa được
    }
  };
})();
```

### Trap 3: ES Modules Circular Dependencies

```javascript
// ❌ Module A import B, B import A → có thể fail
// a.js
import { bFn } from './b.js';
export const aFn = () => { bFn(); };

// b.js
import { aFn } from './a.js'; // aFn có thể undefined!
export const bFn = () => { /* ... */ };

// ✅ Fix: tách shared state ra module riêng
// config.js
export const config = { debug: true };

// a.js
import { config } from './config.js';
export const aFn = () => { console.log(config.debug); };

// b.js
import { config } from './config.js';
export const bFn = () => { console.log(config.debug); };
```

### Trap 4: Named Export Confusion

```javascript
// ❌ Confusing: export default + named cùng lúc
export default function solve() {}
export const version = '1.0'; // Dễ quên, dễ confuse

// ✅ Chọn một style và nhất quán
// Style 1: Default export cho main thing, named cho utilities
export default function process() {}
export const VERSION = '1.0';
export const validate = (x) => x > 0;

// Style 2: Named export toàn bộ (ES Module convention)
export function process() {}
export const VERSION = '1.0';
export const validate = (x) => x > 0;
```

### Trap 5: IIFE Memory Leaks

```javascript
// ❌ Closures giữ references lớn không cần thiết
const HeavyModule = (function() {
  const hugeData = new Array(10_000_000); // 10MB

  return {
    compute() {
      return hugeData.reduce((a, b) => a + b, 0);
    }
  };
})();
// hugeData không thể GC vì closure giữ reference!

// ✅ Chỉ giữ những gì cần
const LightModule = (function() {
  const hugeData = new Array(10_000_000);
  // Closure chỉ cần một giá trị
  const dataLength = hugeData.length;
  // hugeData có thể được GC sau khi tính xong?

  // Tốt hơn: không tạo closure giữ data không cần
  return {
    getLength() {
      return dataLength; // chỉ giữ length, không giữ data
    }
  };
})();
```

### Trap 6: Default Parameters Trong Factory

```javascript
// ❌ Mutable default object — bug phổ biến
function createUser(name, roles = []) {
  roles.push('default'); // ⚠️ Sửa default object!
  return { name, roles };
}

const a = createUser('Alice');
const b = createUser('Bob');
console.log(a.roles); // ['default', 'default'] — bug!

// ✅ Mutable default — luôn tạo object mới
function createUser(name, roles = null) {
  roles = roles || [];
  roles.push('default');
  return { name, roles };
}
```

---

## 8. Câu Hỏi Phỏng Vấn

### Câu 1: Revealing Module Pattern vs ES Modules — khác nhau gì?

**Trả lời:** Revealing Module Pattern dùng IIFE + closures để tạo private state — chạy được ở bất kỳ JavaScript environment nào (ES5+). ES Modules là native module system của ES6+, hỗ trợ static imports/exports, tree shaking, lazy loading. Revealing Module Pattern vẫn dùng trong legacy codebase và khi cần fine-grained control. ES Modules là standard hiện đại.

---

### Câu 2: Tại sao cần module pattern khi đã có class?

**Trả lời:** (1) **Privacy**: class `#private` chỉ có từ ES2022, trước đó class không có real privacy — chỉ convention. (2) **Closures**: module pattern dùng closures cho state, bản chất khác class fields. (3) **Simplicity**: module pattern đơn giản hơn class cho simple use cases. (4) **Legacy**: ES Modules pattern thường nhẹ hơn class cho pure functions + data.

---

### Câu 3: Singleton pattern có advantages gì, khi nào không nên dùng?

**Trả lời:** Advantages: shared state toàn app, lazy initialization, không cần pass instance qua nhiều layers. Dùng cho: database connections, caches, configuration objects. Khi KHÔNG nên dùng: (1) Testing — khó mock, shared state giữa tests. (2) Distributed systems — singleton chỉ hoạt động trong một process. (3) High concurrency — shared mutable state cần synchronization phức tạp.

---

### Câu 4: ES Modules vs CommonJS — cái nào nên dùng?

**Trả lời:** Browser: ES Modules là standard, dùng `<script type="module">`. Node.js: nên dùng ES Modules (`.mjs` hoặc `"type": "module"` trong package.json) cho project mới, vì support tree shaking, top-level await, import assertions. Legacy Node.js: CommonJS vẫn OK. Library: nên export cả ESM và CJS để tương thích. Không nên mix trong cùng một module.

---

### Câu 5: Circular dependencies trong ES Modules xử lý thế nào?

**Trả lời:** ES Modules xử lý circular deps tốt hơn CommonJS nhờ live bindings. Khi module A import B, nếu B chưa export xong, A nhận được undefined cho giá trị đó — nhưng khi B export xong, A cập nhật. Vấn đề: dùng giá trị trong class constructor hoặc IIFE có thể fail. Fix: tách shared state/config ra module riêng, hoặc dùng function wrapper thay vì direct import.

---

### Câu 6: Làm sao để lazy-load một module?

**Trả lời:** Dùng dynamic `import()` — trả về Promise. Ví dụ: khi user click tab "Settings", mới load module settings. Hoặc dùng `React.lazy()` / Vue's `defineAsyncComponent`. Lazy loading giảm initial bundle size, chỉ load code khi cần.

---

## 9. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  MODULE PATTERNS                                               │
│                                                               │
│  REVEALING MODULE PATTERN                                      │
│  ├── IIFE + closures cho private state                     │
│  ├── Object literal reveal public API                      │
│  ├── Ưu điểm: simple, ES5 compatible, privacy thật sự   │
│  └── Dùng cho: legacy code, simple libraries              │
│                                                               │
│  SINGLETON                                                     │
│  ├── 1 instance toàn app, lazy initialization              │
│  ├── Use case: DB connection, cache, config               │
│  └── ⚠️ Khó test, tránh shared mutable state             │
│                                                               │
│  FACTORY                                                       │
│  ├── Tạo object dựa trên input, không dùng new          │
│  ├── Use case: tạo object theo điều kiện               │
│  └── Dễ mở rộng với new types                          │
│                                                               │
│  ES MODULE PATTERNS                                           │
│  ├── Namespace import: import * as ns from './mod'         │
│  ├── Dynamic import: await import('./mod')               │
│  ├── Barrel export: index.js re-exports                 │
│  ├── import.meta: module metadata (url, dirname)        │
│  └── ⚠️ Tránh circular deps bằng shared module        │
│                                                               │
│  ⚠️ Luôn khai báo biến (const/let) trong IIFE           │
│  ⚠️ Trả shallow copy/deep freeze cho mutable returns   │
│  ⚠️ Factory: không dùng mutable default object         │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Implement được Revealing Module Pattern với private state
- [ ] Implement được Singleton với lazy initialization
- [ ] Implement được Factory Pattern
- [ ] Dùng được ES Module patterns: namespace import, dynamic import, re-export
- [ ] Hiểu và tránh được các traps phổ biến
- [ ] Trả lời được 5/6 câu hỏi phỏng vấn
- [ ] Biết khi nào dùng Module Pattern vs Class vs ES Module

---

*Last updated: 2026-04-01*
