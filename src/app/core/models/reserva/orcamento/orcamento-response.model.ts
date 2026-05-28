export interface OrcamentoResponse {
  tipoVaga: string;
  dataEntrada: string;
  qtdDias: number;
  dataSaidaPrevista: string;
  valorDiaria: number;
  valorTotalCartao: number;
  valorTotalPixDinheiro: number;
  descontoPixDinheiroPorDia: number;
  economiaTotal: number;
  vagasDisponiveis: boolean;
  vagasRestantes: number;
}
