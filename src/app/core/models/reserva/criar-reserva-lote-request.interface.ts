import {
  CarroLoteRequest,
  CarroPresencialLoteRequest,
} from './carros/carro-lote-request.interface';

export interface CriarReservaLoteOnlineRequest {
  nomeCliente: string;
  telefoneCliente: string;
  cpfCliente?: string;
  carros: CarroLoteRequest[];
}

export interface CriarReservaLotePresencialRequest {
  nomeCliente: string;
  telefoneCliente: string;
  cpfCliente?: string;
  carros: CarroPresencialLoteRequest[];
}
