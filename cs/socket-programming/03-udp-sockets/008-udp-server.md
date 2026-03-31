# 008 — UDP Server

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | UDP Server, Datagram, recvfrom, sendto, Connectionless |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. UDP Server vs TCP Server — Khác nhau cơ bản

**TCP Server là "người phục vụ bàn"** — nhận order, nấu, mang ra, chờ order tiếp.

**UDP Server là "người đánh tennis"** — đánh bóng qua lại, không cần bắt tay trước, không cần nói "tôi nhận được".

```
┌─────────────────────────────────────────────────────────────┐
│                 TCP SERVER vs UDP SERVER                    │
├─────────────────────────────────────────────────────────────┤
│  TCP Server                                                │
│  socket() → bind() → listen() → accept() → recv()/send()  │
│  └── Mỗi client = 1 socket mới                            │
│  └── Blocking accept()                                     │
│  └── recv() đọc từ QUEUE                                  │
│  └── Connection state trên server                          │
├─────────────────────────────────────────────────────────────┤
│  UDP Server                                                │
│  socket() → bind() → recvfrom()/sendto()                   │
│  └── KHÔNG listen(), KHÔNG accept()                        │
│  └── Một socket xử lý TẤT CẢ clients                      │
│  └── recvfrom() trả về CẢ data VÀ địa chỉ sender         │
│  └── KHÔNG có connection state                              │
└─────────────────────────────────────────────────────────────┘
```

### 🔍 2. UDP Server Lifecycle — Đơn giản hơn TCP rất nhiều

```python
import socket

def udp_server():
    # 1. Tạo UDP socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    # 2. Bind (giống TCP)
    sock.bind(('0.0.0.0', 9000))

    print("🖥️  UDP Server đang chạy trên port 9000...")
    print("   (Không có listen(), không có accept())")

    while True:
        # 3. recvfrom() — nhận data + địa chỉ client
        # recvfrom() BLOCKS cho đến khi có datagram đến
        data, client_addr = sock.recvfrom(4096)

        print(f"📥 Từ {client_addr}: {data.decode()}")

        # 4. Xử lý
        response = process(data)

        # 5. sendto() — gửi trả lại cho client
        # Cần chỉ định DESTINATION vì UDP không có connection
        sock.sendto(response, client_addr)

    # 6. close()
    sock.close()
```

**So sánh với TCP:**

```python
# TCP:
client_sock, addr = server_sock.accept()  # accept() trả socket mới
client_sock.recv(1024)                    # recv() không cần addr
client_sock.send(response)                # send() không cần addr

# UDP:
data, addr = sock.recvfrom(1024)          # recvfrom() trả cả addr
sock.sendto(response, addr)              # sendto() cần addr
```

### 🔍 3. recvfrom() vs recv() — Sự khác biệt quan trọng

```python
# recv() — TCP (connection-oriented)
data = sock.recv(1024)
# Trả về: bytes
# Không biết ai gửi — connection đã xác định sender qua accept()

# recvfrom() — UDP (connectionless)
data, sender_addr = sock.recvfrom(1024)
# Trả về: (bytes, (ip, port))
# Biết được ai gửi — cần thiết vì không có connection

# recvmsg() — Advanced, nhận cả message và auxiliary data
# recvmm() — nhận message (Linux 2.6.16+)
```

### 🔍 4. Tại sao UDP Server không cần listen() và accept()?

**TCP cần listen() vì:**
```
TCP là connection-oriented:
  1. Client gửi SYN → Server nhận
  2. Server tạo socket mới, queue connection
  3. Server accept() → trả socket mới cho client
  4. Client nhận SYN-ACK → connection ESTABLISHED

→ Cần quản lý STATE của mỗi connection
→ listen() bật backlog queue
→ accept() lấy từng connection từ queue
```

**UDP không cần vì:**
```
UDP là connectionless:
  1. Client gửi datagram
  2. Server nhận datagram, trích xuất địa chỉ
  3. Server gửi reply

→ Không có connection state
→ Không có handshake
→ Không có queue
→ recvfrom() đọc datagram TIẾP THEO, với sender address
```

### 🔍 5. UDP Server với Thread — Xử lý nhiều clients đồng thời

```python
import socket
import threading

def udp_server_threaded():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(('0.0.0.0', 9000))

    print("🖥️  UDP Server (threaded) đang chạy...")

    # Shared state
    active_clients = {}  # {addr: last_seen_timestamp}

    while True:
        data, client_addr = sock.recvfrom(4096)
        print(f"📥 {client_addr}: {data.decode().strip()}")

        # Xử lý trong thread riêng
        thread = threading.Thread(
            target=handle_client,
            args=(sock, data, client_addr, active_clients)
        )
        thread.start()

def handle_client(sock, data, client_addr, shared_dict):
    """Xử lý 1 client trong thread riêng"""
    message = data.decode().strip().lower()

    if message == "ping":
        response = b"PONG"
    elif message == "time":
        import datetime
        response = datetime.datetime.now().isoformat().encode()
    elif message == "quit":
        response = b"BYE"
    else:
        response = f"ECHO: {message}".encode()

    sock.sendto(response, client_addr)
    print(f"📤 → {client_addr}: {response.decode()}")
```

### 🔍 6. UDP Server với asyncio — Hiệu quả hơn thread

