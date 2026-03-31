# 002 — TCP vs UDP

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | TCP, UDP, Transport Layer, Reliability, Performance |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Tại sao cần so sánh TCP và UDP?

Đây là **cốt lõi của Socket Programming**. Hầu hết mọi quyết định khi thiết kế hệ thống mạng đều xoay quanh: "Tôi nên dùng TCP hay UDP?"

Hãy tưởng tượng bạn đang xây dựng:
- **Chat app** → Dùng TCP hay UDP?
- **Video call** → Dùng TCP hay UDP?
- **DNS lookup** → Dùng TCP hay UDP?
- **Game online** → Dùng TCP hay UDP?

Sau bài này, bạn sẽ có thể trả lời mọi câu hỏi trên.

### 🔍 2. TCP — Transmission Control Protocol

TCP được thiết kế với một mục tiêu duy nhất: **"Đảm bảo dữ liệu đến đích, đúng thứ tự, không sai sót."**

#### 2.1 Đặc điểm cốt lõi

| Đặc điểm | Giải thích |
|----------|-----------|
| **Connection-oriented** | Phải thiết lập kết nối trước khi gửi dữ liệu (3-way handshake) |
| **Reliable** | Mọi packet gửi đi đều có ACK từ phía nhận. Mất packet → gửi lại |
| **Ordered** | Dữ liệu luôn đến đúng thứ tự gửi |
| **Full-duplex** | Gửi và nhận cùng lúc |
| **Flow control** | Ngăn sender gửi quá nhanh khiến receiver bị tràn buffer |
| **Congestion control** | Giảm tốc độ khi mạng quá tải |

#### 2.2 TCP Header (20 bytes tối thiểu)

```
┌────────┬────────┬─────────────────┬──────────────────────────────┐
│ Source │ Dest  │ Sequence Number │    Acknowledgment Number     │
│ Port   │ Port  │  (seq)          │    (ack)                     │
├────────┴────────┼─────────────────┼──────────────────────────────┤
│ Offset│ Flags │     Window Size  │  Checksum  │  Urgent Pointer │
├─────────────────┴─────────────────────────────────────────────────┤
│                      Options (optional)                             │
├─────────────────────────────────────────────────────────────────────┤
│                         DATA                                        │
└─────────────────────────────────────────────────────────────────────┘

Flags: SYN, ACK, FIN, RST, PSH, URG
```

#### 2.3 3-Way Handshake — Chi tiết từng bước

```
        Client                              Server
          │                                    │
          │  ──── SYN (seq=x) ──────────────► │  SYN_SENT
          │                                    │  LISTEN
          │  ◄── SYN-ACK (seq=y, ack=x+1) ─── │  SYN_RCVD
          │                                    │
          │  ──── ACK (ack=y+1) ─────────────► │  ESTABLISHED
          │                                    │        ↓
          │         KẾT NỐI THIẾT LẬP!        │  ESTABLISHED
          │
          │  ──── DATA (seq=x+1) ─────────────►
          │  ◄─── ACK (ack=x+1+len) ──────────
```

**Tại sao phải 3 bước, không phải 2?**

Nếu chỉ có Client gửi SYN và Server reply ACK:
- Server không biết Client có nhận được ACK không
- Server sẽ mở connection nhưng Client không gửi data → resource leak

**Nếu Client gửi SYN, Server reply SYN-ACK:**
- Client biết Server sẵn sàng
- Client reply ACK → Server biết Client nhận được SYN-ACK
- Cả 2 bên đều đồng ý thiết lập connection

#### 2.4 4-Way Termination

```
        Client                              Server
          │                                    │
          │  ──── FIN (seq=u) ───────────────► │  FIN_WAIT_1
          │  ◄─── ACK (ack=u+1) ─────────────── │  CLOSE_WAIT
          │                                    │        ↓
          │  FIN_WAIT_2                       │  LAST_ACK
          │  ◄─── FIN (seq=v) ──────────────── │
          │                                    │
          │  ──── ACK (ack=v+1) ─────────────► │  CLOSED
          │  TIME_WAIT (2MSL)                  │
```

