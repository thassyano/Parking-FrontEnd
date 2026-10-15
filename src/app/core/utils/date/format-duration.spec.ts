import { formatDuration } from './format-duration';

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
