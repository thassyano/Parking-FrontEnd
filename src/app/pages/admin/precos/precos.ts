import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PrecoService } from '../../../core/services/preco.service';
import { Preco } from '../../../core/models/preco.model';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-precos',
  imports: [FormsModule, CurrencyPipe, DatePipe],
  templateUrl: './precos.html',
})
export class Precos implements OnInit {
  precosAtivos = signal<Preco[]>([]);
  todosPrecos = signal<Preco[]>([]);
  loading = signal(true);
  showForm = signal(false);
  showHistorico = signal(false);
  erro = signal('');
  sucesso = signal('');

  tipoVaga = 'Coberta';
  valorDiaria = 0;
  descontoPixDinheiro = 0;
  dataInicio = '';
  dataFim = '';
  formLoading = signal(false);

  constructor(private precoService: PrecoService) {}

  ngOnInit() {
    this.carregarPrecos();
    this.dataInicio = new Date().toISOString().split('T')[0];
  }

  carregarPrecos() {
    this.loading.set(true);
    this.precoService.listarAtivos().subscribe({
      next: (data) => {
        this.precosAtivos.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  carregarHistorico() {
    this.precoService.listarTodos().subscribe({
      next: (data) => {
        this.todosPrecos.set(data);
        this.showHistorico.set(true);
      },
    });
  }

  criarPreco() {
    if (this.valorDiaria <= 0) {
      this.erro.set('Valor da diaria deve ser maior que zero');
      return;
    }
    if (!this.dataInicio) {
      this.erro.set('Data de inicio e obrigatoria');
      return;
    }
    if (this.dataFim && this.dataFim <= this.dataInicio) {
      this.erro.set('A data fim deve ser posterior a data de inicio');
      return;
    }

    this.formLoading.set(true);
    this.erro.set('');

    this.precoService
      .criar({
        tipoVaga: this.tipoVaga,
        valorDiaria: this.valorDiaria,
        descontoPixDinheiro: this.descontoPixDinheiro,
        dataInicio: this.dataInicio,
        dataFim: this.dataFim || undefined,
      })
      .subscribe({
        next: () => {
          this.sucesso.set('Preco criado com sucesso');
          this.showForm.set(false);
          this.valorDiaria = 0;
          this.descontoPixDinheiro = 0;
          this.dataInicio = new Date().toISOString().split('T')[0];
          this.dataFim = '';
          this.formLoading.set(false);
          this.carregarPrecos();
        },
        error: (err) => {
          this.erro.set(err.error?.message || 'Erro ao criar preco');
          this.formLoading.set(false);
        },
      });
  }

  getTipoVagaLabel(tipoVaga: string): string {
    const labels: Record<string, string> = {
      Coberta: 'Coberta',
      Descoberta: 'Descoberta',
      '0': 'Coberta',
      '1': 'Descoberta',
    };

    return labels[tipoVaga] || tipoVaga;
  }
}
