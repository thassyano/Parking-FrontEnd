import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ClienteFlowService } from '../../../core/services/cliente-flow.service';
import { OrcamentoService } from '../../../core/services/orcamento.service';
import { ReservaService } from '../../../core/services/reserva.service';
import { OrcamentoResponse } from '../../../core/models/orcamento.model';

@Component({
  selector: 'app-cliente-reserva',
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './cliente-reserva.html',
})
export class ClienteReserva implements OnInit {
  nome = '';
  telefone = '';
  placa = '';
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

  private formatDateTime(date: string, time: string): string {
    if (!date) return '';
    const parts = date.split('-');
    const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    return time ? `${formatted} ${time}` : formatted;
  }

  cobertaDisponivel(): boolean {
    return this.flow.vagasCobertaDisponiveis > 0;
  }

  descobertaDisponivel(): boolean {
    return this.flow.vagasDescobertaDisponiveis > 0;
  }

  abrirConfirmacao() {
    if (!this.nome || !this.telefone) {
      this.erro.set('Preencha nome e telefone');
      return;
    }
    this.erro.set('');
    this.showConfirmacao.set(true);
  }

  fecharConfirmacao() {
    this.showConfirmacao.set(false);
  }

  confirmar() {
    this.showConfirmacao.set(false);
    this.loading.set(true);
    this.erro.set('');

    this.reservaService
      .criarOnline({
        nomeCliente: this.nome,
        telefoneCliente: this.telefone,
        placaVeiculo: this.placa || undefined,
        tipoVaga: this.tipoVaga,
        dataEntrada: `${this.flow.dataEntrada}T${this.flow.horaEntrada || '00:00'}`,
        dataSaidaPrevista: `${this.flow.dataSaida}T${this.flow.horaSaida || '00:00'}`,
        qtdDias: this.flow.qtdDias,
      })
      .subscribe({
        next: (reserva) => {
          this.reservaService.whatsapp(reserva.id).subscribe({
            next: (wp) => {
              this.flow.reset();
              window.location.href = wp.url;
            },
            error: () => {
              this.flow.reset();
              this.router.navigate(['/']);
            },
          });
        },
        error: (err) => {
          this.erro.set(err.error?.message || 'Erro ao criar reserva');
          this.loading.set(false);
        },
      });
  }
}
