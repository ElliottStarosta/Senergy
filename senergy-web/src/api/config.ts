import axios from 'axios';

// Fallback to production URL if env var not set
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://senergy.onrender.com';

console.log('🔧 API Base URL:', API_BASE_URL);
console.log('🔧 Environment Mode:', import.meta.env.MODE);

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout for Render cold starts
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`📡 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error(`❌ API Error:`, {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      console.error('Unauthorized, redirecting to login...');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;