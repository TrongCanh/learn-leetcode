# 006 — TCP Client

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | TCP Client, Connection lifecycle, Reconnection, Timeout |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. TCP Client vs Server — Điểm khác biệt

TCP Client và Server **không đối xứng**. Mặc dù cả 2 đều dùng socket, nhưng vai trò hoàn toàn khác nhau:

```
┌─────────────────────────────────────────────────────────────┐
│                     TCP CLIENT vs SERVER                     │
├──────────────────────────┬──────────────────────────────────┤
│       CLIENT             │           SERVER                │
├──────────────────────────┼──────────────────────────────────┤
│ socket() → connect()    │ socket() → bind() → listen()   │
│ - Tạo socket            │ - Tạo socket                    │
│ - Chủ động kết nối      │ - Gán port cố định             │
│ - PORT NGẪU NHIÊN       │ - PORT CỐ ĐỊNH (well-known)     │
│ - IP CỐ ĐỊNH (target)   │ - IP ĐỘNG (any client)         │
│ Gửi request             │ Nhận request → gửi response     │
│ Đợi response             │ Nhiều clients cùng lúc         │
│ close() khi xong        │ Shutdown khi tắt               │
└──────────────────────────┴──────────────────────────────────┘
```

**Tại sao client dùng port ngẫu nhiên?**

```
Client máy bạn có thể mở:
  Port 54321 → kết nối google.com:443
  Port 54322 → kết nối api.github.com:443
  Port 54323 → kết nối redis-server:6379

→ Mỗi connection cần 1 port riêng
→ OS tự chọn port ngẫu nhiên từ 49152-65535 (ephemeral range)
→ Nếu dùng port cố định → chỉ kết nối được 1 server tại 1 thời điểm
```

### 🔍 2. TCP Client Lifecycle — Chi tiết từng bước

#### Bước 1: Tạo socket

```python
import socket

client_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
```

**Điểm khác với server:**
- Client **KHÔNG cần** `SO_REUSEADDR` (vì không bind trước)
- Client **KHÔNG cần** bind → OS tự gán ephemeral port

#### Bước 2: Set Options (tùy chọn)

```python
# Timeout — QUAN TRỌNG! Tránh block vĩnh viễn
client_sock.settimeout(10.0)  # 10 giây

# TCP_KEEPIDLE — Gửi keepalive sau bao lâu không có traffic (Linux)
client_sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPIDLE, 60)

# TCP_KEEPINTVL — Khoảng cách giữa các keepalive probes
client_sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPINTVL, 10)

# TCP_KEEPCNT — Số lần probe trước khi coi là dead
client_sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPCNT, 3)
```

#### Bước 3: Connect — Kết nối

```python
# Connect đến server
server_host = '127.0.0.1'
server_port = 9000

try:
    client_sock.connect((server_host, server_port))
    print(f"✅ Đã kết nối đến {server_host}:{server_port}")
except socket.timeout:
    print("❌ Timeout! Server không phản hồi")
except ConnectionRefusedError:
    print("❌ Connection refused! Server có đang chạy không?")
except socket.gaierror:
    print("❌ Lỗi DNS! Hostname không hợp lệ")
except Exception as e:
    print(f"❌ Lỗi kết nối: {e}")
```

**Connect với timeout:**

```python
# Non-blocking connect (kiểm soát timeout thủ công)
client_sock.setblocking(False)
try:
    client_sock.connect_ex((server_host, server_port))  # Non-blocking
except BlockingIOError:
    pass  # Đang tiến hành (select/poll sẽ notify)

# Đợi cho đến khi writable (có thể dùng select)
import select
ready, _, _ = select.select([], [client_sock], [], 30.0)
if client_sock in ready:
    # Kiểm tra có lỗi không bằng cách đọc
    err = client_sock.getsockopt(socket.SOL_SOCKET, socket.SO_ERROR)
    if err != 0:
        raise ConnectionRefusedError(f"Connect failed: {err}")
    print("✅ Non-blocking connect thành công")
else:
    print("❌ Timeout trong kết nối")
```

