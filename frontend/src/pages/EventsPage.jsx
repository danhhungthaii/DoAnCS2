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
    setEditingEvent(null);
    form.resetFields();
    setModalVisible(true);
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

  const handleViewQR = (event) => {
    navigate(`/qr-display/${event._id}`);
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
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<QrcodeOutlined />}
            size="small"
            onClick={() => handleViewQR(record)}
          >
            QR
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

          <div className="grid grid-cols-3 gap-4">
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
