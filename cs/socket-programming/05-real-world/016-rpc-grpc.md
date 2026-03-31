# 016 — RPC & gRPC

## 📌 Thông tin
| | |
|---|---|
| **Độ khó** | 🔴 Hard |
| **Chủ đề** | RPC, gRPC, Protocol Buffers, Streaming, Microservices |
| **Trạng thái** | ⬜ Chưa làm |

---

## 📖 Lý thuyết

### 🔍 1. RPC — Remote Procedure Call

**RPC = Gọi function trên máy khác như gọi local function.**

```
Local Function Call:                    Remote Procedure Call:
┌─────────────────────┐               ┌──────────────┐     ┌──────────────┐
│ Caller function      │               │  Client App  │     │  Server App   │
│                     │               │              │     │              │
│ result = foo(1, 2)  │               │   foo(1,2)   │     │    foo()      │
│                     │               │      │        │     │      │        │
│ ─── CPU ───         │               │      ▼        │ TCP │      ▼        │
│                     │               │  ┌─────────┐ │──────►│  ┌─────────┐ │
│ result = 3           │               │  │ Stub    │ │       │  │ Stub    │ │
│                     │               │  │(marshal)│ │◄──────│  │(unmarshal│
└─────────────────────┘               │  └─────────┘ │       │  └─────────┘ │
                                       └──────────────┘       └──────────────┘

→ Caller không biết đang gọi remote!
→ Gọi foo() → như gọi local function
```

### 🔍 2. RPC vs HTTP/REST

```
┌──────────────────────────────────────────────────────────────┐
│              REST vs RPC                                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  REST (HTTP)                                              │
│  ├── Resource-centric: GET /users/1                        │
│  ├── HTTP methods = CRUD operations                         │
│  ├── Text format: JSON, XML (thường là JSON)             │
│  ├── Self-descriptive: metadata trong headers              │
│  ├── Stateless: mỗi request độc lập                     │
│  └── Browser-friendly: dễ test với curl                  │
│                                                              │
│  RPC                                                       │
│  ├── Action-centric: UserService.GetUser(1)              │
│  ├── Function calls như local: user = get_user(1)        │
│  ├── Binary format: Protocol Buffers, MessagePack         │
│  ├── Tight coupling: client phải biết interface         │
│  ├── Stateful có thể: persistent connections             │
│  └── Performance cao hơn REST                           │
│                                                              │
│  Use REST when:                                            │
│    - Public APIs (thirds-party clients)                   │
│    - Browser-based clients                                 │
│    - CRUD-heavy operations                                │
│    - Cần human-readable (debugging)                        │
│                                                              │
│  Use RPC when:                                             │
│    - Internal microservices                               │
│    - Performance-critical                                  │
│    - Polyglot environments (đa ngôn ngữ)               │
│    - Strongly typed contracts                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 🔍 3. Protocol Buffers — Data Serialization

**Protocol Buffers (Protobuf) = Binary serialization format của Google.**

```protobuf
// user.proto — Định nghĩa service và message
syntax = "proto3";

package user;

// Message = data structure
message User {
  int32 id = 1;           // Field number + type
  string name = 2;
  string email = 3;
  repeated string roles = 4;  // array
  bool is_active = 5;
  created_at = 6;
}

// Enum
enum Status {
  UNKNOWN = 0;    // First enum = default = 0
  ACTIVE = 1;
  INACTIVE = 2;
  DELETED = 3;
}

// Service = RPC methods
service UserService {
  // Unary RPC: client sends 1 request, server replies 1 response
  rpc GetUser(GetUserRequest) returns (User);

  // Server Streaming RPC: server sends stream of responses
  rpc ListUsers(ListUsersRequest) returns (stream User);

  // Client Streaming RPC: client sends stream of requests
  rpc CreateUsers(stream CreateUserRequest) returns (CreateUsersResponse);

  // Bidirectional Streaming RPC
  rpc StreamUsers(stream UserEvent) returns (stream UserEvent);
}

message GetUserRequest {
  int32 user_id = 1;
}

message ListUsersRequest {
  int32 limit = 1;
  string filter = 2;
}

message CreateUserRequest {
  string name = 1;
  string email = 2;
}

message CreateUsersResponse {
  int32 created_count = 1;
  repeated int32 user_ids = 2;
}

