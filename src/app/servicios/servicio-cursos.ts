// src/app/servicios/servicio-cursos.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Curso } from '../interfaces/curso-interface';
import { Archivo } from '../interfaces/archivo-interface';
import { environment } from '../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ServicioCursos {
  private baseUrl = environment.apiURL;
  private readonly claveCursos = 'cursosAgropetech';

  constructor(private http: HttpClient) {
    //   this.inicializarDatos();
  }

  /**
   * Inicializa los datos de cursos en el almacenamiento local si no existen
   
  private inicializarDatos(): void {
    if (!localStorage.getItem(this.claveCursos)) {
      const cursosIniciales: Curso[] = [
        {
          id: 1,
          titulo: 'Introduccion agroindustria pecuaria sostenible',
          descripcion: 'Conceptos básicos de agroindustria pecuaria sostenible y prácticas ecológicas.',
          nivel: 'Principiante',
          duracion: 5,
          archivos: [
            {
              id: 1,
              nombre: 'Introducción',
              tipo: 'PDF',
              tamano: 1024000,
              fechaSubida: new Date('2024-01-01'),
              descripcion: 'Archivo de introducción al curso',
              usuario: 'leslie@gmail.com',
              estado: 'Disponible',
              archivoId: 'intro_001'
            }
          ],
          progreso: 66,
          instructor: 'leslie@gmail.com',
          fechaCreacion: new Date('2024-01-01'),
          fechaActualizacion: new Date('2024-01-01'),
          estado: 'A'
        }
      ];
      this.guardarCursosLocal(cursosIniciales);
    }
  }
*/
  /**
   * Obtiene todos los cursos del backend
   * @returns Promise con la lista de cursos
   */
  obtenerTodosLosCursos(): Promise<Curso[]> {
    return new Promise((resolve, reject) => {
      this.obtenerCursosBackend()
        .then((response: any) => {
          if (response.Respuesta === 'Ok' && response.Data) {
            const cursos = response.Data.map((curso: any) => ({
              id: curso.id,
              titulo: curso.titulo,
              descripcion: curso.descripcion,
              nivel: curso.nivel || 'Principiante',
              duracion: curso.duracion || 1,
              archivos: Array.isArray(curso.archivos)
                ? curso.archivos.map((archivo: any) => ({
                    ...archivo,
                    fechaSubida: new Date(archivo.fechaSubida || new Date()),
                  }))
                : [],
              progreso: curso.progreso || 0,
              instructor: curso.instructor,
              fechaCreacion: new Date(curso.fechaCreacion || new Date()),
              fechaActualizacion: new Date(curso.fechaActualizacion || new Date()),
              estado: curso.estado || 'A',
            }));
            resolve(cursos);
          } else {
            reject(new Error(response.Leyenda || 'Error al obtener cursos'));
          }
        })
        .catch(reject);
    });
  }

  /**
   * Obtiene cursos desde el backend
   * @returns Promise con la respuesta del backend
   */
  obtenerCursosBackend(): Promise<any> {
    return new Promise((resolve, reject) => {
      const cursoData = {
        Transaccion: 'LISTAR_CURSOS',
      };

      console.log('Obteniendo cursos desde:', `${this.baseUrl}/Curso/SetCurso`);

      this.http.post(`${this.baseUrl}/Curso/SetCurso`, cursoData).subscribe({
        next: (response: any) => {
          console.log('Respuesta de obtener cursos:', response);

          // El backend devuelve 'respuesta' (minúscula) o 'Respuesta' (mayúscula)
          const respuesta = response.respuesta || response.Respuesta;
          const leyenda = response.leyenda || response.Leyenda;
          const data = response.data || response.Data;

          if (response && respuesta === 'Ok') {
            resolve({
              Respuesta: 'Ok',
              Leyenda: leyenda,
              Data: data || [],
            });
          } else {
            reject(new Error(leyenda || 'Error al obtener cursos'));
          }
        },
        error: (error) => {
          console.error('Error HTTP al obtener cursos:', error);
          reject(new Error(`Error de conexión: ${error.message}`));
        },
      });
    });
  }

  /**
   * Inserta un nuevo curso en el backend
   * @param curso datos del curso a insertar
   * @returns Promise con la respuesta del backend
   */
  insertarCursoBackend(
    curso: Omit<Curso, 'id' | 'fechaCreacion' | 'fechaActualizacion'>,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const xml = `
        <Curso>
          <Titulo>${curso.titulo}</Titulo>
          <Descripcion>${curso.descripcion}</Descripcion>
          <Nivel>${curso.nivel}</Nivel>
          <Duracion>${curso.duracion}</Duracion>
          <Instructor>${curso.instructor}</Instructor>
        </Curso>
      `;

      const cursoData = {
        Transaccion: 'INSERTAR_CURSO',
        iXML: xml,
      };

      console.log('Enviando curso al backend:', cursoData);

      this.http.post(`${this.baseUrl}/Curso/SetCurso`, cursoData).subscribe({
        next: (response: any) => {
          console.log('Respuesta completa del servidor:', response);

          const respuesta = response.respuesta || response.Respuesta;
          const leyenda = response.leyenda || response.Leyenda;

          if (respuesta === 'Ok') {
            resolve({
              Respuesta: 'Ok',
              Leyenda: leyenda,
              Data: response.data || response.Data,
            });
          } else {
            reject(new Error(leyenda || 'Error al insertar curso'));
          }
        },
        error: (error) => {
          console.error('Error HTTP detallado:', error);

          if (error.status === 0) {
            reject(
              new Error(
                'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.',
              ),
            );
          } else {
            reject(new Error(`Error ${error.status}: ${error.message}`));
          }
        },
      });
    });
  }

  /**
   * Actualiza un curso existente en el backend
   * @param curso datos del curso a actualizar
   * @returns Promise con la respuesta del backend
   */
  actualizarCursoBackend(curso: Curso): Promise<any> {
    return new Promise((resolve, reject) => {
      const xml = `
        <Curso>
          <Id>${curso.id}</Id>
          <Titulo>${curso.titulo}</Titulo>
          <Descripcion>${curso.descripcion}</Descripcion>
          <Nivel>${curso.nivel}</Nivel>
          <Duracion>${curso.duracion}</Duracion>
        </Curso>
      `;

      const cursoData = {
        Transaccion: 'ACTUALIZAR_CURSO',
        iXML: xml,
      };

      console.log('Actualizando curso en backend:', cursoData);

      this.http.post(`${this.baseUrl}/Curso/SetCurso`, cursoData).subscribe({
        next: (response: any) => {
          console.log('Respuesta completa del servidor:', response);

          const respuesta = response.respuesta || response.Respuesta;
          const leyenda = response.leyenda || response.Leyenda;

          if (respuesta === 'Ok') {
            resolve({
              Respuesta: 'Ok',
              Leyenda: leyenda,
              Data: response.data || response.Data,
            });
          } else {
            reject(new Error(leyenda || 'Error al actualizar curso'));
          }
        },
        error: (error) => {
          console.error('Error HTTP detallado:', error);
          reject(new Error(`Error ${error.status}: ${error.message}`));
        },
      });
    });
  }

  /**
   * Elimina un curso en el backend
   * @param id ID del curso a eliminar
   * @returns Promise con la respuesta del backend
   */
  eliminarCursoBackend(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const xml = `<Curso><Id>${id}</Id></Curso>`;

      const cursoData = {
        Transaccion: 'ELIMINAR_CURSO',
        iXML: xml,
      };

      console.log('Eliminando curso en backend:', cursoData);

      this.http.post(`${this.baseUrl}/Curso/SetCurso`, cursoData).subscribe({
        next: (response: any) => {
          console.log('Respuesta completa del servidor:', response);

          const respuesta = response.respuesta || response.Respuesta;
          const leyenda = response.leyenda || response.Leyenda;

          if (respuesta === 'Ok') {
            resolve({
              Respuesta: 'Ok',
              Leyenda: leyenda,
              Data: response.data || response.Data,
            });
          } else {
            reject(new Error(leyenda || 'Error al eliminar curso'));
          }
        },
        error: (error) => {
          console.error('Error HTTP detallado:', error);
          reject(new Error(`Error ${error.status}: ${error.message}`));
        },
      });
    });
  }

  /**
   * Obtiene todos los cursos (compatibilidad - local)
   */
  obtenerCursos(): Curso[] {
    const cursosAlmacenamiento = localStorage.getItem(this.claveCursos);
    if (!cursosAlmacenamiento) return [];

    const cursos = JSON.parse(cursosAlmacenamiento);
    if (!Array.isArray(cursos)) return [];

    return cursos.map((curso: any) => ({
      ...curso,
      fechaCreacion: new Date(curso.fechaCreacion),
      fechaActualizacion: new Date(curso.fechaActualizacion),
      archivos: Array.isArray(curso.archivos)
        ? curso.archivos.map((archivo: any) => ({
            ...archivo,
            fechaSubida: new Date(archivo.fechaSubida),
          }))
        : [],
    }));
  }

  /**
   * Guarda cursos en almacenamiento local
   */
  private guardarCursosLocal(cursos: Curso[]): void {
    try {
      localStorage.setItem(this.claveCursos, JSON.stringify(cursos));
    } catch (error) {
      console.error('Error al guardar cursos:', error);
      throw new Error('No fue posible guardar la información localmente.');
    }
  }

  /**
   * Agrega un curso (local)
   */
  agregarCurso(curso: Curso): void {
    const cursos = this.obtenerCursos();
    curso.id = this.generarIdUnico(cursos);
    curso.fechaCreacion = new Date();
    curso.fechaActualizacion = new Date();
    cursos.push(curso);
    this.guardarCursosLocal(cursos);
  }

  /**
   * Actualiza un curso (local)
   */
  actualizarCurso(cursoActualizado: Curso): void {
    const cursos = this.obtenerCursos();
    const indice = cursos.findIndex((c) => c.id === cursoActualizado.id);
    if (indice !== -1) {
      cursoActualizado.fechaActualizacion = new Date();
      cursos[indice] = cursoActualizado;
      this.guardarCursosLocal(cursos);
    }
  }

  /**
   * Elimina un curso (local)
   */
  eliminarCurso(id: number): void {
    const cursos = this.obtenerCursos().filter((c) => c.id !== id);
    this.guardarCursosLocal(cursos);
  }

  /**
   * Obtiene cursos por instructor
   */
  obtenerCursosPorInstructor(emailInstructor: string): Curso[] {
    return this.obtenerCursos().filter((curso) => curso.instructor === emailInstructor);
  }

  /**
   * Obtiene un curso por ID
   */
  obtenerCursoPorId(id: number): Curso | undefined {
    return this.obtenerCursos().find((curso) => curso.id === id);
  }

  /**
   * Agrega archivo a un curso
   */
  agregarArchivoACurso(idCurso: number, nuevoArchivo: Archivo): void {
    const cursos = this.obtenerCursos();
    const curso = cursos.find((c) => c.id === idCurso);
    if (curso) {
      nuevoArchivo.id = this.generarIdArchivoUnico(curso.archivos);
      nuevoArchivo.fechaSubida = new Date();
      curso.archivos.push(nuevoArchivo);
      curso.fechaActualizacion = new Date();
      this.guardarCursosLocal(cursos);
    }
  }

  /**
   * Actualiza archivo en un curso
   */
  actualizarArchivoEnCurso(idCurso: number, archivoActualizada: Archivo): void {
    const cursos = this.obtenerCursos();
    const curso = cursos.find((c) => c.id === idCurso);
    if (curso) {
      const indice = curso.archivos.findIndex((d) => d.id === archivoActualizada.id);
      if (indice !== -1) {
        curso.archivos[indice] = archivoActualizada;
        curso.fechaActualizacion = new Date();
        this.guardarCursosLocal(cursos);
      }
    }
  }

  /**
   * Elimina archivo de un curso
   */
  eliminarArchivoDeCurso(idCurso: number, idArchivo: number): void {
    const cursos = this.obtenerCursos();
    const curso = cursos.find((c) => c.id === idCurso);
    if (curso) {
      curso.archivos = curso.archivos.filter((d) => d.id !== idArchivo);
      curso.fechaActualizacion = new Date();
      this.guardarCursosLocal(cursos);
    }
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
    return { valido: true, mensaje: '' };
  }

  /**
   * Genera ID único para cursos
   */
  private generarIdUnico(cursos: Curso[]): number {
    return cursos.length > 0 ? Math.max(...cursos.map((c) => c.id)) + 1 : 1;
  }

  /**
   * Genera ID único para archivos
   */
  private generarIdArchivoUnico(archivos: Archivo[]): number {
    return archivos.length > 0 ? Math.max(...archivos.map((d) => d.id)) + 1 : 1;
  }

  /**
   * Método para sincronizar cursos locales con backend
   */
  async sincronizarCursos(): Promise<void> {
    try {
      const cursosBackend = await this.obtenerTodosLosCursos();
      this.guardarCursosLocal(cursosBackend);
      console.log('Cursos sincronizados con backend:', cursosBackend.length);
    } catch (error) {
      console.error('Error al sincronizar cursos:', error);
    }
  }
}
