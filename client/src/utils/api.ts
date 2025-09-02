import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { ApiError } from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  register: async (data: {
    email: string;
    password: string;
    currency: string;
    riskProfile: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },
};

export const bankrollAPI = {
  getAll: async () => {
    const response = await api.get('/bankrolls');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/bankrolls/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/bankrolls', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.patch(`/bankrolls/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/bankrolls/${id}`);
    return response.data;
  },
};

export const wagerAPI = {
  getAll: async (filters?: any) => {
    const response = await api.get('/wagers', { params: filters });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/wagers/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/wagers', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.patch(`/wagers/${id}`, data);
    return response.data;
  },

  close: async (id: number, data: any) => {
    const response = await api.post(`/wagers/${id}/close`, data);
    return response.data;
  },
};

export const analyticsAPI = {
  getMetrics: async (filters?: any) => {
    const response = await api.get('/analytics/metrics', { params: filters });
    return response.data;
  },

  getPerformance: async (filters?: any) => {
    const response = await api.get('/analytics/performance', { params: filters });
    return response.data;
  },

  getInsights: async (filters?: any) => {
    const response = await api.get('/analytics/insights', { params: filters });
    return response.data;
  },
};

export const simulatorAPI = {
  ladderSimulation: async (data: any) => {
    const response = await api.post('/simulator/ladder', data);
    return response.data;
  },

  bankrollSimulation: async (data: any) => {
    const response = await api.post('/simulator/bankroll', data);
    return response.data;
  },

  getHistory: async (filters?: any) => {
    const response = await api.get('/simulator/history', { params: filters });
    return response.data;
  },
};

export const exportAPI = {
  exportWagers: async (filters?: any) => {
    const response = await api.get('/export/wagers.csv', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  exportMetrics: async (filters?: any) => {
    const response = await api.get('/export/metrics.csv', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  exportBankrolls: async () => {
    const response = await api.get('/export/bankrolls.csv', {
      responseType: 'blob',
    });
    return response.data;
  },

  exportSimulations: async (filters?: any) => {
    const response = await api.get('/export/simulations.csv', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
};

// Utility functions
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const formatCurrency = (amount: number, currency: string = 'COP') => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatPercentage = (value: number) => {
  return `${value.toFixed(2)}%`;
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const calculateImpliedProbability = (odds: number) => {
  return (1 / odds) * 100;
};

export const calculateExpectedValue = (probability: number, odds: number) => {
  const winAmount = odds - 1;
  const loseAmount = 1;
  return (probability * winAmount) - ((1 - probability) * loseAmount);
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'ganada':
      return 'success';
    case 'perdida':
      return 'danger';
    case 'pendiente':
      return 'warning';
    case 'push':
      return 'info';
    case 'cashout':
      return 'primary';
    default:
      return 'gray';
  }
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'ganada':
      return 'Ganada';
    case 'perdida':
      return 'Perdida';
    case 'pendiente':
      return 'Pendiente';
    case 'push':
      return 'Push';
    case 'cashout':
      return 'Cashout';
    default:
      return status;
  }
};

export const getRiskProfileLabel = (profile: string) => {
  switch (profile) {
    case 'conservador':
      return 'Conservador';
    case 'balanceado':
      return 'Balanceado';
    case 'agresivo':
      return 'Agresivo';
    default:
      return profile;
  }
};

export const getStrategyLabel = (strategy: string) => {
  switch (strategy) {
    case 'flat':
      return 'Flat';
    case 'percentage':
      return 'Porcentaje';
    case 'kelly':
      return 'Kelly';
    default:
      return strategy;
  }
};

export default api;
