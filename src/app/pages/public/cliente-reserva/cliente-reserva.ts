import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrcamentoResponse } from '../../../core/models/orcamento.model';
import { ClienteFlowService } from '../../../core/services/cliente-flow.service';
import { OrcamentoService } from '../../../core/services/orcamento.service';
import { ReservaService } from '../../../core/services/reserva.service';

@Component({
  selector: 'app-cliente-reserva',
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './cliente-reserva.html',
})
export class ClienteReserva implements OnInit {
  nome = '';
  telefone = '';
  placas = [''];
  tipoVaga = 'Coberta';
  loading = signal(false);
  orcamento = signal<OrcamentoResponse | null>(null);
  orcamentoLoading = signal(false);
  erro = signal('');
  showConfirmacao = signal(false);

  constructor(
    protected flow: ClienteFlowService,
    private orcamentoService: OrcamentoService,
    private reservaService: ReservaService,
    private router: Router,
  ) {}

  ngOnInit() {
    if (!this.flow.dataEntrada) {
      this.router.navigate(['/cliente']);
      return;
    }

    if (this.flow.vagasCobertaDisponiveis === 0 && this.flow.vagasDescobertaDisponiveis > 0) {
      this.tipoVaga = 'Descoberta';
    }

    this.calcularOrcamento();
  }

  calcularOrcamento() {
    this.orcamentoLoading.set(true);
    this.orcamentoService
      .calcular({
        tipoVaga: this.tipoVaga,
        dataEntrada: this.flow.dataEntrada,
        qtdDias: this.flow.qtdDias,
      })
      .subscribe({
        next: (data) => {
          this.orcamento.set(data);
          this.orcamentoLoading.set(false);
          this.validarQuantidadeVeiculos();
        },
        error: (err) => {
          this.erro.set(err.error?.message || 'Erro ao calcular preco');
          this.orcamentoLoading.set(false);
        },
      });
  }

  get dataEntradaFormatted(): string {
    return this.formatDateTime(this.flow.dataEntrada, this.flow.horaEntrada);
  }

  get dataSaidaFormatted(): string {
    return this.formatDateTime(this.flow.dataSaida, this.flow.horaSaida);
  }

  get quantidadeVeiculos(): number {
    return this.placas.length;
  }

  get valorTotalCartao(): number {
    return (this.orcamento()?.valorTotalCartao ?? 0) * this.quantidadeVeiculos;
  }

  get valorTotalPixDinheiro(): number {
    return (this.orcamento()?.valorTotalPixDinheiro ?? 0) * this.quantidadeVeiculos;
  }

  get economiaTotal(): number {
    return (this.orcamento()?.economiaTotal ?? 0) * this.quantidadeVeiculos;
  }

  get placasPreenchidas(): string[] {
    return this.placas
      .map((placa) => placa.trim().toUpperCase())
      .filter((placa) => placa.length > 0);
  }

  atualizarPlaca(index: number, value: string) {
    this.placas[index] = value.toUpperCase();
    if (this.erro() && this.temErroDePlacas()) {
      this.erro.set('');
    }
  }

  adicionarCarro() {
    if (this.placas.some((placa) => !placa.trim())) {
      this.erro.set('Preencha a placa atual antes de adicionar outro carro');
      return;
    }

    if (!this.validarQuantidadeVeiculos(this.quantidadeVeiculos + 1)) {
      return;
    }

    this.placas = [...this.placas, ''];
    this.erro.set('');
  }

  removerCarro(index: number) {
    if (this.placas.length === 1) {
      this.placas = [''];
      return;
    }

    this.placas = this.placas.filter((_, currentIndex) => currentIndex !== index);
    this.validarQuantidadeVeiculos();
  }

  cobertaDisponivel(): boolean {
    return this.flow.vagasCobertaDisponiveis > 0;
  }

  descobertaDisponivel(): boolean {
    return this.flow.vagasDescobertaDisponiveis > 0;
  }

