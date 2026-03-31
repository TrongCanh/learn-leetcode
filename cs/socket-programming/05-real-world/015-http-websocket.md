# 015 — HTTP & WebSocket

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | HTTP/1.1, HTTP/2, HTTP/3 (QUIC), WebSocket, SSE |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. HTTP — Protocol ở tầng ứng dụng

**HTTP = HyperText Transfer Protocol.** Đây là protocol phổ biến nhất thế giới. Nó chạy **trên TCP** (L4), dùng cổng **80 (HTTP)** và **443 (HTTPS)**.

```
HTTP hoạt động như thế nào?

Browser                              Server
  │                                    │
  │  TCP Connection (port 80/443)      │
  │                                    │
  │  ──── HTTP Request ────────────────►│
  │      GET / HTTP/1.1                 │
  │      Host: example.com              │
  │      Accept: text/html              │
  │      [blank line]                   │
  │                                    │
  │  ◄─── HTTP Response ────────────────│
  │      HTTP/1.1 200 OK               │
  │      Content-Type: text/html        │
  │      Content-Length: 1256           │
  │      [blank line]                   │
  │      <html>...</html>              │
  │                                    │
  │  TCP Connection đóng (hoặc reuse)  │
```

### 🔍 2. HTTP/1.1 — Chi tiết

#### Request structure

```
┌──────────────────────────────────────────────────────────┐
│  Request Line                                           │
│  GET /path/to/resource HTTP/1.1                        │
├──────────────────────────────────────────────────────────┤
│  Headers (Key: Value)                                   │
│  Host: example.com                                     │
│  User-Agent: Mozilla/5.0                                │
│  Accept: text/html,application/json                    │
│  Accept-Language: en-US,vi;q=0.9                       │
│  Accept-Encoding: gzip, deflate, br                    │
│  Connection: keep-alive                                 │
│  Cache-Control: no-cache                               │
│  [blank line]                                          │
├──────────────────────────────────────────────────────────┤
│  Body (POST/PUT/PATCH)                                │
│  username=john&password=secret                         │
└──────────────────────────────────────────────────────────┘
```

#### Response structure

```
┌──────────────────────────────────────────────────────────┐
│  Status Line                                             │
│  HTTP/1.1 200 OK                                       │
├──────────────────────────────────────────────────────────┤
│  Headers                                                │
│  Date: Tue, 01 Jan 2024 00:00:00 GMT                   │
│  Server: Apache/2.4                                     │
│  Content-Type: text/html; charset=utf-8                │
│  Content-Length: 1256                                   │
│  Cache-Control: max-age=3600                           │
│  Set-Cookie: session_id=abc123; HttpOnly; Secure       │
│  [blank line]                                          │
├──────────────────────────────────────────────────────────┤
│  Body                                                  │
│  <!DOCTYPE html>...                                    │
└──────────────────────────────────────────────────────────┘
```

#### HTTP Methods

| Method | Safe | Idempotent | Body | Use case |
|--------|------|-----------|------|---------|
| GET | ✅ | ✅ | ❌ | Read resource |
| POST | ❌ | ❌ | ✅ | Create resource |
| PUT | ❌ | ✅ | ✅ | Replace resource |
| PATCH | ❌ | ❌ | ✅ | Partial update |
| DELETE | ❌ | ✅ | ❌ | Delete resource |
| HEAD | ✅ | ✅ | ❌ | Headers only |
| OPTIONS | ✅ | ✅ | ❌ | CORS preflight |

#### HTTP Status Codes

