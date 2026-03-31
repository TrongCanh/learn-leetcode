# 017 — Performance Tuning

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🔴 Hard |
| **Chủ đề** | Buffer tuning, Zero-copy, TCP tuning, Benchmarks, Profiling |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Performance là gì — Metrics quan trọng

```
┌─────────────────────────────────────────────────────────────┐
│           SOCKET PERFORMANCE METRICS                         │
│                                                              │
│  Throughput (bandwidth):                                    │
│    - Bytes/second có thể truyền qua connection              │
│    - Giới hạn: bandwidth mạng, buffer size, CPU            │
│                                                              │
│  Latency:                                                   │
│    - Round Trip Time (RTT): 1 request → response           │
│    - Time to First Byte (TTFB): gửi → nhận byte đầu tiên  │
│    - Thường đo ở các percentiles: p50, p95, p99            │
│                                                              │
│  Connection overhead:                                        │
│    - TCP handshake: 1.5 RTT                                 │
│    - TLS handshake: 2-4 RTT (TLS 1.3: 1-RTT, 0-RTT)      │
│    - QUIC (HTTP/3): 0-1 RTT                                │
│                                                              │
│  Concurrent connections:                                    │
│    - Số connections đồng thời server có thể handle        │
│    - Giới hạn: FD limit, memory, CPU                       │
│                                                              │
│  Error rate:                                                 │
│    - Connection failures, timeouts, retries                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 🔍 2. Buffer Tuning — Tinh chỉnh buffer đúng cách

**Buffer = Bộ nhớ đệm giữa application và kernel.**

```
┌────────────────────────────────────────────────────────────┐
│                 SOCKET BUFFER                              │
│                                                             │
│  Application                                           │
│     │                                                    │
│     │ write(1MB data)                                   │
│     │                                                    │
│     ▼                                                    │
│  ┌──────────────────────────────────────────────────┐    │
│  │              Application Send Buffer                │    │
│  │  (Socket option: SO_SNDBUF, default ~16KB)       │    │
│  └──────────────────────────────────────────────────┘    │
│     │                                                    │
│     │ Kernel copies data                                │
│     │                                                    │
│     ▼                                                    │
│  ┌──────────────────────────────────────────────────┐    │
│  │              TCP Send Buffer                        │    │
│  │  (Congestion window + Flow control)               │    │
│  └──────────────────────────────────────────────────┘    │
│     │                                                    │
│     │ TCP segment → Network                           │
│     │                                                    │
└────────────────────────────────────────────────────────────┘
```

```python
import socket

# ─── Buffer sizes trên Linux (kernel auto-doubles) ───
# setsockopt(SO_SNDBUF, 1MB) → kernel set 2MB (doubling)

def show_buffer_sizes(sock):
    sndbuf = sock.getsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF)
    rcvbuf = sock.getsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF)
    print(f"SNDBUF: {sndbuf} bytes")
    print(f"RCVBUF: {rcvbuf} bytes")

# ─── Optimal buffer sizes ───
def configure_buffers(sock):
    """Cấu hình buffer cho high-throughput server"""

    # Đọc giá trị mặc định
    default_sndbuf = sock.getsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF)
    default_rcvbuf = sock.getsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF)

    # Buffer guidelines:
    # Low latency apps (VoIP, gaming): 16KB-64KB
    # High throughput (video, file): 256KB-1MB
    # Ultra high throughput: 4MB-8MB

    # Đặt buffer size (kernel sẽ tự nhân đôi!)
    target_sndbuf = 256 * 1024  # 256KB
    target_rcvbuf = 256 * 1024  # 256KB

    # Linux: kernel doubles the value
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF, target_sndbuf)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, target_rcvbuf)

    # Đọc lại (kernel doubles)
    actual_sndbuf = sock.getsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF)
    actual_rcvbuf = sock.getsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF)
    print(f"Set SNDBUF: {target_sndbuf} → Actual: {actual_sndbuf}")
    print(f"Set RCVBUF: {target_rcvbuf} → Actual: {actual_rcvbuf}")
