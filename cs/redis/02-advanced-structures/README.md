# Chương 2 — Advanced Data Structures

> Các cấu trúc nâng cao: Streams, Geospatial, JSON.

---

## 3 bài trong chương này

| # | Bài | Độ khó | Giải quyết |
|---|-----|--------|------------|
| 007 | [Streams](./007-streams.md) | 🟡 Medium | Event sourcing, message queues, real-time feeds |
| 008 | [Geospatial](./008-geospatial.md) | 🟡 Medium | Location-based features, proximity search |
| 009 | [JSON](./009-json.md) | 🟡 Medium | Document storage, nested data |

## 🔑 Khái niệm chung

### 🔍 1. Khi nào cần cấu trúc nâng cao?

```
Core Structures (Chương 1):
  - Phù hợp cho 80% use cases
  - Simple, fast, predictable

Advanced Structures (Chương 2):
  - Khi cần complex queries hoặc specialized operations
  - Duy trì performance ở scale lớn
  - Đặc thù domain (location, events, documents)
```

### 🔍 2. Redis Streams vs Lists

```
Lists = Simple queue (FIFO)
Streams = Event log với consumer groups, persistence

→ Dùng List: simple job queue, basic messaging
→ Dùng Stream: event sourcing, complex consumers, replay
```

---

## → Bắt đầu với [007 — Streams](./007-streams.md)
