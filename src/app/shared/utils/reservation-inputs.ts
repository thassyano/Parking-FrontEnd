export interface SanitizedInputResult {
  value: string;
  hadInvalidChars: boolean;
}

const nomeRegex = /^[\p{L}\s]+$/u;
const telefoneRegex = /^\(\d{2}\)\s\d{9}$/;
const placaRegex = /^[A-Z0-9]{1,7}$/;

export function sanitizeNomeClienteInput(value: string): SanitizedInputResult {
  const sanitized = value
    .replace(/[^\p{L}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/^\s+/, '');

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

export function isNomeClienteValido(value: string): boolean {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 && nomeRegex.test(normalized);
}

export function isTelefoneValido(value: string): boolean {
  return telefoneRegex.test(value);
}

export function isPlacaValida(value: string): boolean {
  return placaRegex.test(value);
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
