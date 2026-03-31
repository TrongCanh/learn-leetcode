# 014 — Socket Security

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | TLS/SSL, Encryption, Common attacks, Hardening |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Socket Security — Tại sao cần?

**TCP/UDP plaintext = như gửi thư không phong bì:**

```
Plaintext socket:
  Client ──── "Tên: John, Password: secret123" ────► Server

  Ai đứng giữa (MITM) đọc được TẤT CẢ:
  ┌────────────────────────────────────────────────┐
  │  [Attacker] ─────── intercept ────────→ [...]   │
  │                                             │
  │  Username: John ✅                          │
  │  Password: secret123 ✅                   │
  │  Credit Card: 4111-1111-1111-1111 ✅      │
  └────────────────────────────────────────────────┘

Encrypted socket (TLS):
  Client ──── [ENCRYPTED: abc#@!$%^&*()] ────► Server
                                            ↑
  Attacker thấy: asdfhjklasdhfkljasdhfkjasdhfkjasdh
  → Không hiểu gì
```

### 🔍 2. TLS — Transport Layer Security

**TLS = SSL + cải tiến.** SSL đã bị deprecate, TLS 1.2 và 1.3 là tiêu chuẩn hiện đại.

```
┌─────────────────────────────────────────────────────────────┐
│              TLS LAYERS                                      │
│                                                             │
│  Application (HTTP, SMTP, FTP)                               │
│       │                                                       │
│  ┌────────────────────────────────────────────────────┐     │
│  │                  TLS (or SSL)                       │     │
│  │  ├── Authentication (X.509 certificates)          │     │
│  │  ├── Encryption (AES, ChaCha20)                   │     │
│  │  ├── Integrity (HMAC, AEAD)                       │     │
│  │  └── Key Exchange (DH, ECDHE)                      │     │
│  └────────────────────────────────────────────────────┘     │
│       │                                                       │
│  TCP ───────────────────────────────────────────────────►   │
│       │                                                       │
│  IP ───────────────────────────────────────────────────►    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 🔍 3. TLS Handshake — Chi tiết

```
TLS 1.2 Handshake (2 RTT):

Client                              Server
  │                                    │
  │  ─── ClientHello ────────────────►│
  │     (TLS version, cipher suites,   │
  │      client random, SNI)          │
  │                                    │
  │  ◄── ServerHello ─────────────────│
  │     (TLS version, cipher,          │
  │      server random, cert,          │
  │      server_key_exchange)         │
  │                                    │
  │  ─── CertificateVerify ──────────►│
  │     (verify: "tôi có private key")│
  │                                    │
  │  ─── ClientKeyExchange ──────────►│
  │     (premaster secret or DH params)│
  │                                    │
  │  [Both compute session key locally] │
  │                                    │
  │  ─── ChangeCipherSpec ───────────►│
  │  ─── Finished ───────────────────►│  ← encrypted
  │                                    │
  │  ◄── ChangeCipherSpec ────────────│
  │  ◄── Finished ────────────────────│  ← encrypted
  │                                    │
  │      APPLICATION DATA (encrypted)   │


TLS 1.3 Handshake (1 RTT) — Cải tiến:

Client                              Server
  │                                    │
  │  ─── ClientHello + KeyShare ─────►│  ← gửi key ngay
  │                                    │
  │  ◄── ServerHello + KeyShare ───────│
  │  ◄── {EncryptedExtensions} ───────│
  │  ◄── {Certificate} ────────────────│
  │  ◄── {CertificateVerify} ─────────│
  │  ◄── Finished ────────────────────│
  │                                    │
  │  [Both have session key!]          │
  │                                    │
  │      APPLICATION DATA (encrypted)   │
```

### 🔍 4. Python TLS Server & Client

```python
import socket
import ssl
import os

# ─── Tạo self-signed certificate (cho dev) ───
def create_self_signed_cert():
    """Tạo certificate và key cho development"""
    os.system("""
        openssl req -x509 -newkey rsa:2048 \
            -keyout key.pem -out cert.pem \
            -days 365 -nodes \
            -subj "/CN=localhost"
    """)

def create_ssl_context():
    """Tạo SSL context với certificate"""
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)

    # Load certificate và private key
    context.load_cert_chain(
        certfile='cert.pem',
        keyfile='key.pem'
    )

    # Minimum TLS version
    context.minimum_version = ssl.TLSVersion.TLSv1_2

    # Ciphers allowed
    context.set_ciphers('ECDHE+AESGCM:DHE+AESGCM:ECDHE+CHACHA20')

    return context


