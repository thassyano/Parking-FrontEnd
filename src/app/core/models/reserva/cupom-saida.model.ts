export interface CupomSaida {
  nomeEstacionamento: string;
  endereco?: string;
  contato?: string;
  cnpj?: string;
  numero: number;
  placaVeiculo: string;
  dataHoraEntrada: string;
  dataSaidaPrevista: string;
  dataHoraSaida: string;
  tipoVaga: string;
  qtdDias: number;
  permanencia: string;
  valorDiaria: number;
  valorTotal: number;
  descontoAplicado: number;
  valorHorasAdicionais: number;
  comTraslado: boolean;
  valorTraslado: number;
  valorFinal: number;
  formaPagamento: string;
}
