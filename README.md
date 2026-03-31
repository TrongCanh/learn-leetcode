# 📚 Study Dashboard

> Hệ thống quản lý tiến độ học tập cá nhân — theo dõi tất cả tracks kiến thức trong một nơi.

---

## 🗂️ Cấu trúc

```
learn-leetcode/
│
├── dashboard/
│   └── index.html          ← Dashboard chính (mở bằng trình duyệt)
│
├── cs/                      ← Computer Science
│   ├── neetcode-75/       ← 75 bài LeetCode (✅ Hoàn thành)
│   ├── database/           ← Database (🚧 Đang xây dựng)
│   └── typescript/          ← TypeScript (🚧 Đang xây dựng)
│
└── languages/              ← Ngôn ngữ tự nhiên
    └── english/             ← English (🚧 Đang xây dựng)
```

---

## 🚀 Bắt đầu

```bash
# Mở dashboard bằng trình duyệt
open dashboard/index.html
# Hoặc double-click dashboard/index.html trong file explorer
```

---

## 📊 Tiến độ hiện tại

| Track | Trạng thái |
|-------|------------|
| 🧠 NeetCode 75 | ✅ Hoàn thành (75/75 bài) |
| 🗄️ Database | 🚧 Đang xây dựng |
| 🟦 TypeScript | 🚧 Đang xây dựng |
| 🇬🇧 English | 🚧 Đang xây dựng |

---

## ➕ Thêm track mới

Thêm track vào dashboard bằng cách tạo folder và khai báo trong `dashboard/index.html` → mảng `TRACKS`.

```javascript
// Trong dashboard/index.html, thêm vào mảng TRACKS:
{
  id: 'system-design',
  name: 'System Design',
  icon: '🏗️',
  domain: 'cs',
  path: 'cs/system-design',
  readme: 'README.md',
  chapters: [
    {
      name: 'Fundamentals',
      path: 'cs/system-design/01-fundamentals',
      readme: 'README.md',
      problems: [
        { name: 'Load Balancing', file: '001-load-balancing.md', difficulty: 'Medium' },
      ]
    }
  ]
}
```

---

## 🎨 Dashboard features

- **Multi-track**: Tất cả tracks hiển thị trên một trang
- **Filter theo domain**: 💻 CS · 🌐 Ngôn ngữ · Tất cả
- **Progress tracking**: Tự động lưu tiến độ vào localStorage
- **Quick preview**: Click bài tập → xem nội dung ngay trong modal
- **Responsive**: Đẹp trên mobile lẫn desktop

---

*Last updated: 2026-03-31*