**Tại sao có TIME_WAIT kéo dài 2MSL (Maximum Segment Lifetime)?**
- Đảm bảo ACK cuối cùng được nhận
- Cho phép các packet trễ trên đường truyền được xử lý hết
- Ngăn các segment cũ không ảnh hưởng kết nối mới

### 🔍 3. UDP — User Datagram Protocol

UDP được thiết kế với triết lý khác hoàn toàn: **"Gửi nhanh, không quan tâm có đến không."**

#### 3.1 Đặc điểm cốt lõi

| Đặc điểm | Giải thích |
|----------|-----------|
| **Connectionless** | Không handshake, không connection state |
| **Unreliable** | Không guarantee delivery, không retry |
| **Unordered** | Packet có thể đến không đúng thứ tự |
| **No flow control** | Gửi bao nhiêu tùy ý |
| **No congestion control** | Không giảm tốc khi mạng tắc nghẽn |
| **Lightweight** | Header chỉ 8 bytes (TCP tối thiểu 20 bytes) |

#### 3.2 UDP Header (8 bytes)

```
┌────────┬────────┬────────────┬──────────────────────────────┐
│ Source │ Dest  │   Length   │          Checksum            │
│ Port   │ Port  │            │                              │
├────────┴────────┼────────────┼──────────────────────────────┤
│                         DATA                                 │
└──────────────────────────────────────────────────────────────┘
```

#### 3.3 Tại sao UDP tồn tại?

> *"Nếu UDP không đáng tin cậy, tại sao không bỏ đi?"*

Vì **độ tin cậy có cái giá của nó — đó là LATENCY**. Và có những trường hợp latency quan trọng hơn reliability.

### 🔍 4. So sánh chi tiết TCP vs UDP

```
┌─────────────────────┬────────────────────────┬────────────────────────┐
│       Tiêu chí       │          TCP          │          UDP           │
├─────────────────────┼────────────────────────┼────────────────────────┤
│ Connection         │ Must establish first   │ Send anytime, any way  │
│ Reliability        │ 100% (ACK + Retry)      │ 0% (fire & forget)     │
│ Ordering           │ Guaranteed              │ Not guaranteed         │
│ Speed              │ Slower (overhead)       │ Very fast              │
│ Header size        │ 20–60 bytes            │ 8 bytes                │
│ Flow control       │ Yes (sliding window)    │ No                     │
│ Congestion ctrl    │ Yes (cubic, bbr...)    │ No                     │
│ Broadcast          │ No                     │ Yes                    │
│ Multicast          │ No                     │ Yes                    │
│ Stateful           │ Yes (connection state)  │ No                     │
│ Byte-stream        │ Yes (no message bounds) │ Datagrams (messages)   │
│ Half-close         │ Yes (FIN one way)       │ No                     │
└─────────────────────┴────────────────────────┴────────────────────────┘
```

### 🔍 5. Khi nào dùng gì — Decision Matrix

```
                    Cần 100%
                    reliability?
                    │
              YES ─┼── NO
                  │
         Interactive?
         (low latency)
                  │
        YES ──────┼────────── NO
        │         │          │
        ▼         ▼          ▼
      UDP +    Video/     File
      custom   Audio       Transfer
      retry    Streaming   (TCP)
      DNS      VoIP
      Gaming   (some)
```

