# 007 — TCP State Diagram

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🔴 Hard |
| **Chủ đề** | TCP FSM, State transitions, 3-way handshake, 4-way termination, Flags |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. TCP là State Machine — Tại sao phải hiểu?

TCP không phải là "đường ống" đơn giản. Nó là một **Finite State Machine (FSM)** phức tạp với **11 trạng thái** chính. Mỗi gói tin gửi đi đều làm thay đổi trạng thái.

**Tại sao quan trọng?**

```
Vấn đề thực tế:
  1. Connection không establish được → biết đang stuck ở state nào?
  2. Server restart nhưng port vẫn bị "TIME_WAIT" → debug state?
  3. Lỗi "Connection reset by peer" → hiểu RST packet từ đâu?
  4. Socket leak → hiểu mỗi close() chuyển sang state nào?
  5. Half-open connection → hiểu khi nào connection vẫn sống dù 1 phía đóng?

→ Hiểu State Machine = Hiểu TẤT CẢ edge cases của TCP
```

### 🔍 2. TCP State Machine — Full Diagram

```
                           ┌─────────────────────────────────────┐
                           │            TCP STATES                 │
                           └─────────────────────────────────────┘

     ┌──────────┐
     │  CLOSED  │◄────────────────────────────────────────┐
     └────┬─────┘                                             │
          │ passive open                                      │
          │ (server: socket→bind→listen)                     │
          ▼                                                  │
     ┌──────────┐                                             │
     │  LISTEN  │───────────────────────────────────────────►│
     │ (server) │  RST received      (active close)          │
     └────┬─────┘  or error              or timeout          │
          │                                                  │
          │     ┌───────────────────────────────────────────┘
          │     │ (SYN_RCVD timeout)
          │     ▼
          │  ┌─────────────────────────────────────────────────────┐
          │  │ SYN_RCVD ── FIN ──────────────────────────────►    │
          │  │ (server, awaiting ACK)      (simultaneous close)  │
          │  └─────────────────────────────────────────────────────┘
          │
          │ connect()
          │ (client: socket→connect)
          ▼
     ┌──────────┐
     │ SYN_SENT │──────────────────────────────────────────────►│
     │ (client) │  RST received (error)           (active close) │
     └────┬─────┘                                             │
          │                                                      │
          │ ◄─── SYN ───────────────────────────────────────────┤
          │       (simultaneous connect)                         │
          │                                                      │
          │        ┌───────────────────────────────────────────┤
          │        │ (client, awaiting ACK)                     │
          │        ▼                                            │
          │   ┌─────────────────────────────────────────────────┐│
          │   │ SYN_SENT ── SYN+ACK ──────────────────────────► ││
          │   │ (simultaneous)    (send last ACK)              ││
          │   └─────────────────────────────────────────────────┘│
          │                                                       │
          │     ┌───────────────────────────────────────────────┤
          │     │ (after handshake)                             │
          │     ▼                                               │
     ┌──────────────────────────────────────┐                  │
     │                                      │                  │
     │         ESTABLISHED                  │◄─────────────────┘
     │                                      │  (active close)
     │                                      │  FIN_WAIT_1 ──── FIN ────►
     │                                      │                  │
     │  Passive close:                       │                  │
     │  recv() → "" →                      │                  │
     │  CLOSE_WAIT ─── ACK ────────────────►                  │
     │                                      │                  │
     │  ←─── data ←───        ──── data ───►                  │
     │  ──── ACK ────         ←─── ACK ────                   │
     │                                      │                  │
     └──────────────────────────────────────┘                  │
          │       │                           │                  │
          │       │                           │                  │
          │       │                           │                  │
          │       ▼                           ▼                  │
          │  ┌──────────────────┐    ┌──────────────────┐       │
          │  │  CLOSE_WAIT      │    │  FIN_WAIT_1      │       │
          │  │ (server passive  │    │ (client active   │       │
          │  │  close, waiting  │    │  close, await    │       │
          │  │  app to call     │    │  ACK + FIN)      │       │
          │  │  close())        │    └────────┬─────────┘       │
          │  └────────┬─────────┘             │                │
          │           │                       │ ACK received   │
          │           │                       ▼                │
          │           │           ┌──────────────────┐          │
          │           │           │  FIN_WAIT_2      │          │
          │           │           │ (await FIN)      │          │
          │           │           └────────┬─────────┘          │
          │           │                    │ FIN received     │
          │           │                    ▼                   │
          │           │           ┌──────────────────┐          │
          │           │           │  CLOSING         │          │
          │           │           │ (simultaneous    │          │
          │           │           │  close)          │          │
          │           │           └────────┬─────────┘          │
          │           │                    │                    │
          │           │           ┌────────┴────────┐           │
          │           │           │                 │           │
          │           ▼           │                 ▼           │
          │  ┌──────────────────┐ │  ┌──────────────────┐      │
          │  │  LAST_ACK        │ │  │   TIME_WAIT      │      │
          │  │  FIN ──── ACK ────►│ │  │  (2MSL = 60s)   │      │
          │  └────────┬─────────┘ │  └────────┬─────────┘      │
          │           │           │           │                 │
          │           │           │           │                  │
          │           │           │           ▼                  │
          │           │           │      ┌──────────┐            │
          │           │           │      │ CLOSED  │            │
          └───────────┴───────────┴─────►└──────────┘            │
                           (timeout)                               │
```

