import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Preco } from '../../models/precos/preco.model';
import { CriarPrecoRequest } from '../../models/precos/criar-preco-request.model';

@Injectable({
  providedIn: 'root',
})
export class PrecoService {
  private readonly url = signal(`${environment.apiUrl}/precos`);
  private http = inject(HttpClient);

  public listarTodos(): Observable<Preco[]> {
    return this.http.get<Preco[]>(this.url());
  }

  public listarAtivos(): Observable<Preco[]> {
    return this.http.get<Preco[]>(`${this.url()}/ativos`);
  }

  public obterPorTipo(tipoVaga: string): Observable<Preco> {
    return this.http.get<Preco>(`${this.url()}/ativos/${tipoVaga}`);
  }

  public criar(data: CriarPrecoRequest): Observable<Preco> {
    return this.http.post<Preco>(this.url(), data);
  }
}
