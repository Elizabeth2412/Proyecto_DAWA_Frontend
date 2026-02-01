// src/app/autorizacion.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { ServicioUsuarios } from './servicios/servicio-usuarios';
import { Usuario } from './interfaces/usuario-interface';
@Injectable({
  providedIn: 'root'
})
export class ServicioAutorizacion {
  private readonly claveUsuarioActual = 'usuarioActual';
  private readonly claveToken = 'token';
  // --- Estados reactivos ---
  private logueado = new BehaviorSubject<boolean>(this.estaLogueado());
  private usuarioActual$ = new BehaviorSubject<Usuario | null>(this.obtenerUsuarioActual());
  // --- Estado de sesión observable para el header ---

  private estadoSesion = new BehaviorSubject<boolean>(this.obtenerUsuarioActual() !== null);
  cambioEstado$ = this.estadoSesion.asObservable();

  constructor(
    private servicioUsuarios: ServicioUsuarios,
    private router: Router
  ) {}
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
    this.estadoSesion.next(true);
    
    // Redirigir según tipo de usuario
    this.redirigirSegunTipo(usuario.tipo);
  }
    /**
   * Cierra la sesión del usuario actual
   */
  cerrarSesion(): void {
    localStorage.removeItem(this.claveUsuarioActual);
    localStorage.removeItem(this.claveToken);
    this.logueado.next(false);
    this.usuarioActual$.next(null);
    this.estadoSesion.next(false);
    this.router.navigate(['/login']);
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
  // Método de login con backend
 login(email: string, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Primero intentar con backend
      this.servicioUsuarios.loginBackend({ email, password }).subscribe({
        next: (response: any) => {
          if (response && response.Respuesta === 'Ok') {
            // Obtener datos del usuario desde backend
            this.servicioUsuarios.getUsuarioInfoBackend(email).subscribe({
              next: (userResponse: any) => {
                if (userResponse && userResponse.Data && userResponse.Data.length > 0) {
                  const usuarioBackend = userResponse.Data[0];
                  
                  // Convertir a interfaz Usuario local
                  const usuario: Usuario = {
                    email: usuarioBackend.Email || email,
                    password: password, // Guardar temporalmente
                    tipo: this.determinarTipoUsuario(usuarioBackend.Rol),
                    nombre: usuarioBackend.Nombre || '',
                    apellido: usuarioBackend.Apellido || '',
                    edad: usuarioBackend.Edad
                  };
                  
                  this.iniciarSesion(usuario);
                  resolve(true);
                } else {
                  // Si backend no retorna datos, usar validación local
                  this.loginLocal(email, password, resolve, reject);
                }
              },
              error: (error) => {
                // Fallback a validación local
                console.warn('Error al obtener info de backend, usando local:', error);
                this.loginLocal(email, password, resolve, reject);
              }
            });
          } else {
            // Fallback a validación local
            this.loginLocal(email, password, resolve, reject);
          }
        },
        error: (error) => {
          // Fallback a validación local si hay error de conexión
          console.warn('Error de conexión al backend, usando local:', error);
          this.loginLocal(email, password, resolve, reject);
        }
      });
    });
  }

  // Método de login local (fallback)
  private loginLocal(
    email: string, 
    password: string, 
    resolve: (value: boolean) => void, 
    reject: (reason?: any) => void
  ): void {
    const usuario = this.servicioUsuarios.validarCredenciales(email, password);
    if (usuario) {
      this.iniciarSesion(usuario);
      resolve(true);
    } else {
      reject('Credenciales incorrectas');
    }
  }

  // Determinar tipo de usuario desde el rol del backend
  private determinarTipoUsuario(rolBackend: string): 'administrador' | 'instructor' | 'estudiante' {
    switch (rolBackend?.toLowerCase()) {
      case 'admin':
      case 'administrador':
        return 'administrador';
      case 'instructor':
      case 'profesor':
        return 'instructor';
      default:
        return 'estudiante';
    }
  }


  private redirigirSegunTipo(tipo: string): void {
    switch (tipo) {
      case 'administrador':
        this.router.navigate(['/dashboard']);
        break;
      case 'instructor':
        this.router.navigate(['/instructor']);
        break;
      case 'estudiante':
        this.router.navigate(['/estudiante']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }


  // Registro con backend
  registrarUsuarioBackend(usuarioData: any): Observable<any> {
    return this.servicioUsuarios.registrarUsuarioBackend(usuarioData);
  }

  // Método de registro unificado
  registrarUsuario(usuarioData: any, usarBackend: boolean = true): Promise<any> {
    if (usarBackend) {
      return new Promise((resolve, reject) => {
        this.registrarUsuarioBackend(usuarioData).subscribe({
          next: (response) => resolve(response),
          error: (error) => reject(error)
        });
      });
    } else {
      // Registro local
      return new Promise((resolve, reject) => {
        const result = this.servicioUsuarios.registrarUsuario(usuarioData);
        if (result.exito) {
          resolve(result);
        } else {
          reject(result.mensaje);
        }
      });
    }
  }
}