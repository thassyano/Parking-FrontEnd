import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReservaService } from '../../../core/services/reserva/reserva.service';
import { Subscription } from 'rxjs';
import { Patterns } from '../../../core/utils/patterns/form-patterns';
import { CarroPresencialLoteRequest } from '../../../core/models/reserva/carros/carro-lote-request.interface';

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
    veiculos: new FormArray([this.criarVeiculoGroup()]),
  });

  get veiculosArray(): FormArray {
    return this.form.get('veiculos') as FormArray;
  }

  veiculoGroup(index: number): FormGroup {
    return this.veiculosArray.at(index) as FormGroup;
  }

  private criarVeiculoGroup(): FormGroup {
    const dataEntrada = this.hoje.toISOString().split('T')[0];
    const horaEntrada = this.hoje.toTimeString().slice(0, 5);
    const dataSaida = this.amanha.toISOString().split('T')[0];

    const group = new FormGroup({
      placaVeiculo: new FormControl('', [
        Validators.required,
        Validators.pattern(Patterns.vehiclePlate),
      ]),
      tipoVaga: new FormControl('Coberta', Validators.required),
      dataEntrada: new FormControl(dataEntrada, Validators.required),
      horaEntrada: new FormControl(horaEntrada, Validators.required),
      dataSaida: new FormControl(dataSaida, Validators.required),
      horaSaida: new FormControl(horaEntrada, Validators.required),
      qtdDias: new FormControl(1, Validators.min(1)),
      observacoes: new FormControl(''),
    });

    return group;
  }

  ngOnInit(): void {
    this.veiculosArray.controls.forEach((_, i) => this.inscreverCalculoDias(i));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private inscreverCalculoDias(index: number): void {
    const group = this.veiculoGroup(index);
    this.sub.add(group.get('dataEntrada')!.valueChanges.subscribe(() => this.calcularDias(index)));
    this.sub.add(group.get('dataSaida')!.valueChanges.subscribe(() => this.calcularDias(index)));
  }

  private calcularDias(index: number): void {
    const group = this.veiculoGroup(index);
    const entrada = group.get('dataEntrada')!.value;
    const saida = group.get('dataSaida')!.value;

    if (!entrada || !saida) return;

    const diff = new Date(saida).getTime() - new Date(entrada).getTime();
    const dias = Math.ceil(diff / this.MS_POR_DIA);
    group.get('qtdDias')!.setValue(dias > 0 ? dias : 0, { emitEvent: false });
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

  protected submeter(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.erro.set('Preencha todos os campos obrigatórios');
      return;
    }

    this.loading.set(true);
    this.erro.set('');

    const { nomeCliente, telefoneCliente, cpfCliente, veiculos } = this.form.value;

    if (veiculos!.length === 1) {
      const v = veiculos![0];
      this.reservaService
        .criarPresencial({
          nomeCliente: nomeCliente!,
          telefoneCliente: telefoneCliente!,
          cpfCliente: cpfCliente || undefined,
          placaVeiculo: v.placaVeiculo!.toUpperCase(),
          tipoVaga: v.tipoVaga!,
          dataEntrada: `${v.dataEntrada}T${v.horaEntrada || '00:00'}`,
          dataSaidaPrevista: `${v.dataSaida}T${v.horaSaida || '00:00'}`,
          qtdDias: v.qtdDias!,
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
      const carros: CarroPresencialLoteRequest[] = veiculos!.map((v) => ({
        placaVeiculo: v.placaVeiculo!.toUpperCase(),
        tipoVaga: v.tipoVaga!,
        dataEntrada: `${v.dataEntrada}T${v.horaEntrada || '00:00'}`,
        dataSaidaPrevista: `${v.dataSaida}T${v.horaSaida || '00:00'}`,
        qtdDias: v.qtdDias!,
        observacoes: v.observacoes || undefined,
      }));

      this.reservaService
        .criarPresencialLote({
          nomeCliente: nomeCliente!,
          telefoneCliente: telefoneCliente!,
          cpfCliente: cpfCliente || undefined,
          carros,
        })
        .subscribe({
          next: () => this.router.navigate(['/admin/reservas']),
          error: (err) => {
            this.erro.set(err.error?.message || 'Erro ao criar reservas');
            this.loading.set(false);
          },
        });
    }
  }

  protected fieldError(campo: string, veiculoIndex?: number): string {
    let ctrl;

    if (veiculoIndex !== undefined) {
      ctrl = this.veiculoGroup(veiculoIndex).get(campo);
    } else {
      ctrl = this.form.get(campo);
    }

    if (campo === 'horaSaida' && veiculoIndex !== undefined) {
      if (ctrl == null) return '';

      const group = this.veiculoGroup(veiculoIndex);
      const dataEntrada = group.get('dataEntrada')?.value;
      const horaEntrada = group.get('horaEntrada')?.value;
      const dataSaida = group.get('dataSaida')?.value;
      const horaSaida = ctrl.value;

      if (!dataEntrada || !horaEntrada || !dataSaida || !horaSaida) return '';

      const entrada = new Date(`${dataEntrada}T${horaEntrada}`);
      const saida = new Date(`${dataSaida}T${horaSaida}`);

      if (saida <= entrada) return 'Saída não pode ser anterior nem junto à entrada.';
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
