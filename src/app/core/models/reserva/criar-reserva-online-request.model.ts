export interface CriarReservaOnlineRequest {
  nomeCliente: string;
  telefoneCliente: string;
  cpfCliente?: string;
  placaVeiculo?: string;
  tipoVaga: string;
  dataEntrada: string;
  dataSaidaPrevista: string;
  qtdDias: number;
  observacoes?: string;
}
