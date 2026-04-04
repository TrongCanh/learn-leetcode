# 📚 Study Dashboard

> Hệ thống quản lý tiến độ học tập cá nhân — theo dõi tất cả tracks kiến thức trong một nơi.

---

## 🗂️ Cấu trúc thư mục

```
learn-leetcode/
│
├── dashboard/
│   ├── index.html     ← Giao diện dashboard (tự động load từ metadata)
│   ├── styles.css    ← Toàn bộ CSS (dark/light theme)
│   ├── app.js        ← Logic — đọc metadata files tự động
│   └── start.bat     ← Script mở dashboard nhanh
│
├── cs/                ← Computer Science
│   ├── manifest.json  ← Danh sách tracks
│   ├── neetcode-75/
│   │   ├── track.json    ← Metadata: name, icon, domain
│   │   └── 01-arrays-hashing/
│   │       └── chapter.json  ← Metadata: problems list
│   └── javascript/
│
├── languages/        ← Ngôn ngữ tự nhiên
│   └── english/
│
└── visualizations/ ← Trực quan hóa thuật toán
    └── (tự tạo theo quy tắc bên dưới)
```

**Quy tắc đặt tên domain:**
| Domain | Thư mục | Ý nghĩa |
|--------|---------|----------|
| `cs`   | `cs/`   | Computer Science (code, algorithm, database...) |
| `lang` | `languages/` | Ngôn ngữ tự nhiên (English, Vietnamese...) |
| `viz`  | `visualizations/` | Trực quan hóa thuật toán (HTML pages) |

---

## 🚀 Mở Dashboard

```bash
# Windows
start.bat

# macOS
open dashboard/index.html

# Linux
xdg-open dashboard/index.html

# Hoặc double-click dashboard/index.html
```

---

## 📊 Tiến độ hiện tại

| Track | Trạng thái |
|-------|------------|
| 🧠 NeetCode 75 | ✅ Hoàn thành (75/75 bài) |
| 🏗️ Design Patterns | 🚧 Đang xây dựng (0/12 patterns) |
| 🟨 JavaScript Deep Dive | 🚧 Đang xây dựng (0/70 topics) |
| 🗄️ Database | 🚧 Đang xây dựng |
| 🟦 TypeScript | 🚧 Đang xây dựng |
| 🔴 Redis | 🚧 Đang xây dựng (15/32 topics) |
| 🔌 Socket Programming | 🚧 Đang xây dựng (0/17 topics) |
| 🇬🇧 English | 🚧 Đang xây dựng |

---

## 📖 Hướng dẫn thêm Track mới

> Dashboard tự động đọc cấu trúc folder và metadata files. Không cần sửa `app.js`.

### Bước 1 — Cập nhật domain manifest

Thêm track-id vào manifest của domain tương ứng:

```
cs/manifest.json        → thêm "system-design" vào mảng tracks
languages/manifest.json → thêm "vietnamese" vào mảng tracks
visualizations/manifest.json → thêm "sorting" vào mảng tracks
```

```json
// cs/manifest.json
{
  "tracks": [
    "neetcode-75",
    "system-design",   ← thêm dòng này
    ...
  ]
}
```

### Bước 2 — Tạo cấu trúc thư mục

```
cs/<track-id>/
├── track.json                 ← Metadata track (bắt buộc)
├── manifest.json              ← Danh sách chapters (bắt buộc)
├── README.md                  ← Tổng quan track
└── 01-<chapter-slug>/
    ├── chapter.json           ← Metadata chapter + problems (bắt buộc)
    ├── README.md               ← Lý thuyết chương
    ├── 001-<slug>.md         ← Bài 1
    └── 002-<slug>.md         ← Bài 2
```

Quy tắc đặt tên:
- **`track-id`**: viết thường, gạch ngang. VD: `system-design`
- **`chapter-slug`**: số 2 chữ số + gạch ngang. VD: `01-fundamentals`
- **`problem-slug`**: số 3 chữ số + gạch ngang. VD: `001-load-balancing`

### Bước 3 — Tạo metadata files

#### 3a. `track.json` — metadata track

```json
{
  "name": "System Design",
  "icon": "🏗️",
  "domain": "cs"
}
```

- `name`: tên hiển thị trên dashboard
- `icon`: emoji đại diện
- `domain`: `cs` | `lang` | `viz`

#### 3b. `manifest.json` — danh sách chapters

```json
{
  "chapters": [
    "README",
    "01-fundamentals",
    "02-scaling"
  ]
}
```

