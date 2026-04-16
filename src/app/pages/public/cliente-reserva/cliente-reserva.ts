import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
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
  loading = signal(false);
  orcamentosLoading = signal(false);
  erro = signal('');
  showConfirmacao = signal(false);

  // Dados por veículo (índice espelha flow.carros)
  carroTipoVaga: string[] = [];
  carroPlaca: string[] = [];
  orcamentos = signal<(OrcamentoResponse | null)[]>([]);

  constructor(
    protected flow: ClienteFlowService,
    private orcamentoService: OrcamentoService,
    private reservaService: ReservaService,
    private router: Router,
  ) {}

  ngOnInit() {
    if (!this.flow.carros.length) {
      // Compatibilidade: se vieram pelos campos legados sem carros, redireciona
      if (!this.flow.dataEntrada) {
        this.router.navigate(['/cliente']);
        return;
      }
      // Reconstrói carros a partir dos campos legados
      this.flow.carros = [
        {
          dataEntrada: this.flow.dataEntrada,
          horaEntrada: this.flow.horaEntrada,
          dataSaida: this.flow.dataSaida,
          horaSaida: this.flow.horaSaida,
          qtdDias: this.flow.qtdDias,
          tipoVaga: this.flow.vagasCobertaDisponiveis > 0 ? 'Coberta' : 'Descoberta',
          placa: '',
          vagasCobertaDisponiveis: this.flow.vagasCobertaDisponiveis,
          vagasDescobertaDisponiveis: this.flow.vagasDescobertaDisponiveis,
        },
      ];
    }

    this.carroTipoVaga = this.flow.carros.map((c) =>
      c.vagasCobertaDisponiveis > 0 ? 'Coberta' : 'Descoberta',
    );
    this.carroPlaca = this.flow.carros.map(() => '');
    this.orcamentos.set(this.flow.carros.map(() => null));

    this.calcularTodosOrcamentos();
  }

  calcularTodosOrcamentos() {
    this.orcamentosLoading.set(true);
    const requests = this.flow.carros.map((carro, i) =>
      this.orcamentoService.calcular({
        tipoVaga: this.carroTipoVaga[i],
        dataEntrada: carro.dataEntrada,
        qtdDias: carro.qtdDias,
      }),
    );

    forkJoin(requests).subscribe({
      next: (lista) => {
        this.orcamentos.set(lista);
        this.orcamentosLoading.set(false);
      },
      error: (err) => {
        this.erro.set(err.error?.message || 'Erro ao calcular precos');
        this.orcamentosLoading.set(false);
      },
    });
  }

  calcularOrcamentoCarro(index: number) {
    const carro = this.flow.carros[index];
    this.orcamentoService
      .calcular({
        tipoVaga: this.carroTipoVaga[index],
        dataEntrada: carro.dataEntrada,
        qtdDias: carro.qtdDias,
      })
      .subscribe({
        next: (orc) => {
          const lista = [...this.orcamentos()];
          lista[index] = orc;
          this.orcamentos.set(lista);
        },
        error: (err) => {
          this.erro.set(err.error?.message || 'Erro ao calcular preco');
        },
      });
  }

  cobertaDisponivel(index: number): boolean {
    return this.flow.carros[index]?.vagasCobertaDisponiveis > 0;
  }

  descobertaDisponivel(index: number): boolean {
    return this.flow.carros[index]?.vagasDescobertaDisponiveis > 0;
  }

  get totalCartao(): number {
    return this.orcamentos().reduce((sum, orc) => sum + (orc?.valorTotalCartao ?? 0), 0);
  }

  get totalPixDinheiro(): number {
    return this.orcamentos().reduce((sum, orc) => sum + (orc?.valorTotalPixDinheiro ?? 0), 0);
  }

  get totalEconomia(): number {
    return this.orcamentos().reduce((sum, orc) => sum + (orc?.economiaTotal ?? 0), 0);
  }

  formatDateTime(date: string, time: string): string {
    if (!date) return '';
    const parts = date.split('-');
    const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    return time ? `${formatted} ${time}` : formatted;
  }

  todosOrcamentosCarregados(): boolean {
    return this.orcamentos().every((o) => o !== null);
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

    const carros = this.flow.carros;

    if (carros.length === 1) {
      const carro = carros[0];
      this.reservaService
        .criarOnline({
          nomeCliente: this.nome,
          telefoneCliente: this.telefone,
          placaVeiculo: this.carroPlaca[0] || undefined,
          tipoVaga: this.carroTipoVaga[0],
          dataEntrada: `${carro.dataEntrada}T${carro.horaEntrada || '00:00'}`,
          dataSaidaPrevista: `${carro.dataSaida}T${carro.horaSaida || '00:00'}`,
          qtdDias: carro.qtdDias,
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
    } else {
      this.reservaService
        .criarOnlineLote({
          nomeCliente: this.nome,
          telefoneCliente: this.telefone,
          carros: carros.map((carro, i) => ({
            placaVeiculo: this.carroPlaca[i] || undefined,
            tipoVaga: this.carroTipoVaga[i],
            dataEntrada: `${carro.dataEntrada}T${carro.horaEntrada || '00:00'}`,
            dataSaidaPrevista: `${carro.dataSaida}T${carro.horaSaida || '00:00'}`,
            qtdDias: carro.qtdDias,
          })),
        })
        .subscribe({
          next: (resultado) => {
            const ids = resultado.reservas.map((r) => r.id);
            this.reservaService.whatsappLote(ids).subscribe({
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
            this.erro.set(err.error?.message || 'Erro ao criar reservas');
            this.loading.set(false);
          },
        });
    }
  }
}
