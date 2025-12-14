import { Injectable } from '@angular/core';

export interface Question {
  id: number;
  text: string;
  options: string[];
}

export interface Evaluacion {
  id: number;
  titulo: string;
  modulo: string;
  totalPreguntas: number;
  duracion: string;
  fechaCreacion: Date;
  estado: 'Activa' | 'Inactiva';
  preguntas?: Question[];
}

@Injectable({
  providedIn: 'root',
})
export class ServiceEvaluacion {
  
  evaluaciones: Evaluacion[] = [];

  constructor() {}

  /**
   * Carga las evaluaciones desde el localStorage o inicializa con datos predeterminados.
   * @returns Lista de evaluaciones.
   */
  cargarEvaluaciones(): Evaluacion[] {
    const data = localStorage.getItem('evaluaciones');
    if (data) {
      this.evaluaciones = JSON.parse(data);
    } else {
      this.evaluaciones = [
        {
          id: 1,
          titulo: 'Evaluación del Módulo 1',
          modulo: 'Módulo 1',
          totalPreguntas: 11,
          duracion: '15 minutos',
          fechaCreacion: new Date('2025-01-10'),
          estado: 'Activa'
        },
        {
          id: 2,
          titulo: 'Evaluación del Módulo 2',
          modulo: 'Módulo 2',
          totalPreguntas: 10,
          duracion: '20 minutos',
          fechaCreacion: new Date('2025-01-15'),
          estado: 'Activa'
        }
      ];
      this.guardarEnLocalStorage();
    }
    return this.evaluaciones;
  }


  /**
   * Guarda las evaluaciones en el localStorage.
   */
  guardarEnLocalStorage(): void {
    localStorage.setItem('evaluaciones', JSON.stringify(this.evaluaciones));
  }


  /**
   * Filtra las evaluaciones según el término de búsqueda y el estado.
   * @param terminoBusqueda  Término de búsqueda para filtrar por título o módulo.
   * @param filtroEstado  Estado de evaluación a filtrar ('Activa' o 'Inactiva').
   * @returns Lista de evaluaciones filtradas.
   */
  filtrarEvaluaciones(terminoBusqueda: string, filtroEstado: string): Evaluacion[] {
    return this.evaluaciones.filter(evaluacion => {
      const matchBusqueda = terminoBusqueda === '' ||
        evaluacion.titulo.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
        evaluacion.modulo.toLowerCase().includes(terminoBusqueda.toLowerCase());

      const matchEstado = filtroEstado === '' ||
        evaluacion.estado === filtroEstado;

      return matchBusqueda && matchEstado;
    });
  }

  /**
   * Crea una nueva evaluación.
   * @param evaluacion  Evaluación a crear.
   */
  crearEvaluacion(evaluacion: Evaluacion): void {
    const nuevoId = this.evaluaciones.length > 0
      ? Math.max(...this.evaluaciones.map(e => e.id)) + 1
      : 1;

    evaluacion.id = nuevoId;
    evaluacion.fechaCreacion = new Date();

    this.evaluaciones.push(evaluacion);
    this.guardarEnLocalStorage();
  }


  /**
   * Actualiza una evaluación existente.
   * @param evaluacion  Evaluación a actualizar.
   */
  actualizarEvaluacion(evaluacion: Evaluacion): void {
    const index = this.evaluaciones.findIndex(e => e.id === evaluacion.id);

    if (index !== -1) {
      this.evaluaciones[index] = evaluacion;
      this.guardarEnLocalStorage();
    }
  }

  /**
   * Elimina una evaluación existente.
   * @param id  ID de la evaluación a eliminar.
   * @returns true si se eliminó correctamente, false en caso contrario.
   */
  eliminarEvaluacion(id: number): boolean {
    const index = this.evaluaciones.findIndex(e => e.id === id);

    if (index !== -1) {
      this.evaluaciones.splice(index, 1);
      this.guardarEnLocalStorage();
      return true;
    }
    return false;
  }
}