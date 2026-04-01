# 📚 Study Dashboard

> Hệ thống quản lý tiến độ học tập cá nhân — theo dõi tất cả tracks kiến thức trong một nơi.

---

## 🗂️ Cấu trúc thư mục

```
learn-leetcode/
│
├── dashboard/
│   ├── index.html     ← Giao diện dashboard
│   ├── styles.css    ← Toàn bộ CSS (dark/light theme)
│   ├── app.js        ← Logic + cấu hình TRACKS
│   └── start.bat     ← Script mở dashboard nhanh
│
├── cs/                ← Computer Science
│   ├── neetcode-75/  ← ✅ Hoàn thành
│   ├── design-patterns/ ← 🚧 Đang xây dựng
│   ├── database/      ← 🚧 Đang xây dựng
│   └── typescript/    ← 🚧 Đang xây dựng
│
└── languages/        ← Ngôn ngữ tự nhiên
    └── english/       ← 🚧 Đang xây dựng
```

**Quy tắc đặt tên domain:**
| Domain | Thư mục | Ý nghĩa |
|--------|---------|----------|
| `cs`   | `cs/`   | Computer Science (code, algorithm, database...) |
| `lang` | `languages/` | Ngôn ngữ tự nhiên (English, Vietnamese...) |

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

### Bước 1 — Tạo cấu trúc thư mục

```
cs/<track-id>/
├── README.md                    ← Tổng quan track (bắt buộc)
└── 01-<chapter-slug>/
    ├── README.md                ← Lý thuyết chương (bắt buộc)
    ├── 001-<slug>.md            ← Bài 1
    ├── 002-<slug>.md            ← Bài 2
    └── ...
```

- **`track-id`**: viết thường, dùng gạch ngang, VD: `system-design`
- **`chapter-slug`**: viết thường, dùng gạch ngang, số 2 chữ số đứng trước, VD: `01-fundamentals`
- **`problem-slug`**: viết thường, dùng gạch ngang, số 3 chữ số đứng trước, VD: `001-load-balancing`

### Bước 2 — Khai báo trong `dashboard/app.js`

```javascript
// Tìm mảng TRACKS trong app.js, thêm object mới:
{
  id: 'system-design',           // unique, trùng với track-id
  name: 'System Design',        // tên hiển thị
  icon: '🏗️',                    // emoji đại diện
  domain: 'cs',                 // 'cs' hoặc 'lang'
  path: 'cs/system-design',     // đường dẫn từ root repo
  readme: 'README.md',          // file tổng quan
  chapters: [
    {
      name: 'Fundamentals',     // tên chương (có thể thêm emoji)
      path: 'cs/system-design/01-fundamentals',
      readme: 'README.md',
      problems: [
        {
          name: 'Load Balancing',  // tên bài
          file: '001-load-balancing.md',
          difficulty: 'Medium'      // 'Easy' | 'Medium' | 'Hard'
        },
        // ... thêm bài
      ]
    }
  ]
}
```

### Bước 3 — Tạo nội dung

#### 3a. `track/README.md` — Tổng quan track

```markdown
# System Design

Tổng quan về System Design — thiết kế hệ thống từ scale nhỏ đến lớn.

## Các chương

1. [Fundamentals](./01-fundamentals/) — ...
2. [Distributed Systems](./02-distributed-systems/) — ...
```

#### 3b. `track/chapter/README.md` — Lý thuyết chương

```markdown
# 01 — Fundamentals

## Khái niệm cơ bản

### Load Balancing

**Load Balancer** là gì? ...

## Ví dụ thực tế

- Nginx
- AWS ALB
```

#### 3c. `track/chapter/001-slug.md` — Bài tập

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

**Q: Muốn thêm track nhưng không có bài tập?**
A: Vẫn khai báo bình thường, `problems: []`. Dashboard vẫn hiển thị track và cho xem README.

**Q: File .md có thể nằm ngoài chapter không?**
A: Có — dashboard đọc mọi file `.md` trong chapter folder. Miễn `file` trong TRACKS config trỏ đúng, đều xem được.

---

*Last updated: 2026-03-31*
