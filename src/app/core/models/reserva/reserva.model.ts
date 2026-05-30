export interface Reserva {
  id: number;
  nomeCliente: string;
  telefoneCliente: string;
  cpfCliente?: string;
  placaVeiculo?: string;
  tipoVaga: string;
  dataEntrada: string;
  qtdDias: number;
  dataSaidaPrevista: string;
  valorDiaria: number;
  valorTotal: number;
  descontoAplicado: number;
  valorHorasAdicionais: number;
  valorFinal: number;
  formaPagamento?: string;
  pago: boolean;
  status: string;
  origem: string;
  dataCheckin?: string;
  dataCheckout?: string;
  observacoes?: string;
  dataCriacao: string;
}
