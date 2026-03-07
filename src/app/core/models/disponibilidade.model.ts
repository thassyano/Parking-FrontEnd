export interface DisponibilidadeDia {
  data: string;
  vagasCobertaTotal: number;
  vagasCobertaOcupadas: number;
  vagasCobertaDisponiveis: number;
  vagasDescobertaTotal: number;
  vagasDescobertaOcupadas: number;
  vagasDescobertaDisponiveis: number;
}

export interface DisponibilidadePeriodo {
  dataInicio: string;
  dataFim: string;
  dias: DisponibilidadeDia[];
}
