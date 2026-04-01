# WebAssembly — Khi JavaScript Cần Tốc Độ Của Native

## Câu hỏi mở đầu

```javascript
// Tại sao Google Earth chạy MƯỢT trong Chrome mà không cần plugin?
// Tại sao AutoCAD từng cần Flash, giờ chạy trực tiếp trong trình duyệt?

// Câu hỏi kinh điển:
// "JavaScript có nhanh không?"
// Câu trả lời: "Nhanh đủ cho 95% use cases. Còn 5% còn lại cần WebAssembly."
```

WebAssembly (WASM) không phải để thay thế JavaScript. Nó là **công cụ chuyên dụng** — đưa code C/C++/Rust vào trình duyệt với performance gần như native. Hiểu khi nào dùng WASM, khi nào dùng JS, và chúng phối hợp với nhau thế nào.

---

## 1. WebAssembly Là Gì?

### Định nghĩa đơn giản

```
JavaScript:    Source code → Parser → AST → JIT Compile → Machine Code
                                  (mỗi browser interpret khác nhau)

WebAssembly:  .wasm file → Decoder → JIT Compile → Machine Code
                                (binary format, portable, deterministic)
```

WASM là **binary instruction format** cho stack-based virtual machine. Nó chạy trong **cùng sandbox** như JavaScript (cùng security model), nhưng với performance predictability cao hơn.

### WASM không phải Assembly thật

```javascript
// "Assembly" trong tên gọi gây hiểu lầm
// WASM là bytecode format cho VM, không phải x86/ARM machine code

// Machine Code thật:     01101001 10010101 00101010  (CPU-specific)
// WebAssembly bytecode:   0x00 0x61 0x73 0x6d  (browser decodes → machine code)

// Điểm giống:
// - Low-level, binary, efficient to parse
// - Không có garbage collector (bạn quản lý memory)
// - Stack-based virtual machine

// Điểm khác:
// - Platform-agnostic (chạy trên mọi CPU, mọi OS)
// - Sandboxed như JS
// - Có type system rõ ràng
```

### Compilation target, không replacement

```rust
// C/C++/Rust code → WebAssembly
// Ví dụ: Rust code được compile sang WASM

// lib.rs (Rust)
#[no_mangle]
pub extern "C" fn add(a: i32, b: i32) -> i32 {
    a + b
}

// Kết quả: add.wasm (binary file)
// JavaScript gọi hàm này:
// WebAssembly.instantiateStreaming(fetch('add.wasm'))
//   .then(obj => {
//     const result = obj.instance.exports.add(40, 2);
//     console.log(result); // 42
//   });
```

---

## 2. JavaScript vs WebAssembly — Khi Nào Dùng Cái Nào?

### Performance comparison

```javascript
// Benchmark: Fibonacci recursive
// JavaScript: ~850ms
// WebAssembly: ~35ms
// → WASM 24x faster trong trường hợp này

// Nhưng benchmark khác:
// JavaScript: ~2ms
// WebAssembly: ~3ms
// → JS Nhanh hơn! (overhead của WASM call)
// → Nhiều JS engines optimize tốt cho simple computations
```

### Khi nào dùng WebAssembly

```
✅ DÙNG WASM cho:
  ├── CPU-intensive computations (video codec, image processing)
  ├── Game engines (Unity → WASM export)
  ├── Scientific computing (MATLAB algorithms, simulations)
  ├── Crypto (Ed25519, AES encryption)
  ├── Signal processing (audio, DSP)
  ├── Code bạn muốn reuse từ C/C++/Rust libraries
  └── CAD/complex graphics (AutoCAD, Google Earth)

❌ DÙNG JAVASCRIPT cho:
  ├── DOM manipulation
  ├── Event handling
  ├── Network requests
  ├── Business logic
  ├── State management
  ├── UI components
  └── Bất cứ thứ gì giao tiếp với Web APIs
```

### DOM access từ WASM

