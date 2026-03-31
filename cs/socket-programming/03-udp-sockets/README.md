# Chương 3 — UDP Sockets

> Xây dựng UDP Server và Client, hiểu Broadcast, Multicast và các ứng dụng thực tế.

---

## 3 bài trong chương này

| # | Bài | Độ khó | Giải quyết |
|---|-----|--------|------------|
| 008 | [UDP Server](./008-udp-server.md) | 🟡 Medium | Viết UDP Server, xử lý datagram |
| 009 | [UDP Client](./009-udp-client.md) | 🟡 Medium | Viết UDP Client, gửi/nhận message |
| 010 | [Broadcast & Multicast](./010-broadcast-multicast.md) | 🔴 Hard | Truyền tin một-nhiều, nhiều-nhiều |

## 🔑 Khái niệm chung

### 🔍 1. UDP vs TCP

```
┌──────────────────┬────────────────────────┬────────────────────────┐
│      Đặc điểm    │         TCP            │          UDP           │
├──────────────────┼────────────────────────┼────────────────────────┤
│ Connection       │ Connection-oriented    │ Connectionless         │
│ Reliability      │ Guaranteed delivery    │ No guarantee           │
│ Ordering         │ Ordered                │ No ordering           │
│ Speed            │ Slower                 │ Faster                 │
│ Header size      │ 20+ bytes             │ 8 bytes                │
│ Flow control     │ Yes                   │ No                     │
│ Congestion ctrl  │ Yes                   │ No                     │
│ Use case         │ Web, Email, FTP        │ DNS, Video, Gaming     │
└──────────────────┴────────────────────────┴────────────────────────┘
```

### 🔍 2. UDP Server-Client Model

```
┌──────────┐                              ┌──────────┐
│  Client  │                              │  Server  │
│ sendto() │─────── datagram ──────────►│ recvfrom()│
│ recvfrom()│◄────── datagram ───────────│ sendto()  │
└──────────┘                              └──────────┘

⚠️ Không có listen() hay accept()!
```

### 🔍 3. Khi nào dùng UDP?

- **DNS** — Query nhỏ, có thể retry nếu mất
- **Video/Audio streaming** — Chấp nhận drop để giữ FPS/bitrate
- **Gaming** — Server authoritative, client prediction
- **IoT** — Thiết bị yếu, cần tiết kiệm resource
- **TFTP** — File transfer đơn giản, dùng UDP vì đơn giản

---

## → Bắt đầu với [008 — UDP Server](./008-udp-server.md)
