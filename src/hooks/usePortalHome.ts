import { useUserRole } from '@/hooks/useUserRole';

/**
 * Returns the correct "home" path based on user role.
 * Admins go to /dashboard, customers go to /lounge.
 */
export function usePortalHome() {
  const { isAdmin } = useUserRole();
  return isAdmin ? '/dashboard' : '/lounge';
}
