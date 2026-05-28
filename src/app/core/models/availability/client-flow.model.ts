export interface CarroEntry {
  dataEntrada: string;
  horaEntrada: string;
  dataSaida: string;
  horaSaida: string;
  qtdDias: number;
  tipoVaga: 'Coberta' | 'Descoberta';
  placa: string;
  vagasCobertaDisponiveis: number;
  vagasDescobertaDisponiveis: number;
}

export interface ClientFlowInterface {
  dataEntrada: string;
  horaEntrada: string;
  dataSaida: string;
  horaSaida: string;
  qtdDias: number;
  vagasCobertaDisponiveis: number;
  vagasDescobertaDisponiveis: number;
  carros: CarroEntry[];
}
