export interface SanitizedInputResult {
  value: string;
  hadInvalidChars: boolean;
}

export const NOME_CLIENTE_MINIMO = 2;
export const NOME_CLIENTE_MAXIMO = 200;

const nomeRegex = /^[\p{L}\s]+$/u;
const telefoneRegex = /^\(\d{2}\)\s\d{9}$/;
const placaRegex = /^[A-Z0-9]{1,7}$/;
const cpfRegex = /^\d{11}$/;

export function sanitizeNomeClienteInput(value: string): SanitizedInputResult {
  const sanitized = value
    .replace(/[^\p{L}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/^\s+/, '')
    .slice(0, NOME_CLIENTE_MAXIMO);

  return {
    value: sanitized,
    hadInvalidChars: sanitized !== value,
  };
}

export function sanitizeTelefoneInput(value: string): SanitizedInputResult {
  const digitos = value.replace(/\D/g, '').slice(0, 11);
  let formatted = '';

  if (digitos.length > 0) {
    formatted = `(${digitos.slice(0, 2)}`;
  }

  if (digitos.length >= 3) {
    formatted += `) ${digitos.slice(2)}`;
  }

  return {
    value: formatted,
    hadInvalidChars: value.replace(/[()\s]/g, '') !== digitos,
  };
}

export function sanitizePlacaInput(value: string): SanitizedInputResult {
  const sanitized = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 7);

  return {
    value: sanitized,
    hadInvalidChars: sanitized !== value.toUpperCase(),
  };
}

export function sanitizeCPFInput(value: string): SanitizedInputResult {
  const digitos = value.replace(/\D/g, '').slice(0, 11);
  let formatted = '';

  if (digitos.length > 0) {
    formatted = digitos.slice(0, 3);
  }

  if (digitos.length >= 4) {
    formatted += `.${digitos.slice(3, 6)}`;
  }

  if (digitos.length >= 7) {
    formatted += `.${digitos.slice(6, 9)}`;
  }

  if (digitos.length >= 10) {
    formatted += `-${digitos.slice(9, 11)}`;
  }

  return {
    value: formatted,
    hadInvalidChars: value.replace(/[.\-]/g, '') !== digitos,
  };
}

export function isNomeClienteValido(value: string): boolean {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return (
    normalized.length >= NOME_CLIENTE_MINIMO
    && normalized.length <= NOME_CLIENTE_MAXIMO
    && nomeRegex.test(normalized)
  );
}

export function isTelefoneValido(value: string): boolean {
  return telefoneRegex.test(value);
}

export function isPlacaValida(value: string): boolean {
  return placaRegex.test(value);
}

export function normalizeCPFForSubmit(value: string): string {
  return value.replace(/\D/g, '');
}

export function isCPFValido(value: string): boolean {
  const cpf = normalizeCPFForSubmit(value);

  if (!cpfRegex.test(cpf)) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const digitos = cpf.split('').map(Number);

  const primeiroDigito = calcularDigitoCPF(digitos.slice(0, 9), 10);
  const segundoDigito = calcularDigitoCPF(digitos.slice(0, 10), 11);

  return primeiroDigito === digitos[9] && segundoDigito === digitos[10];
}

function calcularDigitoCPF(digitos: number[], pesoInicial: number): number {
  const soma = digitos.reduce((acc, digito, index) => acc + digito * (pesoInicial - index), 0);
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

export function extractApiError(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null) {
    return fallback;
  }

  const httpError = error as {
    error?: {
      message?: string;
      errors?: Record<string, string[]>;
      title?: string;
    };
  };

  if (httpError.error?.message) {
    return httpError.error.message;
  }

  if (httpError.error?.errors) {
    const primeiraLista = Object.values(httpError.error.errors).find(
      (mensagens) => Array.isArray(mensagens) && mensagens.length > 0,
    );

    if (primeiraLista?.length) {
      return primeiraLista[0];
    }
  }

  if (httpError.error?.title) {
    return httpError.error.title;
  }

  return fallback;
}
