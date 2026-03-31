# Chương 1 — Fundamentals

> Nền tảng kiến thức mạng, phân biệt TCP vs UDP, giới thiệu Socket API và mô hình OSI.

---

## 4 bài trong chương này

| # | Bài | Độ khó | Giải quyết |
|---|-----|--------|------------|
| 001 | [Network Basics](./001-network-basics.md) | 🟢 Easy | Mô hình TCP/IP, IP, Port, DNS |
| 002 | [TCP vs UDP](./002-tcp-vs-udp.md) | 🟢 Easy | So sánh chi tiết hai protocol |
| 003 | [Socket API](./003-socket-api.md) | 🟡 Medium | Giới thiệu các syscall cốt lõi |
| 004 | [OSI Model](./004-osi-model.md) | 🟢 Easy | 7 tầng OSI và Socket ở đâu |

## 🔑 Khái niệm chung

### 🔍 1. Socket là gì?

```
┌─────────────┐         Socket          ┌─────────────┐
│  Process A  │◄─────────────────────►│  Process B  │
│ (Client)    │    TCP / UDP / ...     │  (Server)   │
└─────────────┘                         └─────────────┘
```

**Socket** = một endpoint để giao tiếp qua mạng. Mỗi socket được định danh bởi **IP + Port**.

### 🔍 2. Hai loại Socket chính

| Loại | Đặc điểm |
|------|-----------|
| **Stream Socket (SOCK_STREAM)** | TCP — đáng tin cậy, có thứ tự, connection-oriented |
| **Datagram Socket (SOCK_DGRAM)** | UDP — nhanh, không đáng tin cậy, connectionless |

### 🔍 3. Client-Server Model

```
Server:
  socket() → bind() → listen() → accept() → read/write → close()

Client:
  socket() → connect() → write/read → close()
```

---

## → Bắt đầu với [001 — Network Basics](./001-network-basics.md)
