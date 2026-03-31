# 011 — Non-blocking I/O

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🔴 Hard |
| **Chủ đề** | select, poll, epoll, kqueue, IOCP, async I/O, event loop |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Vấn đề gốc — Blocking I/O không scale được

Blocking I/O có một vấn đề cốt lõi: **khi một thread bị block, nó không làm gì cả trong khi vẫn chiếm bộ nhớ (stack).**

```
Scenario: 10,000 concurrent HTTP clients

Thread-per-connection:
  10,000 threads × 8MB stack = 80GB RAM! 💥
  Mỗi thread đang BLOCK ở recv()

  → Không khả thi!

Event loop (single thread):
  1 thread × 8MB stack = 8MB
  Thread đọc events từ queue, xử lý nhanh

  → Scale tốt hơn NHIỀU
```

**Tại sao `recv()` block?**

```
recv() implementation:
  1. Kiểm tra kernel buffer
  2. Buffer có data → trả về ngay
  3. Buffer empty → process SLEEP → OS schedule thread khác
  4. Khi data đến → kernel wake thread → trả về

→ Block = sleeping thread = wasted resources
→ Nếu có 10,000 sleeping threads → OS quản lý 10,000 context switches
→ Context switch = ~1-10 microseconds overhead
→ 10,000 threads × context switches = bottleneck
```

### 🔍 2. Giải pháp — Non-blocking I/O Models

```
┌─────────────────────────────────────────────────────────────┐
│              I/O MODELS COMPARISON                           │
│                                                             │
│  Blocking (truyền thống):                                  │
│    Thread calls recv() → SLEEPS until data arrives          │
│    → 1 thread per connection = expensive                    │
│                                                             │
│  Non-blocking (polling):                                   │
│    Thread calls recv() → returns immediately (EAGAIN)       │
│    → Must poll repeatedly = busy-wait CPU spike            │
│                                                             │
│  Multiplexing (select/poll):                               │
│    Thread asks: "Which sockets have data?"                  │
│    → Sleeps until SOME socket is ready                     │
│    → Handle ready sockets one by one                       │
│                                                             │
│  Event-driven (epoll/kqueue/IOCP):                         │
│    Thread registers: "Tell me when socket X is ready"      │
│    → OS notifies when ready → handle                       │
│    → Only active sockets cause CPU usage                   │
│    → O(1) notification, not O(n) scan                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 🔍 3. select() — Multiplexing cổ điển

```python
import socket
import select

def tcp_server_select():
    """
    TCP Server dùng select() để handle nhiều clients
    trong một thread duy nhất.
    """
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('0.0.0.0', 9000))
    server.listen(128)
    server.setblocking(False)  # NON-BLOCKING!

    # read_fds: sockets để đọc (input)
    # write_fds: sockets để ghi (output)
    # except_fds: sockets có exception
    read_fds = [server]  # Bắt đầu với chỉ server socket
    write_fds = []
    message_queues = {}  # socket → queue of messages

    print("🖥️  TCP Server (select) đang chạy...")

    while read_fds:
        # ⚠️ select() BLOCKS cho đến khi CÓ ÍT NHẤT 1 socket ready
        # Hoặc timeout
        readable, writable, exceptional = select.select(
            read_fds,      # Đọc từ đây
            write_fds,     # Ghi vào đây
            read_fds,      # Exception
            timeout=1.0    # Timeout 1s
        )

        # ─── Xử lý sockets sẵn sàng đọc ───
        for sock in readable:
            if sock is server:
                # Server socket ready → có incoming connection!
                client_sock, client_addr = server.accept()
                client_sock.setblocking(False)  # Non-blocking
                read_fds.append(client_sock)
                message_queues[client_sock] = []
                print(f"📥 Client mới: {client_addr}")
            else:
                # Client socket có data đến
                try:
                    data = sock.recv(4096)
                    if data:
                        # Có data → thêm vào queue để gửi
                        message_queues[sock].append(data)
                        write_fds.append(sock)  # Muốn gửi response
                        print(f"📥 [{sock.getpeername()}]: {data.decode().strip()}")
                    else:
                        # Empty data → client đóng
                        print(f"🔌 Client ngắt: {sock.getpeername()}")
                        sock.close()
                        read_fds.remove(sock)
                        if sock in write_fds:
                            write_fds.remove(sock)
                        del message_queues[sock]
                except BlockingIOError:
                    pass  # Không có data (non-blocking)

        # ─── Xử lý sockets sẵn sàng ghi ───
        for sock in writable:
            if sock in message_queues and message_queues[sock]:
                msg = message_queues[sock].pop(0)
                try:
                    sock.sendall(msg.upper())
                except BrokenPipeError:
                    sock.close()
                    read_fds.remove(sock)
                    writable.remove(sock)
                    del message_queues[sock]

        # ─── Xử lý exception sockets ───
        for sock in exceptional:
            print(f"⚠️  Exception on {sock.getpeername()}")
            sock.close()
            read_fds.remove(sock)
            if sock in write_fds:
                write_fds.remove(sock)
            if sock in message_queues:
                del message_queues[sock]
