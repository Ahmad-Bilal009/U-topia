import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateReferralLink, validateReferralCode, trackReferralClick } from '../api/referralLink';

export const useGenerateReferralLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (baseUrl) => generateReferralLink(baseUrl || window.location.origin),
    onSuccess: () => {
      // Invalidate both referral stats and referrals to refresh data
      queryClient.invalidateQueries({ queryKey: ['referralStats'] });
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
    },
  });
};

export const useValidateReferralCode = (code) => {
  return useQuery({
    queryKey: ['referralCode', code],
    queryFn: () => validateReferralCode(code),
    enabled: !!code,
  });
};

export const useTrackReferralClick = () => {
  return useMutation({
    mutationFn: trackReferralClick,
  });
};

