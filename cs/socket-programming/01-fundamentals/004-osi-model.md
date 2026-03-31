# 004 — OSI Model

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | OSI 7 Layers, TCP/IP 4 Layers, Encapsulation, PDU |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Tại sao cần mô hình phân lớp?

**Vấn đề thực tế:** Internet là một hệ thống **cực kỳ phức tạp** — có hàng tỷ thiết bị từ nhiều hãng khác nhau, dùng phần cứng khác nhau, chạy phần mềm khác nhau. Làm sao để tất cả nói chuyện được với nhau?

**Giải pháp:** **Phân lớp (Layering)**

```
Analog: Hệ thống bưu chính

Lớp 7: Application   ── "Tôi muốn gửi thư cho bác Hùng ở Hà Nội"
Lớp 6: Presentation ── "Viết bằng tiếng Việt, dùng phong bì A5"
Lớp 5: Session       ── "Đây là thư thứ 3 trong chuỗi 5 bức"
Lớp 4: Transport     ── "Bưu điện A nhận → chuyển → Bưu điện B giao"
Lớp 3: Network        ── "Địa chỉ: Hà Nội, Quận Ba Đình, Phố Hoàng Diệu"
Lớp 2: Data Link      ── "Tuyến đường sắt Bắc Nam, Ga Hà Nội"
Lớp 1: Physical       ── "Đường ray, tín hiệu điện, sóng radio"

→ Mỗi lớp chỉ cần biết lớp bên dưới
→ Thay đổi lớp dưới không ảnh hưởng lớp trên
```

### 🔍 2. OSI 7 Layers — Chi tiết từng tầng

#### Tầng 1: Physical (Vật lý)

```
Nhận: Tín hiệu điện / quang / sóng radio
Gửi: Tín hiệu điện / quang / sóng radio

Thiết bị: Cable, Hub, Repeater, Transceiver
```

**Nhiệm vụ:** Truyền raw bits (0/1) qua physical medium. Không hiểu gì về packet hay address.

**Ví dụ thực tế:**
- Cáp Ethernet Cat5e/Cat6/Cat7
- Sóng Wi-Fi 2.4GHz / 5GHz
- Cáp quang (Fiber optic)
- Bluetooth LE

**Vấn đề thực tế:**
- Tín hiệu suy hao theo khoảng cách (repeater khuyếch đại)
- Nhiễu điện từ (electromagnetic interference)
- Collision khi 2 thiết bị gửi cùng lúc (→ CSMA/CD trong Ethernet)

#### Tầng 2: Data Link (Liên kết dữ liệu)

```
Nhận: Frames (Ethernet frames)
Gửi: Frames (Ethernet frames)

Thiết bị: Switch, Bridge, NIC (Network Interface Card)
```

**Nhiệm vụ:** Truyền frames giữa các thiết bị **cùng mạng LAN**. Dùng **MAC address** (48-bit, duy nhất toàn cầu).

**MAC Address:**
```
08:00:27:3B:8E:6C
↑
OUI (Organizationally Unique Identifier) — hãng sản xuất
     08:00:27 — Oracle VirtualBox
```

**Protocol:** Ethernet (IEEE 802.3), Wi-Fi (IEEE 802.11)

**Vấn đề thực tế:**
- Switch học MAC addresses → xây MAC table → forward đúng port
- ARP: "Ai có IP 192.168.1.1?" → trả lời MAC address của nó
- VLAN: Chia mạng LAN thành nhiều mạng ảo

#### Tầng 3: Network (Mạng)

```
Nhận: Packets (IP packets)
Gửi: Packets (IP packets)

Thiết bị: Router, Layer-3 Switch
```

**Nhiệm vụ:** Định tuyến (routing) packets **跨越 multiple networks**. Dùng **IP address**.

**IP Packet header (20 bytes tối thiểu):**

