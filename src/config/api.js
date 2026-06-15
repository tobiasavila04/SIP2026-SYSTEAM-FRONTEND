// Configuración centralizada de endpoints del API
const isDev = import.meta.env.DEV;
const API_BASE_URL = isDev
  ? ""
  : import.meta.env.VITE_API_URL || "http://localhost:8080";
const PROJECT_API_BASE = isDev
  ? ""
  : import.meta.env.VITE_PROJECT_API_URL || "http://localhost:8081";

const buildUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;
const buildProjectUrl = (endpoint) => `${PROJECT_API_BASE}${endpoint}`;

// --- Token Storage (usado por refresh en api.js, app usa api-client.js) ---
const ACCESS_TOKEN_KEY = "systeam_access_token";
const REFRESH_TOKEN_KEY = "systeam_refresh_token";

export const saveTokens = (accessToken, refreshToken) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("userIdIDEAFY");
};

// --- Endpoints ---
export const API_ENDPOINTS = {
  AUTH_LOGIN: buildUrl("/auth/login"),
  AUTH_REGISTER: buildUrl("/auth/register"),
  AUTH_REFRESH: buildUrl("/auth/refresh"),
  AUTH_CHANGE_PASSWORD: buildUrl("/auth/change-password"),

  USERS: buildUrl("/api/users"),
  USER_ME: buildUrl("/api/users/me"),
  USER_BY_ID: (id) => buildUrl(`/api/users/${id}`),
  USER_ROLE: (userId, roleId) =>
    buildUrl(`/api/users/${userId}/roles/${roleId}`),

  ROLES: buildUrl("/api/roles"),
  ROLE_BY_ID: (id) => buildUrl(`/api/roles/${id}`),
  ROLE_PERMISSION: (roleId, permissionId) =>
    buildUrl(`/api/roles/${roleId}/permissions/${permissionId}`),

  PERMISSIONS: buildUrl("/api/permissions"),
  PERMISSION_BY_ID: (id) => buildUrl(`/api/permissions/${id}`),

  PROJECTS: buildProjectUrl("/api/projects"),
  PROJECT_BY_ID: (id) => buildProjectUrl(`/api/projects/${id}`),
  PROJECTS_CATALOG: buildProjectUrl("/api/projects/catalog"),
  PROJECTS_MY: buildProjectUrl("/api/projects/my-projects"),
  PROJECT_STATUS: (id) => buildProjectUrl(`/api/projects/${id}/status`),
  PROJECT_FINANCING_PROGRESS: (id) => buildProjectUrl(`/api/projects/${id}/financing-progress`),
  PROJECT_SMART_CONTRACT: (id) => buildProjectUrl(`/api/projects/${id}/smart-contract`),
  PROJECT_AUDIT: (id) => buildProjectUrl(`/api/projects/${id}/audit`),
  PROJECT_EVALUATE_STATES: buildProjectUrl('/api/projects/evaluate-states'),
  PROJECT_CLOSE: (id) => buildProjectUrl(`/api/projects/${id}/close`),
  PROJECT_BOOST: (id) => buildProjectUrl(`/api/projects/${id}/boost`),
  PROJECT_DESBOOST: (id) => buildProjectUrl(`/api/projects/${id}/desboost`),

  INVESTMENTS: buildProjectUrl("/api/investments"),
  INVESTMENTS_VALIDATE: buildProjectUrl("/api/investments/validate"),
  INVESTMENT_BY_ID: (id) => buildProjectUrl(`/api/investments/${id}`),
  INVESTMENTS_HISTORY: buildProjectUrl("/api/investments/history"),
  INVESTMENTS_PROJECT: (id) =>
    buildProjectUrl(`/api/investments/project/${id}`),
  INVESTMENT_REFUND: (id) => buildProjectUrl(`/api/investments/${id}/refund`),

  TOKENS: buildProjectUrl("/api/tokens"),
  TOKEN_BY_PROJECT: (id) => buildProjectUrl(`/api/tokens/${id}`),
  TOKEN_PRICE: (id) => buildProjectUrl(`/api/tokens/${id}/precio`),

  WALLET_SUMMARY: buildProjectUrl("/api/wallet/summary"),
  WALLET_SYNC_IDEA: buildProjectUrl("/api/wallet/sync-idea"),
  WALLET_HISTORY: buildProjectUrl("/api/investments/history"),
  WALLET_MOVEMENT_HISTORY: buildProjectUrl("/api/wallet/history"),

  GOVERNANCE_PROPOSALS: buildProjectUrl("/api/governance/proposals"),
  GOVERNANCE_PROPOSAL: (id) =>
    buildProjectUrl(`/api/governance/proposals/${id}`),
  GOVERNANCE_VOTE: buildProjectUrl("/api/governance/vote"),
  GOVERNANCE_COUNT: buildProjectUrl("/api/governance/count"),

  MARKETPLACE_LISTINGS: buildProjectUrl("/api/marketplace/listings"),
  MARKETPLACE_LISTING: (id) =>
    buildProjectUrl(`/api/marketplace/listings/${id}`),
  MARKETPLACE_LISTINGS_BY_SUBTOKEN: (id) =>
    buildProjectUrl(`/api/marketplace/listings/by-subtoken/${id}`),
  MARKETPLACE_QUOTE: buildProjectUrl("/api/marketplace/quote"),

  DIVIDENDOS_PROYECTO: (id) =>
    buildProjectUrl(`/api/dividendos/proyecto/${id}`),
  DIVIDENDOS_MIS_RECLAMOS: buildProjectUrl("/api/dividendos/mis-reclamos"),
  DIVIDENDOS_RECLAMAR: (id) =>
    buildProjectUrl(`/api/dividendos/proyecto/${id}/reclamar`),
  DIVIDENDOS_PENDIENTES: (id) =>
    buildProjectUrl(`/api/dividendos/proyecto/${id}/pendientes`),

  ORACLE_REPORT: (id) => buildProjectUrl(`/api/oracle/report/${id}`),
  ORACLE_SUBMIT: (id) => buildProjectUrl(`/api/oracle/report/${id}`),

  DASHBOARD_STATS: buildProjectUrl("/api/dashboard/stats"),
  MODULES_STATUS: buildProjectUrl("/api/modules/status"),
};

export const API_BASE = API_BASE_URL;

// --- Refresh interno (no exportado) ---
async function doRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(API_ENDPOINTS.AUTH_REFRESH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();
    saveTokens(data.accessToken, data.refreshToken);
    return data;
  } catch {
    return null;
  }
}

// --- Cliente HTTP central ---
export const apiRequest = async (url, options = {}, _retry = false) => {
  const token = getAccessToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 && !_retry) {
    const newTokens = await doRefresh();

    if (!newTokens) {
      window.location.href = "/";
      return null;
    }

    return apiRequest(url, options, true);
  }

  return response.json();
};