| Use case | Protocol | Lý do chi tiết |
|----------|----------|---------------|
| **Web browsing** | TCP | Mất 1 byte trong HTML → trang lỗi. Phải reliable |
| **Email (SMTP)** | TCP | Email phải đến đủ, không thiếu byte nào |
| **DNS lookup** | UDP (chính) / TCP (lớn) | DNS query nhỏ (<512B), gửi nhanh. Retry nếu mất. Query lớn (>512B) phải TCP |
| **Video streaming** | UDP + RTP/RTCP | 1 frame mất → skip, không gửi lại (delay > 33ms = lag). Chấp nhận artifacts |
| **VoIP (Zoom, Skype)** | UDP + RTP | Real-time, latency < 150ms. Gửi lại packet cũ = đuôi echo |
| **Online gaming** | UDP (game state) | Server authoritative. Client gửi input, nhận world state. Không cần old inputs nữa |
| **File transfer** | TCP | TFTP có thể UDP (retry logic tự xây), nhưng phổ biến là TCP |
| **SSH** | TCP | Secure shell — cần mọi byte chính xác |
| **WhatsApp voice call** | UDP + custom reliability | Dùng UDP cho speed, thêm custom ACK cho những packet quan trọng |
| **Stock trading** | TCP (market data) | Reliably quan trọng hơn speed cho order book |
| **Tinder swipe** | TCP | Action cần guarantee, vài ms chậm không sao |

### 🔍 6. TCP Problems — Điều mà TCP "Không làm tốt"

#### 6.1 Head-of-Line Blocking

```
Máy A gửi: [MSG1][MSG2][MSG3]
           ────[MSG2 bị mất]────────>

Máy B nhận:
  MSG1: ✅ đến → xử lý → trả lời
  MSG2: ❌ mất → KHÔNG xử lý MSG3 được (vì thứ tự)
  MSG3: ❌ phải đợi MSG2 gửi lại thành công
```

**Hậu quả thực tế:** Khi load 1 webpage, 1 image bị 404 → toàn bộ trang bị block. HTTP/2 giải quyết bằng **multiplexing**.

#### 6.2 TCP Tunelelling / TCP Meltdown

```
Problem: Nhiều streams dùng chung 1 TCP connection

Stream A (ping quan trọng, 64 bytes):
  ──────[A]──────────────────────────────────────────>

Stream B (download 10MB):
  ───────────────────────────────────────────────────────────>

Mạng bị congestion → TCP throttle cả 2 streams
→ Ping latency TĂNG VỌT vì phải share cùng congestion window
→ 1 stream chậm kéo theo TẤT CẢ stream khác

→ Web developers chọn UDP (QUIC/HTTP3) để tránh problem này
```

#### 6.3 Bandwidth Allocation

TCP tự động chiếm **fair share** của băng thông. Khi dùng BitTorrent (TCP):
- Tải file càng nhanh khi connections tăng
- Nhưng "chiếm dụng" băng thông của người khác
- Netflix/YouTube dùng UDP-based quá nhiều → ISPs bắt đầu throttle

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 Deep Dive: Tại sao UDP nhanh hơn?

**Câu trả lời ngắn:** Vì không làm gì cả.

**Câu trả dài:**

1. **Không handshake** — TCP mất 1.5 RTT (Round Trip Time) để thiết lập connection. UDP gửi ngay.
   - Nếu RTT = 100ms → TCP tốn 150ms overhead trước khi gửi byte data đầu tiên

2. **Không ACK overhead** — TCP phải ACK mỗi segment.
   - ACK cho 1 packet → bandwidth waste
   - ACK bị mất → sender gửi lại (cascade problem)

3. **Không congestion window** — TCP liên tục "thăm dò" xem mạng còn chịu được không bằng cách tăng dần window size.
   - Startup chậm (slow start)
   - Khi packet loss → cắt window đột ngột → throughput drop

