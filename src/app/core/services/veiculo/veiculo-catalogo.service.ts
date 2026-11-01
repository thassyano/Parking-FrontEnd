import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { environment } from '../../environment';
import { ItemCatalogo } from '../../models/veiculo/veiculo-catalogo.model';

/** Listas de marca, modelo e cor para os dropdowns. Falhas viram lista vazia (a tela aceita digitação livre). */
@Injectable({ providedIn: 'root' })
export class VeiculoCatalogoService {
  private readonly url = `${environment.apiUrl}/veiculos`;
  private readonly http = inject(HttpClient);

  public marcas(): Observable<ItemCatalogo[]> {
    return this.http.get<ItemCatalogo[]>(`${this.url}/marcas`).pipe(catchError(() => of([])));
  }

  public modelos(codigoMarca: string): Observable<ItemCatalogo[]> {
    return this.http
      .get<ItemCatalogo[]>(`${this.url}/marcas/${encodeURIComponent(codigoMarca)}/modelos`)
      .pipe(catchError(() => of([])));
  }

  public cores(): Observable<string[]> {
    return this.http.get<string[]>(`${this.url}/cores`).pipe(catchError(() => of([])));
  }
}
