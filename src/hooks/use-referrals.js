import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'

export const referralKeys = {
  myLink: () => ['referrals', 'my-link'],
  stats: () => ['referrals', 'stats'],
}

export function useMyReferralLink() {
  return useQuery({
    queryKey: referralKeys.myLink(),
    queryFn: () => apiRequest(API_ENDPOINTS.REFERRALS_MY_LINK),
    staleTime: Infinity,
  })
}

export function useReferralStats() {
  return useQuery({
    queryKey: referralKeys.stats(),
    queryFn: () => apiRequest(API_ENDPOINTS.REFERRALS_STATS),
    staleTime: 60_000,
  })
}

export function useRedeemReferral() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code) => apiRequest(API_ENDPOINTS.REFERRALS_REDEEM, { method: 'POST', body: { code } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralKeys.stats() })
    },
  })
}
