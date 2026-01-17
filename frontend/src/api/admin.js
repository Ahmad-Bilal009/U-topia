import apiClient from './client';

export const getAllUsers = async () => {
  const response = await apiClient.get('/api/admin/users');
  return response.data;
};

export const getAllCommissions = async (params = {}) => {
  const response = await apiClient.get('/api/admin/commissions', { params });
  return response.data;
};

export const getAdminStats = async () => {
  const response = await apiClient.get('/api/admin/stats');
  return response.data;
};

export const getUserDetails = async (userId) => {
  const response = await apiClient.get(`/api/admin/user/${userId}`);
  return response.data;
};

