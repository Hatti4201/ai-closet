import axios from 'axios';
import { AuthResponse, User } from '../types/user';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  register: (data: { name: string; email: string; password: string }): Promise<AuthResponse> =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }): Promise<AuthResponse> =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  getMe: (): Promise<User> =>
    api.get<User>('/auth/me').then((r) => r.data),
};

export default api;
