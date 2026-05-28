import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AtualizarConfiguracaoRequest } from '../../models/admin-config/atualizar-configuracao-request.model';
import { Configuracao } from '../../models/admin-config/configuracao.model';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/configuracao`;

  obter(): Observable<Configuracao> {
    return this.http.get<Configuracao>(this.url);
  }

  atualizar(data: AtualizarConfiguracaoRequest): Observable<Configuracao> {
    return this.http.put<Configuracao>(this.url, data);
  }
}
