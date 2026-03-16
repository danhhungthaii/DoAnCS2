import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import CreateEventPage from './pages/CreateEventPage';
import StudentsPage from './pages/StudentsPage';
import QRDisplayPage from './pages/QRDisplayPage';
import VerificationPage from './pages/VerificationPage';
import RegistrationListPage from './pages/RegistrationListPage';

/**
 * App Component - Router chính
 */
function App() {
  return (
    <ConfigProvider locale={viVN}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="events/create" element={<CreateEventPage />} />
              <Route path="events/:eventId/registrations" element={<RegistrationListPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="verification" element={<VerificationPage />} />
              <Route path="qr-display/:eventId" element={<QRDisplayPage />} />
              <Route path="checkin/:id" element={<QRDisplayPage />} />
            </Route>

            {/* Legacy routes redirect to new admin paths */}
            <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/events" element={<Navigate to="/admin/events" replace />} />
            <Route path="/students" element={<Navigate to="/admin/students" replace />} />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