#### Bước 4: Giao tiếp — send() / recv()

```python
# Gửi request
message = "Hello, Server!"
client_sock.sendall(message.encode('utf-8'))
# sendall() = gửi toàn bộ cho đến khi hết (không như send() có thể gửi 1 phần)

# Nhận response
response = client_sock.recv(4096)
print(f"Server reply: {response.decode('utf-8')}")
```

#### Bước 5: Close — Đóng kết nối

```python
client_sock.close()  # Gửi FIN → 4-way termination
```

### 🔍 3. Blocking vs Non-blocking Connect

#### Blocking Connect (mặc định)

```python
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.settimeout(10.0)  # Connect sẽ block tối đa 10s

sock.connect(('api.example.com', 443))
# Nếu DNS resolution mất 50ms + handshake mất 100ms → tổng 150ms
# Nếu server offline → chờ 10s rồi timeout
```

#### Non-blocking Connect (cho async apps)

```python
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.setblocking(False)

try:
    sock.connect_ex(('api.example.com', 443))  # Non-blocking
except BlockingIOError:
    pass  # Tiếp tục tiến trình (EAGAIN)

# Cần select/poll để biết khi nào kết nối xong
import select
_, writable, errors = select.select([], [sock], [sock], 30.0)

if sock in writable:
    err = sock.getsockopt(socket.SOL_SOCKET, socket.SO_ERROR)
    if err == 0:
        print("✅ Connected!")
    else:
        print(f"❌ Connect error: {err}")
```

### 🔍 4. Reconnection Logic — Kết nối lại khi mất

**Tại sao connection có thể bị mất?**

```
1. Server restart / crash
2. Network drop (WiFi → 4G switch)
3. NAT timeout (sau 30 phút không có traffic)
4. Firewall reset connection
5. Server quá tải → RST packet
```

**Best practice: Retry với exponential backoff**

```python
import socket
import time
import random

class ResilientTCPClient:
    def __init__(self, host, port, max_retries=5):
        self.host = host
        self.port = port
        self.max_retries = max_retries
        self.sock = None
        self.connected = False

    def connect(self):
        """Kết nối với exponential backoff"""
        retry_delay = 1.0  # Bắt đầu 1 giây
        for attempt in range(self.max_retries):
            try:
                self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                self.sock.settimeout(10.0)

                print(f"🔄 Attempt {attempt + 1}/{self.max_retries}...")
                self.sock.connect((self.host, self.port))

                self.connected = True
                print(f"✅ Kết nối thành công đến {self.host}:{self.port}")
                return True

            except (socket.timeout, ConnectionRefusedError,
                    ConnectionResetError, OSError) as e:
                print(f"❌ Attempt {attempt + 1} thất bại: {e}")

                if attempt < self.max_retries - 1:
                    # Jitter: thêm ngẫu nhiên để tránh thundering herd
                    jitter = random.uniform(0, retry_delay * 0.1)
                    sleep_time = retry_delay + jitter
                    print(f"   Đợi {sleep_time:.2f}s trước retry...")
                    time.sleep(sleep_time)
                    retry_delay = min(retry_delay * 2, 30.0)  # Max 30s
                else:
                    print(f"❌ Hết retries sau {self.max_retries} lần")
                    return False

        return False

    def send_with_retry(self, data, max_retries=3):
        """Gửi với retry nếu mất kết nối"""
        for attempt in range(max_retries):
            if not self.connected:
                if not self.connect():
                    raise ConnectionError("Không thể kết nối")

            try:
                self.sock.sendall(data)
                return True
            except (BrokenPipeError, ConnectionResetError,
                    ConnectionError, OSError) as e:
                print(f"⚠️  Send failed: {e}")
                self.connected = False
                if attempt < max_retries - 1:
                    print("   Thử kết nối lại...")
        return False

    def recv_with_timeout(self, buffer_size=4096, timeout=None):
        """Nhận với timeout"""
        if timeout:
            self.sock.settimeout(timeout)

        while True:
            try:
                data = self.sock.recv(buffer_size)
                if not data:
                    self.connected = False
                    return None  # Server đóng
                return data
            except socket.timeout:
                return b''  # Timeout nhưng connection còn
            except (ConnectionResetError, BrokenPipeError):
                self.connected = False
                return None

    def close(self):
        if self.sock:
            try:
                self.sock.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass
            self.sock.close()
            self.sock = None
            self.connected = False
```

