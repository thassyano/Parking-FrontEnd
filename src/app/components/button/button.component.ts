import { Component, input, output, signal } from '@angular/core';
import { BtnClass } from '../../models/enums/button/button-class.enum';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
})
export class ButtonComponent {
    public message = input.required<string>();
    public class = input.required<BtnClass>();
    public onClick = output<void>();

    public clicked(): void {
        this.onClick.emit();
    }
}
