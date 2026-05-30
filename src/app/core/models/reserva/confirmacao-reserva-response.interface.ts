export interface ConfirmacaoReservaResponse {
  message: string;
  confirmada: boolean;
  reservaId: number;
  nomeCliente: string;
  dataEntrada: string;
  tipoVaga?: string;
  placa?: string;
  status?: string;
}