Quy tắc entries trong `chapters`:

| Entry | Ý nghĩa | Metadata file | `ch.path` |
|-------|---------|---------------|-----------|
| `"README"` | Tổng quan track (folder gốc) | `README.json` | `cs/track-id/` |
| `"01-fundamentals"` | Chapter folder | `chapter.json` | `cs/track-id/01-fundamentals/` |
| `"intro.md"` | Markdown file riêng | `intro/README.json` | `cs/track-id/` |

> `"README"` là trường hợp đặc biệt — không có subfolder, metadata nằm trong `README.json` tại folder gốc track.

**Lưu ý đường dẫn file cho visualization:**
- Viz files nằm ở repo root: `visualizations/sorting/01-sorting/algo.html`
- Trong `chapter.json`, `file` phải có prefix `../`:
  ```json
  "file": "../visualizations/sorting/01-sorting/algo.html"
  ```
- Viz hiển thị trong modal với width tối đa **1400px**

#### 3c. `chapter.json` — metadata chapter + problems

```json
{
  "name": "01 — Fundamentals",
  "problems": [
    {
      "name": "Load Balancing",
      "file": "001-load-balancing.md",
      "difficulty": "Medium"
    },
    {
      "name": "Caching",
      "file": "002-caching.md",
      "difficulty": "Medium"
    }
  ]
}
```

- `name`: tên chương (có thể thêm emoji)
- `problems`: mảng bài tập
  - `name`: tên bài
  - `file`: tên file (từ thư mục chapter)
  - `difficulty`: `Easy` | `Medium` | `Hard`
  - `type`: `md` (default) hoặc `viz` (mở trong tab mới)

Với chapter `README` (folder gốc track), dùng `README.json` thay vì `chapter.json`:

```json
{
  "name": "📖 Overview",
  "problems": []
}
```

### Bước 4 — Tạo nội dung markdown

#### 4a. `track/README.md` — Tổng quan track

```markdown
# System Design

Tổng quan về System Design — thiết kế hệ thống từ scale nhỏ đến lớn.

## Các chương

1. [Fundamentals](./01-fundamentals/) — ...
2. [Distributed Systems](./02-distributed-systems/) — ...
```

#### 4b. `track/chapter/README.md` — Lý thuyết chương

```markdown
# 01 — Fundamentals

## Khái niệm cơ bản

### Load Balancing

**Load Balancer** là gì? ...

## Ví dụ thực tế

- Nginx
- AWS ALB
```

#### 4c. `track/chapter/001-slug.md` — Bài tập

```markdown
# Load Balancing

## Problem

Mô tả bài toán ...

## Solution

```python
def solution():
    pass
```

## Complexity

- **Time:** O(n)
- **Space:** O(1)
```

---

## 🧩 Cấu trúc file problem

Tất cả file `.md` trong chapter đều được dashboard đọc và hiển thị trong modal preview. Cấu trúc khuyến nghị cho mỗi bài:

```markdown
# <Tên bài>

## Problem
Mô tả ngắn gọn bài toán.

## Solution
Code giải.

## Complexity
- **Time:** O(...)
- **Space:** O(...)

## Notes
Ghi chú thêm (tips, trap, edge cases...).
```

Dashboard hỗ trợ đầy đủ Markdown: code block (highlight tự động), table, blockquote, list.

---

## ⚙️ Cách dashboard đọc nội dung

```
Dashboard chạy trên trình duyệt (file://)
  ↓ fetch('../cs/neetcode-75/01-arrays-hashing/001-contains-duplicate.md')
  ↓
File .md được fetch trực tiếp từ disk
  ↓ marked.parse() + hljs
  ↓
Hiển thị trong modal
```

> **Lưu ý:** Dashboard dùng `fetch()` để đọc file. Nếu mở qua `file://` (double-click), trình duyệt có thể chặn CORS. Nên dùng `start.bat` hoặc mở qua local server (VD: `npx serve`).

---

## 🎨 Dashboard Features

- **Sidebar navigation** — Danh sách tracks ở sidebar, progress tổng
- **Track grid** — Grid cards với hover effect
- **Chapter sections** — Mỗi chương expand được, có nút "📖 Xem lý thuyết chương"
- **Progress tracking** — Check bài đã làm, lưu vào localStorage
- **Modal preview** — Mọi file .md xem ngay trong modal (prev/next)
- **Dark / Light mode** — Toggle bằng nút 🌙/☀️ trên sidebar
- **Responsive** — Tốt trên desktop, tablet, mobile