```

### 🔍 3. Zero-Copy — Tránh copy không cần thiết

**Zero-copy = Kernel copy trực tiếp từ file vào network, không qua user space.**

```
Traditional (4 copies):
  ┌─────────────────────────────────────────────────────────┐
  │ Disk → Kernel Buffer (1) → User Buffer (2)            │
  │ → Kernel Buffer (3) → Network Card (4)                 │
  │                                                           │
  │ CPU: 4 memory copies + context switches                │
  │ Latency: cao, CPU overhead: cao                         │
  └─────────────────────────────────────────────────────────┘

Zero-Copy (2 copies):
  ┌─────────────────────────────────────────────────────────┐
  │ Disk → Kernel Buffer (1) ────────────────────────────►  │
  │                                        Network Card     │
  │                                                           │
  │ CPU: DMA transfer (direct), minimal CPU involvement     │
  │ Latency: thấp, CPU overhead: thấp                       │
  └─────────────────────────────────────────────────────────┘
```

#### sendfile() — Linux zero-copy syscall

```python
import socket
import os

def send_file_zero_copy(filepath, client_sock):
    """
    sendfile() — Linux syscall cho zero-copy file transfer
    Sao chép trực tiếp từ file descriptor → socket
    Không copy qua user space
    """
    file_size = os.path.getsize(filepath)
    bytes_sent = 0

    # Mở file
    with open(filepath, 'rb') as f:
        # sendfile(out_fd, in_fd, offset, count)
        # out_fd = socket, in_fd = file
        while bytes_sent < file_size:
            sent = os.sendfile(
                client_sock.fileno(),  # Output: socket FD
                f.fileno(),            # Input: file FD
                None,                  # Offset: None = continue
                file_size - bytes_sent  # Bytes to send
            )
            if sent == 0:
                break
            bytes_sent += sent

    print(f"✅ Sent {bytes_sent} bytes (zero-copy)")


def send_file_traditional(filepath, client_sock):
    """Traditional approach: read → write (2 copies qua user space)"""
    with open(filepath, 'rb') as f:
        while True:
            chunk = f.read(65536)  # 64KB chunks
            if not chunk:
                break
            client_sock.sendall(chunk)
```

#### Python sendfile với asyncio

```python
import asyncio
import os

async def send_large_file_async(filepath, writer):
    """
    Asyncio dùng sendfile() khi có thể
    """
    # asyncio.start_server → writer có sendfile support
    await writer.write(f"HTTP/1.1 200 OK\r\n")
    await writer.write(f"Content-Length: {os.path.getsize(filepath)}\r\n")
    await writer.write(f"\r\n")

    # Gửi file với streaming
    with open(filepath, 'rb') as f:
        while True:
            chunk = f.read(65536)
            if not chunk:
                break
            await writer.write(chunk)

    await writer.close()
```

### 🔍 4. TCP Performance Tuning — Kernel parameters

```bash
# Linux TCP tuning — thay đổi trong /etc/sysctl.conf

# ─── Connection limits ───
fs.file-max = 2097152              # System-wide FD limit
fs.nr_open = 2097152               # Per-process FD limit
net.core.somaxconn = 65535         # Max listen() backlog

# ─── Buffer sizes ───
net.core.rmem_default = 262144     # Default receive buffer
net.core.rmem_max = 16777216       # Max receive buffer
net.core.wmem_default = 262144     # Default send buffer
net.core.wmem_max = 16777216       # Max send buffer

# ─── TCP-specific buffers ───
net.ipv4.tcp_rmem = 4096 87380 16777216  # TCP receive buffer
net.ipv4.tcp_wmem = 4096 65536 16777216  # TCP send buffer

# ─── TCP window scaling ───
net.ipv4.tcp_window_scaling = 1    # Enable window scaling
net.ipv4.tcp_sack = 1              # Selective ACK
net.ipv4.tcp_timestamps = 1        # Timestamps (for RTTM)

# ─── Connection handling ───
net.ipv4.tcp_max_syn_backlog = 65535  # SYN queue size
net.ipv4.tcp_fin_timeout = 15          # TIME_WAIT timeout
net.ipv4.tcp_tw_reuse = 1              # Reuse TIME_WAIT sockets
net.ipv4.tcp_max_tw_buckets = 262144   # Max TIME_WAIT sockets
net.ipv4.ip_local_port_range = 10000 65535  # Ephemeral port range

