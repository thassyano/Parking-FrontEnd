import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FechamentoCaixaRequest } from '../../models/register/fechamento-caixa-request.model';
import { FechamentoCaixaResponse } from '../../models/register/fechamento-caixa-response.model';

@Injectable({
  providedIn: 'root',
})
export class RegisterService {
  private readonly url = `${environment.apiUrl}/caixa`;
  private readonly http = inject(HttpClient);

  fechamento(data: FechamentoCaixaRequest): Observable<FechamentoCaixaResponse> {
    return this.http.post<FechamentoCaixaResponse>(`${this.url}/fechamento`, data);
  }

  exportarExcel(data: FechamentoCaixaRequest): Observable<Blob> {
    return this.http.post(`${this.url}/exportar-excel`, data, {
      responseType: 'blob',
    });
  }
}
