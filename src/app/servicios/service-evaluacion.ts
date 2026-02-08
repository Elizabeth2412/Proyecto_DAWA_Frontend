import { Injectable } from '@angular/core';
import { Evaluacion } from '../interfaces/evaluacion-interface';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../environments/environment.development';
import { ejecutarOperacion } from '../shared/http-utils';
import { Question } from '../question/question';
import { Pregunta } from '../interfaces/pregunta-interface';

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
   * Obtiene la evaluación asociada a un curso específico
   * @param cursoId ID del curso
   * @returns Observable con la evaluación del curso o null si no existe
   */
  obtenerEvaluacionPorCurso(cursoId: number): Observable<Evaluacion | null> {
    return ejecutarOperacion<Evaluacion[]>(
      this.http,
      `${this.baseUrl}/Evaluacion/GetEvaluacionByCurso`,
      { cursoId, Transaccion: 'EVALUACION_POR_CURSO' }
    ).pipe(
      map(evaluaciones => {
        // Retornar la primera evaluación activa encontrada
        if (evaluaciones && evaluaciones.length > 0) {
          const evaluacionActiva = evaluaciones.find(e => e.estado === 'Activa');
          if (evaluacionActiva) {
            return evaluacionActiva;
          }
        }
        console.warn('No se encontró evaluación activa para el curso:', cursoId);
        return null;
      }),
      catchError(error => {
        console.error('Error al obtener evaluación por curso:', error);
        return of(null);
      })
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

  /**
   * Obtiene una evaluación específica con sus preguntas
   * @param evaluacionId ID de la evaluación
   */
  obtenerEvaluacionConPreguntas(evaluacionId: number): Observable<Evaluacion> {
    const body = { id: evaluacionId };
    
    return this.http.post<any>(`${this.baseUrl}/Evaluacion/GetEvaluacionConPreguntas`, body).pipe(
      map(response => {
        
        if (response.respuesta === 'Ok' && response.data) {
          const evalData = response.data;
          
          return {
            id: evalData.id,
            cursoId: evalData.cursoId,
            titulo: evalData.titulo,
            modulo: evalData.modulo,
            totalPreguntas: evalData.totalPreguntas,
            duracion: evalData.duracion,
            fechaCreacion: new Date(evalData.fechaCreacion),
            estado: evalData.estado,
            cursoName: evalData.cursoName,
            preguntas: this.mapearPreguntas(evalData.preguntas || [])
          };
        } else {
          throw new Error(response.leyenda || 'Error al obtener evaluación');
        }
      })
    );
  }

  private mapearPreguntas(preguntasBackend: any[]): Pregunta[] {
    return preguntasBackend.map(pregunta => ({
      id: pregunta.id,
      texto: pregunta.texto,
      opciones: pregunta.opciones?.map((op: any) => op.texto) || []
    }));
  }
}