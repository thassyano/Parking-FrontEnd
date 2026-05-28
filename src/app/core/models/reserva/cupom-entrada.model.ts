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
