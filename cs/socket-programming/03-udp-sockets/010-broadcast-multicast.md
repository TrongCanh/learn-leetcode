# 010 — Broadcast & Multicast

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🔴 Hard |
| **Chủ đề** | Broadcast, Multicast, Unicast, Anycast, UDP one-to-many |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Ba hình thức truyền tin trong mạng

Trước khi hiểu Broadcast và Multicast, cần hiểu 3 hình thức giao tiếp mạng:

```
┌─────────────────────────────────────────────────────────────┐
│         UNICAST — Một gửi, một nhận                       │
│                                                              │
│    A ──────────────► B                                       │
│    "Gửi cho đúng B"                                         │
│                                                              │
│    Use case: HTTP request, SSH, email                        │
├─────────────────────────────────────────────────────────────┤
│         BROADCAST — Một gửi, tất cả nhận                    │
│                                                              │
│    A ──────────────► [B] [C] [D] [E]                        │
│    "Gửi cho TẤT CẢ trong mạng"                              │
│                                                              │
│    Use case: ARP, DHCP DISCOVER, LAN discovery               │
├─────────────────────────────────────────────────────────────┤
│         MULTICAST — Một gửi, nhóm nhận                      │
│                                                              │
│    A ──────────────► [B] [C] [E]                            │
│    "Gửi cho nhóm D (không gửi cho E)"                       │
│                                                              │
│    Use case: IPTV, live streaming, video conference          │
└─────────────────────────────────────────────────────────────┘
```

### 🔍 2. Broadcast — Gửi cho TẤT CẢ

**Broadcast = Gửi packet đến TẤT CẢ máy trong cùng mạng LAN.**

#### IPv4 Broadcast Addresses

```
┌────────────────────────────────────────────────────────────┐
│         IPv4 Broadcast Address                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Network: 192.168.1.0/24                                  │
│                                                            │
│  Subnet broadcast: 192.168.1.255                          │
│  → Gửi đến TẤT CẢ máy trong mạng 192.168.1.0/24         │
│                                                            │
│  Limited broadcast: 255.255.255.255                        │
│  → Gửi đến TẤT CẢ máy trong MẠNG HIỆN TẠI               │
│  → Router KHÔNG forward                                   │
│                                                            │
│  Directed broadcast: <net>.<host全是255>                   │
│  → 192.168.1.255 = broadcast cho mạng 192.168.1.0/24      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

#### UDP Broadcast Server

```python
import socket
import struct

def udp_broadcast_server(port=9000):
    """
    Broadcast Server
    - Bind vào địa chỉ broadcast
    - Nhận request từ mọi client
    - Gửi reply cho đúng client (unicast)
    """
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    # ⚠️ QUAN TRỌNG: Bật broadcast
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

    # Bind vào INADDR_ANY (nhận từ mọi interface)
    sock.bind(('', port))  # '' = INADDR_ANY

    # Hoặc bind vào broadcast address cụ thể
    # sock.bind(('192.168.1.255', port))  # chỉ nhận từ mạng này

    print(f"🖥️  UDP Broadcast Server đang chạy...")
    print(f"   Client gửi đến: <broadcast>:{port}")
    print("   (Ctrl+C để tắt)\n")

    while True:
        data, client_addr = sock.recvfrom(4096)
        message = data.decode().strip()
        print(f"📥 [{client_addr[0]}:{client_addr[1]}]: {message}")

        # Gửi response về cho client (unicast)
        response = f"ACK: {message}".encode()
        sock.sendto(response, client_addr)
        print(f"📤 → {client_addr}: {response.decode()}")
```

#### UDP Broadcast Client

```python
def udp_broadcast_client(server_port=9000):
    """
    Broadcast Client
    - Gửi message đến địa chỉ broadcast
    - Đợi response (unicast từ server)
    """
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    # ⚠️ QUAN TRỌNG: Bật broadcast trước khi sendto broadcast address
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

    # Có thể bind vào specific interface
    # sock.bind(('192.168.1.100', 0))  # local IP

    # Địa chỉ broadcast của mạng
    # Cách tính: lấy network prefix + .255 hết
    broadcast_addr = ('255.255.255.255', server_port)  # Limited broadcast

    sock.settimeout(5.0)

    message = b"DISCOVER_SERVER"
    sock.sendto(message, broadcast_addr)
    print(f"📤 Đã gửi broadcast: {message.decode()} đến {broadcast_addr}")

    # Đợi response
    try:
        data, server_addr = sock.recvfrom(4096)
        print(f"📥 Server phản hồi: {data.decode()} từ {server_addr}")
        return server_addr
    except socket.timeout:
        print("⏰ Không có server nào phản hồi")
        return None
