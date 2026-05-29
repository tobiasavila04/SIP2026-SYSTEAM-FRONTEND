const STORAGE_KEYS = {
  TOKEN: 'tokenIDEAFY',
  REFRESH_TOKEN: 'refreshTokenIDEAFY',
  USER_ID: 'userIdIDEAFY',
}

export function getStoredToken() {
  return sessionStorage.getItem(STORAGE_KEYS.TOKEN)
}

export function getStoredRefreshToken() {
  return sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
}

export function setStoredTokens(accessToken, refreshToken) {
  sessionStorage.setItem(STORAGE_KEYS.TOKEN, accessToken)
  sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
}

export function setStoredUserId(userId) {
  sessionStorage.setItem(STORAGE_KEYS.USER_ID, String(userId))
}

export function clearStoredAuth() {
  sessionStorage.removeItem(STORAGE_KEYS.TOKEN)
  sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  sessionStorage.removeItem(STORAGE_KEYS.USER_ID)
}

class ApiClientError extends Error {
  constructor(message, status, fieldErrors) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

import { API_ENDPOINTS } from '@/config/api'

let isRefreshing = false
let refreshPromise = null

async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) return null

  try {
    const response = await fetch(API_ENDPOINTS.AUTH_REFRESH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      clearStoredAuth()
      return null
    }

    const data = await response.json()
    setStoredTokens(data.accessToken, data.refreshToken)
    return data.accessToken
  } catch {
    clearStoredAuth()
    return null
  }
}

export async function apiRequest(url, options = {}) {
  const token = getStoredToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const queryParams = options.params
    ? '?' + Object.entries(options.params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : ''

  const response = await fetch(`${url}${queryParams}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 401 && token) {
    if (!isRefreshing) {
      isRefreshing = true
      refreshPromise = refreshAccessToken()
    }

    const newToken = await refreshPromise
    isRefreshing = false
    refreshPromise = null

    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`
      const retryResponse = await fetch(`${url}${queryParams}`, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      })

      if (!retryResponse.ok) {
        const retryError = await parseErrorResponse(retryResponse)
        throw retryError
      }

      return parseJsonResponse(retryResponse)
    }

    clearStoredAuth()
    throw new ApiClientError('Sesión expirada', 401)
  }

  if (!response.ok) {
    const error = await parseErrorResponse(response)
    throw error
  }

  return parseJsonResponse(response)
}

async function parseJsonResponse(response) {
  if (response.status === 204) return undefined
  const text = await response.text()
  if (!text) return undefined
  return JSON.parse(text)
}

async function parseErrorResponse(response) {
  try {
    const body = await response.json()
    if (typeof body === 'object' && body !== null) {
      const hasFieldErrors = Object.values(body).some(v => typeof v === 'string')
      if (hasFieldErrors && !body.error) {
        return new ApiClientError('Error de validación', response.status, body)
      }
      return new ApiClientError(body.error || 'Error desconocido', response.status)
    }
  } catch {}
  return new ApiClientError(`Error ${response.status}`, response.status)
}

export { ApiClientError, STORAGE_KEYS }
