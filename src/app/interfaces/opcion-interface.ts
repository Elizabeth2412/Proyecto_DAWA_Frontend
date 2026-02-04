export interface Opcion {
  id: number;
  preguntaId: number | null;
  texto: string;
  esCorrecta: boolean;
  estado: string | null;
  usuarioId: number | null;
  transaccion: string | null;
}