4. **Không flow control** — UDP gửi không ngừng, không cần đợi receiver buffer ready

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Dùng TCP cho gaming và nghĩ nó "đúng"** | TCP gây lag spike khi packet mất (vì phải retry và đợi). Dùng UDP + custom reliability layer |
| **Dùng UDP cho critical transactions** | Gửi tiền qua UDP và hy vọng nó đến? Không bao giờ. UDP chỉ dùng khi có application-level retry/ACK |
| **Tưởng "UDP không đáng tin = không dùng được"** | Nhiều ứng dụng dùng UDP + application logic để có reliability tùy chỉnh |
| **Quên rằng TCP là byte-stream, không message** | `send()` 2 lần không có nghĩa `recv()` nhận 2 lần. TCP có thể ghép 2 sends thành 1 recv |

### 🔑 Key Insight

> **"TCP là đúng, UDP là nhanh."**
>
> Không có protocol nào "tốt hơn". Chỉ có protocol **phù hợp hơn** với từng use case.
>
> - Cần đảm bảo dữ liệu đến đủ → TCP
> - Cần tốc độ, chấp nhận mất mát → UDP
> - Không chắc chắn → thử cả 2, benchmark, quyết định

### 🔄 So sánh các hướng tiếp cận

| Approach | Reliability | Speed | Complexity | Use case |
|----------|-------------|-------|------------|----------|
| TCP thuần | ✅ Full | 🟡 Medium | ✅ Low | Web, email |
| UDP thuần | ❌ None | ✅✅ Best | ✅ Low | Broadcasting |
| UDP + ACK logic | ⚠️ Custom | 🟡 Medium | 🔴 High | Gaming, VoIP |
| QUIC (UDP-based) | ✅ Full | ✅✅ Best | 🟡 Medium | HTTP/3, Chrome |
| WebSocket (TCP-based) | ✅ Full | 🟡 Medium | ✅ Low | Real-time web |

---

## ✅ Ví dụ thực tế

### Ví dụ 1: Simulate packet loss

```python
import socket
import time
import random

# Simulate UDP unreliable nature
def udp_sender():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.setblocking(False)  # Non-blocking
    msg_count = 0
    while True:
        msg = f"Frame {msg_count}"
        # 10% chance packet lost
        if random.random() > 0.1:
            s.sendto(msg.encode(), ('127.0.0.1', 9999))
            print(f"📤 Sent: {msg}")
        else:
            print(f"❌ LOST (simulated): {msg}")
        time.sleep(0.1)
        msg_count += 1

# TCP would NEVER have this behavior — every byte is guaranteed
```

### Ví dụ 2: TCP byte-stream boundary confusion

```python
# SERVER
import socket

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.bind(('127.0.0.1', 9000))
s.listen(1)

conn, addr = s.accept()
# ⚠️ recv(6) có thể nhận ít hơn hoặc NHIỀU hơn!
data = conn.recv(6)
print(f"Received: {data}")  # Bất kỳ bytes nào trong buffer
```

```python
# CLIENT
import socket

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('127.0.0.1', 9000))

s.send(b"Hello")     # 5 bytes
s.send(b"World")    # 5 bytes — cộng dồn = 10 bytes

# Server recv(6) có thể nhận:
# - "HelloW" (5+1)
# - "HelloWo" (5+2)
# - "HelloWorld" (cả 2 gửi cùng lúc, OS gộp lại)
# - "Hel" (chỉ 3 bytes trong buffer)
```

**Giải pháp:** Phải implement **framing protocol**:
```python
def recv_exact(sock, n):
    """Luôn nhận đúng n bytes"""
    data = b''
    while len(data) < n:
        packet = sock.recv(n - len(data))
        if not packet:
            raise ConnectionError("Connection closed")
        data += packet
    return data
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: TCP vs UDP comparison
💡 KEY INSIGHT: TCP = reliable + slow. UDP = fast + unreliable. Không có cái nào "tốt hơn", chỉ phù hợp hơn.
⚠️ PITFALLS:
  - TCP byte-stream không bảo toàn message boundaries
  - UDP cần custom reliability layer nếu cần
  - Head-of-line blocking trong TCP
  - TCP meltdown khi nhiều streams chia sẻ connection
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./003-socket-api.md)
