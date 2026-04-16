import { Injectable } from '@angular/core';

export interface CarroEntry {
  dataEntrada: string;
  horaEntrada: string;
  dataSaida: string;
  horaSaida: string;
  qtdDias: number;
  tipoVaga: string;
  placa: string;
  vagasCobertaDisponiveis: number;
  vagasDescobertaDisponiveis: number;
}

@Injectable({ providedIn: 'root' })
export class ClienteFlowService {
  // Campos do primeiro veículo (mantidos para compatibilidade com telas existentes)
  dataEntrada = '';
  horaEntrada = '';
  dataSaida = '';
  horaSaida = '';
  qtdDias = 0;
  vagasCobertaDisponiveis = 0;
  vagasDescobertaDisponiveis = 0;

  // Lista de todos os veículos da reserva (inclui o primeiro)
  carros: CarroEntry[] = [];

  reset() {
    this.dataEntrada = '';
    this.horaEntrada = '';
    this.dataSaida = '';
    this.horaSaida = '';
    this.qtdDias = 0;
    this.vagasCobertaDisponiveis = 0;
    this.vagasDescobertaDisponiveis = 0;
    this.carros = [];
  }
}
