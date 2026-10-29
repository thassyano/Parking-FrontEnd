import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { Bloqueio, BloqueioStatus, CriarBloqueioRequest } from '../../models/bloqueio/bloqueio.model';

@Injectable({ providedIn: 'root' })
export class BloqueioService {
  private readonly url = `${environment.apiUrl}/bloqueios`;
  private readonly http = inject(HttpClient);

  /** Admin: bloqueios ativos que ainda não terminaram. */
  public listar(): Observable<Bloqueio[]> {
    return this.http.get<Bloqueio[]>(this.url);
  }

  public criar(data: CriarBloqueioRequest): Observable<Bloqueio> {
    return this.http.post<Bloqueio>(this.url, data);
  }

  public remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  /** Público: informa se o período (ISO local, ex.: 2026-11-01T10:00) cai em um bloqueio. */
  public verificar(inicio: string, fim: string): Observable<BloqueioStatus> {
    const params = new HttpParams().set('inicio', inicio).set('fim', fim);
    return this.http.get<BloqueioStatus>(`${this.url}/verificar`, { params });
  }
}
