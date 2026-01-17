import apiClient from './client';

export const getMyCommissions = async () => {
  const response = await apiClient.get('/api/commission/my-commissions');
  return response.data;
};

export const getMyCommissionStats = async () => {
  const response = await apiClient.get('/api/commission/my-stats');
  return response.data;
};

export const getUserCommissions = async (userId) => {
  const response = await apiClient.get(`/api/commission/user/${userId}`);
  return response.data;
};

export const getCommissionStats = async (userId) => {
  const response = await apiClient.get(`/api/commission/stats/${userId}`);
  return response.data;
};

