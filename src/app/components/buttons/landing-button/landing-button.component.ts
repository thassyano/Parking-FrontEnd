import { Component, input, output } from '@angular/core';
import { LandingPageButtonType } from '../../../core/models/components/buttons/landing-btn.type';

@Component({
  selector: 'app-landing-button',
  imports: [],
  templateUrl: './landing-button.component.html',
  styleUrl: './landing-button.component.css',
})
export class LandingButtonComponent {
  public label = input.required<string>();
  public variant = input<LandingPageButtonType>('primary');
  public fullWidth = input<boolean>(false);
  public disabled = input<boolean>(false);

  public clicked = output<void>();
}
