import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const authToken = authService.getToken();

  let clonedReq = req;

  if (authToken) {
    clonedReq = req.clone({
      headers: req.headers.append('Authorization', `Bearer ${authToken}`),
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isLoginRequest = req.url.includes('/login');

      if (error.status === 401 && !isLoginRequest) {
        authService.logout();
      }

      return throwError(() => error);
    }),
  );
};
