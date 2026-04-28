import { inject, Injectable } from '@angular/core';
import { BASE_URL } from '../../../constants/base-url';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Admin } from '../../models/admin-config/admin.model';
import { CriarAdminRequest } from '../../models/admin-config/criar-admin-request.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly url = `${BASE_URL}/admin`;
  private http = inject(HttpClient);

  listar(): Observable<Admin[]> {
    return this.http.get<Admin[]>(this.url);
  }

  criar(data: CriarAdminRequest): Observable<Admin> {
    return this.http.post<Admin>(this.url, data);
  }

  desativar(id: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.url}/${id}/desativar`, null);
  }

  ativar(id: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.url}/${id}/ativar`, null);
  }
}
