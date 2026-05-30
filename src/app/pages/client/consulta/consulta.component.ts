import { Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LandingButtonComponent } from '../../../components/buttons/landing-button/landing-button.component';
import { AvailabilityModalComponent } from '../../../components/modals/availability-modal/availability-modal.component';
import { CarroEntry } from '../../../core/models/availability/client-flow.model';
import { PeriodAvailability } from '../../../core/models/availability/period-availability.model';
import { PeriodAvailabilityService } from '../../../core/services/availability/period-availability.service';
import { ClientFlowService } from '../../../core/services/client/client-flow.service';

type VehicleForm = FormGroup<{
  entryDate: FormControl<string | null>;
  entryTime: FormControl<string | null>;
  exitDate: FormControl<string | null>;
  exitTime: FormControl<string | null>;
}>;

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

  public readonly isLoading = signal(false);
  public readonly isModalVisible = signal(false);
  public readonly errorMessage = signal('');
  public readonly availability = signal<PeriodAvailability | null>(null);

  public readonly availabilityForm = new FormGroup({
    entryDate: new FormControl(this.formatDate(new Date()), Validators.required),
    entryTime: new FormControl(this.formatTime(new Date()), Validators.required),
    exitDate: new FormControl(this.formatDate(this.tomorrow()), Validators.required),
    exitTime: new FormControl(this.formatTime(this.tomorrow()), Validators.required),
  });

  public readonly additionalVehiclesForm = new FormArray<VehicleForm>([]);

  public get additionalVehicles(): VehicleForm[] {
    return this.additionalVehiclesForm.controls;
  }

  public readonly guaranteedCoveredSpots = computed(() =>
    this.minAvailability((day) => day.vagasCobertaDisponiveis),
  );

  public readonly guaranteedUncoveredSpots = computed(() =>
    this.minAvailability((day) => day.vagasDescobertaDisponiveis),
  );

  public readonly minDateToday = this.formatDate(new Date());

  public checkAvailability(): void {
    if (this.availabilityForm.invalid) {
      this.errorMessage.set('Preencha as datas de entrada e saída');
      return;
    }

    const periodoErro = this.validarPeriodoFormulario(this.availabilityForm);
    if (periodoErro) {
      this.errorMessage.set(periodoErro);
      return;
    }

    this.errorMessage.set('');
    this.isLoading.set(true);

    const { entryDate, exitDate } = this.availabilityForm.value;

    this.periodService.checkPeriodAvailability(entryDate!, exitDate!).subscribe({
      next: (result) => {
        this.availability.set(result);
        this.isModalVisible.set(true);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message ?? 'Erro ao verificar disponibilidade');
        this.isLoading.set(false);
      },
    });
  }

  public addVehicle(): void {
    this.additionalVehiclesForm.push(this.buildVehicleForm());
  }

  public removeVehicle(index: number): void {
    this.additionalVehiclesForm.removeAt(index);
  }

  public closeModal(): void {
    this.isModalVisible.set(false);
  }

  public continue(): void {
    const { entryDate, entryTime, exitDate, exitTime } = this.availabilityForm.value;

    const periodoErro = this.validarPeriodoFormulario(this.availabilityForm);
    if (periodoErro) {
      this.errorMessage.set(periodoErro);
      this.closeModal();
      return;
    }

    for (const vehicle of this.additionalVehicles) {
      const erroVeiculo = this.validarPeriodoFormulario(vehicle);
      if (erroVeiculo) {
        this.errorMessage.set(`Veículo adicional: ${erroVeiculo}`);
        this.closeModal();
        return;
      }
    }

    if (!entryDate || !entryTime || !exitDate || !exitTime || !this.availability()) return;

    const firstVehicle = this.toCarroEntry(entryDate, entryTime, exitDate, exitTime);

    const additionalVehicles = this.additionalVehicles.map(({ value: v }) =>
      this.toCarroEntry(v.entryDate!, v.entryTime!, v.exitDate!, v.exitTime!),
    );

    this.clientFlow.clientReservationData.update((data) => ({
      ...data,
      dataEntrada: firstVehicle.dataEntrada,
      horaEntrada: firstVehicle.horaEntrada,
      dataSaida: firstVehicle.dataSaida,
      horaSaida: firstVehicle.horaSaida,
      qtdDias: firstVehicle.qtdDias,
      vagasCobertaDisponiveis: this.guaranteedCoveredSpots(),
      vagasDescobertaDisponiveis: this.guaranteedUncoveredSpots(),
      carros: [firstVehicle, ...additionalVehicles],
    }));

    this.clientFlow.save();
    this.closeModal();
    this.router.navigate(['/cliente/reservar']);
  }

  private tomorrow(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }

  private buildVehicleForm(): VehicleForm {
    const { entryDate, entryTime, exitDate, exitTime } = this.availabilityForm.value;
    return new FormGroup({
      entryDate: new FormControl(entryDate ?? this.formatDate(new Date()), Validators.required),
      entryTime: new FormControl(entryTime ?? this.formatTime(new Date()), Validators.required),
      exitDate: new FormControl(exitDate ?? this.formatDate(this.tomorrow()), Validators.required),
      exitTime: new FormControl(exitTime ?? this.formatTime(this.tomorrow()), Validators.required),
    });
  }

  private toCarroEntry(
    entryDate: string,
    entryTime: string,
    exitDate: string,
    exitTime: string,
  ): CarroEntry {
    const entrada = this.parseDateTime(entryDate, entryTime);
    const saida = this.parseDateTime(exitDate, exitTime);
    const qtdDias = this.calcDays(entryDate, entryTime, exitDate, exitTime);

    return {
      dataEntrada: entrada.data,
      horaEntrada: entrada.hora,
      dataSaida: saida.data,
      horaSaida: saida.hora,
      qtdDias,
      tipoVaga: this.guaranteedCoveredSpots() > 0 ? 'Coberta' : 'Descoberta',
      placa: '',
      vagasCobertaDisponiveis: this.guaranteedCoveredSpots(),
      vagasDescobertaDisponiveis: this.guaranteedUncoveredSpots(),
    };
  }

  private minAvailability(selector: (day: PeriodAvailability['dias'][number]) => number): number {
    const dias = this.availability()?.dias;
    if (!dias?.length) return 0;
    return dias.reduce((min, day) => Math.min(min, selector(day)), Infinity);
  }

  private calcDays(entryDate: string, entryTime: string, exitDate: string, exitTime: string): number {
    const entrada = new Date(`${entryDate}T${entryTime}`);
    const saida = new Date(`${exitDate}T${exitTime}`);
    const horas = (saida.getTime() - entrada.getTime()) / 3_600_000;
    if (horas <= 12) return 0;
    return Math.floor(horas / 24) || 1;
  }

  private parseDateTime(date: string, time: string): { data: string; hora: string } {
    if (!date) return { data: '', hora: '' };
    const [year, month, day] = date.split('-');
    return { data: `${day}/${month}/${year}`, hora: time };
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-CA');
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  private validarPeriodoFormulario(form: FormGroup): string | null {
    const entryDate = form.get('entryDate')?.value;
    const entryTime = form.get('entryTime')?.value ?? '00:00';
    const exitDate = form.get('exitDate')?.value;
    const exitTime = form.get('exitTime')?.value ?? '00:00';

    if (!entryDate || !exitDate) return 'Preencha as datas de entrada e saída';

    if (entryDate < this.minDateToday) {
      return 'A data de entrada não pode ser anterior a hoje';
    }

    const entrada = new Date(`${entryDate}T${entryTime}`);
    const saida = new Date(`${exitDate}T${exitTime}`);

    if (saida <= entrada) {
      return 'A data/hora de saída deve ser posterior à data/hora de entrada';
    }

    return null;
  }
}
