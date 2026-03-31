# 024 — I/O Threads

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | I/O Threads, Multi-threaded I/O, Redis 6+ |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Redis Threading Model

```
┌──────────────────────────────────────────────────────────────┐
│              REDIS 6+ I/O THREADING                                  │
│                                                               │
│  Redis single-threaded (command execution):                     │
│  ├── ✅ Atomic operations (no locks)                          │
│  ├── ✅ Predictable performance                             │
│  └── ⚠️ CPU-bound tasks = bottleneck                       │
│                                                               │
│  Redis multi-threaded I/O (v6+):                              │
│  ├── I/O threads đọc/ghi sockets                           │
│  ├── Main thread xử lý commands                            │
│  └── ⚠️ Command execution vẫn single-threaded               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 2. Enable I/O Threads

```conf
# redis.conf
io-threads 4
io-threads-do-reads yes
```

### 🔍 3. When to Enable

```
I/O Threads = High network throughput
├── Many small commands
├── Network bandwidth not fully utilized
└── CPU not maxed out

Disable I/O Threads = CPU-bound
├── Heavy Lua scripts
├── CPU-intensive commands
└── Throughput already maxed
```

---

## 🧠 Phân tích & Hướng tư tư

### ⚠️ Common Pitfalls

| Pitfall | Explanation |
|---------|-----------|
| **I/O threads trên slow network** | No benefit if network is the bottleneck |
| **I/O threads với CPU-bound workload** | Main thread is bottleneck, not I/O |

### 🔑 Key Insight

> **I/O Threads = parallelize socket I/O, not command execution. Enable when network bandwidth not saturated.**

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: I/O Threads
💡 KEY INSIGHT: I/O Threads = parallelize I/O, not execution.
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./025-optimization.md)
