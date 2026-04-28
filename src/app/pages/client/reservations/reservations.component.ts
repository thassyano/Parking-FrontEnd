import { CurrencyPipe, ViewportScroller } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TipoVaga } from '../../../core/models/enums/tipo-vaga.enum';
import { OrcamentoResponse } from '../../../core/models/reserva/orcamento/orcamento-response.model';
import { ClientFlowService } from '../../../core/services/client/client-flow.service';
import { OrcamentoService } from '../../../core/services/orcamento/orcamento.service';
import { ReservaService } from '../../../core/services/reserva/reserva.service';
import { formatToISO } from '../../../core/utils/date/format-date-to-ISO';
import { scrollToTop } from '../../../core/utils/viewport/scroll-to-top';
import { Patterns } from '../../../core/utils/patterns/form-patterns';

@Component({
  selector: 'app-reservations',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.css',
})
export class ReservationsComponent implements OnInit {
  private readonly clientFlowService = inject(ClientFlowService);
  private readonly orcamentoService = inject(OrcamentoService);
  private readonly reservaService = inject(ReservaService);
  private readonly router = inject(Router);
  private readonly scroller = inject(ViewportScroller);

  protected readonly clientFlow = this.clientFlowService.clientReservationData();
  protected readonly TipoVaga = TipoVaga;

  public isLoading = signal(false);
  public isConfirmationVisible = signal(false);
  public budget = signal<OrcamentoResponse | null>(null);
  public isBudgetLoading = signal(false);
  public errorMessage = signal('');

  public isCoveredSpotAvailable = computed(() => this.clientFlow.vagasCobertaDisponiveis > 0);
  public isUncoveredSpotAvailable = computed(() => this.clientFlow.vagasDescobertaDisponiveis > 0);

  public formattedEntryDateTime = computed(() => [
    this.clientFlow.dataEntrada,
    this.clientFlow.horaEntrada,
  ]);

  public formattedExitDateTime = computed(() => [
    this.clientFlow.dataSaida,
    this.clientFlow.horaSaida,
  ]);

  protected reservationForm = new FormGroup({
    customerName: new FormControl<string>('', [Validators.required]),
    customerPhone: new FormControl<string>('', [
      Validators.required,
      Validators.maxLength(11),
      Validators.pattern(Patterns.phone),
    ]),
    vehiclePlate: new FormControl<string>('', [
      Validators.required,
      Validators.pattern(Patterns.vehiclePlate),
    ]),
    spotType: new FormControl<TipoVaga>(TipoVaga.Coberta, [Validators.required]),
  });

  ngOnInit(): void {
    if (!this.clientFlow.dataEntrada) {
      this.router.navigate(['/client']);
      return;
    }

    if (!this.isCoveredSpotAvailable() && this.isUncoveredSpotAvailable()) {
      this.reservationForm.controls.spotType.setValue(TipoVaga.Descoberta);
    }

    this.reservationForm.controls.spotType.valueChanges.subscribe(() => {
      this.calculateBudget();
    });

    this.calculateBudget();
  }

  public calculateBudget(): void {
    this.isBudgetLoading.set(true);

    const requestEntryDate = formatToISO(this.formattedEntryDateTime()[0]);

    this.orcamentoService
      .calcular({
        tipoVaga: this.reservationForm.controls.spotType.value!,
        dataEntrada: requestEntryDate,
        qtdDias: this.clientFlow.qtdDias,
      })
      .subscribe({
        next: (data) => {
          this.budget.set(data);
          this.isBudgetLoading.set(false);
        },
        error: (err) => {
          scrollToTop(this.scroller);
          this.errorMessage.set(err.message);
          this.isBudgetLoading.set(false);
        },
      });
  }

  public openConfirmation(): void {
    if (this.reservationForm.invalid) {
      this.reservationForm.markAllAsTouched();

      const errors: string[] = [];

      if (this.reservationForm.controls.customerName.invalid) {
        errors.push('Nome');
      }

      if (this.reservationForm.controls.customerPhone.invalid) {
        if (this.reservationForm.controls.customerPhone.errors?.['required']) {
          errors.push('Telefone');
        } else if (this.reservationForm.controls.customerPhone.errors?.['pattern']) {
          errors.push('Telefone (Formato inválido)');
        } else if (this.reservationForm.controls.customerPhone.errors?.['max']) {
          errors.push('Telefone (Máximo 11 caracteres)');
        }
      }

      if (this.reservationForm.controls.vehiclePlate.invalid) {
        errors.push('Placa');
      }

      if (this.reservationForm.controls.spotType.invalid) {
        errors.push('Tipo de vaga');
      }

      this.errorMessage.set(
        errors.length ? `Preencha os campos: ${errors.join(', ')}` : 'Formulário inválido',
      );

      scrollToTop(this.scroller);

      return;
    }

    this.errorMessage.set('');
    this.isConfirmationVisible.set(true);
  }

  public closeConfirmation(): void {
    this.isConfirmationVisible.set(false);
  }

  public confirm(): void {
    if (this.reservationForm.invalid) return;

    const { customerName, customerPhone, vehiclePlate, spotType } = this.reservationForm.value;

    this.isConfirmationVisible.set(false);
    this.isLoading.set(true);
    this.errorMessage.set('');

    const requestEntryDate = formatToISO(this.formattedEntryDateTime()[0]);
    const requestExitDate = formatToISO(this.formattedExitDateTime()[0]);

    this.clientFlowService.save();

    this.reservaService
      .criarOnline({
        nomeCliente: customerName!,
        telefoneCliente: customerPhone!,
        placaVeiculo: vehiclePlate || undefined,
        tipoVaga: spotType!,
        dataEntrada: `${requestEntryDate}T${this.clientFlow.horaEntrada || '00:00'}`,
        dataSaidaPrevista: `${requestExitDate}T${this.clientFlow.horaSaida || '00:00'}`,
        qtdDias: this.clientFlow.qtdDias,
      })
      .subscribe({
        next: (reservation) => {
          this.reservaService.whatsapp(reservation.id).subscribe({
            next: (wp) => {
              this.clientFlowService.resetClienteFlow();
              window.open(wp.url, '_blank');
              this.isLoading.set(false);
            },
            error: (error) => {
              this.errorMessage.set(error.message);
              this.clientFlowService.resetClienteFlow();
              scrollToTop(this.scroller);
              this.router.navigate(['/']);
            },
          });
        },
        error: (err) => {
          scrollToTop(this.scroller);
          if (err.error?.errors) {
            const allMessages = Object.values(err.error.errors as Record<string, string[]>).flat();

            const formatted = allMessages.map((msg, index) =>
              index === 0 ? msg : msg.toLowerCase(),
            );

            this.errorMessage.set(formatted.join(', '));
          } else {
            this.errorMessage.set(err.error?.title);
          }
          this.isLoading.set(false);
        },
      });
  }
}
