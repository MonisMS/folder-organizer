import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor for debugging (can be removed in production)
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      console.log('🌐 API Request:', config.method?.toUpperCase(), config.baseURL + config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('❌ Network Error: No response from server');
    } else {
      // Something else happened
      console.error('❌ Error:', error.message);
    }
    return Promise.reject(error);
  }
);