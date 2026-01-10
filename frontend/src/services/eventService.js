import api from './api';

/**
 * Event Service - Quản lý sự kiện
 */
export const eventService = {
  // Lấy danh sách sự kiện
  getAllEvents: async (params = {}) => {
    return await api.get('/events', { params });
  },

  // Lấy chi tiết sự kiện
  getEventById: async (id) => {
    return await api.get(`/events/${id}`);
  },

  // Tạo sự kiện mới
  createEvent: async (eventData) => {
    return await api.post('/events', eventData);
  },

  // Cập nhật sự kiện
  updateEvent: async (id, eventData) => {
    return await api.put(`/events/${id}`, eventData);
  },

  // Xóa sự kiện
  deleteEvent: async (id) => {
    return await api.delete(`/events/${id}`);
  },

  // Tạo QR code mới cho sự kiện
  generateQRCode: async (id) => {
    return await api.post(`/events/${id}/qr`);
  },

  // Lấy danh sách điểm danh của sự kiện
  getEventAttendances: async (id) => {
    return await api.get(`/attendances/event/${id}`);
  },
};
