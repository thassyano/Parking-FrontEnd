import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AdminLayout } from './shared/components/admin-layout/admin-layout';
import { ClienteLayout } from './shared/components/cliente-layout/cliente-layout';
import { Home } from './pages/public/home/home';
import { ClienteConsulta } from './pages/public/cliente-consulta/cliente-consulta';
import { ClienteReserva } from './pages/public/cliente-reserva/cliente-reserva';
import { Login } from './pages/admin/login/login';
import { Dashboard } from './pages/admin/dashboard/dashboard';
import { Reservas } from './pages/admin/reservas/reservas';
import { ReservaDetalhe } from './pages/admin/reserva-detalhe/reserva-detalhe';
import { ReservaPresencial } from './pages/admin/reserva-presencial/reserva-presencial';
import { Precos } from './pages/admin/precos/precos';
import { Caixa } from './pages/admin/caixa/caixa';
import { ConfiguracaoPage } from './pages/admin/configuracao/configuracao';
import { Admins } from './pages/admin/admins/admins';

export const routes: Routes = [
  { path: '', component: Home },
  {
    path: 'cliente',
    component: ClienteLayout,
    children: [
      { path: '', component: ClienteConsulta },
      { path: 'reservar', component: ClienteReserva },
    ],
  },
  {
    path: 'admin',
    children: [
      { path: 'login', component: Login },
      {
        path: '',
        component: AdminLayout,
        canActivate: [authGuard],
        children: [
          { path: 'dashboard', component: Dashboard },
          { path: 'reservas/:id', component: ReservaDetalhe },
          { path: 'reservas', component: Reservas },
          { path: 'reserva-presencial', component: ReservaPresencial },
          { path: 'precos', component: Precos },
          { path: 'caixa', component: Caixa },
          { path: 'configuracao', component: ConfiguracaoPage },
          { path: 'admins', component: Admins },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