  abrirConfirmacao() {
    if (!this.validarFormulario()) {
      return;
    }

    this.erro.set('');
    this.showConfirmacao.set(true);
  }

  fecharConfirmacao() {
    this.showConfirmacao.set(false);
  }

  confirmar() {
    if (!this.validarFormulario()) {
      return;
    }

    this.showConfirmacao.set(false);
    this.loading.set(true);
    this.erro.set('');

    const payloadBase = {
      nomeCliente: this.nome.trim(),
      telefoneCliente: this.telefone.trim(),
      tipoVaga: this.tipoVaga,
      dataEntrada: `${this.flow.dataEntrada}T${this.flow.horaEntrada || '00:00'}`,
      dataSaidaPrevista: `${this.flow.dataSaida}T${this.flow.horaSaida || '00:00'}`,
      qtdDias: this.flow.qtdDias,
    };

    if (this.quantidadeVeiculos === 1) {
      this.reservaService
        .criarOnline({
          ...payloadBase,
          placaVeiculo: this.placasPreenchidas[0],
        })
        .subscribe({
          next: (reserva) => {
            this.reservaService.whatsapp(reserva.id).subscribe({
              next: (wp) => this.redirecionarParaWhatsApp(wp.url),
              error: () => this.redirecionarParaWhatsApp(),
            });
          },
          error: (err) => {
            this.erro.set(err.error?.message || 'Erro ao criar reserva');
            this.loading.set(false);
          },
        });

      return;
    }

    this.reservaService
      .criarOnlineLote({
        ...payloadBase,
        placasVeiculos: this.placasPreenchidas,
      })
      .subscribe({
        next: (resultado) => this.redirecionarParaWhatsApp(resultado.whatsApp?.url),
        error: (err) => {
          this.erro.set(err.error?.message || 'Erro ao criar reservas');
          this.loading.set(false);
        },
      });
  }

  private redirecionarParaWhatsApp(url?: string) {
    this.flow.reset();

    if (url) {
      window.location.href = url;
      return;
    }

    this.loading.set(false);
    this.router.navigate(['/']);
  }

  private validarFormulario(): boolean {
    if (!this.nome.trim() || !this.telefone.trim()) {
      this.erro.set('Preencha nome e telefone');
      return false;
    }

    if (this.placasPreenchidas.length !== this.quantidadeVeiculos) {
      this.erro.set('Preencha a placa de todos os carros');
      return false;
    }

    if (new Set(this.placasPreenchidas).size !== this.placasPreenchidas.length) {
      this.erro.set('As placas precisam ser diferentes entre si');
      return false;
    }

    if (!this.validarQuantidadeVeiculos()) {
      return false;
    }

    return true;
  }

  private validarQuantidadeVeiculos(quantidade = this.quantidadeVeiculos): boolean {
    const vagasDisponiveis = this.orcamento()?.vagasRestantes ?? this.vagasDisponiveisPorTipo();
    if (quantidade > vagasDisponiveis) {
      this.erro.set(`Ha apenas ${vagasDisponiveis} vaga(s) ${this.tipoVaga.toLowerCase()} disponivel(is) para esse periodo`);
      return false;
    }

    if (this.erro().includes('vaga(s)')) {
      this.erro.set('');
    }

    return true;
  }

  private vagasDisponiveisPorTipo(): number {
    return this.tipoVaga === 'Coberta'
      ? this.flow.vagasCobertaDisponiveis
      : this.flow.vagasDescobertaDisponiveis;
  }

  private temErroDePlacas(): boolean {
    return (
      this.erro().includes('placa') ||
      this.erro().includes('Placa') ||
      this.erro().includes('carro')
    );
  }

  private formatDateTime(date: string, time: string): string {
    if (!date) return '';
    const parts = date.split('-');
    const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    return time ? `${formatted} ${time}` : formatted;
  }
}
