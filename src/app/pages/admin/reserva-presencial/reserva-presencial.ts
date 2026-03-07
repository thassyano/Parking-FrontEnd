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
  qtdDias = 1;
  observacoes = '';
  loading = signal(false);
  erro = signal('');

  constructor(
    private reservaService: ReservaService,
    private router: Router,
  ) {
    this.dataEntrada = new Date().toISOString().split('T')[0];
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
        dataEntrada: this.dataEntrada,
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
