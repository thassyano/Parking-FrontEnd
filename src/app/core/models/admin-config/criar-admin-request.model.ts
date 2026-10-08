import { PerfilAdmin } from '../auth/perfil-admin.model';

export interface CriarAdminRequest {
  usuario: string;
  senha: string;
  email?: string;
  nome?: string;
  perfil: PerfilAdmin;
}