### 🔍 5. TCP Client cho HTTP — Ví dụ thực tế

**TCP Client thực chất là những gì thư viện HTTP như `requests` dùng bên dưới:**

```python
import socket
import time

class SimpleHTTPClient:
    """
    HTTP Client đơn giản — dùng raw TCP socket
    Đây là những gì thư viện như 'requests' làm bên dưới
    """

    CRLF = '\r\n'

    def __init__(self, host, port=80, timeout=10.0):
        self.host = host
        self.port = port
        self.sock = None
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.settimeout(timeout)
        self.sock.connect((host, port))

    def get(self, path='/'):
        """Gửi HTTP GET request"""
        request = [
            f"GET {path} HTTP/1.1",
            f"Host: {self.host}",
            "Connection: close",  # Đóng connection sau response
            "User-Agent: SimpleTCPClient/1.0",
            "Accept: */*",
            "",  # Empty line = end of headers
            ""
        ]
        http_request = self.CRLF.join(request)
        self.sock.sendall(http_request.encode('utf-8'))

        # Nhận response
        response = b''
        while True:
            chunk = self.sock.recv(4096)
            if not chunk:
                break
            response += chunk

        return response.decode('utf-8')

    def close(self):
        self.sock.close()


# Sử dụng
client = SimpleHTTPClient('example.com', 80)
response = client.get('/')
print(response[:500])  # In 500 bytes đầu
client.close()
```

### 🔍 6. Connection States — Trạng thái kết nối từ phía Client

```
Client                              Server
  │                                    │
  │socket() ──────────────────────────│ CLOSED
  │                                    │
  │connect() ── SYN ─────────────────►│ LISTEN
  │           (blocking)               │
  │                                    │
  │ ◄────── SYN-ACK ──────────────────│ SYN_RCVD
  │                                    │
  │ ACK ──────────────────────────────►│ ESTABLISHED ✅
  │                                    │
  │      DATA exchange...              │
  │                                    │
  │close() ──── FIN ─────────────────►│ CLOSE_WAIT
  │                                    │
  │ ◄────── ACK ─────────────────────│ LAST_ACK
  │                                    │
  │TIME_WAIT (2MSL=60s)               │ CLOSED
  │  ↓                                 │
  │  Đợi hết packets trôi nổi          |
  │  Đảm bảo ACK cuối đến              |
  │                                    |
  │ CLOSED                             |
```

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 Tại sao cần timeout cho connect?

```
Không có timeout:
  Client gọi connect() → Server offline
  → TCP SYN retransmission: 3s → 6s → 12s → 24s → 48s
  → Tổng: 3 + 6 + 12 + 24 + 48 = 93 giây → KHÔCH THỂ CHẤP NHẬN

Có timeout 10s:
  → Đợi 10s → TimeoutException
  → Retry / thông báo user ngay lập tức
```

### 🤔 Khi nào dùng persistent connection?

