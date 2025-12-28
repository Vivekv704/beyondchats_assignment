import axios from 'axios';

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for adding auth tokens or logging
api.interceptors.request.use(
  (config) => {
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    // Add auth token if available (for future use)
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and logging
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    // Log errors
    console.error('❌ API Response Error:', error);
    
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear auth token and redirect to login
          localStorage.removeItem('auth_token');
          // Could dispatch logout action here
          break;
        case 403:
          // Forbidden
          console.error('Access forbidden');
          break;
        case 404:
          // Not found
          console.error('Resource not found');
          break;
        case 422:
          // Validation error
          console.error('Validation error:', data);
          break;
        case 500:
          // Server error
          console.error('Server error');
          break;
        default:
          console.error(`HTTP Error ${status}:`, data);
      }
      
      // Return a normalized error object
      return Promise.reject({
        status,
        message: data?.message || `HTTP Error ${status}`,
        errors: data?.errors || null,
        originalError: error,
      });
    } else if (error.request) {
      // Network error
      return Promise.reject({
        status: 0,
        message: 'Network error. Please check your connection.',
        errors: null,
        originalError: error,
      });
    } else {
      // Other error
      return Promise.reject({
        status: 0,
        message: error.message || 'An unexpected error occurred',
        errors: null,
        originalError: error,
      });
    }
  }
);

export default api;