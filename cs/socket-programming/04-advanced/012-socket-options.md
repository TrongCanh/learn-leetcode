# 012 — Socket Options

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Socket options, SO_KEEPALIVE, SO_REUSEADDR, TCP_NODELAY, Buffer tuning |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Socket Options — Tại sao cần?

Socket mặc định hoạt động tốt cho hầu hết trường hợp. Nhưng có những tình huống bạn cần **tinh chỉnh** behavior:

```
Mặc định: TCP dùng được cho 90% apps
Nhưng production cần:

  - TCP_NODELAY: Tắt Nagle cho real-time (SSH, gaming)
  - SO_KEEPALIVE: Phát hiện dead connections
  - SO_REUSEADDR: Restart server không lỗi
  - SO_SNDBUF: Tăng buffer cho high-throughput apps
  - SO_LINGER: Control close() behavior
```

### 🔍 2. Các Socket Options quan trọng

#### 2.1 SO_REUSEADDR & SO_REUSEPORT

```python
import socket

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# SO_REUSEADDR = Cho phép bind vào port đang TIME_WAIT
# CỰC KỲ quan trọng cho production servers
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

# SO_REUSEPORT (Linux 3.9+) = Nhiều processes bind cùng port
# Dùng cho: load balancing, multi-process servers
# ⚠️ Datagrams được distribute round-robin
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
```

**Tình huống dùng SO_REUSEPORT:**

```python
# Process A
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
sock.bind(('0.0.0.0', 8080))
sock.listen(128)

# Process B (cùng máy, cùng port!)
sock2 = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock2.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
sock2.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
sock2.bind(('0.0.0.0', 8080))  # Cùng port!
sock2.listen(128)

# OS phân phối connections round-robin → load balancing
# Dùng trong nginx, haproxy workers
```

#### 2.2 SO_KEEPALIVE — Phát hiện dead connections

```python
import socket
import time

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# Bật keepalive
sock.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)

# TCP_KEEPIDLE: Gửi probe sau bao lâu không có traffic
sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPIDLE, 60)

# TCP_KEEPINTVL: Khoảng cách giữa các probes
sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPINTVL, 10)

# TCP_KEEPCNT: Số probe trước khi coi là dead
sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPCNT, 3)
```

**Keepalive hoạt động như thế nào:**

```
Timeline:
  0s: Last data sent
  60s: TCP_KEEPIDLE → gửi probe #1
  70s: TCP_KEEPINTVL → probe #2
  80s: probe #3
  90s: probe #4 → Không reply → Connection DEAD

→ Default: 75 phút trước khi phát hiện dead!
  (Linux: tcp_keepalive_time = 7200s = 2 tiếng)

→ Production: Nên dùng application-level heartbeat
  (gửi message mỗi 30s, timeout 90s)
```

**Tại sao không nên dùng TCP keepalive cho application-level?**

```
TCP keepalive: "Connection còn sống không?"
→ Dùng cho: NAT timeout, phát hiện crash

Application heartbeat: "Client còn online không?"
→ Dùng cho: game online, chat, trading

→ Application-level heartbeat linh hoạt hơn:
  - Tần suất tùy chỉnh
  - Message chứa timestamp, sequence number
  - Có thể gửi thông tin bổ sung (latency, load)
```

#### 2.3 TCP_NODELAY — Tắt Nagle Algorithm

```python
import socket

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# Mặc định: TCP_NODELAY = 0 (Nagle BẬT)
# Nagle: Gửi data khi buffer đầy HOẶC ACK nhận được
# → Giảm overhead cho bulk transfer

# Bật TCP_NODELAY = 1 (Nagle TẮT)
# Gửi data NGAY LẬP TỨC (sau khi kernel nhận)
# → Giảm latency nhưng tăng overhead
sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
```

**Nagle Algorithm giải thích:**

```
Nagle BẬT (mặc định):
  Client gửi: "H"
    → Buffer, đợi ACK (vì chưa đủ dữ liệu)
  10ms sau: Client gửi: "e"
    → Buffer, đợi ACK
  → RTT = 50ms → mỗi ký tự delay 50ms!
  → SSH typing bị lag nếu Nagle bật

Nagle TẮT (TCP_NODELAY):
  Client gửi: "H" → Gửi NGAY
  → 1 RTT = 50ms per ký tự
  → Tốt cho interactive apps

Dùng TCP_NODELAY khi:
  - SSH/terminal (interactive)
  - Real-time gaming
  - VoIP/audio
  - Sensor data streaming
```