### 🔍 3. 11 Trạng thái TCP — Giải thích chi tiết

| State | Ai? | Khi nào? | Làm gì? |
|-------|-----|---------|---------|
| **CLOSED** | Cả 2 | Ban đầu / Cuối cùng | Không có connection |
| **LISTEN** | Server | Sau `listen()` | Đang đợi incoming connection |
| **SYN_SENT** | Client | Sau khi gửi SYN | Đang chờ SYN-ACK |
| **SYN_RCVD** | Server | Sau khi nhận SYN, gửi SYN-ACK | Đang chờ ACK |
| **ESTABLISHED** | Cả 2 | Handshake xong | Đang trao đổi data bình thường |
| **FIN_WAIT_1** | Cả 2 | Gửi FIN (active close) | Đang chờ ACK của FIN |
| **FIN_WAIT_2** | Cả 2 | Nhận ACK của FIN | Đã ack FIN, đang chờ FIN từ phía kia |
| **CLOSE_WAIT** | Cả 2 | Nhận FIN (passive close) | Đã ack FIN, app vẫn chưa close() |
| **CLOSING** | Cả 2 | Cả 2 gửi FIN gần như đồng thời | Đang chờ ACK |
| **LAST_ACK** | Cả 2 | Gửi FIN sau khi close() | Đang chờ ACK cuối cùng |
| **TIME_WAIT** | Cả 2 | Sau khi gửi/ nhận ACK cuối | Đợi 2MSL để đảm bảo connection die hẳn |

### 🔍 4. 3-Way Handshake — Chi tiết từng bước

```
        CLIENT                           SERVER
          │                                │
          │  ──── SYN (seq=x) ────────────►│  LISTEN → SYN_RCVD
          │   seq=x                         │  Tạo TCB mới
          │   ACK flag=0                    │  Buffer cho incoming data
          │   SYN flag=1                    │
          │                                │
          │  ◄─── SYN-ACK (seq=y, ack=x+1) ─│  SYN_RCVD → ESTABLISHED
          │   seq=y                         │  Khi nhận đủ ACK
          │   ack=x+1 ← "đã nhận x bytes"  │
          │   SYN=1, ACK=1                  │
          │                                │
          │  ──── ACK (ack=y+1) ───────────►│  ESTABLISHED
          │   seq=x+1                       │
          │   ack=y+1                       │
          │   ACK=1                         │
          │                                │
          │     ✅ CONNECTION ESTABLISHED!  │
          │     ✅ Cả 2 sides đều sẵn sàng  │
          │     ✅ Full-duplex channel       │
```

**Sequence Number (seq):**

```
Tại sao cần seq number?

1. Gởi 3 packets: [A][B][C]
2. Router delay: [A][C] nhận trước [B]
3. Receiver reorder → [A][C][B] → trả về đúng thứ tự

4. [B] bị mất → không có ACK → gửi lại
5. [C] nhận 2 lần → detect duplicate bằng seq

6. Seq numbers bắt đầu ngẫu nhiên (ISN)
   → Ngăn attacker gửi packet giả mạo
   → Ngăn packet cũ (từ connection trước) không bị nhầm
```

