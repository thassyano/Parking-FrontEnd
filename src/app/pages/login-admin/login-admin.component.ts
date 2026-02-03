import { Component, inject, signal } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { LoginInterface } from '../../models/auth/login.model';
import { ButtonComponent } from '../../components/button/button.component';
import { BtnClass } from '../../models/enums/button/button-class.enum';

@Component({
  selector: 'app-login-admin',
  imports: [HeaderComponent, ReactiveFormsModule, ButtonComponent],
  templateUrl: './login-admin.component.html',
  styleUrl: './login-admin.component.css',
})
export class LoginAdminComponent {
  protected authService = inject(AuthService);
  private router = inject(Router);

  protected btnClass = BtnClass;

  public loginForm = new FormGroup({
    senha: new FormControl('', [
      Validators.required,
      Validators.maxLength(30),
      Validators.minLength(6),
    ]),
    usuario: new FormControl('', [Validators.required, Validators.maxLength(50)]),
  });

  public onLogin(): void {
    if (this.loginForm.invalid) return;

    const credenciais: LoginInterface = {
      usuario: this.loginForm.value.usuario!,
      senha: this.loginForm.value.senha!,
    };

    if (credenciais.senha && credenciais.usuario) {
      this.authService.login(credenciais).subscribe({
        next: (resultado) => {
          this.authService.token.set(resultado);
          console.log('sucesso');
        },
        error: (error) => {
          console.log(error.message);
        },
      });
    }
  }
}
