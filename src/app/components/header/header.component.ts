import { Component, inject, input, signal } from '@angular/core';
import { BackBtnComponent } from '../buttons/back-btn/back-btn.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [BackBtnComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  private router = inject(Router);

  public headerName = input.required<string>();

  protected navigateHome(): void {
    this.router.navigateByUrl('');
  }
}