```
1xx Informational
  100 Continue: "Tiếp tục gửi body"
  101 Switching Protocols: "Tôi sẽ upgrade lên WebSocket"

2xx Success
  200 OK: Thành công
  201 Created: Tạo thành công
  204 No Content: Thành công, không có body

3xx Redirection
  301 Moved Permanently: Redirect vĩnh viễn
  302 Found: Redirect tạm thời
  304 Not Modified: Dùng cache

4xx Client Error
  400 Bad Request: Lỗi request
  401 Unauthorized: Cần đăng nhập
  403 Forbidden: Không có quyền
  404 Not Found: Không tìm thấy
  429 Too Many Requests: Rate limit

5xx Server Error
  500 Internal Server Error: Lỗi server
  502 Bad Gateway: Proxy/Load balancer lỗi
  503 Service Unavailable: Server quá tải
  504 Gateway Timeout: Proxy timeout
```

### 🔍 3. HTTP/1.1 Limitations & Pipelining

```
Vấn đề: Mỗi request phải đợi response trước khi gửi tiếp

HTTP/1.1 without Pipelining:
  Request 1 ──────────────────────────────► Response 1 ◄────────────────────
  Request 2 ──────────────────────────────► Response 2 ◄────────────────────
  Request 3 ──────────────────────────────► Response 3 ◄────────────────────
  ↓ Mỗi request chờ previous response xong

HTTP/1.1 with Pipelining (ít dùng):
  Request 1 ──────────────────────────────►
  Request 2 ──────────────────────────────► Response 1 ◄────────────────────
  Request 3 ──────────────────────────────► Response 2 ◄────────────────────
  Response 3 ◄────────────────────
  ↓ Không chờ, gửi liên tục

→ HTTP/1.1 Pipelining có vấn đề: HOL blocking
→ Các browsers tắt mặc định
→ Cần parallel connections (6-8 connections/domain)
```

### 🔍 4. WebSocket — Full-duplex Communication

**WebSocket = HTTP upgrade.** Client bắt đầu với HTTP request, sau đó "upgrade" lên WebSocket.

```
HTTP Request (Upgrade):
  GET /ws HTTP/1.1
  Host: server.com
  Connection: Upgrade
  Upgrade: websocket
  Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
  Sec-WebSocket-Version: 13

HTTP Response:
  HTTP/1.1 101 Switching Protocols
  Upgrade: websocket
  Connection: Upgrade
  Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=

← Sau dòng này → WebSocket Protocol BẮT ĐẦU
← Không còn HTTP nữa, truyền frames
```

#### WebSocket Frame Structure

```
┌────────────────────────────────────────────────────────┐
│  0                   1                   2                   3        │
│  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1      │
│ +-+-+-+-+-------+-+-------------+-------------------------------+      │
│ |F|R|R|R| opcode|M| Payload len |    Extended payload length    |      │
│ |I|S|S|S|  (4) |A|     (7)     |             (16/64)           |      │
│ |N|V|V|V|       |S|             |   (if payload len==126/127)  |      │
│ | |1|2|3|       |K|             |                               |      │
│ +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - -+      │
│ │     Extended payload length continued, if payload len == 127   │      │
│ + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +      │
│ |               Masking-key, if MASK set to 1                   │      │
│ + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +      │
│ │                      Payload Data                              │      │
│ +----------------------------------------------------------------+      │
└────────────────────────────────────────────────────────────────┘

FIN (1 bit): 1 = đây là frame cuối cùng của message
opcode (4 bits):
  0x0 = continuation
  0x1 = text frame
  0x2 = binary frame
  0x8 = close
  0x9 = ping
  0xA = pong
MASK (1 bit): 1 = payload được mask (client→server luôn masked)
Payload length: 7 bits (0-125), hoặc 7+16 bits, hoặc 7+64 bits
```

#### WebSocket Server Implementation

