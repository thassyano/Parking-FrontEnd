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
  public type = input<string>('button');

  public clicked = output<void>();

  /** Com type="submit", o form usa ngSubmit — não emite clicked para evitar handler duplicado. */
  protected onClick(): void {
    if (this.type() !== 'submit') {
      this.clicked.emit();
    }
  }
}
