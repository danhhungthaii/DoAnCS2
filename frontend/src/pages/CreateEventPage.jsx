import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, DatePicker, InputNumber, message, Row, Col } from 'antd';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { EnvironmentOutlined, SaveOutlined } from '@ant-design/icons';
import { eventService } from '../services/eventService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * Component để handle click event trên bản đồ
 */
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
};

/**
 * Trang tạo sự kiện mới với tích hợp bản đồ
 */
const CreateEventPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({
    latitude: 10.762622, // Mặc định: Thành phố Hồ Chí Minh
    longitude: 106.660172,
  });

  /**
   * Xử lý khi click vào bản đồ để chọn vị trí
   */
  const handleMapClick = (lat, lng) => {
    setPosition({ latitude: lat, longitude: lng });
    form.setFieldsValue({
      'location.latitude': lat,
      'location.longitude': lng,
    });
    message.success(`Đã chọn vị trí: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  };

  /**
   * Submit form tạo sự kiện
   */
  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const eventData = {
        title: values.title,
        description: values.description,
        location: {
          address: values.address,
          latitude: position.latitude,
          longitude: position.longitude,
        },
        dateTime: values.dateTime.toISOString(),
        endDateTime: values.endDateTime.toISOString(),
        checkInRadius: values.checkInRadius,
      };

      await eventService.createEvent(eventData);
      message.success('Tạo sự kiện thành công!');
      navigate('/events');
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tạo sự kiện');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lấy vị trí hiện tại của người dùng
   */
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      message.loading('Đang lấy vị trí hiện tại...', 0);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setPosition({ latitude: lat, longitude: lng });
          form.setFieldsValue({
            'location.latitude': lat,
            'location.longitude': lng,
          });
          message.destroy();
          message.success('Đã lấy vị trí hiện tại thành công!');
        },
        (error) => {
          message.destroy();
          message.error('Không thể lấy vị trí hiện tại. Vui lòng cho phép truy cập vị trí.');
        }
      );
    } else {
      message.error('Trình duyệt không hỗ trợ geolocation');
    }
  };

  return (
    <div>
      <Card 
        title={
          <span>
            <EnvironmentOutlined style={{ marginRight: 8 }} />
            Tạo Sự Kiện Mới
          </span>
        }
        extra={
          <Button onClick={() => navigate('/events')}>
            Quay lại
          </Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            checkInRadius: 50,
            'location.latitude': position.latitude,
            'location.longitude': position.longitude,
          }}
        >
          <Row gutter={24}>
            {/* Cột trái: Form nhập liệu */}
            <Col xs={24} lg={12}>
              <Form.Item
                label="Tên sự kiện"
                name="title"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên sự kiện' },
                  { min: 5, message: 'Tên sự kiện phải có ít nhất 5 ký tự' },
                ]}
              >
                <Input 
                  placeholder="Ví dụ: Hội thảo Công nghệ AI 2026"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Mô tả"
                name="description"
                rules={[
                  { required: true, message: 'Vui lòng nhập mô tả' },
                ]}
              >
                <Input.TextArea 
                  rows={4}
                  placeholder="Mô tả chi tiết về sự kiện..."
                />
              </Form.Item>

              <Form.Item
                label="Địa chỉ"
                name="address"
                rules={[
                  { required: true, message: 'Vui lòng nhập địa chỉ' },
                ]}
              >
                <Input 
                  placeholder="Ví dụ: 123 Nguyễn Huệ, Q1, TP.HCM"
                  size="large"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Thời gian bắt đầu"
                    name="dateTime"
                    rules={[
                      { required: true, message: 'Chọn thời gian bắt đầu' },
                    ]}
                  >
                    <DatePicker
                      showTime
                      format="DD/MM/YYYY HH:mm"
                      placeholder="Chọn ngày giờ"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Thời gian kết thúc"
                    name="endDateTime"
                    rules={[
                      { required: true, message: 'Chọn thời gian kết thúc' },
                    ]}
                  >
                    <DatePicker
                      showTime
                      format="DD/MM/YYYY HH:mm"
                      placeholder="Chọn ngày giờ"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Bán kính check-in (mét)"
                name="checkInRadius"
                rules={[
                  { required: true, message: 'Vui lòng nhập bán kính' },
                ]}
              >
                <InputNumber
                  min={10}
                  max={1000}
                  step={10}
                  style={{ width: '100%' }}
                  size="large"
                  placeholder="50"
                  addonAfter="mét"
                />
              </Form.Item>

              <Form.Item
                label="Tọa độ (Latitude, Longitude)"
                style={{ marginBottom: 8 }}
              >
                <Input.Group compact>
                  <Form.Item
                    name={['location', 'latitude']}
                    noStyle
                    rules={[{ required: true, message: 'Latitude required' }]}
                  >
                    <Input
                      style={{ width: '50%' }}
                      placeholder="Latitude"
                      readOnly
                      value={position.latitude}
                    />
                  </Form.Item>
                  <Form.Item
                    name={['location', 'longitude']}
                    noStyle
                    rules={[{ required: true, message: 'Longitude required' }]}
                  >
                    <Input
                      style={{ width: '50%' }}
                      placeholder="Longitude"
                      readOnly
                      value={position.longitude}
                    />
                  </Form.Item>
                </Input.Group>
              </Form.Item>

              <Button
                type="dashed"
                block
                onClick={handleGetCurrentLocation}
                style={{ marginBottom: 16 }}
              >
                📍 Lấy vị trí hiện tại của tôi
              </Button>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  block
                  icon={<SaveOutlined />}
                >
                  Tạo Sự Kiện
                </Button>
              </Form.Item>
            </Col>

            {/* Cột phải: Bản đồ */}
            <Col xs={24} lg={12}>
              <Card
                title="Chọn vị trí sự kiện trên bản đồ"
                size="small"
                style={{ marginBottom: 16 }}
              >
                <p style={{ marginBottom: 12, color: '#666' }}>
                  💡 <strong>Hướng dẫn:</strong> Click vào bất kỳ đâu trên bản đồ để đặt ghim vị trí sự kiện.
                  Tọa độ sẽ tự động cập nhật.
                </p>
                
                <div style={{ height: '500px', border: '1px solid #d9d9d9', borderRadius: 4 }}>
                  <MapContainer
                    center={[position.latitude, position.longitude]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* Marker hiển thị vị trí đã chọn */}
                    <Marker position={[position.latitude, position.longitude]} />
                    
                    {/* Component handle click event */}
                    <MapClickHandler onLocationSelect={handleMapClick} />
                  </MapContainer>
                </div>

                <div style={{ marginTop: 12, fontSize: 12, color: '#888' }}>
                  📌 Vị trí hiện tại: {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
                </div>
              </Card>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default CreateEventPage;
