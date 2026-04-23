import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { BASE_URL } from '../../../constants/base-url';
import { DayAvailability } from '../../models/availability/day-availability.model';

@Injectable({
  providedIn: 'root',
})
export class DayAvailabilityService {
  private readonly baseUrl = signal<string>(`${BASE_URL}/disponibilidade`);
  private http = inject(HttpClient);

  consultarDia(data: string): Observable<DayAvailability> {
    const params = new HttpParams().set('data', data);
    return this.http.get<DayAvailability>(this.baseUrl(), { params });
  }
}
