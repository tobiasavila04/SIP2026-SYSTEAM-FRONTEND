import { useEffect, createContext, useContext, useCallback, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
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

  const queryClient = useQueryClient()
  const fetchUserRef = useRef(0)
  const checkInFiredRef = useRef(false)

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

  useEffect(() => {
    if (isAuthenticated && !checkInFiredRef.current) {
      checkInFiredRef.current = true
      apiRequest(API_ENDPOINTS.STREAK_CHECK_IN, { method: 'POST' })
        .then(() => queryClient.invalidateQueries({ queryKey: ['streak', 'me'] }))
        .catch(err => console.error('[streak] check-in failed:', err?.message ?? err))
    }
  }, [isAuthenticated, queryClient])

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

    // fire-and-forget: redeem referral if pending
    try {
      const pendingRef = localStorage.getItem('pending_referral_code')
      if (pendingRef) {
        await apiRequest(API_ENDPOINTS.REFERRALS_REDEEM, { method: 'POST', body: { code: pendingRef } })
        localStorage.removeItem('pending_referral_code')
      }
    } catch (err) {
      console.error('[referral] redeem failed:', err?.message ?? err)
    }
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
