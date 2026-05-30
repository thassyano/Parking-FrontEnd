export interface Preco {
  id: number;
  tipoVaga: string;
  valorDiaria: number;
  descontoPixDinheiro: number;
  valorHorasAdicionaisAte6h: number;
  valorHorasAdicionaisAte12h: number;
  dataInicio: string;
  dataFim?: string;
  ativo: boolean;
}
