import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  InputNumber,
  message,
  Row,
  Col,
  Select,
  Upload,
  Modal,
  Result
} from 'antd';
import {
  EnvironmentOutlined,
  SaveOutlined,
  UploadOutlined,
  PictureOutlined,
  QrcodeOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { eventService } from '../services/eventService';
import axios from 'axios';

const { Option } = Select;

/**
 * Trang tạo sự kiện mới với predefined locations và banner upload
 */
const CreateEventPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdEventId, setCreatedEventId] = useState(null);
  const [createdEventTitle, setCreatedEventTitle] = useState('');

  /**
   * Load predefined locations từ backend
   */
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/events/predefined-locations`);
        if (response.data.success) {
          setLocations(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        message.error('Không thể tải danh sách địa điểm');
      }
    };
    fetchLocations();
  }, []);

  /**
   * Xử lý khi chọn location từ dropdown
   */
  const handleLocationChange = (locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    if (location) {
      setSelectedLocation(location);
      form.setFieldsValue({
        address: location.address,
      });
    }
  };

  /**
   * Xử lý preview banner trước khi upload
   */
  const handleBannerChange = (info) => {
    const file = info.file.originFileObj || info.file;
    setBannerFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setBannerPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Submit form tạo sự kiện
   */
  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      if (!selectedLocation) {
        message.error('Vui lòng chọn địa điểm sự kiện');
        return;
      }

      // Chuyển đổi dữ liệu theo đúng schema backend
      const eventData = {
        title: values.title,
        description: values.description,
        location: {
          address: selectedLocation.address,
          coordinates: {
            latitude: selectedLocation.coordinates.latitude,
            longitude: selectedLocation.coordinates.longitude,
          },
        },
        eventDate: values.dateTime.format('YYYY-MM-DD'),
        startTime: values.dateTime.format('HH:mm'),
        endTime: values.endDateTime.format('HH:mm'),
        checkInRadius: values.checkInRadius,
        maxAttendees: values.maxAttendees,
        points: values.points,
      };

      const response = await eventService.createEvent(eventData);
      const createdEvent = response.data || response;

      // Upload banner nếu có
      if (bannerFile && createdEvent._id) {
        const formData = new FormData();
        formData.append('banner', bannerFile);

        try {
          await axios.post(
            `${import.meta.env.VITE_API_URL}/events/${createdEvent._id}/upload-banner`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
            }
          );
        } catch (uploadError) {
          console.error('Banner upload error:', uploadError);
          message.warning('Upload banner thất bại, nhưng sự kiện đã được tạo');
        }
      }

      // Lưu ID và hiển thị modal thành công
      setCreatedEventId(createdEvent._id);
      setCreatedEventTitle(eventData.title);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating event:', error);
      message.error(error.response?.data?.message || 'Không thể tạo sự kiện');
    } finally {
      setLoading(false);
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
          <Button onClick={() => navigate('/admin/events')}>
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
            points: 5,
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
                label="Địa điểm"
                name="locationSelect"
                rules={[
                  { required: true, message: 'Vui lòng chọn địa điểm' },
                ]}
              >
                <Select
                  placeholder="Chọn địa điểm sự kiện"
                  size="large"
                  onChange={handleLocationChange}
                  suffixIcon={<EnvironmentOutlined />}
                >
                  {locations.map((loc) => (
                    <Option key={loc.id} value={loc.id}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{loc.name}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>
                          {loc.address}
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Địa chỉ chi tiết"
                name="address"
              >
                <Input
                  placeholder="Địa chỉ sẽ tự động điền khi chọn địa điểm"
                  size="large"
                  disabled
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
                label="Bán kính check-in"
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
                  suffix="mét"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Số lượng đăng ký tối đa"
                    name="maxAttendees"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số lượng tối đa' },
                    ]}
                    extra="Khi đạt giới hạn, hệ thống sẽ chặn đăng ký thêm."
                  >
                    <InputNumber
                      min={1}
                      step={1}
                      style={{ width: '100%' }}
                      size="large"
                      placeholder="Ví dụ: 100"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Số điểm của sự kiện"
                    name="points"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số điểm' },
                    ]}
                    extra="Điểm sẽ được cộng cho sinh viên sau khi xác minh tham gia."
                  >
                    <InputNumber
                      min={0}
                      step={1}
                      style={{ width: '100%' }}
                      size="large"
                      placeholder="Ví dụ: 5"
                    />
                  </Form.Item>
                </Col>
              </Row>

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

            {/* Cột phải: Banner Upload & Location Info */}
            <Col xs={24} lg={12}>
              {/* Banner Upload */}
              <Card
                title={
                  <span>
                    <PictureOutlined style={{ marginRight: 8 }} />
                    Banner Sự Kiện
                  </span>
                }
                size="small"
                style={{ marginBottom: 16 }}
              >
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={() => false}
                  onChange={handleBannerChange}
                >
                  <Button icon={<UploadOutlined />} block size="large">
                    Chọn ảnh banner
                  </Button>
                </Upload>

                {bannerPreview && (
                  <div style={{ marginTop: 16 }}>
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #d9d9d9',
                      }}
                    />
                  </div>
                )}

                <p style={{ marginTop: 12, color: '#666', fontSize: '12px' }}>
                  💡 <strong>Gợi ý:</strong> Tải lên ảnh banner để sự kiện nổi bật hơn.
                  Kích thước khuyến nghị: 1200x400px
                </p>
              </Card>

              {/* Location Info */}
              <Card
                title="Thông tin địa điểm"
                size="small"
              >
                {selectedLocation ? (
                  <div>
                    <div style={{ marginBottom: 12 }}>
                      <strong style={{ color: '#1890ff' }}>
                        {selectedLocation.name}
                      </strong>
                    </div>
                    <div style={{ marginBottom: 8, color: '#666' }}>
                      📍 {selectedLocation.address}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>
                      Tọa độ: {selectedLocation.coordinates.latitude.toFixed(6)}, {selectedLocation.coordinates.longitude.toFixed(6)}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#999', textAlign: 'center', margin: '20px 0' }}>
                    Chọn địa điểm để xem thông tin chi tiết
                  </p>
                )}
              </Card>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Modal thành công - Hỏi xem QR code */}
      <Modal
        open={showSuccessModal}
        closable={false}
        footer={null}
        centered
        width={480}
      >
        <Result
          status="success"
          title="Tạo sự kiện thành công!"
          subTitle={`Sự kiện "${createdEventTitle}" đã được tạo. Mã QR điểm danh đã sẵn sàng cho sinh viên quét.`}
          extra={[
            <Button
              type="primary"
              key="qr"
              icon={<QrcodeOutlined />}
              size="large"
              onClick={() => navigate(`/admin/qr-display/${createdEventId}`)}
            >
              Xem mã QR điểm danh
            </Button>,
            <Button
              key="list"
              icon={<UnorderedListOutlined />}
              size="large"
              onClick={() => navigate('/admin/events')}
            >
              Quay lại danh sách
            </Button>,
          ]}
        />
      </Modal>
    </div>
  );
};

export default CreateEventPage;
