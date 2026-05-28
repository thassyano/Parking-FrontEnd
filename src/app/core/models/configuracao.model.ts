export interface Configuracao {
  id: number;
  nomeEstacionamento: string;
  endereco?: string;
  contato?: string;
  cnpj?: string;
  totalVagasCoberta: number;
  totalVagasDescoberta: number;
  telefoneWhatsApp?: string;
  mensagemWhatsApp?: string;
  horasAntecedenciaConfirmacao: number;
  evolutionApiUrl?: string;
  evolutionInstanceName?: string;
  evolutionConfigurada: boolean;
  urlConfirmacaoFrontend?: string;
  dataAtualizacao: string;
}

export interface AtualizarConfiguracaoRequest {
  nomeEstacionamento?: string;
  endereco?: string;
  contato?: string;
  cnpj?: string;
  totalVagasCoberta?: number;
  totalVagasDescoberta?: number;
  telefoneWhatsApp?: string;
  mensagemWhatsApp?: string;
  horasAntecedenciaConfirmacao?: number;
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  evolutionInstanceName?: string;
  urlConfirmacaoFrontend?: string;
}
