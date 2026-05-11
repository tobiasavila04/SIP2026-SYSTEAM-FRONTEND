// Configuración centralizada de endpoints del API
const isDev = import.meta.env.DEV;
const API_BASE_URL = isDev ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:8080');
const PROJECT_API_BASE = isDev ? '' : (import.meta.env.VITE_PROJECT_API_URL || 'http://localhost:8081');

const buildUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;
const buildProjectUrl = (endpoint) => `${PROJECT_API_BASE}${endpoint}`;

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
  PERMISSION_BY_ID: (id) => buildUrl(`/api/permissions/${id}`),
  
  PROJECTS: buildProjectUrl('/api/projects'),
  PROJECT_BY_ID: (id) => buildProjectUrl(`/api/projects/${id}`),
  PROJECTS_CATALOG: buildProjectUrl('/api/projects/catalog'),
  PROJECTS_MY: buildProjectUrl('/api/projects/my-projects'),
  PROJECT_INVEST: (id) => buildProjectUrl(`/api/projects/${id}/invest`),
  PROJECT_STATUS: (id) => buildProjectUrl(`/api/projects/${id}/status`),
  PROJECT_FINANCING_PROGRESS: (id) => buildProjectUrl(`/api/projects/${id}/financing-progress`),
  PROJECT_SMART_CONTRACT: (id) => buildProjectUrl(`/api/projects/${id}/smart-contract`),
  PROJECT_EVALUATE_STATES: buildProjectUrl('/api/projects/evaluate-states'),

  WALLET_SUMMARY: buildUrl('/api/wallet/summary'),

  DASHBOARD_STATS: buildProjectUrl('/api/dashboard/stats'),
};

