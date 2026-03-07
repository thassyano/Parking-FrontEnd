import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  usuario = '';
  senha = '';
  loading = signal(false);
  erro = signal('');

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  entrar() {
    if (!this.usuario || !this.senha) {
      this.erro.set('Preencha usuario e senha');
      return;
    }
    this.loading.set(true);
    this.erro.set('');

    this.authService.login({ usuario: this.usuario, senha: this.senha }).subscribe({
      next: () => this.router.navigate(['/admin/dashboard']),
      error: (err) => {
        this.erro.set(err.error?.message || 'Credenciais invalidas');
        this.loading.set(false);
      },
    });
  }
}
