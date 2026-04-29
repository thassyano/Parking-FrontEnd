import { Component, input } from '@angular/core';
import { ReservaStatus } from '../../core/models/enums/reserva-status.enum';
import { Reserva } from '../../core/models/reserva/reserva.model';

@Component({
  selector: 'app-reservation-info',
  imports: [],
  templateUrl: './reservation-info.component.html',
  styleUrl: './reservation-info.component.css',
})
export class ReservationInfoComponent {
  public reservas = input.required<Reserva[]>();

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
}
