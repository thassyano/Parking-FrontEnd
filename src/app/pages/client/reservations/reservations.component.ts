import { CurrencyPipe, ViewportScroller } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CarroEntry } from '../../../core/models/availability/client-flow.model';
import { TipoVaga } from '../../../core/models/enums/tipo-vaga.enum';
import { OrcamentoResponse } from '../../../core/models/reserva/orcamento/orcamento-response.model';
import { ClientFlowService } from '../../../core/services/client/client-flow.service';
import { OrcamentoService } from '../../../core/services/orcamento/orcamento.service';
import { ReservaService } from '../../../core/services/reserva/reserva.service';
import { formatToISO } from '../../../core/utils/date/format-date-to-ISO';
import { Patterns } from '../../../core/utils/patterns/form-patterns';
import { scrollToTop } from '../../../core/utils/viewport/scroll-to-top';

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
  public isBudgetLoading = signal(false);
  public errorMessage = signal('');

  public carros = signal<CarroEntry[]>([]);
  public carroTipoVaga = signal<TipoVaga[]>([]);
  public carroPlaca = signal<string[]>([]);
  public orcamentos = signal<(OrcamentoResponse | null)[]>([]);

  public readonly totalCartao = computed(() =>
    this.orcamentos().reduce((sum, o) => sum + (o?.valorTotalCartao ?? 0), 0),
  );

  public readonly totalPixDinheiro = computed(() =>
    this.orcamentos().reduce((sum, o) => sum + (o?.valorTotalPixDinheiro ?? 0), 0),
  );

  public readonly totalEconomia = computed(() =>
    this.orcamentos().reduce((sum, o) => sum + (o?.economiaTotal ?? 0), 0),
  );

  public readonly todosOrcamentosCarregados = computed(() =>
    this.orcamentos().every((o) => o !== null),
  );

  public readonly isMultiVehicle = computed(() => this.carros().length > 1);

  protected reservationForm = new FormGroup({
    customerName: new FormControl<string>('', [Validators.required]),
    customerPhone: new FormControl<string>('', [
      Validators.required,
      Validators.maxLength(11),
      Validators.pattern(Patterns.phone),
    ]),
  });

  ngOnInit(): void {
    const flow = this.clientFlow;

    if (!flow.dataEntrada) {
      this.router.navigate(['/client']);
      return;
    }

    const carros: CarroEntry[] = flow.carros?.length
      ? flow.carros
      : [
          {
            dataEntrada: flow.dataEntrada,
            horaEntrada: flow.horaEntrada,
            dataSaida: flow.dataSaida,
            horaSaida: flow.horaSaida,
            qtdDias: flow.qtdDias,
            tipoVaga: flow.vagasCobertaDisponiveis > 0 ? 'Coberta' : 'Descoberta',
            placa: '',
            vagasCobertaDisponiveis: flow.vagasCobertaDisponiveis,
            vagasDescobertaDisponiveis: flow.vagasDescobertaDisponiveis,
          },
        ];

    this.carros.set(carros);
    this.carroTipoVaga.set(
      carros.map((c) => (c.vagasCobertaDisponiveis > 0 ? TipoVaga.Coberta : TipoVaga.Descoberta)),
    );
    this.carroPlaca.set(carros.map(() => ''));
    this.orcamentos.set(carros.map(() => null));

    this.calcularTodosOrcamentos();
  }

  public isCoveredAvailable(index: number): boolean {
    return this.carros()[index]?.vagasCobertaDisponiveis > 0;
  }

  public isUncoveredAvailable(index: number): boolean {
    return this.carros()[index]?.vagasDescobertaDisponiveis > 0;
  }

  public calcularTodosOrcamentos(): void {
    this.isBudgetLoading.set(true);

    const requests = this.carros().map((carro, i) =>
      this.orcamentoService.calcular({
        tipoVaga: this.carroTipoVaga()[i],
        dataEntrada: formatToISO(carro.dataEntrada),
        qtdDias: carro.qtdDias,
      }),
    );

    forkJoin(requests).subscribe({
      next: (lista) => {
        this.orcamentos.set(lista);
        this.isBudgetLoading.set(false);
      },
      error: (err) => {
        scrollToTop(this.scroller);
        this.errorMessage.set(err.error?.message ?? 'Erro ao calcular preços');
        this.isBudgetLoading.set(false);
      },
    });
  }

  public calcularOrcamentoCarro(index: number): void {
    const carro = this.carros()[index];
    this.orcamentoService
      .calcular({
        tipoVaga: this.carroTipoVaga()[index],
        dataEntrada: formatToISO(carro.dataEntrada),
        qtdDias: carro.qtdDias,
      })
      .subscribe({
        next: (orc) => {
          const lista = [...this.orcamentos()];
          lista[index] = orc;
          this.orcamentos.set(lista);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message ?? 'Erro ao calcular preço');
        },
      });
  }

  public updatePlaca(index: number, value: string): void {
    const placas = [...this.carroPlaca()];
    placas[index] = value.toUpperCase();
    this.carroPlaca.set(placas);
  }

  public updateTipoVaga(index: number, value: TipoVaga): void {
    const tipos = [...this.carroTipoVaga()];
    tipos[index] = value;
    this.carroTipoVaga.set(tipos);
    this.calcularOrcamentoCarro(index);
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
        } else if (this.reservationForm.controls.customerPhone.errors?.['maxlength']) {
          errors.push('Telefone (Máximo 11 caracteres)');
        }
      }

      this.errorMessage.set(
        errors.length ? `Preencha os campos: ${errors.join(', ')}` : 'Formulário inválido',
      );

      scrollToTop(this.scroller);
      return;
    }

    const placaRegex = new RegExp(Patterns.vehiclePlate);

    const placasInvalidas: number[] = [];
    const placasVazias: number[] = [];
    const placasDuplicadas: number[] = [];

    const mapa = new Map<string, number[]>();

    this.carroPlaca().forEach((placa, i) => {
      if (!placa) {
        placasVazias.push(i + 1);
        return;
      }

      const normalizada = placa.toUpperCase();

      if (!placaRegex.test(normalizada)) {
        placasInvalidas.push(i + 1);
        return;
      }

      if (!mapa.has(normalizada)) {
        mapa.set(normalizada, []);
      }

      mapa.get(normalizada)!.push(i + 1);
    });

    mapa.forEach((indices) => {
      if (indices.length > 1) {
        placasDuplicadas.push(...indices);
      }
    });

    if (placasVazias.length || placasInvalidas.length || placasDuplicadas.length) {
      const erros: string[] = [];

      if (placasVazias.length) {
        erros.push(`Placa obrigatória no(s) veículo(s): ${placasVazias.join(', ')}`);
      }

      if (placasInvalidas.length) {
        erros.push(`Placa inválida no(s) veículo(s): ${placasInvalidas.join(', ')}`);
      }

      if (placasDuplicadas.length) {
        erros.push(
          `Placas duplicadas no(s) veículo(s): ${[...new Set(placasDuplicadas)].join(', ')}`,
        );
      }

      this.errorMessage.set(erros.join(' | '));
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

    const { customerName, customerPhone } = this.reservationForm.value;
    const carros = this.carros();

    this.isConfirmationVisible.set(false);
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.clientFlowService.save();

    if (carros.length === 1) {
      const carro = carros[0];
      this.reservaService
        .criarOnline({
          nomeCliente: customerName!,
          telefoneCliente: customerPhone!,
          placaVeiculo: this.carroPlaca()[0] || undefined,
          tipoVaga: this.carroTipoVaga()[0],
          dataEntrada: `${formatToISO(carro.dataEntrada)}T${carro.horaEntrada || '00:00'}`,
          dataSaidaPrevista: `${formatToISO(carro.dataSaida)}T${carro.horaSaida || '00:00'}`,
          qtdDias: carro.qtdDias,
        })
        .subscribe({
          next: (reserva) => {
            this.reservaService.whatsapp(reserva.id).subscribe({
              next: (wp) => {
                this.clientFlowService.resetClienteFlow();
                window.open(wp.url, '_blank');
                this.isLoading.set(false);
              },
              error: () => {
                this.clientFlowService.resetClienteFlow();
                this.router.navigate(['/']);
              },
            });
          },
          error: (err) => {
            scrollToTop(this.scroller);
            this.errorMessage.set(err.error?.message ?? 'Erro ao criar reserva');
            this.isLoading.set(false);
          },
        });
    } else {
      this.reservaService
        .criarOnlineLote({
          nomeCliente: customerName!,
          telefoneCliente: customerPhone!,
          carros: carros.map((carro, i) => ({
            placaVeiculo: this.carroPlaca()[i] || undefined,
            tipoVaga: this.carroTipoVaga()[i],
            dataEntrada: `${formatToISO(carro.dataEntrada)}T${carro.horaEntrada || '00:00'}`,
            dataSaidaPrevista: `${formatToISO(carro.dataSaida)}T${carro.horaSaida || '00:00'}`,
            qtdDias: carro.qtdDias,
          })),
        })
        .subscribe({
          next: (resultado) => {
            const ids = resultado.reservas.map((r: any) => r.id);
            this.reservaService.whatsappLote(ids).subscribe({
              next: (wp) => {
                this.clientFlowService.resetClienteFlow();
                window.open(wp.url, '_blank');
                this.isLoading.set(false);
              },
              error: () => {
                this.clientFlowService.resetClienteFlow();
                this.router.navigate(['/']);
              },
            });
          },
          error: (err) => {
            scrollToTop(this.scroller);
            this.errorMessage.set(err.error?.message ?? 'Erro ao criar reservas');
            this.isLoading.set(false);
          },
        });
    }
  }

  public formatDateTime(date: string, time: string): string {
    if (!date) return '';
    const [year, month, day] = date.includes('-') ? date.split('-') : date.split('/').reverse();
    return time ? `${day}/${month}/${year} ${time}` : `${day}/${month}/${year}`;
  }
}
