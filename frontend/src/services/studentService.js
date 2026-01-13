import api from './api';

/**
 * Student Service - Quản lý sinh viên
 */
export const studentService = {
  // Lấy danh sách sinh viên
  getAllStudents: async (params = {}) => {
    return await api.get('/students', { params });
  },

  // Lấy chi tiết sinh viên
  getStudentById: async (id) => {
    return await api.get(`/students/${id}`);
  },

  // Thêm sinh viên mới
  createStudent: async (studentData) => {
    return await api.post('/students', studentData);
  },

  // Cập nhật sinh viên
  updateStudent: async (id, studentData) => {
    return await api.put(`/students/${id}`, studentData);
  },

  // Xóa sinh viên
  deleteStudent: async (id) => {
    return await api.delete(`/students/${id}`);
  },

  // Import sinh viên từ Excel
  importStudents: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return await api.post('/students/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Download template Excel
  downloadTemplate: async () => {
    return await api.get('/students/template', {
      responseType: 'blob',
    });
  },

  // Export danh sách sinh viên
  exportStudents: async () => {
    return await api.get('/students/export', {
      responseType: 'blob',
    });
  },
};
