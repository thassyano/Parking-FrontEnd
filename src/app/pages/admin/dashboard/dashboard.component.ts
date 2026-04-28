import { Component, inject, signal } from '@angular/core';
import { Reserva } from '../../../core/models/reserva/reserva.model';
import { ReservaService } from '../../../core/services/reserva/reserva.service';
import { DayAvailability } from '../../../core/models/availability/day-availability.model';
import { DayAvailabilityService } from '../../../core/services/availability/day-availability.service';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ReservaStatus } from '../../../core/models/enums/reserva-status.enum';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private reservaService = inject(ReservaService);
  private disponibilidadeService = inject(DayAvailabilityService);

  private reservas = signal<Reserva[]>([]);
  protected disponibilidade = signal<DayAvailability | null>(null);
  protected isLoading = signal(true);

  protected ReservaStatus = ReservaStatus;

  ngOnInit() {
    this.reservaService.listar().subscribe({
      next: (data) => {
        this.reservas.set(data);
        this.isLoading.set(false);
      },
    });

    const hoje = new Date().toISOString().split('T')[0];
    this.disponibilidadeService.consultarDia(hoje).subscribe({
      next: (data) => {
        this.disponibilidade.set(data);
      },
    });
  }

  protected get pendentes(): number {
    return this.reservas().filter((r) => r.status === ReservaStatus.Pendente).length;
  }

  protected get checkinRealizados(): number {
    return this.reservas().filter((r) => r.status === ReservaStatus.CheckinRealizado).length;
  }

  protected get checkoutRealizados(): number {
    return this.reservas().filter((r) => r.status === ReservaStatus.CheckoutRealizado).length;
  }

  protected get canceladas(): number {
    return this.reservas().filter((r) => r.status === ReservaStatus.Cancelada).length;
  }

  protected get reservasRecentes(): Reserva[] {
    return this.reservas()
      .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
      .slice(0, 10);
  }
}
