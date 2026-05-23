import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReservaService } from '../../../core/services/reserva.service';
import { CarroPresencialLoteRequest } from '../../../core/models/reserva.model';
import {
  extractApiError,
  isNomeClienteValido,
  isPlacaValida,
  isTelefoneValido,
  sanitizeNomeClienteInput,
  sanitizePlacaInput,
  sanitizeTelefoneInput,
} from '../../../shared/utils/reservation-inputs';

interface VeiculoForm {
  placaVeiculo: string;
  tipoVaga: string;
  dataEntrada: string;
  horaEntrada: string;
  dataSaida: string;
  horaSaida: string;
  qtdDias: number;
  observacoes: string;
}

@Component({
  selector: 'app-reserva-presencial',
  imports: [FormsModule],
  templateUrl: './reserva-presencial.html',
})
export class ReservaPresencial {
  nomeCliente = '';
  telefoneCliente = '';
  cpfCliente = '';
  nomeClienteErro = '';
  telefoneClienteErro = '';
  placasErro: string[] = [];
  loading = signal(false);
  erro = signal('');

  veiculos: VeiculoForm[] = [];

  constructor(
    private reservaService: ReservaService,
    private router: Router,
  ) {
    this.veiculos = [this.novoVeiculo()];
    this.placasErro = [''];
  }

  private novoVeiculo(): VeiculoForm {
    const now = new Date();
    const dataEntrada = now.toISOString().split('T')[0];
    const horaEntrada = now.toTimeString().slice(0, 5);
    const saida = new Date(now.getTime() + 86400000);
    const dataSaida = saida.toISOString().split('T')[0];

    return {
      placaVeiculo: '',
      tipoVaga: 'Coberta',
      dataEntrada,
      horaEntrada,
      dataSaida,
      horaSaida: horaEntrada,
      qtdDias: 1,
      observacoes: '',
    };
  }

  adicionarVeiculo() {
    this.veiculos.push(this.novoVeiculo());
    this.placasErro.push('');
  }

  removerVeiculo(index: number) {
    if (this.veiculos.length > 1) {
      this.veiculos.splice(index, 1);
      this.placasErro.splice(index, 1);
    }
  }

  onNomeClienteChange(value: string) {
    const result = sanitizeNomeClienteInput(value);
    this.nomeCliente = result.value;
    this.nomeClienteErro = result.hadInvalidChars ? 'Nome do cliente deve conter apenas letras.' : '';
  }

  onTelefoneClienteChange(value: string) {
    const result = sanitizeTelefoneInput(value);
    this.telefoneCliente = result.value;
    this.telefoneClienteErro = result.hadInvalidChars ? 'Telefone deve estar no formato (00) 000000000.' : '';
  }

  onPlacaChange(index: number, value: string) {
    const result = sanitizePlacaInput(value);
    this.veiculos[index].placaVeiculo = result.value;
    this.placasErro[index] = result.hadInvalidChars
      ? 'A placa do veiculo deve conter apenas letras e numeros, com no maximo 7 caracteres.'
      : '';
  }

  onPeriodoChange(index: number) {
    this.recalcularQtdDias(index);
  }

  isNomeClienteInvalido(): boolean {
    return !!this.nomeCliente && !isNomeClienteValido(this.nomeCliente);
  }

  isTelefoneClienteInvalido(): boolean {
    return !!this.telefoneCliente && !isTelefoneValido(this.telefoneCliente);
  }

  isPlacaInvalida(index: number): boolean {
    return !!this.veiculos[index]?.placaVeiculo && !isPlacaValida(this.veiculos[index].placaVeiculo);
  }

  private validarNomeCliente(): boolean {
    const result = sanitizeNomeClienteInput(this.nomeCliente);
    this.nomeCliente = result.value.trim().replace(/\s+/g, ' ');

    if (!this.nomeCliente) {
      this.erro.set('Preencha o nome do cliente');
      return false;
    }

    if (!isNomeClienteValido(this.nomeCliente)) {
      this.nomeClienteErro = 'Nome do cliente deve conter apenas letras.';
      this.erro.set(this.nomeClienteErro);
      return false;
    }

    this.nomeClienteErro = '';
    return true;
  }

  private validarTelefoneCliente(): boolean {
    const result = sanitizeTelefoneInput(this.telefoneCliente);
    this.telefoneCliente = result.value;

    if (!this.telefoneCliente) {
      this.erro.set('Preencha o telefone do cliente');
      return false;
    }

    if (!isTelefoneValido(this.telefoneCliente)) {
      this.telefoneClienteErro = 'Telefone deve estar no formato (00) 000000000.';
      this.erro.set(this.telefoneClienteErro);
      return false;
    }

    this.telefoneClienteErro = '';
    return true;
  }

