import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  AssociarPlacaRequest,
  CheckoutRequest,
  CriarReservaOnlineRequest,
  CriarReservaPresencialRequest,
  CupomEntrada,
  CupomSaida,
  Reserva,
  ReservaFiltros,
  WhatsAppResponse,
} from '../../../../..';
import { environment } from '../../environment';
import {
  CriarReservaLoteOnlineRequest,
  CriarReservaLotePresencialRequest,
} from '../../models/reserva/criar-reserva-lote-request.interface';
import {
  AlterarFormaPagamentoRequest,
  AtualizarDadosVeiculoRequest,
  PreviaCheckout,
} from '../../models/reserva/previa-checkout.model';
import { ConfirmacaoReservaResponse } from '../../models/reserva/confirmacao-reserva-response.interface';
import { ReservaLoteResponse } from '../../models/reserva/reserva-lote-response.interface';

@Injectable({
  providedIn: 'root',
})
export class ReservaService {
  private readonly url = `${environment.apiUrl}/reservas`;

  private http = inject(HttpClient);

  public listar(filtros?: ReservaFiltros): Observable<Reserva[]> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.dataInicio) params = params.set('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params = params.set('dataFim', filtros.dataFim);
      if (filtros.status) params = params.set('status', filtros.status);
      if (filtros.tipoVaga) params = params.set('tipoVaga', filtros.tipoVaga);
    }
    return this.http.get<Reserva[]>(this.url, { params });
  }

  public obterPorId(id: number): Observable<Reserva> {
    return this.http.get<Reserva>(`${this.url}/${id}`);
  }

  public criarOnline(data: CriarReservaOnlineRequest): Observable<Reserva> {
    return this.http.post<Reserva>(`${this.url}/online`, data);
  }

  criarOnlineLote(data: CriarReservaLoteOnlineRequest): Observable<ReservaLoteResponse> {
    return this.http.post<ReservaLoteResponse>(`${this.url}/online/lote`, data);
  }

  whatsappLote(ids: number[]): Observable<WhatsAppResponse> {
    return this.http.post<WhatsAppResponse>(`${this.url}/whatsapp/lote`, ids);
  }

  public criarPresencial(data: CriarReservaPresencialRequest): Observable<Reserva> {
    return this.http.post<Reserva>(`${this.url}/presencial`, data);
  }

  criarPresencialLote(data: CriarReservaLotePresencialRequest): Observable<ReservaLoteResponse> {
    return this.http.post<ReservaLoteResponse>(`${this.url}/presencial/lote`, data);
  }

  public associarPlaca(id: number, data: AssociarPlacaRequest): Observable<Reserva> {
    return this.http.patch<Reserva>(`${this.url}/${id}/placa`, data);
  }

  public checkin(id: number): Observable<Reserva> {
    return this.http.patch<Reserva>(`${this.url}/${id}/checkin`, null);
  }

  public checkout(id: number, data: CheckoutRequest): Observable<Reserva> {
    return this.http.patch<Reserva>(`${this.url}/${id}/checkout`, data);
  }

  /** Calcula o check-out (sem gravar) para a forma de pagamento/traslado escolhidos. */
  public previaCheckout(id: number, formaPagamento: string, comTraslado: boolean): Observable<PreviaCheckout> {
    const params = new HttpParams()
      .set('formaPagamento', formaPagamento)
      .set('comTraslado', comTraslado);
    return this.http.get<PreviaCheckout>(`${this.url}/${id}/previa-checkout`, { params });
  }

  /** Corrige forma de pagamento (e traslado) depois do check-out; valores são recalculados. */
  public alterarFormaPagamento(id: number, data: AlterarFormaPagamentoRequest): Observable<Reserva> {
    return this.http.patch<Reserva>(`${this.url}/${id}/forma-pagamento`, data);
  }

  /** Qualquer admin: altera marca, modelo e cor. */
  public atualizarDadosVeiculo(id: number, data: AtualizarDadosVeiculoRequest): Observable<Reserva> {
    return this.http.patch<Reserva>(`${this.url}/${id}/dados-veiculo`, data);
  }

  public cancelar(id: number): Observable<Reserva> {
    return this.http.patch<Reserva>(`${this.url}/${id}/cancelar`, null);
  }

  public cupomEntrada(id: number): Observable<CupomEntrada> {
    return this.http.get<CupomEntrada>(`${this.url}/${id}/cupom-entrada`);
  }

  public cupomSaida(id: number): Observable<CupomSaida> {
    return this.http.get<CupomSaida>(`${this.url}/${id}/cupom-saida`);
  }

  public whatsapp(id: number): Observable<WhatsAppResponse> {
    return this.http.get<WhatsAppResponse>(`${this.url}/${id}/whatsapp`);
  }

  public whatsappAlteracao(id: number): Observable<WhatsAppResponse> {
    return this.http.get<WhatsAppResponse>(`${this.url}/${id}/whatsapp-alteracao`);
  }

  whatsappAlteracaoLote(ids: number[]): Observable<WhatsAppResponse> {
    return this.http.post<WhatsAppResponse>(`${this.url}/whatsapp/lote-alteracao`, ids);
  }

  public confirmarPorToken(token: string): Observable<ConfirmacaoReservaResponse> {
    return this.http.get<ConfirmacaoReservaResponse>(`${this.url}/confirmar/${token}`);
  }

  /**
   * Verifica se uma placa já possui reserva ativa que se sobreponha ao período.
   * Retorna o conflito encontrado ou null se não houver.
   */
  public verificarConflito(placa: string, dataEntrada: string, dataSaidaPrevista: string): Observable<ConflitoPorPlaca | null> {
    const params = new HttpParams()
      .set('placa', placa)
      .set('dataEntrada', dataEntrada)
      .set('dataSaidaPrevista', dataSaidaPrevista);

    return this.http.get<ConflitoPorPlaca>(`${this.url}/conflito`, { params }).pipe(
      catchError(() => of(null)), // 404 = sem conflito
    );
  }

  /** Admin autenticado — altera reserva presencial. */
  public atualizar(
    id: number,
    data: { dataEntrada?: string; dataSaidaPrevista: string; tipoVaga?: string },
  ): Observable<Reserva> {
    return this.http.patch<Reserva>(`${this.url}/${id}/alterar`, data);
  }

  /** Cliente online — altera a própria reserva (telefone + placa, sem JWT). */
  public atualizarCliente(
    id: number,
    data: {
      dataEntrada?: string;
      dataSaidaPrevista: string;
      tipoVaga?: string;
      placaVeiculo: string;
      telefoneCliente: string;
    },
  ): Observable<Reserva> {
    return this.http.patch<Reserva>(`${this.url}/${id}/alterar-cliente`, data);
  }
}

export interface ConflitoPorPlaca {
  id: number;
  placaVeiculo: string;
  dataEntrada: string;
  dataSaidaPrevista: string;
  status: string;
  tipoVaga: string;
  podeAtualizar: boolean;
}
