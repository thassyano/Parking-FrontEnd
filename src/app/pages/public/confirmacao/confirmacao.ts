import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { ReservaService } from '../../../core/services/reserva.service';
import { Reserva, WhatsAppResponse } from '../../../core/models/reserva.model';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-confirmacao',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './confirmacao.html',
})
export class Confirmacao implements OnInit {
  reserva = signal<Reserva | null>(null);
  whatsapp = signal<WhatsAppResponse | null>(null);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private reservaService: ReservaService,
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;

    this.reservaService.obterPorId(id).subscribe({
      next: (reserva) => {
        this.reserva.set(reserva);
        this.loading.set(false);
      },
    });

    this.reservaService.whatsapp(id).subscribe({
      next: (data) => this.whatsapp.set(data),
    });
  }
}
