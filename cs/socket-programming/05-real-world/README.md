# Chương 5 — Real-World

> Các protocol và use case thực tế: HTTP, WebSocket, RPC/gRPC, và Performance tuning.

---

## 3 bài trong chương này

| # | Bài | Độ khó | Giải quyết |
|---|-----|--------|------------|
| 015 | [HTTP & WebSocket](./015-http-websocket.md) | 🟡 Medium | HTTP/1.1, WebSocket handshake, biến thể |
| 016 | [RPC & gRPC](./016-rpc-grpc.md) | 🔴 Hard | RPC model, Protocol Buffers, gRPC streaming |
| 017 | [Performance Tuning](./017-performance-tuning.md) | 🔴 Hard | Buffer tuning, zero-copy, benchmarks |

## 🔑 Khái niệm chung

### 🔍 1. Tầng Socket trong HTTP

```
┌─────────────────────────────┐
│      HTTP / WebSocket       │  ← Application Layer (L7)
├─────────────────────────────┤
│           TCP               │  ← Transport Layer (L4)
├─────────────────────────────┤
│           IP                │  ← Network Layer (L3)
├─────────────────────────────┤
│         Ethernet           │  ← Data Link Layer (L2)
└─────────────────────────────┘

Socket = L4 endpoint (IP + Port)
HTTP   = L7 protocol (text-based, stateless)
WebSocket = L7 protocol (bidirectional, stateful)
```

### 🔍 2. HTTP vs WebSocket vs HTTP/2 vs HTTP/3

| | HTTP/1.1 | WebSocket | HTTP/2 | HTTP/3 |
|--|----------|-----------|--------|--------|
| Direction | Request-Response | Full-duplex | Multiplexed | QUIC (UDP) |
| Connection | Short-lived | Persistent | Persistent | Persistent |
| Header overhead | Heavy | Once (handshake) | Compressed | Compressed |
| Server push | No | Yes | Yes | Yes |
| Use case | REST APIs | Real-time | Modern web | Fast web |

### 🔍 3. gRPC vs REST

| | REST | gRPC |
|--|------|------|
| Format | JSON/Text | Protocol Buffers (binary) |
| Transport | HTTP/1.1 | HTTP/2 |
| Code gen | OpenAPI/Swagger | .proto files |
| Streaming | No (requires SSE/WS) | Yes (client/server/bi-directional) |
| Performance | Moderate | Very high |

---

## → Bắt đầu với [015 — HTTP & WebSocket](./015-http-websocket.md)