```

#### Use cases thực tế của Broadcast

| Protocol | Port | Mục đích |
|----------|------|-----------|
| **ARP** | — | "Ai có IP 192.168.1.1?" → MAC address reply |
| **DHCP DISCOVER** | 67/68 | Client broadcast: "Cần IP address!" |
| **NetBIOS Name Query** | 137 | Windows LAN discovery |
| **mDNS (Bonjour)** | 5353 | "Ai có service _http._tcp.local?" |
| **SSDP (UPnP)** | 1900 | "Tìm router NAT!" |
| **Gaming LAN discovery** | Custom | Tìm game server trong LAN |

### 🔍 3. Multicast — Gửi cho NHÓM

**Multicast = Gửi packet đến NHÓM máy đã subscribe.**

```
Broadcast:  Gửi cho TẤT CẢ  → Lãng phí băng thông (ai không cần cũng nhận)
Unicast:    Gửi cho MỘT      → Lặp lại n lần cho n receivers
Multicast:  Gửi cho NHÓM     → Gửi MỘT lần, đến NHIỀU receivers

              Broadcast               Multicast

  Sender ──► [A][B][C][D][E]    Sender ──► [A][B][C][D][E]
              [x] = nhận               [x] = nhận
              ✓Nhận                   ✓Nhận
              [x] = nhận               [ ] = không nhận
              [ ] = không nhận          [x] = nhận
```

#### IPv4 Multicast Address

```
┌────────────────────────────────────────────────────────────┐
│         IPv4 Multicast Range                               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  224.0.0.0 – 224.0.0.255 (Local Network Control Block)    │
│  → Router KHÔNG forward, chỉ trong LAN                    │
│  → 224.0.0.1: All hosts on LAN                           │
│  → 224.0.0.2: All routers on LAN                         │
│  → 224.0.0.9: RIP v2 routers                             │
│  → 224.0.0.251: mDNS (Bonjour)                          │
│                                                            │
│  224.0.1.0 – 231.255.255.255 (Scoped)                    │
│  → Routers CÓ thể forward (có TTL)                       │
│                                                            │
│  232.0.0.0 – 232.255.255.255 (SSM - Source Specific)     │
│  → Chỉ receiver chỉ định source                          │
│                                                            │
│  239.0.0.0 – 239.255.255.255 (Administrative Scoped)     │
│  → Global scoped (enterprise)                              │
│                                                            │
└────────────────────────────────────────────────────────────┘

IPv6 Multicast:
  ff00::/8 — ff02::1 = all nodes
           — ff02::2 = all routers
           — ff02::cafe = for LISP
```

#### UDP Multicast Server

```python
import socket
import struct

MULTICAST_GROUP = '239.255.255.250'  # Common for SSDP/UPnP
MULTICAST_PORT = 1900

def udp_multicast_server():
    """Multicast Server — gửi đến nhiều subscribers"""

    # Tạo UDP socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

    # Bind vào multicast port
    # '' = INADDR_ANY nhận tất cả
    sock.bind(('', MULTICAST_PORT))

    # Tham gia multicast group (JOIN nhóm)
    # struct ip_mreq: interface + multicast address
    mreq = struct.pack('=4s4s',
                       socket.inet_aton(MULTICAST_GROUP),
                       socket.inet_aton('0.0.0.0'))  # 0.0.0.0 = all interfaces

    sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)
    sock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 2)

    print(f"📺 Multicast Server tham gia nhóm {MULTICAST_GROUP}:{MULTICAST_PORT}")
    print("   Gõ message để gửi multicast...\n")

    while True:
        # Nhận từ client (unicast response)
        data, addr = sock.recvfrom(4096)
        print(f"📥 [{addr}]: {data.decode().strip()}")

        # Gửi multicast cho TẤT CẢ subscribers
        msg = input("Multicast > ")
        if msg.lower() == 'quit':
            break
        sock.sendto(msg.encode(), (MULTICAST_GROUP, MULTICAST_PORT))
