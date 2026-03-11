import { Component, inject, signal, viewChild } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { LoginInterface } from '../../models/auth/login.model';
import { ButtonComponent } from '../../components/button/button.component';
import { BtnClass } from '../../models/enums/button/button-class.enum';
import { PopUpComponent } from '../../components/pop-up/pop-up.component';

@Component({
  selector: 'app-login-admin',
  imports: [HeaderComponent, ReactiveFormsModule, ButtonComponent, PopUpComponent],
  templateUrl: './login-admin.component.html',
  styleUrl: './login-admin.component.css',
})
export class LoginAdminComponent {
  protected authService = inject(AuthService);
  private router = inject(Router);
  private popUpDuration = 5000;

  protected btnClass = BtnClass;
  protected isLoading = signal<boolean>(false);
  protected popUp = viewChild(PopUpComponent);

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
      this.popUp()?.show('Senha ou usuário incorretos.', 'alerta', this.popUpDuration);
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

        this.popUp()?.show('Login realizado com sucesso!', 'sucesso', this.popUpDuration);
      },
      error: () => {
        this.popUp()?.show('Usuário ou senha inválidos.', 'erro', this.popUpDuration);

        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }
}
