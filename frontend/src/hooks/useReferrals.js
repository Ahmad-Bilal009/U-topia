import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getReferrals,
  getReferralStats,
  createReferral,
} from '../api/referrals';

export const useReferrals = () => {
  return useQuery({
    queryKey: ['referrals'],
    queryFn: getReferrals,
  });
};

export const useReferralStats = () => {
  return useQuery({
    queryKey: ['referralStats'],
    queryFn: getReferralStats,
  });
};

export const useCreateReferral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReferral,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['referralStats'] });
    },
  });
};

