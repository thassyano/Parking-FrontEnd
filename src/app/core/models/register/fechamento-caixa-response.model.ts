import { ReservaCaixa } from './reserva-caixa.model';

export interface FechamentoCaixaResponse {
  dataInicio: string;
  dataFim: string;
  totalReservas: number;
  reservasPagas: number;
  reservasCanceladas: number;
  reservasPendentes: number;
  receitaTotal: number;
  receitaPix: number;
  receitaCartao: number;
  receitaDinheiro: number;
  vagasCobertas: number;
  vagasDescobertas: number;
  reservas: ReservaCaixa[];
}