```python
import socket
import hashlib
import base64
import threading

def websocket_server(port=8080):
    """WebSocket Server đơn giản"""
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('0.0.0.0', port))
    server.listen(5)

    print(f"🖥️  WebSocket Server đang chạy trên port {port}")

    while True:
        client, addr = server.accept()
        print(f"📥 Client: {addr}")
        thread = threading.Thread(target=handle_ws_client, args=(client, addr))
        thread.start()

def handle_ws_client(client, addr):
    # ─── HTTP Upgrade Handshake ───
    request = client.recv(4096).decode('utf-8')
    print(f"HTTP Request:\n{request[:200]}")

    # Parse headers
    headers = {}
    for line in request.split('\r\n'):
        if ':' in line:
            key, value = line.split(':', 1)
            headers[key.strip().lower()] = value.strip()

    if headers.get('upgrade') != 'websocket':
        client.close()
        return

    # WebSocket key
    ws_key = headers.get('sec-websocket-key')
    ws_accept = compute_ws_accept(ws_key)

    # HTTP 101 Response
    response = (
        "HTTP/1.1 101 Switching Protocols\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        f"Sec-WebSocket-Accept: {ws_accept}\r\n"
        "\r\n"
    )
    client.sendall(response.encode())
    print("✅ WebSocket handshake thành công!")

    # ─── WebSocket Frame Loop ───
    while True:
        frame = recv_ws_frame(client)
        if frame is None:
            break

        opcode, payload = frame

        if opcode == 0x8:  # Close frame
            print("🔌 Client đóng WebSocket")
            send_ws_frame(client, 0x8, b"")
            break

        elif opcode == 0x1:  # Text frame
            message = payload.decode('utf-8')
            print(f"📥 Message: {message}")

            # Echo lại
            response = f"Echo: {message}"
            send_ws_frame(client, 0x1, response.encode('utf-8'))

        elif opcode == 0x9:  # Ping
            send_ws_frame(client, 0xA, b"")  # Pong

    client.close()

def compute_ws_accept(key):
    """Compute Sec-WebSocket-Accept"""
    GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
    accept = base64.b64encode(
        hashlib.sha1((key + GUID).encode()).digest()
    ).decode()
    return accept

def recv_ws_frame(sock):
    """Receive một WebSocket frame"""
    data = sock.recv(2)
    if len(data) < 2:
        return None

    fin = (data[0] & 0x80) != 0
    opcode = data[0] & 0x0F
    masked = (data[1] & 0x80) != 0
    payload_len = data[1] & 0x7F

    if payload_len == 126:
        ext = sock.recv(2)
        payload_len = int.from_bytes(ext, 'big')
    elif payload_len == 127:
        ext = sock.recv(8)
        payload_len = int.from_bytes(ext, 'big')

    mask_key = b''
    if masked:
        mask_key = sock.recv(4)

    payload = sock.recv(payload_len)
    if masked:
        payload = bytes(b ^ mask_key[i % 4] for i, b in enumerate(payload))

    return opcode, payload

def send_ws_frame(sock, opcode, payload):
    """Send một WebSocket frame"""
    frame = bytearray()
    frame.append(0x80 | opcode)  # FIN + opcode
    if len(payload) < 126:
        frame.append(len(payload))
    elif len(payload) < 65536:
        frame.append(126)
        frame.extend(len(payload).to_bytes(2, 'big'))
    else:
        frame.append(127)
        frame.extend(len(payload).to_bytes(8, 'big'))
    frame.extend(payload)
    sock.sendall(bytes(frame))
```

### 🔍 5. HTTP/2 & HTTP/3

