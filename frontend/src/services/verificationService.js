import api from './api';

/**
 * Verification Service - Quản lý xác nhận điểm danh
 */

// Get pending verification list
export const getPendingVerifications = async (params = {}) => {
  try {
    const response = await api.get('/attendances/pending-verification', { params });
    return response;
  } catch (error) {
    throw error;
  }
};

// Approve attendance
export const approveAttendance = async (id, note = '') => {
  try {
    const response = await api.put(`/attendances/${id}/verify`, { 
      verificationStatus: 'approved',
      notes: note
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Reject attendance
export const rejectAttendance = async (id, note) => {
  try {
    const response = await api.put(`/attendances/${id}/verify`, { 
      verificationStatus: 'rejected',
      notes: note
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Get verification statistics
export const getVerificationStats = async (eventId = null) => {
  try {
    const params = eventId ? { eventId } : {};
    const response = await api.get('/attendances/verification-stats', { params });
    return response;
  } catch (error) {
    throw error;
  }
};

// Get leaderboard
export const getLeaderboard = async (limit = 50) => {
  try {
    const response = await api.get('/attendances/leaderboard', { 
      params: { limit } 
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Get student points detail
export const getStudentPoints = async (studentId) => {
  try {
    const response = await api.get(`/attendances/student/${studentId}/points`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Helper: Get photo URL
export const getPhotoUrl = (filename) => {
  if (!filename) return null;
  const baseURL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  
  // Check if filename already contains full path (starts with /uploads/evidence/)
  if (filename.startsWith('/uploads/evidence/')) {
    return `${baseURL}${filename}`;
  }
  
  // Otherwise, add the prefix
  return `${baseURL}/uploads/evidence/${filename}`;
};

export default {
  getPendingVerifications,
  approveAttendance,
  rejectAttendance,
  getVerificationStats,
  getLeaderboard,
  getStudentPoints,
  getPhotoUrl
};
