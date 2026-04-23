import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { BASE_URL } from '../../../constants/base-url';
import { LoginInterface } from '../../models/auth/login.model';
import { TokenInterface } from '../../models/auth/token.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public token = signal<TokenInterface | null>(null);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = signal<string>(`${BASE_URL}/Auth`);

  public saveInfo(infos: TokenInterface): void {
    localStorage.setItem('token', JSON.stringify(infos));
  }

  public getToken(): string | null {
    const raw = localStorage.getItem('token');

    if (!raw) return null;

    const parsed: TokenInterface = JSON.parse(raw);
    return parsed.token;
  }

  public getTokenInfo(): TokenInterface | null {
    const raw = localStorage.getItem('token');

    if (!raw) return null;

    try {
      return JSON.parse(raw) as TokenInterface;
    } catch {
      return null;
    }
  }

  public hasToken(): boolean {
    const hasItem = this.getToken();
    return !!hasItem;
  }

  isAuthenticated(): boolean {
    const tokenInfo = this.getTokenInfo();

    if (!tokenInfo) return false;

    const isExpired = new Date(tokenInfo.expiraEm) < new Date();

    if (isExpired) {
      this.logout();
      return false;
    }

    return this.hasToken();
  }

  public login(loginRequest: LoginInterface): Observable<TokenInterface> {
    return this.http.post<TokenInterface>(`${this.baseUrl()}/login`, loginRequest).pipe(
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

    this.router.navigateByUrl('');
  }

  public getUser(): { usuario: string; nome: string; expiraEm: string } | null {
    const tokenInfo = this.getTokenInfo();
    
    if (!tokenInfo) return null;

    try {
      return {
        usuario: tokenInfo.usuario,
        nome: tokenInfo.nome,
        expiraEm: tokenInfo.expiraEm,
      };
    } catch {
      return null;
    }
  }
}
