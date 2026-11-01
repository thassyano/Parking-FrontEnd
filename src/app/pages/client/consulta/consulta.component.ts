import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LandingButtonComponent } from '../../../components/buttons/landing-button/landing-button.component';
import { CarroEntry } from '../../../core/models/availability/client-flow.model';
import { PeriodAvailability } from '../../../core/models/availability/period-availability.model';
import { PeriodAvailabilityService } from '../../../core/services/availability/period-availability.service';
import { BloqueioService } from '../../../core/services/bloqueio/bloqueio.service';
import { ClientFlowService } from '../../../core/services/client/client-flow.service';
import { calcularDiariasCobradas } from '../../../core/utils/date/format-duration';

@Component({
  selector: 'app-consulta',
  imports: [LandingButtonComponent, ReactiveFormsModule],
  templateUrl: './consulta.component.html',
  styleUrl: './consulta.component.css',
})
export class ConsultaComponent {
  private readonly periodService = inject(PeriodAvailabilityService);
  private readonly bloqueioService = inject(BloqueioService);
  private readonly clientFlow = inject(ClientFlowService);
  private readonly router = inject(Router);

  public readonly isLoading = signal(false);
  public readonly errorMessage = signal('');

  public readonly availabilityForm = new FormGroup({
    entryDate: new FormControl(this.formatDate(new Date()), Validators.required),
    entryTime: new FormControl(this.formatTime(new Date()), Validators.required),
    exitDate: new FormControl(this.formatDate(this.tomorrow()), Validators.required),
    exitTime: new FormControl(this.formatTime(this.tomorrow()), Validators.required),
  });

  public readonly minDateToday = this.formatDate(new Date());

  /**
   * Valida o período, confere bloqueio de reservas online e se há vaga,
   * e segue direto para a tela de dados da reserva (sem pop-up).
   */
  public continue(): void {
    if (this.isLoading()) return;

    if (this.availabilityForm.invalid) {
      this.errorMessage.set('Preencha as datas de entrada e saída');
      return;
    }

    const periodoErro = this.validarPeriodoFormulario();
    if (periodoErro) {
      this.errorMessage.set(periodoErro);
      return;
    }

    const { entryDate, entryTime, exitDate, exitTime } = this.availabilityForm.value;

    this.errorMessage.set('');
    this.isLoading.set(true);

    forkJoin({
      bloqueio: this.bloqueioService.verificar(`${entryDate}T${entryTime}`, `${exitDate}T${exitTime}`),
      availability: this.periodService.checkPeriodAvailability(entryDate!, exitDate!),
    }).subscribe({
      next: ({ bloqueio, availability }) => {
        this.isLoading.set(false);

        if (bloqueio.bloqueado) {
          this.errorMessage.set(
            bloqueio.mensagem ??
              'Reservas online indisponíveis neste período. Entre em contato com o estacionamento.',
          );
          return;
        }

        const coberta = this.minAvailability(availability, (d) => d.vagasCobertaDisponiveis);
        const descoberta = this.minAvailability(availability, (d) => d.vagasDescobertaDisponiveis);

        // Só avisa quando não há vaga nenhuma; não mostramos quantidades.
        if (coberta <= 0 && descoberta <= 0) {
          this.errorMessage.set(
            'Não há vagas disponíveis para este período. Tente outras datas ou fale com o estacionamento.',
          );
          return;
        }

        this.salvarEIr(coberta, descoberta);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message ?? 'Erro ao verificar disponibilidade');
        this.isLoading.set(false);
      },
    });
  }

  private salvarEIr(coberta: number, descoberta: number): void {
    const { entryDate, entryTime, exitDate, exitTime } = this.availabilityForm.value;
    const carro = this.toCarroEntry(entryDate!, entryTime!, exitDate!, exitTime!, coberta, descoberta);

    this.clientFlow.clientReservationData.update((data) => ({
      ...data,
      dataEntrada: carro.dataEntrada,
      horaEntrada: carro.horaEntrada,
      dataSaida: carro.dataSaida,
      horaSaida: carro.horaSaida,
      qtdDias: carro.qtdDias,
      vagasCobertaDisponiveis: coberta,
      vagasDescobertaDisponiveis: descoberta,
      carros: [carro],
    }));

    this.clientFlow.save();
    this.router.navigate(['/cliente/reservar']);
  }

  private tomorrow(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }

  private toCarroEntry(
    entryDate: string,
    entryTime: string,
    exitDate: string,
    exitTime: string,
    coberta: number,
    descoberta: number,
  ): CarroEntry {
    const entrada = this.parseDateTime(entryDate, entryTime);
    const saida = this.parseDateTime(exitDate, exitTime);

    return {
      dataEntrada: entrada.data,
      horaEntrada: entrada.hora,
      dataSaida: saida.data,
      horaSaida: saida.hora,
      qtdDias: calcularDiariasCobradas(
        new Date(`${entryDate}T${entryTime}`),
        new Date(`${exitDate}T${exitTime}`),
      ),
      tipoVaga: coberta > 0 ? 'Coberta' : 'Descoberta',
      placa: '',
      vagasCobertaDisponiveis: coberta,
      vagasDescobertaDisponiveis: descoberta,
    };
  }

  private minAvailability(
    availability: PeriodAvailability,
    selector: (day: PeriodAvailability['dias'][number]) => number,
  ): number {
    const dias = availability.dias;
    if (!dias?.length) return 0;
    return dias.reduce((min, day) => Math.min(min, selector(day)), Infinity);
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

  private validarPeriodoFormulario(): string | null {
    const { entryDate, entryTime, exitDate, exitTime } = this.availabilityForm.value;

    if (!entryDate || !exitDate) return 'Preencha as datas de entrada e saída';

    if (entryDate < this.minDateToday) {
      return 'A data de entrada não pode ser anterior a hoje';
    }

    const entrada = new Date(`${entryDate}T${entryTime ?? '00:00'}`);
    const saida = new Date(`${exitDate}T${exitTime ?? '00:00'}`);

    if (saida <= entrada) {
      return 'A data/hora de saída deve ser posterior à data/hora de entrada';
    }

    return null;
  }
}
