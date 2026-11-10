/**
 * Edição completa feita pelo admin. Dados do cliente, do veículo e observações vão sempre por inteiro;
 * tipo de vaga e datas só são enviados quando mudaram (ausente = o back-end mantém o valor atual).
 */
export interface EditarReservaAdminRequest {
  nomeCliente: string;
  telefoneCliente: string;
  cpfCliente?: string;
  placaVeiculo?: string;
  marcaVeiculo: string;
  modeloVeiculo: string;
  corVeiculo: string;
  observacoes?: string;
  tipoVaga?: string;
  dataEntrada?: string;
  dataSaidaPrevista?: string;
}