#### 2.4 SO_SNDBUF & SO_RCVBUF — Buffer tuning

```python
import socket

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# Lấy buffer size hiện tại
sndbuf = sock.getsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF)
rcvbuf = sock.getsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF)
print(f"Default: SNDBUF={sndbuf}, RCVBUF={rcvbuf}")
# Thường: SNDBUF=16384, RCVBUF=87380 (Linux)

# Tăng buffer cho high-throughput apps
# ⚠️ Linux tự động nhân đôi giá trị này!
# Vì vậy muốn buffer 1MB → đặt 512KB
sock.setsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF, 1024 * 1024)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 1024 * 1024)
```

**Buffer quá nhỏ → flow control:**

```
Server gửi cực nhanh:
  [send()][send()][send()][send()]─────────────────►

Client buffer đầy:
  [BUFFER FULL]─────────────────────────────────────►
  recv() chậm → buffer đầy → TCP flow control
  Server phải PAUSE → giảm throughput

→ Tăng RCVBUF nếu xử lý chậm
→ Tăng SNDBUF nếu gửi nhiều dữ liệu liên tục
```

#### 2.5 SO_LINGER — Control close()

```python
import socket
import struct

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# SO_LINGER: Control close() behavior

# Mặc định: SO_LINGER disabled
# close() → gửi FIN (graceful), không block

# Bật SO_LINGER với timeout = 0 → RST ngay
sock.setsockopt(socket.SOL_SOCKET, socket.SO_LINGER, struct.pack('ii', 1, 0))
# close() → RST ngay lập tức
# Dùng khi: muốn abort connection ngay (error handling)

# Bật SO_LINGER với timeout = 5s
sock.setsockopt(socket.SOL_SOCKET, socket.SO_LINGER, struct.pack('ii', 1, 5))
# close() → đợi tối đa 5s cho ACK
# Nếu không nhận được → RST
```

#### 2.6 SO_TIMEOUT — recv() timeout

```python
import socket

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect(('127.0.0.1', 9000))

# SO_RCVTIMEO: Timeout cho recv() (milliseconds)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_RCVTIMEO,
                struct.pack('ll', 5, 0))  # 5 seconds

# SO_SNDTIMEO: Timeout cho send() (milliseconds)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_SNDTIMEO,
                struct.pack('ll', 5, 0))  # 5 seconds

# Hoặc dùng helper
sock.settimeout(5.0)  # → sets both RCVTIMEO and SNDTIMEO
```

### 🔍 3. TCP-specific Socket Options

```python
import socket

# ─── Congestion Control (Linux) ───
# TCP_CONGESTION: Thuật toán congestion control
sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_CONGESTION,
                b'cubic')  # Default Linux: CUBIC
sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_CONGESTION,
                b'bbr')   # Google BBR: tốt cho high-latency

# ─── Quick ACK ───
# TCP_QUICKACK: Tắt delayed ACK مؤقتاً
sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_QUICKACK, 1)
# ACK ngay lập tức thay vì đợi 40ms

# ─── Window Scaling ───
# TCP_WINDOW_CLAMP: Cửa sổ nhận tối đa
# Linux auto-negotiate window scaling nếu cả 2 sides bật
# Cho phép window > 64KB (limit không scaling)
sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_WINDOW_CLAMP, 65535)

# ─── Cork & Push ───
# TCP_CORK: "Cork" = không gửi cho đến khi uncork
# Tương tự Nagle nhưng bật/tắt bằng tay
# Dùng: HTTP response — gửi header + body cùng lúc
sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_CORK, 1)
sock.sendall(header)
sock.sendall(body)
sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_CORK, 0)  # Uncork → gửi hết
```

### 🔍 4.getsockopt() — Đọc tất cả options

```python
import socket

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

def get_socket_info(sock):
    """In tất cả socket options quan trọng"""
    info = {}
    try:
        info['SNDBUF'] = sock.getsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF)
        info['RCVBUF'] = sock.getsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF)
        info['KEEPALIVE'] = sock.getsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE)
        info['REUSEADDR'] = sock.getsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR)
        info['NODELAY'] = sock.getsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY)
        info['TYPE'] = sock.type  # SOCK_STREAM = TCP, SOCK_DGRAM = UDP
        info['PROTO'] = sock.proto  # IPPROTO_TCP = 6, IPPROTO_UDP = 17
        info['FILENO'] = sock.fileno()  # File descriptor number
    except OSError:
        pass
    return info

print(get_socket_info(sock))
# {'SNDBUF': 16384, 'RCVBUF': 87380, 'KEEPALIVE': 0, 'REUSEADDR': 0, ...}
```

