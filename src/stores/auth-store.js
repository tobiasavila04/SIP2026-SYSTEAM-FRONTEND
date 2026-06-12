import { create } from 'zustand'
import { STORAGE_KEYS } from '@/lib/api-client'

const { TOKEN, REFRESH_TOKEN, USER_ID } = STORAGE_KEYS

export const useAuthStore = create((set) => ({
  token: sessionStorage.getItem(TOKEN),
  refreshToken: sessionStorage.getItem(REFRESH_TOKEN),
  user: null,
  isAuthenticated: !!sessionStorage.getItem(TOKEN),
  roles: [],
  permissions: [],

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  hasSyncedWallet: false,
  setWalletSynced: () => set({ hasSyncedWallet: true }),

  setAuth: (token, refreshToken, user, roles, permissions) => {
    sessionStorage.setItem(TOKEN, token)
    sessionStorage.setItem(REFRESH_TOKEN, refreshToken)
    sessionStorage.setItem(USER_ID, String(user.id))
    set({ token, refreshToken, user, isAuthenticated: true, roles, permissions })
  },

  setUser: (user) => set({ user }),

  setTokens: (token, refreshToken) => {
    sessionStorage.setItem(TOKEN, token)
    sessionStorage.setItem(REFRESH_TOKEN, refreshToken)
    set({ token, refreshToken })
  },

  logout: () => {
    sessionStorage.removeItem(TOKEN)
    sessionStorage.removeItem(REFRESH_TOKEN)
    sessionStorage.removeItem(USER_ID)
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false, roles: [], permissions: [], hasSyncedWallet: false })
  },
}))

export function usePermissions() {
  const roles = useAuthStore((s) => s.roles)
  const permissions = useAuthStore((s) => s.permissions)

  const isAdmin = roles.includes('ADMIN')
  const isCreator = roles.includes('CREATOR')
  const isInvestor = roles.includes('INVESTOR')
  const isAuditor = roles.includes('AUDITOR')

  const can = (permission) => permissions.includes(permission)

  return { isAdmin, isCreator, isInvestor, isAuditor, can, roles, permissions }
}
