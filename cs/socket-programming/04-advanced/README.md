# Chương 4 — Advanced

> Các kỹ thuật nâng cao: Non-blocking I/O, Socket options, IPv6, Security.

---

## 4 bài trong chương này

| # | Bài | Độ khó | Giải quyết |
|---|-----|--------|------------|
| 011 | [Non-blocking I/O](./011-non-blocking-io.md) | 🔴 Hard | select, poll, epoll, async I/O |
| 012 | [Socket Options](./012-socket-options.md) | 🟡 Medium | SO_KEEPALIVE, SO_REUSEADDR, ... |
| 013 | [IPv6](./013-ipv6.md) | 🟡 Medium | Địa chỉ IPv6, dual-stack, migration |
| 014 | [Socket Security](./014-socket-security.md) | 🟡 Medium | TLS/SSL, common attacks, hardening |

## 🔑 Khái niệm chung

### 🔍 1. Vấn đề Blocking I/O

```
Blocking (truyền thống):
  Thread 1: [accept() blocks...] [read() blocks...] [write() blocks...] [close()]
  Thread 2:                              [accept() blocks...] ...

→ Cần nhiều thread cho nhiều client → Tốn resource
```

### 🔍 2. Non-blocking I/O Models

| Model | Đặc điểm |
|-------|-----------|
| `select()` | Cross-platform, giới hạn FD_SETSIZE (usually 1024) |
| `poll()` | Không giới hạn FD, nhưng cần duyệt toàn bộ array |
| `epoll()` | Linux-only, O(1) notification, scale tốt |
| `kqueue()` | macOS/BSD, tương tự epoll |
| `IOCP` | Windows, async I/O thực sự |
| `Async/Await` | Ngôn ngữ high-level (Python asyncio, Node.js) |

### 🔍 3. Reactor Pattern

```
Event Loop:
  while (running) {
    events = epoll_wait();
    for (event : events) {
      if (event.type == READ)  handle_read(event.fd);
      if (event.type == WRITE) handle_write(event.fd);
    }
  }
```

---

## → Bắt đầu với [011 — Non-blocking I/O](./011-non-blocking-io.md)
