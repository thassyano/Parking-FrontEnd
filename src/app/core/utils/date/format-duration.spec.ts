import {
  calcularDiariasCobradas,
  formatDuration,
  formatPermanenciaReserva,
} from './format-duration';

describe('formatDuration', () => {
  const entrada = new Date(2026, 9, 17, 16, 1);

  it('descreve dias, horas e minutos', () => {
    expect(formatDuration(entrada, new Date(2026, 9, 20, 15, 25))).toBe(
      '2 dias, 23 horas e 24 minutos',
    );
  });

  it('usa o singular quando o valor é 1', () => {
    expect(formatDuration(entrada, new Date(2026, 9, 18, 17, 2))).toBe(
      '1 dia, 1 hora e 1 minuto',
    );
  });

  it('omite as partes zeradas', () => {
    expect(formatDuration(entrada, new Date(2026, 9, 19, 16, 1))).toBe('2 dias');
    expect(formatDuration(entrada, new Date(2026, 9, 17, 22, 1))).toBe('6 horas');
    expect(formatDuration(entrada, new Date(2026, 9, 18, 16, 31))).toBe('1 dia e 30 minutos');
  });

  it('retorna vazio quando a saída não é posterior à entrada ou a data é inválida', () => {
    expect(formatDuration(entrada, entrada)).toBe('');
    expect(formatDuration(entrada, new Date(2026, 9, 17, 10, 0))).toBe('');
    expect(formatDuration(entrada, new Date(NaN))).toBe('');
  });
});

describe('calcularDiariasCobradas', () => {
  const entrada = new Date(2026, 9, 17, 8, 0);

  it('conta o parcial como diária a partir de 12 horas', () => {
    expect(calcularDiariasCobradas(entrada, new Date(2026, 9, 18, 20, 0))).toBe(2); // 1 dia e 12h
    expect(calcularDiariasCobradas(entrada, new Date(2026, 9, 19, 21, 0))).toBe(3); // 2 dias e 13h
  });

  it('não conta o parcial menor que 12 horas', () => {
    expect(calcularDiariasCobradas(entrada, new Date(2026, 9, 18, 19, 59))).toBe(1); // 1 dia e 11h59
    expect(calcularDiariasCobradas(entrada, new Date(2026, 9, 17, 13, 0))).toBe(0);
  });

  it('retorna 0 para período inválido', () => {
    expect(calcularDiariasCobradas(entrada, entrada)).toBe(0);
    expect(calcularDiariasCobradas(entrada, new Date(NaN))).toBe(0);
  });
});

describe('formatPermanenciaReserva', () => {
  it('descreve a permanência prevista da reserva #46 (antes aparecia só "1")', () => {
    expect(formatPermanenciaReserva('2026-11-05T18:02:00', '2026-11-07T14:00:00')).toBe(
      '1 dia, 19 horas e 58 minutos',
    );
  });

  it('mostra dias e horas quando os minutos são zero', () => {
    expect(formatPermanenciaReserva('2026-11-05T14:00:00', '2026-11-07T13:00:00')).toBe(
      '1 dia e 23 horas',
    );
  });

  it('devolve vazio quando faltam datas ou a saída não é posterior', () => {
    expect(formatPermanenciaReserva(undefined, '2026-11-07T14:00:00')).toBe('');
    expect(formatPermanenciaReserva('2026-11-05T18:02:00', null)).toBe('');
    expect(formatPermanenciaReserva('2026-11-07T14:00:00', '2026-11-05T18:02:00')).toBe('');
  });
});
