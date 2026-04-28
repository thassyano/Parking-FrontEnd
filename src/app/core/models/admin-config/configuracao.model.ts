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
  dataAtualizacao: string;
}
