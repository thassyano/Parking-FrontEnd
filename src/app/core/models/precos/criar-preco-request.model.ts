export interface CriarPrecoRequest {
  tipoVaga: string;
  valorDiaria: number;
  descontoPixDinheiro: number;
  dataInicio: string;
  dataFim?: string;
}
