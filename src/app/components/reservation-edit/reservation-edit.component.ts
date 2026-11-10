import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { EditarReservaAdminRequest } from '../../core/models/reserva/editar-reserva-request.model';
import { Reserva } from '../../core/models/reserva/reserva.model';
import { ReservaService } from '../../core/services/reserva/reserva.service';
import { Patterns } from '../../core/utils/patterns/form-patterns';
import { cpfValidator } from '../../core/utils/reservation/cpf-validator';
import {
  normalizeCpfForSubmit,
  sanitizeCpf,
  sanitizePhone,
  sanitizePlate,
} from '../../core/utils/reservation/reservation-utils';
import { VeiculoFieldsComponent } from '../veiculo-fields/veiculo-fields.component';

/** "2026-11-05T18:02:00" -> "2026-11-05T18:02" (formato do input datetime-local). */
const paraInputDataHora = (iso: string | undefined): string => (iso ?? '').slice(0, 16);

const saidaPosteriorEntrada = (group: AbstractControl): ValidationErrors | null => {
  const entrada = group.get('dataEntrada')?.value as string;
  const saida = group.get('dataSaida')?.value as string;
  if (!entrada || !saida) return null;
  return new Date(saida) > new Date(entrada) ? null : { saidaAnteriorEntrada: true };
};

/**
 * Edição completa de uma reserva pelo admin.
 * O que pode ser mudado depende do status (as mesmas regras do back-end, que continua sendo quem decide):
 * - Pendente/Confirmada: tudo;
 * - Check-in realizado: tudo, menos o período (a cobrança passa a ser pelo tempo real);
 * - Check-out realizado: só dados do cliente, do veículo e observações.
 */
@Component({
  selector: 'app-reservation-edit',
  imports: [ReactiveFormsModule, VeiculoFieldsComponent],
  templateUrl: './reservation-edit.component.html',
  styleUrl: './reservation-edit.component.css',
})
export class ReservationEditComponent implements OnInit {
  public readonly reserva = input.required<Reserva>();
  public readonly saved = output<Reserva>();
  public readonly closed = output<void>();

  private readonly reservaService = inject(ReservaService);

  protected readonly saving = signal(false);
  protected readonly erro = signal('');

  protected readonly periodoEditavel = computed(() =>
    ['Pendente', 'Confirmada'].includes(this.reserva().status),
  );
  protected readonly vagaEditavel = computed(() =>
    ['Pendente', 'Confirmada', 'CheckinRealizado'].includes(this.reserva().status),
  );
  protected readonly placaObrigatoria = computed(() =>
    ['CheckinRealizado', 'CheckoutRealizado'].includes(this.reserva().status),
  );

  protected form!: FormGroup;

  protected veiculoGroup(): FormGroup {
    return this.form.get('veiculo') as FormGroup;
  }

  ngOnInit(): void {
    const r = this.reserva();

    this.form = new FormGroup(
      {
        nomeCliente: new FormControl(r.nomeCliente ?? '', [
          Validators.required,
          Validators.maxLength(100),
        ]),
        telefoneCliente: new FormControl(sanitizePhone(r.telefoneCliente ?? '').value, [
          Validators.required,
          Validators.pattern(Patterns.phone),
        ]),
        cpfCliente: new FormControl(r.cpfCliente ?? '', [cpfValidator()]),
        placaVeiculo: new FormControl(r.placaVeiculo ?? '', [
          ...(this.placaObrigatoria() ? [Validators.required] : []),
          Validators.pattern(Patterns.vehiclePlate),
        ]),
        veiculo: new FormGroup({
          marcaVeiculo: new FormControl(r.marcaVeiculo ?? '', [
            Validators.required,
            Validators.maxLength(50),
          ]),
          modeloVeiculo: new FormControl(r.modeloVeiculo ?? '', [
            Validators.required,
            Validators.maxLength(50),
          ]),
          corVeiculo: new FormControl(r.corVeiculo ?? '', [
            Validators.required,
            Validators.maxLength(30),
          ]),
        }),
        tipoVaga: new FormControl({ value: r.tipoVaga, disabled: !this.vagaEditavel() }),
        dataEntrada: new FormControl({
          value: paraInputDataHora(r.dataEntrada),
          disabled: !this.periodoEditavel(),
        }),
        dataSaida: new FormControl({
          value: paraInputDataHora(r.dataSaidaPrevista),
          disabled: !this.periodoEditavel(),
        }),
        observacoes: new FormControl(r.observacoes ?? '', [Validators.maxLength(500)]),
      },
      { validators: saidaPosteriorEntrada },
    );
  }

