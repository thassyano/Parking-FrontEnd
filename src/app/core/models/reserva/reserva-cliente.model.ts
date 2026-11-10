/** Identificação do cliente sem login: placa + telefone cadastrados na reserva. */
export interface ConsultaReservaClienteRequest {
  placaVeiculo: string;
  telefoneCliente: string;
}

/** Reserva vista pelo próprio cliente (o back-end não devolve nome, CPF nem telefone). */
export interface ReservaClienteResumo {
  id: number;
  placaVeiculo: string;
  marcaVeiculo?: string;
  modeloVeiculo?: string;
  corVeiculo?: string;
  tipoVaga: string;
  dataEntrada: string;
  dataSaidaPrevista: string;
  valorTotal: number;
  status: string;
  /** Falso quando já passou do limite de antecedência para alterar pelo site. */
  podeAlterar: boolean;
  limiteAlteracao: string;
  motivoBloqueio?: string;
}

export interface AlterarDadosClienteRequest {
  placaVeiculo: string;
  telefoneCliente: string;
  marcaVeiculo: string;
  modeloVeiculo: string;
  corVeiculo: string;
  tipoVaga?: string;
}
