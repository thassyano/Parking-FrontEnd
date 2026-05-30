import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReservaService } from '../../core/services/reserva/reserva.service';
import { ConfirmacaoReservaResponse } from '../../core/models/reserva/confirmacao-reserva-response.interface';

type Estado = 'carregando' | 'sucesso' | 'cancelada' | 'erro';

@Component({
  selector: 'app-confirm-reservation',
  imports: [RouterLink, DatePipe],
  templateUrl: './confirm-reservation.component.html',
  styleUrl: './confirm-reservation.component.css',
})
export class ConfirmReservationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly reservaService = inject(ReservaService);

  estado = signal<Estado>('carregando');
  dados = signal<ConfirmacaoReservaResponse | null>(null);
  mensagemErro = signal('');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.mensagemErro.set('Link inválido. Nenhum token encontrado.');
      this.estado.set('erro');
      return;
    }

    this.reservaService.confirmarPorToken(token).subscribe({
      next: (res) => {
        this.dados.set(res);
        if (res.status === 'Cancelada') {
          this.estado.set('cancelada');
        } else if (res.confirmada) {
          this.estado.set('sucesso');
        } else {
          this.estado.set('sucesso');
        }
      },
      error: (err) => {
        if (err?.error?.status === 'Cancelada') {
          this.estado.set('cancelada');
          return;
        }
        this.mensagemErro.set(err?.error?.message ?? 'Não foi possível confirmar a reserva.');
        this.estado.set('erro');
      },
    });
  }
}
