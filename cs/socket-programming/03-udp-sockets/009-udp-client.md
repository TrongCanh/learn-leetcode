# 009 — UDP Client

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | UDP Client, sendto, recvfrom, Connectionless, Timeout |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. UDP Client — Đơn giản hóa

So với TCP Client, UDP Client **đơn giản hơn rất nhiều**. Không handshake, không retry tự động, không connection state.

```
┌─────────────────────────────────────────────────────────────┐
│           TCP CLIENT vs UDP CLIENT                          │
├─────────────────────────────────────────────────────────────┤
│  TCP Client:                                               │
│    socket() → connect() → send()/recv() → close()          │
│    ├── 3-way handshake trước khi gửi                      │
│    ├── OS tự retry khi packet mất                        │
│    ├── Biết connection có "sống" không                    │
│    └── Gửi từ EPHEMERAL PORT                              │
├─────────────────────────────────────────────────────────────┤
│  UDP Client:                                               │
│    socket() → sendto() → recvfrom() → close()              │
│    ├── KHÔNG handshake                                     │
│    ├── Gửi datagram NGAY LẬP TỨC                         │
│    ├── KHÔNG biết packet có đến không                     │
│    └── Gửi từ EPHEMERAL PORT                              │
└─────────────────────────────────────────────────────────────┘
```

### 🔍 2. UDP Client Lifecycle — Từng bước

```python
import socket

def udp_client():
    # 1. Tạo socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    # 2. (Tùy chọn) Bind vào specific port
    # Thường KHÔNG bind → OS tự chọn ephemeral port
    # sock.bind(('0.0.0.0', 0))  # Port 0 = OS tự chọn

    # 3. Set timeout
    sock.settimeout(5.0)

    # 4. Gửi datagram
    server_addr = ('127.0.0.1', 9000)
    message = b"Hello, UDP Server!"
    sock.sendto(message, server_addr)
    print(f"📤 Đã gửi {len(message)} bytes đến {server_addr}")

    # 5. Đợi response (recvfrom trả về data + server address)
    try:
        data, server_addr = sock.recvfrom(4096)
        print(f"📥 Nhận từ {server_addr}: {data.decode()}")
    except socket.timeout:
        print("⏰ Timeout! Server không phản hồi trong 5s")

    # 6. Close
    sock.close()
```

### 🔍 3. connect() cho UDP — Có thể, nhưng khác TCP

**TCP client gọi connect() = thiết lập connection thực sự (3-way handshake).**

**UDP client gọi connect() = "ghi nhớ" địa chỉ, KHÔNG handshake!**

```python
# UDP KHÔNG connect thực sự
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.connect(('127.0.0.1', 9000))  # ⚠️ Không có SYN!

# Sau connect():
# - send() thay vì sendto() — không cần chỉ định addr
sock.send(b"Hello")  # Tự gửi đến addr đã connect

# - recv() thay vì recvfrom() — KHÔNG có sender address
data = sock.recv(4096)  # ⚠️ Không biết ai reply!

# - getpeername() trả về addr đã connect
print(sock.getpeername())  # ('127.0.0.1', 9000)
```

**Tại sao UDP có connect()?**

```
1. Xác định default destination:
   sock.connect(('server.com', 9000))
   sock.send(b"hi")   # gửi đến server.com:9000
   sock.send(b"bye")  # gửi đến server.com:9000

2. Kiểm tra server có reachable không:
   sock.connect(('server.com', 9000))
   # Nếu server ICMP unreachable → connect() raise error

3. Dùng với async I/O:
   selector.register(sock, EVENT_READ)  # "sock sẽ nhận data"

4. Connection-oriented semantics cho UDP:
   connect() + send()/recv() = "connected UDP"
   Dùng khi muốn semantics giống TCP nhưng không cần reliability
```

### 🔍 4. Timeout và Retry — Tự xây

**TCP có timeout tự động và retry. UDP thì KHÔNG.**

```
TCP khi packet mất:
  send() ── packet ──► [MẤT] ── timeout ── retry ──► recv ACK

UDP khi packet mất:
  send() ── packet ──► [MẤT] ── [KHÔNG GÌ XẢY RA]
                    ── recvfrom() timeout
```

**Tự xây retry cho UDP:**

