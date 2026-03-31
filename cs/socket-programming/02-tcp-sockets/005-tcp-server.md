# 005 — TCP Server

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | TCP Server, Multi-threaded, Connection handling, Error handling |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. TCP Server Architecture — Tổng quan

TCP Server không đơn giản là "một cái máy chờ request". Nó là một **hệ thống phức tạp** gồm nhiều thành phần:

```
┌─────────────────────────────────────────────────────────────┐
│                    TCP SERVER SYSTEM                         │
│                                                              │
│   Listen Socket (sockfd)                                     │
│   ├── bind(0.0.0.0:8080)     ← Gán port                     │
│   ├── listen(backlog=128)   ← Bật chế độ lắng nghe          │
│   └── accept()              ← Chờ client                    │
│                                                              │
│   Client Socket (client_fd) — MỖI client tạo 1 cái          │
│   ├── send() / recv()       ← Trao đổi dữ liệu              │
│   └── close()               ← Khi xong                      │
│                                                              │
│   Problem: accept() blocks. Nếu xử lý 1 client mất 10s      │
│   → Tất cả client khác CHỜ. Giải pháp? Thread/Async!        │
└─────────────────────────────────────────────────────────────┘
```

### 🔍 2. TCP Server Flow — Từng bước chi tiết

#### Bước 1: Tạo socket

```python
import socket

# TCP IPv4 socket
server_sock = socket.socket(
    family=socket.AF_INET,    # IPv4
    type=socket.SOCK_STREAM,  # TCP (SOCK_DGRAM = UDP)
    proto=0                   # Auto-select protocol (TCP)
)
```

#### Bước 2: Set Socket Options (QUAN TRỌNG!)

```python
# Option 1: SO_REUSEADDR — CHO PHÉP REUSE ADDRESS
# Ngăn lỗi "Address already in use" khi restart server nhanh
server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

# Option 2: SO_REUSEPORT (Linux 3.9+) — Cho phép nhiều process
# cùng bind vào 1 port (hữu ích cho load balancing)
server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)

# Option 3: SO_KEEPALIVE — Tự động gửi heartbeat
# Phát hiện client chết (crash, network drop)
server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)

# Option 4: TCP_NODELAY — Tắt Nagle algorithm
# Gửi data NGAY LẬP TỨC, không đợi buffer đầy
# Dùng cho: SSH, real-time gaming, interactive apps
server_sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
```

#### Bước 3: Bind — Gán địa chỉ

```python
# Bind vào tất cả interfaces, port 8080
server_sock.bind(('0.0.0.0', 8080))
# 0.0.0.0 = mọi interface (WiFi + Ethernet + localhost)
# 127.0.0.1 = chỉ localhost (không truy cập từ bên ngoài)
```

**Tại sao phải bind trước khi listen?**

```
Chưa bind:  Socket tồn tại nhưng CHƯA CÓ địa chỉ
            → OS không biết gửi packet đến đâu

Đã bind:    OS biết: "Port 8080 → process này"
            → Incoming connection đến port 8080 → được route đến socket

Đã listen:  Socket chuyển sang mode "passive"
            → Nhận SYN, reply SYN-ACK, queue connection
```

#### Bước 4: Listen — Bật chế độ lắng nghe

```python
# backlog=128: Tối đa 128 connection đang handshake
# (SYN_RCVD state) được xếp hàng
server_sock.listen(128)
```

**Tại sao backlog quan trọng?**

```
Backlog = 5 (default thấp):
  Client 1-5: SYN_SENT (đợi trong queue)
  Client 6: RST (connection refused — queue full)

Backlog = 128:
  Client 1-128: SYN_SENT (đợi)
  Client 129+: RST

→ Production server nên đặt backlog >= 128
→ Đặt trong nginx: listen 80 backlog=4096;
```

#### Bước 5: Accept — Chấp nhận kết nối

```python
# accept() BLOCKS cho đến khi có client kết nối
# Trả về: (new_socket, client_address)
while True:
    client_sock, client_addr = server_sock.accept()
    print(f"✅ Client kết nối từ: {client_addr}")

    # MỖI client → MỘT socket mới!
    # server_sock vẫn tiếp tục listen, chờ client khác
```

**Sơ đồ nhiều clients:**

