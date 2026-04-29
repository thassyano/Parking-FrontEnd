import { CurrencyPipe, DatePipe, ViewportScroller } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReservaFiltros } from '../../../core/models/reserva/reserva-filtros.model';
import { Reserva } from '../../../core/models/reserva/reserva.model';
import { ReservaService } from '../../../core/services/reserva/reserva.service';
import { scrollToTop } from '../../../core/utils/viewport/scroll-to-top';
import { ReservationInfoComponent } from '../../../components/reservation-info/reservation-info.component';

@Component({
  selector: 'app-admin-reservations',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, ReservationInfoComponent],
  templateUrl: './admin-reservations.component.html',
  styleUrl: './admin-reservations.component.css',
})
export class AdminReservationsComponent implements OnInit {
  protected reservas = signal<Reserva[]>([]);
  protected loading = signal(true);

  private reservaService = inject(ReservaService);
  private readonly scroller = inject(ViewportScroller);

  protected currentPage = signal(1);
  protected pageSize = signal(10);

  protected totalPages = computed(() => Math.ceil(this.reservas().length / this.pageSize()));

  protected paginatedReservas = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.reservas().slice(start, end);
  });

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

    this.reservaService.listar(filtros).subscribe({
      next: (data) => {
        this.reservas.set(data);
        this.currentPage.set(1);
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

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      scrollToTop(this.scroller);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      scrollToTop(this.scroller);
    }
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    scrollToTop(this.scroller);
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

  protected visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();

    const maxVisible = 5;

    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;

    if (end > total) {
      end = total;
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });
}
