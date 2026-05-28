import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';

export function saidaPosteriorEntradaValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const dataEntrada = group.get('dataEntrada')?.value;
    const horaEntrada = group.get('horaEntrada')?.value;
    const dataSaida = group.get('dataSaida')?.value;
    const horaSaida = group.get('horaSaida')?.value;

    if (!dataEntrada || !horaEntrada || !dataSaida || !horaSaida) return null;

    const entrada = new Date(`${dataEntrada}T${horaEntrada}`);
    const saida = new Date(`${dataSaida}T${horaSaida}`);

    return saida <= entrada ? { saidaAnteriorEntrada: true } : null;
  };
}
