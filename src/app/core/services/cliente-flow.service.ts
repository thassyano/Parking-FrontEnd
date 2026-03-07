import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClienteFlowService {
  dataEntrada = '';
  horaEntrada = '';
  dataSaida = '';
  horaSaida = '';
  qtdDias = 0;
  vagasCobertaDisponiveis = 0;
  vagasDescobertaDisponiveis = 0;

  reset() {
    this.dataEntrada = '';
    this.horaEntrada = '';
    this.dataSaida = '';
    this.horaSaida = '';
    this.qtdDias = 0;
    this.vagasCobertaDisponiveis = 0;
    this.vagasDescobertaDisponiveis = 0;
  }
}
