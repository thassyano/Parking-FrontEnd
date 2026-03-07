import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import { FechamentoCaixaRequest, FechamentoCaixaResponse } from '../models/caixa.model';

@Injectable({ providedIn: 'root' })
export class CaixaService {
  private readonly url = `${environment.apiUrl}/caixa`;

  constructor(private http: HttpClient) {}

  fechamento(data: FechamentoCaixaRequest): Observable<FechamentoCaixaResponse> {
    return this.http.post<FechamentoCaixaResponse>(`${this.url}/fechamento`, data);
  }

  exportarExcel(data: FechamentoCaixaRequest): Observable<Blob> {
    return this.http.post(`${this.url}/exportar-excel`, data, {
      responseType: 'blob',
    });
  }
}