---

## 🌿 Git Workflow

```bash
# 1. Tạo branch cho feature mới
git checkout -b feat/database-fundamentals

# 2. Làm việc — thêm file, nội dung

# 3. Commit theo conventional commits
git add .
git commit -m "feat(cs/database): add fundamentals chapter 1-3"

# 4. Push
git push -u origin feat/database-fundamentals

# 5. Tạo Pull Request (nếu cần review)
```

**Commit message format:**

| Type | Dùng khi |
|------|----------|
| `feat` | Thêm track, chapter, bài mới |
| `fix`  | Sửa lỗi nội dung, code |
| `refactor` | Thay đổi cấu trúc, dashboard config |
| `docs` | Cập nhật README, nội dung markdown |
| `style` | Chỉ thay đổi CSS, giao diện |

---

## ❓ FAQ

**Q: Dashboard không hiển thị nội dung?**
A: Thử mở qua `start.bat` hoặc local server. Trình duyệt chặn `fetch()` từ `file://` khi không có server.

**Q: Làm sao để đổi màu theme?**
A: Sửa CSS variables trong `dashboard/styles.css` phần `:root` (dark) và `[data-theme="light"]`.

**Q: Thêm track mới không hiện trên dashboard?**
A: Kiểm tra: ① `domain/manifest.json` có track-id chưa, ② `track-id/track.json` có tồn tại không, ③ `track-id/manifest.json` có khai báo chapters đúng không.

**Q: File .md có thể nằm ngoài chapter không?**
A: Không — mỗi bài phải nằm trong folder chapter và được khai báo trong `chapter.json`.

---

*Last updated: 2026-04-01*

---

## 🏗️ Playbook: Cách Xây Dựng Một Chủ Đề Kỹ Thuật Sâu Sắc

> Bộ quy tắc này được rút ra từ quá trình viết 59 bài viết cho JavaScript Deep Dive. Áp dụng cho bất kỳ chủ đề kỹ thuật nào muốn cover đủ sâu, đủ rộng, phục vụ học để đi phỏng vấn.

---

### 1. Nguyên Tắc Nền Tảng

```
MỖI BÀI VIẾT PHẢI ĐẠT 4 MỤC TIÊU:

① HIỂU — giải thích BẢN CHẤT, không phải định nghĩa
② ÁP DỤNG — code ví dụ thực tế, chạy được
③ SAI LẦM — biết trap ở đâu, tại sao
④ PHỎNG VẤN — trả lời được câu hỏi thực tế
```

---

### 2. Cấu Trúc Mỗi Bài Viết

```
TEMPLATE 12 PHẦN (bắt buộc theo thứ tự):

─────────────────────────────────────────────────────
PHẦN 1: Câu hỏi mở đầu
─────────────────────────────────────────────────────
Một câu hỏi thực tế HOẶC một đoạn code có vấn đề
→ Đặt ngay vấn đề, không lý thuyết suông
→ Tạo curiosity, cho thấy TẠI SAO cần biết topic này

Ví dụ:
  // Tại sao code này nhanh rồi đột nhiên chậm?
  function add(a, b) { return a + b; }
  add(1, 2);
  add('hello', 2); // type changed!

─────────────────────────────────────────────────────
PHẦN 2: Định nghĩa & Bản chất
─────────────────────────────────────────────────────
→ Định nghĩa chính xác, ngắn gọn
→ MINH HOẠ = ASCII diagram HOẶC memory layout
→ Giải thích TẠI SAO nó hoạt động như vậy
→ KHÔNG chỉ WHAT mà phải WHY

─────────────────────────────────────────────────────
PHẦN 3–7: Nội dung chính (3–6 sections)
─────────────────────────────────────────────────────
Mỗi section:
  ├── Giải thích concept
  ├── Code ví dụ (comment từng dòng)
  ├── Minh hoạ trực quan
  └── Edge cases / biến thể

Mật độ code: 40% code, 60% giải thích

─────────────────────────────────────────────────────
PHẦN 8: Các Traps Phổ Biến
─────────────────────────────────────────────────────
5 traps cụ thể:
  ├── Mã lỗi (❌) + giải thích TẠI SAO sai
  └── Code đúng (✅) + giải thích

─────────────────────────────────────────────────────
PHẦN 9: Câu Hỏi Phỏng Vấn
─────────────────────────────────────────────────────
6 câu hỏi + câu trả lời đầy đủ:
  ├── Câu hỏi thường gặp
  ├── Giải thích ngắn (2–3 sentences)
  └── Code minh hoạ nếu cần

─────────────────────────────────────────────────────
PHẦN 10: Tổng Hợp
─────────────────────────────────────────────────────
ASCII diagram tổng hợp TOÀN BỘ bài viết
→ Visual summary để ôn tập nhanh

─────────────────────────────────────────────────────
PHẦN 11: Checklist
─────────────────────────────────────────────────────
5–8 checkbox thực tế:
  ├── Code được: implement được...
  ├── Hiểu được: giải thích được...
  └── Trả lời được: câu hỏi phỏng vấn...

─────────────────────────────────────────────────────
PHẦN 12: Last updated
─────────────────────────────────────────────────────
*Last updated: YYYY-MM-DD*
```

