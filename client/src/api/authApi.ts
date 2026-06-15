import axios from 'axios';

// Base axios instance — no auth (backend MVP has no auth)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api',
});

export default api;
