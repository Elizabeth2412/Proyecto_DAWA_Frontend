import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Usuario {
  email: string;
  password: string;
  tipo: 'administrador' | 'instructor' | 'estudiante';
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServicioAutorizacion {
    // --- Usuarios del sistema ---
  private usuarios: Usuario[] = [
    { email: 'elizabeth@gmail.com', password: 'admin123', tipo: 'administrador', nombre: 'Elizabeth' },
    { email: 'leslie@gmail.com', password: 'instructor123', tipo: 'instructor', nombre: 'Leslie' },
    { email: 'joshua@hotmail.com', password: 'estudiante123', tipo: 'estudiante', nombre: 'Joshúa' }
  ];
  // --- Claves para almacenamiento ---
  private readonly claveUsuarioActual = 'usuarioActual';
  // --- Estados reactivos ---
  private logueado = new BehaviorSubject<boolean>(this.estaLogueado());
  private usuarioActual$ = new BehaviorSubject<Usuario | null>(this.obtenerUsuarioActual());

  // --- Estado de sesión observable para el header ---
  private estadoSesion = new BehaviorSubject<boolean>(this.obtenerUsuarioActual() !== null);
  cambioEstado$ = this.estadoSesion.asObservable();

  constructor() {}
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
}