---

### 3. Quy Tắc Viết

#### ✅ NÊN LÀM

```
① TỰ HỎI: "Học viên đọc xong sẽ THỰC SỰ hiểu hay chỉ biết định nghĩa?"
   → Viết để học viên có thể implement từ đầu

② MỌI concept đều có:
   ├── Định nghĩa bằng lời
   ├── Code ví dụ chạy được
   ├── Minh hoạ trực quan (ASCII diagram)
   └── Use case thực tế

③ PHẢI có section TRAPS — trap là phần giá trị nhất
   → Sai lầm phổ biến + giải thích tại sao

④ PHẢI có câu hỏi phỏng vấn — thực tế từ interview thật

⑤ Số dòng mục tiêu: 400–1000+ dòng
   (không phải kêu dài, mà vì đủ sâu)
```

#### ❌ KHÔNG NÊN

```
① Viết lý thuyết suông, không có code
② Liệt kê tính năng không giải thích bản chất
③ Chỉ copy documentation, không có insight cá nhân
④ Viết quá ngắn (< 200 dòng) → chủ đề chưa đủ sâu
⑤ Dùng generic examples ("foo", "bar", "a", "b")
   → Thay bằng ví dụ có ý nghĩa thực tế
```

---

### 4. Bảng Độ Dài Tối Thiểu

```
┌──────────────────────────┬────────────────────┬──────────────┐
│ Loại chủ đề             │ Ví dụ              │ Dòng tối thiểu │
├──────────────────────────┼────────────────────┼──────────────┤
│ Nền tảng (fundamentals) │ scope, closure      │ 500+ lines  │
│ Async/Concurrency        │ event loop, workers │ 600+ lines  │
│ Memory/Performance        │ GC, V8, profiling  │ 500+ lines  │
│ System/Runtime           │ Node.js, browser    │ 400+ lines  │
│ Patterns/Architecture    │ design patterns     │ 500+ lines  │
│ Algorithms/Data          │ tree, graph        │ 400+ lines  │
└──────────────────────────┴────────────────────┴──────────────┘

Nếu viết xong mà chưa đủ 300 dòng → CÂN NHẮC lại:
  → Còn thiếu phần nào?
  → Traps có đủ 5 cái chưa?
  → Câu hỏi phỏng vấn đủ 6 cái chưa?
  → Code examples có đủ thực tế chưa?
```

---

### 5. Checklist Trước Khi Hoàn Thành Một Bài

```
TRƯỚC KHI COMMIT, KIỂM TRA:

  □ Metadata files: track.json, manifest.json, README.json/chapter.json đầy đủ?
  □ domain/manifest.json: đã thêm track-id?
  □ track/manifest.json: đã thêm chapter-id?
  □ Câu hỏi mở đầu: thú vị, thực tế, tạo curiosity?
  □ Định nghĩa: rõ ràng, bản chất, không wikipedia?
  □ Code examples: chạy được, có comment, có minh hoạ?
  □ ASCII diagrams: đủ trực quan, dễ hiểu?
  □ Sections: đủ 3-6 sections, mỗi section có code + giải thích?
  □ Traps: ít nhất 5 traps, có ❌ + ✅ code?
  □ Câu hỏi phỏng vấn: ít nhất 5-6 câu, có câu trả lời đầy đủ?
  □ Tổng hợp: diagram tổng hợp toàn bài?
  □ Checklist: 5-8 checkbox thực tế?
  □ Độ dài: đạt mốc tối thiểu theo loại chủ đề?
  □ Đọc lại: có đoạn nào viết theo kiểu "lý thuyết suông"?
  □ File name: đúng convention (001-xxx.md)?
  □ Dashboard: refresh và kiểm tra track/chapter/problem hiển thị đúng?
```