**Initial Sequence Number (ISN):**

```python
# Mỗi connection bắt đầu với ISN ngẫu nhiên
# Để ngăn "TCP sequence prediction attack"

# Linux: /proc/sys/net/ipv4/tcp_syncookies
# Khi backlog full, dùng syncookies thay vì queue
```

### 🔍 5. 4-Way Termination — Chi tiết từ�ng bước

**Case 1: Normal close (một phía chủ động đóng)**

```
        CLIENT                           SERVER
          │                                │
          │    DATA exchange...             │
          │                                │
          │  close() ──── FIN ────────────►│  ESTABLISHED → CLOSE_WAIT
          │  ESTABLISHED → FIN_WAIT_1      │  (app vẫn đọc được data còn lại)
          │                                │
          │  ◄──── ACK (ack=seq+1) ────────│  (app process data cuối)
          │  FIN_WAIT_1 → FIN_WAIT_2        │
          │                                │
          │  (đợi server gửi hết data)      │  app gọi close()
          │                                │  close() ──── FIN ───────────►
          │                                │  CLOSE_WAIT → LAST_ACK
          │  ◄──── FIN (seq=seq2) ─────────│
          │  FIN_WAIT_2 → TIME_WAIT         │
          │                                │
          │  ──── ACK (ack=seq2+1) ───────►│  LAST_ACK → CLOSED
          │  TIME_WAIT (2MSL=60s)          │
          │                                │
          │  ──── (đợi 2MSL) ────────────►│
          │  TIME_WAIT → CLOSED            │
```

**Case 2: Simultaneous close (cả 2 cùng close() gần như đồng thời)**

```
        CLIENT                           SERVER
          │                                │
          │  close() ──── FIN ────────────►│  ESTABLISHED → FIN_WAIT_1
          │  ◄────── FIN ──────────────────│  ESTABLISHED → CLOSING
          │  CLOSING                       │  CLOSING
          │  ◄────── ACK ──────────────────│  ◄────── ACK ──────────────────
          │  CLOSING → TIME_WAIT           │  CLOSING → TIME_WAIT
          │                                │
          │  (đợi 2MSL)                    │  (đợi 2MSL)
          │  TIME_WAIT → CLOSED             │  TIME_WAIT → CLOSED
```

**Case 3: RST (abortive release)**

```
        CLIENT                           SERVER
          │                                │
          │  recv() nhận RST ──────────────►│  ESTABLISHED → CLOSED
          │  ESTABLISHED → CLOSED          │  (immediately, no FIN/ACK)
          │                                │
→ RST = "Drop everything, connection DEAD now"
→ Dùng khi: fatal error, protocol violation, security attack
→ RST receiver KHÔNG vào TIME_WAIT
```

### 🔍 6. TIME_WAIT — State quan trọng nhất

**TIME_WAIT kéo dài 2MSL (Maximum Segment Lifetime) = 60 giây (thường)**

```
Tại sao phải đợi?

MSL = Maximum time a packet có thể tồn tại trong network
→ 2 * MSL = đủ thời gian để TẤT CẢ packets trong flight die hết

Scenario:
  1. Client gửi ACK cuối cùng
  2. ACK bị MẤT (không bao giờ đến server)
  3. Server đợi → timeout → gửi lại FIN
  4. Client còn trong TIME_WAIT → reply ACK lại
  5. Nếu không TIME_WAIT → Client đã CLOSED → RST → Server crash

  6. Packet cũ từ connection cũ trôi nổi → đến khi connection mới
  → Nếu sequence number trùng → DATA CORRUPTION
  → TIME_WAIT đảm bảo old seq numbers hết hiệu lực
```

**TIME_WAIT trong thực tế:**

```
Vấn đề: Server restart ngay → port bị TIME_WAIT → "Address already in use"

Tình huống:
  Server close connection → TIME_WAIT 60s
  Server restart → bind() cùng port
  → Lỗi! Port đang trong TIME_WAIT

Giải pháp:
  1. SO_REUSEADDR = cho phép bind vào port đang TIME_WAIT
  2. SO_REUSEPORT = cho phép nhiều processes bind cùng port
  3. Đợi 60s
  4. Thay đổi port (vd: 8080 → 8081)
```

### 🔍 7. TCP Flags (Control Bits)

