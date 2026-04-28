import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AtualizarConfiguracaoRequest } from '../../models/admin-config/atualizar-configuracao-request.model';
import { Configuracao } from '../../models/admin-config/configuracao.model';
import { BASE_URL } from '../../../constants/base-url';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private http = inject(HttpClient);
  private url = `${BASE_URL}/configuracao`;

  obter(): Observable<Configuracao> {
    return this.http.get<Configuracao>(this.url);
  }

  atualizar(data: AtualizarConfiguracaoRequest): Observable<Configuracao> {
    return this.http.put<Configuracao>(this.url, data);
  }
}
