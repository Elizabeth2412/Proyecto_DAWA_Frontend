//src/app/interfaces/usuario-interface.ts

export interface Usuario {
  email: string;
  password: string;
  tipo: 'administrador' | 'instructor' | 'estudiante';
  nombre: string;
  apellido?: string;
  edad?: number;
}
