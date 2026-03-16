import React from 'react';
import { Layout, Menu, ConfigProvider, theme } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  CalendarOutlined,
  UserOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import darkGlass from '../theme/darkGlass';
import FloatingChatbox from '../components/FloatingChatbox';

const { Header, Sider, Content } = Layout;

/**
 * AdminLayout - Dark Glassmorphism Theme
 */
const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/admin/events',
      icon: <CalendarOutlined />,
      label: 'Quản lý Sự kiện',
    },
    {
      key: '/admin/students',
      icon: <UserOutlined />,
      label: 'Quản lý Sinh viên',
    },
    {
      key: '/admin/verification',
      icon: <CheckCircleOutlined />,
      label: 'Xác nhận điểm danh',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const styles = {
    layout: {
      minHeight: '100vh',
      background: darkGlass.background,
    },
    sider: {
      background: darkGlass.backgroundLight,
      borderRight: `1px solid ${darkGlass.border}`,
    },
    logo: {
      padding: '20px 16px',
      textAlign: 'center',
      borderBottom: `1px solid ${darkGlass.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      cursor: 'pointer',
    },
    logoMark: {
      width: '28px',
      height: '28px',
      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 800,
      fontSize: '0.75rem',
      color: '#fff',
    },
    logoText: {
      background: 'linear-gradient(135deg, #60a5fa, #06b6d4)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontSize: '16px',
      fontWeight: 'bold',
      margin: 0,
    },
    header: {
      background: darkGlass.backgroundLight,
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: `1px solid ${darkGlass.border}`,
      height: '56px',
      lineHeight: '56px',
    },
    headerTitle: {
      color: darkGlass.text,
      fontSize: '15px',
      fontWeight: '600',
      margin: 0,
      cursor: 'pointer',
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    userName: {
      color: darkGlass.textMuted,
      fontSize: '13px',
    },
    userNameStrong: {
      color: darkGlass.accentLight,
    },
    logoutBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 14px',
      background: 'transparent',
      border: `1px solid rgba(239,68,68,0.25)`,
      color: darkGlass.error,
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '13px',
      fontFamily: "'Inter', sans-serif",
    },
    content: {
      margin: '20px',
      padding: '24px',
      background: darkGlass.backgroundLight,
      borderRadius: '16px',
      border: `1px solid ${darkGlass.border}`,
    },
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          ...darkGlass.antd.token,
        },
        components: {
          ...darkGlass.antd.components,
        },
      }}
    >
      <Layout style={styles.layout}>
        <Sider
          breakpoint="lg"
          collapsedWidth="0"
          style={styles.sider}
        >
          <div style={styles.logo} onClick={() => navigate('/')}>
            <img src="/logo.svg" alt="Logo" style={{width:'32px',height:'32px',borderRadius:'50%',flexShrink:0}} />
            <h1 style={styles.logoText}>QL Sinh viên &amp; Điểm danh</h1>
          </div>

          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ marginTop: '12px', background: 'transparent', borderRight: 'none' }}
          />
        </Sider>

        <Layout>
          <Header style={styles.header}>
            <h2 style={styles.headerTitle} onClick={() => navigate('/')}>
              Hệ thống Điểm danh QR Code & GPS
            </h2>

            <div style={styles.userInfo}>
              <span style={styles.userName}>
                Xin chào, <strong style={styles.userNameStrong}>{user?.fullName || user?.username}</strong>
              </span>
              <button
                onClick={handleLogout}
                style={styles.logoutBtn}
              >
                <LogoutOutlined />
                Đăng xuất
              </button>
            </div>
          </Header>

          <Content style={styles.content}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
      <FloatingChatbox />
    </ConfigProvider>
  );
};

export default AdminLayout;