def tls_server(host='0.0.0.0', port=9443):
    """TLS/SSL TCP Server"""
    # Tạo SSL context
    context = create_ssl_context()

    # Tạo TCP server
    raw_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    raw_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    raw_sock.bind((host, port))

    # Wrap với TLS
    server_sock = context.wrap_socket(raw_sock, server_side=True)
    server_sock.listen(128)

    print(f"🔒 TLS Server đang chạy trên {host}:{port}")
    print("   (https://localhost:9443)")

    while True:
        client_sock, client_addr = server_sock.accept()

        # Kiểm tra certificate của client
        cert = client_sock.getpeercert()
        print(f"📥 Client: {client_addr}")
        if cert:
            print(f"   Certificate subject: {cert.get('subject')}")

        # Giao tiếp bình thường (đã mã hóa)
        data = client_sock.recv(4096)
        print(f"   Nhận (encrypted): {data.decode()}")
        client_sock.sendall(b"Encrypted response OK!")

        client_sock.close()


# ─── TLS Client ───
def tls_client(host='localhost', port=9443):
    """TLS/SSL TCP Client"""
    # Tạo SSL context cho client
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)

    # Load CA certificates để verify server
    # CHO PRODUCTION: dùng system CA bundle
    context.load_verify_locations('cert.pem')

    # Verify server certificate
    context.check_hostname = True
    context.verify_mode = ssl.CERT_REQUIRED

    # Tạo socket và wrap với TLS
    raw_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_sock = context.wrap_socket(raw_sock, server_hostname=host)

    server_sock.connect((host, port))
    print(f"🔒 Đã kết nối TLS đến {host}:{port}")

    # Kiểm tra certificate của server
    cert = server_sock.getpeercert()
    print(f"   Server certificate: {cert}")

    # Giao tiếp (đã mã hóa)
    server_sock.sendall(b"Hello over TLS!")
    response = server_sock.recv(4096)
    print(f"   Response: {response.decode()}")

    server_sock.close()
```

### 🔍 5. Certificate — X.509

```
Certificate = "Chứng minh thư" của website/server

┌─────────────────────────────────────────────────────────────┐
│              X.509 Certificate Structure                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Subject (Ai?):                                            │
│    CN = google.com                                          │
│    O = Google LLC                                          │
│    C = US                                                  │
│                                                             │
│  Issuer (Ai cấp?):                                         │
│    CN = GTS CA 1O1                                          │
│    O = Google Trust Services LLC                           │
│    C = US                                                  │
│                                                             │
│  Validity (Còn hạn?):                                      │
│    Not Before: 2024-01-01                                  │
│    Not After:  2025-01-01                                  │
│                                                             │
│  Public Key:                                                │
│    Algorithm: RSA-2048                                      │
│    Key: 2048-bit RSA public exponent                       │
│                                                             │
│  Signature:                                                 │
│    Algorithm: SHA256withRSA                                 │
│    Value: d9f8a7b6c5d4e3f2... (256 bytes)                │
│    → Được tạo bởi Issuer's private key                     │
│                                                             │
│  Extensions:                                                │
│    Subject Alternative Name (SAN):                         │
│      DNS: google.com, www.google.com, mail.google.com      │
│    Key Usage: Digital Signature, Key Encipherment           │
│    Basic Constraints: CA: FALSE                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 🔍 6. Các cuộc tấn công phổ biến & cách phòng

#### 6.1 Man-in-the-Middle (MITM)

```
Attacker đứng giữa Client và Server:
  Client ──── data ────► [Attacker] ──── data ────► Server
           ←──────────── [Attacker] ←───────────────

→ Attacker đọc/gửi đổi tất cả dữ liệu
→ Client nghĩ đang nói chuyện với Server thật

Phòng:
  ✅ TLS với certificate verification
  ✅ Certificate Pinning
  ✅ HSTS (HTTP Strict Transport Security)
```

#### 6.2 SSL Stripping

```
Attacker downgrade HTTPS → HTTP:
  Client ──── "https://bank.com" ────► [Attacker]
                                            │
                                            ▼
              "http://bank.com" ──────► Server (nhận HTTP)
                                          (Attacker đọc plaintext)

Phòng:
  ✅ HSTS: Header yêu cầu browser luôn dùng HTTPS
     Strict-Transport-Security: max-age=31536000; includeSubDomains
  ✅ HSTS Preload: hardcoded trong browsers
  ✅ Certificate hợp lệ
```

#### 6.3 Certificate Spoofing

```
Attacker tạo certificate giả cho "google.com":
  openssl req -x509 -newkey rsa:2048 \
      -subj "/CN=google.com" \
      -keyout fake_key.pem -out fake_cert.pem

  → Browser warning: "Certificate không hợp lệ!"
  → Attacker cần user IGNORE warning

Phòng:
  ✅ Luôn verify certificate (không bỏ qua warning)
  ✅ Certificate Pinning: chỉ trust certificate cụ thể
  ✅ Public Key Pinning (HPKP) - deprecated
  ✅ Certificate Transparency (CT) logs
```

#### 6.4 Buffer Overflow / Injection

