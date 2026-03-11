import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';

export interface SeedRequest {
  usuario: string;
  senha: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class SeedService {
  constructor(private http: HttpClient) {}

  criar(data: SeedRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/seed`, data);
  }
}
