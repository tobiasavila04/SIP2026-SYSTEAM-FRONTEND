// Configuración centralizada de endpoints del API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Función helper para construir URLs dinámicas
const buildUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: buildUrl('/auth/login'),
  AUTH_REGISTER: buildUrl('/auth/register'),
  AUTH_CHANGE_PASSWORD: buildUrl('/auth/change-password'),
  
  // Users
  USERS: buildUrl('/api/users'),
  USER_ME: buildUrl('/api/users/me'),
  USER_BY_ID: (id) => buildUrl(`/api/users/${id}`),
  USER_ROLE: (userId, roleId) => buildUrl(`/api/users/${userId}/roles/${roleId}`),
  
  // Roles
  ROLES: buildUrl('/api/roles'),
  ROLE_BY_ID: (id) => buildUrl(`/api/roles/${id}`),
  ROLE_PERMISSION: (roleId, permissionId) => buildUrl(`/api/roles/${roleId}/permissions/${permissionId}`),
  
  // Permissions
  PERMISSIONS: buildUrl('/api/permissions'),
};

export const API_BASE = API_BASE_URL;
