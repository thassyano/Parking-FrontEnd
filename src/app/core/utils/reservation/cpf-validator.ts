import { ValidatorFn, AbstractControl, ValidationErrors } from "@angular/forms";
import { isCpfValid } from "./reservation-utils";

export function cpfValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value ?? '';
    if (!value) return null;
    return isCpfValid(value) ? null : { cpfInvalid: true };
  };
}
