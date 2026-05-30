import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private readonly _sidebarOpen = signal(false);
  public readonly sidebarOpen = this._sidebarOpen.asReadonly();

  public toggleSidebar(): void {
    this._sidebarOpen.update((open) => !open);
  }

  public closeSidebar(): void {
    this._sidebarOpen.set(false);
  }

  public openSidebar(): void {
    this._sidebarOpen.set(true);
  }
}