```
server_sock (listen socket)
    │
    ├── accept() ──► client_sock_1 ──► Thread 1 xử lý
    │                      (addr: 192.168.1.10:54321)
    ├── accept() ──► client_sock_2 ──► Thread 2 xử lý
    │                      (addr: 10.0.0.5:61234)
    └── accept() ──► client_sock_3 ──► Thread 3 xử lý
                             (addr: 172.16.0.1:55123)
```

### 🔍 3. Xử lý Client — Mô hình đa luồng

#### Mô hình 1: Thread per connection (đơn giản)

```python
import socket
import threading

def handle_client(client_sock, client_addr):
    """Mỗi client chạy trong 1 thread riêng"""
    print(f"[Thread {threading.current_thread().name}] Xử lý {client_addr}")
    try:
        while True:
            data = client_sock.recv(1024)
            if not data:  # Client đóng connection
                print(f"Client {client_addr} đã ngắt kết nối")
                break
            # Xử lý request
            response = process_request(data)
            client_sock.sendall(response)  # Gửi toàn bộ response
    except Exception as e:
        print(f"Lỗi với client {client_addr}: {e}")
    finally:
        client_sock.close()
        print(f"Đã đóng connection với {client_addr}")

def tcp_server():
    server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_sock.bind(('0.0.0.0', 8080))
    server_sock.listen(128)

    print("🖥️  TCP Server đang chạy trên port 8080...")

    while True:
        client_sock, client_addr = server_sock.accept()
        print(f"📥 Connection mới từ: {client_addr}")

        # Tạo thread mới cho client này
        thread = threading.Thread(
            target=handle_client,
            args=(client_sock, client_addr),
            daemon=True  # Thread tự kill khi main process exit
        )
        thread.start()

        # threading.active_count() → số thread đang chạy
        print(f"   Active threads: {threading.active_count() - 1}")

tcp_server()
```

**Ưu điểm:** Đơn giản, mỗi client độc lập
**Nhược điểm:** Mỗi thread chiếm ~8MB stack (1 triệu clients = 8GB RAM). Không scale được.

#### Mô hình 2: Thread Pool (cải tiến)

```python
from concurrent.futures import ThreadPoolExecutor

def tcp_server_threadpool():
    server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_sock.bind(('0.0.0.0', 8080))
    server_sock.listen(128)

    # Thread pool cố định — không tạo thread mới vô hạn
    max_workers = 100
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        while True:
            client_sock, client_addr = server_sock.accept()

            # Submit vào pool — nếu pool full thì đợi
            executor.submit(handle_client, client_sock, client_addr)
            print(f"📥 Task submitted. Pool: {executor._work_queue.qsize()} pending")
```

#### Mô hình 3: Single thread + Non-blocking (event loop)

```python
import socket
import selectors

selector = selectors.DefaultSelector()

def handle_client_events(client_sock, client_addr):
    """Xử lý theo event — không blocking"""
    events = selector.select()  # Blocking có timeout
    for key, mask in events:
        callback = key.data
        callback(key.fileobj)

def tcp_server_async():
    server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_sock.bind(('0.0.0.0', 8080))
    server_sock.listen(128)
    server_sock.setblocking(False)  # NON-BLOCKING!

    # Đăng ký server socket vào selector
    selector.register(server_sock, selectors.EVENT_READ, accept_connection)

    print("🔄 Async server đang chạy (epoll/kqueue)...")
    while True:
        events = selector.select(timeout=1.0)  # Chờ event
        for key, mask in events:
            callback = key.data
            callback(key.fileobj)
```

### 🔍 4. recv() vs recvall() — Vấn đề quan trọng

