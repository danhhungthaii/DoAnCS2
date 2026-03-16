import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  TimePicker,
  InputNumber,
  message,
  Space,
  Tag,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  QrcodeOutlined,
  EyeOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import dayjs from 'dayjs';
import MapPicker from '../components/MapPicker';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getAllEvents();
      setEvents(response.data || []);
    } catch (error) {
      message.error('Không thể tải danh sách sự kiện');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    // Điều hướng đến trang CreateEvent thay vì mở modal
    navigate('/admin/events/create');
  };

  const handleEdit = (record) => {
    setEditingEvent(record);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      eventDate: dayjs(record.eventDate),
      startTime: dayjs(record.startTime, 'HH:mm'),
      endTime: dayjs(record.endTime, 'HH:mm'),
      address: record.location.address,
      latitude: record.location.coordinates.latitude,
      longitude: record.location.coordinates.longitude,
      checkInRadius: record.checkInRadius,
      maxAttendees: record.maxAttendees,
      points: record.points,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await eventService.deleteEvent(id);
      message.success('Xóa sự kiện thành công');
      fetchEvents();
    } catch (error) {
      message.error('Không thể xóa sự kiện');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const eventData = {
        title: values.title,
        description: values.description,
        eventDate: values.eventDate.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
        location: {
          address: values.address,
          coordinates: {
            latitude: values.latitude,
            longitude: values.longitude,
          },
        },
        checkInRadius: values.checkInRadius,
        maxAttendees: values.maxAttendees,
        points: values.points,
      };

      if (editingEvent) {
        await eventService.updateEvent(editingEvent._id, eventData);
        message.success('Cập nhật sự kiện thành công');
      } else {
        await eventService.createEvent(eventData);
        message.success('Tạo sự kiện thành công');
      }

      setModalVisible(false);
      fetchEvents();
      form.resetFields();
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleGenerateAndViewQR = async (event) => {
    try {
      if (!event.qrCode?.code) {
        message.loading({ content: 'Đang tạo mã QR...', key: 'qr-gen' });
        await eventService.generateQRCode(event._id);
        message.success({ content: 'Tạo mã QR thành công!', key: 'qr-gen' });
      }
      navigate(`/admin/qr-display/${event._id}`);
    } catch (error) {
      message.error({ content: 'Không thể tạo mã QR', key: 'qr-gen' });
    }
  };

  const columns = [
    {
      title: 'Tên sự kiện',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: 'Ngày',
      dataIndex: 'eventDate',
      key: 'eventDate',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Giờ',
      key: 'time',
      render: (_, record) => `${record.startTime} - ${record.endTime}`,
    },
    {
      title: 'Địa điểm',
      dataIndex: ['location', 'address'],
      key: 'address',
      width: 200,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          upcoming: 'blue',
          ongoing: 'green',
          completed: 'default',
          cancelled: 'red',
        };
        const labels = {
          upcoming: 'Sắp diễn ra',
          ongoing: 'Đang diễn ra',
          completed: 'Đã kết thúc',
          cancelled: 'Đã hủy',
        };
        return <Tag color={colors[status]}>{labels[status]}</Tag>;
      },
    },
    {
      title: 'Điểm',
      dataIndex: 'points',
      key: 'points',
      width: 90,
      render: (points) => `${points ?? 0} điểm`,
    },
    {
      title: 'Giới hạn',
      key: 'capacity',
      width: 140,
      render: (_, record) => {
        if (record.maxAttendees === null || record.maxAttendees === undefined) {
          return <Tag>Không giới hạn</Tag>;
        }

        const isFull = record.registeredCount >= record.maxAttendees;
        return <Tag color={isFull ? 'red' : 'blue'}>{record.registeredCount || 0}/{record.maxAttendees}</Tag>;
      },
    },
    {
      title: 'QR',
      key: 'qrStatus',
      width: 80,
      render: (_, record) => (
        record.qrCode?.code
          ? <Tag color="green">Đã tạo</Tag>
          : <Tag color="default">Chưa tạo</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 320,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="primary"
            icon={<QrcodeOutlined />}
            size="small"
            onClick={() => handleGenerateAndViewQR(record)}
          >
            {record.qrCode?.code ? 'Xem QR' : 'Tạo QR'}
          </Button>
          <Button
            icon={<UserOutlined />}
            size="small"
            onClick={() => navigate(`/admin/events/${record._id}/registrations`)}
            title="Xem danh sách đăng ký"
          >
            Đăng ký ({record.registeredCount || 0}{record.maxAttendees ? `/${record.maxAttendees}` : ''})
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xác nhận xóa?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Sự kiện</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          size="large"
        >
          Tạo sự kiện mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={events}
        loading={loading}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={editingEvent ? 'Cập nhật sự kiện' : 'Tạo sự kiện mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            checkInRadius: 100,
            latitude: 10.762622,
            longitude: 106.660172,
            points: 5,
          }}
        >
          <Form.Item
            name="title"
            label="Tên sự kiện"
            rules={[{ required: true, message: 'Vui lòng nhập tên sự kiện' }]}
          >
            <Input placeholder="VD: Họp lớp K18" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả chi tiết..." />
          </Form.Item>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item
              name="eventDate"
              label="Ngày"
              rules={[{ required: true, message: 'Chọn ngày' }]}
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>

            <Form.Item
              name="startTime"
              label="Giờ bắt đầu"
              rules={[{ required: true, message: 'Chọn giờ' }]}
            >
              <TimePicker className="w-full" format="HH:mm" />
            </Form.Item>

            <Form.Item
              name="endTime"
              label="Giờ kết thúc"
              rules={[{ required: true, message: 'Chọn giờ' }]}
            >
              <TimePicker className="w-full" format="HH:mm" />
            </Form.Item>
          </div>

          <Form.Item
            name="address"
            label="Địa điểm"
            rules={[{ required: true, message: 'Nhập địa điểm' }]}
          >
            <Input placeholder="VD: Hội trường A, ĐHCNTT" />
          </Form.Item>

          <div className="grid grid-cols-5 gap-4">
            <Form.Item
              name="latitude"
              label="Vĩ độ"
              rules={[{ required: true }]}
            >
              <InputNumber className="w-full" step={0.000001} />
            </Form.Item>

            <Form.Item
              name="longitude"
              label="Kinh độ"
              rules={[{ required: true }]}
            >
              <InputNumber className="w-full" step={0.000001} />
            </Form.Item>

            <Form.Item name="checkInRadius" label="Bán kính (m)">
              <InputNumber className="w-full" min={10} max={1000} />
            </Form.Item>

            <Form.Item
              name="maxAttendees"
              label="Số lượng tối đa"
              rules={[{ required: true, message: 'Nhập số lượng tối đa' }]}
            >
              <InputNumber className="w-full" min={1} />
            </Form.Item>

            <Form.Item
              name="points"
              label="Số điểm"
              rules={[{ required: true, message: 'Nhập số điểm' }]}
            >
              <InputNumber className="w-full" min={0} />
            </Form.Item>
          </div>

          <MapPicker
            onLocationSelect={(lat, lng) => {
              form.setFieldsValue({ latitude: lat, longitude: lng });
            }}
          />

          <Form.Item className="mt-4 mb-0">
            <Space>
              <Button type="primary" htmlType="submit">
                {editingEvent ? 'Cập nhật' : 'Tạo mới'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EventsPage;
