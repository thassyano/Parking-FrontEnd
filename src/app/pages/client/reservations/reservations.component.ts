import { CurrencyPipe, ViewportScroller } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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

  public readonly placasForm = new FormArray<FormControl<string>>([]);

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
      this.router.navigate(['/cliente']);
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

    carros.forEach(() =>
      this.placasForm.push(
        new FormControl<string>('', {
          nonNullable: true,
          validators: [Validators.required, Validators.pattern(Patterns.vehiclePlate)],
        }),
      ),
    );

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
        console.log(err);
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
    this.placasForm.at(index).setValue(value.toUpperCase());
    this.placasForm.at(index).markAsTouched();
  }

  public placaError(index: number): string {
    const ctrl = this.placasForm.at(index);
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return '';
    if (ctrl.hasError('required')) return 'Placa obrigatória.';
    if (ctrl.hasError('pattern'))
      return 'Placa inválida. Use o formato antigo (ABC1234) ou Mercosul (ABC1D23).';
    return 'Placa inválida.';
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
      this.errorMessage.set('Preencha os campos obrigatórios corretamente.');
      scrollToTop(this.scroller);
      return;
    }

    this.placasForm.markAllAsTouched();

    if (this.placasForm.invalid) {
      this.errorMessage.set('Corrija as placas antes de continuar.');
      scrollToTop(this.scroller);
      return;
    }

    const placasDuplicadas: number[] = [];
    const mapa = new Map<string, number[]>();

    this.placasForm.controls.forEach((ctrl, i) => {
      const normalizada = ctrl.value.toUpperCase();
      if (!mapa.has(normalizada)) mapa.set(normalizada, []);
      mapa.get(normalizada)!.push(i + 1);
    });

    mapa.forEach((indices) => {
      if (indices.length > 1) placasDuplicadas.push(...indices);
    });

    if (placasDuplicadas.length) {
      this.errorMessage.set(
        `Placas duplicadas no(s) veículo(s): ${[...new Set(placasDuplicadas)].join(', ')}`,
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
          placaVeiculo: this.placasForm.at(0).value || undefined,
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
            placaVeiculo: this.placasForm.at(i).value || undefined,
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

  public fieldError(campo: string): string {
    const ctrl = this.reservationForm.get(campo);
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return '';

    if (ctrl.hasError('required')) return 'Campo obrigatório.';

    if (ctrl.hasError('maxlength')) {
      const max = ctrl.getError('maxlength').requiredLength;
      return `Máximo de ${max} caracteres.`;
    }

    if (ctrl.hasError('pattern')) {
      if (campo === 'customerPhone') return 'Informe um telefone válido com DDD (ex: 31912345678).';
    }

    return 'Campo inválido.';
  }
}
