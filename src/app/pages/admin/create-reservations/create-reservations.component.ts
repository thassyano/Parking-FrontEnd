import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { ClientNameLengths } from '../../../constants/cliente-name-lenght';
import { CarroPresencialLoteRequest } from '../../../core/models/reserva/carros/carro-lote-request.interface';
import { ConflitoPorPlaca, ReservaService } from '../../../core/services/reserva/reserva.service';
import { Patterns } from '../../../core/utils/patterns/form-patterns';
import { cpfValidator } from '../../../core/utils/reservation/cpf-validator';
import { saidaPosteriorEntradaValidator } from '../../../core/utils/reservation/entry-exit-date-validator';
import {
  normalizeCpfForSubmit,
  sanitizeClientName,
  sanitizeCpf,
  sanitizePhone,
  sanitizePlate,
} from '../../../core/utils/reservation/reservation-utils';

@Component({
  selector: 'app-create-reservations',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './create-reservations.component.html',
  styleUrl: './create-reservations.component.css',
})
export class CreateReservationsComponent implements OnInit, OnDestroy {
  protected loading = signal(false);
  protected erro = signal('');

  // Conflito de placa
  protected conflitos = signal<ConflitoPorPlaca[]>([]);
  protected isConflitoVisible = signal(false);
  protected readonly todosConflitosPodemAtualizar = computed(() =>
    this.conflitos().length > 0 && this.conflitos().every((c) => c.podeAtualizar),
  );
  private payloadPendente: (() => void) | null = null;

  private hoje = new Date();
  private amanha = new Date(this.hoje.getTime() + 86_400_000);
  private sub = new Subscription();

  private reservaService = inject(ReservaService);
  private router = inject(Router);

  protected form = new FormGroup({
    nomeCliente: new FormControl('', [
      Validators.required,
      Validators.minLength(ClientNameLengths.min),
      Validators.maxLength(ClientNameLengths.max),
      Validators.pattern(Patterns.clientName),
    ]),
    telefoneCliente: new FormControl('', [Validators.required, Validators.pattern(Patterns.phone)]),
    cpfCliente: new FormControl('', [cpfValidator()]),
    veiculos: new FormArray([this.criarVeiculoGroup()]),
  });

  get veiculosArray(): FormArray {
    return this.form.get('veiculos') as FormArray;
  }

  veiculoGroup(index: number): FormGroup {
    return this.veiculosArray.at(index) as FormGroup;
  }

  ngOnInit(): void {
    this.veiculosArray.controls.forEach((_, i) => this.inscreverCalculoDias(i));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private criarVeiculoGroup(): FormGroup {
    const dataEntrada = this.hoje.toISOString().split('T')[0];
    const horaEntrada = this.hoje.toTimeString().slice(0, 5);
    const dataSaida = this.amanha.toISOString().split('T')[0];

    return new FormGroup(
      {
        placaVeiculo: new FormControl('', [
          Validators.required,
          Validators.pattern(Patterns.vehiclePlate),
        ]),
        tipoVaga: new FormControl('Coberta', Validators.required),
        dataEntrada: new FormControl(dataEntrada, Validators.required),
        horaEntrada: new FormControl(horaEntrada, Validators.required),
        dataSaida: new FormControl(dataSaida, Validators.required),
        horaSaida: new FormControl(horaEntrada, Validators.required),
        qtdDias: new FormControl({ value: 0, disabled: true }, Validators.min(0)),
        observacoes: new FormControl(''),
      },
      { validators: saidaPosteriorEntradaValidator() },
    );
  }

  protected adicionarVeiculo(): void {
    const index = this.veiculosArray.length;
    this.veiculosArray.push(this.criarVeiculoGroup());
    this.inscreverCalculoDias(index);
  }

  protected removerVeiculo(index: number): void {
    if (this.veiculosArray.length > 1) {
      this.veiculosArray.removeAt(index);
    }
  }

  private inscreverCalculoDias(index: number): void {
    const group = this.veiculoGroup(index);
    const campos = ['dataEntrada', 'horaEntrada', 'dataSaida', 'horaSaida'];
    campos.forEach((campo) => {
      this.sub.add(group.get(campo)!.valueChanges.subscribe(() => this.calcularDias(index)));
    });
  }

  private calcularDias(index: number): void {
    const group = this.veiculoGroup(index);
    const dataEntrada = group.get('dataEntrada')!.value;
    const horaEntrada = group.get('horaEntrada')!.value;
    const dataSaida = group.get('dataSaida')!.value;
    const horaSaida = group.get('horaSaida')!.value;

    if (!dataEntrada || !dataSaida) return;

    const entrada = new Date(`${dataEntrada}T${horaEntrada || '00:00'}`);
    const saida = new Date(`${dataSaida}T${horaSaida || '00:00'}`);

    if (saida <= entrada) return;

    const horas = (saida.getTime() - entrada.getTime()) / 3_600_000;
    const dias = horas <= 12 ? 0 : Math.floor(horas / 24) || 1;
    group.get('qtdDias')!.setValue(dias, { emitEvent: false });
  }

  protected onNomeClienteChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const { value } = sanitizeClientName(input.value);
    const ctrl = this.form.get('nomeCliente')!;
    if (value !== input.value) {
      ctrl.setValue(value, { emitEvent: false });
    }
  }

