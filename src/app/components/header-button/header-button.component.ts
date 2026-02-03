import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-header-button',
  imports: [],
  templateUrl: './header-button.component.html',
  styleUrl: './header-button.component.css',
})
export class HeaderButtonComponent {
  public message = input.required<string>();
  public onClick = output<void>();

  public clicked(): void {
    this.onClick.emit();
  }
}
