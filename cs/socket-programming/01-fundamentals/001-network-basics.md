# 001 — Network Basics

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟢 Easy |
| **Chủ đề** | TCP/IP, IP Address, Port, DNS, Network Model |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Tại sao cần hiểu mạng?

Trước khi hiểu Socket, ta cần hiểu **tại sao máy tính có thể nói chuyện được với nhau qua mạng**. Hãy tưởng tượng:

> Bạn mở Chrome, gõ `google.com`, và sau 1 giây thấy trang Google hiện ra. Đằng sau quá trình đó là hàng chục nghìn packet được gửi qua lại giữa máy bạn và server của Google. Socket là **cánh cửa** để chương trình của bạn tham gia vào cuộc trò chuyện đó.

### 🔍 2. TCP/IP Model — Mô hình 4 tầng

TCP/IP là bộ **giao thức thực tế** vận hành internet. Nó gồm 4 tầng:

```
┌──────────────────────────────────────────────────────────┐
│  Application Layer    (L7)                               │
│  HTTP, DNS, SMTP, FTP, SSH, WebSocket ...                │
├──────────────────────────────────────────────────────────┤
│  Transport Layer     (L4)                                │
│  TCP  → Reliable, ordered                               │
│  UDP  → Fast, unreliable                                 │
├──────────────────────────────────────────────────────────┤
│  Internet Layer       (L3)                               │
│  IP (IPv4, IPv6) — Định tuyến gói tin                    │
├──────────────────────────────────────────────────────────┤
│  Link Layer           (L2)                               │
│  Ethernet, Wi-Fi (802.11), ARP                           │
└──────────────────────────────────────────────────────────┘
```

**Tư duy quan trọng:** Mỗi tầng chỉ cần biết tầng ngay bên dưới nó làm gì. HTTP không cần biết Wi-Fi dùng mã hóa gì — nó chỉ cần TCP đưa dữ liệu đến đích.

### 🔍 3. IP Address — Địa chỉ máy tính trên mạng

**IP (Internet Protocol)** là địa chỉ logic của một máy trong mạng. Có 2 phiên bản:

#### IPv4 (32-bit)
```
192.168.1.100
```
- 4 số, mỗi số 0–255 → ~4.3 tỷ địa chỉ
- Đã **cạn kiệt** từ ~2011
- **Private IP**: `10.x.x.x`, `172.16.x.x–172.31.x.x`, `192.168.x.x`
- **Public IP**: Còn lại (Internet-facing)

#### IPv6 (128-bit)
```
2001:0db8:85a3:0000:0000:8a2e:0370:7334
```
- 8 nhóm hex, rút gọn được: `2001:db8:85a3::8a2e:370:7334`
- ~340 tỷ tỷ tỷ tỷ địa chỉ → đủ cho mọi thiết bị IoT

#### Liên hệ thực tế
| Khái niệm | Analog thực tế |
|-----------|---------------|
| Public IP | Số điện thoại quốc tế (bạn có thể gọi từ bất kỳ đâu) |
| Private IP | Số nội bộ công ty (chỉ gọi trong công ty) |
| NAT | Lễ tân công ty — chuyển tiếp cuộc gọi vào |
| Port forwarding | Đưa điện thoại vào đúng phòng ban |

### 🔍 4. Port — Cổng giao tiếp

Một máy có thể chạy nhiều dịch vụ cùng lúc. **Port** xác định **dịch vụ cụ thể** trên một IP.

```
┌─────────────────────────┐
│  Máy tính 192.168.1.5   │
│                         │
│  Port 80    → Web Server│
│  Port 443   → HTTPS     │
│  Port 22    → SSH       │
│  Port 3306  → MySQL     │
│  Port 6379  → Redis     │
│  Port 3000  → Node app  │
└─────────────────────────┘
```

**Quy tắc:**
- `0`–`1023`: **Well-known ports** (chỉ root/admin mới bind được, e.g. port 80 = HTTP)
- `1024`–`49151`: **Registered ports** (ứng dụng đăng ký, e.g. MySQL 3306)
- `49152`–`65535`: **Ephemeral/Private ports** (client tạm thời dùng khi connect ra)

**Mẹo nhớ:** 80 = HTTP (2 số 0 như "cửa sổ không có gì"), 443 = HTTPS (số lớn hơn = bảo mật hơn).

### 🔍 5. DNS — Hệ thống tên miền

DNS giống như **danh bạ điện thoại**: bạn nhớ tên (`google.com`) thay vì số IP (`142.250.185.46`).

```
Bạn gõ "google.com"
       │
       ▼
   DNS Resolver
   (thường là của ISP: 203.113.131.1)
       │
       ▼
   Root Server (.com, .vn, .org...)
       │
       ▼
   TLD Server (xác định nameserver của domain)
       │
       ▼
   Authoritative Server (chứa IP thật của google.com)
       │
       ▼
   Trả về IP → Browser kết nối đến IP đó
```

**DNS Record Types:**

