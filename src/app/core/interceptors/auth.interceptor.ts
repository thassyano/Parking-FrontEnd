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

      const isPublicClientRoute = req.url.includes('/alterar-cliente')
        || req.url.includes('/whatsapp-alteracao')
        || req.url.includes('/lote-alteracao')
        || req.url.includes('/online')
        || req.url.includes('/conflito')
        || req.url.includes('/confirmar/')
        || (req.url.includes('/reservas/') && req.url.includes('/whatsapp'));

      if (error.status === 401 && !isLoginRequest && !isPublicClientRoute) {
        authService.logout();
      }

      return throwError(() => error);
    }),
  );
};
