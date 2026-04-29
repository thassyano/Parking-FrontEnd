import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReservaService } from '../../../core/services/reserva/reserva.service';
import { Subscription } from 'rxjs';
import { Patterns } from '../../../core/utils/patterns/form-patterns';

@Component({
  selector: 'app-create-reservations',
  imports: [ReactiveFormsModule],
  templateUrl: './create-reservations.component.html',
  styleUrl: './create-reservations.component.css',
})
export class CreateReservationsComponent implements OnInit, OnDestroy {
  protected loading = signal(false);
  protected erro = signal('');

  private readonly MS_POR_DIA = 1000 * 60 * 60 * 24;

  private hoje = new Date();
  private amanha = new Date(this.hoje.getTime() + this.MS_POR_DIA);
  private sub = new Subscription();

  private reservaService = inject(ReservaService);
  private router = inject(Router);

  protected form = new FormGroup({
    nomeCliente: new FormControl('', Validators.required),
    telefoneCliente: new FormControl('', [
      Validators.required,
      Validators.maxLength(11),
      Validators.pattern(Patterns.phone),
    ]),
    cpfCliente: new FormControl(''),
    placaVeiculo: new FormControl('', [
      Validators.required,
      Validators.pattern(Patterns.vehiclePlate),
    ]),
    tipoVaga: new FormControl('Coberta', Validators.required),
    dataEntrada: new FormControl(this.hoje.toISOString().split('T')[0], Validators.required),
    horaEntrada: new FormControl(this.hoje.toTimeString().slice(0, 5), Validators.required),
    dataSaida: new FormControl(this.amanha.toISOString().split('T')[0], Validators.required),
    horaSaida: new FormControl(this.hoje.toTimeString().slice(0, 5), Validators.required),
    qtdDias: new FormControl(1, Validators.min(1)),
    observacoes: new FormControl(''),
  });

  ngOnInit(): void {
    this.sub.add(this.form.get('dataEntrada')!.valueChanges.subscribe(() => this.calcularDias()));
    this.sub.add(this.form.get('dataSaida')!.valueChanges.subscribe(() => this.calcularDias()));

    this.sub.add(this.form.get('horaEntrada')!.valueChanges.subscribe(() => {}));
    this.sub.add(this.form.get('horaSaida')!.valueChanges.subscribe(() => {}));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private calcularDias(): void {
    const entrada = this.form.get('dataEntrada')!.value;
    const saida = this.form.get('dataSaida')!.value;

    if (!entrada || !saida) return;

    const diff = new Date(saida).getTime() - new Date(entrada).getTime();
    const dias = Math.ceil(diff / this.MS_POR_DIA);

    this.form.get('qtdDias')!.setValue(dias > 0 ? dias : 0);
  }

  protected submeter(): void {
    if (this.form.invalid) {
      this.erro.set('Preencha todos os campos obrigatorios');
      return;
    }

    this.loading.set(true);
    this.erro.set('');

    const {
      nomeCliente,
      telefoneCliente,
      cpfCliente,
      placaVeiculo,
      tipoVaga,
      dataEntrada,
      horaEntrada,
      dataSaida,
      horaSaida,
      qtdDias,
      observacoes,
    } = this.form.value;

    this.reservaService
      .criarPresencial({
        nomeCliente: nomeCliente!,
        telefoneCliente: telefoneCliente!,
        cpfCliente: cpfCliente || undefined,
        placaVeiculo: placaVeiculo!,
        tipoVaga: tipoVaga!,
        dataEntrada: `${dataEntrada}T${horaEntrada || '00:00'}`,
        dataSaidaPrevista: `${dataSaida}T${horaSaida || '00:00'}`,
        qtdDias: qtdDias!,
        observacoes: observacoes || undefined,
      })
      .subscribe({
        next: (reserva) => {
          console.log(reserva);
          this.router.navigate(['/admin/reservas', reserva.id]);
        },
        error: (err) => {
          this.erro.set(err.error?.message || 'Erro ao criar reserva');
          this.loading.set(false);
        },
      });
  }

  protected fieldError(campo: string): string {
    const ctrl = this.form.get(campo);

    if (campo === 'horaSaida') {
      if (ctrl == null) return '';

      const dataEntrada = this.form.get('dataEntrada')?.value;
      const horaEntrada = this.form.get('horaEntrada')?.value;
      const dataSaida = this.form.get('dataSaida')?.value;
      const horaSaida = ctrl.value;

      if (!dataEntrada || !horaEntrada || !dataSaida || !horaSaida) return '';

      const entrada = new Date(`${dataEntrada}T${horaEntrada}`);
      const saida = new Date(`${dataSaida}T${horaSaida}`);

      if (saida <= entrada) {
        return 'Saída não pode ser anterior nem junto à entrada.';
      }
    }

    if (!ctrl || !ctrl.invalid || !ctrl.touched) return '';

    if (ctrl.hasError('required')) return 'Campo obrigatório.';

    if (ctrl.hasError('maxlength')) {
      const max = ctrl.getError('maxlength').requiredLength;
      return `Máximo de ${max} caracteres.`;
    }

    if (ctrl.hasError('pattern')) {
      if (campo === 'telefoneCliente')
        return 'Informe um telefone válido com DDD (ex: 31912345678).';
      if (campo === 'placaVeiculo')
        return 'Placa inválida. Use o formato antigo (ABC1234) ou Mercosul (ABC1D23).';
    }

    if (ctrl.hasError('min')) return 'A quantidade mínima é 1 dia.';

    return 'Campo inválido.';
  }
}
