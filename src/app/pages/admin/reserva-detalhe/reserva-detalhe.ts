import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReservaService } from '../../../core/services/reserva.service';
import { Reserva, CupomEntrada, CupomSaida } from '../../../core/models/reserva.model';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-reserva-detalhe',
  imports: [RouterLink, FormsModule, CurrencyPipe, DatePipe],
  templateUrl: './reserva-detalhe.html',
})
export class ReservaDetalhe implements OnInit {
  reserva = signal<Reserva | null>(null);
  loading = signal(true);
  actionLoading = signal(false);
  erro = signal('');
  sucesso = signal('');

  placaVeiculo = '';
  formaPagamento = 'Pix';

  showPlacaForm = signal(false);
  showCheckoutForm = signal(false);
  showEditForm = signal(false);
  novaQtdDias = 1;
  novaDataSaidaPrevista = '';
  cupomEntrada = signal<CupomEntrada | null>(null);
  cupomSaida = signal<CupomSaida | null>(null);
  showCupomEntradaPrint = signal(false);
  showCupomSaidaPrint = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservaService: ReservaService,
  ) {}

  ngOnInit() {
    this.carregarReserva();
  }

  private get reservaId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  carregarReserva() {
    this.loading.set(true);
    this.reservaService.obterPorId(this.reservaId).subscribe({
      next: (data) => {
        this.reserva.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.erro.set('Reserva nao encontrada');
        this.loading.set(false);
      },
    });
  }

  associarPlaca() {
    if (!this.placaVeiculo) return;
    this.actionLoading.set(true);
    this.erro.set('');
    this.reservaService.associarPlaca(this.reservaId, { placaVeiculo: this.placaVeiculo }).subscribe({
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

  realizarCheckin() {
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

  realizarCheckout() {
    this.actionLoading.set(true);
    this.erro.set('');
    this.reservaService.checkout(this.reservaId, { formaPagamento: this.formaPagamento }).subscribe({
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

  cancelarReserva() {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return;
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

  gerarCupomEntrada() {
    this.reservaService.cupomEntrada(this.reservaId).subscribe({
      next: (data) => this.cupomEntrada.set(data),
      error: (err) => this.erro.set(err.error?.message || 'Erro ao gerar cupom'),
    });
  }

  gerarCupomSaida() {
    this.reservaService.cupomSaida(this.reservaId).subscribe({
      next: (data) => this.cupomSaida.set(data),
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

  abrirEditForm() {
    const r = this.reserva();
    if (!r) return;
    this.novaQtdDias = r.qtdDias;
    this.novaDataSaidaPrevista = r.dataSaidaPrevista.split('T')[0];
    this.showEditForm.set(true);
  }

  alterarReserva() {
    if (!this.novaQtdDias || !this.novaDataSaidaPrevista) return;
    this.actionLoading.set(true);
    this.erro.set('');
    this.reservaService
      .alterar(this.reservaId, {
        qtdDias: this.novaQtdDias,
        dataSaidaPrevista: `${this.novaDataSaidaPrevista}T00:00:00`,
      })
      .subscribe({
        next: (data) => {
          this.reserva.set(data);
          this.showEditForm.set(false);
          this.sucesso.set('Reserva atualizada com sucesso');
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.erro.set(err.error?.message || 'Erro ao atualizar reserva');
          this.actionLoading.set(false);
        },
      });
  }

  valorPreview(): number {
    const r = this.reserva();
    if (!r) return 0;
    return r.valorDiaria * this.novaQtdDias;
  }

  canAlterar(): boolean {
    const r = this.reserva();
    return !!r && (r.status === 'Pendente' || r.status === 'Confirmada');
  }

  canAssociarPlaca(): boolean {
    const r = this.reserva();
    return !!r && !r.placaVeiculo && r.status !== 'Cancelada' && r.status !== 'CheckoutRealizado';
  }

  canCheckin(): boolean {
    const r = this.reserva();
    return !!r && !!r.placaVeiculo && (r.status === 'Pendente' || r.status === 'Confirmada');
  }

  canCheckout(): boolean {
    const r = this.reserva();
    return !!r && r.status === 'CheckinRealizado';
  }

  canCancelar(): boolean {
    const r = this.reserva();
    return !!r && r.status !== 'CheckoutRealizado' && r.status !== 'Cancelada';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Pendente: 'badge--pendente',
      Confirmada: 'badge--confirmada',
      CheckinRealizado: 'badge--checkin',
      CheckoutRealizado: 'badge--checkout',
      Cancelada: 'badge--cancelada',
    };
    return map[status] || '';
  }

  getStatusLabel(status: string): string {
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
