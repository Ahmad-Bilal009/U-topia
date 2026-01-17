import apiClient from './client';

export const getReferrals = async () => {
  const response = await apiClient.get('/api/referrals');
  return response.data;
};

export const getReferralStats = async () => {
  const response = await apiClient.get('/api/referrals/stats');
  return response.data;
};

export const createReferral = async (referralCode) => {
  const response = await apiClient.post('/api/referrals', { referralCode });
  return response.data;
};

export const getReferralByCode = async (code) => {
  const response = await apiClient.get(`/api/referrals/${code}`);
  return response.data;
};

