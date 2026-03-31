# 003 — Socket API

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Socket API, syscalls, Berkeley Sockets, Address Families |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Socket API là gì?

**Berkeley Socket API** (còn gọi là BSD Sockets) là **giao diện lập trình chuẩn** để giao tiếp qua mạng. Ra đời năm 1983 từ Unix BSD, nó vẫn là nền tảng của hầu hết mọi ngôn ngữ hiện đại.

> Nếu Socket là ngôi nhà, thì Socket API là **bản vẽ thiết kế** + **bộ công cụ xây dựng**.

#### Tại sao phải học cấp thấp này?

```
Ngôn ngữ high-level掩盖了真相:

Python:    socket.connect()   ──►  OS: connect()
Node.js:   net.connect()     ──►  OS: connect()
Java:      Socket.connect()  ──►  OS: connect()
C:         connect()          ──►  OS: connect()

→ Tất cả đều gọi cùng 1 syscall!
→ Hiểu syscall = hiểu cái gốc = debug tốt hơn = optimize được
```

### 🔍 2. Các Syscall cốt lõi

Socket API gồm ~20 syscall chính. Nhưng **chỉ cần 8 cái** là đủ viết chương trình hoàn chỉnh:

```
┌─────────────────────────────────────────────────────────┐
│                   SOCKET LIFECYCLE                       │
│                                                          │
│   SERVER                          CLIENT                 │
│   socket()                        socket()              │
│       │                               │                 │
│   bind()                             (không bind client)  │
│       │                               │                 │
│   listen()                           connect()           │
│       │                               │                 │
│   accept()  ◄───────────────────── connect()            │
│       │                               │                 │
│   read() ←── bidirectional ──→  write()                │
│   write() ──bidirectional ──→   read()                  │
│       │                               │                 │
│   close()                            close()             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### 2.1 `socket()` — Tạo socket

```c
#include <sys/socket.h>

int sockfd = socket(
    domain,      // AF_INET  (IPv4) | AF_INET6 (IPv6) | AF_UNIX (local)
    type,        // SOCK_STREAM (TCP) | SOCK_DGRAM (UDP)
    protocol     // 0 (auto-select: TCP for STREAM, UDP for DGRAM)
);

// Ví dụ:
int tcp_sock = socket(AF_INET, SOCK_STREAM, 0);  // TCP socket
int udp_sock = socket(AF_INET, SOCK_DGRAM, 0);   // UDP socket

// Kiểm tra lỗi:
if (sockfd < 0) {
    perror("socket failed");  // "socket failed: Permission denied"
    exit(EXIT_FAILURE);
}
```

**Address Family (domain):**

| Constant | Ý nghĩa |
|----------|---------|
| `AF_INET` | IPv4 (phổ biến nhất) |
| `AF_INET6` | IPv6 |
| `AF_UNIX` | Unix domain socket (trên cùng máy, rất nhanh) |
| `AF_BLUETOOTH` | Bluetooth |

**Socket Type:**

| Type | Protocol | Khi nào |
|------|---------|---------|
| `SOCK_STREAM` | TCP | Cần reliability |
| `SOCK_DGRAM` | UDP | Cần speed |
| `SOCK_RAW` | Raw IP | Cần kiểm soát IP header (ping, traceroute) |

#### 2.2 `bind()` — Gán địa chỉ cho socket (Server)

```c
#include <netinet/in.h>

struct sockaddr_in server_addr;
server_addr.sin_family      = AF_INET;          // IPv4
server_addr.sin_addr.s_addr = INADDR_ANY;       // Mọi interface (0.0.0.0)
server_addr.sin_port        = htons(8080);      // Port 8080 (network byte order!)

int ret = bind(sockfd, (struct sockaddr*)&server_addr, sizeof(server_addr));
if (ret < 0) {
    perror("bind failed");
    exit(EXIT_FAILURE);
}
```

**Tại sao phải `htons()`?**

```
Máy bạn (x86/x64): Little Endian  → 0x1BB8 = 0xBB 0x01
                                 (low byte first)

Mạng (TCP/IP):    Big Endian      → 0x1BB8 = 0x01 0xBB
                                 (high byte first)

htons() = Host TO Network Short (16-bit)
htonl() = Host TO Network Long  (32-bit)
ntohs() = Network TO Host Short
ntohl() = Network TO Host Long
```

**`INADDR_ANY` vs specific IP:**

```c
// Bind vào tất cả interfaces (Wifi + Ethernet + localhost)
server_addr.sin_addr.s_addr = INADDR_ANY;  // 0.0.0.0

// Chỉ bind vào localhost (chỉ nhận từ máy này)
server_addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);  // 127.0.0.1

// Chỉ bind vào một IP cụ thể (nếu máy có nhiều NIC)
server_addr.sin_addr.s_addr = inet_addr("192.168.1.100");
```

#### 2.3 `listen()` — Chuyển socket sang trạng thái lắng nghe

```c
int backlog = 5;  // Số connection đang handshake (SYN_RCVD) được phép xếp hàng

