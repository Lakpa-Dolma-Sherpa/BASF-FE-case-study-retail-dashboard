import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const TIMEOUT_MS = 10_000;

export const api = axios.create({
  baseURL: '/api',
  timeout: TIMEOUT_MS,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  if (axios.isCancel(error)) throw error;

  const config = error.config as (InternalAxiosRequestConfig & { retryCount?: number }) | undefined;
  if (error.response?.status === 401 && !config?.url?.includes('/login')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw error;
  }

  throw error;
});
