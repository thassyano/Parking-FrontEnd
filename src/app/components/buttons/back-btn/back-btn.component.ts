import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-back-btn',
  imports: [],
  templateUrl: './back-btn.component.html',
  styleUrl: './back-btn.component.css',
})
export class BackBtnComponent {
  private location = inject(Location);

  goBack(): void {
    this.location.back();
  }
}
