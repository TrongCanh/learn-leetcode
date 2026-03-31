# Chương 2 — TCP Sockets

> Xây dựng TCP Server và Client hoàn chỉnh, hiểu State machine và các vấn đề thực tế.

---

## 3 bài trong chương này

| # | Bài | Độ khó | Giải quyết |
|---|-----|--------|------------|
| 005 | [TCP Server](./005-tcp-server.md) | 🟡 Medium | Viết TCP Server đa luồng |
| 006 | [TCP Client](./006-tcp-client.md) | 🟡 Medium | Viết TCP Client, xử lý reconnect |
| 007 | [TCP State Diagram](./007-tcp-state-diagram.md) | 🔴 Hard | FSM của TCP, các trạng thái, flags |

## 🔑 Khái niệm chung

### 🔍 1. TCP 3-way Handshake

```
Client                              Server
  │                                    │
  │ ─────── SYN (seq=x) ──────────────►│  CLOSED → SYN_SENT
  │                                    │         ↓ LISTEN
  │ ◄────── SYN-ACK (seq=y, ack=x+1) ─│  LISTEN → SYN_RCVD
  │                                    │
  │ ─────── ACK (ack=y+1) ───────────►│  SYN_RCVD → ESTABLISHED
  │                                    │
  │          KẾT NỐI ĐÃ THIẾT LẬP!     │
```

### 🔍 2. TCP vs UDP — Khi nào dùng?

| Use case | Protocol | Lý do |
|----------|----------|-------|
| Web browsing | TCP | Cần đáng tin cậy, có thứ tự |
| DNS lookup | UDP | Nhanh, có thể retry |
| Video streaming | UDP | Chấp nhận mất gói để giảm latency |
| File transfer | TCP | Phải đảm bảo toàn vẹn dữ liệu |
| Online gaming | UDP | Tốc độ quan trọng hơn độ tin cậy |

---

## → Bắt đầu với [005 — TCP Server](./005-tcp-server.md)
