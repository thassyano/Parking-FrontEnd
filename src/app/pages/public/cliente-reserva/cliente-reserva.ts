import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ClienteFlowService } from '../../../core/services/cliente-flow.service';
import { OrcamentoService } from '../../../core/services/orcamento.service';
import { ReservaService } from '../../../core/services/reserva.service';
import { OrcamentoResponse } from '../../../core/models/orcamento.model';
import {
  extractApiError,
  isNomeClienteValido,
  isPlacaValida,
  isTelefoneValido,
  sanitizeNomeClienteInput,
  sanitizePlacaInput,
  sanitizeTelefoneInput,
} from '../../../shared/utils/reservation-inputs';

@Component({
  selector: 'app-cliente-reserva',
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './cliente-reserva.html',
})
export class ClienteReserva implements OnInit {
  nome = '';
  telefone = '';
  nomeErro = '';
  telefoneErro = '';
  placasErro: string[] = [];
  loading = signal(false);
  orcamentosLoading = signal(false);
  erro = signal('');
  showConfirmacao = signal(false);

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
      if (!this.flow.dataEntrada) {
        this.router.navigate(['/cliente']);
        return;
      }

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
    this.placasErro = this.flow.carros.map(() => '');
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
        this.erro.set(extractApiError(err, 'Erro ao calcular precos'));
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
          this.erro.set(extractApiError(err, 'Erro ao calcular preco'));
        },
      });
  }

  onNomeChange(value: string) {
    const result = sanitizeNomeClienteInput(value);
    this.nome = result.value;
    this.nomeErro = result.hadInvalidChars ? 'Nome do cliente deve conter apenas letras.' : '';
  }

  onTelefoneChange(value: string) {
    const result = sanitizeTelefoneInput(value);
    this.telefone = result.value;
    this.telefoneErro = result.hadInvalidChars ? 'Telefone deve estar no formato (00) 000000000.' : '';
  }

  onPlacaChange(index: number, value: string) {
    const result = sanitizePlacaInput(value);
    this.carroPlaca[index] = result.value;
    this.placasErro[index] = result.hadInvalidChars
      ? 'A placa do veiculo deve conter apenas letras e numeros, com no maximo 7 caracteres.'
      : '';
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

  private validarNome(): boolean {
    const result = sanitizeNomeClienteInput(this.nome);
    this.nome = result.value.trim().replace(/\s+/g, ' ');

    if (!this.nome) {
      this.erro.set('Preencha o nome do cliente');
      return false;
    }

    if (!isNomeClienteValido(this.nome)) {
      this.nomeErro = 'Nome do cliente deve conter apenas letras.';
      this.erro.set(this.nomeErro);
      return false;
    }

    this.nomeErro = '';
    return true;
  }

  private validarTelefone(): boolean {
    const result = sanitizeTelefoneInput(this.telefone);
    this.telefone = result.value;

    if (!this.telefone) {
      this.erro.set('Preencha o telefone');
      return false;
    }

    if (!isTelefoneValido(this.telefone)) {
      this.telefoneErro = 'Telefone deve estar no formato (00) 000000000.';
      this.erro.set(this.telefoneErro);
      return false;
    }

    this.telefoneErro = '';
    return true;
  }

  private validarPlacas(): boolean {
    for (let i = 0; i < this.carroPlaca.length; i++) {
      const result = sanitizePlacaInput(this.carroPlaca[i] ?? '');
      this.carroPlaca[i] = result.value;

      if (!this.carroPlaca[i]) {
        this.erro.set(`Informe a placa do veiculo ${i + 1}`);
        return false;
      }

      if (!isPlacaValida(this.carroPlaca[i])) {
        this.placasErro[i] =
          'A placa do veiculo deve conter apenas letras e numeros, com no maximo 7 caracteres.';
        this.erro.set(this.placasErro[i]);
        return false;
      }

      this.placasErro[i] = '';
    }

    return true;
  }

  abrirConfirmacao() {
    this.erro.set('');

    if (!this.validarNome() || !this.validarTelefone() || !this.validarPlacas()) {
      return;
    }

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
          placaVeiculo: this.carroPlaca[0],
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
            this.erro.set(extractApiError(err, 'Erro ao criar reserva'));
            this.loading.set(false);
          },
        });
    } else {
      this.reservaService
        .criarOnlineLote({
          nomeCliente: this.nome,
          telefoneCliente: this.telefone,
          carros: carros.map((carro, i) => ({
            placaVeiculo: this.carroPlaca[i],
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
            this.erro.set(extractApiError(err, 'Erro ao criar reservas'));
            this.loading.set(false);
          },
        });
    }
  }
}
