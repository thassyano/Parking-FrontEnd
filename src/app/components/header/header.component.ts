import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { SidebarService } from '../../core/services/ui/sidebar.service';

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  private router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly sidebarService = inject(SidebarService);

  public headerName = input.required<string>();
  public showMenuToggle = input.required<boolean>();

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

  protected toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }
}
