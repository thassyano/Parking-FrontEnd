import { Routes } from '@angular/router';
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
    ],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin/admin-layout/admin-layout.component').then(
        (module) => module.AdminLayoutComponent,
      ),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/admin/login/login.component').then((module) => module.LoginComponent),
      },
    ],
  },
];
