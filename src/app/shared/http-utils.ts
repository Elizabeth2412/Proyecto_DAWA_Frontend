import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Resultado } from '../interfaces/Respuesta-interface';

/**
 * Función genérica para ejecutar operaciones POST al backend.
 * @param http Instancia de HttpClient
 * @param url URL completa del endpoint
 * @param body Cuerpo del POST
 * @returns Observable con data tipada
 */
export function ejecutarOperacion<T = any>(http: HttpClient, url: string, body: any): Observable<T> {
  return http.post<Resultado<T>>(url, body).pipe(
    map(res => {
      if (res.respuesta === 'Ok') return res.data as T;
      throw new Error(res.leyenda || 'Error en la operación');
    })
  );
}
