export interface CupomSaida {
  nomeEstacionamento: string;
  endereco?: string;
  contato?: string;
  cnpj?: string;
  numero: number;
  placaVeiculo: string;
  dataHoraEntrada: string;
  dataHoraSaida: string;
  tipoVaga: string;
  qtdDias: number;
  valorDiaria: number;
  valorTotal: number;
  descontoAplicado: number;
  valorHorasAdicionais: number;
  valorFinal: number;
  formaPagamento: string;
}
