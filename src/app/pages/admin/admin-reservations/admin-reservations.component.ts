import { Component, inject, OnInit, signal } from '@angular/core';
import { ReservaService } from '../../../core/services/reserva/reserva.service';
import { Reserva } from '../../../core/models/reserva/reserva.model';
import { ReservaFiltros } from '../../../core/models/reserva/reserva-filtros.model';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-reservations',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './admin-reservations.component.html',
  styleUrl: './admin-reservations.component.css',
})
export class AdminReservationsComponent implements OnInit {
  protected reservas = signal<Reserva[]>([]);
  protected loading = signal(true);

  private reservaService = inject(ReservaService);

  protected form = new FormGroup({
    status: new FormControl<string>(''),
    tipoVaga: new FormControl<string>(''),
    dataInicio: new FormControl<string>(''),
    dataFim: new FormControl<string>(''),
  });

  ngOnInit() {
    this.buscar();
  }

  buscar() {
    this.loading.set(true);

    const filtros: ReservaFiltros = {};
    const { status, tipoVaga, dataInicio, dataFim } = this.form.value;

    if (status) filtros.status = status;
    if (tipoVaga) filtros.tipoVaga = tipoVaga;
    if (dataInicio) filtros.dataInicio = dataInicio;
    if (dataFim) filtros.dataFim = dataFim;

    console.log(dataInicio);

    this.reservaService.listar(filtros).subscribe({
      next: (data) => {
        this.reservas.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  limparFiltros() {
    this.form.reset({
      status: '',
      tipoVaga: '',
      dataInicio: '',
      dataFim: '',
    });

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
