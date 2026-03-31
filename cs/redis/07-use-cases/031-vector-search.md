# 031 — Vector Search

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🔴 Hard |
| **Chủ đề** | Vector Search, AI Embeddings, Similarity, Redis Stack |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. Vector Search là gì?

**Vector Search = tìm items tương tự dựa trên vector embeddings. Dùng trong AI/ML.**

```
┌──────────────────────────────────────────────────────────────┐
│                 VECTOR SEARCH                                            │
│                                                               │
│  Embedding = vector representation của data                    │
│  Similar items = similar vectors (close in vector space) │
│                                                               │
│  Use cases:                                                 │
│  ├── Semantic search ("car" → "automobile")              │
│  ├── Image similarity (similar products)                 │
│  ├── Recommendation systems                               │
│  ├── RAG (Retrieval-Augmented Generation)               │
│  └── Fraud detection                                     │
│                                                               │
│  Redis Stack VSS (Vector Similarity Search):              │
│  FT.CREATE idx ON HASH SCHEMA v VECTOR ...              │
│  FT.SEARCH idx "*=>[KNN 10 @v $vec]" PARAMS 2 v $vec   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 2. Redis VSS Setup

```bash
# Tạo index với vector field
FT.CREATE products_index ON HASH SCHEMA \
  name TEXT \
  description TEXT \
  embedding VECTOR FLAT 10 DIM 1536 DISTANCE_METRIC COSINE TYPE FLOAT32
```

### 🔍 3. Vector Operations

```python
import numpy as np

def add_with_embedding(product_id, name, description, embed_fn):
    """Thêm product với embedding"""
    embedding = embed_fn(name + " " + description)
    vector_bytes = np.array(embedding, dtype=np.float32).tobytes()

    r.hset(f"product:{product_id}", mapping={
        "name": name,
        "description": description,
        "embedding": vector_bytes
    })

def search_similar(query, embed_fn, top_k=5):
    """Tìm products tương tự"""
    query_vec = embed_fn(query)
    query_bytes = np.array(query_vec, dtype=np.float32).tobytes()

    results = r.execute_command(
        "FT.SEARCH", "products_index",
        "*=>[KNN 5 @embedding $vec AS score]",
        "PARAMS", "2", "vec", query_bytes,
        "SORTBY", "score", "ASC"
    )
    return results
```

---

## 🧠 Phân tích & Hướng tư tư

### ⚠️ Common Pitfalls

| Pitfall | Explanation |
|---------|-----------|
| **Embedding dimension không match** | Must match during index creation |
| **Dimension quá lớn** | Memory cost increases quadratically |
| **Flat index vs HNSW** | Flat = exact but slow. HNSW = approximate but fast |

### 🔑 Key Insight

> **Vector Search = semantic similarity. Redis VSS = in-database similarity search. KNN = find nearest neighbors.**

---

## 📝 Ghi chú cá nhân

```
PATTERN: Vector Search
💡 KEY INSIGHT: Vector search = semantic similarity. Redis VSS. KNN.
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./032-redis-stack.md)
