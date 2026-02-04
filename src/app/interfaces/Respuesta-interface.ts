export interface Resultado<T = any> {
  respuesta: string;
  leyenda: string;
  data?: T[];
}