### 🔍 5. Bảng tổng hợp Socket Options

```
┌──────────────────────┬──────────────┬──────────────────────────────────┐
│ Option               │ Level        │ Mô tả                            │
├──────────────────────┼──────────────┼──────────────────────────────────┤
│ SO_REUSEADDR         │ SOL_SOCKET   │ Reuse address (TIME_WAIT)        │
│ SO_REUSEPORT         │ SOL_SOCKET   │ Reuse port (load balancing)      │
│ SO_KEEPALIVE         │ SOL_SOCKET   │ Phát hiện dead connection        │
│ SO_SNDBUF           │ SOL_SOCKET   │ Send buffer size                 │
│ SO_RCVBUF           │ SOL_SOCKET   │ Receive buffer size               │
│ SO_LINGER           │ SOL_SOCKET   │ close() behavior                 │
│ SO_ERROR            │ SOL_SOCKET   │ Đọc pending errors               │
│ SO_TYPE             │ SOL_SOCKET   │ Socket type (STREAM/DGRAM)        │
│ TCP_NODELAY         │ IPPROTO_TCP  │ Tắt Nagle algorithm               │
│ TCP_KEEPIDLE        │ IPPROTO_TCP  │ Thời gian trước khi keepalive    │
│ TCP_KEEPINTVL       │ IPPROTO_TCP  │ Khoảng cách keepalive probes     │
│ TCP_KEEPCNT         │ IPPROTO_TCP  │ Số keepalive probes              │
│ TCP_CORK            │ IPPROTO_TCP  │ Cork (buffer data)              │
│ TCP_CONGESTION      │ IPPROTO_TCP  │ Thuật toán congestion            │
│ TCP_QUICKACK        │ IPPROTO_TCP  │ Tắt delayed ACK مؤقتاً          │
│ IP_MULTICAST_TTL    │ IPPROTO_IP   │ Multicast TTL                    │
│ IP_ADD_MEMBERSHIP   │ IPPROTO_IP   │ Join multicast group             │
└──────────────────────┴──────────────┴──────────────────────────────────┘
```

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 Khi nào cần tinh chỉnh buffer?

```
High-throughput file server (gửi 100MB files):
  → Tăng SO_SNDBUF: 1MB-4MB
  → Tăng TCP window scaling

Low-latency game server:
  → Giảm buffer (không cần)
  → Bật TCP_NODELAY
  → Tắt TCP_CORK

Web server:
  → SO_REUSEADDR: luôn bật
  → Buffer mặc định thường đủ

Embedded IoT:
  → Giảm buffer để tiết kiệm memory
  → Tăng keepalive để phát hiện device chết
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Đặt SNDBUF/RCVBUF quá lớn** | Kernel tự giới hạn. Đặt 1MB → thực tế 2MB. Quá lớn → wasted memory |
| **Dùng SO_LINGER(0) không cần** | Gây RST → peer nhận error thay vì graceful close |
| **TCP keepalive thay vì app-level heartbeat** | TCP keepalive mặc định 2 giờ mới phát hiện dead |
| **Quên SO_REUSEADDR** | Restart server → "Address in use" → chờ 60s |
| **TCP_NODELAY cho bulk transfer** | Tăng overhead nghiêm trọng → file transfer bị chậm hơn |

### 🔑 Key Insight

> **Socket options = cách tinh chỉnh TCP/UDP để phù hợp với ứng dụng. SO_REUSEADDR gần như LUÔN LUÔN cần bật. TCP_NODELAY cho interactive apps. Keepalive cho long-lived connections.**

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Socket Options
💡 KEY INSIGHT: SO_REUSEADDR = always. TCP_NODELAY = interactive. Buffer tuning = high-throughput.
⚠️ PITFALLS:
  - SO_LINGER(0) gây RST
  - Buffer quá lớn = wasted memory
  - Keepalive quá chậm → dùng app-level heartbeat
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./013-ipv6.md)
