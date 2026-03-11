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
          dataEntrada: this.dataEntrada,
          qtdDias: this.qtdDias,
          observacoes: this.observacoes || undefined,
          dataSaidaPrevista: ''
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
