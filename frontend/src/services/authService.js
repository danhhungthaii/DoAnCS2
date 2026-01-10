import api from './api';

/**
 * Auth Service - Xử lý đăng nhập, đăng ký
 */
export const authService = {
  // Đăng nhập
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    
    // Lưu token và user info vào localStorage
    if (response.success && response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },

  // Đăng ký (chỉ super-admin mới tạo được admin mới)
  register: async (userData) => {
    return await api.post('/auth/register', userData);
  },

  // Đăng xuất
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Kiểm tra đã đăng nhập chưa
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};