int ret = listen(sockfd, backlog);
if (ret < 0) {
    perror("listen failed");
    exit(EXIT_FAILURE);
}
```

**Backlog là gì?**

```
Client 1 ──── SYN ──────────► │ SYN_SENT  │
Client 2 ──── SYN ──────────► │ SYN_SENT  │  ← backlog queue (5 cái)
Client 3 ──── SYN ──────────► │ SYN_SENT  │     Đã nhận SYN,
...                           │ ...       │     đang handshake
Client 6 ──── SYN ──────────► │ SYN_SENT  │
                              │           │  ← Quá 5 → RST (refuse)
Client 7 ──── SYN ──────────► │ (timeout) │  ← Connection refused
```

> ⚠️ backlog = số connection **đang handshake** (chưa accept). Không phải tổng số client.

#### 2.4 `accept()` — Chấp nhận connection (Server blocking)

```c
struct sockaddr_in client_addr;
socklen_t client_len = sizeof(client_addr);

// ⚠️ accept() BLOCKS cho đến khi có client kết nối!
int client_sock = accept(sockfd, (struct sockaddr*)&client_addr, &client_len);

printf("Client connected from: %s:%d\n",
    inet_ntoa(client_addr.sin_addr),
    ntohs(client_addr.sin_port));
```

**Điều quan trọng:** `accept()` trả về **socket descriptor mới** cho client đó. Socket gốc (sockfd) vẫn tiếp tục listen. Bạn phải `close(client_sock)` khi xong.

```
Server:
  sockfd (listen socket) ──── listen()
      │
      └── accept() ──── client_sock_1  ──── giao tiếp ──── close(client_sock_1)
      └── accept() ──── client_sock_2  ──── giao tiếp ──── close(client_sock_2)
      └── accept() ──── ...
```

#### 2.5 `connect()` — Kết nối đến server (Client)

```c
struct sockaddr_in server_addr;
server_addr.sin_family = AF_INET;
server_addr.sin_addr.s_addr = inet_addr("127.0.0.1");
server_addr.sin_port = htons(8080);

int ret = connect(sockfd, (struct sockaddr*)&server_addr, sizeof(server_addr));
if (ret < 0) {
    perror("connect failed");  // "connect failed: Connection refused"
    exit(EXIT_FAILURE);
}
```

**Đối với UDP:** `connect()` không thực hiện handshake. Nó chỉ **ghi nhớ địa chỉ** để dùng cho `send()`/`recv()` thay vì `sendto()`/`recvfrom()`.

#### 2.6 `send()` / `recv()` — Gửi/nhận dữ liệu

```c
// TCP
char buf[1024];
ssize_t n = send(client_sock, buf, sizeof(buf), 0);
if (n < 0) perror("send error");

ssize_t m = recv(client_sock, buf, sizeof(buf), 0);
if (m == 0) {
    // Client đã close connection
    close(client_sock);
}

// UDP
ssize_t n = sendto(udp_sock, buf, sizeof(buf), 0,
                   (struct sockaddr*)&dest_addr, sizeof(dest_addr));

ssize_t m = recvfrom(udp_sock, buf, sizeof(buf), 0,
                     (struct sockaddr*)&src_addr, &addr_len);
```

**Flags quan trọng:**

| Flag | Ý nghĩa |
|------|---------|
| `MSG_PEEK` | Đọc mà không xóa khỏi buffer |
| `MSG_DONTWAIT` | Non-blocking (thay vì đặt cờ O_NONBLOCK) |
| `MSG_NOSIGNAL` | Không gửi SIGPIPE khi peer đóng connection |
| `MSG_OOB` | Out-of-band data (TCP urgent data) |

#### 2.7 `close()` — Đóng socket

```c
close(sockfd);
// File descriptor được giải phóng
// TCP → gửi FIN → 4-way termination
// UDP → không có gì (connectionless)
```

### 🔍 3. Complete TCP Server-Client (Python)

#### Server (Python)

```python
import socket

def tcp_server():
    # 1. Tạo socket
    server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # 2. Set option: reuse address (không bị "Address already in use")
    server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    # 3. Bind
    server_sock.bind(('0.0.0.0', 9000))
    print("Server bind vào port 9000")

    # 4. Listen
    server_sock.listen(5)
    print("Server đang lắng nghe...")

    while True:
        # 5. Accept (BLOCKS)
        client_sock, addr = server_sock.accept()
        print(f"Client kết nối: {addr}")

        # 6. Xử lý client (trong thực tế dùng thread/process)
        try:
            while True:
                data = client_sock.recv(1024)
                if not data:  # Client đóng
                    print(f"Client {addr} đã ngắt kết nối")
                    break
                print(f"Từ {addr}: {data.decode()}")
                client_sock.sendall(data.upper())  # Echo back
        except Exception as e:
            print(f"Lỗi: {e}")
        finally:
            client_sock.close()

