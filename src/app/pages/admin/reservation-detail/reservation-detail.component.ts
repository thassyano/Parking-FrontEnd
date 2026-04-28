import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CupomEntrada } from '../../../core/models/reserva/cupom-entrada.model';
import { CupomSaida } from '../../../core/models/reserva/cupom-saida.model';
import { Reserva } from '../../../core/models/reserva/reserva.model';
import { ReservaService } from '../../../core/services/reserva/reserva.service';
import { scrollToBottom } from '../../../core/utils/viewport/scroll-to-bottom';

@Component({
  selector: 'app-reservation-detail',
  imports: [FormsModule, CurrencyPipe, DatePipe],
  templateUrl: './reservation-detail.component.html',
  styleUrl: './reservation-detail.component.css',
})
export class ReservationDetailComponent implements OnInit {
  protected reserva = signal<Reserva | null>(null);
  protected loading = signal(true);
  protected actionLoading = signal(false);
  protected erro = signal('');
  protected sucesso = signal('');
  protected showPlacaForm = signal(false);
  protected showCheckoutForm = signal(false);
  protected cupomEntrada = signal<CupomEntrada | null>(null);
  protected cupomSaida = signal<CupomSaida | null>(null);
  protected showCancelarModal = signal(false);

  protected placaVeiculo = '';
  protected formaPagamento = 'Pix';
  
  protected showCupomEntradaPrint = signal(false);
  protected showCupomSaidaPrint = signal(false);

  private route = inject(ActivatedRoute);
  private reservaService = inject(ReservaService);

  private get reservaId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.carregarReserva();
  }

  protected carregarReserva(): void {
    this.loading.set(true);
    this.reservaService.obterPorId(this.reservaId).subscribe({
      next: (data) => {
        this.reserva.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.erro.set('Reserva não encontrada');
        this.loading.set(false);
      },
    });
  }

  protected associarPlaca(): void {
    if (!this.placaVeiculo) return;
    this.actionLoading.set(true);
    this.erro.set('');
    this.reservaService
      .associarPlaca(this.reservaId, { placaVeiculo: this.placaVeiculo })
      .subscribe({
        next: (data) => {
          this.reserva.set(data);
          this.showPlacaForm.set(false);
          this.sucesso.set('Placa associada com sucesso');
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.erro.set(err.error?.message || 'Erro ao associar placa');
          this.actionLoading.set(false);
        },
      });
  }

  protected realizarCheckin(): void {
    this.actionLoading.set(true);
    this.erro.set('');
    this.reservaService.checkin(this.reservaId).subscribe({
      next: (data) => {
        this.reserva.set(data);
        this.sucesso.set('Check-in realizado');
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.erro.set(err.error?.message || 'Erro ao realizar check-in');
        this.actionLoading.set(false);
      },
    });
  }

  protected realizarCheckout(): void {
    this.actionLoading.set(true);
    this.erro.set('');
    this.reservaService
      .checkout(this.reservaId, { formaPagamento: this.formaPagamento })
      .subscribe({
        next: (data) => {
          this.reserva.set(data);
          this.showCheckoutForm.set(false);
          this.sucesso.set('Check-out realizado com sucesso');
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.erro.set(err.error?.message || 'Erro ao realizar check-out');
          this.actionLoading.set(false);
        },
      });
  }

  protected cancelarReserva(): void {
    if (!this.showCancelarModal()) {
      this.showCancelarModal.set(true);
      return;
    }
    this.showCancelarModal.set(false);
    this.actionLoading.set(true);
    this.erro.set('');
    this.reservaService.cancelar(this.reservaId).subscribe({
      next: (data) => {
        this.reserva.set(data);
        this.sucesso.set('Reserva cancelada');
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.erro.set(err.error?.message || 'Erro ao cancelar reserva');
        this.actionLoading.set(false);
      },
    });
  }

  protected gerarCupomEntrada(): void {
    this.reservaService.cupomEntrada(this.reservaId).subscribe({
      next: (data) => {
        this.cupomEntrada.set(data);
        scrollToBottom();
      },
      error: (err) => this.erro.set(err.error?.message || 'Erro ao gerar cupom'),
    });
  }

  protected gerarCupomSaida(): void {
    this.reservaService.cupomSaida(this.reservaId).subscribe({
      next: (data) => {
        this.cupomSaida.set(data);
        scrollToBottom();
      },
      error: (err) => this.erro.set(err.error?.message || 'Erro ao gerar cupom'),
    });
  }

  imprimirCupomEntrada() {
    this.showCupomEntradaPrint.set(true);

    setTimeout(() => {
      window.print();
      this.showCupomEntradaPrint.set(false);
    });
  }

  imprimirCupomSaida() {
    this.showCupomSaidaPrint.set(true);

    setTimeout(() => {
      window.print();
      this.showCupomSaidaPrint.set(false);
    });
  }

  protected canAssociarPlaca(): boolean {
    const r = this.reserva();
    return !!r && !r.placaVeiculo && r.status !== 'Cancelada' && r.status !== 'CheckoutRealizado';
  }

  protected canCheckin(): boolean {
    const r = this.reserva();
    return !!r && !!r.placaVeiculo && (r.status === 'Pendente' || r.status === 'Confirmada');
  }

  protected canCheckout(): boolean {
    const r = this.reserva();
    return !!r && r.status === 'CheckinRealizado';
  }

  protected canCancelar(): boolean {
    const r = this.reserva();
    return !!r && r.status !== 'CheckoutRealizado' && r.status !== 'Cancelada';
  }

  protected getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Pendente: 'badge--pendente',
      Confirmada: 'badge--confirmada',
      CheckinRealizado: 'badge--checkin',
      CheckoutRealizado: 'badge--checkout',
      Cancelada: 'badge--cancelada',
    };
    return map[status] || '';
  }

  protected getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      Pendente: 'Pendente',
      Confirmada: 'Confirmada',
      CheckinRealizado: 'Check-in Realizado',
      CheckoutRealizado: 'Check-out Realizado',
      Cancelada: 'Cancelada',
    };
    return map[status] || status;
  }
}
