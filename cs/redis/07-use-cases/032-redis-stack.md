# 032 — Redis Stack

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | Redis Stack, RediSearch, RedisJSON, RedisBloom, RedisGraph, RedisTimeSeries |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Redis Stack = All-in-One

**Redis Stack = Redis + built-in modules = full-featured data platform.**

```
┌──────────────────────────────────────────────────────────────┐
│                    REDIS STACK                                         │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Redis Core:                                          │   │
│  │  Strings, Lists, Sets, Hashes, Sorted Sets          │   │
│  │  Streams, Geospatial                                │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  RedisJSON  → Native JSON (partial updates)          │   │
│  │  RediSearch → Full-text + vector search              │   │
│  │  RedisBloom → Probabilistic data structures          │   │
│  │  RedisGraph → Graph database                         │   │
│  │  RedisTimeSeries → Time-series data                   │   │
│  │  RedisGears  → Serverless engine                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Download: redis.stack.com                                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 2. Module Summary

```
┌──────────────────────────────────────────────────────────────┐
│              MODULE SUMMARY                                             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  RedisJSON:                                                 │
│  ├── JSON.SET doc $.field "value"                        │
│  ├── JSON.GET doc $.field                                │
│  └── Native JSON — fast partial updates                    │
│                                                               │
│  RediSearch:                                               │
│  ├── FT.CREATE index SCHEMA ...                          │
│  ├── FT.SEARCH index query                              │
│  ├── FT.AGGREGATE for analytics                         │
│  └── Vector search (KNN)                                  │
│                                                               │
│  RedisBloom:                                               │
│  ├── BF.ADD / BF.EXISTS (Bloom filter)                │
│  ├── CF.ADD / CF.DEL (Cuckoo filter)                  │
│  ├── CMS.INCRBY (Count-Min Sketch)                     │
│  └── TOPK.ADD (Top-K)                                 │
│                                                               │
│  RedisGraph:                                               │
│  ├── GRAPH.QUERY "MATCH (a)-[r]->(b) RETURN ..."    │
│  ├── GRAPH.RO (relationship queries)                    │
│  └── Cypher query language                              │
│                                                               │
│  RedisTimeSeries:                                          │
│  ├── TS.CREATE timeseries                               │
│  ├── TS.ADD timestamp value                            │
│  ├── TS.RANGE / TS.GET                                 │
│  └── Downsampling, aggregation                           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 3. Use Case Matrix

```
┌──────────────────────────────────────────────────────────────┐
│              MODULE USE CASES                                         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  RedisJSON — Nested JSON, partial updates                     │
│  └── User profiles, product catalogs, API responses         │
│                                                               │
│  RediSearch — Full-text search, faceted search             │
│  └── E-commerce, content platforms, autocomplete          │
│                                                               │
│  RedisBloom — Probabilistic, duplicate detection            │
│  └── Spam filtering, recommendation, rate limiting         │
│                                                               │
│  RedisGraph — Graph queries                               │
│  └── Social graphs, fraud detection, knowledge graphs   │
│                                                               │
│  RedisTimeSeries — Time-series data                       │
│  └── IoT, monitoring, analytics                          │
│                                                               │
│  Redis Stack — All-in-one platform                       │
│  └── Modern app requiring multiple data models          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧠 Phân tích & Hướng tư tư

### 🤔 Khi nào dùng Redis Stack?

```
Dùng Redis Stack khi:
  ├── Cần search trong Redis
  ├── Cần JSON với partial updates
  ├── Cần multiple data models
  ├── Không muốn deploy nhiều databases
  └── Microservices consolidation

Dùng Redis Core thuần khi:
  ├── Chỉ cần caching, simple data structures
  ├── Performance là priority #1
  └── Don't need search or JSON
```

### 🔑 Key Insight

> **Redis Stack = Redis + built-in modules = full-featured data platform. Search + JSON + Bloom + Graph + TimeSeries trong 1 database.**

---

## ✅ Module Quick Reference

```bash
# RedisJSON
JSON.SET doc:1 $.name '"Alice"'
JSON.GET doc:1 $.name

# RediSearch
FT.CREATE idx SCHEMA name TEXT email TEXT
FT.SEARCH idx "alice"

# RedisBloom
BF.ADD bloom:urls "https://example.com"
BF.EXISTS bloom:urls "https://example.com"

# RedisGraph
GRAPH.QUERY mygraph "CREATE (a:Person {name:'Alice'})"
GRAPH.QUERY mygraph "MATCH (a) RETURN a"

# RedisTimeSeries
TS.CREATE temp RETENTION 864000 LABELS type temperature
TS.ADD temp * 22.5
TS.GET temp
TS.RANGE temp 1709300000 1709399999
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Redis Stack
💡 KEY INSIGHT: Redis Stack = all-in-one platform. JSON + Search + Bloom + Graph + TimeSeries.
✅ Đã hiểu: [ ]
```

---

**🎉 HOÀN THÀNH CHƯƠNG 7 — USE CASES!**

**🎉 HOÀN THÀNH TRACK REDIS!**