| Type | Mục đích | Ví dụ |
|------|---------|-------|
| A | Map domain → IPv4 | `google.com → 142.250.185.46` |
| AAAA | Map domain → IPv6 | `google.com → 2001:4860:...` |
| CNAME | Alias một domain | `www.google.com → google.com` |
| MX | Mail server | `gmail.com → alt1.gmail-smtp-in.l.google.com` |
| NS | Nameserver | `ns1.google.com` |
| TXT | Xác thực (SPF, DKIM) | `"v=spf1 include:_spf.google.com ..."` |

### 🔍 6. Socket Address — Kết hợp IP + Port

Socket address = `IP + Port + Protocol (TCP/UDP)`

```
TCP Socket:  (192.168.1.5, 8080)
UDP Socket:  (192.168.1.5, 8080)

→ Cùng IP:Port nhưng khác protocol = 2 socket khác nhau!
```

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 Tại sao phải phân tăng Network?

Hầu hết lập trình viên hiện đại chỉ dùng HTTP/REST mà không cần biết Socket. Vậy tại sao phải học?

**Vì có những thứ HTTP không làm được:**
1. **Server push** — HTTP chỉ có client request được server. Muốn server gửi notification cho client → phải dùng WebSocket hoặc SSE
2. **Latency cực thấp** — HTTP overhead quá lớn cho game, trading, VoIP
3. **Tối ưu bandwidth** — Binary protocol (như gRPC) nhỏ hơn JSON/HTTP rất nhiều
4. **Full-duplex** — Cần gửi và nhận cùng lúc liên tục

### ⚠️ 3.1 Common Pitfalls — Sai lầm thường gặp

| Sai lầm | Giải thích |
|---------|-----------|
| **Nhầm Port với Process** | Port 3000 không phải của Node.js — bất kỳ app nào bind vào port 3000 đều dùng được. Mỗi app bind 1 port, nhưng nhiều app cùng 1 máy có thể tranh chấp port |
| **Port forwarding bị quên** | Chạy server ở nhà nhưng router không forward port → bên ngoài không truy cập được |
| ** localhost vs 0.0.0.0** | `127.0.0.1` chỉ cho máy local truy cập. `0.0.0.0` cho phép mọi interface → cần dùng `0.0.0.0` khi deploy |
| **Nhầm DNS với load balancer** | DNS chỉ ánh xạ tên → IP. Nó **không** phân tải. Muốn load balance cần cơ chế riêng (DNS round-robin, GeoDNS, anycast...) |

### 🔑 3.2 Key Insight

> **Socket = IP + Port + Protocol**
>
> Socket là điểm cuối của một kết nối mạng. Hiểu đúng IP và Port là nền tảng để debug mọi vấn đề mạng. Khi một connection "không connect được", 90% là do:
> 1. Sai IP/Port
> 2. Firewall chặn
> 3. Service không chạy

---

## ✅ Ví dụ minh họa thực tế

### Ví dụ 1: Traceroute — xem đường đi của packet

```bash
# Windows
tracert google.com

# Linux/Mac
traceroute google.com
```

Output cho thấy mỗi "hop" là một router trung gian:

```
 1    <1 ms    <1 ms    <1 ms  192.168.1.1        ← Router nhà bạn
 2    10 ms    12 ms    11 ms  10.0.0.1            ← ISP gateway
 3    25 ms    24 ms    26 ms  72.14.215.85        ← Google's CDN edge
 4    24 ms    25 ms    24 ms  142.250.57.184      ← Google server
```

### Ví dụ 2: Kiểm tra port đang mở

```bash
# Windows: xem port 8080 có đang listen không
netstat -ano | findstr :8080

# Linux/Mac
ss -tlnp | grep 8080
# hoặc
lsof -i :8080
```

---

## ✅ Ghi nhớ quan trọng

```
┌─────────────────────────────────────────────────────┐
│  PUBLIC IP:   203.113.131.5  ← Internet-facing     │
│  PRIVATE IP:  192.168.1.100  ← Trong mạng LAN      │
│  LOCALHOST:   127.0.0.1      ← Chính máy mình     │
│                                                     │
│  PORT 80:     HTTP (plain text)                     │
│  PORT 443:    HTTPS (encrypted)                     │
│  PORT 22:     SSH (secure shell)                   │
│  PORT 53:     DNS                                   │
│  PORT 3306:   MySQL                                 │
│  PORT 5432:   PostgreSQL                            │
│  PORT 6379:   Redis                                 │
│  PORT 27017:  MongoDB                               │
└─────────────────────────────────────────────────────┘
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Network Fundamentals
💡 KEY INSIGHT: Socket = IP + Port + Protocol. Mọi vấn đề mạng đều quy về 3 yếu tố này.
⚠️ PITFALLS:
  - localhost vs 0.0.0.0
  - Port chỉ là số nhận dạng, không phải process ID
  - DNS không phải load balancer
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./002-tcp-vs-udp.md)
