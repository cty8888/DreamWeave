import axios from 'axios';

const apiClient = axios.create({
  // 相对路径：开发时由 Vite 代理（/api → localhost:3000）转发，
  // 生产时前端由后端同源托管，直接命中。可用 VITE_API_BASE 覆盖。
  baseURL: import.meta.env.VITE_API_BASE || '/api/v1',
  timeout: 35000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
