import axios from 'axios';
import { getWorkerUrl } from './config';

const api = axios.create({
  baseURL: getWorkerUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export const starsApi = {
  getAll: () => api.get('/api/stars'),
  getById: (id: number) => api.get(`/api/stars/${id}`),
  create: (data: any) => api.post('/api/stars', data),
  update: (id: number, data: any) => api.put(`/api/stars/${id}`, data),
  delete: (id: number) => api.delete(`/api/stars/${id}`),
};

export const photosApi = {
  getAll: (params?: { star_id?: number; page?: number; limit?: number; all?: boolean }) => 
    api.get('/api/photos', { params }),
  getById: (id: number) => api.get(`/api/photos/${id}`),
  update: (id: number, data: any) => api.put(`/api/photos/${id}`, data),
  delete: (id: number) => api.delete(`/api/photos/${id}?ids=${id}`), // Compatible with single delete
  batchDelete: (ids: number[]) => api.post('/api/photos/batch-delete', { ids }),
  batchUpload: (formData: FormData) =>
    api.post('/api/photos/batch-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  upload: (formData: FormData) =>
    api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/api/auth/login', { username, password }),
  logout: () => api.post('/api/auth/logout'),
  verify: () => api.get('/api/auth/verify'),
};

export const commentsApi = {
  getAll: () => api.get('/api/comments'),
  update: (id: number, data: any) => api.put(`/api/comments/${id}`, data),
  delete: (id: number) => api.delete(`/api/comments/${id}`),
};

export default api;
