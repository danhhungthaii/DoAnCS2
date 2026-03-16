import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Tag, Space, Spin, message, Modal, Descriptions } from 'antd';
import { 
  ReloadOutlined, 
  DownloadOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import api from '../services/api';
import './RegistrationListPage.css';

export default function RegistrationListPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ registered: 0, cancelled: 0, attended: 0, total: 0 });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadEventInfo();
    loadRegistrations();
    loadStats();
  }, [eventId]);

  const loadEventInfo = async () => {
    try {
      const response = await api.get(`/events/${eventId}`);
      setEvent(response.data);
    } catch (error) {
      console.error('Error loading event:', error);
      message.error('Lỗi tải thông tin sự kiện');
    }
  };

  const loadRegistrations = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/registrations/event/${eventId}`);
      setRegistrations(response.data?.registrations || []);
    } catch (error) {
      console.error('Error loading registrations:', error);
      message.error('Lỗi tải danh sách đăng ký');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get(`/registrations/event/${eventId}/stats`);
      setStats(response.data || {});
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      const response = await axios.get(
        `${baseUrl}/registrations/event/${eventId}/export`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DanhSachDangKy_${event?.title}_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('✅ Xuất file Excel thành công');
    } catch (error) {
      console.error('Error exporting:', error);
      message.error('Lỗi xuất file Excel');
    } finally {
      setExporting(false);
    }
  };

  const getStatusInfo = (status) => {
    switch(status) {
      case 'registered':
        return { color: 'blue', icon: <ClockCircleOutlined />, text: 'Chưa điểm danh' };
      case 'attended':
        return { color: 'success', icon: <CheckCircleOutlined />, text: 'Đã điểm danh' };
      case 'cancelled':
        return { color: 'default', icon: <CloseCircleOutlined />, text: 'Đã hủy' };
      default:
        return { color: 'default', icon: null, text: status };
    }
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Mã sinh viên',
      key: 'studentCode',
      width: 120,
      render: (_, record) => (
        <span style={{ fontWeight: 600 }}>{record.student?.studentCode}</span>
      ),
    },
    {
      title: 'Họ và tên',
      key: 'fullName',
      render: (_, record) => record.student?.fullName,
    },
    {
      title: 'Lớp',
      key: 'class',
      width: 100,
      render: (_, record) => record.student?.class,
    },
    {
      title: 'Email',
      key: 'email',
      render: (_, record) => record.student?.email,
    },
    {
      title: 'Ngày đăng ký',
      key: 'registeredAt',
      width: 150,
      render: (_, record) => 
        new Date(record.registeredAt).toLocaleString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 150,
      render: (_, record) => {
        const statusInfo = getStatusInfo(record.status);
        return (
          <Tag color={statusInfo.color} icon={statusInfo.icon}>
            {statusInfo.text}
          </Tag>
        );
      },
    },
  ];

  return (
    <div className="registration-list-page">
      {/* Event Info Card */}
      {event && (
        <Card 
          className="event-info-card"
          style={{ marginBottom: '20px' }}
        >
          <Descriptions title={`📋 ${event.title}`} column={3}>
            <Descriptions.Item label="Ngày diễn ra">
              {new Date(event.eventDate).toLocaleDateString('vi-VN')}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ">
              {event.startTime} - {event.endTime}
            </Descriptions.Item>
            <Descriptions.Item label="Địa điểm">
              {event.location?.address}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* Registration List Card */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UserOutlined />
            <span>Danh sách đăng ký</span>
            <Tag color="blue">{stats.registered} chưa điểm danh</Tag>
            <Tag color="success">{stats.attended} đã điểm danh</Tag>
            {stats.cancelled > 0 && (
              <Tag color="default">{stats.cancelled} đã hủy</Tag>
            )}
          </div>
        }
        extra={
          <Space>
            <Button 
              icon={<DownloadOutlined />}
              onClick={handleExportExcel}
              loading={exporting}
              type="primary"
            >
              Xuất Excel
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={loadRegistrations}
              loading={loading}
            >
              Làm mới
            </Button>
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Đang tải...</div>
          </div>
        ) : registrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <UserOutlined style={{ fontSize: '48px', color: '#888', marginBottom: '16px' }} />
            <h3>Chưa có sinh viên đăng ký</h3>
            <p style={{ color: '#888' }}>Danh sách đăng ký sẽ hiển thị ở đây</p>
          </div>
        ) : (
          <Table
            dataSource={registrations}
            columns={columns}
            rowKey="_id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} sinh viên`,
            }}
          />
        )}
      </Card>
    </div>
  );
}