```javascript
// ⚠️ WASM không truy cập DOM trực tiếp!
// Phải gọi qua JavaScript

// C++: gọi JavaScript function từ WASM
extern "C" {
  void EMSCRIPTEN_KEEPALIVE
  update_ui(int result) {
    document.getElementById('result').textContent = result;
  }
}

// Hoặc dùng wasm-bindgen (Rust):
#[wasm_bindgen]
pub fn calculate(data: &[u8]) -> JsValue {
    // process in WASM
    JsValue::from_serde(&result).unwrap()
    // trả về JsValue → JS có thể dùng
}
```

---

## 3. Làm Việc Với WebAssembly

### Loading và running WASM

```javascript
// Cách 1: instantiateStreaming — recommended
const response = await fetch('module.wasm');
const result = await WebAssembly.instantiateStreaming(response, imports);
const { export1, export2 } = result.instance.exports;

// Cách 2: ArrayBuffer (older browsers)
const response = await fetch('module.wasm');
const buffer = await response.arrayBuffer();
const result = await WebAssembly.instantiate(buffer, imports);

// Cách 3: Webpack/Vite loaders (production)
import wasm from './module.wasm';
const wasmModule = wasm.default;
```

### Import object — Giao tiếp JS ↔ WASM

```javascript
// WASM cần import từ JS (env: imports)
const imports = {
  env: {
    // Memory: WebAssembly.LinearMemory
    memory: new WebAssembly.Memory({ initial: 1, maximum: 256 }),

    // JavaScript functions WASM có thể gọi
    log: (msg) => console.log('From WASM:', msg),

    // JS side-effect: alert, DOM, fetch, etc.
    document_get_element_by_id: (ptr, len) => {
      const id = readStringFromMemory(ptr, len);
      return document.getElementById(id);
    }
  }
};

WebAssembly.instantiateStreaming(fetch('math.wasm'), imports)
  .then(({ instance }) => {
    // Gọi exported WASM functions
    const sum = instance.exports.add(5, 3);
    const fib = instance.exports.fib(40);
    console.log('Sum:', sum, 'Fib:', fib);
  });
```

### Memory model

```javascript
// WebAssembly có LINEAR MEMORY
// Là một ArrayBuffer, accessed qua offsets

// C++ compiled to WASM:
// int* buffer = (int*)malloc(100 * sizeof(int));

// JS access memory:
const memory = new WebAssembly.Memory({ initial: 1 });
const view = new Int32Array(memory.buffer);

// Write to WASM memory
view[0] = 42;
view[1] = 99;

// Read from WASM memory
console.log(view[0]); // 42

// ⚠️ Memory can grow (but not shrink)
// ⚠️ No GC in WASM — YOU manage memory manually
```

### Strings between JS and WASM

```javascript
// WASM không có built-in string type!
// Strings = bytes in linear memory

// Convention: pass pointer + length

// JS calls WASM with string:
function passStringToWasm(str) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str + '\0'); // null-terminated
  const ptr = wasm_alloc(bytes.length);
  new Uint8Array(memory.buffer, ptr, bytes.length).set(bytes);
  return { ptr, length: bytes.length };
}

// WASM function receives pointer + length
// reads bytes from memory, constructs string

// Popular: use wasm-bindgen / Emscripten để handle automatically
```

---

## 4. Emscripten — Compile C/C++ Sang WebAssembly

### Toolchain

```bash
# Cài Emscripten SDK
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# Compile C → WASM
emcc input.c -o output.js
# Tạo: output.js + output.wasm
# JS wrapper tự động handle memory, imports, exports

# Compile với optimizations
emcc input.c -O3 -o output.js
# -O0: no optimization
# -O1: basic
# -O2: recommended
# -O3: aggressive

# Compile với WebAssembly output only
emcc input.c -s STANDALONE_WASM=1 -o output.wasm
```

### C → WASM practical example

```c
// image_process.c
#include <emscripten.h>

EMSCRIPTEN_KEEPALIVE
int* create_filter(int width, int height) {
  int* buffer = (int*) malloc(width * height * sizeof(int));
  // Initialize filter
  for (int i = 0; i < width * height; i++) {
    buffer[i] = i * 2;
  }
  return buffer;
}

// Compile:
emcc image_process.c -O3 \
  -s EXPORTED_FUNCTIONS="['_create_filter','_free']" \
  -s EXPORTED_RUNTIME_METHODS="['ccall','cwrap']" \
  -o image_process.js
```

