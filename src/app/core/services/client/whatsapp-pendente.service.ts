import { Injectable, signal } from '@angular/core';
import { WhatsAppResponse } from '../../models/reserva/whats-app-response.model';

/** Mensagem de reserva/alteração que o cliente ainda precisa ENVIAR pelo WhatsApp. */
export interface WhatsappPendente {
  dados: WhatsAppResponse | null;
  reservaIds: number[];
  /** 'reserva' = reserva nova; 'alteracao' = reserva existente alterada. */
  tipo: 'reserva' | 'alteracao';
  criadoEm: string;
}

const CHAVE = 'client_whatsapp_pendente';
/** Depois disso o aviso some sozinho: a reserva já foi tratada pelo estacionamento por outros meios. */
const VALIDADE_MS = 72 * 60 * 60 * 1000;

/**
 * Guarda no navegador a mensagem de WhatsApp que o cliente ainda não confirmou ter enviado.
 * O link wa.me só abre o WhatsApp com o texto pronto: quem envia é o cliente. Se o navegador bloquear a
 * janela, ou ele fechar a aba antes de enviar, a mensagem nunca chega ao estacionamento. Guardar o que
 * ficou pendente permite oferecer o envio de novo, em vez de a reserva ficar "muda".
 */
@Injectable({ providedIn: 'root' })
export class WhatsappPendenteService {
  public readonly pendente = signal<WhatsappPendente | null>(this.ler());

  public registrar(item: Omit<WhatsappPendente, 'criadoEm'>): void {
    const completo: WhatsappPendente = { ...item, criadoEm: new Date().toISOString() };
    this.pendente.set(completo);
    try {
      localStorage.setItem(CHAVE, JSON.stringify(completo));
    } catch {
      // Sem localStorage (modo privado, cota cheia): o aviso só vale nesta sessão.
    }
  }

  public limpar(): void {
    this.pendente.set(null);
    try {
      localStorage.removeItem(CHAVE);
    } catch {
      // nada a fazer
    }
  }

  private ler(): WhatsappPendente | null {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (!bruto) return null;

      const item = JSON.parse(bruto) as WhatsappPendente;
      const idade = Date.now() - new Date(item.criadoEm).getTime();
      if (!Array.isArray(item.reservaIds) || Number.isNaN(idade) || idade > VALIDADE_MS) {
        localStorage.removeItem(CHAVE);
        return null;
      }
      return item;
    } catch {
      return null;
    }
  }
}
