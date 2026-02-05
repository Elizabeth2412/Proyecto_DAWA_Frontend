import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Resultado } from '../interfaces/Respuesta-interface';
import { environment } from '../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ServicioForos {
    private apiUrl = `${environment.apiURL}/api/Foro`;
  constructor(private http: HttpClient) {}

  /**
   * Lista todos los foros
   */
  listar(): Observable<Resultado> {
    const body = { transaccion: 'CONSULTAR_POSTS' };
    return this.http.post<Resultado>(`${this.apiUrl}/GetPublicacionForo`, body);
  }

  /**
   * Crea un nuevo foro con imagen opcional
   */
  crear(formData: FormData): Observable<Resultado> {
    return this.http.post<Resultado>(`${this.apiUrl}/CrearPost`, formData);
  }

  /**
   * Actualiza un foro existente
   */
  actualizar(formData: FormData): Observable<Resultado> {
    return this.http.post<Resultado>(`${this.apiUrl}/ActualizarPost`, formData);
  }

  /**
   * Elimina un foro (eliminación lógica)
   */
  eliminar(body: any): Observable<Resultado> {
    return this.http.post<Resultado>(`${this.apiUrl}/EliminarPost`, body);
  }

  /**
   * Busca foros por texto
   */
  buscar(textoBusqueda: string): Observable<Resultado> {
    const body = {
      textoBusqueda: textoBusqueda,
      transaccion: 'BUSCAR_POSTS'
    };
    return this.http.post<Resultado>(`${this.apiUrl}/GetPublicacionForo`, body);
  }
}
