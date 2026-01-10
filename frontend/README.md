# Frontend Admin Dashboard

## Tech Stack
- **ReactJS** (Vite)
- **React Router DOM** - Routing
- **Ant Design** - UI Components
- **TailwindCSS** - Styling
- **Axios** - HTTP Client
- **Socket.IO Client** - Real-time communication
- **QRCode.react** - QR Code generation
- **React-Leaflet** - Map integration

## Cấu trúc Thư mục

```
src/
├── components/       # Reusable components
│   └── ProtectedRoute.jsx
├── context/          # React Context (Auth, ...)
│   └── AuthContext.jsx
├── layouts/          # Layout components
│   └── AdminLayout.jsx
├── pages/            # Page components
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   ├── EventsPage.jsx (Coming soon)
│   ├── StudentsPage.jsx (Coming soon)
│   └── QRDisplayPage.jsx (Coming soon)
├── services/         # API services
│   ├── api.js
│   ├── authService.js
│   ├── eventService.js
│   ├── studentService.js
│   └── socketService.js
├── utils/            # Helper functions
├── App.jsx           # Main App component
└── main.jsx          # Entry point
```

## Cài đặt

```bash
cd frontend
npm install
```

## Cấu hình

1. Copy `.env.example` thành `.env`
2. Cập nhật API URL

## Chạy Development

```bash
npm run dev
```

App chạy tại: http://localhost:5173
