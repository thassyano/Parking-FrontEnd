import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DisponibilidadeService } from '../../../core/services/disponibilidade.service';
import { DisponibilidadePeriodo } from '../../../core/models/disponibilidade.model';
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
  disponibilidade = signal<DisponibilidadePeriodo | null>(null);

  minCoberta = computed(() => {
    const d = this.disponibilidade();
    if (!d?.dias.length) return 0;
    return Math.min(...d.dias.map((dia) => dia.vagasCobertaDisponiveis));
  });

  minDescoberta = computed(() => {
    const d = this.disponibilidade();
    if (!d?.dias.length) return 0;
    return Math.min(...d.dias.map((dia) => dia.vagasDescobertaDisponiveis));
  });

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

    const dataHoraInicio = `${this.dataEntrada}T${this.horaEntrada || '00:00'}`;
    const dataHoraFim = `${this.dataSaida}T${this.horaSaida || '00:00'}`;

    this.disponibilidadeService.consultarPeriodo(dataHoraInicio, dataHoraFim).subscribe({
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
    return this.minCoberta() > 0 || this.minDescoberta() > 0;
  }

  continuar() {
    const entradaDate = new Date(`${this.dataEntrada}T00:00`);
    const saidaDate = new Date(`${this.dataSaida}T00:00`);
    const diffDays = (saidaDate.getTime() - entradaDate.getTime()) / (1000 * 60 * 60 * 24);
    const qtdDias = Math.max(1, diffDays);

    this.clienteFlow.dataEntrada = this.dataEntrada;
    this.clienteFlow.horaEntrada = this.horaEntrada;
    this.clienteFlow.dataSaida = this.dataSaida;
    this.clienteFlow.horaSaida = this.horaSaida;
    this.clienteFlow.qtdDias = qtdDias;
    this.clienteFlow.vagasCobertaDisponiveis = this.minCoberta();
    this.clienteFlow.vagasDescobertaDisponiveis = this.minDescoberta();

    this.showModal.set(false);
    this.router.navigate(['/cliente/reservar']);
  }

  fecharModal() {
    this.showModal.set(false);
  }
}
