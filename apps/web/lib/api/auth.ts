import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  createdAt: string
  preferences?: {
    currency: string
    language: string
    notifications: boolean
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name?: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}

export const authApi = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await axios.post(`${API_URL}/api/auth/login`, credentials)
    if (data.token) {
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('refresh_token', data.refreshToken)
    }
    return data
  },

  // Register
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const { data } = await axios.post(`${API_URL}/api/auth/register`, credentials)
    if (data.token) {
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('refresh_token', data.refreshToken)
    }
    return data
  },

  // Logout
  logout: async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`)
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const token = localStorage.getItem('auth_token')
    const { data } = await axios.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data
  },

  // Update user profile
  updateProfile: async (updates: Partial<User>): Promise<User> => {
    const token = localStorage.getItem('auth_token')
    const { data } = await axios.patch(`${API_URL}/api/auth/profile`, updates, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data
  },

  // Refresh token
  refreshToken: async (): Promise<string> => {
    const refreshToken = localStorage.getItem('refresh_token')
    const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
      refresh_token: refreshToken,
    })
    if (data.token) {
      localStorage.setItem('auth_token', data.token)
    }
    return data.token
  },

  // OAuth providers
  googleLogin: async (token: string): Promise<AuthResponse> => {
    const { data } = await axios.post(`${API_URL}/api/auth/google`, { token })
    if (data.token) {
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('refresh_token', data.refreshToken)
    }
    return data
  },

  githubLogin: async (code: string): Promise<AuthResponse> => {
    const { data } = await axios.post(`${API_URL}/api/auth/github`, { code })
    if (data.token) {
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('refresh_token', data.refreshToken)
    }
    return data
  },
}

// Axios interceptor for auth token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Axios interceptor for token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const newToken = await authApi.refreshToken()
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return axios(originalRequest)
      } catch (refreshError) {
        await authApi.logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)
