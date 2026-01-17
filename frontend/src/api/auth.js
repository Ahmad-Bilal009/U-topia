import apiClient from './client';

export const login = async (email, password) => {
  const response = await apiClient.post('/api/auth/login', { email, password });
  return response.data;
};

export const signup = async (email, password, name, referralCode) => {
  const response = await apiClient.post('/api/auth/signup', {
    email,
    password,
    name,
    referralCode,
  });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/api/auth/me');
  return response.data;
};

export const validateReferralCode = async (code) => {
  const response = await apiClient.get(`/api/auth/validate-referral/${code}`);
  return response.data;
};

