import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { TokenInterface } from '../../models/auth/auth.model';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { BASE_URL } from '../../constants/base-url';
import { LoginInterface } from '../../models/auth/login.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public token = signal<TokenInterface | null>(null);
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = signal<string>(`${BASE_URL}/Auth`);

  public saveInfo(infos: TokenInterface): void {
    localStorage.setItem('token', infos.token);
  }

  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  public hasToken(): boolean {
    const hasItem = this.getToken();
    return !!hasItem;
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  public login(loginRequest: LoginInterface): Observable<TokenInterface> {
    return this.http.post<TokenInterface>(`${this.baseUrl()}/login`, { loginRequest }).pipe(
      tap((response) => {
        if (response && 'token' in response) {
          this.token.set(response);
          this.saveInfo(response);
        }

        if (this.token()?.expiraEm) {
          const expiraEm: Date = new Date(this.token()!.expiraEm);

          const agora = Date.now();
          const expiraEmMs = expiraEm.getTime();
          const timeoutMs = expiraEmMs - agora;

          setTimeout(() => {
            this.logout();
          }, timeoutMs);
        }
      }),
    );
  }

  public logout(): void {
    localStorage.removeItem('token');

    this.token.set(null);

    this.router.navigateByUrl('/login');
  }
}
