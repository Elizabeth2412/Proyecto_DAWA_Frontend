// src/app/servicios/servicio-cursos.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { Curso } from '../interfaces/curso-interface';
import { Archivo } from '../interfaces/archivo-interface';
import { environment } from '../environments/environment.development';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {  of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ServicioCursos {
  private baseUrl = environment.apiURL;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los cursos desde el backend
   */
obtenerTodosLosCursos(): Observable<Curso[]> {
  const cursoData = {
    Transaccion: 'LISTAR_CURSOS',
  };

  return this.http.post<any>(`${this.baseUrl}/Curso/GetCurso`, cursoData).pipe(
    map(response => {
      const respuesta = response.respuesta || response.Respuesta;
      const data = response.data || response.Data;
      
      if (respuesta === 'Ok' && Array.isArray(data) && data.length > 0) {
        // Obtener cursos
        const cursos = data.map((curso: any) => ({
          id: curso.id || curso.Id || 0,
          titulo: curso.titulo || curso.Titulo || 'Sin título',
          descripcion: curso.descripcion || curso.Descripcion || '',
          nivel: curso.nivel || curso.Nivel || 'Principiante',
          duracion: curso.duracion || curso.Duracion || 1,
          archivos: [], // Se llenará con una segunda llamada
          progreso: 0,
          instructor: curso.instructor || curso.Instructor || 'Instructor no asignado',
          fechaCreacion: new Date(curso.fechaCreacion || curso.FechaCreacion || new Date()),
          fechaActualizacion: new Date(curso.fechaActualizacion || curso.FechaActualizacion || new Date())
        })) as Curso[];
        
        // Para cada curso, obtener sus archivos
        return forkJoin(
          cursos.map(curso => 
            this.obtenerArchivosDeCurso(curso.id).pipe(
              map(archivos => {
                curso.archivos = archivos;
                return curso;
              })
            )
          )
        );
      }
      return of([]);
    }),
    switchMap(cursosObservable => cursosObservable),
    catchError(error => {
      console.error('Error al obtener cursos:', error);
      return throwError(() => new Error(error.message || 'Error al cargar cursos'));
    })
  );
}
  /**
   * Obtiene los archivos de un curso específico
   */
  obtenerArchivosDeCurso(cursoId: number): Observable<Archivo[]> {
    const cursoArchivoData = {
      CursoId: cursoId,
      Transaccion: 'ARCHIVOS_POR_CURSO'
    };

    return this.http.post<any>(`${this.baseUrl}/CursoArchivo/GetArchivosPorCurso`, cursoArchivoData).pipe(
      map(response => {
        const respuesta = response.respuesta || response.Respuesta;
        const data = response.data || response.Data;
        
        if (respuesta === 'Ok' && Array.isArray(data)) {
          return data.map((archivo: any) => ({
            id: archivo.id || archivo.Id || 0,
            nombre: archivo.nombre || archivo.Nombre || '',
            tipo: archivo.tipo || archivo.Tipo || 'PDF',
            tamano: archivo.tamano || archivo.Tamano || 0,
            fechaSubida: new Date(archivo.fechaSubida || archivo.FechaSubida || new Date()),
            descripcion: archivo.descripcion || archivo.Descripcion || '',
            usuario: archivo.usuario || archivo.Usuario || '',
            estado: archivo.estado || archivo.Estado || 'Disponible'
          })) as Archivo[];
        }
        return [];
      })
    );
  }
  /**
   * Obtiene un curso por ID desde el backend
   */
  obtenerCursoPorId(id: number): Observable<Curso | null> {
    return this.obtenerTodosLosCursos().pipe(
      map(cursos => cursos.find(curso => curso.id === id) || null)
    );
  }

  /**
   * Inserta un nuevo curso en el backend
   */
  insertarCursoBackend(cursoData: any): Observable<any> {
    const curso = {
      ...cursoData,
      Transaccion: 'INSERTAR_CURSO'
    };
    
    return this.http.post(`${this.baseUrl}/Curso/InsertarCurso`, curso);
  }

  /**
   * Actualiza un curso existente en el backend
   */
  actualizarCursoBackend(cursoData: any): Observable<any> {
    const curso = {
      ...cursoData,
      Transaccion: 'ACTUALIZAR_CURSO'
    };
    
    return this.http.post(`${this.baseUrl}/Curso/ActualizarCurso`, curso);
  }

  /**
   * Elimina un curso del backend
   */
  eliminarCursoBackend(id: number): Observable<any> {
    const curso = {
      Id: id,
      Transaccion: 'ELIMINAR_CURSO'
    };
    
    return this.http.post(`${this.baseUrl}/Curso/EliminarCurso`, curso);
  }

  /**
   * Obtiene cursos por instructor desde backend
   */
  obtenerCursosPorInstructor(emailInstructor: string): Observable<Curso[]> {
    return this.obtenerTodosLosCursos().pipe(
      map(cursos => cursos.filter(curso => curso.instructor === emailInstructor))
    );
  }

  /**
   * Métodos de compatibilidad - ahora llaman al backend
   */

  /**
   * Obtiene todos los cursos (compatibilidad)
   * @deprecated Usar obtenerTodosLosCursos() en su lugar
   */
  obtenerCursos(): Observable<Curso[]> {
    return this.obtenerTodosLosCursos();
  }

  /**
   * Agrega un curso (llama al backend)
   */
  agregarCurso(curso: Curso): Observable<any> {
    const cursoData = {
      Titulo: curso.titulo,
      Descripcion: curso.descripcion,
      Nivel: curso.nivel,
      Duracion: curso.duracion,
      Instructor: curso.instructor,
      Transaccion: 'INSERTAR_CURSO'
    };

    return this.insertarCursoBackend(cursoData);
  }

  /**
   * Actualiza un curso (llama al backend)
   */
  actualizarCurso(cursoActualizado: Curso): Observable<any> {
    const cursoData = {
      Id: cursoActualizado.id,
      Titulo: cursoActualizado.titulo,
      Descripcion: cursoActualizado.descripcion,
      Nivel: cursoActualizado.nivel,
      Duracion: cursoActualizado.duracion,
      Transaccion: 'ACTUALIZAR_CURSO'
    };

    return this.actualizarCursoBackend(cursoData);
  }

  /**
   * Elimina un curso (llama al backend)
   */
  eliminarCurso(id: number): Observable<any> {
    return this.eliminarCursoBackend(id);
  }

  /**
   * Prepara un curso para edición
   */
  prepararEdicionCurso(curso: Curso): Curso {
    const cursoEditando = { ...curso };
    if (!cursoEditando.nivel) cursoEditando.nivel = 'Principiante';
    if (!cursoEditando.duracion) cursoEditando.duracion = 1;
    return cursoEditando;
  }

  /**
   * Valida un curso antes de guardarlo
   */
  validarCurso(curso: Curso): { valido: boolean; mensaje: string } {
    if (!curso.titulo || !curso.titulo.trim()) {
      return { valido: false, mensaje: 'Por favor, ingresa un título para el curso.' };
    }
    if (!curso.descripcion || !curso.descripcion.trim()) {
      return { valido: false, mensaje: 'Por favor, ingresa una descripción para el curso.' };
    }
    if (!curso.nivel || !curso.nivel.trim()) {
      return { valido: false, mensaje: 'Por favor, selecciona un nivel para el curso.' };
    }
    if (!curso.duracion || curso.duracion < 1) {
      return { valido: false, mensaje: 'Por favor, ingresa una duración válida (mínimo 1 hora).' };
    }
    return { valido: true, mensaje: '' };
  }

  /**
   * Obtiene el número total de cursos
   */
  obtenerTotalCursos(): Observable<number> {
    return this.obtenerTodosLosCursos().pipe(
      map(cursos => cursos.length)
    );
  }
  /**
   * Elimina archivo de un curso
   */
  eliminarArchivoDeCurso(cursoId: number, archivoId: number): Observable<any> {
    const cursoArchivoData = {
      CursoId: cursoId,
      ArchivoId: archivoId,
      Transaccion: 'ELIMINAR_ARCHIVO_CURSO'
    };

    return this.http.post(`${this.baseUrl}/CursoArchivo/EliminarArchivoDeCurso`, cursoArchivoData);
  }

  /**
   * Agrega archivo a un curso
   */
 agregarArchivoACurso(cursoId: number, archivoId: number): Observable<any> {
    const cursoArchivoData = {
      CursoId: cursoId,
      ArchivoId: archivoId,
      Transaccion: 'AGREGAR_ARCHIVO_CURSO'
    };

    return this.http.post(`${this.baseUrl}/CursoArchivo/AgregarArchivoACurso`, cursoArchivoData);
  }  

  /**
   * Actualiza archivo en un curso
   */
  actualizarArchivoEnCurso(idCurso: number, archivoActualizada: Archivo): void {
  this.obtenerCursos().subscribe((cursos: Curso[]) => {
    const curso = cursos.find((c: Curso) => c.id === idCurso);
    if (!curso) return;

    const indice = curso.archivos.findIndex(
      (d: Archivo) => d.id === archivoActualizada.id
    );

    if (indice !== -1) {
      curso.archivos[indice] = archivoActualizada;
      curso.fechaActualizacion = new Date();
      this.actualizarCursoBackend(curso).subscribe();
    }
  });
}
 subirArchivoACurso(cursoId: number, archivo: File, descripcion: string, usuario: string): Observable<any> {
  return new Observable(observer => {
    // Primero subir el archivo
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('descripcion', descripcion);
    formData.append('usuario', usuario);
    formData.append('Transaccion', 'INSERTAR_ARCHIVO'); 

    this.http.post(`${this.baseUrl}/Archivo/SetArchivo`, formData).subscribe({
      next: (response: any) => {
        console.log('Respuesta de subida de archivo:', response);
        const respuesta = response.respuesta || response.Respuesta;
        const leyenda = response.leyenda || response.Leyenda;
        
        if (respuesta === 'Ok') {
          // Obtener el ID del archivo subido
          const archivoId = response.Data?.id || response.data?.id;
          
          if (archivoId) {
            console.log('Archivo subido con ID:', archivoId);
            
            // Ahora asociar el archivo al curso usando el SP SetCursoArchivo
            const cursoArchivoData = {
              CursoId: cursoId,
              ArchivoId: archivoId,
              Transaccion: 'AGREGAR_ARCHIVO_CURSO'
            };

            // Crear XML para el SP
            const xml = this.crearXMLParaSP(cursoArchivoData);
            const body = {
              iTransaccion: 'AGREGAR_ARCHIVO_CURSO',
              iXML: xml
            };

            this.http.post(`${this.baseUrl}/CursoArchivo/SetCursoArchivo`, body).subscribe({
              next: (relacionResponse: any) => {
                console.log('Respuesta de asociación:', relacionResponse);
                const relacionRespuesta = relacionResponse.respuesta || relacionResponse.Respuesta;
                const relacionLeyenda = relacionResponse.leyenda || relacionResponse.Leyenda;

                if (relacionRespuesta === 'Ok') {
                  observer.next({
                    respuesta: 'Ok',
                    leyenda: 'Archivo subido y asociado al curso correctamente',
                    data: response.data
                  });
                  observer.complete();
                } else {
                  observer.error(new Error(relacionLeyenda || 'Error al asociar archivo al curso'));
                }
              },
              error: (relacionError) => {
                console.error('Error al asociar archivo:', relacionError);
                observer.error(new Error('Archivo subido pero error al asociar al curso: ' + relacionError.message));
              }
            });
          } else {
            console.error('No se pudo obtener el ID del archivo subido');
            observer.error(new Error('Archivo subido pero no se pudo obtener su ID'));
          }
        } else {
          observer.error(new Error(leyenda || 'Error al subir archivo'));
        }
      },
      error: (error) => {
        console.error('Error en subida de archivo:', error);
        observer.error(error);
      }
    });
  });
}

// Método auxiliar para crear XML
private crearXMLParaSP(data: any): string {
  return `<CursoArchivo>
    <CursoId>${data.CursoId}</CursoId>
    <ArchivoId>${data.ArchivoId}</ArchivoId>
  </CursoArchivo>`;
}
  /**
   * Obtiene cursos filtrados por nivel
   */
  obtenerCursosPorNivel(nivel: string): Observable<Curso[]> {
    return this.obtenerTodosLosCursos().pipe(
      map(cursos => cursos.filter(curso => curso.nivel === nivel))
    );
  }
}