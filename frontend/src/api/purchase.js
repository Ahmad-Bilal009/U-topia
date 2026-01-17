import apiClient from './client';

export const recordPurchase = async (amount, description) => {
  const response = await apiClient.post('/api/purchase', {
    amount,
    description,
  });
  return response.data;
};

