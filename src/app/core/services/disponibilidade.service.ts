import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import { DisponibilidadeDia, DisponibilidadePeriodo } from '../models/disponibilidade.model';

@Injectable({ providedIn: 'root' })
export class DisponibilidadeService {
  private readonly url = `${environment.apiUrl}/disponibilidade`;

  constructor(private http: HttpClient) {}

  consultarDia(data: string): Observable<DisponibilidadeDia> {
    const params = new HttpParams().set('data', data);
    return this.http.get<DisponibilidadeDia>(this.url, { params });
  }

  consultarPeriodo(dataInicio: string, dataFim: string): Observable<DisponibilidadePeriodo> {
    const params = new HttpParams().set('dataInicio', dataInicio).set('dataFim', dataFim);
    return this.http.get<DisponibilidadePeriodo>(`${this.url}/periodo`, { params });
  }
}
