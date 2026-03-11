import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReservaService } from '../../../core/services/reserva.service';

@Component({
  selector: 'app-reserva-online',
  imports: [FormsModule],
  templateUrl: './reserva-online.html',
})
export class ReservaOnline {
  nomeCliente = '';
  telefoneCliente = '';
  cpfCliente = '';
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
    const hoje = new Date();
    this.dataEntrada = hoje.toISOString().split('T')[0];
    this.horaEntrada = hoje.toTimeString().slice(0, 5);
    const saida = new Date(hoje.getTime() + 86400000);
    this.dataSaida = saida.toISOString().split('T')[0];
    this.horaSaida = this.horaEntrada;
  }

  submeter() {
    if (!this.nomeCliente || !this.telefoneCliente || !this.dataEntrada) {
      this.erro.set('Preencha todos os campos obrigatorios');
      return;
    }

    this.loading.set(true);
    this.erro.set('');

    this.reservaService
      .criarOnline({
        nomeCliente: this.nomeCliente,
        telefoneCliente: this.telefoneCliente,
        cpfCliente: this.cpfCliente || undefined,
        tipoVaga: this.tipoVaga,
        dataEntrada: `${this.dataEntrada}T${this.horaEntrada || '00:00'}`,
        dataSaidaPrevista: `${this.dataSaida}T${this.horaSaida || '00:00'}`,
        qtdDias: this.qtdDias,
        observacoes: this.observacoes || undefined,
      })
      .subscribe({
        next: (reserva) => {
          this.loading.set(false);
          this.router.navigate(['/confirmacao', reserva.id]);
        },
        error: (err) => {
          this.erro.set(err.error?.message || 'Erro ao criar reserva');
          this.loading.set(false);
        },
      });
  }
}
