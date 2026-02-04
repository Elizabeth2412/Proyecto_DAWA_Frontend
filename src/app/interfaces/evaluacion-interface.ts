import { Questions } from "./question-interface";
export interface Evaluacion {
  id: number;
  cursoId?: number;
  titulo: string;
  modulo: string;
  totalPreguntas: number;
  duracion: string;
  fechaCreacion: Date;
  estado: 'Activa' | 'Inactiva';
  preguntas?: Questions[];
}
