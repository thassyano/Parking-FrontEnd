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

export interface CriarReservaPresencialRequest {
  nomeCliente: string;
  telefoneCliente: string;
  cpfCliente?: string;
  placaVeiculo: string;
  tipoVaga: string;
  dataEntrada: string;
  dataSaidaPrevista: string;
  qtdDias: number;
  observacoes?: string;
}

export interface AssociarPlacaRequest {
  placaVeiculo: string;
}

export interface CheckoutRequest {
  formaPagamento: string;
}

export interface CupomEntrada {
  nomeEstacionamento: string;
  endereco?: string;
  contato?: string;
  cnpj?: string;
  numero: number;
  placaVeiculo: string;
  dataHoraEntrada: string;
  tipoVaga: string;
  qtdDias: number;
  dataSaidaPrevista: string;
  valorDiaria: number;
  valorTotal: number;
  mensagem: string;
}

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
  valorFinal: number;
  formaPagamento: string;
}

export interface WhatsAppResponse {
  url: string;
  mensagem: string;
  telefoneEstacionamento: string;
}

export interface ReservaFiltros {
  dataInicio?: string;
  dataFim?: string;
  status?: string;
  tipoVaga?: string;
}

export interface CarroLoteRequest {
  placaVeiculo?: string;
  tipoVaga: string;
  dataEntrada: string;
  dataSaidaPrevista: string;
  qtdDias: number;
  observacoes?: string;
}

export interface CriarReservaLoteOnlineRequest {
  nomeCliente: string;
  telefoneCliente: string;
  cpfCliente?: string;
  carros: CarroLoteRequest[];
}

export interface ReservaLoteResponse {
  reservas: Reserva[];
  totalReservas: number;
  valorTotalGeral: number;
}
