import { Archivo } from "./archivo-interface";
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
