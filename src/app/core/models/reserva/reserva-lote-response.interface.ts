import { Reserva } from './reserva.model';

export interface ReservaLoteResponse {
  reservas: Reserva[];
  totalReservas: number;
  valorTotalGeral: number;
}
