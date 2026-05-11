import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import { toast } from 'sonner'

export const permissionKeys = {
  all: ['permissions'],
}

export function usePermissions() {
  return useQuery({
    queryKey: permissionKeys.all,
    queryFn: () => apiRequest(API_ENDPOINTS.PERMISSIONS),
  })
}

export function useCreatePermission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) =>
      apiRequest(API_ENDPOINTS.PERMISSIONS, { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.all })
      toast.success('Permiso creado exitosamente')
    },
  })
}

export function useUpdatePermission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) =>
      apiRequest(API_ENDPOINTS.PERMISSION_BY_ID(id), { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.all })
      toast.success('Permiso actualizado exitosamente')
    },
  })
}

export function useDeletePermission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) =>
      apiRequest(API_ENDPOINTS.PERMISSION_BY_ID(id), { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.all })
      toast.success('Permiso eliminado exitosamente')
    },
  })
}
