import { Component, computed, input, output, signal } from '@angular/core';
import { WhatsAppResponse } from '../../core/models/reserva/whats-app-response.model';

/**
 * Passo final do cliente: enviar ao estacionamento a mensagem de WhatsApp já montada.
 * O botão é um link comum, clicado pelo próprio cliente, então nenhum navegador o bloqueia
 * (o `window.open` feito depois de uma chamada à API é bloqueado em vários celulares).
 */
@Component({
  selector: 'app-whatsapp-envio',
  templateUrl: './whatsapp-envio.component.html',
  styleUrl: './whatsapp-envio.component.css',
})
export class WhatsappEnvioComponent {
  public readonly dados = input<WhatsAppResponse | null>(null);
  public readonly reservaIds = input<number[]>([]);
  public readonly titulo = input('Reserva registrada!');
  /** Texto de apoio abaixo do título. */
  public readonly subtitulo = input('Falta só um passo: envie a mensagem para o estacionamento.');
  /** Rótulo do botão que encerra o aviso. */
  public readonly rotuloConcluir = input('Já enviei a mensagem');

  public readonly concluido = output<void>();

  protected readonly copiado = signal(false);

  protected readonly numeros = computed(() => this.reservaIds().map((id) => `#${id}`).join(', '));

  /** "5561995729976" -> "(61) 99572-9976". Qualquer formato fora do esperado volta como veio. */
  protected readonly telefoneExibicao = computed(() => {
    const bruto = this.dados()?.telefoneEstacionamento ?? '';
    const digitos = bruto.replace(/\D/g, '');
    const nacional = digitos.length > 11 && digitos.startsWith('55') ? digitos.slice(2) : digitos;
    if (nacional.length === 11) return `(${nacional.slice(0, 2)}) ${nacional.slice(2, 7)}-${nacional.slice(7)}`;
    if (nacional.length === 10) return `(${nacional.slice(0, 2)}) ${nacional.slice(2, 6)}-${nacional.slice(6)}`;
    return bruto;
  });

  protected async copiarMensagem(): Promise<void> {
    const texto = this.dados()?.mensagem;
    if (!texto) return;

    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      this.copiarPorSelecao(texto);
    }
    this.copiado.set(true);
    setTimeout(() => this.copiado.set(false), 2500);
  }

  /** Alternativa para navegadores sem a Clipboard API (ou em página sem HTTPS). */
  private copiarPorSelecao(texto: string): void {
    const area = document.createElement('textarea');
    area.value = texto;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(area);
    }
  }
}
