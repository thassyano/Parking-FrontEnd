import { inject } from '@angular/core';
import { CanActivate, CanActivateFn } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

export class authGuard implements CanActivate {
  authService = inject(AuthService);

  canActivate(): boolean | Observable<boolean> {
    return this.authService.isAuthenticated();
  }
}
