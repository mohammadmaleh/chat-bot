import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi, LoginCredentials, RegisterCredentials } from '../api/auth'
import { useRouter } from 'next/navigation'

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
}

// Get current user
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: () => authApi.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })
}

// Login mutation
export function useLogin() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.user(), data.user)
      router.push('/dashboard')
    },
  })
}

// Register mutation
export function useRegister() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => authApi.register(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.user(), data.user)
      router.push('/dashboard')
    },
  })
}

// Logout mutation
export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.clear()
      router.push('/login')
    },
  })
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.user(), data)
      queryClient.invalidateQueries({ queryKey: authKeys.user() })
    },
  })
}

// Check if user is authenticated
export function useAuth() {
  const { data: user, isLoading, error } = useCurrentUser()
  
  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
  }
}
