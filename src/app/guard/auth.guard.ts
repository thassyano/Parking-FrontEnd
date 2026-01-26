import { inject } from '@angular/core';
import { CanActivate } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { Observable } from 'rxjs';

export class authGuard implements CanActivate {
  authService = inject(AuthService);

  canActivate(): boolean | Observable<boolean> {
    if (this.authService.isAuthenticated()) {
      return true;
    }

    return false;
  }
}