| Flag | Bit | Name | Dùng khi nào |
|------|-----|------|-------------|
| **SYN** | 0x02 | Synchronize | Bắt đầu connection (request) |
| **ACK** | 0x10 | Acknowledgment | Xác nhận đã nhận data |
| **FIN** | 0x01 | Finish | Kết thúc connection (graceful) |
| **RST** | 0x04 | Reset | Hủy connection ngay lập tức (abortive) |
| **PSH** | 0x08 | Push | "Gửi data ngay, không buffer" (interactive) |
| **URG** | 0x20 | Urgent | Data urgent (hiếm dùng) |

**PSH flag — tại sao quan trọng?**

```python
# Normal: TCP buffer → gửi khi buffer đầy hoặc timeout (Nagle algorithm)
sock.send(b"A")  # → Buffer, chờ thêm data
sock.send(b"B")  # → Buffer, chờ thêm data

# Với PSH:
sock.send(b"A", MSG_OOB)  # Gửi ngay lập tức (urgent data)
# Hoặc: shutdown(WR) → force PSH + FIN
```

### 🔍 8. Window Size & Flow Control

```
Flow Control: Ngăn sender gửi quá nhanh cho receiver

Receiver có buffer SIZE = 64KB:
  Window = 64KB (receiver nói: "tôi còn chỗ 64KB")
  Sender gửi 64KB → Window = 0 → Sender PAUSE
  Receiver recv() 10KB → Window = 10KB → Sender RESUME

Congestion Control: Ngăn sender gửi quá nhanh cho network

  Slow Start: Bắt đầu cửa sổ nhỏ, tăng dần
  cwnd = 1 → 2 → 4 → 8 → 16 → ... (exponential)

  Khi loss → ssthresh = cwnd/2 → cwnd = 1 → lặp lại

  Cwnd (congestion window) vs Window (flow control window)
  → Thực tế: effective_window = min(cwnd, receiver_window)
```

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 Tại sao TCP được gọi là "reliable"?

Vì FSM đảm bảo **mọi byte được ACK**. Nhưng "reliable" không có nghĩa là "đúng":

```
Sender gửi: [seq=1000: "HELLO"]
Receiver nhận: [seq=1000: "HELXO"]  ← bit flip!
             → ACK(1001) → Sender gửi lại → đúng "HELLO"

→ Reliable = "đến", không có nghĩa = "đúng"
→ Bit corruption → checksum fail → discard → retransmit
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **TIME_WAIT → "Address in use"** | Restart server ngay → phải dùng SO_REUSEADDR |
| **Nhầm CLOSE_WAIT với TIME_WAIT** | CLOSE_WAIT = app chưa close() (leak!). TIME_WAIT = đang đóng đúng cách |
| **RST không vào TIME_WAIT** | RST = abort, không phải graceful → OS giải phóng ngay |
| **Tưởng connection sống khi 1 phía đóng** | close() phía A → B vẫn gửi được cho đến khi recv() = "" |
| **SYN flood attack** | Attacker gửi SYN nhưng không ACK → server queue full → DOS |

### 🔑 Key Insight

> **TCP State Machine đảm bảo connection được setup và teardown đúng cách.**
>
> TIME_WAIT tồn tại 60s để dọn rác (old packets) trước khi cho phép reuse port. CLOSE_WAIT tồn tại khi app không close() socket.

---

## ✅ Xem trạng thái TCP trên máy thật

```bash
# Windows: Xem TCP connections
netstat -ano | findstr ESTABLISHED
netstat -ano | findstr TIME_WAIT
netstat -ano | findstr CLOSE_WAIT

# Linux: Chi tiết hơn
ss -tan state established | head -20
ss -tan state time-wait | wc -l  # Đếm TIME_WAIT

# Xem TCP state distribution
ss -tan | awk '{print $1}' | sort | uniq -c | sort -rn
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: TCP State Machine (FSM)
💡 KEY INSIGHT: TIME_WAIT = "dọn rác" 60s. CLOSE_WAIT = app leak (không close()).
⚠️ PITFALLS:
  - TIME_WAIT → SO_REUSEADDR
  - CLOSE_WAIT nhiều → kiểm tra app
  - RST = abort, không qua graceful shutdown
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](../03-udp-sockets/008-udp-server.md)
