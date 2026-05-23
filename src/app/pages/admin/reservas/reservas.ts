import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReservaService } from '../../../core/services/reserva.service';
import { Reserva, ReservaFiltros } from '../../../core/models/reserva.model';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-reservas',
  imports: [FormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './reservas.html',
})
export class Reservas implements OnInit {
  reservas = signal<Reserva[]>([]);
  loading = signal(true);

  filtroStatus = '';
  filtroTipoVaga = '';
  filtroPlacaVeiculo = '';
  filtroDataInicio = '';
  filtroDataFim = '';

  constructor(private reservaService: ReservaService) {}

  ngOnInit() {
    this.buscar();
  }

  buscar() {
    this.loading.set(true);
    const filtros: ReservaFiltros = {};
    if (this.filtroStatus) filtros.status = this.filtroStatus;
    if (this.filtroTipoVaga) filtros.tipoVaga = this.filtroTipoVaga;
    if (this.filtroPlacaVeiculo) filtros.placaVeiculo = this.filtroPlacaVeiculo.trim().toUpperCase();
    if (this.filtroDataInicio) filtros.dataInicio = this.filtroDataInicio;
    if (this.filtroDataFim) filtros.dataFim = this.filtroDataFim;

    this.reservaService.listar(filtros).subscribe({
      next: (data) => {
        this.reservas.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  limparFiltros() {
    this.filtroStatus = '';
    this.filtroTipoVaga = '';
    this.filtroPlacaVeiculo = '';
    this.filtroDataInicio = '';
    this.filtroDataFim = '';
    this.buscar();
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
      CheckinRealizado: 'Check-in',
      CheckoutRealizado: 'Check-out',
      Cancelada: 'Cancelada',
    };
    return map[status] || status;
  }
}