message UserEvent {
  string event_type = 1;  // "CREATED", "UPDATED", "DELETED"
  User user = 2;
}
```

### 🔍 4. gRPC — Google's RPC Framework

**gRPC = RPC framework dùng HTTP/2 + Protocol Buffers.**

```
┌─────────────────────────────────────────────────────────────┐
│                 gRPC Architecture                             │
│                                                              │
│  Client App                                                 │
│     │                                                        │
│     │ call: getUser(1)                                      │
│     │                                                        │
│     ▼                                                        │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ gRPC Client (generated from .proto)                 │     │
│  │ - Stub (hides serialization)                        │     │
│  │ - HTTP/2 framing                                    │     │
│  │ - Connection management                               │     │
│  └─────────────────────────────────────────────────────┘     │
│     │                                                        │
│     │ HTTP/2 frames (binary, multiplexed)                 │
│     │                                                        │
│     ▼                                                        │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ HTTP/2 (TCP, multiplexed streams)                     │     │
│  └─────────────────────────────────────────────────────┘     │
│     │                                                        │
│     │ Binary frames                                         │
│     │                                                        │
│     ▼                                                        │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ gRPC Server                                           │     │
│  │ - Unmarshaling                                       │     │
│  │ - Business logic                                      │     │
│  │ - Response                                            │     │
│  └─────────────────────────────────────────────────────┘     │
│     │                                                        │
│     ▼                                                        │
│  Server App                                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### gRPC Python Server

```python
# Generated từ user.proto bằng: pip install grpcio-tools
# Chạy: python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. user.proto

import grpc
from concurrent import futures
import user_pb2
import user_pb2_grpc

class UserServiceServicer(user_pb2_grpc.UserServiceServicer):
    """Implementation của UserService từ proto file"""

    def GetUser(self, request, context):
        """Unary RPC: 1 request → 1 response"""
        # Mock database
        users = {
            1: user_pb2.User(id=1, name="Alice", email="alice@example.com"),
            2: user_pb2.User(id=2, name="Bob", email="bob@example.com"),
            3: user_pb2.User(id=3, name="Charlie", email="charlie@example.com"),
        }

        user = users.get(request.user_id)
        if user:
            return user
        else:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details(f'User {request.user_id} not found')
            return user_pb2.User()

    def ListUsers(self, request, context):
        """Server Streaming: 1 request → stream of responses"""
        all_users = [
            user_pb2.User(id=1, name="Alice", email="alice@example.com"),
            user_pb2.User(id=2, name="Bob", email="bob@example.com"),
            user_pb2.User(id=3, name="Charlie", email="charlie@example.com"),
            user_pb2.User(id=4, name="Diana", email="diana@example.com"),
        ]

        limit = request.limit if request.limit > 0 else len(all_users)
        for user in all_users[:limit]:
            yield user  # Stream response

    def CreateUsers(self, request_iterator, context):
        """Client Streaming: stream of requests → 1 response"""
        created_ids = []
        for req in request_iterator:
            new_id = len(created_ids) + 100  # Mock: tạo ID mới
            created_ids.append(new_id)
            print(f"Creating user: {req.name} ({req.email})")

        return user_pb2.CreateUsersResponse(
            created_count=len(created_ids),
            user_ids=created_ids
        )

    def StreamUsers(self, request_iterator, context):
        """Bidirectional Streaming: stream ↔ stream"""
        for event in request_iterator:
            print(f"Received: {event.event_type} for user {event.user.id}")
            # Echo back
            yield event


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    user_pb2_grpc.add_UserServiceServicer_to_server(
        UserServiceServicer(), server
    )
    server.add_insecure_port('[::]:50051')
    server.start()
    print("🔵 gRPC Server đang chạy trên port 50051...")
    server.wait_for_termination()
```

#### gRPC Python Client

```python
import grpc
import user_pb2
import user_pb2_grpc

def run_grpc_client():
    channel = grpc.insecure_channel('localhost:50051')
    stub = user_pb2_grpc.UserServiceStub(channel)

    # ─── Unary RPC ───
    print("=== Unary RPC: GetUser ===")
    response = stub.GetUser(user_pb2.GetUserRequest(user_id=1))
    print(f"User: {response}")

    # ─── Server Streaming ───
    print("\n=== Server Streaming: ListUsers ===")
    for user in stub.ListUsers(user_pb2.ListUsersRequest(limit=10)):
        print(f"  - {user.name} ({user.email})")

    # ─── Client Streaming ───
    print("\n=== Client Streaming: CreateUsers ===")
    def user_requests():
        for name, email in [("David", "david@x.com"), ("Eve", "eve@x.com")]:
            yield user_pb2.CreateUserRequest(name=name, email=email)
    response = stub.CreateUsers(user_requests())
    print(f"Created {response.created_count} users: {list(response.user_ids)}")

    # ─── Bidirectional Streaming ───
    print("\n=== Bidirectional Streaming: StreamUsers ===")
    def events():
        for i in range(3):
            yield user_pb2.UserEvent(
                event_type=f"TEST_{i}",
                user=user_pb2.User(id=i, name=f"Test_{i}")
            )
    for event in stub.StreamUsers(events()):
        print(f"  Echo: {event.event_type} - {event.user.name}")

    channel.close()


if __name__ == '__main__':
    run_grpc_client()
```

### 🔍 5. Interceptors & Metadata