```
┌────────┬────────┬──────────────────┬─────────────────────────┐
│ Version│  IHL   │   Type of Service│     Total Length        │
│  (4b)  │  (4b)  │    (ToS) (8b)    │        (16b)            │
├────────┴────────┴──────────────────┼─────────────────────────┤
│        Identification (16b)          │ Flags│  Fragment Offset │
│                                       │(3b)  │    (13b)          │
├───────────────┬──────────────────────┴───────┴──────────────────┤
│ Time to Live  │   Protocol (8b)         │   Header Checksum    │
│     (TTL)     │   (TCP=6, UDP=17, ICMP=1)│       (16b)          │
├───────────────┴──────────────────────┬───┴──────────────────────┤
│         Source IP Address (32b)     │   Destination IP (32b)   │
├──────────────────────────────────────┴─────────────────────────┤
│                    Options (optional)                             │
├─────────────────────────────────────────────────────────────────┤
│                         DATA                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Key fields:**

| Field | Ý nghĩa |
|-------|---------|
| `TTL` | Mỗi router giảm 1. Ngăn packet lặp vô hạn. `tracert` dùng TTL |
| `Protocol` | TCP=6, UDP=17, ICMP=1, IGMP=2 — biết payload thuộc protocol nào |
| `Identification` | Dùng khi IP fragmentation (packet > MTU) |
| `Fragment Offset` | Vị trí fragment trong datagram gốc |

**Vấn đề thực tế:**
- **NAT (Network Address Translation)**: Private IP → Public IP khi ra internet
- **Routing protocols**: OSPF, BGP, RIP quyết định đường đi
- **Fragmentation**: Packet > 1500B (Ethernet MTU) → chia nhỏ

#### Tầng 4: Transport (Vận chuyển)

```
Nhận: TCP Segments / UDP Datagrams
Gửi: TCP Segments / UDP Datagrams

Thiết bị: (Không có thiết bị riêng — chức năng của Endpoints)
```

**Nhiệm vụ:** End-to-end communication. Đảm bảo data đến đúng ứng dụng (dùng Port).

**TCP Segment vs UDP Datagram:**

```
TCP Segment:
┌──────────────────────────────────────────────────────────────┐
│ TCP Header (20–60 bytes) │          DATA                     │
│  SrcPort|DstPort|Sequence|Ack|Flags|Window|Checksum        │
└──────────────────────────────────────────────────────────────┘

UDP Datagram:
┌─────────────────────────────────┐
│ UDP Header (8 bytes) │   DATA  │
│  SrcPort|DstPort|Len|Checksum  │
└─────────────────────────────────┘
```

#### Tầng 5: Session (Phiên)

```
Nhiệm vụ: Quản lý phiên giao tiếp

Công nghệ: NetBIOS, RPC, PPTP, L2TP
```

**Nhiệm vụ thực tế:**
- Authentication: Đăng nhập 1 lần, dùng nhiều service (Kerberos)
- Session tokens: JWT, session ID
- Đồng bộ hóa: Video call reconnection khi mạng chập chờn

**Ví dụ:** Khi bạn xem YouTube, tầng Session quản lý:
- Cookie/session để server biết "bạn là ai"
- Reconnect nếu mạng lag 2s
- Đồng bộ buffer

#### Tầng 6: Presentation (Trình diễn)

```
Nhiệm vụ: Mã hóa, nén, chuyển đổi định dạng dữ liệu

Công nghệ: SSL/TLS, ASCII, JPEG, PNG, MPEG, Unicode
```

**Biến đổi:**
- Character encoding: UTF-8 ↔ ASCII ↔ EBCDIC
- Compression: gzip, brotli, zstd
- Encryption: SSL/TLS mã hóa dữ liệu
- Serialization: JSON ↔ XML ↔ Protocol Buffers

#### Tầng 7: Application (Ứng dụng)

```
Nhiệm vụ: Giao diện người dùng cuối, protocol cụ thể