```
┌──────────────────────────────────────────────────────────┐
│         HTTP Evolution                                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  HTTP/1.1 (1999)                                        │
│  ├── Text-based protocol                                │
│  ├── Connection: keep-alive (6-8 parallel domains)     │
│  ├── HOL Blocking: request 2 phải chờ request 1       │
│  └── Header không nén, lặp lại nhiều lần               │
│                                                          │
│  HTTP/2 (2015)                                          │
│  ├── Binary framing (thay vì text)                     │
│  ├── Multiplexing: nhiều streams trong 1 connection   │
│  ├── Server Push: server gửi trước không cần request  │
│  ├── Header compression (HPACK)                        │
│  └── Frame: DATA, HEADERS, SETTINGS, PING, etc.        │
│                                                          │
│  HTTP/3 (2022)                                          │
│  ├── Dựa trên QUIC (UDP) thay vì TCP                   │
│  ├── 0-RTT / 1-RTT handshake (nhanh)                  │
│  ├── Connection migration: đổi IP mà không disconnect │
│  ├── Packet loss chỉ ảnh hưởng stream bị mất          │
│  └── No HOL blocking at transport layer                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 🔍 6. SSE — Server-Sent Events

```python
"""
SSE = Server-Sent Events = One-way server push
Dùng HTTP, không cần WebSocket

Client                           Server
  │                                │
  │  GET /events HTTP/1.1          │
  │  Accept: text/event-stream    │
  │                                │
  │  ◄─── event: notification     │
  │  ◄─── data: {"msg":"hi"}      │
  │  ◄─── event: notification     │
  │  ◄─── data: {"msg":"bye"}     │
  │                                │
"""

def sse_server():
    """SSE Server đơn giản"""
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('0.0.0.0', 8080))
    server.listen(5)

    while True:
        client, _ = server.accept()

        # HTTP Response với event-stream
        response = (
            "HTTP/1.1 200 OK\r\n"
            "Content-Type: text/event-stream\r\n"
            "Cache-Control: no-cache\r\n"
            "Connection: keep-alive\r\n"
            "\r\n"
        )
        client.sendall(response.encode())

        # Gửi events liên tục
        import time
        count = 0
        while True:
            count += 1
            event = f"event: notification\r\ndata: {{'count': {count}}}\r\n\r\n"
            client.sendall(event.encode())
            time.sleep(1)
```

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 HTTP vs WebSocket vs SSE vs HTTP/2 Push

```
Khi nào dùng gì?

┌──────────────────┬─────────────┬──────────────┬─────────────────────────────┐
│                  │ HTTP/1.1/2 │  WebSocket  │  SSE                       │
├──────────────────┼─────────────┼──────────────┼─────────────────────────────┤
│ Direction        │ Client→Serv │ Bi-directional│ Server → Client (1-way)  │
│ Connection       │ Short-lived │ Persistent   │ Persistent (HTTP)          │
│ Format           │ Text/Binary │ Binary frames│ Text (event-stream)       │
│ Browser support  │ Universal   │ Universal   │ Modern browsers          │
│ Proxy friendly   │ ✅          │ ❌ (usually)  │ ✅                        │
│ Auto-reconnect   │ ❌          │ Manual      │ ✅ (built-in)             │
│ Use case         │ REST APIs   │ Chat, games │ Notifications, live data  │
└──────────────────┴─────────────┴──────────────┴─────────────────────────────┘
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Dùng HTTP polling thay vì WebSocket** | Polling gửi request mỗi 1s → rất lãng phí. WebSocket mở 1 connection, gửi khi có data |
| **WebSocket trong load balancer không hỗ trợ** | Sticky session cần thiết cho WebSocket (HTTP/2 cũng vậy) |
| **SSE không set Content-Type đúng** | Phải là `text/event-stream` |
| **HTTP/1.1 keep-alive mặc định nhưng không reuse** | Phải `Connection: keep-alive` |
| **WebSocket frame quá lớn** | Không có built-in frame size limit → implement limits |

### 🔑 Key Insight

> **HTTP = request-response (client-driven). WebSocket = bidirectional persistent connection. SSE = server-push over HTTP. HTTP/2 = multiplexing + compression. HTTP/3 = QUIC (UDP) + 0-RTT.**

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: HTTP & WebSocket
💡 KEY INSIGHT: HTTP = request-response. WebSocket = bidirectional frames. WebSocket upgrade từ HTTP via 101 Switching Protocols.
⚠️ PITFALLS:
  - HTTP polling = lãng phí bandwidth
  - WebSocket cần sticky session trong load balancer
  - HTTP/3 dùng QUIC (UDP) thay vì TCP
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./016-rpc-grpc.md)
