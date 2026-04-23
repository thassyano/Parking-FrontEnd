import { inject, Injectable, signal } from '@angular/core';
import { ClientFlowInterface } from '../../models/availability/client-flow.model';
import { DEFAULT_CLIENT_FLOW } from '../../../constants/default-client-flow';

@Injectable({
  providedIn: 'root',
})
export class ClientFlowService {
  public clientReservationData = signal<ClientFlowInterface>(DEFAULT_CLIENT_FLOW);

  constructor() {
    const saved = localStorage.getItem('client_flow');
    if (saved) {
      this.clientReservationData.set(JSON.parse(saved));
    }
  }

  save() {
    localStorage.setItem('client_flow', JSON.stringify(this.clientReservationData()));
  }

  resetClienteFlow() {
    this.clientReservationData.set({ ...DEFAULT_CLIENT_FLOW });
    localStorage.removeItem('client_flow');
  }
}
