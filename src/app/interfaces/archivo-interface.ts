
export interface Archivo {
  id: number;
  nombre: string;
  tipo: string;
  tamano: number;
  fechaSubida: Date;
  descripcion: string;
  usuario: string;
  estado: 'Disponible' | 'NoDisponible';
  archivoId?: string;
}
