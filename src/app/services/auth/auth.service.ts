import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { TokenInterface } from '../../models/auth/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public token = signal<TokenInterface | null>(null);
  private http = inject(HttpClient);

  public saveInfo(infos: TokenInterface): void {
    localStorage.setItem('accessToken', infos.accessToken);
  }

  public getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  public hasToken(): boolean {
    const hasItem = this.getToken();
    return !!hasItem;
  }

  public logout(): void {
    localStorage.removeItem('accessToken');

    this.token.set(null);
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }
}
