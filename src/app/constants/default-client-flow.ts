import { ClientFlowInterface } from '../core/models/availability/client-flow.model';

export const DEFAULT_CLIENT_FLOW: ClientFlowInterface = {
  dataEntrada: '',
  horaEntrada: '',
  dataSaida: '',
  horaSaida: '',
  qtdDias: 0,
  vagasCobertaDisponiveis: 0,
  vagasDescobertaDisponiveis: 0,
};