```
HTTP/1.0 without keep-alive:
  Client → Server: Tạo connection → GET /page1 → đóng → Tạo → GET /page2 → đóng
  → 2 round trips chỉ cho việc tạo/đóng connection!

HTTP/1.1 with keep-alive:
  Client → Server: Tạo connection → GET /page1 → GET /page2 → GET /page3 → đóng
  → Tiết kiệm 4 round trips
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Không set timeout** | Client có thể block vĩnh viễn nếu server không phản hồi |
| **Gọi `connect()` nhiều lần trên cùng socket** | Socket đã connect rồi → `EISCONN` error |
| **Dùng `send()` thay vì `sendall()`** | `send(100)` có thể gửi 80 bytes → data thiếu |
| **Không handle `ConnectionRefusedError`** | Server không chạy → exception không bắt → crash |
| **Close socket rồi dùng tiếp** | OSError: "Bad file descriptor" |

### 🔑 Key Insight

> **TCP Client = Chủ động kết nối + Quản lý ephemeral port + Retry logic**
>
> Khác với server (port cố định, lắng nghe), client phải chủ động retry khi mất kết nối và dùng cổng ngẫu nhiên (49152-65535).

---

## ✅ Ví dụ hoàn chỉnh

```python
"""
TCP Chat Client
- Kết nối đến TCP Echo Server
- Gửi message, nhận echo
- Auto-reconnect khi mất kết nối
- Handle graceful exit
"""

import socket
import sys
import select
import signal

class TCPChatClient:
    def __init__(self, host='127.0.0.1', port=8080):
        self.host = host
        self.port = port
        self.sock = None
        self.running = False

    def connect(self):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.settimeout(30.0)

        print(f"🔌 Đang kết nối đến {self.host}:{self.port}...")
        self.sock.connect((self.host, self.port))
        print(f"✅ Đã kết nối! Gõ message để gửi, 'quit' để thoát.\n")

    def run(self):
        self.connect()
        self.running = True

        while self.running:
            # Đợi user input hoặc server response
            # select.select([sys.stdin], [], [], 0.1) cho non-blocking stdin
            try:
                # Kiểm tra xem có data từ server không
                readable, _, _ = select.select([self.sock], [], [], 0.5)

                if self.sock in readable:
                    # Có data từ server
                    data = self.sock.recv(4096)
                    if not data:
                        print("\n⚠️  Server đã đóng kết nối")
                        break
                    print(f"\nServer: {data.decode('utf-8').strip()}")
                    print("Bạn: ", end='', flush=True)

            except socket.timeout:
                pass
            except (ConnectionResetError, BrokenPipeError):
                print("\n⚠️  Mất kết nối!")
                break

            # Non-blocking stdin (Windows)
            if sys.platform == 'win32':
                import msvcrt
                if msvcrt.kbhit():
                    msg = sys.stdin.readline().strip()
            else:
                # Non-blocking stdin (Unix)
                import fcntl
                import os
                old_flags = fcntl.fcntl(sys.stdin, fcntl.F_GETFL)
                fcntl.fcntl(sys.stdin, fcntl.F_SETFL, old_flags | os.O_NONBLOCK)
                try:
                    msg = sys.stdin.readline().strip()
                except:
                    msg = None
                finally:
                    fcntl.fcntl(sys.stdin, fcntl.F_SETFL, old_flags)

            if msg == 'quit':
                print("👋 Tạm biệt!")
                break

            if msg:
                try:
                    self.sock.sendall(f"{msg}\n".encode('utf-8'))
                except BrokenPipeError:
                    print("⚠️  Không thể gửi — mất kết nối")
                    break

        self.close()

    def close(self):
        self.running = False
        if self.sock:
            try:
                self.sock.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass
            self.sock.close()
            self.sock = None


if __name__ == '__main__':
    host = sys.argv[1] if len(sys.argv) > 1 else '127.0.0.1'
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 8080

    client = TCPChatClient(host, port)
    try:
        client.run()
    except KeyboardInterrupt:
        print("\n⚠️  Interrupted!")
    finally:
        client.close()
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: TCP Client lifecycle
💡 KEY INSIGHT: Client = chủ động connect + ephemeral port + retry logic. Luôn có timeout!
⚠️ PITFALLS:
  - connect() nhiều lần trên cùng socket → EISCONN
  - Dùng send() thay vì sendall()
  - Không handle ConnectionRefusedError
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./007-tcp-state-diagram.md)