```python
# ❌ DÙNG recv() một lần = SAI!
data = client_sock.recv(1024)
# recv(1024) có thể trả về:
#   - 0 bytes: Client đóng
#   - Ít hơn 1024 bytes (packet nhỏ hơn buffer)
#   - Nhiều hơn 1024 bytes? KHÔNG — max 1024 bytes

# ✅ DÙNG recv() trong loop = ĐÚNG!
def recv_exact(sock, size):
    """Luôn nhận ĐỦ size bytes"""
    data = b''
    while len(data) < size:
        chunk = sock.recv(size - len(data))
        if not chunk:
            raise ConnectionError("Connection closed unexpectedly")
        data += chunk
    return data

# ✅ HOẶC recv() cho đến delimiter
def recv_until(sock, delimiter=b'\r\n\r\n'):
    """Nhận cho đến khi gặp delimiter (VD: HTTP header)"""
    data = b''
    while True:
        chunk = sock.recv(1)  # Đọc từng byte
        data += chunk
        if data.endswith(delimiter):
            return data

# ✅ HOẶC recv() cho đến Content-Length (HTTP)
def recv_http_body(sock, content_length):
    """Nhận HTTP body đủ content-length bytes"""
    body = b''
    while len(body) < content_length:
        chunk = sock.recv(min(4096, content_length - len(body)))
        body += chunk
    return body
```

### 🔍 5. Error Handling — Xử lý lỗi

```python
import socket
import errno

def robust_recv(sock, buffer_size=1024):
    """Recv với xử lý lỗi đầy đủ"""
    try:
        data = sock.recv(buffer_size)
        if data == b'':
            # Client đóng connection bình thường (EOF)
            print("🔌 Client đóng connection")
            return None, 'closed'
        return data, 'ok'

    except BlockingIOError:
        # Non-blocking mode — không có data trong buffer
        return b'', 'would_block'

    except socket.timeout:
        return b'', 'timeout'

    except ConnectionResetError:
        # Client gửi RST (hard close — không qua 4-way handshake)
        print("⚠️  Client reset connection")
        return None, 'reset'

    except BrokenPipeError:
        # Gửi vào connection đã đóng bên kia
        print("⚠️  Broken pipe (peer đã đóng)")
        return None, 'broken_pipe'

    except OSError as e:
        if e.errno == errno.EPIPE:
            return None, 'epipe'
        return None, f'error: {e}'
```

### 🔍 6. Shutdown vs Close — Khi nào dùng?

```python
# close() — Đóng hoàn toàn socket (cả read + write)
sock.close()

# shutdown(how) — Đóng 1 hướng, giữ hướng kia
sock.shutdown(socket.SHUT_RD)   # Không nhận thêm data nữa
sock.shutdown(socket.SHUT_WR)   # Gửi FIN → "Tôi không gửi nữa" (half-close)
sock.shutdown(socket.SHUT_RDWR) # Cả 2 hướng = close()
```

**Tại sao cần shutdown()?**

```
Client                              Server
  │                                    │
  │  sendall(response)                │
  │  recv() ←─┐                       │  (đang đợi thêm request)
  │      BUFFER CÒN DATA              │  (không close vội)
  │                                    │
  │  shutdown(WR) ─── FIN ──────────► │  recv() returns "" → biết client done
  │                                    │
  │  recv() ──────────────────────────►│  (có thể gửi thêm data nếu cần)
  │                                    │
  │  shutdown(RD) ◄── FIN ─────────── │  Server close → FIN cuối
```

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 Tại sao TCP Server cần Thread/Async?

**Blocking nature của accept() và recv():**

```
Blocking (truyền thống):
  accept()  chờ client 1 ──────────────────► client 1 kết nối
  recv()    chờ client 1 gửi ──────────────► nhận request
  process() xử lý 5s ─────────────────────► xử lý
  send()    gửi response ─────────────────► gửi
  close()   đóng connection ──────────────► đóng

→ Client 2 và 3 BỊ BLOCK hoàn toàn trong 5s!
→ Nếu server có 1000 clients đồng thời = THẢM HỌA
```

**Solution:**

| Solution | Cách hoạt động | Dùng khi |
|----------|---------------|----------|
| Thread per connection | Mỗi client = 1 OS thread | < 100 clients |
| Thread pool | Giới hạn số thread | 100-1000 clients |
| Async/Event loop | 1 thread xử lý nhiều clients | > 1000 clients |
| Pre-fork (gốc C) | Process pool (fork) | Linux production |

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Dùng `recv()` không có loop** | Không đọc hết dữ liệu, để lại trong buffer → protocol confusion |
| **Không `close()` client socket** | FD leak → "Too many open files" → crash sau vài ngày |
| **Xử lý client trong main thread** | Server bị block → không accept client mới |
| **Dùng `recv(1024)` cho binary protocol** | Packet có thể lớn hơn hoặc nhỏ hơn 1024 |
| **Không set timeout** | Client malicious gửi data chậm → server bị chiếm |