  protected onTelefoneInput(event: Event): void {
    this.sanitizar(event, 'telefoneCliente', sanitizePhone);
  }

  protected onCpfInput(event: Event): void {
    this.sanitizar(event, 'cpfCliente', sanitizeCpf);
  }

  protected onPlacaInput(event: Event): void {
    this.sanitizar(event, 'placaVeiculo', sanitizePlate);
  }

  private sanitizar(
    event: Event,
    campo: string,
    sanitizer: (v: string) => { value: string },
  ): void {
    const input = event.target as HTMLInputElement;
    const { value } = sanitizer(input.value);
    if (value !== input.value) {
      this.form.get(campo)!.setValue(value);
      input.value = value;
    }
  }

  protected fieldError(campo: string): string {
    const ctrl = this.form.get(campo);
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return '';

    if (ctrl.hasError('required')) return 'Campo obrigatório.';
    if (ctrl.hasError('maxlength')) return `Máximo de ${ctrl.getError('maxlength').requiredLength} caracteres.`;
    if (ctrl.hasError('cpfInvalid')) return 'CPF inválido.';
    if (ctrl.hasError('pattern')) {
      if (campo === 'telefoneCliente') return 'Informe um telefone válido com DDD (ex: 31912345678).';
      if (campo === 'placaVeiculo') return 'Placa inválida. Use ABC1234 ou ABC1D23.';
    }
    return 'Campo inválido.';
  }

  protected periodoInvalido(): boolean {
    return this.form.hasError('saidaAnteriorEntrada') && this.periodoEditavel();
  }

  protected salvar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.erro.set('Corrija os campos destacados antes de salvar.');
      return;
    }

    this.saving.set(true);
    this.erro.set('');

    this.reservaService.editar(this.reserva().id, this.montarRequest()).subscribe({
      next: (reserva) => {
        this.saving.set(false);
        this.saved.emit(reserva);
      },
      error: (err) => {
        this.saving.set(false);
        this.erro.set(this.mensagemDeErro(err));
      },
    });
  }

  /** Datas e vaga só vão quando mudaram: assim um campo intocado nunca dispara a regra de "período fechado". */
  private montarRequest(): EditarReservaAdminRequest {
    const r = this.reserva();
    const v = this.form.getRawValue() as Record<string, any>;
    const veiculo = v['veiculo'] as Record<string, string>;
    const cpf = normalizeCpfForSubmit(v['cpfCliente'] ?? '');

    const request: EditarReservaAdminRequest = {
      nomeCliente: (v['nomeCliente'] as string).trim(),
      telefoneCliente: (v['telefoneCliente'] as string).trim(),
      cpfCliente: cpf || undefined,
      placaVeiculo: (v['placaVeiculo'] as string).trim() || undefined,
      marcaVeiculo: veiculo['marcaVeiculo'].trim(),
      modeloVeiculo: veiculo['modeloVeiculo'].trim(),
      corVeiculo: veiculo['corVeiculo'].trim(),
      observacoes: (v['observacoes'] as string).trim() || undefined,
    };

    if (this.vagaEditavel() && v['tipoVaga'] !== r.tipoVaga) request.tipoVaga = v['tipoVaga'];

    if (this.periodoEditavel()) {
      if (v['dataEntrada'] !== paraInputDataHora(r.dataEntrada)) request.dataEntrada = v['dataEntrada'];
      if (v['dataSaida'] !== paraInputDataHora(r.dataSaidaPrevista)) request.dataSaidaPrevista = v['dataSaida'];
    }

    return request;
  }

  private mensagemDeErro(err: any): string {
    if (err?.error?.message) return err.error.message;
    const erros = err?.error?.errors as Record<string, string[]> | undefined;
    const primeiro = erros ? Object.values(erros).flat()[0] : undefined;
    return primeiro ?? 'Erro ao salvar a reserva';
  }
}