```javascript
// Sử dụng:
const { create_filter, free } = Module;

// Cấp phát trong WASM
const filter = create_filter(1920, 1080);
// ... xử lý filter trong WASM

// Giải phóng memory
free(filter);

// Hoặc dùng ccall/cwrap:
const process = Module.cwrap('create_filter', 'number', ['number', 'number']);
const result = process(1920, 1080);
```

---

## 5. Rust → WebAssembly (Wasm-pack)

### Rust toolchain

```bash
# Cài Rust + wasm-pack
curl https://sh.rustup.rs -sSf | sh
cargo install wasm-pack

# Tạo WASM project
cargo new --lib wasm-demo
cd wasm-demo
```

```rust
// src/lib.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn calculate(data: &[f64]) -> f64 {
    data.iter().map(|x| x * x.sqrt()).sum()
}

#[wasm_bindgen]
pub struct Point {
    x: f64,
    y: f64,
}

#[wasm_bindgen]
impl Point {
    #[wasm_bindgen(constructor)]
    pub fn new(x: f64, y: f64) -> Self {
        Point { x, y }
    }

    pub fn distance(&self, other: &Point) -> f64 {
        ((self.x - other.x).powi(2) + (self.y - other.y).powi(2)).sqrt()
    }
}
```

```bash
# Build
wasm-pack build --target web

# Output:
# pkg/
#   ├── wasm_demo.js
#   ├── wasm_demo_bg.wasm
#   └── wasm_demo.d.ts
```

```javascript
import init, { calculate, Point } from './pkg/wasm_demo.js';

await init();

const result = calculate([1, 2, 3, 4, 5]);
console.log(result); // 11.416...

const p1 = new Point(0, 0);
const p2 = new Point(3, 4);
console.log(p1.distance(p2)); // 5
```

---

## 6. WASI — WebAssembly System Interface

### WASM ngoài trình duyệt

```bash
# WebAssembly không chỉ chạy trong browser
# Node.js, Deno, standalone runtimes đều hỗ trợ

# Deno hỗ trợ WASM natively:
deno run --allow-all wasm_runner.ts

# Hoặc dùng wasmtime (standalone WASM runtime):
wasmtime app.wasm
```

```javascript
// Node.js với WASM:
const fs = require('fs');
const wasmBuffer = fs.readFileSync('./app.wasm');

WebAssembly.instantiate(wasmBuffer, {
  wasi_snapshot_preview1: {
    fd_write: (fd, iovs_ptr, iovs_len, nwritten_ptr) => { /* ... */ }
  }
}).then(obj => {
  obj.instance.exports._start();
});
```

### Khi nào dùng WASI

```
✅ WASI cho:
  ├── Server-side WASM (edge computing)
  ├── Plugin systems (safe sandboxed plugins)
  ├── Portable CLI tools
  └── Edge functions (Cloudflare Workers dùng V8 isolates + WASM)
```

---

## 7. Các Traps Phổ Biến

### Trap 1: WASM không tự động nhanh hơn JS

```javascript
// ❌ Đặt WASM vào mà không cần thiết = thêm overhead
// WASM function call qua JS FFI (Foreign Function Interface)
// → overhead có thể làm CHẬM hơn pure JS

// ✅ Chỉ dùng WASM khi:
// 1. Bạn đã benchmark và thấy JS chậm
// 2. Bạn có code C/C++/Rust cần reuse
// 3. Computation phức tạp, không thể JIT optimize tốt

// ❌ Không dùng WASM cho:
// - Simple math: (a + b) * c
// - String manipulation
// - DOM operations
```

### Trap 2: Linear memory = manual memory management