```python
import socket
import time
import random

MAX_RETRIES = 3
TIMEOUT = 2.0

def udp_client_with_retry():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(TIMEOUT)

    server_addr = ('127.0.0.1', 9000)
    request = b"GET_TIME"

    for attempt in range(MAX_RETRIES):
        try:
            sock.sendto(request, server_addr)
            print(f"📤 Attempt {attempt + 1}: Đã gửi request")

            data, addr = sock.recvfrom(4096)
            print(f"✅ Nhận response: {data.decode()}")
            return data

        except socket.timeout:
            print(f"⏰ Attempt {attempt + 1} timeout. Retry...")
            # Exponential backoff
            wait = TIMEOUT * (2 ** attempt) + random.uniform(0, 1)
            time.sleep(wait)

    print("❌ Hết retries.")
    return None
```

### 🔍 5. Gửi nhiều messages — Pattern quan trọng

```python
def udp_multi_message_client():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(2.0)

    server_addr = ('127.0.0.1', 9000)

    # Gửi nhiều messages nhanh
    messages = [b"MSG:1", b"MSG:2", b"MSG:3", b"MSG:4", b"MSG:5"]

    for i, msg in enumerate(messages):
        sock.sendto(msg, server_addr)
        print(f"📤 [{i+1}] Đã gửi: {msg.decode()}")

    # Đợi responses (có thể nhận ít hơn 5 vì UDP unreliable)
    received = []
    deadline = time.time() + 5.0  # 5s window

    while time.time() < deadline:
        sock.settimeout(deadline - time.time())
        try:
            data, addr = sock.recvfrom(4096)
            received.append(data)
            print(f"📥 Response: {data.decode()}")
        except socket.timeout:
            break

    print(f"\n📊 Tổng gửi: {len(messages)}, Tổng nhận: {len(received)}")
    sock.close()
```

### 🔍 6. UDP Client cho DNS Query — Ví dụ thực tế

**DNS (port 53) chủ yếu dùng UDP. Đây là ví dụ thực tế nhất của UDP client:**

```python
import socket
import struct
import random

def build_dns_query(domain):
    """Build DNS query packet"""
    # Transaction ID ngẫu nhiên
    txid = struct.pack('!H', random.randint(0, 65535))

    # Header (12 bytes)
    # Flags: standard query, recursion desired
    flags = struct.pack('!H', 0x0100)
    qdcount = struct.pack('!H', 1)  # 1 question
    ancount = struct.pack('!H', 0)
    nscount = struct.pack('!H', 0)
    arcount = struct.pack('!H', 0)
    header = txid + flags + qdcount + ancount + nscount + arcount

    # Question section
    question = b''
    for part in domain.split('.'):
        question += struct.pack('!B', len(part)) + part.encode()
    question += b'\x00'  # Null terminator
    question += struct.pack('!HH', 1, 1)  # Type A (1), Class IN (1)

    return header + question

def parse_dns_response(data):
    """Parse DNS response packet"""
    # Skip header (12 bytes) + question section
    offset = 12
    # Skip domain name
    while data[offset] != 0:
        offset += 1 + data[offset]
    offset += 5  # null + type + class

    # Parse answer
    # Type A = 1 byte (4 bytes IP)
    ip = socket.inet_ntoa(data[offset+10:offset+14])
    return ip

def dns_lookup(domain):
    """DNS lookup bằng raw UDP"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(3.0)

    query = build_dns_query(domain)
    sock.sendto(query, ('8.8.8.8', 53))  # Google DNS

    response, _ = sock.recvfrom(512)
    ip = parse_dns_response(response)

    sock.close()
    return ip

# Sử dụng
ip = dns_lookup('google.com')
print(f"google.com = {ip}")  # ~142.250.185.46
```

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 Tại sao DNS dùng UDP?

```
1. Query nhỏ: DNS query thường < 512 bytes
   → Không cần fragmentation

2. Nhanh: Không handshake
   → DNS cần speed (web browsing phụ thuộc vào nó)

3. Retry dễ: Client tự retry nếu không nhận được
   → Application-level retry đơn giản hơn protocol-level

4. Scale: DNS server phục vụ hàng triệu queries/giây
   → UDP stateless → server xử lý nhiều hơn TCP

5. Khi nào dùng TCP cho DNS?
   → Zone transfer (AXFR) — dữ liệu lớn
   → Response > 512 bytes (EDNS)
   → DNS over TCP (DoT) cho security
```

