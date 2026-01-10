import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spin } from 'antd';

/**
 * ProtectedRoute - Component bảo vệ các route cần đăng nhập
 * @param {ReactNode} children - Component con
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Hiển thị loading khi đang kiểm tra auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  // Nếu chưa đăng nhập, redirect về trang login
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Đã đăng nhập, render children
  return children;
};

export default ProtectedRoute;
