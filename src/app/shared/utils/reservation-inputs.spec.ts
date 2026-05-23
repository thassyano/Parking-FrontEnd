import {
  isCPFValido,
  normalizeCPFForSubmit,
  sanitizeCPFInput,
} from './reservation-inputs';

describe('reservation-inputs CPF', () => {
  it('deve permitir CPF vazio', () => {
    expect(normalizeCPFForSubmit('')).toBe('');
  });

  it('deve validar CPF valido com mascara', () => {
    expect(isCPFValido('529.982.247-25')).toBeTrue();
  });

  it('deve validar CPF valido sem mascara', () => {
    expect(isCPFValido('52998224725')).toBeTrue();
  });

  it('deve invalidar CPF incompleto', () => {
    expect(isCPFValido('529.982.247-2')).toBeFalse();
  });

  it('deve limpar letras e formatar mascara ao colar CPF', () => {
    const result = sanitizeCPFInput('529a982b247-25');

    expect(result.value).toBe('529.982.247-25');
    expect(normalizeCPFForSubmit(result.value)).toBe('52998224725');
  });

  it('deve invalidar CPF com todos os digitos iguais', () => {
    expect(isCPFValido('11111111111')).toBeFalse();
  });

  it('deve invalidar CPF com digitos verificadores invalidos', () => {
    expect(isCPFValido('52998224724')).toBeFalse();
  });
});