  protected onTelefoneClienteChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const { value } = sanitizePhone(input.value);
    const ctrl = this.form.get('telefoneCliente')!;
    if (value !== input.value) {
      ctrl.setValue(value, { emitEvent: false });
    }
  }

  protected onCpfClienteChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const { value } = sanitizeCpf(input.value);
    const ctrl = this.form.get('cpfCliente')!;
    if (value !== input.value) {
      ctrl.setValue(value, { emitEvent: false });
    }
  }

  protected onPlacaChange(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const { value } = sanitizePlate(input.value);
    const ctrl = this.veiculoGroup(index).get('placaVeiculo')!;
    if (value !== input.value) {
      ctrl.setValue(value, { emitEvent: false });
    }
  }

  protected fieldError(campo: string, veiculoIndex?: number): string {
    const ctrl =
      veiculoIndex !== undefined
        ? this.veiculoGroup(veiculoIndex).get(campo)
        : this.form.get(campo);

    if (campo === 'horaSaida' && veiculoIndex !== undefined) {
      const group = this.veiculoGroup(veiculoIndex);
      if (group.hasError('saidaAnteriorEntrada') && ctrl?.touched) {
        return 'A saída não pode ser anterior nem igual à entrada.';
      }
    }

    if (!ctrl || !ctrl.invalid || !ctrl.touched) return '';

    if (ctrl.hasError('required')) return 'Campo obrigatório.';

    if (ctrl.hasError('minlength')) {
      const min = ctrl.getError('minlength').requiredLength;
      return `Mínimo de ${min} caracteres.`;
    }

    if (ctrl.hasError('maxlength')) {
      const max = ctrl.getError('maxlength').requiredLength;
      return `Máximo de ${max} caracteres.`;
    }

    if (ctrl.hasError('pattern')) {
      if (campo === 'telefoneCliente')
        return 'Informe um telefone válido com DDD (ex: 31912345678).';
      if (campo === 'placaVeiculo')
        return 'Placa inválida. Use o formato antigo (ABC1234) ou Mercosul (ABC1D23).';
      if (campo === 'nomeCliente') return 'Nome deve conter apenas letras.';
    }

    if (ctrl.hasError('cpfInvalid')) return 'CPF informado é inválido.';

    if (ctrl.hasError('min')) return 'Quantidade de dias inválida.';

    return 'Campo inválido.';
  }

  protected submeter(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.erro.set('Preencha todos os campos corretamente.');
      return;
    }

    const placas = this.veiculosArray.controls.map(
      (_, i) => this.veiculoGroup(i).get('placaVeiculo')!.value?.toUpperCase() ?? '',
    );

    const mapa = new Map<string, number[]>();
    placas.forEach((placa, i) => {
      if (!mapa.has(placa)) mapa.set(placa, []);
      mapa.get(placa)!.push(i + 1);
    });

    const duplicadas: number[] = [];
    mapa.forEach((indices) => {
      if (indices.length > 1) duplicadas.push(...indices);
    });

    if (duplicadas.length) {
      this.erro.set(`Placas duplicadas no(s) veículo(s): ${[...new Set(duplicadas)].join(', ')}`);
      return;
    }

    this.erro.set('');
    const { nomeCliente, telefoneCliente, cpfCliente, veiculos } = this.form.value;
    const cpfNormalizado = cpfCliente ? normalizeCpfForSubmit(cpfCliente) : undefined;

    // Verifica conflitos antes de criar
    this.loading.set(true);
    const checks = veiculos!.map((v, i) =>
      this.reservaService.verificarConflito(
        v.placaVeiculo!.toUpperCase(),
        `${v.dataEntrada}T${v.horaEntrada || '00:00'}`,
        `${v.dataSaida}T${v.horaSaida || '00:00'}`,
      ),
    );

    forkJoin(checks).subscribe({
      next: (resultados) => {
        this.loading.set(false);
        const encontrados = resultados.filter((r): r is ConflitoPorPlaca => r !== null);

        if (encontrados.length) {
          this.conflitos.set(encontrados);
          this.payloadPendente = () => this.executarCriacao(nomeCliente!, telefoneCliente!, cpfNormalizado, veiculos!);
          this.isConflitoVisible.set(true);
        } else {
          this.executarCriacao(nomeCliente!, telefoneCliente!, cpfNormalizado, veiculos!);
        }
      },
      error: () => {
        this.loading.set(false);
        this.executarCriacao(nomeCliente!, telefoneCliente!, cpfNormalizado, veiculos!);
      },
    });
  }

  protected rejeitarConflito(): void {
    this.isConflitoVisible.set(false);
    this.conflitos.set([]);
    this.payloadPendente = null;
  }

  protected confirmarAtualizacaoConflito(): void {
    this.isConflitoVisible.set(false);
    const veiculos = this.form.value.veiculos!;

    const atualizacoes = this.conflitos().map((conflito) => {
      const v = veiculos.find(
        (veh) => veh.placaVeiculo?.toUpperCase() === conflito.placaVeiculo.toUpperCase(),
      );
      if (!v) return null;
      return this.reservaService.atualizar(conflito.id, {
        dataSaidaPrevista: `${v.dataSaida}T${v.horaSaida || '00:00'}`,
      });
    }).filter((a): a is NonNullable<typeof a> => a !== null);

    this.loading.set(true);
    forkJoin(atualizacoes).subscribe({
      next: () => {
        this.loading.set(false);
        const placasComConflito = new Set(
          this.conflitos().map((c) => c.placaVeiculo.toUpperCase()),
        );
        this.conflitos.set([]);
        const semConflito = veiculos.filter(
          (v) => !placasComConflito.has(v.placaVeiculo?.toUpperCase() ?? ''),
        );
        const { nomeCliente, telefoneCliente, cpfCliente } = this.form.value;
        const cpfNorm = cpfCliente ? normalizeCpfForSubmit(cpfCliente) : undefined;
        if (semConflito.length) {
          this.executarCriacao(nomeCliente!, telefoneCliente!, cpfNorm, semConflito);
        } else {
          this.router.navigate(['/admin/reservas']);
        }
        this.payloadPendente = null;
      },
      error: (err) => {
        this.loading.set(false);
        this.erro.set(err.error?.message ?? 'Erro ao atualizar reserva existente');
      },
    });
  }

  private executarCriacao(
    nomeCliente: string,
    telefoneCliente: string,
    cpfCliente: string | undefined,
    veiculos: any[],
  ): void {
    this.loading.set(true);

    if (veiculos.length === 1) {
      const v = veiculos[0];
      this.reservaService
        .criarPresencial({
          nomeCliente,
          telefoneCliente,
          cpfCliente,
          placaVeiculo: v.placaVeiculo!.toUpperCase(),
          tipoVaga: v.tipoVaga!,
          dataEntrada: `${v.dataEntrada}T${v.horaEntrada || '00:00'}`,
          dataSaidaPrevista: `${v.dataSaida}T${v.horaSaida || '00:00'}`,
          qtdDias: this.veiculoGroup(0).get('qtdDias')!.value,
          observacoes: v.observacoes || undefined,
        })
        .subscribe({
          next: (reserva) => this.router.navigate(['/admin/reservas', reserva.id]),
          error: (err) => {
            this.erro.set(err.error?.message || 'Erro ao criar reserva');
            this.loading.set(false);
          },
        });
    } else {
      const carros: CarroPresencialLoteRequest[] = veiculos.map((v, i) => ({
        placaVeiculo: v.placaVeiculo!.toUpperCase(),
        tipoVaga: v.tipoVaga!,
        dataEntrada: `${v.dataEntrada}T${v.horaEntrada || '00:00'}`,
        dataSaidaPrevista: `${v.dataSaida}T${v.horaSaida || '00:00'}`,
        qtdDias: this.veiculoGroup(i).get('qtdDias')!.value,
        observacoes: v.observacoes || undefined,
      }));

      this.reservaService
        .criarPresencialLote({ nomeCliente, telefoneCliente, cpfCliente, carros })
        .subscribe({
          next: () => this.router.navigate(['/admin/reservas']),
          error: (err) => {
            this.erro.set(err.error?.message || 'Erro ao criar reservas');
            this.loading.set(false);
          },
        });
    }
  }
}
