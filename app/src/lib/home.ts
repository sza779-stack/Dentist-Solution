import type { User } from '@/types';

export function getDefaultRouteForRole(role?: User['role']): string {
  if (role === 'PATIENT') {
    return '/patient';
  }

  if (role === 'ADMIN') {
    return '/admin';
  }

  return '/dashboard';
}
