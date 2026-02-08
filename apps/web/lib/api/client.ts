import axios, { AxiosError } from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (for auth tokens later)
apiClient.interceptors.request.use(
  (config) => {
    // TODO: Add auth token when implemented
    // const token = getAuthToken();
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (global error handling)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail: string }>) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    // Handle specific errors globally
    if (status === 401) {
      // TODO: Redirect to login
      console.error('Unauthorized - redirect to login');
    }
    
    if (status === 429) {
      console.error('Rate limited - slow down requests');
    }

    return Promise.reject(error);
  }
);
