import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { BASE_URL } from '../../../constants/base-url';
import { PeriodAvailability } from '../../models/availability/period-availability.model';

@Injectable({
  providedIn: 'root',
})
export class PeriodAvailabilityService {
  private readonly baseUrl = signal<string>(`${BASE_URL}/Disponibilidade/periodo`);
  private readonly http = inject(HttpClient);

  checkPeriodAvailability(dataInicio: string, dataFim: string): Observable<PeriodAvailability> {
    const params = new HttpParams().set('dataInicio', dataInicio).set('dataFim', dataFim);
    return this.http.get<PeriodAvailability>(this.baseUrl(), { params });
  }
}
