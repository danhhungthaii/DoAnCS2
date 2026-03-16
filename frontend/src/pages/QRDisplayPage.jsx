import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Table, Button, message, Spin, Tag, Statistic, Upload } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import { ReloadOutlined, CheckCircleOutlined, PictureOutlined, UploadOutlined } from '@ant-design/icons';
import { eventService } from '../services/eventService';
import socketService from '../services/socketService';
import dayjs from 'dayjs';

const QRDisplayPage = () => {
  const { eventId, id } = useParams(); // Hỗ trợ cả :eventId và :id
  const currentEventId = eventId || id;
  const [event, setEvent] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(() => {
    fetchEventData();
    setupSocket();

    return () => {
      if (currentEventId) {
        socketService.leaveEvent(currentEventId);
      }
    };
  }, [currentEventId]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const [eventRes, attendanceRes] = await Promise.all([
        eventService.getEventById(currentEventId),
        eventService.getEventAttendances(currentEventId),
      ]);

      console.log('Event data:', eventRes.data);
      console.log('Banner URL from event:', eventRes.data.bannerUrl);
      console.log('Constructed image URL:', `${import.meta.env.VITE_API_URL?.replace('/api', '')}${eventRes.data.bannerUrl}`);

      setEvent(eventRes.data);
      setQrData(eventRes.data.qrCode);
      setAttendances(attendanceRes.data || []);
    } catch (error) {
      message.error('Không thể tải dữ liệu sự kiện');
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    const socket = socketService.connect();

    // Join event room
    socketService.joinEvent(currentEventId);

    // Lắng nghe check-in mới
    socketService.onNewCheckIn((data) => {
      if (data.eventId === currentEventId) {
        // ✅ De-duplicate: Check if attendance already exists in list
        const attendanceId = data.attendance?._id;
        
        setAttendances((prev) => {
          const alreadyExists = prev.some(a => a._id === attendanceId);
          
          if (!alreadyExists) {
            message.success(
              `${data.attendance.student.fullName} đã check-in thành công!`
            );
            return [data.attendance, ...prev];
          } else {
            console.log('⚠️ Duplicate socket event ignored:', attendanceId);
            return prev;
          }
        });
      }
    });

    // Lắng nghe QR update
    socketService.onQRUpdated((data) => {
      if (data.eventId === currentEventId) {
        setQrData({
          code: data.qrCode,
          expiresAt: data.expiresAt,
        });
      }
    });
  };

  const handleRefreshQR = async () => {
    try {
      const response = await eventService.generateQRCode(currentEventId);
      setQrData(response.data);
      message.success('QR code đã được làm mới');
    } catch (error) {
      message.error('Không thể tạo QR mới');
    }
  };

  const handleBannerUpload = async (info) => {
    const { file } = info;
    
    console.log('Upload status:', file.status);
    console.log('Upload response:', file.response);
    
    if (file.status === 'uploading') {
      setUploadingBanner(true);
      return;
    }

    if (file.status === 'done') {
      try {
        // Refresh event data to get new banner
        const eventRes = await eventService.getEventById(currentEventId);
        setEvent(eventRes.data);
        message.success('Tải banner thành công!');
      } catch (error) {
        console.error('Error refreshing event:', error);
        message.error('Không thể cập nhật banner');
      } finally {
        setUploadingBanner(false);
      }
    } else if (file.status === 'error') {
      console.error('Upload error:', file.error);
      console.error('Server response:', file.response);
      
      const errorMsg = file.response?.message || file.error?.message || 'Tải banner thất bại';
      message.error(errorMsg);
      setUploadingBanner(false);
    }
  };

  const uploadProps = {
    name: 'banner',
    action: `${import.meta.env.VITE_API_URL}/events/${currentEventId}/upload-banner`,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    accept: 'image/*',
    showUploadList: false,
    onChange: handleBannerUpload,
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Mã SV',
      dataIndex: ['student', 'studentCode'],
      key: 'studentCode',
      width: 120,
    },
    {
      title: 'Họ tên',
      dataIndex: ['student', 'fullName'],
      key: 'fullName',
      width: 200,
    },
    {
      title: 'Lớp',
      dataIndex: ['student', 'class'],
      key: 'class',
      width: 100,
    },
    {
      title: 'Thời gian',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      width: 100,
      render: (time) => dayjs(time).format('HH:mm:ss'),
    },
    {
      title: 'Khoảng cách',
      dataIndex: 'distanceFromEvent',
      key: 'distance',
      width: 100,
      render: (distance) => `${distance}m`,
    },
    {
      title: 'Trạng thái GPS',
      dataIndex: 'isValid',
      key: 'isValid',
      width: 120,
      render: (isValid) => (
        <Tag color={isValid ? 'green' : 'orange'}>
          {isValid ? 'Trong vùng' : 'Ngoài vùng'}
        </Tag>
      ),
    },
    {
      title: 'Xác nhận',
      dataIndex: 'verificationStatus',
      key: 'verificationStatus',
      width: 120,
      render: (status) => {
        const statusConfig = {
          pending: { color: 'blue', text: 'Chờ duyệt' },
          approved: { color: 'green', text: 'Đã duyệt' },
          rejected: { color: 'red', text: 'Từ chối' },
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        {event?.title}
      </h1>

      {/* Event Banner Card */}
      <Card 
        className="mb-6"
        title={
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <PictureOutlined />
              <span>Banner Sự kiện</span>
            </span>
            <Upload {...uploadProps}>
              <Button 
                icon={<UploadOutlined />} 
                loading={uploadingBanner}
                size="small"
              >
                {event?.bannerUrl ? 'Thay đổi hình' : 'Tải lên'}
              </Button>
            </Upload>
          </div>
        }
      >
        {event?.bannerUrl ? (
          <div className="relative group">
            <img
              src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${event.bannerUrl}`}
              alt={event.title}
              className="w-full h-64 object-cover rounded-lg"
              style={{
                maxHeight: '300px',
                objectFit: 'cover',
              }}
              onError={(e) => {
                console.error('Image load error:', e.target.src);
                console.error('VITE_API_URL:', import.meta.env.VITE_API_URL);
                console.error('event.bannerUrl:', event.bannerUrl);
                e.target.style.display = 'none';
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', `${import.meta.env.VITE_API_URL?.replace('/api', '')}${event.bannerUrl}`);
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
              <Upload {...uploadProps}>
                <Button 
                  type="primary"
                  icon={<UploadOutlined />}
                  size="large"
                  loading={uploadingBanner}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Thay đổi Banner
                </Button>
              </Upload>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <PictureOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <p className="text-gray-500 mb-4">Chưa có banner cho sự kiện này</p>
            <Upload {...uploadProps}>
              <Button 
                type="primary" 
                icon={<UploadOutlined />}
                loading={uploadingBanner}
              >
                Tải lên Banner
              </Button>
            </Upload>
            <p className="text-xs text-gray-400 mt-2">Khuyến nghị: 1920x600px, JPG/PNG</p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* QR Code Display */}
        <Card className="lg:col-span-1">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Mã QR Điểm danh</h2>

            {qrData?.code ? (
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg shadow-lg">
                  <QRCodeSVG
                    value={qrData.code}
                    size={280}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <p className="text-sm text-gray-600 mt-4 font-medium">
                  Mã QR cố định cho sự kiện
                </p>

                <p className="text-xs text-green-600 mt-1">
                  ✅ Có hiệu lực trong suốt sự kiện
                </p>

                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={handleRefreshQR}
                  className="mt-4"
                >
                  Tải lại
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                <p className="text-gray-500 mb-4">Chưa có mã QR cho sự kiện này</p>
                <Button
                  type="primary"
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={handleRefreshQR}
                >
                  Tạo mã QR điểm danh
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Statistics */}
        <Card className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Thống kê</h2>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <Statistic
                title="Tổng check-in"
                value={attendances.length}
                prefix={<CheckCircleOutlined />}
                styles={{ value: { color: '#3f8600' } }}
              />
            </Card>

            <Card>
              <Statistic
                title="Hợp lệ"
                value={attendances.filter((a) => a.isValid).length}
                styles={{ value: { color: '#1890ff' } }}
              />
            </Card>

            <Card>
              <Statistic
                title="Ngoài vùng"
                value={attendances.filter((a) => !a.isValid).length}
                styles={{ value: { color: '#faad14' } }}
              />
            </Card>
          </div>

          <div className="mt-4 text-gray-600">
            <p><strong>Địa điểm:</strong> {event?.location.address}</p>
            <p><strong>Thời gian:</strong> {event?.startTime} - {event?.endTime}</p>
            <p><strong>Bán kính:</strong> {event?.checkInRadius}m</p>
          </div>
        </Card>
      </div>

      {/* Attendance List */}
      <Card title="Danh sách điểm danh (Realtime)">
        <Table
          columns={columns}
          dataSource={attendances}
          rowKey="_id"
          pagination={false}
          scroll={{ y: 400 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default QRDisplayPage;
