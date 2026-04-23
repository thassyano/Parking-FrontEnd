import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'client',
    loadComponent: () =>
      import('./pages/client/client-layout/client-layout.component').then(
        (module) => module.ClientLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/client/consulta/consulta.component').then(
            (module) => module.ConsultaComponent,
          ),
      },
      {
        path: 'reservar',
        loadComponent: () =>
          import('./pages/client/reservations/reservations.component').then(
            (module) => module.ReservationsComponent,
          ),
      },
    ],
  },
  {
    path: 'admin',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/admin/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: '',
        loadComponent: () =>
          import('./pages/admin/admin-layout/admin-layout.component').then(
            (m) => m.AdminLayoutComponent,
          ),
        canActivate: [authGuard],
        children: [
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./pages/admin/dashboard/dashboard.component').then(
                (m) => m.DashboardComponent,
              ),
          },
          {
            path: 'reservas',
            loadComponent: () =>
              import('./pages/admin/admin-reservations/admin-reservations.component').then(
                (m) => m.AdminReservationsComponent,
              ),
          },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ],
      },
    ],
  },
];
