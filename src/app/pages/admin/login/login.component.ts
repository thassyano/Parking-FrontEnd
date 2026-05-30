import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LandingButtonComponent } from '../../../components/buttons/landing-button/landing-button.component';
import { LoginInterface } from '../../../core/models/auth/login.model';
import { AuthService } from '../../../core/services/auth/auth.service';
import { HeaderComponent } from '../../../components/header/header.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, LandingButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  ngOnInit(): void {
    localStorage.removeItem('token');
  }

  protected authService = inject(AuthService);
  private router = inject(Router);
  protected errorMessage = signal<string>('');

  protected isLoading = signal<boolean>(false);

  public loginForm = new FormGroup({
    senha: new FormControl('', [
      Validators.required,
      Validators.maxLength(30),
      Validators.minLength(6),
    ]),
    usuario: new FormControl('', [Validators.required, Validators.maxLength(50)]),
  });

  public onLogin(): void {
    if (this.loginForm.invalid) {
      this.errorMessage.set('Senha ou usuário incorretos.');
      setTimeout(() => {
        this.errorMessage.set('');
      }, 6000);
      return;
    }

    this.isLoading.set(true);

    const credenciais: LoginInterface = {
      usuario: this.loginForm.value.usuario!,
      senha: this.loginForm.value.senha!,
    };

    this.authService.login(credenciais).subscribe({
      next: (resultado) => {
        this.authService.token.set(resultado);
        this.router.navigateByUrl('/admin/dashboard');
      },
      error: (error) => {
        this.errorMessage.set("Usuário ou senha inválidos");
        setTimeout(() => {
          this.errorMessage.set('');
        }, 6000);
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }
}