```javascript
// ❌ Memory leak trong WASM:
// C++ malloc nhưng không free → memory grow mãi mãi
// No GC! Bạn phải quản lý!

// ✅ Luôn giải phóng memory:
// - Emscripten: free(ptr)
// - Rust: drop(Box::from_raw(ptr))

// ✅ Monitor memory:
const memory = instance.exports.memory;
setInterval(() => {
  console.log('WASM memory:', memory.buffer.byteLength / 1024 / 1024, 'MB');
}, 5000);
```

### Trap 3: Cross-origin resource sharing

```javascript
// WASM file tuân theo CORS!
// fetch('https://cdn.com/module.wasm') → phải có CORS headers

// ✅ Self-host WASM files:
// fetch('/static/module.wasm') → không CORS issues

// ✅ Hoặc embed base64 vào JS:
// const wasmBase64 = 'AGFzbQ...';
// const wasmBinary = Uint8Array.from(atob(wasmBase64), c => c.charCodeAt(0));

// ⚠️ Webpack/Vite xử lý tự động khi import WASM files
```

### Trap 4: Debugging WASM là ác mộng

```javascript
// ❌ Không có source map = debug trong binary = không thể

// ✅ Dùng source maps:
// emcc input.c -g4 -o output.js
// Tạo source map để map binary → C/C++ source

// ✅ Chrome DevTools:
// 1. Open DevTools → Sources
// 2. File tree có .wasm files
// 3. Set breakpoint trong WASM (Chrome 79+)
// 4. Watch linear memory

// ✅ Best: viết test bằng C/C++ trước, rồi export sang WASM
```

### Trap 5: WASM không có access to Web APIs

```javascript
// ❌ Muốn fetch từ WASM?
// → WASM không có window.fetch()
// → Phải gọi qua JS

const imports = {
  env: {
    js_fetch: async (url_ptr, url_len) => {
      const url = readString(url_ptr, url_len);
      const response = await fetch(url);
      const text = await response.text();
      return allocateAndWriteString(text);
    }
  }
};
```

---

## 8. Câu Hỏi Phỏng Vấn

### Câu 1: WebAssembly khác JavaScript như thế nào?

**Trả lời:** JS là dynamic language, parsed và JIT compiled trong browser, có garbage collector, type system linh hoạt. WASM là binary format cho stack VM, pre-compiled (không parse overhead), không có GC, deterministic performance. JS giỏi DOM/Web APIs, WASM giỏi CPU-intensive computation. Chúng **bổ trợ** nhau, không phải thay thế.

---

### Câu 2: Khi nào nên dùng WebAssembly?

**Trả lời:** Dùng khi có CPU-intensive tasks mà JS không đủ nhanh: video/audio encoding, image processing, game engines, scientific simulations, crypto. Hoặc khi cần reuse existing C/C++/Rust code. Không nên dùng cho DOM manipulation, business logic, hay simple computations vì WASM call overhead có thể làm chậm hơn JS.

---

### Câu 3: WASM memory model hoạt động thế nào?

**Trả lời:** WASM dùng linear memory (ArrayBuffer). Đây là flat byte array mà both WASM và JS có thể access. WASM không có built-in types cho strings/arrays — chúng được encode thành bytes trong memory. JS đọc bằng TypedArrays (Uint8Array, Int32Array). Cần manual memory management: allocate bằng malloc, giải phóng bằng free.

---

### Câu 4: WASM có access DOM không?

**Trả lời:** Không. WASM không có direct access đến DOM, Web APIs, hay browser features. Muốn tương tác với DOM phải gọi qua JS: truyền JS function vào WASM (imports), hoặc dùng thư viện như wasm-bindgen. Đây là lý do WASM không thay thế JS cho frontend work.

---

### Câu 5: WebAssembly Security Model

**Trả lời:** WASM chạy trong **cùng sandbox** như JavaScript (same-origin policy, same permissions). Nó không có privileged access, không bypass CSP, không access filesystem (trong browser). WASM có thể be exploited như JS (spectre-style attacks vẫn possible). Ngoài browser (WASI), WASM có thể được run với system-level permissions.

---

### Câu 6: Hiệu suất WASM vs JavaScript