### 🔑 Key Insight

> **TCP Server = Listen socket (chờ) + N Client sockets (giao tiếp)**
>
> Mỗi `accept()` trả về socket MỚI cho client đó. Socket gốc vẫn listen. Không bao giờ giao tiếp bằng listen socket.

### 🚀 Visual: TCP Server Lifecycle

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  socket()  →  setsockopt()  →  bind()  →  listen()        │
│      │            │              │           │             │
│   Tạo FD    Reuse addr     Gán port    Bật listen          │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                   EVENT LOOP                         │  │
│  │                                                     │  │
│  │   while True:                                       │  │
│  │     client, addr = accept()  ← BLOCKING             │  │
│  │     → new client socket fd                          │  │
│  │                                                     │  │
│  │     if NEW_CLIENT:                                  │  │
│  │       create_thread(handle_client, client)          │  │
│  │                                                     │  │
│  │   def handle_client(client):                        │  │
│  │     while True:                                      │  │
│  │       data = recv()   ← BLOCKING cho từng client    │  │
│  │       if not data: break                            │  │
│  │       response = process(data)                      │  │
│  │       sendall(response)                             │  │
│  │     close()                                         │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  close(server_fd)   ← Khi shutdown                         │
└────────────────────────────────────────────────────────────┘
```

---

## ✅ Ví dụ hoàn chỉnh

```python
"""
TCP Echo Server với Thread Pool
- Xử lý nhiều clients đồng thời
- Echo lại message với prefix "[ECHO]"
- Handle graceful shutdown (SIGINT)
"""

import socket
import signal
import sys
from concurrent.futures import ThreadPoolExecutor

class TCPServer:
    def __init__(self, host='0.0.0.0', port=8080):
        self.host = host
        self.port = port
        self.server_sock = None
        self.running = False
        self.pool = ThreadPoolExecutor(max_workers=50)

    def setup(self):
        self.server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
        self.server_sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
        self.server_sock.bind((self.host, self.port))
        self.server_sock.listen(128)
        self.server_sock.settimeout(1.0)  # Timeout để check running flag

        # Graceful shutdown
        signal.signal(signal.SIGINT, self.shutdown)
        signal.signal(signal.SIGTERM, self.shutdown)

    def handle_client(self, client_sock, client_addr):
        print(f"[+] Client {client_addr} connected")
        try:
            client_sock.settimeout(30.0)  # 30s timeout
            while True:
                data = client_sock.recv(4096)
                if not data:
                    print(f"[-] Client {client_addr} disconnected")
                    break
                message = data.decode('utf-8').strip()
                print(f"[{client_addr}] Received: {message}")
                response = f"[ECHO] {message}\n"
                client_sock.sendall(response.encode('utf-8'))
        except socket.timeout:
            print(f"[!] Client {client_addr} timed out")
        except Exception as e:
            print(f"[!] Error with {client_addr}: {e}")
        finally:
            client_sock.close()

    def run(self):
        self.setup()
        self.running = True
        print(f"🖥️  TCP Echo Server chạy tại {self.host}:{self.port}")
        print("   Ctrl+C để tắt\n")

        while self.running:
            try:
                client_sock, client_addr = self.server_sock.accept()
                self.pool.submit(self.handle_client, client_sock, client_addr)
            except socket.timeout:
                continue  # Kiểm tra running flag
            except OSError:
                break  # Socket đã đóng

    def shutdown(self, signum, frame):
        print("\n🛑 Shutting down server...")
        self.running = False
        if self.server_sock:
            self.server_sock.close()
        self.pool.shutdown(wait=True)
        print("✅ Server đã tắt")
        sys.exit(0)

if __name__ == '__main__':
    server = TCPServer(port=8080)
    server.run()
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: TCP Server Architecture
💡 KEY INSIGHT: accept() trả về socket MỚI cho mỗi client. Luôn xử lý trong thread riêng hoặc async.
⚠️ PITFALLS:
  - recv() không đảm bảo đọc đủ dữ liệu → phải loop
  - Không close() socket → FD leak
  - Xử lý trong main thread → server bị block
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./006-tcp-client.md)
