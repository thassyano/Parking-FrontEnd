import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import { Admin, CriarAdminRequest } from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly url = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

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
