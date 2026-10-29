export interface CriarReservaOnlineRequest {
  nomeCliente: string;
  telefoneCliente: string;
  cpfCliente?: string;
  placaVeiculo?: string;
  marcaVeiculo?: string;
  modeloVeiculo?: string;
  corVeiculo?: string;
  tipoVaga: string;
  dataEntrada: string;
  dataSaidaPrevista: string;
  qtdDias: number;
  observacoes?: string;
}
