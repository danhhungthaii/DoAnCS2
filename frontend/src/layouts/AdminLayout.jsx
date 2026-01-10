import React from 'react';
import { Layout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  CalendarOutlined,
  UserOutlined,
  QrcodeOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/events',
      icon: <CalendarOutlined />,
      label: 'Quản lý Sự kiện',
    },
    {
      key: '/students',
      icon: <UserOutlined />,
      label: 'Quản lý Sinh viên',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout className="min-h-screen">
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        className="bg-white shadow-md"
      >
        <div className="p-4 text-center font-bold text-xl border-b">
          📋 Điểm danh QR
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="mt-4"
        />
      </Sider>

      <Layout>
        <Header className="bg-white shadow-sm px-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold m-0">
            Hệ thống Điểm danh QR Code & GPS
          </h2>
          
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Xin chào, <strong>{user?.fullName || user?.username}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded"
            >
              <LogoutOutlined />
              Đăng xuất
            </button>
          </div>
        </Header>

        <Content className="m-6 p-6 bg-white rounded-lg shadow-sm">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
