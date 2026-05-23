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
  precoCoberta = signal<Preco | null>(null);
  precoDescoberta = signal<Preco | null>(null);
  todosPrecos = signal<Preco[]>([]);
  loading = signal(true);
  refreshing = signal(false);
  showForm = signal(false);
  showHistorico = signal(false);
  erro = signal('');
  sucesso = signal('');
  tiposVaga = ['Coberta', 'Descoberta'] as const;

  tipoVaga = 'Coberta';
  valorDiaria = 0;
  descontoPixDinheiro = 0;
  dataInicio = '';
  dataFim = '';
  formLoading = signal(false);

  constructor(private precoService: PrecoService) {}

  ngOnInit() {
    this.carregarPrecos();
    this.dataInicio = this.obterDataLocalHoje();
  }

  carregarPrecos(manterCardsVisiveis = false) {
    if (manterCardsVisiveis) {
      this.refreshing.set(true);
    } else {
      this.loading.set(true);
    }

    this.precoService.listarTodos().subscribe({
      next: (precos) => {
        this.todosPrecos.set(precos);

        const coberta = this.obterUltimoPrecoPorTipo(precos, 'Coberta');
        const descoberta = this.obterUltimoPrecoPorTipo(precos, 'Descoberta');

        this.precoCoberta.set(coberta);
        this.precoDescoberta.set(descoberta);
        this.precosAtivos.set([coberta, descoberta].filter((preco): preco is Preco => preco !== null));
        this.loading.set(false);
        this.refreshing.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.refreshing.set(false);
      },
    });
  }

  carregarHistorico() {
    this.showHistorico.set(true);

    if (this.todosPrecos().length > 0) {
      return;
    }

    this.precoService.listarTodos().subscribe({
      next: (data) => {
        this.todosPrecos.set(data);
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
        next: (precoCriado) => {
          this.sucesso.set('Preco criado com sucesso');
          this.atualizarPrecoAtivo(precoCriado);
          this.showForm.set(false);
          this.valorDiaria = 0;
          this.descontoPixDinheiro = 0;
          this.dataInicio = this.obterDataLocalHoje();
          this.dataFim = '';
          this.formLoading.set(false);
          this.carregarPrecos(true);
        },
        error: (err) => {
          this.erro.set(err.error?.message || 'Erro ao criar preco');
          this.formLoading.set(false);
        },
      });
  }

  obterPrecoAtivo(tipoVaga: string): Preco | null {
    return tipoVaga === 'Coberta' ? this.precoCoberta() : this.precoDescoberta();
  }

  private atualizarPrecoAtivo(preco: Preco) {
    if (preco.tipoVaga === 'Coberta') {
      this.precoCoberta.set(preco);
    } else if (preco.tipoVaga === 'Descoberta') {
      this.precoDescoberta.set(preco);
    }

    this.precosAtivos.set(
      [this.precoCoberta(), this.precoDescoberta()].filter((item): item is Preco => item !== null),
    );
  }

  private obterUltimoPrecoPorTipo(precos: Preco[], tipoVaga: string): Preco | null {
    const precosDoTipo = precos.filter((preco) => preco.tipoVaga === tipoVaga);
    const hoje = this.inicioDoDia(new Date());

    const vigenteHoje =
      [...precosDoTipo]
        .filter((preco) => this.estaVigenteNoDia(preco, hoje))
        .sort((a, b) => {
          const diferencaData = new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime();
          return diferencaData !== 0 ? diferencaData : b.id - a.id;
        })
        .at(0) ?? null;

    if (vigenteHoje) {
      return vigenteHoje;
    }

    const proximoAgendado =
      [...precosDoTipo]
        .filter((preco) => preco.ativo && this.inicioDoDia(new Date(preco.dataInicio)).getTime() > hoje.getTime())
        .sort((a, b) => {
          const diferencaData = new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime();
          return diferencaData !== 0 ? diferencaData : b.id - a.id;
        })
        .at(0) ?? null;

    if (proximoAgendado) {
      return proximoAgendado;
    }

    const ultimoAtivo =
      [...precosDoTipo]
        .filter((preco) => preco.ativo)
        .sort((a, b) => {
          const diferencaData = new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime();
          return diferencaData !== 0 ? diferencaData : b.id - a.id;
        })
        .at(0) ?? null;

    if (ultimoAtivo) {
      return ultimoAtivo;
    }

    return (
      [...precosDoTipo]
        .sort((a, b) => {
          const diferencaData = new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime();
          return diferencaData !== 0 ? diferencaData : b.id - a.id;
        })
        .at(0) ?? null
    );
  }

  private obterDataLocalHoje(): string {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private estaVigenteNoDia(preco: Preco, dia: Date): boolean {
    if (!preco.ativo) {
      return false;
    }

    const inicio = this.inicioDoDia(new Date(preco.dataInicio));
    const fim = preco.dataFim ? this.inicioDoDia(new Date(preco.dataFim)) : null;

    return inicio.getTime() <= dia.getTime() && (!fim || fim.getTime() >= dia.getTime());
  }

  private inicioDoDia(data: Date): Date {
    return new Date(data.getFullYear(), data.getMonth(), data.getDate());
  }
}
