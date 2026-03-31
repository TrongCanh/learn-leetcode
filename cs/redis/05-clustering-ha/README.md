# Chương 5 — Clustering & High Availability

> Replication, Sentinel, Cluster, Redlock — scale và độ sẵn sàng cao.

---

## 4 bài trong chương này

| # | Bài | Độ khó | Giải quyết |
|---|-----|--------|------------|
| 018 | [Replication](./018-replication.md) | 🟢 Easy | Master-slave, read replicas, async replication |
| 019 | [Sentinel](./019-sentinel.md) | 🟡 Medium | Automatic failover, monitoring, HA |
| 020 | [Cluster](./020-cluster.md) | 🔴 Hard | Horizontal sharding, distributed Redis |
| 021 | [Redlock](./021-redlock.md) | 🔴 Hard | Distributed locking, single & multi-instance |

## 🔑 Khái niệm chung

### 🔍 1. Redis HA Spectrum

```
┌──────────────────────────────────────────────────────────────┐
│  SINGLE REDIS → REPLICATION → SENTINEL → CLUSTER             │
│                                                              │
│  Single:       1 instance, no HA                            │
│                → Cheap, simple                             │
│                → Single point of failure                    │
│                                                              │
│  Replication:  1 master + N replicas                       │
│                → Read scalability                          │
│                → Manual failover                           │
│                                                              │
│  Sentinel:     Replication + automatic failover              │
│                → HA, monitoring, promotion                 │
│                → Single shard                             │
│                                                              │
│  Cluster:      Sharding + Replication + HA                  │
│                → Scale horizontally, high availability     │
│                → Complex setup & operations               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 2. Khi nào dùng gì?

| Use case | Setup |
|----------|-------|
| Dev/Testing | Single instance |
| Small prod, read-heavy | Replication |
| Prod, can't tolerate downtime | Sentinel |
| Large dataset, need scale | Cluster |
| Distributed locking | Redlock |

---

## → Bắt đầu với [018 — Replication](./018-replication.md)