  private validarVeiculo(index: number): boolean {
    const veiculo = this.veiculos[index];
    const placaResult = sanitizePlacaInput(veiculo.placaVeiculo);
    veiculo.placaVeiculo = placaResult.value;

    if (!veiculo.placaVeiculo) {
      this.erro.set(`Informe a placa do veiculo ${index + 1}`);
      return false;
    }

    if (!isPlacaValida(veiculo.placaVeiculo)) {
      this.placasErro[index] = 'A placa do veiculo deve conter apenas letras e numeros, com no maximo 7 caracteres.';
      this.erro.set(this.placasErro[index]);
      return false;
    }

    this.placasErro[index] = '';

    if (!veiculo.dataEntrada) {
      this.erro.set(`Informe a data de entrada do veiculo ${index + 1}`);
      return false;
    }

    const dataHoraEntrada = this.combinarDataHora(veiculo.dataEntrada, veiculo.horaEntrada);
    const dataHoraSaida = this.combinarDataHora(veiculo.dataSaida, veiculo.horaSaida);

    if (dataHoraEntrada >= dataHoraSaida) {
      this.erro.set(`A data e hora de saida devem ser posteriores a entrada do veiculo ${index + 1}`);
      return false;
    }

    veiculo.qtdDias = this.calcularQtdDias(dataHoraEntrada, dataHoraSaida);

    return true;
  }

  private combinarDataHora(data: string, hora: string): Date {
    return new Date(`${data}T${hora || '00:00'}`);
  }

  private recalcularQtdDias(index: number) {
    const veiculo = this.veiculos[index];
    if (!veiculo?.dataEntrada || !veiculo?.dataSaida) {
      return;
    }

    const dataHoraEntrada = this.combinarDataHora(veiculo.dataEntrada, veiculo.horaEntrada);
    const dataHoraSaida = this.combinarDataHora(veiculo.dataSaida, veiculo.horaSaida);

    if (dataHoraSaida > dataHoraEntrada) {
      veiculo.qtdDias = this.calcularQtdDias(dataHoraEntrada, dataHoraSaida);
    }
  }

  private calcularQtdDias(dataHoraEntrada: Date, dataHoraSaida: Date): number {
    const diferencaMs = dataHoraSaida.getTime() - dataHoraEntrada.getTime();
    const dias = diferencaMs / (1000 * 60 * 60 * 24);
    return Math.max(1, Math.ceil(dias));
  }

  submeter() {
    this.erro.set('');

    if (!this.validarNomeCliente() || !this.validarTelefoneCliente()) {
      return;
    }

    for (let i = 0; i < this.veiculos.length; i++) {
      if (!this.validarVeiculo(i)) {
        return;
      }
    }

    this.loading.set(true);

    if (this.veiculos.length === 1) {
      const v = this.veiculos[0];
      this.reservaService
        .criarPresencial({
          nomeCliente: this.nomeCliente,
          telefoneCliente: this.telefoneCliente,
          cpfCliente: this.cpfCliente || undefined,
          placaVeiculo: v.placaVeiculo,
          tipoVaga: v.tipoVaga,
          dataEntrada: `${v.dataEntrada}T${v.horaEntrada || '00:00'}`,
          dataSaidaPrevista: `${v.dataSaida}T${v.horaSaida || '00:00'}`,
          qtdDias: v.qtdDias,
          observacoes: v.observacoes || undefined,
        })
        .subscribe({
          next: (reserva) => this.router.navigate(['/admin/reservas', reserva.id]),
          error: (err) => {
            this.erro.set(extractApiError(err, 'Erro ao criar reserva'));
            this.loading.set(false);
          },
        });
    } else {
      const carros: CarroPresencialLoteRequest[] = this.veiculos.map((v) => ({
        placaVeiculo: v.placaVeiculo,
        tipoVaga: v.tipoVaga,
        dataEntrada: `${v.dataEntrada}T${v.horaEntrada || '00:00'}`,
        dataSaidaPrevista: `${v.dataSaida}T${v.horaSaida || '00:00'}`,
        qtdDias: v.qtdDias,
        observacoes: v.observacoes || undefined,
      }));

      this.reservaService
        .criarPresencialLote({
          nomeCliente: this.nomeCliente,
          telefoneCliente: this.telefoneCliente,
          cpfCliente: this.cpfCliente || undefined,
          carros,
        })
        .subscribe({
          next: () => this.router.navigate(['/admin/reservas']),
          error: (err) => {
            this.erro.set(extractApiError(err, 'Erro ao criar reservas'));
            this.loading.set(false);
          },
        });
    }
  }
}
