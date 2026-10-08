export type PerfilAdmin = 'Admin' | 'AdminMaster';

export const PERFIL_ADMIN_MASTER: PerfilAdmin = 'AdminMaster';

export const PERFIL_ADMIN_OPCOES: { valor: PerfilAdmin; rotulo: string }[] = [
  { valor: 'Admin', rotulo: 'Admin' },
  { valor: 'AdminMaster', rotulo: 'Admin Master' },
];
