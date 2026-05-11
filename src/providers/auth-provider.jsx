import { useEffect, createContext, useContext, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { apiRequest, clearStoredAuth, getStoredToken, setStoredTokens, setStoredUserId } from '@/lib/api-client'
import { decodeJwt } from '@/lib/utils'
import { API_ENDPOINTS } from '@/config/api'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const { logout: storeLogout, token, isAuthenticated, roles } = useAuthStore()
  const [isLoading, setIsLoading] = useState(!token ? false : !useAuthStore.getState().user)

  const needsProfile = isAuthenticated && !roles.some(r => ['INVESTOR', 'CREATOR', 'ADMIN'].includes(r))

  const fetchUser = useCallback(async () => {
    try {
      const user = await apiRequest(API_ENDPOINTS.USER_ME)
      useAuthStore.setState({
        user,
        roles: user.roles || [],
        permissions: user.permissions || [],
      })
      return user
    } catch {
      storeLogout()
      navigate('/')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [storeLogout, navigate])

  useEffect(() => {
    const storedToken = getStoredToken()
    if (storedToken && !token) {
      setIsLoading(true)
      const payload = decodeJwt(storedToken)
      if (payload) {
        useAuthStore.setState({
          token: storedToken,
          isAuthenticated: true,
        })
      }
    }
  }, [token])

  useEffect(() => {
    if (isAuthenticated && !useAuthStore.getState().user) {
      fetchUser()
    } else if (isAuthenticated && useAuthStore.getState().user) {
      setIsLoading(false)
    }
  }, [isAuthenticated, fetchUser])

  const login = async (data) => {
    const res = await apiRequest(API_ENDPOINTS.AUTH_LOGIN, {
      method: 'POST',
      body: data,
    })

    setStoredTokens(res.accessToken, res.refreshToken)
    setStoredUserId(res.userId)

    useAuthStore.setState({
      token: res.accessToken,
      refreshToken: res.refreshToken,
      isAuthenticated: true,
      roles: res.roles,
      permissions: res.permissions,
    })

    await fetchUser()
  }

  const register = async (data) => {
    await apiRequest(API_ENDPOINTS.AUTH_REGISTER, {
      method: 'POST',
      body: data,
    })
  }

  const logout = useCallback(() => {
    clearStoredAuth()
    storeLogout()
    navigate('/')
  }, [storeLogout, navigate])

  return (
    <AuthContext.Provider value={{ login, register, logout, isLoading, needsProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
