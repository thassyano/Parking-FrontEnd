export type TipoPrecificacao = 'HorasAte6h' | 'HorasAte12h' | 'Diaria';

export interface OrcamentoResponse {
  tipoVaga: string;
  dataEntrada: string;
  qtdDias: number;
  dataSaidaPrevista: string;
  tipoPrecificacao: TipoPrecificacao;
  valorDiaria: number;
  valorTotalCartao: number;
  valorTotalPixDinheiro: number;
  descontoPixDinheiroPorDia: number;
  economiaTotal: number;
  vagasDisponiveis: boolean;
  vagasRestantes: number;
}