# ─── Congestion control ───
net.ipv4.tcp_congestion_control = cubic  # Default
net.core.default_qdisc = fq                 # Queueing discipline

# ─── Keepalive ───
net.ipv4.tcp_keepalive_time = 300       # First probe after 5 min
net.ipv4.tcp_keepalive_intvl = 30      # Probe interval
net.ipv4.tcp_keepalive_probes = 5       # Max probes

# Apply changes:
#   sudo sysctl -p
```

### 🔍 5. TCP BBR — Bố ic BBR Congestion Control

**BBR (Bottleneck Bandwidth and Round-trip propagation time)** = Google congestion control algorithm, tốt hơn CUBIC trong nhiều scenarios.

```bash
# Check available congestion controls
sysctl net.ipv4.tcp_available_congestion_control
# Output: reno cubic bbr

# Enable BBR
sysctl -w net.ipv4.tcp_congestion_control=bbr
sysctl -w net.core.default_qdisc=fq

# Verify
sysctl net.ipv4.tcp_congestion_control
sysctl net.core.default_qdisc

# Add to /etc/sysctl.conf for persistence:
# net.ipv4.tcp_congestion_control=bbr
# net.core.default_qdisc=fq
```

```
┌────────────────────────────────────────────────────────────┐
│           CUBIC vs BBR                                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  CUBIC (Linux default):                                  │
│  - Dựa vào PACKET LOSS để phát hiện congestion          │
│  - Khi loss → giảm window đột ngột                        │
│  - Tốt cho: wired networks, low packet loss              │
│  - Bad cho: high-latency, wireless, satellite            │
│                                                            │
│  BBR (Google 2016):                                       │
│  - Dựa vào RTT và Bandwidth để model network            │
│  - KHÔNG cần packet loss để phát hiện congestion        │
│  - Giữ throughput ổn định kể cả khi RTT thay đổi       │
│  - Tốt cho: high-latency, wireless, long-haul, video     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 🔍 6. Benchmarking — Đo hiệu năng socket

```python
import socket
import time
import statistics

def benchmark_throughput(host='127.0.0.1', port=9000, duration=10):
    """
    Benchmark throughput bằng cách gửi data liên tục trong N giây
    """
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect((host, port))
    sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)

    # Gửi data trong duration giây
    total_bytes = 0
    chunk_size = 64 * 1024  # 64KB chunks
    data = b'x' * chunk_size

    start_time = time.time()
    end_time = start_time + duration

    while time.time() < end_time:
        sock.sendall(data)
        total_bytes += chunk_size

    elapsed = time.time() - start_time
    throughput_mbps = (total_bytes / elapsed) / (1024 * 1024)

    print(f"Duration: {elapsed:.2f}s")
    print(f"Total sent: {total_bytes / (1024*1024):.2f} MB")
    print(f"Throughput: {throughput_mbps:.2f} MB/s ({throughput_mbps*8:.2f} Mbps)")

    sock.close()
    return throughput_mbps


def benchmark_latency(host='127.0.0.1', port=9000, samples=1000):
    """
    Benchmark latency bằng cách đo RTT
    """
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect((host, port))
    sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)

    latencies = []
    request = b'PING'

    for _ in range(samples):
        start = time.perf_counter()
        sock.sendall(request)
        sock.recv(1024)
        end = time.perf_counter()
        latencies.append((end - start) * 1000)  # Convert to ms

    sock.close()

    # Stats
    latencies.sort()
    p50 = latencies[int(len(latencies) * 0.50)]
    p95 = latencies[int(len(latencies) * 0.95)]
    p99 = latencies[int(len(latencies) * 0.99)]

    print(f"Latency (ms) over {samples} samples:")
    print(f"  Min:    {min(latencies):.3f}")
    print(f"  Mean:   {statistics.mean(latencies):.3f}")
    print(f"  Median: {statistics.median(latencies):.3f}")
    print(f"  P95:    {p95:.3f}")
    print(f"  P99:    {p99:.3f}")
    print(f"  Max:    {max(latencies):.3f}")

    return {'p50': p50, 'p95': p95, 'p99': p99}


def benchmark_concurrent_connections(port=9000, max_conns=10000):
    """
    Benchmark số connections đồng thời
    """
    import concurrent.futures

    def connect_and_hold(i):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5.0)
            sock.connect(('127.0.0.1', port))
            time.sleep(1)  # Hold connection
            sock.close()
            return True
        except Exception as e:
            return str(e)

    # Tăng FD limit trước khi benchmark
    import resource
    soft, hard = resource.getrlimit(resource.RLIMIT_NOFILE)
    print(f"Current FD limit: soft={soft}, hard={hard}")

    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=100) as executor:
        futures = [executor.submit(connect_and_hold, i) for i in range(max_conns)]
        for f in concurrent.futures.as_completed(futures):
            results.append(f.result())

    success = sum(1 for r in results if r is True)
    errors = [r for r in results if r is not True]
    print(f"Successful connections: {success}/{max_conns}")
    if errors:
        error_types = {}
        for e in errors[:10]:  # Top 10
            error_types[e] = error_types.get(e, 0) + 1
        print(f"Error types: {error_types}")
```