```

#### UDP Multicast Client

```python
def udp_multicast_client():
    """Multicast Client — tham gia nhóm, nhận multicast messages"""

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.settimeout(5.0)

    # Bind vào multicast port
    sock.bind(('', MULTICAST_PORT))

    # Tham gia multicast group
    mreq = struct.pack('=4s4s',
                       socket.inet_aton(MULTICAST_GROUP),
                       socket.inet_aton('0.0.0.0'))
    sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)

    print(f"📺 Tham gia multicast group {MULTICAST_GROUP}:{MULTICAST_PORT}")
    print("   Đợi messages...\n")

    while True:
        try:
            data, addr = sock.recvfrom(4096)
            print(f"📨 [{addr}]: {data.decode().strip()}")
        except socket.timeout:
            print("⏰ Đợi message...")
```

### 🔍 4. So sánh Broadcast vs Multicast

```
┌──────────────────┬──────────────────────┬──────────────────────┐
│     Tiêu chí     │     Broadcast        │     Multicast        │
├──────────────────┼──────────────────────┼──────────────────────┤
│ Destination      │ Tất cả trong LAN     │ Chỉ nhóm đã join    │
│ Scope            │ LAN only (router chặn)│ LAN + có thể forward │
│ Join group       │ Không                │ Cần IP_ADD_MEMBERSHIP│
│ Bandwidth        │ Lãng phí (gửi tất cả)│ Tối ưu (gửi 1 lần) │
│ IGMP/SMLD        │ Không dùng           │ Dùng IGMP/SMLD       │
│ Firewall         │ Dễ block (chặn .255) │ Dễ config (group addr)│
│ Use case         │ ARP, DHCP, LAN disc. │ IPTV, streaming      │
│ Scalability      │ Kém (N clients = N×bandwidth)│Tốt (1×bandwidth)│
└──────────────────┴──────────────────────┴──────────────────────┘
```

### 🔍 5. IGMP — Internet Group Management Protocol

**IGMP = Giao thức để hosts join/leave multicast groups.**

```
Host muốn nhận multicast 239.1.1.1:
  ──── IGMP JOIN ────► Router nhận biết
  ──── IGMP QUERY ◄─── Router hỏi "ai muốn nhóm nào?"
  ◄─── IGMP JOIN ──── Host reply

Router nhận multicast 239.1.1.1:
  ──── IGMP REPORT ───► Upper router
  ──── IGMP GROUP ─────► Upstream router đăng ký

Host leave:
  ──── IGMP LEAVE ────► Router

→ IGMP được implement trong OS kernel
→ Không cần lập trình viên quan tâm, nhưng CẦN hiểu khi debug
```

### 🔍 6. TTL (Time To Live) cho Multicast

```python
# Multicast TTL
# Mỗi router giảm TTL 1
# TTL = 0: không rời khỏi máy gửi
# TTL = 1: chỉ trong LAN
# TTL = 2-15: có thể qua 2-15 routers
# TTL > 15: không recommend

sock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 1)
# → Chỉ gửi trong cùng mạng LAN (không qua router)

sock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 64)
# → Có thể đi qua nhiều routers
```

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 Tại sao cần SO_BROADCAST?

```
Không có SO_BROADCAST:
  sock.sendto(data, ('255.255.255.255', 9000))
  → OSError: [Errno 13] Permission denied

Có SO_BROADCAST:
  sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
  sock.sendto(data, ('255.255.255.255', 9000))
  → Gửi thành công

→ Lý do: Broadcast có thể bị lạm dụng (DoS LAN)
→ OS mặc định CẤM, phải explicit enable
```

### 🤔 Tại sao cần IP_ADD_MEMBERSHIP cho Multicast?

```
Không JOIN:
  sock.bind(('', 1900))
  sendto(('239.255.255.250', 1900), data)
  → Socket nhận được DATA GỬI BỞI CHÍNH MÁY này
  → KHÔNG nhận được data gửi bởi MÁY KHÁC

