import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Admin } from '../../models/admin-config/admin.model';
import { AtualizarAdminRequest } from '../../models/admin-config/atualizar-admin-request.model';
import { CriarAdminRequest } from '../../models/admin-config/criar-admin-request.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly url = `${environment.apiUrl}/admin`;
  private http = inject(HttpClient);

  listar(): Observable<Admin[]> {
    return this.http.get<Admin[]>(this.url);
  }

  criar(data: CriarAdminRequest): Observable<Admin> {
    return this.http.post<Admin>(this.url, data);
  }

  atualizar(id: number, data: AtualizarAdminRequest): Observable<Admin> {
    return this.http.put<Admin>(`${this.url}/${id}`, data);
  }

  ativar(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.url}/${id}/ativar`, { ativo: true });
  }

  desativar(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.url}/${id}/ativar`, { ativo: false });
  }
}
