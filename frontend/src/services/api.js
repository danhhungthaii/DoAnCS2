import axios from 'axios';

// Tạo axios instance với base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Thêm token vào mỗi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Xử lý lỗi global
api.interceptors.response.use(
  (response) => {
    // For blob responses (file downloads), return the full response
    if (response.config.responseType === 'blob') {
      return response;
    }
    return response.data; // Trả về data trực tiếp
  },
  (error) => {
    // Xử lý lỗi 401 - Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Trả về error message
    const errorMessage =
      error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại';

    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