```

**select() có giới hạn nghiêm trọng:**

```c
// select() có giới hạn FD_SETSIZE (thường là 1024)
fd_set read_fds;
FD_ZERO(&read_fds);
FD_SET(fd, &read_fds);  // ⚠️ fd phải < FD_SETSIZE

// Linux: /proc/sys/fs/file-max = giới hạn system-wide
// nhưng select() = giới hạn per-process = 1024
```

### 🔍 4. poll() — Cải tiến từ select()

```python
import select
import poll

def tcp_server_poll():
    """
    poll() tốt hơn select():
    - Không giới hạn FD_SETSIZE (dùng array)
    - Không cần reset fd_set mỗi lần
    - Nhưng vẫn phải scan toàn bộ array O(n)
    """
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('0.0.0.0', 9000))
    server.listen(128)
    server.setblocking(False)

    # poll object
    p = select.poll()
    p.register(server, select.POLLIN)  # Muốn đọc (accept)
    fd_to_sock = {server.fileno(): server}

    # Map: fd → socket
    sock_by_fd = {server.fileno(): server}

    while True:
        events = p.poll(timeout=1000)  # milliseconds!

        for fd, event in events:
            sock = sock_by_fd[fd]

            if event & (select.POLLIN | select.POLLHUP):
                if sock is server:
                    # Accept
                    client, addr = server.accept()
                    client.setblocking(False)
                    fd = client.fileno()
                    sock_by_fd[fd] = client
                    p.register(client, select.POLLIN)
                    print(f"📥 Client: {addr}")
                else:
                    data = sock.recv(4096)
                    if data:
                        sock.sendall(b"ECHO: " + data)
                    else:
                        p.unregister(sock)
                        sock.close()
                        del sock_by_fd[fd]

            if event & select.POLLERR:
                p.unregister(sock)
                sock.close()
                del sock_by_fd[fd]
```

### 🔍 5. epoll() — Linux's solution

**epoll = poll() nhưng với O(1) notification thay vì O(n) scan.**

```python
import select
import epoll  # Linux-specific

def tcp_server_epoll():
    """
    epoll — O(1) notification:
    - Kernel maintain红黑树 (balanced tree) của FDs
    - Khi socket ready → kernel push vào ready list
    - select() = scan toàn bộ → O(n)
    - epoll() = đọc ready list → O(k) với k = số sockets ready
    """
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('0.0.0.0', 9000))
    server.listen(128)
    server.setblocking(False)

    # epoll instance
    ep = select.epoll()
    ep.register(server.fileno(), select.EPOLLIN)  # EPOLLIN = muốn đọc

    fd_to_sock = {server.fileno(): server}

    print("🔄 TCP Server (epoll) đang chạy...")

    while True:
        events = ep.poll(timeout=1.0)  # Returns [(fd, event), ...]

        for fd, event in events:
            sock = fd_to_sock[fd]

            if event & select.EPOLLIN:
                if sock is server:
                    client, addr = server.accept()
                    client.setblocking(False)
                    fd = client.fileno()
                    fd_to_sock[fd] = client

                    # EPOLLET = Edge Triggered
                    # Nếu dùng ET → phải đọc HẾT data cho đến EAGAIN
                    # LT (Level Triggered) = mặc định = dễ dùng hơn
                    ep.register(fd, select.EPOLLIN | select.EPOLLOUT)
                    print(f"📥 Client: {addr}")
                else:
                    data = sock.recv(4096)
                    if data:
                        sock.sendall(data.upper())
                    else:
                        ep.unregister(fd)
                        sock.close()
                        del fd_to_sock[fd]
                        print(f"🔌 Client ngắt")

            elif event & select.EPOLLHUP:
                # Hang up
                ep.unregister(fd)
                sock.close()
                del fd_to_sock[fd]
```

**Edge Triggered (EPOLLET) vs Level Triggered:**

```
Level Triggered (LT) — mặc định:
  - Socket có data → select() trả về socket đó
  - Nếu không xử lý → select() vẫn trả về socket đó lần sau
  - → Dễ: luôn notify khi ready, không sợ miss

Edge Triggered (ET):
  - Socket có data LẦN ĐẦU TIÊN → select() trả về 1 LẦN
  - Nếu không xử lý hết → select() KHÔNG notify nữa
  - → Phức tạp hơn nhưng hiệu suất cao hơn
  - Must use non-blocking socket + loop đến EAGAIN
```

### 🔍 6. kqueue() — macOS/BSD equivalent

```python
import selectors

