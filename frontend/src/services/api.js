import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('careercatalyst_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthenticated responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
        localStorage.removeItem('careercatalyst_token');
        localStorage.removeItem('careercatalyst_user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login?expired=1';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Profile endpoints
export const profileService = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
};

// Preparation endpoints (Phase 1)
export const prepService = {
  generate: (data) => api.post('/preparation/generate', data, { timeout: 90000 }),
  getAll: () => api.get('/preparation'),
  getById: (id) => api.get(`/preparation/${id}`),
  delete: (id) => api.delete(`/preparation/${id}`),
  getScripts: (prepId) => api.get(`/preparation/${prepId}/scripts`),
  updateScriptStatus: (scriptId, data) => api.patch(`/preparation/scripts/${scriptId}`, data),
  getSummary: () => api.get('/preparation/summary'),
};

// Interview endpoints (Phase 2)
export const interviewService = {
  start: (data) => api.post('/interviews/start', data),
  getAll: () => api.get('/interviews'),
  getById: (id) => api.get(`/interviews/${id}`),
  submitAnswer: (sessionId, data) => api.post(`/interviews/${sessionId}/answer`, data),
  finish: (sessionId) => api.post(`/interviews/${sessionId}/finish`),
  delete: (sessionId) => api.delete(`/interviews/${sessionId}`),
  getSummaryStats: () => api.get('/interviews/stats/summary'),
};

// Reports endpoints (Phase 2)
export const reportService = {
  getAll: () => api.get('/reports'),
  getById: (sessionId) => api.get(`/reports/${sessionId}`),
};

// Audio endpoints (Phase 2)
export const audioService = {
  transcribe: (formData) => api.post('/audio/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  analyze: (data) => api.post('/audio/analyze', data),
};

export default api;
