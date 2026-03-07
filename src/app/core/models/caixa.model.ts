export interface FechamentoCaixaRequest {
  dataInicio: string;
  dataFim: string;
}

export interface ReservaCaixa {
  reservaId: number;
  nomeCliente: string;
  telefoneCliente: string;
  placaVeiculo?: string;
  tipoVaga: string;
  dataEntrada: string;
  qtdDias: number;
  valorFinal: number;
  formaPagamento?: string;
  status: string;
  pago: boolean;
}

export interface FechamentoCaixaResponse {
  dataInicio: string;
  dataFim: string;
  totalReservas: number;
  reservasPagas: number;
  reservasCanceladas: number;
  reservasPendentes: number;
  receitaTotal: number;
  receitaPix: number;
  receitaCartao: number;
  receitaDinheiro: number;
  vagasCobertas: number;
  vagasDescobertas: number;
  reservas: ReservaCaixa[];
}
