import { CurrencyPipe, DatePipe, ViewportScroller } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CarroEntry } from '../../../core/models/availability/client-flow.model';
import { TipoVaga } from '../../../core/models/enums/tipo-vaga.enum';
import { OrcamentoResponse } from '../../../core/models/reserva/orcamento/orcamento-response.model';
import { PeriodAvailability } from '../../../core/models/availability/period-availability.model';
import { PeriodAvailabilityService } from '../../../core/services/availability/period-availability.service';
import { BloqueioService } from '../../../core/services/bloqueio/bloqueio.service';
import { ClientFlowService } from '../../../core/services/client/client-flow.service';
import { OrcamentoService } from '../../../core/services/orcamento/orcamento.service';
import { ConflitoPorPlaca, ReservaService } from '../../../core/services/reserva/reserva.service';
import { WhatsAppResponse } from '../../../core/models/reserva/whats-app-response.model';
import { formatToISO } from '../../../core/utils/date/format-date-to-ISO';
import { calcularDiariasCobradas, formatDuration } from '../../../core/utils/date/format-duration';
import { VeiculoFieldsComponent } from '../../../components/veiculo-fields/veiculo-fields.component';
import { Patterns } from '../../../core/utils/patterns/form-patterns';
import { scrollToTop } from '../../../core/utils/viewport/scroll-to-top';

type VeiculoDetalhesForm = FormGroup<{
  marcaVeiculo: FormControl<string>;
  modeloVeiculo: FormControl<string>;
  corVeiculo: FormControl<string>;
}>;

@Component({
  selector: 'app-reservations',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, VeiculoFieldsComponent],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.css',
})
export class ReservationsComponent implements OnInit {
  private readonly clientFlowService = inject(ClientFlowService);
  private readonly orcamentoService = inject(OrcamentoService);
  private readonly reservaService = inject(ReservaService);
  private readonly periodService = inject(PeriodAvailabilityService);
  private readonly bloqueioService = inject(BloqueioService);
  private readonly router = inject(Router);
  private readonly scroller = inject(ViewportScroller);

  protected readonly clientFlow = this.clientFlowService.clientReservationData();
  protected readonly TipoVaga = TipoVaga;

  public isLoading = signal(false);
  public isConfirmationVisible = signal(false);
  public isBudgetLoading = signal(false);
  public isAddingVehicle = signal(false);
  public errorMessage = signal('');

  // Conflito de placa
  public conflitos = signal<ConflitoPorPlaca[]>([]);
  public isConflitoVisible = signal(false);
  public readonly todosConflitosPodemAtualizar = computed(() =>
    this.conflitos().length > 0 && this.conflitos().every((c) => c.podeAtualizar),
  );

  public carros = signal<CarroEntry[]>([]);
  public carroTipoVaga = signal<TipoVaga[]>([]);

  public readonly placasForm = new FormArray<FormControl<string>>([]);

  /** Marca, modelo e cor de cada veículo (obrigatórios). Mesma ordem de `carros`. */
  public readonly detalhesForm = new FormArray<VeiculoDetalhesForm>([]);

  protected readonly minDateToday = new Date().toLocaleDateString('en-CA');

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

    carros.forEach(() => this.adicionarControlesDoVeiculo());

    this.orcamentos.set(carros.map(() => null));

