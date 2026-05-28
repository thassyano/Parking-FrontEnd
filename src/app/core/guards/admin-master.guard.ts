import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const adminMasterGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigateByUrl('/admin/login');
    return false;
  }

  if (!authService.isAdminMaster()) {
    router.navigateByUrl('/admin/dashboard');
    return false;
  }

  return true;
};
