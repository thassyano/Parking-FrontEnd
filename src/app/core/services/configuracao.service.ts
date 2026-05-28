import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import { Configuracao, AtualizarConfiguracaoRequest } from '../models/configuracao.model';

@Injectable({ providedIn: 'root' })
export class ConfiguracaoService {
  constructor(private http: HttpClient) {}

  obter(): Observable<Configuracao> {
    return this.http.get<Configuracao>(`${environment.apiUrl}/configuracao`);
  }

  atualizar(data: AtualizarConfiguracaoRequest): Observable<Configuracao> {
    return this.http.put<Configuracao>(`${environment.apiUrl}/configuracao`, data);
  }

  testarEvolution(telefoneCliente: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/configuracao/testar-evolution`, {
      telefoneCliente,
    });
  }
}
