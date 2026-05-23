import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ReservaService } from '../../../core/services/reserva.service';
import { CarroPresencialLoteRequest } from '../../../core/models/reserva.model';

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
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './reserva-presencial.html',
})
export class ReservaPresencial {
  nomeCliente = '';
  telefoneCliente = '';
  cpfCliente = '';
  loading = signal(false);
  erro = signal('');

  veiculos: VeiculoForm[] = [];

  constructor(
    private reservaService: ReservaService,
    private router: Router,
  ) {
    this.veiculos = [this.novoVeiculo()];
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
  }

  removerVeiculo(index: number) {
    if (this.veiculos.length > 1) {
      this.veiculos.splice(index, 1);
    }
  }

  submeter() {
    if (!this.nomeCliente || !this.telefoneCliente) {
      this.erro.set('Preencha nome e telefone do cliente');
      return;
    }

    for (let i = 0; i < this.veiculos.length; i++) {
      const v = this.veiculos[i];
      if (!v.placaVeiculo) {
        this.erro.set(`Informe a placa do veículo ${i + 1}`);
        return;
      }
      if (v.placaVeiculo.length > 10) {
        this.erro.set(`A placa do veículo ${i + 1} não pode ter mais de 10 caracteres`);
        return;
      }
      if (!v.dataEntrada) {
        this.erro.set(`Informe a data de entrada do veículo ${i + 1}`);
        return;
      }
      if(v.dataEntrada > v.dataSaida) {
        this.erro.set(`A data de saída prevista deve ser posterior à data de entrada do veículo ${i + 1}`);
        return;
      }
      if(v.qtdDias <= 0){
        this.erro.set(`A quantidade de dias deve ser maior que 0`);
        return;
      }
    }

    this.loading.set(true);
    this.erro.set('');

    if (this.veiculos.length === 1) {
      const v = this.veiculos[0];
      this.reservaService
        .criarPresencial({
          nomeCliente: this.nomeCliente,
          telefoneCliente: this.telefoneCliente,
          cpfCliente: this.cpfCliente || undefined,
          placaVeiculo: v.placaVeiculo.toUpperCase(),
          tipoVaga: v.tipoVaga,
          dataEntrada: `${v.dataEntrada}T${v.horaEntrada || '00:00'}`,
          dataSaidaPrevista: `${v.dataSaida}T${v.horaSaida || '00:00'}`,
          qtdDias: v.qtdDias,
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
      const carros: CarroPresencialLoteRequest[] = this.veiculos.map((v) => ({
        placaVeiculo: v.placaVeiculo.toUpperCase(),
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
            this.erro.set(err.error?.message || 'Erro ao criar reservas');
            this.loading.set(false);
          },
        });
    }
  }
}
