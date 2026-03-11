import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrcamentoService } from '../../../core/services/orcamento.service';
import { OrcamentoResponse } from '../../../core/models/orcamento.model';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-orcamento',
  imports: [FormsModule, CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './orcamento.html',
})
export class Orcamento {
  tipoVaga = 'Coberta';
  dataEntrada = '';
  qtdDias = 1;
  loading = signal(false);
  resultado = signal<OrcamentoResponse | null>(null);
  erro = signal('');

  constructor(private orcamentoService: OrcamentoService) {
    const hoje = new Date();
    this.dataEntrada = hoje.toISOString().split('T')[0];
  }

  calcular() {
    this.loading.set(true);
    this.erro.set('');
    this.resultado.set(null);

    this.orcamentoService
      .calcular({
        tipoVaga: this.tipoVaga,
        dataEntrada: this.dataEntrada,
        qtdDias: this.qtdDias,
      })
      .subscribe({
        next: (data) => {
          this.resultado.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.erro.set(err.error?.message || 'Erro ao calcular orcamento');
          this.loading.set(false);
        },
      });
  }
}
