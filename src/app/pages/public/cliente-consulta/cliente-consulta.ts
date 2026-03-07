import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DisponibilidadeService } from '../../../core/services/disponibilidade.service';
import { DisponibilidadeDia } from '../../../core/models/disponibilidade.model';
import { ClienteFlowService } from '../../../core/services/cliente-flow.service';

@Component({
  selector: 'app-cliente-consulta',
  imports: [FormsModule],
  templateUrl: './cliente-consulta.html',
})
export class ClienteConsulta {
  dataEntrada = '';
  horaEntrada = '';
  dataSaida = '';
  horaSaida = '';
  loading = signal(false);
  erro = signal('');
  showModal = signal(false);
  disponibilidade = signal<DisponibilidadeDia | null>(null);

  constructor(
    private disponibilidadeService: DisponibilidadeService,
    private clienteFlow: ClienteFlowService,
    private router: Router,
  ) {
    const hoje = new Date();
    this.dataEntrada = hoje.toISOString().split('T')[0];
    this.horaEntrada = '08:00';
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    this.dataSaida = amanha.toISOString().split('T')[0];
    this.horaSaida = '08:00';
  }

  checarDisponibilidade() {
    if (!this.dataEntrada || !this.dataSaida) {
      this.erro.set('Preencha as datas de entrada e saida');
      return;
    }

    const entrada = new Date(`${this.dataEntrada}T${this.horaEntrada || '00:00'}`);
    const saida = new Date(`${this.dataSaida}T${this.horaSaida || '00:00'}`);

    if (saida <= entrada) {
      this.erro.set('A data de saida deve ser posterior a data de entrada');
      return;
    }

    this.loading.set(true);
    this.erro.set('');

    this.disponibilidadeService.consultarDia(this.dataEntrada).subscribe({
      next: (data) => {
        this.disponibilidade.set(data);
        this.showModal.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        this.erro.set(err.error?.message || 'Erro ao verificar disponibilidade');
        this.loading.set(false);
      },
    });
  }

  temVagas(): boolean {
    const d = this.disponibilidade();
    return !!d && (d.vagasCobertaDisponiveis > 0 || d.vagasDescobertaDisponiveis > 0);
  }

  continuar() {
    const entrada = new Date(`${this.dataEntrada}T${this.horaEntrada || '00:00'}`);
    const saida = new Date(`${this.dataSaida}T${this.horaSaida || '00:00'}`);
    const diffMs = saida.getTime() - entrada.getTime();
    const qtdDias = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const d = this.disponibilidade()!;
    this.clienteFlow.dataEntrada = this.dataEntrada;
    this.clienteFlow.horaEntrada = this.horaEntrada;
    this.clienteFlow.dataSaida = this.dataSaida;
    this.clienteFlow.horaSaida = this.horaSaida;
    this.clienteFlow.qtdDias = qtdDias;
    this.clienteFlow.vagasCobertaDisponiveis = d.vagasCobertaDisponiveis;
    this.clienteFlow.vagasDescobertaDisponiveis = d.vagasDescobertaDisponiveis;

    this.showModal.set(false);
    this.router.navigate(['/cliente/reservar']);
  }

  fecharModal() {
    this.showModal.set(false);
  }
}
