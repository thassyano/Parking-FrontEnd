import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import { OrcamentoRequest, OrcamentoResponse } from '../models/orcamento.model';

@Injectable({ providedIn: 'root' })
export class OrcamentoService {
  constructor(private http: HttpClient) {}

  calcular(data: OrcamentoRequest): Observable<OrcamentoResponse> {
    return this.http.post<OrcamentoResponse>(`${environment.apiUrl}/orcamento`, data);
  }
}