### 🤔 UDP Client "connected" vs "unconnected"

```python
# Unconnected UDP (2-way)
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.sendto(data, (host, port))      # Chỉ định destination
data, addr = sock.recvfrom(4096)     # Nhận response

# Connected UDP (1-way semantics)
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.connect((host, port))          # "Liên kết" với server
sock.send(data)                      # Gửi đến connected addr
data = sock.recv(4096)              # Nhận từ connected addr
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Dùng `send()` sau khi `sendto()`** | Sau `sendto()`, OS chưa "connect" socket → `send()` gửi đi đâu? |
| **Gọi `recvfrom()` khi không gửi request** | Block vĩnh viễn (nếu không có timeout) |
| **Không set timeout** | Nếu server down → `recvfrom()` block mãi mãi |
| **Retry không thay đổi TXID** | TXID giống nhau → response cũ bị nhầm |
| **Tưởng `recvfrom()` đợi đủ timeout** | Timeout bắt đầu khi gọi, không khi gửi |

### 🔑 Key Insight

> **UDP Client = Fire and Forget. Bạn phải tự xây retry, timeout, và xác thực.**
>
> `sendto()` gửi datagram, `recvfrom()` nhận reply. Gọi `connect()` chỉ ghi nhớ địa chỉ, không tạo connection thực sự.

---

## ✅ Ví dụ hoàn chỉnh

```python
"""
UDP Chat Client
- Gửi message đến UDP server
- Đợi response với timeout
- Auto-retry khi timeout
"""

import socket
import sys
import time

class UDPChatClient:
    def __init__(self, server_host='127.0.0.1', server_port=9000):
        self.server = (server_host, server_port)
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.settimeout(5.0)
        self.running = False
        self.username = f"User_{random.randint(1000,9999)}"

    def send_message(self, message):
        """Gửi message với retry"""
        MAX_RETRIES = 3
        for attempt in range(MAX_RETRIES):
            try:
                # Đóng gói message với username
                packet = f"{self.username}:{message}".encode()
                self.sock.sendto(packet, self.server)
                print(f"📤 [{attempt+1}] Đã gửi: {message}")

                # Đợi ACK (server gửi response nhỏ xác nhận)
                ack, server = self.sock.recvfrom(256)
                print(f"✅ Server ACK: {ack.decode()}")
                return True

            except socket.timeout:
                print(f"⏰ Timeout. Retry {attempt + 1}/{MAX_RETRIES}...")
                time.sleep(0.5 * (attempt + 1))  # Backoff đơn giản

        print("❌ Hết retries.")
        return False

    def run(self):
        """Interactive mode"""
        self.running = True
        print(f"💬 UDP Chat Client — Username: {self.username}")
        print(f"   Server: {self.server[0]}:{self.server[1]}")
        print("   Gõ 'quit' để thoát, 'list' để xem online users\n")

        while self.running:
            try:
                msg = input(f"{self.username}> ").strip()
                if not msg:
                    continue

                if msg.lower() == 'quit':
                    print("👋 Tạm biệt!")
                    self.running = False
                elif msg.lower() == 'list':
                    # Broadcast request
                    list_packet = f"{self.username}:!LIST".encode()
                    self.sock.sendto(list_packet, self.server)
                    print("📋 Đang lấy danh sách...")
                    try:
                        data, _ = self.sock.recvfrom(4096)
                        print(data.decode())
                    except socket.timeout:
                        print("⏰ Server không phản hồi")
                else:
                    self.send_message(msg)

            except KeyboardInterrupt:
                print("\n⚠️  Interrupted!")
                self.running = False
            except Exception as e:
                print(f"Lỗi: {e}")

        self.sock.close()


if __name__ == '__main__':
    import random
    host = sys.argv[1] if len(sys.argv) > 1 else '127.0.0.1'
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 9000
    client = UDPChatClient(host, port)
    client.run()
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: UDP Client — fire and forget
💡 KEY INSIGHT: UDP = fire and forget. Tự xây retry, timeout, và xác thực. connect() cho UDP chỉ ghi nhớ addr.
⚠️ PITFALLS:
  - Không set timeout → recvfrom() block vĩnh viễn
  - Retry không thay đổi TXID → nhầm response cũ
  - Không phân biệt recv() và recvfrom()
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./010-broadcast-multicast.md)
