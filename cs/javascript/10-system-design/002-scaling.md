# Scaling Techniques — Từ 1 User Đến 1 Triệu Users

## Câu hỏi mở đầu

```javascript
// App của bạn ban đầu:
// 100 users → 1 server đủ

// Sau 6 tháng:
// 10,000 users → server bắt đầu lag

// Sau 1 năm:
// 100,000 users → server chết

// Câu hỏi:
// "Làm sao scale từ 100 → 1,000,000 users?"
// Câu trả lời: KHÔNG PHẢI 1 solution cho tất cả
// Mà là: TỪNG LỚP một giải pháp
```

**Scaling** không phải 1 thứ đơn lẻ, mà là **combination of strategies** cho từng layer. Database? Cache? Load balancer? Horizontal vs Vertical? Sharding? Hiểu đúng → thiết kế scale được từ đầu, không phải rewrite sau.

---

## 1. Vertical vs Horizontal Scaling

### So sánh

```
┌──────────────────────────────────────────────────────────────┐
│  VERTICAL SCALING (Scale Up)                                   │
│                                                               │
│  Server:                                                     │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  CPU: 2 cores → 64 cores                            │  │
│  │  RAM: 8GB → 512GB                                   │  │
│  │  Disk: 100GB SSD → 10TB NVMe                        │  │
│  │  Network: 1Gbps → 100Gbps                           │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                               │
│  ✅ PROS:                                                    │
│  ├── Simple: 1 server, 1 codebase                       │
│  ├── No code changes for most apps                       │
│  └── Great for databases (joins benefit from more RAM)   │
│                                                               │
│  ❌ CONS:                                                    │
│  ├── HARDWARE LIMIT: max ~128 cores, ~24TB RAM         │
│  ├── SINGLE POINT OF FAILURE                            │
│  └── EXPENSIVE: 64-core server = $50,000+              │
│                                                               │
│  ✅ BEST FOR:                                               │
│  ├── Databases (CPU + RAM intensive)                    │
│  └── State servers, caches                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  HORIZONTAL SCALING (Scale Out)                               │
│                                                               │
│  Load Balancer                                                │
│  └──→ Server 1                                               │
│  └──→ Server 2                                               │
│  └──→ Server 3                                               │
│  └──→ ...                                                    │
│  └──→ Server N                                               │
│                                                               │
│  ✅ PROS:                                                    │
│  ├── SCALE INDEFINITELY (theoretically)                  │
│  ├── NO SINGLE POINT OF FAILURE (with redundancy)         │
│  ├── CHEAPER per unit of capacity                         │
│  └── Can scale UP and DOWN dynamically                     │
│                                                               │
│  ❌ CONS:                                                    │
│  ├── CODE COMPLEXITY: stateless required                   │
│  ├── Session management harder                             │
│  └── Distributed systems problems                          │
│                                                               │
│  ✅ BEST FOR:                                               │
│  ├── Web servers, API servers                            │
│  ├── Stateless microservices                               │
│  └── Auto-scaling based on load                          │
└──────────────────────────────────────────────────────────────┘
```

### Stateless architecture

```javascript
// ❌ STATEFUL: server stores user session
const server = http.createServer((req, res) => {
  if (!req.session.user) {
    req.session.user = await authenticate(req);
  }
  // req.session = state stored on THIS server
  // → User MUST go back to same server
});

// ✅ STATELESS: server doesn't store anything
const server = http.createServer(async (req, res) => {
  // Token-based auth
  const token = req.headers.authorization?.split(' ')[1];
  const user = jwt.verify(token, SECRET); // Stateless!
  // → User can go to ANY server
});

// ❌ State in memory
const cache = new Map(); // Server-specific!

// ✅ State in Redis (external)
const cache = await redis.get(`user:${userId}`); // Shared across servers!
```

---

## 2. Database Scaling

### Read replicas