def tcp_server_kqueue():
    """
    kqueue() — macOS/FreeBSD equivalent của epoll
    selectors module tự động chọn best backend:
      - Linux: epoll
      - macOS: kqueue
      - Windows: IOCP
    """
    selector = selectors.DefaultSelector()

    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SOL_SOCKET, 1)
    server.bind(('0.0.0.0', 9000))
    server.listen(128)
    server.setblocking(False)

    def register(sock, mode):
        """Đăng ký socket với selector"""
        selector.register(sock, mode, data=sock)

    def accept(sock, mask):
        """Xử lý accept"""
        conn, addr = sock.accept()
        conn.setblocking(False)
        register(conn, selectors.EVENT_READ)
        print(f"📥 Client: {addr}")

    def read(conn, mask):
        """Xử lý đọc từ client"""
        data = conn.recv(4096)
        if data:
            conn.sendall(b"ECHO: " + data)
        else:
            selector.unregister(conn)
            conn.close()

    register(server, selectors.EVENT_READ)
    server.setblocking(False)

    while True:
        events = selector.select(timeout=1.0)
        for key, mask in events:
            callback = key.data
            callback(key.fileobj, mask)
```

### 🔍 7. async/await Pattern — High-level

```python
import asyncio

async def handle_client(reader, writer):
    """Xử lý một client bằng async/await"""
    addr = writer.get_extra_info('peername')
    print(f"📥 Client: {addr}")

    while True:
        data = await reader.read(4096)
        if not data:
            break
        writer.write(data.upper())
        await writer.drain()

    await writer.wait_closed()
    print(f"🔌 Client ngắt: {addr}")

async def tcp_server_asyncio():
    """TCP Server với asyncio — đơn giản và hiệu quả"""
    server = await asyncio.start_server(
        handle_client, '0.0.0.0', 9000
    )

    print("🖥️  TCP Server (asyncio) đang chạy...")
    async with server:
        await server.serve_forever()

asyncio.run(tcp_server_asyncio())
```

### 🔍 8. So sánh đầy đủ

```
┌─────────────┬──────────────┬─────────────┬────────────────────────────┐
│   Model     │   Limit      │   Scan      │    Complexity               │
├─────────────┼──────────────┼─────────────┼────────────────────────────┤
│  select()   │  1024 (FD)  │ O(n) scan  │ Low (portable)              │
│  poll()     │  ∞ (array)  │ O(n) scan  │ Medium                      │
│  epoll()    │  ∞          │ O(1) notify│ Medium (Linux only)         │
│  kqueue()   │  ∞          │ O(1) notify│ Medium (macOS/BSD only)     │
│  IOCP       │  ∞          │ O(1) notify│ High (Windows only)        │
│  async/await│  ∞          │ O(1) notify│ Low (cross-platform)        │
└─────────────┴──────────────┴─────────────┴────────────────────────────┘
```

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 Reactor Pattern — Kiến trúc event loop

```
┌────────────────────────────────────────────────────────────┐
│                    REACTOR PATTERN                         │
│                                                             │
│  Event Loop:                                               │
│    while (running):                                         │
│      events = epoll_wait()    // Blocking có timeout       │
│      for (event : events):                                 │
│        handler = event.handler                             │
│        handler.process(event.data)                        │
│                                                             │
│  Các event types:                                          │
│    - READ: có data để đọc                                 │
│    - WRITE: socket sẵn sàng ghi                           │
│    - ERROR: có lỗi                                        │
│    - HUP: peer đóng connection                            │
│                                                             │
│  Event Loop phải:                                          │
│    1. Không blocking lâu (> 1ms)                          │
│    2. Xử lý event nhanh (O(1))                           │
│    3. Ủy thác task nặng cho thread pool                   │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Blocking trong event loop** | Nếu xử lý 1 request mất 10s → tất cả clients bị block |
| **Edge Triggered mà không đọc hết** | EPOLLET: đọc 1 lần → data còn trong buffer → không notify lại |
| **Không handle EAGAIN** | Non-blocking recv/send trả EAGAIN khi buffer full → phải retry |
| **Close socket mà chưa unregister khỏi epoll** | Epoll vẫn notify → stale fd → crash |
| **poll/select trong production server** | select giới hạn 1024 FDs, poll O(n) scan → dùng epoll |

### 🔑 Key Insight

> **Non-blocking I/O = Kernel notify khi socket ready, không polling. epoll/kqueue = O(1) notification, scale hàng triệu connections.**

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Non-blocking I/O (select/poll/epoll)
💡 KEY INSIGHT: select() = O(n) scan (giới hạn 1024). epoll() = O(1) notify (Linux). Dùng selectors module để tự động chọn best backend.
⚠️ PITFALLS:
  - Blocking trong event loop
  - EPOLLET mà không đọc hết
  - Close socket mà không unregister
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./012-socket-options.md)
