export interface Admin {
  id: number;
  usuario: string;
  email: string;
  nome: string;
  dataCriacao: string;
  ativo: boolean;
}

export interface CriarAdminRequest {
  usuario: string;
  senha: string;
  email: string;
  nome?: string;
}
