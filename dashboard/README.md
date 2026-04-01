# NeetCode 75 - Dashboard

## 🎯 Giới thiệu

Dashboard web để xem và theo dõi tiến độ học NeetCode 75.

## 🚀 Cách chạy

### Cách 1: Dùng start.bat (Windows)
```bash
cd dashboard
start.bat
```

### Cách 2: Python Server
```bash
# Terminal 1: Chạy server
python -m http.server 3000

# Terminal 2: Ngrok
ngrok http 3000
```

### Cách 3: Node.js (nếu có)
```bash
npx serve .
```

## 🌐 Public Access qua ngrok

1. Cài ngrok: https://ngrok.com/download
2. Chạy dashboard
3. Chạy `ngrok http 3000`
4. Copy URL (ví dụ: `https://abc123.ngrok.io`)
5. Share URL cho thiết bị khác

## 📱 Responsive

- Desktop: Grid 2-3 cột
- Tablet: Grid 1-2 cột  
- Mobile: 1 cột, full width

## 💾 Data Storage

- Progress lưu trong **localStorage** của trình duyệt
- Mỗi thiết bị có progress riêng
- (Để sync, cần backend server)

## ✨ Features

- [x] Dashboard tiến độ
- [x] Preview bài .md
- [x] Đánh dấu hoàn thành
- [x] Dark/Light mode
- [x] Mobile responsive
- [x] Navigation giữa các bài

## 📊 Các Tracks

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
