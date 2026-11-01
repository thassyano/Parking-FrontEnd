import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Bloqueio } from '../../../core/models/bloqueio/bloqueio.model';
import { BloqueioService } from '../../../core/services/bloqueio/bloqueio.service';
import { Reserva } from '../../../core/models/reserva/reserva.model';
import { ReservaService } from '../../../core/services/reserva/reserva.service';
import { DayAvailability } from '../../../core/models/availability/day-availability.model';
import { DayAvailabilityService } from '../../../core/services/availability/day-availability.service';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ReservaStatus } from '../../../core/models/enums/reserva-status.enum';
import { RouterLink } from '@angular/router';
import { ReservationInfoComponent } from "../../../components/reservation-info/reservation-info.component";

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink, ReservationInfoComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private reservaService = inject(ReservaService);
  private disponibilidadeService = inject(DayAvailabilityService);
  private bloqueioService = inject(BloqueioService);

  protected reservas = signal<Reserva[]>([]);
  protected disponibilidade = signal<DayAvailability | null>(null);
  protected isLoading = signal(true);

  protected ReservaStatus = ReservaStatus;

  // Bloqueio de novas reservas online (presencial continua liberada)
  protected bloqueios = signal<Bloqueio[]>([]);
  protected showBloqueioForm = signal(false);
  protected bloqueioLoading = signal(false);
  protected bloqueioErro = signal('');
  protected bloqueioSucesso = signal('');
  protected bloqueioInicio = '';
  protected bloqueioFim = '';
  protected bloqueioMotivo = '';

  ngOnInit() {
    this.reservaService.listar().subscribe({
      next: (data) => {
        this.reservas.set(data);
        this.isLoading.set(false);
      },
    });

    this.carregarBloqueios();

    const hoje = new Date().toISOString().split('T')[0];
    this.disponibilidadeService.consultarDia(hoje).subscribe({
      next: (data) => {
        this.disponibilidade.set(data);
      },
    });
  }

  private carregarBloqueios(): void {
    this.bloqueioService.listar().subscribe({
      next: (data) => this.bloqueios.set(data),
      error: () => this.bloqueios.set([]),
    });
  }

  protected abrirBloqueio(): void {
    this.bloqueioErro.set('');
    this.bloqueioSucesso.set('');
    this.showBloqueioForm.set(true);
  }

  protected fecharBloqueio(): void {
    this.showBloqueioForm.set(false);
    this.bloqueioInicio = '';
    this.bloqueioFim = '';
    this.bloqueioMotivo = '';
    this.bloqueioErro.set('');
  }

  protected criarBloqueio(): void {
    if (!this.bloqueioInicio || !this.bloqueioFim) {
      this.bloqueioErro.set('Informe a data e hora de início e de fim.');
      return;
    }
    if (new Date(this.bloqueioFim) <= new Date(this.bloqueioInicio)) {
      this.bloqueioErro.set('O fim deve ser depois do início.');
      return;
    }

    this.bloqueioLoading.set(true);
    this.bloqueioErro.set('');
    this.bloqueioService
      .criar({
        dataInicio: this.bloqueioInicio,
        dataFim: this.bloqueioFim,
        motivo: this.bloqueioMotivo.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.bloqueioLoading.set(false);
          this.fecharBloqueio();
          this.bloqueioSucesso.set('Reservas online bloqueadas para o período informado.');
          this.carregarBloqueios();
        },
        error: (err) => {
          this.bloqueioLoading.set(false);
          this.bloqueioErro.set(err.error?.message ?? 'Erro ao criar o bloqueio.');
        },
      });
  }

  protected removerBloqueio(bloqueio: Bloqueio): void {
    this.bloqueioLoading.set(true);
    this.bloqueioService.remover(bloqueio.id).subscribe({
      next: () => {
        this.bloqueioLoading.set(false);
        this.bloqueioSucesso.set('Bloqueio removido.');
        this.carregarBloqueios();
      },
      error: (err) => {
        this.bloqueioLoading.set(false);
        this.bloqueioErro.set(err.error?.message ?? 'Erro ao remover o bloqueio.');
      },
    });
  }

  protected get reservasRecentes(): Reserva[] {
    return this.reservas()
      .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
      .slice(0, 10);
  }
}
