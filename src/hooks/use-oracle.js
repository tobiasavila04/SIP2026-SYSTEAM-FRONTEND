import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'

export const oracleKeys = {
  report: (id) => ['oracle', 'report', id],
}

export function useOracleReport(projectId) {
  return useQuery({
    queryKey: oracleKeys.report(projectId),
    queryFn: () => apiRequest(API_ENDPOINTS.ORACLE_REPORT(projectId)),
    enabled: !!projectId,
    retry: false,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSubmitOracleReport(projectId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) =>
      apiRequest(API_ENDPOINTS.ORACLE_SUBMIT(projectId), {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: oracleKeys.report(projectId) })
    },
  })
}
