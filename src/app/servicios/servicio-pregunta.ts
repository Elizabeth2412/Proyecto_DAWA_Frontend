import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Pregunta } from '../interfaces/pregunta-interface';
import { ejecutarOperacion } from '../shared/http-utils';

@Injectable({
  providedIn: 'root'
})
export class ServicioPregunta{

  private apiUrl = `${environment.apiURL}/Pregunta`;

  constructor(private http: HttpClient) {}

  obtenerTodas(): Observable<Pregunta[]> {
    return ejecutarOperacion<Pregunta[]>(
        this.http,
      `${this.apiUrl}/GetPreguntas`,
      { Transaccion: 'CONSULTAR_PREGUNTAS' }
    );
  }

  obtenerPorEvaluacion(evaluacionId: number): Observable<Pregunta[]> {
    return ejecutarOperacion<Pregunta[]>(
        this.http,
      `${this.apiUrl}/GetPreguntasPorEvaluacion`,
      {
        evaluacionId,
        Transaccion: 'PREGUNTAS_POR_EVALUACION'
      }
    );
  }

  obtenerPorId(id: number): Observable<Pregunta> {
    return ejecutarOperacion<Pregunta>(
        this.http,
      `${this.apiUrl}/GetPreguntaById`,
      {
        id,
        Transaccion: 'PREGUNTA_POR_ID'
      }
    );
  }

  crear(pregunta: Pregunta): Observable<void> {
    return ejecutarOperacion<void>(
        this.http,
      `${this.apiUrl}/InsertarPregunta`,
      {
        ...pregunta,
        Transaccion: 'INSERTAR_PREGUNTA'
      }
    );
  }

  actualizar(pregunta: Pregunta): Observable<void> {
    return ejecutarOperacion<void>(
        this.http,
      `${this.apiUrl}/ActualizarPregunta`,
      {
        ...pregunta,
        Transaccion: 'ACTUALIZAR_PREGUNTA'
      }
    );
  }

  eliminar(id: number): Observable<void> {
        
    return ejecutarOperacion<void>(
        this.http,
      `${this.apiUrl}/EliminarPregunta`,
      {
        id,
        Transaccion: 'ELIMINAR_PREGUNTA'
      }
    );
  }
}
