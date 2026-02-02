import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Opcion } from '../interfaces/opcion-interface';
import { ejecutarOperacion } from '../shared/http-utils';

@Injectable({
  providedIn: 'root'
})
export class ServicioOpcion{

  private apiUrl = `${environment.apiURL}/Opcion`;

  constructor(private http: HttpClient) {
  }

  obtenerPorPregunta(preguntaId: number): Observable<Opcion[]> {
    return ejecutarOperacion<Opcion[]>(
      this.http,
      `${this.apiUrl}/GetOpcionByPregunta`,
      {
        preguntaId,
        Transaccion: 'OPCIONES_POR_PREGUNTA'
      }
    );
  }

  obtenerPorId(id: number): Observable<Opcion> {
    return ejecutarOperacion<Opcion>(
      this.http,
      `${this.apiUrl}/GetOpcion`,
      {
        id,
        Transaccion: 'OPCION_POR_ID'
      }
    );
  }

  crear(opcion: Opcion): Observable<void> {
    return ejecutarOperacion<void>(
      this.http,
      `${this.apiUrl}/InsertarOpcion`,
      {
        ...opcion,
        Transaccion: 'INSERTAR_OPCION'
      }
    );
  }

  actualizar(opcion: Opcion): Observable<void> {
    return ejecutarOperacion<void>(
      this.http,
      `${this.apiUrl}/ActualizarOpcion`,
      {
        ...opcion,
        Transaccion: 'ACTUALIZAR_OPCION'
      }
    );
  }

  eliminar(id: number): Observable<void> {
    return ejecutarOperacion<void>(
      this.http,
      `${this.apiUrl}/EliminarOpcion`,
      {
        id,
        Transaccion: 'ELIMINAR_OPCION'
      }
    );
  }
}
