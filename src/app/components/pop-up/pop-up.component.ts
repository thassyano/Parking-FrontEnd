import { Component, signal } from '@angular/core';
import { PopUpType } from '../../models/types/pop-up.type';

@Component({
  selector: 'app-pop-up',
  imports: [],
  templateUrl: './pop-up.component.html',
  styleUrl: './pop-up.component.css',
})
export class PopUpComponent {
  public message = signal<string>('');
  public type = signal<PopUpType>('sucesso');
  public isVisible = signal<boolean>(false);

  public show(message: string, type: PopUpType, duration: number): void {
    this.message.set(message);
    this.type.set(type);
    this.isVisible.set(true);

    setTimeout(() => {
      this.isVisible.set(false);
    }, duration);
  }
}
