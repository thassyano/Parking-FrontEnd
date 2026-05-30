export interface LogAtividade {
  id: number;
  dataHora: string;
  adminId?: number | null;
  adminUsuario?: string | null;
  acao: string;
  entidade?: string | null;
  entidadeId?: number | null;
  detalhes: string;
  sucesso: boolean;
  origem: string;
}

export interface FiltroLogAtividade {
  dataInicio?: string;
  dataFim?: string;
  acao?: string;
  adminUsuario?: string;
  origem?: string;
  sucesso?: boolean;
  pagina?: number;
  tamanhoPagina?: number;
}

export interface LogAtividadePaginado {
  itens: LogAtividade[];
  total: number;
  pagina: number;
  tamanhoPagina: number;
  totalPaginas: number;
}

export const ACAO_LABELS: Record<string, string> = {
  LoginSucesso: 'Login realizado',
  LoginFalha: 'Falha no login',
  AdminCriado: 'Admin criado',
  AdminAtualizado: 'Admin atualizado',
  AdminAtivado: 'Admin ativado',
  AdminDesativado: 'Admin desativado',
  AdminExcluido: 'Admin excluído',
  ReservaOnline: 'Reserva online',
  ReservaPresencial: 'Reserva presencial',
  ReservaAlterada: 'Reserva alterada',
  ReservaPlacaAssociada: 'Placa associada',
  ReservaCheckin: 'Check-in',
  ReservaCheckout: 'Check-out',
  ReservaCancelada: 'Reserva cancelada',
  ReservaConfirmadaCliente: 'Confirmação pelo cliente',
  ConfiguracaoAtualizada: 'Configuração atualizada',
  ConfiguracaoTesteEvolution: 'Teste Evolution',
  PrecoCriado: 'Preço criado',
  WorkerWhatsAppEnviado: 'WhatsApp enviado (automático)',
  WorkerWhatsAppFalha: 'Falha WhatsApp (automático)',
  WorkerCancelamentoAutomatico: 'Cancelamento automático',
};

export const ORIGEM_LABELS: Record<string, string> = {
  Admin: 'Admin',
  Cliente: 'Cliente',
  Sistema: 'Sistema',
  Worker: 'Worker',
};
