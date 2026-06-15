import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'

export const auditKeys = {
  findings: (id) => ['audit-findings', id],
}

export function useFindings(projectId) {
  return useQuery({
    queryKey: auditKeys.findings(projectId),
    queryFn: () => apiRequest(API_ENDPOINTS.PROJECT_AUDIT(projectId)),
    enabled: !!projectId,
    retry: false,
    staleTime: 1000 * 60 * 2,
  })
}

export function useSubmitFinding(projectId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) =>
      apiRequest(API_ENDPOINTS.PROJECT_AUDIT(projectId), {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: auditKeys.findings(projectId) })
    },
  })
}