```
┌──────────────────────────────────────────────────────────────┐
│  READ REPLICAS                                               │
│                                                               │
│  Write: Master DB (1)                                        │
│  │     ↓ sync/replicate                                      │
│  └──→ Replica 1 (Read-only)                                │
│  └──→ Replica 2 (Read-only)                                │
│  └──→ Replica 3 (Read-only)                                │
│                                                               │
│  Read requests: Route to replicas                           │
│  Write requests: Route to master                           │
│                                                               │
│  Benefit: 4x read capacity (1 master + 3 replicas)       │
│  Trade-off: Replication lag (replicas slightly behind)     │
│                                                               │
│  ⚠️ Use case: Read-heavy workloads                       │
│  ⚠️ Not for: Write-heavy workloads or real-time reads   │
└──────────────────────────────────────────────────────────────┘
```

```javascript
// Database routing
class DatabaseRouter {
  constructor(config) {
    this.master = new Database(config.master);
    this.replicas = config.replicas.map(r => new Database(r));
  }

  // Write always to master
  async write(sql, params) {
    return this.master.query(sql, params);
  }

  // Read: round-robin through replicas
  async read(sql, params) {
    const replica = this.replicas[this.currentReplica];
    this.currentReplica = (this.currentReplica + 1) % this.replicas.length;
    return replica.query(sql, params);
  }

  // Smart routing: specific queries to specific replicas
  async query(sql, params) {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      // For real-time: use master (avoid replication lag)
      if (sql.includes('FOR UPDATE')) {
        return this.write(sql, params);
      }
      // For reports: use replica
      return this.read(sql, params);
    }
    return this.write(sql, params);
  }
}
```

### Sharding — Horizontal Partitioning

```
┌──────────────────────────────────────────────────────────────┐
│  SHARDING                                                     │
│                                                               │
│  SHARD KEY: user_id                                           │
│                                                               │
│  Shard 0: user_id % 4 === 0                                │
│  Shard 1: user_id % 4 === 1                                │
│  Shard 2: user_id % 4 === 2                                │
│  Shard 3: user_id % 4 === 3                                │
│                                                               │
│  100,000 users → 25,000 per shard                          │
│  4x storage capacity!                                         │
│                                                               │
│  SHARDING BY:                                                │
│  ├── Hash: user_id % N                                    │
│  ├── Range: A-E, F-J, K-O...                              │
│  └── Directory: lookup table                               │
│                                                               │
│  ⚠️ Shard key = CRITICAL — bad choice = hot shards      │
│  ⚠️ Cross-shard queries = complex and slow              │
└──────────────────────────────────────────────────────────────┘
```

```javascript
// Application-level sharding
class ShardedDatabase {
  constructor(numShards) {
    this.shards = Array.from({ length: numShards }, (_, i) =>
      new Database(`shard-${i}`)
    );
    this.numShards = numShards;
  }

  // Hash-based shard selection
  getShard(userId) {
    const hash = typeof userId === 'string'
      ? hashString(userId)
      : userId;
    return this.shards[hash % this.numShards];
  }

  // Find user across shards
  async findUser(userId) {
    const shard = this.getShard(userId);
    return shard.query('SELECT * FROM users WHERE id = ?', [userId]);
  }

  // Create user
  async createUser(user) {
    const shard = this.getShard(user.id);
    return shard.query('INSERT INTO users...', [user]);
  }

  // ⚠️ Cross-shard query: scan all shards
  async searchUsers(query) {
    const results = await Promise.all(
      this.shards.map(shard => shard.query(
        'SELECT * FROM users WHERE name LIKE ?',
        [`%${query}%`]
      ))
    );
    return results.flat().sort((a, b) => a.id - b.id);
  }
}
```

### Caching layers (Before DB)

