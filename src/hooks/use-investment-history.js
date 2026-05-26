import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'

export function useInvestmentHistory() {
  return useQuery({
    queryKey: ['wallet', 'history'],
    queryFn: () => apiRequest(API_ENDPOINTS.WALLET_HISTORY),
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
}
