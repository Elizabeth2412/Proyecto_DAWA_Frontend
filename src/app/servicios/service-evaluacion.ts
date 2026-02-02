import { Injectable } from '@angular/core';
import { Evaluacion } from '../interfaces/evaluacion-interface';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../environments/environment.development';
import { ejecutarOperacion } from '../shared/http-utils';

@Injectable({
  providedIn: 'root',
})
export class ServiceEvaluacion {
  
  evaluaciones: Evaluacion[] = [];
  private baseUrl = environment.apiURL;

  constructor(private http: HttpClient,) {}

  /**
   * Obtiene todas las evaluaciones registradas en la base de datos
   * @returns Observable con la lista de evaluaciones
   */

  obtenerEvaluaciones(): Observable<Evaluacion[]> {
    return ejecutarOperacion<Evaluacion[]>(
      this.http,
      `${this.baseUrl}/Evaluacion/GetEvaluacion`,
      { Transaccion: 'CONSULTAR_EVALUACION' }
    );
  }

  /**
   * Filtra las evaluaciones según el término de búsqueda y el estado.
   * @param terminoBusqueda  Término de búsqueda para filtrar por título o módulo.
   * @param filtroEstado  Estado de evaluación a filtrar ('Activa' o 'Inactiva').
   * @returns Lista de evaluaciones filtradas.
   */
  
  filtrarEvaluaciones(titulo: string, estado: string = ''): Observable<Evaluacion[]> {
    return ejecutarOperacion<Evaluacion[]>(
      this.http,
      `${this.baseUrl}/Evaluacion/GetEvaluacionByNombre`,
      { titulo, estado, Transaccion: 'BUSCAR_EVALUACION' }
    );
  }


  /**
   * Crea una nueva evaluación.
   * @param evaluacion  Evaluación a crear.
   */
  crearEvaluacion(evaluacion: Evaluacion): Observable<void> {
    return ejecutarOperacion<void>(
      this.http,
      `${this.baseUrl}/Evaluacion/InsertarEvaluacion`,
      { ...evaluacion, transaccion: 'INSERTAR_EVALUACION' }
    );
  }


  /**
   * Actualiza una evaluación existente.
   * @param evaluacion  Evaluación a actualizar.
   */
  actualizarEvaluacion(evaluacion: Evaluacion): Observable<void> {
    return ejecutarOperacion<void>(
      this.http,
      `${this.baseUrl}/Evaluacion/ActualizarEvaluacion`,
      { ...evaluacion, Transaccion: 'ACTUALIZAR_EVALUACION' }
    );
  }


  /**
   * Elimina una evaluación existente.
   * @param id  ID de la evaluación a eliminar.
   * @returns true si se eliminó correctamente, false en caso contrario.
   */
   eliminarEvaluacion(id: number): Observable<void> {
    return ejecutarOperacion<void>(
      this.http,
      `${this.baseUrl}/Evaluacion/EliminarEvaluacion`,
      { id, Transaccion: 'ELIMINAR_EVALUACION' }
    );
  }
}