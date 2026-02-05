
export interface Foro {
  id: number;
  titulo: string;
  contenido: string;
  autor: string;
  fechaHora: string;
  replicas: number;
  urlImagen?: string | null;
}
