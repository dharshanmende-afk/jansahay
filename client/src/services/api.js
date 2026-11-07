import axios from 'axios';

const resolveBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  const clean = envUrl.trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jansahay_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to unwrap data and handle 401 with automatic token refresh
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('jansahay_refresh_token');
      if (refreshToken && !originalRequest.url.includes('/auth/login') && !originalRequest.url.includes('/auth/refresh')) {
        originalRequest._retry = true;
        try {
          const res = await axios.post(`${resolveBaseUrl()}/auth/refresh`, { refreshToken });
          if (res.data?.success && res.data?.data?.token) {
            localStorage.setItem('jansahay_token', res.data.data.token);
            if (res.data.data.refreshToken) {
              localStorage.setItem('jansahay_refresh_token', res.data.data.refreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${res.data.data.token}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem('jansahay_token');
          localStorage.removeItem('jansahay_refresh_token');
          localStorage.removeItem('jansahay_user');
        }
      } else {
        localStorage.removeItem('jansahay_token');
        localStorage.removeItem('jansahay_refresh_token');
        localStorage.removeItem('jansahay_user');
      }
    }
    return Promise.reject(error.response ? error.response.data : error);
  }
);

// Modular API services
export const authService = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    if (res.data?.token) {
      localStorage.setItem('jansahay_token', res.data.token);
      if (res.data.refreshToken) {
        localStorage.setItem('jansahay_refresh_token', res.data.refreshToken);
      }
    }
    return res;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data?.token) {
      localStorage.setItem('jansahay_token', res.data.token);
      if (res.data.refreshToken) {
        localStorage.setItem('jansahay_refresh_token', res.data.refreshToken);
      }
    }
    return res;
  },
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  quickLogin: async (role) => {
    const res = await api.post('/auth/quick-login', { role });
    if (res.data?.token) {
      localStorage.setItem('jansahay_token', res.data.token);
      if (res.data.refreshToken) {
        localStorage.setItem('jansahay_refresh_token', res.data.refreshToken);
      }
    }
    return res;
  },
  getMe: () => api.get('/auth/me')
};

export const profileService = {
  getProfile: () => api.get('/profile'),
  saveProfile: (data) => api.post('/profile', data),
  checkExists: () => api.get('/profile/exists')
};

export const schemeService = {
  getSchemes: (params) => api.get('/schemes', { params }),
  getSchemeById: (id) => api.get(`/schemes/${id}`),
  getSchemeDocuments: (id) => api.get(`/schemes/${id}/documents`),
  getSchemeDocumentReadiness: (id) => api.get(`/schemes/${id}/document-readiness`),
  getApplicationGuide: (id) => api.get(`/schemes/${id}/application-guide`)
};

export const recommendationService = {
  getRecommendations: () => api.get('/recommendations'),
  generateRecommendations: () => api.post('/recommendations/generate')
};

export const documentService = {
  getUserDocuments: () => api.get('/documents'),
  updateStatus: (data) => api.put('/documents/status', data),
  updateSchemeChecklist: (schemeId, data) => api.put(`/documents/checklists/${schemeId}`, data),
  getPreparationDashboard: () => api.get('/documents/preparation-dashboard')
};

export const documentGuideService = {
  getGuides: (params) => api.get('/documents/guides', { params }),
  getGuideById: (id) => api.get(`/documents/guides/${id}`),
  getGuideByType: (type, state) => api.get(`/documents/guides/by-type/${type}`, { params: { state } })
};

export const aiService = {
  chat: (data) => api.post('/ai/chat', data),
  explainScheme: (id, language) => api.post(`/ai/explain/${id}`, { language })
};

export const updateService = {
  getUpdates: () => api.get('/updates'),
  getLiveTicker: () => api.get('/realtime/live-ticker'),
  syncLive: () => api.post('/realtime/sync'),
  fetchGovSchemes: () => api.post('/realtime/fetch-government-schemes'),
  getLiveSchemes: (keyword) => api.get(`/realtime/live-schemes?keyword=${keyword || 'scholarship'}`),
  getLivePIBUpdates: () => api.get('/realtime/live-pib-updates')
};

export const adminService = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  getSchemes: () => api.get('/admin/schemes'),
  createScheme: (data) => api.post('/admin/schemes', data),
  updateScheme: (id, data) => api.put(`/admin/schemes/${id}`, data),
  deleteScheme: (id) => api.delete(`/admin/schemes/${id}`),
  getDocumentGuides: () => api.get('/admin/document-guides'),
  createDocumentGuide: (data) => api.post('/admin/document-guides', data),
  updateDocumentGuide: (id, data) => api.put(`/admin/document-guides/${id}`, data),
  verifyDocumentGuide: (id, status) => api.put(`/admin/document-guides/${id}/verify`, { status }),
  publishDocumentGuide: (id, status) => api.put(`/admin/document-guides/${id}/publish`, { status }),
  deleteDocumentGuide: (id) => api.delete(`/admin/document-guides/${id}`)
};

export default api;
