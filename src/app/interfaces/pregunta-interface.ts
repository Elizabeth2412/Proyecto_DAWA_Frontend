import { Opcion } from "./opcion-interface";

export interface Pregunta {
  id: number;
  evaluacionId: number | null;
  texto: string;
  estado: string | null;
  usuarioId: number | null;
  transaccion: string | null;
  opciones?: Opcion[]; 
}