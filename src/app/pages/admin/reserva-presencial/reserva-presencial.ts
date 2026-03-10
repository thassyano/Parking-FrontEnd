import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReservaService } from '../../../core/services/reserva.service';

@Component({
  selector: 'app-reserva-presencial',
  imports: [FormsModule],
  templateUrl: './reserva-presencial.html',
})
export class ReservaPresencial {
  nomeCliente = '';
  telefoneCliente = '';
  cpfCliente = '';
  placaVeiculo = '';
  tipoVaga = 'Coberta';
  dataEntrada = '';
  horaEntrada = '';
  dataSaida = '';
  horaSaida = '';
  qtdDias = 1;
  observacoes = '';
  loading = signal(false);
  erro = signal('');

  constructor(
    private reservaService: ReservaService,
    private router: Router,
  ) {
    const now = new Date();
    this.dataEntrada = now.toISOString().split('T')[0];
    this.horaEntrada = now.toTimeString().slice(0, 5);
    const saida = new Date(now.getTime() + 86400000);
    this.dataSaida = saida.toISOString().split('T')[0];
    this.horaSaida = this.horaEntrada;
  }

  submeter() {
    if (!this.nomeCliente || !this.telefoneCliente || !this.placaVeiculo || !this.dataEntrada) {
      this.erro.set('Preencha todos os campos obrigatorios');
      return;
    }

    this.loading.set(true);
    this.erro.set('');

    this.reservaService
      .criarPresencial({
        nomeCliente: this.nomeCliente,
        telefoneCliente: this.telefoneCliente,
        cpfCliente: this.cpfCliente || undefined,
        placaVeiculo: this.placaVeiculo,
        tipoVaga: this.tipoVaga,
        dataEntrada: `${this.dataEntrada}T${this.horaEntrada || '00:00'}`,
        dataSaidaPrevista: `${this.dataSaida}T${this.horaSaida || '00:00'}`,
        qtdDias: this.qtdDias,
        observacoes: this.observacoes || undefined,
      })
      .subscribe({
        next: (reserva) => {
          this.router.navigate(['/admin/reservas', reserva.id]);
        },
        error: (err) => {
          this.erro.set(err.error?.message || 'Erro ao criar reserva');
          this.loading.set(false);
        },
      });
  }
}
