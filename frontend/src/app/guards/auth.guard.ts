import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const user = authService.currentUserValue;
  if (user) {
    // Check role if specified in route data
    const expectedRole = route.data['role'];
    const userRole = (user as any)?.role || (user as any)?.user_metadata?.rol;
    if (expectedRole && userRole !== expectedRole) {
      router.navigate(['/dashboard']);
      return false;
    }
    return true;
  }

  router.navigate(['/login']);
  return false;
};