```
┌──────────────────────────────────────────────────────────────┐
│  CACHE LAYERS (from fastest to slowest)                      │
│                                                               │
│  1. In-Memory (Redis)                                       │
│     ├── Latency: ~0.1ms                                    │
│     ├── Capacity: GB                                       │
│     └── Use: Hot data, session, rate limiting            │
│                                                               │
│  2. CDN Edge Cache                                           │
│     ├── Latency: ~5-50ms                                   │
│     ├── Capacity: TB                                        │
│     └── Use: Static assets, public APIs                    │
│                                                               │
│  3. Database Cache (Query Cache)                              │
│     ├── Latency: ~1ms                                       │
│     ├── Capacity: MB (RAM)                                  │
│     └── Use: Frequent queries                              │
│                                                               │
│  4. Database (Primary)                                        │
│     ├── Latency: ~5-50ms                                    │
│     └── Use: Source of truth                               │
│                                                               │
│  STRATEGY: Cache-aside (read-through)                      │
│  Read: Cache → DB if miss → Cache → Return                 │
│  Write: DB → Invalidate cache                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Load Balancing

### Algorithms

```
┌──────────────────────────────────────────────────────────────┐
│  LOAD BALANCING ALGORITHMS                                     │
│                                                               │
│  Round Robin                                                   │
│  ├── Requests: 1→Server1, 2→Server2, 3→Server3            │
│  ├── Simple, stateless                                      │
│  └── ⚠️ Doesn't consider server load                        │
│                                                               │
│  Weighted Round Robin                                        │
│  ├── Server1 (weight=3): 3 requests per cycle                │
│  ├── Server2 (weight=2): 2 requests per cycle                │
│  └── Server3 (weight=1): 1 request per cycle                │
│                                                               │
│  Least Connections                                           │
│  ├── Route to server with FEWEST active connections       │
│  └── ✅ Good for varying request durations                   │
│                                                               │
│  IP Hash                                                     │
│  ├── Hash(IP) % N → Server                               │
│  └── User consistently routed to same server                │
│                                                               │
│  Least Response Time                                         │
│  ├── Route to server with LOWEST response time            │
│  └── ✅ Adaptive, considers server health                  │
└──────────────────────────────────────────────────────────────┘
```

### Load balancer implementation

```javascript
// Simple round-robin load balancer
class LoadBalancer {
  constructor(servers) {
    this.servers = servers;
    this.current = 0;
    this.serverStats = new Map();

    // Initialize stats
    servers.forEach(s => this.serverStats.set(s, {
      active: true,
      requests: 0,
      avgResponseTime: 0
    }));
  }

  getServer() {
    // Try to find healthy server
    for (let i = 0; i < this.servers.length; i++) {
      const idx = (this.current + i) % this.servers.length;
      const server = this.servers[idx];
      const stats = this.serverStats.get(server);

      if (stats.active) {
        this.current = (idx + 1) % this.servers.length;
        return server;
      }
    }

    throw new Error('No healthy servers available');
  }

  async routeRequest(req) {
    const server = this.getServer();
    const start = Date.now();

    try {
      const response = await this.sendRequest(server, req);
      this.recordSuccess(server, Date.now() - start);
      return response;
    } catch (err) {
      this.recordFailure(server);
      throw err;
    }
  }

  recordSuccess(server, responseTime) {
    const stats = this.serverStats.get(server);
    stats.requests++;
    // Running average
    stats.avgResponseTime =
      (stats.avgResponseTime * (stats.requests - 1) + responseTime)
      / stats.requests;
  }

  recordFailure(server) {
    const stats = this.serverStats.get(server);
    stats.failures = (stats.failures || 0) + 1;

    // Mark unhealthy after 3 failures
    if (stats.failures >= 3) {
      stats.active = false;
      console.log(`Server ${server} marked unhealthy`);
    }
  }
}
```

---

## 4. Microservices Architecture

### Monolith vs Microservices

```
┌──────────────────────────────────────────────────────────────┐
│  MONOLITH vs MICROSERVICES                                    │
│                                                               │
│  MONOLITH:                                                    │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  API │ Auth │ Users │ Orders │ Products │ Notif  │  │
│  │  └─── All in ONE codebase ─────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│  ├── ✅ Simple to develop/deploy initially              │
│  ├── ❌ Scaling: must scale ENTIRE app                 │
│  ├── ❌ Deployment: one team changes → redeploy all    │
│  └── ❌ Tech stack: one choice for all                │
│                                                               │
│  MICROSERVICES:                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │   Auth   │  │   Users  │  │  Orders  │  │ Products│ │
│  │ Service  │  │ Service  │  │ Service  │  │ Service │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│  ├── ✅ Scale independently (auth × 2, orders × 5)     │
│  ├── ✅ Deploy independently                               │
│  ├── ✅ Different tech stacks for different services     │
│  └── ❌ Complexity: distributed systems, monitoring   │
└──────────────────────────────────────────────────────────────┘
```

### Service communication patterns

```javascript
// 1. Synchronous: HTTP/REST
// User Service → HTTP → Order Service
async function getUserOrders(userId) {
  const user = await db.users.find(userId);
  const orders = await fetch(`http://orders-service/orders?userId=${userId}`);
  return { user, orders };
}

