import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth/auth.service';
import { SidebarService } from '../../../core/services/ui/sidebar.service';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [RouterOutlet, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  protected readonly sidebarOpen = inject(SidebarService).sidebarOpen;
  protected authService = inject(AuthService);
  private readonly sidebarService = inject(SidebarService);

  get userName(): string {
    const user = this.authService.getUser();
    return user?.nome || user?.usuario || 'Admin';
  }

  get isAdminMaster(): boolean {
    return this.authService.isAdminMaster();
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  closeSidebar(): void {
    this.sidebarService.closeSidebar();
  }

  logout() {
    this.authService.logout();
  }
}
