import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'

export const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  list: (page, search) => [...userKeys.lists(), page, search],
  details: () => [...userKeys.all, 'detail'],
  detail: (id) => [...userKeys.details(), id],
  me: () => [...userKeys.all, 'me'],
}

export function useUsers(page = 0, search = '') {
  return useQuery({
    queryKey: userKeys.list(page, search),
    queryFn: () =>
      apiRequest(API_ENDPOINTS.USERS, {
        params: { page, size: 10, search, sort: 'createdAt,desc' },
      }),
  })
}

export function useUser(id) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => apiRequest(API_ENDPOINTS.USER_BY_ID(id)),
    enabled: !!id,
  })
}

export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: () => apiRequest(API_ENDPOINTS.USER_ME),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) =>
      apiRequest(API_ENDPOINTS.USERS, {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  })
}

export function useUpdateUser(id) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) =>
      apiRequest(API_ENDPOINTS.USER_BY_ID(id), {
        method: 'PUT',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) =>
      apiRequest(API_ENDPOINTS.USER_BY_ID(id), { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  })
}

export function useUpdateUserPartial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }) =>
      apiRequest(API_ENDPOINTS.USER_BY_ID(id), {
        method: 'PUT',
        body: data,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  })
}

export function useAssignRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, roleId }) =>
      apiRequest(API_ENDPOINTS.USER_ROLE(userId, roleId), { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  })
}

export function useRevokeRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, roleId }) =>
      apiRequest(API_ENDPOINTS.USER_ROLE(userId, roleId), { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  })
}