```python
import grpc
import time

# ─── Server Interceptor — Logging ───
class LoggingInterceptor(grpc.UnaryUnaryServerInterceptor):
    def intercept_service(self, continuation, handler_call_details):
        method_name = handler_call_details.method
        print(f"📥 RPC: {method_name}")
        start = time.time()
        response = continuation(handler_call_details)
        elapsed = time.time() - start
        print(f"📤 RPC: {method_name} ({elapsed*1000:.1f}ms)")
        return response

# ─── Client Interceptor — Auth Token ───
class AuthInterceptor(grpc.UnaryUnaryClientInterceptor):
    def __init__(self, token):
        self.token = token

    def intercept_unary_unary(self, continuation, client_call_details, request):
        # Thêm metadata (headers) vào request
        metadata = [('authorization', f'Bearer {self.token}')]
        new_details = client_call_details._replace(metadata=metadata)
        return continuation(new_details, request)

# ─── Usage ───
server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
server = grpc.server(
    futures.ThreadPoolExecutor(max_workers=10),
    interceptors=[LoggingInterceptor()]
)
```

### 🔍 6. Error Handling trong gRPC

```python
from grpc import StatusCode

class UserServiceServicer(user_pb2_grpc.UserServiceServicer):
    def GetUser(self, request, context):
        user_id = request.user_id

        if user_id < 0:
            # Trả về lỗi
            context.abort(
                grpc.StatusCode.INVALID_ARGUMENT,
                f"Invalid user_id: {user_id}"
            )

        if user_id > 1000:
            # NOT_FOUND error
            context.abort(
                grpc.StatusCode.NOT_FOUND,
                f"User {user_id} not found"
            )

        # Lấy user từ DB
        user = self.db.find(user_id)
        if not user:
            context.abort(
                StatusCode.NOT_FOUND,
                f"User {user_id} not found"
            )

        return user

# Client xử lý lỗi:
try:
    user = stub.GetUser(request)
except grpc.RpcError as e:
    if e.code() == grpc.StatusCode.NOT_FOUND:
        print(f"User not found: {e.details()}")
    elif e.code() == grpc.StatusCode.UNAVAILABLE:
        print("Server unavailable")
    else:
        print(f"RPC error: {e}")
```

### 🔍 7. gRPC vs REST — Performance Comparison

```
Benchmark (1 triệu requests):

┌───────────────┬─────────────┬──────────────┬────────────────┐
│    Metric     │    JSON/REST │   Protobuf   │  Improvement   │
├───────────────┼─────────────┼──────────────┼────────────────┤
│ Payload size  │   518 bytes │  50 bytes   │  10x smaller  │
│ Throughput    │   15 req/s  │   450 req/s │  30x faster   │
│ Latency (p99) │   65ms     │    2.2ms    │  30x faster   │
│ CPU usage      │    100%    │    15%      │  6x less      │
│ Memory        │    High    │    Low      │  Significant  │
└───────────────┴─────────────┴──────────────┴────────────────┘

→ Protobuf binary format nhỏ hơn JSON → ít bandwidth
→ HTTP/2 multiplexing → ít connections
→ Native serialization → ít CPU
→ Strong typing → sớm catch lỗi
```

---

## 🧠 Phân tích & Hướng tư duy

### 🤔 Tại sao gRPC dùng HTTP/2?

```
HTTP/1.1 limitations:
  - Mỗi request/response = 1 TCP connection riêng (phí overhead)
  - HOL blocking: request 2 phải chờ request 1
  - Header lặp lại mỗi request

HTTP/2 advantages:
  - Multiplexing: nhiều streams trong 1 TCP connection
  - Header compression (HPACK)
  - Server push (trước HTTP/3)

→ gRPC chọn HTTP/2 vì nó tối ưu cho RPC:
  - Multiplexing: nhiều RPCs song song
  - Binary framing: nhỏ hơn text
  - Flow control: client/server kiểm soát buffer
```

### ⚠️ Common Pitfalls

| Sai lầm | Giải thích |
|---------|-----------|
| **Breaking changes không rebuild** | Thay đổi field number/name trong proto → không tương thích |
| **Không handle streaming errors** | Stream có thể fail giữa chừng → cần retry logic |
| **gRPC qua load balancer không đúng** | HTTP/2 multiplexing cần connection reuse → cần gRPC-aware LB |
| **Dùng gRPC cho browser** | gRPC không support native trên browser → dùng gRPC-Web |

### 🔑 Key Insight

> **gRPC = HTTP/2 + Protocol Buffers = binary, multiplexed, strongly-typed RPC. Nhanh hơn REST rất nhiều, nhưng chỉ phù hợp cho internal microservices, không phải public APIs.**

---

## 📝 Ghi chú cá nhân

```
Ngày làm:
Thời gian làm:
PATTERN: RPC & gRPC
💡 KEY INSIGHT: RPC = gọi function trên máy khác như local. gRPC = HTTP/2 + Protobuf = fast, binary, strongly typed. Chỉ cho internal services.
⚠️ PITFALLS:
  - Breaking proto changes → không tương thích
  - gRPC không native trên browser → dùng gRPC-Web
  - Cần gRPC-aware load balancer
✅ Đã hiểu: [ ]
```

## ➡️ Bài tiếp theo
[Bài tiếp](./017-performance-tuning.md)
