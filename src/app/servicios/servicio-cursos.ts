import { Injectable } from '@angular/core';

export interface Curso {
  id: number;
  titulo: string;
  descripcion: string;
  diapositivas: Diapositiva[];
  progreso: number;
  instructor: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  nivel: string;    
  duracion: number;  
}

export interface Diapositiva {
  id: number;
  titulo: string;
  archivo: string;
  tipo: 'pdf' | 'pptx';
  completada: boolean;
  archivoId?: string;
  fechaSubida: Date;
  tamano?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ServicioCursos {
  private readonly claveCursos = 'cursosAgropetech';

  constructor() {
    this.inicializarDatos();
  }

  private inicializarDatos(): void {
    if (!localStorage.getItem(this.claveCursos)) {
      const cursosIniciales: Curso[] = [
        {
          id: 1,
          titulo: 'Introduccion agroindustria pecuaria sostenible',
          descripcion: 'Conceptos básicos de agroindustria pecuaria sostenible y prácticas ecológicas.',
          nivel: 'Principiante',      
          duracion: 5,               
          diapositivas: [
            { 
              id: 1, 
              titulo: 'Introducción', 
              archivo: 'intro.pdf', 
              tipo: 'pdf', 
              completada: true,
              fechaSubida: new Date('2024-01-01')
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

  obtenerCursos(): Curso[] {
    const cursosAlmacenamiento = localStorage.getItem(this.claveCursos);
    if (!cursosAlmacenamiento) return [];
    
    const cursos = JSON.parse(cursosAlmacenamiento);

    return cursos.map((curso: any) => ({
      ...curso,
      fechaCreacion: new Date(curso.fechaCreacion),
      fechaActualizacion: new Date(curso.fechaActualizacion),
      diapositivas: curso.diapositivas.map((diapositiva: any) => ({
        ...diapositiva,
        fechaSubida: new Date(diapositiva.fechaSubida)
      }))
    }));
  }

  guardarCursos(cursos: Curso[]): void {
    try {
      localStorage.setItem(this.claveCursos, JSON.stringify(cursos));
    } catch (error) {
      console.error('Error al guardar cursos:', error);
      throw new Error('No fue posible guardar la información localmente.');
    }
  }

  agregarCurso(curso: Curso): void {
    const cursos = this.obtenerCursos();
    curso.id = this.generarIdUnico(cursos);
    curso.fechaCreacion = new Date();
    curso.fechaActualizacion = new Date();
    cursos.push(curso);
    this.guardarCursos(cursos);
  }

  actualizarCurso(cursoActualizado: Curso): void {
    const cursos = this.obtenerCursos();
    const indice = cursos.findIndex(c => c.id === cursoActualizado.id);
    if (indice !== -1) {
      cursoActualizado.fechaActualizacion = new Date();
      cursos[indice] = cursoActualizado;
      this.guardarCursos(cursos);
    }
  }

  eliminarCurso(id: number): void {
    const cursos = this.obtenerCursos().filter(c => c.id !== id);
    this.guardarCursos(cursos);
  }

  obtenerCursosPorInstructor(emailInstructor: string): Curso[] {
    return this.obtenerCursos().filter(curso => curso.instructor === emailInstructor);
  }

  obtenerCursoPorId(id: number): Curso | undefined {
    return this.obtenerCursos().find(curso => curso.id === id);
  }

  agregarDiapositivaACurso(idCurso: number, nuevaDiapositiva: Diapositiva): void {
    const cursos = this.obtenerCursos();
    const curso = cursos.find(c => c.id === idCurso);
    if (curso) {
      nuevaDiapositiva.id = this.generarIdDiapositivaUnico(curso.diapositivas);
      nuevaDiapositiva.fechaSubida = new Date();
      curso.diapositivas.push(nuevaDiapositiva);
      curso.fechaActualizacion = new Date();
      this.guardarCursos(cursos);
    }
  }

  actualizarDiapositivaEnCurso(idCurso: number, diapositivaActualizada: Diapositiva): void {
    const cursos = this.obtenerCursos();
    const curso = cursos.find(c => c.id === idCurso);
    if (curso) {
      const indice = curso.diapositivas.findIndex(d => d.id === diapositivaActualizada.id);
      if (indice !== -1) {
        curso.diapositivas[indice] = diapositivaActualizada;
        curso.fechaActualizacion = new Date();
        this.guardarCursos(cursos);
      }
    }
  }

  eliminarDiapositivaDeCurso(idCurso: number, idDiapositiva: number): void {
    const cursos = this.obtenerCursos();
    const curso = cursos.find(c => c.id === idCurso);
    if (curso) {
      curso.diapositivas = curso.diapositivas.filter(d => d.id !== idDiapositiva);
      curso.fechaActualizacion = new Date();
      this.guardarCursos(cursos);
    }
  }

  private generarIdUnico(cursos: Curso[]): number {
    return cursos.length > 0 ? Math.max(...cursos.map(c => c.id)) + 1 : 1;
  }

  private generarIdDiapositivaUnico(diapositivas: Diapositiva[]): number {
    return diapositivas.length > 0 ? Math.max(...diapositivas.map(d => d.id)) + 1 : 1;
  }
}
