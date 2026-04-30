// Configuración centralizada de endpoints del API
const isDev = import.meta.env.DEV;
const API_BASE_URL = isDev ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:8080');

const buildUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

export const API_ENDPOINTS = {
  AUTH_LOGIN: buildUrl('/auth/login'),
  AUTH_REGISTER: buildUrl('/auth/register'),
  AUTH_CHANGE_PASSWORD: buildUrl('/auth/change-password'),
  
  USERS: buildUrl('/api/users'),
  USER_ME: buildUrl('/api/users/me'),
  USER_BY_ID: (id) => buildUrl(`/api/users/${id}`),
  USER_ROLE: (userId, roleId) => buildUrl(`/api/users/${userId}/roles/${roleId}`),
  
  ROLES: buildUrl('/api/roles'),
  ROLE_BY_ID: (id) => buildUrl(`/api/roles/${id}`),
  ROLE_PERMISSION: (roleId, permissionId) => buildUrl(`/api/roles/${roleId}/permissions/${permissionId}`),
  
  PERMISSIONS: buildUrl('/api/permissions'),
};

export const API_BASE = API_BASE_URL;

export const apiRequest = async (url, options = {}) => {
  // 1. Buscamos el token
  const token = sessionStorage.getItem('tokenIDEAFY');
  
  // 2. Preparamos los headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // 3. Si hay token, lo metemos
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // 4. Hacemos el fetch (usamos "url" directo porque tus API_ENDPOINTS ya traen la url completa)
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // 5. Atajamos el error de Token Vencido
  if (response.status === 401) {
    console.warn('Sesión expirada o token inválido');
    sessionStorage.removeItem('tokenIDEAFY');
    window.location.href = '/';
    return null;
  }
  
  // Retornamos la respuesta en JSON
  return response.json();
};