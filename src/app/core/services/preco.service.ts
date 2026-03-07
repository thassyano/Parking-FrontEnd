import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import { Preco, CriarPrecoRequest } from '../models/preco.model';

@Injectable({ providedIn: 'root' })
export class PrecoService {
  private readonly url = `${environment.apiUrl}/precos`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<Preco[]> {
    return this.http.get<Preco[]>(this.url);
  }

  listarAtivos(): Observable<Preco[]> {
    return this.http.get<Preco[]>(`${this.url}/ativos`);
  }

  obterPorTipo(tipoVaga: string): Observable<Preco> {
    return this.http.get<Preco>(`${this.url}/ativos/${tipoVaga}`);
  }

  criar(data: CriarPrecoRequest): Observable<Preco> {
    return this.http.post<Preco>(this.url, data);
  }
}