Protocol: HTTP, HTTPS, FTP, SMTP, POP3, IMAP, SSH, DNS, DHCP, SNMP
```

**Socket ở đâu?**

> **Socket = Tầng 5 (Session) trong OSI, hoặc là API của Tầng 4 (Transport)**

```
┌─────────────────────────────────────┐
│        Application (HTTP, SMTP)     │  ← Tầng 7
├─────────────────────────────────────┤
│        Presentation (TLS, SSL)       │  ← Tầng 6
├─────────────────────────────────────┤
│        Session (Socket API)         │  ← Tầng 5 — ĐÂY!
├─────────────────────────────────────┤
│     Transport (TCP / UDP)           │  ← Tầng 4 — SOCKET kết thúc
├─────────────────────────────────────┤
│        Network (IP, Routing)        │  ← Tầng 3
├─────────────────────────────────────┤
│     Data Link (Ethernet, ARP)       │  ← Tầng 2
├─────────────────────────────────────┤
│         Physical (Cables, Wi-Fi)     │  ← Tầng 1
└─────────────────────────────────────┘
```

### 🔍 3. Encapsulation — Quá trình đóng gói

```
App gửi: "Hello"

L7:  [ Application Data: "Hello" ]                         Data + HTTP header
L6:  [ TLS Record: Encrypted(HTTP + "Hello") ]             Data + TLS header
L5:  [ TCP Segment:  "GET /" + Port=80 ]                   Data + TCP header
L4:  [ IP Packet:  "src=192.168.1.5 dst=142.250.185.46" ]   Segment + IP header
L3:  [ Ethernet Frame: "MAC_src → MAC_dst" ]               Packet + Ethernet header
L2:  [ Physical: 010101101010... ]                          Voltage/Radio signals
```

```
Nhận router (bỏ Ethernet header, forward IP packet)

Nhận server (bỏ IP header, bỏ TCP header, giải mã TLS, đọc HTTP)
```

**Each layer adds its own header (trừ Physical):**

```
┌──────────┬──────────┬──────────┬──────────┬──────────────────┐
│ Ethernet │    IP    │   TCP    │   TLS    │      HTTP        │
│ Header   │  Header  │  Header  │  Header  │     Payload      │
│  14B     │  20B     │  20B     │   ?B     │    (Application) │
└──────────┴──────────┴──────────┴──────────┴──────────────────┘
 Total overhead: minimum 54 bytes (without TLS and Ethernet trailer)
```

### 🔍 4. PDU — Protocol Data Units

```
┌────────────────────────────────────────────────────────────────┐
│  Layer     │  PDU Name      │  Contains                        │
├────────────┼─────────────────┼──────────────────────────────────┤
│ L7 App     │  Data / Message │  Application-specific data       │
│ L6 Pres.   │  Data           │  Same (encrypted/compressed)     │
│ L5 Session │  Data           │  Same                            │
│ L4 Trans.  │  Segment (TCP)  │  TCP header + Data               │
│            │  Datagram (UDP) │  UDP header + Data                │
│ L3 Network │  Packet (IP)    │  IP header + Segment/Datagram    │
│ L2 Link    │  Frame          │  Ethernet header + Packet + FCS  │
│ L1 Phys.   │  Bits           │  0/1 electrical signals          │
└────────────┴─────────────────┴──────────────────────────────────┘
```

### 🔍 5. TCP/IP Model vs OSI Model

```
OSI (7 layers):              TCP/IP (4 layers):
┌─────────────────────┐      ┌──────────────────────────────────┐
│ 7. Application      │      │                                  │
│ 6. Presentation      │      │   Application Layer             │
│ 5. Session          │      │   (HTTP, DNS, SMTP, SSH)          │
├─────────────────────┤      ├──────────────────────────────────┤
│ 4. Transport        │      │   Transport Layer                │
│                     │      │   (TCP, UDP)                      │
├─────────────────────┤      ├──────────────────────────────────┤
│ 3. Network          │      │   Internet Layer                 │
│                     │      │   (IP, ICMP, ARP, BGP)           │
├─────────────────────┤      ├──────────────────────────────────┤
│ 2. Data Link         │      │   Link Layer                     │
│ 1. Physical          │      │   (Ethernet, Wi-Fi, PPP)        │
└─────────────────────┘      └──────────────────────────────────┘
```

**Tại sao TCP/IP chỉ có 4 tầng?** Vì nó thực tế hơn lý thuyết. OSI ra đời **trước** internet phổ biến, còn TCP/IP là những protocol thực sự vận hành internet.

### 🔍 6. Liên hệ thực tế với daily dev work

```
Bạn gõ URL vào trình duyệt:

1. DNS lookup (L7→L5): "google.com" → IP 142.250.185.46
   → DNS dùng UDP port 53 (thường)

2. TCP Connection (L4): SYN → SYN-ACK → ACK
   → Port 443 (HTTPS)

3. TLS Handshake (L6): ClientHello → ServerHello → Certificate → Key Exchange
   → Port 443

4. HTTP Request (L7): GET / HTTP/1.1
   → Host: google.com

5. IP Routing (L3): Router hop qua ~15 router
   → Mỗi router decrement TTL, forward

6. Ethernet Frame (L2): Switch → Router → Switch
   → MAC address table lookup

7. Physical (L1): Light/electrical signals
   → Fiber/copper/wireless

→ Phản hồi đi ngược lại từ L1 → L7
```

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 Tại sao phải nhớ OSI?

1. **Debug mạng có hệ thống:** Khi website không load, bạn kiểm tra từng tầng:
   - L1: Cable/radio OK? (`ping`)
   - L2: MAC/ARP OK? (`arp -a`)
   - L3: IP routing OK? (`traceroute`)
   - L4: Port open? (`netstat`, `telnet`)
   - L7: Application error? (Check logs)

2. **Hiểu cách tools hoạt động:**
   - `ping` = L3 (ICMP echo)
   - `traceroute` = L3 (TTL manipulation)
   - `arp` = L2 (MAC resolution)
   - `tcpdump` = L2/L3 (packet capture)
   - `wireshark` = tất cả tầng

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Nhầm MAC và IP** | MAC = cổng mạng (như địa chỉ nhà), IP = vị trí mạng (như thành phố). Router thay đổi IP, không thay đổi MAC |
| **Tưởng tầng nào cũng có thiết bị riêng** | L4 (Transport) không có thiết bị riêng — chỉ là software trên endpoints |
| **Quên overhead của mỗi tầng** | HTTP over TLS over TCP over IP over Ethernet = ít nhất 54 bytes overhead. Mỗi HTTP request nhỏ → overhead rất lớn |

### 🔑 Key Insight

> **OSI = 7 tầng, mỗi tầng chỉ nói chuyện với lớp trên và dưới nó.**
>
> Socket programming nằm ở ranh giới L4/L5 — nó dùng TCP/UDP (L4) và cung cấp API cho ứng dụng (L5–L7).

---

## ✅ Ghi nhớ mnemonic

```
Please Do Not Throw Sausage Pizza Away

P - Physical      (Cable, Hub)
D - Data Link     (Switch, MAC)
N - Network       (Router, IP)
T - Transport     (TCP/UDP, Port)
S - Session       (Token, Auth)
P - Presentation  (TLS, Encoding)
A - Application   (HTTP, DNS, SSH)
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: OSI 7 Layers
💡 KEY INSIGHT: OSI giúp debug mạng có hệ thống từng tầng. Socket = ranh giới L4/L5.
⚠️ PITFALLS:
  - MAC (L2) vs IP (L3) khác nhau
  - Mỗi tầng thêm header → overhead
  - Socket ở ranh giới Session/Transport
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](../02-tcp-sockets/005-tcp-server.md)
