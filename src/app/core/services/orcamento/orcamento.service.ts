import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { OrcamentoRequest } from '../../models/reserva/orcamento/orcamento-request.model';
import { Observable } from 'rxjs';
import { OrcamentoResponse } from '../../models/reserva/orcamento/orcamento-response.model';
import { BASE_URL } from '../../../constants/base-url';

@Injectable({
  providedIn: 'root',
})
export class OrcamentoService {
  private http = inject(HttpClient);
  private readonly baseUrl = signal<string>(`${BASE_URL}`);

  public calcular(data: OrcamentoRequest): Observable<OrcamentoResponse> {
    return this.http.post<OrcamentoResponse>(`${this.baseUrl()}/orcamento`, data);
  }
}