    this.calcularTodosOrcamentos();
  }

  private adicionarControlesDoVeiculo(): void {
    this.placasForm.push(
      new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(Patterns.vehiclePlate)],
      }),
    );
    this.detalhesForm.push(
      new FormGroup({
        marcaVeiculo: new FormControl<string>('', {
          nonNullable: true,
          validators: [Validators.required, Validators.maxLength(50)],
        }),
        modeloVeiculo: new FormControl<string>('', {
          nonNullable: true,
          validators: [Validators.required, Validators.maxLength(50)],
        }),
        corVeiculo: new FormControl<string>('', {
          nonNullable: true,
          validators: [Validators.required, Validators.maxLength(30)],
        }),
      }),
    );
  }

  /** Adiciona outro veículo repetindo o período do último; só avisa se não houver vaga. */
  public adicionarVeiculo(): void {
    const ultimo = this.carros().at(-1);
    if (!ultimo || this.isAddingVehicle()) return;

    const novo: CarroEntry = { ...ultimo, placa: '' };
    this.isAddingVehicle.set(true);
    this.errorMessage.set('');

    this.verificarPeriodoDoVeiculo(novo).subscribe({
      next: (resultado) => {
        this.isAddingVehicle.set(false);
        if (typeof resultado === 'string') {
          this.errorMessage.set(resultado);
          scrollToTop(this.scroller);
          return;
        }

        this.carros.set([...this.carros(), resultado]);
        this.carroTipoVaga.set([...this.carroTipoVaga(), this.tipoPadrao(resultado)]);
        this.orcamentos.set([...this.orcamentos(), null]);
        this.adicionarControlesDoVeiculo();
        this.calcularOrcamentoCarro(this.carros().length - 1);
      },
      error: (err) => {
        this.isAddingVehicle.set(false);
        this.errorMessage.set(err.error?.message ?? 'Erro ao verificar disponibilidade');
        scrollToTop(this.scroller);
      },
    });
  }

  public removerVeiculo(index: number): void {
    if (index === 0) return; // o primeiro veículo vem da tela anterior

    this.carros.set(this.carros().filter((_, i) => i !== index));
    this.carroTipoVaga.set(this.carroTipoVaga().filter((_, i) => i !== index));
    this.orcamentos.set(this.orcamentos().filter((_, i) => i !== index));
    this.placasForm.removeAt(index);
    this.detalhesForm.removeAt(index);
  }

  /** Veículos adicionais têm período próprio: ao mudar, confere bloqueio/vagas e recalcula o valor. */
  public atualizarPeriodo(
    index: number,
    campo: 'dataEntrada' | 'horaEntrada' | 'dataSaida' | 'horaSaida',
    valor: string,
  ): void {
    const atual = this.carros()[index];
    if (!atual || !valor) return;

    const isData = campo === 'dataEntrada' || campo === 'dataSaida';
    const candidato: CarroEntry = {
      ...atual,
      [campo]: isData ? this.paraDataBr(valor) : valor,
    };

    const erro = this.validarPeriodo(candidato);
    if (erro) {
      this.errorMessage.set(`Veículo ${index + 1}: ${erro}`);
      scrollToTop(this.scroller);
      return;
    }

    this.errorMessage.set('');
    this.verificarPeriodoDoVeiculo(candidato).subscribe({
      next: (resultado) => {
        if (typeof resultado === 'string') {
          this.errorMessage.set(`Veículo ${index + 1}: ${resultado}`);
          scrollToTop(this.scroller);
          return;
        }

        const carros = [...this.carros()];
        carros[index] = resultado;
        this.carros.set(carros);

        const tipos = [...this.carroTipoVaga()];
        if (!this.tipoDisponivel(resultado, tipos[index])) tipos[index] = this.tipoPadrao(resultado);
        this.carroTipoVaga.set(tipos);

        this.calcularOrcamentoCarro(index);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Erro ao verificar disponibilidade');
        scrollToTop(this.scroller);
      },
    });
  }

  public isoDate(dataBr: string): string {
    return dataBr ? formatToISO(dataBr) : '';
  }

  /**
   * Confere bloqueio de reservas online e vagas para o período do veículo.
   * Devolve o veículo com as vagas atualizadas, ou o texto do aviso quando não pode reservar.
   */
  private verificarPeriodoDoVeiculo(carro: CarroEntry): Observable<CarroEntry | string> {
    const entrada = `${formatToISO(carro.dataEntrada)}T${carro.horaEntrada || '00:00'}`;
    const saida = `${formatToISO(carro.dataSaida)}T${carro.horaSaida || '00:00'}`;

    return this.bloqueioService.verificar(entrada, saida).pipe(
      switchMap((bloqueio) =>
        bloqueio.bloqueado
          ? of(
              bloqueio.mensagem ??
                'Reservas online indisponíveis neste período. Entre em contato com o estacionamento.',
            )
          : this.periodService
              .checkPeriodAvailability(formatToISO(carro.dataEntrada), formatToISO(carro.dataSaida))
              .pipe(map((disp) => this.aplicarVagas(carro, disp))),
      ),
    );
  }

  private aplicarVagas(carro: CarroEntry, disp: PeriodAvailability): CarroEntry | string {
    const minimo = (selector: (d: PeriodAvailability['dias'][number]) => number) =>
      disp.dias?.length ? Math.min(...disp.dias.map(selector)) : 0;

    const coberta = minimo((d) => d.vagasCobertaDisponiveis);
    const descoberta = minimo((d) => d.vagasDescobertaDisponiveis);

    // Só avisa quando não há vaga nenhuma; quantidades não são mostradas ao cliente.
    if (coberta <= 0 && descoberta <= 0) {
      return 'Não há vagas disponíveis para este período. Tente outras datas ou fale com o estacionamento.';
    }

    const entrada = new Date(`${formatToISO(carro.dataEntrada)}T${carro.horaEntrada || '00:00'}`);
    const saida = new Date(`${formatToISO(carro.dataSaida)}T${carro.horaSaida || '00:00'}`);

    return {
      ...carro,
      qtdDias: calcularDiariasCobradas(entrada, saida),
      vagasCobertaDisponiveis: coberta,
      vagasDescobertaDisponiveis: descoberta,
    };
  }

  private validarPeriodo(carro: CarroEntry): string | null {
    const entrada = new Date(`${formatToISO(carro.dataEntrada)}T${carro.horaEntrada || '00:00'}`);
    const saida = new Date(`${formatToISO(carro.dataSaida)}T${carro.horaSaida || '00:00'}`);

    if (formatToISO(carro.dataEntrada) < this.minDateToday)
      return 'A data de entrada não pode ser anterior a hoje';
    if (Number.isNaN(entrada.getTime()) || Number.isNaN(saida.getTime())) return 'Período inválido';
    if (saida <= entrada) return 'A saída deve ser posterior à entrada';
    return null;
  }

  private tipoPadrao(carro: CarroEntry): TipoVaga {
    return carro.vagasCobertaDisponiveis > 0 ? TipoVaga.Coberta : TipoVaga.Descoberta;
  }

  private tipoDisponivel(carro: CarroEntry, tipo: TipoVaga): boolean {
    return tipo === TipoVaga.Coberta
      ? carro.vagasCobertaDisponiveis > 0
      : carro.vagasDescobertaDisponiveis > 0;
  }

  private paraDataBr(iso: string): string {
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
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
        dataEntrada: `${formatToISO(carro.dataEntrada)}T${carro.horaEntrada || '00:00'}`,
        dataSaidaPrevista: `${formatToISO(carro.dataSaida)}T${carro.horaSaida || '00:00'}`,
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
        dataEntrada: `${formatToISO(carro.dataEntrada)}T${carro.horaEntrada || '00:00'}`,
        dataSaidaPrevista: `${formatToISO(carro.dataSaida)}T${carro.horaSaida || '00:00'}`,
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

    this.detalhesForm.markAllAsTouched();

    if (this.detalhesForm.invalid) {
      this.errorMessage.set('Informe marca, modelo e cor de cada veículo.');
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
    this.verificarConflitosEProsseguir();
  }

  private verificarConflitosEProsseguir(): void {
    const carros = this.carros();
    const checks = carros.map((carro, i) => {
      const placa = this.placasForm.at(i).value;
      if (!placa) return null;
      const dataEntrada = `${formatToISO(carro.dataEntrada)}T${carro.horaEntrada || '00:00'}`;
      const dataSaida = `${formatToISO(carro.dataSaida)}T${carro.horaSaida || '00:00'}`;
      return this.reservaService.verificarConflito(placa, dataEntrada, dataSaida);
    });

    const validos = checks.filter((c): c is NonNullable<typeof c> => c !== null);
    if (!validos.length) {
      this.isConfirmationVisible.set(true);
      return;
    }

    this.isLoading.set(true);
    forkJoin(validos).subscribe({
      next: (resultados) => {
        this.isLoading.set(false);
        const encontrados = resultados.filter((r): r is ConflitoPorPlaca => r !== null);
        if (encontrados.length) {
          this.conflitos.set(encontrados);
          this.isConflitoVisible.set(true);
        } else {
          this.isConfirmationVisible.set(true);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.isConfirmationVisible.set(true);
      },
    });
  }

  public rejeitarConflito(): void {
    this.isConflitoVisible.set(false);
    this.conflitos.set([]);
  }

  public confirmarAtualizacaoConflito(): void {
    this.isConflitoVisible.set(false);
    const carros = this.carros();
    const telefoneCliente = this.reservationForm.get('customerPhone')!.value ?? '';

    const atualizacoes = this.conflitos().map((conflito) => {
      const index = carros.findIndex(
        (c, i) =>
          this.placasForm.at(i).value.toUpperCase() === conflito.placaVeiculo.toUpperCase(),
      );
      if (index === -1) return null;
      const carro = carros[index];
      const placa = this.placasForm.at(index).value.toUpperCase();
      const dataEntrada = `${formatToISO(carro.dataEntrada)}T${carro.horaEntrada || '00:00'}`;
      const dataSaida = `${formatToISO(carro.dataSaida)}T${carro.horaSaida || '00:00'}`;
      return this.reservaService.atualizarCliente(conflito.id, {
        dataEntrada,
        tipoVaga: this.carroTipoVaga()[index],
        dataSaidaPrevista: dataSaida,
        placaVeiculo: placa,
        telefoneCliente,
      });
    }).filter((a): a is NonNullable<typeof a> => a !== null);

    if (!atualizacoes.length) return;

    this.isLoading.set(true);
    const idsAtualizados = this.conflitos().map((c) => c.id);

    forkJoin(atualizacoes).subscribe({
      next: () => {
        const placasComConflito = new Set(
          this.conflitos().map((c) => c.placaVeiculo.toUpperCase()),
        );
        this.conflitos.set([]);

        const whatsapp$ =
          idsAtualizados.length === 1
            ? this.reservaService.whatsappAlteracao(idsAtualizados[0])
            : this.reservaService.whatsappAlteracaoLote(idsAtualizados);

        this.redirecionarWhatsApp(whatsapp$, () => this.criarReservasSemConflito(placasComConflito));
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message ?? 'Erro ao atualizar reserva existente');
        scrollToTop(this.scroller);
      },
    });
  }

  private redirecionarWhatsApp(whatsapp$: Observable<WhatsAppResponse>, depois: () => void): void {
    whatsapp$.subscribe({
      next: (wp) => {
        window.open(wp.url, '_blank');
        this.isLoading.set(false);
        depois();
      },
      error: () => {
        this.isLoading.set(false);
        depois();
      },
    });
  }

  private criarReservasSemConflito(placasComConflito: Set<string>): void {
    const carrosSemConflito = this.carros().filter(
      (_, i) => !placasComConflito.has(this.placasForm.at(i).value.toUpperCase()),
    );
    if (!carrosSemConflito.length) {
      this.clientFlowService.resetClienteFlow();
      this.router.navigate(['/']);
      return;
    }
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
          ...this.detalhesDoVeiculo(0),
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
            ...this.detalhesDoVeiculo(i),
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

  private detalhesDoVeiculo(index: number): { marcaVeiculo: string; modeloVeiculo: string; corVeiculo: string } {
    const { marcaVeiculo, modeloVeiculo, corVeiculo } = this.detalhesForm.at(index).getRawValue();
    return {
      marcaVeiculo: marcaVeiculo.trim(),
      modeloVeiculo: modeloVeiculo.trim(),
      corVeiculo: corVeiculo.trim(),
    };
  }

  public formatDateTime(date: string, time: string): string {
    if (!date) return '';
    const [year, month, day] = date.includes('-') ? date.split('-') : date.split('/').reverse();
    return time ? `${day}/${month}/${year} ${time}` : `${day}/${month}/${year}`;
  }

  /** Permanência por extenso (dias, horas e minutos) calculada a partir da entrada e saída do veículo. */
  public formatPermanencia(carro: CarroEntry): string {
    const entrada = new Date(`${formatToISO(carro.dataEntrada)}T${carro.horaEntrada || '00:00'}`);
    const saida = new Date(`${formatToISO(carro.dataSaida)}T${carro.horaSaida || '00:00'}`);
    return formatDuration(entrada, saida);
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
