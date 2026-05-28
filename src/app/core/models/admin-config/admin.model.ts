import { PerfilAdmin } from '../auth/perfil-admin.model';

export interface Admin {
  id: number;
  usuario: string;
  email: string;
  nome: string;
  perfil: PerfilAdmin;
  dataCriacao: string;
  ativo: boolean;
}
