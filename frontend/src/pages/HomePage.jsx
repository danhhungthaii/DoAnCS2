import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Badge } from '../components/ui';
import './HomePage.css';

const APP_NAME = 'Quản lý Sinh viên & Điểm danh';
const APP_NAME_SHORT = 'Quản lý Sinh viên';

/**
 * HomePage - Modern Professional Dark Design
 * Consistent with dashboard and login pages
 */
const HomePage = () => {
  return (
    <div className="homepage-dark">
      {/* Header */}
      <header className="homepage-header">
        <div className="container">
          <div className="header-content">
            <Link to="/" className="logo">
              <img src="/logo.svg" alt="Logo" style={{width:'36px',height:'36px',borderRadius:'50%'}} />
              <span className="logo-text">{APP_NAME_SHORT}</span>
            </Link>
            
            <nav className="nav-links hide-mobile">
              <a href="#features" className="nav-link">Tính năng</a>
              <a href="#benefits" className="nav-link">Lợi ích</a>
              <a href="#contact" className="nav-link">Liên hệ</a>
            </nav>
            
            <div className="header-actions">
              <Link to="/login">
                <Button variant="outline" size="md">
                  Đăng nhập
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Modern & Professional */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-grid-pattern"></div>
        </div>
        
        <div className="container">
          <div className="hero-content">
            <Badge variant="info" size="md">
              Hệ thống quản lý trường học thông minh
            </Badge>

            <h1 className="hero-title">
              Quản lý Sinh viên
              <span className="gradient-text"> & Điểm danh QR</span>
            </h1>

            <p className="hero-description">
              Nền tảng quản lý sinh viên và điểm danh sự kiện tích hợp mã QR, GPS, AI — 
              giúp nhà trường tiết kiệm thời gian và nâng cao tính minh bạch.
            </p>

            <div className="hero-actions">
              <Link to="/login">
                <Button variant="primary" size="lg">
                  Đăng nhập quản trị
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </Button>
              </Link>
              <a href="#features">
                <Button variant="secondary" size="lg">Khám phá tính năng</Button>
              </a>
            </div>

            {/* Stats */}
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-value">320+</div>
                <div className="stat-label">Sinh viên</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-value">15+</div>
                <div className="stat-label">Sự kiện</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-value">98.5%</div>
                <div className="stat-label">Chính xác GPS</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Professional Cards */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <Badge variant="info">Tính năng</Badge>
            <h2 className="section-title">
              Đầy đủ công cụ quản lý sinh viên
            </h2>
            <p className="section-description">
              Tích hợp QR code, GPS, realtime Socket.IO và AI — mọi thứ trong một nền tảng
            </p>
          </div>

          <div className="features-grid">
            <Card variant="glass" hover className="feature-card">
              <div className="feature-icon feature-icon--blue">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <path d="M14 14h2v2h-2zM18 14h3M14 18v3M18 18h3v3h-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Điểm danh bằng QR</h3>
              <p className="feature-description">
                Sinh viên quét mã QR sự kiện qua ứng dụng Android, check-in hoàn thành trong vài giây.
              </p>
              <div className="feature-badges">
                <Badge variant="success" size="sm">Nhanh</Badge>
                <Badge variant="info" size="sm">QR Code</Badge>
              </div>
            </Card>

            <Card variant="glass" hover className="feature-card">
              <div className="feature-icon feature-icon--green">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="feature-title">Xác thực GPS</h3>
              <p className="feature-description">
                Tự động xác minh vị trí check-in qua công thức Haversine — ngăn chặn gian lận từ xa.
              </p>
              <div className="feature-badges">
                <Badge variant="success" size="sm">Chống gian lận</Badge>
                <Badge variant="info" size="sm">GPS</Badge>
              </div>
            </Card>

            <Card variant="glass" hover className="feature-card">
              <div className="feature-icon feature-icon--purple">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Trợ lý AI</h3>
              <p className="feature-description">
                Chatbot AI (Groq Llama 3.1) trả lời câu hỏi về sự kiện, thống kê điểm danh theo thời gian thực.
              </p>
              <div className="feature-badges">
                <Badge variant="warning" size="sm">AI</Badge>
                <Badge variant="info" size="sm">Groq</Badge>
              </div>
            </Card>

            <Card variant="glass" hover className="feature-card">
              <div className="feature-icon feature-icon--orange">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M3 10H21M8 2V6M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Quản lý Sự kiện</h3>
              <p className="feature-description">
                Tạo sự kiện, upload banner, cài đặt vị trí GPS, giới hạn đăng ký và theo dõi realtime.
              </p>
              <div className="feature-badges">
                <Badge variant="success" size="sm">Realtime</Badge>
                <Badge variant="info" size="sm">Socket.IO</Badge>
              </div>
            </Card>

            <Card variant="glass" hover className="feature-card">
              <div className="feature-icon feature-icon--red">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Phát hiện bất thường</h3>
              <p className="feature-description">
                Hệ thống tự động phát hiện 6 loại hành vi đáng ngờ: GPS teleport, shared device, check-in quá sớm...
              </p>
              <div className="feature-badges">
                <Badge variant="error" size="sm">Anti-cheat</Badge>
                <Badge variant="warning" size="sm">Risk Score</Badge>
              </div>
            </Card>

            <Card variant="glass" hover className="feature-card">
              <div className="feature-icon feature-icon--teal">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Quản lý Sinh viên</h3>
              <p className="feature-description">
                Import hàng loạt từ Excel, tìm kiếm, chỉnh sửa, tích điểm thi đua và hệ thống soft-delete.
              </p>
              <div className="feature-badges">
                <Badge variant="success" size="sm">Excel</Badge>
                <Badge variant="info" size="sm">Điểm thi đua</Badge>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="benefits-section">
        <div className="container">
          <div className="section-header">
            <Badge variant="success">Lợi ích</Badge>
            <h2 className="section-title">
              Tại sao chọn hệ thống này?
            </h2>
          </div>

          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-number">01</div>
              <h3 className="benefit-title">Tiết kiệm thời gian</h3>
              <p className="benefit-description">
                Điểm danh toàn bộ lớp học chỉ trong vài giây thay vì gọi tên thủ công
              </p>
            </div>
            <div className="benefit-item">
              <div className="benefit-number">02</div>
              <h3 className="benefit-title">Chống gian lận</h3>
              <p className="benefit-description">
                6 lớp kiểm tra: QR, trạng thái sự kiện, GPS geofence, thiết bị và phân tích bất thường
              </p>
            </div>
            <div className="benefit-item">
              <div className="benefit-number">03</div>
              <h3 className="benefit-title">Giao diện hiện đại</h3>
              <p className="benefit-description">
                Web admin dark mode chuyên nghiệp, app Android tối ưu cho sinh viên
              </p>
            </div>
            <div className="benefit-item">
              <div className="benefit-number">04</div>
              <h3 className="benefit-title">Tích hợp AI</h3>
              <p className="benefit-description">
                Trợ lý AI trả lời câu hỏi thống kê, hỗ trợ quản trị viên và sinh viên 24/7
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Professional */}
      <section id="contact" className="cta-section">
        <div className="container">
          <Card variant="elevated" className="cta-card">
            <div className="cta-content">
              <h2 className="cta-title">
                Sẵn sàng bắt đầu quản lý?
              </h2>
              <p className="cta-description">
                Đăng nhập vào bảng điều khiển quản trị để quản lý sinh viên, sự kiện và xem thống kê điểm danh realtime
              </p>
              <div className="cta-actions">
                <Link to="/login">
                  <Button variant="primary" size="lg">
                    Đăng nhập ngay
                  </Button>
                </Link>
                <a href="#features">
                  <Button variant="secondary" size="lg">
                    Xem tính năng
                  </Button>
                </a>
              </div>
              <p className="cta-note">
                Hệ thống quản lý dành cho trường đại học • Hỗ trợ Mobile &amp; Web
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer - Professional */}
      <footer className="homepage-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <img src="/logo.svg" alt="Logo" style={{width:'28px',height:'28px',borderRadius:'50%'}} />
                <span>{APP_NAME_SHORT}</span>
              </div>
              <p className="footer-tagline">
                Hệ thống quản lý sinh viên &amp; điểm danh QR cho giáo dục hiện đại
              </p>
            </div>

            <div className="footer-links">
              <div className="footer-column">
                <h4 className="footer-heading">Sản phẩm</h4>
                <a href="#features" className="footer-link">Tính năng</a>
                <a href="#benefits" className="footer-link">Lợi ích</a>
                <Link to="/login" className="footer-link">Đăng nhập</Link>
              </div>

              <div className="footer-column">
                <h4 className="footer-heading">Công ty</h4>
                <a href="#" className="footer-link">Về chúng tôi</a>
                <a href="#" className="footer-link">Blog</a>
                <a href="#" className="footer-link">Tuyển dụng</a>
              </div>

              <div className="footer-column">
                <h4 className="footer-heading">Hỗ trợ</h4>
                <a href="#contact" className="footer-link">Liên hệ</a>
                <a href="#" className="footer-link">Trợ giúp</a>
                <a href="#" className="footer-link">FAQ</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">
              © 2026 {APP_NAME}. Made in Vietnam
            </p>
            <div className="footer-social">
              <a href="#" className="social-link" aria-label="Facebook">FB</a>
              <a href="#" className="social-link" aria-label="Twitter">TW</a>
              <a href="#" className="social-link" aria-label="LinkedIn">LI</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
