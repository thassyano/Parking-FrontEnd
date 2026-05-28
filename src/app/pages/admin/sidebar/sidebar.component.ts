import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth/auth.service';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [RouterOutlet, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  protected sidebarOpen = signal(false);
  protected authService = inject(AuthService);

  get userName(): string {
    const user = this.authService.getUser();
    return user?.nome || user?.usuario || 'Admin';
  }

  get isAdminMaster(): boolean {
    return this.authService.isAdminMaster();
  }

  toggleSidebar() {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  logout() {
    this.authService.logout();
  }
}
