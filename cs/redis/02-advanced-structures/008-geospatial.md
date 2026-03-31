# 008 — Geospatial

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🟡 Medium |
| **Chủ đề** | GEOADD, GEODIST, GEORADIUS, GEOPOS, Geospatial, Location-based |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Redis Geospatial là gì?

**Redis Geospatial = Sorted Set ở bên trong, lưu location (latitude, longitude) dưới dạng score.**

```
Redis GEO = Sorted Set (ZSET)
  Key: "stores"
  Member → Score (geohash)

  "store:hanoi:1" → geohash("Hanoi")
  "store:hanoi:2" → geohash("Ho Chi Minh")

→ ZADD = GEOADD
→ ZRADIUS = GEORADIUS
→ ZRANK = không dùng cho geo
```

### 🔍 2. Basic Operations

```bash
# ─── GEOADD ───
# GEOADD key longitude latitude member
GEOADD stores 105.8342 21.0285 "hanoi:1"  # Longitude trước!
GEOADD stores 106.6297 10.8231 "hcm:1"
GEOADD stores 108.2097 16.0544 "danang:1"
GEOADD stores 105.7869 21.0044 "hanoi:2"

# Multiple members
GEOADD bikes:available 105.8342 21.0285 "bike:1" 106.6297 10.8231 "bike:2"

# GEOADD trả về số members thêm mới
GEOADD stores 105.8342 21.0285 "hanoi:3"  # → 1 (thêm mới)

# ─── GEOPOS ───
GEOPOS stores "hanoi:1"
# → 1) 1) "105.83420079946518"
#       2) "21.02850596685221"

GEOPOS stores "hanoi:1" "hanoi:2"
# → 2) (1) ... (2) ...

GEOPOS stores "nonexistent"
# → (nil)

# ─── GEODIST ───
# Khoảng cách giữa 2 members
GEODIST stores "hanoi:1" "hanoi:2" m
# → "8725.8074" (8.7 km trong mét)

GEODIST stores "hanoi:1" "hanoi:2" km
# → "8.7258" (8.7 km)

GEODIST stores "hanoi:1" "danang:1" km
# → "629.1284" (629 km)

# ─── GEOHASH ───
GEOHASH stores "hanoi:1"
# → "ws10ez4d0n0"
# → Geohash string (11 characters)
# → Có thể dùng để visualize trên map
```

### 🔍 3. GEORADIUS — Tìm nearby

```bash
# ─── GEORADIUS ───
# Tìm members trong bán kính
GEORADIUS stores 105.8342 21.0285 20 km
# → ["hanoi:1","hanoi:2","danang:1"] (trong 20km từ HN)

# Với khoảng cách
GEORADIUS stores 105.8342 21.0285 20 km WITHDIST
# → [["hanoi:1","0.0"],["hanoi:2","8.7258"],["danang:1","628.9344"]]

# Với coordinates
GEORADIUS stores 105.8342 21.0285 20 km WITHCOORD
# → [["hanoi:1",["105.8342","21.0285"]], ...]

# Với cả 2
GEORADIUS stores 105.8342 21.0285 20 km WITHDIST WITHCOORD

# ─── COUNT & SORT ───
GEORADIUS stores 105.8342 21.0285 20 km COUNT 5 ASC
# → Top 5 gần nhất (ASC = tăng dần)
GEORADIUS stores 105.8342 21.0285 20 km COUNT 5 DESC
# → Top 5 xa nhất (DESC)

# ─── STORE ─── (lưu vào SET)
GEORADIUS stores 105.8342 21.0285 50 km STORE nearby:hanoi
# → Lưu vào sorted set "nearby:hanoi"

# ─── GEOSEARCH (Redis 6.2+) ───
# Thay thế GEORADIUS
GEOSEARCH stores FROMLONLAT 105.8342 21.0285 BYRADIUS 20 km WITHDIST ASC COUNT 5
```

### 🔍 4. Use Cases

```
┌──────────────────────────────────────────────────────────────┐
│             GEOSPATIAL USE CASES                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. RIDE-SHARING / DELIVERY                                 │
│     GEOADD drivers:online 105.8342 21.0285 "driver:1"      │
│     GEORADIUS drivers:online 105.85 21.03 5 km COUNT 3    │
│     → Tìm 3 drivers gần nhất để assign                    │
│                                                               │
│  2. STORE/FACILITY LOCATOR                                  │
│     GEOADD stores 106.6297 10.8231 "store:hcm"            │
│     GEORADIUS stores 106.65 10.82 10 km STORE nearby:hcm   │
│     → Tìm stores gần user                                 │
│                                                               │
│  3. GEOfENCING                                               │
│     GEODIST user:100:location store:1 m                    │
│     → Nếu < 500m → "user is near store"                  │
│                                                               │
│  4. CHECK-IN TRACKING                                       │
│     GEOADD user:100:checkins * 105.8342 21.0285           │
│     GEORADIUS user:100:checkins 0 0 100m COUNT 1         │
│     → Last location gần điểm nào?                        │
│                                                               │
│  5. RIDE ETA / DISTANCE CALCULATION                        │
│     GEODIST drivers:online driver:1 driver:2 km           │
│     → Estimate thời gian di chuyển                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 Geospatial Limitations

```
⚠️ Redis GEO có giới hạn:
  - Geo coordinates: ±85.05112878 latitude, ±180 longitude
  - Precision: ~1-2 meters (geohash 52 bits)
  - Không support curved Earth calculations (sphere vs ellipsoid)

