# 🧠 Computer Science — Socket Programming

> Socket là một trong những cơ chế giao tiếp liên process (IPC) phổ biến nhất, là nền tảng cho hầu hết ứng dụng mạng hiện đại — từ web server đến real-time chat.

**Thời gian**: 6–8 tuần | **Tổng**: 17 bài | **0/17 ✅ Đã hoàn thành**

---

## 📋 Tổng quan

Socket programming là kỹ thuật lập trình cho phép các tiến trình (process) giao tiếp qua mạng thông qua **Socket API**. Đây là cơ chế nền tảng của:

- 🌐 Web browsing (HTTP qua TCP sockets)
- 💬 Real-time chat (WebSocket)
- 📧 Email (SMTP/POP3/IMAP)
- 📦 File transfer (FTP)
- 🎮 Online gaming
- ☁️ Microservices communication (gRPC, REST)

---

## 📁 Cấu trúc

```
socket-programming/
├── 01-fundamentals/       ← Nền tảng mạng, TCP vs UDP, Socket API, OSI
├── 02-tcp-sockets/        ← TCP Server, Client, State diagram
├── 03-udp-sockets/        ← UDP Server, Client, Broadcast/Multicast
├── 04-advanced/           ← Non-blocking I/O, Socket options, IPv6, Security
└── 05-real-world/         ← HTTP/WebSocket, RPC/gRPC, Performance tuning
```

---

## 🎯 Mục tiêu

- [ ] Hiểu rõ mô hình OSI và vai trò của Socket
- [ ] Phân biệt được TCP (stream-oriented) và UDP (datagram-oriented)
- [ ] Viết được TCP Server và Client hoàn chỉnh
- [ ] Viết được UDP Server và Client hoàn chỉnh
- [ ] Hiểu và tránh được các lỗi thường gặp (race condition, buffer overflow)
- [ ] Nắm được Non-blocking I/O và các mô hình I/O (select, poll, epoll)
- [ ] Hiểu cách HTTP/WebSocket hoạt động ở tầng Socket
- [ ] Biết cách optimize performance cho Socket applications

---

## 🔑 Kiến thức nền tảng cần có trước

| Chủ đề | Nguồn |
|--------|-------|
| TCP/IP Model | [Stanford CS144](https://web.stanford.edu/class/cs144/) |
| OSI Model | [GeeksforGeeks](https://geeksforgeeks.org/layers-of-osi-model/) |
| C fundamentals | Đã có trong dự án |
| Python basics | Real Python |

---

## 📚 Tài liệu tham khảo

- [Beej's Guide to Network Programming](https://beej.us/guide/bgnet/) — Cuốn kinh điển nhất về socket
- [GeeksforGeeks — Socket Programming](https://geeksforgeeks.org/socket-programming/)
- [Stanford CS144](https://web.stanford.edu/class/cs144/)
- [Real Python — Socket Programming](https://realpython.com/python-sockets/)
- [Oracle Java Socket Tutorial](https://docs.oracle.com/javase/tutorial/networking/sockets/)

---

## 🔗 Kết nối với Design Patterns

| Pattern | Socket |
|---------|--------|
| State | TCP State Machine |
| Factory | Socket Factory (tạo TCP/UDP socket) |
| Observer | WebSocket push notification |
| Proxy | Reverse proxy / Load balancer |
| Strategy | Chọn TCP vs UDP tùy use case |

---

## → Bắt đầu với Chương 1 — [Fundamentals](./01-fundamentals/README.md)

---

*Last updated: 2026-03-31*
