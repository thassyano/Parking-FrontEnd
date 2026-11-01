export interface CarroLoteRequest {
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

export interface CarroPresencialLoteRequest {
  placaVeiculo: string;
  marcaVeiculo?: string;
  modeloVeiculo?: string;
  corVeiculo?: string;
  tipoVaga: string;
  dataEntrada: string;
  dataSaidaPrevista: string;
  qtdDias: number;
  observacoes?: string;
}