→ Dùng PostGIS hoặc Google S2 cho precision cao
→ Redis GEO cho 99% use cases đủ tốt
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Nhầm longitude/latitude** | GEOADD key longitude latitude → longitude TRƯỚC! |
| **GEORADIUS trả về mọi results** | Mặc định trả về TẤT CẢ trong radius. Dùng COUNT để giới hạn |
| **Dùng GEORADIUS với WITHDIST trên large dataset** | Tính distance cho nhiều points → chậm. Filter trước |
| **Geo không tự update location** | Khi driver di chuyển → phải GEOADD lại với location mới |

### 🔑 Key Insight

> **GEOADD = ZADD với longitude/latitude. GEORADIUS = tìm points trong bán kính. Geospatial = Sorted Set ở bên trong. Cực nhanh cho real-time location queries.**

---

## ✅ Ví dụ Python

```python
import redis
import time

r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# ─── Store Locator ───
def add_store(store_id, name, longitude, latitude):
    """Thêm store vào geo index"""
    key = "stores:geo"
    r.geoadd(key, (longitude, latitude, store_id))
    # Lưu metadata
    r.hset(f"store:{store_id}", mapping={
        "name": name,
        "lat": latitude,
        "lng": longitude
    })
    print(f"✅ Added store: {name} at ({latitude}, {longitude})")

def find_nearby_stores(lng, lat, radius_km=5, limit=5):
    """Tìm stores gần vị trí"""
    key = "stores:geo"
    results = r.georadius(
        key, lng, lat, radius_km,
        unit='km',
        withdist=True,
        withcoord=True,
        count=limit,
        sort='ASC'  # Gần nhất trước
    )

    stores = []
    print(f"\n📍 Stores within {radius_km}km of ({lat}, {lng}):")
    for item in results:
        store_id = item[0]
        distance = item[1]
        coords = item[2]

        # Lấy metadata
        info = r.hgetall(f"store:{store_id}")
        print(f"  - {info.get('name', store_id)}: {distance:.2f}km")
        stores.append({
            "id": store_id,
            "name": info.get("name"),
            "distance_km": distance,
            "coordinates": coords
        })
    return stores

# ─── Ride-Sharing Driver Matching ───
def register_driver(driver_id, longitude, latitude):
    """Driver come online"""
    r.geoadd("drivers:online", (longitude, latitude, driver_id))
    print(f"✅ Driver {driver_id} online at ({latitude}, {longitude})")

def find_nearest_drivers(lng, lat, count=3, radius_km=5):
    """Tìm drivers gần nhất"""
    drivers = r.georadius(
        "drivers:online", lng, lat, radius_km,
        unit='km',
        withdist=True,
        count=count,
        sort='ASC'
    )

    print(f"\n🚗 Nearest {len(drivers)} drivers:")
    matched = []
    for i, (driver_id, distance, _) in enumerate(drivers, 1):
        print(f"  #{i} {driver_id}: {distance:.2f}km")
        matched.append({"id": driver_id, "distance_km": distance})

    # Assign cho driver gần nhất
    if matched:
        assigned = matched[0]["id"]
        print(f"  → Assigned to: {assigned}")
        return assigned
    return None

def update_driver_location(driver_id, longitude, latitude):
    """Cập nhật location khi driver di chuyển"""
    r.geoadd("drivers:online", (longitude, latitude, driver_id))

def remove_driver(driver_id):
    """Driver go offline"""
    r.zrem("drivers:online", driver_id)
    print(f"✅ Driver {driver_id} offline")

# ─── Distance Between Two Points ───
def get_distance(point1_id, point2_id, unit='km'):
    """Khoảng cách giữa 2 points"""
    distance = r.geodist("stores:geo", point1_id, point2_id, unit=unit)
    return float(distance) if distance else None

# ─── Demo ───
print("=== Add Stores ===")
add_store("store:hanoi:1", "Hanoi Center", 105.8342, 21.0285)
add_store("store:hanoi:2", "Hanoi West", 105.7869, 21.0044)
add_store("store:hanoi:3", "Hanoi North", 105.8667, 21.0350)
add_store("store:danang", "Da Nang", 108.2097, 16.0544)
add_store("store:hcm", "Ho Chi Minh City", 106.6297, 10.8231)

print("\n=== Find Nearby ===")
find_nearby_stores(105.8342, 21.0285, radius_km=10)

print("\n=== Driver Matching ===")
register_driver("driver:1", 105.8342, 21.0285)
register_driver("driver:2", 105.8500, 21.0300)
register_driver("driver:3", 105.7800, 21.0000)
register_driver("driver:4", 108.2000, 16.0500)

# User at 105.84, 21.03 requesting ride
find_nearest_drivers(105.84, 21.03, count=3)

print("\n=== Distance ===")
dist = get_distance("store:hanoi:1", "store:hanoi:2")
print(f"Distance Hanoi Center → Hanoi West: {dist:.2f}km")
```

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: Redis Geospatial
💡 KEY INSIGHT: GEOADD = ZADD với lng/lat. GEORADIUS = spatial query. Sorted Set bên trong = fast.
⚠️ PITFALLS:
  - GEOADD: longitude trước latitude!
  - GEO không auto-update → phải GEOADD lại
  - Precision ~1-2m, không dùng cho survey-grade
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./009-json.md)
