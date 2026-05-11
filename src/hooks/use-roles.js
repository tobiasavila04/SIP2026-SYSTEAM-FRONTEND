import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import { toast } from 'sonner'

export const roleKeys = {
  all: ['roles'],
  details: () => [...roleKeys.all, 'detail'],
  detail: (id) => [...roleKeys.details(), id],
}

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.all,
    queryFn: () => apiRequest(API_ENDPOINTS.ROLES),
  })
}

export function useRole(id) {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: () => apiRequest(API_ENDPOINTS.ROLE_BY_ID(id)),
    enabled: !!id,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) =>
      apiRequest(API_ENDPOINTS.ROLES, { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all })
      toast.success('Rol creado exitosamente')
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) =>
      apiRequest(API_ENDPOINTS.ROLE_BY_ID(id), { method: 'PUT', body: data }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: roleKeys.all })
      toast.success('Rol actualizado exitosamente')
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) =>
      apiRequest(API_ENDPOINTS.ROLE_BY_ID(id), { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all })
      toast.success('Rol eliminado exitosamente')
    },
  })
}

export function useAssignPermission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, permissionId }) =>
      apiRequest(API_ENDPOINTS.ROLE_PERMISSION(roleId, permissionId), { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all })
      toast.success('Permiso asignado al rol')
    },
  })
}

export function useRevokePermission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, permissionId }) =>
      apiRequest(API_ENDPOINTS.ROLE_PERMISSION(roleId, permissionId), { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all })
      toast.success('Permiso removido del rol')
    },
  })
}
