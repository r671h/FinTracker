import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('fintrack_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 — clear storage but do NOT redirect here.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const isLoginAttempt = err.config?.url?.includes('/auth/login');
      if (!isLoginAttempt) {
        localStorage.removeItem('fintrack_token');
        localStorage.removeItem('fintrack_user');
      }
    }
    return Promise.reject(err);
  }
);

//Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string; currency?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateMe: (data: object) => api.patch('/auth/me', data),
};

//Accounts
export const accountsApi = {
  list: () => api.get('/accounts'),
  get: (id: string) => api.get(`/accounts/${id}`),
  create: (data: object) => api.post('/accounts', data),
  update: (id: string, data: object) => api.put(`/accounts/${id}`, data),
  delete: (id: string) => api.delete(`/accounts/${id}`),
  stats: (id: string) => api.get(`/accounts/${id}/stats`),
};

//Transactions 
export const transactionsApi = {
  list: (params?: object) => api.get('/transactions', { params }),
  stats: (params?: object) => api.get('/transactions/stats', { params }),
  create: (data: object) => api.post('/transactions', data),
  import: (formData: FormData) =>
    api.post('/transactions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: string, data: object) => api.put(`/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
};

//AI 
export const aiApi = {
  chat: (message: string, history: { role: string; content: string }[]) =>
    api.post('/ai/analyse', { message, history }),
};

export default api;