// 2. Asynchronous: Message Queue
// User Service → Event Bus → Order Service
async function registerUser(data) {
  const user = await db.users.create(data);
  await eventBus.publish('user.registered', { user });
  // User service doesn't care who consumes this
  return user;
}

// 3. API Gateway (single entry point)
class APIGateway {
  constructor() {
    this.routes = {
      '/api/users': 'http://user-service',
      '/api/orders': 'http://order-service',
      '/api/products': 'http://product-service'
    };
  }

  async handle(req) {
    const serviceUrl = this.routes[req.path];
    if (!serviceUrl) throw new Error('Route not found');
    return this.proxy(req, serviceUrl);
  }
}
```

### Circuit Breaker Pattern

```javascript
// Circuit Breaker: prevent cascading failures
class CircuitBreaker {
  constructor(fn, options = {}) {
    this.fn = fn;
    this.state = 'CLOSED'; // CLOSED → OPEN → HALF_OPEN
    this.failureThreshold = options.failureThreshold || 5;
    this.timeout = options.timeout || 60000; // 1 minute
    this.failures = 0;
    this.lastFailure = null;
  }

  async execute(...args) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'HALF_OPEN'; // Try again
      } else {
        throw new Error('Circuit breaker OPEN');
      }
    }

    try {
      const result = await this.fn(...args);
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    this.lastFailure = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      console.log('Circuit breaker OPENED');
    }
  }
}

// Usage:
const orderService = new CircuitBreaker(fetchOrderData, {
  failureThreshold: 3,
  timeout: 30000
});

async function getOrders() {
  try {
    return await orderService.execute('/api/orders');
  } catch (err) {
    // Return cached data or fallback
    return getCachedOrders();
  }
}
```

---

## 5. Caching Strategies Tổng Hợp

### Multi-layer caching

```
┌──────────────────────────────────────────────────────────────┐
│  CACHING PYRAMID                                             │
│                                                               │
│  CDN (Edge Cache) ────────────────────────────────────────  │
│  │ Static: JS/CSS/images, public API responses              │
│  │ TTL: hours to days                                       │
│  │                                                           │
│  Application Cache (Redis/Memcached) ──────────────────────  │
│  │ Hot data: user sessions, frequent queries              │
│  │ TTL: minutes to hours                                    │
│  │                                                           │
│  Database Query Cache ────────────────────────────────────  │
│  │ Repeated queries, aggregations                       │
│  │ TTL: seconds to minutes                                 │
│  │                                                           │
│  Database Buffer Pool (InnoDB Buffer Pool, Postgres Cache) ─  │
│  │ Hot pages/rows in memory                              │
│  │                                                           │
│  CPU Cache (L1/L2/L3) ──────────────────────────────────  │
│  │ Most frequently accessed memory                       │
│  └─────────────────────────────────────────────────────────  │
└──────────────────────────────────────────────────────────────┘
```

### Cache patterns

```javascript
// 1. Cache-Aside (Lazy Loading)
// App manages cache
async function getUser(id) {
  const cacheKey = `user:${id}`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Cache miss: fetch from DB
  const user = await db.users.find(id);

  // Store in cache
  await redis.setex(cacheKey, 3600, JSON.stringify(user));

  return user;
}

// 2. Write-Through
// Write to cache AND DB simultaneously
async function updateUser(id, data) {
  // Update DB
  const user = await db.users.update(id, data);

  // Update cache immediately
  await redis.setex(`user:${id}`, 3600, JSON.stringify(user));

  return user;
}

