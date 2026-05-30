import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import {
  FiltroLogAtividade,
  LogAtividadePaginado,
} from '../../models/admin-config/log-atividade.model';

@Injectable({ providedIn: 'root' })
export class LogAtividadeService {
  private readonly url = `${environment.apiUrl}/LogAtividade`;
  private http = inject(HttpClient);

  listar(filtro: FiltroLogAtividade = {}): Observable<LogAtividadePaginado> {
    let params = new HttpParams();

    if (filtro.dataInicio) params = params.set('dataInicio', filtro.dataInicio);
    if (filtro.dataFim) params = params.set('dataFim', filtro.dataFim);
    if (filtro.acao) params = params.set('acao', filtro.acao);
    if (filtro.adminUsuario) params = params.set('adminUsuario', filtro.adminUsuario);
    if (filtro.origem) params = params.set('origem', filtro.origem);
    if (filtro.sucesso !== undefined && filtro.sucesso !== null) {
      params = params.set('sucesso', String(filtro.sucesso));
    }
    if (filtro.pagina) params = params.set('pagina', filtro.pagina);
    if (filtro.tamanhoPagina) params = params.set('tamanhoPagina', filtro.tamanhoPagina);

    return this.http.get<LogAtividadePaginado>(this.url, { params });
  }

  listarAcoes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.url}/acoes`);
  }

  listarOrigens(): Observable<string[]> {
    return this.http.get<string[]>(`${this.url}/origens`);
  }
}
