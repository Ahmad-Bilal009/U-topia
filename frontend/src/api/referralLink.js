import apiClient from './client';

export const generateReferralLink = async (baseUrl) => {
  const response = await apiClient.post('/api/referral/generate', { baseUrl });
  return response.data;
};

export const validateReferralCode = async (code) => {
  const response = await apiClient.get(`/api/referral/validate/${code}`);
  return response.data;
};

export const trackReferralClick = async (code) => {
  const response = await apiClient.get(`/api/referral/track/${code}`);
  return response.data;
};

