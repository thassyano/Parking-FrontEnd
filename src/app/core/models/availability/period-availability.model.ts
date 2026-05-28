import { DayAvailability } from "./day-availability.model";

export interface PeriodAvailability {
  dataInicio: string;
  dataFim: string;
  dias: DayAvailability[];
}
