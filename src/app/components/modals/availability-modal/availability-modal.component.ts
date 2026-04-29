import { DatePipe } from '@angular/common';
import { Component, computed, input, output, ViewEncapsulation } from '@angular/core';
import { PeriodAvailability } from '../../../core/models/availability/period-availability.model';
import { LandingButtonComponent } from '../../buttons/landing-button/landing-button.component';

@Component({
  selector: 'app-availability-modal',
  imports: [LandingButtonComponent, DatePipe],
  templateUrl: './availability-modal.component.html',
  styleUrl: './availability-modal.component.css',
})
export class AvailabilityModalComponent {
  public data = input.required<PeriodAvailability>();
  public closeOutput = output<void>();
  public continueOutput = output<void>();

  public guaranteedCoveredSpots = computed(() =>
    this.data().dias.reduce(
      (guaranteed, day) => Math.min(guaranteed, day.vagasCobertaDisponiveis),
      Infinity,
    ),
  );

  public guaranteedUncoveredSpots = computed(() =>
    this.data().dias.reduce(
      (unguaranteed, day) => Math.min(unguaranteed, day.vagasDescobertaDisponiveis),
      Infinity,
    ),
  );

  public hasAvailability = computed(
    () => this.guaranteedCoveredSpots() > 0 || this.guaranteedUncoveredSpots() > 0,
  );

  public totalDays = computed(() => this.data().dias.length);

  public emitClose(): void {
    this.closeOutput.emit();
  }

  public emitContinue(): void {
    this.continueOutput.emit();
  }
}