---

### 6. Quy Tắc Đặt Tên File

```
NAMING CONVENTION:

├── 001-xxx.md   ← số 3 chữ số + tên mô tả
├── 002-yyy.md
└── 003-zzz.md

Tên file: dùng tiếng Anh, kebab-case
  ① Đặt theo keyword chính của topic
  ② Không đặt generic (topic.md, concept.md)
  ③ Gợi nhớ nội dung: 003-event-loop.md

VÍ DỤ TỐT:
  001-thread-vs-process.md   ← rõ ràng
  003-memory-profiling.md  ← rõ ràng
  005-v8-internals.md       ← rõ ràng

VÍ DỤ XẤU:
  001-concurrency.md         ← quá chung
  notes.md                  ← không mô tả
  draft.md                  ← không chuyên nghiệp
```

---

### 7. Quy Tắc Metadata Files

```
HỆ THỐNG TỰ ĐỘNG — KHÔNG CẦN SỬA app.js

Dashboard tự động đọc:
  domain/manifest.json
    → thêm track-id vào mảng "tracks"
  domain/track-id/track.json
    → metadata: name, icon, domain
  domain/track-id/manifest.json
    → thêm chapter-id vào mảng "chapters"
  domain/track-id/chapter-id/chapter.json
    → metadata chapter + danh sách problems
  domain/track-id/README.json
    → metadata cho README (entry "README" trong manifest)

Thêm track mới:
  ① Tạo folder cs/<track-id>/
  ② Thêm <track-id> vào cs/manifest.json
  ③ Tạo track.json + manifest.json
  ④ Tạo README.json cho entry "README"

Thêm chapter mới:
  ① Tạo folder cs/<track-id>/<chapter-id>/
  ② Thêm <chapter-id> vào cs/<track-id>/manifest.json
  ③ Tạo chapter.json

Thêm bài mới:
  ① Tạo file .md trong chapter folder
  ② Thêm entry vào chapter.json

Thêm visualization:
  ① Tạo file .html trong visualizations/<track-id>/<chapter-id>/
  ② Thêm entry vào chapter.json với "type": "viz"
  ③ Thêm <track-id> vào visualizations/manifest.json
  ⚠️ Đường dẫn file phải có prefix `../`:
     "file": "../visualizations/sorting/01-sorting/algo.html"
```

---

### 8. Khi Nào Cần Viết Lại (Rewrite)

```
DẤU HIỆU CẦN REWRITE:

  ○ File < 200 dòng → đủ ngắn, có thể expand
  ○ File 200–350 dòng nhưng thiếu:
      - Traps section
      - Interview Q&A
      - Code examples đầy đủ
  ○ File 350+ dòng nhưng chủ đề tự nhiên hẹp
    (không phải thiếu content, mà topic nhỏ)

KHÔNG CẦN REWRITE:

  ○ File 350+ dòng, đã đầy đủ 12 phần
  ○ Chủ đề tự nhiên nhỏ (ví dụ: TCP vs UDP)
    → không nên cố viết dài thêm
```

---

### 9. Checklist Tổng Thể Track Mới

```
KHI XÂY DỰNG MỘT TRACK MỚI (ví dụ: Database, System Design):

  □ Outline: 8–12 chapters, chia theo level (Easy→Hard)
  □ Mỗi chapter: README.md với overview + learning path
  □ Priority: viết fundamentals trước, advanced sau
  □ Metadata: tạo track.json, manifest.json, chapter.json cho mỗi chapter
  □ README: update track overview + relationship diagram
  □ Preview: mở dashboard, kiểm tra track hiển thị đúng trước khi commit

  THỨ TỰ ƯU TIÊN:
  1. cs/manifest.json — thêm track-id
  2. Tạo folder track
  3. Tạo track.json + manifest.json
  4. Tạo README.json (metadata cho entry "README" trong manifest)
  5. Tạo chapter folder + chapter.json
  6. Viết nội dung markdown
  7. Test dashboard (hard refresh Ctrl+Shift+R)
  8. Commit
```

---

### 10. Mẫu Commit Message

```
feat(<track>): <mô tả ngắn> — <số bài> articles across <số chapters> chapters

Body:
- List chapters đã thêm
- Mỗi chapter ghi số bài và tên bài chính
- Ghi rõ những bài viết lại (rewrite) vs bài mới hoàn toàn

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

---

*Last updated: 2026-04-01*
