import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 and 404 on profile endpoint
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isProfileEndpoint = error.config?.url?.includes('/auth/profile');
    if (error.response?.status === 401 || (isProfileEndpoint && error.response?.status === 404)) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  getProfile: () => api.get('/auth/profile'),
};

// Resorts API
export const resortsAPI = {
  getAll: (filters = {}) => api.get('/resorts', { params: filters }),
  getById: (idOrSlug) => api.get(`/resorts/${idOrSlug}`),
  getBySlug: (slug) => api.get(`/resorts/${slug}`),
  create: (data) => api.post('/resorts', data),
  update: (id, data) => api.put(`/resorts/${id}`, data),
  delete: (id) => api.delete(`/resorts/${id}`),
};

export default api;
