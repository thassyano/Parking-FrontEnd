import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReservaService } from '../../../core/services/reserva.service';
import { DisponibilidadeService } from '../../../core/services/disponibilidade.service';
import { Reserva } from '../../../core/models/reserva.model';
import { DisponibilidadeDia } from '../../../core/models/disponibilidade.model';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  reservas = signal<Reserva[]>([]);
  disponibilidade = signal<DisponibilidadeDia | null>(null);
  loading = signal(true);

  constructor(
    private reservaService: ReservaService,
    private disponibilidadeService: DisponibilidadeService,
  ) {}

  ngOnInit() {
    this.reservaService.listar().subscribe({
      next: (data) => {
        this.reservas.set(data);
        this.loading.set(false);
      },
    });

    const hoje = new Date().toISOString().split('T')[0];
    this.disponibilidadeService.consultarDia(hoje).subscribe({
      next: (data) => this.disponibilidade.set(data),
    });
  }

  get pendentes(): number {
    return this.reservas().filter((r) => r.status === 'Pendente').length;
  }

  get checkinRealizados(): number {
    return this.reservas().filter((r) => r.status === 'CheckinRealizado').length;
  }

  get checkoutRealizados(): number {
    return this.reservas().filter((r) => r.status === 'CheckoutRealizado').length;
  }

  get canceladas(): number {
    return this.reservas().filter((r) => r.status === 'Cancelada').length;
  }

  get reservasRecentes(): Reserva[] {
    return this.reservas()
      .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
      .slice(0, 10);
  }
}
