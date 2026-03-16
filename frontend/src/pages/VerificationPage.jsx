import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Image, Space, Spin, message, Modal } from 'antd';
import { 
  ReloadOutlined, 
  EyeOutlined, 
  CheckOutlined, 
  CloseOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined 
} from '@ant-design/icons';
import socketService from '../services/socketService';
import {
  getPendingVerifications,
  approveAttendance,
  rejectAttendance,
  getVerificationStats,
  getPhotoUrl
} from '../services/verificationService';
import PhotoModal from '../components/PhotoModal';
import './VerificationPage.css';

export default function VerificationPage() {
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    loadPendingList();
    loadStats();

    // Setup Socket.IO for real-time updates
    setupRealtimeUpdates();

    return () => {
      // Cleanup listeners
      if (socketService.socket) {
        socketService.socket.off('new-check-in');
        socketService.socket.off('verification-updated');
      }
    };
  }, []);

  const setupRealtimeUpdates = () => {
    if (!socketService.socket) {
      socketService.connect();
    }

    // Join admin room
    if (socketService.socket) {
      socketService.socket.emit('join', 'admin-room');
      
      // Listen for new check-ins
      socketService.socket.on('new-check-in', (data) => {
        console.log('🔔 New check-in:', data);
        message.info(`📸 ${data.attendance?.student?.fullName} vừa điểm danh!`);
        
        // Add to pending list
        if (data.attendance) {
          setPendingList(prev => [data.attendance, ...prev]);
          setStats(prev => ({ ...prev, pending: prev.pending + 1 }));
        }
        
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Điểm danh mới', {
            body: `${data.attendance?.student?.fullName} cần xác nhận`,
            icon: '/vite.svg'
          });
        }
      });

      // Listen for verification updates from other admins
      socketService.socket.on('verification-updated', (data) => {
        console.log('\ Verification updated:', data);
        setPendingList(prev => prev.filter(a => a._id !== data.attendanceId));
        setStats(prev => ({ ...prev, pending: Math.max(0, prev.pending - 1) }));
      });

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  };

  const loadPendingList = async () => {
    setLoading(true);
    try {
      const response = await getPendingVerifications({ page: 1, limit: 50 });
      const attendances = response.data?.attendances || [];
      setPendingList(attendances);
      console.log(` Loaded ${attendances.length} pending attendances`);
    } catch (error) {
      console.error('Error loading pending list:', error);
      message.error('Lỗi tải danh sách chờ xác nhận');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getVerificationStats();
      setStats(response.data || {});
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleApprove = async (attendance, note = '') => {
    try {
      const response = await approveAttendance(attendance._id, note);
      const studentPoints = response.data?.studentPoints;

      // Remove from list
      setPendingList(prev => prev.filter(a => a._id !== attendance._id));
      setStats(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        approved: prev.approved + 1
      }));

      message.success(
        ` Đã phê duyệt! ${attendance.student.fullName} nhận ${studentPoints?.totalPoints || 0} điểm`
      );

      setShowModal(false);
    } catch (error) {
      console.error('Error approving:', error);
      message.error(error.message || 'Lỗi phê duyệt');
    }
  };

  const handleReject = async (attendance) => {
    Modal.confirm({
      title: 'Từ chối điểm danh',
      content: (
        <div>
          <p>Sinh viên: <strong>{attendance.student.fullName}</strong></p>
          <p>Nhập lý do từ chối:</p>
          <input 
            id="reject-reason"
            type="text"
            placeholder="Ví dụ: Ảnh không rõ ràng"
            style={{ width: '100%', padding: '8px', marginTop: '8px' }}
          />
        </div>
      ),
      onOk: async () => {
        const reason = document.getElementById('reject-reason')?.value;
        if (!reason || reason.trim() === '') {
          message.error('Vui lòng nhập lý do từ chối');
          return Promise.reject();
        }

        try {
          await rejectAttendance(attendance._id, reason);

          setPendingList(prev => prev.filter(a => a._id !== attendance._id));
          setStats(prev => ({
            ...prev,
            pending: Math.max(0, prev.pending - 1),
            rejected: prev.rejected + 1
          }));

          message.success(` Đã từ chối điểm danh của ${attendance.student.fullName}`);
          setShowModal(false);
        } catch (error) {
          console.error('Error rejecting:', error);
          message.error(error.message || 'Lỗi từ chối');
          return Promise.reject();
        }
      }
    });
  };

  const openPhotoModal = (attendance) => {
    setSelectedAttendance(attendance);
    setShowModal(true);
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Sinh viên',
      key: 'student',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.student?.studentCode}</div>
          <div>{record.student?.fullName}</div>
          <div style={{ color: '#888', fontSize: '12px' }}>{record.student?.class}</div>
        </div>
      ),
    },
    {
      title: 'Sự kiện',
      key: 'event',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.event?.title}</div>
        </div>
      ),
    },
    {
      title: 'Hình ảnh',
      key: 'photo',
      width: 120,
      render: (_, record) => (
        record.evidencePhoto ? (
          <Image
            src={getPhotoUrl(record.evidencePhoto)}
            alt="Evidence"
            width={80}
            height={80}
            style={{ objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
            preview={false}
            onClick={() => openPhotoModal(record)}
            fallback="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><text x='50%' y='50%' text-anchor='middle' dy='.3em' font-size='30'>📷</text></svg>"
          />
        ) : (
          <span style={{ color: '#888' }}>Không có ảnh</span>
        )
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      width: 150,
      render: (_, record) => {
        const isLate = record.checkInTime && record.event?.dateTime &&
          new Date(record.checkInTime) > new Date(record.event.dateTime);
        
        return (
          <div>
            <div>
              {new Date(record.checkInTime).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            {isLate && (
              <Tag color="error" icon={<ClockCircleOutlined />}>
                Muộn
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: 'GPS',
      key: 'gps',
      width: 120,
      render: (_, record) => {
        const distance = record.distance || 0;
        const radius = record.event?.checkInRadius || 100;
        const isGood = distance <= radius / 2;
        
        return (
          <div>
            <div>{distance.toFixed(1)}m</div>
            <Tag 
              color={isGood ? 'success' : 'warning'} 
              icon={<EnvironmentOutlined />}
            >
              {isGood ? 'Chính xác' : 'Xa'}
            </Tag>
          </div>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openPhotoModal(record)}
          >
            Xem
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record)}
          >
            Duyệt
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => handleReject(record)}
          >
            Từ chối
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="verification-page">
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>Xác nhận điểm danh</span>
            {stats.pending > 0 && (
              <Tag color="warning" style={{ marginLeft: '8px' }}>
                {stats.pending} chờ xác nhận
              </Tag>
            )}
          </div>
        }
        extra={
          <Space>
            <Tag color="success"> {stats.approved} đã duyệt</Tag>
            <Tag color="error"> {stats.rejected} từ chối</Tag>
            <Button 
              icon={<ReloadOutlined />}
              onClick={loadPendingList}
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
        ) : pendingList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
            <h3>Không có điểm danh nào chờ xác nhận</h3>
            <p style={{ color: '#888' }}>Tất cả điểm danh đã được xử lý</p>
          </div>
        ) : (
          <Table
            dataSource={pendingList}
            columns={columns}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} điểm danh`,
            }}
          />
        )}
      </Card>

      {/* Photo Modal */}
      {showModal && selectedAttendance && (
        <PhotoModal
          attendance={selectedAttendance}
          onClose={() => setShowModal(false)}
          onApprove={(note) => handleApprove(selectedAttendance, note)}
          onReject={() => handleReject(selectedAttendance)}
          onNext={() => {
            const currentIndex = pendingList.findIndex(a => a._id === selectedAttendance._id);
            if (currentIndex < pendingList.length - 1) {
              setSelectedAttendance(pendingList[currentIndex + 1]);
            }
          }}
          onPrev={() => {
            const currentIndex = pendingList.findIndex(a => a._id === selectedAttendance._id);
            if (currentIndex > 0) {
              setSelectedAttendance(pendingList[currentIndex - 1]);
            }
          }}
          hasNext={pendingList.findIndex(a => a._id === selectedAttendance._id) < pendingList.length - 1}
          hasPrev={pendingList.findIndex(a => a._id === selectedAttendance._id) > 0}
        />
      )}
    </div>
  );
}