```python
import asyncio

async def udp_server_async():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(('0.0.0.0', 9000))
    sock.setblocking(False)  # Non-blocking cho asyncio

    loop = asyncio.get_event_loop()

    print("🔄 UDP Server (async) đang chạy...")

    while True:
        try:
            # Đọc data không blocking
            data, addr = await loop.sock_recvfrom(sock, 4096)
            print(f"📥 Từ {addr}: {data.decode().strip()}")

            # Xử lý async
            asyncio.create_task(handle_client_async(sock, data, addr))

        except BlockingIOError:
            await asyncio.sleep(0.01)  # Không có data, đợi 10ms

async def handle_client_async(sock, data, addr):
    response = f"ECHO: {data.decode().strip()}".encode()
    await asyncio.get_event_loop().sock_sendto(sock, response, addr)
    print(f"📤 → {addr}: {response.decode()}")
```

### 🔍 7. SO_REUSEADDR cho UDP — Quan trọng!

```python
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
sock.bind(('0.0.0.0', 9000))
```

**UDP reuse addr hoạt động khác TCP:**

```
TCP REUSEADDR:
  → Bind vào port đang TIME_WAIT
  → Hữu ích khi restart server

UDP REUSEADDR:
  → Nhiều processes bind cùng port
  → Mỗi datagram gửi đến 1 process
  → Dùng cho: multicast, load balancing

  Process A: bind(9000)
  Process B: bind(9000)  ← OK với SO_REUSEADDR
  Process C: bind(9000)  ← OK

  → Datagram gửi đến port 9000 → round-robin → A, B, C
```

### 🔍 8. UDP Fragmentation — Khi packet quá lớn

```
Ethernet MTU = 1500 bytes
IP Header = 20 bytes
UDP Header = 8 bytes
Data tối đa = 1500 - 20 - 8 = 1472 bytes

→ Gửi > 1472 bytes → IP tự động FRAGMENT thành nhiều packets
→ Mỗi fragment có IP header riêng (8 bytes)
→ Fragments có thể đến KHÔNG đúng thứ tự
→ Mất 1 fragment → TOÀN BỘ datagram BỊ DISCARD

Best practice:
  → Giữ UDP packet < 1472 bytes
  → Hoặc < 512 bytes (legacy limit cho DNS)
  → Hoặc implement fragmentation ở application layer
```

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 Khi nào UDP Server cần biết ai gửi?

```
Cần biết (dùng recvfrom()):
  - Chat server: cần reply về đúng người
  - Game server: cần update đúng player
  - DNS server: cần reply đúng resolver
  - VoIP: cần gửi audio về đúng endpoint

Không cần biết (dùng recv()):
  - Broadcast server: gửi cho tất cả, không cần reply
  - Log collector: chỉ ghi nhận, không phản hồi
  - Monitoring: chỉ nhận metrics, không reply
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Dùng `recv()` thay vì `recvfrom()`** | Mất thông tin sender → không biết reply cho ai |
| **Gửi response mà không `sendto()` đúng địa chỉ** | TCP gửi tự động, UDP phải chỉ định destination |
| **Không set `SO_REUSEADDR`** | Restart server ngay → "Address already in use" |
| **Gửi packet > 1472 bytes** | IP fragmentation → mất 1 fragment → mất cả datagram |
| **Tưởng `recvfrom()` trả về message boundaries** | UDP không bảo toàn message boundaries — có thể nhận 2 sends trong 1 recv |

### 🔑 Key Insight

> **UDP Server đơn giản hơn TCP: Không listen(), không accept(), chỉ recvfrom() + sendto().**
>
> Mỗi recvfrom() trả về cả data VÀ sender address. Bạn phải dùng address đó để reply.

---

## ✅ Ví dụ hoàn chỉnh

```python
"""
UDP DNS-like Server đơn giản
- Nhận domain name query
- Trả về IP address (giả lập)
- Không cần connection
"""

import socket
import signal
import sys

# Giả lập DNS database
DOMAIN_DB = {
    b'google.com': '142.250.185.46',
    b'github.com': '140.82.121.4',
    b'youtube.com': '142.250.185.46',
    b'facebook.com': '157.240.1.35',
}

def resolve_domain(domain):
    """Resolve domain → IP (giả lập)"""
    domain = domain.decode('utf-8').strip().lower()
    for dns_name, ip in DOMAIN_DB.items():
        if dns_name.decode() == domain:
            return ip
    return None

def udp_dns_server(host='0.0.0.0', port=5353):
    """UDP DNS Server giả lập"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind((host, port))

    print(f"🖥️  UDP DNS Server chạy tại {host}:{port}")
    print("   (Gõ Ctrl+C để tắt)\n")

    # Graceful shutdown
    def shutdown(signum, frame):
        print("\n🛑 Tắt server...")
        sock.close()
        sys.exit(0)
    signal.signal(signal.SIGINT, shutdown)

    query_count = 0

    while True:
        try:
            # recvfrom() block cho đến khi có datagram
            query, client_addr = sock.recvfrom(4096)
            query_count += 1

            query_str = query.decode('utf-8').strip()
            print(f"[Query #{query_count}] {client_addr} → {query_str!r}")

            # Parse query (format: "QUERY:domainname")
            if query_str.startswith("QUERY:"):
                domain = query_str[6:].encode()
            else:
                domain = query_str.encode()

            # Resolve
            ip = resolve_domain(domain)

            if ip:
                response = f"OK:{domain.decode()}:{ip}".encode()
            else:
                response = b"NOTFOUND:" + domain

            # Gửi response về đúng client
            sock.sendto(response, client_addr)
            print(f"  Response: {response.decode()}")

        except Exception as e:
            print(f"Lỗi: {e}")

if __name__ == '__main__':
    # Chạy server
    udp_dns_server(port=5353)
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: UDP Server lifecycle
💡 KEY INSIGHT: UDP = connectionless. recvfrom() trả về data + sender address. Reply bằng sendto().
⚠️ PITFALLS:
  - Dùng recv() không có addr
  - Packet > 1472 bytes → fragmentation
  - SO_REUSEADDR cho UDP = multicast support
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./009-udp-client.md)
