import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ServicioUsuarios,  Usuario } from './servicios/servicio-usuarios';
@Injectable({
  providedIn: 'root'
})
export class ServicioAutorizacion {
  private readonly claveUsuarioActual = 'usuarioActual';
  
  // --- Estados reactivos ---
  private logueado = new BehaviorSubject<boolean>(this.estaLogueado());
  private usuarioActual$ = new BehaviorSubject<Usuario | null>(this.obtenerUsuarioActual());

  // --- Estado de sesión observable para el header ---
  private estadoSesion = new BehaviorSubject<boolean>(this.obtenerUsuarioActual() !== null);
  cambioEstado$ = this.estadoSesion.asObservable();

  constructor(private servicioUsuarios: ServicioUsuarios) {}


  /**
   * Valida las credenciales del usuario
   */
  validarCredenciales(email: string, password: string): Usuario | null {
    return this.servicioUsuarios.validarCredenciales(email, password);
  }

  /**
   * Inicia sesión con un usuario válido
   */
  iniciarSesion(usuario: Usuario): void {
    localStorage.setItem(this.claveUsuarioActual, JSON.stringify(usuario));
    this.logueado.next(true);
    this.usuarioActual$.next(usuario);

    // Emitir cambio de estado para el header
    this.estadoSesion.next(true);
  }

  /**
   * Cierra la sesión del usuario actual
   */
  cerrarSesion(): void {
    localStorage.removeItem(this.claveUsuarioActual);
    this.logueado.next(false);
    this.usuarioActual$.next(null);

    // Emitir cambio de estado para el header
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

  /**
   * Obtiene todos los usuarios (delegado a ServicioUsuarios)
   */
  obtenerTodosUsuarios(): Usuario[] {
    return this.servicioUsuarios.obtenerTodosUsuarios();
  }
}