import React, { useState, useEffect } from 'react';
import { Modal, Table, Tag, Spin, message } from 'antd';
import { Card, Badge } from '../components/ui';
import './DashboardPage.css';

const API_URL = 'http://localhost:5000/api';

/**
 * DashboardPage - Professional Data-Focused Design
 */
const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalStudents: 0,
    todayAttendance: 0,
    upcomingEvents: 0,
  });
  const [modalData, setModalData] = useState({
    visible: false,
    title: '',
    type: '',
    data: [],
    loading: false,
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const eventsRes = await fetch(`${API_URL}/events`);
      const eventsData = await eventsRes.json();
      const events = eventsData.data || [];

      const studentsRes = await fetch(`${API_URL}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const studentsData = await studentsRes.json();
      const students = studentsData.data || [];

      const attendanceRes = await fetch(`${API_URL}/attendances/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const attendanceData = await attendanceRes.json();
      const todayAttendance = attendanceData.data?.length || attendanceData.count || 0;

      const upcomingEvents = events.filter(e => e.status === 'upcoming').length;

      setStats({
        totalEvents: events.length,
        totalStudents: students.length,
        todayAttendance: typeof todayAttendance === 'number' ? todayAttendance : 0,
        upcomingEvents,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      message.error('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (type) => {
    const token = localStorage.getItem('token');
    setModalData({ visible: true, title: '', type, data: [], loading: true });

    try {
      let response, data, title, tableData;

      switch (type) {
        case 'events':
          title = 'Danh sách sự kiện';
          response = await fetch(`${API_URL}/events`);
          data = await response.json();
          tableData = data.data || [];
          break;

        case 'students':
          title = 'Danh sách sinh viên';
          response = await fetch(`${API_URL}/students`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          data = await response.json();
          tableData = data.data || [];
          break;

        case 'todayAttendance':
          title = 'Điểm danh hôm nay';
          response = await fetch(`${API_URL}/attendances/today`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          data = await response.json();
          tableData = data.data || [];
          break;

        case 'upcoming':
          title = 'Sự kiện sắp tới';
          response = await fetch(`${API_URL}/events`);
          data = await response.json();
          tableData = (data.data || []).filter(e => e.status === 'upcoming');
          break;

        default:
          tableData = [];
      }

      setModalData({ visible: true, title, type, data: tableData, loading: false });
    } catch (error) {
      console.error('Error fetching modal data:', error);
      message.error('Không thể tải dữ liệu');
      setModalData(prev => ({ ...prev, loading: false }));
    }
  };

  const getColumns = (type) => {
    switch (type) {
      case 'events':
      case 'upcoming':
        return [
          { title: 'Tên sự kiện', dataIndex: 'title', key: 'title' },
          {
            title: 'Ngày', dataIndex: 'eventDate', key: 'eventDate',
            render: (date) => new Date(date).toLocaleDateString('vi-VN')
          },
          {
            title: 'Thời gian', key: 'time',
            render: (_, record) => `${record.startTime} - ${record.endTime}`
          },
          { title: 'Địa điểm', dataIndex: ['location', 'address'], key: 'address' },
          {
            title: 'Trạng thái', dataIndex: 'status', key: 'status',
            render: (status) => {
              const colorMap = { upcoming: 'blue', ongoing: 'green', completed: 'default', cancelled: 'red' };
              const labelMap = { upcoming: 'Sắp tới', ongoing: 'Đang diễn ra', completed: 'Hoàn thành', cancelled: 'Đã hủy' };
              return <Tag color={colorMap[status]}>{labelMap[status]}</Tag>;
            }
          },
        ];

      case 'students':
        return [
          { title: 'Mã SV', dataIndex: 'studentCode', key: 'studentCode' },
          { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName' },
          { title: 'Email', dataIndex: 'email', key: 'email' },
          { title: 'Lớp', dataIndex: 'class', key: 'class' },
          { title: 'Ngành', dataIndex: 'major', key: 'major' },
        ];

      case 'todayAttendance':
        return [
          { title: 'Mã SV', dataIndex: ['student', 'studentCode'], key: 'studentCode' },
          { title: 'Họ tên', dataIndex: ['student', 'fullName'], key: 'fullName' },
          { title: 'Sự kiện', dataIndex: ['event', 'title'], key: 'eventTitle' },
          {
            title: 'Thời gian', dataIndex: 'checkInTime', key: 'checkInTime',
            render: (time) => new Date(time).toLocaleTimeString('vi-VN')
          },
          {
            title: 'Trạng thái', dataIndex: 'status', key: 'status',
            render: (status) => {
              const colorMap = { present: 'green', late: 'orange', absent: 'red' };
              const labelMap = { present: 'Có mặt', late: 'Đi muộn', absent: 'Vắng' };
              return <Tag color={colorMap[status]}>{labelMap[status]}</Tag>;
            }
          },
        ];

      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading-professional">
        <Spin size="large" />
        <div className="loading-text-professional">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-professional">
      {/* Header */}
      <div className="dashboard-header-professional">
        <div className="header-top">
          <h1 className="dashboard-title-professional">Dashboard</h1>
          <div className="header-meta">
            <span className="meta-label">CẬP NHẬT</span>
            <span className="meta-value">{new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
        <p className="dashboard-subtitle-professional">
          Tổng quan hệ thống điểm danh
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid-professional">
        <Card 
          variant="glass"
          hover
          clickable
          onClick={() => handleCardClick('events')}
        >
          <div className="stat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge variant="default" size="sm">TỔNG</Badge>
              <span className="stat-label-pro">SỰ KIỆN</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="stat-value-pro">{stats.totalEvents}</div>
          <div className="stat-footer">Click để xem chi tiết →</div>
        </Card>

        <Card 
          variant="glass"
          hover
          clickable
          onClick={() => handleCardClick('students')}
        >
          <div className="stat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge variant="info" size="sm">SINH VIÊN</Badge>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="stat-value-pro">{stats.totalStudents}</div>
          <div className="stat-footer">Click để xem chi tiết →</div>
        </Card>

        <Card 
          variant="glass"
          hover
          clickable
          onClick={() => handleCardClick('todayAttendance')}
          className="stat-accent"
        >
          <div className="stat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge variant="success" size="sm">HÔM NAY</Badge>
              <span className="stat-label-pro">ĐIỂM DANH</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="stat-value-pro">{stats.todayAttendance}</div>
          <div className="stat-footer">Click để xem chi tiết →</div>
        </Card>

        <Card 
          variant="glass"
          hover
          clickable
          onClick={() => handleCardClick('upcoming')}
        >
          <div className="stat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge variant="warning" size="sm">SẮP TỚI</Badge>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="stat-value-pro">{stats.upcomingEvents}</div>
          <div className="stat-footer">Click để xem chi tiết →</div>
        </Card>
      </div>

      {/* Modal */}
      <Modal
        title={<div className="modal-title-professional">{modalData.title}</div>}
        open={modalData.visible}
        onCancel={() => setModalData({ ...modalData, visible: false })}
        footer={null}
        width={1000}
        className="professional-modal"
      >
        {modalData.loading ? (
          <div className="modal-loading">
            <Spin size="large" />
            <div className="loading-text-professional">Đang tải dữ liệu...</div>
          </div>
        ) : (
          <Table
            dataSource={modalData.data}
            columns={getColumns(modalData.type)}
            rowKey={(record) => record._id || record.id}
            pagination={{ pageSize: 10 }}
            className="professional-table"
          />
        )}
      </Modal>
    </div>
  );
};

export default DashboardPage;
