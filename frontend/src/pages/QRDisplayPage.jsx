import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Table, Button, message, Spin, Tag, Statistic } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import { ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
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
  const [qrTimestamp, setQrTimestamp] = useState(Date.now());

  useEffect(() => {
    fetchEventData();
    setupSocket();

    // Auto-refresh QR code mỗi 10 giây
    const intervalId = setInterval(() => {
      setQrTimestamp(Date.now());
    }, 10000); // 10 giây

    return () => {
      if (currentEventId) {
        socketService.leaveEvent(currentEventId);
      }
      clearInterval(intervalId);
    };
  }, [currentEventId]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const [eventRes, attendanceRes] = await Promise.all([
        eventService.getEventById(currentEventId),
        eventService.getEventAttendances(currentEventId),
      ]);

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
        setAttendances((prev) => [data.attendance, ...prev]);
        message.success(
          `${data.attendance.student.fullName} đã check-in thành công!`
        );
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
      title: 'Trạng thái',
      dataIndex: 'isValid',
      key: 'isValid',
      width: 120,
      render: (isValid) => (
        <Tag color={isValid ? 'green' : 'orange'}>
          {isValid ? 'Hợp lệ' : 'Ngoài vùng'}
        </Tag>
      ),
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* QR Code Display */}
        <Card className="lg:col-span-1">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Mã QR Điểm danh</h2>
            
            {qrData?.code ? (
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg shadow-lg">
                  <QRCodeSVG
                    value={JSON.stringify({
                      event_id: currentEventId,
                      timestamp: qrTimestamp,
                      code: qrData.code,
                    })}
                    size={280}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                
                <p className="text-sm text-gray-500 mt-4">
                  Hết hạn: {dayjs(qrData.expiresAt).format('HH:mm:ss')}
                </p>
                
                <p className="text-xs text-blue-600 mt-1">
                  🔄 Tự động đổi mỗi 10 giây
                </p>

                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={handleRefreshQR}
                  className="mt-4"
                >
                  Làm mới QR
                </Button>
              </div>
            ) : (
              <p className="text-gray-500">Chưa có mã QR</p>
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
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>

            <Card>
              <Statistic
                title="Hợp lệ"
                value={attendances.filter((a) => a.isValid).length}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>

            <Card>
              <Statistic
                title="Ngoài vùng"
                value={attendances.filter((a) => !a.isValid).length}
                valueStyle={{ color: '#faad14' }}
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