Có JOIN:
  mreq = struct.pack('=4s4s', inet_aton(group), inet_aton('0.0.0.0'))
  sock.setsockopt(IPPROTO_IP, IP_ADD_MEMBERSHIP, mreq)
  → OS join multicast group
  → NIC filter: chỉ nhận multicast packets cho group này
  → Kernel forward đến socket
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Quên SO_BROADCAST** | `sendto(255.255.255.255, port)` → Permission denied |
| **Broadcast qua router** | `255.255.255.255` không bao giờ qua router. Muốn qua router → dùng directed broadcast |
| **Quên IP_ADD_MEMBERSHIP** | Multicast socket chỉ nhận từ chính mình, không nhận từ nhóm |
| **TTL = 0** | Packet không rời khỏi máy → không ai nhận được |
| **Nhầm multicast với broadcast** | Broadcast = tất cả trong LAN. Multicast = chỉ subscribers |

### 🔑 Key Insight

> **Broadcast = gửi cho tất cả (trong LAN). Multicast = gửi cho nhóm đã subscribe. Broadcast tiết kiệm code nhưng lãng phí băng thông. Multicast phức tạp hơn nhưng scale tốt hơn nhiều.**

---

## ✅ Ví dụ: LAN Service Discovery (mDNS/Bonjour đơn giản)

```python
"""
LAN Service Discovery — Tìm server trong mạng LAN
Dùng UDP Broadcast để discover services
"""

import socket
import json
import threading

SERVICE_PORT = 9001
BROADCAST_ADDR = ('255.255.255.255', SERVICE_PORT)

class ServiceRegistry:
    """Registry để các services đăng ký"""
    def __init__(self):
        self.services = {}

    def register(self, service_name, host, port, metadata=None):
        self.services[service_name] = {
            'host': host,
            'port': port,
            'metadata': metadata or {}
        }

    def get_all(self):
        return self.services.copy()

registry = ServiceRegistry()

def broadcast_server():
    """Server nhận broadcast, reply với services"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    sock.bind(('', SERVICE_PORT))
    sock.settimeout(5.0)

    print(f"🔍 Broadcast server đang chạy...")

    while True:
        try:
            data, addr = sock.recvfrom(4096)
            msg = data.decode().strip()

            if msg == "SERVICE_DISCOVER":
                print(f"📥 Discovery request từ {addr}")

                # Trả về danh sách services
                services = registry.get_all()
                response = json.dumps(services).encode()
                sock.sendto(response, addr)
                print(f"📤 Đã gửi {len(services)} services đến {addr}")

        except socket.timeout:
            continue
        except Exception as e:
            print(f"Lỗi: {e}")

def service_announcer():
    """Service tự đăng ký"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

    import socket as s
    host = s.gethostbyname(s.gethostname())

    registry.register('web-server', host, 8080, {'type': 'http'})
    registry.register('redis', host, 6379, {'type': 'cache'})

    print(f"📢 Đã đăng ký services tại {host}")

    # Periodic broadcast (mỗi 30s gửi lại announcement)
    while True:
        announcement = json.dumps({
            'action': 'ANNOUNCE',
            'host': host,
            'services': list(registry.get_all().keys())
        })
        sock.sendto(announcement.encode(), BROADCAST_ADDR)
        import time; time.sleep(30)

def service_discovery_client():
    """Client discover services trong LAN"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    sock.settimeout(3.0)

    # Gửi broadcast
    sock.sendto(b"SERVICE_DISCOVER", BROADCAST_ADDR)
    print("📡 Đã gửi SERVICE_DISCOVER broadcast")

    try:
        data, addr = sock.recvfrom(4096)
        services = json.loads(data.decode())
        print(f"✅ Tìm thấy {len(services)} services từ {addr}:")
        for name, info in services.items():
            print(f"  - {name}: {info['host']}:{info['port']} ({info['metadata']})")
        return services
    except socket.timeout:
        print("⏰ Không tìm thấy services")
        return {}
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Broadcast & Multicast
💡 KEY INSIGHT: Broadcast = tất cả trong LAN. Multicast = nhóm subscribe. Cần SO_BROADCAST và IP_ADD_MEMBERSHIP.
⚠️ PITFALLS:
  - Quên SO_BROADCAST → permission denied
  - Multicast cần join group trước
  - TTL=0 = không gửi đi đâu
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](../04-advanced/011-non-blocking-io.md)