// 3. Write-Behind (Write-Back)
// Write to cache, async flush to DB
async function updateUser(id, data) {
  // Update cache immediately
  await redis.setex(`user:${id}`, 3600, JSON.stringify(data));

  // Queue for async DB write
  await writeQueue.add({
    table: 'users',
    id,
    data
  });

  return data;
}
```

---

## 6. Auto-Scaling

### Metrics-based scaling

```javascript
// Simple auto-scaling controller
class AutoScaler {
  constructor(config) {
    this.minInstances = config.minInstances || 1;
    this.maxInstances = config.maxInstances || 10;
    this.targetCPU = config.targetCPU || 70; // percent
    this.scaleUpThreshold = config.scaleUpThreshold || 80;
    this.scaleDownThreshold = config.scaleDownThreshold || 30;
    this.checkInterval = config.checkInterval || 60000; // 1 minute
  }

  async start() {
    setInterval(() => this.checkAndScale(), this.checkInterval);
  }

  async checkAndScale() {
    const stats = await this.getClusterStats();
    const currentInstances = stats.instances.length;
    const avgCPU = stats.avgCPU;

    // Scale up
    if (avgCPU > this.scaleUpThreshold && currentInstances < this.maxInstances) {
      const newInstance = await this.spawnInstance();
      console.log(`Scaling UP: adding instance ${newInstance.id}`);
      stats.instances.push(newInstance);
    }

    // Scale down
    if (avgCPU < this.scaleDownThreshold && currentInstances > this.minInstances) {
      const toRemove = stats.instances[stats.instances.length - 1];
      await this.terminateInstance(toRemove);
      console.log(`Scaling DOWN: removing instance ${toRemove.id}`);
    }
  }

  async getClusterStats() {
    // Get current instances and metrics from cloud provider
    const instances = await cloud.describeInstances();
    const cpuMetrics = await Promise.all(
      instances.map(i => cloud.getMetric(i.id, 'CPUUtilization'))
    );

    return {
      instances,
      avgCPU: cpuMetrics.reduce((a, b) => a + b) / cpuMetrics.length
    };
  }

  async spawnInstance() {
    // Cloud provider API
    return await cloud.runInstance({
      ami: this.config.ami,
      instanceType: this.config.instanceType
    });
  }

  async terminateInstance(instance) {
    await cloud.terminateInstance(instance.id);
  }
}
```

### Scaling metrics

```
┌──────────────────────────────────────────────────────────────┐
│  SCALING METRICS                                            │
│                                                               │
│  COMMON:                                                      │
│  ├── CPU Utilization (target: 60-80%)                      │
│  ├── Memory Utilization (target: 70-80%)                 │
│  ├── Request count per second                            │
│  ├── Request latency (P99, P95)                        │
│  └── Queue depth (for async workloads)                 │
│                                                               │
│  DATABASE-SPECIFIC:                                          │
│  ├── Connection pool utilization                          │
│  ├── Query latency                                       │
│  ├── Replication lag (for read replicas)                  │
│  └── Disk I/O wait                                       │
│                                                               │
│  ⚠️ Don't scale on single metric                       │
│  ⚠️ Consider latency-based scaling for user-facing services │
│  ⚠️ Use multiple metrics for better decisions          │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. Các Traps Phổ Biến

### Trap 1: Premature scaling

```javascript
// ❌ App có 100 users → design như 1M users
// → Over-engineering = wasted time

// microservices with 12 services + Kafka + Redis + PostgreSQL + MongoDB
// → Dev setup: 2 hours to get running!
// → Complexity: overwhelming

// ✅ Start simple, scale when needed
// MVP: Single Node.js + PostgreSQL
// → 1,000 users: add caching
// → 10,000 users: add read replicas
// → 100,000 users: consider sharding
```

### Trap 2: Shared database bottleneck

```javascript
// ❌ 10 microservices, all connect to SAME database
// → Database becomes bottleneck
// → All services slow when DB slow
// → Can't scale independently

// ✅ Each service owns its data
// User Service → users_db
// Order Service → orders_db
// Product Service → products_db

// ⚠️ Trade-off: now you have distributed transactions problem
// Need event-driven or saga pattern
```

### Trap 3: Caching inconsistent data

```javascript
// ❌ Cache user data in Redis, but DB is source of truth
// If DB updated but cache not invalidated:
async function updateUser(id, data) {
  await db.users.update(id, data); // ✅ DB updated
  // ❌ Cache NOT invalidated → stale data!
}

const staleUser = await redis.get(`user:${id}`); // Stale!

// ✅ Always invalidate cache on write
async function updateUser(id, data) {
  await db.users.update(id, data);
  await redis.del(`user:${id}`); // Invalidate cache
}
```

