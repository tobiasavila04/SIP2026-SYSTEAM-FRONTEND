import { useEffect, createContext, useContext, useCallback, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { apiRequest, clearStoredAuth, getStoredToken, setStoredTokens, setStoredUserId } from '@/lib/api-client'
import { decodeJwt } from '@/lib/utils'
import { API_ENDPOINTS } from '@/config/api'
import { useDisconnect } from 'wagmi'

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
  const { disconnect } = useDisconnect()

  const needsProfile = isAuthenticated && !roles.some(r => ['INVESTOR', 'CREATOR', 'ADMIN'].includes(r))

  const fetchUserRef = useRef(0)

  const fetchUser = useCallback(async () => {
    const version = ++fetchUserRef.current
    try {
      const user = await apiRequest(API_ENDPOINTS.USER_ME)
      if (version !== fetchUserRef.current) return null
      useAuthStore.setState({
        user,
        roles: user.roles || [],
        permissions: user.permissions || [],
      })
      return user
    } catch {
      if (version !== fetchUserRef.current) return null
      storeLogout()
      navigate('/')
      return null
    } finally {
      if (version === fetchUserRef.current) {
        setIsLoading(false)
      }
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
    // Invalidate any in-flight fetchUser calls
    ++fetchUserRef.current

    const res = await apiRequest(API_ENDPOINTS.AUTH_LOGIN, {
      method: 'POST',
      body: data,
    })

    setStoredTokens(res.accessToken, res.refreshToken)
    setStoredUserId(res.userId)

    let userData
    try {
      userData = await apiRequest(API_ENDPOINTS.USER_ME)
    } catch {
      userData = { id: res.userId, email: res.email, name: res.email.split('@')[0], roles: res.roles, permissions: res.permissions, enabled: true }
    }

    useAuthStore.setState({
      token: res.accessToken,
      refreshToken: res.refreshToken,
      isAuthenticated: true,
      user: userData,
      roles: userData.roles || [],
      permissions: userData.permissions || [],
    })
  }

  const register = async (data) => {
    await apiRequest(API_ENDPOINTS.AUTH_REGISTER, {
      method: 'POST',
      body: data,
    })
  }

  const logout = useCallback(() => {
    try {
      disconnect()
    } catch (e) {
      console.warn('Wagmi disconnect failed:', e)
    }
    clearStoredAuth()
    storeLogout()
    navigate('/')
  }, [storeLogout, navigate, disconnect])

  return (
    <AuthContext.Provider value={{ login, register, logout, isLoading, needsProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