**Trả lời:** Đây là nuanced topic. Compute-intensive: WASM 10-800x faster. Memory-intensive với GC: JS (V8 optimize) có thể faster. Small functions: JS faster (WASM call overhead). WASM không auto-parallelize. Nên luôn **benchmark** trước. JS JIT compiler (V8 TurboFan) có thể optimize tốt hơn human-written WASM cho simple hot paths.

---

### Câu 7: WASM Bundle Size

**Trả lời:** WASM binary nhỏ hơn minified JS tương đương. Tuy nhiên: compile time, parse time (WASM parse nhanh hơn JS), và decoding đều tốn thời gian. Progressive loading: dùng streaming instantiation (`instantiateStreaming`) để start executing ngay khi header decoded, không cần chờ toàn bộ file.

---

### Câu 8: WASM trong React/Vue apps

```javascript
// ❌ Không phải: "Thay thế React bằng WASM"
// ✅ Đúng: "Dùng WASM cho specific heavy component"

// Ví dụ: Monaco Editor (VS Code) dùng WASM cho syntax highlighting
// Monaco dùng Roslyn (C#) → WASM để parse TypeScript ultra-fast

// Integration pattern:
import WasmProcessor from './processor/pkg/wasm_processor.js';

function Component() {
  const processData = async () => {
    await WasmProcessor.init();
    const result = WasmProcessor.compute(largeData);
    return result;
  };

  return <ExpensiveChart dataPromise={processData()} />;
}
```

**Trả lời:** WASM tích hợp vào JS apps cho specific components cần heavy computation: image editors, code editors, game engines. Load WASM asynchronously, dùng Suspense hoặc lazy loading. WASM không replace React/Vue core — chỉ enhance specific heavy parts.

---

## 9. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  WEBASSEMBLY                                                    │
│                                                               │
│  WHAT IT IS                                                    │
│  ├── Binary format cho stack-based VM                        │
│  ├── Compilation target: C, C++, Rust, Go, AssemblyScript     │
│  ├── Sandboxed như JS (same security model)                   │
│  └── Deterministic performance, no GC overhead                │
│                                                               │
│  WHEN TO USE                                                    │
│  ✅ CPU-intensive: video/audio, crypto, image processing      │
│  ✅ Reuse C/C++/Rust libraries                                │
│  ✅ Deterministic computation (simulations, CAD)              │
│  ❌ DOM manipulation, business logic, simple math            │
│  ❌ Just because "WASM is faster"                             │
│                                                               │
│  HOW IT WORKS                                                  │
│  ├── fetch → instantiateStreaming → exports.call()           │
│  ├── Linear memory = ArrayBuffer                             │
│  ├── Import JS functions → WASM gọi fetch, DOM, etc.          │
│  └── No GC: YOU manage memory!                                │
│                                                               │
│  TOOLCHAINS                                                    │
│  ├── Emscripten (C/C++ → WASM)                                │
│  ├── wasm-pack (Rust → WASM)                                  │
│  └── AssemblyScript (TypeScript → WASM)                       │
│                                                               │
│  ⚠️ Benchmark trước! JS có thể nhanh hơn                     │
│  ⚠️ No DOM access → gọi qua JS imports                      │
│  ⚠️ Manual memory management → leak nếu không free           │
│  ⚠️ WASM + JS = complementary, not competing                │
└──────────────────────────────────────────────────────────────┘
```

---

## 10. Mối Liên Hệ

```
WebAssembly
  ├── Browser Engine (004) ← WASM chạy trong JS engine (V8)
  ├── Concurrency (04)     ← Web Workers + WASM = parallel compute
  ├── Performance (09)    ← khi nào WASM thực sự cần thiết
  └── Cross-platform (007) ← WASI = WASM ngoài browser
```

---

## Checklist

- [ ] Hiểu WASM là gì và không phải gì
- [ ] Phân biệt được khi nào dùng WASM vs JS
- [ ] Biết load và call WASM từ JS
- [ ] Hiểu linear memory model
- [ ] Biết các toolchains: Emscripten, wasm-pack
- [ ] Trả lời được 6/8 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
