import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import {
  CalendarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

/**
 * DashboardPage - Trang Dashboard chính
 */
const DashboardPage = () => {
  // Mock data - sẽ fetch từ API sau
  const stats = {
    totalEvents: 15,
    totalStudents: 320,
    todayAttendance: 87,
    upcomingEvents: 3,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Sự kiện"
              value={stats.totalEvents}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Sinh viên"
              value={stats.totalStudents}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Điểm danh Hôm nay"
              value={stats.todayAttendance}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Sự kiện Sắp tới"
              value={stats.upcomingEvents}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Events */}
      <Card title="Sự kiện Gần đây" className="mt-6">
        <p className="text-gray-500 text-center py-8">
          Danh sách sự kiện sẽ hiển thị ở đây
        </p>
      </Card>
    </div>
  );
};

export default DashboardPage;
