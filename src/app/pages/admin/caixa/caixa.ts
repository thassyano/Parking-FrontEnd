import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CaixaService } from '../../../core/services/caixa.service';
import { FechamentoCaixaResponse } from '../../../core/models/caixa.model';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-caixa',
  imports: [FormsModule, CurrencyPipe, DatePipe],
  templateUrl: './caixa.html',
})
export class Caixa {
  dataInicio = '';
  dataFim = '';
  loading = signal(false);
  resultado = signal<FechamentoCaixaResponse | null>(null);
  erro = signal('');
  exportLoading = signal(false);

  constructor(private caixaService: CaixaService) {
    const hoje = new Date();
    this.dataFim = hoje.toISOString().split('T')[0];
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    this.dataInicio = inicioMes.toISOString().split('T')[0];
  }

  consultar() {
    if (!this.dataInicio || !this.dataFim) {
      this.erro.set('Selecione as datas');
      return;
    }
    this.loading.set(true);
    this.erro.set('');
    this.resultado.set(null);

    this.caixaService.fechamento({ dataInicio: this.dataInicio, dataFim: this.dataFim }).subscribe({
      next: (data) => {
        this.resultado.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.erro.set(err.error?.message || 'Erro ao consultar caixa');
        this.loading.set(false);
      },
    });
  }

  exportarExcel() {
    this.exportLoading.set(true);
    this.caixaService.exportarExcel({ dataInicio: this.dataInicio, dataFim: this.dataFim }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fechamento-${this.dataInicio}-a-${this.dataFim}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.exportLoading.set(false);
      },
      error: (err) => {
        this.erro.set(err.error?.message || 'Erro ao exportar');
        this.exportLoading.set(false);
      },
    });
  }
}
