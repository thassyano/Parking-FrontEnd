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