### 🔍 7. Profiling — Tìm bottleneck

```python
import cProfile
import pstats
import io

def profile_socket_operation(func, *args):
    """Profile một socket operation"""
    profiler = cProfile.Profile()
    profiler.enable()

    result = func(*args)

    profiler.disable()

    # Print stats
    s = io.StringIO()
    stats = pstats.Stats(profiler, stream=s)
    stats.sort_stats('cumulative')
    stats.print_stats(20)
    print(s.getvalue())

    return result

# Ví dụ:
# profile_socket_operation(tcp_server_echo)
```

---

## 🧠 Phân tích & Hướng tư tư

### 🤔 Performance Checklist

```
┌────────────────────────────────────────────────────────────┐
│         SOCKET PERFORMANCE CHECKLIST                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ✅ Basic Optimizations:                                   │
│     - TCP_NODELAY cho interactive apps                    │
│     - SO_REUSEADDR luôn bật                               │
│     - Buffer sizes phù hợp với use case                  │
│     - Non-blocking I/O cho scalability                    │
│                                                            │
│  ✅ TCP Optimizations:                                     │
│     - BBR congestion control (high-latency)               │
│     - TCP window scaling (high-bandwidth)                 │
│     - SACK (selective ACK)                                │
│     - FQ queueing discipline                              │
│                                                            │
│  ✅ Application Optimizations:                             │
│     - Zero-copy (sendfile) cho file transfer             │
│     - Protocol binary (Protobuf, MessagePack)             │
│     - Connection pooling (tránh reconnect)               │
│     - Batch operations (nhiều requests gửi 1 lần)       │
│                                                            │
│  ✅ Monitoring:                                             │
│     - Throughput (bytes/s)                                │
│     - Latency (p50, p95, p99)                            │
│     - Error rate                                          │
│     - CPU/Memory usage                                    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Premature optimization** | Đo trước, tối ưu sau. 90% bottleneck không phải ở socket |
| **Tăng buffer không cần** | Buffer quá lớn → latency tăng (đợi buffer đầy) |
| **Dùng TCP_NODELAY cho bulk transfer** | Tăng overhead nghiêm trọng |
| **Benchmark trên localhost** | Localhost bypass network stack → không accurate |
| **Đổi kernel parameters mà không đo** | Changes khó revert, có thể gây hại cho use case khác |

### 🔑 Key Insight

> **Performance tuning = Measure → Optimize → measure again. Socket-level optimization chỉ hiệu quả khi bottleneck đã được xác định đúng ở đó. 80% cải thiện đến từ application-level (batch, cache, async), không phải socket-level.**

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Socket Performance Tuning
💡 KEY INSIGHT: Measure trước, optimize sau. Zero-copy cho file transfer. Buffer tuning cho throughput. TCP_NODELAY cho latency.
⚠️ PITFALLS:
  - Premature optimization
  - Benchmark localhost không accurate
  - Đổi kernel params mà không đo
✅ Đã hiểu: [ ]
```

---

**🎉 HOÀN THÀNH CHƯƠNG 5 — REAL-WORLD**

**🎉 HOÀN THÀNH TRACK SOCKET PROGRAMMING!**
