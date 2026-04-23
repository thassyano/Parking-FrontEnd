import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LandingButtonComponent } from '../../../components/buttons/landing-button/landing-button.component';
import { PeriodAvailabilityService } from '../../../core/services/availability/period-availability.service';
import { PeriodAvailability } from '../../../core/models/availability/period-availability.model';
import { AvailabilityModalComponent } from '../../../components/modals/availability-modal/availability-modal.component';
import { ClientFlowService } from '../../../core/services/client/client-flow.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-consulta',
  imports: [LandingButtonComponent, ReactiveFormsModule, AvailabilityModalComponent],
  templateUrl: './consulta.component.html',
  styleUrl: './consulta.component.css',
})
export class ConsultaComponent {
  private readonly periodService = inject(PeriodAvailabilityService);
  private readonly clientFlow = inject(ClientFlowService);
  private readonly router = inject(Router);

  public isLoading = signal<boolean>(false);
  public isModalVisible = signal<boolean>(false);
  public errorMessage = signal<string>('');

  public availability = signal<PeriodAvailability | null>(null);

  private readonly now = new Date();
  private readonly tomorrow = new Date(this.now.getTime() + 24 * 60 * 60 * 1000);

  protected entryDate = signal(this.formatDate(this.now));
  protected entryTime = signal(this.formatTime(this.now));
  protected exitDate = signal(this.formatDate(this.tomorrow));
  protected exitTime = signal(this.formatTime(this.tomorrow));

  public availabilityForm = new FormGroup({
    entryDate: new FormControl(this.entryDate(), [Validators.required]),
    entryTime: new FormControl(this.entryTime(), [Validators.required]),
    exitDate: new FormControl(this.exitDate(), [Validators.required]),
    exitTime: new FormControl(this.exitTime(), [Validators.required]),
  });

  public checkAvailability(): void {
    if (this.availabilityForm.invalid || this.isLoading()) {
      this.errorMessage.set('Preencha as datas de entrada e saida');
      return;
    }

    const formValue = this.availabilityForm.value;

    if (formValue.entryDate && formValue.entryTime && formValue.exitDate && formValue.exitTime) {
      this.errorMessage.set('');
      this.isLoading.set(true);

      this.periodService
        .checkPeriodAvailability(formValue.entryDate, formValue.exitDate)
        .subscribe({
          next: (result) => {
            this.availability.set(result);
            this.isModalVisible.set(true);
            this.isLoading.set(false);
          },
          error: (error) => {
            this.errorMessage.set(error.error.message);
            this.isLoading.set(false);
          },
        });
    }
  }

  public closeModal(): void {
    this.isModalVisible.set(false);
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-CA');
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  public continue(): void {
    const { entryDate, entryTime, exitDate, exitTime } = this.availabilityForm.value;

    if (!entryDate || !entryTime || !exitDate || !exitTime || !this.availability()) {
      return;
    }

    const qtdDias = Math.max(
      1,
      Math.round((new Date(exitDate).getTime() - new Date(entryDate).getTime()) / 86_400_000),
    );

    const entrada = this.formatDateTime(entryDate, entryTime);
    const saida = this.formatDateTime(exitDate, exitTime);

    const vagasCobertaDisponiveis = this.availability()!.dias.reduce(
      (min, day) => Math.min(min, day.vagasCobertaDisponiveis),
      Infinity,
    );

    const vagasDescobertaDisponiveis = this.availability()!.dias.reduce(
      (min, day) => Math.min(min, day.vagasDescobertaDisponiveis),
      Infinity,
    );

    this.clientFlow.clientReservationData.update((data) => ({
      ...data,
      dataEntrada: entrada.data,
      horaEntrada: entrada.hora,
      dataSaida: saida.data,
      horaSaida: saida.hora,
      qtdDias,
      vagasCobertaDisponiveis,
      vagasDescobertaDisponiveis,
    }));

    this.clientFlow.save();
    this.closeModal();
    this.router.navigate(['/client/reservar']);
  }

  private formatDateTime(date: string, time: string): { data: string; hora: string } {
    if (!date) return { data: '', hora: '' };

    const [year, month, day] = date.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    return {
      data: formattedDate,
      hora: time || '',
    };
  }
}