```python
# ❌ DANGER: Buffer overflow
def vulnerable_handler(sock):
    buf = bytearray(1024)  # Fixed 1024 bytes
    n = sock.recv_into(buf)  # ⚠️ Không check size!
    # Nếu attacker gửi 2000 bytes → overflow!

# ✅ SAFE: Kiểm tra size trước
def safe_handler(sock):
    MAX_SIZE = 1024
    data = sock.recv(MAX_SIZE)
    if len(data) == MAX_SIZE:
        # Có thể còn data → warning hoặc reject
        print("⚠️  Data có thể bị truncate")
    # Xử lý...
```

#### 6.5 DoS via Socket Exhaustion

```python
# ❌ DANGER: Không giới hạn
def no_limit_server():
    server = socket.socket(...)
    server.listen()
    while True:
        client, _ = server.accept()
        # Attacker kết nối vô hạn → FD exhaustion

# ✅ SAFE: Giới hạn
def rate_limited_server():
    MAX_CONNECTIONS = 1000
    MAX_REQUEST_SIZE = 1024 * 1024  # 1MB
    client_count = 0

    while True:
        client, _ = server.accept()
        client_count += 1

        if client_count > MAX_CONNECTIONS:
            client.send(b"HTTP/1.1 503 Service Unavailable\r\n")
            client.close()
            client_count -= 1
            continue

        # Timeout cho client
        client.settimeout(30.0)
```

### 🔍 7. Socket Security Checklist

```python
"""
Security Checklist cho Production Socket Applications
"""

SECURITY_CHECKLIST = {
    # ─── Encryption ───
    "TLS": "Dùng TLS 1.2+ thay vì plaintext",
    "TLS_VERSION": "Tắt SSLv3, TLS 1.0, 1.1 (CVE-prone)",
    "CIPHERS": "Chỉ dùng strong ciphers (AES-128+, ChaCha20)",
    "CERT_PINNING": "Pin certificate cho mobile apps",

    # ─── Authentication ───
    "AUTH": "Xác thực client (certificate, token, OAuth)",
    "SNI": "Dùng SNI cho virtual hosting với TLS",
    "CLIENT_CERT": "Mutual TLS (mTLS) cho high-security",

    # ─── Input Validation ───
    "INPUT_SIZE": "Giới hạn request size (DoS protection)",
    "INPUT_SANITIZE": "Sanitize tất cả input",
    "ENCODING": "Validate encoding (UTF-8, không có null bytes)",

    # ─── Resource Limits ───
    "CONNECTION_LIMIT": "Giới hạn số connections",
    "TIMEOUT": "Set timeouts cho tất cả sockets",
    "BUFFER_SIZE": "Giới hạn buffer size",
    "RATE_LIMIT": "Rate limiting cho API endpoints",

    # ─── Network Security ───
    "BIND_ADDR": "Bind vào internal interface, không 0.0.0.0 nếu không cần",
    "FIREWALL": "Chỉ mở port cần thiết",
    "PRIVATE_NET": "Không expose dev servers ra internet",
    "VPN": "Dùng VPN cho internal services",

    # ─── Logging & Monitoring ───
    "LOG_CONNECTIONS": "Log connections (ip, time, bytes)",
    "LOG_ERRORS": "Log errors nhưng KHÔNG log passwords/secrets",
    "ALERT_ANOMALIES": "Alert khi connection count bất thường",
}
```

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 TLS vs mTLS

```
TLS (Server-side certificate):
  Client verify Server ✅
  Server don't verify Client ❌

  → Web browsing: user verify website ✅, website verify user ❌
  → Dùng password/OAuth để verify user

mTLS (Mutual TLS):
  Client verify Server ✅
  Server verify Client ✅

  → IoT devices
  → Microservices communication
  → Enterprise VPN
  → API-to-API communication
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Dùng HTTP thay vì HTTPS** | Data truyền plaintext — ai cũng đọc được |
| **Bỏ qua certificate warning** | Attacker có thể dùng certificate giả |
| **Hardcode password/keys trong code** | Attacker đọc source code → leak credentials |
| **Không set timeout** | Slow-loris attack: client gửi rất chậm → chiếm connection |
| **Không giới hạn buffer size** | Attacker gửi 10GB → memory exhaustion |

### 🔑 Key Insight

> **Security là layered defense. TLS mã hóa data, nhưng cần thêm authentication, rate limiting, input validation, và monitoring để có hệ thống an toàn.**

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Socket Security (TLS, hardening)
💡 KEY INSIGHT: TLS mã hóa, certificate verify identity, input validation ngăn injection, rate limiting chống DoS.
⚠️ PITFALLS:
  - Plaintext sockets = như gửi thư không phong bì
  - Certificate verification bị bypass = MITM có thể xảy ra
  - Không set timeout = slow-loris
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](../05-real-world/015-http-websocket.md)
