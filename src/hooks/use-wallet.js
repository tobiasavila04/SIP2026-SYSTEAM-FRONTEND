import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'

export function useWalletSummary() {
  return useQuery({
    queryKey: ['wallet', 'summary'],
    queryFn: () => apiRequest(API_ENDPOINTS.WALLET_SUMMARY),
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
}