tcp_server()
```

#### Client (Python)

```python
import socket

def tcp_client():
    # 1. Tạo socket
    client_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # 2. Connect
    client_sock.connect(('127.0.0.1', 9000))
    print("Đã kết nối server!")

    # 3. Giao tiếp
    while True:
        msg = input("Bạn: ")
        if msg.lower() == 'quit':
            break
        client_sock.sendall(msg.encode())
        response = client_sock.recv(1024)
        print(f"Server: {response.decode()}")

    # 4. Close
    client_sock.close()

tcp_client()
```

### 🔍 4. Socket Address Structure (Deep Dive)

```c
// Generic (dùng cho mọi address family)
struct sockaddr {
    sa_family_t  sa_family;    // Address family (AF_INET, AF_INET6, ...)
    char         sa_data[14]; // Address data (IP + Port)
};

// IPv4 (phổ biến nhất)
struct sockaddr_in {
    sa_family_t     sin_family;  // AF_INET
    in_port_t       sin_port;   // Port (big-endian!)
    struct in_addr  sin_addr;   // IP address
    char            sin_zero[8]; // Padding (= 0)
};

struct in_addr {
    uint32_t s_addr;  // 32-bit IPv4 address
};

// IPv6
struct sockaddr_in6 {
    sa_family_t      sin6_family;   // AF_INET6
    in_port_t        sin6_port;     // Port
    uint32_t         sin6_flowinfo;  // Flow label
    struct in6_addr  sin6_addr;      // 128-bit IP
    uint32_t         sin6_scope_id; // For link-local addresses
};
```

**Memory layout thực tế:**

```
sockaddr_in (16 bytes):
┌────────┬────────┬────────────────────┬─────────────────────┐
│ Family │  Port  │      IP Address      │    Zero Padding     │
│ (2B)   │  (2B)  │       (4B)          │       (8B)          │
│ AF_INET│htons(80)│   0x0100007F       │        0            │
│        │  0080  │  127.0.0.1          │                     │
└────────┴────────┴────────────────────┴─────────────────────┘
```

### 🔍 5. Helper Functions

```c
#include <arpa/inet.h>

// Chuyển string IP ↔ binary
inet_pton(AF_INET, "192.168.1.1", &addr.sin_addr);  // string → binary
inet_ntop(AF_INET, &addr.sin_addr, buf, INET_ADDRSTRLEN);  // binary → string

// Port conversion
htons(8080);   // Host → Network Short (big-endian)
ntohs(...);    // Network → Host Short
htonl(...);    // Host → Network Long
ntohl(...);    // Network → Host Long
```

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 Tại sao phải `htons()` cho port mà không cần cho IP string?

Port là 16-bit integer. Thứ tự byte trong memory (endianness) khác nhau giữa máy local và network protocol. Nên phải convert.

IP string nhập vào qua `inet_pton()` → đã tự convert rồi. Không cần `htonl()` nữa.

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Quên `htons()` cho port** | Port trên wire sẽ sai. Port 8080 → có thể thành 11526 (byte-swap) → không kết nối được |
| **Bind port 80 mà không có root** | Linux: port < 1024 chỉ root được bind. Dùng nginx/proxy hoặc sudo |
| **Không `close()` socket** | Memory leak → file descriptor exhaustion → "Too many open files" |
| **Dùng `recv()` 1 lần cho HTTP request** | HTTP request có thể chunked. Phải loop cho đến khi có delimiter ( `\r\n\r\n`) hoặc Content-Length |
| **Server để `accept()` trong loop không có thread** | Nếu xử lý 1 client mất 10s → tất cả client khác bị block |
| **`SO_REUSEADDR` không dùng** | Restart server ngay → "Address already in use" trong 2-4 phút (TIME_WAIT) |

### 🔑 Key Insight

> **Socket = File Descriptor + Network Address**
>
> Trong Unix/Linux, socket là một loại **file descriptor** đặc biệt. `read()`, `write()`, `close()` đều hoạt động với socket. Đây là lý do hệ điều hành dùng cùng API cho file và network.

---

## ✅ Ghi nhớ

```
TCP Server Flow:
  socket()  → bind()  → listen()  → accept()  → recv()/send()  → close()
     │          │          │          │             │
  Tạo FD   Gán port  Bật chế độ  Đợi client  Trao đổi dữ liệu
             (server)  lắng nghe  Trả về FD mới  với client cụ thể

TCP Client Flow:
  socket()  → connect()  → send()/recv()  → close()
     │            │             │
  Tạo FD    Kết nối    Trao đổi dữ liệu
           (server:port)
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Socket API lifecycle
💡 KEY INSIGHT: Socket = file descriptor + network address. Mọi syscall đều xoay quanh lifecycle socket().
⚠️ PITFALLS:
  - Quên htons() cho port
  - SO_REUSEADDR cho server
  - close() socket sau khi xong
  - recv() không đảm bảo nhận đủ dữ liệu
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./004-osi-model.md)
