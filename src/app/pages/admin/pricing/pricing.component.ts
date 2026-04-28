import { Component, inject, OnInit, signal } from '@angular/core';
import { Preco } from '../../../core/models/precos/preco.model';
import { PrecoService } from '../../../core/services/preco/preco.service';

@Component({
  selector: 'app-pricing',
  imports: [],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.css',
})
export class PricingComponent implements OnInit {
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
  formLoading = signal(false);

  private precoService = inject(PrecoService);

  ngOnInit() {
    this.carregarPrecos();
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
    this.formLoading.set(true);
    this.erro.set('');

    this.precoService
      .criar({
        tipoVaga: this.tipoVaga,
        valorDiaria: this.valorDiaria,
        descontoPixDinheiro: this.descontoPixDinheiro,
      })
      .subscribe({
        next: () => {
          this.sucesso.set('Preco criado com sucesso');
          this.showForm.set(false);
          this.valorDiaria = 0;
          this.descontoPixDinheiro = 0;
          this.formLoading.set(false);
          this.carregarPrecos();
        },
        error: (err) => {
          this.erro.set(err.error?.message || 'Erro ao criar preco');
          this.formLoading.set(false);
        },
      });
  }
}
