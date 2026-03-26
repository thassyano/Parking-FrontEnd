import { Component, input, signal } from '@angular/core';
import { BackBtnComponent } from '../buttons/back-btn/back-btn.component';

@Component({
  selector: 'app-header',
  imports: [BackBtnComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  public headerName = input.required<string>();
}
