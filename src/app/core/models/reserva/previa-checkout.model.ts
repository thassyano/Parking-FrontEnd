/** Cálculo do check-out feito pelo back-end sem gravar nada (muda conforme pagamento e traslado). */
export interface PreviaCheckout {
  dataEntrada: string;
  dataSaida: string;
  permanencia: string;
  formaPagamento: string;
  diariasCompletas: number;
  /** Diárias cheias cobradas (24h completas + parcial a partir de 12h). */
  diariasCobradas: number;
  valorEstadia: number;
  valorHorasAdicionais: number;
  descontoPixDinheiroPorDia: number;
  desconto: number;
  comTraslado: boolean;
  trasladoGratis: boolean;
  valorTraslado: number;
  valorTotal: number;
  valorFinal: number;
}

export interface AtualizarDadosVeiculoRequest {
  marcaVeiculo?: string;
  modeloVeiculo?: string;
  corVeiculo?: string;
}

export interface AlterarFormaPagamentoRequest {
  formaPagamento: string;
  comTraslado?: boolean;
}
