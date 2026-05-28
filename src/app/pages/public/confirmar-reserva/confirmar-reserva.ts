import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ReservaService, ConfirmacaoReservaResponse } from '../../../core/services/reserva.service';

@Component({
  selector: 'app-confirmar-reserva',
  imports: [RouterLink, DatePipe],
  templateUrl: './confirmar-reserva.html',
})
export class ConfirmarReserva implements OnInit {
  estado = signal<'carregando' | 'sucesso' | 'jaConfirmada' | 'cancelada' | 'erro'>('carregando');
  dados = signal<ConfirmacaoReservaResponse | null>(null);
  mensagemErro = signal('');

  constructor(
    private route: ActivatedRoute,
    private reservaService: ReservaService,
  ) {}

  ngOnInit() {
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
          this.estado.set('jaConfirmada');
        }
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Não foi possível confirmar a reserva.';
        this.mensagemErro.set(msg);
        this.estado.set('erro');
      },
    });
  }
}
