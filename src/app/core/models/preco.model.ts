export interface Preco {
  id: number;
  tipoVaga: string;
  valorDiaria: number;
  descontoPixDinheiro: number;
  dataInicio: string;
  dataFim?: string;
  ativo: boolean;
}

export interface CriarPrecoRequest {
  tipoVaga: string;
  valorDiaria: number;
  descontoPixDinheiro: number;
  dataInicio?: string;
}
