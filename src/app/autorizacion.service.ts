import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Usuario {
  email: string;
  password: string;
  tipo: 'administrador' | 'instructor' | 'estudiante';
  nombre: string;
  apellido?: string;
  edad?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ServicioAutorizacion {
    // --- Usuarios del sistema ---
  private usuarios: Usuario[] = [
    { email: 'elizabeth@gmail.com', password: 'admin123', tipo: 'administrador', nombre: 'Elizabeth' },
    { email: 'leslie@gmail.com', password: 'instructor123', tipo: 'instructor', nombre: 'Leslie' },
    { email: 'joshua@hotmail.com', password: 'estudiante123', tipo: 'estudiante', nombre: 'Joshúa' },
    { email: 'jonacas2000@outlook.com', password: '123456', tipo: 'estudiante', nombre: 'Jonathan' }
  ];
  // --- Claves para almacenamiento ---
  private readonly claveUsuarioActual = 'usuarioActual';
  private readonly claveUsuarios = 'usuarios';
  
  // --- Estados reactivos ---
  private logueado = new BehaviorSubject<boolean>(this.estaLogueado());
  private usuarioActual$ = new BehaviorSubject<Usuario | null>(this.obtenerUsuarioActual());

  // --- Estado de sesión observable para el header ---
  private estadoSesion = new BehaviorSubject<boolean>(this.obtenerUsuarioActual() !== null);
  cambioEstado$ = this.estadoSesion.asObservable();

  constructor() {
    this.cargarUsuariosDesdeStorage();
  }

  /**
   * Carga usuarios desde localStorage al iniciar
   */
  private cargarUsuariosDesdeStorage(): void {
    const usuariosGuardados = localStorage.getItem(this.claveUsuarios);
    if (usuariosGuardados) {
      this.usuarios = JSON.parse(usuariosGuardados);
    } else {
      // Guardar usuarios iniciales
      this.guardarUsuariosEnStorage();
    }
  }

  /**
   * Guarda usuarios en localStorage
   */
  private guardarUsuariosEnStorage(): void {
    localStorage.setItem(this.claveUsuarios, JSON.stringify(this.usuarios));
  }

  /**
   * Registra un nuevo usuario
   */
  registrarUsuario(nuevoUsuario: {
    nombre: string;
    apellido: string;
    edad: number;
    correo: string;
    password: string;
  }): { exito: boolean; mensaje: string } {
    // Validar si el correo ya existe
    const existeUsuario = this.usuarios.find(u => u.email === nuevoUsuario.correo);
    
    if (existeUsuario) {
      return {
        exito: false,
        mensaje: 'Este correo ya está registrado. Por favor usa otro o inicia sesión.'
      };
    }

    // Validar campos obligatorios
    if (!nuevoUsuario.nombre || !nuevoUsuario.correo || !nuevoUsuario.password) {
      return {
        exito: false,
        mensaje: 'Por favor completa todos los campos obligatorios.'
      };
    }

    // Crear nuevo usuario (por defecto será estudiante)
    const usuario: Usuario = {
      email: nuevoUsuario.correo,
      password: nuevoUsuario.password,
      tipo: 'estudiante',
      nombre: nuevoUsuario.nombre,
      apellido: nuevoUsuario.apellido,
      edad: nuevoUsuario.edad
    };

    // Agregar a la lista
    this.usuarios.push(usuario);
    
    // Guardar en localStorage
    this.guardarUsuariosEnStorage();

    return {
      exito: true,
      mensaje: '¡Registro exitoso! Ahora puedes iniciar sesión.'
    };
  }

  /**
   * Valida las credenciales del usuario
   */
  validarCredenciales(email: string, password: string): Usuario | null {
    return this.usuarios.find(u => u.email === email && u.password === password) || null;
  }
  /**
   * Inicia sesión con un usuario válido
   */
  iniciarSesion(usuario: Usuario): void {
    localStorage.setItem(this.claveUsuarioActual, JSON.stringify(usuario));
    this.logueado.next(true);
    this.usuarioActual$.next(usuario);

    // . Emitir cambio de estado para el header
    this.estadoSesion.next(true);
  }
  /**
   * Cierra la sesión del usuario actual
   */
  cerrarSesion(): void {
    localStorage.removeItem(this.claveUsuarioActual);
    this.logueado.next(false);
    this.usuarioActual$.next(null);

    // . Emitir cambio de estado para el header
    this.estadoSesion.next(false);
  }
  /**
   * Verifica si hay un usuario logueado
   */
  estaLogueado(): boolean {
    return localStorage.getItem(this.claveUsuarioActual) !== null;
  }
  /**
   * Obtiene el usuario actual desde localStorage
   */
  obtenerUsuarioActual(): Usuario | null {
    const usuarioAlmacenamiento = localStorage.getItem(this.claveUsuarioActual);
    return usuarioAlmacenamiento ? JSON.parse(usuarioAlmacenamiento) : null;
  }
  /**
   * Obtiene el tipo de usuario actual
   */
  obtenerTipoUsuario(): string | null {
    const usuario = this.obtenerUsuarioActual();
    return usuario ? usuario.tipo : null;
  }
  /**
   * Observable del estado de logueado
   */
  obtenerObservableLogueado(): Observable<boolean> {
    return this.logueado.asObservable();
  }
  /**
   * Observable del usuario actual
   */
  obtenerObservableUsuarioActual(): Observable<Usuario | null> {
    return this.usuarioActual$.asObservable();
  }

  obtenerTodosUsuarios(): Usuario[] {
  return [...this.usuarios]; // Retorna una copia
}

/**
 * Actualiza un usuario existente
 */
actualizarUsuario(email: string, usuarioActualizado: Usuario): { exito: boolean; mensaje: string } {
  const index = this.usuarios.findIndex(u => u.email === email);
  
  if (index === -1) {
    return {
      exito: false,
      mensaje: 'Usuario no encontrado.'
    };
  }

  // Actualizar usuario manteniendo el email original
  this.usuarios[index] = {
    ...usuarioActualizado,
    email: email // El email no cambia
  };

  // Guardar cambios
  this.guardarUsuariosEnStorage();

  return {
    exito: true,
    mensaje: 'Usuario actualizado correctamente.'
  };
}

/**
 * Elimina un usuario del sistema
 */
eliminarUsuario(email: string): { exito: boolean; mensaje: string } {
  const index = this.usuarios.findIndex(u => u.email === email);
  
  if (index === -1) {
    return {
      exito: false,
      mensaje: 'Usuario no encontrado.'
    };
  }

  // No permitir eliminar el usuario actual
  const usuarioActual = this.obtenerUsuarioActual();
  if (usuarioActual && usuarioActual.email === email) {
    return {
      exito: false,
      mensaje: 'No puedes eliminar tu propia cuenta mientras estás conectado.'
    };
  }

  // Eliminar usuario
  this.usuarios.splice(index, 1);

  // Guardar cambios
  this.guardarUsuariosEnStorage();

  return {
    exito: true,
    mensaje: 'Usuario eliminado correctamente.'
  };
}
}