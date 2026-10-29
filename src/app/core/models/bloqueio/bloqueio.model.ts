export interface Bloqueio {
  id: number;
  dataInicio: string;
  dataFim: string;
  motivo?: string;
  ativo: boolean;
  criadoPor?: string;
  dataCriacao: string;
}

export interface CriarBloqueioRequest {
  dataInicio: string;
  dataFim: string;
  motivo?: string;
}

/** Resposta pública usada pela tela do cliente. */
export interface BloqueioStatus {
  bloqueado: boolean;
  mensagem?: string;
  dataInicio?: string;
  dataFim?: string;
}
