export const Patterns = {
  phone: /^(?:[1-9][0-9])(?:9\d{8}|[2-8]\d{7})$/,
  vehiclePlate: /^(?:[A-Z]{3}-?[0-9]{4}|[A-Z]{3}[0-9][A-Z][0-9]{2})$/i,
  cpf: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,
  clientName: /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?: [A-Za-zÀ-ÖØ-öø-ÿ]+)*$/,
};
