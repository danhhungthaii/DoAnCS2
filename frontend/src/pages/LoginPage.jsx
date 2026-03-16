import React, { useState } from 'react';
import { Form, Input, message } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';
import './LoginPage.css';

/**
 * LoginPage - Dark Glassmorphism Design
 * Professional, clean, high-tech login form
 */
const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await login({ username: values.username, password: values.password });
      message.success('Login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      message.error(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-dark">
      {/* Ambient glows */}
      <div className="login-glow login-glow-1" />
      <div className="login-glow login-glow-2" />

      {/* Grid pattern */}
      <div className="login-grid-pattern" />

      <div className="login-container">
        {/* Left — Branding */}
        <div className="login-brand-side">
          <div className="login-brand-content">
            <Link to="/" className="login-logo">
              <img src="/logo.svg" alt="Logo" className="login-logo-img" style={{width:'42px',height:'42px',borderRadius:'50%'}} />
              <span className="login-logo-name">Quản lý Sinh viên &amp; Điểm danh</span>
            </Link>

            <div className="login-brand-hero">
              <h1>
                Chào mừng đến với<br />
                <span className="gradient-text">Quản lý Sinh viên &amp; Điểm danh</span>
              </h1>
              <p>
                Đăng nhập để quản lý điểm danh, xem thống kê theo thời gian thực và tạo mã QR cho các sự kiện.
              </p>
            </div>

            <div className="login-brand-stats">
              <div className="login-stat">
                <span className="login-stat-val">1,200+</span>
                <span className="login-stat-label">Organizations</span>
              </div>
              <div className="login-stat-div" />
              <div className="login-stat">
                <span className="login-stat-val">50K+</span>
                <span className="login-stat-label">Daily Check-ins</span>
              </div>
              <div className="login-stat-div" />
              <div className="login-stat">
                <span className="login-stat-val">99.8%</span>
                <span className="login-stat-label">Uptime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Form */}
        <div className="login-form-side">
          <div className="login-form-card glass-card">
            <div className="login-form-header">
              <h2>Sign in</h2>
              <p>Enter your credentials to continue</p>
            </div>

            <Form
              name="login"
              onFinish={onFinish}
              layout="vertical"
              size="large"
              className="login-form"
            >
              <Form.Item
                name="username"
                label={<span className="login-label">Username</span>}
                rules={[{ required: true, message: 'Please enter your username' }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: 'var(--text-tertiary)' }} />}
                  placeholder="Enter username"
                  className="login-input"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<span className="login-label">Password</span>}
                rules={[{ required: true, message: 'Please enter your password' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: 'var(--text-tertiary)' }} />}
                  placeholder="Enter password"
                  className="login-input"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  loading={loading}
                  fullWidth
                  className="login-submit-btn"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </Form.Item>
            </Form>
            {/* Back link */}
            <div className="login-back">
              <Link to="/" className="login-back-link">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
