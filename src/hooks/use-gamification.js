import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'

export function useGamification() {
  return useQuery({
    queryKey: ['gamification'],
    queryFn: () => apiRequest(API_ENDPOINTS.USER_GAMIFICATION),
  })
}

export function useGamificationNFTs() {
  return useQuery({
    queryKey: ['gamification-nfts'],
    queryFn: () => apiRequest(`${API_ENDPOINTS.USER_GAMIFICATION}/nfts`),
  })
}
