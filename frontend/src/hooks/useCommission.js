import { useQuery } from '@tanstack/react-query';
import { getMyCommissions, getMyCommissionStats } from '../api/commission';

export const useMyCommissions = () => {
  return useQuery({
    queryKey: ['myCommissions'],
    queryFn: getMyCommissions,
  });
};

export const useMyCommissionStats = () => {
  return useQuery({
    queryKey: ['myCommissionStats'],
    queryFn: getMyCommissionStats,
  });
};