---

## 8. Câu Hỏi Phỏng Vấn

### Câu 1: Vertical vs Horizontal scaling khi nào?

**Trả lời:** Vertical (scale up) → khi app đơn giản, database-intensive, hoặc team nhỏ. Horizontal (scale out) → khi cần high availability, unpredictable load, hoặc cost-sensitive. Thực tế: dùng cả hai. Vertical cho databases, horizontal cho stateless web servers. Cloud = easy horizontal scaling với auto-scaling groups.

---

### Câu 2: Database replication vs sharding?

| | Replication | Sharding |
|--|-----------|----------|
| Goal | High availability + read scale | Write scale |
| Copies | Multiple copies of data | Partition data across shards |
| Writes | Write to 1, read from many | Write to specific shard |
| Replica lag | Yes (eventual consistency) | N/A |
| Complexity | Lower | Higher |
| Use case | Read-heavy apps | Very large datasets |

---

### Câu 3: CAP theorem?

**Trả lời:** CAP = Consistency, Availability, Partition Tolerance. **Partition tolerance** (network partition xảy ra) → phải chọn **Consistency** hoặc **Availability**. **CP systems**: choose consistency over availability (e.g., MongoDB, Redis). **AP systems**: choose availability over consistency (e.g., Cassandra, DynamoDB). Single-node databases: no partition → all 3 satisfied.

---

### Câu 4: Database connection pool?

**Trả lời:** Database connections = expensive (handshake, auth, memory). Connection pool = pre-established pool of connections. App borrows from pool → uses → returns. Benefits: (1) Reuse connections → faster queries. (2) Limit max connections → protect DB. (3) Avoid connection overhead. Config: pool size = CPU cores × 2 + effective spindle count. Too small = bottleneck, too large = resource waste.

---

### Câu 5: Microservices vs Monolith khi nào?

**Trả lời:** Monolith → team < 10, startup, MVP, simple domain. Microservices → team > 50, enterprise, complex domain, different scaling needs per service. Start monolith, extract services when: (1) Team scaling bottleneck, (2) Different deployment cadences needed, (3) Different tech requirements. **Modular monolith** = good intermediate.

---

## 9. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  SCALING TECHNIQUES                                           │
│                                                               │
│  VERTICAL (Scale Up)                                        │
│  ├── More CPU, RAM, disk on same server                 │
│  ├── Simple, good for databases                           │
│  └── Hardware limits, single point of failure           │
│                                                               │
│  HORIZONTAL (Scale Out)                                     │
│  ├── More servers behind load balancer                 │
│  ├── Stateless design required                             │
│  └── Infinite scalability potential                        │
│                                                               │
│  DATABASE SCALING                                           │
│  ├── Read replicas → read-heavy                          │
│  ├── Sharding → write-heavy + large datasets           │
│  ├── Connection pooling → protect DB                   │
│  └── Cache → reduce DB load                            │
│                                                               │
│  LOAD BALANCING                                             │
│  ├── Round Robin, Least Connections, IP Hash            │
│  ├── Health checks                                        │
│  └── Circuit breaker pattern                            │
│                                                               │
│  CACHING LAYERS                                            │
│  ├── CDN → Static assets, public API                   │
│  ├── Redis → Hot data, sessions                       │
│  ├── DB Cache → Frequent queries                      │
│  └── Cache-Aside, Write-Through, Write-Behind       │
│                                                               │
│  ⚠️ Start simple: monolith + caching + read replicas    │
│  ⚠️ Scale when needed, not prematurely                   │
│  ⚠️ Stateless = key to horizontal scaling              │
│  ⚠️ CAP theorem: consistency vs availability          │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Phân biệt được vertical vs horizontal scaling
- [ ] Thiết kế được stateless application
- [ ] Hiểu database replication và sharding
- [ ] Implement được load balancer với health checks
- [ ] Biết dùng Circuit Breaker pattern
- [ ] Trả lời được 4/5 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
