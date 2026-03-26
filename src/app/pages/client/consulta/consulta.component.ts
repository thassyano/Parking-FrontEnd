import { Component, signal } from '@angular/core';
import { LandingButtonComponent } from '../../../components/buttons/landing-button/landing-button.component';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-consulta',
  imports: [LandingButtonComponent, ReactiveFormsModule],
  templateUrl: './consulta.component.html',
  styleUrl: './consulta.component.css',
})
export class ConsultaComponent {
  public isLoading = signal<boolean>(false);
  public isModalVisible = signal<boolean>(false);
  public isAvailable = signal<boolean>(false);
  public errorMessage = signal<string>('');

  public availabilityForm = new FormGroup({
    entryDate: new FormControl('', [Validators.required]),
    entryTime: new FormControl('', [Validators.required]),
    exitDate: new FormControl('', [Validators.required]),
    exitTime: new FormControl('', [Validators.required]),
  });

  public checkAvailability(): void {
    if (this.availabilityForm.invalid || this.isLoading()) {
      return;
    }

    const formValue = this.availabilityForm.value;

    if (formValue.entryDate && formValue.entryTime && formValue.exitDate && formValue.exitTime) {
      this.errorMessage.set('');
      this.isLoading.set(true);

      // adicionar service aqui depois
    }
  }

  public closeModal(): void {
    this.isModalVisible.set(false);
  }
}
