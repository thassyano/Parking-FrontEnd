import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import {
  Reserva,
  CriarReservaOnlineRequest,
  CriarReservaPresencialRequest,
  CriarReservaLoteOnlineRequest,
  CriarReservaLotePresencialRequest,
  ReservaLoteResponse,
  AssociarPlacaRequest,
  CheckoutRequest,
  CupomEntrada,
  CupomSaida,
  WhatsAppResponse,
  ReservaFiltros,
} from '../models/reserva.model';

@Injectable({ providedIn: 'root' })
export class ReservaService {
  private readonly url = `${environment.apiUrl}/reservas`;

  constructor(private http: HttpClient) {}

  listar(filtros?: ReservaFiltros): Observable<Reserva[]> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.dataInicio) params = params.set('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params = params.set('dataFim', filtros.dataFim);
      if (filtros.status) params = params.set('status', filtros.status);
      if (filtros.tipoVaga) params = params.set('tipoVaga', filtros.tipoVaga);
      if (filtros.placaVeiculo) params = params.set('placaVeiculo', filtros.placaVeiculo);
    }
    return this.http.get<Reserva[]>(this.url, { params });
  }

  obterPorId(id: number): Observable<Reserva> {
    return this.http.get<Reserva>(`${this.url}/${id}`);
  }

  criarOnline(data: CriarReservaOnlineRequest): Observable<Reserva> {
    return this.http.post<Reserva>(`${this.url}/online`, data);
  }

  criarOnlineLote(data: CriarReservaLoteOnlineRequest): Observable<ReservaLoteResponse> {
    return this.http.post<ReservaLoteResponse>(`${this.url}/online/lote`, data);
  }

  whatsappLote(ids: number[]): Observable<WhatsAppResponse> {
    return this.http.post<WhatsAppResponse>(`${this.url}/whatsapp/lote`, ids);
  }

  criarPresencial(data: CriarReservaPresencialRequest): Observable<Reserva> {
    return this.http.post<Reserva>(`${this.url}/presencial`, data);
  }

  criarPresencialLote(data: CriarReservaLotePresencialRequest): Observable<ReservaLoteResponse> {
    return this.http.post<ReservaLoteResponse>(`${this.url}/presencial/lote`, data);
  }

  associarPlaca(id: number, data: AssociarPlacaRequest): Observable<Reserva> {
    return this.http.patch<Reserva>(`${this.url}/${id}/placa`, data);
  }

  checkin(id: number): Observable<Reserva> {
    return this.http.patch<Reserva>(`${this.url}/${id}/checkin`, null);
  }

  checkout(id: number, data: CheckoutRequest): Observable<Reserva> {
    return this.http.patch<Reserva>(`${this.url}/${id}/checkout`, data);
  }

  cancelar(id: number): Observable<Reserva> {
    return this.http.patch<Reserva>(`${this.url}/${id}/cancelar`, null);
  }

  cupomEntrada(id: number): Observable<CupomEntrada> {
    return this.http.get<CupomEntrada>(`${this.url}/${id}/cupom-entrada`);
  }

  cupomSaida(id: number): Observable<CupomSaida> {
    return this.http.get<CupomSaida>(`${this.url}/${id}/cupom-saida`);
  }

  whatsapp(id: number): Observable<WhatsAppResponse> {
    return this.http.get<WhatsAppResponse>(`${this.url}/${id}/whatsapp`);
  }
}
