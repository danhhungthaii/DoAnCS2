import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Popconfirm,
  Tag,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UploadOutlined,
  DownloadOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { studentService } from '../services/studentService';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async (search = '') => {
    try {
      setLoading(true);
      const response = await studentService.getAllStudents({ search });
      setStudents(response.data || []);
    } catch (error) {
      message.error('Không thể tải danh sách sinh viên');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    fetchStudents(value);
  };

  const handleCreate = () => {
    setEditingStudent(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingStudent(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await studentService.deleteStudent(id);
      message.success('Xóa sinh viên thành công');
      fetchStudents(searchText);
    } catch (error) {
      message.error('Không thể xóa sinh viên');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingStudent) {
        await studentService.updateStudent(editingStudent._id, values);
        message.success('Cập nhật sinh viên thành công');
      } else {
        await studentService.createStudent(values);
        message.success('Thêm sinh viên thành công');
      }

      setModalVisible(false);
      fetchStudents(searchText);
      form.resetFields();
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await studentService.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_students.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Đã tải template thành công');
    } catch (error) {
      message.error('Không thể tải template');
    }
  };

  const handleExport = async () => {
    try {
      const response = await studentService.exportStudents();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = `students_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Đã export danh sách thành công');
    } catch (error) {
      message.error('Không thể export danh sách');
    }
  };

  const uploadProps = {
    name: 'file',
    accept: '.xlsx,.xls,.csv',
    showUploadList: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        setUploading(true);
        const response = await studentService.importStudents(file);
        
        const { successCount, failedCount, duplicateCount, details } = response.data;
        
        Modal.info({
          title: 'Kết quả import',
          width: 600,
          content: (
            <div>
              <p><strong>Tổng số:</strong> {successCount + failedCount + duplicateCount}</p>
              <p style={{ color: 'green' }}><strong>Thành công:</strong> {successCount}</p>
              {duplicateCount > 0 && (
                <p style={{ color: 'orange' }}><strong>Trùng lặp:</strong> {duplicateCount}</p>
              )}
              {failedCount > 0 && (
                <p style={{ color: 'red' }}><strong>Lỗi:</strong> {failedCount}</p>
              )}
              
              {details.failed.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <strong>Chi tiết lỗi:</strong>
                  <ul>
                    {details.failed.slice(0, 5).map((item, idx) => (
                      <li key={idx}>Dòng {item.row}: {item.error}</li>
                    ))}
                    {details.failed.length > 5 && <li>...và {details.failed.length - 5} lỗi khác</li>}
                  </ul>
                </div>
              )}
            </div>
          ),
        });
        
        fetchStudents(searchText);
        onSuccess();
      } catch (error) {
        message.error(error.message || 'Import thất bại');
        onError(error);
      } finally {
        setUploading(false);
      }
    },
  };

  const columns = [
    {
      title: 'Mã SV',
      dataIndex: 'studentCode',
      key: 'studentCode',
      width: 120,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 200,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 220,
    },
    {
      title: 'Lớp',
      dataIndex: 'class',
      key: 'class',
      width: 100,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: 'Ngành',
      dataIndex: 'major',
      key: 'major',
      width: 150,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Ngưng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
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
        <h1 className="text-2xl font-bold">Quản lý Sinh viên</h1>
        <Space>
          <Input.Search
            placeholder="Tìm theo mã SV, tên, email..."
            onSearch={handleSearch}
            style={{ width: 300 }}
            enterButton={<SearchOutlined />}
          />
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadTemplate}
          >
            Tải template
          </Button>
          <Upload {...uploadProps}>
            <Button
              icon={<UploadOutlined />}
              loading={uploading}
            >
              Import Excel
            </Button>
          </Upload>
          <Button
            icon={<ExportOutlined />}
            onClick={handleExport}
          >
            Export Excel
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size="large"
          >
            Thêm sinh viên
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={students}
        loading={loading}
        rowKey="_id"
        pagination={{ pageSize: 20 }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingStudent ? 'Cập nhật sinh viên' : 'Thêm sinh viên mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="studentCode"
              label="Mã sinh viên"
              rules={[{ required: true, message: 'Vui lòng nhập mã SV' }]}
            >
              <Input placeholder="VD: 20110001" disabled={!!editingStudent} />
            </Form.Item>

            <Form.Item
              name="fullName"
              label="Họ tên"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
            >
              <Input placeholder="VD: Nguyễn Văn A" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Email không hợp lệ' },
              ]}
            >
              <Input placeholder="student@example.com" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[
                {
                  pattern: /^[0-9]{10,11}$/,
                  message: 'SĐT phải là 10-11 số',
                },
              ]}
            >
              <Input placeholder="0123456789" />
            </Form.Item>

            <Form.Item
              name="class"
              label="Lớp"
              rules={[{ required: true, message: 'Vui lòng nhập lớp' }]}
            >
              <Input placeholder="VD: K18CNTT" />
            </Form.Item>

            <Form.Item name="major" label="Ngành">
              <Input placeholder="VD: Công nghệ thông tin" />
            </Form.Item>
          </div>

          <Form.Item className="mb-0">
            <Space>
              <Button type="primary" htmlType="submit">
                {editingStudent ? 'Cập nhật' : 'Thêm mới'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StudentsPage;
