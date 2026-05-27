/**
 * Sanitiza o nome do cliente, removendo caracteres que não sejam letras ou espaços.
 */
export function sanitizeClientName(value: string): { value: string; hadInvalidChars: boolean } {
  const sanitized = value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ ]/g, '');
  return {
    value: sanitized,
    hadInvalidChars: sanitized !== value,
  };
}

/**
 * Sanitiza o telefone, permitindo apenas dígitos.
 */
export function sanitizePhone(value: string): { value: string; hadInvalidChars: boolean } {
  const sanitized = value.replace(/\D/g, '');
  return {
    value: sanitized,
    hadInvalidChars: sanitized !== value,
  };
}

/**
 * Sanitiza o CPF, permitindo apenas dígitos, pontos e hífen.
 */
export function sanitizeCpf(value: string): { value: string; hadInvalidChars: boolean } {
  const sanitized = value.replace(/[^\d.\-]/g, '');
  return {
    value: sanitized,
    hadInvalidChars: sanitized !== value,
  };
}

/**
 * Sanitiza a placa do veículo, permitindo apenas letras, números e hífen.
 */
export function sanitizePlate(value: string): { value: string; hadInvalidChars: boolean } {
  const sanitized = value.replace(/[^A-Za-z0-9\-]/g, '').slice(0, 8);
  return {
    value: sanitized.toUpperCase(),
    hadInvalidChars: sanitized.toUpperCase() !== value.toUpperCase(),
  };
}

/**
 * Normaliza o CPF removendo pontuação antes de enviar à API.
 */
export function normalizeCpfForSubmit(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Valida o dígito verificador do CPF.
 */
export function isCpfValid(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calc = (factor: number) => {
    let sum = 0;
    for (let i = 0; i < factor - 1; i++) {
      sum += parseInt(digits[i]) * (factor - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 || remainder === 11 ? 0 : remainder;
  };

  return calc(10) === parseInt(digits[9]) && calc(11) === parseInt(digits[10]);
}
