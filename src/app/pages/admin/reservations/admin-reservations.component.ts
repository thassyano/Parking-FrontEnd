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

  protected totalPages = computed(() =>
    Math.ceil(this.filteredReservas().length / this.pageSize()),
  );

  protected filteredReservas = computed(() => {
    const { id, telefone, nome, placa, pago } = this.localFilters();
    return this.reservas().filter((r) => {
      if (id && !String(r.id).includes(id.trim())) return false;
      if (telefone && !r.telefoneCliente?.toLowerCase().includes(telefone.trim().toLowerCase()))
        return false;
      if (nome && !r.nomeCliente?.toLowerCase().includes(nome.trim().toLowerCase())) return false;
      if (placa && !r.placaVeiculo?.toLowerCase().includes(placa.trim().toLowerCase()))
        return false;
      if (pago === 'sim' && !r.pago) return false;
      if (pago === 'nao' && r.pago) return false;
      return true;
    });
  });

  protected paginatedReservas = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredReservas().slice(start, start + this.pageSize());
  });

  protected localFilters = signal({ id: '', telefone: '', nome: '', placa: '', pago: '' });

  protected form = new FormGroup({
    status: new FormControl<string>(''),
    tipoVaga: new FormControl<string>(''),
    dataInicio: new FormControl<string>(''),
    dataFim: new FormControl<string>(''),
    id: new FormControl<string>(''),
    telefone: new FormControl<string>(''),
    nome: new FormControl<string>(''),
    placa: new FormControl<string>(''),
    pago: new FormControl<string>(''),
  });

  ngOnInit() {
    this.buscar();
  }

  protected buscar() {
    this.loading.set(true);

    const filtros: ReservaFiltros = {};
    const { status, tipoVaga, dataInicio, dataFim, id, telefone, nome, placa, pago } =
      this.form.value;

    if (status) filtros.status = status;
    if (tipoVaga) filtros.tipoVaga = tipoVaga;
    if (dataInicio) filtros.dataInicio = dataInicio;
    if (dataFim) filtros.dataFim = dataFim;

    this.localFilters.set({
      id: id ?? '',
      telefone: telefone ?? '',
      nome: nome ?? '',
      placa: placa ?? '',
      pago: pago ?? '',
    });

    this.reservaService.listar(filtros).subscribe({
      next: (data) => {
        this.reservas.set(data);
        this.currentPage.set(1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected limparFiltros() {
    this.form.reset({
      status: '',
      tipoVaga: '',
      dataInicio: '',
      dataFim: '',
      id: '',
      telefone: '',
      nome: '',
      placa: '',
      pago: '',
    });

    this.localFilters.set({ id: '', telefone: '', nome: '', placa: '', pago: '' });
    this.buscar();
  }

  protected nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      scrollToTop(this.scroller);
    }
  }

  protected prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      scrollToTop(this.scroller);
    }
  }

  protected goToPage(page: number) {
    this.currentPage.set(page);
    scrollToTop(this.scroller);
  }

  protected getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Pendente: 'badge--pendente',
      Confirmada: 'badge--confirmada',
      CheckinRealizado: 'badge--checkin',
      CheckoutRealizado: 'badge--checkout',
      Cancelada: 'badge--cancelada',
    };
    return map[status] || '';
  }

  protected getStatusLabel(status: string): string {
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

  protected goToPageInput(value: string): void {
    const page = parseInt(value, 10);
    if (!isNaN(page) && page >= 1 && page <= this.totalPages()) {
      this.goToPage(page);
    }
  }
}
