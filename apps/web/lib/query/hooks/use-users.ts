import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/endpoints/users';
import { queryKeys } from '../keys';

// Get user
export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes - user data changes rarely
    gcTime: 1000 * 60 * 30, // 30 minutes cache
  });
}
