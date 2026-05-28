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
}
