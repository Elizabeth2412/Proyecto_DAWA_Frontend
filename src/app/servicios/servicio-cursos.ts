import { Injectable } from '@angular/core';
import { Archivo } from './servicio-archivos';

export interface Curso {
  id: number;
  titulo: string;
  descripcion: string;
  archivos: Archivo[];
  progreso: number;
  instructor: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  nivel: string;    
  duracion: number;  
}

@Injectable({
  providedIn: 'root'
})
export class ServicioCursos {
  private readonly claveCursos = 'cursosAgropetech';

  constructor() {
    this.inicializarDatos();
  }

  /**
   * Inicializa los datos de cursos en el almacenamiento local si no existen
   */
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
          fechaActualizacion: new Date('2024-01-01')
        }
      ];
      this.guardarCursos(cursosIniciales);
    }
  }

  /**
   * Obtiene todos los cursos almacenados
   * @returns la lista de cursos
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
          fechaSubida: new Date(archivo.fechaSubida)
        }))
      : []
    }));
  }


 /**
  * Guarda la lista de cursos en el almacenamiento local
  * @param cursos lista de cursos a guardar
  */
  private guardarCursos(cursos: Curso[]): void {
    try {
      localStorage.setItem(this.claveCursos, JSON.stringify(cursos));
    } catch (error) {
      console.error('Error al guardar cursos:', error);
      throw new Error('No fue posible guardar la información localmente.');
    }
  }


  /**
   * Agrega un nuevo curso
   * @param curso curso a agregar
   */
  agregarCurso(curso: Curso): void {
    const cursos = this.obtenerCursos();
    curso.id = this.generarIdUnico(cursos);
    curso.fechaCreacion = new Date();
    curso.fechaActualizacion = new Date();
    cursos.push(curso);
    this.guardarCursos(cursos);
  }

  /**
   * Actualiza un curso existente
   * @param cursoActualizado 
   */
  actualizarCurso(cursoActualizado: Curso): void {
    const cursos = this.obtenerCursos();
    const indice = cursos.findIndex(c => c.id === cursoActualizado.id);
    if (indice !== -1) {
      cursoActualizado.fechaActualizacion = new Date();
      cursos[indice] = cursoActualizado;
      this.guardarCursos(cursos);
    }
  }


  /**
   * Elimina un curso por su ID
   */
  eliminarCurso(id: number): void {
    const cursos = this.obtenerCursos().filter(c => c.id !== id);
    this.guardarCursos(cursos);
  }


  /**
   * Obtiene los cursos asociados a un instructor específico
   * @param emailInstructor email del instructor
   * @returns lista de cursos del instructor
   */
  obtenerCursosPorInstructor(emailInstructor: string): Curso[] {
    return this.obtenerCursos().filter(curso => curso.instructor === emailInstructor);
  }


  /**
   * Obtiene un curso por su ID
   * @param id ID del curso
   * @returns curso encontrado o undefined
   */
  obtenerCursoPorId(id: number): Curso | undefined {
    return this.obtenerCursos().find(curso => curso.id === id);
  }


  /**
   * Agrega un archivo a un curso específico
   * @param idCurso ID del curso al que se agregará el archivo
   * @param nuevoArchivo archivo a agregar
   */
  agregarArchivoACurso(idCurso: number, nuevoArchivo: Archivo): void {
    const cursos = this.obtenerCursos();
    const curso = cursos.find(c => c.id === idCurso);
    if (curso) {
      nuevoArchivo.id = this.generarIdArchivoUnico(curso.archivos);
      nuevoArchivo.fechaSubida = new Date();
      curso.archivos.push(nuevoArchivo);
      curso.fechaActualizacion = new Date();
      this.guardarCursos(cursos);
    }
  }


  /**
   * Actualiza un archivo en un curso específico
   * @param idCurso   ID del curso
   * @param archivoActualizada  archivo actualizado
   */
  actualizarArchivoEnCurso(idCurso: number, archivoActualizada: Archivo): void {
    const cursos = this.obtenerCursos();
    const curso = cursos.find(c => c.id === idCurso);
    if (curso) {
      const indice = curso.archivos.findIndex(d => d.id === archivoActualizada.id);
      if (indice !== -1) {
        curso.archivos[indice] = archivoActualizada;
        curso.fechaActualizacion = new Date();
        this.guardarCursos(cursos);
      }
    }
  }


  /**
   * Elimina un archivo de un curso específico
   * @param idCurso ID del curso
   * @param idArchivo ID del archivo a eliminar
   */
  eliminarArchivoDeCurso(idCurso: number, idArchivo: number): void {
    const cursos = this.obtenerCursos();
    const curso = cursos.find(c => c.id === idCurso);
    if (curso) {
      curso.archivos = curso.archivos.filter(d => d.id !== idArchivo);
      curso.fechaActualizacion = new Date();
      this.guardarCursos(cursos);
    }
  }

  // Métodos para gestión de cursos desde el dashboard

  /**
   * Prepara un curso para edición
   * @param curso curso a editar
   * @returns curso listo para edición
   */
  prepararEdicionCurso(curso: Curso): Curso {
    const cursoEditando = { ...curso };
    if (!cursoEditando.nivel) cursoEditando.nivel = 'Principiante';
    if (!cursoEditando.duracion) cursoEditando.duracion = 1;
    return cursoEditando;
  }


  /**
   * Valida un curso antes de guardarlo
   * @param curso curso a validar
   * @returns objeto con la validación y mensaje
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
   * Genera un ID único para un nuevo curso
   * @param cursos lista de cursos existentes
   * @returns ID único para el nuevo curso
   */
  private generarIdUnico(cursos: Curso[]): number {
    return cursos.length > 0 ? Math.max(...cursos.map(c => c.id)) + 1 : 1;
  }


  /**
   * Genera un ID único para un nuevo archivo dentro de un curso
   * @param archivos  lista de archivos existentes en el curso
   * @returns ID único para el nuevo archivo
   */
  private generarIdArchivoUnico(archivos: Archivo[]): number {
    return archivos.length > 0 ? Math.max(...archivos.map(d => d.id)) + 1 : 1;
  }
}