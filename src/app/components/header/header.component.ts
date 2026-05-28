import { Component, inject, input, signal } from '@angular/core';
import { BackBtnComponent } from '../buttons/back-btn/back-btn.component';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-header',
  imports: [BackBtnComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  private router = inject(Router);
  private readonly authService = inject(AuthService);

  public headerName = input.required<string>();

  protected navigateHome(): void {
    const header = this.headerName().toLowerCase();

    const isAdmin =
      header.includes('admin') ||
      header.includes('administrador') ||
      header.includes('administração');

    if (isAdmin) {
      if (this.authService.isAuthenticated()) {
        this.router.navigateByUrl('/admin/dashboard');
        return;
      }

      this.router.navigateByUrl('/admin/login');
      return;
    }

    this.router.navigateByUrl('');
  }
}
