import { PerfilAdmin } from './perfil-admin.model';

export interface TokenInterface {
  token: string;
  usuario: string;
  expiraEm: string;
  nome: string;
  perfil: PerfilAdmin;
}