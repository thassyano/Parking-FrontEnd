import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { HomeComponent } from './pages/home/home.component';

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
              import('./pages/admin/reservations/admin-reservations.component').then(
                (m) => m.AdminReservationsComponent,
              ),
          },
          {
            path: 'reserva-presencial',
            loadComponent: () =>
              import('./pages/admin/create-reservations/create-reservations.component').then(
                (m) => m.CreateReservationsComponent,
              ),
          },
          {
            path: 'reservas/:id',
            loadComponent: () =>
              import('./pages/admin/reservation-detail/reservation-detail.component').then(
                (m) => m.ReservationDetailComponent,
              ),
          },
          {
            path: 'caixa',
            loadComponent: () =>
              import('./pages/admin/register/register.component').then((m) => m.RegisterComponent),
          },
          {
            path: 'configuracao',
            loadComponent: () =>
              import('./pages/admin/configuration/configuration.component').then(
                (m) => m.ConfigurationComponent,
              ),
          },
          {
            path: 'admins',
            loadComponent: () =>
              import('./pages/admin/accounts/accounts.component').then((m) => m.AccountsComponent),
          },
          {
            path: 'precos',
            loadComponent: () =>
              import('./pages/admin/pricing/pricing.component').then((m) => m.PricingComponent),
          },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ],
      },
    ],
  },
];
