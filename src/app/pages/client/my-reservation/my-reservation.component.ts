import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LandingButtonComponent } from '../../../components/buttons/landing-button/landing-button.component';
import { VeiculoFieldsComponent } from '../../../components/veiculo-fields/veiculo-fields.component';
import { WhatsappEnvioComponent } from '../../../components/whatsapp-envio/whatsapp-envio.component';
import { ReservaClienteResumo } from '../../../core/models/reserva/reserva-cliente.model';
import { WhatsAppResponse } from '../../../core/models/reserva/whats-app-response.model';
import { ReservaService } from '../../../core/services/reserva/reserva.service';
import { WhatsappPendenteService } from '../../../core/services/client/whatsapp-pendente.service';
import { formatPermanenciaReserva } from '../../../core/utils/date/format-duration';

type Etapa = 'busca' | 'lista' | 'edicao' | 'conclusao';

/** "Já tenho uma reserva": o cliente acha a reserva por placa + telefone e ajusta veículo e tipo de vaga. */
@Component({
  selector: 'app-my-reservation',
  imports: [ReactiveFormsModule, DatePipe, LandingButtonComponent, VeiculoFieldsComponent, WhatsappEnvioComponent],
  templateUrl: './my-reservation.component.html',
  styleUrl: './my-reservation.component.css',
})
export class MyReservationComponent {
  private readonly reservaService = inject(ReservaService);
  private readonly pendente = inject(WhatsappPendenteService);
  private readonly router = inject(Router);

  protected readonly etapa = signal<Etapa>('busca');
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly reservas = signal<ReservaClienteResumo[]>([]);
  protected readonly selecionada = signal<ReservaClienteResumo | null>(null);
  protected readonly whatsapp = signal<WhatsAppResponse | null>(null);
  protected readonly semResultado = computed(() => this.etapa() === 'lista' && this.reservas().length === 0);

  protected readonly buscaForm = new FormGroup({
    placa: new FormControl('', [Validators.required, Validators.minLength(7)]),
    telefone: new FormControl('', [Validators.required, Validators.minLength(10)]),
  });

  protected edicaoForm!: FormGroup;

  protected buscar(): void {
    if (this.isLoading()) return;
    if (this.buscaForm.invalid) {
      this.errorMessage.set('Informe a placa do veículo e o telefone usado na reserva');
      return;
    }

    this.errorMessage.set('');
    this.isLoading.set(true);
    const { placa, telefone } = this.buscaForm.getRawValue();

    this.reservaService
      .consultarMinhasReservas({ placaVeiculo: this.normalizarPlaca(placa!), telefoneCliente: telefone! })
      .subscribe({
        next: (lista) => {
          this.isLoading.set(false);
          this.reservas.set(lista);
          this.etapa.set('lista');
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message ?? 'Não foi possível buscar a reserva. Tente novamente.');
        },
      });
  }

  protected escolher(reserva: ReservaClienteResumo): void {
    if (!reserva.podeAlterar) return;

    this.selecionada.set(reserva);
    this.errorMessage.set('');
    this.edicaoForm = new FormGroup({
      marcaVeiculo: new FormControl(reserva.marcaVeiculo ?? '', Validators.required),
      modeloVeiculo: new FormControl(reserva.modeloVeiculo ?? '', Validators.required),
      corVeiculo: new FormControl(reserva.corVeiculo ?? '', Validators.required),
      tipoVaga: new FormControl(reserva.tipoVaga, Validators.required),
    });
    this.etapa.set('edicao');
  }

  protected salvar(): void {
    const reserva = this.selecionada();
    if (!reserva || this.isLoading()) return;
    if (this.edicaoForm.invalid) {
      this.edicaoForm.markAllAsTouched();
      this.errorMessage.set('Preencha marca, modelo e cor do veículo');
      return;
    }

    this.errorMessage.set('');
    this.isLoading.set(true);
    const v = this.edicaoForm.getRawValue();
    const { telefone } = this.buscaForm.getRawValue();

    this.reservaService
      .alterarDadosCliente(reserva.id, {
        placaVeiculo: this.normalizarPlaca(reserva.placaVeiculo),
        telefoneCliente: telefone!,
        marcaVeiculo: v.marcaVeiculo,
        modeloVeiculo: v.modeloVeiculo,
        corVeiculo: v.corVeiculo,
        tipoVaga: v.tipoVaga !== reserva.tipoVaga ? v.tipoVaga : undefined,
      })
      .subscribe({
        next: () => this.enviarParaWhatsApp(reserva.id),
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message ?? 'Não foi possível alterar a reserva.');
        },
      });
  }

  private enviarParaWhatsApp(id: number): void {
    this.reservaService.whatsappAlteracao(id).subscribe({
      next: (dados) => this.concluir(id, dados),
      error: () => this.concluir(id, null),
    });
  }

  private concluir(id: number, dados: WhatsAppResponse | null): void {
    this.isLoading.set(false);
    this.whatsapp.set(dados);
    this.pendente.registrar({ dados, reservaIds: [id], tipo: 'alteracao' });
    this.etapa.set('conclusao');
  }

  protected finalizar(): void {
    this.pendente.limpar();
    this.router.navigate(['/']);
  }

  protected voltar(): void {
    this.errorMessage.set('');
    this.etapa.set(this.etapa() === 'edicao' ? 'lista' : 'busca');
  }

  protected permanencia(r: ReservaClienteResumo): string {
    return formatPermanenciaReserva(r.dataEntrada, r.dataSaidaPrevista);
  }

  private normalizarPlaca(placa: string): string {
    return placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }
}
