
export interface Foro {
  Id: number;
  Titulo: string;
  Contenido: string;
  Autor: string;
  FechaHora: string;
  Replicas: number;
  UrlImagen?: string | null;
}
