import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../environment';
import { LoginRequest, LoginResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'parking_token';
  private readonly USER_KEY = 'parking_user';

  private _isLoggedIn = signal(this.hasValidToken());
  readonly isLoggedIn = this._isLoggedIn.asReadonly();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((res) => {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          localStorage.setItem(
            this.USER_KEY,
            JSON.stringify({
              usuario: res.usuario,
              nome: res.nome,
              expiraEm: res.expiraEm,
            }),
          );
          this._isLoggedIn.set(true);
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._isLoggedIn.set(false);
    this.router.navigate(['/admin/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): { usuario: string; nome: string; expiraEm: string } | null {
    const data = localStorage.getItem(this.USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const user = this.getUser();
    if (!user?.expiraEm) return false;
    return new Date(user.expiraEm) > new Date();
  }
}
