import { Pregunta } from "./pregunta-interface";
import { Questions } from "./question-interface";
export interface Evaluacion {
  id: number;
  cursoId?: number;
  cursoName?: string;
  titulo: string;
  modulo: string;
  totalPreguntas: number;
  duracion: string;
  fechaCreacion: Date;
  estado: 'Activa' | 'Inactiva';
  preguntas?: Pregunta[];
}
